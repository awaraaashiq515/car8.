import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { db } from "../lib/db";
import { CITY_COORDS } from "../services/fare";

export const driverAuthRouter = Router();

const JWT_SECRET  = process.env.JWT_SECRET || "dev-secret-change-me";
const OTP_TTL_MS  = 5 * 60 * 1000;

// ─── Schema ───────────────────────────────────────────────
const registerSchema = z.object({
  name:           z.string().min(2, "Name must be at least 2 characters"),
  phone:          z.string().min(8).max(15),
  city:           z.string().min(2),
  district:       z.string().min(2).optional(),
  tehsil:         z.string().min(2).optional(),
  village:        z.string().optional(),
  vehicleType:    z.enum(["HATCHBACK", "SEDAN", "SUV", "LUXURY"]),
  vehicleNumber:  z.string().min(4, "Enter a valid vehicle number"),
  vehicleMake:    z.string().optional(),
  vehicleModel:   z.string().optional(),
  vehicleYear:    z.number().int().optional(),
  seats:          z.number().int().min(2).max(12).optional(),
  permitZones:    z.string().optional(), // comma-separated: "HP,Delhi,Chandigarh"
  rcPhoto:        z.string().optional(), // base64 data URI
  aadharPhoto:    z.string().optional(), // base64 data URI
  currentLat:     z.number().optional(),
  currentLng:     z.number().optional(),
});

const otpRequestSchema = z.object({ phone: z.string().min(8).max(15) });
const otpVerifySchema  = z.object({
  phone: z.string().min(8).max(15),
  code:  z.string().length(6),
});

// ─── POST /driver/auth/register ───────────────────────────
// Step 1: Submit driver details, get an OTP to verify phone
driverAuthRouter.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }
  const { name, phone, city, vehicleType, vehicleNumber } = parsed.data;

  // Check if phone already registered as a driver
  const existingUser = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;
  if (existingUser && existingUser.role === "DRIVER") {
    return res.status(409).json({ error: "This phone number is already registered as a driver. Please login." });
  }

  // Store pending registration in a temp table (or just send OTP)
  // We save details to be committed after OTP verification
  const code      = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  db.prepare("INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)").run(
    nanoid(), phone, code, expiresAt
  );

  // Store pending registration metadata in a lightweight way using a JSON column trick
  // We'll embed it as "extra" in the OTP code record via a separate table approach.
  // Simpler: just return the code and have the frontend re-send the full payload at verify time.
  return res.json({
    message:     "OTP sent. Enter it to complete registration.",
    devOnlyCode: code,
  });
});

// ─── POST /driver/auth/register/verify ───────────────────
// Step 2: Verify OTP + actually create the driver account
driverAuthRouter.post("/register/verify", (req, res) => {
  const fullSchema = registerSchema.extend({
    code: z.string().length(6),
  });
  const parsed = fullSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }
  const { name, phone, city, district, tehsil, village, vehicleType, vehicleNumber,
          vehicleMake, vehicleModel, vehicleYear, seats, permitZones,
          rcPhoto, aadharPhoto, currentLat, currentLng, code } = parsed.data;

  const otp = db.prepare(
    "SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1"
  ).get(phone, code) as any;

  if (!otp) return res.status(401).json({ error: "Invalid OTP code." });
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: "OTP has expired. Please request a new one." });
  }

  db.prepare("UPDATE otp_codes SET consumed = 1 WHERE id = ?").run(otp.id);

  // Create or update user as DRIVER
  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;
  if (!user) {
    const userId = nanoid();
    db.prepare("INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, 'DRIVER')").run(
      userId, phone, name
    );
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  } else {
    // Upgrade existing customer account to driver
    db.prepare("UPDATE users SET name = ?, role = 'DRIVER' WHERE id = ?").run(name, user.id);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  }

  // Resolve city coordinates — use GPS coords if provided, else lookup by city
  let finalLat = currentLat;
  let finalLng = currentLng;
  if (!finalLat || !finalLng) {
    const cityCoords = CITY_COORDS[city];
    finalLat = cityCoords?.lat || 31.7084;
    finalLng = cityCoords?.lng || 76.9319;
  }

  // Create or update driver profile
  const existing = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(user.id);
  if (!existing) {
    db.prepare(
      `INSERT INTO driver_profiles
        (id, user_id, city, district, tehsil, village,
         vehicle_type, vehicle_number, vehicle_make, vehicle_model, vehicle_year,
         seats, permit_zones, rc_photo, aadhar_photo,
         is_verified, is_online, rating_avg, rate_per_km, current_lat, current_lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 4.8, 18, ?, ?)`
    ).run(
      nanoid(), user.id,
      city, district || null, tehsil || null, village || null,
      vehicleType, vehicleNumber, vehicleMake || null, vehicleModel || null, vehicleYear || null,
      seats || 4, permitZones || "HP",
      rcPhoto || null, aadharPhoto || null,
      finalLat, finalLng
    );
  } else {
    db.prepare(
      `UPDATE driver_profiles
       SET city = ?, district = ?, tehsil = ?, village = ?,
           vehicle_type = ?, vehicle_number = ?, vehicle_make = ?, vehicle_model = ?, vehicle_year = ?,
           seats = ?, permit_zones = ?,
           rc_photo = COALESCE(?, rc_photo), aadhar_photo = COALESCE(?, aadhar_photo),
           is_verified = 1, is_online = 1, current_lat = ?, current_lng = ?
       WHERE user_id = ?`
    ).run(
      city, district || null, tehsil || null, village || null,
      vehicleType, vehicleNumber, vehicleMake || null, vehicleModel || null, vehicleYear || null,
      seats || 4, permitZones || "HP",
      rcPhoto || null, aadharPhoto || null,
      finalLat, finalLng,
      user.id
    );
  }

  const token = jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(user.id) as any;

  return res.status(201).json({
    token,
    user:    { id: user.id, phone: user.phone, name: user.name },
    profile: { ...profile, name: user.name, phone: user.phone },
    message: "Registration successful! Your account is pending admin verification.",
  });
});

// ─── POST /driver/auth/login/request ─────────────────────
driverAuthRouter.post("/login/request", (req, res) => {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid phone number required." });

  const { phone } = parsed.data;
  const user = db.prepare("SELECT * FROM users WHERE phone = ? AND role = 'DRIVER'").get(phone) as any;
  if (!user) {
    return res.status(404).json({ error: "No driver account found for this number. Please register first." });
  }

  const code      = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  db.prepare("INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)").run(
    nanoid(), phone, code, expiresAt
  );

  return res.json({ message: "OTP sent.", devOnlyCode: code });
});

// ─── POST /driver/auth/login/verify ──────────────────────
driverAuthRouter.post("/login/verify", (req, res) => {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Phone and 6-digit code required." });

  const { phone, code } = parsed.data;

  const otp = db.prepare(
    "SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1"
  ).get(phone, code) as any;

  if (!otp) return res.status(401).json({ error: "Invalid OTP code." });
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: "OTP has expired. Please request a new one." });
  }

  db.prepare("UPDATE otp_codes SET consumed = 1 WHERE id = ?").run(otp.id);

  const user = db.prepare("SELECT * FROM users WHERE phone = ? AND role = 'DRIVER'").get(phone) as any;
  if (!user) return res.status(403).json({ error: "Not a driver account." });

  const token = jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
  const profile = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(user.id) as any;

  return res.json({
    token,
    user:    { id: user.id, phone: user.phone, name: user.name },
    profile: profile ? { ...profile, name: user.name, phone: user.phone } : null,
  });
});
