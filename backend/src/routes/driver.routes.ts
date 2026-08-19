import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const driverRouter = Router();

/**
 * GET /driver/profile
 * Returns the logged-in driver's profile + user info.
 */
driverRouter.get("/profile", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver account" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Driver profile not found" });

  return res.json({
    ...profile,
    name:  user.name,
    phone: user.phone,
  });
});

/**
 * GET /driver/reviews
 * Returns customer reviews and ratings summary for the logged-in driver.
 */
driverRouter.get("/reviews", requireAuth, (req: AuthedRequest, res) => {
  const profile = db.prepare("SELECT id, rating_avg, total_reviews FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Driver profile not found" });

  const rawReviews = db
    .prepare("SELECT * FROM driver_reviews WHERE driver_id = ? ORDER BY created_at DESC")
    .all(profile.id) as any[];

  const reviews = rawReviews.map(r => ({
    ...r,
    tags: JSON.parse(r.tags_json || "[]")
  }));

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
  });

  return res.json({
    rating_avg: profile.rating_avg,
    total_reviews: profile.total_reviews || reviews.length,
    breakdown,
    reviews,
  });
});

/**
 * GET /driver/:id/public-reviews
 * Public endpoint for any customer to view driver ratings and comments.
 */
driverRouter.get("/:id/public-reviews", (req, res) => {
  const profile = db.prepare("SELECT id, city, vehicle_type, vehicle_number, rating_avg, total_reviews, avatar_photo FROM driver_profiles WHERE id = ?").get(req.params.id) as any;
  if (!profile) return res.status(404).json({ error: "Driver profile not found" });

  const rawReviews = db
    .prepare("SELECT customer_name, rating, comment, tags_json, created_at FROM driver_reviews WHERE driver_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(profile.id) as any[];

  const reviews = rawReviews.map(r => ({
    ...r,
    tags: JSON.parse(r.tags_json || "[]")
  }));

  return res.json({
    driver: profile,
    rating_avg: profile.rating_avg,
    total_reviews: profile.total_reviews || reviews.length,
    reviews,
  });
});

/**
 * GET /driver/:id/public-profile
 * Public endpoint for customer to view complete driver profile, ratings, vehicle details, verifications and reviews.
 */
driverRouter.get("/:id/public-profile", (req, res) => {
  const profile = db.prepare(`
    SELECT dp.*, u.name as driver_name, u.phone as driver_phone, u.created_at as member_since
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE dp.id = ?
  `).get(req.params.id) as any;

  if (!profile) return res.status(404).json({ error: "Driver profile not found" });

  const completedRides = db.prepare(
    "SELECT COUNT(*) as count FROM rides WHERE driver_id = ? AND status = 'COMPLETED'"
  ).get(profile.id) as { count: number };

  const rawReviews = db
    .prepare("SELECT id, customer_name, rating, comment, tags_json, created_at FROM driver_reviews WHERE driver_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(profile.id) as any[];

  const reviews = rawReviews.map(r => ({
    id: r.id,
    customer_name: r.customer_name || "Customer",
    rating: r.rating,
    comment: r.comment,
    tags: JSON.parse(r.tags_json || "[]"),
    created_at: r.created_at,
  }));

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const allRatings = db.prepare("SELECT rating FROM driver_reviews WHERE driver_id = ?").all(profile.id) as any[];
  allRatings.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
  });

  let vehiclePhotos = [];
  try {
    vehiclePhotos = JSON.parse(profile.vehicle_photos || "[]");
  } catch {
    vehiclePhotos = [];
  }

  return res.json({
    id: profile.id,
    driverName: profile.driver_name || "Driver",
    city: profile.city,
    district: profile.district,
    tehsil: profile.tehsil,
    village: profile.village,
    standName: profile.stand_name,
    vehicleType: profile.vehicle_type,
    vehicleNumber: profile.vehicle_number,
    vehicleMake: profile.vehicle_make,
    vehicleModel: profile.vehicle_model,
    vehicleYear: profile.vehicle_year,
    seats: profile.seats || 4,
    fuelType: profile.fuel_type || "Petrol",
    acAvailable: profile.ac_available === 1,
    avatarPhoto: profile.avatar_photo,
    vehiclePhotos,
    experience: profile.experience || "Experienced Hill Driver",
    permitZones: profile.permit_zones || "Himachal Pradesh & North India",
    isVerified: profile.is_verified === 1,
    rcVerified: Boolean(profile.rc_photo || profile.vehicle_number),
    licenseVerified: Boolean(profile.license_photo || profile.license_number),
    aadharVerified: Boolean(profile.aadhar_photo),
    ratingAvg: profile.rating_avg || 5.0,
    totalReviews: profile.total_reviews || allRatings.length,
    completedTrips: completedRides?.count || 0,
    memberSince: profile.member_since,
    breakdown,
    reviews,
  });
});

