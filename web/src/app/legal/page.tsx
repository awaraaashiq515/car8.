"use client";

import Link from "next/link";
import { LEGAL_DOCS, G_SHARED } from "./_shared";

export default function LegalHubPage() {
  return (
    <main style={{ minHeight:"100vh", background:"#060B18", color:"#E2E8F0", fontFamily:"'Inter',sans-serif", paddingBottom:80 }}>
      <style suppressHydrationWarning>{`
        ${G_SHARED}
        .doc-card { background:#0A1628; border:1px solid #1E3A5F; border-radius:20px; padding:20px; text-decoration:none; display:block; transition:all 0.22s; animation:fadeUp 0.4s ease both; }
        .doc-card:hover { transform:translateY(-4px); border-color:rgba(59,130,246,0.6); box-shadow:0 16px 48px rgba(59,130,246,0.18); }
        .glow-line { width:200px; height:1px; background:linear-gradient(90deg,transparent,#3B82F6,transparent); margin:0 auto 32px; }
      `}</style>

      {/* Background Glow */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)", width:700, height:360, borderRadius:"50%", opacity:0.08, background:"radial-gradient(ellipse,#3B82F6 0%,transparent 65%)" }} />
      </div>

      <div style={{ position:"relative", zIndex:10, maxWidth:880, margin:"0 auto", padding:"40px 20px 60px" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚖️</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:"#fff", margin:"0 0 12px", lineHeight:1.15 }}>
            Legal &amp; <span style={{background:"linear-gradient(135deg,#1D4ED8,#60A5FA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>Policy</span> Documents
          </h1>
          <p style={{ fontSize:15, color:"#64748B", margin:"0 0 20px", maxWidth:520, marginLeft:"auto", marginRight:"auto", lineHeight:1.65 }}>
            All legal documents governing the use of CAB8.in — our terms, privacy practices, partner agreements, and policies.
          </p>

          {/* Company Badge */}
          <div style={{ display:"inline-flex", flexWrap:"wrap", gap:12, alignItems:"center", background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.22)", borderRadius:14, padding:"12px 20px", justifyContent:"center" }}>
            <span style={{ fontSize:12, color:"#E2E8F0", fontWeight:700 }}>🏛️ OrderMint.in</span>
            <span style={{ fontSize:12, color:"#334155" }}>·</span>
            <span style={{ fontSize:12, color:"#94A3B8" }}>Founder: <strong style={{color:"#E2E8F0"}}>Ritesh Grover</strong></span>
            <span style={{ fontSize:12, color:"#334155" }}>·</span>
            <span style={{ fontSize:12, color:"#94A3B8" }}>Mandi, HP – 175001</span>
            <span style={{ fontSize:12, color:"#334155" }}>·</span>
            <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:"#60A5FA" }}>GSTIN: 02BMAPG7310Q2Z6</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:14 }}>
            <span style={{ fontSize:11, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:6, padding:"3px 10px", color:"#60A5FA", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
              Effective: 20 August 2026
            </span>
          </div>
        </div>

        <div className="glow-line" />

        {/* Document Cards Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:40 }}>
          {LEGAL_DOCS.map((doc, i) => (
            <Link key={doc.href} href={doc.href} className="doc-card" style={{ animationDelay:`${i * 60}ms` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                  {doc.icon}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#fff", lineHeight:1.2 }}>{doc.label}</p>
                </div>
              </div>
              <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6 }}>{doc.desc}</p>
              <div style={{ marginTop:12 }}>
                <span style={{ fontSize:11, color:"#3B82F6", fontWeight:700 }}>Read Document →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Package Info */}
        <div style={{ background:"#0A1628", border:"1px solid #1E3A5F", borderRadius:20, padding:24 }}>
          <h2 style={{ fontSize:15, fontWeight:800, color:"#60A5FA", margin:"0 0 12px" }}>📦 Document Package</h2>
          <p style={{ fontSize:13, color:"#94A3B8", margin:"0 0 12px", lineHeight:1.7 }}>
            This Legal &amp; Policy Document Package has been prepared for <strong style={{color:"#E2E8F0"}}>CAB8.in</strong>, a brand operated under <strong style={{color:"#E2E8F0"}}>OrderMint.in</strong>, founded by <strong style={{color:"#E2E8F0"}}>Ritesh Grover</strong>, District Mandi, Himachal Pradesh, India.
          </p>
          <p style={{ fontSize:12, color:"#334155", margin:0, lineHeight:1.7 }}>
            <strong style={{color:"#475569"}}>Contains:</strong> Terms &amp; Conditions · Privacy Policy · Contact Information · Disclaimer · Master Driver/Partner Agreement (with Schedules A–E) · Cancellation &amp; Refund Policy · Regulatory Compliance Annex (August 2026).
          </p>
          <p style={{ fontSize:11, color:"#374151", margin:"12px 0 0", padding:"10px 14px", background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:10, lineHeight:1.6 }}>
            <strong style={{color:"#F87171"}}>⚠️ Legal Notice:</strong> These documents do not constitute legal, tax or regulatory advice. No version of these documents is "compliance-cleared" until reviewed and signed off by a licensed Indian transportation-regulatory lawyer and GST professional.
          </p>
        </div>
      </div>
    </main>
  );
}
