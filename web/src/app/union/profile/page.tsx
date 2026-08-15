"use client";

import { useState } from "react";
import UnionBottomNav from "@/components/UnionBottomNav";

// ── Mock Data ──────────────────────────────────────────────────────────────────
const UNION_DATA = {
  name:      "Himachal Pradesh Taxi Union",
  short:     "HPTU",
  city:      "Shimla, Himachal Pradesh",
  founded:   "1998",
  president: "Rajendra Singh Thakur",
  secretary: "Anil Kumar Verma",
  treasurer: "Deepak Rana",
  phone:     "0177-265-4321",
  email:     "hptu.shimla@taxiunion.in",
  address:   "Union Bhawan, Near Bus Stand, Shimla — 171001",
  members:   248,
  zones:     ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi", "Chamba", "Solan", "Bilaspur"],
  banner:    "Monthly Meeting on 15 Aug 2026, 11:00 AM — Shimla District Office. All members must attend.",
};

const OFFICE_BEARERS = [
  { title: "President",       name: "Rajendra Singh Thakur", phone: "98050-11111", icon: "👑" },
  { title: "Secretary",       name: "Anil Kumar Verma",      phone: "98050-22222", icon: "📋" },
  { title: "Treasurer",       name: "Deepak Rana",           phone: "98050-33333", icon: "💰" },
  { title: "Vice President",  name: "Mohan Thakur",          phone: "98050-44444", icon: "🏅" },
  { title: "Joint Secretary", name: "Vikram Singh",          phone: "98050-55555", icon: "📝" },
];

