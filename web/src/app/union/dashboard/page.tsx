"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UnionBottomNav from "@/components/UnionBottomNav";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Application {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  experience: string;
  licenseNo?: string;
  make?: string;
  model?: string;
  year?: string;
  docs: string[];
  note?: string;
  applied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  source?: string;
}

interface UnionMeta {
  name: string;
  short: string;
  city: string;
  president: string;
  secretary: string;
  founded: string;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }

  .u-card {
    background: #0D1B2E;
    border-radius: 20px;
    border: 1px solid #1A2E45;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .u-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
  .u-stat {
    border-radius: 20px; padding: 18px;
    transition: transform 0.2s, box-shadow 0.2s; cursor: default;
    animation: fadeUp 0.4s ease both;
  }
  .u-stat:hover { transform: translateY(-3px); }
`;

// ── Stat card component ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, change, changePositive, accent, bg, border, delay }:
  { icon: string; label: string; value: string | number; change: string;
    changePositive: boolean | null; accent: string; bg: string; border: string; delay: number }) {
  return (
    <div className="u-stat" style={{ background: bg, border: `1px solid ${border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
          color: changePositive === true ? "#10B981" : changePositive === false ? "#EF4444" : "#6B7280",
          background: changePositive === true ? "rgba(16,185,129,0.1)" : changePositive === false ? "rgba(239,68,68,0.1)" : "rgba(107,114,128,0.1)",
          border: `1px solid ${changePositive === true ? "rgba(16,185,129,0.25)" : changePositive === false ? "rgba(239,68,68,0.2)" : "rgba(107,114,128,0.2)"}`,
          borderRadius: 999, padding: "2px 8px",
        }}>
          {change}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1, animation: "countUp 0.4s ease both" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>{label}</div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const VEHICLE_ICONS: Record<string, string> = {
  Hatchback: "🚗", Sedan: "🚙", SUV: "🚐", Luxury: "🏎️",
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function UnionDashboard() {
  const router = useRouter();

  // ── Auth & identity
  const [unionName,     setUnionName]     = useState("Taxi Union");
  const [unionId,       setUnionId]       = useState("HPTU");
  const [unionMeta,     setUnionMeta]     = useState<UnionMeta | null>(null);
  const [showNotice,    setShowNotice]    = useState(true);
  const [authed,        setAuthed]        = useState(false);

  // ── Dynamic data from applications
  const [apps,          setApps]          = useState<Application[]>([]);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());

  // ── Computed stats
  const pending   = apps.filter(a => a.status === "PENDING").length;
  const approved  = apps.filter(a => a.status === "APPROVED").length;
  const rejected  = apps.filter(a => a.status === "REJECTED").length;
  const totalApps = apps.length;

  // Fleet from approved apps
  const fleetMap: Record<string, number> = {};
  apps.filter(a => a.status === "APPROVED").forEach(a => {
    fleetMap[a.vehicle] = (fleetMap[a.vehicle] || 0) + 1;
  });
  const fleetTotal = Object.values(fleetMap).reduce((s, v) => s + v, 0);
  const fleetBreakdown = [
    { type: "Hatchback", icon: "🚗", color: "#2563EB" },
    { type: "Sedan",     icon: "🚙", color: "#10B981" },
    { type: "SUV",       icon: "🚐", color: "#F59E0B" },
    { type: "Luxury",    icon: "🏎️", color: "#A855F7" },
  ].map(f => ({
    ...f,
    count: fleetMap[f.type] || 0,
    pct: fleetTotal > 0 ? Math.round(((fleetMap[f.type] || 0) / fleetTotal) * 100) : 0,
  })).filter(f => f.count > 0);

  // Revenue: ₹500 dues per approved member
  const revenue = approved * 500;
  const fmtRevenue = revenue >= 100000
    ? `₹${(revenue / 100000).toFixed(1)}L`
    : revenue >= 1000
      ? `₹${(revenue / 1000).toFixed(1)}K`
      : `₹${revenue}`;

  // Activity feed — generated from real application events
  const activityFeed = apps.slice(0, 8).map(a => ({
    icon: a.status === "APPROVED" ? "✅" : a.status === "REJECTED" ? "❌" : "🆕",
    text: a.status === "APPROVED"
      ? `${a.name} approved as union member`
      : a.status === "REJECTED"
        ? `${a.name}'s application rejected`
        : `New join request from ${a.name} (${a.city})`,
    time: timeAgo(a.applied),
    color: a.status === "APPROVED" ? "#10B981" : a.status === "REJECTED" ? "#EF4444" : "#F59E0B",
  }));

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    if (typeof window === "undefined") return;

    // Auth check
    const token = window.localStorage.getItem("cab8_union_token");
    if (!token) { router.replace("/union/login"); return; }
    setAuthed(true);

    const name = window.localStorage.getItem("cab8_union_name") || "Taxi Union";
    const id   = window.localStorage.getItem("cab8_union_id")   || "HPTU";
    setUnionName(name);
    setUnionId(id);

    // Union meta (from registration)
    const meta = window.localStorage.getItem("union_meta");
    if (meta) setUnionMeta(JSON.parse(meta));

    // Applications
    const saved: Application[] = JSON.parse(
      window.localStorage.getItem("union_applications") || "[]"
    );
    setApps(saved);
    setLastRefresh(new Date());
  }, [router]);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 5000); // Poll every 5s
    return () => clearInterval(t);
  }, [loadData]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cab8_union_token");
      window.localStorage.removeItem("cab8_union_name");
      window.localStorage.removeItem("cab8_union_id");
    }
    router.replace("/union/login");
  }

  if (!authed) return null; // Prevent flash

  const hasAnyData = totalApps > 0;

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 320, borderRadius: "50%", opacity: 0.12,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: "-10%",
          width: 400, height: 400, borderRadius: "50%", opacity: 0.06,
          background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 24px rgba(245,158,11,0.4)",
            }}>🔰</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                Union <span style={{ color: "#F59E0B" }}>Dashboard</span>
              </h1>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
                {unionName}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, color: "#10B981", fontFamily: "var(--font-mono)", fontWeight: 600,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: "#10B981",
                boxShadow: "0 0 8px rgba(16,185,129,0.8)", animation: "pulse 2s ease infinite",
              }} />
              LIVE
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "5px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── Union Identity Bar ── */}
        <div className="u-card" style={{ padding: "14px 18px", marginBottom: 16, borderColor: "rgba(245,158,11,0.22)", animation: "fadeUp 0.4s ease both", animationDelay: "40ms" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                {unionMeta?.name || unionName}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                🆔 {unionId}
                {unionMeta?.founded && ` · Est. ${unionMeta.founded}`}
                {unionMeta?.president && ` · ${unionMeta.president}`}
              </p>
            </div>
            <Link href="/union/profile" style={{
              fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: "#F59E0B", textDecoration: "none",
              padding: "5px 12px", borderRadius: 999,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
            }}>
              Edit →
            </Link>
          </div>
        </div>

        {/* ── Announcement Banner ── */}
        {showNotice && (
          <div style={{
            background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)",
            borderRadius: 14, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            animation: "fadeUp 0.4s ease both", animationDelay: "60ms",
          }}>
            <p style={{ fontSize: 12, color: "#E2E8F0", margin: 0, flex: 1 }}>
              📢 <strong>Tip:</strong> Share <strong>/union/apply</strong> link with drivers to get applications here.
            </p>
            <button
              onClick={() => setShowNotice(false)}
              style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── NEW APPS BANNER ── */}
        {pending > 0 && (
          <div style={{
            background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 14, padding: "10px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            animation: "fadeUp 0.4s ease both",
          }}>
            <p style={{ fontSize: 12, color: "#10B981", margin: 0, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease infinite", display: "inline-block", flexShrink: 0 }} />
              <strong>{pending} driver application{pending > 1 ? "s" : ""}</strong> waiting for your review!
            </p>
            <Link href="/union/approve" style={{
              flexShrink: 0, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: "#10B981", textDecoration: "none",
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            }}>
              Review →
            </Link>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Overview · <span style={{ color: "#374151" }}>Updated {timeAgo(lastRefresh.toISOString())}</span>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <StatCard icon="👥" label="Total Applications" value={totalApps}
            change={totalApps === 0 ? "No data yet" : `${approved} approved`}
            changePositive={approved > 0 ? true : null}
            accent="#F59E0B" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.20)" delay={0} />

          <StatCard icon="✅" label="Approved Members" value={approved}
            change={approved === 0 ? "None yet" : `${fleetTotal} vehicles`}
            changePositive={approved > 0 ? true : null}
            accent="#10B981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.18)" delay={60} />

          <StatCard icon="⏳" label="Pending Approval" value={pending}
            change={pending === 0 ? "All reviewed" : "Awaiting review"}
            changePositive={pending === 0 ? true : null}
            accent="#06B6D4" bg="rgba(6,182,212,0.07)" border="rgba(6,182,212,0.18)" delay={120} />

          <StatCard icon="💰" label="Dues Collected" value={fmtRevenue}
            change={approved === 0 ? "No members yet" : `${approved} × ₹500`}
            changePositive={approved > 0 ? true : null}
            accent="#2563EB" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.20)" delay={180} />

          <StatCard icon="❌" label="Rejected" value={rejected}
            change={rejected === 0 ? "None rejected" : `${rejected} declined`}
            changePositive={rejected === 0 ? true : false}
            accent="#EF4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.18)" delay={240} />

          <StatCard icon="🚗" label="Fleet Size" value={fleetTotal}
            change={fleetTotal === 0 ? "No vehicles" : `${Object.keys(fleetMap).length} types`}
            changePositive={fleetTotal > 0 ? true : null}
            accent="#A855F7" bg="rgba(168,85,247,0.07)" border="rgba(168,85,247,0.18)" delay={300} />
        </div>

        {/* ── Quick Actions ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Quick Actions
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          {[
            { href: "/union/approve",  icon: "✅", label: "Approve",    accent: "#10B981", badge: pending > 0 ? pending : null },
            { href: "/union/members",  icon: "👥", label: "Members",    accent: "#F59E0B", badge: null },
            { href: "/union/apply",    icon: "🔰", label: "Apply Link", accent: "#06B6D4", badge: null },
            { href: "/union/analytics",icon: "📊", label: "Analytics",  accent: "#2563EB", badge: null },
            { href: "/union/profile",  icon: "⚙️", label: "Settings",   accent: "#A855F7", badge: null },
            { href: "/driver",         icon: "🚗", label: "Drivers",    accent: "#F59E0B", badge: null },
          ].map((a, i) => (
            <Link key={a.href} href={a.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "14px 8px", borderRadius: 16, textDecoration: "none",
              background: "#0D1B2E", border: "1px solid #1A2E45",
              transition: "all 0.2s", position: "relative",
              animation: "fadeUp 0.4s ease both", animationDelay: `${200 + i * 50}ms`,
            }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: a.accent }}>
                {a.label}
              </span>
              {a.badge !== null && (
                <span style={{
                  position: "absolute", top: 6, right: 8,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#EF4444", color: "#fff",
                  fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                }}>
                  {a.badge > 9 ? "9+" : a.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── Fleet Breakdown (only when data exists) ── */}
        {fleetBreakdown.length > 0 ? (
          <>
            <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Fleet Breakdown ({fleetTotal} vehicles)
            </p>
            <div className="u-card" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fleetBreakdown.map(f => (
                  <div key={f.type}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{f.icon} {f.type}</span>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: f.color, fontWeight: 700 }}>
                        {f.count} ({f.pct}%)
                      </span>
                    </div>
                    <div style={{ height: 6, background: "#0A111D", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 999, background: f.color,
                        width: `${f.pct}%`, boxShadow: `0 0 8px ${f.color}55`,
                        transition: "width 1s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="u-card" style={{ padding: "28px 20px", marginBottom: 20, textAlign: "center", borderStyle: "dashed" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚗</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
              No Fleet Data Yet
            </p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 14px" }}>
              Fleet breakdown will appear here once drivers are approved.
            </p>
            <Link href="/union/apply" style={{
              display: "inline-block", padding: "8px 20px", borderRadius: 12,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#F59E0B", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, textDecoration: "none",
            }}>
              Share Application Link →
            </Link>
          </div>
        )}

        {/* ── Recent Activity ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Recent Activity
        </p>
        <div className="u-card" style={{ padding: "6px 0", marginBottom: 20 }}>
          {activityFeed.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                No activity yet. Applications from drivers will appear here.
              </p>
              <Link href="/union/apply" style={{
                display: "inline-block", marginTop: 12, fontSize: 12,
                fontFamily: "var(--font-mono)", fontWeight: 700,
                color: "#F59E0B", textDecoration: "none",
              }}>
                Share apply link →
              </Link>
            </div>
          ) : (
            activityFeed.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 18px",
                borderBottom: i < activityFeed.length - 1 ? "1px solid rgba(26,46,69,0.5)" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `${a.color}15`, border: `1px solid ${a.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>{a.text}</p>
                  <p style={{ fontSize: 10, color: "#4B5563", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>{a.time}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Last refresh */}
        <p style={{ textAlign: "center", fontSize: 10, color: "#374151", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          🔄 Auto-refreshes every 5s · Last: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>

      </div>

      <UnionBottomNav />
    </main>
  );
}
