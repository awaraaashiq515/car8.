"use client";
import { useEffect, useState } from "react";
import { StatCard } from "./_components/helpers";
import { fmt } from "./_components/helpers";
import type { Stats } from "./_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/stats`).then(r => r.json()).then(d => setStats(d));
  }, []);

  if (!stats) {
    return (
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif" }}>Dashboard</h1>
        <p style={{ color: "#4A6080", fontSize: "13px", marginBottom: "28px" }}>Loading…</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "16px" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ height: "96px", borderRadius: "14px", background: "linear-gradient(90deg,#0A1628 25%,#0F1E33 50%,#0A1628 75%)", backgroundSize: "200% 100%", animation: `adminPulse 1.5s ease-in-out ${i * 0.07}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px", fontFamily: "'Space Grotesk',sans-serif" }}>📊 Dashboard</h1>
      <p style={{ color: "#4A6080", fontSize: "13px", marginBottom: "28px" }}>
        Live overview — {new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
      </p>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Users",       val: stats.totalUsers,       icon: "👥", color: "#3B82F6" },
          { label: "Total Drivers",     val: stats.totalDrivers,     icon: "🚗", color: "#06B6D4" },
          { label: "Online Now",        val: stats.onlineDrivers,    icon: "🟢", color: "#10B981" },
          { label: "Verified Drivers",  val: stats.verifiedDrivers,  icon: "✅", color: "#8B5CF6" },
          { label: "Total Rides",       val: stats.totalRides,       icon: "🎟️", color: "#F59E0B" },
          { label: "Completed Rides",   val: stats.completedRides,   icon: "✔️", color: "#10B981" },
          { label: "Active Rides",      val: stats.activeRides,      icon: "⚡", color: "#3B82F6" },
          { label: "Cancelled Rides",   val: stats.cancelledRides,   icon: "❌", color: "#EF4444" },
          { label: "Board Posts",       val: stats.totalBoardPosts,  icon: "📋", color: "#A78BFA" },
          { label: "Board Bookings",    val: stats.boardBookings,    icon: "🪑", color: "#06B6D4" },
          { label: "Union Apps",        val: stats.unionApps,        icon: "📝", color: "#F59E0B" },
          { label: "Pending Apps 🔴",   val: stats.pendingUnion,     icon: "⏳", color: "#EF4444" },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Revenue */}
      <div style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(6,182,212,0.12))", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "center", gap: "24px", boxShadow: "0 8px 32px rgba(37,99,235,0.15)" }}>
        <div style={{ fontSize: "44px" }}>💰</div>
        <div>
          <p style={{ color: "#4A6080", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>Total Revenue Collected</p>
          <p style={{ fontSize: "34px", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", background: "linear-gradient(135deg,#60A5FA,#22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmt(stats.totalRevenue)}
          </p>
          <p style={{ color: "#4A6080", fontSize: "13px", marginTop: "4px" }}>from {stats.completedRides} completed rides</p>
        </div>
      </div>
    </div>
  );
}
