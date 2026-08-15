"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  api, DriverResult, PLACE_PRESETS, RideType, SearchResponse, VehicleType, resolvePlaceCoordinates,
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

// ── Main ─────────────────────────────────────────────────
function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const pickup      = findPlace(params.get("pickup"));
  const drop        = findPlace(params.get("drop"));
  const rideType    = (params.get("rideType") as RideType) || "OUTSTATION";
  const vehicleType = (params.get("vehicleType") as VehicleType) || "SUV";

  const [result,  setResult]  = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api.searchRides({
      pickupText: pickup.label, pickupLat: pickup.lat, pickupLng: pickup.lng,
      dropText:   drop.label,   dropLat:   drop.lat,   dropLng:   drop.lng,
      vehicleType, rideType,
    })
      .then(setResult)
      .catch((e) => setError(e.message || "Search failed."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.label, drop.label, vehicleType, rideType]);

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
      router.push(`/booking/${ride.id}`);
    } catch (e: any) {
      setError(e.message || "Booking failed. Please try again.");
      setBooking(false);
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
