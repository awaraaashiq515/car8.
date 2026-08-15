"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import UnionBottomNav from "@/components/UnionBottomNav";
import { playNotificationSound } from "@/lib/sound";

// ── Types ──────────────────────────────────────────────────────────────────────
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Application {
  id: string;
  name: string;
  phone: string;
  city: string;
  district?: string;
  vehicle: string;
  plate: string;
  experience: string;
  licenseNo: string;
  make?: string;
  model?: string;
  year?: string;
  docs: string[];
  docPhotos?: Record<string, string>;
  note?: string;
  applied: string;
  status: ApprovalStatus;
  source?: "live" | "seed";
}

// ── Seed data — shown when no real applications yet ───────────────────────────
const SEED: Application[] = [
  {
    id: "SEED-001", name: "Mukesh Thakur", phone: "9876543210", city: "Kullu",
    vehicle: "SUV", plate: "HP44-AB-9988", experience: "8 years",
    licenseNo: "HP-2014-001234", make: "Mahindra", model: "Bolero",
    docs: ["RC Book", "Driving License", "Insurance"],
    note: "Previously worked with Volvo Bus Corp.",
    applied: "2026-08-06", status: "PENDING", source: "seed",
  },
  {
    id: "SEED-002", name: "Pankaj Sharma", phone: "8765432109", city: "Shimla",
    vehicle: "Sedan", plate: "HP01-CD-7766", experience: "5 years",
    licenseNo: "HP-2018-005678", make: "Maruti", model: "Dzire",
    docs: ["RC Book", "Driving License", "Insurance", "PAN Card"],
    note: "",
    applied: "2026-08-05", status: "PENDING", source: "seed",
  },
  {
    id: "SEED-003", name: "Gopi Chand", phone: "7654321098", city: "Dharamshala",
    vehicle: "Hatchback", plate: "HP22-EF-5544", experience: "3 years",
    licenseNo: "HP-2020-009012",
    docs: ["RC Book", "Driving License"],
    note: "Missing insurance document",
    applied: "2026-08-04", status: "PENDING", source: "seed",
  },
  {
    id: "SEED-004", name: "Amit Verma", phone: "4321098765", city: "Chamba",
    vehicle: "Luxury", plate: "HP18-KL-8899", experience: "12 years",
    licenseNo: "HP-2012-000567", make: "Toyota", model: "Fortuner",
    docs: ["RC Book", "Driving License", "Insurance", "NOC Letter", "PAN Card"],
    note: "Former HRTC driver",
    applied: "2026-08-01", status: "PENDING", source: "seed",
  },
];

