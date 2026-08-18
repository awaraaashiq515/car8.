"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setDriverToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DriverLoginPage() {
  const router = useRouter();
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [stage,   setStage]   = useState<"phone" | "code">("phone");
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/driver/auth/login/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
      setDevCode(data.devOnlyCode);
      setStage("code");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function verify() {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/driver/auth/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP.");
      setDriverToken(data.token);
      window.localStorage.setItem("cab8_token", data.token);
      window.localStorage.setItem("cab8_role", "DRIVER");
      if (data.user?.name) window.localStorage.setItem("cab8_user_name", data.user.name);
      router.push("/driver/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-navy-deep flex items-center justify-center px-4">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/driver" className="inline-flex items-center gap-2 mb-5">
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
          <h1 className="font-display text-2xl font-bold text-white">Welcome back!</h1>
          <p className="text-muted text-sm mt-1">Login to your driver account</p>
        </div>

        <div className="card">
          {stage === "phone" && (
            <div className="space-y-4 animate-fade-up">
              <h2 className="font-display font-semibold text-white mb-4">Enter your phone number</h2>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Registered Mobile Number
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
                    onKeyDown={(e) => e.key === "Enter" && phone.length >= 10 && sendOtp()}
                    className="input flex-1"
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
            </div>
          )}

          {stage === "code" && (
            <div className="space-y-4 animate-fade-up">
              <h2 className="font-display font-semibold text-white mb-1">Enter OTP</h2>
              <p className="text-sm text-muted mb-4">
                Sent to <span className="text-white font-medium">+91 {phone}</span>
              </p>
              {devCode && (
                <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                  <p className="font-mono text-xs text-amber font-bold">⚠️ Dev Mode OTP: {devCode}</p>
                  <p className="text-[11px] text-muted mt-1">An SMS will be sent in production</p>
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
                  onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
                  className="input text-center tracking-[0.5em] text-2xl font-bold py-4"
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
                ) : "Login to Dashboard ✓"}
              </button>
              <button
                onClick={() => { setStage("phone"); setDevCode(null); setCode(""); setError(null); }}
                className="w-full text-xs text-muted hover:text-white transition-colors py-1"
              >
                ← Change number
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
              ⚠️ {error}
            </div>
          )}
        </div>



        <p className="text-center text-sm text-muted mt-5">
          New driver?{" "}
          <Link href="/driver/register" className="text-blue-light hover:underline font-medium">
            Register here →
          </Link>
        </p>
      </div>
    </main>
  );
}