/**
 * PATCH /driver/profile
 * Updates the logged-in driver's personal, vehicle, location, documents, and payout details.
 */
driverRouter.patch("/profile", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({
    // Personal Details
    name:              z.string().min(2).optional(),
    email:             z.string().optional().nullable(),
    alt_phone:         z.string().optional().nullable(),
    emergency_contact: z.string().optional().nullable(),
    license_number:    z.string().optional().nullable(),
    experience:        z.string().optional().nullable(),
    // Location Details
    city:              z.string().optional(),
    district:          z.string().optional().nullable(),
    tehsil:            z.string().optional().nullable(),
    village:           z.string().optional().nullable(),
    stand_name:        z.string().optional().nullable(),
    permit_zones:      z.string().optional().nullable(),
    // Vehicle Details
    vehicle_type:      z.enum(["HATCHBACK", "SEDAN", "SUV", "LUXURY"]).optional(),
    vehicle_number:    z.string().min(4).optional(),
    vehicle_make:      z.string().optional().nullable(),
    vehicle_model:     z.string().optional().nullable(),
    vehicle_year:      z.number().int().optional().nullable(),
    seats:             z.number().int().min(2).max(12).optional(),
    rate_per_km:       z.number().min(10).max(100).optional(),
    fuel_type:         z.string().optional().nullable(),
    ac_available:      z.union([z.boolean(), z.number()]).optional(),
    // Documents & Photos
    rc_photo:          z.string().optional().nullable(),
    aadhar_photo:      z.string().optional().nullable(),
    license_photo:     z.string().optional().nullable(),
    avatar_photo:      z.string().optional().nullable(),
    vehicle_photos:    z.union([z.string(), z.array(z.string())]).optional().nullable(),
    insurance_expiry:  z.string().optional().nullable(),
    // Bank & Payout
    upi_id:            z.string().optional().nullable(),
    bank_account:      z.string().optional().nullable(),
    bank_ifsc:         z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver account" });

  const data = parsed.data;

  // Update user table if name provided
  if (data.name) {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(data.name, req.userId);
  }

  // Update driver_profiles
  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Driver profile not found" });

  const acVal = data.ac_available !== undefined
    ? (typeof data.ac_available === "boolean" ? (data.ac_available ? 1 : 0) : data.ac_available)
    : profile.ac_available;

  const vehiclePhotosJson = data.vehicle_photos !== undefined
    ? (typeof data.vehicle_photos === "string" ? data.vehicle_photos : JSON.stringify(data.vehicle_photos || []))
    : profile.vehicle_photos;

  db.prepare(`
    UPDATE driver_profiles
    SET city = COALESCE(?, city),
        district = COALESCE(?, district),
        tehsil = COALESCE(?, tehsil),
        village = COALESCE(?, village),
        stand_name = COALESCE(?, stand_name),
        permit_zones = COALESCE(?, permit_zones),
        vehicle_type = COALESCE(?, vehicle_type),
        vehicle_number = COALESCE(?, vehicle_number),
        vehicle_make = COALESCE(?, vehicle_make),
        vehicle_model = COALESCE(?, vehicle_model),
        vehicle_year = COALESCE(?, vehicle_year),
        seats = COALESCE(?, seats),
        rate_per_km = COALESCE(?, rate_per_km),
        fuel_type = COALESCE(?, fuel_type),
        ac_available = ?,
        rc_photo = COALESCE(?, rc_photo),
        aadhar_photo = COALESCE(?, aadhar_photo),
        license_photo = COALESCE(?, license_photo),
        avatar_photo = COALESCE(?, avatar_photo),
        vehicle_photos = ?,
        license_number = COALESCE(?, license_number),
        experience = COALESCE(?, experience),
        alt_phone = COALESCE(?, alt_phone),
        emergency_contact = COALESCE(?, emergency_contact),
        email = COALESCE(?, email),
        insurance_expiry = COALESCE(?, insurance_expiry),
        upi_id = COALESCE(?, upi_id),
        bank_account = COALESCE(?, bank_account),
        bank_ifsc = COALESCE(?, bank_ifsc)
    WHERE user_id = ?
  `).run(
    data.city ?? null,
    data.district ?? null,
    data.tehsil ?? null,
    data.village ?? null,
    data.stand_name ?? null,
    data.permit_zones ?? null,
    data.vehicle_type ?? null,
    data.vehicle_number ?? null,
    data.vehicle_make ?? null,
    data.vehicle_model ?? null,
    data.vehicle_year ?? null,
    data.seats ?? null,
    data.rate_per_km ?? null,
    data.fuel_type ?? null,
    acVal,
    data.rc_photo ?? null,
    data.aadhar_photo ?? null,
    data.license_photo ?? null,
    data.avatar_photo ?? null,
    vehiclePhotosJson,
    data.license_number ?? null,
    data.experience ?? null,
    data.alt_phone ?? null,
    data.emergency_contact ?? null,
    data.email ?? null,
    data.insurance_expiry ?? null,
    data.upi_id ?? null,
    data.bank_account ?? null,
    data.bank_ifsc ?? null,
    req.userId
  );

  const updatedProfile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;

  return res.json({
    ...updatedProfile,
    name:  updatedUser.name,
    phone: updatedUser.phone,
    message: "Profile updated successfully!",
  });
});

/**
 * PATCH /driver/toggle-online
 * Driver goes Online or Offline.
 */
driverRouter.patch("/toggle-online", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({ online: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "online: boolean required" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  db.prepare("UPDATE driver_profiles SET is_online = ? WHERE user_id = ?").run(
    parsed.data.online ? 1 : 0,
    req.userId
  );
  const profile = db.prepare("SELECT is_online FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  return res.json({ is_online: profile.is_online });
});

/**
 * PATCH /driver/location
 * Updates driver current GPS coordinates (current_lat, current_lng).
 */
driverRouter.patch("/location", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({
    lat: z.number(),
    lng: z.number(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "lat and lng numbers required" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  db.prepare("UPDATE driver_profiles SET current_lat = ?, current_lng = ? WHERE user_id = ?").run(
    parsed.data.lat,
    parsed.data.lng,
    req.userId
  );
  return res.json({ success: true, current_lat: parsed.data.lat, current_lng: parsed.data.lng });
});

/**
 * GET /driver/pending-rides
 * Returns SEARCHING rides that match the driver's vehicle type
 * and are not yet assigned to anyone.
 */
driverRouter.get("/pending-rides", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  if (!profile.is_online) return res.json([]);

  const rides = db.prepare(
    `SELECT * FROM rides
     WHERE status = 'SEARCHING'
       AND (
         driver_id = ?
         OR (driver_id IS NULL AND vehicle_type = ?)
       )
       AND (rejected_drivers IS NULL OR rejected_drivers NOT LIKE ?)
     ORDER BY created_at DESC
     LIMIT 5`
  ).all(profile.id, profile.vehicle_type, `%"${profile.id}"%`);

  return res.json(rides);
});

/**
 * GET /driver/active-ride
 * Returns the current active ride assigned to this driver.
 */
driverRouter.get("/active-ride", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const ride = db.prepare(
    `SELECT * FROM rides
     WHERE driver_id = ?
       AND status IN ('DRIVER_ASSIGNED', 'ARRIVED', 'ONGOING')
     ORDER BY updated_at DESC
     LIMIT 1`
  ).get(profile.id) as any;

  return res.json(ride || null);
});

/**
 * PATCH /driver/rides/:id/respond
 * Driver accepts or rejects a pending ride request.
 */
driverRouter.patch("/rides/:id/respond", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({ accept: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "accept: boolean required" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.status !== "SEARCHING") return res.status(409).json({ error: "Ride no longer available" });

  if (!parsed.data.accept) {
    // Driver rejected — record in rejected_drivers so this driver won't receive it again
    let list: string[] = [];
    try {
      list = JSON.parse(ride.rejected_drivers || "[]");
    } catch {
      list = [];
    }
    if (!list.includes(profile.id)) {
      list.push(profile.id);
    }

    db.prepare(
      "UPDATE rides SET driver_id = NULL, rejected_drivers = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(list), ride.id);

    return res.json({ message: "Ride rejected successfully", rejected: true });
  }

  const startOtp = ride.start_otp || Math.floor(1000 + Math.random() * 9000).toString();

  // Accept: assign this driver to the ride
  db.prepare(
    `UPDATE rides
     SET driver_id = ?, status = 'DRIVER_ASSIGNED', start_otp = ?, updated_at = datetime('now')
     WHERE id = ? AND status = 'SEARCHING'`
  ).run(profile.id, startOtp, ride.id);

  const updated = db.prepare("SELECT * FROM rides WHERE id = ?").get(ride.id);
  return res.json(updated);
});

/**
 * PATCH /driver/rides/:id/status
 * Driver advances an active ride: ARRIVED, ONGOING or COMPLETED.
 */
driverRouter.patch("/rides/:id/status", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({
    status: z.enum(["ARRIVED", "ONGOING", "COMPLETED"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.driver_id !== profile.id) return res.status(403).json({ error: "Not your ride" });

  const finalFare = parsed.data.status === "COMPLETED" ? ride.estimated_fare : ride.final_fare;

  db.prepare(
    "UPDATE rides SET status = ?, final_fare = COALESCE(final_fare, ?), updated_at = datetime('now') WHERE id = ?"
  ).run(parsed.data.status, finalFare, ride.id);

  const updated = db.prepare("SELECT * FROM rides WHERE id = ?").get(ride.id);
  return res.json(updated);
});

/**
 * POST /driver/rides/:id/verify-otp
 * Driver inputs the 4-digit OTP provided by the customer to start the ride.
 */
driverRouter.post("/rides/:id/verify-otp", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({ otp: z.string().length(4) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please enter a valid 4-digit OTP" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;

  const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(req.params.id) as any;
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (ride.driver_id !== profile.id) return res.status(403).json({ error: "Not your ride" });

  if (ride.start_otp && ride.start_otp !== parsed.data.otp.trim()) {
    return res.status(400).json({ error: "Incorrect OTP! Please ask customer for the correct 4-digit code." });
  }

  // Update status to ONGOING (Ride Started)
  db.prepare(
    "UPDATE rides SET status = 'ONGOING', updated_at = datetime('now') WHERE id = ?"
  ).run(ride.id);

  const updated = db.prepare("SELECT * FROM rides WHERE id = ?").get(ride.id);
  return res.json(updated);
});

/**
 * GET /driver/rides
 * Driver's own completed ride history.
 */
driverRouter.get("/rides", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const rides = db.prepare(
    "SELECT * FROM rides WHERE driver_id = ? ORDER BY created_at DESC"
  ).all(profile.id);

  return res.json(rides);
});

/**
 * GET /driver/rates
 * Returns driver's current rate_per_km.
 */
driverRouter.get("/rates", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  const profile = db.prepare("SELECT rate_per_km, vehicle_type, city FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  return res.json({
    rate_per_km: profile.rate_per_km,
    vehicle_type: profile.vehicle_type,
    city: profile.city,
  });
});

/**
 * PATCH /driver/rates
 * Driver updates their base rate_per_km.
 * Allowed range: ₹10 – ₹100
 */
driverRouter.patch("/rates", requireAuth, (req: AuthedRequest, res) => {
  const schema = z.object({
    rate_per_km: z.number().min(10, "Minimum rate is ₹10/km").max(100, "Maximum rate is ₹100/km"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid rate";
    return res.status(400).json({ error: msg });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || user.role !== "DRIVER") return res.status(403).json({ error: "Not a driver" });

  db.prepare("UPDATE driver_profiles SET rate_per_km = ? WHERE user_id = ?").run(
    parsed.data.rate_per_km,
    req.userId
  );

  const profile = db.prepare("SELECT rate_per_km, vehicle_type, city FROM driver_profiles WHERE user_id = ?").get(req.userId) as any;
  return res.json({
    success: true,
    rate_per_km: profile.rate_per_km,
    vehicle_type: profile.vehicle_type,
    city: profile.city,
  });
});
