"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VehicleType } from "@/lib/api";

export interface FleetDriver {
  id: string;
  name: string;
  phone: string;
  city: string;
  district?: string;
  tehsil?: string;
  stand_name?: string;
  village?: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_make?: string;
  vehicle_model?: string;
  is_online: number;
  rating_avg: number;
  rate_per_km?: number;
  current_lat?: number;
  current_lng?: number;
  avatar_photo?: string;
}

export interface BookingPin {
  id: string;
  pickup_text: string;
  drop_text: string;
  estimated_fare: number;
  vehicle_type: string;
  lat?: number;
  lng?: number;
  status: string;
}

interface UnionFleetMapProps {
  drivers: FleetDriver[];
  bookings?: BookingPin[];
  height?: string;
  onSelectDriver?: (driver: FleetDriver) => void;
  onDispatchToDriver?: (driver: FleetDriver) => void;
}

const VEHICLE_ICONS: Record<string, string> = {
  HATCHBACK: "🚗",
  SEDAN: "🚙",
  SUV: "🚐",
  LUXURY: "🏎️",
  PICKUP_TRUCK: "🛻",
  AUTO: "🛺",
};

type MapStyle = "streets" | "hybrid" | "osm" | "dark";

const MAP_TILES: Record<MapStyle, { url: string; label: string; icon: string; maxZoom: number; subdomains?: string[] | string }> = {
  streets: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    label: "Google Roads",
    icon: "🛣️",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  hybrid: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    label: "Satellite + Roads",
    icon: "🛰️",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    label: "OpenStreetMap",
    icon: "🗺️",
    maxZoom: 19,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Voyager Nav",
    icon: "🧭",
    maxZoom: 19,
    subdomains: "abcd",
  },
};

// Known Mandi Main Highway Anchor (Highway 3 / NH-21 Corridor)
const MANDI_ROAD_ANCHOR = { lat: 31.7058, lng: 76.9352 };

// Road Snapping In-Memory Cache to prevent repeated API calls
const roadSnapCache = new Map<string, { lat: number; lng: number }>();

