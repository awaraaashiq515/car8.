"use client";
import { useEffect, useState } from "react";
import { SectionWrapper, Table, Phone, StatusBadge } from "../_components/helpers";
import { fmtDate } from "../_components/helpers";
import type { User } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function UsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  async function load() {
    setLoading(true);
    const d = await (await fetch(`${API}/admin/users`)).json();
    setUsers(d.users || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function filter(rows: User[]) {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(u => [u.name, u.phone, u.role].some(v => String(v ?? "").toLowerCase().includes(q)));
  }

  const rows = filter(users).map(u => [
    u.name || <span style={{ color: "#4A6080" }}>—</span>,
    <Phone key={u.id} p={u.phone} />,
    <StatusBadge key={u.id} s={u.role} />,
    fmtDate(u.created_at),
  ]);

  return (
    <SectionWrapper title="All Users" icon="👥" count={users.length}
      search={search} setSearch={setSearch} onRefresh={load} loading={loading}>
      <Table cols={["Name", "Phone", "Role", "Joined"]} rows={rows} />
    </SectionWrapper>
  );
}
