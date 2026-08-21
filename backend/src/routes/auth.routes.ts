import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import https from "https";
import { db } from "../lib/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const OTP_TTL_MS = 5 * 60 * 1000;

const AUTHKEY   = process.env.AUTHKEY_API_KEY || "";
const AUTHKEY_SID = process.env.AUTHKEY_SMS_SID || "";

// Helper: call Authkey 2FA send OTP API — returns logId or throws
function sendAuthkeyOTP(phone: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://console.authkey.io/restapi/request.php?authkey=${AUTHKEY}&mobile=${phone}&country_code=91&sid=${AUTHKEY_SID}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.LogID) resolve(json.LogID as string);
          else reject(new Error(json.Message || "Authkey OTP send failed"));
        } catch {
          reject(new Error("Invalid response from Authkey"));
        }
      });
    }).on("error", reject);
  });
}

// Helper: verify OTP using Authkey verify API
function verifyAuthkeyOTP(logId: string, otp: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const url = `https://console.authkey.io/api/2fa_verify.php?authkey=${AUTHKEY}&channel=SMS&otp=${otp}&logid=${logId}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.status === true);
        } catch {
          reject(new Error("Invalid response from Authkey verify"));
        }
      });
    }).on("error", reject);
  });
}

const phoneSchema = z.object({ phone: z.string().min(8).max(15) });

authRouter.post("/otp/request", async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid phone number required" });
  }
  const { phone } = parsed.data;
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // If Authkey is configured, send real SMS OTP
  if (AUTHKEY && AUTHKEY_SID) {
    try {
      const logId = await sendAuthkeyOTP(phone);
      // Store logId as "code" field so verify route can use it
      db.prepare(
        "INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)"
      ).run(nanoid(), phone, `AUTHKEY:${logId}`, expiresAt);
      return res.json({ message: "OTP sent to your mobile number via SMS" });
    } catch (err: any) {
      console.error("Authkey OTP send error:", err);
      return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
  }

  // Fallback for local dev (no Authkey configured)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare(
    "INSERT INTO otp_codes (id, phone, code, expires_at) VALUES (?, ?, ?, ?)"
  ).run(nanoid(), phone, code, expiresAt);
  return res.json({
    message: "OTP sent",
    devOnlyCode: code, // Only shown in dev mode
  });
});

const verifySchema = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().length(6),
  name: z.string().optional(),
});

function issueToken(phone: string, name: string | undefined, res: any) {
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
  return res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email || null,
      avatar_photo: user.avatar_photo || null,
      emergency_contact: user.emergency_contact || null,
      role: user.role,
    },
  });
}

authRouter.post("/otp/verify", (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "phone, code required" });
  }
  const { phone, code, name } = parsed.data;

  const otp = db
    .prepare(
      "SELECT * FROM otp_codes WHERE phone = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1"
    )
    .get(phone) as any;

  if (!otp) return res.status(401).json({ error: "Invalid or expired OTP" });
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: "Code expired" });
  }

  // Authkey 2FA path: logId stored as "AUTHKEY:<logId>"
  if ((otp.code as string).startsWith("AUTHKEY:")) {
    const logId = (otp.code as string).replace("AUTHKEY:", "");
    return verifyAuthkeyOTP(logId, code)
      .then((valid) => {
        if (!valid) return res.status(401).json({ error: "Invalid OTP" });
        db.prepare("UPDATE otp_codes SET consumed = 1 WHERE id = ?").run(otp.id);
        return issueToken(phone, name, res);
      })
      .catch((err) => {
        console.error("Authkey verify error:", err);
        return res.status(500).json({ error: "OTP verification failed. Try again." });
      });
  }

  // Dev fallback path (no Authkey configured)
  if (otp.code !== code) return res.status(401).json({ error: "Invalid code" });
  db.prepare("UPDATE otp_codes SET consumed = 1 WHERE id = ?").run(otp.id);
  return issueToken(phone, name, res);
});

// GET /auth/me
authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  try {
    let user = db
      .prepare(
        "SELECT id, phone, name, email, avatar_photo, emergency_contact, role, created_at FROM users WHERE id = ?"
      )
      .get(req.userId) as any;

    if (!user) {
      // Auto-create user if missing for this token
      const id = req.userId || nanoid();
      db.prepare(
        "INSERT OR IGNORE INTO users (id, phone, name, role) VALUES (?, '9999999999', 'Customer', 'CUSTOMER')"
      ).run(id);
      user = db
        .prepare(
          "SELECT id, phone, name, email, avatar_photo, emergency_contact, role, created_at FROM users WHERE id = ?"
        )
        .get(id) as any;
    }

    return res.json({ user });
  } catch (err: any) {
    console.error("GET /auth/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  avatar_photo: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
});

function handleProfileUpdate(req: AuthedRequest, res: any) {
  try {
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid profile data", details: parsed.error });
    }

    let existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
    if (!existing) {
      db.prepare(
        "INSERT OR IGNORE INTO users (id, phone, name, role) VALUES (?, '9999999999', 'Customer', 'CUSTOMER')"
      ).run(req.userId);
      existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
    }

    const name = parsed.data.name !== undefined ? parsed.data.name.trim() : (existing?.name || "");
    const email = parsed.data.email !== undefined ? (parsed.data.email?.trim() || null) : (existing?.email || null);
    const avatar_photo = parsed.data.avatar_photo !== undefined ? parsed.data.avatar_photo : (existing?.avatar_photo || null);
    const emergency_contact = parsed.data.emergency_contact !== undefined ? (parsed.data.emergency_contact?.trim() || null) : (existing?.emergency_contact || null);

    db.prepare(
      "UPDATE users SET name = ?, email = ?, avatar_photo = ?, emergency_contact = ? WHERE id = ?"
    ).run(name, email, avatar_photo, emergency_contact, req.userId);

    const updated = db
      .prepare(
        "SELECT id, phone, name, email, avatar_photo, emergency_contact, role, created_at FROM users WHERE id = ?"
      )
      .get(req.userId) as any;

    return res.json({
      user: updated,
      message: "Profile updated successfully",
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Failed to update profile: " + (err?.message || "Internal error") });
  }
}

authRouter.patch("/profile", requireAuth, handleProfileUpdate);
authRouter.post("/profile", requireAuth, handleProfileUpdate);
authRouter.put("/profile", requireAuth, handleProfileUpdate);
