import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { distanceKm, getRoadDistanceKm, estimateFare, VehicleType, RideType, VEHICLE_CATEGORY_MAP, CITY_COORDS } from "../services/fare";

export const ridesRouter = Router();

const VEHICLE_TYPE_ENUM = z.enum([
  // CAR
  "HATCHBACK", "SEDAN", "SUV", "LUXURY",
  // BIKE
  "BIKE", "ELECTRIC_BIKE",
  // AUTO
  "AUTO", "E_RICKSHAW",
  // GOODS
  "PICKUP_TRUCK", "MINI_TRUCK", "TEMPO", "TRUCK",
  // HEAVY
  "JCB", "TRACTOR", "CRANE", "TIPPER",
]);

const searchSchema = z.object({
  pickupText: z.string(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropText: z.string(),
  dropLat: z.number(),
  dropLng: z.number(),
  vehicleType: VEHICLE_TYPE_ENUM,
  rideType: z.enum(["LOCAL", "OUTSTATION", "AIRPORT", "HOURLY"]),
  unionId: z.string().optional(),
});

/**
 * POST /rides/search
 * Returns the trip distance/fare estimate plus the nearest available,
 * verified drivers matching the requested vehicle type — this powers the
 * results screen before the customer confirms a booking.
 */
ridesRouter.post("/search", async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const q = parsed.data;
  const tripKm = await getRoadDistanceKm(q.pickupLat, q.pickupLng, q.dropLat, q.dropLng);

  // Maximum pickup radius in km (drivers must be near the pickup location)
  const MAX_PICKUP_RADIUS_KM = 50;
  const vehicleCategory = VEHICLE_CATEGORY_MAP[q.vehicleType as VehicleType];

  let querySql = `
    SELECT dp.id, dp.city, dp.district, dp.tehsil, dp.vehicle_type, dp.vehicle_category,
           dp.vehicle_number, dp.rating_avg, dp.rate_per_km, dp.hourly_rate,
           dp.current_lat, dp.current_lng, dp.vehicle_make, dp.vehicle_model,
           dp.avatar_photo, dp.total_reviews, dp.load_capacity, dp.union_id, dp.union_name,
           u.name
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE dp.is_online = 1
      AND dp.is_verified = 1
      AND (dp.vehicle_type = ? OR dp.vehicle_category = ?)
      AND dp.id NOT IN (
        SELECT DISTINCT driver_id
        FROM rides
        WHERE driver_id IS NOT NULL
          AND status IN ('CONFIRMED', 'DRIVER_ASSIGNED', 'ARRIVED', 'ONGOING')
      )
  `;
  const queryParams: any[] = [q.vehicleType, vehicleCategory];

  if (q.unionId && q.unionId !== "ALL") {
    querySql += ` AND (dp.union_id = ? OR dp.district IN (SELECT district FROM unions WHERE id = ? OR short_code = ?))`;
    queryParams.push(q.unionId, q.unionId, q.unionId);
  }

  let drivers = db.prepare(querySql).all(...queryParams) as any[];

  // If union filter returned zero drivers, fallback to all available matching drivers
  if (drivers.length === 0 && q.unionId && q.unionId !== "ALL") {
    drivers = db.prepare(`
      SELECT dp.id, dp.city, dp.district, dp.tehsil, dp.vehicle_type, dp.vehicle_category,
             dp.vehicle_number, dp.rating_avg, dp.rate_per_km, dp.hourly_rate,
             dp.current_lat, dp.current_lng, dp.vehicle_make, dp.vehicle_model,
             dp.avatar_photo, dp.total_reviews, dp.load_capacity, dp.union_id, dp.union_name,
             u.name
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.is_online = 1
        AND dp.is_verified = 1
        AND (dp.vehicle_type = ? OR dp.vehicle_category = ?)
        AND dp.id NOT IN (
          SELECT DISTINCT driver_id
          FROM rides
          WHERE driver_id IS NOT NULL
            AND status IN ('CONFIRMED', 'DRIVER_ASSIGNED', 'ARRIVED', 'ONGOING')
        )
    `).all(q.vehicleType, vehicleCategory) as any[];
  }

  const results = drivers
    .map((d) => {
      const driverCoords = CITY_COORDS[d.city];
      const driverLat = (d.current_lat && d.current_lat !== 0) ? d.current_lat : (driverCoords?.lat || q.pickupLat);
      const driverLng = (d.current_lng && d.current_lng !== 0) ? d.current_lng : (driverCoords?.lng || q.pickupLng);

      const pickupDistanceKm = distanceKm(
        q.pickupLat,
        q.pickupLng,
        driverLat,
        driverLng
      );
      const fare = estimateFare(
        tripKm,
        q.vehicleType as VehicleType,
        q.rideType as RideType,
        d.rate_per_km
      );
      const etaMinutes = Math.max(2, Math.round(pickupDistanceKm * 2.5));
      return {
        driverId: d.id,
        driverName: d.name,
        city: d.city,
        vehicleType: d.vehicle_type,
        vehicleNumber: d.vehicle_number,
        vehicleMake: d.vehicle_make,
        vehicleModel: d.vehicle_model,
        avatarPhoto: d.avatar_photo,
        ratingAvg: d.rating_avg,
        totalReviews: d.total_reviews,
        ratePerKm: d.rate_per_km,
        loadCapacity: d.load_capacity,
        unionId: d.union_id,
        unionName: d.union_name,
        pickupDistanceKm: Math.round(pickupDistanceKm * 10) / 10,
        fare,
        etaMinutes,
      };
    })
    .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm)
    .slice(0, 10);

  return res.json({
    tripDistanceKm: tripKm,
    baseFareEstimate: estimateFare(tripKm, q.vehicleType as VehicleType, q.rideType as RideType),
    drivers: results,
  });
});

