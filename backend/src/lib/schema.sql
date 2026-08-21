-- Cab8 core schema — customer booking flow scaffold.
-- Written in portable SQL; the only SQLite-specific bits are TEXT ids
-- and STRING-based enums (swap to native ENUM / UUID types on Postgres).

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  phone             TEXT NOT NULL UNIQUE,
  name              TEXT,
  email             TEXT,
  avatar_photo      TEXT,
  emergency_contact TEXT,
  role              TEXT NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER | DRIVER | ADMIN
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS driver_profiles (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL UNIQUE REFERENCES users(id),
  city           TEXT NOT NULL,
  vehicle_type   TEXT NOT NULL, -- HATCHBACK | SEDAN | SUV | LUXURY
  vehicle_number TEXT NOT NULL,
  is_verified    INTEGER NOT NULL DEFAULT 0,
  is_online      INTEGER NOT NULL DEFAULT 0,
  rating_avg     REAL NOT NULL DEFAULT 4.6,
  rate_per_km    REAL NOT NULL DEFAULT 18,
  current_lat    REAL NOT NULL DEFAULT 0,
  current_lng    REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rides (
  id             TEXT PRIMARY KEY,
  customer_id    TEXT NOT NULL REFERENCES users(id),
  driver_id      TEXT REFERENCES driver_profiles(id),
  ride_type      TEXT NOT NULL, -- LOCAL | OUTSTATION | AIRPORT | HOURLY
  vehicle_type   TEXT NOT NULL,
  pickup_text    TEXT NOT NULL,
  pickup_lat     REAL NOT NULL,
  pickup_lng     REAL NOT NULL,
  drop_text      TEXT NOT NULL,
  drop_lat       REAL NOT NULL,
  drop_lng       REAL NOT NULL,
  scheduled_at   TEXT,
  distance_km    REAL NOT NULL,
  estimated_fare REAL NOT NULL,
  final_fare     REAL,
  status         TEXT NOT NULL DEFAULT 'SEARCHING',
  -- SEARCHING | CONFIRMED | DRIVER_ASSIGNED | ARRIVED | ONGOING | COMPLETED | CANCELLED
  start_otp      TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id         TEXT PRIMARY KEY,
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Ride Board (BlaBlaCar-style public posts) ──────────────────────────────
-- Only drivers can post (OFFERING).
-- post_type LOOKING = driver looking for passengers, OFFERING = driver offering seats
CREATE TABLE IF NOT EXISTS ride_board (
  id             TEXT PRIMARY KEY,
  poster_id      TEXT NOT NULL REFERENCES users(id),
  poster_name    TEXT NOT NULL,
  poster_phone   TEXT NOT NULL,
  poster_type    TEXT NOT NULL DEFAULT 'DRIVER',  -- always DRIVER now
  post_type      TEXT NOT NULL,                   -- LOOKING | OFFERING
  from_text      TEXT NOT NULL,
  to_text        TEXT NOT NULL,
  travel_date    TEXT NOT NULL,
  travel_time    TEXT,
  seats          INTEGER NOT NULL DEFAULT 1,
  price_per_seat REAL,
  vehicle_type   TEXT,
  description    TEXT,                            -- Full trip description by driver
  luggage_info   TEXT,                            -- What luggage/items are allowed
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | FILLED | EXPIRED
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Board Bookings ──────────────────────────────────────────────────────────
-- Customer books a seat on a driver's ride_board post.
CREATE TABLE IF NOT EXISTS board_bookings (
  id             TEXT PRIMARY KEY,
  post_id        TEXT NOT NULL REFERENCES ride_board(id) ON DELETE CASCADE,
  customer_id    TEXT NOT NULL REFERENCES users(id),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  seats_booked   INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | CONFIRMED | REJECTED | CANCELLED
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Board Chat Messages ─────────────────────────────────────────────────────
-- In-app chat thread per ride_board post (driver + all customers who booked).
CREATE TABLE IF NOT EXISTS board_messages (
  id           TEXT PRIMARY KEY,
  post_id      TEXT NOT NULL REFERENCES ride_board(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL REFERENCES users(id),
  sender_name  TEXT NOT NULL,
  sender_type  TEXT NOT NULL,  -- DRIVER | CUSTOMER
  message      TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Union Applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS union_applications (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  city         TEXT NOT NULL,
  district     TEXT,
  vehicle      TEXT NOT NULL,
  plate        TEXT NOT NULL,
  experience   TEXT,
  license_no   TEXT,
  make         TEXT,
  model        TEXT,
  year         TEXT,
  docs_json    TEXT NOT NULL DEFAULT '[]',
  photos_json  TEXT NOT NULL DEFAULT '{}',
  note         TEXT,
  applied      TEXT NOT NULL DEFAULT (date('now')),
  status       TEXT NOT NULL DEFAULT 'PENDING',
  source       TEXT NOT NULL DEFAULT 'live',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── GST Invoices ─────────────────────────────────────────────────────────────
-- Auto-generated GST bills for completed rides dispatched via union desk.
-- HSN/SAC Code 996411 — Taxi / Radio Taxi Services
-- GST Rate: 5% (No ITC) — CGST 2.5% + SGST 2.5%
CREATE TABLE IF NOT EXISTS gst_invoices (
  id              TEXT PRIMARY KEY,
  invoice_number  TEXT NOT NULL UNIQUE,
  ride_id         TEXT NOT NULL REFERENCES rides(id),
  union_id        TEXT,
  union_name      TEXT,
  union_gstin     TEXT,
  union_address   TEXT,
  customer_name   TEXT,
  customer_phone  TEXT,
  driver_name     TEXT,
  vehicle_number  TEXT,
  vehicle_type    TEXT,
  pickup_text     TEXT,
  drop_text       TEXT,
  distance_km     REAL,
  ride_date       TEXT,
  base_fare       REAL NOT NULL,
  gst_rate        REAL NOT NULL DEFAULT 5.0,
  cgst_amount     REAL NOT NULL,
  sgst_amount     REAL NOT NULL,
  total_amount    REAL NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

