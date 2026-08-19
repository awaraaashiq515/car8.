"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RideType, VehicleType, clearToken, getUserName, resolvePlaceCoordinates } from "@/lib/api";
import LocationInput from "@/components/LocationInput";
import LocationPermissionModal from "@/components/LocationPermissionModal";
import { checkLocationPermission, getCurrentCoordinates, reverseGeocode } from "@/lib/geo";

type VT = VehicleType;
type RT = RideType;

const RIDE_TYPES: { value: RT; label: string; icon: string; desc: string }[] = [
  { value: "OUTSTATION", label: "Outstation", icon: "🏔️", desc: "One way / round trip" },
  { value: "LOCAL",      label: "Local",      icon: "🏙️", desc: "Within city" },
  { value: "AIRPORT",    label: "Airport",    icon: "✈️", desc: "Drop & pickup" },
  { value: "HOURLY",     label: "Hourly",     icon: "⏱️", desc: "Book by hours" },
];

const VEHICLES: { value: VT; label: string; icon: string; seats: string; price: string }[] = [
  { value: "HATCHBACK", label: "Hatchback", icon: "🚗", seats: "4 seats", price: "₹12/km" },
  { value: "SEDAN",     label: "Sedan",     icon: "🚙", seats: "4 seats", price: "₹15/km" },
  { value: "SUV",       label: "SUV",       icon: "🚕", seats: "6 seats", price: "₹22/km" },
  { value: "LUXURY",    label: "Luxury",    icon: "🚘", seats: "Premium", price: "₹35/km" },
];

const QUICK_PLACES = [
  { label: "Shimla Bus Stand",   icon: "🏔️" },
  { label: "Manali Mall Road",   icon: "🎿" },
  { label: "Mandi Bus Stand",    icon: "🛣️" },
  { label: "Delhi Connaught Place", icon: "🏛️" },
];

function TimeGreeting(name: string | null) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name?.split(" ")[0] || "there";
  return `${greet}, ${first}! 👋`;
}

