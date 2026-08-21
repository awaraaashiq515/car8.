"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UnionBottomNav from "@/components/UnionBottomNav";
import UnionFleetMap from "@/components/UnionFleetMap";
import { api, UnionBooking, VehicleType, RideMessage } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Application {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  experience: string;
  licenseNo?: string;
  make?: string;
  model?: string;
  year?: string;
  docs: string[];
  note?: string;
  applied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  source?: string;
}

interface UnionMeta {
  name: string;
  short: string;
  city: string;
  president: string;
  secretary: string;
  founded: string;
}

interface UnionDriverMember {
  id: string;
  name: string;
  phone: string;
  city: string;
  district?: string;
  tehsil?: string;
  stand_name?: string;
  village?: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_make?: string;
  vehicle_model?: string;
  is_online: number;
  rating_avg: number;
  rate_per_km?: number;
  current_lat?: number;
  current_lng?: number;
  avatar_photo?: string;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }

  .u-card {
    background: #0D1B2E;
    border-radius: 20px;
    border: 1px solid #1A2E45;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .u-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
  .u-stat {
    border-radius: 20px; padding: 18px;
    transition: transform 0.2s, box-shadow 0.2s; cursor: default;
    animation: fadeUp 0.4s ease both;
  }
  .u-stat:hover { transform: translateY(-3px); }
`;

// ── Stat card component ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, change, changePositive, accent, bg, border, delay }:
  { icon: string; label: string; value: string | number; change: string;
    changePositive: boolean | null; accent: string; bg: string; border: string; delay: number }) {
  return (
    <div className="u-stat" style={{ background: bg, border: `1px solid ${border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
          color: changePositive === true ? "#10B981" : changePositive === false ? "#EF4444" : "#6B7280",
          background: changePositive === true ? "rgba(16,185,129,0.1)" : changePositive === false ? "rgba(239,68,68,0.1)" : "rgba(107,114,128,0.1)",
          border: `1px solid ${changePositive === true ? "rgba(16,185,129,0.25)" : changePositive === false ? "rgba(239,68,68,0.2)" : "rgba(107,114,128,0.2)"}`,
          borderRadius: 999, padding: "2px 8px",
        }}>
          {change}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1, animation: "countUp 0.4s ease both" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>{label}</div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Web Audio API Dispatch Alert Sound Synthesizer ─────────────────────────────
function playDispatchChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 3-tone harmonic dispatch alert: 659Hz (E5) -> 830Hz (G#5) -> 987Hz (B5)
    const tones = [
      { freq: 659.25, time: now,        duration: 0.16, gain: 0.35 },
      { freq: 830.61, time: now + 0.12, duration: 0.20, gain: 0.40 },
      { freq: 987.77, time: now + 0.25, duration: 0.50, gain: 0.45 },
    ];

    tones.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(gain, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  } catch {
    // browser audio restrictions
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function UnionDashboard() {
  const router = useRouter();

  // ── Auth & identity
  const [unionName,     setUnionName]     = useState("Taxi Union");
  const [unionId,       setUnionId]       = useState("HPTU");
  const [unionMeta,     setUnionMeta]     = useState<UnionMeta | null>(null);
  const [showNotice,    setShowNotice]    = useState(true);
  const [authed,        setAuthed]        = useState(false);

  // ── Active Dashboard Tab
  const [activeTab,     setActiveTab]     = useState<"bookings" | "radar" | "overview">("bookings");
  const [bookingFilter, setBookingFilter] = useState<string>("ALL");

  // ── Dynamic data from backend & localStorage
  const [bookings,      setBookings]      = useState<UnionBooking[]>([]);
  const [members,       setMembers]       = useState<UnionDriverMember[]>([]);
  const [apps,          setApps]          = useState<Application[]>([]);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());

  // ── Dispatch Modal state
  const [dispatchRide,  setDispatchRide]  = useState<UnionBooking | null>(null);
  const [driverSearch,  setDriverSearch]  = useState("");
  const [dispatching,   setDispatching]   = useState(false);
  const [toastMsg,      setToastMsg]      = useState<string | null>(null);
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState<UnionBooking | null>(null);

  // ── Live Customer Chat Drawer state
  const [chatRide,      setChatRide]      = useState<UnionBooking | null>(null);
  const [chatMessages,  setChatMessages]  = useState<RideMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [chatSending,   setChatSending]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);


  // ── Computed stats
  const pending   = apps.filter(a => a.status === "PENDING").length;
  const approved  = apps.filter(a => a.status === "APPROVED").length;
  const rejected  = apps.filter(a => a.status === "REJECTED").length;
  const totalApps = apps.length;

  const activeBookings = bookings.filter(b => b.status === "SEARCHING" || b.status === "DRIVER_ASSIGNED" || b.status === "CONFIRMED" || b.status === "ARRIVED" || b.status === "ONGOING").length;
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;
  const totalVolume = bookings.reduce((sum, b) => sum + (b.estimated_fare || 0), 0);

  // Fleet from approved apps
  const fleetMap: Record<string, number> = {};
  apps.filter(a => a.status === "APPROVED").forEach(a => {
    fleetMap[a.vehicle] = (fleetMap[a.vehicle] || 0) + 1;
  });
  const fleetTotal = Object.values(fleetMap).reduce((s, v) => s + v, 0);
  const fleetBreakdown = [
    { type: "Hatchback", icon: "🚗", color: "#2563EB" },
    { type: "Sedan",     icon: "🚙", color: "#10B981" },
    { type: "SUV",       icon: "🚐", color: "#F59E0B" },
    { type: "Luxury",    icon: "🏎️", color: "#A855F7" },
  ].map(f => ({
    ...f,
    count: fleetMap[f.type] || 0,
    pct: fleetTotal > 0 ? Math.round(((fleetMap[f.type] || 0) / fleetTotal) * 100) : 0,
  })).filter(f => f.count > 0);

  // Revenue: ₹500 dues per approved member
  const revenue = approved * 500;
  const fmtRevenue = revenue >= 100000
    ? `₹${(revenue / 100000).toFixed(1)}L`
    : revenue >= 1000
      ? `₹${(revenue / 1000).toFixed(1)}K`
      : `₹${revenue}`;

  // Activity feed
  const activityFeed = apps.slice(0, 6).map(a => ({
    icon: a.status === "APPROVED" ? "✅" : a.status === "REJECTED" ? "❌" : "🆕",
    text: a.status === "APPROVED"
      ? `${a.name} approved as union member`
      : a.status === "REJECTED"
        ? `${a.name}'s application rejected`
        : `New join request from ${a.name} (${a.city})`,
    time: timeAgo(a.applied),
    color: a.status === "APPROVED" ? "#10B981" : a.status === "REJECTED" ? "#EF4444" : "#F59E0B",
  }));

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    if (typeof window === "undefined") return;

    // Auth check
    const token = window.localStorage.getItem("cab8_union_token");
    if (!token) { router.replace("/union/login"); return; }
    setAuthed(true);

    const name = window.localStorage.getItem("cab8_union_name") || "Taxi Union";
    const id   = window.localStorage.getItem("cab8_union_id")   || "HPTU";
    setUnionName(name);
    setUnionId(id);

    const meta = window.localStorage.getItem("union_meta");
    if (meta) setUnionMeta(JSON.parse(meta));

    // Applications from localStorage
    const saved: Application[] = JSON.parse(
      window.localStorage.getItem("union_applications") || "[]"
    );
    setApps(saved);

    // Live Bookings from backend
    api.getUnionBookings(id)
      .then((res) => {
        if (res && res.bookings) {
          // Check if a new active/searching booking arrived
          const currentBookings = res.bookings;
          const currentSearching = currentBookings.filter(b => b.status === "SEARCHING" || (b.status as string) === "PENDING_DISPATCH");

          setBookings((prev) => {
            const prevIds = new Set(prev.map(p => p.id));
            if (prev.length > 0) {
              const brandNew = currentSearching.find(b => !prevIds.has(b.id));
              if (brandNew) {
                // Trigger Sound Alert & Visual Notification
                playDispatchChime();
                setNewBookingAlert(brandNew);
                setTimeout(() => setNewBookingAlert(null), 8000);
              }
            }
            return currentBookings;
          });
        }
      })
      .catch(() => {});

    // Drivers list for dispatch
    api.getUnionMembers(id)
      .then((res) => {
        if (res && res.members) setMembers(res.members);
      })
      .catch(() => {});

    setLastRefresh(new Date());
  }, [router]);

  // Poll chat messages while chat modal is open
  useEffect(() => {
    if (!chatRide) return;
    let cancel = false;

    const loadChat = () => {
      api.getUnionBookingMessages(chatRide.id)
        .then((msgs) => {
          if (!cancel && msgs) setChatMessages(msgs);
        })
        .catch(() => {});
    };

    loadChat();
    const interval = setInterval(loadChat, 2000);
    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [chatRide]);

  useEffect(() => {
    if (chatRide) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatRide]);

  async function handleSendUnionMessage(textOverride?: string) {
    const text = (textOverride || chatInput).trim();
    if (!text || !chatRide || chatSending) return;
    setChatSending(true);
    setChatInput("");
    try {
      const newMsg = await api.sendUnionBookingMessage(chatRide.id, text, `${unionName} Desk`);
      setChatMessages((prev) => [...prev, newMsg]);
      // Also update latest message on card
      setBookings((prev) => prev.map((b) => b.id === chatRide.id ? { ...b, latest_message: text, latest_message_role: "DRIVER", message_count: (b.message_count || 0) + 1 } : b));
    } catch (e: any) {
      console.error("Failed to send message:", e);
    } finally {
      setChatSending(false);
    }
  }

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 3000); // Live poll every 3s
    return () => clearInterval(t);
  }, [loadData]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cab8_union_token");
      window.localStorage.removeItem("cab8_union_name");
      window.localStorage.removeItem("cab8_union_id");
    }
    router.replace("/union/login");
  }

  // ── Dispatch driver to booking
  async function handleAssignDriver(driverId: string) {
    if (!dispatchRide) return;
    setDispatching(true);
    try {
      await api.assignUnionDriver(dispatchRide.id, driverId);
      setToastMsg(`✅ Driver successfully assigned to booking #${dispatchRide.id.slice(-5)}`);
      setTimeout(() => setToastMsg(null), 3500);
      setDispatchRide(null);
      loadData();
    } catch (e: any) {
      setToastMsg(`⚠️ Failed to assign driver: ${e.message}`);
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setDispatching(false);
    }
  }

  // ── Update booking status
  async function handleUpdateStatus(rideId: string, newStatus: string) {
    try {
      await api.updateUnionBookingStatus(rideId, newStatus);
      setToastMsg(`✓ Status updated to ${newStatus}`);
      setTimeout(() => setToastMsg(null), 3000);
      loadData();
    } catch (e: any) {
      setToastMsg(`⚠️ Error updating status: ${e.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  }

  if (!authed) return null;

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "ALL") return true;
    if (bookingFilter === "ACTIVE") return b.status === "SEARCHING" || b.status === "DRIVER_ASSIGNED" || b.status === "CONFIRMED";
    return b.status === bookingFilter;
  });

  const filteredDrivers = members.filter((m) => {
    if (!driverSearch.trim()) return true;
    const q = driverSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.vehicle_number.toLowerCase().includes(q) ||
      (m.vehicle_make && m.vehicle_make.toLowerCase().includes(q))
    );
  });

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 110 }}>
      <style>{G}</style>

      {/* Toast message */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 150, padding: "12px 20px", borderRadius: 14,
          background: "#0D1B2E", border: "1px solid #10B981", color: "#E2E8F0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)", fontSize: 13, fontWeight: 600,
          fontFamily: "var(--font-body)", animation: "fadeUp 0.3s ease both"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 320, borderRadius: "50%", opacity: 0.12,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: "-10%",
          width: 400, height: 400, borderRadius: "50%", opacity: 0.06,
          background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 540, margin: "0 auto", padding: "20px 16px 8px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 24px rgba(245,158,11,0.4)",
            }}>🔰</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                Union <span style={{ color: "#F59E0B" }}>Dashboard</span>
              </h1>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontFamily: "var(--font-mono)" }}>
                {unionName} · {unionId}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Sound Toggle Button */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playDispatchChime();
              }}
              title={soundEnabled ? "Sound Alerts: Enabled (Click to test/mute)" : "Sound Alerts: Muted"}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                background: soundEnabled ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)",
                border: `1px solid ${soundEnabled ? "#F59E0B" : "#475569"}`,
                color: soundEnabled ? "#FDE68A" : "#94A3B8",
              }}
            >
              <span>{soundEnabled ? "🔔 Sound ON" : "🔕 Muted"}</span>
            </button>

            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, color: "#10B981", fontFamily: "var(--font-mono)", fontWeight: 600,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: "#10B981",
                boxShadow: "0 0 8px rgba(16,185,129,0.8)", animation: "pulse 2s ease infinite",
              }} />
              LIVE
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "5px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── New Booking Incoming Alert Banner (with Sound Effect) ── */}
        {newBookingAlert && (
          <div style={{
            background: "linear-gradient(135deg, rgba(217,119,6,0.28), rgba(245,158,11,0.15))",
            border: "2px solid #F59E0B",
            borderRadius: 16, padding: "14px 16px", marginBottom: 16,
            boxShadow: "0 0 30px rgba(245,158,11,0.35)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            animation: "fadeUp 0.3s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "#F59E0B",
                color: "#1A0A00", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, flexShrink: 0, animation: "pulse 1s infinite",
              }}>
                🔔
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#FDE68A", margin: 0 }}>
                  NEW LIVE BOOKING RECEIVED!
                </p>
                <p style={{ fontSize: 11, color: "#E2E8F0", margin: "2px 0 0" }} className="truncate">
                  #{newBookingAlert.id.slice(-6)} · {newBookingAlert.pickup_text.split(",")[0]} → {newBookingAlert.drop_text.split(",")[0]} (₹{newBookingAlert.estimated_fare})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setDispatchRide(newBookingAlert);
                setNewBookingAlert(null);
              }}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 800,
                fontFamily: "var(--font-display)", cursor: "pointer",
                background: "linear-gradient(135deg, #10B981, #06B6D4)",
                border: "none", color: "#fff", flexShrink: 0,
                boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
              }}
            >
              ⚡ Assign Now →
            </button>
          </div>
        )}

        {/* ── 3-Way Tab Switcher: Bookings | GPS Radar | Overview ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6,
          background: "#0D1B2E", padding: 4, borderRadius: 16,
          border: "1px solid #1A2E45", marginBottom: 16,
        }}>
          <button
            onClick={() => setActiveTab("bookings")}
            style={{
              padding: "10px 8px", borderRadius: 12, border: "none",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: activeTab === "bookings" ? "linear-gradient(135deg, #D97706, #F59E0B)" : "transparent",
              color: activeTab === "bookings" ? "#1A0A00" : "#94A3B8",
              boxShadow: activeTab === "bookings" ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span>🚖</span>
            <span>Bookings</span>
            {activeBookings > 0 && (
              <span style={{
                background: activeTab === "bookings" ? "#1A0A00" : "#F59E0B",
                color: activeTab === "bookings" ? "#F59E0B" : "#1A0A00",
                fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 999,
              }}>
                {activeBookings}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("radar")}
            style={{
              padding: "10px 8px", borderRadius: 12, border: "none",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: activeTab === "radar" ? "linear-gradient(135deg, #059669, #10B981)" : "transparent",
              color: activeTab === "radar" ? "#fff" : "#94A3B8",
              boxShadow: activeTab === "radar" ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span>🗺️</span>
            <span>GPS Radar</span>
            <span style={{
              background: activeTab === "radar" ? "rgba(255,255,255,0.2)" : "rgba(16,185,129,0.2)",
              color: activeTab === "radar" ? "#fff" : "#34D399",
              fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 999,
            }}>
              {members.filter(m => m.is_online === 1).length} Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "10px 8px", borderRadius: 12, border: "none",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: activeTab === "overview" ? "linear-gradient(135deg, #2563EB, #06B6D4)" : "transparent",
              color: activeTab === "overview" ? "#fff" : "#94A3B8",
              boxShadow: activeTab === "overview" ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span>📊</span>
            <span>Fleet & Stats</span>
            {pending > 0 && (
              <span style={{
                background: "#EF4444", color: "#fff",
                fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 999,
              }}>
                {pending}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1: LIVE BOOKINGS & DISPATCH CONSOLE
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>

            {/* Quick KPI stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              <div className="u-card" style={{ padding: "12px 14px", borderColor: "rgba(245,158,11,0.3)" }}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8" }}>ACTIVE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B", marginTop: 2 }}>{activeBookings}</div>
              </div>
              <div className="u-card" style={{ padding: "12px 14px", borderColor: "rgba(16,185,129,0.3)" }}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8" }}>COMPLETED</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981", marginTop: 2 }}>{completedBookings}</div>
              </div>
              <div className="u-card" style={{ padding: "12px 14px", borderColor: "rgba(37,99,235,0.3)" }}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8" }}>TOTAL FARES</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#60A5FA", marginTop: 2 }}>₹{totalVolume}</div>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 10 }}>
              {[
                { id: "ALL", label: `All (${bookings.length})` },
                { id: "ACTIVE", label: `Active (${activeBookings})` },
                { id: "SEARCHING", label: "Needs Driver" },
                { id: "DRIVER_ASSIGNED", label: "Dispatched" },
                { id: "COMPLETED", label: "Completed" },
                { id: "CANCELLED", label: `Cancelled (${bookings.filter(b => b.status === "CANCELLED").length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBookingFilter(f.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    fontFamily: "var(--font-mono)", cursor: "pointer", whiteSpace: "nowrap",
                    background: bookingFilter === f.id ? "rgba(245,158,11,0.2)" : "#0D1B2E",
                    border: `1px solid ${bookingFilter === f.id ? "#F59E0B" : "#1A2E45"}`,
                    color: bookingFilter === f.id ? "#FDE68A" : "#94A3B8",
                    transition: "all 0.2s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Booking Cards List */}
            {filteredBookings.length === 0 ? (
              <div className="u-card" style={{ padding: "36px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🚖</div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                  No Bookings in this Category
                </p>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  When customers book via {unionName} on TaxiMint, live requests appear here instantly.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBookings.map((b) => {
                  const isSearching = b.status === "SEARCHING";
                  const isAssigned = b.status === "DRIVER_ASSIGNED" || b.status === "CONFIRMED" || b.status === "ARRIVED" || b.status === "ONGOING";
                  const isCompleted = b.status === "COMPLETED";
                  const isCancelled = b.status === "CANCELLED";

                  return (
                    <div
                      key={b.id}
                      className="u-card"
                      style={{
                        padding: 16,
                        opacity: isCancelled ? 0.75 : 1,
                        borderLeft: isSearching
                          ? "4px solid #F59E0B"
                          : isAssigned
                          ? "4px solid #3B82F6"
                          : isCompleted
                          ? "4px solid #10B981"
                          : isCancelled
                          ? "4px solid #EF4444"
                          : "4px solid #64748B",
                      }}
                    >
                      {/* Top status line */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            background: isSearching
                              ? "rgba(245,158,11,0.15)"
                              : isAssigned
                              ? "rgba(59,130,246,0.15)"
                              : isCompleted
                              ? "rgba(16,185,129,0.15)"
                              : isCancelled
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(100,116,139,0.15)",
                            color: isSearching
                              ? "#F59E0B"
                              : isAssigned
                              ? "#60A5FA"
                              : isCompleted
                              ? "#34D399"
                              : isCancelled
                              ? "#EF4444"
                              : "#94A3B8",
                            border: `1px solid ${
                              isSearching
                                ? "rgba(245,158,11,0.3)"
                                : isAssigned
                                ? "rgba(59,130,246,0.3)"
                                : isCompleted
                                ? "rgba(16,185,129,0.3)"
                                : isCancelled
                                ? "rgba(239,68,68,0.3)"
                                : "rgba(100,116,139,0.3)"
                            }`,
                          }}>
                            {isSearching ? "⏳ PENDING DISPATCH" : isCancelled ? "✕ CANCELLED" : b.status}
                          </span>
                          <span style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--font-mono)" }}>
                            #{b.id.slice(-6)}
                          </span>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "#fff" }}>
                            ₹{b.estimated_fare}
                          </span>
                          <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4, fontFamily: "var(--font-mono)" }}>
                            ({b.distance_km} km)
                          </span>
                        </div>
                      </div>

                      {/* Route */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, padding: "8px 10px", background: "rgba(5,13,26,0.6)", borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 500 }} className="truncate">
                            {b.pickup_text}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#94A3B8" }} className="truncate">
                            {b.drop_text}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info & Vehicle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                        <div>
                          👤 <strong style={{ color: "#fff" }}>{b.customer_name || "Customer"}</strong>
                          {b.customer_phone && (
                            <a
                              href={`tel:${b.customer_phone}`}
                              style={{ marginLeft: 6, color: "#38BDF8", textDecoration: "none" }}
                            >
                              📞 {b.customer_phone}
                            </a>
                          )}
                        </div>
                        <div>
                          🚗 <span style={{ color: "#FDE68A", fontWeight: 600 }}>{b.vehicle_type}</span>
                        </div>
                      </div>

                      {/* 💬 Customer Latest Message Snippet (if any) */}
                      {b.latest_message && (
                        <div
                          onClick={() => setChatRide(b)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                            background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)",
                            marginBottom: 10, transition: "all 0.2s",
                          }}
                        >
                          <span style={{ fontSize: 13 }}>💬</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 9, color: "#22D3EE", fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                              {b.latest_message_role === "CUSTOMER" ? "Customer Message" : "Desk Reply"}:
                            </span>
                            <p style={{ fontSize: 11, color: "#E2E8F0", margin: "1px 0 0", fontStyle: "italic" }} className="truncate">
                              &ldquo;{b.latest_message}&rdquo;
                            </p>
                          </div>
                          <span style={{ fontSize: 10, color: "#22D3EE", fontWeight: 700, whiteSpace: "nowrap" }}>
                            Open Chat →
                          </span>
                        </div>
                      )}

                      {/* Assigned Driver Status or Dispatch Action */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid #1A2E45" }}>
                        {isCancelled ? (
                          <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>
                            ✕ Booking was cancelled by customer
                          </div>
                        ) : b.driver_name ? (
                          <div style={{ fontSize: 11 }}>
                            👨‍✈️ <strong style={{ color: "#34D399" }}>{b.driver_name}</strong>
                            {b.vehicle_number && (
                              <span style={{ color: "#94A3B8", marginLeft: 6, fontFamily: "var(--font-mono)" }}>
                                ({b.vehicle_number})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>
                            ⚠️ No driver assigned
                          </div>
                        )}

                        {!isCancelled && (
                          <div style={{ display: "flex", gap: 6 }}>
                            {/* Chat with Customer button */}
                            <button
                              onClick={() => setChatRide(b)}
                              style={{
                                padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                                fontFamily: "var(--font-mono)", cursor: "pointer",
                                background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)",
                                color: "#22D3EE", display: "flex", alignItems: "center", gap: 4,
                              }}
                            >
                              <span>💬</span>
                              <span>Chat</span>
                              {(b.message_count || 0) > 0 && (
                                <span style={{
                                  background: "#06B6D4", color: "#050D1A",
                                  fontSize: 9, fontWeight: 900, padding: "0 4px", borderRadius: 999,
                                }}>
                                  {b.message_count}
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => setDispatchRide(b)}
                              style={{
                                padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                                fontFamily: "var(--font-display)", cursor: "pointer",
                                background: "linear-gradient(135deg, #D97706, #F59E0B)",
                                border: "none", color: "#1A0A00",
                              }}
                            >
                              {b.driver_name ? "Change Driver" : "⚡ Assign Driver"}
                            </button>

                            {isSearching && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                                  style={{
                                    padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                                    color: "#10B981", cursor: "pointer",
                                  }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                                  style={{
                                    padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                                    color: "#EF4444", cursor: "pointer",
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              </>
                            )}

                            {isAssigned && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                                style={{
                                  padding: "6px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                                  color: "#10B981", cursor: "pointer",
                                }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: LIVE FLEET GPS RADAR & DRIVER LOCATIONS MAP
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "radar" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <UnionFleetMap
              drivers={members}
              bookings={bookings.map(b => ({
                id: b.id,
                pickup_text: b.pickup_text,
                drop_text: b.drop_text,
                estimated_fare: b.estimated_fare,
                vehicle_type: b.vehicle_type,
                status: b.status,
              }))}
              height="440px"
              onDispatchToDriver={(driver) => {
                // If there is an active searching ride, dispatch to this driver
                const targetRide = bookings.find(b => b.status === "SEARCHING");
                if (targetRide) {
                  setDispatchRide(targetRide);
                  handleAssignDriver(driver.id);
                } else {
                  setToastMsg(`Driver ${driver.name} is selected and ready for incoming bookings.`);
                  setTimeout(() => setToastMsg(null), 3000);
                }
              }}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: FLEET & MEMBERS OVERVIEW
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>

            {/* Union Identity Bar */}
            <div className="u-card" style={{ padding: "14px 18px", marginBottom: 16, borderColor: "rgba(245,158,11,0.22)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                    {unionMeta?.name || unionName}
                  </p>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                    🆔 {unionId}
                    {unionMeta?.founded && ` · Est. ${unionMeta.founded}`}
                    {unionMeta?.president && ` · ${unionMeta.president}`}
                  </p>
                </div>
                <Link href="/union/profile" style={{
                  fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: "#F59E0B", textDecoration: "none",
                  padding: "5px 12px", borderRadius: 999,
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                }}>
                  Edit →
                </Link>
              </div>
            </div>

            {/* NEW APPS BANNER */}
            {pending > 0 && (
              <div style={{
                background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 14, padding: "10px 14px", marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}>
                <p style={{ fontSize: 12, color: "#10B981", margin: 0, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease infinite", display: "inline-block", flexShrink: 0 }} />
                  <strong>{pending} driver application{pending > 1 ? "s" : ""}</strong> waiting for your review!
                </p>
                <Link href="/union/approve" style={{
                  flexShrink: 0, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: "#10B981", textDecoration: "none",
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                }}>
                  Review →
                </Link>
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard icon="👥" label="Total Applications" value={totalApps}
                change={totalApps === 0 ? "No data yet" : `${approved} approved`}
                changePositive={approved > 0 ? true : null}
                accent="#F59E0B" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.20)" delay={0} />

              <StatCard icon="✅" label="Approved Members" value={approved}
                change={approved === 0 ? "None yet" : `${fleetTotal} vehicles`}
                changePositive={approved > 0 ? true : null}
                accent="#10B981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.18)" delay={60} />

              <StatCard icon="⏳" label="Pending Approval" value={pending}
                change={pending === 0 ? "All reviewed" : "Awaiting review"}
                changePositive={pending === 0 ? true : null}
                accent="#06B6D4" bg="rgba(6,182,212,0.07)" border="rgba(6,182,212,0.18)" delay={120} />

              <StatCard icon="💰" label="Dues Collected" value={fmtRevenue}
                change={approved === 0 ? "No members yet" : `${approved} × ₹500`}
                changePositive={approved > 0 ? true : null}
                accent="#2563EB" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.20)" delay={180} />
            </div>

            {/* Quick Actions */}
            <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Quick Actions
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[
                { href: "/union/approve",  icon: "✅", label: "Approve",    accent: "#10B981", badge: pending > 0 ? pending : null },
                { href: "/union/members",  icon: "👥", label: "Members",    accent: "#F59E0B", badge: null },
                { href: "/union/apply",    icon: "🔰", label: "Apply Link", accent: "#06B6D4", badge: null },
                { href: "/union/analytics",icon: "📊", label: "Analytics",  accent: "#2563EB", badge: null },
                { href: "/union/profile",  icon: "⚙️", label: "Settings",   accent: "#A855F7", badge: null },
                { href: "/union/register", icon: "📝", label: "New Union",  accent: "#F59E0B", badge: null },
              ].map((a, i) => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 8px", borderRadius: 16, textDecoration: "none",
                  background: "#0D1B2E", border: "1px solid #1A2E45",
                  transition: "all 0.2s", position: "relative",
                }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: a.accent }}>
                    {a.label}
                  </span>
                  {a.badge !== null && (
                    <span style={{
                      position: "absolute", top: 6, right: 8,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#EF4444", color: "#fff",
                      fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                    }}>
                      {a.badge > 9 ? "9+" : a.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Fleet Breakdown */}
            {fleetBreakdown.length > 0 ? (
              <div className="u-card" style={{ padding: 18, marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 12 }}>
                  Fleet Composition ({fleetTotal} vehicles)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {fleetBreakdown.map(f => (
                    <div key={f.type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{f.icon} {f.type}</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: f.color, fontWeight: 700 }}>
                          {f.count} ({f.pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#0A111D", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999, background: f.color,
                          width: `${f.pct}%`, boxShadow: `0 0 8px ${f.color}55`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Recent Activity */}
            <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Recent Applications
            </p>
            <div className="u-card" style={{ padding: "6px 0", marginBottom: 20 }}>
              {activityFeed.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                    No member applications yet.
                  </p>
                </div>
              ) : (
                activityFeed.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 18px",
                    borderBottom: i < activityFeed.length - 1 ? "1px solid rgba(26,46,69,0.5)" : "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${a.color}15`, border: `1px solid ${a.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>{a.text}</p>
                      <p style={{ fontSize: 10, color: "#4B5563", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Refresh notice */}
        <p style={{ textAlign: "center", fontSize: 10, color: "#374151", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          🔄 Auto-refreshes every 4s · Last: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          DRIVER DISPATCH MODAL
      ════════════════════════════════════════════════════════════ */}
      {dispatchRide && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 120,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: 0,
        }}>
          <div style={{
            background: "#0D1B2E", width: "100%", maxWidth: 520,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            border: "1px solid #1A2E45", padding: "20px 16px 32px",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            animation: "fadeUp 0.3s ease both",
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                  ⚡ Dispatch Union Driver
                </h3>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>
                  Booking #{dispatchRide.id.slice(-6)} · {dispatchRide.vehicle_type} · ₹{dispatchRide.estimated_fare}
                </p>
              </div>
              <button
                onClick={() => setDispatchRide(null)}
                style={{
                  background: "#162540", border: "none", color: "#fff",
                  borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>

            {/* Driver search */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search driver by name, phone, or plate…"
                style={{
                  width: "100%", background: "#050D1A", border: "1px solid #1A2E45",
                  borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            {/* Drivers list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
              {filteredDrivers.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                  <p style={{ margin: 0 }}>No drivers found matching "{driverSearch}".</p>
                  <button
                    onClick={() => { setDriverSearch(""); loadData(); }}
                    style={{
                      marginTop: 10, padding: "6px 14px", borderRadius: 10,
                      background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                      color: "#FDE68A", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    🔄 Reload All Union Drivers
                  </button>
                </div>
              ) : (
                filteredDrivers
                  .slice()
                  .sort((a, b) => {
                    // Match vehicle type first
                    const aMatch = a.vehicle_type === dispatchRide?.vehicle_type ? 1 : 0;
                    const bMatch = b.vehicle_type === dispatchRide?.vehicle_type ? 1 : 0;
                    if (aMatch !== bMatch) return bMatch - aMatch;
                    return b.is_online - a.is_online;
                  })
                  .map((d) => {
                    const isTypeMatch = d.vehicle_type === dispatchRide?.vehicle_type;
                    return (
                      <div
                        key={d.id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 14px", borderRadius: 14, background: "#050D1A",
                          border: isTypeMatch ? "1px solid rgba(16,185,129,0.4)" : "1px solid #1A2E45",
                          boxShadow: isTypeMatch ? "0 0 12px rgba(16,185,129,0.1)" : "none",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ color: "#fff", fontSize: 13 }}>{d.name}</strong>
                            {isTypeMatch && (
                              <span style={{
                                fontSize: 9, padding: "1px 6px", borderRadius: 6,
                                background: "rgba(16,185,129,0.2)", color: "#34D399",
                                fontWeight: 700,
                              }}>
                                ✓ {d.vehicle_type} Match
                              </span>
                            )}
                            <span style={{
                              fontSize: 9, padding: "1px 5px", borderRadius: 5,
                              background: d.is_online ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                              color: d.is_online ? "#10B981" : "#94A3B8",
                            }}>
                              {d.is_online ? "🟢 Online" : "⚪ Offline"}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                            {d.vehicle_number} {d.vehicle_make ? `· ${d.vehicle_make} ${d.vehicle_model || ""}` : ""} · ★ {d.rating_avg.toFixed(1)}
                          </p>
                          <p style={{ fontSize: 10, color: "#64748B", margin: "2px 0 0" }}>
                            📞 {d.phone} · {d.city || "Mandi"}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAssignDriver(d.id)}
                          disabled={dispatching}
                          style={{
                            padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                            fontFamily: "var(--font-display)", cursor: "pointer",
                            background: "linear-gradient(135deg, #10B981, #06B6D4)",
                            border: "none", color: "#fff",
                            opacity: dispatching ? 0.6 : 1,
                            boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
                            flexShrink: 0,
                          }}
                        >
                          {dispatching ? "Assigning..." : "⚡ Dispatch →"}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          LIVE 2-WAY CUSTOMER CHAT MODAL
      ════════════════════════════════════════════════════════════ */}
      {chatRide && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 130,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: 0,
        }}>
          <div style={{
            background: "#0D1B2E", width: "100%", maxWidth: 520,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            border: "1px solid #06B6D4", padding: "18px 16px 24px",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            animation: "fadeUp 0.3s ease both",
            boxShadow: "0 0 40px rgba(6,182,212,0.25)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1A2E45" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>
                    Chat with {chatRide.customer_name || "Customer"}
                  </h3>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                  Booking #{chatRide.id.slice(-6)} · {chatRide.customer_phone || "Live Desk"}
                </p>
              </div>
              <button
                onClick={() => setChatRide(null)}
                style={{
                  background: "#162540", border: "none", color: "#fff",
                  borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Route Summary */}
            <div style={{ padding: "6px 10px", borderRadius: 10, background: "rgba(5,13,26,0.6)", fontSize: 10, color: "#94A3B8", marginBottom: 10 }} className="truncate">
              📍 {chatRide.pickup_text.split(",")[0]} → {chatRide.drop_text.split(",")[0]}
            </div>

            {/* Messages Body */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4, minHeight: 180, maxHeight: 280, marginBottom: 10 }}>
              {chatMessages.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748B", fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
                  <p style={{ margin: 0 }}>No messages yet from customer.</p>
                  <p style={{ fontSize: 10, color: "#475569", margin: "3px 0 0" }}>Send a message or use quick reply chips below.</p>
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isDesk = m.sender_role === "DRIVER";
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: isDesk ? "flex-end" : "flex-start",
                        alignItems: "flex-end", gap: 6,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "8px 12px",
                          borderRadius: 14,
                          fontSize: 12,
                          color: "#fff",
                          background: isDesk
                            ? "linear-gradient(135deg, #0284C7, #0369A1)"
                            : "rgba(255,255,255,0.08)",
                          border: isDesk
                            ? "1px solid rgba(56,189,248,0.4)"
                            : "1px solid rgba(255,255,255,0.12)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        <div style={{ fontSize: 9, fontWeight: 700, color: isDesk ? "#BAE6FD" : "#38BDF8", marginBottom: 2, fontFamily: "var(--font-mono)" }}>
                          {isDesk ? "Union Desk" : (chatRide.customer_name || "Customer")}
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.4 }}>{m.text}</p>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", textAlign: isDesk ? "right" : "left", marginTop: 3 }}>
                          {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Reply Chips */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8, scrollbarWidth: "none" }}>
              {[
                "Driver assigned! 🚕",
                "On the way 🏃",
                "Please share landmark 📍",
                "Wait 5 mins please",
                "Calling you shortly 📞",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendUnionMessage(chip)}
                  disabled={chatSending}
                  style={{
                    padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                    whiteSpace: "nowrap", cursor: "pointer",
                    background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)",
                    color: "#A5F3FC",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendUnionMessage(); }}
                placeholder="Type reply to customer…"
                style={{
                  flex: 1, background: "#050D1A", border: "1px solid #1A2E45",
                  borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => handleSendUnionMessage()}
                disabled={chatSending || !chatInput.trim()}
                style={{
                  padding: "0 18px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                  fontFamily: "var(--font-display)", cursor: "pointer",
                  background: "linear-gradient(135deg, #06B6D4, #2563EB)",
                  border: "none", color: "#fff",
                  opacity: chatSending || !chatInput.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <UnionBottomNav />
    </main>
  );
}
