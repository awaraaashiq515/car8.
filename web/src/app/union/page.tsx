"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UnionRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/union/dashboard");
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(245,158,11,0.2)", borderTopColor: "#F59E0B",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
