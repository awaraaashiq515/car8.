"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UnionBottomNav from "@/components/UnionBottomNav";
import { api, GstInvoice, UnionBooking } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtRupee(v: number) {
  if (!v) return "₹0";
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(2)}K`;
  return `₹${v.toFixed(2)}`;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const G = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

  .inv-row {
    background: #0D1B2E;
    border-radius: 16px;
    border: 1px solid #1A2E45;
    padding: 14px 16px;
    transition: all 0.2s;
    animation: fadeUp 0.3s ease both;
    cursor: pointer;
  }
  .inv-row:hover { transform: translateY(-2px); border-color: rgba(245,158,11,0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

  .stat-card {
    background: #0D1B2E;
    border-radius: 18px;
    border: 1px solid #1A2E45;
    padding: 14px 16px;
    animation: fadeUp 0.4s ease both;
  }
`;

export default function UnionBillingPage() {
  const router = useRouter();
  const [unionId,    setUnionId]   = useState<string | null>(null);
  const [unionName,  setUnionName] = useState("Union");
  const [invoices,   setInvoices]  = useState<GstInvoice[]>([]);
  const [stats,      setStats]     = useState({ total_invoices: 0, total_revenue: 0, total_gst_collected: 0, total_base_fare: 0, pending_bills: 0 });
  const [bookings,   setBookings]  = useState<UnionBooking[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [toast,      setToast]     = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [search,     setSearch]    = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id   = window.localStorage.getItem("cab8_union_id") || "HPTU";
    const name = window.localStorage.getItem("cab8_union_name") || "Union";
    if (!window.localStorage.getItem("cab8_union_token")) {
      router.replace("/union/login");
      return;
    }
    setUnionId(id);
    setUnionName(name);
  }, [router]);

  async function loadData() {
    if (!unionId) return;
    setLoading(true);
    try {
      const [invRes, statsRes, bookRes] = await Promise.all([
        api.getInvoices(unionId, undefined, yearFilter),
        api.getInvoiceStats(unionId, yearFilter),
        api.getUnionBookings(unionId, "COMPLETED"),
      ]);
      setInvoices(invRes.invoices || []);
      setStats(statsRes);
      setBookings(bookRes.bookings || []);
    } catch (e) {
      console.error("Failed to load billing data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (unionId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unionId, yearFilter]);

  async function handleGenerateInvoice(rideId: string) {
    if (!unionId) return;
    setGenerating(rideId);
    try {
      const res = await api.generateInvoice(rideId, unionId);
      showToast(res.already_existed ? "Invoice already exists!" : `✅ Invoice ${res.invoice.invoice_number} generated!`);
      await loadData();
    } catch (e: any) {
      showToast("❌ Failed: " + (e?.message || "Unknown error"));
    } finally {
      setGenerating(null);
    }
  }

  async function handleGenerateAll() {
    if (!unionId) return;
    const billed = new Set(invoices.map(i => i.ride_id));
    const unbilled = bookings.filter(b => !billed.has(b.id) && b.status === "COMPLETED");
    for (const b of unbilled) {
      await handleGenerateInvoice(b.id);
    }
    showToast(`✅ Generated bills for ${unbilled.length} rides!`);
  }

  const billedRideIds = new Set(invoices.map(i => i.ride_id));
  const unbilledBookings = bookings.filter(b => !billedRideIds.has(b.id));

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.driver_name?.toLowerCase().includes(q) ||
      inv.customer_phone?.includes(q)
    );
  });

  const years = ["2025", "2026", "2027"];

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 100 }}>
      <style>{G}</style>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 280, borderRadius: "50%", opacity: 0.08,
          background: "radial-gradient(ellipse, #10B981 0%, transparent 65%)",
        }} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, background: "#0D1B2E", border: "1px solid #10B981",
          borderRadius: 14, padding: "10px 20px", fontSize: 13, fontWeight: 600,
          color: "#34D399", boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
          backdropFilter: "blur(10px)",
        }}>
          {toast}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 16, fontSize: 22,
              background: "linear-gradient(135deg, #059669, #10B981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(16,185,129,0.4)",
            }}>🧾</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                GST <span style={{ color: "#10B981" }}>Billing</span>
              </h1>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, fontFamily: "var(--font-mono)" }}>
                {unionName} · HSN 996411 · 5% GST
              </p>
            </div>
          </div>

          {/* Year Filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {years.map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                style={{
                  padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  fontFamily: "var(--font-mono)", cursor: "pointer",
                  background: yearFilter === y ? "rgba(16,185,129,0.2)" : "#0D1B2E",
                  border: `1px solid ${yearFilter === y ? "#10B981" : "#1A2E45"}`,
                  color: yearFilter === y ? "#34D399" : "#6B7280",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div className="stat-card" style={{ borderColor: "rgba(16,185,129,0.2)", animationDelay: "0ms" }}>
            <p style={{ fontSize: 10, color: "#10B981", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>
              📄 Total Bills
            </p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", margin: 0 }}>
              {stats.total_invoices}
            </p>
          </div>

          <div className="stat-card" style={{ borderColor: "rgba(6,182,212,0.2)", animationDelay: "60ms" }}>
            <p style={{ fontSize: 10, color: "#06B6D4", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>
              💰 Total Revenue
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", margin: 0 }}>
              {fmtRupee(stats.total_revenue)}
            </p>
          </div>

          <div className="stat-card" style={{ borderColor: "rgba(245,158,11,0.2)", animationDelay: "120ms" }}>
            <p style={{ fontSize: 10, color: "#F59E0B", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>
              🏦 GST Collected
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)", margin: 0 }}>
              {fmtRupee(stats.total_gst_collected)}
            </p>
            <p style={{ fontSize: 9, color: "#94A3B8", fontFamily: "var(--font-mono)", margin: "2px 0 0" }}>
              CGST + SGST @ 2.5% each
            </p>
          </div>

          <div className="stat-card" style={{ borderColor: "rgba(239,68,68,0.2)", animationDelay: "180ms" }}>
            <p style={{ fontSize: 10, color: "#F87171", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>
              ⏳ Pending Bills
            </p>
            <p style={{ fontSize: 26, fontWeight: 800, color: stats.pending_bills > 0 ? "#EF4444" : "#10B981", fontFamily: "var(--font-display)", margin: 0 }}>
              {stats.pending_bills}
            </p>
          </div>
        </div>

        {/* Unbilled Rides Banner */}
        {unbilledBookings.length > 0 && (
          <div style={{
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 16, padding: "12px 14px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <p style={{ fontSize: 12, color: "#FDE68A", fontWeight: 700, margin: "0 0 2px" }}>
                ⚠️ {unbilledBookings.length} completed ride{unbilledBookings.length !== 1 ? "s" : ""} without invoice
              </p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, fontFamily: "var(--font-mono)" }}>
                Generate bills to maintain proper GST records
              </p>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={!!generating}
              style={{
                flexShrink: 0, padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                background: "linear-gradient(135deg, #D97706, #F59E0B)", border: "none",
                color: "#1A0A00", cursor: "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "Generating…" : "📄 Generate All"}
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, invoice no., phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#0D1B2E", border: "1px solid #1A2E45",
              borderRadius: 12, padding: "10px 14px 10px 38px",
              fontSize: 13, color: "#fff", outline: "none",
              fontFamily: "var(--font-body)", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Invoice List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Generated Invoices ({filteredInvoices.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #1A2E45", borderTopColor: "#10B981", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              <p style={{ fontSize: 12, color: "#64748B", marginTop: 10 }}>Loading invoices…</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{
              background: "#0D1B2E", border: "1px dashed #1A2E45", borderRadius: 20,
              padding: "48px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>🧾</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                No Invoices Yet
              </p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                Complete rides will appear here once billed
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv, i) => (
              <Link
                key={inv.id}
                href={`/union/billing/${inv.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="inv-row" style={{ animationDelay: `${i * 30}ms` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)",
                        color: "#10B981", background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.25)", padding: "2px 8px", borderRadius: 6,
                      }}>
                        {inv.invoice_number}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
                      ₹{inv.total_amount.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600, margin: "0 0 2px" }}>
                        👤 {inv.customer_name || "Customer"}
                        {inv.customer_phone && (
                          <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 6, fontFamily: "var(--font-mono)" }}>
                            {inv.customer_phone}
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 10, color: "#64748B", margin: 0, fontFamily: "var(--font-mono)" }}>
                        📅 {fmtDate(inv.ride_date || inv.created_at)} · 🏦 GST ₹{(inv.cgst_amount + inv.sgst_amount).toFixed(2)} · 📍 {inv.distance_km?.toFixed(1)} km
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, color: "#94A3B8", padding: "4px 8px",
                      background: "rgba(255,255,255,0.04)", borderRadius: 8,
                    }}>
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Unbilled Completed Rides */}
        {unbilledBookings.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 8 }}>
              Completed Rides — No Invoice ({unbilledBookings.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unbilledBookings.map((b, i) => (
                <div
                  key={b.id}
                  style={{
                    background: "#0D1B2E", border: "1px dashed rgba(245,158,11,0.3)",
                    borderRadius: 14, padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600, margin: "0 0 2px" }}>
                      👤 {b.customer_name || "Customer"} · ₹{b.estimated_fare}
                    </p>
                    <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--font-mono)", margin: 0 }} className="truncate">
                      {b.pickup_text.split(",")[0]} → {b.drop_text.split(",")[0]}
                    </p>
                  </div>

                  <button
                    onClick={() => handleGenerateInvoice(b.id)}
                    disabled={generating === b.id}
                    style={{
                      flexShrink: 0, marginLeft: 10, padding: "6px 12px", borderRadius: 10,
                      fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                      background: generating === b.id ? "#334155" : "linear-gradient(135deg, #059669, #10B981)",
                      color: "#fff",
                    }}
                  >
                    {generating === b.id ? "⏳" : "🧾 Bill"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <UnionBottomNav />
    </main>
  );
}
