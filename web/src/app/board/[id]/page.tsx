"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { boardApi, BoardPost, BoardBooking, BoardMessage } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";
import CustomerBottomNav from "@/components/CustomerBottomNav";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function formatMsgTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return ""; }
}
const VEHICLE_ICONS: Record<string, string> = { HATCHBACK: "🚗", SEDAN: "🚙", SUV: "🚐", LUXURY: "🏎️" };
const BOOKING_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  CONFIRMED: { bg: "rgba(16,185,129,0.12)", text: "#10B981", border: "rgba(16,185,129,0.3)" },
  REJECTED: { bg: "rgba(239,68,68,0.12)", text: "#EF4444", border: "rgba(239,68,68,0.3)" },
  CANCELLED: { bg: "rgba(107,114,128,0.12)", text: "#6B7280", border: "rgba(107,114,128,0.3)" },
};

const G = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes msgIn  { from{opacity:0;transform:scale(0.94) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .section { background:#0D1B2E; border:1px solid #1A2E45; border-radius:20px; padding:20px; box-shadow:0 4px 24px rgba(0,0,0,0.4); transition:border-color 0.2s,box-shadow 0.2s; }
  .section:hover { border-color:rgba(37,99,235,0.22); box-shadow:0 8px 40px rgba(0,0,0,0.5); }
  .chip { display:inline-flex; align-items:center; gap:4px; padding:5px 11px; border-radius:999px; font-size:11px; font-weight:600; background:rgba(26,46,69,0.6); border:1px solid #1A2E45; color:#94A3B8; font-family:var(--font-mono); white-space:nowrap; }
  .slabel { font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#4B5563; font-weight:600; }
  .cbtn { display:flex; align-items:center; justify-content:center; gap:6px; flex:1; padding:10px; border-radius:12px; font-size:13px; font-weight:600; transition:all 0.2s; cursor:pointer; border:none; text-decoration:none; }
  .sbtn { height:38px; width:38px; border-radius:12px; border:1px solid #1A2E45; background:#050D1A; color:white; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
  .sbtn:hover { border-color:rgba(37,99,235,0.5); background:rgba(37,99,235,0.1); }
  .sbtn:active { transform:scale(0.94); }
  .back-btn { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:12px; border:1px solid #1A2E45; background:#0D1B2E; color:#6B7280; font-size:18px; text-decoration:none; transition:all 0.2s; flex-shrink:0; }
  .back-btn:hover { border-color:rgba(37,99,235,0.4); color:#fff; }
  /* Chat bubbles */
  .bubble-mine  { background:linear-gradient(135deg,#2563EB,#06B6D4); color:#fff; border-radius:18px 18px 4px 18px; padding:10px 14px; font-size:14px; line-height:1.55; max-width:78%; word-break:break-word; animation:msgIn 0.2s ease both; }
  .bubble-other { background:#1E3A52; color:#E2E8F0; border-radius:18px 18px 18px 4px; padding:10px 14px; font-size:14px; line-height:1.55; max-width:78%; word-break:break-word; animation:msgIn 0.2s ease both; }
  .chat-wrap::-webkit-scrollbar { width:4px; }
  .chat-wrap::-webkit-scrollbar-thumb { background:#1A2E45; border-radius:4px; }
  .chat-input { flex:1; background:#050D1A; border:1px solid #1A2E45; border-radius:22px; padding:12px 18px; font-size:14px; color:white; outline:none; transition:border-color 0.2s,box-shadow 0.2s; font-family:var(--font-body); }
  .chat-input:focus { border-color:rgba(37,99,235,0.55); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .chat-input::placeholder { color:#4B5563; }
  .send-btn { width:46px; height:46px; border-radius:50%; border:none; flex-shrink:0; background:linear-gradient(135deg,#2563EB,#06B6D4); display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(37,99,235,0.35); }
  .send-btn:disabled { opacity:0.35; cursor:not-allowed; box-shadow:none; }
  .send-btn:not(:disabled):hover { transform:scale(1.08); box-shadow:0 6px 20px rgba(37,99,235,0.5); }
  .send-btn:not(:disabled):active { transform:scale(0.96); }
`;

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [isDriver, setIsDriver] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [post, setPost] = useState<BoardPost | null>(null);
  const [bookings, setBookings] = useState<BoardBooking[]>([]);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [myBooking, setMyBooking] = useState<BoardBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seatsWanted, setSeatsWanted] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatWrapRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const custToken = window.localStorage.getItem("cab8_token");
    const driverToken = window.localStorage.getItem("cab8_driver_token");
    const role = window.localStorage.getItem("cab8_role");
    const uid = window.localStorage.getItem("cab8_user_id");
    if (!custToken && !driverToken) { router.replace("/login"); return; }
    setIsDriver(!!driverToken || role === "DRIVER");
    setUserId(uid);
    setAuthed(true);
  }, [router]);

  const loadAll = useCallback(async () => {
    try {
      const p = await boardApi.getOne(id);
      setPost(p);
      try {
        const bks = await boardApi.getBookings(id);
        setBookings(bks);
        if (!isDriver) setMyBooking(bks.find(b => b.customer_id === userId) || null);
      } catch { }
      try { setMessages(await boardApi.getMessages(id)); } catch { }
    } catch (e: any) { setError(e.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [id, userId, isDriver]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  useEffect(() => {
    if (!authed) return;
    pollRef.current = setInterval(async () => {
      try { setMessages(await boardApi.getMessages(id)); } catch { }
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [authed, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleBook() {
    if (!post) return;
    setBooking(true); setBookError(null);
    try { const b = await boardApi.book(post.id, seatsWanted); setMyBooking(b); setBookSuccess(true); await loadAll(); }
    catch (e: any) { setBookError(e.message || "Booking failed."); }
    finally { setBooking(false); }
  }
  async function handleCancelBooking() {
    if (!myBooking) return;
    try { await boardApi.cancelBooking(post!.id, myBooking.id); setMyBooking(null); await loadAll(); } catch { }
  }
  async function handleBookingAction(bookingId: string, action: "CONFIRMED" | "REJECTED") {
    try { await boardApi.updateBooking(post!.id, bookingId, action); await loadAll(); } catch { }
  }
  async function handleSend() {
    if (!chatText.trim() || !post) return;
    setSending(true);
    const txt = chatText.trim();
    setChatText("");
    try {
      const msg = await boardApi.sendMessage(post.id, txt);
      setMessages(prev => [...prev, msg]);
    } catch { setChatText(txt); }
    finally { setSending(false); inputRef.current?.focus(); }
  }

  const availableSeats = post ? post.seats - (post.booked_seats || 0) : 0;
  const isMyPost = post?.poster_id === userId;
  const isOffering = post?.post_type === "OFFERING";
  const pct = post ? ((post.booked_seats || 0) / post.seats) * 100 : 0;
  const accentColor = isOffering ? "#10B981" : "#F59E0B";
  const accentBg = isOffering ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.10)";
  const accentBorder = isOffering ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)";

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{G}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6B7280", fontSize: 13, fontFamily: "var(--font-mono)" }}>Loading ride…</p>
      </div>
    </main>
  );

  if (error || !post) return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <style>{G}</style>
      <div className="section" style={{ textAlign: "center", padding: "48px 24px" }}>
        <p style={{ fontSize: 40, marginBottom: 10 }}>😕</p>
        <p style={{ color: "#fff", fontWeight: 700, marginBottom: 6 }}>Ride not found</p>
        <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 20 }}>{error}</p>
        <Link href="/board" style={{ display: "inline-flex", padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg,#2563EB,#06B6D4)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>← Back to Board</Link>
      </div>
    </main>
  );

  const PA = (delay: string): React.CSSProperties => ({ animation: "fadeUp 0.4s ease both", animationDelay: delay });

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 96 }}>
      <style>{G}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 560, height: 320, borderRadius: "50%", opacity: 0.18, background: "radial-gradient(ellipse,#2563EB 0%,transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, ...PA("0ms") }}>
          <Link href="/board" className="back-btn">←</Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Ride Details</h1>
            <p style={{ color: "#4B5563", fontSize: 12, margin: 0, fontFamily: "var(--font-mono)" }}>Posted {timeAgo(post.created_at)}</p>
          </div>
          <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}>
            {isOffering ? "🚗 Offering" : "🔍 Looking"}
          </span>
        </div>

        {/* ── Driver Card ── */}
        <div className="section" style={{ marginBottom: 14, background: "linear-gradient(135deg,#0D1B2E 0%,#111827 100%)", ...PA("60ms") }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: "linear-gradient(135deg,#2563EB,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}>🧑‍✈️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: 16, margin: 0 }}>{post.poster_name}</p>
              <p style={{ color: "#6B7280", fontSize: 12, margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>Driver · Verified ✓</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <a href={`https://wa.me/91${post.poster_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="cbtn"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", flex: "none", width: 40, padding: 0 }} title="WhatsApp">💬</a>
              <a href={`tel:${post.poster_phone}`} className="cbtn"
                style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA", flex: "none", width: 40, padding: 0 }} title="Call">📞</a>
            </div>
          </div>
        </div>

        {/* ── Route ── */}
        <div className="section" style={{ marginBottom: 14, ...PA("100ms") }}>
          <p className="slabel" style={{ marginBottom: 14 }}>📍 Route</p>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.6)" }} />
              <div style={{ width: 2, background: "linear-gradient(180deg,#10B981,#06B6D4)", borderRadius: 2, minHeight: 42, opacity: 0.35, margin: "4px 0" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06B6D4", boxShadow: "0 0 8px rgba(6,182,212,0.6)" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ fontSize: 10, color: "#10B981", fontFamily: "var(--font-mono)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>From</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{post.from_text}</p>
              </div>
              <div style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ fontSize: 10, color: "#06B6D4", fontFamily: "var(--font-mono)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>To</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{post.to_text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14, ...PA("140ms") }}>
          <div className="section" style={{ padding: 16 }}>
            <p className="slabel" style={{ marginBottom: 8 }}>Date</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>📅 {formatDate(post.travel_date)}</p>
            {post.travel_time && <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>⏰ {post.travel_time}</p>}
          </div>
          <div className="section" style={{ padding: 16 }}>
            <p className="slabel" style={{ marginBottom: 8 }}>Seats</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>💺 {availableSeats}/{post.seats} left</p>
            <div style={{ height: 5, background: "#1A2E45", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 999, background: pct >= 100 ? "#EF4444" : "linear-gradient(90deg,#2563EB,#06B6D4)", width: `${pct}%`, transition: "width 0.6s ease" }} />
            </div>
            {(post.booked_seats || 0) > 0 && <p style={{ fontSize: 10, color: "#F59E0B", margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>{post.booked_seats} booked</p>}
          </div>
          {post.price_per_seat != null && (
            <div className="section" style={{ padding: 16 }}>
              <p className="slabel" style={{ marginBottom: 8 }}>Price</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>💰 ₹{post.price_per_seat.toLocaleString("en-IN")}</p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>per seat</p>
            </div>
          )}
          {post.vehicle_type && (
            <div className="section" style={{ padding: 16 }}>
              <p className="slabel" style={{ marginBottom: 8 }}>Vehicle</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{VEHICLE_ICONS[post.vehicle_type] || "🚗"} {post.vehicle_type}</p>
            </div>
          )}
        </div>

        {/* ── Chips ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, ...PA("165ms") }}>
          <span className="chip">📅 {formatDate(post.travel_date)}</span>
          {post.travel_time && <span className="chip">⏰ {post.travel_time}</span>}
          {post.vehicle_type && <span className="chip">{VEHICLE_ICONS[post.vehicle_type] || "🚗"} {post.vehicle_type}</span>}
          {post.price_per_seat != null && <span className="chip" style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>₹{post.price_per_seat.toLocaleString("en-IN")}/seat</span>}
        </div>

        {/* ── Description / Luggage / Notes ── */}
        {post.description && (
          <div className="section" style={{ marginBottom: 14, ...PA("180ms") }}>
            <p className="slabel" style={{ marginBottom: 10 }}>📝 Trip Description</p>
            <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{post.description}</p>
          </div>
        )}
        {post.luggage_info && (
          <div className="section" style={{ marginBottom: 14, ...PA("190ms") }}>
            <p className="slabel" style={{ marginBottom: 10 }}>🎒 Luggage & Items</p>
            <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{post.luggage_info}</p>
          </div>
        )}
        {post.notes && (
          <div className="section" style={{ marginBottom: 14, background: "rgba(37,99,235,0.04)", borderColor: "rgba(37,99,235,0.18)", ...PA("200ms") }}>
            <p className="slabel" style={{ marginBottom: 10 }}>💬 Notes</p>
            <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{post.notes}</p>
          </div>
        )}

        {/* ── Co-Passengers ── */}
        {post.passengers && post.passengers.length > 0 && (
          <div className="section" style={{ marginBottom: 14, ...PA("210ms") }}>
            <p className="slabel" style={{ marginBottom: 14 }}>Co-Passengers ({post.passengers.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {post.passengers.map(p => {
                const c = BOOKING_COLORS[p.status] || BOOKING_COLORS.PENDING;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid #1A2E45", borderRadius: 14, padding: "10px 12px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg,#1A2E45,#0D1B2E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.customer_name}</p>
                      <p style={{ fontSize: 11, color: "#6B7280", margin: "1px 0 0", fontFamily: "var(--font-mono)" }}>💺 {p.seats_booked} seat{p.seats_booked !== 1 ? "s" : ""}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, flexShrink: 0, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontFamily: "var(--font-mono)" }}>{p.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Driver: Booking Requests ── */}
        {isDriver && isMyPost && bookings.length > 0 && (
          <div className="section" style={{ marginBottom: 14, ...PA("220ms") }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p className="slabel">Booking Requests</p>
              {bookings.filter(b => b.status === "PENDING").length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", fontFamily: "var(--font-mono)" }}>
                  {bookings.filter(b => b.status === "PENDING").length} pending
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookings.map(b => {
                const c = BOOKING_COLORS[b.status] || BOOKING_COLORS.PENDING;
                return (
                  <div key={b.id} style={{ borderRadius: 16, border: "1px solid #1A2E45", background: "#050D1A", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: "#1A2E45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.customer_name}</p>
                        <p style={{ fontSize: 12, color: "#6B7280", margin: "1px 0 0" }}>💺 {b.seats_booked} seat{b.seats_booked !== 1 ? "s" : ""}{post.price_per_seat != null && ` · ₹${(b.seats_booked * post.price_per_seat).toLocaleString("en-IN")}`}</p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, flexShrink: 0, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontFamily: "var(--font-mono)" }}>{b.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`tel:${b.customer_phone}`} className="cbtn" style={{ background: "rgba(26,46,69,0.7)", border: "1px solid #1A2E45", color: "#9CA3AF" }}>📞 Call</a>
                      <a href={`https://wa.me/91${b.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="cbtn" style={{ background: "rgba(26,46,69,0.7)", border: "1px solid #1A2E45", color: "#9CA3AF" }}>💬 WhatsApp</a>
                      {b.status === "PENDING" && (
                        <>
                          <button onClick={() => handleBookingAction(b.id, "CONFIRMED")} className="cbtn" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>✅ Confirm</button>
                          <button onClick={() => handleBookingAction(b.id, "REJECTED")} className="cbtn" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>❌ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Customer: Book a Seat ── */}
        {!isDriver && !isMyPost && post.status === "ACTIVE" && (
          <div className="section" style={{ marginBottom: 14, ...PA("230ms"), background: "linear-gradient(135deg,#0D1B2E 0%,rgba(37,99,235,0.05) 100%)", borderColor: "rgba(37,99,235,0.2)" }}>
            {myBooking ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p className="slabel">Your Booking</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: BOOKING_COLORS[myBooking.status]?.bg, color: BOOKING_COLORS[myBooking.status]?.text, border: `1px solid ${BOOKING_COLORS[myBooking.status]?.border}`, fontFamily: "var(--font-mono)" }}>{myBooking.status}</span>
                </div>
                <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                  <p style={{ fontSize: 15, color: "#fff", fontWeight: 600, margin: "0 0 4px" }}>{myBooking.seats_booked} seat{myBooking.seats_booked !== 1 ? "s" : ""} booked</p>
                  {post.price_per_seat != null && <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Total: <strong style={{ color: "#60A5FA" }}>₹{(myBooking.seats_booked * post.price_per_seat).toLocaleString("en-IN")}</strong></p>}
                </div>
                {myBooking.status === "PENDING" && <p style={{ fontSize: 13, color: "#F59E0B", margin: "0 0 12px" }}>⏳ Waiting for driver confirmation…</p>}
                {myBooking.status === "CONFIRMED" && <p style={{ fontSize: 13, color: "#10B981", margin: "0 0 12px" }}>✅ Seat confirmed! Chat below to coordinate.</p>}
                {(myBooking.status === "PENDING" || myBooking.status === "CONFIRMED") && (
                  <button onClick={handleCancelBooking} style={{ width: "100%", padding: 12, borderRadius: 14, fontSize: 13, fontWeight: 700, background: "transparent", border: "1px solid #1A2E45", color: "#6B7280", cursor: "pointer", transition: "all 0.2s" }}>Cancel Booking</button>
                )}
              </div>
            ) : availableSeats <= 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: 40, marginBottom: 8 }}>🚫</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Fully Booked</p>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No seats available for this ride.</p>
              </div>
            ) : (
              <div>
                <p className="slabel" style={{ marginBottom: 16 }}>🎟️ Book Your Seat</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, color: "#fff", fontWeight: 600, margin: 0 }}>Number of seats</p>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>{availableSeats} available</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button type="button" onClick={() => setSeatsWanted(s => Math.max(1, s - 1))} className="sbtn">−</button>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#fff", minWidth: 28, textAlign: "center" }}>{seatsWanted}</span>
                    <button type="button" onClick={() => setSeatsWanted(s => Math.min(availableSeats, s + 1))} className="sbtn">+</button>
                  </div>
                </div>
                {post.price_per_seat != null && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>Total amount</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#60A5FA" }}>₹{(seatsWanted * post.price_per_seat).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {bookError && <p style={{ fontSize: 13, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", margin: "0 0 12px" }}>⚠️ {bookError}</p>}
                {bookSuccess && <p style={{ fontSize: 13, color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "10px 14px", margin: "0 0 12px" }}>✅ Request sent! Waiting for driver.</p>}
                <button onClick={handleBook} disabled={booking || availableSeats <= 0} style={{
                  width: "100%", padding: "15px", borderRadius: 16,
                  fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "#fff",
                  background: "linear-gradient(135deg,#2563EB,#06B6D4)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
                  border: "none", cursor: booking ? "not-allowed" : "pointer",
                  opacity: booking ? 0.7 : 1, transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {booking
                    ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Sending…</>
                    : `🎟️ Request ${seatsWanted} Seat${seatsWanted !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            CHAT SECTION — redesigned
        ═══════════════════════════════════════════ */}
        <div className="section" style={{ padding: 0, overflow: "hidden", ...PA("265ms") }}>

          {/* Chat Header */}
          <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Live dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.7)", flexShrink: 0 }} />
              <p className="slabel">{isMyPost ? "Chat with Passengers" : "Chat with Driver"}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!isDriver && !isMyPost && !myBooking && (
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 999, fontFamily: "var(--font-mono)", color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>Ask before booking</span>
              )}
              {myBooking?.status === "CONFIRMED" && (
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 999, fontFamily: "var(--font-mono)", color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>✓ Confirmed</span>
              )}
              <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "var(--font-mono)" }}>{messages.length} msg{messages.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#1A2E45", margin: "12px 0 0" }} />

          {/* Messages area */}
          <div
            ref={chatWrapRef}
            className="chat-wrap"
            style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 200, maxHeight: 360, overflowY: "auto", padding: "16px 16px 8px" }}
          >
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: 18, background: "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(6,182,212,0.1))", border: "1px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>{!isMyPost ? "Start the conversation!" : "Waiting for passengers…"}</p>
                <p style={{ fontSize: 12, color: "#4B5563", margin: 0, textAlign: "center" }}>{!isMyPost ? "Ask the driver anything before booking." : "Passengers will message you here."}</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.sender_id === userId;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const showName = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                const showAvatar = !isMine && (i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id);
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", marginBottom: 2 }}>
                    {showName && (
                      <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, paddingLeft: 44, fontFamily: "var(--font-mono)" }}>
                        {msg.sender_type === "DRIVER" ? "🚗" : "👤"} {msg.sender_name}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMine ? "row-reverse" : "row" }}>
                      {/* Avatar placeholder for spacing */}
                      {!isMine && (
                        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: showAvatar ? "linear-gradient(135deg,#1A2E45,#2D4A65)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                          {showAvatar ? (msg.sender_type === "DRIVER" ? "🚗" : "👤") : ""}
                        </div>
                      )}
                      <div className={isMine ? "bubble-mine" : "bubble-other"}>{msg.message}</div>
                    </div>
                    <p style={{ fontSize: 10, color: "#374151", marginTop: 3, fontFamily: "var(--font-mono)", paddingLeft: isMine ? 0 : 44, paddingRight: isMine ? 4 : 0 }}>
                      {formatMsgTime(msg.created_at)} · {timeAgo(msg.created_at)}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #1A2E45", background: "rgba(5,13,26,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Sender avatar */}
              <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg,#2563EB,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 10px rgba(37,99,235,0.3)" }}>
                {isDriver ? "🚗" : "👤"}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder={isMyPost ? "Reply to passengers…" : "Message the driver…"}
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="chat-input"
              />
              <button onClick={handleSend} disabled={sending || !chatText.trim()} className="send-btn">
                {sending
                  ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      {isDriver ? (
        <DriverBottomNav />
      ) : (
        <CustomerBottomNav />
      )}
    </main>
  );
}
