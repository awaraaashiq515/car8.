"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏛️", href: "/union/dashboard" },
  { label: "Approve",   icon: "✅", href: "/union/approve"   },
  { label: "Members",   icon: "👥", href: "/union/members"   },
  { label: "Analytics", icon: "📊", href: "/union/analytics" },
  { label: "Settings",  icon: "⚙️", href: "/union/profile"   },
];

export default function UnionBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(10, 16, 28, 0.97)",
        borderTop: "1px solid rgba(245,158,11,0.18)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "8px 16px 10px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "6px 10px",
                borderRadius: 14,
                textDecoration: "none",
                transition: "all 0.2s",
                background: active ? "rgba(245,158,11,0.12)" : "transparent",
                border: active ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                transform: active ? "scale(1.05)" : "scale(1)",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
              {active && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#F59E0B",
                    boxShadow: "0 0 6px #F59E0B",
                    marginBottom: -2,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: active ? "#F59E0B" : "#4B5563",
                  letterSpacing: "0.03em",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
