"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { driverApi, clearDriverToken, DriverProfile, VehicleType, DriverReviewsResponse } from "@/lib/api";
import DriverBottomNav from "@/components/DriverBottomNav";

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

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string; defaultSeats: number; desc: string }[] = [
  { value: "HATCHBACK", label: "Hatchback", icon: "🚗", defaultSeats: 4, desc: "Alto, WagonR, Swift" },
  { value: "SEDAN",     label: "Sedan",     icon: "🚙", defaultSeats: 4, desc: "Dzire, Etios, Aura" },
  { value: "SUV",       label: "SUV",       icon: "🚕", defaultSeats: 6, desc: "Innova, Ertiga, Bolero" },
  { value: "LUXURY",    label: "Luxury",    icon: "🚘", defaultSeats: 4, desc: "Camry, Fortuner, BMW" },
];

const PERMIT_ZONES_LIST = [
  { id: "HP",          label: "Himachal Pradesh", icon: "🏔️" },
  { id: "Delhi",       label: "Delhi / NCR",       icon: "🏙️" },
  { id: "Chandigarh",  label: "Chandigarh",         icon: "🌆" },
  { id: "Punjab",      label: "Punjab",             icon: "🌾" },
  { id: "Uttarakhand", label: "Uttarakhand",        icon: "🗻" },
  { id: "AllIndia",    label: "All India Permit",   icon: "🇮🇳" },
];

const FUEL_TYPES = ["Diesel", "Petrol", "CNG", "Electric (EV)", "Hybrid"];

