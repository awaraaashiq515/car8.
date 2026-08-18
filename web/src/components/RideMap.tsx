"use client";

import { useEffect, useRef, useState } from "react";
import { RideStatus } from "@/lib/api";

export type MapStyleType = "dark" | "streets" | "satellite" | "hybrid";

interface RideMapProps {
  pickupLat: number;
  pickupLng: number;
  pickupText?: string;
  dropLat: number;
  dropLng: number;
  dropText?: string;
  driverLat?: number;
  driverLng?: number;
  driverName?: string;
  status: RideStatus;
  height?: string;
  showRouteTimeline?: boolean;
}

interface ViaStop {
  name: string;
  lat: number;
  lng: number;
  icon?: string;
  desc?: string;
}

const TILE_LAYERS: Record<MapStyleType, { url: string; label: string; icon: string; maxZoom: number; subdomains?: string[] | string }> = {
  streets: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    label: "Google Streets",
    icon: "🗺️",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  hybrid: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    label: "Google Hybrid",
    icon: "🚕",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    label: "Dark Nav",
    icon: "🌙",
    maxZoom: 19,
    subdomains: "abcd",
  },
  satellite: {
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    label: "Satellite View",
    icon: "🛰️",
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
};

/**
 * Derives BlaBlaCar style intermediate waypoints (via passing stops)
 * based on pickup/drop locations across Himachal & North India.
 */
function getViaStopsForRoute(pText: string, dText: string, pLat: number, pLng: number, dLat: number, dLng: number): ViaStop[] {
  const p = pText.toLowerCase();
  const d = dText.toLowerCase();

  // Mandi <-> Kullu / Manali
  if ((p.includes("mandi") && (d.includes("kullu") || d.includes("manali"))) || (d.includes("mandi") && (p.includes("kullu") || p.includes("manali")))) {
    return [
      { name: "Pandoh Dam", lat: 31.6700, lng: 77.0500, icon: "🌊", desc: "NH-21 Beas Reservoir" },
      { name: "Aut Tunnel & Thalout", lat: 31.7450, lng: 77.2010, icon: "🚇", desc: "Larji Hydro Junction" },
      { name: "Bhuntar Chowk", lat: 31.8767, lng: 77.1525, icon: "✈️", desc: "Airport Crossing" },
    ];
  }

  // Shimla <-> Mandi / Manali
  if ((p.includes("shimla") && (d.includes("manali") || d.includes("mandi") || d.includes("kullu"))) ||
      (d.includes("shimla") && (p.includes("manali") || p.includes("mandi") || p.includes("kullu")))) {
    return [
      { name: "Brahmpukhar / Shalaghat", lat: 31.2500, lng: 76.9500, icon: "🚏", desc: "Shimla-Bilaspur Border" },
      { name: "Bilaspur Chowk", lat: 31.3395, lng: 76.7605, icon: "🏙️", desc: "Govind Sagar View" },
      { name: "Sundernagar", lat: 31.5312, lng: 76.8974, icon: "⚡", desc: "BBMB Canal Route" },
      { name: "Mandi City", lat: 31.7084, lng: 76.9319, icon: "🏛️", desc: "Beas River Crossing" },
      { name: "Aut Tunnel", lat: 31.7450, lng: 77.2010, icon: "🚇", desc: "Highway Tunnel" },
    ];
  }

  // Sarkaghat <-> Mandi
  if (p.includes("sarkaghat") && d.includes("mandi")) {
    return [
      { name: "Kanyana Chowk", lat: 31.6850, lng: 76.7410, icon: "🚏", desc: "Sarkaghat Road" },
      { name: "Baldwara Tehsil", lat: 31.6321, lng: 76.7215, icon: "🏘️", desc: "Midpoint Town" },
      { name: "Rewalsar Bypass", lat: 31.6500, lng: 76.8500, icon: "🌲", desc: "Hill Pass" },
    ];
  }
  if (p.includes("mandi") && d.includes("sarkaghat")) {
    return [
      { name: "Rewalsar Bypass", lat: 31.6500, lng: 76.8500, icon: "🌲", desc: "Hill Pass" },
      { name: "Baldwara Tehsil", lat: 31.6321, lng: 76.7215, icon: "🏘️", desc: "Midpoint Town" },
      { name: "Kanyana Chowk", lat: 31.6850, lng: 76.7410, icon: "🚏", desc: "Sarkaghat Road" },
    ];
  }

  // Chandigarh <-> Manali / Kullu
  if ((p.includes("chandigarh") && (d.includes("manali") || d.includes("kullu"))) || (d.includes("chandigarh") && (p.includes("manali") || p.includes("kullu")))) {
    return [
      { name: "Kiratpur Sahib (Fourlane)", lat: 31.1800, lng: 76.5700, icon: "🛣️", desc: "Himachal Expressway" },
      { name: "Swarghat Hill Pass", lat: 31.2210, lng: 76.5510, icon: "⛰️", desc: "Ghat Section" },
      { name: "Bilaspur Bypass", lat: 31.3395, lng: 76.7605, icon: "🌉", desc: "NH-21 Fourlane" },
      { name: "Mandi Town", lat: 31.7084, lng: 76.9319, icon: "🏛️", desc: "Transit Hub" },
      { name: "Aut Tunnel", lat: 31.7450, lng: 77.2010, icon: "🚇", desc: "Kullu Valley Gateway" },
    ];
  }

  // Dharamshala <-> Manali / Mandi
  if ((p.includes("dharamshala") || p.includes("kangra")) && (d.includes("manali") || d.includes("mandi") || d.includes("kullu"))) {
    return [
      { name: "Palampur Tea Gardens", lat: 32.1109, lng: 76.5363, icon: "🍃", desc: "Kangra Valley" },
      { name: "Baijnath Temple", lat: 32.0530, lng: 76.6480, icon: "🛕", desc: "Ancient Town" },
      { name: "Jogindernagar", lat: 31.9866, lng: 76.7766, icon: "⚡", desc: "Shanan Hydro" },
    ];
  }

  // If distance is > 15 km, generate 2 interpolated mid-points
  const dist = Math.sqrt((dLat - pLat) ** 2 + (dLng - pLng) ** 2) * 111;
  if (dist > 15) {
    return [
      {
        name: "Route Waypoint 1",
        lat: pLat + (dLat - pLat) * 0.35,
        lng: pLng + (dLng - pLng) * 0.35,
        icon: "🚏",
        desc: "Highway Corridor",
      },
      {
        name: "Route Waypoint 2",
        lat: pLat + (dLat - pLat) * 0.70,
        lng: pLng + (dLng - pLng) * 0.70,
        icon: "🚏",
        desc: "Main Road Passage",
      },
    ];
  }

  return [];
}

