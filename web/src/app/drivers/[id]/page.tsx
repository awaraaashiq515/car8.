"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  api, DriverPublicProfile, VehicleType, RideType,
} from "@/lib/api";

const VEHICLE_ICONS: Record<VehicleType, string> = {
  HATCHBACK: "🚗", SEDAN: "🚙", SUV: "🚕", LUXURY: "🚘",
};

function DriverProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const driverId = params.id as string;

  // Optional trip query params if opened from search results
  const pickupText = searchParams.get("pickup") || "";
  const dropText = searchParams.get("drop") || "";
  const fareParam = searchParams.get("fare");
  const fare = fareParam ? parseFloat(fareParam) : null;
  const vehicleType = (searchParams.get("vehicleType") as VehicleType) || "SUV";
  const rideType = (searchParams.get("rideType") as RideType) || "OUTSTATION";
  const pickupLat = searchParams.get("pickupLat") ? parseFloat(searchParams.get("pickupLat")!) : null;
  const pickupLng = searchParams.get("pickupLng") ? parseFloat(searchParams.get("pickupLng")!) : null;
  const dropLat = searchParams.get("dropLat") ? parseFloat(searchParams.get("dropLat")!) : null;
  const dropLng = searchParams.get("dropLng") ? parseFloat(searchParams.get("dropLng")!) : null;

  const [profile, setProfile] = useState<DriverPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    api.getPublicDriverProfile(driverId)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load driver profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [driverId]);

  async function handleBookRide() {
    const token = window.localStorage.getItem("cab8_token");
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (!pickupText || !dropText || !pickupLat || !pickupLng || !dropLat || !dropLng) {
      // Redirect to home/search if booking without pickup/drop
      router.push(`/home`);
      return;
    }

    setBooking(true);
    try {
      const ride = await api.bookRide({
        pickupText,
        pickupLat,
        pickupLng,
        dropText,
        dropLat,
        dropLng,
        vehicleType,
        rideType,
        driverId,
      });
      router.push(`/booking/${ride.id}`);
    } catch (e: any) {
      alert(e.message || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  const rating = profile?.ratingAvg ?? 5.0;
  const stars = Math.round(rating);
  const totalReviews = profile?.totalReviews ?? 0;
  const completedTrips = profile?.completedTrips ?? 1;

  const breakdown = profile?.breakdown || { 5: totalReviews || 1, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalRatingsCount = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  const vehicleName = profile?.vehicleMake
    ? `${profile.vehicleMake} ${profile.vehicleModel || ""}`.trim()
    : profile?.vehicleType || "Cab";

  const vehiclePhotos = profile?.vehiclePhotos && profile.vehiclePhotos.length > 0
    ? profile.vehiclePhotos
    : [];

  const activePhoto: string = vehiclePhotos[activePhotoIndex] || vehiclePhotos[0] || "";

  // Back URL
  const resultsBackUrl = searchParams.toString()
    ? `/results?${searchParams.toString()}`
    : "/home";

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin mb-4" />
        <h2 className="text-white font-display font-bold text-lg">Loading Driver Profile…</h2>
        <p className="text-muted text-xs mt-1">Fetching verified vehicle details & reviews</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-white font-display font-bold text-lg">Driver Profile Not Found</h2>
        <p className="text-muted text-sm mt-1 mb-6">{error || "This driver profile is unavailable or inactive."}</p>
        <Link href="/home" className="btn-gradient">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col pb-28">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, #06B6D4 30%, transparent 70%)" }}
        />
      </div>

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
                <p className="text-xs text-cyan-300 font-mono">{profile.vehicleNumber} · Verified Cab Photo</p>
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

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-lg w-full flex flex-col flex-1 px-4 sm:px-5">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between py-5 border-b border-navy-border/60">
          <Link
            href={resultsBackUrl}
            className="h-10 w-10 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-slate-300 hover:text-white hover:border-blue-primary/50 transition-all flex-shrink-0"
          >
            ←
          </Link>
          <div className="text-center">
            <h1 className="font-display font-bold text-white text-base leading-tight">
              Driver Profile
            </h1>
            <p className="text-[11px] text-muted">Verified Taxi Partner</p>
          </div>
          <div className="h-10 w-10 rounded-xl border border-green/30 bg-green/10 flex items-center justify-center text-green text-sm font-bold flex-shrink-0" title="Verified Badge">
            ✓
          </div>
        </header>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {/* Driver identity banner */}
          <div
            className="p-5 rounded-3xl border border-blue-primary/30 flex items-start gap-4 shadow-xl"
            style={{
              background: "linear-gradient(135deg, rgba(13,27,46,0.95), rgba(22,37,64,0.75))",
            }}
          >
            <div className="relative flex-shrink-0">
              {profile.avatarPhoto ? (
                <img
                  src={profile.avatarPhoto}
                  alt={profile.driverName}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-primary/40 shadow-xl"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #0F2545, #1E3A5F)",
                    border: "1.5px solid rgba(37,99,235,0.5)",
                  }}
                >
                  👨‍✈️
                </div>
              )}
              <span
                className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 border-2 border-navy-card flex items-center justify-center text-xs text-white font-black shadow-md"
                title="Verified Driver"
              >
                ✓
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl font-bold text-white truncate capitalize">
                  {profile.driverName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] text-emerald-300 font-semibold">
                  <span className="dot-online scale-50" /> Verified Driver
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5 truncate">
                <span>📍</span>
                <span>
                  {profile.standName ? `${profile.standName}, ` : ""}
                  {profile.city}
                  {profile.district ? ` (${profile.district})` : ""}
                </span>
              </p>

              <div className="flex items-center gap-2.5 mt-2.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < stars ? "text-amber" : "text-muted"}`}>
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
            <div className="rounded-2xl p-3.5 bg-navy-card border border-navy-border text-center shadow-lg">
              <div className="text-2xl">⭐</div>
              <div className="font-display font-bold text-white text-base mt-1">{rating.toFixed(1)} / 5.0</div>
              <div className="text-[10px] text-muted uppercase font-mono">Driver Rating</div>
            </div>
            <div className="rounded-2xl p-3.5 bg-navy-card border border-navy-border text-center shadow-lg">
              <div className="text-2xl">🚖</div>
              <div className="font-display font-bold text-white text-base mt-1">{completedTrips}+ Rides</div>
              <div className="text-[10px] text-muted uppercase font-mono">Completed</div>
            </div>
            <div className="rounded-2xl p-3.5 bg-navy-card border border-navy-border text-center shadow-lg">
              <div className="text-2xl">🏔️</div>
              <div className="font-display font-bold text-white text-base mt-1 truncate">Hill Pro</div>
              <div className="text-[10px] text-muted uppercase font-mono">Terrain Expert</div>
            </div>
          </div>

          {/* ── Real Vehicle & Cab Photos Showcase ── */}
          <div className="rounded-3xl p-5 bg-navy-card border border-navy-border space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">📸</span> Vehicle & Cab Photos
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                ✓ Uploaded by Driver
              </span>
            </div>

            {vehiclePhotos.length > 0 ? (
              <div className="space-y-3">
                {/* Main Hero Photo Display */}
                <div
                  className="relative rounded-2xl overflow-hidden border border-navy-border group cursor-pointer shadow-xl"
                  style={{
                    height: "220px",
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

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold shadow-lg">
                      {profile.vehicleNumber}
                    </span>
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/80 backdrop-blur-md text-white text-[11px] font-semibold shadow-lg">
                      ✓ Verified Cab
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(activePhoto);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg"
                    >
                      <span>🔍</span>
                      <span>Zoom Photo</span>
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold text-sm drop-shadow-md capitalize">
                      {vehicleName} ({profile.vehicleType})
                    </span>
                    <span className="text-xs text-slate-300 font-mono drop-shadow-md">
                      Photo {activePhotoIndex + 1} of {vehiclePhotos.length}
                    </span>
                  </div>
                </div>

                {/* Thumbnails row */}
                {vehiclePhotos.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {vehiclePhotos.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative h-16 w-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                          activePhotoIndex === i
                            ? "border-cyan-400 ring-2 ring-cyan-400/40 scale-95 shadow-lg shadow-cyan-500/20"
                            : "border-navy-border/80 opacity-70 hover:opacity-100 hover:border-slate-400"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Vehicle photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-navy-deep border border-navy-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">🚕</span>
                    <div>
                      <p className="text-white font-bold text-sm capitalize">{vehicleName}</p>
                      <p className="text-xs font-mono text-cyan-300">{profile.vehicleNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                    ✓ Fleet Verified
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Vehicle inspected & certified by TaxiMint fleet operations for hill driving, tourist permits & safety standards.
                </p>
              </div>
            )}
          </div>

          {/* Verification & Trust Badges */}
          <div className="rounded-3xl p-5 bg-navy-card border border-navy-border space-y-3.5 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">🛡️</span> Document & Safety Verifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-navy-deep border border-navy-border/70">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-semibold">Driving License (DL)</p>
                  <p className="text-[10px] text-muted">Commercial certified hill driver</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-navy-deep border border-navy-border/70">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-semibold">Vehicle RC Document</p>
                  <p className="text-[10px] text-muted">HP Transport registered taxi</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-navy-deep border border-navy-border/70">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-white font-semibold">Identity & KYC</p>
                  <p className="text-[10px] text-muted">Aadhaar Govt verified background</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-navy-deep border border-navy-border/70">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-white font-semibold">State Permit</p>
                  <p className="text-[10px] text-muted break-words leading-relaxed">Commercial Tourist permit ({profile.permitZones || "HP State"})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Specifications & Amenities */}
          <div className="rounded-3xl p-5 bg-navy-card border border-navy-border space-y-3.5 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">🚗</span> Vehicle Specifications & Amenities
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Vehicle Model</p>
                <p className="font-semibold text-white capitalize mt-0.5 truncate">{vehicleName}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Plate Number</p>
                <p className="font-mono font-bold text-cyan-300 mt-0.5">{profile.vehicleNumber}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Capacity & Class</p>
                <p className="font-semibold text-white mt-0.5">
                  {profile.vehicleType} · {profile.seats || 6} Seater
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-navy-deep border border-navy-border">
                <p className="text-muted text-[10px] uppercase font-mono">Air Conditioning</p>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {profile.acAvailable ? "❄️ AC Available" : "Non-AC"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Feedback */}
          <div className="rounded-3xl p-5 bg-navy-card border border-navy-border space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">💬</span> Customer Reviews & Feedback
              </h3>
              <span className="text-xs font-bold text-amber">
                ⭐ {rating.toFixed(1)} / 5.0
              </span>
            </div>

            {/* Ratings Breakdown Bar Chart */}
            <div className="space-y-2 py-1">
              {[5, 4, 3, 2, 1].map((st) => {
                const count = breakdown[st] || 0;
                const pct = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
                return (
                  <div key={st} className="flex items-center gap-2.5 text-xs">
                    <span className="w-6 text-right font-mono text-muted">{st}★</span>
                    <div className="flex-1 h-2 rounded-full bg-navy-deep overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-muted text-[11px]">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Review Cards */}
            {profile.reviews && profile.reviews.length > 0 ? (
              <div className="space-y-3 pt-2">
                {profile.reviews.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="p-4 rounded-2xl bg-navy-deep border border-navy-border space-y-2 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-primary/20 border border-blue-primary/40 flex items-center justify-center text-xs text-blue-300 font-bold">
                          {(rev.customer_name || "C")[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {rev.customer_name || "Verified Customer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber text-xs">{"★".repeat(rev.rating)}</span>
                        <span className="text-[10px] text-muted ml-1 font-mono">
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
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags.map((tg) => (
                          <span
                            key={tg}
                            className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
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
              <div className="p-4 rounded-2xl bg-navy-deep/60 border border-navy-border/50 text-center text-xs text-muted">
                🌟 Top-rated driver with 100% verified track record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-navy-card/95 backdrop-blur-xl border-t border-navy-border p-4 shadow-2xl">
        <div className="mx-auto max-w-lg w-full flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-muted font-mono uppercase">
              {pickupText && dropText ? "Trip Estimate" : "Vehicle Rate"}
            </div>
            <div className="font-display text-2xl font-black text-white">
              {fare ? `₹${fare}` : `₹18/km`}
            </div>
            {pickupText && dropText && (
              <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                {pickupText.split(",")[0]} → {dropText.split(",")[0]}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleBookRide}
            disabled={booking}
            className="btn-gradient px-6 py-3.5 rounded-2xl disabled:opacity-50 font-semibold text-sm shadow-xl flex-1 max-w-[240px]"
          >
            {booking ? "Booking..." : fare ? `Book for ₹${fare} →` : "Book with Driver →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverPublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-deep flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
        </div>
      }
    >
      <DriverProfileContent />
    </Suspense>
  );
}