const VEHICLE_ICONS: Record<string, string> = {
  Hatchback: "🚗", Sedan: "🚙", SUV: "🚐", Luxury: "🏎️",
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateY(6px); }  to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .req-card {
    background: #0D1B2E;
    border-radius: 20px;
    border: 1px solid #1A2E45;
    padding: 18px;
    transition: all 0.22s;
    animation: fadeUp 0.35s ease both;
  }
  .req-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.5); }
  .req-card.live  { border-color: rgba(245,158,11,0.35); }

  .action-btn {
    flex: 1; padding: 11px 16px; border-radius: 14px;
    font-size: 13px; font-weight: 700; font-family: var(--font-display);
    border: none; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .action-btn:active { transform: scale(0.97); }

  .tab-pill {
    flex: 1; padding: 9px 6px; border-radius: 12px;
    font-size: 11px; font-weight: 700; font-family: var(--font-mono);
    border: 1px solid #1A2E45; background: #0D1B2E; color: #6B7280;
    cursor: pointer; transition: all 0.18s; text-align: center;
  }
  .tab-pill.active { background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.4); color:#F59E0B; }
`;

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
}

export default function UnionApprovePage() {
  const [all,     setAll]    = useState<Application[]>([]);
  const [tab,     setTab]    = useState<ApprovalStatus>("PENDING");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast,   setToast]  = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandId, setExpandId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ doc: string; url: string } | null>(null);
  const [newAppAlert, setNewAppAlert] = useState<Application | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Load from Backend DB API + localStorage + seed on mount
  useEffect(() => {
    async function load() {
      if (typeof window === "undefined") return;
      let apiApps: Application[] = [];
      try {
        const res = await fetch("http://localhost:4000/union/applications");
        if (res.ok) {
          const data = await res.json();
          apiApps = data.applications || [];
        }
      } catch (e) {
        console.warn("Could not fetch backend applications:", e);
      }

      const savedLocal: Application[] = JSON.parse(
        window.localStorage.getItem("union_applications") || "[]"
      );

      // Merge backend DB apps first, then local apps, then seeds
      const mergedMap = new Map<string, Application>();
      
      // Add local saved apps
      savedLocal.forEach(a => mergedMap.set(a.id, { ...a, source: "live" }));
      // Add API DB apps (overrides local if newer)
      apiApps.forEach(a => mergedMap.set(a.id, { ...a, source: "live" }));
      // Add seed apps if ID not in DB/local
      SEED.forEach(s => {
        if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
      });

      const combined = Array.from(mergedMap.values());
      setAll(combined);

      if (!initializedRef.current) {
        initializedRef.current = true;
        combined.forEach(a => knownIdsRef.current.add(a.id));
      } else {
        // Detect newly submitted pending driver applications
        const newApp = combined.find(a => a.status === "PENDING" && !knownIdsRef.current.has(a.id));
        if (newApp) {
          knownIdsRef.current.add(newApp.id);
          setNewAppAlert(newApp);
          playNotificationSound();
        }
      }
    }

    load();
    window.addEventListener("storage", load);
    const t = setInterval(load, 3000);
    return () => {
      window.removeEventListener("storage", load);
      clearInterval(t);
    };
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAction(id: string, action: ApprovalStatus) {
    setLoading(id + action);

    // Call Backend API to update status in SQLite DB
    try {
      await fetch(`http://localhost:4000/union/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
    } catch (e) {
      console.warn("Failed to update status on backend:", e);
    }

    setAll(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: action } : r);
      if (typeof window !== "undefined") {
        const live = updated.filter(a => a.source === "live");
        window.localStorage.setItem("union_applications", JSON.stringify(live));
        window.dispatchEvent(new Event("storage"));
      }
      return updated;
    });

    setLoading(null);
    setExpandId(null);
    showToast(
      action === "APPROVED"
        ? "✅ Driver approved and added to union!"
        : "❌ Application rejected.",
      action === "APPROVED",
    );
  }

  const filtered  = all.filter(r => r.status === tab);
  const pendingCt = all.filter(r => r.status === "PENDING").length;
  const livePending = all.filter(r => r.status === "PENDING" && r.source === "live").length;

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 480, height: 260, borderRadius: "50%", opacity: 0.10,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, whiteSpace: "nowrap",
          background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
          borderRadius: 14, padding: "10px 20px",
          fontSize: 13, fontWeight: 700, color: toast.ok ? "#10B981" : "#EF4444",
          backdropFilter: "blur(12px)", animation: "slideIn 0.25s ease both",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── NEW APPLICATION AUDIO & VISUAL ALERT POP-UP ── */}
      {newAppAlert && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 110, width: "calc(100% - 32px)", maxWidth: 460,
          background: "linear-gradient(135deg, #112238, #0D1B2E)",
          border: "2px solid #F59E0B", borderRadius: 20, padding: 16,
          boxShadow: "0 10px 40px rgba(245,158,11,0.45)",
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 16px rgba(245,158,11,0.6)",
              animation: "pulse 1s ease infinite",
            }}>🔔</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B", fontFamily: "var(--font-display)" }}>
                  NEW DRIVER JOIN REQUEST!
                </span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>LIVE</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>
                {newAppAlert.name}
              </p>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                📍 {newAppAlert.city} · {newAppAlert.vehicle} ({newAppAlert.plate})
              </p>
            </div>
            <button onClick={() => setNewAppAlert(null)} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => {
                setTab("PENDING");
                setExpandId(newAppAlert.id);
                setNewAppAlert(null);
              }}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)", color: "#3B82F6",
                cursor: "pointer", fontFamily: "var(--font-display)",
              }}
            >
              🔍 Review Details
            </button>
            <button
              onClick={() => {
                handleAction(newAppAlert.id, "APPROVED");
                setNewAppAlert(null);
              }}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: "linear-gradient(135deg, #D97706, #F59E0B)", border: "none", color: "#1A0A00",
                cursor: "pointer", fontFamily: "var(--font-display)", boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
              }}
            >
              ✅ 1-Click Approve
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 16,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 0 20px rgba(245,158,11,0.35)",
            }}>⏳</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                Approval <span style={{ color: "#F59E0B" }}>Queue</span>
              </h1>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
                Driver join requests
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {pendingCt > 0 && (
              <div style={{
                padding: "5px 12px", borderRadius: 999,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B",
              }}>
                {pendingCt} Pending
              </div>
            )}
            {livePending > 0 && (
              <div style={{
                padding: "3px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 5,
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10B981",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease infinite", display: "inline-block" }} />
                {livePending} New
              </div>
            )}
          </div>
        </div>

        {/* Apply link banner */}
        <div style={{
          background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: 14, padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          animation: "fadeUp 0.4s ease both", animationDelay: "40ms",
        }}>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
            📢 Share the application link with drivers who want to join the union
          </p>
          <Link href="/union/apply" style={{
            flexShrink: 0, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
            color: "#2563EB", textDecoration: "none",
            padding: "4px 10px", borderRadius: 8,
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
          }}>
            Apply Link →
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, animation: "fadeUp 0.4s ease both", animationDelay: "60ms" }}>
          {(["PENDING", "APPROVED", "REJECTED"] as ApprovalStatus[]).map(t => (
            <button key={t} className={`tab-pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "PENDING"
                ? `⏳ Pending (${pendingCt})`
                : t === "APPROVED" ? `✅ Approved (${all.filter(r => r.status === "APPROVED").length})`
                : `❌ Rejected (${all.filter(r => r.status === "REJECTED").length})`}
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{
            background: "#0D1B2E", border: "1px dashed #1A2E45", borderRadius: 20,
            padding: "56px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {tab === "PENDING" ? "🎉" : tab === "APPROVED" ? "✅" : "🚫"}
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
              {tab === "PENDING" ? "All caught up!" : `No ${tab.toLowerCase()} requests`}
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              {tab === "PENDING" ? "No pending join requests right now." : `No drivers have been ${tab.toLowerCase()} yet.`}
            </p>
            {tab === "PENDING" && (
              <Link href="/union/apply" style={{
                display: "inline-block", marginTop: 16, padding: "9px 22px", borderRadius: 12,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                color: "#F59E0B", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, textDecoration: "none",
              }}>
                Share Application Link →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((req, i) => {
              const isExpanded = expandId === req.id;
              return (
                <div
                  key={req.id}
                  className={`req-card ${req.source === "live" ? "live" : ""}`}
                  style={{ animationDelay: `${i * 60}ms`, cursor: "pointer" }}
                  onClick={() => setExpandId(isExpanded ? null : req.id)}
                >
                  {/* Live badge */}
                  {req.source === "live" && req.status === "PENDING" && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10,
                      padding: "3px 10px", borderRadius: 999,
                      background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                      fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10B981",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease infinite", display: "inline-block" }} />
                      NEW APPLICATION
                    </div>
                  )}

                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                      background: "linear-gradient(135deg, #162540, #1E3550)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, border: "1px solid #1A2E45",
                    }}>
                      {VEHICLE_ICONS[req.vehicle] || "🚗"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>
                        {req.name}
                      </p>
                      <p style={{ fontSize: 11, color: "#6B7280", margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>
                        📍 {req.city} · {req.vehicle} · {timeAgo(req.applied)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {req.status !== "PENDING" && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                          padding: "4px 10px", borderRadius: 999,
                          background: req.status === "APPROVED" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: req.status === "APPROVED" ? "#10B981" : "#EF4444",
                          border: `1px solid ${req.status === "APPROVED" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                          {req.status === "APPROVED" ? "✅ Approved" : "❌ Rejected"}
                        </span>
                      )}
                      <span style={{ color: "#4B5563", fontSize: 14 }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: 16, animation: "fadeUp 0.25s ease both" }} onClick={e => e.stopPropagation()}>
                      {/* Details grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "Phone",      value: fmtPhone(req.phone) },
                          { label: "Plate No",   value: req.plate },
                          { label: "License",    value: req.licenseNo || "—" },
                          { label: "Experience", value: req.experience },
                          ...(req.make ? [{ label: "Vehicle", value: `${req.make} ${req.model || ""}` }] : []),
                          ...(req.year ? [{ label: "Year", value: req.year }] : []),
                        ].map(d => (
                          <div key={d.label} style={{ background: "rgba(5,13,26,0.6)", borderRadius: 10, padding: "8px 12px" }}>
                            <p style={{ fontSize: 9, color: "#4B5563", fontFamily: "var(--font-mono)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.label}</p>
                            <p style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600, margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>{d.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Documents */}
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 10, color: "#4B5563", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                          Documents Submitted ({req.docs.length})
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                          {req.docs.map(d => (
                            <span key={d} style={{
                              fontSize: 10, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: 999,
                              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981",
                            }}>
                              ✓ {d} {req.docPhotos?.[d] ? "📸" : ""}
                            </span>
                          ))}
                        </div>

                        {/* Attached Document Photos */}
                        {req.docPhotos && Object.keys(req.docPhotos).length > 0 && (
                          <div style={{ background: "rgba(5,13,26,0.6)", borderRadius: 12, padding: 10, border: "1px solid #1A2E45" }}>
                            <p style={{ fontSize: 10, color: "#F59E0B", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 8px" }}>
                              📷 UPLOADED DOCUMENT PHOTOS (Click to view full-size):
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                              {Object.entries(req.docPhotos).map(([docName, b64Url]) => (
                                <div key={docName}
                                  onClick={(e) => { e.stopPropagation(); setViewPhoto({ doc: docName, url: b64Url }); }}
                                  style={{
                                    background: "#0D1B2E", borderRadius: 8, padding: 6, border: "1px solid #1A2E45",
                                    cursor: "pointer", textAlign: "center",
                                  }}>
                                  <img src={b64Url} alt={docName} style={{ height: 60, width: "100%", objectFit: "cover", borderRadius: 6, marginBottom: 4 }} />
                                  <span style={{ fontSize: 9, color: "#E2E8F0", fontFamily: "var(--font-mono)", fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {docName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      {req.note && (
                        <div style={{
                          background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
                          borderRadius: 10, padding: "8px 12px", marginBottom: 12,
                        }}>
                          <p style={{ fontSize: 12, color: "#D97706", margin: 0 }}>💬 {req.note}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {req.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="action-btn"
                            disabled={!!loading}
                            onClick={() => handleAction(req.id, "REJECTED")}
                            style={{
                              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444",
                              opacity: loading ? 0.7 : 1,
                            }}
                          >
                            {loading === req.id + "REJECTED" ? (
                              <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(239,68,68,0.3)", borderTopColor: "#EF4444", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                            ) : "✕ Reject"}
                          </button>
                          <button
                            className="action-btn"
                            disabled={!!loading}
                            onClick={() => handleAction(req.id, "APPROVED")}
                            style={{
                              flex: 2,
                              background: "linear-gradient(135deg, #D97706, #F59E0B)",
                              color: "#fff", boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                              opacity: loading ? 0.7 : 1,
                            }}
                          >
                            {loading === req.id + "APPROVED" ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                Approving…
                              </span>
                            ) : "✅ Approve & Add to Union"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Image Viewer Modal */}
      {viewPhoto && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(5,13,26,0.92)", backdropFilter: "blur(10px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setViewPhoto(null)}>
          <div style={{ maxWidth: 480, width: "100%", background: "#0D1B2E", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: 16, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", fontFamily: "var(--font-mono)" }}>
                📷 {viewPhoto.doc} Photo
              </span>
              <button onClick={() => setViewPhoto(null)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✕ Close</button>
            </div>
            <img src={viewPhoto.url} alt={viewPhoto.doc} style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 12, border: "1px solid #1A2E45" }} />
          </div>
        </div>
      )}

      <UnionBottomNav />
    </main>
  );
}
