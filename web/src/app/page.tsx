"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SimpleAppHomePage() {
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const handlePwaInstall = async () => {
    if (pwaPrompt) {
      await pwaPrompt.prompt();
      setPwaPrompt(null);
    } else {
      alert("To install the application, open your browser menu (⋮ or Share icon) and tap 'Add to Home Screen'.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050D1A] text-white flex flex-col justify-between selection:bg-blue-600/40 font-body">
      
      {/* ── Background Ambient Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header className="relative z-10 border-b border-[#1A2E45]/80 bg-[#050D1A]/85 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
            >
              🚕
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-white tracking-tight">
                Cab<span className="text-gradient">8</span>
              </span>
              <span className="block text-[9px] font-mono text-cyan-400 uppercase tracking-wider -mt-1 font-semibold">
                Official App
              </span>
            </div>
          </Link>

          {/* Web App Link */}
          <Link
            href="/home"
            className="text-xs bg-[#0D1B2E] hover:bg-[#162540] border border-[#1A2E45] px-4 py-2 rounded-xl text-white font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🌐</span> Open Web App
          </Link>
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN APP DOWNLOAD CONTAINER
      ════════════════════════════════════════ */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-16 w-full text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono text-cyan-300 mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>OFFICIAL MOBILE APPLICATION</span>
        </div>

        {/* Heading */}
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
          Cab8 Taxi App<br />
          <span className="text-gradient">Download for Your Phone</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
          Book verified local drivers for outstation mountain journeys, local rides, and airport transfers at transparent rates starting from ₹12/km.
        </p>

        {/* Download Card */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0D1B2E] to-[#081224] p-6 sm:p-10 shadow-2xl relative overflow-hidden text-left">
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1A2E45]">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 flex-shrink-0">
              🚕
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Cab8 for Android &amp; iOS</h2>
              <p className="text-xs text-slate-400 mt-0.5">Version 2.4.0 • Verified &amp; Safe</p>
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
              <span>100% Verified Mountain &amp; City Drivers</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
              <span>Live Upfront Pricing (No Surge Charges)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
              <span>Instant OTP Login — No Password Required</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
              <span>Real-time GPS Tracking &amp; Live ETA</span>
            </li>
          </ul>

          {/* Action Buttons */}
          <div className="space-y-3.5">
            <a
              href="/downloads/cab8-customer.apk"
              download
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">📥</span>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-mono tracking-wider opacity-80">Direct Download</span>
                <span className="text-sm font-bold">Download Android APK</span>
              </div>
            </a>

            <button
              type="button"
              onClick={handlePwaInstall}
              className="w-full py-4 px-6 rounded-2xl bg-[#050D1A] hover:bg-[#162540] border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="text-2xl">⚡</span>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-mono tracking-wider opacity-80">Instant Access</span>
                <span className="text-sm font-bold">1-Click Install Mobile App</span>
              </div>
            </button>
          </div>

        </div>

      </main>

      {/* ════════════════════════════════════════
          MINIMAL FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#1A2E45]/60 bg-[#050D1A] py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Cab8 Technologies. All rights reserved.</p>
      </footer>

    </div>
  );
}
