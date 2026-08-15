"use client";

import { useEffect, useRef, useState } from "react";
import { Place, PLACE_PRESETS } from "@/lib/api";

// ── Haversine distance (km) ──────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Nearest preset to coordinates ───────────────────────
function nearestPlace(lat: number, lng: number): Place {
  return PLACE_PRESETS.reduce((best, p) => {
    const d = haversine(lat, lng, p.lat, p.lng);
    return d < haversine(lat, lng, best.lat, best.lng) ? p : best;
  }, PLACE_PRESETS[0]);
}

// ── Smart Fuzzy Scoring for misspellings ─────────────────
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;

  // Phonetic/spelling normalization (e.g. "rewalser" -> "rewalsar", "kasol" -> "kasol")
  const normQ = q.replace(/er$/g, "ar").replace(/e/g, "a").replace(/s/g, "sh").replace(/i/g, "ee");
  const normT = t.replace(/er$/g, "ar").replace(/e/g, "a").replace(/s/g, "sh").replace(/i/g, "ee");

  if (normT.includes(normQ)) return 75;

  const qTokens = q.split(/\s+/);
  const matchedTokens = qTokens.filter(tok =>
    t.includes(tok) || normT.includes(tok.replace(/er$/g, "ar").replace(/e/g, "a"))
  );
  if (matchedTokens.length > 0) {
    return 40 + (matchedTokens.length / qTokens.length) * 30;
  }

  return 0;
}

interface Props {
  value: string;
  onChange: (label: string) => void;
  placeholder: string;
  isPickup?: boolean;
  label: string;
}

type GpsState = "idle" | "loading" | "done" | "error";

interface LiveGeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationInput({ value, onChange, placeholder, isPickup, label }: Props) {
  const [query,        setQuery]        = useState(value);
  const [open,         setOpen]         = useState(false);
  const [gpsState,     setGpsState]     = useState<GpsState>("idle");
  const [gpsLabel,     setGpsLabel]     = useState<string | null>(null);
  const [liveResults,  setLiveResults]  = useState<Place[]>([]);
  const [isSearching,  setIsSearching]  = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const searchTimer  = useRef<NodeJS.Timeout | null>(null);

  // Keep query in sync if parent changes value
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Multi-Provider Live Geocoding API Search (Photon OSM + India Post + Nominatim) ──
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      const q = query.trim();
      const results: Place[] = [];
      const seen = new Set<string>();

      const addPlace = (label: string, lat: number, lng: number) => {
        const clean = label.trim();
        if (clean && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          results.push({ label: clean, lat, lng });
        }
      };

