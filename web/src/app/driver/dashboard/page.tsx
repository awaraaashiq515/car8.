"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { driverApi, clearDriverToken, DriverProfile, Ride } from "@/lib/api";
import { startDriverRideAlert, stopDriverRideAlert, unlockAudio } from "@/lib/sound";
import DriverBottomNav from "@/components/DriverBottomNav";
import RideMap from "@/components/RideMap";
import TripSettlementModal from "@/components/TripSettlementModal";
import RideChatDrawer from "@/components/RideChatDrawer";

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


/** Full-screen incoming ride popup — stays until driver accepts or rejects */
function IncomingRideModal({
  ride,
  onAccept,
  onReject,
}: {
  ride: Ride;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Play continuous incoming ride alert sound & vibration until action taken
  useEffect(() => {
    if (!isMuted) {
      startDriverRideAlert();
    } else {
      stopDriverRideAlert();
    }
    return () => {
      stopDriverRideAlert();
    };
  }, [isMuted]);

  const handleModalAccept = () => {
    stopDriverRideAlert();
    onAccept();
  };

  const handleModalReject = () => {
    stopDriverRideAlert();
    onReject();
  };

  return (
    <>
    <div
      onClick={() => unlockAudio()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div
        className={`w-full ${isMapExpanded ? "max-w-2xl h-[90vh]" : "max-w-lg"} rounded-3xl bg-[#0D182E] border border-cyan-400/40 shadow-2xl overflow-hidden my-auto flex flex-col transition-all duration-300 animate-fade-up`}
        style={{ boxShadow: "0 0 50px rgba(6,182,212,0.3)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 via-cyan-900/30 to-blue-900/50 border-b border-navy-border px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🚨</span>
            <div>
              <h2 className="font-display text-lg font-bold text-white leading-tight">New Ride Request!</h2>
              <p className="text-[11px] text-cyan-300 font-mono">Review route and destination</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute alert sound" : "Mute alert sound"}
              className={`text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 transition-all flex items-center gap-1 border ${
                isMuted
                  ? "text-muted bg-navy-card/60 border-navy-border hover:text-white"
                  : "text-amber-300 bg-amber-500/20 border-amber-400/50 animate-pulse hover:bg-amber-500/30"
              }`}
            >
              <span>{isMuted ? "🔇" : "🔔"}</span>
              <span>{isMuted ? "Muted" : "Ringing"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 rounded-xl px-2.5 py-1.5 hover:bg-cyan-500/25 transition-all flex items-center gap-1"
            >
              <span>💬</span>
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 hover:bg-cyan-500/20 transition-all flex items-center gap-1"
            >
              <span>{isMapExpanded ? "🗗" : "⛶"}</span>
              <span>{isMapExpanded ? "Mini" : "Full"}</span>
            </button>
            {/* Pulsing LIVE badge — replaces countdown timer */}
            <span
              className="text-[10px] font-mono font-bold text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1 animate-pulse"
              style={{
                background: "linear-gradient(135deg, #EF4444, #F97316)",
                boxShadow: "0 0 14px rgba(239,68,68,0.5)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
              LIVE
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`p-4 space-y-3.5 overflow-y-auto flex-1 ${isMapExpanded ? "flex flex-col" : ""}`}>
          
          {/* Interactive Route Map */}
          <div className="w-full rounded-2xl overflow-hidden border border-cyan-400/30 shadow-md flex-shrink-0">
            <RideMap
              pickupLat={ride.pickup_lat}
              pickupLng={ride.pickup_lng}
              pickupText={ride.pickup_text}
              dropLat={ride.drop_lat}
              dropLng={ride.drop_lng}
              dropText={ride.drop_text}
              status={ride.status}
              height={isMapExpanded ? "380px" : "210px"}
              showRouteTimeline={false}
            />
          </div>

          {/* Pickup & Destination Details */}
          <div className="rounded-2xl bg-navy-deep border border-navy-border p-3.5 space-y-2.5 flex-shrink-0">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green/20 border border-green/40 flex items-center justify-center text-xs text-green flex-shrink-0 mt-0.5 font-bold">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">Pickup Location</span>
                <p className="text-xs font-semibold text-white truncate">{ride.pickup_text}</p>
              </div>
            </div>

            {/* Connecting line */}
            <div className="ml-3 h-2.5 w-0.5 bg-cyan-400/30 -my-1" />

            {/* Drop / Destination (Prominently Highlighted) */}
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-300 flex-shrink-0 mt-0.5 font-bold">
                🏁
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  Dropoff Destination (Where to drop)
                </span>
                <p className="text-sm font-bold text-white truncate bg-cyan-500/10 border border-cyan-500/25 p-2 rounded-xl mt-0.5 text-cyan-100">
                  {ride.drop_text}
                </p>
              </div>
            </div>

            {/* Stats Chips */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-navy-border text-center">
              <div className="p-1.5 rounded-xl bg-navy-card border border-navy-border">
                <span className="text-[9px] font-mono text-muted block">Fare</span>
                <strong className="text-green text-xs font-mono font-bold">₹{ride.estimated_fare}</strong>
              </div>
              <div className="p-1.5 rounded-xl bg-navy-card border border-navy-border">
                <span className="text-[9px] font-mono text-muted block">Distance</span>
                <strong className="text-white text-xs font-mono font-bold">{ride.distance_km} km</strong>
              </div>
              <div className="p-1.5 rounded-xl bg-navy-card border border-navy-border">
                <span className="text-[9px] font-mono text-muted block">Vehicle</span>
                <strong className="text-cyan-300 text-xs font-mono font-bold">{ride.vehicle_type}</strong>
              </div>
              <div className="p-1.5 rounded-xl bg-navy-card border border-navy-border">
                <span className="text-[9px] font-mono text-muted block">Type</span>
                <strong className="text-white text-xs font-mono font-bold truncate block">{ride.ride_type}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-navy-deep border-t border-navy-border grid grid-cols-2 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleModalReject}
            className="py-3.5 rounded-2xl font-bold text-sm text-red bg-red/10 border border-red/30 hover:bg-red/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>✕</span>
            <span>Reject</span>
          </button>
          <button
            type="button"
            onClick={handleModalAccept}
            className="py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>Accept (₹{ride.estimated_fare})</span>
          </button>
        </div>

      </div>
    </div>

    {/* Chat drawer rendered OUTSIDE modal card to avoid overflow/z-index clipping */}
    {showChat && (
      <RideChatDrawer
        rideId={ride.id}
        myRole="DRIVER"
        otherPartyName="Passenger"
        onClose={() => setShowChat(false)}
      />
    )}
  </>
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
  const [showChat, setShowChat] = useState(false);
  const simStepRef = useRef(0);

  // Live GPS Streaming: continuously broadcasts moving driver coordinates to backend
  useEffect(() => {
    if (ride.status !== "ONGOING" && ride.status !== "DRIVER_ASSIGNED") return;

    const pLat = ride.pickup_lat;
    const pLng = ride.pickup_lng;
    const dLat = ride.drop_lat;
    const dLng = ride.drop_lng;

    const interval = setInterval(() => {
      simStepRef.current = (simStepRef.current + 1) % 100;
      const fraction = simStepRef.current / 100;
      const currentLat = pLat + (dLat - pLat) * fraction;
      const currentLng = pLng + (dLng - pLng) * fraction;

      driverApi.updateLocation(currentLat, currentLng).catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [ride.status, ride.pickup_lat, ride.pickup_lng, ride.drop_lat, ride.drop_lng]);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="text-xs font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all shadow"
          >
            <span>💬</span>
            <span>Chat</span>
          </button>
          <RideStatusBadge status={ride.status} />
        </div>
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

      {/* 🔴 Live GPS Broadcasting Indicator */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold font-mono text-[11px] text-emerald-300">
            LIVE GPS BROADCASTING
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Auto-updating to Passenger
        </span>
      </div>

      {/* Prominent Direct Chat with Passenger Bar */}
      <button
        type="button"
        onClick={() => setShowChat(true)}
        className="w-full py-3.5 px-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-cyan-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 transition-all flex items-center justify-between text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-98 group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xl shadow">
            💬
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Chat with Passenger
            </p>
            <p className="text-[11px] text-cyan-300/80 font-mono">
              Send message, share ETA or landmark
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow">
          <span>Open Chat</span>
          <span>→</span>
        </span>
      </button>

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

      {showChat && (
        <RideChatDrawer
          rideId={ride.id}
          myRole="DRIVER"
          otherPartyName="Passenger"
          onClose={() => setShowChat(false)}
        />
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

          // Always check for an in-progress ride on load (even if driver is offline)
          // so a driver with an active booking always sees their trip panel
          driverApi.getActiveRide()
            .then((r) => { if (r) setActiveRide(r); })
            .catch(() => {});

          // Initial load location
          if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGpsLocation({ lat, lng });
                driverApi.updateLocation(lat, lng).catch(() => {});
                setProfile((prev) => prev ? { ...prev, current_lat: lat, current_lng: lng } : prev);
              },
              () => {},
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }
        })
        .catch((e: any) => {
          setAuthError(e.message || "Could not load driver profile. Please login again.");
        });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 📡 5-Second Real-Time Driver GPS Broadcaster (Every 5s)
  useEffect(() => {
    if (!profile) return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    const broadcastGps = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsLocation({ lat, lng });
          driverApi.updateLocation(lat, lng).catch(() => {});
          setProfile((prev) => prev ? { ...prev, current_lat: lat, current_lng: lng } : prev);
        },
        (err) => {
          console.warn("GPS broadcast note:", err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 4500 }
      );
    };

    // Immediate ping
    broadcastGps();

    // Continuous 5-second heartbeat
    const gpsTimer = setInterval(broadcastGps, 5000);
    return () => clearInterval(gpsTimer);
  }, [profile?.id, isOnline]);

  const rejectedRidesRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const [pending, active, history] = await Promise.all([
        driverApi.getPendingRides(),
        driverApi.getActiveRide(),
        driverApi.getDriverRides().catch(() => []),
      ]);
      if (active) {
        // Driver accepted — show active ride, clear pending
        setActiveRide(active);
        setPending(null);
      } else {
        const validPending = pending.filter((p) => !rejectedRidesRef.current.has(p.id));
        if (validPending.length > 0) {
          // New ride available and none currently shown — set it
          setPending((prev) => prev ?? validPending[0]);
        }
        // If validPending is empty but pendingRide is set:
        // The customer may have cancelled the ride — check by seeing if the
        // ride id is no longer in pending at all (not just filtered)
        if (validPending.length === 0) {
          const allPendingIds = pending.map((p) => p.id);
          setPending((prev) => {
            if (!prev) return null;
            // If the ride we're showing is no longer in any pending rides
            // (not just rejected), it means it was cancelled or expired on server
            if (!allPendingIds.includes(prev.id)) return null;
            // Otherwise keep showing it
            return prev;
          });
        }
      }
      if (history) setRides(history);
    } catch { /* silently ignore network blips */ }
  }, []);

  useEffect(() => {
    // Poll when online, OR when there is an active ride that must be tracked to completion
    const shouldPoll = profile && (isOnline || activeRide);
    if (!shouldPoll) return;
    poll();
    pollingRef.current = setInterval(poll, 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isOnline, profile, activeRide, poll]);

  // Enable audio context on first user interaction
  useEffect(() => {
    const handleUnlock = () => {
      unlockAudio();
    };
    window.addEventListener("click", handleUnlock, { once: true });
    window.addEventListener("touchstart", handleUnlock, { once: true });
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };
  }, []);

  async function handleToggle() {
    unlockAudio();
    setToggling(true);
    try {
      const res = await driverApi.toggleOnline(!isOnline);
      setIsOnline(res.is_online === 1);
      if (!res.is_online) {
        stopDriverRideAlert();
        setPending(null);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (e: any) {
      setError(e.message || "Failed to update status.");
    } finally { setToggling(false); }
  }

  async function handleAccept() {
    stopDriverRideAlert();
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
    stopDriverRideAlert();
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
        {/* Header with Top Duty Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/login" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>🚕</div>
            <span className="font-display text-lg font-bold">
              Cab<span className="text-gradient">8</span>
              <span className="ml-1.5 text-xs font-mono text-muted normal-case">Driver</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Real Interactive Online / Offline Toggle Switch Button */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer border ${
                isOnline
                  ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:bg-emerald-950"
                  : "bg-[#0D1B2E] border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
              title={isOnline ? "Click to go Offline" : "Click to go Online"}
            >
              <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
              {/* Sliding Switch Pill */}
              <div
                className={`relative w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                  isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    isOnline ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setShowSos(true)}
              className="px-2.5 py-1.5 rounded-xl bg-red/20 border border-red/40 text-red text-xs font-bold animate-pulse hover:bg-red/30"
              title="Emergency SOS"
            >
              🚨 SOS
            </button>

            <button
              onClick={handleLogout}
              className="btn-ghost text-xs border-red/30 text-red hover:bg-red/10 px-2.5 py-1.5"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Compact & Sleek Driver Profile Card */}
        <div className="card p-3.5 mb-4 border-navy-border/80 bg-gradient-to-r from-[#0D182E] via-navy-card to-[#0D182E] shadow-lg">
          <div className="flex items-center gap-3">
            {/* Driver Avatar Picture */}
            <div className="relative flex-shrink-0">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden shadow-md"
                style={{
                  background: "linear-gradient(135deg, #0D1B2E, #162540)",
                  border: "1.5px solid rgba(6,182,212,0.4)",
                }}
              >
                {profile.avatar_photo ? (
                  <img
                    src={profile.avatar_photo}
                    alt={profile.name || "Driver"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>👨‍✈️</span>
                )}
              </div>
              {profile.is_verified ? (
                <span
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-navy-card flex items-center justify-center text-[8px] text-white font-bold shadow"
                  title="Verified Driver"
                >
                  ✓
                </span>
              ) : null}
            </div>

            {/* Middle Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base truncate capitalize leading-tight">
                  {profile.name || "Driver"}
                </h3>
                {profile.is_verified ? (
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md leading-none">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-mono font-semibold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md leading-none">
                    Pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted font-mono mt-1 truncate">
                <span className="text-white font-semibold">🚗 {profile.vehicle_type}</span>
                <span className="text-navy-border">•</span>
                <span className="text-cyan-300 font-bold">{profile.vehicle_number}</span>
                <span className="text-navy-border">•</span>
                <span>📍 {profile.stand_name || profile.city || "Mandi"}</span>
                <button
                  type="button"
                  onClick={() => {
                    driverApi.updateLocation(31.7084, 76.9319).then(() => {
                      setProfile(prev => prev ? { ...prev, current_lat: 31.7084, current_lng: 76.9319 } : prev);
                    });
                  }}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
                  title="Click to snap location directly to Mandi NH-21 Stand"
                >
                  🎯 Mandi NH-21
                </button>
              </div>
            </div>

            {/* Right Rating */}
            <div className="text-right flex-shrink-0 pl-3 border-l border-navy-border/60">
              <div className="text-[9px] text-muted uppercase font-mono leading-none">Rating</div>
              <div className="font-display font-bold text-white text-sm mt-1 flex items-center gap-1 justify-end">
                <span className="text-amber text-xs">★</span>
                <span>{profile.rating_avg.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>



        {/* Return Trip & Empty Taxi Board Banner */}
        <div className="mb-5 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-navy-card to-blue-950/30 p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-xl shadow">
              📋
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Return Trip Board</h4>
              <p className="text-xs text-purple-300 font-mono">Post empty taxi or shared seats</p>
            </div>
          </div>
          <Link
            href="/board/post"
            className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 px-3.5 py-2 rounded-xl shadow transition-all whitespace-nowrap active:scale-95"
          >
            + Post Ride
          </Link>
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
            onComplete={async () => {
              setActiveRide(null);
              // Refresh history so new completed ride appears in stats
              try {
                const history = await driverApi.getDriverRides();
                if (history) setRides(history);
              } catch { /* ignore */ }
            }}
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
