"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = [
  { id: "master", label: "Master Agreement (1–48)", icon: "📜" },
  { id: "sa", label: "Schedule A: Individual Driver", icon: "🚗" },
  { id: "sb", label: "Schedule B: Fleet Owner", icon: "🚌" },
  { id: "sc", label: "Schedule C: Taxi Union", icon: "🏛️" },
  { id: "sd", label: "Schedule D: Corporate Fleet", icon: "🏢" },
  { id: "se", label: "Schedule E: Travel Agency", icon: "✈️" },
];

export default function PartnerAgreementPage() {
  const [activeTab, setActiveTab] = useState("master");

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
        .agr-card {
          background: rgba(10, 22, 40, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid #1E3A5F;
          border-radius: 12px;
          padding: 16px 18px;
          transition: all 0.2s ease;
        }
        .agr-card:hover {
          border-color: #3B82F6;
          box-shadow: 0 4px 18px rgba(59, 130, 246, 0.1);
        }
        .tab-btn {
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid transparent;
          font-family: inherit;
        }
      `}</style>

      {/* Hero Header */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 16px" }} className="animate-fade">
        <div style={{ textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#60A5FA",
              marginBottom: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            <span>🤝</span> Official Partner &amp; Driver Contract
          </div>

          <h1
            style={{
              fontSize: "clamp(22px, 3.5vw, 28px)",
              fontWeight: 900,
              lineHeight: 1.2,
              margin: "0 0 10px",
              color: "#FFFFFF",
              letterSpacing: "-0.3px",
            }}
          >
            Master Driver &amp; Partner <span style={{ color: "#F59E0B" }}>Agreement</span>
          </h1>

          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 16px" }}>
            Terms governing participation for individual drivers, taxi operators, fleet owners, taxi unions, corporate fleets, and travel agency partners on the CAB8 platform.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, fontSize: 11.5 }}>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#93C5FD" }}>
              🗓️ Effective: <strong>20 August 2026</strong>
            </span>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#FDE68A" }}>
              📑 Schedules: <strong>A, B, C, D, E Included</strong>
            </span>
            <span style={{ background: "#060F1E", border: "1px solid #1E3A5F", borderRadius: 8, padding: "4px 10px", color: "#A7F3D0" }}>
              📍 Jurisdiction: <strong>Mandi, Himachal Pradesh</strong>
            </span>
          </div>
        </div>

        {/* 4 Quick Highlights */}
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
              icon: "🚗",
              title: "Independent Contractor",
              desc: "Partners are independent transportation providers, not employees of CAB8.",
              color: "#60A5FA",
              border: "rgba(59, 130, 246, 0.25)",
            },
            {
              icon: "💰",
              title: "Transparent Commercials",
              desc: "Clear models covering percentage commission, fixed ride fees, or subscriptions.",
              color: "#34D399",
              border: "rgba(16, 185, 129, 0.25)",
            },
            {
              icon: "📑",
              title: "Strict Compliance",
              desc: "Valid Driving Licence, RC, Commercial Permit, Insurance, and PUC mandatory.",
              color: "#FBBF24",
              border: "rgba(245, 158, 11, 0.25)",
            },
            {
              icon: "🛡️",
              title: "Safety & Integrity",
              desc: "Zero tolerance for fraud, offline ride diversion, intoxication, or harassment.",
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
        {/* Navigation Tabs */}
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
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-btn"
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

        {/* ── TAB 1: MASTER AGREEMENT ── */}
        {activeTab === "master" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Parties Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(10, 22, 40, 0.8))",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 800, color: "#60A5FA", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Parties to this Agreement
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.6 }}>
                <strong>CAB8 / OrderMint</strong> — a mobility technology platform and brand operated under <strong>OrderMint.in</strong>, represented by its founder/owner <strong>Mr. Ritesh Grover</strong>, District Mandi, Himachal Pradesh – 175001, India, Contact: <strong>+91-8679800074</strong>, GSTIN: <strong>02BMAPG7310Q2Z6</strong> — hereinafter referred to as <em>"CAB8"</em>, <em>"OrderMint"</em>, <em>"Platform"</em>, <em>"we"</em>, <em>"us"</em> or <em>"Company"</em>,
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.6 }}>
                <strong>AND</strong> the individual driver, fleet owner, taxi operator, union/association, corporate transportation partner, travel agency or other transportation service provider registering on CAB8, hereinafter referred to as the <em>"Partner"</em>, <em>"Driver"</em>, <em>"Operator"</em> or <em>"you"</em>.
              </p>
            </div>

            {/* Grid for sections 1-48 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>1. Purpose of Agreement</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 operates a technology platform intended to facilitate transportation services between passengers/customers and transportation service providers. The Partner wishes to access and use the CAB8 platform to receive, accept and fulfil transportation bookings. This Agreement establishes the general terms governing that relationship. The applicable Partner Schedule attached to this Agreement will supplement this Master Agreement.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>2. Partner Categories</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may onboard Partners under one or more of the following categories: Individual Driver, Fleet Owner, Taxi Union / Association, Corporate Fleet / Business Transportation Partner, and Travel Agency / Third-Party Transport Operator. The applicable Schedule shall form an integral part of this Agreement. CAB8 may introduce additional partner categories in future.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>3. Nature of Relationship</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Unless separately agreed in writing, the Partner is an independent transportation service provider and is not an employee of CAB8. Nothing in this Agreement shall automatically create an employer-employee relationship, partnership, joint venture, franchise, agency, or fiduciary relationship between CAB8 and Partner. The Partner is responsible for complying with all laws applicable to its own business and transportation operations.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>4. CAB8 Platform</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may provide passenger booking technology, driver application, partner dashboard, customer application, GPS/location services, ride allocation, navigation integration, fare calculation, payment processing, digital receipts, trip history, ratings, customer support, partner support, promotional programmes, fleet management, settlement systems, analytics, and safety features. CAB8 may add, modify or discontinue platform functionality.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>5. Partner Registration</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Before receiving bookings, a Partner may be required to provide: full name, mobile number, email, address, PAN, Aadhaar or legally acceptable KYC document, driving licence, vehicle registration certificate, commercial permit, fitness certificate, PUC, insurance, tax information, bank details, GST registration details where applicable, vehicle photographs, driver photograph, emergency contact, and other documents reasonably required by CAB8. CAB8 may require additional verification.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>6. Document Verification</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  The Partner warrants that all information and documents submitted to CAB8 are genuine, current, complete, accurate, and legally valid. The Partner must immediately notify CAB8 if a required document expires, is suspended, is cancelled, is revoked, is modified, or becomes inaccurate. CAB8 may temporarily suspend platform access where required documents are expired or unavailable.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>7. Driver Requirements</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  A Driver must hold a valid driving licence appropriate for the vehicle, meet applicable legal requirements, be medically/physically fit to drive where required, not drive under the influence of alcohol or drugs, follow traffic laws, follow CAB8 safety requirements, maintain professional behaviour, carry required vehicle documents, and cooperate with lawful verification procedures.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>8. Vehicle Requirements</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Every vehicle integrated with CAB8 must comply with applicable law. Depending upon vehicle category, requirements may include a valid RC, commercial registration where required, permit, fitness certificate, PUC, insurance, required safety equipment, valid number plate, appropriate vehicle condition, required markings/stickers, and other applicable government requirements. CAB8 may reject a vehicle that does not meet its operational standards.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>9. Insurance</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  The Partner shall maintain all insurance required by applicable law and CAB8's applicable vehicle category, which may include motor third-party insurance, passenger liability coverage, commercial vehicle insurance, personal accident cover, and other legally required insurance. The Partner must notify CAB8 of any material insurance claim, cancellation or expiry affecting the vehicle. Insurance requirements may vary according to applicable law and CAB8's operating model.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>10. Ride Allocation</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may use technology, algorithms, location information, vehicle category, availability, demand, ratings and other operational factors to determine ride allocation. CAB8 does not guarantee a minimum number of rides, income or bookings unless expressly agreed under a separate written programme.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>11. Acceptance of Rides</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  The Partner may accept or reject rides subject to CAB8 policies. Repeated unjustified rejection may affect allocation, incentives, ratings, account status, and platform access. CAB8 shall not require a Partner to accept rides that would be unlawful or unsafe.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>12. Ride Performance</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  After accepting a booking, the Partner should proceed toward the pickup location, follow reasonable navigation directions, verify the passenger where applicable, start the trip through the CAB8 system, follow the correct route subject to reasonable circumstances, complete the journey safely, end the trip correctly, and collect only permitted charges.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>13. Off-Platform Bookings</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Unless specifically permitted by CAB8, a Partner must not divert CAB8 customers to another platform, cancel CAB8 rides to privately negotiate the ride, demand direct payment for a CAB8 booking, encourage customers to bypass CAB8, or manipulate the platform to obtain private bookings. Such conduct may constitute a serious violation.
                </p>
              </div>

              {/* 14. Commission - Special Highlight */}
              <div className="agr-card" style={{ gridColumn: "1 / -1", borderLeft: "4px solid #F59E0B", background: "rgba(10, 22, 40, 0.85)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#FBBF24", margin: "0 0 8px" }}>14. Commission and Platform Fees</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: "0 0 10px" }}>
                  CAB8 may charge Partners through one or more models:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  <div style={{ background: "rgba(6, 14, 28, 0.7)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1E3A5F" }}>
                    <strong style={{ color: "#60A5FA", fontSize: 11.5, display: "block", marginBottom: 3 }}>Model A — Percentage Commission</strong>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>CAB8 may retain an agreed percentage of the applicable fare.</span>
                  </div>
                  <div style={{ background: "rgba(6, 14, 28, 0.7)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1E3A5F" }}>
                    <strong style={{ color: "#34D399", fontSize: 11.5, display: "block", marginBottom: 3 }}>Model B — Fixed Platform Fee</strong>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>CAB8 may charge a fixed amount per completed ride.</span>
                  </div>
                  <div style={{ background: "rgba(6, 14, 28, 0.7)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1E3A5F" }}>
                    <strong style={{ color: "#FBBF24", fontSize: 11.5, display: "block", marginBottom: 3 }}>Model C — Subscription</strong>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>CAB8 may offer subscription-based partner plans.</span>
                  </div>
                  <div style={{ background: "rgba(6, 14, 28, 0.7)", padding: "10px 12px", borderRadius: 8, border: "1px solid #1E3A5F" }}>
                    <strong style={{ color: "#C084FC", fontSize: 11.5, display: "block", marginBottom: 3 }}>Model D — Hybrid</strong>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Combination of commission, subscription, tech, and processing fees.</span>
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: "#64748B", margin: "10px 0 0" }}>
                  The applicable commercial model shall be displayed in the Partner Dashboard, onboarding documentation or commercial schedule.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>15. Commission Changes</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may modify commission structures prospectively by providing reasonable notice through the app, dashboard, email, SMS, WhatsApp, or other registered communication method. A Partner who does not agree to a material commercial change may discontinue use of the applicable platform service, subject to outstanding obligations.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>16. GST and Taxes</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Each Party shall comply with applicable tax laws. The GST treatment of passenger transportation, platform fees, commission, partner services, corporate bookings, inter-state services, intra-state services, and electronic commerce transactions shall be determined according to the applicable transaction structure and prevailing law. The Partner shall provide valid GST information where applicable. CAB8 may collect, deduct, report or remit taxes where required by law. The Partner remains responsible for its own income tax and other applicable tax obligations. CAB8 may modify invoicing and tax collection procedures when required by changes in law.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>17. Invoicing</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Depending on the transaction structure, CAB8 may issue ride receipts, tax invoices, commercial invoices, settlement statements, credit notes, debit notes, and other legally permitted documents. Passenger transportation tax invoices may be provided in an electronic format where permitted by applicable GST rules.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>18. Cash Collection</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Where cash payment is enabled, the Partner may collect the applicable customer amount and must accurately record the completed trip. Cash collected may be adjusted against CAB8 dues, included in wallet calculations, offset against commission, or included in settlement calculations. The Partner shall not collect amounts beyond the fare and charges authorized through CAB8.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>19. Online Payments</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  For digital transactions, CAB8 or its payment partner may collect payment from the customer. The Partner's payable amount may be calculated after deduction of CAB8 commission, platform fee, applicable taxes, refunds, adjustments, penalties, and other authorized deductions.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>20. Settlements</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may settle Partner earnings daily, weekly, fortnightly, monthly, or on another schedule notified by CAB8. Minimum withdrawal thresholds may apply. Settlement may be delayed where bank details are incorrect, KYC is incomplete, fraud investigation is ongoing, a payment dispute or chargeback exists, a regulatory restriction applies, the account is suspended, or a negative balance exists.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>21. Partner Wallet</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may maintain a digital Partner ledger/wallet recording credits (completed ride earnings, incentives, bonuses, adjustments) and debits (platform fees, commission, cancellation penalties, refund adjustments, customer compensation, chargebacks, tax deductions, and other permitted deductions).
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>22. Negative Balance</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  A Partner account may become negative due to refunds, chargebacks, incorrect cash reconciliation, fraudulent transactions, customer compensation, platform fee adjustments, duplicate settlement, or other valid adjustments. CAB8 may recover a negative balance from future Partner earnings, subject to applicable law and contractual rights.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>23. Incentives</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may introduce daily, weekly and monthly incentives, ride targets, peak-hour incentives, referral bonuses, new-driver bonuses, EV incentives, and fleet incentives. Incentives may have separate eligibility criteria. CAB8 may withhold or cancel incentives where fraudulent activity or manipulation is detected.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>24. Dynamic Pricing</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Where legally permitted and operationally enabled, CAB8 may use dynamic or demand-based pricing. The applicable fare methodology will be displayed or communicated in accordance with applicable requirements. CAB8's actual pricing system must be configured consistently with applicable central and state requirements, including the definitions and fare-related provisions of the 2025 central aggregator guidelines.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>25. Cancellation</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Partner cancellation obligations shall be governed by the CAB8 Cancellation & Refund Policy and any applicable category-specific Schedule. Repeated unjustified cancellations may lead to reduced allocation, penalties, incentive restrictions, temporary suspension, or permanent deactivation. Any cancellation penalties must be implemented subject to applicable law and regulatory requirements.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>26. No-Show</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  If the customer does not appear, the Partner should follow CAB8's no-show procedure and must not falsely mark a passenger as absent. GPS/location information may be used to investigate disputes.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>27. Customer Complaints</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Complaints may relate to driver behaviour, vehicle condition, overcharging, route manipulation, safety, cancellation, lost property, misconduct, harassment, or service quality. CAB8 may investigate complaints and request evidence. The Partner must cooperate with investigations.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>28. Ratings</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may provide customer ratings, used for quality monitoring, incentives, allocation, safety review, training, and account review. CAB8 may investigate suspicious or manipulated ratings.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>29. Accidents</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  In the event of an accident, the Partner must prioritize passenger and public safety, contact emergency services where appropriate, provide reasonable assistance, notify CAB8 as soon as reasonably practicable, report the incident to the relevant authority/insurer where required, and cooperate with insurance and legal processes. The Partner must not conceal an accident involving a CAB8 passenger.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>30. Accident Liability</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Nothing in this Agreement transfers statutory liability that cannot legally be transferred. The Partner remains responsible for obligations arising from its own negligence, illegal driving, vehicle defects, failure to maintain required documents, unauthorized conduct, or breach of applicable law. CAB8's liability, if any, shall be determined according to applicable law and the actual role CAB8 played in the relevant transaction.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>31. Safety</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Partner must never drive under influence, drive dangerously, use a mobile phone unlawfully while driving, carry unauthorized passengers where prohibited, overload the vehicle, intentionally disable safety systems, threaten passengers, or harass passengers. Serious safety violations may result in immediate suspension.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>32. Fraud</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Fraud includes, without limitation: fake rides, GPS spoofing, fake locations, multiple accounts, fake bookings, collusion, fake cancellations, incentive manipulation, payment manipulation, identity fraud, unauthorized vehicle substitution, account sharing, and customer-driver collusion. CAB8 may suspend accounts and investigate suspected fraud.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>33. Account Sharing</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Partners must not allow another person to operate using their identity/account unless CAB8 has specifically authorized the arrangement. Fleet accounts may operate under Schedule B.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>34. Customer Data</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Partner may only use customer information for legitimate CAB8 transportation purposes. Partner must not sell customer information, copy customer databases, contact customers for unrelated marketing, store customer information unnecessarily, or share customer information with unauthorized persons. CAB8's Privacy Policy and applicable data-protection law apply, including the obligations concerning lawful processing and protection of personal data established under the Digital Personal Data Protection Act.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>35. Confidentiality</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Partner shall keep confidential customer data, pricing information, commission rates, business information, CAB8 software, internal processes, Partner information, and non-public commercial information.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>36. Intellectual Property</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 retains all rights in the CAB8 brand, logo, application, website, software, algorithms, database, platform design, and documentation. Partner receives only a limited right to use the platform for authorized purposes.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>37. Suspension</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may temporarily suspend a Partner for expired documents, safety complaints, fraud investigation, payment issues, repeated cancellations, poor service, regulatory concerns, customer complaints, security concerns, or Agreement violation.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>38. Immediate Deactivation</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may immediately restrict access where reasonably necessary for a serious safety threat, fraud, violence, criminal conduct, identity fraud, serious regulatory violation, platform manipulation, or misuse of customer data. Subject to applicable law, CAB8 may investigate before restoring access.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>39. Termination</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Either Party may terminate the relationship subject to outstanding obligations. Termination does not automatically eliminate outstanding payments, tax obligations, confidentiality, data obligations, indemnification, dispute obligations, or liability arising before termination.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>40. Indemnity</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  To the extent permitted by law, Partner agrees to indemnify CAB8 against claims arising from Partner's negligence, fraud, misconduct, illegal operation, vehicle non-compliance, document fraud, breach of Agreement, unauthorized collection, violation of customer privacy, employment/driver disputes attributable to Partner, and tax violations attributable to Partner.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>41. Limitation of Liability</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  To the maximum extent permitted by law, CAB8 shall not be liable for indirect or consequential losses arising solely from the Partner's independent transportation operations. Nothing excludes liability that cannot legally be excluded.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>42. Force Majeure</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Neither Party shall be responsible for failure caused by circumstances beyond reasonable control, including natural disasters, landslides, floods, earthquakes, war, riots, government restrictions, internet failures, telecommunications failures, major cyber incidents, road closures, and extreme weather.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>43. Records</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may maintain electronic records of bookings, GPS, payments, communications, cancellations, ratings, complaints, and Partner activity. Electronic records may be used for operational, accounting, dispute and compliance purposes, subject to applicable law.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>44. Electronic Acceptance</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  Clicking "I Agree" or electronically accepting this Agreement constitutes acceptance to the extent legally valid. The Partner may be required to complete electronic KYC and verification before activation.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>45. Changes</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  CAB8 may update operational policies. Material contractual changes may be communicated through the Partner application, dashboard, email, or other reasonable means.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>46. Governing Law</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  This Agreement shall be governed by the laws of India. Subject to applicable law, courts having jurisdiction over <strong>Mandi, Himachal Pradesh</strong> shall have jurisdiction.
                </p>
              </div>

              <div className="agr-card">
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#60A5FA", margin: "0 0 6px" }}>47. Entire Agreement</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                  This Master Agreement together with the applicable Schedule, CAB8 Terms, Privacy Policy, Cancellation & Refund Policy and applicable commercial terms constitutes the agreement between CAB8 and Partner regarding platform participation. If a Schedule specifically modifies a provision of this Master Agreement for that Partner category, the Schedule shall prevail for that specific matter.
                </p>
              </div>

              {/* 48. Partner Acknowledgement - Special Highlight Card */}
              <div className="agr-card" style={{ gridColumn: "1 / -1", borderLeft: "4px solid #10B981", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(10, 22, 40, 0.8))" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#34D399", margin: "0 0 8px" }}>48. Partner Acknowledgement</h3>
                <p style={{ fontSize: 12, color: "#CBD5E1", margin: "0 0 8px" }}>
                  By accepting this Agreement, Partner confirms that:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                  {[
                    "Information provided is accurate",
                    "Required documents are genuine",
                    "Partner has read the Agreement",
                    "Partner agrees to applicable CAB8 policies",
                    "Partner understands commission/fee arrangements",
                    "Partner understands transportation-law compliance is mandatory",
                    "Partner agrees to comply with applicable safety requirements",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#A7F3D0" }}>
                      <span style={{ color: "#34D399", fontWeight: 900 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SCHEDULE A ── */}
        {activeTab === "sa" && (
          <div className="disc-card animate-fade" style={{ borderLeft: "4px solid #3B82F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🚗</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#60A5FA", margin: 0 }}>6. Schedule A — Individual Driver Partner</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>This Schedule applies to an individual driver operating one or more personally owned/authorized vehicles.</p>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.8 }}>
              <li><strong>A1. Eligibility.</strong> Driver must satisfy CAB8 onboarding requirements.</li>
              <li><strong>A2. Driver Identity.</strong> The Driver may not permit another individual to operate under the Driver's verified identity.</li>
              <li><strong>A3. Vehicle.</strong> Each vehicle must be separately registered and approved by CAB8.</li>
              <li><strong>A4. Earnings.</strong> Driver earnings shall be calculated according to the applicable CAB8 commercial model.</li>
              <li><strong>A5. Commission.</strong> The applicable commission shall be displayed during onboarding or in the Driver Dashboard.</li>
              <li><strong>A6. Cash.</strong> Driver must accurately reconcile cash rides.</li>
              <li><strong>A7. Expenses.</strong> Unless otherwise agreed, Driver bears ordinary operating expenses including fuel/charging, maintenance, insurance, vehicle tax, permit, parking where applicable, and repairs.</li>
              <li><strong>A8. Driver Conduct.</strong> Driver must provide professional, safe and respectful service.</li>
              <li><strong>A9. Personal Responsibility.</strong> Driver remains responsible for legally required documents and permissions.</li>
            </ul>
          </div>
        )}

        {/* ── TAB 3: SCHEDULE B ── */}
        {activeTab === "sb" && (
          <div className="disc-card animate-fade" style={{ borderLeft: "4px solid #F59E0B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🚌</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#FBBF24", margin: 0 }}>7. Schedule B — Fleet Owner Partner</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>This Schedule applies to an entity/person operating multiple vehicles and/or drivers.</p>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.8 }}>
              <li><strong>B1. Fleet Account.</strong> Fleet Owner may operate a centralized CAB8 account.</li>
              <li><strong>B2. Fleet Vehicles.</strong> Fleet Owner must register each vehicle separately.</li>
              <li><strong>B3. Fleet Drivers.</strong> Every Driver operating a Fleet vehicle must be independently verified where required.</li>
              <li><strong>B4. Fleet Owner Responsibility.</strong> Fleet Owner is responsible for ensuring that its drivers are properly licensed, are authorized, have required documents, follow safety policies, and use approved vehicles.</li>
              <li><strong>B5. Driver Replacement.</strong> Fleet Owner must notify CAB8 before replacing a driver where identity verification is required.</li>
              <li><strong>B6. Fleet Settlement.</strong> CAB8 may settle earnings to the Fleet Owner's registered account.</li>
              <li><strong>B7. Fleet-Level Liability.</strong> The Fleet Owner remains responsible for obligations attributable to its fleet operations to the extent permitted by law.</li>
              <li><strong>B8. Fleet Suspension.</strong> CAB8 may suspend an individual vehicle, an individual driver, or the entire fleet, depending upon the nature of the issue.</li>
            </ul>
          </div>
        )}

        {/* ── TAB 4: SCHEDULE C ── */}
        {activeTab === "sc" && (
          <div className="disc-card animate-fade" style={{ borderLeft: "4px solid #10B981" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🏛️</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#34D399", margin: 0 }}>8. Schedule C — Taxi Union / Association Partner</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>Permits CAB8 to integrate with taxi unions, operator associations, and organized groups.</p>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.8 }}>
              <li><strong>C1. Purpose.</strong> This Schedule permits CAB8 to work with a taxi union, association or organized transportation group.</li>
              <li><strong>C2. Union Representation.</strong> The union must provide appropriate authorization showing its authority to represent participating members where required.</li>
              <li><strong>C3. Member Registration.</strong> Each participating driver/vehicle may require individual CAB8 verification.</li>
              <li><strong>C4. No Automatic Verification.</strong> Union membership does not automatically replace CAB8's KYC, vehicle or driver verification requirements.</li>
              <li><strong>C5. Union Responsibilities.</strong> The union shall, where applicable, assist in member communication, encourage compliance, support dispute resolution, cooperate with CAB8, and assist in document verification.</li>
              <li><strong>C6. Individual Responsibility.</strong> Each Driver remains responsible for driving licence, vehicle documents, insurance, safety, customer service, and applicable law.</li>
              <li><strong>C7. Commercial Arrangement.</strong> CAB8 may offer union-specific commissions, subscription pricing, group incentives, fleet-style settlement, and special partner programmes, subject to written commercial terms.</li>
            </ul>
          </div>
        )}

        {/* ── TAB 5: SCHEDULE D ── */}
        {activeTab === "sd" && (
          <div className="disc-card animate-fade" style={{ borderLeft: "4px solid #8B5CF6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🏢</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#A78BFA", margin: 0 }}>9. Schedule D — Corporate Fleet / Business Partner</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>Applies to companies, institutions and organizations using CAB8 for employee or business transportation.</p>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.8 }}>
              <li><strong>D1. Corporate Partner.</strong> This Schedule applies to companies, institutions and organizations using CAB8 for employee or business transportation.</li>
              <li><strong>D2. Corporate Account.</strong> CAB8 may provide a corporate dashboard, employee profiles, booking controls, cost centres, monthly reports, digital invoices, ride monitoring, and travel policies.</li>
              <li><strong>D3. Billing.</strong> Corporate billing may operate through prepaid balance, credit facility, monthly invoice, or per-ride billing, subject to approved commercial terms.</li>
              <li><strong>D4. Credit.</strong> CAB8 is not required to provide credit unless expressly approved. CAB8 may suspend credit facilities where invoices remain unpaid.</li>
              <li><strong>D5. Employee Information.</strong> Corporate Partner must ensure that employee information supplied to CAB8 is lawfully provided.</li>
              <li><strong>D6. Corporate Cancellation.</strong> Corporate customers remain subject to applicable cancellation rules unless a separate SLA provides otherwise.</li>
              <li><strong>D7. SLA.</strong> CAB8 may execute a separate Service Level Agreement for major corporate accounts.</li>
            </ul>
          </div>
        )}

        {/* ── TAB 6: SCHEDULE E ── */}
        {activeTab === "se" && (
          <div className="disc-card animate-fade" style={{ borderLeft: "4px solid #06B6D4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>✈️</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#22D3EE", margin: 0 }}>10. Schedule E — Travel Agency / Third-Party Transport Operator</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>For travel agencies, tour operators, and hotels utilizing CAB8 fleet supply for guest transfers.</p>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.8 }}>
              <li><strong>E1. Partner Role.</strong> The Partner may use CAB8 technology or transportation supply for customers acquired through its own business.</li>
              <li><strong>E2. Booking Responsibility.</strong> The applicable commercial agreement shall determine whether CAB8 owns the passenger relationship, Partner owns the passenger relationship, or both Parties jointly facilitate the booking.</li>
              <li><strong>E3. Wholesale Rates.</strong> CAB8 may provide Partner-specific rates.</li>
              <li><strong>E4. Customer Information.</strong> Partner must provide accurate passenger information necessary for fulfilment.</li>
              <li><strong>E5. Cancellation.</strong> The applicable cancellation rules shall be communicated before booking.</li>
              <li><strong>E6. Settlement.</strong> Settlement may occur per booking, weekly, monthly, on a prepaid basis, or according to a commercial agreement.</li>
              <li><strong>E7. Resale.</strong> Partner may not represent CAB8 services inaccurately or make unauthorized promises regarding fares, refunds or service availability.</li>
              <li><strong>E8. Branding.</strong> Use of CAB8 branding requires authorization.</li>
              <li><strong>E9. Passenger Complaints.</strong> Partner shall cooperate with CAB8 in resolving passenger complaints.</li>
              <li><strong>E10. Fraud.</strong> Fake bookings, duplicate bookings, manipulated fares or fraudulent claims may result in immediate suspension.</li>
            </ul>
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
            { href: "/legal/disclaimer", label: "⚠️ Disclaimer" },
            { href: "/legal/refund", label: "💳 Refund Policy" },
            { href: "/legal/contact", label: "📞 Contact Us" },
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
