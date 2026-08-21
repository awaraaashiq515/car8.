"use client";

import Link from "next/link";

// ── Blue Color Tokens ──────────────────────────────────────────────────────────
// Primary  : #3B82F6  (blue-500)
// Dark     : #1D4ED8  (blue-700)
// Bright   : #60A5FA  (blue-400)
// Glow bg  : rgba(59,130,246,0.35)

export const CAB8_INFO = {
  brand:     "CAB8",
  website:   "CAB8.in",
  parent:    "OrderMint.in",
  founder:   "Ritesh Grover",
  address:   "Himachal Pradesh, District Mandi – 175001, India",
  phone:     "+91-8679800074",
  gstin:     "02BMAPG7310Q2Z6",
  effective: "20 August 2026",
};

export const LEGAL_DOCS = [
  { href: "/legal/terms",             icon: "📜", label: "Terms & Conditions",           desc: "Platform rules, user eligibility, bookings, payments, liabilities" },
  { href: "/legal/privacy",           icon: "🔒", label: "Privacy Policy",               desc: "What data we collect, how we use it, your rights" },
  { href: "/legal/disclaimer",        icon: "⚠️", label: "Disclaimer",                   desc: "Platform limitations, GPS, fare, availability, liability" },
  { href: "/legal/partner-agreement", icon: "🤝", label: "Driver / Partner Agreement",   desc: "Master agreement + Schedule A–E for all partner types" },
  { href: "/legal/refund",            icon: "💳", label: "Cancellation & Refund Policy", desc: "Cancellation rules, refund eligibility, no-show, disputes" },
  { href: "/legal/contact",           icon: "📞", label: "Contact Us",                   desc: "Reach our team for bookings, support, partnerships" },
];

export const G_SHARED = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; color: #000 !important; }
    .doc-body { background:#fff !important; color:#111 !important; }
    .doc-section { background:#fff !important; border:1px solid #ddd !important; }
  }
  body { font-family: 'Inter', sans-serif; }
`;

export function LegalPageShell({
  icon, title, subtitle, children, toc,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  toc?: { id: string; label: string }[];
}) {
  return (
    <main className="doc-body" style={{ minHeight: "100vh", background: "#060B18", color: "#E2E8F0", fontFamily: "'Inter', sans-serif" }}>
      <style suppressHydrationWarning>{`
        ${G_SHARED}
        .doc-section { background:#0A1628; border:1px solid #1E3A5F; border-radius:16px; padding:24px; margin-bottom:16px; animation:fadeUp 0.3s ease both; }
        .doc-section h2 { font-size:17px; font-weight:800; color:#60A5FA; margin:0 0 14px; padding-bottom:10px; border-bottom:1px solid #1E3A5F; }
        .doc-section h3 { font-size:14px; font-weight:700; color:#93C5FD; margin:16px 0 8px; }
        .doc-section p, .doc-section li { font-size:13.5px; color:#CBD5E1; line-height:1.75; }
        .doc-section ul { padding-left:20px; margin:8px 0; }
        .doc-section li { margin-bottom:4px; }
        .doc-section strong { color:#E2E8F0; }
        .toc-link { display:block; padding:6px 10px; border-radius:8px; font-size:12px; color:#475569; text-decoration:none; transition:all 0.15s; }
        .toc-link:hover { background:rgba(59,130,246,0.1); color:#60A5FA; }
        .print-btn { padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4); color:#60A5FA; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
        .print-btn:hover { background:rgba(59,130,246,0.28); }
        .back-btn { padding:8px 14px; border-radius:10px; font-size:12px; font-weight:600; background:#0A1628; border:1px solid #1E3A5F; color:#64748B; text-decoration:none; }
      `}</style>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px 60px", display:"grid", gridTemplateColumns: toc ? "220px 1fr" : "1fr", gap:32 }}>

        {/* Sidebar TOC */}
        {toc && (
          <aside className="no-print" style={{ position:"sticky", top:72, alignSelf:"start", background:"#0A1628", border:"1px solid #1E3A5F", borderRadius:16, padding:16, maxHeight:"80vh", overflowY:"auto" }}>
            <p style={{ fontSize:10, fontWeight:800, color:"#3B82F6", letterSpacing:1.5, textTransform:"uppercase", margin:"0 0 10px", fontFamily:"'JetBrains Mono',monospace" }}>Contents</p>
            {toc.map(item => (
              <a key={item.id} href={`#${item.id}`} className="toc-link">{item.label}</a>
            ))}
          </aside>
        )}

        {/* Main Content */}
        <div>
          {/* Header */}
          <div style={{ marginBottom:28, animation:"fadeUp 0.4s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:18, background:"linear-gradient(135deg,#1D4ED8,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:"0 0 28px rgba(59,130,246,0.45)", flexShrink:0 }}>{icon}</div>
              <div>
                <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:"#fff", lineHeight:1.2 }}>{title}</h1>
                {subtitle && <p style={{ margin:"4px 0 0", fontSize:13, color:"#475569" }}>{subtitle}</p>}
              </div>
            </div>

            {/* Company Badge */}
            <div style={{ background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.22)", borderRadius:14, padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:16, alignItems:"center" }}>
              <div>
                <p style={{ fontSize:10, color:"#3B82F6", fontWeight:800, textTransform:"uppercase", letterSpacing:1, margin:"0 0 2px", fontFamily:"'JetBrains Mono',monospace" }}>CAB8 / OrderMint</p>
                <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>Founder: <strong style={{color:"#E2E8F0"}}>Ritesh Grover</strong> · Mandi, HP – 175001</p>
              </div>
              <div style={{ height:32, width:1, background:"#1E3A5F" }} />
              <div>
                <p style={{ fontSize:10, color:"#94A3B8", margin:"0 0 1px" }}>📞 <strong style={{color:"#E2E8F0", fontFamily:"'JetBrains Mono',monospace"}}>+91-8679800074</strong></p>
                <p style={{ fontSize:10, color:"#94A3B8", margin:0 }}>GSTIN: <strong style={{color:"#E2E8F0", fontFamily:"'JetBrains Mono',monospace"}}>02BMAPG7310Q2Z6</strong></p>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#60A5FA", background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:6, padding:"3px 10px", fontFamily:"'JetBrains Mono',monospace" }}>
                  Effective: 20 August 2026
                </span>
              </div>
            </div>
          </div>

          {/* Document Body */}
          {children}
        </div>
      </div>
    </main>
  );
}
