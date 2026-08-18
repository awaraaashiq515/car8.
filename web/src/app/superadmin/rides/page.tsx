"use client";
import { useEffect, useState } from "react";
import { SectionWrapper, Table, Phone, StatusBadge } from "../_components/helpers";
import { fmt, fmtDate, truncate } from "../_components/helpers";
import type { Ride } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RidesPage() {
  const [rides,   setRides]   = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");

  async function load() {
    setLoading(true);
    const d = await (await fetch(`${API}/admin/rides`)).json();
    setRides(d.rides || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function filtered() {
    let rows = rides;
    if (filter !== "ALL") rows = rows.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => [r.customer_name, r.driver_name, r.pickup_text, r.drop_text, r.ride_type, r.status].some(v => String(v ?? "").toLowerCase().includes(q)));
    }
    return rows;
  }

  const STATUS_FILTERS = ["ALL", "SEARCHING", "CONFIRMED", "DRIVER_ASSIGNED", "ARRIVED", "ONGOING", "COMPLETED", "CANCELLED"];

  const tableRows = filtered().map(r => [
    <div key={r.id}><p style={{ fontWeight: 500, fontSize: "13px" }}>{r.customer_name}</p><Phone p={r.customer_phone} /></div>,
    r.driver_name
      ? <div key={r.id}><p style={{ fontWeight: 500, fontSize: "13px" }}>{r.driver_name}</p><Phone p={r.driver_phone || ""} /></div>
      : <span style={{ color: "#4A6080" }}>—</span>,
    <div key={r.id}>
      <p style={{ fontSize: "12px", color: "#93B4D4" }}>{truncate(r.pickup_text, 22)}</p>
      <p style={{ fontSize: "11px", color: "#4A6080" }}>→ {truncate(r.drop_text, 22)}</p>
    </div>,
    <div key={r.id}><StatusBadge s={r.ride_type} /><br /><span style={{ color: "#4A6080", fontSize: "10px" }}>{r.vehicle_type}</span></div>,
    <span key={r.id} style={{ color: "#93B4D4", fontSize: "13px" }}>{r.distance_km.toFixed(1)} km</span>,
    <div key={r.id}>
      <p style={{ fontWeight: 600, fontSize: "13px" }}>{fmt(r.final_fare || r.estimated_fare)}</p>
      {!r.final_fare && <p style={{ fontSize: "10px", color: "#4A6080" }}>est.</p>}
    </div>,
    <StatusBadge key={r.id} s={r.status} />,
    fmtDate(r.created_at),
  ]);

  const extra = (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {STATUS_FILTERS.map(s => (
        <button key={s} onClick={() => setFilter(s)}
          style={{ padding: "4px 10px", borderRadius: "999px", border: "1px solid", borderColor: filter === s ? "rgba(37,99,235,0.6)" : "rgba(26,46,69,0.6)", background: filter === s ? "rgba(37,99,235,0.15)" : "transparent", color: filter === s ? "#60A5FA" : "#4A6080", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <SectionWrapper title="All Rides" icon="🎟️" count={filtered().length}
      search={search} setSearch={setSearch} onRefresh={load} loading={loading} extra={extra}>
      <Table cols={["Customer", "Driver", "Route", "Type", "Dist", "Fare", "Status", "Date"]} rows={tableRows} />
    </SectionWrapper>
  );
}