const RULES = [
  "Monthly dues of ₹500 must be paid by 10th of every month.",
  "Driver must carry all valid documents at all times.",
  "Any dispute must be reported to union within 24 hours.",
  "Minimum fare as set by union must be strictly followed.",
  "No member shall operate a vehicle without valid insurance.",
  "Abusive behavior with customers shall result in immediate suspension.",
  "Members must attend at least 6 monthly meetings per year.",
  "New members must complete 3-month probation before full rights.",
];

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  .u-card {
    background: #0D1B2E;
    border-radius: 20px;
    border: 1px solid #1A2E45;
    box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    margin-bottom: 16px;
    overflow: hidden;
  }
  .edit-inp {
    width: 100%;
    background: #050D1A;
    border: 1px solid #1A2E45;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 13px;
    color: #E2E8F0;
    outline: none;
    font-family: var(--font-body);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .edit-inp:focus { border-color: rgba(245,158,11,0.5); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
`;

export default function UnionProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [banner,   setBanner]   = useState(UNION_DATA.banner);
  const [saved,    setSaved]    = useState(false);

  function handleSave() {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 280, borderRadius: "50%", opacity: 0.10,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
      </div>

      {/* Save Toast */}
      {saved && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
          borderRadius: 14, padding: "10px 22px",
          fontSize: 13, fontWeight: 700, color: "#10B981",
          backdropFilter: "blur(12px)", whiteSpace: "nowrap",
        }}>
          ✅ Union profile saved successfully!
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 16,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 0 20px rgba(245,158,11,0.35)",
            }}>🔰</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                Union <span style={{ color: "#F59E0B" }}>Profile</span>
              </h1>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
                Admin settings &amp; union info
              </p>
            </div>
          </div>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            style={{
              padding: "8px 18px", borderRadius: 12, fontSize: 12, fontWeight: 700,
              fontFamily: "var(--font-display)", cursor: "pointer",
              background: editMode ? "linear-gradient(135deg, #D97706, #F59E0B)" : "rgba(245,158,11,0.12)",
              color: editMode ? "#fff" : "#F59E0B",
              border: editMode ? "none" : "1px solid rgba(245,158,11,0.3)",
              boxShadow: editMode ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
            }}
          >
            {editMode ? "💾 Save" : "✏️ Edit"}
          </button>
        </div>

        {/* ── Union Identity Card ── */}
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "50ms" }}>
          {/* Gold header bar */}
          <div style={{ height: 5, background: "linear-gradient(90deg, #D97706, #F59E0B, #D97706)" }} />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              {/* Union Logo */}
              <div style={{
                width: 70, height: 70, borderRadius: 20, flexShrink: 0,
                background: "linear-gradient(135deg, #1A2E45, #0D1B2E)",
                border: "2px solid rgba(245,158,11,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, boxShadow: "0 0 20px rgba(245,158,11,0.2)",
              }}>🔰</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                  {UNION_DATA.name}
                </h2>
                <p style={{ fontSize: 11, color: "#F59E0B", margin: "4px 0 0", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {UNION_DATA.short} · Est. {UNION_DATA.founded}
                </p>
                <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                  📍 {UNION_DATA.city}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { label: "Members", value: UNION_DATA.members, icon: "👥", color: "#F59E0B" },
                { label: "Zones",   value: UNION_DATA.zones.length, icon: "🗺️", color: "#06B6D4" },
                { label: "Est.",    value: UNION_DATA.founded,      icon: "📅", color: "#A855F7" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(5,13,26,0.6)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contact Information ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Contact Information
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "100ms" }}>
          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "📞", label: "Phone", value: UNION_DATA.phone },
                { icon: "📧", label: "Email", value: UNION_DATA.email },
                { icon: "🏢", label: "Address", value: UNION_DATA.address },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>{c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: "#4B5563", fontFamily: "var(--font-mono)", margin: 0, textTransform: "uppercase" }}>{c.label}</p>
                    {editMode ? (
                      <input className="edit-inp" style={{ marginTop: 4 }} defaultValue={c.value} />
                    ) : (
                      <p style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600, margin: "3px 0 0" }}>{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Office Bearers ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Office Bearers
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "150ms" }}>
          <div style={{ padding: "6px 0" }}>
            {OFFICE_BEARERS.map((ob, i) => (
              <div key={ob.title} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                borderBottom: i < OFFICE_BEARERS.length - 1 ? "1px solid rgba(26,46,69,0.5)" : "none",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, #1A2E45, #0D1B2E)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{ob.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>{ob.name}</p>
                  <p style={{ fontSize: 10, color: "#F59E0B", margin: "2px 0 0", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{ob.title}</p>
                </div>
                <p style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{ob.phone}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Zones ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Active Zones ({UNION_DATA.zones.length})
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "200ms" }}>
          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {UNION_DATA.zones.map(z => (
                <span key={z} style={{
                  fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600,
                  padding: "6px 14px", borderRadius: 999,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B",
                }}>
                  📍 {z}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Current Announcement ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Current Announcement
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "230ms", borderColor: "rgba(6,182,212,0.2)" }}>
          <div style={{ padding: 18 }}>
            {editMode ? (
              <textarea
                className="edit-inp"
                value={banner}
                onChange={e => setBanner(e.target.value)}
                rows={4}
                style={{ resize: "none" }}
              />
            ) : (
              <p style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.6, margin: 0 }}>
                📢 {banner}
              </p>
            )}
          </div>
        </div>

        {/* ── Union Rules ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Union Rules &amp; Regulations
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "260ms" }}>
          <div style={{ padding: 18 }}>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {RULES.map((r, i) => (
                <li key={i} style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                  <span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "var(--font-mono)", marginRight: 4 }}>
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Admin Actions
        </p>
        <div className="u-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "300ms", borderColor: "rgba(239,68,68,0.15)" }}>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "📤 Export Member List (CSV)",    color: "#06B6D4", bg: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.25)"  },
              { label: "📊 Generate Monthly Report",     color: "#A855F7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.25)" },
              { label: "📢 Send SMS Blast to All Members", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
              { label: "🔴 Deactivate Union Portal",      color: "#EF4444", bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.22)"  },
            ].map(a => (
              <button key={a.label} style={{
                width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                fontFamily: "var(--font-display)", cursor: "pointer", textAlign: "left",
                background: a.bg, border: `1px solid ${a.border}`, color: a.color,
                transition: "all 0.18s",
              }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      <UnionBottomNav />
    </main>
  );
}
