import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { db } from "../lib/db";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const OTP_TTL_MS = 5 * 60 * 1000;

// In a production build, plug in an SMS provider (Twilio Verify, MSG91, etc.)
// here instead of returning the code in the response. Kept visible in this
// scaffold purely so the booking flow is testable end-to-end without SMS.

const phoneSchema = z.object({ phone: z.string().min(8).max(15) });

authRouter.post("/otp/request", (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid phone number required" });
  }
  const { phone } = parsed.data;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  db.prepare(
    "INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)"
  ).run(nanoid(), phone, code, expiresAt);

  return res.json({
    message: "OTP sent",
    devOnlyCode: code, // remove this field once a real SMS provider is wired up
  });
});

const verifySchema = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().length(6),
  name: z.string().optional(),
});

authRouter.post("/otp/verify", (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "phone, code required" });
  }
  const { phone, code, name } = parsed.data;

  const otp = db
    .prepare(
      "SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1"
    )
    .get(phone, code) as any;

  if (!otp) return res.status(401).json({ error: "Invalid code" });
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: "Code expired" });
  }

  db.prepare("UPDATE otp_codes SET consumed = 1 WHERE id = ?").run(otp.id);

  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;
  if (!user) {
    const id = nanoid();
    db.prepare(
      "INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, 'CUSTOMER')"
    ).run(id, phone, name || null);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }

  const token = jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
});
