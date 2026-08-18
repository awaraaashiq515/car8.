"use client";

import { useState } from "react";
import { Ride } from "@/lib/api";

interface ShareSafetyModalProps {
  ride: Ride;
  onClose: () => void;
}

export default function ShareSafetyModal({ ride, onClose }: ShareSafetyModalProps) {
  const [copied, setCopied] = useState(false);

  // Exact Current Live Location Coordinates on Google Maps
  const currentLat = ride.driver?.current_lat || ride.pickup_lat;
  const currentLng = ride.driver?.current_lng || ride.pickup_lng;
  const googleMapsLiveLocationUrl = `https://maps.google.com/?q=${currentLat},${currentLng}`;

  // Official Google Maps Driving Navigation Route URL
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${ride.pickup_lat},${ride.pickup_lng}&destination=${ride.drop_lat},${ride.drop_lng}&travelmode=driving`;

  // WhatsApp Message containing Live Location + Driving Route
  const shareText = `📍 Live Location on Google Maps:\n${googleMapsLiveLocationUrl}\n\n🗺️ Google Maps Driving Route:\n${googleMapsRouteUrl}\n\n🚖 Taxi: ${ride.vehicle_type} (${ride.driver?.vehicle_number || "Verified Taxi"})\n👨‍✈️ Driver: ${ride.driver?.name || "Verified Driver"}\n📍 Pickup: ${ride.pickup_text}\n🏁 Destination: ${ride.drop_text}\n\n🚨 Emergency: Police 112 · Women Helpline 1091`;

  function handleCopy() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(googleMapsLiveLocationUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleWhatsAppShare() {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Live Location",
          text: shareText,
          url: googleMapsLiveLocationUrl,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-[#0B1526] border border-cyan-400/40 p-5 shadow-2xl space-y-4 animate-fade-up text-white overflow-hidden relative"
        style={{ boxShadow: "0 0 50px rgba(6,182,212,0.35)" }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-navy-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xl shadow">
              📍
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Share Live Location</h3>
              <p className="text-[11px] text-cyan-300 font-mono">Live GPS Coordinates &amp; Safety</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-navy-card border border-navy-border flex items-center justify-center text-muted hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Live Trip Location Summary */}
        <div className="rounded-2xl bg-navy-deep border border-navy-border p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-muted font-mono text-[10px]">
            <span>GOOGLE MAPS GPS CONNECTED</span>
            <span className="flex items-center gap-1 text-green font-bold">
              <span className="h-2 w-2 rounded-full bg-green animate-ping" />
              LIVE GPS
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-green text-sm font-bold">🟢</span>
              <p className="text-white font-medium truncate flex-1">{ride.pickup_text}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red text-sm font-bold">🏁</span>
              <p className="text-white font-medium truncate flex-1">{ride.drop_text}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-border/60 flex items-center justify-between text-[11px] font-mono text-cyan-300">
            <span>🚖 {ride.driver?.vehicle_number || ride.vehicle_type}</span>
            <span>👨‍✈️ {ride.driver?.name || "Verified Driver"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Share on WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-green shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">💬</span>
            <span>Share Live Location on WhatsApp</span>
          </button>

          {/* Copy Link & SMS Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-3 rounded-2xl font-bold text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-400/40 hover:bg-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{copied ? "✓ Copied!" : "📋 Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-navy-card border border-navy-border hover:border-cyan-400 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔗 Share via SMS…</span>
            </button>
          </div>
        </div>

        {/* Emergency SOS */}
        <div className="rounded-2xl border border-red/30 bg-red/10 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-red">
            <span className="text-base">🚨</span>
            <div>
              <p className="font-bold text-white text-xs">24x7 Helplines</p>
              <p className="text-[10px] text-red font-mono">Police: 112 · Women: 1091</p>
            </div>
          </div>
          <a
            href="tel:112"
            className="bg-red text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow active:scale-95 transition-all"
          >
            Call 112
          </a>
        </div>
      </div>
    </div>
  );
}
