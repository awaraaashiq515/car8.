"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Duty",     icon: "⚡", href: "/driver/dashboard" },
  { label: "Chat",     icon: "💬", href: "/driver/messages"  },
  { label: "Earnings", icon: "💰", href: "/driver/earnings"  },
  { label: "Rates",    icon: "₹",  href: "/driver/rates"     },
  { label: "Profile",  icon: "👤", href: "/driver/profile"   },
];

export default function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-navy-border bg-navy-card/95 backdrop-blur-md px-2 py-2">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 ${
                active ? "text-cyan-400 font-bold bg-cyan-500/10 scale-105" : "text-muted hover:text-white"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="text-xl leading-none">{item.icon}</span>
                {active && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-cyan-400"
                    style={{ boxShadow: "0 0 6px #06B6D4" }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-mono leading-tight tracking-tight mt-1 truncate ${active ? "text-cyan-300 font-bold" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
