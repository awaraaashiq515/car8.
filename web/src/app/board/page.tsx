"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { boardApi, BoardPost, BoardStatus, PostType } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";
import CustomerBottomNav from "@/components/CustomerBottomNav";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch { return dateStr; }
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const VEHICLE_ICONS: Record<string, string> = {
  HATCHBACK: "🚗", SEDAN: "🚙", SUV: "🚐", LUXURY: "🏎️",
};

// ── Styles ────────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .board-card {
    border-radius: 20px;
    padding: 18px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }
  .board-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.55) !important;
  }
  .tab-btn {
    flex: 1;
    padding: 10px 6px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-mono);
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    letter-spacing: 0.03em;
  }
  .filter-input {
    width: 100%;
    background: #0D1B2E;
    border: 1px solid #1A2E45;
    border-radius: 12px;
    padding: 11px 14px 11px 36px;
    font-size: 13px;
    color: white;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: var(--font-body);
  }
  .filter-input:focus {
    border-color: rgba(37,99,235,0.55);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .filter-input::placeholder { color: #4B5563; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(26,46,69,0.6);
    border: 1px solid #1A2E45;
    color: #94A3B8;
    font-family: var(--font-mono);
    white-space: nowrap;
  }
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    font-family: var(--font-display);
  }
  .section-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #4B5563;
    font-weight: 600;
  }