async function snapToRoad(rawLat: number, rawLng: number): Promise<{ lat: number; lng: number }> {
  // Key rounded to ~5 meters to prevent jitter
  const key = `${rawLat.toFixed(4)},${rawLng.toFixed(4)}`;
  if (roadSnapCache.has(key)) {
    return roadSnapCache.get(key)!;
  }

  try {
    const res = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${rawLng},${rawLat}`);
    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.waypoints && data.waypoints.length > 0) {
        const [snapLng, snapLat] = data.waypoints[0].location;
        const result = { lat: snapLat, lng: snapLng };
        roadSnapCache.set(key, result);
        return result;
      }
    }
  } catch {
    // Fallback to raw coords if OSRM is unreachable
  }

  const fallback = { lat: rawLat, lng: rawLng };
  roadSnapCache.set(key, fallback);
  return fallback;
}

export default function UnionFleetMap({
  drivers,
  bookings = [],
  height = "420px",
  onSelectDriver,
  onDispatchToDriver,
}: UnionFleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const hasInitializedViewRef = useRef(false);

  const [selectedDriver, setSelectedDriver] = useState<FleetDriver | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string>("ALL");
  const [mapStyle, setMapStyle] = useState<MapStyle>("streets");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [focusedDriverId, setFocusedDriverId] = useState<string | null>(null);
  const [snappedCoords, setSnappedCoords] = useState<Record<string, { lat: number; lng: number }>>({});

  // Filtered drivers
  const activeDrivers = drivers.filter((d) => {
    if (vehicleFilter === "ALL") return true;
    return d.vehicle_type === vehicleFilter;
  });

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setLeafletLoaded(true);
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Snap driver coordinates to real roads asynchronously
  useEffect(() => {
    activeDrivers.forEach((driver) => {
      const rawLat = driver.current_lat && driver.current_lat !== 0 ? driver.current_lat : MANDI_ROAD_ANCHOR.lat;
      const rawLng = driver.current_lng && driver.current_lng !== 0 ? driver.current_lng : MANDI_ROAD_ANCHOR.lng;

      snapToRoad(rawLat, rawLng).then((snapped) => {
        setSnappedCoords((prev) => {
          if (prev[driver.id]?.lat === snapped.lat && prev[driver.id]?.lng === snapped.lng) {
            return prev;
          }
          return { ...prev, [driver.id]: snapped };
        });
      });
    });
  }, [activeDrivers]);

  // Switch Tile Layer
  const setTileLayer = useCallback((style: MapStyle) => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const cfg = MAP_TILES[style];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || "abc",
      attribution: "© Map Data",
    }).addTo(mapInstanceRef.current);

    setMapStyle(style);
  }, []);

  // Initialize Map Instance (Only ONCE)
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [MANDI_ROAD_ANCHOR.lat, MANDI_ROAD_ANCHOR.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      const cfg = MAP_TILES[mapStyle];
      tileLayerRef.current = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains || "abc",
      }).addTo(map);

      // 🛣️ Blue Highway Route Corridor (NH-21 Mandi / Rewalsar Bypass corridor)
      const highwayRoute: [number, number][] = [
        [31.6780, 76.9380], // Gutkar
        [31.6920, 76.9345], // Rewalsar Bypass
        [31.7050, 76.9325], // Mandi Stand
        [31.7087, 76.9320], // Seri Stage
        [31.7150, 76.9300], // Victoria Bridge
        [31.7220, 76.9350], // Bhiuli
      ];

      L.polyline(highwayRoute, {
        color: "#2563EB",
        weight: 6,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      L.polyline(highwayRoute, {
        color: "#60A5FA",
        weight: 2,
        opacity: 0.95,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [leafletLoaded, mapStyle]);

  // Update Markers Smoothly without resetting map view / pan
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set<string>();
    const bounds: [number, number][] = [];

    activeDrivers.forEach((driver) => {
      currentMarkerIds.add(driver.id);
      
      const coords = snappedCoords[driver.id] || {
        lat: driver.current_lat && driver.current_lat !== 0 ? driver.current_lat : MANDI_ROAD_ANCHOR.lat,
        lng: driver.current_lng && driver.current_lng !== 0 ? driver.current_lng : MANDI_ROAD_ANCHOR.lng,
      };

      bounds.push([coords.lat, coords.lng]);

      const isOnline = driver.is_online === 1;
      const iconEmoji = VEHICLE_ICONS[driver.vehicle_type] || "🚕";
      const plateNumber = driver.vehicle_number || "CAB-8";
      const isSelected = selectedDriver?.id === driver.id;

      // Authentic Yellow Taxi Number Plate Marker
      const driverIconHtml = `
        <div style="
          position: relative;
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
          pointer-events: auto;
        ">
          <!-- 1. VEHICLE NUMBER PLATE (Indian Yellow Taxi Style) -->
          <div style="
            background: #FACC15;
            color: #000;
            font-family: 'JetBrains Mono', monospace, sans-serif;
            font-weight: 900;
            font-size: 11px;
            line-height: 1.1;
            padding: 2.5px 7px;
            border-radius: 6px;
            border: 1.5px solid #000000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            white-space: nowrap;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 3px;
            margin-bottom: 2px;
            ${isSelected ? "border-color: #2563EB; box-shadow: 0 0 12px #3B82F6;" : ""}
          ">
            <span style="font-size: 8px; color: #1E293B; font-weight: 800;">IND</span>
            <span>${plateNumber}</span>
          </div>

          <!-- 2. VEHICLE ICON AVATAR -->
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            ${
              isOnline
                ? '<div style="position: absolute; inset: -3px; border-radius: 50%; background: rgba(16,185,129,0.35); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>'
                : ""
            }
            <div style="
              width: 34px; height: 34px; border-radius: 12px;
              background: ${isOnline ? "linear-gradient(135deg, #059669, #10B981)" : "#334155"};
              border: 2px solid ${isOnline ? "#6EE7B7" : "#94A3B8"};
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              display: flex; align-items: center; justify-content: center;
              font-size: 17px; color: #fff;
              position: relative; z-index: 2;
            ">
              ${iconEmoji}
            </div>

            <!-- Live Online Dot -->
            <div style="
              position: absolute; bottom: 0; right: 0; width: 11px; height: 11px; border-radius: 50%;
              background: ${isOnline ? "#10B981" : "#64748B"}; border: 2px solid #050D1A;
              z-index: 3;
            "></div>
          </div>

          <!-- 3. DRIVER NAME PILL -->
          <div style="
            background: rgba(5, 13, 26, 0.94);
            color: #E2E8F0;
            font-size: 10px;
            font-weight: 700;
            padding: 1.5px 6px;
            border-radius: 5px;
            border: 1px solid ${isOnline ? "rgba(16,185,129,0.5)" : "rgba(100,116,139,0.4)"};
            margin-top: 1px;
            white-space: nowrap;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 3px;
          ">
            <span style="color: ${isOnline ? "#34D399" : "#94A3B8"}; font-size: 8px;">●</span>
            <span>${driver.name}</span>
          </div>

          <!-- 4. PIN POINTER TRIANGLE (Lands exactly on the Road) -->
          <div style="
            width: 0; height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid rgba(5, 13, 26, 0.95);
            margin-top: -1px;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: driverIconHtml,
        className: "custom-fleet-driver-road-pin",
        iconSize: [120, 80],
        iconAnchor: [60, 80],
      });

      let marker = markersMapRef.current.get(driver.id);
      if (marker) {
        // Update existing marker position & icon smoothly without recreating
        marker.setLatLng([coords.lat, coords.lng]);
        marker.setIcon(customIcon);
      } else {
        // Create new marker
        marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setSelectedDriver(driver);
          setFocusedDriverId(driver.id);
          map.setView([coords.lat, coords.lng], 17, { animate: true });
          if (onSelectDriver) onSelectDriver(driver);
        });

        markersMapRef.current.set(driver.id, marker);
      }
    });

    // Remove deleted markers
    markersMapRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersMapRef.current.delete(id);
      }
    });

    // Fit view ONLY ONCE on initial mount (never during automatic background polling)
    if (!hasInitializedViewRef.current && bounds.length > 0) {
      hasInitializedViewRef.current = true;
      if (bounds.length === 1) {
        map.setView(bounds[0], 16);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [leafletLoaded, activeDrivers, selectedDriver, snappedCoords, onSelectDriver]);

  // Focus on a driver with Road Level Zoom
  function focusDriver(driver: FleetDriver) {
    setSelectedDriver(driver);
    setFocusedDriverId(driver.id);
    if (!mapInstanceRef.current) return;

    const coords = snappedCoords[driver.id] || {
      lat: driver.current_lat && driver.current_lat !== 0 ? driver.current_lat : MANDI_ROAD_ANCHOR.lat,
      lng: driver.current_lng && driver.current_lng !== 0 ? driver.current_lng : MANDI_ROAD_ANCHOR.lng,
    };

    mapInstanceRef.current.setView([coords.lat, coords.lng], 17, { animate: true });
  }

  // Explicit user action to re-fit view
  function resetView() {
    if (!mapInstanceRef.current || activeDrivers.length === 0) return;
    const bounds = activeDrivers.map((d) => {
      const c = snappedCoords[d.id];
      if (c) return [c.lat, c.lng];
      return [
        d.current_lat && d.current_lat !== 0 ? d.current_lat : MANDI_ROAD_ANCHOR.lat,
        d.current_lng && d.current_lng !== 0 ? d.current_lng : MANDI_ROAD_ANCHOR.lng,
      ];
    }) as [number, number][];

    if (bounds.length === 1) {
      mapInstanceRef.current.setView(bounds[0], 16, { animate: true });
    } else {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }

  const onlineCount = drivers.filter((d) => d.is_online === 1).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Map Header & Filter Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)" }}>
              Live Fleet Road Radar
            </h4>
            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
              🟢 {onlineCount} Online · {drivers.length} Total Vehicles · <span style={{ color: "#34D399" }}>🛣️ Road Snapped</span>
            </p>
          </div>
        </div>

        {/* Map Layer Switcher & Fit Map Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", background: "#0D1B2E", borderRadius: 10, padding: 2, border: "1px solid #1A2E45" }}>
            {(["streets", "hybrid", "osm", "dark"] as MapStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setTileLayer(style)}
                style={{
                  padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                  background: mapStyle === style ? "linear-gradient(135deg, #2563EB, #06B6D4)" : "transparent",
                  color: mapStyle === style ? "#fff" : "#94A3B8",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <span>{MAP_TILES[style].icon}</span>
                <span className="hidden sm:inline">{MAP_TILES[style].label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={resetView}
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#FDE68A", cursor: "pointer", fontFamily: "var(--font-mono)",
            }}
          >
            🎯 Fit Fleet
          </button>
        </div>
      </div>

      {/* Vehicle Category Filter Pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {["ALL", "SUV", "SEDAN", "HATCHBACK", "PICKUP_TRUCK"].map((type) => (
          <button
            key={type}
            onClick={() => setVehicleFilter(type)}
            style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-mono)", cursor: "pointer", whiteSpace: "nowrap",
              background: vehicleFilter === type ? "rgba(6,182,212,0.2)" : "#0D1B2E",
              border: `1px solid ${vehicleFilter === type ? "#06B6D4" : "#1A2E45"}`,
              color: vehicleFilter === type ? "#67E8F9" : "#94A3B8",
            }}
          >
            {type === "ALL" ? "All Types" : type}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid #1A2E45",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Live GPS Watermark */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 400,
            background: "rgba(5,13,26,0.9)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(16,185,129,0.4)",
            padding: "5px 12px",
            borderRadius: 10,
            fontSize: 10,
            color: "#34D399",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s infinite" }} />
          LIVE GPS ROAD TRACKING
        </div>

        {/* Active Layer Indicator */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 400,
            background: "rgba(5,13,26,0.85)",
            backdropFilter: "blur(6px)",
            border: "1px solid #1A2E45",
            padding: "4px 8px",
            borderRadius: 8,
            fontSize: 10,
            color: "#94A3B8",
            fontFamily: "var(--font-mono)",
          }}
        >
          {MAP_TILES[mapStyle].icon} {MAP_TILES[mapStyle].label}
        </div>

        {/* Selected Driver Floating Card Overlay */}
        {selectedDriver && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              zIndex: 400,
              background: "rgba(13,27,46,0.96)",
              backdropFilter: "blur(14px)",
              border: "1px solid #06B6D4",
              borderRadius: 18,
              padding: "14px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
              animation: "fadeUp 0.25s ease both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>{VEHICLE_ICONS[selectedDriver.vehicle_type] || "🚕"}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>
                      {selectedDriver.name}
                    </h5>
                    <span style={{
                      background: "#FACC15", color: "#000", fontWeight: 900,
                      fontFamily: "var(--font-mono)", fontSize: 11, padding: "1px 6px",
                      borderRadius: 4, border: "1px solid #000",
                    }}>
                      {selectedDriver.vehicle_number || "CAB-8"}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
                    {selectedDriver.vehicle_make || selectedDriver.vehicle_type} {selectedDriver.vehicle_model || ""} · ★ {selectedDriver.rating_avg.toFixed(1)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedDriver(null); setFocusedDriverId(null); }}
                style={{
                  background: "#162540", border: "none", color: "#94A3B8",
                  borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 10 }}>
              <span>📍 {selectedDriver.stand_name || selectedDriver.city || "Mandi Main Stand"}</span>
              <span style={{ color: selectedDriver.is_online ? "#10B981" : "#94A3B8", fontWeight: 700 }}>
                {selectedDriver.is_online ? "🟢 Live on Road" : "⚪ Offline"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`tel:${selectedDriver.phone}`}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)",
                  color: "#22D3EE", textAlign: "center", textDecoration: "none", display: "block",
                }}
              >
                📞 Call Driver
              </a>

              <button
                type="button"
                onClick={() => focusDriver(selectedDriver)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)",
                  color: "#FDE68A", cursor: "pointer",
                }}
              >
                🔍 Road Zoom
              </button>

              {onDispatchToDriver && (
                <button
                  onClick={() => onDispatchToDriver(selectedDriver)}
                  style={{
                    flex: 1.2, padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 700,
                    background: "linear-gradient(135deg, #10B981, #06B6D4)", border: "none",
                    color: "#fff", cursor: "pointer",
                  }}
                >
                  ⚡ Assign Booking
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fleet Roster List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Fleet Roster ({activeDrivers.length})
          </span>
          <span style={{ fontSize: 10, color: "#64748B" }}>
            Tap 📍 to zoom driver on road
          </span>
        </div>

        {activeDrivers.map((d) => (
          <div
            key={d.id}
            onClick={() => focusDriver(d)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 12, background: "#0D1B2E",
              border: focusedDriverId === d.id ? "1px solid #06B6D4" : "1px solid #1A2E45",
              boxShadow: focusedDriverId === d.id ? "0 0 16px rgba(6,182,212,0.25)" : "none",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{VEHICLE_ICONS[d.vehicle_type] || "🚕"}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong style={{ color: "#fff", fontSize: 12 }}>{d.name}</strong>
                  <span style={{
                    background: "#FACC15", color: "#000", fontWeight: 900,
                    fontFamily: "var(--font-mono)", fontSize: 10, padding: "0.5px 5px",
                    borderRadius: 4, border: "1px solid #000",
                  }}>
                    {d.vehicle_number || "CAB-8"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
                  {d.city || "Mandi"} {d.stand_name ? `· ${d.stand_name}` : ""} · {d.vehicle_type}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 6,
                background: d.is_online ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                color: d.is_online ? "#10B981" : "#94A3B8",
                fontWeight: 700,
              }}>
                {d.is_online ? "🟢 Live" : "⚪ Offline"}
              </span>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); focusDriver(d); }}
                style={{
                  padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                  background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)",
                  color: "#22D3EE", cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <span>📍</span>
                <span>Track</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
