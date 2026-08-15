"use client";

import { useState } from "react";
import { api, setToken } from "@/lib/api";

export function OtpLogin({ onVerified }: { onVerified: () => void }) {
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [stage,   setStage]   = useState<"phone" | "code">("phone");
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devOnlyCode);
      setStage("code");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code);
      setToken(res.token);
      onVerified();
    } catch (e: any) {
      setError(e.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
          📱
        </div>
        <div>
          <h3 className="font-display font-bold text-white">Verify your number</h3>
          <p className="text-xs text-muted">Required to confirm your booking</p>
        </div>
      </div>

      {stage === "phone" && (
        <div className="space-y-3">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-navy-border bg-navy-deep px-3 text-sm text-muted shrink-0">
                🇮🇳 +91
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                type="tel"
                maxLength={10}
                className="input flex-1"
              />
            </div>
          </div>
          <button
            onClick={sendOtp}
            disabled={loading || phone.length < 8}
            className="btn-gradient w-full py-3 disabled:opacity-50"
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
        <div className="space-y-3">
          {devCode && (
            <div className="rounded-xl border border-amber/20 bg-amber/5 px-3 py-2.5">
              <p className="font-mono text-xs text-amber">
                ⚠️ Dev mode — Your OTP: <strong>{devCode}</strong>
              </p>
              <p className="text-[11px] text-muted mt-0.5">An SMS will be sent in production</p>
            </div>
          )}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              6-Digit OTP
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="● ● ● ● ● ●"
              maxLength={6}
              className="input text-center tracking-[0.5em] text-xl font-bold"
            />
          </div>
          <button
            onClick={verify}
            disabled={loading || code.length !== 6}
            className="btn-gradient w-full py-3 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying…
              </span>
            ) : "Verify & Continue ✓"}
          </button>
          <button
            onClick={() => { setStage("phone"); setDevCode(null); }}
            className="w-full text-xs text-muted hover:text-white transition-colors py-1"
          >
            ← Change number
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red/10 border border-red/20 px-3 py-2 text-sm text-red">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
