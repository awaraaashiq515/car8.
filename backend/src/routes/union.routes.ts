import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../lib/db";

export const unionRouter = Router();

// ── GET /api/union/applications ──────────────────────────────────────────────
unionRouter.get("/applications", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM union_applications ORDER BY created_at DESC").all() as any[];
    const applications = rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      city: r.city,
      district: r.district,
      vehicle: r.vehicle,
      plate: r.plate,
      experience: r.experience,
      licenseNo: r.license_no,
      make: r.make,
      model: r.model,
      year: r.year,
      docs: JSON.parse(r.docs_json || "[]"),
      docPhotos: JSON.parse(r.photos_json || "{}"),
      note: r.note,
      applied: r.applied,
      status: r.status,
      source: r.source,
    }));
    return res.json({ applications });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch union applications" });
  }
});

// ── POST /api/union/apply ──────────────────────────────────────────────────
unionRouter.post("/apply", (req, res) => {
  try {
    const {
      id: reqId, name, phone, email, city, district,
      vehicle, plate, experience, licenseNo, make, model, year,
      docs, docPhotos, note, status, source
    } = req.body;

    if (!name || !phone || !plate) {
      return res.status(400).json({ error: "Name, phone, and plate number are required." });
    }

    const id = reqId || "APP-" + Date.now().toString().slice(-6);
    const appliedDate = new Date().toISOString().split("T")[0];
    const appStatus = status || "PENDING";
    const appSource = source || "live";

    const docsJson = JSON.stringify(docs || []);
    const photosJson = JSON.stringify(docPhotos || {});

    // Check if duplicate entry by ID or phone
    const existing = db.prepare("SELECT * FROM union_applications WHERE id = ? OR phone = ?").get(id, phone) as any;

    if (existing) {
      db.prepare(
        `UPDATE union_applications
         SET name = ?, phone = ?, email = ?, city = ?, district = ?,
             vehicle = ?, plate = ?, experience = ?, license_no = ?,
             make = ?, model = ?, year = ?, docs_json = ?, photos_json = ?,
             note = ?, status = ?, source = ?, created_at = datetime('now')
         WHERE id = ?`
      ).run(
        name, phone, email || null, city || district || "Mandi", district || city || null,
        vehicle || "Sedan", plate.toUpperCase(), experience || null, licenseNo || null,
        make || null, model || null, year || null, docsJson, photosJson,
        note || null, appStatus, appSource, existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO union_applications
          (id, name, phone, email, city, district, vehicle, plate, experience, license_no, make, model, year, docs_json, photos_json, note, applied, status, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, name, phone, email || null, city || district || "Mandi", district || city || null,
        vehicle || "Sedan", plate.toUpperCase(), experience || null, licenseNo || null,
        make || null, model || null, year || null, docsJson, photosJson,
        note || null, appliedDate, appStatus, appSource
      );
    }

    return res.status(201).json({
      success: true,
      id,
      message: "Union application submitted successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to submit application" });
  }
});

// ── POST /api/union/approve/:id ─────────────────────────────────────────────
unionRouter.post("/approve/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED | PENDING

    const existing = db.prepare("SELECT * FROM union_applications WHERE id = ?").get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: "Application not found." });
    }

    db.prepare("UPDATE union_applications SET status = ? WHERE id = ?").run(status || "APPROVED", id);

    return res.json({ success: true, id, status: status || "APPROVED" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update application status" });
  }
});

// ── DELETE /api/union/applications/:id ──────────────────────────────────────
unionRouter.delete("/applications/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM union_applications WHERE id = ?").run(id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete application" });
  }
});

