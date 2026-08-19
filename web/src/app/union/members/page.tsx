"use client";

import { useState, useEffect, useMemo } from "react";
import UnionBottomNav from "@/components/UnionBottomNav";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicle: string;
  plate: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  dues: "PAID" | "DUE" | "OVERDUE";
  rating: number;
  joined: string;
  rides: number;
  source?: "live" | "seed";
}

// ── Seed Members ───────────────────────────────────────────────────────────────
const SEED_MEMBERS: Member[] = [
  { id: "s1",  name: "Ramesh Kumar",      phone: "98050-11234", city: "Shimla",      vehicle: "Sedan",     plate: "HP01-AB-1234", status: "ACTIVE",    dues: "PAID",    rating: 4.8, joined: "2019-03-12", rides: 1820, source: "seed" },
  { id: "s2",  name: "Suresh Verma",      phone: "94180-22345", city: "Manali",      vehicle: "SUV",       plate: "HP38-CD-5678", status: "SUSPENDED", dues: "OVERDUE", rating: 3.9, joined: "2021-07-04", rides: 634,  source: "seed"  },
  { id: "s3",  name: "Mohan Thakur",      phone: "70110-33456", city: "Dharamshala", vehicle: "Hatchback", plate: "HP22-EF-9012", status: "ACTIVE",    dues: "PAID",    rating: 4.5, joined: "2018-11-20", rides: 2145, source: "seed" },
  { id: "s4",  name: "Vikram Singh",      phone: "98821-44567", city: "Kullu",       vehicle: "Luxury",    plate: "HP44-GH-3456", status: "ACTIVE",    dues: "PAID",    rating: 4.9, joined: "2020-02-14", rides: 987,  source: "seed"  },
  { id: "s5",  name: "Dinesh Chauhan",    phone: "88820-55678", city: "Shimla",      vehicle: "Sedan",     plate: "HP01-IJ-7890", status: "ACTIVE",    dues: "DUE",     rating: 4.2, joined: "2022-05-08", rides: 456,  source: "seed"  },
  { id: "s6",  name: "Ajay Negi",         phone: "76540-66789", city: "Mandi",       vehicle: "Hatchback", plate: "HP55-KL-1234", status: "ACTIVE",    dues: "PAID",    rating: 4.6, joined: "2017-09-03", rides: 3201, source: "seed" },
  { id: "s7",  name: "Rakesh Sharma",     phone: "99990-77890", city: "Shimla",      vehicle: "SUV",       plate: "HP01-MN-5678", status: "ACTIVE",    dues: "PAID",    rating: 4.4, joined: "2023-01-22", rides: 312,  source: "seed"  },
  { id: "s8",  name: "Deepak Rana",       phone: "91830-88901", city: "Chamba",      vehicle: "Sedan",     plate: "HP18-OP-9012", status: "ACTIVE",    dues: "DUE",     rating: 4.1, joined: "2021-12-15", rides: 728,  source: "seed"  },
];

const VEHICLE_ICONS_L: Record<string, string> = {
  Hatchback: "🚗", Sedan: "🚙", SUV: "🚐", Luxury: "🏎️",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  ACTIVE:    { bg: "rgba(16,185,129,0.1)",  color: "#10B981", border: "rgba(16,185,129,0.25)", label: "Active"    },
  SUSPENDED: { bg: "rgba(239,68,68,0.1)",   color: "#EF4444", border: "rgba(239,68,68,0.25)",  label: "Suspended" },
  PENDING:   { bg: "rgba(245,158,11,0.1)",  color: "#F59E0B", border: "rgba(245,158,11,0.25)", label: "Pending"   },
};

