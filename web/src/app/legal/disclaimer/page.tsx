"use client";

import { useState } from "react";
import Link from "next/link";

const DISCLAIMER_CATEGORIES = [
  { id: "all", label: "All Disclaimers", icon: "📋" },
  { id: "platform", label: "Platform & Tech", icon: "💻" },
  { id: "rides", label: "Rides & Fares", icon: "🚗" },
  { id: "legal", label: "Legal & Liability", icon: "⚖️" },
  { id: "identity", label: "Business Entity", icon: "🏢" },
];

export default function DisclaimerPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #0A1E3F 0%, #050D1A 60%, #030712 100%)",
        color: "#E2E8F0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        paddingBottom: "70px",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade {
          animation: fadeIn 0.35s ease-out forwards;
        }
        .disc-card {
          background: rgba(10, 22, 40, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #1E3A5F;
          border-radius: 14px;
          padding: 18px 20px;
          transition: all 0.2s ease;
        }
        .disc-card:hover {
          border-color: #3B82F6;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12);
        }
        .disc-pill {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid transparent;
        }
      `}</style>

      {/* Hero Header */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 16px" }} className="animate-fade">
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontSize: 11,
              fontWeight: 700,
              color: "#FBBF24",
              marginBottom: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            <span>⚠️</span> Legal &amp; Regulatory Disclosures
          </div>

          <h1
            style={{
              fontSize: "clamp(22px, 3.5vw, 30px)",
              fontWeight: 900,
              lineHeight: 1.2,
              margin: "0 0 10px",
              color: "#FFFFFF",
              letterSpacing: "-0.3px",
            }}
          >
            Platform <span style={{ color: "#F59E0B" }}>Disclaimer</span>
          </h1>

          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 16px" }}>
            Important limitations, disclosures, and terms regarding CAB8.in technology, intermediary role, and transportation services operated under OrderMint.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, fontSize: 11.5 }}>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#93C5FD" }}>
              🗓️ Effective: <strong>20 August 2026</strong>
            </span>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#A7F3D0" }}>
              📍 Jurisdiction: <strong>Mandi, Himachal Pradesh</strong>
            </span>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#FDE68A" }}>
              🏛️ GSTIN: <strong>02BMAPG7310Q2Z6</strong>
            </span>
          </div>
        </div>

        {/* 4 Highlight Takeaway Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          {[
            {
              icon: "🚕",
              title: "Technology Aggregator",
              desc: "CAB8 acts as an intermediary platform connecting passengers with independent drivers & taxi operators.",
              color: "#60A5FA",
              border: "rgba(59, 130, 246, 0.25)",
            },
            {
              icon: "🏷️",
              title: "Fare Estimates",
              desc: "Quoted fares are estimates and may adjust for tolls, route changes, waiting time, and parking fees.",
              color: "#34D399",
              border: "rgba(16, 185, 129, 0.25)",
            },
            {
              icon: "📍",
              title: "GPS & ETA Variance",
              desc: "Mapping, navigation routes, and estimated arrival times are provided with best-effort precision.",
              color: "#FBBF24",
              border: "rgba(245, 158, 11, 0.25)",
            },
            {
              icon: "🛡️",
              title: "Partner Compliance",
              desc: "Vehicle operators remain legally responsible for driving licences, vehicle fitness, permits, and insurance.",
              color: "#C084FC",
              border: "rgba(168, 85, 247, 0.25)",
            },
          ].map((c) => (
            <div
              key={c.title}
              style={{
                background: "rgba(6, 14, 28, 0.7)",
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <h2 style={{ fontSize: 12.5, fontWeight: 800, color: c.color, margin: 0 }}>{c.title}</h2>
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ maxWidth: 1100, margin: "20px auto 0", padding: "0 20px" }} className="animate-fade">
        {/* Filter Navigation Tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid #1A2E45",
          }}
        >
          {DISCLAIMER_CATEGORIES.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="disc-pill"
                style={{
                  background: active ? "linear-gradient(135deg, #1D4ED8, #3B82F6)" : "rgba(10, 22, 40, 0.6)",
                  borderColor: active ? "rgba(147, 197, 253, 0.4)" : "#1E3A5F",
                  color: active ? "#FFFFFF" : "#94A3B8",
                  boxShadow: active ? "0 0 14px rgba(59, 130, 246, 0.3)" : "none",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Masonry / Grid of Sections */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {/* 1. Technology Platform */}
          {(activeTab === "all" || activeTab === "platform") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #3B82F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>💻</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#60A5FA", margin: 0 }}>
                  1. Technology Platform Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 provides technology that may facilitate connections between customers and transportation service providers. Unless specifically stated otherwise, CAB8 does not directly own, operate or control every vehicle or driver available through the platform. The transportation service may be provided by an independent driver, taxi operator, fleet owner or transportation partner.
              </p>
            </div>
          )}

          {/* 2. Driver & Vehicle */}
          {(activeTab === "all" || activeTab === "rides") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #10B981" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🚗</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#34D399", margin: 0 }}>
                  2. Driver and Vehicle Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: "0 0 6px" }}>
                CAB8 may display information relating to drivers and vehicles based on information provided by drivers/partners or available through operational systems. Although CAB8 may undertake verification processes, CAB8 cannot guarantee that every driver or vehicle will always remain compliant with every applicable requirement.
              </p>
              <p style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
                Drivers and vehicle partners remain responsible for maintaining valid driving licences, vehicle registration, insurance, permits, fitness certificates, pollution certificates, and other legally required documents.
              </p>
            </div>
          )}

          {/* 3. Fare Disclaimer */}
          {(activeTab === "all" || activeTab === "rides") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #F59E0B" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>💳</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#FBBF24", margin: 0 }}>
                  3. Fare Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                Fare estimates displayed through CAB8 may change because of actual distance, actual travel time, traffic, waiting time, route changes, tolls, parking, government charges, additional stops, and other applicable charges. The final amount may therefore differ from an initial estimate.
              </p>
            </div>
          )}

          {/* 4. Availability */}
          {(activeTab === "all" || activeTab === "rides") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #8B5CF6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⏳</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#A78BFA", margin: 0 }}>
                  4. Availability Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 does not guarantee that a driver or vehicle will always be available in a particular location. Availability may vary according to time, location, demand, weather, traffic, driver availability, local regulations, and technical conditions.
              </p>
            </div>
          )}

          {/* 5. GPS & Maps */}
          {(activeTab === "all" || activeTab === "rides") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #06B6D4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🗺️</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#22D3EE", margin: 0 }}>
                  5. GPS and Maps Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                GPS, maps, navigation and estimated arrival times are provided using technology that may contain inaccuracies. CAB8 does not guarantee that GPS information, maps, routes or ETAs will always be accurate.
              </p>
            </div>
          )}

          {/* 6. Internet & Technology */}
          {(activeTab === "all" || activeTab === "platform") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #EC4899" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>📡</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#F472B6", margin: 0 }}>
                  6. Internet and Technology Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 depends on internet connectivity, mobile networks, GPS, cloud infrastructure, third-party APIs and other technology. Temporary service interruptions may occur. CAB8 is not responsible for interruptions caused by circumstances beyond its reasonable control.
              </p>
            </div>
          )}

          {/* 7. Third-Party Services */}
          {(activeTab === "all" || activeTab === "platform") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #3B82F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🔌</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#60A5FA", margin: 0 }}>
                  7. Third-Party Service Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 may integrate third-party services. These services may have independent terms, policies and technical limitations. CAB8 is not responsible for failures caused solely by independent third-party providers.
              </p>
            </div>
          )}

          {/* 8. Safety Disclaimer */}
          {(activeTab === "all" || activeTab === "rides") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #10B981" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🛡️</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#34D399", margin: 0 }}>
                  8. Safety Disclaimer
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 may provide safety-related features, but no transportation platform can guarantee complete safety. Customers and drivers should exercise reasonable caution and comply with applicable laws and safety requirements.
              </p>
            </div>
          )}

          {/* 9. User-Generated Info */}
          {(activeTab === "all" || activeTab === "legal") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #F59E0B" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>👤</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#FBBF24", margin: 0 }}>
                  9. User-Generated Information
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                Information submitted by drivers, customers or other users may not always be accurate. CAB8 may take reasonable measures to verify information but does not guarantee that every user-provided statement is complete or accurate.
              </p>
            </div>
          )}

          {/* 10. No Professional Advice */}
          {(activeTab === "all" || activeTab === "legal") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #6366F1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>⚖️</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#818CF8", margin: 0 }}>
                  10. No Professional Advice
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                Information published on CAB8.in should not be considered legal, financial, tax, transportation-regulatory or other professional advice. Users should obtain appropriate professional advice where required.
              </p>
            </div>
          )}

          {/* 11. Intellectual Property */}
          {(activeTab === "all" || activeTab === "legal") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #EC4899" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>®️</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#F472B6", margin: 0 }}>
                  11. Intellectual Property
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8, CAB8.in, OrderMint and associated branding are used by or on behalf of the applicable owner/operator. Nothing on the website grants a user ownership rights in CAB8 intellectual property.
              </p>
            </div>
          )}

          {/* 12. Future Services */}
          {(activeTab === "all" || activeTab === "platform") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #06B6D4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🚀</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#22D3EE", margin: 0 }}>
                  12. Future Services
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                CAB8 may introduce additional services, applications, subscription plans, partner programmes, advertising services, fleet services or technology products. Additional terms may apply to such services.
              </p>
            </div>
          )}

          {/* 13. Limitation */}
          {(activeTab === "all" || activeTab === "legal") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #EF4444" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🛑</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#F87171", margin: 0 }}>
                  13. Limitation of Liability
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                To the maximum extent permitted by applicable law, CAB8 and OrderMint disclaim liability for indirect or consequential losses arising from use of the platform. Nothing in this Disclaimer excludes liability that cannot legally be excluded under applicable law.
              </p>
            </div>
          )}

          {/* 14. Legal Jurisdiction */}
          {(activeTab === "all" || activeTab === "legal") && (
            <div className="disc-card" style={{ borderLeft: "3px solid #3B82F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🏛️</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#60A5FA", margin: 0 }}>
                  14. Legal Jurisdiction
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, margin: 0 }}>
                This Disclaimer is governed by the laws of India. Subject to applicable law, disputes shall be subject to the jurisdiction of competent courts in <strong>Mandi, Himachal Pradesh</strong>.
              </p>
            </div>
          )}
        </div>

        {/* 15. Business Identification Card & Footer Box */}
        {(activeTab === "all" || activeTab === "identity") && (
          <div
            style={{
              marginTop: 20,
              background: "linear-gradient(180deg, #0A1B36 0%, #061122 100%)",
              border: "1px solid #1E3A5F",
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                15. Business Identification &amp; Entity Profile
              </h3>
            </div>

            <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "0 0 14px" }}>
              <strong>CAB8.in</strong> — A Brand/Platform under <strong>OrderMint.in</strong>
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                fontSize: 12,
                color: "#CBD5E1",
                marginBottom: 18,
              }}
            >
              <div style={{ background: "rgba(10, 22, 40, 0.6)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1A2E45" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Founder &amp; Owner</span>
                <strong style={{ color: "#FFFFFF" }}>Ritesh Grover</strong>
              </div>
              <div style={{ background: "rgba(10, 22, 40, 0.6)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1A2E45" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Headquarters</span>
                <strong style={{ color: "#FFFFFF" }}>Mandi, Himachal Pradesh – 175001</strong>
              </div>
              <div style={{ background: "rgba(10, 22, 40, 0.6)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1A2E45" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>Direct Phone</span>
                <a href="tel:+918679800074" style={{ color: "#60A5FA", textDecoration: "none", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>+91-8679800074</a>
              </div>
              <div style={{ background: "rgba(10, 22, 40, 0.6)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1A2E45" }}>
                <span style={{ color: "#64748B", display: "block", fontSize: 10.5 }}>GSTIN</span>
                <strong style={{ color: "#34D399", fontFamily: "'JetBrains Mono', monospace" }}>02BMAPG7310Q2Z6</strong>
              </div>
            </div>

            {/* Recommended Website Footer Box */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.06)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 700, color: "#60A5FA" }}>
                📌 Recommended Website Footer
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#E2E8F0", fontStyle: "italic" }}>
                CAB8 — Powered by OrderMint. Smart Mobility. Better Rides.
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#94A3B8" }}>
                CAB8.in | OrderMint.in — Founder: Ritesh Grover | Mandi, Himachal Pradesh – 175001, India — GSTIN: 02BMAPG7310Q2Z6 | +91-8679800074
              </p>
              <p style={{ margin: 0, fontSize: 10.5, color: "#64748B" }}>
                Quick Links: Terms &amp; Conditions | Privacy Policy | Disclaimer | Contact Us | Cancellation &amp; Refund Policy | Driver/Partner Terms
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Legal Navigation Bar */}
      <section style={{ maxWidth: 1100, margin: "40px auto 0", padding: "0 20px", textAlign: "center" }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
          Related Legal &amp; Policy Documents
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {[
            { href: "/legal/terms", label: "📜 Terms & Conditions" },
            { href: "/legal/privacy", label: "🔒 Privacy Policy" },
            { href: "/legal/contact", label: "📞 Contact Us" },
            { href: "/legal/partner-agreement", label: "🤝 Driver Agreement" },
            { href: "/legal/refund", label: "💳 Refund Policy" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                background: "rgba(10, 22, 40, 0.6)",
                border: "1px solid #1E3A5F",
                borderRadius: 8,
                padding: "6px 12px",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
