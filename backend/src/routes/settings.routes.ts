import { Router } from "express";
import { db } from "../lib/db";

export const settingsRouter = Router();

// ── Ensure settings table exists ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  )
`);

// Default values seeded on first run
const DEFAULTS: Record<string, string> = {
  app_name:            "Cab8",
  app_tagline:         "Verified taxis across the hills and beyond",
  app_description:     "Book verified taxis for local, outstation, airport and hourly rides. Transparent pricing across Himachal Pradesh & India.",
  support_phone:       "",
  support_email:       "",
  support_whatsapp:    "",
  support_address:     "",
  cities_covered:      "Shimla, Manali, Mandi, Kullu, Dharamsala, Delhi",
  fare_base_per_km:    "18",
  fare_min_fare:       "100",
  fare_surge_mult:     "1.0",
  feature_ride_board:  "true",
  feature_union_apps:  "true",
  banner_enabled:      "false",
  banner_text:         "",
  banner_type:         "info",
  logo_data:           "",   // base64 data URL
  favicon_data:        "",   // base64 data URL
  theme_color:         "#2563EB",
};

// Seed missing keys
const insert = db.prepare(
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)"
);
for (const [k, v] of Object.entries(DEFAULTS)) {
  insert.run(k, v);
}

// ── GET /settings/all ─────────────────────────────────────────────────────────
settingsRouter.get("/all", (_req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM app_settings").all() as any[];
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return res.json({ settings });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── PATCH /settings ───────────────────────────────────────────────────────────
// Body: { key: string, value: string } OR { settings: Record<string,string> }
settingsRouter.patch("/", (req, res) => {
  try {
    const { key, value, settings } = req.body;

    const upsert = db.prepare(
      "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );

    if (settings && typeof settings === "object") {
      // Bulk update
      const upsertMany = db.transaction((obj: Record<string, string>) => {
        for (const [k, v] of Object.entries(obj)) upsert.run(k, String(v));
      });
      upsertMany(settings);
    } else if (key) {
      upsert.run(key, String(value ?? ""));
    } else {
      return res.status(400).json({ error: "Provide key+value or settings object" });
    }

    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /settings/public ─────────────────────────────────────────────────────
// Public endpoint — returns only non-sensitive settings (for the app to use)
settingsRouter.get("/public", (_req, res) => {
  try {
    const keys = [
      "app_name", "app_tagline", "app_description",
      "cities_covered", "fare_base_per_km", "fare_min_fare",
      "feature_ride_board", "feature_union_apps",
      "banner_enabled", "banner_text", "banner_type",
      "logo_data", "favicon_data", "theme_color",
      "support_phone", "support_whatsapp",
    ];
    const rows = db.prepare(
      `SELECT key, value FROM app_settings WHERE key IN (${keys.map(() => "?").join(",")})`
    ).all(...keys) as any[];
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return res.json({ settings });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
