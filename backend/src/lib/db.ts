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

// Migration: Ensure all extended driver_profiles and rides columns exist
try {
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

  db.exec(`
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
  `);
} catch (e) {
  console.error("Migration check failed:", e);
}

