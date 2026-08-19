"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { driverApi, DriverProfile } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";

interface UnionAppRecord {
  id: string;
  name: string;
  phone: string;
  city: string;
  district?: string;
  vehicle: string;
  plate: string;
  experience?: string;
  licenseNo?: string;
  make?: string;
  model?: string;
  year?: string;
  docs?: string[];
  docPhotos?: Record<string, string>;
  note?: string;
  applied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const UNION_BENEFITS = [
  { icon: "🛡️", title: "Official Police & RTO Protection", desc: "Union legal team assists in local dispute resolution and route permits." },
  { icon: "🚖", title: "Taxi Stand Priority", desc: "Authorized access to official taxi stands across all HP districts." },
  { icon: "💵", title: "Regulated Fair Rates", desc: "Guaranteed minimum per-km pricing for hill routes and outstation trips." },
  { icon: "🆘", title: "24x7 Roadside & Medical Aid", desc: "Emergency breakdown and accident relief fund support from fellow drivers." },
];

const HP_UNIONS: { id: string; name: string; city: string; district: string }[] = [];
// ^ placeholder — real data fetched from backend

export default function DriverUnionPage() {
  const router = useRouter();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [unionApp, setUnionApp] = useState<UnionAppRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [liveUnions, setLiveUnions] = useState<{ id: string; name: string; city: string; district: string; short_code?: string }[]>([]);
  const [unionsLoading, setUnionsLoading] = useState(false);

  // Form fields for in-app union application
  const [district, setDistrict] = useState("Shimla");
  const [experience, setExperience] = useState("3 years");
  const [licenseNo, setLicenseNo] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>(["RC Book", "Driving License", "Insurance"]);
  const [note, setNote] = useState("");
  const [selectedUnion, setSelectedUnion] = useState<typeof HP_UNIONS[0] | null>(null);
  const [unionSearch, setUnionSearch] = useState("");
  const [showUnionDropdown, setShowUnionDropdown] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUnionStatus = useCallback(async (driverPhone: string, driverPlate: string) => {
    try {
      const res = await fetch("http://localhost:4001/union/applications");
      if (res.ok) {
        const data = await res.json();
        const apps: UnionAppRecord[] = data.applications || [];
        const cleanPhone = driverPhone.replace(/\D/g, "");
        const found = apps.find(
          (a) => a.phone.replace(/\D/g, "") === cleanPhone || a.plate.toUpperCase() === driverPlate.toUpperCase()
        );
        if (found) {
          setUnionApp(found);
          return;
        }
      }
    } catch {
      // fallback to localStorage
    }

    if (typeof window !== "undefined") {
      const localApps: UnionAppRecord[] = JSON.parse(
        window.localStorage.getItem("union_applications") || "[]"
      );
      const cleanPhone = driverPhone.replace(/\D/g, "");
      const found = localApps.find(
        (a) => a.phone.replace(/\D/g, "") === cleanPhone || a.plate.toUpperCase() === driverPlate.toUpperCase()
      );
      if (found) setUnionApp(found);
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cab8_driver_token")
        : null;
    if (!token) {
      router.replace("/driver/login");
      return;
    }

    // Fetch registered unions from backend
    setUnionsLoading(true);
    fetch("http://localhost:4001/union/list")
      .then(r => r.ok ? r.json() : { unions: [] })
      .then(data => {
        const u = (data.unions || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          short_code: row.short_code,
          city: row.city || row.district,
          district: row.district,
        }));
        setLiveUnions(u);
      })
      .catch(() => {})
      .finally(() => setUnionsLoading(false));

    driverApi
      .getProfile()
      .then((data) => {
        setDriver(data);
        if (data.city) setDistrict(data.city);
        if (data.vehicle_number) setLicenseNo(`HP-DRV-${data.vehicle_number.slice(-4)}`);
        return fetchUnionStatus(data.phone, data.vehicle_number);
      })
      .catch(() => {
        router.replace("/driver/login");
      })
      .finally(() => setLoading(false));
  }, [router, fetchUnionStatus]);

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driver) return;
    setSubmitting(true);
    setErrorMsg(null);

    const appId = "APP-" + Date.now().toString().slice(-6);
    if (!selectedUnion) {
      setErrorMsg("Please select a union to apply to.");
      setSubmitting(false);
      return;
    }
    const newApp: UnionAppRecord = {
      id: appId,
      name: driver.name,
      phone: driver.phone.replace(/\D/g, ""),
      city: selectedUnion.city,
      district: selectedUnion.district,
      vehicle: driver.vehicle_type,
      plate: driver.vehicle_number.toUpperCase(),
      experience,
      licenseNo: licenseNo.toUpperCase(),
      make: (driver as any).vehicle_make || "Taxi",
      model: (driver as any).vehicle_model || "",
      year: String((driver as any).vehicle_year || ""),
      docs: selectedDocs,
      note: note || `Applied to ${selectedUnion.name} via Cab8 Driver App`,
      applied: new Date().toISOString().split("T")[0],
      status: "PENDING",
    };

    try {
      await fetch("http://localhost:4001/union/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      });
    } catch {
      // ignore network err
    }

    if (typeof window !== "undefined") {
      const localApps: UnionAppRecord[] = JSON.parse(
        window.localStorage.getItem("union_applications") || "[]"
      );
      const filtered = localApps.filter(
        (a) => a.phone !== newApp.phone && a.plate !== newApp.plate
      );
      filtered.unshift(newApp);
      window.localStorage.setItem("union_applications", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
    }

    setUnionApp(newApp);
    setShowApplyModal(false);
    setSubmitting(false);
    setSuccessMsg("Union application submitted successfully! Review in progress.");
  }

  function toggleDoc(doc: string) {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  }

  async function withdrawApplication() {
    if (!driver || !unionApp) return;
    // Remove from backend
    try {
      await fetch(`http://localhost:4001/union/applications/${unionApp.id}`, { method: "DELETE" });
    } catch { /* ignore */ }
    // Remove from localStorage
    if (typeof window !== "undefined") {
      const apps: UnionAppRecord[] = JSON.parse(window.localStorage.getItem("union_applications") || "[]");
      const filtered = apps.filter(
        (a) => a.phone.replace(/\D/g, "") !== driver.phone.replace(/\D/g, "") && a.plate.toUpperCase() !== driver.vehicle_number.toUpperCase()
      );
      window.localStorage.setItem("union_applications", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
    }
    setUnionApp(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber/30 border-t-amber animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-deep pb-28 text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #D97706 0%, transparent 70%)" }}
        />
      </div>

      {/* Top Header */}
      <div className="sticky top-0 z-30 border-b border-navy-border bg-navy-deep/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/driver/dashboard"
              className="h-8 w-8 rounded-xl bg-navy-card border border-navy-border flex items-center justify-center text-sm text-muted hover:text-white transition-colors"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">🔰</span>
                <h1 className="font-display text-base font-bold text-white leading-none">
                  HP Taxi Union
                </h1>
              </div>
              <p className="text-[10px] text-muted font-mono mt-0.5">
                Himachal Pradesh State Taxi Union Portal
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber/15 border border-amber/30 text-amber">
            HPTU
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        {successMsg && (
          <div className="rounded-2xl border border-green/30 bg-green/10 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-green">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-green/60 text-sm">✕</button>
          </div>
        )}

        {/* ── Status Card ── */}
        {unionApp ? (
          <div className="rounded-3xl border border-amber/30 bg-gradient-to-b from-[#162744] to-[#0D1B2E] p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber/20 border border-amber/40 flex items-center justify-center text-2xl shadow-inner">
                  🔰
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber font-semibold">
                    Union Membership
                  </span>
                  <h3 className="font-display text-lg font-extrabold text-white">
                    {driver?.name || unionApp.name}
                  </h3>
                  <p className="text-xs text-muted font-mono">{unionApp.plate}</p>
                </div>
              </div>

              <span
                className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
                  unionApp.status === "APPROVED"
                    ? "bg-green/15 border-green/40 text-green"
                    : unionApp.status === "REJECTED"
                    ? "bg-red/15 border-red/40 text-red"
                    : "bg-amber/15 border-amber/40 text-amber animate-pulse"
                }`}
              >
                {unionApp.status === "APPROVED"
                  ? "✓ ACTIVE MEMBER"
                  : unionApp.status === "REJECTED"
                  ? "✕ REJECTED"
                  : "⏳ UNDER REVIEW"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-navy-border/60 text-xs">
              <div className="bg-navy-deep/60 rounded-xl p-2.5 border border-navy-border/40">
                <span className="text-[10px] text-muted block">Application ID</span>
                <span className="font-mono font-bold text-white">{unionApp.id}</span>
              </div>
              <div className="bg-navy-deep/60 rounded-xl p-2.5 border border-navy-border/40">
                <span className="text-[10px] text-muted block">District Chapter</span>
                <span className="font-semibold text-white">{unionApp.city || unionApp.district}</span>
              </div>
              <div className="bg-navy-deep/60 rounded-xl p-2.5 border border-navy-border/40">
                <span className="text-[10px] text-muted block">Applied Date</span>
                <span className="font-mono text-muted">{unionApp.applied}</span>
              </div>
              <div className="bg-navy-deep/60 rounded-xl p-2.5 border border-navy-border/40">
                <span className="text-[10px] text-muted block">Vehicle Type</span>
                <span className="font-semibold text-white">{unionApp.vehicle}</span>
              </div>
            </div>

            {unionApp.status === "PENDING" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-amber/10 border border-amber/25 p-3 flex items-start gap-2.5">
                  <span className="text-amber text-base">ℹ️</span>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Your application is currently being reviewed by the Himachal Pradesh Taxi Union district office. You will receive an SMS update upon verification.
                  </p>
                </div>
                <button
                  onClick={withdrawApplication}
                  className="w-full py-2.5 rounded-xl font-display font-bold text-xs text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>✕</span>
                  <span>Withdraw &amp; Re-submit Application</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not Applied Yet Card */
          <div className="rounded-3xl border border-amber/30 bg-gradient-to-br from-amber-500/10 via-[#0D1B2E] to-[#0A1220] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-amber/20 border border-amber/40 flex items-center justify-center text-2xl">
                🔰
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Join Himachal Pradesh Taxi Union
                </h3>
                <p className="text-xs text-muted">
                  Get official member badges, stand permits, and union protection
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:brightness-105 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] mt-2 flex items-center justify-center gap-2"
            >
              <span>🔰</span>
              <span>Submit Union Membership Form</span>
            </button>
          </div>
        )}

        {/* ── Union Benefits Section ── */}
        <div className="rounded-3xl border border-navy-border bg-navy-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <span>⭐</span>
              <span>Union Member Benefits</span>
            </h3>
            <span className="text-[10px] font-mono text-muted">Official HPTU</span>
          </div>

          <div className="space-y-2.5">
            {UNION_BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-navy-deep border border-navy-border/60 p-3.5 transition-all hover:border-amber/30"
              >
                <span className="text-2xl mt-0.5">{b.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{b.title}</h4>
                  <p className="text-[11px] text-muted leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Union Contacts & Helplines ── */}
        <div className="rounded-3xl border border-navy-border bg-navy-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <span>📞</span>
            <span>Union Helpline & Contacts</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-navy-deep border border-navy-border/60 p-3">
              <span className="text-[10px] text-muted block">Shimla Central Office</span>
              <span className="font-mono font-bold text-white mt-1 block">+91 177 280 4455</span>
              <span className="text-[10px] text-green block mt-0.5">● Mon–Sat 9AM–6PM</span>
            </div>
            <div className="rounded-2xl bg-navy-deep border border-navy-border/60 p-3">
              <span className="text-[10px] text-muted block">24/7 Driver Helpline</span>
              <span className="font-mono font-bold text-amber mt-1 block">1800-180-8294</span>
              <span className="text-[10px] text-amber block mt-0.5">● Emergency Toll-Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── In-App Apply Modal ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-navy-card border border-amber/40 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-navy-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔰</span>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Apply to Taxi Union
                  </h3>
                  <p className="text-[11px] text-muted">Himachal Pradesh Taxi Union</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="h-8 w-8 rounded-xl bg-navy-deep border border-navy-border flex items-center justify-center text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red/10 border border-red/30 p-3 text-xs text-red">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">

              {/* Union Selector */}
              <div>
                <label className="text-muted block mb-1 font-semibold">Select Union *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={unionSearch}
                    onChange={(e) => { setUnionSearch(e.target.value); setShowUnionDropdown(true); setSelectedUnion(null); }}
                    onFocus={() => setShowUnionDropdown(true)}
                    placeholder={unionsLoading ? "Loading unions..." : liveUnions.length === 0 ? "No unions registered yet" : "Search union by name or district..."}
                    disabled={unionsLoading || liveUnions.length === 0}
                    className="w-full rounded-xl bg-navy-deep border border-amber/40 px-3.5 py-2.5 text-white pr-8 focus:outline-none focus:border-amber disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-2.5 text-amber text-sm">{unionsLoading ? "⏳" : "🔍"}</span>

                  {showUnionDropdown && liveUnions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-navy-deep border border-navy-border shadow-2xl max-h-48 overflow-y-auto">
                      {liveUnions
                        .filter(u =>
                          unionSearch === "" ||
                          u.name.toLowerCase().includes(unionSearch.toLowerCase()) ||
                          u.district.toLowerCase().includes(unionSearch.toLowerCase()) ||
                          u.city.toLowerCase().includes(unionSearch.toLowerCase())
                        )
                        .map(u => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => { setSelectedUnion(u); setUnionSearch(u.name); setShowUnionDropdown(false); setDistrict(u.district); }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-amber/10 flex items-center justify-between group"
                          >
                            <div>
                              <span className="text-white font-semibold block">{u.name}</span>
                              <span className="text-muted text-[10px]">📍 {u.district} · {u.city}</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber/60 group-hover:text-amber">{(u as any).short_code || u.id}</span>
                          </button>
                        ))
                      }
                      {liveUnions.filter(u =>
                        unionSearch === "" ||
                        u.name.toLowerCase().includes(unionSearch.toLowerCase()) ||
                        u.district.toLowerCase().includes(unionSearch.toLowerCase()) ||
                        u.city.toLowerCase().includes(unionSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-3 text-muted text-center">No union found matching your search</div>
                      )}
                    </div>
                  )}
                </div>
                {liveUnions.length === 0 && !unionsLoading && (
                  <p className="mt-1.5 text-[11px] text-amber/70">No unions are registered yet. Ask your union admin to register first.</p>
                )}
                {selectedUnion && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-green">
                    <span>✓</span>
                    <span>Selected: <strong>{selectedUnion.name}</strong> — {selectedUnion.district}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-muted block mb-1">Full Name (from driver profile)</label>
                <input
                  type="text"
                  disabled
                  value={driver?.name || ""}
                  className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-slate-300 opacity-80"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    disabled
                    value={driver?.phone || ""}
                    className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-slate-300 opacity-80 font-mono"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Vehicle Plate</label>
                  <input
                    type="text"
                    disabled
                    value={driver?.vehicle_number || ""}
                    className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-slate-300 opacity-80 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Home District *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-white"
                  >
                    {[
                      "Shimla", "Mandi", "Kullu", "Kangra", "Solan", "Bilaspur",
                      "Hamirpur", "Una", "Chamba", "Kinnaur", "Lahaul & Spiti", "Sirmaur"
                    ].map((d) => (
                      <option key={d} value={d} className="bg-navy-deep text-white">{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5 years"
                    className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Driving License Number</label>
                <input
                  type="text"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="e.g. HP-01-2019001234"
                  className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-muted block mb-1.5">Attached Documents</label>
                <div className="flex flex-wrap gap-1.5">
                  {["RC Book", "Driving License", "Insurance", "Aadhaar Card", "PAN Card"].map((d) => {
                    const sel = selectedDocs.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDoc(d)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] border transition-all ${
                          sel
                            ? "bg-green/15 border-green/40 text-green font-bold"
                            : "bg-navy-deep border-navy-border text-muted"
                        }`}
                      >
                        {sel ? "✓ " : "+ "}{d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Note (Optional)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any previous union details or stand preference..."
                  className="w-full rounded-xl bg-navy-deep border border-navy-border px-3.5 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 rounded-xl border border-navy-border bg-navy-deep text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-display font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Bottom Nav */}
      <DriverBottomNav />
    </main>
  );
}