const bookSchema = searchSchema.extend({
  driverId: z.string().optional(),
  unionId: z.string().optional(),
  unionName: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * POST /rides
 * Creates a booking. If a driverId is supplied (customer picked one from the
 * search results) the ride goes straight to DRIVER_ASSIGNED; otherwise it's
 * left SEARCHING for the dispatch/matching flow to pick up.
 */
ridesRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const b = parsed.data;
  const tripKm = await getRoadDistanceKm(b.pickupLat, b.pickupLng, b.dropLat, b.dropLng);

  let driverRate: number | undefined;
  let unionIdToSave = b.unionId && b.unionId !== "ALL" ? b.unionId : null;
  let unionNameToSave = b.unionName || null;

  const status = "SEARCHING";
  if (b.driverId) {
    const driver = db
      .prepare("SELECT * FROM driver_profiles WHERE id = ?")
      .get(b.driverId) as any;
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    driverRate = driver.rate_per_km;
    if (!unionIdToSave && driver.union_id) {
      unionIdToSave = driver.union_id;
      unionNameToSave = driver.union_name || unionNameToSave;
    }
  }

  // If unionId is given without unionName, lookup union name
  if (unionIdToSave && !unionNameToSave) {
    const unionRecord = db.prepare("SELECT name FROM unions WHERE id = ? OR short_code = ?").get(unionIdToSave, unionIdToSave) as any;
    if (unionRecord) {
      unionNameToSave = unionRecord.name;
    }
  }

  const fare = estimateFare(tripKm, b.vehicleType as VehicleType, b.rideType as RideType, driverRate);
  const id = nanoid();
  const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const vehicleCategory = VEHICLE_CATEGORY_MAP[b.vehicleType as VehicleType] ?? "CAR";

  db.prepare(
    `INSERT INTO rides
      (id, customer_id, driver_id, union_id, union_name, ride_type, vehicle_type, vehicle_category,
       pickup_text, pickup_lat, pickup_lng,
       drop_text, drop_lat, drop_lng, scheduled_at, distance_km, estimated_fare, status, start_otp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    b.driverId || null,
    unionIdToSave,
    unionNameToSave,
    b.rideType,
    b.vehicleType,
    vehicleCategory,
    b.pickupText,
    b.pickupLat,
    b.pickupLng,
    b.dropText,
    b.dropLat,
    b.dropLng,
    b.scheduledAt || null,
    tripKm,
    fare,
    status,
    startOtp
  );

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(id);
  return res.status(201).json(ride);
});

/**
 * GET /rides/:id/public-track
 * Publicly accessible endpoint (no auth required) for family/friends
 * to monitor a shared live trip for safety and location tracking.
 */
ridesRouter.get("/:id/public-track", (req, res) => {
  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Trip not found or expired" });

  let driverInfo: any = null;
  if (ride.driver_id) {
    const dProf = db.prepare("SELECT * FROM driver_profiles WHERE id = ?").get(ride.driver_id) as any;
    if (dProf) {
      const dUser = db.prepare("SELECT name, phone FROM users WHERE id = ?").get(dProf.user_id) as any;
      driverInfo = {
        id: dProf.id,
        name: dUser?.name || "Verified Driver",
        phone: dUser?.phone ? dUser.phone.slice(0, 3) + "****" + dUser.phone.slice(-3) : "",
        city: dProf.city,
        vehicle_type: dProf.vehicle_type,
        vehicle_number: dProf.vehicle_number,
        rating_avg: dProf.rating_avg,
        vehicle_make: dProf.vehicle_make,
        vehicle_model: dProf.vehicle_model,
        avatar_photo: dProf.avatar_photo,
        current_lat: dProf.current_lat,
        current_lng: dProf.current_lng,
      };
    }
  }

  // Sanitize public payload (no sensitive OTP or private billing info)
  return res.json({
    id: ride.id,
    status: ride.status,
    pickup_text: ride.pickup_text,
    pickup_lat: ride.pickup_lat,
    pickup_lng: ride.pickup_lng,
    drop_text: ride.drop_text,
    drop_lat: ride.drop_lat,
    drop_lng: ride.drop_lng,
    distance_km: ride.distance_km,
    vehicle_type: ride.vehicle_type,
    ride_type: ride.ride_type,
    driver: driverInfo,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  });
});

/** GET /rides/:id — trip status/tracking screen polls this. */
ridesRouter.get("/:id", requireAuth, (req: AuthedRequest, res) => {
  let ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.customer_id !== req.userId) {
    return res.status(403).json({ error: "Not your ride" });
  }

  // Ensure start_otp exists
  if (!ride.start_otp) {
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    db.prepare("UPDATE rides SET start_otp = ? WHERE id = ?").run(newOtp, ride.id);
    ride.start_otp = newOtp;
  }

  // Fetch driver profile details if assigned
  let driverInfo: any = null;
  if (ride.driver_id) {
    const dProf = db.prepare("SELECT * FROM driver_profiles WHERE id = ?").get(ride.driver_id) as any;
    if (dProf) {
      const dUser = db.prepare("SELECT name, phone FROM users WHERE id = ?").get(dProf.user_id) as any;
      driverInfo = {
        id: dProf.id,
        name: dUser?.name || "Verified Driver",
        phone: dUser?.phone || "",
        city: dProf.city,
        vehicle_type: dProf.vehicle_type,
        vehicle_number: dProf.vehicle_number,
        rating_avg: dProf.rating_avg,
        total_reviews: dProf.total_reviews || 0,
        vehicle_make: dProf.vehicle_make,
        vehicle_model: dProf.vehicle_model,
        avatar_photo: dProf.avatar_photo,
      };
    }
  }

  // Fetch existing review if submitted
  const review = db.prepare("SELECT * FROM driver_reviews WHERE ride_id = ?").get(ride.id) as any;

  return res.json({
    ...ride,
    driver: driverInfo,
    review: review
      ? {
          ...review,
          tags: JSON.parse(review.tags_json || "[]"),
        }
      : null,
  });
});

/** POST /rides/:id/rate — customer rates driver after trip completion */
const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  tipAmount: z.number().min(0).optional(),
});

ridesRouter.post("/:id/rate", requireAuth, (req: AuthedRequest, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.customer_id !== req.userId) {
    return res.status(403).json({ error: "Not authorized to rate this ride" });
  }
  if (!ride.driver_id) {
    return res.status(400).json({ error: "No driver was assigned to this ride" });
  }

  const customer = db.prepare("SELECT name FROM users WHERE id = ?").get(req.userId) as any;
  const customerName = customer?.name || "Customer";

  const { rating, comment, tags = [], tipAmount = 0 } = parsed.data;

  // Check if already rated
  const existing = db.prepare("SELECT id FROM driver_reviews WHERE ride_id = ?").get(ride.id) as any;
  const reviewId = existing?.id || nanoid();

  if (existing) {
    db.prepare(`
      UPDATE driver_reviews
      SET rating = ?, comment = ?, tags_json = ?, tip_amount = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(rating, comment || null, JSON.stringify(tags), tipAmount, reviewId);
  } else {
    db.prepare(`
      INSERT INTO driver_reviews (id, ride_id, driver_id, customer_id, customer_name, rating, comment, tags_json, tip_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      ride.id,
      ride.driver_id,
      req.userId,
      customerName,
      rating,
      comment || null,
      JSON.stringify(tags),
      tipAmount
    );
  }

  // Recalculate driver's rating_avg and total_reviews
  const stats = db
    .prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM driver_reviews WHERE driver_id = ?")
    .get(ride.driver_id) as any;

  const newRatingAvg = stats && stats.count > 0 ? Math.round(stats.avg_rating * 10) / 10 : rating;
  const totalReviews = stats?.count || 1;

  db.prepare("UPDATE driver_profiles SET rating_avg = ?, total_reviews = ? WHERE id = ?").run(
    newRatingAvg,
    totalReviews,
    ride.driver_id
  );

  return res.json({
    ok: true,
    message: "Thank you! Driver rating submitted successfully.",
    newRatingAvg,
    totalReviews,
    review: {
      id: reviewId,
      rating,
      comment,
      tags,
      tipAmount,
      customerName,
    },
  });
});

/** GET /rides — a customer's own booking history. */
ridesRouter.get("/", requireAuth, (req: AuthedRequest, res) => {
  const rides = db
    .prepare("SELECT * FROM rides WHERE customer_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  return res.json(rides);
});

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "DRIVER_ASSIGNED", "ARRIVED", "ONGOING", "COMPLETED", "CANCELLED"]),
});

/**
 * PATCH /rides/:id/status — advances the trip through its lifecycle.
 */
ridesRouter.patch("/:id/status", requireAuth, (req: AuthedRequest, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.customer_id !== req.userId) return res.status(403).json({ error: "Not your ride" });

  db.prepare("UPDATE rides SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    parsed.data.status,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id);
  return res.json(updated);
});

/**
 * GET /rides/:id/messages — returns all chat messages for a ride.
 */
ridesRouter.get("/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const messages = db
    .prepare("SELECT * FROM ride_messages WHERE ride_id = ? ORDER BY created_at ASC")
    .all(req.params.id) as any[];

  return res.json(messages);
});

const messageSchema = z.object({
  text: z.string().min(1).max(1000),
});

/**
 * POST /rides/:id/messages — sends a new chat message.
 */
ridesRouter.post("/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Message text is required" });

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const user = db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) return res.status(401).json({ error: "User not found" });

  const isCustomer = ride.customer_id === req.userId;
  let isDriver = false;
  if (ride.driver_id) {
    const driverProfile = db.prepare("SELECT user_id FROM driver_profiles WHERE id = ?").get(ride.driver_id) as any;
    if (driverProfile && driverProfile.user_id === req.userId) {
      isDriver = true;
    }
  }

  const senderRole = isCustomer ? "CUSTOMER" : (isDriver || user.role === "DRIVER" ? "DRIVER" : "CUSTOMER");
  const senderName = user.name || (senderRole === "DRIVER" ? "Driver" : "Passenger");
  const msgId = nanoid();

  db.prepare(`
    INSERT INTO ride_messages (id, ride_id, sender_id, sender_role, sender_name, text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msgId, req.params.id, req.userId, senderRole, senderName, parsed.data.text.trim());

  const createdMsg = db.prepare("SELECT * FROM ride_messages WHERE id = ?").get(msgId);
  return res.json(createdMsg);
});
