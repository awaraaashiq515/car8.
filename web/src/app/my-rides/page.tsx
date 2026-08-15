"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Ride, RideStatus } from "@/lib/api";
import CustomerBottomNav from "@/components/CustomerBottomNav";

const STATUS_STYLE: Record<RideStatus, { badge: string; label: string; icon: string; dot: string }> = {
  SEARCHING: { badge: "badge-amber", label: "Searching", icon: "🔍", dot: "bg-amber" },
  CONFIRMED: { badge: "badge-blue", label: "Confirmed", icon: "✅", dot: "bg-blue-primary" },
  DRIVER_ASSIGNED: { badge: "badge-blue", label: "On the way", icon: "🚕", dot: "bg-blue-primary" },
  ARRIVED: { badge: "badge-blue", label: "Driver Arrived", icon: "📍", dot: "bg-blue-primary" },
  ONGOING: { badge: "badge-blue", label: "Ongoing", icon: "🏃", dot: "bg-cyan-glow" },
  COMPLETED: { badge: "badge-green", label: "Completed", icon: "🎉", dot: "bg-green" },
  CANCELLED: { badge: "badge-red", label: "Cancelled", icon: "❌", dot: "bg-red" },
};

const ACTIVE_STATUSES = ["SEARCHING", "CONFIRMED", "DRIVER_ASSIGNED", "ONGOING"];



function RideCard({ ride }: { ride: Ride }) {
  const s = STATUS_STYLE[ride.status];
  const active = ACTIVE_STATUSES.includes(ride.status);
  const date = new Date(ride.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = new Date(ride.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href={active ? `/booking/${ride.id}` : "#"}
      className="block rounded-2xl border border-navy-border bg-navy-card p-4 transition-all duration-200 hover:border-blue-primary/30 animate-fade-up"
    >
      <div className="flex items-start gap-3">
        {/* Route line */}
        <div className="flex flex-col items-center gap-1 pt-1.5 flex-shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <span className="w-px h-7 bg-navy-border" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#06B6D4" }} />
        </div>

        {/* Route text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{ride.pickup_text}</p>
          <p className="text-sm text-muted truncate mt-2.5">{ride.drop_text}</p>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className={`badge ${s.badge} flex items-center gap-1`}>
              {s.icon} {s.label}
            </span>
            <span className="badge badge-muted">🚗 {ride.vehicle_type}</span>
            <span className="badge badge-muted">📏 {ride.distance_km} km</span>
          </div>
        </div>

        {/* Right: fare + date + track */}
        <div className="text-right flex-shrink-0 pl-2">
          <div className="font-display font-bold text-white text-base">
            ₹{ride.final_fare ?? ride.estimated_fare}
          </div>
          <div className="text-[11px] text-muted mt-1">{date}</div>
          <div className="text-[11px] text-dimmed">{time}</div>
          {active && (
            <span className="inline-block mt-2 text-xs text-blue-light font-medium">
              Track →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function MyRidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    const token = window.localStorage.getItem("cab8_token");
    if (!token) { router.push("/login"); return; }

    api.getMyRides()
      .then(setRides)
      .catch((e) => setError(e.message || "Could not load your rides."))
      .finally(() => setLoad(false));
  }, [router]);

  const activeRides = rides.filter(r => ACTIVE_STATUSES.includes(r.status));
  const pastRides = rides.filter(r => ["COMPLETED", "CANCELLED"].includes(r.status));
  const shown = tab === "active" ? activeRides : pastRides;

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col" style={{ paddingBottom: 0 }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-6 pb-4 border-b border-navy-border/50">
        <div>
          <h1 className="font-display text-xl font-bold text-white">My Rides</h1>
          <p className="text-xs text-muted mt-0.5">Your trip history & active rides</p>
        </div>
        <Link href="/home" className="h-9 w-9 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white hover:border-blue-primary/40 transition-all">
          🏠
        </Link>
      </header>

      {/* ── Tab switcher ── */}
      <div className="relative z-10 flex gap-1 mx-5 mt-4 mb-4 rounded-2xl bg-navy-card border border-navy-border p-1">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${tab === t ? "text-white" : "text-muted hover:text-white"
              }`}
            style={tab === t ? { background: "linear-gradient(135deg, #2563EB, #06B6D4)" } : {}}
          >
            {t === "active" ? (
              <>
                <span className="dot-online scale-75" />
                Active
                {activeRides.length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                    {activeRides.length}
                  </span>
                )}
              </>
            ) : (
              <>
                📋 History ({pastRides.length})
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 px-5 pb-4 overflow-y-auto">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-muted">
            <div className="h-10 w-10 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
            <p className="text-sm">Loading your rides…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && shown.length === 0 && (
          <div className="rounded-3xl border border-navy-border bg-navy-card text-center py-14 px-6">
            <div className="text-5xl mb-4">{tab === "active" ? "🔍" : "📭"}</div>
            <h2 className="font-display font-bold text-white text-lg mb-2">
              {tab === "active" ? "No active rides" : "No ride history yet"}
            </h2>
            <p className="text-muted text-sm mb-5">
              {tab === "active"
                ? "Your active & upcoming rides will appear here"
                : "Your completed trips will show up here"}
            </p>
            <Link href="/home" className="btn-gradient inline-flex">Book a Ride →</Link>
          </div>
        )}

        {/* Ride cards */}
        {!loading && shown.length > 0 && (
          <div className="space-y-3">
            {shown.map((r) => <RideCard key={r.id} ride={r} />)}
          </div>
        )}
      </div>

      <CustomerBottomNav />
    </div>
  );
}
