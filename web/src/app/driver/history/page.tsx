"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { driverApi, Ride, clearDriverToken } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";

const STATUS_STYLE: Record<string, { badge: string; label: string; icon: string }> = {
  SEARCHING:       { badge: "badge-amber", label: "Searching", icon: "🔍" },
  DRIVER_ASSIGNED: { badge: "badge-blue",  label: "Assigned",  icon: "🚕" },
  ONGOING:         { badge: "badge-blue",  label: "Ongoing",   icon: "🏃" },
  COMPLETED:       { badge: "badge-green", label: "Completed", icon: "🎉" },
  CANCELLED:       { badge: "badge-red",   label: "Cancelled", icon: "❌" },
};

export default function DriverHistoryPage() {
  const router = useRouter();
  const [rides,   setRides]   = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("cab8_driver_token") : null;
    if (!token) { router.replace("/driver/login"); return; }

    driverApi.getDriverRides()
      .then(setRides)
      .catch((e: any) => setError(e.message || "Failed to load trip history."))
      .finally(() => setLoading(false));
  }, [router]);

  const completedRides = rides.filter(r => r.status === "COMPLETED");
  const totalEarnings  = completedRides.reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);

  return (
    <main className="min-h-screen bg-navy-deep pb-24">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>📜</div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">My Trips & Earnings</h1>
              <p className="text-xs text-muted">Complete ride history</p>
            </div>
          </div>
        </div>

        {/* Earnings Stats Summary Card */}
        <div className="card mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-blue-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Total Earnings</p>
              <p className="font-display text-2xl font-bold text-green">₹{totalEarnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Completed Trips</p>
              <p className="font-display text-2xl font-bold text-white">{completedRides.length}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <div className="h-8 w-8 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
            <p className="text-sm">Loading trips…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && rides.length === 0 && (
          <div className="card text-center py-12 animate-fade-up border-dashed">
            <div className="text-4xl mb-3 opacity-50">🚕</div>
            <h3 className="font-display font-bold text-white text-base">No Trips Yet</h3>
            <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
              Go online on Duty tab to start accepting ride requests and earning!
            </p>
            <Link href="/driver/dashboard" className="btn-gradient inline-flex mt-4 text-xs py-2.5 px-4">
              Go to Duty Tab →
            </Link>
          </div>
        )}

        {/* Trips List */}
        {!loading && rides.length > 0 && (
          <div className="space-y-3">
            {rides.map((ride) => {
              const style = STATUS_STYLE[ride.status] || { badge: "badge-muted", label: ride.status, icon: "📍" };
              const fare  = ride.final_fare || ride.estimated_fare;
              const dateStr = new Date(ride.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              });

              return (
                <div key={ride.id} className="card p-4 animate-fade-up hover:border-blue-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${style.badge}`}>{style.icon} {style.label}</span>
                    <span className="text-[11px] font-mono text-muted">{dateStr}</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-green flex-shrink-0" />
                      <span className="text-white truncate font-medium">{ride.pickup_text}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-cyan-glow flex-shrink-0" />
                      <span className="text-muted truncate">{ride.drop_text}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-navy-border/60 text-xs">
                    <span className="badge badge-muted">🚘 {ride.vehicle_type} · {ride.ride_type}</span>
                    <span className="font-display font-bold text-base text-green">₹{fare}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DriverBottomNav />
    </main>
  );
}
