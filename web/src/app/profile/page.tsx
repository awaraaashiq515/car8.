"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearToken, getUserName, Ride } from "@/lib/api";

const NAV = [
  { icon: "🏠", label: "Home",     href: "/home",     active: false },
  { icon: "🚕", label: "My Rides", href: "/my-rides", active: false },
  { icon: "👤", label: "Profile",  href: "/profile",  active: true  },
];

const MENU_ITEMS = [
  { icon: "🚕", label: "My Rides",   href: "/my-rides",  desc: "View all your trips" },
  { icon: "🔔", label: "Notifications", href: "#",       desc: "Alerts & updates" },
  { icon: "❓", label: "Help & Support", href: "#",      desc: "FAQs and contact" },
  { icon: "⭐", label: "Rate the App",   href: "#",      desc: "Share your feedback" },
];

export default function ProfilePage() {
  const router  = useRouter();
  const [rides,   setRides]   = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState<string | null>(null);
  const [phone,   setPhone]   = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("cab8_token");
    if (!token) { router.push("/login"); return; }
    setName(getUserName());
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setPhone(payload.phone || null);
    } catch { /* ignore */ }
    api.getMyRides().then(setRides).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    window.localStorage.removeItem("cab8_role");
    window.localStorage.removeItem("cab8_user_name");
    router.replace("/login");
  }

  const completed  = rides.filter(r => r.status === "COMPLETED");
  const totalSpend = completed.reduce((s, r) => s + (r.final_fare ?? r.estimated_fare), 0);
  const initials   = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
      </div>

      {/* ── Profile Hero ── */}
      <div className="relative z-10 px-5 pt-10 pb-6 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div
            className="h-24 w-24 rounded-3xl flex items-center justify-center text-3xl font-display font-bold text-white mx-auto"
            style={{
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              boxShadow: "0 0 40px rgba(37,99,235,0.4)",
            }}
          >
            {initials}
          </div>
          {/* Verified badge */}
          <div
            className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full border-2 border-navy-deep flex items-center justify-center text-xs"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            ✓
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-white">{name || "Customer"}</h1>
        {phone && <p className="text-muted text-sm mt-1">📱 +91 {phone}</p>}

        <div className="inline-flex items-center gap-2 mt-3 rounded-full border border-green/30 bg-green/10 px-4 py-1.5">
          <span className="dot-online" />
          <span className="text-xs text-green font-mono">Verified Customer</span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="relative z-10 mx-5 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🚕", val: rides.length,     label: "Total Rides",  color: "#2563EB" },
            { icon: "✅", val: completed.length, label: "Completed",    color: "#10B981" },
            { icon: "💰", val: `₹${totalSpend}`, label: "Total Spent",  color: "#06B6D4" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-navy-border bg-navy-card p-3.5 text-center"
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-white text-lg">
                {loading ? "—" : s.val}
              </div>
              <div className="text-[11px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Book CTA ── */}
      <div className="relative z-10 mx-5 mb-5">
        <Link
          href="/home"
          className="flex items-center gap-4 rounded-2xl p-4 transition-all"
          style={{
            background: "linear-gradient(135deg, #2563EB22, #06B6D422)",
            border: "1px solid rgba(37,99,235,0.4)",
          }}
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
          >
            🔍
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-white">Book a Ride</div>
            <div className="text-xs text-muted">Find available drivers now</div>
          </div>
          <span className="text-blue-light text-lg">→</span>
        </Link>
      </div>

      {/* ── Menu Items ── */}
      <div className="relative z-10 mx-5 mb-5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">Account</h2>
        <div className="rounded-2xl border border-navy-border bg-navy-card overflow-hidden">
          {MENU_ITEMS.map((item, idx) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-navy-hover transition-colors ${
                idx > 0 ? "border-t border-navy-border" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0D1B2E, #162540)" }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-muted">{item.desc}</div>
              </div>
              <span className="text-muted text-sm">›</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="relative z-10 mx-5 mb-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-red/20 bg-red/5 hover:bg-red/10 px-4 py-4 flex items-center gap-4 transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-red/15 flex items-center justify-center text-xl flex-shrink-0">
            🚪
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-red">Logout</div>
            <div className="text-xs text-muted">Sign out of your account</div>
          </div>
          <span className="text-red/60 text-sm">›</span>
        </button>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-dimmed mb-4 relative z-10">
        Cab8 v1.0 · © 2025
      </p>

      {/* ── Bottom Nav ── */}
      <nav className="sticky bottom-0 z-30 border-t border-navy-border bg-navy-deep/95 backdrop-blur-sm">
        <div className="flex items-center justify-around px-4 py-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-all ${
                item.active ? "text-blue-light" : "text-muted hover:text-white"
              }`}
            >
              <span className={`text-xl ${item.active ? "drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
              {item.active && (
                <span className="h-0.5 w-4 rounded-full"
                  style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)" }} />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