const DUES_STYLES: Record<string, { color: string; label: string }> = {
  PAID:    { color: "#10B981", label: "✓ Paid"    },
  DUE:     { color: "#F59E0B", label: "⚠ Due"     },
  OVERDUE: { color: "#EF4444", label: "✕ Overdue" },
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to   { transform:rotate(360deg); } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

  .m-card {
    background: #0D1B2E;
    border-radius: 18px;
    border: 1px solid #1A2E45;
    padding: 16px;
    transition: all 0.2s;
    animation: fadeUp 0.35s ease both;
  }
  .m-card:hover { transform: translateY(-2px); border-color: rgba(245,158,11,0.3); box-shadow: 0 12px 36px rgba(0,0,0,0.5); }
  .m-card.live  { border-color: rgba(16,185,129,0.35); }

  .search-inp {
    width: 100%; background: #0D1B2E; border: 1px solid #1A2E45;
    border-radius: 14px; padding: 11px 14px 11px 40px;
    font-size: 13px; color: #fff; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: var(--font-body);
  }
  .search-inp:focus { border-color: rgba(245,158,11,0.5); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
  .search-inp::placeholder { color: #4B5563; }

  .filter-pill {
    padding: 7px 14px; border-radius: 999px; font-size: 11px;
    font-weight: 700; font-family: var(--font-mono); border: 1px solid #1A2E45;
    cursor: pointer; transition: all 0.18s; background: #0D1B2E; color: #6B7280;
    white-space: nowrap;
  }
  .filter-pill.active {
    background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.4); color: #F59E0B;
  }
`;

export default function UnionMembersPage() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatus]       = useState("ALL");
  const [duesFilter,   setDues]         = useState("ALL");
  const [cityFilter,   setCity]         = useState("ALL");
  const [selected,     setSelected]     = useState<string | null>(null);
  const [members,      setMembers]      = useState<Member[]>([]);

  // Direct Add Modal State (Union Admin)
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [newMemberName,     setNewMemberName]     = useState("");
  const [newMemberPhone,    setNewMemberPhone]    = useState("");
  const [newMemberCity,     setNewMemberCity]     = useState("Shimla");
  const [newMemberVehicle,  setNewMemberVehicle]  = useState("Sedan");
  const [newMemberPlate,    setNewMemberPlate]    = useState("");

  async function handleDirectAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPlate.trim()) return;

    const id = "M-DIRECT-" + Date.now().toString().slice(-6);
    const newApp = {
      id,
      name: newMemberName,
      phone: newMemberPhone || "9800000000",
      city: newMemberCity,
      district: newMemberCity,
      vehicle: newMemberVehicle,
      plate: newMemberPlate.toUpperCase(),
      experience: "Direct Entry by Union Admin",
      licenseNo: "HP-UNION-" + newMemberPlate.toUpperCase().slice(-4),
      docs: ["RC Book", "Driving License", "Union Membership Card"],
      applied: new Date().toISOString().split("T")[0],
      status: "APPROVED",
      source: "live",
    };

    try {
      await fetch("http://localhost:4000/union/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      });
    } catch (err) {
      console.warn("Direct add API error, fallback to localStorage:", err);
    }

    if (typeof window !== "undefined") {
      const existing = JSON.parse(window.localStorage.getItem("union_applications") || "[]");
      const filtered = existing.filter((a: any) => a.phone !== newApp.phone && a.id !== newApp.id);
      filtered.unshift(newApp);
      window.localStorage.setItem("union_applications", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
    }

    setShowAddModal(false);
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberPlate("");
  }

  // Load live approved applications from Backend API + localStorage & poll every 3s
  useEffect(() => {
    async function loadLiveApproved() {
      if (typeof window === "undefined") return;

      let apiApps: any[] = [];
      try {
        const res = await fetch("http://localhost:4000/union/applications");
        if (res.ok) {
          const data = await res.json();
          apiApps = data.applications || [];
        }
      } catch (e) {
        console.warn("Failed to fetch backend members:", e);
      }

      const localApps: any[] = JSON.parse(
        window.localStorage.getItem("union_applications") || "[]"
      );

      const allAppsMap = new Map<string, any>();
      localApps.forEach(a => allAppsMap.set(a.id, a));
      apiApps.forEach(a => allAppsMap.set(a.id, a));

      const allApps = Array.from(allAppsMap.values());
      const approvedApps = allApps.filter((a: any) => a.status === "APPROVED");

      const liveMembers: Member[] = approvedApps.map((a: any) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        city: a.city || a.district || "HP",
        vehicle: a.vehicle || "Sedan",
        plate: a.plate || "HP-01-XX",
        status: "ACTIVE",
        dues: "PAID",
        rating: 5.0,
        joined: a.applied || new Date().toISOString().split("T")[0],
        rides: 0,
        source: "live",
      }));

      // Only show real approved applicants — no demo/seed data
      setMembers(liveMembers);
    }

    loadLiveApproved();
    window.addEventListener("storage", loadLiveApproved);
    const timer = setInterval(loadLiveApproved, 3000);
    return () => {
      window.removeEventListener("storage", loadLiveApproved);
      clearInterval(timer);
    };
  }, []);

  const cities = useMemo(() => ["ALL", ...Array.from(new Set(members.map(m => m.city))).sort()], [members]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const q = search.toLowerCase();
      const matchSearch  = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.plate.toLowerCase().includes(q) || m.city.toLowerCase().includes(q);
      const matchStatus  = statusFilter === "ALL" || m.status === statusFilter;
      const matchDues    = duesFilter   === "ALL" || m.dues   === duesFilter;
      const matchCity    = cityFilter   === "ALL" || m.city   === cityFilter;
      return matchSearch && matchStatus && matchDues && matchCity;
    });
  }, [members, search, statusFilter, duesFilter, cityFilter]);

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 280, borderRadius: "50%", opacity: 0.1,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 65%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 16,
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 0 20px rgba(245,158,11,0.35)",
            }}>👥</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                Member <span style={{ color: "#F59E0B" }}>Directory</span>
              </h1>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
                {filtered.length} of {members.length} members shown
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                fontFamily: "var(--font-display)", border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "#1A0A00",
                boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
              }}
            >
              ➕ Direct Add
            </button>
            <div style={{
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B",
            }}>
              {members.filter(m => m.status === "ACTIVE").length} Active
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12, animation: "fadeUp 0.4s ease both", animationDelay: "60ms" }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            fontSize: 16, pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, phone, plate, city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-inp"
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 8, animation: "fadeUp 0.4s ease both", animationDelay: "100ms" }} className="scrollbar-hide">
          {["ALL", "ACTIVE", "SUSPENDED", "PENDING"].map(s => (
            <button key={s} className={`filter-pill ${statusFilter === s ? "active" : ""}`} onClick={() => setStatus(s)}>
              {s === "ALL" ? "All Status" : s === "ACTIVE" ? "✓ Active" : s === "SUSPENDED" ? "✕ Suspended" : "⏳ Pending"}
            </button>
          ))}
        </div>

        {/* Dues + City Filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 18, animation: "fadeUp 0.4s ease both", animationDelay: "130ms" }} className="scrollbar-hide">
          {["ALL", "PAID", "DUE", "OVERDUE"].map(d => (
            <button key={d} className={`filter-pill ${duesFilter === d ? "active" : ""}`} onClick={() => setDues(d)}>
              {d === "ALL" ? "All Dues" : DUES_STYLES[d]?.label}
            </button>
          ))}
          {cities.slice(1).map(c => (
            <button key={c} className={`filter-pill ${cityFilter === c ? "active" : ""}`} onClick={() => setCity(cityFilter === c ? "ALL" : c)}>
              📍 {c}
            </button>
          ))}
        </div>

        {/* Member Cards */}
        {filtered.length === 0 ? (
          <div style={{
            background: "#0D1B2E", border: "1px dashed #1A2E45", borderRadius: 20,
            padding: "56px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔰</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
              {members.length === 0 ? "No approved members yet" : "No members match your filters"}
            </p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {members.length === 0
                ? "Once a driver's join request is approved, they will appear here"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((m, i) => {
              const ss = STATUS_STYLES[m.status] || STATUS_STYLES.ACTIVE;
              const ds = DUES_STYLES[m.dues] || DUES_STYLES.PAID;
              const isSelected = selected === m.id;

              return (
                <div
                  key={m.id}
                  className={`m-card live`}
                  style={{ animationDelay: `${i * 40}ms`, cursor: "pointer", borderColor: isSelected ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.35)" }}
                  onClick={() => setSelected(isSelected ? null : m.id)}
                >
                  {/* Approved member badge */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8,
                    padding: "2px 8px", borderRadius: 999,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                    fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10B981",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease infinite", display: "inline-block" }} />
                    APPROVED MEMBER
                  </div>

                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: "linear-gradient(135deg, #162540, #1A2E45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, border: "1px solid #1A2E45",
                    }}>
                      {VEHICLE_ICONS_L[m.vehicle] || "🚗"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "var(--font-display)" }}>
                        {m.name}
                      </p>
                      <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                        📍 {m.city} · {m.vehicle}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                        padding: "3px 8px", borderRadius: 999,
                        background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                      }}>{ss.label}</span>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: ds.color, fontWeight: 600 }}>
                        {ds.label}
                      </span>
                    </div>
                  </div>

                  {/* Info chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8", background: "rgba(26,46,69,0.6)", border: "1px solid #1A2E45", borderRadius: 999, padding: "3px 8px" }}>
                      🪪 {m.plate}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8", background: "rgba(26,46,69,0.6)", border: "1px solid #1A2E45", borderRadius: 999, padding: "3px 8px" }}>
                      📞 {m.phone}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 999, padding: "3px 8px" }}>
                      ⭐ {m.rating}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#94A3B8", background: "rgba(26,46,69,0.6)", border: "1px solid #1A2E45", borderRadius: 999, padding: "3px 8px" }}>
                      🚗 {m.rides.toLocaleString("en-IN")} rides
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div style={{ marginTop: 14, borderTop: "1px solid #1A2E45", paddingTop: 14, animation: "fadeUp 0.25s ease both" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "Joined", value: m.joined },
                          { label: "Total Rides", value: m.rides.toLocaleString("en-IN") },
                          { label: "Rating", value: `⭐ ${m.rating}/5.0` },
                          { label: "Dues Status", value: ds.label },
                        ].map(d => (
                          <div key={d.label} style={{ background: "rgba(5,13,26,0.6)", borderRadius: 10, padding: "8px 12px" }}>
                            <p style={{ fontSize: 10, color: "#4B5563", fontFamily: "var(--font-mono)", margin: 0, textTransform: "uppercase" }}>{d.label}</p>
                            <p style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600, margin: "3px 0 0" }}>{d.value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{
                          flex: 1, padding: "9px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B",
                          cursor: "pointer", fontFamily: "var(--font-display)",
                        }}>
                          📞 Call Member
                        </button>
                        {m.status === "ACTIVE" ? (
                          <button style={{
                            flex: 1, padding: "9px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444",
                            cursor: "pointer", fontFamily: "var(--font-display)",
                          }}>
                            🚫 Suspend
                          </button>
                        ) : (
                          <button style={{
                            flex: 1, padding: "9px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981",
                            cursor: "pointer", fontFamily: "var(--font-display)",
                          }}>
                            ✅ Reinstate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Add Member Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(5,13,26,0.85)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "#0D1B2E", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 24, padding: 24, width: "100%", maxWidth: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)", animation: "fadeUp 0.3s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>
                  ➕ Direct Add Union Member
                </h2>
                <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
                  Bypasses approval queue — adds member immediately
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleDirectAddMember} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Driver Full Name *
                </label>
                <input type="text" required placeholder="e.g. Ramesh Kumar"
                  value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                  style={{ width: "100%", background: "#050D1A", border: "1px solid #1A2E45", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Mobile Number *
                </label>
                <input type="tel" required placeholder="10-digit number"
                  value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value.replace(/\D/g, ""))}
                  style={{ width: "100%", background: "#050D1A", border: "1px solid #1A2E45", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                    District / City
                  </label>
                  <select value={newMemberCity} onChange={e => setNewMemberCity(e.target.value)}
                    style={{ width: "100%", background: "#050D1A", border: "1px solid #1A2E45", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none" }}>
                    {["Shimla", "Mandi", "Kullu", "Kangra", "Solan", "Bilaspur", "Una", "Chamba"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                    Vehicle Type
                  </label>
                  <select value={newMemberVehicle} onChange={e => setNewMemberVehicle(e.target.value)}
                    style={{ width: "100%", background: "#050D1A", border: "1px solid #1A2E45", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none" }}>
                    {["Hatchback", "Sedan", "SUV", "Luxury"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Plate / Registration Number *
                </label>
                <input type="text" required placeholder="e.g. HP01-AB-1234"
                  value={newMemberPlate} onChange={e => setNewMemberPlate(e.target.value.toUpperCase())}
                  style={{ width: "100%", background: "#050D1A", border: "1px solid #1A2E45", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "var(--font-mono)" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  flex: 1, padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45", color: "#9CA3AF", cursor: "pointer",
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 2, padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "#1A0A00", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
                }}>✅ Add Member Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnionBottomNav />
    </main>
  );
}
