"use client";
import { useEffect, useState } from "react";
import { ActionBtn, EmptyState, LoadingPulse, StatusBadge } from "../_components/helpers";
import type { UnionApp } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function UnionPage() {
  const [apps,    setApps]    = useState<UnionApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    const d = await (await fetch(`${API}/admin/union`)).json();
    setApps(d.applications || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function notify(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED" | "PENDING") {
    await fetch(`${API}/admin/union/${id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    notify(`Application ${status.toLowerCase()}`);
    load();
  }

  async function deleteApp(id: string) {
    if (!confirm("Delete this application permanently?")) return;
    await fetch(`${API}/admin/union/${id}`, { method: "DELETE" });
    notify("Application deleted");
    load();
  }

  function filter(rows: UnionApp[]) {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(a => [a.name, a.phone, a.city, a.plate, a.status].some(v => String(v ?? "").toLowerCase().includes(q)));
  }

  const filtered = filter(apps);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, background: toast.ok ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", padding: "12px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "adminFadeUp 0.3s ease" }}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>📝 Union Applications</h1>
          <p style={{ color: "#4A6080", fontSize: "12px", marginTop: "2px" }}>{apps.length} total · {apps.filter(a => a.status === "PENDING").length} pending</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Status filters */}
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
            <button key={s} onClick={() => setSearch(s === "ALL" ? "" : s)}
              style={{ padding: "5px 14px", borderRadius: "999px", border: "1px solid", borderColor: search === (s === "ALL" ? "" : s) ? "rgba(37,99,235,0.6)" : "rgba(26,46,69,0.6)", background: search === (s === "ALL" ? "" : s) ? "rgba(37,99,235,0.15)" : "transparent", color: search === (s === "ALL" ? "" : s) ? "#60A5FA" : "#4A6080", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
              {s}
              {s === "PENDING" && apps.filter(a => a.status === "PENDING").length > 0 && (
                <span style={{ marginLeft: "5px", background: "rgba(239,68,68,0.2)", color: "#F87171", padding: "1px 5px", borderRadius: "999px", fontSize: "10px" }}>
                  {apps.filter(a => a.status === "PENDING").length}
                </span>
              )}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #1A2E45", background: "#0A1628", color: "#F0F6FF", fontSize: "13px", outline: "none", width: "180px" }} />
          <button onClick={load} style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #1A2E45", background: "#0A1628", color: "#4A6080", cursor: "pointer", fontSize: "13px" }}>🔄</button>
        </div>
      </div>

      {/* List */}
      {loading ? <LoadingPulse /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map(app => (
            <div key={app.id} style={{ background: "#0A1628", border: "1px solid #1A2E45", borderRadius: "14px", padding: "18px 20px", borderLeft: `3px solid ${app.status === "APPROVED" ? "#10B981" : app.status === "REJECTED" ? "#EF4444" : "#F59E0B"}`, transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                {/* Info */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 700, fontSize: "16px" }}>{app.name}</p>
                    <StatusBadge s={app.status} />
                    <span style={{ color: "#4A6080", fontSize: "11px", fontFamily: "monospace", background: "#0F1E33", padding: "2px 8px", borderRadius: "6px" }}>{app.source}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "5px 20px" }}>
                    {[
                      ["📞", app.phone],
                      ["🏙️", app.city],
                      ["🚗", [app.vehicle, app.make, app.model, app.year ? `(${app.year})` : null].filter(Boolean).join(" ")],
                      ["🔖", app.plate],
                      ["📅", `Applied: ${app.applied}`],
                      app.experience ? ["⏱️", `${app.experience} experience`] : null,
                      app.email ? ["✉️", app.email] : null,
                    ].filter(Boolean).map((pair, i) => (
                      <p key={i} style={{ color: "#6B8BAE", fontSize: "12px" }}>
                        {pair![0]} <span style={{ color: "#93B4D4" }}>{pair![1]}</span>
                      </p>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                  {app.status !== "APPROVED" && <ActionBtn color="#10B981" bg="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" onClick={() => setStatus(app.id, "APPROVED")}>✅ Approve</ActionBtn>}
                  {app.status !== "REJECTED" && <ActionBtn color="#F87171" bg="rgba(239,68,68,0.1)" border="rgba(239,68,68,0.3)" onClick={() => setStatus(app.id, "REJECTED")}>❌ Reject</ActionBtn>}
                  {app.status !== "PENDING"  && <ActionBtn color="#F59E0B" bg="rgba(245,158,11,0.1)" border="rgba(245,158,11,0.3)" onClick={() => setStatus(app.id, "PENDING")}>⏳ Pending</ActionBtn>}
                  <ActionBtn color="#EF4444" bg="rgba(239,68,68,0.05)" border="rgba(239,68,68,0.15)" onClick={() => deleteApp(app.id)}>🗑️</ActionBtn>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState msg="No applications found" />}
        </div>
      )}
    </>
  );
}