export default function DriverProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"vehicle" | "reviews" | "personal" | "location" | "documents" | "payout">("vehicle");
  const [viewPhoto, setViewPhoto] = useState<{ title: string; src: string } | null>(null);
  const [reviewsData, setReviewsData] = useState<DriverReviewsResponse | null>(null);

  // ── Form State ──────────────────────────────────────
  const [name,             setName]             = useState("");
  const [avatarPhoto,      setAvatarPhoto]      = useState<string | null>(null);
  const [email,            setEmail]            = useState("");
  const [altPhone,         setAltPhone]         = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [licenseNumber,    setLicenseNumber]    = useState("");
  const [experience,       setExperience]       = useState("");

  const [district,         setDistrict]         = useState("Mandi");
  const [tehsil,           setTehsil]           = useState("");
  const [village,          setVillage]          = useState("");
  const [standName,        setStandName]        = useState("");
  const [city,             setCity]             = useState("Mandi");
  const [permitZones,      setPermitZones]      = useState<string[]>(["HP"]);

  const [vehicleType,      setVehicleType]      = useState<VehicleType>("SUV");
  const [vehicleNumber,    setVehicleNumber]    = useState("");
  const [vehicleMake,      setVehicleMake]      = useState("");
  const [vehicleModel,     setVehicleModel]     = useState("");
  const [vehicleYear,      setVehicleYear]      = useState<string>("");
  const [seats,            setSeats]            = useState(4);
  const [fuelType,         setFuelType]         = useState("Diesel");
  const [acAvailable,      setAcAvailable]      = useState(true);
  const [ratePerKm,        setRatePerKm]        = useState(18);
  const [vehiclePhotos,    setVehiclePhotos]    = useState<string[]>([]);

  const [rcPhoto,          setRcPhoto]          = useState<string | null>(null);
  const [aadharPhoto,      setAadharPhoto]      = useState<string | null>(null);
  const [licensePhoto,     setLicensePhoto]     = useState<string | null>(null);
  const [insuranceExpiry,  setInsuranceExpiry]  = useState("");

  const [upiId,            setUpiId]            = useState("");
  const [bankAccount,      setBankAccount]      = useState("");
  const [bankIfsc,         setBankIfsc]         = useState("");

  const carFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("cab8_driver_token") : null;
    if (!token) { router.replace("/driver/login"); return; }

    driverApi.getProfile()
      .then((p) => {
        setProfile(p);
        populateForm(p);
      })
      .catch((e: any) => setError(e.message || "Failed to load profile."))
      .finally(() => setLoading(false));

    driverApi.getReviews()
      .then((r) => setReviewsData(r))
      .catch(() => {});
  }, [router]);

  function populateForm(p: DriverProfile) {
    setName(p.name || "");
    setAvatarPhoto(p.avatar_photo || null);
    setEmail(p.email || "");
    setAltPhone(p.alt_phone || "");
    setEmergencyContact(p.emergency_contact || "");
    setLicenseNumber(p.license_number || "");
    setExperience(p.experience || "");

    const d = p.district || p.city || "Mandi";
    setDistrict(d);
    setCity(p.city || d);
    setTehsil(p.tehsil || "");
    setVillage(p.village || "");
    setStandName(p.stand_name || "");
    setPermitZones(p.permit_zones ? p.permit_zones.split(",") : ["HP"]);

    setVehicleType(p.vehicle_type || "SUV");
    setVehicleNumber(p.vehicle_number || "");
    setVehicleMake(p.vehicle_make || "");
    setVehicleModel(p.vehicle_model || "");
    setVehicleYear(p.vehicle_year ? String(p.vehicle_year) : "");
    setSeats(p.seats || 4);
    setFuelType(p.fuel_type || "Diesel");
    setAcAvailable(p.ac_available === 1 || p.ac_available === true || p.ac_available === undefined);
    setRatePerKm(p.rate_per_km || 18);

    let photos: string[] = [];
    if (p.vehicle_photos) {
      if (Array.isArray(p.vehicle_photos)) photos = p.vehicle_photos;
      else {
        try { photos = JSON.parse(p.vehicle_photos); } catch { photos = []; }
      }
    }
    setVehiclePhotos(photos);

    setRcPhoto(p.rc_photo || null);
    setAadharPhoto(p.aadhar_photo || null);
    setLicensePhoto(p.license_photo || null);
    setInsuranceExpiry(p.insurance_expiry || "");

    setUpiId(p.upi_id || "");
    setBankAccount(p.bank_account || "");
    setBankIfsc(p.bank_ifsc || "");
  }

  function handleCancel() {
    if (profile) populateForm(profile);
    setEditMode(false);
    setError(null);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    if (!vehicleNumber.trim()) { setError("Vehicle plate number is required."); return; }

    setSaving(true);
    setError(null);
    try {
      const updated = await driverApi.updateProfile({
        name,
        avatar_photo: avatarPhoto || null,
        email: email || null,
        alt_phone: altPhone || null,
        emergency_contact: emergencyContact || null,
        license_number: licenseNumber || null,
        experience: experience || null,
        city: city || district,
        district: district || null,
        tehsil: tehsil || null,
        village: village || null,
        stand_name: standName || null,
        permit_zones: permitZones.join(","),
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.toUpperCase(),
        vehicle_make: vehicleMake || null,
        vehicle_model: vehicleModel || null,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
        seats: Number(seats) || 4,
        fuel_type: fuelType || null,
        ac_available: acAvailable ? 1 : 0,
        rate_per_km: Number(ratePerKm) || 18,
        vehicle_photos: vehiclePhotos,
        rc_photo: rcPhoto || null,
        aadhar_photo: aadharPhoto || null,
        license_photo: licensePhoto || null,
        insurance_expiry: insuranceExpiry || null,
        upi_id: upiId || null,
        bank_account: bankAccount || null,
        bank_ifsc: bankIfsc ? bankIfsc.toUpperCase() : null,
      });

      setProfile(updated);
      populateForm(updated);
      setEditMode(false);
      setSuccess("Driver profile & car details saved successfully! ✅");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) {
      setError(e.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDuty() {
    if (!profile) return;
    const newStatus = !profile.is_online;
    try {
      await driverApi.toggleOnline(newStatus);
      setProfile((prev) => prev ? { ...prev, is_online: newStatus ? 1 : 0 } : null);
      setSuccess(newStatus ? "You are now ONLINE & accepting rides! 🟢" : "You are now OFFLINE ⚪");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Could not update online status.");
    }
  }

  function handleLogout() {
    clearDriverToken();
    window.localStorage.removeItem("cab8_token");
    window.localStorage.removeItem("cab8_role");
    window.localStorage.removeItem("cab8_user_name");
    router.replace("/login");
  }

  function handleAddCarPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setVehiclePhotos((prev) => [...prev, reader.result as string]);
        setSuccess("Car photo added! Tap Save Changes to persist.");
        setTimeout(() => setSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeCarPhoto(index: number) {
    setVehiclePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPhoto(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDocUpload(setter: (b64: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    };
  }

  function togglePermit(id: string) {
    setPermitZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  const districts = Object.keys(HP_LOCATIONS);
  const tehsils   = Object.keys(HP_LOCATIONS[district] || {});
  const villages  = HP_LOCATIONS[district]?.[tehsil] || [];

  return (
    <main className="min-h-screen bg-[#070D18] text-slate-100 pb-32">
      {/* ── App Top Header Bar (Native mobile look) ── */}
      <header className="sticky top-0 z-30 bg-[#0A1324]/95 backdrop-blur-md border-b border-[#1A2844] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/driver/dashboard"
              className="h-8 w-8 rounded-xl bg-[#13223D] border border-[#1E335A] flex items-center justify-center text-sm text-slate-300 hover:text-white transition-colors"
            >
              ‹
            </Link>
            <div>
              <h1 className="font-display text-base font-bold text-white leading-tight">Driver Hub</h1>
              <p className="text-[10px] font-mono text-cyan-400">Cab8 Himachal Partner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real Interactive Online / Offline Toggle Switch Button */}
            {profile && (
              <button
                onClick={toggleDuty}
                className={`group flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer border ${
                  profile.is_online
                    ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.3)] hover:border-emerald-400"
                    : "bg-[#0D1B2E] border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                }`}
                title={profile.is_online ? "Click to go Offline" : "Click to go Online"}
              >
                <span>{profile.is_online ? "ONLINE" : "OFFLINE"}</span>
                {/* Sliding Switch Pill */}
                <div
                  className={`relative w-7 h-3.5 rounded-full transition-colors flex items-center px-0.5 ${
                    profile.is_online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      profile.is_online ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            )}

            {/* Return Trip Board Action */}
            <Link
              href="/board/post"
              className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-400/50 text-purple-200 text-xs font-bold hover:bg-purple-600/40 transition-all flex items-center gap-1 shadow"
            >
              <span>📋</span>
              <span>Post Board</span>
            </Link>

            {/* Edit Mode Toggle */}
            {editMode ? (
              <button
                onClick={handleCancel}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1"
              >
                <span>✏️</span> Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Alerts */}
        {success && (
          <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-fade-up">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400/60 hover:text-emerald-300">✕</button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-center justify-between animate-fade-up">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-300">✕</button>
          </div>
        )}

        {/* ── App Profile Hero Card ── */}
        {profile && (
          <div className="relative rounded-3xl bg-gradient-to-b from-[#101E38] to-[#0A1426] border border-[#1E335A] p-4 shadow-xl overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3.5">
              {/* Driver Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  onClick={() => editMode && avatarInputRef.current?.click()}
                  className={`h-20 w-20 rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-[#162544] flex items-center justify-center text-3xl shadow-lg relative ${
                    editMode ? "cursor-pointer hover:border-cyan-400 group" : ""
                  }`}
                >
                  {avatarPhoto ? (
                    <img src={avatarPhoto} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span>👨‍✈️</span>
                  )}

                  {editMode && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] text-cyan-300 font-semibold">
                      <span>📷</span>
                      <span>Change</span>
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                {profile.is_verified ? (
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#0A1426] flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                    ✓
                  </span>
                ) : null}
              </div>

              {/* Identity info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-extrabold text-white text-lg truncate">
                    {name || profile.name || "Driver Partner"}
                  </h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-400 font-mono text-xs font-bold">
                    ⭐ {profile.rating_avg.toFixed(1)}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                  <span>📱</span> +91 {profile.phone}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#13223D] border border-[#1E335A] text-slate-300">
                    📍 {district || profile.city}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    🚗 {vehicleType}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    ₹{ratePerKm}/km
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Driver Stats Row */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#1A2844]">
              <div className="text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Rate</div>
                <div className="text-xs font-bold text-white font-mono mt-0.5">₹{ratePerKm}</div>
              </div>
              <div className="text-center border-l border-[#1A2844]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Seats</div>
                <div className="text-xs font-bold text-white font-mono mt-0.5">{seats} Seats</div>
              </div>
              <div className="text-center border-l border-[#1A2844]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Vehicle</div>
                <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5 truncate">{vehicleNumber || "—"}</div>
              </div>
              <div className="text-center border-l border-[#1A2844]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Status</div>
                <div className={`text-xs font-bold font-mono mt-0.5 ${profile.is_verified ? "text-emerald-400" : "text-amber-400"}`}>
                  {profile.is_verified ? "Active" : "Pending"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Return Trip Board Quick Action Card ── */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#0D1B2E] to-indigo-950/30 p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-lg shadow">
              📋
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Return Trip &amp; Empty Taxi Board</h4>
              <p className="text-[11px] text-purple-300 font-mono">Post shared carpool or return ride</p>
            </div>
          </div>
          <Link
            href="/board/post"
            className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 px-3.5 py-2 rounded-xl shadow transition-all whitespace-nowrap active:scale-95"
          >
            + Post Ride
          </Link>
        </div>

        {/* ── Taxi Union Membership Banner ── */}
        <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-r from-amber-950/40 via-[#0D1B2E] to-orange-950/30 p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg shadow">
              🔰
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Taxi Union Membership</h4>
              <p className="text-[11px] text-amber-300 font-mono">Apply for official union approval</p>
            </div>
          </div>
          <Link
            href="/driver/union"
            className="text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-400 hover:brightness-110 px-3.5 py-2 rounded-xl shadow transition-all whitespace-nowrap active:scale-95"
          >
            Union Form →
          </Link>
        </div>

        {/* ── App Category Segmented Control Tabs ── */}
        <nav className="flex items-center gap-1 p-1 bg-[#0D182E] rounded-2xl border border-[#1A2844] overflow-x-auto scrollbar-none shadow-inner">
          {[
            { id: "vehicle",   label: "My Car",    icon: "🚗" },
            { id: "reviews",   label: "Reviews",   icon: "⭐" },
            { id: "personal",  label: "Personal",  icon: "👤" },
            { id: "location",  label: "Location",  icon: "📍" },
            { id: "documents", label: "Docs",      icon: "📄" },
            { id: "payout",    label: "Payouts",   icon: "📱" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#13223D]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ──────── TAB: ⭐ DRIVER REVIEWS & CUSTOMER FEEDBACK ──────── */}
        {activeTab === "reviews" && (
          <div className="space-y-4 animate-fade-up">
            {/* Overall Rating & Breakdown Card */}
            <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-white text-base">Customer Ratings &amp; Reviews</h3>
                  <p className="text-xs text-slate-400">Feedback from verified passengers on Cab8</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/15 border border-amber-400/30 text-amber-400">
                  ⭐ {profile?.rating_avg ? profile.rating_avg.toFixed(1) : "4.8"} / 5.0
                </span>
              </div>

              {/* Score & Distribution Row */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#091322] border border-[#162544]">
                <div className="text-center sm:border-r border-[#162544] sm:pr-5">
                  <div className="font-display text-4xl font-black text-amber-400">
                    {profile?.rating_avg ? profile.rating_avg.toFixed(1) : "4.8"}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-sm my-1">
                    ★★★★★
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {reviewsData?.total_reviews || 0} Total Reviews
                  </div>
                </div>

                {/* Star Distribution Bars */}
                <div className="flex-1 w-full space-y-1.5 text-xs font-mono">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = reviewsData?.breakdown?.[s] || 0;
                    const total = reviewsData?.total_reviews || 1;
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="w-6 text-slate-400">{s} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-[#13223D] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-slate-400 text-[10px]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List of Reviews */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                Recent Passenger Reviews ({reviewsData?.reviews?.length || 0})
              </h4>

              {(!reviewsData?.reviews || reviewsData.reviews.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-[#1A2844] p-8 text-center bg-[#0D182E]/50">
                  <div className="text-3xl mb-2 opacity-60">⭐</div>
                  <p className="text-sm font-semibold text-white">No Customer Reviews Yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Complete trips with passengers to start receiving ratings and feedback tags!
                  </p>
                </div>
              ) : (
                reviewsData.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-[#0D182E] border border-[#1A2844] p-4 shadow space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-cyan-300">
                          {rev.customer_name ? rev.customer_name[0].toUpperCase() : "P"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rev.customer_name || "Verified Passenger"}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                        <span>★</span>
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-slate-200 bg-[#091322] p-3 rounded-xl border border-[#162544]">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}

                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rev.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
                          >
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ──────── TAB 1: 🚗 MY CAR & VEHICLE IMAGES ──────── */}
        {activeTab === "vehicle" && (
          <div className="space-y-4 animate-fade-up">
            {/* ── CAR PHOTO GALLERY SECTION ── */}
            <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">Car Photos & Gallery</h3>
                    <p className="text-[11px] text-slate-400">Photos shown to passengers during booking</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {vehiclePhotos.length} Photos
                </span>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {vehiclePhotos.map((photoSrc, idx) => (
                  <div
                    key={idx}
                    className="group relative h-28 rounded-2xl overflow-hidden border border-[#1E335A] bg-[#070D18] cursor-pointer shadow-md"
                  >
                    <img
                      src={photoSrc}
                      alt={`Car photo ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setViewPhoto({ title: `Vehicle Photo #${idx + 1}`, src: photoSrc })}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"
                      onClick={() => setViewPhoto({ title: `Vehicle Photo #${idx + 1}`, src: photoSrc })}
                    />

                    <span className="absolute bottom-1.5 left-2 text-[10px] font-mono font-bold text-white drop-shadow">
                      Photo {idx + 1}
                    </span>

                    {/* Delete button in edit mode */}
                    {editMode && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeCarPhoto(idx); }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-600/90 text-white text-xs flex items-center justify-center shadow-lg hover:bg-rose-700 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Photo Card */}
                <button
                  type="button"
                  onClick={() => carFileInputRef.current?.click()}
                  className="h-28 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-1 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
                  <span className="text-[11px] font-bold text-cyan-300 font-mono">+ Add Car Photo</span>
                  <span className="text-[9px] text-slate-400">Front / Interior / Side</span>
                </button>
              </div>

              <input
                ref={carFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAddCarPhoto}
              />
            </div>

            {/* Vehicle Category Picker */}
            <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Vehicle Category</label>
              {editMode ? (
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map((v) => {
                    const isSelected = vehicleType === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => { setVehicleType(v.value); setSeats(v.defaultSeats); }}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500/15 text-white shadow-md"
                            : "border-[#1E335A] bg-[#070D18] text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{v.icon}</span>
                          {isSelected && <span className="text-cyan-400 text-xs">✓</span>}
                        </div>
                        <div className="text-xs font-bold text-white">{v.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{v.desc}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#070D18] border border-[#1E335A] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {VEHICLE_TYPES.find((v) => v.value === vehicleType)?.icon || "🚗"}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {VEHICLE_TYPES.find((v) => v.value === vehicleType)?.label || vehicleType}
                      </div>
                      <div className="text-[11px] text-slate-400">{seats} Passenger Seats · {fuelType}</div>
                    </div>
                  </div>
                  <span className="badge badge-green text-[10px]">Active</span>
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Plate Number *</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. HP33A-1234"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white font-mono uppercase outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono font-bold text-cyan-300">
                      {vehicleNumber || "—"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Make / Brand</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      placeholder="e.g. Maruti / Toyota"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-semibold text-white">
                      {vehicleMake || "Maruti"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Model Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Swift Dzire"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      {vehicleModel || "Dzire Tour"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Year</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="e.g. 2022"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      {vehicleYear || "2021"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Fuel Type</label>
                  {editMode ? (
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500 appearance-none"
                    >
                      {FUEL_TYPES.map((f) => (
                        <option key={f} value={f} className="bg-[#070D18]">{f}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      ⛽ {fuelType}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Air Conditioning</label>
                  {editMode ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAcAvailable(true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          acAvailable ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" : "border-[#1E335A] bg-[#070D18] text-slate-400"
                        }`}
                      >
                        ❄️ AC
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcAvailable(false)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          !acAvailable ? "bg-amber-500/20 border-amber-500 text-amber-300" : "border-[#1E335A] bg-[#070D18] text-slate-400"
                        }`}
                      >
                        Non-AC
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      {acAvailable ? "❄️ AC Available" : "💨 Non-AC"}
                    </div>
                  )}
                </div>
              </div>

              {/* Rate Card */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 p-3.5 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">Rate Per KM Setting</div>
                    <div className="text-xl font-display font-extrabold text-white mt-0.5">
                      ₹{ratePerKm} <span className="text-xs font-normal text-slate-400">/ km</span>
                    </div>
                  </div>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="12"
                        max="45"
                        value={ratePerKm}
                        onChange={(e) => setRatePerKm(Number(e.target.value))}
                        className="accent-emerald-400 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-white w-8">₹{ratePerKm}</span>
                    </div>
                  ) : (
                    <Link
                      href="/driver/rates"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono hover:bg-emerald-500/30 transition-all"
                    >
                      ✏️ Edit Rate
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB 2: 👤 PERSONAL DETAILS ──────── */}
        {activeTab === "personal" && (
          <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3.5 animate-fade-up">
            <div className="flex items-center gap-2 border-b border-[#1A2844] pb-2.5">
              <span className="text-xl">👤</span>
              <div>
                <h3 className="font-display font-bold text-white text-sm">Personal Identity</h3>
                <p className="text-[11px] text-slate-400">Your profile credentials and contact details</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
                {editMode ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-semibold text-white">
                    {name || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Primary Mobile <span className="text-emerald-400 text-[9px]">(Verified)</span>
                </label>
                <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                  <span>+91 {profile?.phone}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">🔒 Registered</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@email.com"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-slate-300 truncate">
                      {email || "—"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Emergency Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-slate-300">
                      {altPhone ? `+91 ${altPhone}` : "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Driving License No.</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                      placeholder="HP-01-2018-001234"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white font-mono uppercase outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono font-bold text-white truncate">
                      {licenseNumber || "Recorded on KYC"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Experience</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 6 years"
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      {experience || "5+ Years"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB 3: 📍 LOCATION & TAXI STAND ──────── */}
        {activeTab === "location" && (
          <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3.5 animate-fade-up">
            <div className="flex items-center gap-2 border-b border-[#1A2844] pb-2.5">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-display font-bold text-white text-sm">Operating Location & Stand</h3>
                <p className="text-[11px] text-slate-400">Where you are based and pick up riders</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">District</label>
                  {editMode ? (
                    <select
                      value={district}
                      onChange={(e) => { setDistrict(e.target.value); setCity(e.target.value); setTehsil(""); setVillage(""); }}
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500 appearance-none"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d} className="bg-[#070D18]">{d}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-semibold text-white">
                      📍 {district}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Tehsil / Block</label>
                  {editMode ? (
                    <select
                      value={tehsil}
                      onChange={(e) => { setTehsil(e.target.value); setVillage(""); }}
                      className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500 appearance-none"
                    >
                      <option value="" className="bg-[#070D18]">— Select Tehsil —</option>
                      {tehsils.map((t) => (
                        <option key={t} value={t} className="bg-[#070D18]">{t}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                      {tehsil || "Central"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Primary Taxi Stand / Union Base</label>
                {editMode ? (
                  <input
                    type="text"
                    value={standName}
                    onChange={(e) => setStandName(e.target.value)}
                    placeholder="e.g. Old Bus Stand Shimla / Mall Road Union"
                    className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs text-white">
                    🚏 {standName || "Main District Taxi Stand"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-2">Permit Operating Zones</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMIT_ZONES_LIST.map((zone) => {
                    const isSelected = permitZones.includes(zone.id);
                    return (
                      <div
                        key={zone.id}
                        onClick={() => editMode && togglePermit(zone.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-cyan-500/60 bg-cyan-500/15 text-white font-semibold"
                            : "border-[#1E335A] bg-[#070D18] text-slate-400"
                        } ${editMode ? "cursor-pointer hover:border-cyan-400" : ""}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{zone.icon}</span>
                          <span className="truncate">{zone.label}</span>
                        </div>
                        {isSelected && <span className="text-cyan-400 text-xs">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────── TAB 4: 📄 DOCUMENTS ──────── */}
        {activeTab === "documents" && (
          <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3.5 animate-fade-up">
            <div className="flex items-center gap-2 border-b border-[#1A2844] pb-2.5">
              <span className="text-xl">📄</span>
              <div>
                <h3 className="font-display font-bold text-white text-sm">KYC Documents & Badges</h3>
                <p className="text-[11px] text-slate-400">Click any document photo to inspect or replace</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { title: "RC Book (Registration Certificate)", icon: "📋", photo: rcPhoto, setter: setRcPhoto },
                { title: "Aadhaar Card", icon: "🪪", photo: aadharPhoto, setter: setAadharPhoto },
                { title: "Driving License", icon: "💳", photo: licensePhoto, setter: setLicensePhoto },
              ].map((doc) => (
                <div key={doc.title} className="p-3 rounded-2xl border border-[#1E335A] bg-[#070D18] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{doc.icon}</span>
                      <span className="text-xs font-bold text-white">{doc.title}</span>
                    </div>
                    {doc.photo ? (
                      <span className="badge badge-green text-[10px]">✓ Uploaded</span>
                    ) : (
                      <span className="badge badge-amber text-[10px]">Pending</span>
                    )}
                  </div>

                  {doc.photo ? (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={doc.photo}
                        alt={doc.title}
                        className="h-14 w-20 object-cover rounded-xl border border-[#1E335A] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewPhoto({ title: doc.title, src: doc.photo! })}
                      />
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => setViewPhoto({ title: doc.title, src: doc.photo! })}
                          className="text-xs text-cyan-400 hover:underline font-semibold block"
                        >
                          🔍 Tap to View Full Document
                        </button>
                        {editMode && (
                          <label className="text-[11px] text-amber-400 cursor-pointer hover:underline mt-1 block">
                            🔄 Replace Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleDocUpload(doc.setter)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      {editMode ? (
                        <label className="w-full py-2.5 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 flex items-center justify-center gap-2 cursor-pointer transition-all">
                          <span className="text-sm">📷</span>
                          <span className="text-xs text-cyan-300 font-semibold">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleDocUpload(doc.setter)}
                          />
                        </label>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">No document image attached.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────── TAB 5: 📱 PAYOUTS & BANKING ──────── */}
        {activeTab === "payout" && (
          <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-4 shadow-lg space-y-3.5 animate-fade-up">
            <div className="flex items-center gap-2 border-b border-[#1A2844] pb-2.5">
              <span className="text-xl">📱</span>
              <div>
                <h3 className="font-display font-bold text-white text-sm">Payouts & Bank Account</h3>
                <p className="text-[11px] text-slate-400">Direct instant settlements of your taxi rides</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  UPI ID (GPay / PhonePe / Paytm)
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. driver@okhdfcbank"
                    className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono font-bold text-white flex items-center justify-between">
                    <span>⚡ {upiId || `${profile?.phone}@upi`}</span>
                    <span className="text-emerald-400 text-[10px]">Instant Payout</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Bank Account Number</label>
                {editMode ? (
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 12345678901234"
                    className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono text-white">
                    🏦 {bankAccount ? `••••••••${bankAccount.slice(-4)}` : "Direct Account Linked"}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">Bank IFSC Code</label>
                {editMode ? (
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full rounded-xl border border-[#1E335A] bg-[#070D18] px-3.5 py-2.5 text-xs text-white font-mono uppercase outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070D18] border border-[#1E335A] text-xs font-mono text-white">
                    {bankIfsc || "HDFC0000123"}
                  </div>
                )}
              </div>

              {/* Taxi Union Card */}
              <div className="rounded-2xl bg-gradient-to-r from-[#142340] to-[#0E1B33] border border-amber-500/30 p-3.5 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                    🔰
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-xs">HP Taxi Union (HPTU)</h4>
                    <p className="text-[10px] text-slate-400">Official membership & security</p>
                  </div>
                </div>
                <Link
                  href="/driver/union"
                  className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md"
                >
                  Union Portal →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Driver App Action Shortcuts ── */}
        <div className="rounded-3xl bg-[#0D182E] border border-[#1A2844] p-3.5 shadow-lg space-y-2">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-1">Quick Shortcuts</div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/driver/dashboard"
              className="p-3 rounded-2xl border border-[#1E335A] bg-[#070D18] hover:border-cyan-500/50 transition-colors text-xs text-white font-semibold flex items-center gap-2"
            >
              <span>⚡</span>
              <span>Duty & Trips</span>
            </Link>
            <Link
              href="/driver/earnings"
              className="p-3 rounded-2xl border border-[#1E335A] bg-[#070D18] hover:border-cyan-500/50 transition-colors text-xs text-white font-semibold flex items-center gap-2"
            >
              <span>💰</span>
              <span>My Earnings</span>
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all"
        >
          🚪 Log Out of Driver Portal
        </button>
      </div>

      {/* ── Sticky Save Changes Floating Action Bar (When in Edit Mode) ── */}
      {editMode && (
        <div className="fixed bottom-16 left-0 right-0 z-40 p-3 bg-[#0A1324]/95 backdrop-blur-md border-t border-[#1E335A] animate-fade-up">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 rounded-2xl border border-[#1E335A] bg-[#0D182E] text-slate-300 text-xs font-bold hover:text-white"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen Photo Lightbox ── */}
      {viewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="max-w-lg w-full bg-[#0D182E] border border-[#1E335A] rounded-3xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1A2844] pb-2">
              <h4 className="text-sm font-bold text-white">{viewPhoto.title}</h4>
              <button onClick={() => setViewPhoto(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <img src={viewPhoto.src} alt={viewPhoto.title} className="w-full max-h-[70vh] object-contain rounded-2xl" />
            <div className="text-right">
              <button
                onClick={() => setViewPhoto(null)}
                className="px-4 py-2 rounded-xl bg-[#13223D] border border-[#1E335A] text-xs font-bold text-white hover:bg-[#1E335A]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <DriverBottomNav />
    </main>
  );
}
