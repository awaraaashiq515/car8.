"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  setDriverToken,
  VehicleType, VehicleCategory,
  CATEGORY_META, VEHICLE_META, VEHICLE_CATEGORY_MAP,
  BASE_FARE_MAP, DEFAULT_PER_KM_RATE,
} from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Stage = 0 | 1 | 2 | 3 | 4; // 0=details, 1=location, 2=vehicle, 3=documents, 4=otp
type VC = VehicleCategory;
type VT = VehicleType;

/** All categories in order */
const CATEGORIES: VC[] = ["CAR", "BIKE", "AUTO", "GOODS", "HEAVY"];

/** Sub-types per category */
const CATEGORY_VEHICLES: Record<VC, VT[]> = {
  CAR:   ["HATCHBACK", "SEDAN", "SUV", "LUXURY"],
  BIKE:  ["BIKE", "ELECTRIC_BIKE"],
  AUTO:  ["AUTO", "E_RICKSHAW"],
  GOODS: ["PICKUP_TRUCK", "MINI_TRUCK", "TEMPO", "TRUCK"],
  HEAVY: ["JCB", "TRACTOR", "CRANE", "TIPPER"],
};

/** Default seats per vehicle type */
const DEFAULT_SEATS: Record<VT, number> = {
  HATCHBACK: 4, SEDAN: 4, SUV: 6, LUXURY: 4,
  BIKE: 1, ELECTRIC_BIKE: 1,
  AUTO: 3, E_RICKSHAW: 3,
  PICKUP_TRUCK: 2, MINI_TRUCK: 2, TEMPO: 2, TRUCK: 2,
  JCB: 1, TRACTOR: 1, CRANE: 1, TIPPER: 1,
};

const PERMIT_ZONES = [
  { id: "HP",          label: "Himachal Pradesh", icon: "🏔️" },
  { id: "Delhi",       label: "Delhi / NCR",       icon: "🏙️" },
  { id: "Chandigarh",  label: "Chandigarh",         icon: "🌆" },
  { id: "Punjab",      label: "Punjab",             icon: "🌾" },
  { id: "Uttarakhand", label: "Uttarakhand",        icon: "🗻" },
  { id: "AllIndia",    label: "All India Permit",   icon: "🇮🇳" },
];

// HP Location data — District → Tehsil → Villages
const HP_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Mandi": {
    "Mandi":       ["Mandi", "Rewalsar", "Tihara", "Balh", "Sundernagar", "Katindhi", "Churag", "Ladrour", "Dharmpur"],
    "Sundernagar": ["Sundernagar", "Kafota", "Balichowki", "Janjehli", "Dharampur", "Sarkaghat", "Thunag"],
    "Sarkaghat":   ["Sarkaghat", "Thunag", "Chachyot", "Sandhol", "Barsar"],
    "Chachyot":    ["Chachyot", "Baijnath", "Shilaroo", "Tikkan"],
    "Karsog":      ["Karsog", "Baggi", "Tattapani", "Kamand"],
    "Jogindernagar":["Jogindernagar", "Dharla", "Bir", "Billing"],
    "Padhar":      ["Padhar", "Sandhole", "Ratni"],
  },
  "Shimla": {
    "Shimla":      ["Shimla", "Kufri", "Mashobra", "Chail", "Fagu", "Theog"],
    "Theog":       ["Theog", "Matiana", "Narkanda", "Kotkhai", "Jubbal"],
    "Rampur":      ["Rampur", "Sarahan", "Anni", "Nankhari", "Jeori"],
    "Rohru":       ["Rohru", "Chirgaon", "Tikkar", "Doha"],
    "Chopal":      ["Chopal", "Nerwa", "Sanog"],
  },
  "Kullu": {
    "Kullu":       ["Kullu", "Bhuntar", "Raison", "Naggar"],
    "Manali":      ["Manali", "Old Manali", "Solang", "Vashisht", "Goshal", "Palchan"],
    "Ani":         ["Ani", "Nirmand", "Luhri"],
    "Banjar":      ["Banjar", "Jibhi", "Tirthan", "Sainj"],
  },
  "Kangra": {
    "Dharamshala": ["Dharamshala", "McLeod Ganj", "Bhagsunad", "Forsythganj"],
    "Palampur":    ["Palampur", "Baijnath", "Bir", "Billing", "Maranda"],
    "Nurpur":      ["Nurpur", "Indora", "Fatehpur"],
    "Dehra":       ["Dehra", "Jawali", "Nagrota Bagwan"],
    "Hamirpur":    ["Hamirpur", "Nadaun", "Barsar", "Bhoranj"],
  },
  "Solan": {
    "Solan":       ["Solan", "Chambaghat", "Kasauli", "Subathu"],
    "Nalagarh":    ["Nalagarh", "Baddi", "Barotiwala", "Ramshehar"],
    "Arki":        ["Arki", "Kandaghat", "Darlaghat"],
  },
  "Bilaspur": {
    "Bilaspur":    ["Bilaspur", "Gehri Mughlan", "Namhol"],
    "Ghumarwin":   ["Ghumarwin", "Shri Naina Devi Ji"],
  },
  "Hamirpur": {
    "Hamirpur":    ["Hamirpur", "Nadaun", "Tira Sujanpur"],
    "Barsar":      ["Barsar", "Bhoranj", "Lambloo"],
  },
  "Una": {
    "Una":         ["Una", "Gagret", "Amb", "Bangana"],
    "Tahliwal":    ["Tahliwal", "Kutlehar"],
  },
  "Chamba": {
    "Chamba":      ["Chamba", "Dalhousie", "Khajjiar", "Bharmaur"],
    "Bharmour":    ["Bharmour", "Holi", "Tissa"],
    "Churah":      ["Churah", "Killar", "Tandi"],
  },
  "Kinnaur": {
    "Reckong Peo": ["Reckong Peo", "Kalpa", "Sangla", "Chitkul", "Moorang"],
    "Nichar":      ["Nichar", "Kafnu", "Tapri"],
  },
  "Lahaul & Spiti": {
    "Keylong":     ["Keylong", "Udaipur", "Triloknath", "Sissu"],
    "Kaza":        ["Kaza", "Tabo", "Dhankar", "Pin Valley"],
  },
  "Sirmaur": {
    "Nahan":       ["Nahan", "Paonta Sahib", "Rajgarh", "Renuka Ji"],
    "Shillai":     ["Shillai", "Pachhad"],
  },
};

