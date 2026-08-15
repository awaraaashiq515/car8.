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
