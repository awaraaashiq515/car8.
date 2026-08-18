"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Ride, RideStatus } from "@/lib/api";
import RideMap from "@/components/RideMap";
import RideChatDrawer from "@/components/RideChatDrawer";
import ShareSafetyModal from "@/components/ShareSafetyModal";

// ── Status metadata ─────────────────────────────────────────
const STATUS_CONFIG: Record<
  RideStatus,
  { label: string; sublabel: string; color: string; icon: string; pulse: boolean }
> = {
  SEARCHING: {
    label: "Searching for Driver",
    sublabel: "Connecting you with nearby verified taxis in Himachal…",
    color: "#2563EB",
    icon: "🔍",
    pulse: true,
  },
  CONFIRMED: {
    label: "Ride Confirmed",
    sublabel: "A driver has accepted your ride and will start shortly.",
    color: "#06B6D4",
    icon: "✅",
    pulse: false,
  },
  DRIVER_ASSIGNED: {
    label: "Driver Heading to You",
    sublabel: "Your verified driver is en route to the pickup point.",
    color: "#06B6D4",
    icon: "🚖",
    pulse: true,
  },
  ARRIVED: {
    label: "Driver Has Arrived",
    sublabel: "Your driver is waiting at the pickup location. Share your OTP.",
    color: "#F59E0B",
    icon: "📍",
    pulse: true,
  },
  ONGOING: {
    label: "Trip in Progress",
    sublabel: "On the way to your destination. Have a safe journey!",
    color: "#10B981",
    icon: "🛣️",
    pulse: true,
  },
  COMPLETED: {
    label: "Trip Completed",
    sublabel: "Thank you for riding with Cab8.",
    color: "#10B981",
    icon: "🎉",
    pulse: false,
  },
  CANCELLED: {
    label: "Ride Cancelled",
    sublabel: "This trip was cancelled.",
    color: "#EF4444",
    icon: "✕",
    pulse: false,
  },
};

const STEP_ORDER: RideStatus[] = [
  "SEARCHING",
  "DRIVER_ASSIGNED",
  "ARRIVED",
  "ONGOING",
  "COMPLETED",
];

const STEP_LABELS = ["Search", "Assigned", "Arrived", "On Trip", "Completed"];

const NEXT_STATUS: Partial<Record<RideStatus, RideStatus>> = {
  SEARCHING: "DRIVER_ASSIGNED",
  DRIVER_ASSIGNED: "ARRIVED",
  ARRIVED: "ONGOING",
  ONGOING: "COMPLETED",
};

