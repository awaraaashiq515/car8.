"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { driverApi, VehicleType } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";

// Suggested ranges per vehicle type
const VEHICLE_RANGES: Record<VehicleType, { min: number; max: number; suggested: number; label: string; icon: string }> = {
  // CAR
  HATCHBACK:    { min: 10, max: 22,   suggested: 15,  label: "Hatchback",    icon: "🚗" },
  SEDAN:        { min: 14, max: 28,   suggested: 20,  label: "Sedan",        icon: "🚙" },
  SUV:          { min: 18, max: 40,   suggested: 25,  label: "SUV",          icon: "🚐" },
  LUXURY:       { min: 28, max: 100,  suggested: 40,  label: "Luxury",       icon: "🏎️" },
  // BIKE
  BIKE:         { min: 5,  max: 15,   suggested: 8,   label: "Bike",         icon: "🏍️" },
  ELECTRIC_BIKE:{ min: 4,  max: 12,   suggested: 7,   label: "E-Bike",       icon: "⚡" },
  // AUTO
  AUTO:         { min: 7,  max: 18,   suggested: 10,  label: "Auto",         icon: "🛺" },
  E_RICKSHAW:   { min: 5,  max: 14,   suggested: 8,   label: "E-Rickshaw",   icon: "🛺" },
  // GOODS
  PICKUP_TRUCK: { min: 14, max: 35,   suggested: 20,  label: "Pickup Truck", icon: "🚛" },
  MINI_TRUCK:   { min: 18, max: 45,   suggested: 25,  label: "Mini Truck",   icon: "🚚" },
  TEMPO:        { min: 15, max: 40,   suggested: 22,  label: "Tempo",        icon: "🚐" },
  TRUCK:        { min: 22, max: 60,   suggested: 32,  label: "Truck",        icon: "🚛" },
  // HEAVY (rates in ₹/hr shown as per-km equivalent for UI)
  JCB:          { min: 50, max: 200,  suggested: 90,  label: "JCB",          icon: "🚜" },
  TRACTOR:      { min: 30, max: 120,  suggested: 55,  label: "Tractor",      icon: "🚜" },
  CRANE:        { min: 80, max: 500,  suggested: 120, label: "Crane",        icon: "🏗️" },
  TIPPER:       { min: 40, max: 150,  suggested: 65,  label: "Tipper",       icon: "🚧" },
};

// Ride type surcharges — must match backend fare.ts exactly
const RIDE_MULTIPLIERS = [
  { type: "LOCAL",      label: "Local City",    surcharge: 0,   color: "#06B6D4", icon: "🏙️" },
  { type: "OUTSTATION", label: "Outstation",    surcharge: 0,   color: "#10B981", icon: "🛣️" },
  { type: "AIRPORT",    label: "Airport",       surcharge: 100, color: "#F59E0B", icon: "✈️" },
  { type: "HOURLY",     label: "Hourly",        surcharge: 0,   color: "#A855F7", icon: "⏱️" },
];

// Distance preview points
const PREVIEW_KMS = [5, 10, 20, 50];

function RateSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #2563EB ${pct}%, #1A2E45 ${pct}%)`,
        }}
      />
      {/* Tick marks */}
      <div className="flex justify-between text-[10px] text-muted mt-2 font-mono">
        <span>₹{min}</span>
        <span>₹{Math.round((min + max) / 2)}</span>
        <span>₹{max}</span>
      </div>
    </div>
  );
}

