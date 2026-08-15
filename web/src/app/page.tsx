"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("cab8_token");
    const role  = window.localStorage.getItem("cab8_role");

    if (!token) {
      router.replace("/login");
      return;
    }

    // Route based on role
    if (role === "DRIVER") {
      router.replace("/driver/dashboard");
    } else {
      // CUSTOMER or unknown → customer portal
      router.replace("/home");
    }
  }, [router]);

  // Splash while redirecting
  return (
    <main className="min-h-screen bg-navy-deep flex flex-col items-center justify-center gap-6">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", boxShadow: "0 0 40px rgba(37,99,235,0.4)" }}
      >
        🚕
      </div>
      <span className="font-display text-2xl font-bold text-white">
        Cab<span style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          background: "linear-gradient(90deg, #2563EB, #06B6D4)" }}>8</span>
      </span>
      <div className="h-1 w-32 rounded-full overflow-hidden bg-navy-border">
        <div className="h-full rounded-full animate-pulse"
          style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)", width: "60%" }} />
      </div>
    </main>
  );
}
