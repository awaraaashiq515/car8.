"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "🏠", label: "Home",     href: "/home"     },
  { icon: "📋", label: "Board",    href: "/board"    },
  { icon: "🚕", label: "My Rides", href: "/my-rides" },
  { icon: "👤", label: "Profile",  href: "/profile"  },
];

const STYLES = `
  .cust-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: rgba(13,27,46,0.97);
    border-top: 1px solid #1A2E45;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .cust-nav-inner {
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    max-width: 520px;
    margin: 0 auto;
    padding: 0 4px;
    height: 56px;
  }
  .cust-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 1;
    padding: 6px 4px;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    min-width: 0;
  }
  .cust-nav-icon {
    font-size: 20px;
    line-height: 1;
    transition: transform 0.2s ease;
  }
  .cust-nav-item.cnav-active .cust-nav-icon {
    transform: scale(1.12);
  }
  .cust-nav-label {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .cust-nav-dot {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #2563EB, #06B6D4);
    box-shadow: 0 0 8px rgba(37,99,235,0.7);
  }
  .cust-nav-spacer {
    height: calc(56px + env(safe-area-inset-bottom, 0px));
  }
`;

export default function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <>
      <style>{STYLES}</style>
      <div className="cust-nav-spacer" />
      <nav className="cust-nav" role="navigation" aria-label="Main navigation">
        <div className="cust-nav-inner">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/home" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cust-nav-item ${active ? "cnav-active" : ""}`}
                style={{ color: active ? "#60A5FA" : "#6B7280" }}
              >
                <div style={{ position: "relative" }}>
                  <span className="cust-nav-icon">{item.icon}</span>
                  {active && <span className="cust-nav-dot" />}
                </div>
                <span
                  className="cust-nav-label"
                  style={{ color: active ? "#60A5FA" : "#6B7280", fontWeight: active ? 700 : 400 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
