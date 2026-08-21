"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Same header as homepage ─────────────────────────────────── */}
      <header className="relative z-20 border-b border-[#1A2E45]/80 bg-[#050D1A]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
            >
              🚕
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-white tracking-tight">
                Cab<span className="text-gradient">8</span>
              </span>
              <span className="block text-[9px] font-mono text-cyan-400 uppercase tracking-wider -mt-1 font-semibold">
                Legal &amp; Policy
              </span>
            </div>
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-mono text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">⚖️ LEGAL DOCS</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      {children}

      {/* ── Modern footer ─────────────────────────────────── */}
      <Footer />

      <style>{`@media print { header, footer { display:none !important; } }`}</style>
    </>
  );
}
