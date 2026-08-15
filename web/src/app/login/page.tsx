"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, setUserName, setDriverToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Role  = "CUSTOMER" | "DRIVER";
type Stage = "role" | "phone" | "otp";

const ROLES: { value: Role; label: string; icon: string; desc: string; color: string }[] = [
  {
    value: "CUSTOMER",
    label: "I'm a Customer",
    icon:  "🧳",
    desc:  "Book rides, track trips",
    color: "#2563EB",
  },
  {
    value: "DRIVER",
    label: "I'm a Driver",
    icon:  "🚕",
    desc:  "Accept rides, earn money",
    color: "#06B6D4",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [stage,   setStage]   = useState<Stage>("role");
  const [role,    setRole]    = useState<Role | null>(null);
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // If already logged in, redirect immediately
  useEffect(() => {
    const token    = window.localStorage.getItem("cab8_token");
    const roleStored = window.localStorage.getItem("cab8_role");
    if (token) {
      router.replace(roleStored === "DRIVER" ? "/driver/dashboard" : "/home");
    }
  }, [router]);

  // ── Send OTP ──────────────────────────────────────────
  async function sendOtp() {
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    setError(null); setLoading(true);
    try {
      let data: { devOnlyCode: string };
      if (role === "DRIVER") {
        const res = await fetch(`${API}/driver/auth/login/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to send OTP.");
        data = json;
      } else {
        data = await api.requestOtp(phone);
      }
      setDevCode(data.devOnlyCode);
      setStage("otp");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  // ── Verify OTP + login ────────────────────────────────
  async function verify() {
    if (code.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(null); setLoading(true);
    try {
      if (role === "DRIVER") {
        const res = await fetch(`${API}/driver/auth/login/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid OTP.");
        setDriverToken(data.token);
        // Also store in primary slot so root page can read role
        window.localStorage.setItem("cab8_token", data.token);
        window.localStorage.setItem("cab8_role", "DRIVER");
        if (data.user?.name) setUserName(data.user.name);
        router.replace("/driver/dashboard");
      } else {
        const data = await api.verifyOtp(phone, code);
        setToken(data.token);
        window.localStorage.setItem("cab8_role", "CUSTOMER");
        if (data.user?.name) setUserName(data.user.name);
        router.replace("/home");
      }
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────
  const selectedRole = ROLES.find(r => r.value === role);

  return (
    <main className="min-h-screen bg-navy-deep flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #06B6D4 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              boxShadow: "0 0 40px rgba(37,99,235,0.35)",
            }}
          >
            🚕
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Cab<span className="text-gradient">8</span>
          </h1>
          <p className="text-muted text-sm mt-2">
            {stage === "role"  && "Select how you want to use Cab8"}
            {stage === "phone" && `Login as ${selectedRole?.label}`}
            {stage === "otp"   && "Enter the OTP sent to your phone"}
          </p>
        </div>

        {/* ── Stage 1: Role Picker ── */}
        {stage === "role" && (
          <div className="space-y-3 animate-fade-up">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  if (r.value === "DRIVER") {
                    router.push("/driver");
                  } else {
                    setRole("CUSTOMER");
                    setStage("phone");
                    setError(null);
                  }
                }}
                className="w-full card flex items-center gap-4 text-left hover:border-blue-primary/50 transition-all duration-200 group"
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${r.color}22, ${r.color}44)`, border: `1px solid ${r.color}33` }}
                >
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-white text-base">{r.label}</div>
                  <div className="text-sm text-muted">{r.desc}</div>
                </div>
                <span className="text-muted group-hover:text-white transition-colors text-lg">→</span>
              </button>
            ))}

            {/* ── Taxi Union Card ── */}
            <button
              onClick={() => router.push("/union/login")}
              className="w-full flex items-center gap-4 text-left transition-all duration-200 group"
              style={{
                background: "rgba(13,27,46,0.8)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 16,
                padding: "16px 20px",
                boxShadow: "0 0 20px rgba(245,158,11,0.08)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.55)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(245,158,11,0.2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.25)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(245,158,11,0.08)";
              }}
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, rgba(217,119,6,0.25), rgba(245,158,11,0.35))",
                  border: "1px solid rgba(245,158,11,0.4)",
                  boxShadow: "0 0 16px rgba(245,158,11,0.2)",
                }}
              >
                🔰
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-white text-base flex items-center gap-2">
                  Taxi Union
                  <span style={{
                    fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                    padding: "2px 7px", borderRadius: 999,
                    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                    color: "#F59E0B", letterSpacing: "0.06em",
                  }}>
                    ADMIN
                  </span>
                </div>
                <div className="text-sm" style={{ color: "#92400E" }}>Manage members, dues &amp; union</div>
              </div>
              <span style={{ color: "#F59E0B", fontSize: 18 }}>→</span>
            </button>

            <div className="pt-2 border-t border-navy-border mt-4">
              <p className="text-center text-xs text-muted">
                New driver?{" "}
                <button
                  onClick={() => router.push("/driver/register")}
                  className="text-blue-light hover:underline font-medium"
                >
                  Register here →
                </button>
                {" · "}
                <button
                  onClick={() => router.push("/union/register")}
                  style={{ color: "#F59E0B", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }}
                >
                  New Union? Register →
                </button>
              </p>
            </div>
          </div>
        )}


        {/* ── Stage 2: Phone Input ── */}
        {stage === "phone" && (
          <div className="animate-fade-up">
            {/* Role badge */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl border border-navy-border bg-navy-card">
              <span className="text-2xl">{selectedRole?.icon}</span>
              <div>
                <div className="text-xs text-muted">Signing in as</div>
                <div className="font-medium text-white">{selectedRole?.label}</div>
              </div>
              <button
                onClick={() => { setStage("role"); setPhone(""); setError(null); }}
                className="ml-auto text-xs text-muted hover:text-white transition-colors"
              >
                Change
              </button>
            </div>

            <div className="card space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-navy-border bg-navy-deep px-3 text-sm text-muted flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit number"
                    type="tel"
                    maxLength={10}
                    autoFocus
                    className="input flex-1"
                    onKeyDown={(e) => e.key === "Enter" && phone.length === 10 && sendOtp()}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={loading || phone.length < 10}
                className="btn-gradient w-full py-3.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending OTP…
                  </span>
                ) : "Send OTP →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Stage 3: OTP Input ── */}
        {stage === "otp" && (
          <div className="animate-fade-up">
            {/* Role + phone summary */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl border border-navy-border bg-navy-card">
              <span className="text-2xl">{selectedRole?.icon}</span>
              <div>
                <div className="text-xs text-muted">{selectedRole?.label}</div>
                <div className="font-medium text-white">+91 {phone}</div>
              </div>
              <button
                onClick={() => { setStage("phone"); setCode(""); setDevCode(null); setError(null); }}
                className="ml-auto text-xs text-muted hover:text-white transition-colors"
              >
                Edit
              </button>
            </div>

            <div className="card space-y-4">
              {devCode && (
                <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                  <p className="font-mono text-xs text-amber font-bold">⚠️ Dev Mode OTP: {devCode}</p>
                  <p className="text-[11px] text-muted mt-0.5">SMS will be sent in production</p>
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  6-Digit OTP
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  autoFocus
                  className="input text-center tracking-[0.5em] text-2xl font-bold py-4"
                  onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={verify}
                disabled={loading || code.length !== 6}
                className="btn-gradient w-full py-3.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying…
                  </span>
                ) : role === "DRIVER" ? "Login to Driver Dashboard →" : "Login to Customer Portal →"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-dimmed mt-6">
          © 2025 Cab8 · Secure OTP Login
        </p>
      </div>
    </main>
  );
}
