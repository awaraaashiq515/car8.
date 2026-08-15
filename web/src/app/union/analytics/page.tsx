"use client";

import Link from "next/link";
import UnionBottomNav from "@/components/UnionBottomNav";

const COMING_FEATURES = [
  { icon: "📈", label: "Earnings Report",      desc: "Monthly & yearly earnings graph of all union drivers",   color: "#10B981" },
  { icon: "🗺️", label: "Route Heatmap",        desc: "Most popular routes across all members — live data",     color: "#2563EB" },
  { icon: "⭐", label: "Rating Leaderboard",   desc: "Top rated drivers of the month & all-time rankings",    color: "#F59E0B" },
  { icon: "🚗", label: "Fleet Analytics",      desc: "Vehicle type distribution and utilization rates",        color: "#A855F7" },
  { icon: "💰", label: "Revenue Trends",       desc: "Dues collection trends and treasury growth over time",   color: "#06B6D4" },
  { icon: "📣", label: "Complaint Analysis",   desc: "Complaint categories, resolution rate, and patterns",    color: "#EF4444" },
];

const G = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
  .feat-card {
    background: #0D1B2E;
    border-radius: 18px;
    border: 1px solid #1A2E45;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    transition: all 0.2s;
    animation: fadeUp 0.4s ease both;
  }
  .feat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(0,0,0,0.5); }
`;

export default function UnionAnalyticsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 280, borderRadius: "50%", opacity: 0.10,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, animation: "fadeUp 0.4s ease both" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 16,
            background: "linear-gradient(135deg, #D97706, #F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 0 20px rgba(245,158,11,0.35)",
          }}>📊</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
              Union <span style={{ color: "#F59E0B" }}>Analytics</span>
            </h1>
            <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
              Data & reporting center
            </p>
          </div>
        </div>

        {/* Coming Soon Hero */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(37,99,235,0.06))",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 24, padding: "40px 24px", textAlign: "center", marginBottom: 24,
          animation: "fadeUp 0.4s ease both", animationDelay: "60ms",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>📊</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>
            Analytics <span style={{ color: "#F59E0B" }}>Coming Soon</span>
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
            Powerful analytics dashboard is being built for Phase 3. Rich charts, route heatmaps, and earnings reports coming!
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 999,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B",
          }}>
            🗓️ Launching in Phase 3
          </div>
        </div>

        {/* Feature Preview */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          What&apos;s Coming
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COMING_FEATURES.map((f, i) => (
            <div key={f.label} className="feat-card" style={{ animationDelay: `${120 + i * 50}ms` }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${f.color}15`, border: `1px solid ${f.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>{f.label}</p>
                <p style={{ fontSize: 11, color: "#6B7280", margin: "3px 0 0", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Back to dashboard */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/union/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 14,
            background: "linear-gradient(135deg, #D97706, #F59E0B)",
            color: "#fff", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          }}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>

      <UnionBottomNav />
    </main>
  );
}
