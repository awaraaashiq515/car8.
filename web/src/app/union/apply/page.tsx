"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HP_DISTRICTS = [
  "Shimla", "Mandi", "Kullu", "Kangra", "Solan", "Bilaspur",
  "Hamirpur", "Una", "Chamba", "Kinnaur", "Lahaul & Spiti", "Sirmaur",
];

const VEHICLE_OPTIONS = [
  { value: "Hatchback", icon: "🚗", desc: "4 seats · Budget rides" },
  { value: "Sedan",     icon: "🚙", desc: "4 seats · Comfortable" },
  { value: "SUV",       icon: "🚐", desc: "6 seats · Hill roads" },
  { value: "Luxury",    icon: "🏎️", desc: "Premium fleet" },
];

const DOC_OPTIONS = [
  "RC Book", "Driving License", "Insurance", "Aadhaar Card", "PAN Card", "NOC Letter",
];

const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to   { transform:rotate(360deg); } }
  @keyframes glow    { 0%,100% { box-shadow:0 0 20px rgba(245,158,11,0.3); } 50% { box-shadow:0 0 40px rgba(245,158,11,0.6); } }
  @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @keyframes success { 0% { transform:scale(0.6); opacity:0; } 100% { transform:scale(1); opacity:1; } }

  .a-input {
    width:100%; background:rgba(5,13,26,0.8); border:1px solid #1A2E45;
    border-radius:14px; padding:13px 16px; font-size:14px; color:#E2E8F0;
    outline:none; font-family:var(--font-body);
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .a-input:focus { border-color:rgba(245,158,11,0.6); box-shadow:0 0 0 3px rgba(245,158,11,0.12); }
  .a-input::placeholder { color:#374151; }
  select.a-input { appearance:none; cursor:pointer; }

  .a-btn {
    width:100%; padding:14px 20px; border-radius:14px;
    font-size:15px; font-weight:700; font-family:var(--font-display); border:none; cursor:pointer;
    background:linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
    color:#1A0A00; transition:all 0.3s; animation: glow 3s ease infinite;
  }
  .a-btn:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(245,158,11,0.45); }
  .a-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; animation:none; box-shadow:none; }

  .doc-chip {
    display:flex; align-items:center; gap:6px;
    padding:8px 12px; border-radius:12px; font-size:12px; font-weight:600;
    cursor:pointer; transition:all 0.18s; border:1px solid #1A2E45;
    background:#0D1B2E; color:#6B7280; font-family:var(--font-mono);
  }
  .doc-chip.sel { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.4); color:#10B981; }

  .v-card {
    display:flex; flex-direction:column; align-items:center; gap:6px;
    padding:14px 8px; border-radius:16px; border:1px solid #1A2E45;
    background:#0D1B2E; cursor:pointer; transition:all 0.18s;
  }
  .v-card.sel {
    background:rgba(245,158,11,0.08); border-color:rgba(245,158,11,0.45);
    box-shadow:0 0 16px rgba(245,158,11,0.15);
  }
