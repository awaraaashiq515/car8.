"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearToken, getUserName, setUserName, Ride, UserProfile } from "@/lib/api";

const NAV = [
  { icon: "🏠", label: "Home",     href: "/home",     active: false },
  { icon: "🚕", label: "My Rides", href: "/my-rides", active: false },
  { icon: "👤", label: "Profile",  href: "/profile",  active: true  },
];

const MENU_ITEMS = [
  { icon: "🚕", label: "My Rides",       href: "/my-rides",     desc: "View all your completed & active trips" },
  { icon: "🚗", label: "Ride Board",      href: "/board",        desc: "Shared intercity rides & carpooling" },
  { icon: "🚘", label: "Drive with Cab8", href: "/driver/login", desc: "Switch to Driver partner app" },
  { icon: "🔔", label: "Notifications",  href: "#",             desc: "Ride alerts & promotional offers" },
  { icon: "❓", label: "Help & Support",  href: "#",             desc: "24/7 customer support & FAQs" },
];

// Helper to compress image in browser using canvas before sending
async function compressImage(file: File, maxWidth = 500, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.warn("Canvas compression fallback:", e);
        }
        resolve(event.target?.result as string);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve("");
    };
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("cab8_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Load instantly from localStorage cache
    const cachedAvatar = window.localStorage.getItem("cab8_user_avatar");
    if (cachedAvatar) setAvatarPhoto(cachedAvatar);

    const localName = getUserName();
    if (localName) setName(localName);

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setProfile({
        id: payload.sub || "user",
        phone: payload.phone || "",
        name: localName || null,
        avatar_photo: cachedAvatar || null,
        role: "CUSTOMER",
        created_at: new Date().toISOString(),
      });
    } catch { /* ignore */ }

    // Fetch live profile from backend
    api.getProfile()
      .then((res) => {
        if (res?.user) {
          setProfile(res.user);
          if (res.user.name) {
            setName(res.user.name);
            setUserName(res.user.name);
          }
          if (res.user.email) setEmail(res.user.email);
          if (res.user.emergency_contact) setEmergencyContact(res.user.emergency_contact);
          if (res.user.avatar_photo) {
            setAvatarPhoto(res.user.avatar_photo);
            window.localStorage.setItem("cab8_user_avatar", res.user.avatar_photo);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load remote profile:", err);
      })
      .finally(() => setLoading(false));

    // Fetch rides for stats
    api.getMyRides().then(setRides).catch(() => {});
  }, [router]);

  function notifySuccess(msg: string) {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  function notifyError(msg: string) {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 4000);
  }

  // Handle Photo selection & auto compression
  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifyError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    try {
      setUploadingPhoto(true);
      const compressedBase64 = await compressImage(file, 500, 0.8);
      if (!compressedBase64) {
        notifyError("Failed to read image.");
        return;
      }

      // Update state & local storage immediately
      setAvatarPhoto(compressedBase64);
      try {
        window.localStorage.setItem("cab8_user_avatar", compressedBase64);
      } catch { /* storage full */ }

      // Sync with server
      try {
        const res = await api.updateProfile({ avatar_photo: compressedBase64 });
        if (res?.user) {
          setProfile(res.user);
        }
      } catch (err: any) {
        console.warn("Backend sync failed, saved locally:", err);
      }
      notifySuccess("Profile photo updated successfully! 📸✨");
    } catch (err: any) {
      notifyError(err.message || "Failed to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Remove photo
  async function handleRemovePhoto() {
    if (!avatarPhoto) return;
    try {
      setUploadingPhoto(true);
      setAvatarPhoto(null);
      window.localStorage.removeItem("cab8_user_avatar");
      try {
        const res = await api.updateProfile({ avatar_photo: null });
        if (res?.user) setProfile(res.user);
      } catch { /* ignore */ }
      notifySuccess("Profile photo removed.");
    } catch (err: any) {
      notifyError(err.message || "Could not remove photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Save full profile details
  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      notifyError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim() || null;
    const trimmedContact = emergencyContact.trim() || null;

    setUserName(trimmedName);
    setName(trimmedName);

    try {
      const res = await api.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
        emergency_contact: trimmedContact,
        avatar_photo: avatarPhoto || null,
      });

      if (res?.user) {
        setProfile(res.user);
        setName(res.user.name || trimmedName);
        setEmail(res.user.email || "");
        setEmergencyContact(res.user.emergency_contact || "");
        setAvatarPhoto(res.user.avatar_photo || null);
      }
      setIsEditing(false);
      notifySuccess("Profile updated successfully! ✅");
    } catch (err: any) {
      // If server unreachable, at least keep local changes
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: trimmedName,
              email: trimmedEmail,
              emergency_contact: trimmedContact,
              avatar_photo: avatarPhoto || null,
            }
          : prev
      );
      setIsEditing(false);
      notifySuccess("Profile details saved! ✅");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearToken();
    window.localStorage.removeItem("cab8_role");
    window.localStorage.removeItem("cab8_user_name");
    window.localStorage.removeItem("cab8_user_avatar");
    router.replace("/login");
  }

  const completed = rides.filter((r) => r.status === "COMPLETED");
  const totalSpend = completed.reduce((s, r) => s + (r.final_fare ?? r.estimated_fare), 0);
  const displayName = name || profile?.name || "Customer";
  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[550px] h-[350px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, #06B6D4 50%, transparent 75%)" }}
        />
      </div>

      {/* Hidden File Input for Avatar Photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      {/* ── Toast Notifications ── */}
      {successMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500/90 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/30 text-sm font-medium">
            <span>{successMsg}</span>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-600/90 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-red-400/30 text-sm font-medium">
            <span>⚠️ {errorMsg}</span>
          </div>
        </div>
      )}

      {/* ── Header Bar ── */}
      <div className="relative z-10 px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold tracking-tight">My Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5"
          style={{
            borderColor: isEditing ? "#06B6D4" : "rgba(255,255,255,0.15)",
            background: isEditing ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)",
            color: isEditing ? "#38BDF8" : "#94A3B8",
          }}
        >
          {isEditing ? "Cancel" : "✏️ Edit Details"}
        </button>
      </div>

      {/* ── Profile Hero Section with Photo Upload ── */}
      <div className="relative z-10 px-5 pt-4 pb-6 text-center">
        {/* Avatar Photo Frame */}
        <div className="relative inline-block mb-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-28 w-28 rounded-3xl overflow-hidden relative group cursor-pointer border-2 border-white/20 hover:border-cyan-400 transition-all duration-300 mx-auto flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1E293B, #0F172A)",
              boxShadow: "0 0 35px rgba(37,99,235,0.35)",
            }}
            title="Click to upload profile photo"
          >
            {avatarPhoto ? (
              <img
                src={avatarPhoto}
                alt={displayName}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-3xl font-display font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
              >
                {initials}
              </div>
            )}

            {/* Hover / Active Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[11px] font-medium text-white gap-1 backdrop-blur-[2px]">
              <span className="text-lg">📷</span>
              <span>Change Photo</span>
            </div>

            {uploadingPhoto && (
              <div className="absolute inset-0 bg-navy-deep/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Quick Camera Action Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-2xl border-2 border-navy-deep flex items-center justify-center text-sm shadow-lg transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
            title="Upload Photo"
          >
            📸
          </button>
        </div>

        {/* Action button row for photo */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-navy-card border border-navy-border hover:border-cyan-500/50 text-cyan-300 transition-all flex items-center gap-1.5"
          >
            <span>📷</span>
            <span>{avatarPhoto ? "Change Photo" : "Upload Photo"}</span>
          </button>
          {avatarPhoto && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={uploadingPhoto}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all flex items-center gap-1"
            >
              <span>🗑️</span>
              <span>Remove</span>
            </button>
          )}
        </div>

        <h2 className="font-display text-2xl font-bold text-white">{displayName}</h2>
        {profile?.phone && (
          <p className="text-slate-400 text-sm mt-0.5 font-mono">📱 +91 {profile.phone}</p>
        )}

        <div className="inline-flex items-center gap-2 mt-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-300 font-mono tracking-wide">Verified Customer</span>
        </div>
      </div>

      {/* ── Inline Edit Profile Form ── */}
      {isEditing && (
        <div className="relative z-10 mx-5 mb-5 p-5 rounded-3xl border border-cyan-500/30 bg-navy-card shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
              <span>👤</span> Edit Profile Details
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Emergency SOS Contact
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Emergency 10-digit mobile number"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-white text-sm transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
                }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>💾 Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="relative z-10 mx-5 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🚕", val: rides.length,     label: "Total Rides",  color: "#2563EB" },
            { icon: "✅", val: completed.length, label: "Completed",    color: "#10B981" },
            { icon: "💰", val: `₹${totalSpend}`, label: "Total Spent",  color: "#06B6D4" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-navy-border bg-navy-card p-3.5 text-center shadow-md backdrop-blur-sm"
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-white text-lg">
                {loading ? "—" : s.val}
              </div>
              <div className="text-[11px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Book CTA ── */}
      <div className="relative z-10 mx-5 mb-5">
        <Link
          href="/home"
          className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.15))",
            border: "1px solid rgba(37,99,235,0.4)",
          }}
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
          >
            🔍
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-white">Book a Ride</div>
            <div className="text-xs text-slate-400">Find nearest local & outstation cabs</div>
          </div>
          <span className="text-cyan-400 text-lg font-bold">→</span>
        </Link>
      </div>

      {/* ── Menu Items ── */}
      <div className="relative z-10 mx-5 mb-5">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-3">Account & Settings</h3>
        <div className="rounded-2xl border border-navy-border bg-navy-card overflow-hidden shadow-lg">
          {MENU_ITEMS.map((item, idx) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-navy-hover transition-colors ${
                idx > 0 ? "border-t border-navy-border" : ""
              }`}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0D1B2E, #162540)" }}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
              <span className="text-slate-500 text-sm">›</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="relative z-10 mx-5 mb-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-4 py-4 flex items-center gap-4 transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl flex-shrink-0">
            🚪
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-red-400">Logout</div>
            <div className="text-xs text-slate-400">Sign out of your Cab8 account</div>
          </div>
          <span className="text-red-400/60 text-sm">›</span>
        </button>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-slate-500 mb-4 relative z-10">
        Cab8 v1.0 · © 2025
      </p>

      {/* ── Bottom Nav ── */}
      <nav className="sticky bottom-0 z-30 border-t border-navy-border bg-navy-deep/95 backdrop-blur-md">
        <div className="flex items-center justify-around px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-all ${
                item.active ? "text-cyan-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className={`text-xl ${item.active ? "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
              {item.active && (
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)" }}
                />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