export default function DriverRatesPage() {
  const router = useRouter();

  const [vehicleType,  setVehicleType]  = useState<VehicleType>("SEDAN");
  const [city,         setCity]         = useState<string>("");
  const [rate,         setRate]         = useState<number>(18);
  const [savedRate,    setSavedRate]    = useState<number>(18);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);

  const range = VEHICLE_RANGES[vehicleType] ?? VEHICLE_RANGES.SEDAN;
  const isDirty = rate !== savedRate;

  // Load current rates on mount
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cab8_driver_token")
        : null;
    if (!token) { router.replace("/driver/login"); return; }

    driverApi.getRates()
      .then((data) => {
        setRate(data.rate_per_km);
        setSavedRate(data.rate_per_km);
        setVehicleType(data.vehicle_type);
        setCity(data.city);
      })
      .catch((e: any) => setError(e.message || "Could not load rates."))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await driverApi.updateRates(rate);
      setSavedRate(res.rate_per_km);
      setRate(res.rate_per_km);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save rate.");
    } finally {
      setSaving(false);
    }
  }, [rate]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-navy-deep pb-28">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #10B981 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
            >
              ₹
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">My Rates</h1>
              <p className="text-xs text-muted">
                {city ? `${city} · ` : ""}{vehicleType && VEHICLE_RANGES[vehicleType]?.label}
              </p>
            </div>
          </div>
          <Link href="/driver/dashboard" className="btn-ghost text-xs">
            ← Dashboard
          </Link>
        </div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <div className="h-8 w-8 rounded-full border-2 border-green/30 border-t-green animate-spin" />
            <p className="text-sm">Loading your rates…</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4 animate-fade-up">
            {/* ── Current Rate — Big Number ──────────────────────────── */}
            <div
              className="card text-center py-8 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0D2A1A 0%, #0D1B2E 100%)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <div
                className="absolute inset-0 opacity-5"
                style={{ background: "radial-gradient(ellipse at center, #10B981 0%, transparent 70%)" }}
              />
              <p className="text-xs font-mono uppercase tracking-widest text-green/70 mb-2">
                Your Rate Per KM
              </p>
              <div className="flex items-end justify-center gap-1">
                <span className="font-display text-6xl font-black text-white">
                  ₹{rate % 1 === 0 ? rate : rate.toFixed(1)}
                </span>
                <span className="text-lg text-muted mb-2 font-mono">/km</span>
              </div>

              {/* Saved / unsaved indicator */}
              <div className="mt-3">
                {isDirty ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" />
                    Saved · ₹{savedRate}/km
                  </span>
                )}
              </div>
            </div>

            {/* ── Slider Card ────────────────────────────────────────── */}
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Set Your Rate
                </h2>
                {/* Quick input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">₹</span>
                  <input
                    id="rate-input"
                    type="number"
                    min={range.min}
                    max={range.max}
                    step={0.5}
                    value={rate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setRate(Math.min(Math.max(v, range.min), range.max));
                    }}
                    className="w-16 rounded-xl border border-navy-border bg-navy-deep px-2 py-1 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-primary"
                  />
                  <span className="text-xs text-muted">/km</span>
                </div>
              </div>

              <RateSlider
                value={rate}
                min={range.min}
                max={range.max}
                onChange={setRate}
              />

              {/* Suggested bands */}
              <div className="rounded-xl bg-navy-deep border border-navy-border p-3">
                <p className="text-[10px] font-mono uppercase text-muted mb-2">
                  Suggested for {VEHICLE_RANGES[vehicleType]?.icon} {VEHICLE_RANGES[vehicleType]?.label}
                </p>
                <div className="flex items-center gap-2">
                  {/* Low band */}
                  <div className="flex-1 rounded-lg bg-navy-card border border-navy-border p-2 text-center">
                    <p className="text-[10px] text-muted">Economy</p>
                    <p className="text-sm font-bold text-white">₹{range.min}–{range.suggested - 1}</p>
                  </div>
                  {/* Suggested */}
                  <div
                    className="flex-1 rounded-lg p-2 text-center border"
                    style={{ background: "rgba(37,99,235,0.1)", borderColor: "rgba(37,99,235,0.4)" }}
                  >
                    <p className="text-[10px] text-blue-light">Recommended</p>
                    <p className="text-sm font-bold text-white">₹{range.suggested}–{range.suggested + 4}</p>
                  </div>
                  {/* Premium */}
                  <div
                    className="flex-1 rounded-lg p-2 text-center border"
                    style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)" }}
                  >
                    <p className="text-[10px] text-amber-400">Premium</p>
                    <p className="text-sm font-bold text-white">₹{range.suggested + 5}+</p>
                  </div>
                </div>

                {/* Quick-set buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setRate(range.min)}
                    className="flex-1 py-1.5 rounded-lg border border-navy-border text-[11px] text-muted hover:text-white hover:border-blue-primary/40 transition-colors"
                  >
                    ₹{range.min} Min
                  </button>
                  <button
                    onClick={() => setRate(range.suggested)}
                    className="flex-1 py-1.5 rounded-lg border border-blue-primary/40 text-[11px] text-blue-light hover:bg-blue-primary/10 transition-colors font-semibold"
                  >
                    ₹{range.suggested} Suggested ✦
                  </button>
                  <button
                    onClick={() => setRate(range.max)}
                    className="flex-1 py-1.5 rounded-lg border border-navy-border text-[11px] text-muted hover:text-white hover:border-amber-400/40 transition-colors"
                  >
                    ₹{range.max} Max
                  </button>
                </div>
              </div>
            </div>

            {/* ── Live Earnings Preview ──────────────────────────────── */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  💰 Earnings Preview
                </h2>
                <span className="text-[10px] text-muted font-mono">₹50 base + ₹{rate}/km</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PREVIEW_KMS.map((km) => {
                  // Match backend formula exactly: BASE_FARE(50) + km * rate
                  const earn = Math.round(50 + rate * km);
                  return (
                    <div
                      key={km}
                      className="rounded-xl border border-navy-border bg-navy-deep p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-muted">{km} km trip</p>
                        <p className="text-[11px] text-muted/60 font-mono">
                          ₹50 + ₹{rate}×{km}
                        </p>
                      </div>
                      <span className="font-display font-bold text-green text-lg">
                        ₹{earn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Ride Type Surcharges (Info) ──────────────────────── */}
            <div className="card space-y-3">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">
                🗂️ Fare by Ride Type (for 20 km trip)
              </h2>
              <p className="text-[11px] text-muted leading-relaxed">
                Your base rate applies equally for all ride types. Airport rides include a ₹100 fixed surcharge.
              </p>
              <div className="space-y-2">
                {RIDE_MULTIPLIERS.map((rm) => {
                  // Backend formula: ₹50 base + km * rate + surcharge
                  const exampleFare = Math.round(50 + 20 * rate + rm.surcharge);
                  return (
                    <div
                      key={rm.type}
                      className="flex items-center gap-3 rounded-xl border border-navy-border bg-navy-deep p-3"
                    >
                      <span className="text-lg w-7 flex-shrink-0 text-center">{rm.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{rm.label}</p>
                        <p className="text-[11px] text-muted font-mono">
                          {rm.surcharge === 0 ? "No extra surcharge" : `+₹${rm.surcharge} fixed surcharge`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold font-mono text-sm" style={{ color: rm.color }}>
                          ₹{exampleFare}
                        </p>
                        <p className="text-[10px] text-muted">20km fare</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Error / Success ────────────────────────────────────── */}
            {error && (
              <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red flex items-center gap-2">
                ⚠️ {error}
                <button onClick={() => setError(null)} className="ml-auto text-red/70 hover:text-red">✕</button>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green/10 border border-green/30 px-4 py-3 text-sm text-green flex items-center gap-2 animate-fade-up">
                ✅ Rate saved successfully! New rate: ₹{savedRate}/km
              </div>
            )}

            {/* ── Save Button ────────────────────────────────────────── */}
            <button
              id="save-rate-btn"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-50"
              style={{
                background: isDirty
                  ? "linear-gradient(135deg, #10B981, #06B6D4)"
                  : "transparent",
                border: isDirty ? "none" : "1px solid #1A2E45",
                color: isDirty ? "#fff" : "#4A6080",
                boxShadow: isDirty ? "0 0 20px rgba(16,185,129,0.3)" : "none",
              }}
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              ) : isDirty ? (
                `💾 Save Rate — ₹${rate % 1 === 0 ? rate : rate.toFixed(1)}/km`
              ) : (
                "✓ Rate Saved"
              )}
            </button>

            {/* ── Tip ────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-navy-border bg-navy-deep/50 p-4 text-xs text-muted leading-relaxed">
              <strong className="text-blue-light">💡 Tip:</strong> Setting a competitive rate helps you get more ride requests.
              Too high and customers may choose another driver. Too low and you earn less. Find the right balance!
            </div>
          </div>
        )}
      </div>

      <DriverBottomNav />
    </main>
  );
}
