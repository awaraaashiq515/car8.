"use client";
import { useEffect, useState } from "react";
import { SectionWrapper, Table, Phone, StatusBadge } from "../_components/helpers";
import { fmt, truncate } from "../_components/helpers";
import type { BoardPost } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BoardPage() {
  const [posts,   setPosts]   = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  async function load() {
    setLoading(true);
    const d = await (await fetch(`${API}/admin/board`)).json();
    setPosts(d.posts || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function filter(rows: BoardPost[]) {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(p => [p.poster_name, p.from_text, p.to_text].some(v => String(v ?? "").toLowerCase().includes(q)));
  }

  const rows = filter(posts).map(p => [
    <div key={p.id}><p style={{ fontWeight: 500, fontSize: "13px" }}>{p.poster_name}</p><Phone p={p.poster_phone} /></div>,
    <div key={p.id}>
      <p style={{ fontSize: "12px", color: "#93B4D4" }}>{truncate(p.from_text, 22)}</p>
      <p style={{ fontSize: "11px", color: "#4A6080" }}>→ {truncate(p.to_text, 22)}</p>
    </div>,
    p.travel_date,
    <span key={p.id} style={{ color: "#06B6D4", fontWeight: 600 }}>🪑 {p.seats}</span>,
    p.price_per_seat ? fmt(p.price_per_seat) : <span style={{ color: "#4A6080" }}>—</span>,
    <span key={p.id} style={{ fontWeight: 700, fontSize: "13px", color: p.booking_count > 0 ? "#F59E0B" : "#4A6080" }}>
      {p.booking_count} bookings
    </span>,
    <StatusBadge key={p.id} s={p.status} />,
  ]);

  return (
    <SectionWrapper title="Ride Board Posts" icon="📋" count={posts.length}
      search={search} setSearch={setSearch} onRefresh={load} loading={loading}>
      <Table cols={["Driver", "Route", "Travel Date", "Seats", "Price/Seat", "Bookings", "Status"]} rows={rows} />
    </SectionWrapper>
  );
}
