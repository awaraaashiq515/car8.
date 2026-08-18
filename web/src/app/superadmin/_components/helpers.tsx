"use client";
// ─── Shared display helpers for the Super Admin portal ────────────────────────

export function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}
export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ACTIVE:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    APPROVED:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ONLINE:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    SEARCHING: "bg-blue-500/15   text-blue-400    border-blue-500/30",
    CONFIRMED: "bg-blue-500/15   text-blue-400    border-blue-500/30",
    DRIVER_ASSIGNED:"bg-blue-500/15 text-blue-400 border-blue-500/30",
    ARRIVED:   "bg-indigo-500/15 text-indigo-400  border-indigo-500/30",
    ONGOING:   "bg-violet-500/15 text-violet-400  border-violet-500/30",
    PENDING:   "bg-amber-500/15  text-amber-400   border-amber-500/30",
    FILLED:    "bg-amber-500/15  text-amber-400   border-amber-500/30",
    CANCELLED: "bg-red-500/15    text-red-400     border-red-500/30",
    EXPIRED:   "bg-gray-500/15   text-gray-400    border-gray-500/30",
    REJECTED:  "bg-red-500/15    text-red-400     border-red-500/30",
    OFFLINE:   "bg-gray-500/15   text-gray-400    border-gray-500/30",
    CUSTOMER:  "bg-slate-500/15  text-slate-300   border-slate-500/30",
    DRIVER:    "bg-cyan-500/15   text-cyan-400    border-cyan-500/30",
    ADMIN:     "bg-purple-500/15 text-purple-400  border-purple-500/30",
    HATCHBACK: "bg-sky-500/15    text-sky-400     border-sky-500/30",
    SEDAN:     "bg-teal-500/15   text-teal-400    border-teal-500/30",
    SUV:       "bg-orange-500/15 text-orange-400  border-orange-500/30",
    LUXURY:    "bg-yellow-500/15 text-yellow-400  border-yellow-500/30",
    LOCAL:     "bg-blue-500/15   text-blue-400    border-blue-500/30",
    OUTSTATION:"bg-purple-500/15 text-purple-400  border-purple-500/30",
    AIRPORT:   "bg-cyan-500/15   text-cyan-400    border-cyan-500/30",
    HOURLY:    "bg-rose-500/15   text-rose-400    border-rose-500/30",
  };
  const cls = map[s] || "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${cls}`}>
      {s}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, val, icon, color }: {
  label: string; val: number; icon: string; color: string;
}) {
  return (
    <div
      style={{ background: "#0A1628", border: "1px solid #1A2E45", borderRadius: "14px", padding: "18px 16px", transition: "border-color 0.2s", cursor: "default" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color + "55")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1A2E45")}
    >
      <div style={{ fontSize: "22px", marginBottom: "10px" }}>{icon}</div>
      <p style={{ fontSize: "26px", fontWeight: 800, color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>
        {val.toLocaleString()}
      </p>
      <p style={{ color: "#4A6080", fontSize: "11px", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" }}>
        {label}
      </p>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <EmptyState msg="No data found" />;
  return (
    <div style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid #1A2E45" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#0A1628", borderBottom: "1px solid #1A2E45" }}>
            {cols.map(c => (
              <th key={c} style={{ padding: "12px 14px", textAlign: "left", color: "#3B5A7A", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: "1px solid #0F1E33", background: i % 2 === 0 ? "transparent" : "rgba(10,22,40,0.4)", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(37,99,235,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(10,22,40,0.4)")}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "11px 14px", color: "#C5D9EF", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SectionWrapper ────────────────────────────────────────────────────────────
export function SectionWrapper({ title, icon, count, search, setSearch, onRefresh, loading, children, extra }: {
  title: string; icon: string; count: number; search: string;
  setSearch: (v: string) => void; onRefresh: () => void;
  loading: boolean; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{icon} {title}</h1>
          <p style={{ color: "#4A6080", fontSize: "12px", marginTop: "2px" }}>{count} records</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {extra}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #1A2E45", background: "#0A1628", color: "#F0F6FF", fontSize: "13px", outline: "none", width: "200px" }} />
          <button onClick={onRefresh}
            style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #1A2E45", background: "#0A1628", color: "#4A6080", cursor: "pointer", fontSize: "13px" }}>
            🔄
          </button>
        </div>
      </div>
      {loading ? <LoadingPulse /> : children}
    </div>
  );
}

// ── ActionBtn ─────────────────────────────────────────────────────────────────
export function ActionBtn({ children, color, bg, border, onClick }: {
  children: React.ReactNode; color: string; bg: string; border: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: bg, color, cursor: "pointer", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", transition: "opacity 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

// ── Phone ─────────────────────────────────────────────────────────────────────
export function Phone({ p }: { p: string }) {
  return <span style={{ color: "#4A6080", fontSize: "11px", fontFamily: "monospace" }}>{p}</span>;
}

// ── LoadingPulse ──────────────────────────────────────────────────────────────
export function LoadingPulse() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px 0" }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: "48px", borderRadius: "10px", background: "linear-gradient(90deg,#0A1628 25%,#0F1E33 50%,#0A1628 75%)", backgroundSize: "200% 100%", animation: `adminPulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#3B5A7A" }}>
      <p style={{ fontSize: "36px", marginBottom: "12px" }}>📭</p>
      <p style={{ fontSize: "14px" }}>{msg}</p>
    </div>
  );
}
