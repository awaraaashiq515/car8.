"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, GstInvoice } from "@/lib/api";

// ── Styles ────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform:rotate(360deg); } }

  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
    .invoice-sheet { box-shadow: none !important; border: none !important; max-width: 100% !important; }
  }
`;

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDateShort(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const VEHICLE_ICONS: Record<string, string> = {
  SUV: "🚐", SEDAN: "🚙", HATCHBACK: "🚗", LUXURY: "🏎️",
  PICKUP_TRUCK: "🛻", AUTO: "🛺",
};

export default function InvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string;

  const [invoice,  setInvoice]  = useState<GstInvoice | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getInvoice(id)
      .then(inv => { setInvoice(inv); setLoading(false); })
      .catch(e  => { setError(e.message || "Not found"); setLoading(false); });
  }, [id]);

  function handlePrint() { window.print(); }

  function handleCopy() {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.invoice_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!invoice) return;
    const url = `${window.location.origin}/union/billing/${invoice.id}`;
    const msg = encodeURIComponent(
      `*GST Invoice — ${invoice.invoice_number}*\n` +
      `Union: ${invoice.union_name}\n` +
      `Customer: ${invoice.customer_name}\n` +
      `Amount: ₹${invoice.total_amount.toFixed(2)} (incl. 5% GST)\n` +
      `Date: ${fmtDateShort(invoice.ride_date)}\n\n` +
      `View Invoice: ${url}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1A2E45", borderTopColor: "#10B981", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </main>
  );

  if (error || !invoice) return (
    <main style={{ minHeight: "100vh", background: "#050D1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 42 }}>❌</div>
      <p style={{ color: "#EF4444", fontFamily: "var(--font-display)", fontWeight: 700 }}>Invoice Not Found</p>
      <button onClick={() => router.back()} style={{ padding: "8px 20px", borderRadius: 12, background: "#0D1B2E", border: "1px solid #1A2E45", color: "#fff", cursor: "pointer" }}>← Back</button>
    </main>
  );

  const gstTotal = invoice.cgst_amount + invoice.sgst_amount;

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", padding: "24px 16px 120px" }}>
      <style>{G}</style>

      {/* Action Bar */}
      <div
        className="no-print"
        style={{
          maxWidth: 560, margin: "0 auto 20px",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: "#0D1B2E", border: "1px solid #1A2E45", color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <button
          onClick={handleCopy}
          style={{
            padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
            background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)",
            color: "#22D3EE", cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy Invoice No."}
        </button>

        <button
          onClick={handleWhatsApp}
          style={{
            padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
            background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.35)",
            color: "#34D399", cursor: "pointer",
          }}
        >
          📤 Share via WhatsApp
        </button>

        <button
          onClick={handlePrint}
          style={{
            padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800,
            background: "linear-gradient(135deg, #059669, #10B981)", border: "none",
            color: "#fff", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
            fontFamily: "var(--font-display)",
          }}
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* ─────────────────── THE INVOICE SHEET ─────────────────── */}
      <div
        className="invoice-sheet"
        style={{
          maxWidth: 560, margin: "0 auto",
          background: "#fff", borderRadius: 20, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          animation: "fadeUp 0.4s ease both",
          fontFamily: "'Arial', sans-serif",
        }}
      >

        {/* Invoice Header — Union Letterhead */}
        <div style={{
          background: "linear-gradient(135deg, #0F2545, #1E3A5F)",
          padding: "24px 28px 20px",
          borderBottom: "3px solid #F59E0B",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #D97706, #F59E0B)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>🏛️</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>
                    {invoice.union_name || "Taxi Union"}
                  </h2>
                  {invoice.union_address && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94A3B8" }}>
                      {invoice.union_address}
                    </p>
                  )}
                </div>
              </div>
              {invoice.union_gstin && (
                <p style={{ fontSize: 10, color: "#FDE68A", margin: 0, fontWeight: 700 }}>
                  GSTIN: {invoice.union_gstin}
                </p>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{
                fontSize: 11, fontWeight: 900, color: "#F59E0B",
                textTransform: "uppercase", letterSpacing: 2, margin: "0 0 4px",
              }}>
                TAX INVOICE
              </p>
              <p style={{
                fontSize: 14, fontWeight: 800, color: "#fff",
                fontFamily: "monospace", margin: "0 0 2px",
              }}>
                {invoice.invoice_number}
              </p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>
                Date: {fmtDate(invoice.ride_date || invoice.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Billed To + Vehicle */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          padding: "16px 28px",
          borderBottom: "1px solid #E5E7EB",
          background: "#F9FAFB",
          gap: 16,
        }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>
              Billed To
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>
              {invoice.customer_name || "Customer"}
            </p>
            {invoice.customer_phone && (
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                📞 {invoice.customer_phone}
              </p>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>
              Vehicle / Driver
            </p>
            {invoice.vehicle_type && (
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>
                {VEHICLE_ICONS[invoice.vehicle_type] || "🚗"} {invoice.vehicle_type}
              </p>
            )}
            {invoice.vehicle_number && (
              <p style={{ fontSize: 11, color: "#374151", margin: "0 0 2px", fontFamily: "monospace", fontWeight: 700 }}>
                {invoice.vehicle_number}
              </p>
            )}
            {invoice.driver_name && (
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                👨‍✈️ {invoice.driver_name}
              </p>
            )}
          </div>
        </div>

        {/* Route */}
        <div style={{ padding: "14px 28px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
            Trip Route
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{invoice.pickup_text}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{invoice.drop_text}</span>
            </div>
            <p style={{ fontSize: 10, color: "#9CA3AF", margin: "2px 0 0" }}>
              📏 Total Distance: {invoice.distance_km?.toFixed(1) || "—"} km
            </p>
          </div>
        </div>

        {/* Service Description Table */}
        <div style={{ padding: "0 28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F3F4F6", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>
                  Description
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>
                  HSN / SAC
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "12px 12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>Taxi / Radio Cab Service</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6B7280" }}>
                    {invoice.distance_km?.toFixed(1)} km · {invoice.vehicle_type}
                    {invoice.driver_name ? ` · ${invoice.driver_name}` : ""}
                  </p>
                </td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "monospace", color: "#374151", fontWeight: 600 }}>
                  996411
                </td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#111827" }}>
                  {invoice.base_fare.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* GST Breakdown */}
        <div style={{ padding: "12px 28px 20px" }}>
          <div style={{
            background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden",
          }}>
            {[
              { label: "Base Fare (Taxable Value)", value: invoice.base_fare.toFixed(2), bold: false },
              { label: `CGST @ ${(invoice.gst_rate / 2).toFixed(1)}%`, value: invoice.cgst_amount.toFixed(2), bold: false, color: "#1D4ED8" },
              { label: `SGST @ ${(invoice.gst_rate / 2).toFixed(1)}%`, value: invoice.sgst_amount.toFixed(2), bold: false, color: "#1D4ED8" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 12, color: row.color || "#374151", fontWeight: row.bold ? 800 : 500 }}>{row.label}</span>
                <span style={{ fontSize: 12, color: row.color || "#374151", fontWeight: row.bold ? 800 : 600, fontFamily: "monospace" }}>₹{row.value}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between", padding: "12px 16px",
              background: "linear-gradient(135deg, #0F2545, #1E3A5F)",
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#F59E0B" }}>TOTAL (Incl. GST)</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>
                ₹{invoice.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 28px 20px",
          borderTop: "1px solid #E5E7EB",
          background: "#F9FAFB",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>HSN / SAC</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: "monospace", margin: 0 }}>996411</p>
            </div>
            <div>
              <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>GST Rate</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0 }}>5% (No ITC)</p>
            </div>
            <div>
              <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", margin: "0 0 3px" }}>Total GST</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", fontFamily: "monospace", margin: 0 }}>₹{gstTotal.toFixed(2)}</p>
            </div>
          </div>

          <div style={{
            borderTop: "1px dashed #D1D5DB", paddingTop: 10,
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            <p style={{ fontSize: 9, color: "#9CA3AF", margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
              This is a computer-generated GST invoice and does not require a physical signature.
              Service subject to Government of India GST regulations.
            </p>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 9, color: "#9CA3AF", margin: "0 0 2px" }}>Invoice ID</p>
              <p style={{ fontSize: 9, fontFamily: "monospace", color: "#6B7280", margin: 0 }}>{invoice.id}</p>
            </div>
          </div>
        </div>

      </div>
      {/* End Invoice Sheet */}
    </main>
  );
}
