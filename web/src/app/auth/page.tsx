"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setToken, setUserName } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Tab   = "login" | "register";
type Stage = "form" | "otp";

// ─── Register flow ────────────────────────────────────────
function RegisterForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const redirect    = searchParams.get("redirect") || "/home";

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [stage,   setStage]   = useState<Stage>("form");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function sendOtp() {
    if (!name.trim() || name.length < 2) { setError("Please enter your full name."); return; }
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    setError(null); setLoading(true);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devOnlyCode);
      setStage("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  }

  async function verify() {
    if (code.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(null); setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code, name);
      setToken(res.token);
      if (res.user.name) setUserName(res.user.name);
      router.push(redirect);
    } catch (e: any) {
      setError(e.message || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {stage === "form" && (
        <>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amit Sharma"
              className="input"
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
            />
          </div>
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
                className="input flex-1"
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              />
            </div>
          </div>
          <button
            onClick={sendOtp}
            disabled={loading}
            className="btn-gradient w-full py-3.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending OTP…
              </span>
            ) : "Send OTP →"}
          </button>
        </>
      )}

      {stage === "otp" && (
        <>
          <p className="text-sm text-muted">
            OTP sent to <span className="text-white font-medium">+91 {phone}</span>
          </p>
          {devCode && (
            <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
              <p className="font-mono text-xs text-amber font-bold">⚠️ Dev Mode OTP: {devCode}</p>
              <p className="text-[11px] text-muted mt-0.5">An SMS will be sent in production</p>
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
              className="input text-center tracking-[0.5em] text-2xl font-bold py-4"
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
            />
          </div>
          <button
            onClick={verify}
            disabled={loading || code.length !== 6}
            className="btn-gradient w-full py-3.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account…
              </span>
            ) : "Create Account ✓"}
          </button>
          <button
            onClick={() => { setStage("form"); setCode(""); setDevCode(null); setError(null); }}
            className="w-full text-xs text-muted hover:text-white transition-colors py-1"
          >
            ← Change details
          </button>
        </>
      )}

      {error && (
        <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

// ─── Login flow ───────────────────────────────────────────
function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const redirect    = searchParams.get("redirect") || "/home";

  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [stage,   setStage]   = useState<Stage>("form");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function sendOtp() {
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    setError(null); setLoading(true);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devOnlyCode);
      setStage("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  }

  async function verify() {
    if (code.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(null); setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code);
      setToken(res.token);
      if (res.user.name) setUserName(res.user.name);
      router.push(redirect);
    } catch (e: any) {
      setError(e.message || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {stage === "form" && (
        <>
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
                className="input flex-1"
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              />
            </div>
          </div>
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
        </>
      )}

      {stage === "otp" && (
        <>
          <p className="text-sm text-muted">
            OTP sent to <span className="text-white font-medium">+91 {phone}</span>
          </p>
          {devCode && (
            <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
              <p className="font-mono text-xs text-amber font-bold">⚠️ Dev Mode OTP: {devCode}</p>
              <p className="text-[11px] text-muted mt-0.5">An SMS will be sent in production</p>
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
              className="input text-center tracking-[0.5em] text-2xl font-bold py-4"
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
            />
          </div>
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
            ) : "Login →"}
          </button>
          <button
            onClick={() => { setStage("form"); setCode(""); setDevCode(null); setError(null); }}
            className="w-full text-xs text-muted hover:text-white transition-colors py-1"
          >
            ← Change number
          </button>
        </>
      )}

      {error && (
        <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

// ─── Main Auth Page ───────────────────────────────────────
function AuthContent() {
  const searchParams = useSearchParams();
  const initialTab   = (searchParams.get("tab") as Tab) || "login";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <main className="min-h-screen bg-navy-deep flex items-center justify-center px-4 py-10">
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #06B6D4 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 mb-5">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
            >
              🚕
            </div>
            <span className="font-display text-2xl font-bold text-white">
              Cab<span className="text-gradient">8</span>
            </span>
          </Link>

          {/* Hero icon */}
          <div
            className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, #0D1B2E, #162540)",
              boxShadow: "0 0 30px rgba(37,99,235,0.2)",
            }}
          >
            {tab === "register" ? "👤" : "👋"}
          </div>

          <h1 className="font-display text-2xl font-bold text-white">
            {tab === "register" ? "Create your account" : "Welcome back!"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {tab === "register"
              ? "Book rides, track trips, and more"
              : "Login to book and track your rides"}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-navy-deep p-1 mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === "login"
                  ? "text-white shadow-glow-blue"
                  : "text-muted hover:text-white"
              }`}
              style={tab === "login" ? { background: "linear-gradient(135deg, #2563EB, #06B6D4)" } : {}}
            >
              Login
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === "register"
                  ? "text-white shadow-glow-blue"
                  : "text-muted hover:text-white"
              }`}
              style={tab === "register" ? { background: "linear-gradient(135deg, #2563EB, #06B6D4)" } : {}}
            >
              Register
            </button>
          </div>

          {tab === "login"    && <LoginForm />}
          {tab === "register" && <RegisterForm />}
        </div>

        {/* Benefits */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: "🔒", text: "Secure OTP login" },
            { icon: "📍", text: "Real-time tracking" },
            { icon: "💳", text: "Transparent fares" },
          ].map((f) => (
            <div key={f.text} className="rounded-xl border border-navy-border bg-navy-card p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-[11px] text-muted">{f.text}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-dimmed mt-5">
          Are you a driver?{" "}
          <Link href="/driver" className="text-blue-light hover:underline">
            Driver Portal →
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
      </main>
    }>
      <AuthContent />
    </Suspense>
  );
}
