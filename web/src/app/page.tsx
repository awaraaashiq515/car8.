"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RootPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"customer" | "driver">("customer");
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [isInsideApp, setIsInsideApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Detect if running inside Native Mobile App / APK / Capacitor / PWA Standalone / WebView
      const isCapacitor = (
        (window as any).Capacitor?.isNativePlatform?.() === true ||
        ((window as any).Capacitor?.getPlatform?.() !== "web" && (window as any).Capacitor?.getPlatform?.() !== undefined)
      );
      const isStandalone = (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      );
      const isAppUserAgent = /Capacitor|MobileApp|wv/i.test(navigator.userAgent);
      const hasAppQuery = (
        new URLSearchParams(window.location.search).get("app") === "true" ||
        new URLSearchParams(window.location.search).get("source") === "app"
      );

      const isApp = isCapacitor || isStandalone || isAppUserAgent || hasAppQuery;

      if (isApp) {
        setIsInsideApp(true);
        const token = window.localStorage.getItem("cab8_token");
        const role  = window.localStorage.getItem("cab8_role");

        if (!token) {
          router.replace("/login");
        } else if (role === "DRIVER") {
          router.replace("/driver/dashboard");
        } else {
          router.replace("/home");
        }
        return;
      }

      // 2. Browser visitor: detect OS type for download badge
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
    }
  }, [router]);

  const handlePwaInstall = async () => {
    if (pwaPrompt) {
      await pwaPrompt.prompt();
      const choice = await pwaPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPwaPrompt(null);
    } else {
      alert("Please open this page in Google Chrome on your phone, then tap 'Install App' or 'Add to Home Screen' from the menu.");
    }
  };

  // If inside the mobile app, show sleek splash screen while redirecting to Login
  if (isInsideApp) {
    return (
      <main className="min-h-screen bg-[#050D1A] flex flex-col items-center justify-center gap-6">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-600/30 animate-pulse"
          style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
        >
          🚕
        </div>
        <span className="font-display text-2xl font-bold text-white tracking-tight">
          Cab<span className="text-gradient">8</span>
        </span>
        <div className="h-1 w-32 rounded-full overflow-hidden bg-[#1A2E45]">
          <div
            className="h-full rounded-full animate-pulse"
            style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)", width: "70%" }}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#050D1A] text-white flex flex-col justify-between selection:bg-blue-600/40 font-body">
      {/* ── Ambient Background Glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* ════════════════════════════════════════
          CLEAN HEADER (NO LOGIN BUTTONS)
      ════════════════════════════════════════ */}
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
                Official App Download
              </span>
            </div>
          </Link>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-mono text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">v2.4 APK LIVE</span>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN CONTENT (APP DOWNLOAD SHOWCASE)
      ════════════════════════════════════════ */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 w-full">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono text-cyan-300 mb-4 shadow-sm">
            <span>📲</span>
            <span>GET THE OFFICIAL CAB8 MOBILE APPS</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4">
            Download Cab8 App for <br className="hidden sm:inline" />
            <span className="text-gradient">Fast &amp; Easy Mountain Booking</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Choose your app below — Instant taxi booking for passengers or earning dashboard for driver partners.
          </p>
        </div>

        {/* Tab Switcher: Passenger App vs Driver Partner App */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#0D1B2E] p-1.5 rounded-2xl border border-[#1A2E45] flex max-w-md w-full gap-2 shadow-xl">
            <button
              onClick={() => setActiveTab("customer")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "customer"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🚗</span>
              <span>Passenger App</span>
            </button>
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === "driver"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🚕</span>
              <span>Driver Partner App</span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════
            PASSENGER APP DOWNLOAD
        ════════════════════════════════════════ */}
        {activeTab === "customer" && (
          <div className="space-y-6">
            {/* Android Card — full width, no iOS */}
            <div className="bg-gradient-to-b from-[#0D1B2E] to-[#081224] border border-cyan-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-start gap-8">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25">
                        🤖
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        Android APK — 4.1 MB
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">Cab8 for Android</h3>
                    <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed max-w-xl">
                      Fastest booking, OTP login, live GPS driver tracking, and Himachal transparent per-km fares.
                    </p>

                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                        <span>Direct 1-Click APK Download (Safe &amp; Verified)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                        <span>Super fast performance on 3G/4G mountain network</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                        <span>Instant OTP login with zero passwords needed</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                        <span>Works on all Android 7+ devices (No Play Store needed)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Right: Download Buttons */}
                  <div className="flex flex-col gap-3 w-full sm:w-64 sm:shrink-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-[#1A2E45]">
                    <a
                      href="/downloads/cab8-customer.apk"
                      download
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-500/30 transition flex items-center justify-center gap-3"
                    >
                      <span>📥</span>
                      <span>Download APK (Android)</span>
                    </a>

                    <button
                      onClick={handlePwaInstall}
                      className="w-full py-3 px-4 rounded-xl bg-[#050D1A] hover:bg-[#162540] border border-cyan-500/30 text-cyan-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                      <span>⚡</span>
                      <span>1-Click Web App Install</span>
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            DRIVER PARTNER APP DOWNLOAD
        ════════════════════════════════════════ */}
        {activeTab === "driver" && (
          <div className="bg-gradient-to-b from-[#1C160C] to-[#0D1B2E] border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/30">
                  🚕
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Cab8 Driver Partner App</h2>
                  <p className="text-xs sm:text-sm text-amber-300/90 font-medium mt-0.5">Commercial Taxi Drivers &amp; Hill Operators</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                0% Middleman Commission
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#050D1A] p-5 rounded-2xl border border-amber-500/20">
                <p className="text-amber-400 font-bold text-sm mb-1">💰 Direct Customer UPI</p>
                <p className="text-xs text-slate-300 leading-relaxed">Receive fare payments directly in your UPI ID / bank account without cut.</p>
              </div>
              <div className="bg-[#050D1A] p-5 rounded-2xl border border-amber-500/20">
                <p className="text-amber-400 font-bold text-sm mb-1">🏔️ Custom ₹/km Rates</p>
                <p className="text-xs text-slate-300 leading-relaxed">Set your own per-km rates for Hatchback, Sedan, SUV or Hill routes.</p>
              </div>
              <div className="bg-[#050D1A] p-5 rounded-2xl border border-amber-500/20">
                <p className="text-amber-400 font-bold text-sm mb-1">🤝 Taxi Union Verified</p>
                <p className="text-xs text-slate-300 leading-relaxed">Stand queue management and verified union affiliation badge.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#1A2E45]">
              <a
                href="/downloads/cab8-driver.apk"
                download
                className="w-full sm:w-auto inline-flex py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-xl shadow-orange-500/30 transition items-center justify-center gap-3 text-center"
              >
                <span>📥</span>
                <span>Download Driver APK (Android)</span>
              </a>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            APP FEATURES SHOWCASE
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-12 mb-12">
          {[
            {
              icon: "💰",
              title: "Fixed Rates From ₹12/km",
              desc: "Transparent per-km rate. Zero peak surge charges.",
            },
            {
              icon: "🏔️",
              title: "Verified Hill Drivers",
              desc: "Expert mountain drivers tested for high-altitude safety.",
            },
            {
              icon: "⚡",
              title: "Instant 30s Booking",
              desc: "Quick pickup with live GPS tracking & driver ETA.",
            },
            {
              icon: "📱",
              title: "Offline Friendly",
              desc: "Works reliably even in low mountain network zones.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#1A2E45] bg-[#0D1B2E]/70 p-5 backdrop-blur-sm"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="font-display text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════
            QR SCANNER
        ════════════════════════════════════════ */}
        <div className="bg-[#0D1B2E]/60 border border-[#1A2E45] rounded-3xl p-6 sm:p-8 text-center max-w-lg mx-auto">
          <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Direct Phone Install</p>
          <h3 className="text-lg font-bold text-white font-display">Scan QR to Open on Phone</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Scan with your mobile camera to open &amp; install Cab8 directly on your smartphone.
          </p>

          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl shadow-cyan-500/10">
            <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="white" />
              <rect x="10" y="10" width="25" height="25" fill="#050D1A" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="18" y="18" width="9" height="9" fill="#050D1A" />

              <rect x="65" y="10" width="25" height="25" fill="#050D1A" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="73" y="18" width="9" height="9" fill="#050D1A" />

              <rect x="10" y="65" width="25" height="25" fill="#050D1A" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="18" y="73" width="9" height="9" fill="#050D1A" />

              <rect x="42" y="12" width="6" height="6" fill="#050D1A" />
              <rect x="52" y="12" width="6" height="6" fill="#050D1A" />
              <rect x="42" y="24" width="6" height="6" fill="#050D1A" />
              <rect x="52" y="30" width="6" height="6" fill="#050D1A" />

              <rect x="12" y="45" width="6" height="6" fill="#050D1A" />
              <rect x="24" y="45" width="6" height="6" fill="#050D1A" />
              <rect x="36" y="45" width="6" height="6" fill="#050D1A" />
              <rect x="48" y="45" width="6" height="6" fill="#2563EB" />
              <rect x="60" y="45" width="6" height="6" fill="#050D1A" />
              <rect x="72" y="45" width="6" height="6" fill="#050D1A" />
              <rect x="84" y="45" width="6" height="6" fill="#050D1A" />

              <rect x="42" y="60" width="6" height="6" fill="#050D1A" />
              <rect x="52" y="60" width="6" height="6" fill="#050D1A" />
              <rect x="65" y="65" width="10" height="10" fill="#050D1A" />
              <rect x="80" y="65" width="10" height="10" fill="#050D1A" />
              <rect x="65" y="80" width="25" height="10" fill="#050D1A" />
            </svg>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          CLEAN FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#1A2E45]/80 bg-[#050D1A] py-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">🚕</span>
            <span className="font-display font-bold text-white text-sm">Cab8 Technologies</span>
          </div>
          <p>© {new Date().getFullYear()} Cab8. Verified Taxi Transport Network.</p>
        </div>
      </footer>
    </div>
  );
}
