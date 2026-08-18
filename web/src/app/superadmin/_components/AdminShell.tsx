"use client";
// ─── AdminShell: Auth gate + Sidebar for all superadmin pages ─────────────────
import { useEffect, useState, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const API            = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const ADMIN_PASSWORD = "cab8@admin";
const SESSION_KEY    = "cab8_superadmin_auth";

// ── Auth Context ──────────────────────────────────────────────────────────────
interface AuthCtx { authed: boolean; logout: () => void; appName: string; logoData: string; pendingUnion: number; }
const Ctx = createContext<AuthCtx>({ authed: false, logout: () => {}, appName: "Cab8", logoData: "", pendingUnion: 0 });
export function useAdminAuth() { return useContext(Ctx); }

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { href: "/superadmin",          icon: "📊", label: "Dashboard" },
  { href: "/superadmin/users",    icon: "👥", label: "Users" },
  { href: "/superadmin/drivers",  icon: "🚗", label: "Drivers" },
  { href: "/superadmin/rides",    icon: "🎟️", label: "Rides" },
  { href: "/superadmin/board",    icon: "📋", label: "Ride Board" },
  { href: "/superadmin/union",    icon: "📝", label: "Union Apps", badge: true },
  { href: "/superadmin/settings", icon: "⚙️", label: "App Settings" },
];

// ── Main Shell ────────────────────────────────────────────────────────────────
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [mounted,      setMounted]      = useState(false);
  const [authed,       setAuthed]       = useState(false);
  const [password,     setPassword]     = useState("");
  const [pwError,      setPwError]      = useState("");
  const [pendingUnion, setPendingUnion] = useState(0);
  const [logoData,     setLogoData]     = useState("");
  const [appName,      setAppName]      = useState("Cab8");

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setAuthed(true);
    }
  }, []);

  // Fetch pending union count + branding once authed
  useEffect(() => {
    if (!authed) return;
    fetch(`${API}/admin/stats`).then(r => r.json()).then(d => {
      setPendingUnion(d.pendingUnion || 0);
    }).catch(() => {});
    fetch(`${API}/settings/all`).then(r => r.json()).then(d => {
      if (d.settings) {
        setAppName(d.settings.app_name || "Cab8");
        setLogoData(d.settings.logo_data || "");
        // Apply favicon if set
        if (d.settings.favicon_data) {
          const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
          if (link) link.href = d.settings.favicon_data;
        }
      }
    }).catch(() => {});
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthed(true); setPwError("");
    } else {
      setPwError("Galat password hai. Try again.");
      setPassword("");
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    router.push("/superadmin");
  }

  // Avoid SSR mismatch on sessionStorage
  if (!mounted) return (
    <div style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid #1A2E45", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#050D1A 0%,#0A1628 50%,#050D1A 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", padding: "20px" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 30% 20%,rgba(37,99,235,0.12) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(6,182,212,0.08) 0%,transparent 60%)" }} />
        <div style={{ width: "100%", maxWidth: "420px", background: "rgba(13,27,46,0.98)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "24px", padding: "40px 36px", boxShadow: "0 40px 80px rgba(0,0,0,0.7)", position: "relative", zIndex: 10 }}>
          <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", marginBottom: "24px", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}>🛡️</div>
          <h1 style={{ color: "#F0F6FF", fontSize: "22px", fontWeight: 700, marginBottom: "4px", fontFamily: "'Space Grotesk',sans-serif" }}>Super Admin</h1>
          <p style={{ color: "#4A6080", fontSize: "13px", marginBottom: "32px" }}>Restricted access — Cab8 internal only</p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", color: "#6B8BAE", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontFamily: "monospace" }}>Admin Password</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPwError(""); }} placeholder="Enter admin password…" autoFocus
                style={{ width: "100%", padding: "12px 16px", background: "#050D1A", border: pwError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(26,46,69,0.8)", borderRadius: "12px", color: "#F0F6FF", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              {pwError && <p style={{ color: "#F87171", fontSize: "12px", marginTop: "6px" }}>⚠️ {pwError}</p>}
            </div>
            <button type="submit"
              style={{ padding: "13px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.35)", fontFamily: "inherit" }}>
              🔓 Enter Admin Portal
            </button>
          </form>
          <p style={{ color: "#1A2E45", fontSize: "11px", textAlign: "center", marginTop: "24px" }}>cab8 · internal only</p>
        </div>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700;800&display=swap" />
      </div>
    );
  }

  // ─── MAIN SHELL (authenticated) ────────────────────────────────────────────
  return (
    <Ctx.Provider value={{ authed, logout, appName, logoData, pendingUnion }}>
      <div style={{ minHeight: "100vh", display: "flex", background: "#050D1A", fontFamily: "'Inter',system-ui,sans-serif", color: "#F0F6FF" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: "240px", flexShrink: 0, background: "#0A1628", borderRight: "1px solid #1A2E45", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          {/* Brand */}
          <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid #1A2E45" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {logoData
                ? <img src={logoData} alt="logo" style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }} />
                : <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg,#2563EB,#06B6D4)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>🛡️</div>
              }
              <div>
                <p style={{ color: "#F0F6FF", fontWeight: 700, fontSize: "15px", lineHeight: 1.2, fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</p>
                <p style={{ color: "#3B5A7A", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Super Admin</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ padding: "14px 12px", flex: 1 }}>
            {NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", textDecoration: "none", background: active ? "rgba(37,99,235,0.18)" : "transparent", color: active ? "#60A5FA" : "#4A6080", fontSize: "13px", fontWeight: 500, marginBottom: "2px", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#93B4D4"; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A6080"; }}}
                >
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && pendingUnion > 0 && (
                    <span style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", fontFamily: "monospace" }}>
                      {pendingUnion}
                    </span>
                  )}
                  {active && <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#60A5FA", flexShrink: 0 }} />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: "14px 12px", borderTop: "1px solid #1A2E45" }}>
            <button onClick={logout}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "none", background: "transparent", color: "#F87171", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px", transition: "all 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 28px", minWidth: 0 }}>
          {children}
        </main>
      </div>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700;800&display=swap" />
      <style suppressHydrationWarning>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes adminPulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes adminFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#050D1A}
        ::-webkit-scrollbar-thumb{background:#1A2E45;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#2563EB}
        input[type=color]{cursor:pointer}
        a{text-decoration:none}
      `}</style>
    </Ctx.Provider>
  );
}