// ── GET /api/union/bookings ──────────────────────────────────────────────────
// Fetch live and past bookings linked to this union (or all union bookings)
unionRouter.get("/bookings", (req, res) => {
  try {
    const { union_id, status } = req.query as { union_id?: string; status?: string };

    // Resolve union details if union_id is provided
    let targetUnion: any = null;
    if (union_id && union_id !== "ALL" && union_id !== "HPTU") {
      targetUnion = db.prepare(
        "SELECT * FROM unions WHERE id = ? OR short_code = ? OR name LIKE ? OR admin_name LIKE ?"
      ).get(union_id, union_id, `%${union_id}%`, `%${union_id}%`) as any;
    }

    let sql = `
      SELECT r.id, r.customer_id, r.driver_id, r.union_id, r.union_name,
             r.ride_type, r.vehicle_type, r.vehicle_category,
             r.pickup_text, r.drop_text, r.distance_km, r.estimated_fare,
             r.status, r.created_at, r.scheduled_at,
             u.name as customer_name, u.phone as customer_phone,
             dp.vehicle_number, dp.vehicle_make, dp.vehicle_model,
             du.name as driver_name, du.phone as driver_phone,
             (SELECT text FROM ride_messages WHERE ride_id = r.id ORDER BY created_at DESC LIMIT 1) as latest_message,
             (SELECT sender_role FROM ride_messages WHERE ride_id = r.id ORDER BY created_at DESC LIMIT 1) as latest_message_role,
             (SELECT COUNT(*) FROM ride_messages WHERE ride_id = r.id) as message_count
      FROM rides r
      JOIN users u ON u.id = r.customer_id
      LEFT JOIN driver_profiles dp ON dp.id = r.driver_id
      LEFT JOIN users du ON du.id = dp.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (targetUnion) {
      sql += ` AND (r.union_id = ? OR r.union_id = ? OR r.union_name LIKE ?)`;
      params.push(targetUnion.id, targetUnion.short_code, `%${targetUnion.name}%`);
    } else if (union_id && union_id !== "ALL" && union_id !== "HPTU" && union_id !== "union123" && union_id !== "admin") {
      sql += ` AND (r.union_id = ? OR r.union_id LIKE ? OR r.union_name LIKE ?)`;
      params.push(union_id, `%${union_id}%`, `%${union_id}%`);
    } else {
      // For statewide union HPTU, admin handles, or ALL: include all union-tagged rides + recent rides
      sql += ` AND (r.union_id IS NOT NULL OR r.id IS NOT NULL)`;
    }

    if (status && status !== "ALL") {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT 50`;

    const rows = db.prepare(sql).all(...params) as any[];

    return res.json({ bookings: rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch union bookings" });
  }
});

// ── GET /api/union/bookings/:id/messages ───────────────────────────────────────
// Fetch live messages between customer and union/driver
unionRouter.get("/bookings/:id/messages", (req, res) => {
  try {
    const { id } = req.params;
    const messages = db
      .prepare("SELECT * FROM ride_messages WHERE ride_id = ? ORDER BY created_at ASC")
      .all(id);
    return res.json(messages);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to fetch messages" });
  }
});

// ── POST /api/union/bookings/:id/messages ──────────────────────────────────────
// Union dispatch operator sends a message to customer
unionRouter.post("/bookings/:id/messages", (req, res) => {
  try {
    const { id } = req.params;
    const { text, sender_name } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }
    const msgId = nanoid();
    const senderName = sender_name || "Union Dispatch Desk";
    db.prepare(`
      INSERT INTO ride_messages (id, ride_id, sender_id, sender_role, sender_name, text)
      VALUES (?, ?, 'UNION_DESK', 'DRIVER', ?, ?)
    `).run(msgId, id, senderName, text.trim());

    const created = db.prepare("SELECT * FROM ride_messages WHERE id = ?").get(msgId);
    return res.json(created);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to send message" });
  }
});

// ── POST /api/union/bookings/:id/assign ────────────────────────────────────────
// Union admin assigns an approved union driver to a booking request
unionRouter.post("/bookings/:id/assign", (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ error: "driver_id is required." });
    }

    const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(id) as any;
    if (!ride) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    // Lookup driver
    const driver = db.prepare("SELECT dp.*, u.name FROM driver_profiles dp JOIN users u ON u.id = dp.user_id WHERE dp.id = ?").get(driver_id) as any;
    if (!driver) {
      return res.status(404).json({ error: "Driver not found in database." });
    }

    db.prepare(`
      UPDATE rides
      SET driver_id = ?, status = 'DRIVER_ASSIGNED'
      WHERE id = ?
    `).run(driver_id, id);

    const updated = db.prepare("SELECT * FROM rides WHERE id = ?").get(id) as any;

    return res.json({
      success: true,
      message: `Driver ${driver.name} assigned successfully.`,
      booking: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to assign driver" });
  }
});