export default function RideMap({
  pickupLat,
  pickupLng,
  pickupText = "Pickup Point",
  dropLat,
  dropLng,
  dropText = "Dropoff Destination",
  driverLat,
  driverLng,
  driverName = "Driver",
  status,
  height = "320px",
  showRouteTimeline = true,
}: RideMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mainPolylineRef = useRef<any>(null);
  const casingPolylineRef = useRef<any>(null);
  const approachPolylineRef = useRef<any>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapStyleType>("streets");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routeKm, setRouteKm] = useState<string | null>(null);
  const [routeMins, setRouteMins] = useState<number | null>(null);
  const [viaStopsList, setViaStopsList] = useState<ViaStop[]>([]);

  // Load Leaflet JS & CSS dynamically with robust checking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkL = () => {
      if ((window as any).L) {
        setLeafletLoaded(true);
        return true;
      }
      return false;
    };

    if (checkL()) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }

    const iv = setInterval(() => {
      if (checkL()) clearInterval(iv);
    }, 150);

    return () => clearInterval(iv);
  }, []);

  // Update TileLayer when style changes
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[currentStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || "abcd",
      keepBuffer: 8,
      crossOrigin: true,
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [leafletLoaded, currentStyle, height]);

  // Main Map rendering & Route calculation
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Coords
    const pLat = pickupLat && pickupLat !== 0 ? pickupLat : 31.7084;
    const pLng = pickupLng && pickupLng !== 0 ? pickupLng : 76.9319;
    const dLat = dropLat && dropLat !== 0 ? dropLat : pLat + 0.05;
    const dLng = dropLng && dropLng !== 0 ? dropLng : pLng + 0.05;
    const drvLat = driverLat && driverLat !== 0 ? driverLat : pLat;
    const drvLng = driverLng && driverLng !== 0 ? driverLng : pLng;

    // Derive Via Stops
    const stops = getViaStopsForRoute(pickupText, dropText, pLat, pLng, dLat, dLng);
    setViaStopsList(stops);

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([pLat, pLng], 12);

      const cfg = TILE_LAYERS[currentStyle];
      tileLayerRef.current = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains || "abcd",
        keepBuffer: 8,
        crossOrigin: true,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Clear old layers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (mainPolylineRef.current) {
      map.removeLayer(mainPolylineRef.current);
      mainPolylineRef.current = null;
    }
    if (casingPolylineRef.current) {
      map.removeLayer(casingPolylineRef.current);
      casingPolylineRef.current = null;
    }
    if (approachPolylineRef.current) {
      map.removeLayer(approachPolylineRef.current);
      approachPolylineRef.current = null;
    }

    // 🟢 1. Pickup Marker
    const pickupHtml = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="background:#065F46; border:1.5px solid #10B981; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 7px; border-radius:10px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.6); margin-bottom:2px; font-family:sans-serif;">
          🟢 PICKUP
        </div>
        <div style="display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:linear-gradient(135deg, #10B981, #059669); border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 0 16px rgba(16,185,129,0.8); font-size:16px;">
          📍
        </div>
      </div>
    `;
    const pickupIcon = L.divIcon({ html: pickupHtml, className: "", iconSize: [70, 52], iconAnchor: [35, 50] });
    const pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map);
    pickupMarker.bindPopup(`<b>📍 Pickup:</b><br/>${pickupText}`);
    markersRef.current.push(pickupMarker);

    // 🔴 2. Dropoff Marker
    const dropHtml = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="background:#7F1D1D; border:1.5px solid #EF4444; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 7px; border-radius:10px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.6); margin-bottom:2px; font-family:sans-serif;">
          🏁 DESTINATION
        </div>
        <div style="display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:linear-gradient(135deg, #EF4444, #DC2626); border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 0 16px rgba(239,68,68,0.8); font-size:16px;">
          🏁
        </div>
      </div>
    `;
    const dropIcon = L.divIcon({ html: dropHtml, className: "", iconSize: [84, 52], iconAnchor: [42, 50] });
    const dropMarker = L.marker([dLat, dLng], { icon: dropIcon }).addTo(map);
    dropMarker.bindPopup(`<b>🏁 Destination:</b><br/>${dropText}`);
    markersRef.current.push(dropMarker);

    // 🚏 3. Intermediate Via Stops Markers (BlaBlaCar Style)
    stops.forEach((stop) => {
      const stopHtml = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background:rgba(15,23,42,0.9); border:1px solid #38BDF8; color:#38BDF8; font-size:9px; font-weight:700; padding:1px 6px; border-radius:8px; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.6); margin-bottom:2px;">
            ${stop.icon || "🚏"} ${stop.name}
          </div>
          <div style="width:10px; height:10px; background:#38BDF8; border:2px solid #FFFFFF; border-radius:50%; box-shadow:0 0 8px #38BDF8;"></div>
        </div>
      `;
      const stopIcon = L.divIcon({ html: stopHtml, className: "", iconSize: [90, 30], iconAnchor: [45, 28] });
      const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);
      stopMarker.bindPopup(`<b>${stop.icon || "🚏"} Via Stop:</b><br/>${stop.name}<br/><span style="color:#64748B;font-size:11px;">${stop.desc || ""}</span>`);
      markersRef.current.push(stopMarker);
    });

    // 🚕 4. Driver Marker
    const showDriver = ["DRIVER_ASSIGNED", "ARRIVED", "ONGOING", "SEARCHING"].includes(status);
    if (showDriver) {
      const driverHtml = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background:#1D4ED8; border:1.5px solid #60A5FA; color:#FFFFFF; font-size:10px; font-weight:800; padding:2px 7px; border-radius:10px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.6); margin-bottom:2px; font-family:sans-serif;">
            🚖 ${driverName}
          </div>
          <div style="display:flex; align-items:center; justify-content:center; width:38px; height:38px; background:linear-gradient(135deg, #2563EB, #06B6D4); border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 0 20px rgba(6,182,212,0.9); font-size:19px;">
            🚕
          </div>
        </div>
      `;
      const driverIcon = L.divIcon({ html: driverHtml, className: "", iconSize: [80, 52], iconAnchor: [40, 50] });
      const driverMarker = L.marker([drvLat, drvLng], { icon: driverIcon }).addTo(map);
      driverMarker.bindPopup(`<b>Driver: ${driverName}</b>`);
      markersRef.current.push(driverMarker);
    }

    // 🛣️ 5. Draw Main Highway Trip Route (Pickup -> Dropoff)
    const initialTripCoords: [number, number][] = [
      [pLat, pLng],
      [dLat, dLng],
    ];

    // Casing line (dark contrast border)
    casingPolylineRef.current = L.polyline(initialTripCoords, {
      color: "#0F172A",
      weight: 9,
      opacity: 0.85,
    }).addTo(map);

    // Foreground vibrant highway line
    mainPolylineRef.current = L.polyline(initialTripCoords, {
      color: "#0284C7",
      weight: 5.5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // 🚘 6. If Driver is assigned & approaching pickup, draw approach dashed line
    const driverDistToPickup = Math.sqrt((drvLat - pLat) ** 2 + (drvLng - pLng) ** 2) * 111;
    if (status === "DRIVER_ASSIGNED" && driverDistToPickup > 0.3) {
      approachPolylineRef.current = L.polyline([[drvLat, drvLng], [pLat, pLng]], {
        color: "#F59E0B",
        weight: 4,
        dashArray: "6, 6",
        opacity: 0.9,
      }).addTo(map);
    }

    // 🌐 7. Fetch Real Highway Road Geometry from OSRM Driving Engine (Direct Pickup -> Dropoff)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;

    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
          const route = data.routes[0];
          const roadCoords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          if (mainPolylineRef.current) mainPolylineRef.current.setLatLngs(roadCoords);
          if (casingPolylineRef.current) casingPolylineRef.current.setLatLngs(roadCoords);

          setRouteKm((route.distance / 1000).toFixed(1));
          setRouteMins(Math.round(route.duration / 60));
        }
      })
      .catch((e) => {
        console.warn("OSRM routing fallback:", e);
      });

    // 🎯 8. Fit Bounds to cover all trip markers
    if (markersRef.current.length > 0) {
      const bounds = L.latLngBounds(markersRef.current.map((m) => m.getLatLng()));
      map.fitBounds(bounds, { padding: [45, 45] });
    }
  }, [
    leafletLoaded,
    pickupLat,
    pickupLng,
    pickupText,
    dropLat,
    dropLng,
    dropText,
    driverLat,
    driverLng,
    driverName,
    status,
    isFullscreen,
  ]);

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[9999] w-screen h-screen bg-black flex flex-col"
    : `relative rounded-2xl overflow-hidden border border-navy-border shadow-xl`;

  const containerStyle = isFullscreen ? { height: "100vh" } : { height };

  return (
    <div className="space-y-3">
      <div className={containerClasses} style={containerStyle}>
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full bg-navy-card" />

        {/* Loading Overlay */}
        {!leafletLoaded && (
          <div className="absolute inset-0 bg-navy-card/90 flex flex-col items-center justify-center text-muted gap-2 z-[450]">
            <div className="h-6 w-6 border-2 border-blue-primary/30 border-t-blue-primary rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading Navigation Map…</span>
          </div>
        )}

        {/* Bottom Left Floating Badge */}
        <div className="absolute bottom-3 left-3 z-[450] pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg flex items-center gap-2 max-w-[240px] truncate">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            <span className="truncate">
              {status === "DRIVER_ASSIGNED" && "En Route to Pickup"}
              {status === "ARRIVED" && "Driver Arrived at Pickup"}
              {status === "ONGOING" && "Trip in Progress"}
              {status === "COMPLETED" && "Trip Completed"}
              {status === "SEARCHING" && "Connecting Driver..."}
            </span>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
          {/* Layer Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md border border-slate-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
            >
              <span>{TILE_LAYERS[currentStyle].icon}</span>
              <span className="hidden sm:inline">{TILE_LAYERS[currentStyle].label}</span>
              <span className="text-[10px] text-muted">▼</span>
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-1.5 shadow-2xl space-y-1">
                {(Object.keys(TILE_LAYERS) as MapStyleType[]).map((key) => {
                  const item = TILE_LAYERS[key];
                  const active = currentStyle === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setCurrentStyle(key);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-blue-600 text-white font-bold shadow-md"
                          : "text-muted hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                      {active && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md border border-slate-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
          >
            {isFullscreen ? "✕ Close" : "⤢ Full Map"}
          </button>
        </div>
      </div>

      {/* ── BlaBlaCar Style Route & Via Stops Section ("कहाँ-कहाँ से होकर जाएगी") ── */}
      {showRouteTimeline && (
        <div className="rounded-2xl border border-navy-border bg-navy-card/90 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🛣️</span>
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                Planned Route Path · Via Passing Stops
              </h4>
            </div>
            {routeKm && (
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                {routeKm} km · {routeMins ? `${Math.floor(routeMins / 60)}h ${routeMins % 60}m` : ""}
              </span>
            )}
          </div>

          {/* Step-by-Step Vertical Route Timeline */}
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-green-500 before:via-sky-400 before:to-red-500">
            {/* 🟢 Origin */}
            <div className="relative flex items-start justify-between gap-2">
              <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-950 ring-2 ring-green-500/40" />
              <div>
                <span className="text-[10px] font-mono font-bold text-green-400 uppercase block">Pickup Location</span>
                <p className="text-xs font-bold text-white">{pickupText}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Start</span>
            </div>

            {/* 🚏 Intermediate Via Stops */}
            {viaStopsList.map((stop, i) => (
              <div key={i} className="relative flex items-start justify-between gap-2">
                <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-sky-400 border-2 border-slate-950" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{stop.icon || "🚏"}</span>
                    <span className="text-xs font-semibold text-sky-200">Via {stop.name}</span>
                  </div>
                  {stop.desc && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{stop.desc}</p>}
                </div>
                <span className="text-[10px] font-mono text-sky-400/80 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40">
                  Stop {i + 1}
                </span>
              </div>
            ))}

            {/* 🔴 Destination */}
            <div className="relative flex items-start justify-between gap-2">
              <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-slate-950 ring-2 ring-red-500/40" />
              <div>
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase block">Destination</span>
                <p className="text-xs font-bold text-white">{dropText}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Arrival</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
