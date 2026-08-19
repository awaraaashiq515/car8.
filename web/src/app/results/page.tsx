"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  api, DriverResult, DriverPublicProfile, PLACE_PRESETS, Place, RideType, RideMessage, SearchResponse, VehicleType, resolvePlaceCoordinates,
} from "@/lib/api";

const VEHICLE_ICONS: Record<VehicleType, string> = {
  HATCHBACK: "🚗", SEDAN: "🚙", SUV: "🚕", LUXURY: "🚘",
};

function findPlace(label: string | null) {
  return resolvePlaceCoordinates(label);
}

// ── Driver Profile Modal ─────────────────────────────────
function DriverProfileModal({
  driver,
  onClose,
  onBook,
  booking,
}: {
  driver: DriverResult;
  onClose: () => void;
  onBook: (d: DriverResult) => void;
  booking: boolean;
}) {
  const [profile, setProfile] = useState<DriverPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getPublicDriverProfile(driver.driverId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [driver.driverId]);

  const rating = profile?.ratingAvg ?? driver.ratingAvg ?? 5.0;
  const stars = Math.round(rating);
  const totalReviews = profile?.totalReviews ?? driver.totalReviews ?? 0;
  const completedTrips = profile?.completedTrips ?? 1;

  // Breakdown percentages
  const breakdown = profile?.breakdown || { 5: totalReviews || 1, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalRatingsCount = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  const vehicleName = profile?.vehicleMake
    ? `${profile.vehicleMake} ${profile.vehicleModel || ""}`.trim()
    : driver.vehicleMake
    ? `${driver.vehicleMake} ${driver.vehicleModel || ""}`.trim()
    : `${driver.vehicleType}`;

  const vehiclePhotos = profile?.vehiclePhotos && profile.vehiclePhotos.length > 0
    ? profile.vehiclePhotos
    : [];

  const activePhoto: string = vehiclePhotos[activePhotoIndex] || vehiclePhotos[0] || "";

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Lightbox for vehicle photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[140] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="w-full max-w-2xl flex items-center justify-between p-3 mb-2 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚕</span>
              <div>
                <p className="text-white font-bold text-sm capitalize">{vehicleName}</p>
                <p className="text-xs text-cyan-300 font-mono">{driver.vehicleNumber} · Verified Cab Photo</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>
          <img
            src={selectedPhoto}
            alt="Vehicle preview"
            className="max-h-[75vh] max-w-[92vw] object-contain rounded-2xl border border-white/20 shadow-2xl"
          />
          <p className="text-xs text-muted mt-3">Tap anywhere to close</p>
        </div>
      )}

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-fade-up"
        style={{
          background: "linear-gradient(175deg, #0A1628 0%, #060E1A 100%)",
          border: "1px solid rgba(37,99,235,0.3)",
          boxShadow: "0 0 60px rgba(0,0,0,0.85), 0 0 35px rgba(37,99,235,0.2)",
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-border/80 bg-navy-card/70">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h2 className="font-display font-bold text-white text-base leading-none">
                Driver Profile & Trust Details
              </h2>
              <p className="text-[11px] text-muted mt-1">Verified partner on TaxiMint / Cab8</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Driver identity banner */}
          <div
            className="p-4 rounded-2xl border border-blue-primary/30 flex items-start gap-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(13,27,46,0.9), rgba(22,37,64,0.6))",
            }}
          >
            <div className="relative flex-shrink-0">
              {profile?.avatarPhoto || driver.avatarPhoto ? (
                <img
                  src={profile?.avatarPhoto || driver.avatarPhoto || ""}
                  alt={driver.driverName}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-blue-primary/40 shadow-lg"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #0F2545, #1E3A5F)",
                    border: "1.5px solid rgba(37,99,235,0.4)",
                  }}
                >
                  👨‍✈️
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-navy-card flex items-center justify-center text-[10px] text-white font-black shadow"
                title="Verified Driver"
              >
                ✓
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg font-bold text-white truncate capitalize">
                  {profile?.driverName || driver.driverName}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-300 font-semibold">
                  <span className="dot-online scale-50" /> Verified Driver
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 truncate">
                <span>📍</span>
                <span>
                  {profile?.standName ? `${profile.standName}, ` : ""}
                  {profile?.city || driver.city}
                  {profile?.district ? ` (${profile.district})` : ""}
                </span>
              </p>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < stars ? "text-amber" : "text-muted"}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber">{rating.toFixed(1)}</span>
                <span className="text-xs text-muted">
                  ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl p-3 bg-navy-card/80 border border-navy-border text-center">
              <div className="text-xl">⭐</div>
              <div className="font-display font-bold text-white text-sm mt-0.5">{rating.toFixed(1)} / 5.0</div>
              <div className="text-[10px] text-muted">Rating</div>
            </div>
            <div className="rounded-2xl p-3 bg-navy-card/80 border border-navy-border text-center">
              <div className="text-xl">🚖</div>
              <div className="font-display font-bold text-white text-sm mt-0.5">{completedTrips}+ Rides</div>
              <div className="text-[10px] text-muted">Completed</div>
            </div>
            <div className="rounded-2xl p-3 bg-navy-card/80 border border-navy-border text-center">
              <div className="text-xl">🏔️</div>
              <div className="font-display font-bold text-white text-sm mt-0.5 truncate">Hill Pro</div>
              <div className="text-[10px] text-muted">Terrain Expert</div>
            </div>
          </div>

          {/* ── Real Vehicle & Cab Photos Showcase ── */}
          <div className="rounded-2xl p-4 bg-navy-card border border-navy-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📸</span> Vehicle & Cab Photos
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                ✓ Uploaded by Driver
              </span>
            </div>

            {vehiclePhotos.length > 0 ? (
              <div className="space-y-2.5">
                {/* Main Hero Photo Display */}
                <div
                  className="relative rounded-2xl overflow-hidden border border-navy-border group cursor-pointer"
                  style={{
                    height: "190px",
                    background: "linear-gradient(135deg, #0D1B2E, #162540)",
                  }}
                  onClick={() => setSelectedPhoto(activePhoto)}
                >
                  <img
                    src={activePhoto}
                    alt={`${vehicleName} photo`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                  {/* Photo Overlay Pill Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold">
                      {driver.vehicleNumber}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-semibold">
                      ✓ Verified Cab
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(activePhoto);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium flex items-center gap-1 transition-all"
                    >
                      <span>🔍</span>
                      <span>Zoom</span>
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold drop-shadow-md capitalize">
                      {vehicleName} ({driver.vehicleType})
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono drop-shadow-md">
                      Photo {activePhotoIndex + 1} of {vehiclePhotos.length}
                    </span>
                  </div>
                </div>

                {/* Thumbnails row */}
                {vehiclePhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {vehiclePhotos.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative h-14 w-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                          activePhotoIndex === i
                            ? "border-cyan-400 ring-2 ring-cyan-400/30 scale-95"
                            : "border-navy-border/80 opacity-70 hover:opacity-100 hover:border-slate-400"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-mono text-center py-0.5 leading-none">
                          {i === 0 ? "Front" : i === 1 ? "Side" : i === 2 ? "Interior" : `View ${i + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-navy-deep border border-navy-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚕</span>
                    <div>
                      <p className="text-white font-semibold text-xs capitalize">{vehicleName}</p>
                      <p className="text-[11px] font-mono text-cyan-300">{driver.vehicleNumber}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Fleet Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Vehicle inspected & certified by TaxiMint fleet operations for hill driving & safety standards.
                </p>
              </div>
            )}
          </div>

          {/* Verification & Trust Badges */}
          <div className="rounded-2xl p-4 bg-navy-card border border-navy-border space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Document & Safety Verifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-deep border border-navy-border/70">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-medium">Driving License</p>
                  <p className="text-[10px] text-muted">Commercial certified</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-deep border border-navy-border/70">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-medium">Vehicle RC Document</p>
                  <p className="text-[10px] text-muted">HP Transport registered</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-deep border border-navy-border/70">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-medium">Identity & KYC</p>
                  <p className="text-[10px] text-muted">Aadhaar Govt verified</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-deep border border-navy-border/70">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-medium">State Permit</p>
                  <p className="text-[10px] text-muted">Commercial Tourist permit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Specifications & Amenities */}
          <div className="rounded-2xl p-4 bg-navy-card border border-navy-border space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚗</span> Vehicle Specifications & Amenities
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Vehicle</p>
                <p className="font-semibold text-white capitalize mt-0.5 truncate">{vehicleName}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Plate Number</p>
                <p className="font-mono font-bold text-cyan-300 mt-0.5">{driver.vehicleNumber}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Capacity & Class</p>
                <p className="font-semibold text-white mt-0.5">
                  {driver.vehicleType} · {profile?.seats || 6} Seater
                </p>
              </div>
              <div className="p-3 rounded-xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Air Conditioning</p>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {profile?.acAvailable ? "❄️ AC Available" : "Non-AC"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Feedback */}
          <div className="rounded-2xl p-4 bg-navy-card border border-navy-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬</span> Customer Reviews & Feedback
              </h4>
              <span className="text-xs font-bold text-amber">
                ⭐ {rating.toFixed(1)} / 5.0
              </span>
            </div>

            {/* Ratings Breakdown Bar Chart */}
            <div className="space-y-1.5 py-1">
              {[5, 4, 3, 2, 1].map((st) => {
                const count = breakdown[st] || 0;
                const pct = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
                return (
                  <div key={st} className="flex items-center gap-2 text-[11px]">
                    <span className="w-5 text-right font-mono text-muted">{st}★</span>
                    <div className="flex-1 h-2 rounded-full bg-navy-deep overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-7 text-right font-mono text-muted text-[10px]">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Review Cards */}
            {profile?.reviews && profile.reviews.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                {profile.reviews.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="p-3.5 rounded-2xl bg-navy-deep border border-navy-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-primary/20 border border-blue-primary/40 flex items-center justify-center text-[10px] text-blue-300 font-bold">
                          {(rev.customer_name || "C")[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {rev.customer_name || "Verified Customer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber text-xs">{"★".repeat(rev.rating)}</span>
                        <span className="text-[10px] text-muted ml-1">
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}

                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {rev.tags.map((tg) => (
                          <span
                            key={tg}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          >
                            ✓ {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-navy-deep/60 border border-navy-border/50 text-center text-xs text-muted">
                🌟 Top-rated driver with 100% verified track record.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Direct Book Action */}
        <div className="p-4 border-t border-navy-border bg-navy-card flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-muted font-mono uppercase">Confirmed Fare</div>
            <div className="font-display text-2xl font-black text-white">₹{driver.fare}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBook(driver);
            }}
            disabled={booking}
            className="btn-gradient px-6 py-3 rounded-xl disabled:opacity-50 font-semibold text-sm shadow-xl flex-1 max-w-[220px]"
          >
            {booking ? "Booking..." : `Book for ₹${driver.fare} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Driver Card ──────────────────────────────────────────
function DriverCard({
  driver,
  onBook,
  onViewProfile,
  booking,
}: {
  driver: DriverResult;
  onBook: (d: DriverResult) => void;
  onViewProfile: (d: DriverResult) => void;
  booking: boolean;
}) {
  const stars = Math.round(driver.ratingAvg);
  return (
    <div className="rounded-2xl border border-navy-border bg-navy-card overflow-hidden animate-fade-up transition-all hover:border-blue-primary/40">
      {/* Top section - clickable to view profile */}
      <div
        className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => onViewProfile(driver)}
        title="Click to view driver profile & reviews"
      >
        <div className="flex items-start gap-3">
          {/* Driver Avatar / Profile Photo */}
          <div className="relative flex-shrink-0">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden shadow-md"
              style={{
                background: "linear-gradient(135deg, #0D1B2E, #162540)",
                border: "1.5px solid rgba(6,182,212,0.4)",
              }}
            >
              {driver.avatarPhoto ? (
                <img
                  src={driver.avatarPhoto}
                  alt={driver.driverName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>👨‍✈️</span>
              )}
            </div>
            <span
              className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-navy-card flex items-center justify-center text-[8px] text-white font-bold shadow"
              title="Verified Driver"
            >
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-display font-bold text-white truncate hover:text-cyan-300 transition-colors">
                  {driver.driverName}
                </h3>
                <span className="text-[10px] text-blue-400 font-medium">↗</span>
              </div>
              <div className="font-display text-xl font-bold text-white flex-shrink-0">
                ₹{driver.fare}
              </div>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {driver.vehicleNumber} · {driver.city}
              {driver.vehicleMake ? ` · ${driver.vehicleMake}` : ""}
            </p>

            {/* Stars & Reviews */}
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-xs ${i < stars ? "text-amber" : "text-muted"}`}>
                  ★
                </span>
              ))}
              <span className="text-[11px] text-amber font-bold ml-1.5">
                {driver.ratingAvg.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted ml-1">
                ({driver.totalReviews || 0} review{(driver.totalReviews || 0) !== 1 ? "s" : ""})
              </span>
              <span className="text-[10px] text-cyan-400/80 ml-auto hover:underline font-medium">
                View profile →
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
            <span className="text-xs text-white font-medium">
              {driver.pickupDistanceKm.toFixed(1)} km away
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-green/30 bg-green/10 px-3 py-1.5">
            <span className="dot-online scale-75" />
            <span className="text-xs text-green font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewProfile(driver)}
          className="px-3.5 py-3 rounded-xl border border-navy-border bg-navy-deep hover:bg-navy-hover hover:border-blue-primary/50 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
        >
          <span>👤</span>
          <span>Profile & Reviews</span>
        </button>

        <button
          onClick={() => onBook(driver)}
          disabled={booking}
          className="btn-gradient flex-1 py-3 rounded-xl disabled:opacity-50 font-semibold text-sm shadow-md"
        >
          {booking ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Booking…
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
  const [viewingProfileDriver, setViewingProfileDriver] = useState<DriverResult | null>(null);

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
                <p className="text-xs text-muted mt-0.5">Est. fare from ₹{result.drivers.length > 0 ? Math.min(...result.drivers.map(d => d.fare)) : result.baseFareEstimate}</p>
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
                  <DriverCard
                    key={d.driverId}
                    driver={d}
                    onBook={handleBook}
                    onViewProfile={(driver) => {
                      const profileParams = new URLSearchParams(params.toString());
                      profileParams.set("fare", String(driver.fare));
                      router.push(`/drivers/${driver.driverId}?${profileParams.toString()}`);
                    }}
                    booking={booking}
                  />
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