export default function CustomerHomePage() {
  const router = useRouter();

  const [pickup,       setPickup]       = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [drop,         setDrop]         = useState("");
  const [dropCoords,   setDropCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [rideType,     setRideType]     = useState<RT>("OUTSTATION");
  const [vehicleType,  setVehicleType]  = useState<VT>("SUV");
  const [userName,     setUserNameVal]  = useState<string | null>(null);
  const [showMenu,     setShowMenu]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [autoLocating, setAutoLocating] = useState(false);
  const [locToast,     setLocToast]     = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("cab8_token");
    const role  = window.localStorage.getItem("cab8_role");
    if (!token) { router.replace("/login"); return; }
    if (role === "DRIVER") { router.replace("/driver/dashboard"); return; }
    setUserNameVal(getUserName());

    // Automatic Ola/Uber style permission check and auto-location fetch
    const initLocation = async () => {
      try {
        const perm = await checkLocationPermission();
        if (perm === "granted") {
          setAutoLocating(true);
          const coords = await getCurrentCoordinates();
          setPickupCoords(coords);
          const addr = await reverseGeocode(coords.lat, coords.lng);
          setPickup(addr);
          setLocToast(`📍 Pickup set to: ${addr}`);
          setTimeout(() => setLocToast(null), 4000);
        } else if (perm === "prompt") {
          const prompted = window.sessionStorage.getItem("cab8_loc_prompted");
          if (!prompted) {
            // Small delay to make sure UI is loaded smoothly before popping modal
            setTimeout(() => setShowLocModal(true), 600);
          }
        }
      } catch {
        /* ignore error */
      } finally {
        setAutoLocating(false);
      }
    };

    initLocation();
  }, [router]);

  const handleLocationDetected = (address: string, coords: { lat: number; lng: number }) => {
    setPickup(address);
    setPickupCoords(coords);
    setShowLocModal(false);
    window.sessionStorage.setItem("cab8_loc_prompted", "true");
    setLocToast(`📍 Pickup set to: ${address}`);
    setTimeout(() => setLocToast(null), 4000);
  };

  const handleDismissLocModal = () => {
    setShowLocModal(false);
    window.sessionStorage.setItem("cab8_loc_prompted", "true");
  };

  function handleSearch() {
    if (!pickup) { setError("Please select or enter a pickup location."); return; }
    if (!drop)   { setError("Please select or enter a drop location."); return; }
    if (pickup.toLowerCase() === drop.toLowerCase()) { setError("Pickup and drop cannot be the same."); return; }
    setError(null);
    const params = new URLSearchParams({ pickup, drop, rideType, vehicleType });
    if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
      params.set("pickupLat", pickupCoords.lat.toString());
      params.set("pickupLng", pickupCoords.lng.toString());
    }
    if (dropCoords && dropCoords.lat && dropCoords.lng) {
      params.set("dropLat", dropCoords.lat.toString());
      params.set("dropLng", dropCoords.lng.toString());
    }
    router.push(`/results?${params.toString()}`);
  }

  function handleLogout() {
    clearToken();
    window.localStorage.removeItem("cab8_role");
    window.localStorage.removeItem("cab8_user_name");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col relative overflow-x-hidden">

      {/* ── Ambient top glow ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-25"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 65%)" }} />
      </div>

      {/* ── Auto-Location Toast Indicator ── */}
      {locToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[250] max-w-sm w-[90%] bg-[#0D1B2E] border border-cyan-500/50 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-xs text-white animate-fade-down">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="truncate flex-1">{locToast}</span>
          <button onClick={() => setLocToast(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ════════════════════════════════════════
          TOP BAR
      ════════════════════════════════════════ */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-6 pb-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>🚕</div>
          <span className="font-display text-xl font-bold text-white">
            Cab<span className="text-gradient">8</span>
          </span>
        </div>

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-2xl border border-navy-border bg-navy-card pl-1.5 pr-3 py-1.5 hover:border-blue-primary/40 transition-all"
          >
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
              {userName ? userName[0].toUpperCase() : "U"}
            </div>
            <span className="text-white text-xs font-medium max-w-[70px] truncate hidden sm:block">
              {userName || "Account"}
            </span>
            <span className="text-muted text-xs">{showMenu ? "▲" : "▼"}</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-52 rounded-2xl border border-navy-border bg-navy-card shadow-2xl z-50 overflow-hidden animate-fade-up"
              style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
              <div className="px-4 py-3 border-b border-navy-border">
                <p className="text-[11px] text-muted font-mono uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-semibold text-white mt-0.5 truncate">{userName || "Customer"}</p>
              </div>
              {[
                { href: "/my-rides", icon: "🚕", label: "My Rides" },
                { href: "/profile",  icon: "👤", label: "Profile" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-navy-hover transition-colors">
                  <span className="text-base">{item.icon}</span> {item.label}
                </Link>
              ))}
              <div className="border-t border-navy-border" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red hover:bg-red/10 transition-colors">
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════
          GREETING SECTION
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pt-4 pb-6">
        <p className="text-muted text-sm">{TimeGreeting(userName)}</p>
        <h1 className="font-display text-2xl font-bold text-white mt-1 leading-tight">
          Where are you<br />
          <span className="text-gradient">heading today?</span>
        </h1>
      </section>

      {/* ════════════════════════════════════════
          BOOKING CARD  (main widget)
      ════════════════════════════════════════ */}
      <section className="relative z-30 px-4 pb-5">
        <div className="rounded-3xl border border-navy-border bg-navy-card p-4"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

          {/* Route inputs */}
          <div className="space-y-3 mb-4">
            <LocationInput
              label="📍 Pickup"
              value={pickup}
              onChange={(label, place) => {
                setPickup(label);
                if (place && place.lat && place.lng) {
                  setPickupCoords({ lat: place.lat, lng: place.lng });
                } else {
                  setPickupCoords(null);
                }
              }}
              placeholder="Search or enter pickup location…"
              isPickup
            />
            <LocationInput
              label="🏁 Drop"
              value={drop}
              onChange={(label, place) => {
                setDrop(label);
                if (place && place.lat && place.lng) {
                  setDropCoords({ lat: place.lat, lng: place.lng });
                } else {
                  setDropCoords(null);
                }
              }}
              placeholder="Search or enter drop location…"
            />
          </div>

          {error && (
            <p className="text-xs text-red mb-3 px-1">⚠️ {error}</p>
          )}

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="btn-gradient w-full py-3.5 text-base font-semibold rounded-2xl"
          >
            🔍 Find Available Rides
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          RIDE BOARD PROMO CARD
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-4 pb-5">
        <Link
          href="/board"
          className="flex items-center gap-4 rounded-2xl border p-4 transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(168,85,247,0.08))",
            borderColor: "rgba(168,85,247,0.3)",
            boxShadow: "0 0 20px rgba(168,85,247,0.1)",
          }}
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
          >
            📋
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-white text-sm">Ride Board</p>
            <p className="text-[11px] text-muted mt-0.5">Browse shared rides posted by drivers</p>
          </div>
          <span className="text-purple-400 text-sm flex-shrink-0">→</span>
        </Link>
      </section>

      {/* ════════════════════════════════════════
          RIDE TYPE — horizontal scroll
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pb-5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">Ride Type</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {RIDE_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setRideType(rt.value)}
              className={`flex-shrink-0 rounded-2xl border px-4 py-3 text-left transition-all duration-200 min-w-[120px] ${
                rideType === rt.value
                  ? "border-blue-primary"
                  : "border-navy-border bg-navy-card hover:border-navy-hover"
              }`}
              style={rideType === rt.value ? {
                background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.15))",
                boxShadow: "0 0 0 1px rgba(37,99,235,0.5)"
              } : {}}
            >
              <div className="text-2xl mb-1.5">{rt.icon}</div>
              <div className={`text-sm font-semibold ${rideType === rt.value ? "text-blue-light" : "text-white"}`}>
                {rt.label}
              </div>
              <div className="text-[11px] text-muted mt-0.5">{rt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          VEHICLE SELECTION
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pb-5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">Choose Vehicle</h2>
        <div className="grid grid-cols-4 gap-2">
          {VEHICLES.map((v) => {
            const active = vehicleType === v.value;
            return (
              <button
                key={v.value}
                onClick={() => setVehicleType(v.value)}
                className="rounded-2xl border py-3.5 text-center transition-all duration-200 relative overflow-hidden"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(6,182,212,0.2))",
                  borderColor: "#2563EB",
                  boxShadow: "0 0 16px rgba(37,99,235,0.3)",
                } : {
                  borderColor: "#1A2E45",
                  background: "#0D1B2E",
                }}
              >
                {active && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] text-white"
                    style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>✓</div>
                )}
                <div className="text-2xl mb-1">{v.icon}</div>
                <div className={`text-xs font-bold ${active ? "text-blue-light" : "text-white"}`}>{v.label}</div>
                <div className="text-[10px] text-muted mt-0.5">{v.price}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════
          QUICK PLACES
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pb-6">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">Popular Destinations</h2>
        <div className="space-y-2">
          {QUICK_PLACES.map((place) => (
            <button
              key={place.label}
              onClick={() => {
                setDrop(place.label);
                const coords = resolvePlaceCoordinates(place.label);
                if (coords && coords.lat && coords.lng) {
                  setDropCoords({ lat: coords.lat, lng: coords.lng });
                }
              }}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                drop === place.label
                  ? "border-blue-primary/50 bg-blue-primary/10"
                  : "border-navy-border bg-navy-card hover:border-navy-hover"
              }`}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0D1B2E, #162540)" }}>
                {place.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{place.label}</div>
                <div className="text-[11px] text-muted">Tap to set as drop</div>
              </div>
              {drop === place.label
                ? <span className="text-green text-xs font-mono">Selected ✓</span>
                : <span className="text-muted text-sm">→</span>
              }
            </button>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BOTTOM STATS BAR
      ════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pb-4 mt-auto">
        <div className="grid grid-cols-4 gap-3 rounded-2xl border border-navy-border bg-navy-card p-3">
          {[
            { icon: "🏙️", val: "5+",    label: "Cities" },
            { icon: "✅", val: "100%",  label: "Verified" },
            { icon: "⏱️", val: "24/7",  label: "Available" },
            { icon: "💰", val: "₹12",   label: "Per km" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-base mb-0.5">{s.icon}</div>
              <div className="font-display text-sm font-bold text-gradient">{s.val}</div>
              <div className="text-[10px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BOTTOM NAV BAR
      ════════════════════════════════════════ */}
      <nav className="sticky bottom-0 z-30 border-t border-navy-border bg-navy-deep/95 backdrop-blur-sm">
        <div className="flex items-center justify-around px-4 py-3">
          {[
            { icon: "🏠", label: "Home",     href: "/home",     active: true  },
            { icon: "📋", label: "Board",    href: "/board",    active: false },
            { icon: "🚕", label: "My Rides", href: "/my-rides", active: false },
            { icon: "👤", label: "Profile",  href: "/profile",  active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-all ${
                item.active ? "text-blue-light" : "text-muted hover:text-white"
              }`}
            >
              <span className={`text-xl ${item.active ? "drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
              {item.active && (
                <span className="h-0.5 w-4 rounded-full mt-0.5"
                  style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)" }} />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Automatic Ola/Uber Location Permission Modal ── */}
      {showLocModal && (
        <LocationPermissionModal
          onLocationDetected={handleLocationDetected}
          onDismiss={handleDismissLocModal}
        />
      )}

    </div>
  );
}
