"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { driverApi, Ride } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";

type TimeRange = "today" | "week" | "month" | "year" | "all";

type BarItem = { label: string; amount: number; percent: number };

function getAdaptiveChartBars(range: TimeRange, rides: Ride[]): { bars: BarItem[]; subtitle: string } {
  const completed = rides.filter((r) => r.status === "COMPLETED");

  if (range === "today") {
    // 6 time slots for Today: 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
    const slots = [
      { label: "6 AM",  hStart: 0,  hEnd: 8  },
      { label: "9 AM",  hStart: 9,  hEnd: 11 },
      { label: "12 PM", hStart: 12, hEnd: 14 },
      { label: "3 PM",  hStart: 15, hEnd: 17 },
      { label: "6 PM",  hStart: 18, hEnd: 20 },
      { label: "9 PM",  hStart: 21, hEnd: 23 },
    ];
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRides = completed.filter(r => (r.updated_at || r.created_at || "").startsWith(todayStr));

    const slotAmounts = slots.map(slot => {
      return todayRides
        .filter(r => {
          const h = new Date(r.updated_at || r.created_at).getHours();
          return h >= slot.hStart && h <= slot.hEnd;
        })
        .reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);
    });

    const maxAmt = Math.max(...slotAmounts, 100);
    const bars = slots.map((slot, i) => ({
      label: slot.label,
      amount: slotAmounts[i],
      percent: Math.max(12, Math.min(100, Math.round((slotAmounts[i] / maxAmt) * 100))),
    }));
    return { bars, subtitle: "Hourly Breakdown (Today)" };
  }

  if (range === "week") {
    // 7 Days of Week: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekRides = completed.filter(r => new Date(r.updated_at || r.created_at) >= startOfWeek);

    const dayAmounts = [0, 0, 0, 0, 0, 0, 0];
    weekRides.forEach(r => {
      const d = new Date(r.updated_at || r.created_at);
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      dayAmounts[idx] += (r.final_fare || r.estimated_fare || 0);
    });

    const maxAmt = Math.max(...dayAmounts, 100);
    const bars = days.map((d, i) => ({
      label: d,
      amount: dayAmounts[i],
      percent: Math.max(12, Math.min(100, Math.round((dayAmounts[i] / maxAmt) * 100))),
    }));
    return { bars, subtitle: "Daily Breakdown (This Week)" };
  }

  if (range === "month") {
    // 4 Weeks of Month: W1 (1-7), W2 (8-14), W3 (15-21), W4 (22-31)
    const weeks = [
      { label: "W1 (1-7)",   dStart: 1,  dEnd: 7  },
      { label: "W2 (8-14)",  dStart: 8,  dEnd: 14 },
      { label: "W3 (15-21)", dStart: 15, dEnd: 21 },
      { label: "W4 (22-31)", dStart: 22, dEnd: 31 },
    ];
    const curMonth = new Date().getMonth();
    const curYear  = new Date().getFullYear();
    const monthRides = completed.filter(r => {
      const d = new Date(r.updated_at || r.created_at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const weekAmounts = weeks.map(w => {
      return monthRides
        .filter(r => {
          const dateNum = new Date(r.updated_at || r.created_at).getDate();
          return dateNum >= w.dStart && dateNum <= w.dEnd;
        })
        .reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);
    });

    const maxAmt = Math.max(...weekAmounts, 100);
    const bars = weeks.map((w, i) => ({
      label: w.label,
      amount: weekAmounts[i],
      percent: Math.max(12, Math.min(100, Math.round((weekAmounts[i] / maxAmt) * 100))),
    }));
    return { bars, subtitle: "Weekly Breakdown (This Month)" };
  }

  if (range === "year") {
    // 12 Months: Jan..Dec
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const curYear = new Date().getFullYear();
    const yearRides = completed.filter(r => new Date(r.updated_at || r.created_at).getFullYear() === curYear);

    const monthAmounts = new Array(12).fill(0);
    yearRides.forEach(r => {
      const m = new Date(r.updated_at || r.created_at).getMonth();
      monthAmounts[m] += (r.final_fare || r.estimated_fare || 0);
    });

    const maxAmt = Math.max(...monthAmounts, 100);
    const bars = months.map((m, i) => ({
      label: m,
      amount: monthAmounts[i],
      percent: Math.max(12, Math.min(100, Math.round((monthAmounts[i] / maxAmt) * 100))),
    }));
    return { bars, subtitle: "Monthly Breakdown (This Year)" };
  }

  // "all" time: Years breakdown (e.g. 2024, 2025, 2026, 2027)
  const years = ["2024", "2025", "2026", "2027"];
  const yearAmounts = years.map(y => {
    return completed
      .filter(r => (r.updated_at || r.created_at || "").startsWith(y))
      .reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);
  });

  const maxAmt = Math.max(...yearAmounts, 100);
  const bars = years.map((y, i) => ({
    label: y,
    amount: yearAmounts[i],
    percent: Math.max(12, Math.min(100, Math.round((yearAmounts[i] / maxAmt) * 100))),
  }));
  return { bars, subtitle: "Yearly Breakdown (All Time)" };
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const [rides,         setRides]         = useState<Ride[]>([]);
  const [range,         setRange]         = useState<TimeRange>("month");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("cab8_driver_token") : null;
    if (!token) { router.replace("/driver/login"); return; }

    driverApi.getDriverRides()
      .then((data) => setRides(data))
      .catch((e: any) => setError(e.message || "Failed to load earnings data."))
      .finally(() => setLoading(false));
  }, [router]);

  // Completed rides only
  const completed = rides.filter((r) => r.status === "COMPLETED");

  // Filter rides matching range
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const filteredRides = completed.filter((r) => {
    const rDate = new Date(r.updated_at || r.created_at);
    if (range === "today") {
      return (r.updated_at || r.created_at || "").startsWith(todayStr);
    }
    if (range === "week") {
      return rDate >= startOfWeek;
    }
    if (range === "month") {
      return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
    }
    if (range === "year") {
      return rDate.getFullYear() === currentYear;
    }
    return true; // "all" time
  });

  // Dynamic statistics
  const totalEarnings  = filteredRides.reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0);
  const totalTrips     = filteredRides.length;
  const totalDistance  = filteredRides.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  const avgFare        = totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0;

  // Compute adaptive chart bars and subtitle
  const { bars, subtitle } = getAdaptiveChartBars(range, rides);
  const activeBarData = bars[selectedIndex] || bars[0] || { label: "N/A", amount: 0, percent: 12 };

  // Reset selected index when range changes
  function handleRangeChange(newRange: TimeRange) {
    setRange(newRange);
    setSelectedIndex(0);
  }

  // Month-by-month past earnings archive
  const monthlyMap: Record<string, { count: number; earnings: number; distance: number }> = {};
  completed.forEach((r) => {
    const d = new Date(r.updated_at || r.created_at);
    const monthKey = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { count: 0, earnings: 0, distance: 0 };
    monthlyMap[monthKey].count += 1;
    monthlyMap[monthKey].earnings += (r.final_fare || r.estimated_fare || 0);
    monthlyMap[monthKey].distance += (r.distance_km || 0);
  });

  return (
    <main className="min-h-screen bg-navy-deep pb-24 text-white">


      <div className="relative z-10 mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/driver/dashboard" className="h-9 w-9 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white transition-all">
              ←
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold text-white">Driver Earnings</h1>
              <p className="text-xs text-muted">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => alert("Payout requested via UPI!")}
            className="btn-gradient px-3.5 py-2 text-xs font-bold shadow-lg"
          >
            ⚡ Cashout
          </button>
        </div>

        {/* Range Selector Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl border border-navy-border bg-navy-card mb-5">
          {(["today", "week", "month", "year", "all"] as TimeRange[]).map((r) => {
            const active = range === r;
            const labels: Record<TimeRange, string> = { today: "Today", week: "Week", month: "Month", year: "Year", all: "All" };
            return (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-blue-primary to-cyan-glow text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                    : "text-muted hover:text-white"
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <div className="h-8 w-8 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
            <p className="text-sm font-medium">Loading database earnings…</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-5 animate-fade-up">

            {/* ════════════════════════════════════════════════════════
                DYNAMIC ADAPTIVE BAR CHART CARD
            ════════════════════════════════════════════════════════ */}
            <div className="card relative overflow-hidden border-blue-primary/30 bg-navy-card/90 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(37,99,235,0.15)]">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
                    <span>Total Earnings</span>
                    <span className="badge badge-green text-[9px] px-2 py-0.5">Live</span>
                  </div>
                  <div className="font-display text-3xl font-extrabold text-white mt-1">
                    ₹{totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    Selected: <span className="text-cyan-glow font-semibold">{activeBarData.label}</span>
                  </div>
                </div>

                {/* Selected Slot Amount Pill */}
                <div className="text-right">
                  <div className="inline-block px-3 py-1.5 rounded-xl border border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow font-mono font-bold text-sm">
                    ₹{activeBarData.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted mt-1">Slot Earnings</div>
                </div>
              </div>

              {/* Dynamic Bar Chart Columns */}
              <div className="relative pt-8 pb-2">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-x-0 top-8 border-b border-dashed border-navy-border/60" />
                <div className="absolute inset-x-0 top-20 border-b border-dashed border-navy-border/60" />
                <div className="absolute inset-x-0 top-32 border-b border-dashed border-navy-border/60" />

                {/* Vertical Bar Columns */}
                <div className="relative z-10 flex items-end justify-between px-1 h-44 pb-1">
                  {bars.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setSelectedIndex(idx)}
                        className="flex flex-col items-center flex-1 group focus:outline-none"
                      >
                        {/* Floating Tag */}
                        <div className={`text-[10px] font-bold font-mono transition-all duration-200 mb-1.5 ${
                          isSelected
                            ? "opacity-100 text-cyan-glow -translate-y-1 scale-110"
                            : "opacity-0 group-hover:opacity-100 text-muted"
                        }`}>
                          ₹{item.amount}
                        </div>

                        {/* Bar Pillar Element */}
                        <div className="w-full flex items-end justify-center h-32">
                          <div
                            className={`rounded-t-full transition-all duration-300 ${
                              bars.length > 7 ? "w-3" : "w-5"
                            } ${
                              isSelected
                                ? "bg-gradient-to-t from-blue-primary via-cyan-glow to-green shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-x-110"
                                : "bg-navy-border/70 hover:bg-blue-primary/40"
                            }`}
                            style={{ height: `${item.percent}%` }}
                          />
                        </div>

                        {/* X-Axis Slot Label Pill */}
                        <div className="mt-3">
                          {isSelected ? (
                            <span
                              className="inline-block text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full text-center truncate max-w-[55px]"
                              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", boxShadow: "0 0 10px rgba(6,182,212,0.5)" }}
                            >
                              {item.label}
                            </span>
                          ) : (
                            <span className="inline-block text-muted font-mono text-[10px] font-medium px-0.5 truncate max-w-[50px] group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                KPI METRICS GRID
            ════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3.5 text-center border-navy-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1">Total Trips</div>
                <div className="font-display text-xl font-bold text-white">{totalTrips}</div>
              </div>

              <div className="card p-3.5 text-center border-navy-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1">Avg / Trip</div>
                <div className="font-display text-xl font-bold text-cyan-glow">₹{avgFare}</div>
              </div>

              <div className="card p-3.5 text-center border-navy-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1">Distance</div>
                <div className="font-display text-xl font-bold text-white">{Math.round(totalDistance)} km</div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                PAST MONTHS EARNINGS ARCHIVE
            ════════════════════════════════════════════════════════ */}
            <div className="card space-y-3">
              <h3 className="font-display font-bold text-white text-sm flex items-center justify-between">
                <span>🗓️ Monthly Earnings Statements</span>
                <span className="text-xs text-green font-mono font-normal">Past History</span>
              </h3>

              {Object.keys(monthlyMap).length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  No past completed trip statements found.
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(monthlyMap).map(([month, stat]) => (
                    <div key={month} className="flex items-center justify-between p-3.5 rounded-2xl border border-navy-border bg-navy-deep hover:border-blue-primary/40 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-white">{month}</div>
                        <div className="text-xs text-muted mt-0.5">
                          {stat.count} Completed Trips · {Math.round(stat.distance)} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-green text-base">₹{stat.earnings.toLocaleString()}</div>
                        <div className="text-[10px] text-green/80 font-mono">Paid out ✓</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════
                TRIP RECEIPTS LIST
            ════════════════════════════════════════════════════════ */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-white text-sm">
                  Trip Receipts ({filteredRides.length})
                </h3>
                <Link href="/driver/history" className="text-xs text-blue-light hover:underline font-medium">
                  Full History →
                </Link>
              </div>

              {filteredRides.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No completed trips found in this period.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredRides.map((ride) => {
                    const dateStr = new Date(ride.updated_at || ride.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    });
                    const fare = ride.final_fare || ride.estimated_fare;
                    return (
                      <div key={ride.id} className="p-3.5 rounded-2xl border border-navy-border bg-navy-deep text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted">{dateStr}</span>
                          <span className="font-display font-bold text-sm text-green">₹{fare}</span>
                        </div>
                        <div className="text-white font-medium truncate">📍 {ride.pickup_text} → 🏁 {ride.drop_text}</div>
                        <div className="text-[10px] text-muted flex items-center gap-2">
                          <span>🚘 {ride.vehicle_type}</span>
                          <span>·</span>
                          <span>{ride.distance_km} km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <DriverBottomNav />
    </main>
  );
}
