"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, Ride, RideStatus } from "@/lib/api";

export default function WhatsAppStyleLiveLocationPage({ params }: { params: { id: string } }) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const secTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll ride updates every 2.5 seconds
  async function loadTrack() {
    try {
      const data = await api.getPublicTrack(params.id);
      setRide(data);
      setError(null);
      setLastUpdatedSec(0);
    } catch (e: any) {
      setError("This live location session is expired or not found.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrack();
    intervalRef.current = setInterval(loadTrack, 2500);

    // "Updated X sec ago" ticker
    secTimerRef.current = setInterval(() => {
      setLastUpdatedSec((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (secTimerRef.current) clearInterval(secTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Dynamically load Leaflet for full-screen WhatsApp Satellite Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || !ride) return;

    const loadLeaflet = () => {
      if (!(window as any).L) {
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
          script.onload = () => initMap();
          document.head.appendChild(script);
        } else {
          const checkL = setInterval(() => {
            if ((window as any).L) {
              clearInterval(checkL);
              initMap();
            }
          }, 100);
        }
      } else {
        initMap();
      }
    };

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      const pLat = ride.pickup_lat || 31.7084;
      const pLng = ride.pickup_lng || 76.9319;
      const dLat = ride.drop_lat || pLat + 0.05;
      const dLng = ride.drop_lng || pLng + 0.05;
      const currentLat = ride.driver?.current_lat || pLat;
      const currentLng = ride.driver?.current_lng || pLng;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([currentLat, currentLng], 14);

        mapInstanceRef.current = map;

        // Satellite Tile Layer (Esri World Imagery) vs Street (Carto Voyager)
        const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        const streetUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

        const tileLayer = L.tileLayer(isSatellite ? satelliteUrl : streetUrl, {
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        // 📍 Pickup Marker
        const pickupIcon = L.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#10B981;border:2.5px solid #FFF;border-radius:50%;box-shadow:0 0 15px rgba(16,185,129,0.9);font-size:15px;color:white;">📍</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map).bindPopup(`<b>Pickup:</b> ${ride.pickup_text}`);

        // 🏁 Destination Marker
        const dropIcon = L.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#EF4444;border:2.5px solid #FFF;border-radius:50%;box-shadow:0 0 15px rgba(239,68,68,0.9);font-size:15px;color:white;">🏁</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([dLat, dLng], { icon: dropIcon }).addTo(map).bindPopup(`<b>Destination:</b> ${ride.drop_text}`);

        // 🔵 Road Route Polyline (OSRM driving route)
        fetch(`https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`)
          .then((r) => r.json())
          .then((data) => {
            if (data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              const polyline = L.polyline(coords, {
                color: "#00FF88",
                weight: 5,
                opacity: 0.85,
                lineCap: "round",
              }).addTo(map);
              routePolylineRef.current = polyline;
            }
          })
          .catch(() => {
            const polyline = L.polyline([[pLat, pLng], [dLat, dLng]], {
              color: "#00FF88",
              weight: 4,
              dashArray: "6,8",
            }).addTo(map);
            routePolylineRef.current = polyline;
          });

        // 🟢 WhatsApp Live Location Avatar Marker with Pulsing Radar
        const driverName = ride.driver?.name || "Driver";
        const avatarPhoto = ride.driver?.avatar_photo;
        const avatarContent = avatarPhoto
          ? `<img src="${avatarPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
          : `<span style="font-size:24px;">👨‍✈️</span>`;

        const liveAvatarHtml = `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <!-- Outer Pulsing Radar Ring -->
            <div style="position:absolute;width:64px;height:64px;border-radius:50%;background:rgba(37,211,102,0.25);border:2px solid #25D366;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;top:-6px;left:-6px;"></div>
            
            <!-- WhatsApp Circular Avatar Container -->
            <div style="position:relative;width:52px;height:52px;border-radius:50%;background:#075E54;border:3.5px solid #FFFFFF;box-shadow:0 6px 20px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:2;">
              ${avatarContent}
            </div>

            <!-- Direction Indicator Arrow / Dot -->
            <div style="width:8px;height:8px;background:#FFFFFF;border-radius:50%;box-shadow:0 0 8px #25D366;margin-top:3px;z-index:2;"></div>
          </div>
        `;

        const liveIcon = L.divIcon({
          html: liveAvatarHtml,
          className: "",
          iconSize: [64, 64],
          iconAnchor: [32, 32],
        });

        const dMarker = L.marker([currentLat, currentLng], { icon: liveIcon, zIndexOffset: 1000 }).addTo(map);
        driverMarkerRef.current = dMarker;
      } else {
        // Map is already loaded -> Smoothly animate driver marker to new coordinates
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([currentLat, currentLng]);
        }
      }
    };

    loadLeaflet();
  }, [ride, isSatellite]);

  // Toggle Satellite vs Normal Map
  function toggleMapLayer() {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newSatellite = !isSatellite;
    setIsSatellite(newSatellite);

    const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    const streetUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const newLayer = L.tileLayer(newSatellite ? satelliteUrl : streetUrl, {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }

  // Center on Live Driver Location
  function centerOnDriver() {
    if (!mapInstanceRef.current || !ride) return;
    const lat = ride.driver?.current_lat || ride.pickup_lat;
    const lng = ride.driver?.current_lng || ride.pickup_lng;
    mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1 });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121B22] flex flex-col items-center justify-center text-white gap-3 p-4">
        <div className="h-12 w-12 rounded-full border-3 border-[#25D366]/30 border-t-[#25D366] animate-spin" />
        <p className="text-sm font-medium text-[#25D366]">Connecting to Live Satellite Location…</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#121B22] flex items-center justify-center p-4">
        <div className="bg-[#1F2C34] rounded-3xl p-6 text-center max-w-sm w-full space-y-4 border border-[#2A3942] text-white shadow-2xl">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-bold text-lg">Live Location Ended</h2>
          <p className="text-xs text-[#8696A0] leading-relaxed">
            {error || "This live location sharing session has ended or is no longer available."}
          </p>
          <Link href="/login" className="block w-full py-3 bg-[#00A884] hover:bg-[#06CF9C] rounded-2xl font-bold text-sm text-[#111B21] transition-all">
            Open Cab8 App →
          </Link>
        </div>
      </div>
    );
  }

  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${ride.pickup_lat},${ride.pickup_lng}&destination=${ride.drop_lat},${ride.drop_lng}&travelmode=driving`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#111B21] flex flex-col">
      {/* ── Top WhatsApp Style Nav Header ── */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
        <Link
          href="/"
          className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg active:scale-95 transition-all shadow-lg"
        >
          ‹
        </Link>

        <div className="text-center">
          <h1 className="text-base font-bold text-white tracking-tight drop-shadow-md">
            Live location
          </h1>
          <p className="text-[11px] text-[#25D366] font-medium flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-ping" />
            Active GPS Tracking
          </p>
        </div>

        {/* Layer & Center Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMapLayer}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm shadow-lg active:scale-95 transition-all"
            title="Toggle Satellite / Street Map"
          >
            {isSatellite ? "🗺️" : "🛰️"}
          </button>
          <button
            type="button"
            onClick={centerOnDriver}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#25D366] text-base shadow-lg active:scale-95 transition-all"
            title="Recenter"
          >
            🧭
          </button>
        </div>
      </header>

      {/* ── Fullscreen Interactive Satellite / Road Map ── */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* ── Floating WhatsApp Style Bottom Card ── */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-3 sm:p-4 max-w-lg mx-auto w-full">
        <div className="rounded-3xl bg-[#1F2C34]/95 backdrop-blur-xl border border-[#2A3942] p-4 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] space-y-3.5 text-white animate-fade-up">
          
          {/* Top Grab Bar */}
          <div className="h-1 w-10 rounded-full bg-[#8696A0]/40 mx-auto" />

          {/* User / Driver Live Presence Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full border-2 border-[#25D366] overflow-hidden bg-[#111B21] flex items-center justify-center shadow-md">
                {ride.driver?.avatar_photo ? (
                  <img src={ride.driver.avatar_photo} alt="Driver" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">👨‍✈️</span>
                )}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#25D366] border-2 border-[#1F2C34]" />
              </div>

              <div>
                <h3 className="font-bold text-white text-sm leading-snug">
                  {ride.driver?.name || "Verified Driver"}
                </h3>
                <p className="text-xs text-[#25D366] font-medium flex items-center gap-1">
                  <span>Updated {lastUpdatedSec < 3 ? "just now" : `${lastUpdatedSec}s ago`}</span>
                  <span>•</span>
                  <span className="text-[#8696A0]">{ride.driver?.vehicle_number || ride.vehicle_type}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#00A884] bg-[#00A884]/15 border border-[#00A884]/30 px-2.5 py-1 rounded-xl block">
                {ride.status === "ONGOING" ? "En Route" : ride.status === "ARRIVED" ? "At Pickup" : "Heading"}
              </span>
              <span className="text-[10px] text-[#8696A0] font-mono mt-0.5 block">{ride.distance_km} km total</span>
            </div>
          </div>

          {/* Route Info */}
          <div className="rounded-2xl bg-[#111B21]/90 border border-[#2A3942] p-3 space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-[#25D366] text-sm">🟢</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#8696A0] font-mono uppercase block">Pickup Location</span>
                <p className="text-white font-medium truncate">{ride.pickup_text}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-[#EF4444] text-sm">🏁</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#8696A0] font-mono uppercase block">Destination</span>
                <p className="text-white font-medium truncate">{ride.drop_text}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-[#00A884] hover:bg-[#06CF9C] active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-lg text-center"
            >
              <span>🗺️</span>
              <span>Google Maps Route</span>
            </a>

            <a
              href="tel:112"
              className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-[#EF4444] hover:bg-red-600 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-lg text-center"
            >
              <span>🚨</span>
              <span>Emergency 112</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
