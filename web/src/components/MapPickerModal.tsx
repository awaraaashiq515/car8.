"use client";

import { useEffect, useRef, useState } from "react";
import { Place } from "@/lib/api";

interface MapPickerModalProps {
  initialLat?: number;
  initialLng?: number;
  initialLabel?: string;
  isPickup?: boolean;
  onConfirm: (place: Place) => void;
  onClose: () => void;
}

export default function MapPickerModal({
  initialLat = 31.7084,
  initialLng = 76.9319,
  initialLabel = "",
  isPickup = true,
  onConfirm,
  onClose,
}: MapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const reverseTimer = useRef<NodeJS.Timeout | null>(null);

  const [lat, setLat] = useState(initialLat || 31.7084);
  const [lng, setLng] = useState(initialLng || 76.9319);
  const [address, setAddress] = useState(initialLabel || "Locating point on map…");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Reverse Geocoding helper
  async function fetchAddress(latitude: number, longitude: number) {
    setLoadingAddress(true);
    try {
      // 1. Try Nominatim Reverse (High Detail: Landmark, Road, Locality, City, PIN)
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(nomUrl, { headers: { "Accept-Language": "en" } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const parts: string[] = [];

        const landmark = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic || "";
        if (landmark) parts.push(landmark);

        const road = addr.road || addr.street || addr.footway || addr.path || "";
        if (road && !parts.includes(road)) parts.push(road);

        const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.hamlet || "";
        if (locality && !parts.includes(locality)) parts.push(locality);

        const city = addr.city || addr.town || addr.municipality || addr.tehsil || addr.subdistrict || addr.county || "";
        if (city && !parts.includes(city) && !parts.some(p => p.toLowerCase().includes(city.toLowerCase()))) {
          parts.push(city);
        }

        const state = addr.state ? addr.state.replace("Himachal Pradesh", "HP") : "";
        const pin = addr.postcode || "";

        if (state) {
          parts.push(pin ? `${state} ${pin}` : state);
        }

        if (parts.length > 0) {
          setAddress(parts.join(", "));
          setLoadingAddress(false);
          return;
        }
      }
    } catch {}

    try {
      // 2. Try BigDataCloud Fallback
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const res = await fetch(bdcUrl);
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.city || data.principalSubdivisionDistrict || "";
        const district = data.principalSubdivisionDistrict || "";
        const state = data.principalSubdivision ? data.principalSubdivision.replace("Himachal Pradesh", "HP") : "";
        const parts = [locality];
        if (district && district.toLowerCase() !== locality.toLowerCase()) parts.push(district);
        if (state && state.toLowerCase() !== district.toLowerCase() && state.toLowerCase() !== locality.toLowerCase()) parts.push(state);
        const joined = parts.filter(Boolean).join(", ");
        if (joined) {
          setAddress(joined);
          setLoadingAddress(false);
          return;
        }
      }
    } catch {}

    setAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    setLoadingAddress(false);
  }

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const startLat = lat || 31.7084;
    const startLng = lng || 76.9319;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
    });

    // Google Streets Tiles (high detail)
    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      crossOrigin: true,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial reverse geocode
    fetchAddress(startLat, startLng);

    // Listen to map moves
    map.on("move", () => {
      const center = map.getCenter();
      setLat(center.lat);
      setLng(center.lng);
      setLoadingAddress(true);
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      setLat(center.lat);
      setLng(center.lng);
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      reverseTimer.current = setTimeout(() => {
        fetchAddress(center.lat, center.lng);
      }, 350);
    });

    mapInstanceRef.current = map;

    return () => {
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded]);

  // Center on Current GPS location
  function locateUser() {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        mapInstanceRef.current?.flyTo([latitude, longitude], 17, { duration: 1.2 });
        fetchAddress(latitude, longitude);
      },
      () => {
        setLocating(false);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLat(latitude);
            setLng(longitude);
            mapInstanceRef.current?.flyTo([latitude, longitude], 16, { duration: 1.0 });
            fetchAddress(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function handleConfirm() {
    onConfirm({
      label: address,
      lat,
      lng,
    });
    onClose();
  }

  const dotColor = isPickup ? "#10B981" : "#06B6D4";

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-navy-deep animate-fade-in">
      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-navy-deep/95 border-b border-navy-border backdrop-blur-md">
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-xl border border-navy-border bg-navy-card flex items-center justify-center text-muted hover:text-white transition-all text-sm"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="font-display font-bold text-white text-sm">
            {isPickup ? "Set Pickup on Google Map" : "Set Destination on Google Map"}
          </h2>
          <p className="text-[10px] text-muted font-mono">Drag the map to position the pin</p>
        </div>
        <div className="w-9" />
      </header>

      {/* Map View Container */}
      <div className="relative flex-1 w-full overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full bg-[#111]" />

        {/* Center Target Pin (Fixed Center) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 -translate-y-6">
          {/* Tooltip speech bubble */}
          <div
            className="px-3 py-1.5 rounded-xl bg-navy-deep/95 border border-cyan-400/50 shadow-2xl text-xs font-bold text-white flex items-center gap-1.5 mb-1 animate-bounce"
            style={{ animationDuration: "2s", boxShadow: "0 8px 24px rgba(0,0,0,0.7)" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
            <span>{isPickup ? "Pickup Here" : "Drop Here"}</span>
          </div>

          {/* Pin Graphic */}
          <div className="relative flex flex-col items-center">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg shadow-2xl border-2 border-white"
              style={{
                background: isPickup ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #2563EB, #06B6D4)",
                boxShadow: isPickup ? "0 0 20px rgba(16,185,129,0.7)" : "0 0 20px rgba(37,99,235,0.7)",
              }}
            >
              {isPickup ? "📍" : "🏁"}
            </div>
            {/* Pin pointer tip */}
            <div
              className="w-0 h-0 border-x-4 border-x-transparent border-t-[8px]"
              style={{ borderTopColor: isPickup ? "#059669" : "#2563EB" }}
            />
            {/* Ground shadow dot */}
            <div className="h-2 w-4 rounded-full bg-black/40 blur-[1px] mt-0.5" />
          </div>
        </div>

        {/* GPS My Location Floating Button */}
        <button
          onClick={locateUser}
          disabled={locating}
          className="absolute right-4 bottom-24 z-20 h-12 w-12 rounded-2xl bg-navy-deep/90 border border-blue-primary/50 shadow-2xl flex items-center justify-center text-blue-light hover:bg-blue-primary/20 active:scale-95 transition-all"
          title="Recenter to my location"
        >
          {locating ? (
            <span className="h-5 w-5 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          )}
        </button>
      </div>

      {/* Bottom Confirmation Card (Ola / Uber Style) */}
      <div className="relative z-20 bg-navy-deep border-t border-navy-border p-4 pb-6 space-y-3 shadow-2xl">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-navy-card border border-navy-border">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${dotColor}20`, border: `1px solid ${dotColor}40` }}
          >
            {isPickup ? "📍" : "🏁"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
              {isPickup ? "Selected Pickup Spot" : "Selected Drop Spot"}
            </span>
            <p className="font-display font-bold text-white text-sm truncate mt-0.5">
              {loadingAddress ? "Updating address…" : address}
            </p>
            <p className="text-[10px] font-mono text-muted mt-0.5">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loadingAddress}
          className="btn-gradient w-full py-4 rounded-2xl font-display font-bold text-white shadow-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <span>Confirm {isPickup ? "Pickup" : "Drop"} Location</span>
          <span>✓</span>
        </button>
      </div>
    </div>
  );
}
