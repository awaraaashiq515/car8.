"use client";

import { useState } from "react";
import Link from "next/link";

const ENQUIRY_TYPES = [
  "Ride Bookings & Support",
  "Booking Cancellation & Refunds",
  "Fare & Payment Issues",
  "Driver-Related Concerns",
  "Lost Property / Items",
  "Account & Technical Problems",
  "Driver Onboarding & Registration",
  "Fleet & Vehicle Registration",
  "Corporate Transportation",
  "Taxi Union & Associations",
  "Technology & API Partnerships",
  "General Enquiry",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 400);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #0A1E3F 0%, #050D1A 60%, #030712 100%)",
        color: "#E2E8F0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        paddingBottom: "60px",
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
        .contact-card {
          background: rgba(10, 22, 40, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #1E3A5F;
          border-radius: 14px;
          transition: all 0.2s ease;
        }
        .contact-card:hover {
          border-color: #3B82F6;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12);
          transform: translateY(-1px);
        }
        .input-box {
          width: 100%;
          background: #060E1D;
          border: 1px solid #1E3A5F;
          border-radius: 9px;
          padding: 8px 12px;
          font-size: 12.5px;
          color: #FFFFFF;
          outline: none;
          transition: all 0.15s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .input-box:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          background: #081427;
        }
        .input-box::placeholder {
          color: #475569;
          font-size: 12px;
        }
      `}</style>

      {/* Hero Section */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 18px 16px" }} className="animate-fade">
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#60A5FA",
              marginBottom: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            <span>📞</span> 24/7 Dedicated Support &amp; Partnerships
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
            We're Here to <span style={{ color: "#60A5FA" }}>Help</span>
          </h1>

          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
            Whether you are a customer looking for a ride, a driver interested in joining CAB8, a fleet owner, taxi operator, corporate customer, or technology partner, our team would be happy to hear from you.
          </p>
        </div>

        {/* Quick Contact Overview Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          {/* Card 1: Phone */}
          <div className="contact-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#60A5FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                📞
              </div>
              <div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: "#60A5FA", textTransform: "uppercase", margin: 0, letterSpacing: 0.5 }}>Direct Support</p>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Phone Assistance</h3>
              </div>
            </div>
            <a
              href="tel:+918679800074"
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#93C5FD",
                textDecoration: "none",
                fontFamily: "'JetBrains Mono', monospace",
                display: "block",
                marginBottom: 2,
              }}
            >
              +91-8679800074
            </a>
            <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Immediate helpline</p>
          </div>

          {/* Card 2: Business Address */}
          <div className="contact-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34D399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                📍
              </div>
              <div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: "#34D399", textTransform: "uppercase", margin: 0, letterSpacing: 0.5 }}>Headquarters</p>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Business Address</h3>
              </div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: "0 0 1px" }}>Himachal Pradesh, Dist. Mandi</p>
            <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>PIN – 175001, India</p>
          </div>

          {/* Card 3: Brand & Founder */}
          <div className="contact-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#FBBF24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                🚕
              </div>
              <div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: "#FBBF24", textTransform: "uppercase", margin: 0, letterSpacing: 0.5 }}>Ecosystem</p>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>CAB8 – OrderMint</h3>
              </div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: "0 0 1px" }}>
              Founder: <span style={{ color: "#FDE68A" }}>Ritesh Grover</span>
            </p>
            <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
              <a href="https://cab8.in" target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "none" }}>CAB8.in</a> · <a href="https://ordermint.in" target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "none" }}>OrderMint.in</a>
            </p>
          </div>

          {/* Card 4: Tax & Compliance */}
          <div className="contact-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(168, 85, 247, 0.15)",
                  color: "#C084FC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                🏛️
              </div>
              <div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: "#C084FC", textTransform: "uppercase", margin: 0, letterSpacing: 0.5 }}>Verified Legal</p>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>GST &amp; Compliance</h3>
              </div>
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: "#E2E8F0", fontFamily: "'JetBrains Mono', monospace", margin: "0 0 1px" }}>
              02BMAPG7310Q2Z6
            </p>
            <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Commercial Transport</p>
          </div>
        </div>
      </section>

      {/* Main 2-Column Split: Enquiries Breakdown & Interactive Contact Form */}
      <section
        style={{
          maxWidth: 1080,
          margin: "18px auto 0",
          padding: "0 18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
        className="animate-fade"
      >
        {/* Left Column: Dedicated Enquiry Channels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Customer Support Card */}
          <div
            className="contact-card"
            style={{
              padding: "16px 18px",
              borderLeft: "3px solid #10B981",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(10, 22, 40, 0.7))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                🧑‍💼
              </div>
              <h2 style={{ fontSize: 14.5, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>Customer Support</h2>
            </div>
            <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
              For assistance regarding: ride bookings, booking cancellation, fare issues, driver-related concerns, lost items, payment issues, refunds, account issues, and technical problems — please contact the CAB8 support team using the available contact channels.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {["Ride Bookings", "Cancellation & Refunds", "Fare Issues", "Lost Property", "Account Help"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#A7F3D0",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: 5,
                    padding: "2px 7px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Driver & Fleet Partner Card */}
          <div
            className="contact-card"
            style={{
              padding: "16px 18px",
              borderLeft: "3px solid #3B82F6",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(10, 22, 40, 0.7))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#60A5FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                🚗
              </div>
              <h2 style={{ fontSize: 14.5, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>Driver &amp; Fleet Partner Enquiries</h2>
            </div>
            <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
              Interested in joining CAB8? Drivers, taxi owners, fleet operators and transportation businesses can contact us regarding: driver onboarding, fleet registration, vehicle registration, partner requirements, commission structure, business partnerships, corporate transportation, and local taxi operations.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {["Driver Onboarding", "Fleet Registration", "Vehicle Verification", "Commission Rates", "Taxi Operations"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#BFDBFE",
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: 5,
                    padding: "2px 7px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Business & Partnership Enquiries */}
          <div
            className="contact-card"
            style={{
              padding: "16px 18px",
              borderLeft: "3px solid #F59E0B",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(10, 22, 40, 0.7))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#F59E0B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                🤝
              </div>
              <h2 style={{ fontSize: 14.5, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>Business &amp; Partnership Enquiries</h2>
            </div>
            <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
              CAB8 welcomes partnerships with taxi unions, individual taxi operators, fleet owners, hotels, travel agencies, corporate companies, airports, tourism businesses, technology providers, and local transportation businesses.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {["Taxi Unions", "Hotels & Resorts", "Travel Agencies", "Corporate Commute", "API & Tech Integrations"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#FDE68A",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: 5,
                    padding: "2px 7px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Detailed Brand Entity Box */}
          <div
            className="contact-card"
            style={{
              padding: "16px 18px",
              background: "rgba(6, 14, 28, 0.8)",
            }}
          >
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "#60A5FA", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px", fontFamily: "'JetBrains Mono', monospace" }}>
              🏢 CAB8 – OrderMint Entity Info
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, fontSize: 12, color: "#CBD5E1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Brand</span>
                <strong style={{ color: "#FFFFFF" }}>CAB8</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Parent Brand</span>
                <a href="https://ordermint.in" target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "none", fontWeight: 600 }}>OrderMint.in</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Website</span>
                <a href="https://cab8.in" target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "none", fontWeight: 600 }}>CAB8.in</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Founder</span>
                <strong style={{ color: "#FFFFFF" }}>Ritesh Grover</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Business Address</span>
                <span style={{ color: "#FFFFFF", textAlign: "right" }}>Himachal Pradesh, District Mandi, PIN – 175001</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1A2E45", paddingBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Phone</span>
                <a href="tel:+918679800074" style={{ color: "#60A5FA", textDecoration: "none", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>+91-8679800074</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2 }}>
                <span style={{ color: "#64748B" }}>GSTIN</span>
                <span style={{ color: "#34D399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>02BMAPG7310Q2Z6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div
          className="contact-card"
          style={{
            padding: "20px 22px",
            background: "linear-gradient(180deg, #0D1E38 0%, #08152B 100%)",
            border: "1px solid #234775",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
            position: "sticky",
            top: 90,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                boxShadow: "0 0 12px rgba(59, 130, 246, 0.4)",
              }}
            >
              📬
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>Contact Form</h2>
          </div>
          <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "0 0 16px" }}>
            Send us a direct message and our team will get back to you promptly.
          </p>

          {sent ? (
            <div style={{ textAlign: "center", padding: "28px 12px" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid #10B981",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  margin: "0 auto 12px",
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px" }}>Message Sent Successfully!</h3>
              <p style={{ fontSize: 12, color: "#94A3B8", maxWidth: 320, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Thank you for contacting CAB8. Our support team will review your message and reach out shortly.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", phone: "", email: "", subject: "", message: "" });
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 9,
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.35)",
                  color: "#60A5FA",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Name & Mobile in 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Name <span style={{ color: "#F87171" }}>*</span>
                  </label>
                  <input
                    required
                    className="input-box"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Mobile Number <span style={{ color: "#F87171" }}>*</span>
                  </label>
                  <input
                    required
                    className="input-box"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input-box"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                  Subject <span style={{ color: "#F87171" }}>*</span>
                </label>
                <select
                  required
                  className="input-box"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  style={{ color: form.subject ? "#FFFFFF" : "#64748B", cursor: "pointer" }}
                >
                  <option value="" disabled>
                    Select enquiry type
                  </option>
                  {ENQUIRY_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: "#081427", color: "#FFFFFF" }}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                  Message <span style={{ color: "#F87171" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="input-box"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Write your message"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Security Warning Notice */}
              <div
                style={{
                  padding: "8px 11px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>🔒</span>
                <p style={{ margin: 0, fontSize: 10.5, color: "#FCA5A5", lineHeight: 1.45 }}>
                  <strong>Important:</strong> Please do not submit passwords, OTPs, bank PINs, or card PINs through this contact form.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
                  border: "1px solid rgba(147, 197, 253, 0.3)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 0 16px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {isSubmitting ? "Sending..." : "Send Message 🚀"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Bottom Legal Navigation Bar */}
      <section style={{ maxWidth: 1080, margin: "40px auto 0", padding: "0 18px", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
          Related Legal &amp; Policy Documents
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {[
            { href: "/legal/terms", label: "📜 Terms & Conditions" },
            { href: "/legal/privacy", label: "🔒 Privacy Policy" },
            { href: "/legal/disclaimer", label: "⚠️ Disclaimer" },
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