`;

const STEPS = [
  { label: "Personal Info", icon: "👤" },
  { label: "Vehicle",       icon: "🚗" },
  { label: "Documents",     icon: "📄" },
  { label: "Confirm",       icon: "✅" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: done ? 14 : 16, fontWeight: 700,
                background: done ? "#10B981" : active ? "linear-gradient(135deg,#D97706,#F59E0B)" : "#1A2E45",
                color: done || active ? "#fff" : "#4B5563",
                boxShadow: active ? "0 0 14px rgba(245,158,11,0.5)" : "none",
              }}>
                {done ? "✓" : s.icon}
              </div>
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.04em",
                color: active ? "#F59E0B" : done ? "#10B981" : "#4B5563",
                textAlign: "center", width: 52, lineHeight: 1.3, textTransform: "uppercase",
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 6px", marginBottom: 18, borderRadius: 999,
                background: i < current ? "#10B981" : "#1A2E45", transition: "background 0.5s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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

export default function UnionApplyPage() {
  const router = useRouter();

  // Step 0 — Personal
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [email,      setEmail]      = useState("");
  const [district,   setDistrict]   = useState("Shimla");
  const [experience, setExperience] = useState("");
  const [licenseNo,  setLicenseNo]  = useState("");

  // Step 1 — Vehicle
  const [vehicle,   setVehicle]   = useState("SUV");
  const [plate,     setPlate]     = useState("");
  const [make,      setMake]      = useState("");
  const [model,     setModel]     = useState("");
  const [year,      setYear]      = useState("");

  // Step 2 — Documents
  const [docs,      setDocs]      = useState<string[]>(["RC Book", "Driving License"]);
  const [docPhotos, setDocPhotos] = useState<Record<string, string>>({});
  const [note,      setNote]      = useState("");

  // UI
  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);
  const [appId,     setAppId]     = useState("");

  function toggleDoc(d: string) {
    setDocs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function validate(): boolean {
    if (step === 0) {
      if (name.trim().length < 2) { setError("Please enter your full name."); return false; }
      if (phone.replace(/\D/g,"").length < 10) { setError("Enter a valid 10-digit phone number."); return false; }
      if (!licenseNo.trim()) { setError("Please enter your driving license number."); return false; }
    }
    if (step === 1) {
      if (!plate.trim()) { setError("Please enter vehicle registration number."); return false; }
    }
    if (step === 2) {
      if (docs.length < 1) { setError("Please select at least one document."); return false; }
    }
    setError(null);
    return true;
  }

  function nextStep() {
    if (!validate()) return;
    setStep(s => (s + 1) as 0 | 1 | 2 | 3);
  }

  async function handleSubmit() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const id = "APP-" + Date.now().toString().slice(-6);
    setAppId(id);

    const application = {
      id, name, phone: phone.replace(/\D/g,""), email,
      city: district, district,
      experience: experience || "Not specified",
      licenseNo: licenseNo.toUpperCase(),
      vehicle, plate: plate.toUpperCase(), make, model, year,
      docs, docPhotos, note,
      applied: new Date().toISOString().split("T")[0],
      status: "PENDING",
    };

    // Submit to Backend DB API for cross-browser / Incognito persistence
    try {
      await fetch("http://localhost:4000/union/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application),
      });
    } catch (e) {
      console.warn("Backend API save error, fallback to localStorage:", e);
    }

    // Save to localStorage as backup
    if (typeof window !== "undefined") {
      const existing = JSON.parse(window.localStorage.getItem("union_applications") || "[]");
      const filtered = existing.filter((a: any) => a.phone !== application.phone && a.id !== application.id);
      filtered.unshift(application);
      window.localStorage.setItem("union_applications", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
    }

    setLoading(false);
    setDone(true);
  }

  // ── Success Screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <style>{G}</style>
        <div style={{ textAlign: "center", maxWidth: 380, animation: "success 0.5s ease both" }}>
          <div style={{
            width: 90, height: 90, borderRadius: 28, margin: "0 auto 24px",
            background: "linear-gradient(135deg, #065F46, #10B981)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42, boxShadow: "0 0 40px rgba(16,185,129,0.5)",
          }}>✅</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>
            Application Submitted!
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 6px", lineHeight: 1.6 }}>
            Your application to join the Taxi Union has been submitted successfully.
          </p>
          <div style={{
            display: "inline-block", padding: "6px 20px", borderRadius: 999,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10B981",
            margin: "12px 0 24px",
          }}>
            Application ID: {appId}
          </div>
          <div style={{
            background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 14, padding: 16, marginBottom: 24, textAlign: "left",
          }}>
            <p style={{ fontSize: 12, color: "#F59E0B", margin: "0 0 6px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>WHAT HAPPENS NEXT?</p>
            <ul style={{ fontSize: 12, color: "#94A3B8", margin: 0, paddingLeft: 16, lineHeight: 2 }}>
              <li>Union admin will review your application</li>
              <li>You will receive an SMS notification</li>
              <li>Average review time: 2–3 working days</li>
            </ul>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/driver/dashboard" style={{
              display: "block", padding: "14px 20px", borderRadius: 14,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "#FFFFFF",
              fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
            }}>
              🚕 Return to Driver Dashboard →
            </Link>
            <button onClick={() => { setDone(false); setStep(0); }} style={{
              display: "block", width: "100%", padding: "12px 20px", borderRadius: 14,
              background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45", color: "#9CA3AF",
              fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              + Submit Another Application
            </button>
            <Link href="/" style={{
              display: "block", padding: "10px 20px", borderRadius: 14,
              color: "#64748B", fontSize: 12, fontFamily: "var(--font-mono)", textDecoration: "none"
            }}>
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", justifyContent: "center", padding: "24px 16px 48px" }}>
      <style>{G}</style>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%", opacity: 0.10,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 460 }}>

        {/* Top Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link href="/driver/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontFamily: "var(--font-mono)", color: "#94A3B8",
            textDecoration: "none", padding: "6px 12px", borderRadius: 10,
            background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45",
            transition: "all 0.2s"
          }}>
            ← Driver Dashboard
          </Link>
          <Link href="/driver" style={{
            fontSize: 12, fontFamily: "var(--font-mono)", color: "#F59E0B",
            textDecoration: "none", fontWeight: 700
          }}>
            Cab8 🚕
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #92400E, #D97706, #F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, boxShadow: "0 0 32px rgba(245,158,11,0.45)",
            animation: "float 4s ease-in-out infinite",
          }}>🔰</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
            Apply to Join <span style={{ color: "#F59E0B" }}>Taxi Union</span>
          </h1>
          <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.07em" }}>
            HIMACHAL PRADESH TAXI UNION · MEMBERSHIP APPLICATION
          </p>
        </div>

        {/* Step bar */}
        <div style={{ animation: "fadeUp 0.5s ease both", animationDelay: "60ms" }}>
          <StepBar current={step} />
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(13,27,46,0.92)", border: "1px solid rgba(245,158,11,0.18)",
          borderRadius: 24, padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          animation: "fadeUp 0.5s ease both", animationDelay: "100ms",
        }}>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#EF4444",
              marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {/* ── Step 0: Personal Info ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  👤 Personal Information
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Tell us about yourself</p>
              </div>

              <Field label="Full Name *">
                <input type="text" className="a-input" placeholder="e.g. Ramesh Kumar Thakur"
                  value={name} onChange={e => setName(e.target.value)} />
              </Field>

              <Field label="Mobile Number *">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    background: "rgba(5,13,26,0.8)", border: "1px solid #1A2E45",
                    borderRadius: 14, padding: "13px 14px", fontSize: 13, color: "#9CA3AF",
                  }}>🇮🇳 +91</div>
                  <input type="tel" className="a-input" placeholder="10-digit number"
                    value={phone} maxLength={10}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} />
                </div>
              </Field>

              <Field label="Email Address (Optional)">
                <input type="email" className="a-input" placeholder="e.g. driver@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Home District *">
                  <select className="a-input" value={district}
                    onChange={e => setDistrict(e.target.value)}
                    style={{ background: "rgba(5,13,26,0.8)" }}>
                    {HP_DISTRICTS.map(d => <option key={d} value={d} style={{ background: "#0D1B2E" }}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Driving Experience">
                  <input type="text" className="a-input" placeholder="e.g. 5 years"
                    value={experience} onChange={e => setExperience(e.target.value)} />
                </Field>
              </div>

              <Field label="Driving License Number *">
                <input type="text" className="a-input" placeholder="e.g. HP-2015-001234"
                  value={licenseNo} onChange={e => setLicenseNo(e.target.value.toUpperCase())} />
              </Field>

              <button className="a-btn" onClick={nextStep}>Next: Vehicle Details →</button>
            </div>
          )}

          {/* ── Step 1: Vehicle ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  🚗 Vehicle Details
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Tell us about your taxi</p>
              </div>

              <Field label="Vehicle Type *">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {VEHICLE_OPTIONS.map(v => (
                    <button key={v.value} type="button"
                      className={`v-card ${vehicle === v.value ? "sel" : ""}`}
                      onClick={() => setVehicle(v.value)}
                    >
                      <span style={{ fontSize: 22 }}>{v.icon}</span>
                      <span style={{
                        fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
                        color: vehicle === v.value ? "#F59E0B" : "#6B7280",
                      }}>{v.value}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Registration Number *">
                <input type="text" className="a-input" placeholder="e.g. HP33A-1234"
                  value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Make (Brand)">
                  <input type="text" className="a-input" placeholder="e.g. Maruti"
                    value={make} onChange={e => setMake(e.target.value)} />
                </Field>
                <Field label="Model">
                  <input type="text" className="a-input" placeholder="e.g. Swift"
                    value={model} onChange={e => setModel(e.target.value)} />
                </Field>
              </div>

              <Field label="Year of Manufacture">
                <input type="number" className="a-input" placeholder="e.g. 2021"
                  min="2000" max="2026" value={year} onChange={e => setYear(e.target.value)} />
              </Field>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(0); setError(null); }} style={{
                  flex: 1, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  fontFamily: "var(--font-display)", cursor: "pointer",
                  background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45", color: "#9CA3AF",
                }}>← Back</button>
                <button className="a-btn" style={{ flex: 2 }} onClick={nextStep}>Next: Documents →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Documents ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  📄 Documents Available
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Select documents you can submit</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {DOC_OPTIONS.map(d => (
                  <button key={d} type="button"
                    className={`doc-chip ${docs.includes(d) ? "sel" : ""}`}
                    onClick={() => toggleDoc(d)}
                  >
                    <span>{docs.includes(d) ? "✓" : "○"}</span>
                    <span>{d}</span>
                  </button>
                ))}
              </div>

              {/* ── Document Photo Uploaders ── */}
              {docs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    📸 Upload Document Photos (Optional)
                  </p>
                  {docs.map(docName => (
                    <div key={docName} style={{ background: "rgba(5,13,26,0.8)", border: "1px solid #1A2E45", borderRadius: 14, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", fontFamily: "var(--font-mono)" }}>
                          📄 {docName}
                        </span>
                        {docPhotos[docName] ? (
                          <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700, fontFamily: "var(--font-mono)" }}>✓ Photo Attached</span>
                        ) : (
                          <span style={{ fontSize: 10, color: "#6B7280", fontFamily: "var(--font-mono)" }}>Tap box to upload</span>
                        )}
                      </div>
                      <label style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: 10, borderRadius: 10, cursor: "pointer",
                        background: docPhotos[docName] ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.04)",
                        border: docPhotos[docName] ? "1px solid rgba(16,185,129,0.3)" : "1px dashed rgba(245,158,11,0.3)",
                      }}>
                        {docPhotos[docName] ? (
                          <div style={{ textAlign: "center", width: "100%" }}>
                            <img src={docPhotos[docName]} alt={docName} style={{ height: 90, maxWidth: "100%", objectFit: "contain", borderRadius: 8, margin: "0 auto 6px" }} />
                            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✓ Photo uploaded — tap to replace</span>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>📷</span>
                            <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>Tap to upload {docName} photo</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setDocPhotos(prev => ({ ...prev, [docName]: reader.result as string }));
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
                borderRadius: 12, padding: "10px 14px",
              }}>
                <p style={{ fontSize: 11, color: "#D97706", margin: 0 }}>
                  ⚠️ Original documents must be presented at the union office within 7 days of approval.
                </p>
              </div>

              <Field label="Additional Note (Optional)">
                <textarea className="a-input" rows={3} style={{ resize: "none" }}
                  placeholder="e.g. Former HRTC driver, referred by member Narendra Kapoor..."
                  value={note} onChange={e => setNote(e.target.value)} />
              </Field>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setError(null); }} style={{
                  flex: 1, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  fontFamily: "var(--font-display)", cursor: "pointer",
                  background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45", color: "#9CA3AF",
                }}>← Back</button>
                <button className="a-btn" style={{ flex: 2 }} onClick={nextStep}>Review Application →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & Submit ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  ✅ Review & Submit
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Please verify your details before submitting</p>
              </div>

              {/* Summary */}
              {[
                { title: "Personal", rows: [
                  ["Name", name], ["Phone", `+91 ${phone}`], ["District", district],
                  ["License", licenseNo], ["Experience", experience || "—"],
                ]},
                { title: "Vehicle", rows: [
                  ["Type", vehicle], ["Plate", plate], ["Make/Model", `${make || "—"} ${model || ""}`], ["Year", year || "—"],
                ]},
              ].map(section => (
                <div key={section.title} style={{
                  background: "rgba(5,13,26,0.6)", border: "1px solid #1A2E45",
                  borderRadius: 14, overflow: "hidden",
                }}>
                  <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.06)", borderBottom: "1px solid #1A2E45" }}>
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {section.title}
                    </p>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {section.rows.map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{label}</span>
                        <span style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600, textAlign: "right" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Docs submitted */}
              <div style={{ background: "rgba(5,13,26,0.6)", border: "1px solid #1A2E45", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F59E0B", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Documents ({docs.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {docs.map(d => (
                    <span key={d} style={{
                      fontSize: 10, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: 999,
                      background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981",
                    }}>✓ {d}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(2); setError(null); }} style={{
                  flex: 1, padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  fontFamily: "var(--font-display)", cursor: "pointer",
                  background: "rgba(26,46,69,0.5)", border: "1px solid #1A2E45", color: "#9CA3AF",
                }}>← Back</button>
                <button className="a-btn" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#1A0A00", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Submitting…
                    </span>
                  ) : "🔰 Submit Application"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
