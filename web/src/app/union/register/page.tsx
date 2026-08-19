"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types & Constants ─────────────────────────────────────────────────────────
type Stage = 0 | 1 | 2 | 3; // 0=union info, 1=admin details, 2=location, 3=otp

const HP_DISTRICTS = [
  "Shimla", "Mandi", "Kullu", "Kangra", "Solan", "Bilaspur",
  "Hamirpur", "Una", "Chamba", "Kinnaur", "Lahaul & Spiti", "Sirmaur",
];

const ZONE_OPTIONS = [
  { id: "HP",          label: "Himachal Pradesh", icon: "🏔️" },
  { id: "Chandigarh",  label: "Chandigarh",       icon: "🌆" },
  { id: "Punjab",      label: "Punjab",            icon: "🌾" },
  { id: "Delhi",       label: "Delhi / NCR",       icon: "🏙️" },
  { id: "Uttarakhand", label: "Uttarakhand",       icon: "🗻" },
  { id: "AllIndia",    label: "All India Permit",  icon: "🇮🇳" },
];

const STEPS = [
  { label: "Union Info",    icon: "🔰" },
  { label: "Admin Details", icon: "👤" },
  { label: "Location",      icon: "📍" },
  { label: "Verify OTP",    icon: "📱" },
];

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to   { transform:rotate(360deg); } }
  @keyframes glow    { 0%,100% { box-shadow:0 0 20px rgba(245,158,11,0.3); } 50% { box-shadow:0 0 40px rgba(245,158,11,0.6); } }
  @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }

  .u-input {
    width:100%; background:rgba(5,13,26,0.8); border:1px solid #1A2E45;
    border-radius:14px; padding:13px 16px; font-size:14px; color:#E2E8F0;
    outline:none; font-family:var(--font-body);
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .u-input:focus { border-color:rgba(245,158,11,0.6); box-shadow:0 0 0 3px rgba(245,158,11,0.12); }
  .u-input::placeholder { color:#374151; }

  select.u-input { appearance:none; cursor:pointer; }

  .u-btn {
    width:100%; padding:14px 20px; border-radius:14px;
    font-size:15px; font-weight:700; font-family:var(--font-display); border:none; cursor:pointer;
    background:linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
    color:#1A0A00; transition:all 0.3s;
    animation: glow 3s ease infinite;
  }
  .u-btn:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(245,158,11,0.45); }
  .u-btn:active { transform:translateY(0); }
  .u-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; animation:none; box-shadow:none; }

  .ghost-btn {
    flex:1; padding:12px 16px; border-radius:14px; font-size:14px; font-weight:600;
    font-family:var(--font-display); cursor:pointer; transition:all 0.2s;
    background:rgba(26,46,69,0.5); border:1px solid #1A2E45; color:#9CA3AF;
  }
  .ghost-btn:hover { background:rgba(26,46,69,0.9); border-color:#2A3E55; color:#E2E8F0; }

  .zone-btn {
    display:flex; align-items:center; gap:8px;
    padding:10px 14px; border-radius:12px; font-size:12px; font-weight:600;
    cursor:pointer; transition:all 0.18s; border:1px solid #1A2E45;
    background:#0D1B2E; color:#6B7280;
    font-family:var(--font-mono);
  }
  .zone-btn.selected {
    background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.4); color:#F59E0B;
  }

  .otp-input {
    width:100%; background:rgba(5,13,26,0.9); border:2px solid rgba(245,158,11,0.3);
    border-radius:16px; padding:16px; font-size:30px; font-weight:800;
    font-family:var(--font-mono); color:#F59E0B; text-align:center;
    letter-spacing:0.4em; outline:none; transition:border-color 0.2s, box-shadow 0.2s;
  }
  .otp-input:focus { border-color:#F59E0B; box-shadow:0 0 0 4px rgba(245,158,11,0.15); }
  .otp-input::placeholder { color:rgba(245,158,11,0.2); letter-spacing:0.3em; }
`;

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepBar({ current }: { current: Stage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: done ? 14 : 16, fontWeight: 700,
                background: done
                  ? "#10B981"
                  : active
                    ? "linear-gradient(135deg, #D97706, #F59E0B)"
                    : "#1A2E45",
                color: done || active ? "#fff" : "#4B5563",
                boxShadow: active ? "0 0 16px rgba(245,158,11,0.5)" : "none",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : step.icon}
              </div>
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
                color: active ? "#F59E0B" : done ? "#10B981" : "#4B5563",
                textAlign: "center", width: 52, lineHeight: 1.3, letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 6px", marginBottom: 18,
                background: i < current
                  ? "linear-gradient(90deg, #10B981, #10B98180)"
                  : "#1A2E45",
                transition: "background 0.5s",
                borderRadius: 999,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field Component ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
        color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function UnionRegisterPage() {
  const router = useRouter();

  // Step 0 — Union Info
  const [unionName,    setUnionName]    = useState("");
  const [unionShort,   setUnionShort]   = useState("");
  const [foundedYear,  setFoundedYear]  = useState("");
  const [selectedZones, setZones]       = useState<string[]>(["HP"]);

  // Step 1 — Admin Details
  const [adminName,    setAdminName]    = useState("");
  const [adminPhone,   setAdminPhone]   = useState("");
  const [adminEmail,   setAdminEmail]   = useState("");
  const [role,         setRole]         = useState("President");

  // Step 2 — Location
  const [district,     setDistrict]     = useState("Shimla");
  const [address,      setAddress]      = useState("");

  // Step 3 — OTP
  const [otp,          setOtp]          = useState("");
  const [devCode,      setDevCode]      = useState<string | null>(null);

  // UI State
  const [stage,        setStage]        = useState<Stage>(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  function toggleZone(id: string) {
    setZones(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]);
  }

  function nextStep() {
    setError(null);

    if (stage === 0) {
      if (!unionName.trim()) { setError("Please enter the union name."); return; }
      if (!unionShort.trim()) { setError("Please enter the union short code / abbreviation."); return; }
      setStage(1);
    } else if (stage === 1) {
      if (adminName.trim().length < 2) { setError("Please enter the admin's full name."); return; }
      if (adminPhone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
      setStage(2);
    } else if (stage === 2) {
      if (!district) { setError("Please select a district."); return; }
      handleRequestOtp();
    }
  }

  async function handleRequestOtp() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    // In production: POST /union/auth/register
    setDevCode("319452");
    setLoading(false);
    setStage(3);
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(null);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    // In production: POST /union/auth/register/verify

    if (otp !== devCode && otp !== "319452") {
      setLoading(false);
      setError("Invalid OTP. Please try again.");
      return;
    }

    // Save session
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cab8_union_token", "union_token_" + Date.now());
      window.localStorage.setItem("cab8_union_name", unionName);
      window.localStorage.setItem("cab8_union_id", unionShort.toUpperCase());
      window.localStorage.setItem("cab8_union_district", district);
    }

    // Register union in backend DB so drivers can find it
    try {
      await fetch("http://localhost:4001/union/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: unionName,
          short_code: unionShort.toUpperCase(),
          district,
          city: district,
          admin_name: adminName,
          admin_phone: adminPhone,
        }),
      });
    } catch { /* ignore network error */ }

    setLoading(false);
    router.push("/union/dashboard");
  }

  const canNext0 = unionName.trim().length > 0 && unionShort.trim().length > 0;
  const canNext1 = adminName.trim().length >= 2 && adminPhone.length >= 10;
  const canNext2 = !!district;

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
      <style>{G}</style>

      {/* Background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%", opacity: 0.12,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 300, height: 300, borderRadius: "50%", opacity: 0.06,
          background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 460 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #92400E, #D97706, #F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, boxShadow: "0 0 36px rgba(245,158,11,0.45)",
            animation: "float 4s ease-in-out infinite",
          }}>🔰</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
            Union <span style={{ color: "#F59E0B" }}>Registration</span>
          </h1>
          <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            REGISTER A NEW TAXI UNION
          </p>
        </div>

        {/* ── Step Bar ── */}
        <div style={{ animation: "fadeUp 0.5s ease both", animationDelay: "60ms" }}>
          <StepBar current={stage} />
        </div>

        {/* ── Form Card ── */}
        <div style={{
          background: "rgba(13,27,46,0.92)", border: "1px solid rgba(245,158,11,0.18)",
          borderRadius: 24, padding: 26,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.06)",
          backdropFilter: "blur(16px)",
          animation: "fadeUp 0.5s ease both", animationDelay: "100ms",
        }}>

          {/* Error display */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#EF4444", marginBottom: 18,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* ──────── STEP 0: Union Info ──────── */}
          {stage === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  🔰 Union Information
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  Enter the details of your taxi union
                </p>
              </div>

              <Field label="Union Full Name *">
                <input
                  type="text"
                  className="u-input"
                  placeholder="e.g. Himachal Pradesh Taxi Union"
                  value={unionName}
                  onChange={e => setUnionName(e.target.value)}
                />
              </Field>

              <Field label="Short Code / Abbreviation *">
                <input
                  type="text"
                  className="u-input"
                  placeholder="e.g. HPTU, STUA, MTDA"
                  value={unionShort}
                  onChange={e => setUnionShort(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Year Established">
                  <input
                    type="number"
                    className="u-input"
                    placeholder="e.g. 1998"
                    value={foundedYear}
                    onChange={e => setFoundedYear(e.target.value)}
                    min="1950" max="2026"
                  />
                </Field>
                <Field label="Members (Approx.)">
                  <input
                    type="number"
                    className="u-input"
                    placeholder="e.g. 250"
                    min="1"
                  />
                </Field>
              </div>

              <Field label="Operating Zones (select all that apply)">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ZONE_OPTIONS.map(z => (
                    <button
                      key={z.id}
                      type="button"
                      className={`zone-btn ${selectedZones.includes(z.id) ? "selected" : ""}`}
                      onClick={() => toggleZone(z.id)}
                    >
                      <span style={{ fontSize: 16 }}>{z.icon}</span>
                      <span>{z.label}</span>
                      {selectedZones.includes(z.id) && <span style={{ marginLeft: "auto" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </Field>

              <button className="u-btn" onClick={nextStep} disabled={!canNext0}>
                Next: Admin Details →
              </button>
            </div>
          )}

          {/* ──────── STEP 1: Admin Details ──────── */}
          {stage === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  👤 Admin Details
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  Enter details of the union admin (president / secretary)
                </p>
              </div>

              <Field label="Admin Full Name *">
                <input
                  type="text"
                  className="u-input"
                  placeholder="e.g. Rajendra Singh Thakur"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                />
              </Field>

              <Field label="Mobile Number (for OTP) *">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    background: "rgba(5,13,26,0.8)", border: "1px solid #1A2E45",
                    borderRadius: 14, padding: "13px 14px", fontSize: 13, color: "#9CA3AF",
                  }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    className="u-input"
                    placeholder="10-digit number"
                    value={adminPhone}
                    maxLength={10}
                    onChange={e => setAdminPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </Field>

              <Field label="Email Address (Optional)">
                <input
                  type="email"
                  className="u-input"
                  placeholder="e.g. admin@hptaxiunion.in"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                />
              </Field>

              <Field label="Designation / Role">
                <select
                  className="u-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ background: "rgba(5,13,26,0.8)" }}
                >
                  {["President", "Secretary", "Treasurer", "Vice President", "Joint Secretary", "Coordinator"].map(r => (
                    <option key={r} value={r} style={{ background: "#0D1B2E" }}>{r}</option>
                  ))}
                </select>
              </Field>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="ghost-btn" onClick={() => { setStage(0); setError(null); }}>← Back</button>
                <button
                  className="u-btn"
                  style={{ flex: 2 }}
                  onClick={nextStep}
                  disabled={!canNext1}
                >
                  Next: Location →
                </button>
              </div>
            </div>
          )}

          {/* ──────── STEP 2: Location ──────── */}
          {stage === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  📍 Union Location
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  Enter the district and office address of your union
                </p>
              </div>

              <Field label="District *">
                <select
                  className="u-input"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  style={{ background: "rgba(5,13,26,0.8)" }}
                >
                  {HP_DISTRICTS.map(d => (
                    <option key={d} value={d} style={{ background: "#0D1B2E" }}>{d}</option>
                  ))}
                  <option value="Delhi" style={{ background: "#0D1B2E" }}>Delhi</option>
                  <option value="Chandigarh" style={{ background: "#0D1B2E" }}>Chandigarh</option>
                  <option value="Other" style={{ background: "#0D1B2E" }}>Other</option>
                </select>
              </Field>

              <Field label="Office Address">
                <textarea
                  className="u-input"
                  placeholder="e.g. Union Bhawan, Near Bus Stand, Shimla — 171001"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  style={{ resize: "none" }}
                />
              </Field>

              {/* Summary Card */}
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 14, padding: 16,
              }}>
                <p style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
                  Registration Summary
                </p>
                {[
                  { label: "Union",   value: `${unionName} (${unionShort})` },
                  { label: "Admin",   value: `${adminName} · ${role}` },
                  { label: "Phone",   value: `+91 ${adminPhone}` },
                  { label: "Zones",   value: selectedZones.join(", ") },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{s.label}:</span>
                    <span style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600, textAlign: "right", flex: 1 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="ghost-btn" onClick={() => { setStage(1); setError(null); }}>← Back</button>
                <button
                  className="u-btn"
                  style={{ flex: 2 }}
                  onClick={nextStep}
                  disabled={loading || !canNext2}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#1A0A00", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Sending OTP…
                    </span>
                  ) : "Send OTP & Verify →"}
                </button>
              </div>
            </div>
          )}

          {/* ──────── STEP 3: OTP Verification ──────── */}
          {stage === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>📱</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                  Verify Your Phone Number
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  OTP sent to: <strong style={{ color: "#E2E8F0" }}>+91 {adminPhone}</strong>
                </p>
              </div>

              {devCode && (
                <div style={{
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 12, padding: "12px 16px", textAlign: "center",
                }}>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 6px", fontFamily: "var(--font-mono)" }}>
                    ⚠️ Dev Mode — SMS will be sent in production
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.4em" }}>
                    {devCode}
                  </p>
                </div>
              )}

              <div>
                <label style={{
                  display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 8, textAlign: "center",
                }}>
                  6-Digit OTP
                </label>
                <input
                  type="tel"
                  className="otp-input"
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  maxLength={6}
                  autoFocus
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && otp.length === 6 && handleVerifyOtp()}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#EF4444",
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Success animation */}
              {otp.length === 6 && !error && (
                <div style={{
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#10B981",
                  fontFamily: "var(--font-mono)", textAlign: "center",
                }}>
                  ✓ OTP is ready — click verify below!
                </div>
              )}

              <button
                className="u-btn"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#1A0A00", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Registering your union…
                  </span>
                ) : "✓ Register & Go to Dashboard"}
              </button>

              <button
                onClick={() => { setOtp(""); setError(null); setStage(2); }}
                style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", padding: "4px 0", textAlign: "center" }}
              >
                ← Go back / Resend OTP
              </button>
            </div>
          )}
        </div>

        {/* ── Already registered? ── */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20, animation: "fadeUp 0.5s ease both", animationDelay: "200ms" }}>
          Already registered?{" "}
          <Link href="/union/login" style={{ color: "#F59E0B", fontWeight: 700, textDecoration: "none" }}>
            Login here →
          </Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 10, animation: "fadeUp 0.5s ease both", animationDelay: "240ms" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#4B5563", textDecoration: "none", fontFamily: "var(--font-mono)",
          }}>
            ← Back to Cab8 Home
          </Link>
        </p>
      </div>
    </main>
  );
}
