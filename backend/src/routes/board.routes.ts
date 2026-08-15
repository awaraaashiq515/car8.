import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const boardRouter = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const postSchema = z.object({
  post_type:      z.enum(["LOOKING", "OFFERING"]),
  from_text:      z.string().min(2, "From location required"),
  to_text:        z.string().min(2, "To location required"),
  travel_date:    z.string().min(1, "Travel date required"),
  travel_time:    z.string().optional(),
  seats:          z.number().int().min(1).max(20).default(1),
  price_per_seat: z.number().min(0).optional().nullable(),
  vehicle_type:   z.string().optional().nullable(),
  description:    z.string().max(1000).optional().nullable(),
  luggage_info:   z.string().max(300).optional().nullable(),
  notes:          z.string().max(300).optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "FILLED", "EXPIRED"]),
});

const bookingSchema = z.object({
  seats_booked: z.number().int().min(1).max(10).default(1),
});

const bookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED"]),
});

const messageSchema = z.object({
  message: z.string().min(1).max(1000),
});

// ── GET /board ──────────────────────────────────────────────────────────────
// Public: list all ACTIVE posts with booking counts.
boardRouter.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT rb.*,
           COALESCE(SUM(CASE WHEN bb.status IN ('PENDING','CONFIRMED') THEN bb.seats_booked ELSE 0 END), 0) AS booked_seats
    FROM ride_board rb
    LEFT JOIN board_bookings bb ON bb.post_id = rb.id
    WHERE rb.status = 'ACTIVE'
    GROUP BY rb.id
    ORDER BY rb.travel_date ASC, rb.created_at DESC
  `).all() as any[];

  let result = rows;
  const { post_type, from, to, date } = req.query as Record<string, string>;
  if (post_type) result = result.filter((r) => r.post_type === post_type);
  if (from)      result = result.filter((r) => r.from_text.toLowerCase().includes(from.toLowerCase()));
  if (to)        result = result.filter((r) => r.to_text.toLowerCase().includes(to.toLowerCase()));
  if (date)      result = result.filter((r) => r.travel_date === date);

  return res.json(result);
});

// ── GET /board/my ───────────────────────────────────────────────────────────
// Authenticated: returns the logged-in driver's own posts (with booking counts).
boardRouter.get("/my", requireAuth, (req: AuthedRequest, res) => {
  const posts = db.prepare(`
    SELECT rb.*,
           COALESCE(SUM(CASE WHEN bb.status IN ('PENDING','CONFIRMED') THEN bb.seats_booked ELSE 0 END), 0) AS booked_seats,
           COUNT(CASE WHEN bb.status = 'PENDING' THEN 1 END) AS pending_count
    FROM ride_board rb
    LEFT JOIN board_bookings bb ON bb.post_id = rb.id
    WHERE rb.poster_id = ?
    GROUP BY rb.id
    ORDER BY rb.created_at DESC
  `).all(req.userId);
  return res.json(posts);
});

// ── GET /board/:id ──────────────────────────────────────────────────────────
// Public: full details of a single post, with confirmed passengers (names only).
boardRouter.get("/:id", (req, res) => {
  const post = db.prepare(`
    SELECT rb.*,
           COALESCE(SUM(CASE WHEN bb.status IN ('PENDING','CONFIRMED') THEN bb.seats_booked ELSE 0 END), 0) AS booked_seats
    FROM ride_board rb
    LEFT JOIN board_bookings bb ON bb.post_id = rb.id
    WHERE rb.id = ?
    GROUP BY rb.id
  `).get(req.params.id) as any;

  if (!post) return res.status(404).json({ error: "Post not found" });

  // Public passenger list — only confirmed bookings, names only (no phone)
  const passengers = db.prepare(`
    SELECT id, customer_name, seats_booked, status, created_at
    FROM board_bookings
    WHERE post_id = ? AND status IN ('PENDING', 'CONFIRMED')
    ORDER BY created_at ASC
  `).all(req.params.id);

  return res.json({ ...post, passengers });
});

// ── POST /board ─────────────────────────────────────────────────────────────
// Authenticated: DRIVERS ONLY can post to the board.
boardRouter.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid data";
    return res.status(400).json({ error: msg });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });

  const driverProfile = db
    .prepare("SELECT id FROM driver_profiles WHERE user_id = ?")
    .get(req.userId) as any;
  if (!driverProfile) {
    return res.status(403).json({ error: "Only drivers can post to the Ride Board." });
  }

  const d = parsed.data;
  const id = nanoid();

  db.prepare(`
    INSERT INTO ride_board
      (id, poster_id, poster_name, poster_phone, poster_type, post_type,
       from_text, to_text, travel_date, travel_time, seats, price_per_seat,
       vehicle_type, description, luggage_info, notes)
    VALUES (?, ?, ?, ?, 'DRIVER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.userId, user.name || "Driver", user.phone,
    d.post_type, d.from_text, d.to_text, d.travel_date,
    d.travel_time || null, d.seats, d.price_per_seat ?? null,
    d.vehicle_type || null, d.description || null,
    d.luggage_info || null, d.notes || null
  );

  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(id);
  return res.status(201).json(post);
});

// ── PATCH /board/:id/status ─────────────────────────────────────────────────
boardRouter.patch("/:id/status", requireAuth, (req: AuthedRequest, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.poster_id !== req.userId)
    return res.status(403).json({ error: "You can only update your own posts" });

  db.prepare("UPDATE ride_board SET status = ? WHERE id = ?").run(parsed.data.status, req.params.id);
  return res.json(db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id));
});