// ── POST /api/union/bookings/:id/status ────────────────────────────────────────
// Union admin updates trip status (e.g. CONFIRMED, COMPLETED, CANCELLED)
unionRouter.post("/bookings/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required." });
    }

    const ride = db.prepare("SELECT * FROM rides WHERE id = ?").get(id) as any;
    if (!ride) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    db.prepare("UPDATE rides SET status = ? WHERE id = ?").run(status, id);

    return res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update status" });
  }
});

// ── GET /api/union/members ────────────────────────────────────────────────────
// Return list of approved union drivers ready for dispatch
unionRouter.get("/members", (req, res) => {
  try {
    const { union_id } = req.query as { union_id?: string };

    let targetUnion: any = null;
    if (union_id && union_id !== "ALL" && union_id !== "HPTU" && union_id !== "union123" && union_id !== "admin") {
      targetUnion = db.prepare(
        "SELECT * FROM unions WHERE id = ? OR short_code = ? OR name LIKE ? OR admin_name LIKE ?"
      ).get(union_id, union_id, `%${union_id}%`, `%${union_id}%`) as any;
    }

    let sql = `
      SELECT dp.id, dp.city, dp.district, dp.tehsil, dp.village, dp.stand_name,
             dp.vehicle_type, dp.vehicle_category, dp.vehicle_number, dp.vehicle_make, dp.vehicle_model,
             dp.is_online, dp.rating_avg, dp.rate_per_km, dp.hourly_rate, dp.union_id, dp.union_name,
             dp.current_lat, dp.current_lng, dp.avatar_photo,
             u.name, u.phone
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.is_verified = 1
    `;
    const params: any[] = [];

    if (targetUnion) {
      sql += ` AND (dp.union_id = ? OR dp.union_id = ? OR dp.district = ? OR dp.city = ?)`;
      params.push(targetUnion.id, targetUnion.short_code, targetUnion.district, targetUnion.city);
    }

    sql += ` ORDER BY dp.is_online DESC, dp.rating_avg DESC LIMIT 50`;

    let rows = db.prepare(sql).all(...params) as any[];

    // If zero rows returned, fallback to all verified fleet drivers
    if (rows.length === 0) {
      rows = db.prepare(`
        SELECT dp.id, dp.city, dp.district, dp.tehsil, dp.village, dp.stand_name,
               dp.vehicle_type, dp.vehicle_category, dp.vehicle_number, dp.vehicle_make, dp.vehicle_model,
               dp.is_online, dp.rating_avg, dp.rate_per_km, dp.hourly_rate, dp.union_id, dp.union_name,
               dp.current_lat, dp.current_lng, dp.avatar_photo,
               u.name, u.phone
        FROM driver_profiles dp
        JOIN users u ON u.id = dp.user_id
        WHERE dp.is_verified = 1
        ORDER BY dp.is_online DESC, dp.rating_avg DESC LIMIT 50
      `).all() as any[];
    }

    return res.json({ members: rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch union members" });
  }
});

// ── GET /api/unions ───────────────────────────────────────────────────────────
unionRouter.get("/list", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM unions ORDER BY registered_at DESC").all() as any[];
    return res.json({ unions: rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch unions" });
  }
});

// ── POST /api/union/register ──────────────────────────────────────────────────
unionRouter.post("/register", (req, res) => {
  try {
    const { name, short_code, district, city, admin_name, admin_phone } = req.body;
    if (!name || !short_code || !district) {
      return res.status(400).json({ error: "name, short_code, and district are required." });
    }
    const id = "UNION-" + Date.now().toString().slice(-8);
    const existing = db.prepare("SELECT id FROM unions WHERE short_code = ?").get(short_code.toUpperCase()) as any;
    if (existing) {
      return res.json({ success: true, id: existing.id, message: "Union already registered." });
    }
    db.prepare(
      `INSERT INTO unions (id, name, short_code, district, city, admin_name, admin_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, short_code.toUpperCase(), district, city || district, admin_name || null, admin_phone || null);
    return res.status(201).json({ success: true, id, message: "Union registered successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to register union" });
  }
});


// ═══════════════════════════════════════════════════════════════════════════
//  GST INVOICE ENDPOINTS
//  HSN/SAC: 996411 — Taxi Services   |   GST: 5% (CGST 2.5% + SGST 2.5%)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/union/invoices
 * List all GST invoices for a union, optionally filtered by month/year.
 * Query: union_id, month (1-12), year (e.g. 2026)
 */
unionRouter.get("/invoices", (req, res) => {
  try {
    const { union_id, month, year } = req.query as Record<string, string>;

    let sql = `SELECT * FROM gst_invoices WHERE 1=1`;
    const params: any[] = [];

    if (union_id && union_id !== "ALL") {
      sql += ` AND union_id = ?`;
      params.push(union_id);
    }
    if (year) {
      sql += ` AND strftime('%Y', created_at) = ?`;
      params.push(year);
    }
    if (month) {
      sql += ` AND strftime('%m', created_at) = ?`;
      params.push(month.padStart(2, "0"));
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const invoices = db.prepare(sql).all(...params) as any[];
    return res.json({ invoices });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch invoices" });
  }
});

/**
 * GET /api/union/invoices/:id
 * Get single invoice by id or invoice_number.
 */
unionRouter.get("/invoices/:id", (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare(
      `SELECT * FROM gst_invoices WHERE id = ? OR invoice_number = ?`
    ).get(id, id) as any;
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    return res.json(invoice);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch invoice" });
  }
});

/**
 * POST /api/union/invoices/generate
 * Generate a GST invoice for a completed ride.
 * Body: { ride_id, union_id?, union_gstin?, union_address? }
 */
unionRouter.post("/invoices/generate", (req, res) => {
  try {
    const { ride_id, union_id: reqUnionId, union_gstin, union_address } = req.body;
    if (!ride_id) return res.status(400).json({ error: "ride_id is required" });

    // Check if invoice already exists for this ride
    const existing = db.prepare(`SELECT * FROM gst_invoices WHERE ride_id = ?`).get(ride_id) as any;
    if (existing) return res.json({ invoice: existing, already_existed: true });

    // Fetch ride with customer + driver details
    const ride = db.prepare(`
      SELECT r.*,
             u.name   AS customer_name, u.phone AS customer_phone,
             uu.name  AS driver_name,
             dp.vehicle_number, dp.vehicle_type AS dp_vehicle_type,
             dp.union_id AS dp_union_id, dp.union_name AS dp_union_name
      FROM rides r
      LEFT JOIN users u  ON u.id = r.customer_id
      LEFT JOIN driver_profiles dp ON dp.id = r.driver_id
      LEFT JOIN users uu ON uu.id = dp.user_id
      WHERE r.id = ?
    `).get(ride_id) as any;

    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.status !== "COMPLETED") {
      return res.status(400).json({ error: "Invoice can only be generated for COMPLETED rides" });
    }

    // Union info — prefer explicit param, fall back to ride's union info
    const unionId   = reqUnionId || ride.union_id || ride.dp_union_id || "HPTU";
    const unionName = ride.union_name || ride.dp_union_name || "Himachal Pradesh Taxi Union";

    // Lookup union GSTIN from unions table if available
    let gstin = union_gstin || null;
    let address = union_address || null;
    const unionRow = db.prepare("SELECT * FROM unions WHERE id = ? OR short_code = ?").get(unionId, unionId) as any;
    if (unionRow) {
      gstin   = gstin   || unionRow.gstin   || null;
      address = address || unionRow.address || `${unionRow.city || ""}, Himachal Pradesh`;
    }
    if (!address) address = "Himachal Pradesh, India";

    // Generate invoice number: INV-{UNION_SHORT}-{YEAR}-{SERIAL}
    const year = new Date().getFullYear();
    const shortCode = unionId.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
    const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM gst_invoices WHERE union_id = ? AND strftime('%Y', created_at) = ?`).get(unionId, year.toString()) as any;
    const serial = ((countRow?.cnt || 0) + 1).toString().padStart(4, "0");
    const invoiceNumber = `INV-${shortCode}-${year}-${serial}`;

    // GST Calculation (5% total, split equally)
    const baseFare = parseFloat(ride.estimated_fare) || 0;
    const cgst     = Math.round(baseFare * 0.025 * 100) / 100;  // 2.5%
    const sgst     = Math.round(baseFare * 0.025 * 100) / 100;  // 2.5%
    const total    = Math.round((baseFare + cgst + sgst) * 100) / 100;

    const invoiceId = nanoid();
    const rideDate  = (ride.created_at || new Date().toISOString()).split("T")[0];

    db.prepare(`
      INSERT INTO gst_invoices
        (id, invoice_number, ride_id, union_id, union_name, union_gstin, union_address,
         customer_name, customer_phone, driver_name, vehicle_number, vehicle_type,
         pickup_text, drop_text, distance_km, ride_date,
         base_fare, gst_rate, cgst_amount, sgst_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId, invoiceNumber, ride_id,
      unionId, unionName, gstin, address,
      ride.customer_name || "Customer", ride.customer_phone || null,
      ride.driver_name   || null, ride.vehicle_number || null,
      ride.dp_vehicle_type || ride.vehicle_type || null,
      ride.pickup_text, ride.drop_text, ride.distance_km, rideDate,
      baseFare, 5.0, cgst, sgst, total
    );

    const invoice = db.prepare(`SELECT * FROM gst_invoices WHERE id = ?`).get(invoiceId);
    return res.status(201).json({ invoice });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to generate invoice" });
  }
});

/**
 * GET /api/union/invoices/stats
 * Summary stats for the billing dashboard.
 * Query: union_id, year
 */
unionRouter.get("/invoices-stats", (req, res) => {
  try {
    const { union_id, year } = req.query as Record<string, string>;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (union_id && union_id !== "ALL") {
      where += " AND union_id = ?";
      params.push(union_id);
    }
    if (year) {
      where += ` AND strftime('%Y', created_at) = ?`;
      params.push(year);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*)          AS total_invoices,
        SUM(total_amount) AS total_revenue,
        SUM(cgst_amount + sgst_amount) AS total_gst_collected,
        SUM(base_fare)    AS total_base_fare
      FROM gst_invoices ${where}
    `).get(...params) as any;

    // Count completed rides without invoices (pending billing)
    let pendingWhere = "WHERE status = 'COMPLETED'";
    const pendingParams: any[] = [];
    if (union_id && union_id !== "ALL") {
      pendingWhere += " AND union_id = ?";
      pendingParams.push(union_id);
    }

    const pendingRow = db.prepare(`
      SELECT COUNT(*) AS cnt FROM rides ${pendingWhere}
      AND id NOT IN (SELECT ride_id FROM gst_invoices)
    `).get(...pendingParams) as any;

    return res.json({
      total_invoices:      stats.total_invoices || 0,
      total_revenue:       Math.round((stats.total_revenue || 0) * 100) / 100,
      total_gst_collected: Math.round((stats.total_gst_collected || 0) * 100) / 100,
      total_base_fare:     Math.round((stats.total_base_fare || 0) * 100) / 100,
      pending_bills:       pendingRow.cnt || 0,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch invoice stats" });
  }
});
