"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDriverToken } from "@/lib/api";

const FEATURES = [
  { icon: "📱", title: "Real-time Ride Requests", desc: "Get notified instantly when a customer books" },
  { icon: "💰", title: "Transparent Earnings",    desc: "See fare upfront before accepting a ride" },
  { icon: "🗺️", title: "Smart Routing",          desc: "Rides matched to your city and vehicle type" },
  { icon: "⭐", title: "Build Your Rating",       desc: "Grow your reputation with every completed trip" },
];

export default function DriverLandingPage() {
  const router = useRouter();

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const token = getDriverToken();
    if (token) router.push("/driver/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen bg-navy-deep relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #06B6D4 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-6 py-10 flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/login" className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
            >
              🚕
            </div>
            <span className="font-display text-xl font-bold text-white">
              Cab<span className="text-gradient">8</span>
            </span>
          </Link>
          <Link href="/login" className="btn-ghost text-xs">Customer App →</Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-primary/30 bg-blue-primary/10 px-4 py-1.5 mb-6">
            <span className="font-mono text-xs text-blue-light uppercase tracking-wider">Driver Portal</span>
          </div>

          {/* Big driver icon */}
          <div
            className="h-24 w-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, #0D1B2E, #162540)",
              boxShadow: "0 0 40px rgba(37,99,235,0.25)",
            }}
          >
            👨‍✈️
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
            Drive with{" "}
            <span className="text-gradient">Cab8</span>
          </h1>
          <p className="text-muted text-base leading-relaxed max-w-sm mx-auto">
            Join our network of verified drivers across Himachal Pradesh and Delhi. Earn more, drive smarter.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-display font-semibold text-white text-sm mb-1">{f.title}</div>
              <div className="text-[11px] text-muted leading-snug">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 mt-auto">
          <Link href="/driver/register" className="btn-gradient w-full py-4 text-base flex items-center justify-center gap-2">
            🚀 Register Driver Account
          </Link>
          <Link href="/driver/login" className="btn-ghost w-full py-4 text-base flex items-center justify-center gap-2">
            Already have an account? Login →
          </Link>
        </div>

        {/* ── PROMINENT TAXI UNION BANNER ── */}
        <div className="mt-6">
          <Link
            href="/union/apply"
            className="w-full flex items-center gap-4 text-left transition-all duration-200 group block"
            style={{
              background: "linear-gradient(135deg, rgba(217,119,6,0.18), rgba(245,158,11,0.08))",
              border: "1.5px solid rgba(245,158,11,0.45)",
              borderRadius: 20,
              padding: "16px 20px",
              boxShadow: "0 0 28px rgba(245,158,11,0.15)",
            }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform"
              style={{
                background: "linear-gradient(135deg, #D97706, #F59E0B)",
                boxShadow: "0 0 20px rgba(245,158,11,0.4)",
              }}
            >
              🔰
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-display font-extrabold text-white text-base">
                  Apply for Taxi Union Only
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber/20 border border-amber/40 text-amber">
                  DIRECT
                </span>
              </div>
              <p className="text-xs text-muted leading-tight">
                Submit membership form directly to Himachal Pradesh Taxi Union admin
              </p>
            </div>
            <span className="text-amber text-xl font-bold group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          <div className="flex justify-between items-center px-2 mt-2">
            <span className="text-[11px] text-muted">Union Admin?</span>
            <Link href="/union/login" className="text-[11px] text-amber font-mono font-semibold hover:underline">
              Union Admin Login →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-dimmed mt-6">
          By registering, you agree to Cab8's driver terms of service.
        </p>


      </div>
    </main>
  );
}

