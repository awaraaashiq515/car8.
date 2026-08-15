"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { boardApi, PostType, VehicleType } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";
import LocationInput from "@/components/LocationInput";

const VEHICLE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: "HATCHBACK", label: "Hatchback", icon: "🚗" },
  { value: "SEDAN",     label: "Sedan",     icon: "🚙" },
  { value: "SUV",       label: "SUV",       icon: "🚐" },
  { value: "LUXURY",    label: "Luxury",    icon: "🏎️" },
];

// Tomorrow's date as default
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function PostBoardPage() {
  const router = useRouter();

  // Form state
  const [postType,     setPostType]     = useState<PostType>("LOOKING");
  const [fromText,     setFromText]     = useState("");
  const [toText,       setToText]       = useState("");
  const [travelDate,   setTravelDate]   = useState(tomorrow());
  const [travelTime,   setTravelTime]   = useState("");
  const [seats,        setSeats]        = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState<string>("");
  const [vehicleType,  setVehicleType]  = useState<VehicleType | "">("");
  const [description,  setDescription]  = useState("");
  const [luggageInfo,  setLuggageInfo]  = useState("");
  const [notes,        setNotes]        = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const custToken   = typeof window !== "undefined" ? window.localStorage.getItem("cab8_token") : null;
    const driverToken = typeof window !== "undefined" ? window.localStorage.getItem("cab8_driver_token") : null;
    const role        = typeof window !== "undefined" ? window.localStorage.getItem("cab8_role") : null;

    if (!custToken && !driverToken) {
      router.replace("/login");
      return;
    }

    // Customers are not allowed to post — redirect back to board
    const isDriver = !!driverToken || role === "DRIVER";
    if (!isDriver) {
      router.replace("/board");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fromText.trim()) { setError("Please enter your departure location."); return; }
    if (!toText.trim())   { setError("Please enter your destination."); return; }
    if (!travelDate)      { setError("Please select a travel date."); return; }

    setSubmitting(true);
    try {
      await boardApi.create({
        post_type:      postType,
        from_text:      fromText.trim(),
        to_text:        toText.trim(),
        travel_date:    travelDate,
        travel_time:    travelTime || undefined,
        seats:          seats,
        price_per_seat: pricePerSeat ? parseFloat(pricePerSeat) : null,
        vehicle_type:   vehicleType || null,
        description:    description.trim() || null,
        luggage_info:   luggageInfo.trim() || null,
        notes:          notes.trim() || null,
      });
      router.push("/board");
    } catch (e: any) {
      setError(e.message || "Failed to post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isOffering = postType === "OFFERING";

  return (
    <main className="min-h-screen bg-navy-deep pb-28">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/board"
            className="h-9 w-9 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white hover:border-blue-primary/40 transition-all"
          >
            ←
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Post a Ride</h1>
            <p className="text-xs text-muted">Share your journey with others</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Post Type Toggle ── */}
          <div className="card space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">I am…</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "LOOKING",  icon: "🔍", label: "Looking for a ride",    sub: "I need someone to take me" },
                { value: "OFFERING", icon: "🚗", label: "Offering seats",        sub: "I have space in my vehicle" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPostType(opt.value)}
                  className="rounded-2xl border p-4 text-left transition-all"
                  style={
                    postType === opt.value
                      ? {
                          background: opt.value === "LOOKING"
                            ? "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))"
                            : "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))",
                          borderColor: opt.value === "LOOKING" ? "rgba(245,158,11,0.5)" : "rgba(16,185,129,0.5)",
                          boxShadow: opt.value === "LOOKING"
                            ? "0 0 16px rgba(245,158,11,0.15)"
                            : "0 0 16px rgba(16,185,129,0.15)",
                        }
                      : { borderColor: "#1A2E45", background: "#0D1B2E" }
                  }
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <p className={`text-sm font-bold ${postType === opt.value ? "text-white" : "text-muted"}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-snug">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Route ── */}
          <div className="card space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Route</p>

            <LocationInput
              label="📍 From (Departure)"
              value={fromText}
              onChange={setFromText}
              placeholder="Search or enter departure location…"
              isPickup
            />

            <LocationInput
              label="🏁 To (Destination)"
              value={toText}
              onChange={setToText}
              placeholder="Search or enter destination location…"
            />
          </div>

          {/* ── Date & Time ── */}
          <div className="card space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">When</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">📅 Travel Date</label>
                <input
                  id="date-input"
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-primary/60"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">⏰ Time (optional)</label>
                <input
                  id="time-input"
                  type="time"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  className="w-full rounded-xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-primary/60"
                />
              </div>
            </div>
          </div>

          {/* ── Seats & Price ── */}
          <div className="card space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {isOffering ? "Seats & Pricing" : "Seats Needed"}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Seats counter */}
              <div>
                <label className="text-xs text-muted mb-1 block">💺 Seats</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.max(1, s - 1))}
                    className="h-10 w-10 rounded-xl border border-navy-border bg-navy-deep text-white font-bold hover:border-blue-primary/40 transition-colors flex-shrink-0 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-display text-xl font-bold text-white">
                    {seats}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.min(20, s + 1))}
                    className="h-10 w-10 rounded-xl border border-navy-border bg-navy-deep text-white font-bold hover:border-blue-primary/40 transition-colors flex-shrink-0 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price per seat */}
              <div>
                <label className="text-xs text-muted mb-1 block">
                  💰 Price/seat {isOffering ? "(required)" : "(optional)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                  <input
                    id="price-input"
                    type="number"
                    min={0}
                    step={50}
                    placeholder="0"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                    className="w-full rounded-xl border border-navy-border bg-navy-deep pl-7 pr-3 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue-primary/60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Vehicle type (optional) ── */}
          <div className="card space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Vehicle Type (optional)</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setVehicleType("")}
                className="rounded-xl border py-2.5 text-center text-[10px] transition-all"
                style={
                  !vehicleType
                    ? { borderColor: "#2563EB", background: "rgba(37,99,235,0.15)", color: "#93C5FD" }
                    : { borderColor: "#1A2E45", background: "#0D1B2E", color: "#4A6080" }
                }
              >
                Any
              </button>
              {VEHICLE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVehicleType(v.value)}
                  className="rounded-xl border py-2.5 text-center transition-all"
                  style={
                    vehicleType === v.value
                      ? { borderColor: "#2563EB", background: "rgba(37,99,235,0.15)" }
                      : { borderColor: "#1A2E45", background: "#0D1B2E" }
                  }
                >
                  <div className="text-lg">{v.icon}</div>
                  <div className="text-[9px] text-muted mt-0.5">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Trip Description ── */}
          <div className="card space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Trip Description (optional)</p>
            <textarea
              id="description-input"
              placeholder="e.g. AC car, comfortable journey, departing from main bus stand, ladies welcome…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full rounded-xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue-primary/60 resize-none"
            />
            <p className="text-[10px] text-muted text-right font-mono">{description.length}/1000</p>
          </div>

          {/* ── Luggage & Items ── */}
          <div className="card space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">🎒 Luggage & Items Allowed (optional)</p>
            <textarea
              id="luggage-input"
              placeholder="e.g. 1 bag per person, no pets, no heavy luggage…"
              value={luggageInfo}
              onChange={(e) => setLuggageInfo(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full rounded-xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue-primary/60 resize-none"
            />
            <p className="text-[10px] text-muted text-right font-mono">{luggageInfo.length}/300</p>
          </div>

          {/* ── Notes ── */}
          <div className="card space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Additional Notes (optional)</p>
            <textarea
              id="notes-input"
              placeholder="e.g. Meeting point details, special instructions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full rounded-xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue-primary/60 resize-none"
            />
            <p className="text-[10px] text-muted text-right font-mono">{notes.length}/300</p>
          </div>

          {/* ── Info box ── */}
          <div className="rounded-xl border border-navy-border bg-navy-deep/50 p-3 text-xs text-muted leading-relaxed">
            <strong className="text-blue-light">ℹ️ Info:</strong> Your phone number will be visible to customers — they can WhatsApp or call you directly.
            Posts automatically expire after 30 days.
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
              ⚠️ {error}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            id="submit-post-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-50 transition-all"
            style={{
              background: "linear-gradient(135deg,#7C3AED,#A855F7)",
              boxShadow: "0 0 20px rgba(168,85,247,0.3)",
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Posting…
              </span>
            ) : (
              `📋 Post ${postType === "LOOKING" ? "Ride Request" : "Ride Offer"}`
            )}
          </button>
        </form>
      </div>
      <DriverBottomNav />
    </main>
  );
}
