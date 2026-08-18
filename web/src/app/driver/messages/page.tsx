"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { driverApi, Ride, getDriverToken } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";
import RideChatDrawer from "@/components/RideChatDrawer";

export default function DriverMessagesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    const token = getDriverToken();
    if (!token) return;

    Promise.all([
      driverApi.getActiveRide().catch(() => null),
      driverApi.getDriverRides().catch(() => []),
    ])
      .then(([active, history]) => {
        setActiveRide(active);
        setRides(history);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-navy-deep pb-24 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-navy-border bg-navy-deep/95 backdrop-blur-md px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/driver/dashboard"
            className="h-9 w-9 rounded-xl bg-navy-card border border-navy-border flex items-center justify-center text-muted hover:text-white"
          >
            ←
          </Link>
          <div>
            <h1 className="font-display font-bold text-lg text-white leading-tight">Passenger Messages</h1>
            <p className="text-xs text-muted">2-way live chat with customers</p>
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-lg">
          💬
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Active Trip Chat Spotlight */}
        {activeRide && (
          <div
            onClick={() => setSelectedRide(activeRide)}
            className="rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/40 via-navy-card to-blue-950/40 p-4 shadow-xl cursor-pointer hover:border-cyan-400 transition-all group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  Active Ride Customer
                </span>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-1 rounded-lg flex items-center gap-1 group-hover:bg-cyan-500/25 transition-all">
                <span>💬</span>
                <span>Open Live Chat</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white truncate">
                📍 {activeRide.pickup_text}
              </p>
              <p className="text-xs text-muted truncate">
                🏁 {activeRide.drop_text}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-navy-border/60 flex items-center justify-between text-xs font-mono text-muted">
              <span>Fare: <strong className="text-green">₹{activeRide.estimated_fare}</strong></span>
              <span>Vehicle: <strong className="text-cyan-300">{activeRide.vehicle_type}</strong></span>
            </div>
          </div>
        )}

        {/* Previous Trips Chat History */}
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted px-1 mb-2">
            Trip Conversations
          </h2>

          {loading && (
            <div className="card text-center py-12">
              <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted font-mono">Loading conversations…</p>
            </div>
          )}

          {!loading && rides.length === 0 && !activeRide && (
            <div className="card text-center py-12 space-y-2">
              <div className="text-4xl">💬</div>
              <p className="font-medium text-white text-sm">No Conversations Yet</p>
              <p className="text-xs text-muted max-w-xs mx-auto">
                When you accept a ride or receive a request, you can chat with passengers directly.
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {rides.map((ride) => (
              <div
                key={ride.id}
                onClick={() => setSelectedRide(ride)}
                className="card p-3.5 hover:border-blue-primary/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="h-10 w-10 rounded-2xl bg-navy-deep border border-navy-border flex items-center justify-center text-lg flex-shrink-0 group-hover:border-cyan-400 transition-colors">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">Passenger</p>
                    <span className="text-[10px] font-mono text-muted">
                      {new Date(ride.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {ride.pickup_text} ➡️ {ride.drop_text}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 rounded-xl bg-navy-deep border border-navy-border flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500/20 group-hover:border-cyan-400 transition-all flex-shrink-0 text-sm"
                >
                  💬
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-up Chat Drawer */}
      {selectedRide && (
        <RideChatDrawer
          rideId={selectedRide.id}
          myRole="DRIVER"
          otherPartyName="Passenger"
          onClose={() => setSelectedRide(null)}
        />
      )}

      {/* Driver Bottom Nav */}
      <DriverBottomNav />
    </main>
  );
}