`;

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isOwn,
  onMarkFilled,
  onDelete,
  index,
}: {
  post: BoardPost;
  isOwn: boolean;
  onMarkFilled: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const isLooking = post.post_type === "LOOKING";
  const accentColor = isLooking ? "#F59E0B" : "#10B981";
  const accentBg = isLooking ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.07)";
  const accentBorder = isLooking ? "rgba(245,158,11,0.22)" : "rgba(16,185,129,0.20)";

  const booked = post.booked_seats || 0;
  const available = Math.max(0, post.seats - booked);
  const pct = post.seats > 0 ? (booked / post.seats) * 100 : 0;

  return (
    <div
      className="board-card"
      style={{
        background: "#0D1B2E",
        border: `1px solid ${accentBorder}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        animation: "cardIn 0.35s ease both",
        animationDelay: `${index * 55}ms`,
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {/* Blue-cyan avatar — same as home page logo style */}
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, boxShadow: "0 0 14px rgba(37,99,235,0.3)",
          }}>🧑‍✈️</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.poster_name}
            </p>
            <p style={{ fontSize: 11, margin: "2px 0 0", fontFamily: "var(--font-mono)", color: accentColor }}>
              Driver · {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        {/* Type badge */}
        <span style={{
          padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, flexShrink: 0,
          fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em",
          background: accentBg, color: accentColor, border: `1px solid ${accentBorder}`,
        }}>
          {isLooking ? "🔍 Looking" : "🚗 Offering"}
        </span>
      </div>

      {/* ── Route block ── */}
      <div style={{
        background: "rgba(5,13,26,0.55)", border: "1px solid #1A2E45",
        borderRadius: 14, padding: "12px 14px", marginBottom: 12,
        display: "flex", gap: 10, alignItems: "stretch",
      }}>
        {/* Timeline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.7)" }} />
          <div style={{ width: 1.5, flex: 1, background: "linear-gradient(180deg,#10B981,#06B6D4)", opacity: 0.3, minHeight: 22, margin: "4px 0" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06B6D4", boxShadow: "0 0 6px rgba(6,182,212,0.7)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.from_text}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.to_text}
          </p>
        </div>
      </div>

      {/* ── Chips row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <span className="chip">📅 {formatDate(post.travel_date)}</span>
        {post.travel_time && <span className="chip">⏰ {post.travel_time}</span>}
        {post.price_per_seat != null && (
          <span className="chip" style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
            ₹{post.price_per_seat.toLocaleString("en-IN")}/seat
          </span>
        )}
        {post.vehicle_type && (
          <span className="chip">{VEHICLE_ICONS[post.vehicle_type] || "🚗"} {post.vehicle_type}</span>
        )}
      </div>

      {/* ── Seat progress bar ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)" }}>
            {available} of {post.seats} seats open
          </span>
          {booked > 0 && (
            <span style={{ fontSize: 11, color: accentColor, fontFamily: "var(--font-mono)" }}>{booked} booked</span>
          )}
        </div>
        <div style={{ height: 5, background: "#1A2E45", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999, transition: "width 0.5s ease",
            width: `${pct}%`,
            background: pct >= 100 ? "#EF4444" : "linear-gradient(90deg, #2563EB, #06B6D4)",
          }} />
        </div>
      </div>

      {/* ── Notes preview ── */}
      {post.notes && (
        <p style={{
          fontSize: 12, color: "#6B7280", lineHeight: 1.6, margin: "0 0 12px",
          background: "rgba(5,13,26,0.4)", border: "1px solid rgba(26,46,69,0.6)",
          borderRadius: 10, padding: "8px 12px",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          💬 {post.notes}
        </p>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 8 }}>
        {isOwn ? (
          <>
            <button
              onClick={() => onMarkFilled(post.id)}
              className="action-btn"
              style={{ flex: 1, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
            >
              ✅ Mark Filled
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="action-btn"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "11px 14px" }}
            >
              🗑️
            </button>
          </>
        ) : (
          <Link
            href={`/board/${post.id}`}
            className="action-btn"
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
              justifyContent: "center",
            }}
          >
            🔍 View Details →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BoardPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"ALL" | PostType>("ALL");
  const [filterFrom, setFrom] = useState("");
  const [filterTo, setTo] = useState("");
  const [isDriver, setIsDriver] = useState(false);

  const loadPosts = useCallback(async (driverMode: boolean) => {
    try {
      const filters: any = {};
      if (tab !== "ALL") filters.post_type = tab;
      if (filterFrom) filters.from = filterFrom;
      if (filterTo) filters.to = filterTo;

      const all = await boardApi.list(filters);
      setPosts(all);

      if (driverMode) {
        const mine = await boardApi.getMyPosts().catch(() => [] as BoardPost[]);
        setMyIds(new Set(mine.map((p) => p.id)));
      } else {
        setMyIds(new Set());
      }
    } catch (e: any) {
      setError(e.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [tab, filterFrom, filterTo]);

  useEffect(() => {
    const custToken = typeof window !== "undefined" ? window.localStorage.getItem("cab8_token") : null;
    const driverToken = typeof window !== "undefined" ? window.localStorage.getItem("cab8_driver_token") : null;
    if (!custToken && !driverToken) { router.replace("/login"); return; }
    const role = typeof window !== "undefined" ? window.localStorage.getItem("cab8_role") : null;
    const drv = !!driverToken || role === "DRIVER";
    setIsDriver(drv);
    loadPosts(drv);
  }, [loadPosts, router]);

  async function handleMarkFilled(id: string) {
    try {
      await boardApi.updateStatus(id, "FILLED" as BoardStatus);
      loadPosts(true);
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await boardApi.deletePost(id);
      loadPosts(true);
    } catch { /* ignore */ }
  }

  const TABS: { value: "ALL" | PostType; label: string; icon: string }[] = [
    { value: "ALL", label: "All Posts", icon: "📋" },
    { value: "LOOKING", label: "Looking", icon: "🔍" },
    { value: "OFFERING", label: "Offering", icon: "🚗" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#050D1A", paddingBottom: 96 }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Ambient glow — blue like home page ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 560, height: 320, borderRadius: "50%", opacity: 0.20,
          background: "radial-gradient(ellipse, #2563EB 0%, transparent 65%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "24px 16px 8px" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24, animation: "fadeSlideUp 0.4s ease both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Blue-cyan icon matching home page logo style */}
            <div style={{
              width: 44, height: 44, borderRadius: 16,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 0 20px rgba(37,99,235,0.3)", flexShrink: 0,
            }}>📋</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
                Ride Board
              </h1>
              <p style={{ fontSize: 12, color: "#4B5563", margin: 0, fontFamily: "var(--font-mono)" }}>
                Browse shared rides by drivers
              </p>
            </div>
          </div>
          {/* Post button — purple accent for the board card, matches home page Ride Board card */}
          {isDriver && (
            <Link
              href="/board/post"
              id="post-ride-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 14,
                fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800, color: "#fff",
                background: "linear-gradient(135deg, #7C3AED, #A855F7)",
                boxShadow: "0 0 18px rgba(168,85,247,0.35)",
                textDecoration: "none", flexShrink: 0,
              }}
            >
              + Post
            </Link>
          )}
        </div>

        {/* ── Tabs — blue active state matching home page ride type selector ── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 14,
          animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms",
        }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="tab-btn"
              style={
                tab === t.value
                  ? {
                    background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(6,182,212,0.2))",
                    color: "#60A5FA",
                    border: "1px solid rgba(37,99,235,0.5)",
                    boxShadow: "0 0 0 1px rgba(37,99,235,0.5)",
                  }
                  : { background: "#0D1B2E", border: "1px solid #1A2E45", color: "#6B7280" }
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Search Filters ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20,
          animation: "fadeSlideUp 0.4s ease both", animationDelay: "100ms",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 8, height: 8, borderRadius: "50%", background: "#10B981",
              boxShadow: "0 0 5px rgba(16,185,129,0.6)",
            }} />
            <input
              type="text"
              placeholder="From city…"
              value={filterFrom}
              onChange={(e) => setFrom(e.target.value)}
              className="filter-input"
            />
          </div>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 8, height: 8, borderRadius: "50%", background: "#06B6D4",
              boxShadow: "0 0 5px rgba(6,182,212,0.6)",
            }} />
            <input
              type="text"
              placeholder="To city…"
              value={filterTo}
              onChange={(e) => setTo(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#EF4444", marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "3px solid rgba(37,99,235,0.2)", borderTopColor: "#2563EB",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#6B7280", fontSize: 13, fontFamily: "var(--font-mono)" }}>Loading board…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && posts.length === 0 && (
          <div style={{
            background: "#0D1B2E", border: "1px dashed #1A2E45", borderRadius: 20,
            padding: "56px 24px", textAlign: "center",
            animation: "fadeSlideUp 0.4s ease both",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🚌</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
              No active ride posts
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>
              {isDriver
                ? "Be the first driver to post a ride offer!"
                : "No shared rides listed right now. Check back soon!"}
            </p>
            {isDriver && (
              <Link
                href="/board/post"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 14,
                  fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff",
                  background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
                  textDecoration: "none",
                }}
              >
                + Post a Ride
              </Link>
            )}
          </div>
        )}

        {/* ── Post list ── */}
        {!loading && posts.length > 0 && (
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>
              {posts.length} post{posts.length !== 1 ? "s" : ""} found
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  isOwn={isDriver && myIds.has(post.id)}
                  onMarkFilled={handleMarkFilled}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── FAB for drivers — purple to match home page board card ── */}
        {isDriver && (
          <Link
            href="/board/post"
            style={{
              position: "fixed", bottom: 88, right: 20,
              width: 52, height: 52, borderRadius: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: "#fff", zIndex: 40,
              background: "linear-gradient(135deg, #7C3AED, #A855F7)",
              boxShadow: "0 0 24px rgba(168,85,247,0.5)",
              textDecoration: "none", transition: "transform 0.2s",
            }}
            title="Post a Ride"
          >
            ✚
          </Link>
        )}

      </div>

      {/* ── Bottom Navigation ── */}
      {isDriver ? (
        <DriverBottomNav />
      ) : (
        <CustomerBottomNav />
      )}
    </main>
  );
}
