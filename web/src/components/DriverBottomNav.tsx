"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Duty",     icon: "⚡", href: "/driver/dashboard" },
  { label: "Earnings", icon: "💰", href: "/driver/earnings"  },
  { label: "Union",    icon: "🔰", href: "/driver/union"     },
  { label: "Rates",    icon: "₹",  href: "/driver/rates"     },
  { label: "Profile",  icon: "👤", href: "/driver/profile"   },
];

export default function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-navy-border bg-navy-card/95 backdrop-blur-md px-4 py-2">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 ${
                active ? "text-blue-light font-bold scale-105" : "text-muted hover:text-white"
              }`}
            >
              <div className="relative">
                <span className="text-xl">{item.icon}</span>
                {active && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-primary"
                    style={{ boxShadow: "0 0 6px #2563EB" }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-mono ${active ? "text-blue-light font-semibold" : "text-muted"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