      try {
        // 1. Check for 6-digit Indian PIN Code (e.g. 175049)
        const pinMatch = q.match(/\b\d{6}\b/);
        if (pinMatch) {
          try {
            const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pinMatch[0]}`);
            if (pinRes.ok) {
              const pinData = await pinRes.json();
              if (pinData?.[0]?.Status === "Success" && pinData[0].PostOffice) {
                pinData[0].PostOffice.forEach((po: any) => {
                  const poName = po.Name.replace(/\s+(B\.O|H\.O|S\.O)$/i, "");
                  addPlace(`${poName}, ${po.District}, ${po.State} ${po.Pincode}`, 31.7, 76.7);
                });
              }
            }
          } catch {}
        }

        // Clean query for text-based OSM searches (strip raw pincode digits)
        const textSearch = q.replace(/\b\d{6}\b/g, "").trim() || q;

        // 2. Fetch from Photon Komoot (Fast, OSM village/tehsil search without CORS issues)
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(textSearch)}&lang=en&limit=8`;
          const pRes = await fetch(photonUrl);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData?.features) {
              pData.features.forEach((feat: any) => {
                const props = feat.properties || {};
                const coords = feat.geometry?.coordinates || [0, 0];
                const country = props.country || "";

                // Include feature if country is India or omitted
                if (country && !["india", "in"].includes(country.toLowerCase())) return;

                const name = props.name || props.street || props.city || "";
                const district = props.district || props.county || props.city || "";
                const state = props.state || "";

                if (name) {
                  const parts = [name];
                  if (district && district.toLowerCase() !== name.toLowerCase()) parts.push(district);
                  if (state && state.toLowerCase() !== district.toLowerCase() && state.toLowerCase() !== name.toLowerCase()) parts.push(state);
                  addPlace(parts.join(", "), coords[1], coords[0]);
                }
              });
            }
          }
        } catch {}

        // 3. Fallback to Nominatim if needed
        if (results.length < 3) {
          try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(textSearch)}&countrycodes=in&limit=6`;
            const nRes = await fetch(nomUrl);
            if (nRes.ok) {
              const nData = await nRes.json();
              nData.forEach((item: any) => {
                const parts = item.display_name.split(", ");
                const shortName = parts.length > 3
                  ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 2] || parts[parts.length - 1]}`
                  : parts.join(", ");
                addPlace(shortName, parseFloat(item.lat), parseFloat(item.lon));
              });
            }
          } catch {}
        }

        setLiveResults(results);
      } catch {
        /* ignore network failures */
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, open]);

  // ── Fuzzy Filter Presets ─────────────────────────────
  const scoredPresets = PLACE_PRESETS.map((p) => ({
    place: p,
    score: fuzzyScore(query, p.label),
  }))
  .filter((item) => query.trim().length === 0 || item.score > 0)
  .sort((a, b) => b.score - a.score);

  const filteredPresets = (query.trim().length === 0
    ? PLACE_PRESETS.slice(0, 8)
    : scoredPresets.map(i => i.place)
  ).slice(0, 8);

  // Combine live geocoded results (first) and local presets (deduplicating by label)
  const combinedPlaces = [...liveResults];
  filteredPresets.forEach((presetP) => {
    if (!combinedPlaces.some(p => p.label.toLowerCase() === presetP.label.toLowerCase())) {
      combinedPlaces.push(presetP);
    }
  });

  const showCustom = query.trim().length > 0 &&
    !combinedPlaces.some((p) => p.label.toLowerCase() === query.trim().toLowerCase());

  // ── GPS auto-detect ──────────────────────────────────
  function detectLocation() {
    if (!navigator.geolocation) {
      setGpsState("error");
      return;
    }
    setGpsState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const nearest = nearestPlace(lat, lng);
        setGpsLabel(nearest.label);
        setGpsState("done");
        setQuery(nearest.label);
        onChange(nearest.label);
        setOpen(false);
      },
      () => {
        setGpsState("error");
        setTimeout(() => setGpsState("idle"), 3000);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  function select(place: Place) {
    setQuery(place.label);
    onChange(place.label);
    setOpen(false);
  }

  function selectCustom() {
    onChange(query.trim());
    setOpen(false);
  }

  const dotColor = isPickup ? "#10B981" : "#06B6D4";

  return (
    <div ref={containerRef} className={`relative ${open ? "z-[200]" : "z-10"}`}>
      {/* Label */}
      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
        {label}
      </label>

      {/* Input row */}
      <div
        className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all duration-200 ${
          open ? "border-blue-primary bg-navy-deep" : "border-navy-border bg-navy-deep hover:border-navy-hover"
        }`}
      >
        {/* Color dot */}
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent text-sm text-white placeholder-muted outline-none min-w-0"
        />

        {/* Search spinner indicator */}
        {isSearching && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin flex-shrink-0" />
        )}

        {/* Clear button */}
        {query && !isSearching && (
          <button
            onClick={() => { setQuery(""); onChange(""); inputRef.current?.focus(); setOpen(true); }}
            className="text-muted hover:text-white transition-colors flex-shrink-0 text-xs"
          >
            ✕
          </button>
        )}

        {/* GPS button */}
        {isPickup && (
          <button
            onClick={detectLocation}
            className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              gpsState === "loading" ? "bg-blue-primary/20" :
              gpsState === "done"    ? "bg-green/20" :
              gpsState === "error"   ? "bg-red/20" :
                                       "bg-navy-border hover:bg-blue-primary/20"
            }`}
            title="Use my current location"
          >
            {gpsState === "loading" ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
            ) : gpsState === "done" ? (
              <span className="text-green text-xs">✓</span>
            ) : gpsState === "error" ? (
              <span className="text-red text-xs">✕</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* GPS status message */}
      {isPickup && gpsState === "done" && gpsLabel && (
        <p className="text-xs text-green mt-1 px-1 flex items-center gap-1">
          <span>✓</span> Nearest location: <span className="font-medium">{gpsLabel}</span>
        </p>
      )}
      {isPickup && gpsState === "error" && (
        <p className="text-xs text-red mt-1 px-1">⚠️ Location access denied. Please select manually.</p>
      )}

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-blue-primary/50 bg-[#0D1B2E] z-[200] overflow-hidden"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.95)", maxHeight: "280px", overflowY: "auto" }}
        >
          {/* GPS option at top — only for pickup */}
          {isPickup && (
            <button
              onMouseDown={detectLocation}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-hover transition-colors border-b border-navy-border"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #2563EB22, #06B6D422)", border: "1px solid #2563EB33" }}
              >
                {gpsState === "loading" ? (
                  <span className="h-4 w-4 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-blue-light">
                  {gpsState === "loading" ? "Detecting location…" : "Use my current location"}
                </div>
                <div className="text-xs text-muted">
                  {gpsState === "done" && gpsLabel
                    ? `Nearest: ${gpsLabel}`
                    : "Tap to auto-detect via GPS"}
                </div>
              </div>
            </button>
          )}

          {/* Section header */}
          <div className="px-4 py-2 border-b border-navy-border/50 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-dimmed">
              {query.trim() ? "Search results" : "Popular locations"}
            </span>
            {isSearching && (
              <span className="text-[10px] text-blue-light animate-pulse font-mono">Searching map…</span>
            )}
          </div>

          {/* Places list */}
          {combinedPlaces.map((place) => {
            const isSelected = query.toLowerCase() === place.label.toLowerCase();
            return (
              <button
                key={place.label}
                onMouseDown={() => select(place)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-hover transition-colors ${
                  isSelected ? "bg-blue-primary/10" : ""
                }`}
              >
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: "linear-gradient(135deg, #0D1B2E, #162540)", border: "1px solid #1A2E45" }}
                >
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isSelected ? "text-blue-light" : "text-white"}`}>
                    {query.trim() ? highlightMatch(place.label, query) : place.label}
                  </div>
                </div>
                {isSelected && <span className="text-blue-light text-xs flex-shrink-0">✓</span>}
              </button>
            );
          })}

          {/* Always show Custom Location Option if something is typed */}
          {showCustom && (
            <button
              onMouseDown={selectCustom}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-hover transition-colors border-t border-navy-border"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: "linear-gradient(135deg, #06B6D422, #2563EB22)", border: "1px solid #06B6D433" }}
              >
                🗺️
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-cyan-glow truncate">
                  Use "{query.trim()}"
                </div>
                <div className="text-[11px] text-muted">Select as custom location</div>
              </div>
              <span className="text-cyan-glow text-xs">→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bold-highlight matching substring ────────────────────
function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-blue-light font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
