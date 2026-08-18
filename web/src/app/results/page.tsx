"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  api, DriverResult, PLACE_PRESETS, Place, RideType, RideMessage, SearchResponse, VehicleType, resolvePlaceCoordinates,
} from "@/lib/api";

const VEHICLE_ICONS: Record<VehicleType, string> = {
  HATCHBACK: "🚗", SEDAN: "🚙", SUV: "🚕", LUXURY: "🚘",
};

function findPlace(label: string | null) {
  return resolvePlaceCoordinates(label);
}

// ── Driver Card ──────────────────────────────────────────
function DriverCard({
  driver, onBook, booking,
}: {
  driver: DriverResult;
  onBook: (d: DriverResult) => void;
  booking: boolean;
}) {
  const stars = Math.round(driver.ratingAvg);
  return (
    <div className="rounded-2xl border border-navy-border bg-navy-card overflow-hidden animate-fade-up">
      {/* Top section */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Vehicle icon */}
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0D1B2E, #162540)",
              border: "1px solid #1A2E45",
            }}
          >
            {VEHICLE_ICONS[driver.vehicleType]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-white truncate">{driver.driverName}</h3>
              <div className="font-display text-xl font-bold text-white flex-shrink-0">₹{driver.fare}</div>
            </div>
            <p className="text-xs text-muted mt-0.5">{driver.vehicleNumber} · {driver.city}</p>

            {/* Stars & Reviews */}
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-xs ${i < stars ? "text-amber" : "text-muted"}`}>★</span>
              ))}
              <span className="text-[11px] text-amber font-bold ml-1.5">{driver.ratingAvg.toFixed(1)}</span>
              <span className="text-[10px] text-muted ml-1">
                ({driver.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-navy-deep border border-navy-border px-3 py-1.5">
            <span className="text-xs">🕐</span>
            <span className="text-xs text-white font-medium">ETA {driver.etaMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-navy-deep border border-navy-border px-3 py-1.5">
            <span className="text-xs">📍</span>
            <span className="text-xs text-white font-medium">{driver.pickupDistanceKm.toFixed(1)} km away</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-green/30 bg-green/10 px-3 py-1.5">
            <span className="dot-online scale-75" />
            <span className="text-xs text-green font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* Book button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onBook(driver)}
          disabled={booking}
          className="btn-gradient w-full py-3 rounded-xl disabled:opacity-50 font-semibold"
        >
          {booking ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Booking your ride…
            </span>
          ) : (
            `Book for ₹${driver.fare} →`
          )}
        </button>
      </div>
    </div>
  );
}

// ── Driver Acceptance Waiting Overlay (Ola / Uber style) ─
type AcceptState = "waiting" | "accepted" | "cancelled";

function DriverAcceptanceOverlay({
  rideId,
  driverName,
  fare,
  vehicleType,
  onCancel,
  onAccepted,
}: {
  rideId: string;
  driverName: string;
  fare: number;
  vehicleType: VehicleType;
  onCancel: () => void;
  onAccepted: () => void;
}) {
  const [state, setState] = useState<AcceptState>("waiting");
  const [allMessages, setAllMessages] = useState<RideMessage[]>([]);
  const [newMsgFlash, setNewMsgFlash] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const prevDriverMsgCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const QUICK_CHIPS = [
    "On my way! 🏃",
    "I'm at the pickup 📍",
    "Please call me",
    "2 mins, coming down",
  ];

  async function loadMessages() {
    try {
      const msgs = await api.getMessages(rideId);
      const driverMsgs = msgs.filter((m) => m.sender_role === "DRIVER");
      if (driverMsgs.length > prevDriverMsgCountRef.current) {
        setNewMsgFlash(true);
        setChatOpen(true); // auto-open chat when driver sends message
        setTimeout(() => setNewMsgFlash(false), 1500);
      }
      prevDriverMsgCountRef.current = driverMsgs.length;
      setAllMessages(msgs);
    } catch {
      // ignore network errors
    }
  }

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let msgInterval: NodeJS.Timeout;
    let cancelled = false;

    // Poll ride status every 3s
    pollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const ride = await api.getRide(rideId);
        if (
          ride.status === "DRIVER_ASSIGNED" ||
          ride.status === "CONFIRMED" ||
          ride.status === "ARRIVED" ||
          ride.status === "ONGOING"
        ) {
          if (!cancelled) {
            setState("accepted");
            clearInterval(pollInterval);
            clearInterval(msgInterval);
            setTimeout(() => {
              if (!cancelled) onAccepted();
            }, 1500);
          }
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000);

    // Poll ALL messages every 2.5s (both driver + customer)
    loadMessages();
    msgInterval = setInterval(() => {
      if (!cancelled) loadMessages();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearInterval(msgInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, chatOpen]);

  async function handleSend(textOverride?: string) {
    const text = (textOverride || input).trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    // Optimistic UI
    const tempMsg: RideMessage = {
      id: "temp-" + Date.now(),
      ride_id: rideId,
      sender_id: "me",
      sender_role: "CUSTOMER",
      sender_name: "You",
      text,
      created_at: new Date().toISOString(),
    };
    setAllMessages((prev) => [...prev, tempMsg]);
    try {
      await api.sendMessage(rideId, text);
      await loadMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-fade-up flex flex-col"
        style={{
          background: "linear-gradient(160deg, #080F1E 0%, #0A1628 50%, #060E1A 100%)",
          border: state === "accepted" ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(37,99,235,0.3)",
          boxShadow: state === "accepted"
            ? "0 0 60px rgba(16,185,129,0.25), 0 25px 50px rgba(0,0,0,0.7)"
            : "0 0 60px rgba(37,99,235,0.2), 0 25px 50px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
      >
        {/* Top animated status stripe */}
        <div
          className="h-1 w-full transition-all duration-700"
          style={{
            background:
              state === "accepted"
                ? "linear-gradient(90deg, #10B981, #06B6D4, #10B981)"
                : "linear-gradient(90deg, #2563EB, #06B6D4, #2563EB)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite linear",
          }}
        />

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* ── WAITING STATE ── */}
          {state === "waiting" && (
            <>
              {/* Animated radar + vehicle icon */}
              <div className="flex justify-center pt-1">
                <div className="relative h-28 w-28">
                  <div className="absolute inset-0 rounded-full border border-blue-primary/10 animate-ping" style={{ animationDuration: "2.4s" }} />
                  <div className="absolute inset-3 rounded-full border border-blue-primary/20 animate-ping" style={{ animationDuration: "2.4s", animationDelay: "0.5s" }} />
                  <div className="absolute inset-6 rounded-full border border-blue-primary/30 animate-ping" style={{ animationDuration: "2.4s", animationDelay: "1s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl"
                      style={{
                        background: "linear-gradient(135deg, #0F2545, #1E3A5F)",
                        border: "1.5px solid rgba(37,99,235,0.5)",
                        boxShadow: "0 0 30px rgba(37,99,235,0.3)",
                      }}
                    >
                      {VEHICLE_ICONS[vehicleType]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status text */}
              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <h2 className="font-display text-lg font-extrabold text-white tracking-tight">
                    Waiting for Driver
                  </h2>
                </div>
                <p className="text-sm text-slate-400">
                  <span className="text-white font-semibold">{driverName}</span>
                  <span className="text-slate-500"> is reviewing your request</span>
                </p>
                <p className="text-[11px] text-muted font-mono">Please keep this screen open</p>
              </div>

              {/* Fare pill */}
              <div className="flex items-center justify-center">
                <div
                  className="flex items-center gap-3 px-5 py-2.5 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.08))",
                    border: "1px solid rgba(37,99,235,0.3)",
                  }}
                >
                  <span className="text-slate-400 text-xs font-mono tracking-wide">Confirmed fare</span>
                  <span className="font-display font-bold text-white text-xl">₹{fare}</span>
                </div>
              </div>

              {/* ── LIVE 2-WAY CHAT SECTION ── */}
              <div
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  newMsgFlash ? "ring-2 ring-cyan-400/60" : ""
                }`}
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.07), rgba(37,99,235,0.05))",
                  border: newMsgFlash
                    ? "1px solid rgba(6,182,212,0.5)"
                    : "1px solid rgba(6,182,212,0.2)",
                }}
              >
                {/* Chat header — tap to expand/collapse */}
                <button
                  type="button"
                  onClick={() => setChatOpen((v) => !v)}
                  className="w-full flex items-center gap-2 px-3.5 pt-3 pb-2.5 border-b transition-colors hover:bg-white/5"
                  style={{ borderColor: "rgba(6,182,212,0.15)" }}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{
                        background: allMessages.length > 0 ? "#22D3EE" : "#6B8CAE",
                        animationDuration: "1.5s",
                      }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: allMessages.length > 0 ? "#22D3EE" : "#6B8CAE" }}
                    />
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest flex-1 text-left">
                    Chat with Driver
                    {allMessages.length > 0 && (
                      <span className="ml-2 text-[9px] font-bold text-cyan-400/80">
                        ({allMessages.length} msg{allMessages.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  {newMsgFlash && (
                    <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 rounded-full animate-pulse">
                      NEW ✉️
                    </span>
                  )}
                  <span className="text-muted text-xs ml-1">{chatOpen ? "▲" : "▼"}</span>
                </button>

                {/* Expandable chat body */}
                {chatOpen && (
                  <>
                    {/* Messages list */}
                    <div className="px-3 py-3 space-y-2 max-h-[180px] overflow-y-auto">
                      {allMessages.length === 0 && (
                        <div className="text-center py-4">
                          <div className="text-2xl mb-1">💬</div>
                          <p className="text-[11px] text-muted">Say hi to your driver!</p>
                        </div>
                      )}
                      {allMessages.map((msg) => {
                        const isMine = msg.sender_role === "CUSTOMER";
                        const timeStr = msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now";
                        return (
                          <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-1.5`}>
                            {!isMine && (
                              <div
                                className="h-6 w-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 mb-0.5"
                                style={{
                                  background: "linear-gradient(135deg, #0E7490, #06B6D430)",
                                  border: "1px solid rgba(6,182,212,0.3)",
                                }}
                              >
                                👨‍✈️
                              </div>
                            )}
                            <div
                              className={`max-w-[78%] px-3 py-2 text-xs shadow-md ${
                                isMine
                                  ? "rounded-2xl rounded-br-sm text-white"
                                  : "rounded-2xl rounded-bl-sm text-slate-100"
                              }`}
                              style={
                                isMine
                                  ? { background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }
                                  : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }
                              }
                            >
                              <p className="leading-snug">{msg.text}</p>
                              <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                                <span className="text-[9px] font-mono opacity-60">{timeStr}</span>
                                {isMine && <span className="text-[9px] text-blue-200/70">✓</span>}
                              </div>
                            </div>
                            {isMine && (
                              <div
                                className="h-6 w-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 mb-0.5 font-bold text-white"
                                style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
                              >
                                U
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick reply chips */}
                    <div
                      className="flex gap-1.5 px-3 pb-2 overflow-x-auto"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleSend(chip)}
                          disabled={sending}
                          className="text-[10px] font-medium text-slate-300 whitespace-nowrap px-2.5 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            background: "rgba(37,99,235,0.12)",
                            border: "1px solid rgba(37,99,235,0.3)",
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Text input row */}
                    <div
                      className="flex items-center gap-2 px-3 pb-3"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                        placeholder="Type a message to driver…"
                        className="flex-1 rounded-2xl text-xs text-white placeholder-muted/60 px-3.5 py-2.5 focus:outline-none transition-colors"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "rgba(37,99,235,0.5)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || sending}
                        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-35 shadow-lg"
                        style={{
                          background: input.trim()
                            ? "linear-gradient(135deg, #2563EB, #06B6D4)"
                            : "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {sending ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Cancel button */}
              <button
                onClick={onCancel}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-400 transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.color = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "";
                }}
              >
                Cancel Booking
              </button>
            </>
          )}

          {/* ── ACCEPTED STATE ── */}
          {state === "accepted" && (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-5xl shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #059669, #10B981)",
                    boxShadow: "0 0 50px rgba(16,185,129,0.5), 0 0 100px rgba(16,185,129,0.15)",
                  }}
                >
                  ✓
                </div>
              </div>
              <div>
                <h2 className="font-display text-2xl font-black text-white">Ride Confirmed!</h2>
                <p className="text-sm text-emerald-400 mt-1 font-medium">
                  {driverName} has accepted your ride
                </p>
                <p className="text-xs text-muted mt-2">Taking you to live trip tracker…</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPlaceFromParams(label: string | null, latParam: string | null, lngParam: string | null): Place {
  const lat = latParam ? parseFloat(latParam) : NaN;
  const lng = lngParam ? parseFloat(lngParam) : NaN;
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && label) {
    return { label, lat, lng };
  }
  return resolvePlaceCoordinates(label);
}

// ── Main ─────────────────────────────────────────────────
function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const pickup      = getPlaceFromParams(params.get("pickup"), params.get("pickupLat"), params.get("pickupLng"));
  const drop        = getPlaceFromParams(params.get("drop"), params.get("dropLat"), params.get("dropLng"));
  const rideType    = (params.get("rideType") as RideType) || "OUTSTATION";
  const vehicleType = (params.get("vehicleType") as VehicleType) || "SUV";

  const [result,  setResult]  = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  // Acceptance overlay state
  const [pendingRide, setPendingRide] = useState<{
    id: string;
    driverName: string;
    fare: number;
    vehicleType: VehicleType;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.searchRides({
      pickupText: pickup.label, pickupLat: pickup.lat, pickupLng: pickup.lng,
      dropText:   drop.label,   dropLat:   drop.lat,   dropLng:   drop.lng,
      vehicleType, rideType,
    })
      .then(setResult)
      .catch((e) => setError(e.message || "Search failed."))
      .finally(() => setLoading(false));
  }, [pickup.label, pickup.lat, pickup.lng, drop.label, drop.lat, drop.lng, vehicleType, rideType]);

  async function handleBook(driver: DriverResult) {
    const token = window.localStorage.getItem("cab8_token");
    if (!token) { router.push("/login"); return; }
    setBooking(true); setError(null);
    try {
      const ride = await api.bookRide({
        pickupText: pickup.label, pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropText:   drop.label,   dropLat:   drop.lat,   dropLng:   drop.lng,
        vehicleType, rideType, driverId: driver.driverId,
      });
      // Show acceptance waiting overlay instead of immediate redirect
      setPendingRide({
        id: ride.id,
        driverName: driver.driverName,
        fare: driver.fare,
        vehicleType: driver.vehicleType,
      });
    } catch (e: any) {
      setError(e.message || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  function handleCancelAcceptance() {
    setPendingRide(null);
  }

  function handleAccepted() {
    if (pendingRide) {
      router.push(`/booking/${pendingRide.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col pb-12">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
      </div>

      <div className="mx-auto max-w-lg w-full flex flex-col flex-1">
        {/* ── Header ── */}
        <header className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-4 border-b border-navy-border/50">
          <Link
            href="/home"
            className="h-9 w-9 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white hover:border-blue-primary/40 transition-all flex-shrink-0"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-white text-base truncate">
              {pickup.label} → {drop.label}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {VEHICLE_ICONS[vehicleType]} {vehicleType} · {rideType}
            </p>
          </div>
        </header>

        {/* ── Route + Distance card ── */}
        {result && (
          <div className="relative z-10 px-5 mt-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.08))", border: "1px solid rgba(37,99,235,0.25)" }}
            >
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="h-2.5 w-2.5 rounded-full bg-green" />
                <span className="w-px h-8 bg-blue-primary/40" />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#06B6D4" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{pickup.label}</p>
                <p className="text-sm text-muted truncate mt-2">{drop.label}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display text-2xl font-bold text-white">{result.tripDistanceKm}</div>
                <div className="text-xs text-muted">km</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Driver list ── */}
        <div className="relative z-10 px-5 py-4">

        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-muted">
            <div className="h-12 w-12 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
            <p className="text-sm font-medium text-white">Finding nearby drivers…</p>
            <p className="text-xs text-muted">Searching in {pickup.label} area</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4">
            ⚠️ {error}
          </div>
        )}

        {result && !loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-white">
                  {result.drivers.length} Driver{result.drivers.length !== 1 ? "s" : ""} Available
                </h2>
                <p className="text-xs text-muted mt-0.5">Est. fare from ₹{result.baseFareEstimate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="dot-online scale-75" />
                <span className="text-xs text-green font-mono">Live</span>
              </div>
            </div>

            {result.drivers.length === 0 ? (
              <div className="rounded-3xl border border-navy-border bg-navy-card text-center py-14 px-6">
                <div className="text-5xl mb-4">😔</div>
                <h3 className="font-display font-bold text-white mb-2">No drivers available</h3>
                <p className="text-sm text-muted mb-5">Try a different vehicle type or check back shortly</p>
                <Link href="/home" className="btn-gradient inline-flex">← Change Search</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {result.drivers.map((d) => (
                  <DriverCard key={d.driverId} driver={d} onBook={handleBook} booking={booking} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>

      {/* ── Driver Acceptance Overlay (Ola / Uber style) ── */}
      {pendingRide && (
        <DriverAcceptanceOverlay
          rideId={pendingRide.id}
          driverName={pendingRide.driverName}
          fare={pendingRide.fare}
          vehicleType={pendingRide.vehicleType}
          onCancel={handleCancelAcceptance}
          onAccepted={handleAccepted}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
