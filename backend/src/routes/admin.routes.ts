import { Router } from "express";
import { db } from "../lib/db";

export const adminRouter = Router();

// ── GET /admin/stats ──────────────────────────────────────────────────────────
// Dashboard overview counts
adminRouter.get("/stats", (_req, res) => {
  try {
    const totalUsers       = (db.prepare("SELECT COUNT(*) as n FROM users").get() as any).n;
    const totalDrivers     = (db.prepare("SELECT COUNT(*) as n FROM driver_profiles").get() as any).n;
    const onlineDrivers    = (db.prepare("SELECT COUNT(*) as n FROM driver_profiles WHERE is_online = 1").get() as any).n;
    const verifiedDrivers  = (db.prepare("SELECT COUNT(*) as n FROM driver_profiles WHERE is_verified = 1").get() as any).n;
    const totalRides       = (db.prepare("SELECT COUNT(*) as n FROM rides").get() as any).n;
    const completedRides   = (db.prepare("SELECT COUNT(*) as n FROM rides WHERE status = 'COMPLETED'").get() as any).n;
    const cancelledRides   = (db.prepare("SELECT COUNT(*) as n FROM rides WHERE status = 'CANCELLED'").get() as any).n;
    const activeRides      = (db.prepare("SELECT COUNT(*) as n FROM rides WHERE status NOT IN ('COMPLETED','CANCELLED')").get() as any).n;
    const totalBoardPosts  = (db.prepare("SELECT COUNT(*) as n FROM ride_board").get() as any).n;
    const activeBoardPosts = (db.prepare("SELECT COUNT(*) as n FROM ride_board WHERE status = 'ACTIVE'").get() as any).n;
    const boardBookings    = (db.prepare("SELECT COUNT(*) as n FROM board_bookings").get() as any).n;
    const unionApps        = (db.prepare("SELECT COUNT(*) as n FROM union_applications").get() as any).n;
    const pendingUnion     = (db.prepare("SELECT COUNT(*) as n FROM union_applications WHERE status = 'PENDING'").get() as any).n;
    const totalRevRow      = db.prepare("SELECT SUM(final_fare) as s FROM rides WHERE status = 'COMPLETED'").get() as any;
    const totalRevenue     = totalRevRow?.s || 0;

    return res.json({
      totalUsers,
      totalDrivers,
      onlineDrivers,
      verifiedDrivers,
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      totalBoardPosts,
      activeBoardPosts,
      boardBookings,
      unionApps,
      pendingUnion,
      totalRevenue,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /admin/users ──────────────────────────────────────────────────────────
adminRouter.get("/users", (_req, res) => {
  try {
    const users = db.prepare(
      "SELECT id, phone, name, role, created_at FROM users ORDER BY created_at DESC"
    ).all() as any[];
    return res.json({ users });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /admin/drivers ────────────────────────────────────────────────────────
adminRouter.get("/drivers", (_req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT
        dp.id, dp.city, dp.vehicle_type, dp.vehicle_number,
        dp.is_verified, dp.is_online, dp.rating_avg,
        dp.rate_per_km, dp.current_lat, dp.current_lng,
        u.id as user_id, u.name, u.phone, u.created_at
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      ORDER BY u.created_at DESC
    `).all() as any[];
    return res.json({ drivers });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── PATCH /admin/drivers/:id/verify ──────────────────────────────────────────
adminRouter.patch("/drivers/:id/verify", (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    db.prepare("UPDATE driver_profiles SET is_verified = ? WHERE id = ?").run(is_verified ? 1 : 0, id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /admin/rides ──────────────────────────────────────────────────────────
adminRouter.get("/rides", (_req, res) => {
  try {
    const rides = db.prepare(`
      SELECT
        r.*,
        u.name  as customer_name,
        u.phone as customer_phone,
        d.vehicle_number, d.vehicle_type as driver_vehicle,
        du.name  as driver_name,
        du.phone as driver_phone
      FROM rides r
      JOIN users u ON u.id = r.customer_id
      LEFT JOIN driver_profiles d  ON d.id = r.driver_id
      LEFT JOIN users du ON du.id = d.user_id
      ORDER BY r.created_at DESC
      LIMIT 500
    `).all() as any[];
    return res.json({ rides });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /admin/board ──────────────────────────────────────────────────────────
adminRouter.get("/board", (_req, res) => {
  try {
    const posts = db.prepare(`
      SELECT rb.*,
        (SELECT COUNT(*) FROM board_bookings bb WHERE bb.post_id = rb.id) as booking_count
      FROM ride_board rb
      ORDER BY rb.created_at DESC
      LIMIT 300
    `).all() as any[];
    return res.json({ posts });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /admin/union ──────────────────────────────────────────────────────────
adminRouter.get("/union", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM union_applications ORDER BY created_at DESC").all() as any[];
    const applications = rows.map((r) => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email,
      city: r.city, district: r.district, vehicle: r.vehicle, plate: r.plate,
      experience: r.experience, licenseNo: r.license_no, make: r.make,
      model: r.model, year: r.year, note: r.note,
      applied: r.applied, status: r.status, source: r.source,
      docs: JSON.parse(r.docs_json || "[]"),
    }));
    return res.json({ applications });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── POST /admin/union/:id/status ──────────────────────────────────────────────
adminRouter.post("/union/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED | PENDING
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    db.prepare("UPDATE union_applications SET status = ? WHERE id = ?").run(status, id);
    return res.json({ success: true, id, status });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── DELETE /admin/union/:id ───────────────────────────────────────────────────
adminRouter.delete("/union/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM union_applications WHERE id = ?").run(id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
