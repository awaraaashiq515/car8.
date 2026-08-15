"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Cab8 SW registered:", reg.scope))
        .catch((err) => console.log("Cab8 SW registration failed:", err));
    }

    // 2. Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // 3. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleDevice);

    // 4. Capture install prompt on Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Android / Chrome Quick Install Floating Banner */}
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-r from-navy-card to-[#1E293B] border border-cyan-500/30 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 animate-bounce-short">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xl shadow-lg">
              🚕
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Install Cab8 App</p>
              <p className="text-xs text-gray-400">Faster booking on home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md transition"
            >
              Install ⚡
            </button>
          </div>
        </div>
      )}

      {/* Floating Download Hub Button if not in standalone */}
      <Link
        href="/download"
        className="fixed top-3 right-3 z-40 bg-navy-card/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg hover:border-cyan-400 transition"
      >
        <span>📲</span>
        <span>Download App</span>
      </Link>
    </>
  );
}