const STEPS = [
  { label: "Personal Details",  icon: "👤" },
  { label: "Base Location",    icon: "📍" },
  { label: "Vehicle Details",  icon: "🚗" },
  { label: "Documents",        icon: "📄" },
  { label: "Verify OTP",       icon: "📱" },
];

function StepBar({ current }: { current: Stage }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        return (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done   ? "bg-green text-white" :
                  active ? "text-white" :
                           "bg-navy-border text-dimmed"
                }`}
                style={active ? { background: "linear-gradient(135deg, #2563EB, #06B6D4)" } : {}}
              >
                {done ? "✓" : step.icon}
              </div>
              <span className={`text-[9px] font-mono text-center w-14 leading-tight ${
                active ? "text-blue-light" : done ? "text-green" : "text-dimmed"
              }`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-5 transition-all duration-500 ${
                idx < current ? "bg-green" : "bg-navy-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Image upload helper ──────────────────────────────────
function PhotoUpload({
  label, sublabel, icon, value, onChange,
}: {
  label: string; sublabel: string; icon: string;
  value: string; onChange: (b64: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed py-4 flex flex-col items-center gap-2 transition-all duration-200 ${
          value ? "border-green/50 bg-green/5" : "border-navy-border hover:border-blue-primary/50 bg-navy-deep"
        }`}
      >
        {value ? (
          <img src={value} alt={label} className="h-28 w-full object-contain rounded-xl" />
        ) : (
          <>
            <span className="text-3xl">{icon}</span>
            <div className="text-sm font-medium text-white">{sublabel}</div>
            <div className="text-xs text-muted">Tap to upload · JPG/PNG</div>
          </>
        )}
        {value && (
          <span className="text-xs text-green font-mono mt-1">✓ Photo added — tap to change</span>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── GPS location resolve helper ──────────────────────────
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.address as Record<string, string>;
  } catch { return null; }
}

