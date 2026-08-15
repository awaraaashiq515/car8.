"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin     { to   { transform: rotate(360deg); } }
  @keyframes shimmer  {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
    50%      { box-shadow: 0 0 40px rgba(245,158,11,0.6); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%     { transform: translateY(-6px) rotate(2deg); }
  }

  .u-input {
    width: 100%;
    background: rgba(5,13,26,0.8);
    border: 1px solid #1A2E45;
    border-radius: 14px;
    padding: 13px 16px;
    font-size: 14px;
    color: #E2E8F0;
    outline: none;
    font-family: var(--font-body);
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .u-input:focus {
    border-color: rgba(245,158,11,0.6);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
    background: rgba(5,13,26,1);
  }
  .u-input::placeholder { color: #374151; }

  .u-btn {
    width: 100%;
    padding: 14px 20px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    font-family: var(--font-display);
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
    background-size: 200% auto;
    color: #1A0A00;
    transition: all 0.3s;
    animation: glow 3s ease infinite;
  }
  .u-btn:hover {
    background-position: right center;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(245,158,11,0.45);
  }
  .u-btn:active  { transform: translateY(0); }
  .u-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    animation: none;
    box-shadow: none;
  }

  .otp-input {
    width: 100%;
    background: rgba(5,13,26,0.8);
    border: 2px solid rgba(245,158,11,0.3);
    border-radius: 16px;
    padding: 16px;
    font-size: 30px;
    font-weight: 800;
    font-family: var(--font-mono);
    color: #F59E0B;
    text-align: center;
    letter-spacing: 0.4em;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .otp-input:focus {
    border-color: #F59E0B;
    box-shadow: 0 0 0 4px rgba(245,158,11,0.15);
  }
  .otp-input::placeholder { color: rgba(245,158,11,0.2); letter-spacing: 0.3em; }
`;

export default function UnionLoginPage() {
  const router = useRouter();

  const [stage,   setStage]   = useState<"id" | "otp">("id");
  const [unionId, setUnionId] = useState("");
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  // In a real app, devCode would come from the backend
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!unionId.trim()) { setError("Please enter your Union ID or Admin Username."); return; }
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    setError(null);
    setLoading(true);

    // ── Simulate API call ──────────────────────────────
    await new Promise(r => setTimeout(r, 1200));
    // In production: POST /union/auth/login/request
    setDevCode("248163"); // dev-only demo code
    setLoading(false);
    setStage("otp");
  }

  async function handleVerify() {
    if (otp.length < 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(null);
    setLoading(true);

    // ── Simulate API verify ────────────────────────────
    await new Promise(r => setTimeout(r, 1000));
    // In production: POST /union/auth/login/verify

    if (otp !== "248163" && otp !== devCode) {
      setLoading(false);
      setError("Invalid OTP. Please try again.");
      return;
    }

    // Save session
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cab8_union_token", "union_demo_token_" + Date.now());
      window.localStorage.setItem("cab8_union_id", unionId);
      window.localStorage.setItem("cab8_union_name", "Himachal Pradesh Taxi Union");
    }

    setLoading(false);
    router.push("/union/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <style>{G}</style>

      {/* Background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 320, borderRadius: "50%", opacity: 0.15,
          background: "radial-gradient(ellipse, #F59E0B 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-5%", right: "-5%",
          width: 300, height: 300, borderRadius: "50%", opacity: 0.07,
          background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "-5%",
          width: 200, height: 200, borderRadius: "50%", opacity: 0.06,
          background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}>

        {/* ── Logo & Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp 0.5s ease both" }}>
          {/* Union emblem */}
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 20px",
            background: "linear-gradient(135deg, #92400E, #D97706, #F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            boxShadow: "0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.15)",
            animation: "float 4s ease-in-out infinite",
          }}>🔰</div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
            Taxi <span style={{ color: "#F59E0B" }}>Union</span> Portal
          </h1>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            ADMIN LOGIN · HIMACHAL PRADESH
          </p>
        </div>

        {/* ── Login Card ── */}
        <div style={{
          background: "rgba(13,27,46,0.9)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)",
          backdropFilter: "blur(16px)",
          animation: "fadeUp 0.5s ease both", animationDelay: "80ms",
        }}>

          {stage === "id" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                  Welcome Back 👋
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  Enter your Union Admin credentials to continue
                </p>
              </div>

              {/* Union ID */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Union ID / Admin Username
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔰</span>
                  <input
                    type="text"
                    className="u-input"
                    style={{ paddingLeft: 42 }}
                    placeholder="e.g. HPTU-2024 or admin username"
                    value={unionId}
                    onChange={e => setUnionId(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Registered Mobile Number
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    background: "rgba(5,13,26,0.8)", border: "1px solid #1A2E45",
                    borderRadius: 14, padding: "13px 14px",
                    fontSize: 13, color: "#9CA3AF",
                  }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    className="u-input"
                    placeholder="10-digit number"
                    value={phone}
                    maxLength={10}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#EF4444",
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button
                className="u-btn"
                onClick={handleSendOtp}
                disabled={loading || !unionId.trim() || phone.length < 10}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#1A0A00", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Sending OTP…
                  </span>
                ) : "Send OTP →"}
              </button>

              {/* Demo hint */}
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 12, padding: "10px 14px",
              }}>
                <p style={{ fontSize: 11, color: "#92400E", margin: 0, fontFamily: "var(--font-mono)" }}>
                  💡 <strong style={{ color: "#F59E0B" }}>Demo:</strong> Union ID: HPTU-2024 · Phone: any 10-digit number
                </p>
              </div>
            </div>
          ) : (
            /* OTP Stage */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                  Verify Your OTP
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                  OTP has been sent to +91 {phone}
                </p>
              </div>

              {/* Dev OTP hint */}
              {devCode && (
                <div style={{
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 12, padding: "10px 16px", textAlign: "center",
                }}>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 4px", fontFamily: "var(--font-mono)" }}>
                    ⚠️ Dev Mode — SMS will be sent in production
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}>
                    {devCode}
                  </p>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>
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
                  onKeyDown={e => e.key === "Enter" && otp.length === 6 && handleVerify()}
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

              <button
                className="u-btn"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.2)", borderTopColor: "#1A0A00", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Verifying…
                  </span>
                ) : "✓ Verify & Go to Dashboard"}
              </button>

              <button
                onClick={() => { setStage("id"); setOtp(""); setError(null); setDevCode(null); }}
                style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", padding: "4px 0" }}
              >
                ← Change number
              </button>
            </div>
          )}
        </div>

        {/* ── Register link ── */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20, animation: "fadeUp 0.5s ease both", animationDelay: "200ms" }}>
          Don&apos;t have an account?{" "}
          <Link href="/union/register" style={{ color: "#F59E0B", fontWeight: 700, textDecoration: "none" }}>
            Register here →
          </Link>
        </p>

        {/* ── Back to Cab8 home ── */}
        <p style={{ textAlign: "center", marginTop: 12, animation: "fadeUp 0.5s ease both", animationDelay: "250ms" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#4B5563", textDecoration: "none",
            fontFamily: "var(--font-mono)",
          }}>
            ← Back to Cab8 Home
          </Link>
        </p>

      </div>
    </main>
  );
}
