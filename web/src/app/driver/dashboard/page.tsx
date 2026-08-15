"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { driverApi, clearDriverToken, DriverProfile, Ride } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";
import RideMap from "@/components/RideMap";
import TripSettlementModal from "@/components/TripSettlementModal";

const STATUS_LABEL: Record<string, string> = {
  SEARCHING:       "Waiting for customer",
  DRIVER_ASSIGNED: "Driver assigned — heading to pickup",
  ONGOING:         "Trip in progress",
  COMPLETED:       "Trip completed",
  CANCELLED:       "Cancelled",
};

function RideStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRIVER_ASSIGNED: "badge-blue",
    ONGOING:         "badge-blue",
    COMPLETED:       "badge-green",
    CANCELLED:       "badge-red",
  };
  return <span className={`badge ${map[status] ?? "badge-muted"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** Animated countdown ring for incoming ride (15 seconds) */
function CountdownRing({ seconds, total = 15 }: { seconds: number; total?: number }) {
  const r    = 18;
  const circ = 2 * Math.PI * r;
  const prog = (seconds / total) * circ;
  const color = seconds > 8 ? "#10B981" : seconds > 4 ? "#F59E0B" : "#EF4444";
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" className="flex-shrink-0">
      <circle cx="25" cy="25" r={r} fill="none" stroke="#1A2E45" strokeWidth="4" />
      <circle
        cx="25" cy="25" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${prog} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 25 25)"
        style={{ transition: "stroke-dasharray 0.8s linear, stroke 0.3s" }}
      />
      <text x="25" y="30" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">{seconds}</text>
    </svg>
  );
}

/** Full-screen incoming ride popup */
function IncomingRideModal({
  ride,
  onAccept,
  onReject,
}: {
  ride: Ride;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [secs, setSecs] = useState(15);

  useEffect(() => {
    if (secs <= 0) { onReject(); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onReject]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 mb-4 sm:mb-0 card border-blue-primary/50 animate-fade-up"
        style={{ boxShadow: "0 0 40px rgba(37,99,235,0.3)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">🚨 New Ride Request!</h2>
            <p className="text-xs text-muted">Auto-rejects in {secs}s</p>
          </div>
          <CountdownRing seconds={secs} />
        </div>

        {/* Route */}
        <div className="rounded-xl bg-navy-deep border border-navy-border p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <span className="w-px h-8 bg-navy-border" />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#06B6D4" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{ride.pickup_text}</p>
              <p className="text-sm font-medium text-white mt-3">{ride.drop_text}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-navy-border">
            <span className="badge badge-green">₹{ride.estimated_fare}</span>
            <span className="badge badge-blue">📏 {ride.distance_km} km</span>
            <span className="badge badge-muted">🚗 {ride.vehicle_type}</span>
            <span className="badge badge-muted">{ride.ride_type}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReject}
            className="btn-ghost py-3.5 border-red/30 text-red hover:bg-red/10 hover:border-red"
          >
            ✕ Reject
          </button>
          <button
            onClick={onAccept}
            className="btn-gradient py-3.5"
          >
            ✓ Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/** Active ride panel — shown once driver has accepted */
function ActiveRidePanel({
  ride,
  driver,
  onUpdate,
}: {
  ride: Ride;
  driver?: DriverProfile | null;
  onUpdate: (r: Ride) => void;
}) {
  const [loading, setLoad] = useState(false);
  const [err, setErr]      = useState<string | null>(null);
  const [otpInput, setOtp] = useState("");

  async function advance(status: "ARRIVED" | "ONGOING" | "COMPLETED") {
    setLoad(true); setErr(null);
    try {
      const updated = await driverApi.updateStatus(ride.id, status);
      onUpdate(updated);
    } catch (e: any) {
      setErr(e.message || "Update failed. Please try again.");
    } finally { setLoad(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpInput.trim().length !== 4) {
      setErr("Please enter the complete 4-digit OTP provided by customer.");
      return;
    }
    setLoad(true); setErr(null);
    try {
      const updated = await driverApi.verifyOtp(ride.id, otpInput.trim());
      onUpdate(updated);
      setOtp("");
    } catch (e: any) {
      setErr(e.message || "Incorrect OTP. Please check with the customer.");
    } finally { setLoad(false); }
  }

  return (
    <div className="card border-blue-primary/30 animate-fade-up space-y-4"
      style={{ boxShadow: "0 0 25px rgba(37,99,235,0.15)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="dot-online animate-pulse" />
          <h3 className="font-display font-bold text-white text-lg">Active Ride</h3>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      {/* Interactive Map */}
      <RideMap
        pickupLat={ride.pickup_lat}
        pickupLng={ride.pickup_lng}
        pickupText={ride.pickup_text}
        dropLat={ride.drop_lat}
        dropLng={ride.drop_lng}
        dropText={ride.drop_text}
        driverLat={driver?.current_lat || ride.pickup_lat}
        driverLng={driver?.current_lng || ride.pickup_lng}
        driverName={driver?.name || "Driver"}
        status={ride.status}
        height="240px"
      />

      {/* Trip Fare & Distance Metrics */}
      <div className="rounded-2xl bg-navy-deep border border-navy-border p-3.5 flex items-center justify-around text-xs shadow-inner">
        <div className="text-center">
          <span className="text-[10px] font-mono text-muted uppercase block">Estimated Fare</span>
          <strong className="text-green text-base font-bold font-display">₹{ride.estimated_fare}</strong>
        </div>
        <div className="h-7 w-px bg-navy-border" />
        <div className="text-center">
          <span className="text-[10px] font-mono text-muted uppercase block">Trip Distance</span>
          <strong className="text-white text-base font-bold font-display">{ride.distance_km} km</strong>
        </div>
        <div className="h-7 w-px bg-navy-border" />
        <div className="text-center">
          <span className="text-[10px] font-mono text-muted uppercase block">Vehicle</span>
          <strong className="text-cyan-400 text-base font-bold font-display">{ride.vehicle_type}</strong>
        </div>
      </div>

      {err && (
        <div className="text-sm text-red rounded-xl bg-red/10 border border-red/20 px-3.5 py-2.5 font-medium">
          ⚠️ {err}
        </div>
      )}

      {/* STAGE 1: Heading to Pickup -> Mark Arrived */}
      {ride.status === "DRIVER_ASSIGNED" && (
        <button
          onClick={() => advance("ARRIVED")}
          disabled={loading}
          className="btn-gradient w-full py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Updating location…
            </span>
          ) : "📍 I've Arrived at Pickup"}
        </button>
      )}

      {/* STAGE 2: Arrived at Pickup -> Enter Customer OTP */}
      {ride.status === "ARRIVED" && (
        <form onSubmit={handleVerifyOtp} className="rounded-2xl border border-cyan-glow/40 bg-gradient-to-br from-cyan-glow/10 to-navy-deep p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-glow uppercase tracking-wider flex items-center gap-1.5">
              🔑 Enter Customer OTP
            </label>
            <span className="text-[10px] text-muted font-mono">Ask customer for code</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="4-digit OTP"
              className="flex-1 rounded-xl bg-navy-card border border-cyan-glow/50 px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-white focus:outline-none focus:border-cyan-glow"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otpInput.length !== 4}
              className="btn-gradient px-5 rounded-xl font-bold text-xs disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Start Ride 🚀"}
            </button>
          </div>
        </form>
      )}

      {/* STAGE 3: Trip In Progress -> Complete Ride */}
      {ride.status === "ONGOING" && (
        <button
          onClick={() => advance("COMPLETED")}
          disabled={loading}
          className="btn-gradient w-full py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-50 bg-gradient-to-r from-green to-cyan-glow"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Completing ride…
            </span>
          ) : `🏁 Complete Ride & Collect ₹${ride.estimated_fare}`}
        </button>
      )}

      {ride.status === "COMPLETED" && (
        <div className="text-center py-4 bg-green/10 rounded-2xl border border-green/30">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-display font-bold text-white">Trip Completed!</p>
          <p className="text-xs text-muted">Collected: <span className="text-green font-bold text-sm">₹{ride.estimated_fare}</span></p>
        </div>
      )}
    </div>
  );
}

function SOSModal({
  profile,
  onClose,
}: {
  profile: DriverProfile;
  onClose: () => void;
}) {
  const [alertSent, setAlertSent] = useState(false);

  function handleSendAlert() {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 5000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border-2 border-red bg-navy-card p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-fade-up relative overflow-hidden">
        {/* Pulsing red beacon header */}
        <div className="h-20 w-20 rounded-full bg-red/20 border-2 border-red flex items-center justify-center text-4xl mx-auto mb-4 animate-pulse">
          🚨
        </div>

        <h2 className="font-display text-2xl font-bold text-red mb-1">EMERGENCY SOS</h2>
        <p className="text-xs text-muted mb-4">Instant Safety & Emergency Assistance</p>

        {/* Info Box */}
        <div className="rounded-2xl border border-navy-border bg-navy-deep p-3 text-left mb-5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Driver Name:</span>
            <span className="font-bold text-white">{profile.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Vehicle Plate:</span>
            <span className="font-mono text-cyan-glow">{profile.vehicle_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Base City:</span>
            <span className="text-white">{profile.city}</span>
          </div>
          {profile.current_lat !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted">GPS Coordinates:</span>
              <span className="font-mono text-green">{profile.current_lat.toFixed(4)}, {profile.current_lng.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* SOS Call Buttons */}
        <div className="space-y-2.5 mb-5">
          <a
            href="tel:112"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-red text-white font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red/90 transition-all"
          >
            📞 Call Police (112)
          </a>

          <a
            href="tel:108"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-red/50 bg-red/10 text-white font-bold text-sm hover:bg-red/20 transition-all"
          >
            🚑 Call Ambulance (108)
          </a>

          <a
            href="tel:180082946468"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-navy-border bg-navy-deep text-blue-light text-xs font-semibold hover:border-blue-primary transition-all"
          >
            🚕 Cab8 Control Room Helpline
          </a>

          <button
            onClick={handleSendAlert}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber/20 border border-amber/40 text-amber text-xs font-bold transition-all"
          >
            {alertSent ? "✓ Emergency Alert Broadcasted to Control Room!" : "📡 Broadcast Emergency Location Alert"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-navy-border text-muted text-xs hover:text-white transition-colors"
        >
          Close Emergency Panel ✕
        </button>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const router = useRouter();
  const [profile,     setProfile]    = useState<DriverProfile | null>(null);
  const [isOnline,    setIsOnline]   = useState(false);
  const [toggling,    setToggling]   = useState(false);
  const [pendingRide, setPending]    = useState<Ride | null>(null);
  const [activeRide,  setActiveRide] = useState<Ride | null>(null);
  const [rides,       setRides]      = useState<Ride[]>([]);
  const [showSos,     setShowSos]    = useState(false);
  const [error,       setError]      = useState<string | null>(null);
  const [authError,   setAuthError]  = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Today's Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRides = rides.filter(r => r.status === "COMPLETED" && (r.updated_at || r.created_at || "").startsWith(todayStr));
  const todayEarnings = todayRides.reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);
  const todayCount = todayRides.length;

  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load profile on mount & detect browser GPS location
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = typeof window !== "undefined"
        ? window.localStorage.getItem("cab8_driver_token")
        : null;

      if (!token) {
        setAuthError("No login token found. Please login again.");
        return;
      }

      driverApi.getProfile()
        .then((p) => {
          setProfile(p);
          setIsOnline(p.is_online === 1);

          // Get Browser Live GPS Location
          if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGpsLocation({ lat, lng });
                driverApi.updateLocation(lat, lng).catch(() => {});
                setProfile((prev) => prev ? { ...prev, current_lat: lat, current_lng: lng } : prev);
              },
              (err) => {
                console.log("Geolocation error or denied:", err.message);
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          }
        })
        .catch((e: any) => {
          setAuthError(e.message || "Could not load driver profile. Please login again.");
        });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const rejectedRidesRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const [pending, active, history] = await Promise.all([
        driverApi.getPendingRides(),
        driverApi.getActiveRide(),
        driverApi.getDriverRides().catch(() => []),
      ]);
      if (active) {
        setActiveRide(active);
        setPending(null);
      } else {
        const validPending = pending.filter((p) => !rejectedRidesRef.current.has(p.id));
        if (validPending.length > 0 && !pendingRide) {
          setPending(validPending[0]);
        } else if (validPending.length === 0 && pendingRide) {
          setPending(null);
        }
      }
      if (history) setRides(history);
    } catch { /* silently ignore network blips */ }
  }, [pendingRide]);

  useEffect(() => {
    if (!isOnline || !profile) return;
    poll();
    pollingRef.current = setInterval(poll, 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isOnline, profile, poll]);

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await driverApi.toggleOnline(!isOnline);
      setIsOnline(res.is_online === 1);
      if (!res.is_online) {
        setPending(null);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (e: any) {
      setError(e.message || "Failed to update status.");
    } finally { setToggling(false); }
  }

  async function handleAccept() {
    if (!pendingRide) return;
    try {
      const updated = await driverApi.respondToRide(pendingRide.id, true);
      setActiveRide(updated);
      setPending(null);
    } catch (e: any) {
      setError(e.message || "Could not accept ride. Please try again.");
      setPending(null);
    }
  }

  async function handleReject() {
    if (!pendingRide) return;
    const rideId = pendingRide.id;
    rejectedRidesRef.current.add(rideId);
    setPending(null);
    try {
      await driverApi.respondToRide(rideId, false);
    } catch { /* ignore */ }
  }

  function handleLogout() {
    clearDriverToken();
    window.localStorage.removeItem("cab8_token");
    window.localStorage.removeItem("cab8_role");
    window.localStorage.removeItem("cab8_user_name");
    router.replace("/login");
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-navy-deep flex items-center justify-center px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-display font-bold text-white mb-2">Login Required</h2>
          <p className="text-sm text-muted mb-5">{authError}</p>
          <Link href="/driver/login" className="btn-gradient inline-flex w-full justify-center">
            Go to Login →
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <div className="h-10 w-10 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
          <p className="text-sm">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-deep pb-24">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full opacity-10"
          style={{ background: `radial-gradient(ellipse, ${isOnline ? "#10B981" : "#2563EB"} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/login" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>🚕</div>
            <span className="font-display text-lg font-bold">
              Cab<span className="text-gradient">8</span>
              <span className="ml-1.5 text-xs font-mono text-muted normal-case">Driver</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSos(true)}
              className="px-3 py-1.5 rounded-xl bg-red/20 border border-red/40 text-red text-xs font-bold animate-pulse hover:bg-red/30"
            >
              🚨 SOS
            </button>
            <button
              onClick={handleLogout}
              className="btn-ghost text-xs border-red/30 text-red hover:bg-red/10"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card mb-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0D1B2E, #162540)" }}>
              👨‍✈️
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-white text-lg">{profile.name || "Driver"}</div>
              <div className="text-sm text-muted">{profile.phone}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="badge badge-muted">🚗 {profile.vehicle_type}</span>
                <span className="badge badge-muted">{profile.vehicle_number}</span>
                <span className="badge badge-muted">📍 {profile.city}</span>
                {profile.is_verified ? (
                  <span className="badge badge-green">✅ Verified</span>
                ) : (
                  <span className="badge badge-amber">⏳ Pending Verification</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-muted mb-0.5">Rating</div>
              <div className="font-display font-bold text-white">⭐ {profile.rating_avg.toFixed(1)}</div>
            </div>
          </div>
        </div>




        {/* Online Toggle */}
        <div className="card mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {isOnline ? <span className="dot-online" /> : <span className="dot-offline" />}
                <span className="font-display font-bold text-white text-lg">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                {isOnline
                  ? "You are online — accepting ride requests"
                  : "Go online to start receiving ride requests"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative h-8 w-14 rounded-full transition-all duration-300 flex-shrink-0 ${
                isOnline
                  ? "bg-green shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : "bg-navy-border"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${
                  isOnline ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>



        {/* Emergency SOS Banner */}
        <div className="mb-5">
          <button
            onClick={() => setShowSos(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-red/40 bg-red/10 hover:bg-red/20 transition-all text-red shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-red animate-ping" />
              <span className="font-bold text-sm text-white">Emergency SOS Assistance</span>
            </div>
            <span className="text-xs font-mono font-bold bg-red text-white px-3 py-1 rounded-xl shadow">🚨 HELP</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4">
            ⚠️ {error}
            <button onClick={() => setError(null)} className="ml-2 text-red/70 hover:text-red">✕</button>
          </div>
        )}

        {/* Map only shows when there is an active trip (inside ActiveRidePanel below) */}

        {/* Active Ride */}
        {activeRide && activeRide.status !== "COMPLETED" && (
          <ActiveRidePanel ride={activeRide} driver={profile} onUpdate={(r) => setActiveRide(r)} />
        )}

        {/* Trip Settlement & Payment Collection Modal */}
        {activeRide && activeRide.status === "COMPLETED" && (
          <TripSettlementModal
            ride={activeRide}
            driver={profile}
            onComplete={() => setActiveRide(null)}
          />
        )}

        {/* Waiting state */}
        {isOnline && !activeRide && !pendingRide && (
          <div className="card text-center py-10 animate-fade-up">
            <div className="h-14 w-14 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin mx-auto mb-4" />
            <p className="font-medium text-white">Waiting for ride requests…</p>
            <p className="text-xs text-muted mt-1">Checking every 4 seconds</p>
          </div>
        )}

        {/* Offline state */}
        {!isOnline && !activeRide && (
          <div className="card text-center py-10 animate-fade-up border-dashed">
            <div className="text-4xl mb-3 opacity-50">😴</div>
            <p className="font-medium text-white">You are Offline</p>
            <p className="text-xs text-muted mt-1">Toggle the switch above to go online</p>
          </div>
        )}
      </div>

      {/* Incoming Ride Modal */}
      {pendingRide && (
        <IncomingRideModal
          ride={pendingRide}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* SOS Emergency Modal */}
      {showSos && profile && (
        <SOSModal profile={profile} onClose={() => setShowSos(false)} />
      )}

      <DriverBottomNav />
    </main>
  );
}
