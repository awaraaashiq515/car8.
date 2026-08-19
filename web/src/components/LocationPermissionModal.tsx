"use client";

import { useState } from "react";
import { getCurrentCoordinates, reverseGeocode } from "@/lib/geo";
import { Place } from "@/lib/api";

interface Props {
  onLocationDetected: (address: string, coords: { lat: number; lng: number }) => void;
  onDismiss: () => void;
}

export default function LocationPermissionModal({ onLocationDetected, onDismiss }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      let address = "";
      try {
        address = await reverseGeocode(coords.lat, coords.lng);
      } catch {
        address = "Current GPS Location";
      }
      onLocationDetected(address, coords);
    } catch (err: any) {
      setError("Location permission denied or unavailable. You can enter your pickup location manually.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-gradient-to-b from-[#0D1B2E] to-[#081224] border-t sm:border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center animate-slide-up"
        style={{ boxShadow: "0 0 50px rgba(6,182,212,0.15)" }}
      >
        {/* Glow ambient */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Radar Icon Illustration */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-blue-600/30 animate-pulse" />
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/30"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
          >
            📍
          </div>
        </div>

        {/* Title & Desc */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold mb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LOCATION PERMISSION</span>
        </div>

        <h3 className="font-display text-2xl font-bold text-white mb-2">
          Enable Device Location
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs mx-auto">
          Allow Cab8 to automatically find your current pickup point, calculate accurate hill fares, and connect you with nearby verified drivers.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Detecting Exact Location…</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Allow Location (Auto-Detect)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            disabled={loading}
            className="w-full py-3 px-6 rounded-2xl bg-transparent hover:bg-[#162540] border border-[#1A2E45] text-slate-400 hover:text-white font-semibold text-xs transition cursor-pointer"
          >
            Enter Pickup Manually
          </button>
        </div>

        <p className="text-[10px] text-slate-500 mt-4">
          🔒 Your location is only used to set your pickup point and track your ride.
        </p>
      </div>
    </div>
  );
}
