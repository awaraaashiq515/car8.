"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<"customer" | "driver">("customer");
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/android/.test(ua)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }

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
      const choice = await pwaPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPwaPrompt(null);
    } else {
      alert("Please open this link in Google Chrome on your phone, then tap 'Install App' or 'Add to Home Screen' from the menu.");
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep text-white font-body selection:bg-cyan-500 selection:text-black">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between pb-8 border-b border-navy-border/60">
          <Link href="/home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
              🚕
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight text-white">
                Cab<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">8</span>
              </span>
              <span className="block text-[10px] text-gray-400 uppercase tracking-widest -mt-1 font-semibold">Official Apps</span>
            </div>
          </Link>

          <Link
            href="/home"
            className="text-xs bg-navy-card/80 hover:bg-navy-card border border-navy-border px-3.5 py-2 rounded-xl text-gray-300 hover:text-white transition flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>Open Web Version</span>
          </Link>
        </header>

        {/* Hero title */}
        <div className="text-center my-8 md:my-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <span>✨</span> Get the Official Cab8 Mobile App
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white leading-tight">
            Fast, Verified Taxis <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Right On Your Phone
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto mt-3">
            Choose your app below — Instant taxi booking for passengers or earning dashboard for driver partners.
          </p>
        </div>

        {/* Tab Switcher: Customer App vs Driver App */}
        <div className="flex justify-center mb-8">
          <div className="bg-navy-card/80 p-1.5 rounded-2xl border border-navy-border/80 flex max-w-md w-full gap-2">
            <button
              onClick={() => setActiveTab("customer")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "customer"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>🚗</span>
              <span>Passenger App</span>
            </button>
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "driver"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>🚕</span>
              <span>Driver Partner App</span>
            </button>
          </div>
        </div>

        {/* PASSENGER APP SECTION */}
        {activeTab === "customer" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Android Card */}
              <div className="bg-gradient-to-b from-[#111E38] to-navy-card border border-cyan-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-2xl shadow-lg">
                      🤖
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                      Android (APK / PWA)
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-display text-white">Cab8 for Android</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-5">
                    Fastest booking, OTP login, live driver tracking & Himachal preset rates.
                  </p>

                  <ul className="space-y-2 text-xs text-gray-300 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Instant 1-click install (No PlayStore account needed)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Works fast even on 3G/4G mountain networks
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Auto-updates to latest version automatically
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4 border-t border-navy-border/60">
                  <button
                    onClick={handlePwaInstall}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>1-Click Install App (Android)</span>
                  </button>

                  <a
                    href="/downloads/cab8-customer.apk"
                    download
                    className="w-full py-3 px-4 rounded-xl bg-navy-deep hover:bg-[#081224] border border-cyan-500/40 text-cyan-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    <span>Direct Download .APK File</span>
                  </a>
                </div>
              </div>

              {/* Apple (iOS) Card */}
              <div className="bg-gradient-to-b from-[#111E38] to-navy-card border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-700 to-slate-500 flex items-center justify-center text-2xl shadow-lg">
                      🍎
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                      Apple iPhone (iOS)
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-display text-white">Cab8 for iPhone & iPad</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-5">
                    Smooth iOS native experience with standalone full-screen support.
                  </p>

                  <div className="bg-navy-deep/80 rounded-2xl p-4 border border-navy-border text-xs space-y-3 mb-6">
                    <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>📲</span> How to Install on iPhone:
                    </p>
                    <ol className="space-y-2 text-gray-300 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
                      <li>Open <strong className="text-white">cab8.in</strong> in Safari browser.</li>
                      <li>Tap the <strong className="text-cyan-300">Share Icon (⎋ / ⬆️)</strong> at the bottom.</li>
                      <li>Scroll down & tap <strong className="text-white">"Add to Home Screen" (+)</strong>.</li>
                      <li>Tap <strong className="text-cyan-300">"Add"</strong> in top right. Done! 🎉</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-navy-border/60">
                  <Link
                    href="/home"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>🍎</span>
                    <span>Launch iPhone Web App</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DRIVER PARTNER APP SECTION */}
        {activeTab === "driver" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-b from-[#1C160C] to-navy-card border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/30">
                    🚕
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display text-white">Cab8 Driver Partner App</h2>
                    <p className="text-xs text-amber-300/80 font-medium">Earn directly with 0% middleman commission</p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                  For Commercial Taxi Drivers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-navy-deep/80 p-4 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-400 font-bold text-sm">💰 Direct UPI Payouts</p>
                  <p className="text-[11px] text-gray-400 mt-1">Get customer fares directly into your bank account.</p>
                </div>
                <div className="bg-navy-deep/80 p-4 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-400 font-bold text-sm">🏔️ Set Your Own Rates</p>
                  <p className="text-[11px] text-gray-400 mt-1">Configure your ₹/km per vehicle type and hill routes.</p>
                </div>
                <div className="bg-navy-deep/80 p-4 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-400 font-bold text-sm">🤝 Union Integration</p>
                  <p className="text-[11px] text-gray-400 mt-1">Verified stand queue and union approvals built-in.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-navy-border/60">
                <a
                  href="/downloads/cab8-driver.apk"
                  download
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-500/30 transition flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>Download Driver APK (Android)</span>
                </a>

                <Link
                  href="/driver/login"
                  className="flex-1 py-3.5 px-6 rounded-xl bg-navy-deep hover:bg-[#081224] border border-amber-500/40 text-amber-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Driver Portal (Web Login)</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* QR CODE & DESKTOP SCANNER SECTION */}
        <div className="mt-12 bg-navy-card/60 border border-navy-border rounded-3xl p-6 text-center max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">Scan from your Phone</p>
          <h3 className="text-lg font-bold text-white font-display">Instant Mobile QR</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Point your mobile camera at this code to open Cab8 instantly on your phone
          </p>

          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl shadow-cyan-500/10">
            {/* SVG Visual QR Mock */}
            <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="white" />
              {/* Corner squares */}
              <rect x="10" y="10" width="25" height="25" fill="#0A1628" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="18" y="18" width="9" height="9" fill="#0A1628" />

              <rect x="65" y="10" width="25" height="25" fill="#0A1628" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="73" y="18" width="9" height="9" fill="#0A1628" />

              <rect x="10" y="65" width="25" height="25" fill="#0A1628" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="18" y="73" width="9" height="9" fill="#0A1628" />

              {/* Data modules */}
              <rect x="42" y="12" width="6" height="6" fill="#0A1628" />
              <rect x="52" y="12" width="6" height="6" fill="#0A1628" />
              <rect x="42" y="24" width="6" height="6" fill="#0A1628" />
              <rect x="52" y="30" width="6" height="6" fill="#0A1628" />

              <rect x="12" y="45" width="6" height="6" fill="#0A1628" />
              <rect x="24" y="45" width="6" height="6" fill="#0A1628" />
              <rect x="36" y="45" width="6" height="6" fill="#0A1628" />
              <rect x="48" y="45" width="6" height="6" fill="#2563EB" />
              <rect x="60" y="45" width="6" height="6" fill="#0A1628" />
              <rect x="72" y="45" width="6" height="6" fill="#0A1628" />
              <rect x="84" y="45" width="6" height="6" fill="#0A1628" />

              <rect x="42" y="60" width="6" height="6" fill="#0A1628" />
              <rect x="52" y="60" width="6" height="6" fill="#0A1628" />
              <rect x="65" y="65" width="10" height="10" fill="#0A1628" />
              <rect x="80" y="65" width="10" height="10" fill="#0A1628" />
              <rect x="65" y="80" width="25" height="10" fill="#0A1628" />
            </svg>
          </div>

          <p className="text-[11px] text-gray-400 mt-3">URL: <span className="text-cyan-400 font-mono">https://cab8.in</span></p>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-gray-500 pb-8 border-t border-navy-border/40 pt-6">
          <p>© 2026 Cab8 Technologies. All rights reserved.</p>
          <p className="mt-1">Verified hill transport network — Himachal Pradesh & Beyond.</p>
        </footer>
      </div>
    </div>
  );
}