// ── Progress stepper ──────────────────────────────────────
function Stepper({ status }: { status: RideStatus }) {
  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div className="flex items-center justify-between w-full">
      {STEP_ORDER.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const isLast = idx === STEP_ORDER.length - 1;

        return (
          <div key={s} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-500 ${
                  done
                    ? "bg-green text-white shadow-sm"
                    : current
                    ? "bg-blue-primary text-white ring-4 ring-blue-primary/30"
                    : "bg-navy-deep border border-navy-border text-dimmed"
                }`}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-wide text-center w-12 truncate ${
                  current ? "text-blue-light font-bold" : done ? "text-green" : "text-dimmed"
                }`}
              >
                {STEP_LABELS[idx]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-px flex-1 mx-1 mb-4 transition-all duration-700 ${
                  idx < currentIdx ? "bg-blue-primary" : "bg-navy-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Animated status dot ───────────────────────────────────
function StatusDot({ color, pulse }: { color: string; pulse: boolean }) {
  return (
    <span className="relative inline-flex h-3 w-3 flex-shrink-0">
      <span
        className={`absolute inset-0 rounded-full opacity-75 ${pulse ? "animate-ping" : ""}`}
        style={{ background: color }}
      />
      <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: color }} />
    </span>
  );
}

// ── Auto-popup Rating Modal (Uber / Ola style) ────────────
function AutoRatingModal({
  ride,
  onClose,
  onSubmitSuccess,
}: {
  ride: Ride;
  onClose: () => void;
  onSubmitSuccess: () => void;
}) {
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [ratingTags, setRatingTags] = useState<string[]>([
    "Smooth & Safe Driving",
    "Clean Car",
  ]);
  const [ratingTip, setRatingTip] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  function toggleTag(tag: string) {
    setRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.rateRide(ride.id, {
        rating: ratingStars,
        comment: ratingComment.trim() || undefined,
        tags: ratingTags,
        tipAmount: ratingTip,
      });
      onSubmitSuccess();
    } catch (e: any) {
      alert(e.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0D182E] border border-cyan-400/40 shadow-2xl overflow-hidden my-auto animate-fade-up max-h-[92vh] flex flex-col"
        style={{ boxShadow: "0 0 50px rgba(6,182,212,0.25)" }}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-blue-900/40 border-b border-navy-border px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h3 className="font-display font-bold text-white text-base">Rate Your Driver</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted hover:text-white px-2 py-1 rounded-lg bg-navy-card border border-navy-border font-mono transition-colors"
          >
            Skip ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Driver Profile Mini Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-navy-deep border border-navy-border">
            <div className="h-12 w-12 rounded-2xl bg-blue-primary/20 border border-blue-primary/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
              {ride.driver?.avatar_photo ? (
                <img
                  src={ride.driver.avatar_photo}
                  alt="Driver"
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                "👨‍✈️"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-white text-sm truncate">
                  {ride.driver?.name || "Verified Driver"}
                </h4>
                <span className="text-xs font-mono font-bold text-amber bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                  ⭐ {ride.driver?.rating_avg ? ride.driver.rating_avg.toFixed(1) : "4.8"}
                </span>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                {ride.driver?.vehicle_number || ride.vehicle_type} · {ride.driver?.city || "Himachal"}
              </p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-slate-300">
              How was your trip with <strong className="text-white">{ride.driver?.name || "the driver"}</strong>?
            </p>
            <p className="text-[11px] text-muted">Tap stars to rate</p>
          </div>

          {/* 5-Star Rating Buttons */}
          <div className="flex items-center justify-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingStars(star)}
                className={`h-11 w-11 rounded-2xl border flex items-center justify-center text-2xl transition-all duration-200 ${
                  star <= ratingStars
                    ? "bg-amber-500/20 border-amber-400 text-amber scale-110 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                    : "bg-navy-card border-navy-border text-muted opacity-60 hover:opacity-100"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="text-center font-mono text-xs font-bold text-amber">
            {ratingStars === 5 && "🌟 Outstanding & Safe Ride!"}
            {ratingStars === 4 && "😊 Great Experience!"}
            {ratingStars === 3 && "🙂 Good Ride"}
            {ratingStars === 2 && "😐 Could Be Better"}
            {ratingStars === 1 && "😞 Disappointing"}
          </div>

          {/* Compliments Chips */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1.5 font-semibold">
              What went well? (Select compliments)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Smooth & Safe Driving",
                "Clean Car",
                "Polite Driver",
                "On Time Arrival",
                "AC & Music",
                "Scenic Guide",
              ].map((tag) => {
                const sel = ratingTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all ${
                      sel
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm"
                        : "bg-navy-deep border-navy-border text-muted hover:text-white"
                    }`}
                  >
                    {sel ? "✓ " : "+ "}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Note */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1 font-semibold">
              Leave a Note (Optional)
            </label>
            <textarea
              rows={2}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="E.g. Great driver, very polite and reached on time!"
              className="w-full rounded-2xl bg-navy-deep border border-navy-border p-3 text-xs text-white placeholder-muted/60 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Tip Selector */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-1.5 font-semibold">
              Add Driver Tip (Optional)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 20, 50, 100].map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => setRatingTip(tip)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    ratingTip === tip
                      ? "bg-green/20 border-green text-green shadow-sm"
                      : "bg-navy-deep border-navy-border text-muted hover:text-white"
                  }`}
                >
                  {tip === 0 ? "None" : `+₹${tip}`}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-display font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:brightness-110 transition-all shadow-[0_4px_25px_rgba(37,99,235,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting Rating…
              </span>
            ) : (
              <>
                <span>Submit Driver Rating</span>
                <span>⭐</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function BookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdv] = useState(false);
  const [showAutoRating, setShowAutoRating] = useState(false);
  const [dismissedRating, setDismissedRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [showSafety, setShowSafety] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    try {
      const data = await api.getRide(params.id);
      setRide(data);
      setError(null);

      // If trip is COMPLETED and NOT yet rated and user hasn't dismissed it, auto open rating modal
      if (data.status === "COMPLETED" && !data.review && !dismissedRating) {
        setShowAutoRating(true);
      }
    } catch (e: any) {
      const msg: string = e.message || "";
      if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
        setError("Session expired. Please log in again.");
      } else if (msg.includes("404")) {
        setError("Trip not found. It may have been removed.");
      } else {
        setError(e.message || "Could not load this trip.");
      }
    }
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 3000);

    const timeout = setTimeout(() => {
      setRide((prev) => {
        if (!prev) setError("Could not reach the server. Check your connection and try again.");
        return prev;
      });
    }, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, dismissedRating]);

  async function advance() {
    if (!ride) return;
    const next = NEXT_STATUS[ride.status];
    if (!next) return;
    setAdv(true);
    try {
      await api.updateRideStatus(ride.id, next);
      await load();
    } catch {
      /* ignore */
    } finally {
      setAdv(false);
    }
  }

  // Track unread messages from driver when chat drawer is closed
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (!ride || showChat) return;
    let cancel = false;
    api.getMessages(ride.id).then((msgs) => {
      if (cancel) return;
      const driverMsgs = msgs.filter((m) => m.sender_role === "DRIVER").length;
      if (prevMsgCountRef.current > 0 && driverMsgs > prevMsgCountRef.current) {
        setChatUnread((prev) => prev + (driverMsgs - prevMsgCountRef.current));
      }
      prevMsgCountRef.current = driverMsgs;
    }).catch(() => {});
    return () => { cancel = true; };
  }, [ride, showChat]);

  const isSessionError = error?.includes("Session expired") || error?.includes("log in");

  if (error)
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center px-5">
        <div className="rounded-3xl border border-navy-border bg-navy-card p-8 text-center max-w-sm w-full space-y-4 shadow-2xl">
          <div className="text-5xl">{isSessionError ? "🔐" : "⚠️"}</div>
          <h2 className="font-display font-bold text-white">
            {isSessionError ? "Session Expired" : "Trip Not Found"}
          </h2>
          <p className="text-muted text-sm">{error}</p>
          <div className="flex flex-col gap-2 pt-1">
            {isSessionError ? (
              <Link href="/login" className="btn-gradient inline-flex justify-center">
                🔑 Log in Again
              </Link>
            ) : (
              <Link href="/home" className="btn-gradient inline-flex justify-center">
                ← Go Home
              </Link>
            )}
            <Link href="/my-rides" className="btn-ghost text-sm inline-flex justify-center">
              View My Rides
            </Link>
          </div>
        </div>
      </div>
    );

  if (!ride)
    return (
      <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center gap-5 px-6">
        <div className="h-14 w-14 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
        <p className="text-white font-display font-semibold">Loading your trip…</p>
        <p className="text-xs text-muted">This usually takes just a second</p>
        <Link href="/home" className="text-xs text-muted underline mt-2 hover:text-white transition-colors">
          ← Go back home
        </Link>
      </div>
    );

  const cfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.SEARCHING;
  const isCompleted = ride.status === "COMPLETED";
  const isCancelled = ride.status === "CANCELLED";
  const canAdvance = !!NEXT_STATUS[ride.status];

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col pb-12">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-20"
          style={{ background: `radial-gradient(ellipse, ${cfg.color}55 0%, transparent 70%)` }}
        />
      </div>

      {/* ── App Top Header Bar ── */}
      <header className="sticky top-0 z-30 bg-navy-deep/95 backdrop-blur-md border-b border-navy-border/60 px-5 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="h-8 w-8 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white transition-all text-sm"
            >
              ←
            </Link>
            <div>
              <h1 className="font-display font-bold text-white text-base leading-tight">
                {isCompleted ? "Trip Finished" : "Live Trip Tracker"}
              </h1>
              <p className="text-[10px] text-muted font-mono">#{ride.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafety(true)}
              className="text-xs text-cyan-300 border border-cyan-400/40 bg-cyan-500/15 rounded-xl px-2.5 py-1.5 font-bold hover:bg-cyan-500/25 transition-all flex items-center gap-1 shadow"
            >
              <span>🛡️</span>
              <span>Safety</span>
            </button>
            <Link
              href="/my-rides"
              className="text-xs text-muted border border-navy-border bg-navy-card rounded-xl px-3 py-1.5 font-bold hover:text-white transition-all"
            >
              My Rides
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="relative z-10 flex-1 px-4 sm:px-5 py-4 space-y-4 max-w-lg mx-auto w-full">

        {/* ══════════════════════════════════════════════════════════
            ACTIVE RIDE VIEW
        ══════════════════════════════════════════════════════════ */}
        {!isCompleted && !isCancelled && (
          <>
            {/* Status Hero Card */}
            <div
              className="rounded-3xl p-4 text-center transition-all duration-500 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}05)`,
                border: `1px solid ${cfg.color}35`,
              }}
            >
              <div className="text-4xl mb-2">{cfg.icon}</div>
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <StatusDot color={cfg.color} pulse={cfg.pulse} />
                <h2 className="font-display text-lg font-extrabold text-white">{cfg.label}</h2>
              </div>
              <p className="text-xs text-muted">{cfg.sublabel}</p>
            </div>

            {/* OTP Verification Card */}
            {ride.start_otp && ride.status !== "ONGOING" && (
              <div className="rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-blue-900/30 via-navy-card to-cyan-900/20 p-4 text-center shadow-lg relative overflow-hidden">
                <div className="text-xs text-muted font-medium mb-1">
                  Share this OTP with driver upon arrival:
                </div>
                <div className="flex items-center justify-center gap-2.5 my-2">
                  {ride.start_otp.split("").map((digit, i) => (
                    <div
                      key={i}
                      className="h-12 w-11 rounded-2xl border-2 border-cyan-400 bg-navy-deep flex items-center justify-center font-mono font-black text-2xl text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-cyan-300 font-mono">🔒 Required by driver to verify &amp; start trip</p>
              </div>
            )}

            {/* 🛡️ Live Safety & Location Sharing Banner */}
            <button
              type="button"
              onClick={() => setShowSafety(true)}
              className="w-full py-3 px-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-cyan-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 transition-all flex items-center justify-between text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-98 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-lg shadow">
                  🛡️
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Share Live Location &amp; Safety
                  </p>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    WhatsApp share link with family &amp; friends
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/25 border border-cyan-400/40 px-3 py-1 rounded-xl flex items-center gap-1 shadow">
                <span>Share</span>
                <span>→</span>
              </span>
            </button>

            {/* Interactive Road Navigation Map */}
            <RideMap
              pickupLat={ride.pickup_lat}
              pickupLng={ride.pickup_lng}
              pickupText={ride.pickup_text}
              dropLat={ride.drop_lat}
              dropLng={ride.drop_lng}
              dropText={ride.drop_text}
              driverName={ride.driver?.name || "Driver"}
              status={ride.status}
              height="260px"
              showRouteTimeline={true}
            />

            {/* Stepper Progress */}
            <div className="rounded-2xl border border-navy-border bg-navy-card p-3.5">
              <Stepper status={ride.status} />
            </div>

            {/* Quick Trip Fare & Vehicle Details */}
            <div className="rounded-2xl bg-navy-card border border-navy-border p-3.5 flex items-center justify-around text-xs">
              <div className="text-center">
                <span className="text-[10px] font-mono text-muted uppercase block">Estimated Fare</span>
                <strong className="text-green text-base font-bold font-display">₹{ride.estimated_fare}</strong>
              </div>
              <div className="h-7 w-px bg-navy-border" />
              <div className="text-center">
                <span className="text-[10px] font-mono text-muted uppercase block">Distance</span>
                <strong className="text-white text-base font-bold font-display">{ride.distance_km} km</strong>
              </div>
              <div className="h-7 w-px bg-navy-border" />
              <div className="text-center">
                <span className="text-[10px] font-mono text-muted uppercase block">Vehicle</span>
                <strong className="text-cyan-400 text-base font-bold font-display">{ride.vehicle_type}</strong>
              </div>
            </div>

            {/* Simulator Dev Advance */}
            {canAdvance && (
              <div className="rounded-2xl border border-amber/20 bg-amber/5 p-3.5">
                <button
                  onClick={advance}
                  disabled={advancing}
                  className="btn-gradient w-full py-2.5 rounded-xl disabled:opacity-50 text-xs font-bold"
                >
                  {advancing ? "Updating Status…" : `⚡ Advance to ${NEXT_STATUS[ride.status]}`}
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            COMPLETED RIDE VIEW (Trip Invoice & Clean Summary)
        ══════════════════════════════════════════════════════════ */}
        {isCompleted && (
          <div className="space-y-4 animate-fade-up">
            {/* Top Celebration Banner */}
            <div
              className="rounded-3xl p-5 text-center shadow-xl relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))",
                border: "1px solid rgba(16,185,129,0.4)",
              }}
            >
              <div className="text-4xl mb-1.5">🎉</div>
              <h2 className="font-display text-xl font-black text-white">Trip Completed!</h2>
              <p className="text-xs text-muted mt-0.5">
                Thank you for riding with Cab8
              </p>
            </div>

            {/* Paid Invoice & Fare Card */}
            <div className="rounded-3xl border border-navy-border bg-navy-card p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-navy-border pb-3">
                <div>
                  <h3 className="font-display font-bold text-white text-base">Trip Invoice</h3>
                  <p className="text-[10px] font-mono text-muted">ID: {ride.id.slice(-8).toUpperCase()}</p>
                </div>
                <span className="text-xs font-mono font-bold text-green bg-green/10 border border-green/30 px-3 py-1 rounded-full">
                  ✓ PAID
                </span>
              </div>

              {/* Amount Display */}
              <div className="rounded-2xl bg-navy-deep border border-navy-border p-4 text-center">
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">Total Fare Paid</span>
                <div className="font-display text-4xl font-black text-green my-1">
                  ₹{ride.final_fare ?? ride.estimated_fare}
                </div>
                <span className="text-[11px] text-muted font-mono">Paid directly to driver</span>
              </div>

              {/* Driver & Rating Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-navy-deep border border-navy-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-primary/20 border border-blue-primary/40 flex items-center justify-center text-lg">
                    {ride.driver?.avatar_photo ? (
                      <img src={ride.driver.avatar_photo} alt="Driver" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      "👨‍✈️"
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{ride.driver?.name || "Verified Driver"}</h4>
                    <p className="text-[10px] text-muted font-mono">{ride.driver?.vehicle_number || ride.vehicle_type}</p>
                  </div>
                </div>

                {ride.review ? (
                  <span className="text-xs font-mono font-bold text-amber bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                    ⭐ {ride.review.rating}.0 Rated
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAutoRating(true)}
                    className="text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-xl hover:bg-cyan-500/30 transition-all shadow-sm"
                  >
                    ⭐ Rate Driver
                  </button>
                )}
              </div>

              {/* Submitted Review Snippet (if rated) */}
              {ride.review && (
                <div className="p-3.5 rounded-2xl bg-[#091322] border border-navy-border space-y-1.5 text-xs">
                  <div className="flex items-center gap-1 text-amber">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>{idx < ride.review!.rating ? "★" : "☆"}</span>
                    ))}
                    <span className="text-[10px] font-mono text-muted ml-1">Your feedback</span>
                  </div>
                  {ride.review.comment && (
                    <p className="text-xs text-slate-200 italic">&ldquo;{ride.review.comment}&rdquo;</p>
                  )}
                  {ride.review.tags && ride.review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ride.review.tags.map((t) => (
                        <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Route Breakdown */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-start gap-2.5">
                  <span className="text-green text-sm">🟢</span>
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block">Pickup</span>
                    <p className="text-white font-medium">{ride.pickup_text}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red text-sm">🔴</span>
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block">Destination</span>
                    <p className="text-white font-medium">{ride.drop_text}</p>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-navy-border text-center">
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Distance</span>
                  <strong className="text-white text-xs font-mono">{ride.distance_km} km</strong>
                </div>
                <div className="border-x border-navy-border">
                  <span className="text-[10px] font-mono text-muted uppercase block">Vehicle</span>
                  <strong className="text-cyan-300 text-xs font-mono">{ride.vehicle_type}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Ride Type</span>
                  <strong className="text-white text-xs font-mono">{ride.ride_type}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/home"
                className="btn-gradient py-3.5 flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs shadow-lg"
              >
                <span>🔍</span> Book New Ride
              </Link>
              <Link
                href="/my-rides"
                className="btn-ghost py-3.5 flex items-center justify-center gap-1.5 rounded-2xl text-xs font-semibold"
              >
                <span>📋</span> View My Trips
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            CANCELLED VIEW
        ══════════════════════════════════════════════════════════ */}
        {isCancelled && (
          <div className="space-y-4 animate-fade-up">
            <div className="rounded-3xl border border-red/30 bg-red/10 p-6 text-center shadow-xl">
              <div className="text-4xl mb-2">😔</div>
              <h2 className="font-display text-lg font-bold text-white mb-1">Ride Cancelled</h2>
              <p className="text-xs text-muted">You were not charged for this trip</p>
            </div>
            <Link href="/home" className="btn-gradient w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl font-bold">
              🔍 Find a New Ride
            </Link>
          </div>
        )}

      </main>

      {/* ── AUTO-POPUP DRIVER RATING MODAL (Uber/Ola Style) ── */}
      {showAutoRating && ride && (
        <AutoRatingModal
          ride={ride}
          onClose={() => {
            setShowAutoRating(false);
            setDismissedRating(true);
          }}
          onSubmitSuccess={() => {
            setShowAutoRating(false);
            load();
          }}
        />
      )}

      {/* ── FLOATING CHAT BUTTON (Ola / Uber style) ── */}
      {ride && !isCompleted && !isCancelled && (
        <>
          <button
            id="chat-toggle-btn"
            onClick={() => {
              setShowChat(true);
              setChatUnread(0);
            }}
            className="fixed bottom-6 right-5 z-50 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              boxShadow: "0 8px 32px rgba(37,99,235,0.45)",
            }}
            aria-label="Chat with driver"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {chatUnread > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                style={{ background: "#EF4444", boxShadow: "0 0 10px rgba(239,68,68,0.6)" }}
              >
                {chatUnread}
              </span>
            )}
          </button>

          {showChat && (
            <RideChatDrawer
              rideId={ride.id}
              myRole="CUSTOMER"
              otherPartyName={ride.driver?.name || "Your Driver"}
              onClose={() => setShowChat(false)}
            />
          )}
        </>
      )}

      {/* Safety & Location Share Modal */}
      {showSafety && ride && (
        <ShareSafetyModal
          ride={ride}
          onClose={() => setShowSafety(false)}
        />
      )}
    </div>
  );
}