// ── DELETE /board/:id ───────────────────────────────────────────────────────
boardRouter.delete("/:id", requireAuth, (req: AuthedRequest, res) => {
  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.poster_id !== req.userId)
    return res.status(403).json({ error: "You can only delete your own posts" });

  db.prepare("DELETE FROM ride_board WHERE id = ?").run(req.params.id);
  return res.json({ success: true });
});

// ── POST /board/:id/book ────────────────────────────────────────────────────
// Authenticated CUSTOMERS book a seat on a ride post.
boardRouter.post("/:id/book", requireAuth, (req: AuthedRequest, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid booking data" });

  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Ride post not found" });
  if (post.status !== "ACTIVE") return res.status(400).json({ error: "This ride is no longer available" });

  // Prevent driver from booking their own post
  if (post.poster_id === req.userId)
    return res.status(403).json({ error: "You cannot book your own ride post" });

  // Check if already booked
  const existing = db.prepare(
    "SELECT id FROM board_bookings WHERE post_id = ? AND customer_id = ? AND status NOT IN ('REJECTED','CANCELLED')"
  ).get(req.params.id, req.userId);
  if (existing) return res.status(409).json({ error: "You have already booked this ride" });

  // Check seat availability
  const bookedRow = db.prepare(
    "SELECT COALESCE(SUM(seats_booked),0) as total FROM board_bookings WHERE post_id = ? AND status IN ('PENDING','CONFIRMED')"
  ).get(req.params.id) as any;
  const available = post.seats - (bookedRow?.total || 0);
  if (parsed.data.seats_booked > available)
    return res.status(400).json({ error: `Only ${available} seat(s) available` });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });

  const id = nanoid();
  db.prepare(`
    INSERT INTO board_bookings (id, post_id, customer_id, customer_name, customer_phone, seats_booked)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.userId, user.name || "Customer", user.phone, parsed.data.seats_booked);

  return res.status(201).json(db.prepare("SELECT * FROM board_bookings WHERE id = ?").get(id));
});

// ── GET /board/:id/bookings ─────────────────────────────────────────────────
// Driver: sees all bookings. Customer: sees only their own booking.
boardRouter.get("/:id/bookings", requireAuth, (req: AuthedRequest, res) => {
  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.poster_id === req.userId) {
    // Driver — return all bookings
    const bookings = db.prepare(
      "SELECT * FROM board_bookings WHERE post_id = ? ORDER BY created_at ASC"
    ).all(req.params.id);
    return res.json(bookings);
  } else {
    // Customer — return only their own
    const booking = db.prepare(
      "SELECT * FROM board_bookings WHERE post_id = ? AND customer_id = ?"
    ).get(req.params.id, req.userId);
    return res.json(booking ? [booking] : []);
  }
});

// ── PATCH /board/:id/bookings/:bId ─────────────────────────────────────────
// Driver confirms or rejects a booking.
boardRouter.patch("/:id/bookings/:bId", requireAuth, (req: AuthedRequest, res) => {
  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.poster_id !== req.userId) return res.status(403).json({ error: "Not your ride" });

  const parsed = bookingStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Status must be CONFIRMED or REJECTED" });

  const booking = db.prepare("SELECT * FROM board_bookings WHERE id = ? AND post_id = ?")
    .get(req.params.bId, req.params.id) as any;
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  db.prepare("UPDATE board_bookings SET status = ? WHERE id = ?")
    .run(parsed.data.status, req.params.bId);

  return res.json(db.prepare("SELECT * FROM board_bookings WHERE id = ?").get(req.params.bId));
});

// ── DELETE /board/:id/bookings/:bId ────────────────────────────────────────
// Customer cancels their own booking.
boardRouter.delete("/:id/bookings/:bId", requireAuth, (req: AuthedRequest, res) => {
  const booking = db.prepare("SELECT * FROM board_bookings WHERE id = ? AND post_id = ?")
    .get(req.params.bId, req.params.id) as any;
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.customer_id !== req.userId) return res.status(403).json({ error: "Not your booking" });

  db.prepare("UPDATE board_bookings SET status = 'CANCELLED' WHERE id = ?").run(req.params.bId);
  return res.json({ success: true });
});

// ── GET /board/:id/messages ─────────────────────────────────────────────────
// Auth: any logged-in user can read messages (driver + customers, even before booking)
boardRouter.get("/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });

  const messages = db.prepare(
    "SELECT * FROM board_messages WHERE post_id = ? ORDER BY created_at ASC"
  ).all(req.params.id);
  return res.json(messages);
});

// ── POST /board/:id/messages ────────────────────────────────────────────────
// Auth: any logged-in user can send messages (driver + customers, even before booking)
boardRouter.post("/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Message is required" });

  const post = db.prepare("SELECT * FROM ride_board WHERE id = ?").get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });

  const isDriver = post.poster_id === req.userId;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });

  const id = nanoid();
  db.prepare(`
    INSERT INTO board_messages (id, post_id, sender_id, sender_name, sender_type, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.userId, user.name || "User", isDriver ? "DRIVER" : "CUSTOMER", parsed.data.message);

  return res.status(201).json(db.prepare("SELECT * FROM board_messages WHERE id = ?").get(id));
});