export default function DriverRegisterPage() {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────
  const [stage,         setStage]         = useState<Stage>(0);
  const [name,          setName]          = useState("");
  const [phone,         setPhone]         = useState("");
  // Location
  const [city,          setCity]          = useState("Mandi");
  const [district,      setDistrict]      = useState("Mandi");
  const [tehsil,        setTehsil]        = useState("");
  const [village,       setVillage]       = useState("");
  const [gpsLoading,    setGpsLoading]    = useState(false);
  const [gpsError,      setGpsError]      = useState<string | null>(null);
  const [currentLat,    setCurrentLat]    = useState<number | null>(null);
  const [currentLng,    setCurrentLng]    = useState<number | null>(null);
  // Vehicle
  const [vehicleCategory, setVehicleCategory] = useState<VC>("CAR");
  const [vehicleType,     setVehicleType]     = useState<VT>("SUV");
  const [vehicleNumber,   setVehicleNumber]   = useState("");
  const [vehicleMake,     setVehicleMake]     = useState("");
  const [vehicleModel,    setVehicleModel]    = useState("");
  const [vehicleYear,     setVehicleYear]     = useState<string>("");
  const [seats,           setSeats]           = useState(6);
  const [loadCapacity,    setLoadCapacity]    = useState("");  // for GOODS
  const [hourlyRate,      setHourlyRate]      = useState<string>(""); // for HEAVY
  const [ratePerKm,       setRatePerKm]       = useState<string>(""); // custom rate per km for drivers
  const [permitZones,     setPermitZones]     = useState<string[]>(["HP"]);
  // Documents
  const [rcPhoto,       setRcPhoto]       = useState("");
  const [aadharPhoto,   setAadharPhoto]   = useState("");
  const [licensePhoto,  setLicensePhoto]  = useState("");
  const [vehiclePhoto,  setVehiclePhoto]  = useState("");
  // OTP
  const [devCode,       setDevCode]       = useState<string | null>(null);
  const [code,          setCode]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Pre-fill from URL search params if redirected from Union Apply page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("name")) setName(params.get("name") || "");
      if (params.get("phone")) setPhone(params.get("phone") || "");
      if (params.get("district")) {
        const d = params.get("district") || "Mandi";
        setDistrict(d);
        setCity(d);
      }
      if (params.get("plate")) setVehicleNumber(params.get("plate") || "");
      if (params.get("vehicle")) {
        const v = params.get("vehicle")?.toUpperCase() as VT | undefined;
        if (v && v in VEHICLE_CATEGORY_MAP) {
          setVehicleType(v);
          const cat = VEHICLE_CATEGORY_MAP[v];
          setVehicleCategory(cat);
          setSeats(DEFAULT_SEATS[v] ?? 4);
        }
      }
    }
  }, []);

  const districts  = Object.keys(HP_LOCATIONS);
  const tehsils    = Object.keys(HP_LOCATIONS[district] || {});
  const villages   = HP_LOCATIONS[district]?.[tehsil] || [];

  // ── GPS Auto-fill ──────────────────────────────────────
  async function detectLocation() {
    if (!navigator.geolocation) { setGpsError("GPS not supported on this device."); return; }
    setGpsLoading(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLat(lat); setCurrentLng(lng);

        const addr = await reverseGeocode(lat, lng);
        if (addr) {
          const detectedDistrict = addr.county || addr.state_district || addr.city_district || "";
          const detectedCity     = addr.city || addr.town || addr.village || addr.county || "Mandi";
          const detectedVillage  = addr.village || addr.hamlet || addr.suburb || "";

          // Best-match HP district
          const matchedDistrict = districts.find(d => d.toLowerCase() === detectedDistrict.toLowerCase())
            || districts.find(d => detectedDistrict.toLowerCase().includes(d.toLowerCase()))
            || "Mandi";

          setDistrict(matchedDistrict);
          setCity(detectedCity);
          setVillage(detectedVillage);
        }
        setGpsLoading(false);
      },
      () => { setGpsError("Could not access GPS. Please select location manually."); setGpsLoading(false); },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  async function requestOtp() {
    if (name.trim().length < 2) { setError("Enter your full name."); return; }
    if (phone.length < 10)      { setError("Enter a valid 10-digit phone number."); return; }
    if (!vehicleNumber.trim())  { setError("Enter vehicle registration number."); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API}/driver/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, city: city || district || "Mandi",
          district, tehsil, village,
          vehicleType, vehicleNumber,
          vehicleCategory,
          vehicleMake: vehicleMake || undefined,
          vehicleModel: vehicleModel || undefined,
          vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
          seats,
          loadCapacity: loadCapacity || undefined,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          ratePerKm: ratePerKm ? parseFloat(ratePerKm) : undefined,
          permitZones: permitZones.join(","),
          rcPhoto: rcPhoto || undefined,
          aadharPhoto: aadharPhoto || undefined,
          licensePhoto: licensePhoto || undefined,
          vehiclePhoto: vehiclePhoto || undefined,
          currentLat: currentLat ?? undefined,
          currentLng: currentLng ?? undefined,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        throw new Error(res.ok ? "Server error" : `Server error ${res.status}: Please make sure backend is running on port 4000.`);
      }
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      setDevCode(data.devOnlyCode || null);
      setStage(4);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function verifyOtp() {
    if (code.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API}/driver/auth/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, code,
          city: city || district || "Mandi",
          district, tehsil, village,
          vehicleType, vehicleNumber,
          vehicleCategory,
          vehicleMake: vehicleMake || undefined,
          vehicleModel: vehicleModel || undefined,
          vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
          seats,
          loadCapacity: loadCapacity || undefined,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          ratePerKm: ratePerKm ? parseFloat(ratePerKm) : undefined,
          permitZones: permitZones.join(","),
          rcPhoto: rcPhoto || undefined,
          aadharPhoto: aadharPhoto || undefined,
          licensePhoto: licensePhoto || undefined,
          vehiclePhoto: vehiclePhoto || undefined,
          currentLat: currentLat ?? undefined,
          currentLng: currentLng ?? undefined,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        throw new Error(`Server error ${res.status}: Response was not valid JSON. Check backend is running.`);
      }
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error) || "Verification failed.");

      setDriverToken(data.token);
      window.localStorage.setItem("cab8_token", data.token);
      window.localStorage.setItem("cab8_role", "DRIVER");
      window.localStorage.setItem("cab8_user_name", name);

      router.push("/driver/dashboard");
    } catch (e: any) {
      setError(e.message || "Invalid OTP.");
    } finally { setLoading(false); }
  }

  function togglePermit(id: string) {
    setPermitZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  return (
    <main className="min-h-screen bg-navy-deep flex items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/driver" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>🚕</div>
            <span className="font-display text-xl font-bold text-white">
              Cab<span className="text-gradient">8</span>
              <span className="ml-1 text-xs font-mono text-muted"> Driver Registration</span>
            </span>
          </Link>
        </div>

        {/* Step bar */}
        <StepBar current={stage} />

        {/* Card */}
        <div className="card">
          {error && (
            <div className="rounded-xl bg-red/10 border border-red/20 px-4 py-3 text-sm text-red mb-4 flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="text-red/60 hover:text-red">✕</button>
            </div>
          )}

          {/* ──────── STEP 0: Personal Details ──────── */}
          {stage === 0 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Personal Details</h2>
                <p className="text-sm text-muted">Tell us about yourself to get started.</p>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    className="flex-1 rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted"
                  />
                </div>
              </div>

              <button
                onClick={() => { if (name.trim().length < 2) { setError("Enter your full name."); return; } if (phone.length < 10) { setError("Enter a valid 10-digit phone number."); return; } setError(null); setStage(1); }}
                className="btn-gradient w-full py-3.5 text-base"
              >Next: Location →</button>

              <div className="text-center text-xs text-muted pt-2 space-y-1">
                <div>
                  Already registered?{" "}
                  <Link href="/driver/login" className="text-blue-light hover:underline font-semibold">Login here</Link>
                </div>
                <div className="text-[11px] text-muted">
                  Or apply only for Union Membership?{" "}
                  <Link href="/union/apply" className="text-amber hover:underline font-semibold font-mono">Apply for Union →</Link>
                </div>
              </div>
            </div>
          )}

          {/* ──────── STEP 1: Location Details ──────── */}
          {stage === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Base Location</h2>
                <p className="text-sm text-muted">Where do you primarily operate from?</p>
              </div>

              {/* GPS auto-fill */}
              <button
                onClick={detectLocation}
                disabled={gpsLoading}
                className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                  gpsLoading ? "border-blue-primary/50 bg-blue-primary/10" : "border-navy-border bg-navy-deep hover:border-blue-primary/50"
                }`}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563EB22, #06B6D422)", border: "1px solid #2563EB44" }}>
                  {gpsLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-blue-primary/30 border-t-blue-primary animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-blue-light">
                    {gpsLoading ? "Detecting your location…" : "Auto-detect my location via GPS"}
                  </div>
                  <div className="text-xs text-muted">
                    {currentLat ? `✓ GPS coordinates captured (${currentLat.toFixed(4)}, ${currentLng?.toFixed(4)})` : "Tap to auto-fill district, tehsil & village"}
                  </div>
                </div>
              </button>
              {gpsError && <p className="text-xs text-red px-1">{gpsError}</p>}

              {/* District */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">District</label>
                <select
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setCity(e.target.value); setTehsil(""); setVillage(""); }}
                  className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors appearance-none"
                >
                  {districts.map((d) => <option key={d} value={d} className="bg-navy-deep">{d}</option>)}
                  <option value="Delhi" className="bg-navy-deep">Delhi</option>
                  <option value="Chandigarh" className="bg-navy-deep">Chandigarh</option>
                </select>
              </div>

              {/* Tehsil */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Tehsil / Block</label>
                <select
                  value={tehsil}
                  onChange={(e) => { setTehsil(e.target.value); setVillage(""); }}
                  className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors appearance-none"
                >
                  <option value="" className="bg-navy-deep">— Select Tehsil —</option>
                  {tehsils.map((t) => <option key={t} value={t} className="bg-navy-deep">{t}</option>)}
                </select>
              </div>

              {/* Village */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Village / Town / Ward</label>
                {villages.length > 0 ? (
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors appearance-none"
                  >
                    <option value="" className="bg-navy-deep">— Select Village / Town —</option>
                    {villages.map((v) => <option key={v} value={v} className="bg-navy-deep">{v}</option>)}
                  </select>
                ) : (
                  <input
                    type="text" value={village} onChange={(e) => setVillage(e.target.value)}
                    placeholder="Enter village or area name"
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStage(0)} className="btn-ghost flex-1 py-3">← Back</button>
                <button onClick={() => { if (!district) { setError("Select your district."); return; } setError(null); setStage(2); }}
                  className="btn-gradient flex-1 py-3">Next: Vehicle →</button>
              </div>
            </div>
          )}

          {/* ──────── STEP 2: Vehicle Details ──────── */}
          {stage === 2 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Vehicle Details</h2>
                <p className="text-sm text-muted">Tell us about your vehicle and permit zones.</p>
              </div>

              {/* Vehicle type selector — 2-step */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-2">Vehicle Category</label>

                {/* Step 1 — Category */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
                  {CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = vehicleCategory === cat;
                    return (
                      <button key={cat} type="button"
                        onClick={() => {
                          setVehicleCategory(cat);
                          const first = CATEGORY_VEHICLES[cat][0];
                          setVehicleType(first);
                          setSeats(DEFAULT_SEATS[first] ?? 1);
                        }}
                        className="flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 min-w-[60px] transition-all duration-200 relative"
                        style={active ? {
                          background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}18)`,
                          borderColor: meta.color,
                          boxShadow: `0 0 14px ${meta.glow}`,
                        } : { borderColor: "#1A2E45", background: "#0D1B2E" }}
                      >
                        {active && (
                          <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ background: meta.color }}>✓</div>
                        )}
                        <span className="text-xl">{meta.icon}</span>
                        <span className={`text-[10px] font-bold leading-tight text-center ${active ? "text-white" : "text-muted"}`}>
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 2 — Sub-type */}
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
                  {CATEGORY_META[vehicleCategory].label} Type
                </label>
                <div className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(CATEGORY_VEHICLES[vehicleCategory].length, 4)}, 1fr)` }}
                >
                  {CATEGORY_VEHICLES[vehicleCategory].map((vt) => {
                    const meta = VEHICLE_META[vt];
                    const catMeta = CATEGORY_META[vehicleCategory];
                    const active = vehicleType === vt;
                    return (
                      <button key={vt} type="button"
                        onClick={() => { setVehicleType(vt); setSeats(DEFAULT_SEATS[vt] ?? 1); }}
                        className="rounded-2xl border py-3.5 px-1 text-center transition-all duration-200 relative overflow-hidden"
                        style={active ? {
                          background: `linear-gradient(135deg, ${catMeta.color}28, ${catMeta.color}15)`,
                          borderColor: catMeta.color,
                          boxShadow: `0 0 12px ${catMeta.glow}`,
                        } : { borderColor: "#1A2E45", background: "#0D1B2E" }}
                      >
                        {active && (
                          <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ background: catMeta.color }}>✓</div>
                        )}
                        <div className="text-2xl mb-1">{meta.icon}</div>
                        <div className={`text-[11px] font-bold leading-tight ${active ? "text-white" : "text-slate-300"}`}>{meta.label}</div>
                        <div className="text-[10px] text-muted mt-1 font-mono">{meta.seats}</div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Professional Pricing & Live Fare Breakdown Preview ── */}
                {(() => {
                  const baseFare = BASE_FARE_MAP[vehicleCategory] ?? 50;
                  const defaultRate = DEFAULT_PER_KM_RATE[vehicleType] ?? 18;
                  const customNum = vehicleCategory === "HEAVY"
                    ? (hourlyRate ? parseFloat(hourlyRate) : 0)
                    : (ratePerKm ? parseFloat(ratePerKm) : 0);
                  const activeRate = customNum > 0 ? customNum : defaultRate;

                  return (
                    <div className="mt-4 p-4 rounded-2xl border border-navy-border bg-navy-card/90 space-y-3.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                          <span>💰</span> Fare & Rate Settings
                        </span>
                        <span className="text-[10px] text-muted bg-navy-deep px-2 py-0.5 rounded-full border border-navy-border font-mono">
                          Editable Anytime
                        </span>
                      </div>

                      {/* Standard Recommended Info Pill */}
                      <div className="p-2.5 rounded-xl bg-navy-deep border border-blue-primary/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-muted">
                          <span>💡</span>
                          <span>Standard {CATEGORY_META[vehicleCategory].label} Rate:</span>
                        </div>
                        <div className="font-mono font-bold text-blue-light">
                          ₹{defaultRate}{vehicleCategory === "HEAVY" ? "/hour" : "/km"}
                        </div>
                      </div>

                      {/* Input fields based on category */}
                      {vehicleCategory === "HEAVY" ? (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-mono text-[11px] uppercase tracking-wider text-white font-medium">
                              Your Hourly Rate (₹/hr)
                            </label>
                            <span className="text-[10px] text-amber-400 font-mono">Machinery Charge</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">₹</span>
                            <input
                              type="number"
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                              placeholder={`e.g. ${defaultRate} (Default: ₹${defaultRate}/hr)`}
                              className="w-full rounded-xl border border-navy-border bg-navy-deep pl-8 pr-16 py-2.5 text-sm text-white font-medium outline-none focus:border-blue-primary transition-colors placeholder-muted font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-mono">/ hour</span>
                          </div>
                        </div>
                      ) : vehicleCategory === "GOODS" ? (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-wider text-white mb-1">
                                Your Rate (₹/km)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  value={ratePerKm}
                                  onChange={(e) => setRatePerKm(e.target.value)}
                                  placeholder={`e.g. ${defaultRate}`}
                                  className="w-full rounded-xl border border-navy-border bg-navy-deep pl-7 pr-10 py-2 text-xs text-white outline-none focus:border-blue-primary transition-colors placeholder-muted font-mono"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-[10px] font-mono">/km</span>
                              </div>
                            </div>
                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-wider text-white mb-1">
                                Load Capacity
                              </label>
                              <input
                                type="text"
                                value={loadCapacity}
                                onChange={(e) => setLoadCapacity(e.target.value)}
                                placeholder="e.g. 1.5 Ton"
                                className="w-full rounded-xl border border-navy-border bg-navy-deep px-3 py-2 text-xs text-white outline-none focus:border-blue-primary transition-colors placeholder-muted"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-mono text-[11px] uppercase tracking-wider text-white font-medium">
                              Your Custom Rate (₹/km)
                            </label>
                            <span className="text-[10px] text-muted">
                              {customNum > 0 ? "Custom Rate Active" : "Using Default"}
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">₹</span>
                            <input
                              type="number"
                              value={ratePerKm}
                              onChange={(e) => setRatePerKm(e.target.value)}
                              placeholder={`e.g. ${defaultRate} (Leave empty for ₹${defaultRate}/km)`}
                              className="w-full rounded-xl border border-navy-border bg-navy-deep pl-8 pr-14 py-2.5 text-sm text-white font-medium outline-none focus:border-blue-primary transition-colors placeholder-muted font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-mono">/ km</span>
                          </div>
                        </div>
                      )}

                      {/* ── Live Earnings Breakdown / Calculator (Kitne KM par kitna banta hai) ── */}
                      <div className="pt-2 border-t border-navy-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                            <span>📊</span> Trip Fare Calculation Preview
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Base: ₹{baseFare} + ₹{activeRate}/{vehicleCategory === "HEAVY" ? "hr" : "km"}
                          </span>
                        </div>

                        {vehicleCategory === "HEAVY" ? (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { label: "1 Hour", hours: 1 },
                              { label: "4 Hours (Half Day)", hours: 4 },
                              { label: "8 Hours (Full Day)", hours: 8 },
                            ].map((slot) => {
                              const total = Math.round(activeRate * slot.hours);
                              return (
                                <div key={slot.label} className="p-2.5 rounded-xl bg-navy-deep border border-navy-border/80">
                                  <div className="text-[10px] text-muted font-mono">{slot.label}</div>
                                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">₹{total}</div>
                                  <div className="text-[9px] text-muted/70 mt-0.5">{slot.hours}h × ₹{activeRate}</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 text-center">
                            {[5, 10, 25, 50].map((km) => {
                              const total = Math.round(baseFare + activeRate * km);
                              return (
                                <div key={km} className="p-2 rounded-xl bg-navy-deep border border-navy-border/80">
                                  <div className="text-[10px] font-bold text-muted font-mono">{km} km</div>
                                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">₹{total}</div>
                                  <div className="text-[8.5px] text-muted/70 mt-0.5 font-mono">Base+₹{activeRate * km}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <p className="text-[10px] text-muted mt-2 text-center">
                          Formula: <span className="text-slate-300 font-mono">₹{baseFare} Base</span> + (<span className="text-slate-300 font-mono">Distance × ₹{activeRate}/km</span>). Customer pays this amount directly to you.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Vehicle Registration Number */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Vehicle Registration No.</label>
                <input
                  type="text" value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. HP33A 1234"
                  className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Make (Brand)</label>
                  <input type="text" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Maruti, Toyota"
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Model</label>
                  <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Swift, Innova"
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Year</label>
                  <input type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="e.g. 2021" min="2000" max="2026"
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors placeholder-muted" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">Total Seats</label>
                  <input type="number" value={seats} onChange={(e) => setSeats(parseInt(e.target.value) || 4)}
                    min="2" max="12"
                    className="w-full rounded-2xl border border-navy-border bg-navy-deep px-3 py-3 text-sm text-white outline-none focus:border-blue-primary transition-colors" />
                </div>
              </div>

              {/* Permit zones */}
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-2">Permit Zones</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMIT_ZONES.map((z) => {
                    const selected = permitZones.includes(z.id);
                    return (
                      <button key={z.id} type="button" onClick={() => togglePermit(z.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 ${
                          selected ? "border-blue-primary/60 bg-blue-primary/15 text-blue-light" : "border-navy-border bg-navy-deep text-muted hover:border-navy-hover"
                        }`}
                      >
                        <span className="text-base">{z.icon}</span>
                        <span className="font-medium leading-tight">{z.label}</span>
                        {selected && <span className="ml-auto text-blue-light">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStage(1)} className="btn-ghost flex-1 py-3">← Back</button>
                <button
                  onClick={() => { if (!vehicleNumber) { setError("Enter vehicle registration number."); return; } setError(null); setStage(3); }}
                  className="btn-gradient flex-1 py-3">Next: Documents →</button>
              </div>
            </div>
          )}

          {/* ──────── STEP 3: Documents ──────── */}
          {stage === 3 && (() => {
            const docConfig = {
              CAR: {
                rcLabel: "Car RC Book (Registration Certificate)",
                rcSublabel: "Upload front side of Car RC Book",
                licenseLabel: "Driving License (LMV / Commercial)",
                licenseSublabel: "Upload front side of Driving License",
                vehiclePhotoLabel: "Car Vehicle Photo",
                vehiclePhotoSublabel: "Upload clear front or side photo of your car",
                vehiclePhotoIcon: "🚗",
              },
              BIKE: {
                rcLabel: "Bike / Scooter RC Book",
                rcSublabel: "Upload two-wheeler RC certificate",
                licenseLabel: "Driving License (Two-Wheeler / MCWG)",
                licenseSublabel: "Upload front side of bike license",
                vehiclePhotoLabel: "Bike / Scooter Photo",
                vehiclePhotoSublabel: "Upload clear photo of your bike or scooter",
                vehiclePhotoIcon: "🏍️",
              },
              AUTO: {
                rcLabel: "Auto RC Book & Permit",
                rcSublabel: "Upload 3-wheeler registration or permit",
                licenseLabel: "Auto Commercial Driving License",
                licenseSublabel: "Upload front side of auto driver license",
                vehiclePhotoLabel: "Auto Rickshaw Photo",
                vehiclePhotoSublabel: "Upload clear photo of your auto rickshaw",
                vehiclePhotoIcon: "🛺",
              },
              GOODS: {
                rcLabel: "Goods Vehicle RC & Fitness Certificate",
                rcSublabel: "Upload commercial vehicle RC or fitness doc",
                licenseLabel: "Transport / Heavy Commercial License",
                licenseSublabel: "Upload commercial driving license (HMV / Transport)",
                vehiclePhotoLabel: "Goods Vehicle Photo (Truck / Tempo / Pickup)",
                vehiclePhotoSublabel: "Upload photo of your truck, tempo, or pickup",
                vehiclePhotoIcon: "🚛",
              },
              HEAVY: {
                rcLabel: "Machine RC / Invoice / Ownership Proof",
                rcSublabel: "Upload machine RC or purchase bill/invoice",
                licenseLabel: "Machine Operator License / Heavy Certificate",
                licenseSublabel: "Upload operator license or machinery certificate",
                vehiclePhotoLabel: "Heavy Machinery Photo (JCB / Tractor / Crane)",
                vehiclePhotoSublabel: "Upload full clear photo of your heavy machine",
                vehiclePhotoIcon: "🚜",
              },
            }[vehicleCategory];

            return (
              <div className="space-y-4 animate-fade-up">
                <div>
                  <h2 className="font-display text-xl font-bold text-white mb-1">
                    {CATEGORY_META[vehicleCategory].label} Documents & Photos
                  </h2>
                  <p className="text-sm text-muted">
                    Upload documents and photos for your <strong className="text-cyan-400">{VEHICLE_META[vehicleType].label}</strong>.
                  </p>
                </div>

                {/* 1. Vehicle Photo */}
                <PhotoUpload
                  label={docConfig.vehiclePhotoLabel}
                  sublabel={docConfig.vehiclePhotoSublabel}
                  icon={docConfig.vehiclePhotoIcon}
                  value={vehiclePhoto}
                  onChange={setVehiclePhoto}
                />

                {/* 2. RC Book */}
                <PhotoUpload
                  label={docConfig.rcLabel}
                  sublabel={docConfig.rcSublabel}
                  icon="📋"
                  value={rcPhoto}
                  onChange={setRcPhoto}
                />

                {/* 3. Driving License / Operator Certificate */}
                <PhotoUpload
                  label={docConfig.licenseLabel}
                  sublabel={docConfig.licenseSublabel}
                  icon="🪪"
                  value={licensePhoto}
                  onChange={setLicensePhoto}
                />

                {/* 4. Aadhar Card */}
                <PhotoUpload
                  label="Aadhar Card (ID Proof)"
                  sublabel="Upload front side of Aadhar"
                  icon="🪪"
                  value={aadharPhoto}
                  onChange={setAadharPhoto}
                />

                <div className="rounded-xl border border-blue-primary/20 bg-blue-primary/5 px-4 py-3">
                  <p className="text-xs text-blue-light">
                    💡 <strong>Tip:</strong> Uploading your vehicle photo and documents speeds up instant verification and helps customers trust your vehicle.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStage(2)} className="btn-ghost flex-1 py-3">← Back</button>
                  <button onClick={() => { setError(null); requestOtp(); }} disabled={loading}
                    className="btn-gradient flex-1 py-3 disabled:opacity-50">
                    {loading ? "Sending OTP…" : "Send OTP →"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ──────── STEP 4: OTP Verification ──────── */}
          {stage === 4 && (
            <div className="space-y-5 animate-fade-up">
              <div className="text-center">
                <div className="text-4xl mb-3">📱</div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Verify Your Phone</h2>
                <p className="text-sm text-muted">
                  OTP sent to <span className="text-white font-medium">+91 {phone}</span>
                </p>
              </div>

              {devCode && (
                <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3 text-center">
                  <p className="text-xs text-amber font-mono">Dev OTP Code: <strong className="text-white text-base">{devCode}</strong></p>
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5 text-center">6-Digit OTP</label>
                <input
                  type="tel" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full rounded-2xl border border-navy-border bg-navy-deep px-4 py-4 text-3xl text-white outline-none focus:border-blue-primary transition-colors placeholder-muted text-center tracking-[0.5em] font-mono"
                />
              </div>

              <button onClick={verifyOtp} disabled={loading || code.length !== 6}
                className="btn-gradient w-full py-4 text-base disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating your account…
                  </span>
                ) : "✓ Verify & Create Account"}
              </button>

              <p className="text-center text-xs text-muted">
                Didn't receive the OTP?{" "}
                <button onClick={() => { setCode(""); setDevCode(null); setStage(3); }} className="text-blue-light hover:underline">Resend</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
