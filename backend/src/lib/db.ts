import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_FILE || path.join(__dirname, "../../dev.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schemaPath = path.join(__dirname, "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Migration: Ensure all extended users, driver_profiles and rides columns exist
try {
  const userCols = (db.prepare("PRAGMA table_info(users)").all() as any[]).map(c => c.name);
  const addUserIfMissing = (col: string, def: string) => {
    if (!userCols.includes(col)) {
      try { db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`); } catch {}
    }
  };
  addUserIfMissing("avatar_photo", "TEXT");
  addUserIfMissing("email", "TEXT");
  addUserIfMissing("emergency_contact", "TEXT");

  const tableInfo = db.prepare("PRAGMA table_info(rides)").all() as any[];
  const hasOtp = tableInfo.some((col) => col.name === "start_otp");
  if (!hasOtp) {
    db.exec("ALTER TABLE rides ADD COLUMN start_otp TEXT");
  }

  const hasRejected = tableInfo.some((col) => col.name === "rejected_drivers");
  if (!hasRejected) {
    db.exec("ALTER TABLE rides ADD COLUMN rejected_drivers TEXT DEFAULT '[]'");
  }

  const driverCols = (db.prepare("PRAGMA table_info(driver_profiles)").all() as any[]).map(c => c.name);
  const addIfMissing = (col: string, def: string) => {
    if (!driverCols.includes(col)) {
      try { db.exec(`ALTER TABLE driver_profiles ADD COLUMN ${col} ${def}`); } catch {}
    }
  };

  addIfMissing("district", "TEXT");
  addIfMissing("tehsil", "TEXT");
  addIfMissing("village", "TEXT");
  addIfMissing("vehicle_make", "TEXT");
  addIfMissing("vehicle_model", "TEXT");
  addIfMissing("vehicle_year", "INTEGER");
  addIfMissing("seats", "INTEGER DEFAULT 4");
  addIfMissing("permit_zones", "TEXT DEFAULT 'HP'");
  addIfMissing("rc_photo", "TEXT");
  addIfMissing("aadhar_photo", "TEXT");
  addIfMissing("license_photo", "TEXT");
  addIfMissing("license_number", "TEXT");
  addIfMissing("experience", "TEXT");
  addIfMissing("alt_phone", "TEXT");
  addIfMissing("emergency_contact", "TEXT");
  addIfMissing("email", "TEXT");
  addIfMissing("stand_name", "TEXT");
  addIfMissing("fuel_type", "TEXT DEFAULT 'Petrol'");
  addIfMissing("ac_available", "INTEGER DEFAULT 1");
  addIfMissing("insurance_expiry", "TEXT");
  addIfMissing("upi_id", "TEXT");
  addIfMissing("bank_account", "TEXT");
  addIfMissing("bank_ifsc", "TEXT");
  addIfMissing("vehicle_photos", "TEXT DEFAULT '[]'");
  addIfMissing("avatar_photo", "TEXT");
  addIfMissing("total_reviews", "INTEGER DEFAULT 0");
  // Multi-vehicle expansion columns
  addIfMissing("vehicle_category", "TEXT NOT NULL DEFAULT 'CAR'");
  addIfMissing("load_capacity", "TEXT");       // e.g. "1 Ton", "5 Ton" — for GOODS vehicles
  addIfMissing("hourly_rate", "REAL");          // e.g. 800 — for HEAVY machinery (₹/hr)
  addIfMissing("union_id", "TEXT");             // Union short code or ID
  addIfMissing("union_name", "TEXT");           // Union display name

  // Backfill vehicle_category = 'CAR' for all existing CAR-type drivers
  db.exec(`
    UPDATE driver_profiles
    SET vehicle_category = 'CAR'
    WHERE vehicle_category IS NULL
      OR vehicle_category = ''
  `);

  // Ensure rides table also has vehicle_category, union_id, union_name
  const rideCols2 = (db.prepare("PRAGMA table_info(rides)").all() as any[]).map(c => c.name);
  if (!rideCols2.includes("vehicle_category")) {
    db.exec("ALTER TABLE rides ADD COLUMN vehicle_category TEXT NOT NULL DEFAULT 'CAR'");
    db.exec(`
      UPDATE rides SET vehicle_category = 'CAR'
      WHERE vehicle_category IS NULL OR vehicle_category = ''
    `);
  }
  if (!rideCols2.includes("union_id")) {
    db.exec("ALTER TABLE rides ADD COLUMN union_id TEXT");
  }
  if (!rideCols2.includes("union_name")) {
    db.exec("ALTER TABLE rides ADD COLUMN union_name TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS unions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE,
      district TEXT NOT NULL,
      city TEXT NOT NULL,
      admin_name TEXT,
      admin_phone TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driver_reviews (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL REFERENCES rides(id),
      driver_id TEXT NOT NULL REFERENCES driver_profiles(id),
      customer_id TEXT NOT NULL REFERENCES users(id),
      customer_name TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      tags_json TEXT DEFAULT '[]',
      tip_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ride_messages (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL REFERENCES rides(id),
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL, -- 'CUSTOMER' | 'DRIVER'
      sender_name TEXT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default unions if table is empty
  const unionCount = (db.prepare("SELECT COUNT(*) as n FROM unions").get() as any)?.n || 0;
  if (unionCount === 0) {
    const seedUnions = [
      { id: "UNION-HPTU", name: "Himachal Pradesh Taxi Union (HPTU)", short_code: "HPTU", district: "Mandi", city: "Mandi", admin_name: "Ramesh Sharma", admin_phone: "9816012345" },
      { id: "UNION-SML", name: "Shimla Taxi Operators Union", short_code: "SML-TU", district: "Shimla", city: "Shimla", admin_name: "Vikram Chauhan", admin_phone: "9816023456" },
      { id: "UNION-MNL", name: "Manali Tourist Taxi Operators Union", short_code: "MNL-TU", district: "Kullu", city: "Manali", admin_name: "Suresh Thakur", admin_phone: "9816034567" },
      { id: "UNION-DHM", name: "Dharamshala Kangra Taxi Union", short_code: "DHM-TU", district: "Kangra", city: "Dharamshala", admin_name: "Anil Rana", admin_phone: "9816045678" },
      { id: "UNION-SLN", name: "Solan District Motor Transport Union", short_code: "SLN-TU", district: "Solan", city: "Solan", admin_name: "Rajesh Verma", admin_phone: "9816056789" },
    ];
    const insertUnion = db.prepare(
      "INSERT OR IGNORE INTO unions (id, name, short_code, district, city, admin_name, admin_phone) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    for (const u of seedUnions) {
      insertUnion.run(u.id, u.name, u.short_code, u.district, u.city, u.admin_name, u.admin_phone);
    }
  }

  // Update existing drivers to belong to Mandi Union / HPTU by default
  db.exec(`
    UPDATE driver_profiles
    SET union_id = 'MANDI UN', union_name = 'Mandi Union'
    WHERE union_id IS NULL OR union_id = ''
  `);
} catch (e) {
  console.error("Migration check failed:", e);
}

