"use client";
import { useEffect, useState } from "react";
import { SectionWrapper, Table, Phone, StatusBadge } from "../_components/helpers";
import type { Driver } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const d = await (await fetch(`${API}/admin/drivers`)).json();
    setDrivers(d.drivers || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleVerify(id: string, cur: number) {
    await fetch(`${API}/admin/drivers/${id}/verify`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: cur ? 0 : 1 }),
    });
    setToast(cur ? "Driver un-verified" : "Driver verified ✓");
    setTimeout(() => setToast(null), 3000);
    load();
  }

  function filter(rows: Driver[]) {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(d => [d.name, d.phone, d.city, d.vehicle_number, d.vehicle_type].some(v => String(v ?? "").toLowerCase().includes(q)));
  }

  const rows = filter(drivers).map(d => [
    d.name,
    <Phone key={d.id} p={d.phone} />,
    d.city,
    <StatusBadge key={d.id} s={d.vehicle_type} />,
    <code key={d.id} style={{ color: "#06B6D4", fontSize: "12px" }}>{d.vehicle_number}</code>,
    <StatusBadge key={d.id} s={d.is_verified ? "APPROVED" : "PENDING"} />,
    <StatusBadge key={d.id} s={d.is_online ? "ONLINE" : "OFFLINE"} />,
    <span key={d.id} style={{ color: "#F59E0B", fontWeight: 600, fontSize: "13px" }}>⭐ {d.rating_avg.toFixed(1)}</span>,
    <button key={d.id} onClick={() => toggleVerify(d.id, d.is_verified)}
      style={{ padding: "4px 12px", borderRadius: "8px", border: "1px solid", borderColor: d.is_verified ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)", background: d.is_verified ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: d.is_verified ? "#F87171" : "#34D399", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
      {d.is_verified ? "Un-verify" : "Verify ✓"}
    </button>,
  ]);

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", padding: "12px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          ✅ {toast}
        </div>
      )}
      <SectionWrapper title="All Drivers" icon="🚗" count={drivers.length}
        search={search} setSearch={setSearch} onRefresh={load} loading={loading}>
        <Table cols={["Name", "Phone", "City", "Vehicle", "Plate", "Verified", "Online", "Rating", "Action"]} rows={rows} />
      </SectionWrapper>
    </>
  );
}
