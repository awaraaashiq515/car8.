"use client";
import { useEffect, useState, useCallback } from "react";
import { SettingsCard, SettingField, Toggle, ImageUploadField, SaveBar } from "../_components/ui";
import { LoadingPulse } from "../_components/helpers";
import type { AppSettings } from "../_components/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SettingsPage() {
  const [draft,   setDraft]   = useState<AppSettings>({});
  const [saved,   setSaved]   = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await (await fetch(`${API}/settings/all`)).json();
    setDraft(d.settings || {});
    setSaved(d.settings || {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(k: string, v: string) {
    setDraft(prev => ({ ...prev, [k]: v }));
  }
  function get(k: string, fallback = "") {
    return draft[k] ?? fallback;
  }

  function notify(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/settings`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: draft }),
      });
      if (r.ok) { setSaved({ ...draft }); notify("All settings saved ✓"); }
      else notify("Save failed", false);
    } catch { notify("Network error", false); }
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px", fontFamily: "'Space Grotesk',sans-serif" }}>⚙️ App Settings</h1>
        <LoadingPulse />
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, background: toast.ok ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#DC2626,#EF4444)", color: "#fff", padding: "12px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "adminFadeUp 0.3s ease" }}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>⚙️ App Settings</h1>
          <p style={{ color: "#4A6080", fontSize: "13px", marginTop: "4px" }}>Configure branding, fares, features, contact & more</p>
        </div>
        {dirty && (
          <span style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
            ● Unsaved changes
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── 1. BRANDING ── */}
        <SettingsCard title="🎨 Branding" subtitle="App name, tagline, logo and web icon (favicon)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SettingField label="App Name" value={get("app_name")} onChange={v => set("app_name", v)} placeholder="Cab8" hint="Shown in sidebar, browser tab & PWA" />
            <SettingField label="Short Name (PWA)" value={get("app_short_name")} onChange={v => set("app_short_name", v)} placeholder="Cab8" hint="App icon label on home screen" />
          </div>
          <SettingField label="Tagline" value={get("app_tagline")} onChange={v => set("app_tagline", v)} placeholder="Verified taxis across the hills and beyond" />
          <SettingField label="App Description (SEO & PWA)" value={get("app_description")} onChange={v => set("app_description", v)} placeholder="Full description for search engines and PWA…" multiline hint="Used in manifest.json and meta description" />
          <SettingField label="Theme / Brand Color" value={get("theme_color", "#2563EB")} onChange={v => set("theme_color", v)} placeholder="#2563EB" type="color" hint="Browser tab bar, PWA splash, links" />

          {/* Image uploads */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "4px" }}>
            <ImageUploadField
              label="🖼️ App Logo"
              subtitle="PNG/SVG, min 192×192px. Shown in sidebar header."
              value={get("logo_data")}
              onChange={v => set("logo_data", v)}
            />
            <ImageUploadField
              label="🌐 Web Icon / Favicon"
              subtitle="ICO/PNG, 32×32 or 64×64px. Shown in browser tab."
              value={get("favicon_data")}
              onChange={v => set("favicon_data", v)}
              small
            />
          </div>
        </SettingsCard>

        {/* ── 2. CONTACT & SUPPORT ── */}
        <SettingsCard title="📞 Contact & Support" subtitle="Displayed to customers in help sections">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SettingField label="Support Phone" value={get("support_phone")} onChange={v => set("support_phone", v)} placeholder="+91 98765 43210" type="tel" />
            <SettingField label="WhatsApp Number" value={get("support_whatsapp")} onChange={v => set("support_whatsapp", v)} placeholder="+91 98765 43210" type="tel" />
            <SettingField label="Support Email" value={get("support_email")} onChange={v => set("support_email", v)} placeholder="support@cab8.in" type="email" />
            <SettingField label="Office / HQ Address" value={get("support_address")} onChange={v => set("support_address", v)} placeholder="Shimla, Himachal Pradesh" />
          </div>
        </SettingsCard>

        {/* ── 3. SOCIAL MEDIA ── */}
        <SettingsCard title="🌐 Social Media Links" subtitle="Shown in app footer and about page">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SettingField label="Facebook Page URL" value={get("social_facebook")} onChange={v => set("social_facebook", v)} placeholder="https://facebook.com/cab8" type="url" />
            <SettingField label="Instagram URL" value={get("social_instagram")} onChange={v => set("social_instagram", v)} placeholder="https://instagram.com/cab8" type="url" />
            <SettingField label="Twitter / X URL" value={get("social_twitter")} onChange={v => set("social_twitter", v)} placeholder="https://twitter.com/cab8" type="url" />
            <SettingField label="YouTube Channel URL" value={get("social_youtube")} onChange={v => set("social_youtube", v)} placeholder="https://youtube.com/@cab8" type="url" />
            <SettingField label="WhatsApp Group Link" value={get("social_whatsapp_group")} onChange={v => set("social_whatsapp_group", v)} placeholder="https://chat.whatsapp.com/…" type="url" />
            <SettingField label="Telegram Channel" value={get("social_telegram")} onChange={v => set("social_telegram", v)} placeholder="https://t.me/cab8" type="url" />
          </div>
        </SettingsCard>

        {/* ── 4. FARE CONFIGURATION ── */}
        <SettingsCard title="💰 Fare Configuration" subtitle="Default pricing rules — per vehicle type and global">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <SettingField label="Min Fare (₹)" value={get("fare_min_fare", "100")} onChange={v => set("fare_min_fare", v)} placeholder="100" type="number" />
            <SettingField label="Surge Multiplier" value={get("fare_surge_mult", "1.0")} onChange={v => set("fare_surge_mult", v)} placeholder="1.0" type="number" />
            <SettingField label="Cancellation Fee (₹)" value={get("fare_cancel_fee", "0")} onChange={v => set("fare_cancel_fee", v)} placeholder="0" type="number" />
          </div>
          <p style={{ color: "#4A6080", fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "4px" }}>Rate per KM — by vehicle type</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
            {[
              { key: "fare_hatchback_per_km", label: "🚗 Hatchback", def: "12" },
              { key: "fare_sedan_per_km",     label: "🚙 Sedan",     def: "15" },
              { key: "fare_suv_per_km",       label: "🚕 SUV",       def: "22" },
              { key: "fare_luxury_per_km",    label: "🚘 Luxury",    def: "35" },
            ].map(v => (
              <SettingField key={v.key} label={`${v.label} (₹/km)`} value={get(v.key, v.def)} onChange={val => set(v.key, val)} placeholder={v.def} type="number" />
            ))}
          </div>
          {/* Preview */}
          <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "10px", padding: "14px 18px" }}>
            <p style={{ color: "#4A6080", fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Fare Preview (10 km trip)</p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {[
                { label: "Hatchback", key: "fare_hatchback_per_km", def: "12" },
                { label: "Sedan",     key: "fare_sedan_per_km",     def: "15" },
                { label: "SUV",       key: "fare_suv_per_km",       def: "22" },
                { label: "Luxury",    key: "fare_luxury_per_km",    def: "35" },
              ].map(v => (
                <div key={v.key}>
                  <p style={{ color: "#4A6080", fontSize: "11px" }}>{v.label}</p>
                  <p style={{ color: "#60A5FA", fontWeight: 700, fontSize: "18px", fontFamily: "'Space Grotesk',sans-serif" }}>
                    ₹{Math.max(Number(get("fare_min_fare", "100")), Math.round(10 * Number(get(v.key, v.def)) * Number(get("fare_surge_mult", "1")))).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SettingsCard>

        {/* ── 5. CITIES ── */}
        <SettingsCard title="🏙️ Cities & Coverage" subtitle="Areas where Cab8 operates">
          <SettingField label="Cities (comma separated)" value={get("cities_covered", "")} onChange={v => set("cities_covered", v)} placeholder="Shimla, Manali, Mandi, Kullu…" multiline />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {get("cities_covered").split(",").map(c => c.trim()).filter(Boolean).map(c => (
              <span key={c} style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", color: "#22D3EE", fontSize: "12px", padding: "3px 12px", borderRadius: "999px" }}>
                {c}
              </span>
            ))}
          </div>
        </SettingsCard>

        {/* ── 6. LEGAL LINKS ── */}
        <SettingsCard title="⚖️ Legal & Policies" subtitle="Links to legal documents shown in the app">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SettingField label="Terms & Conditions URL" value={get("legal_terms_url")} onChange={v => set("legal_terms_url", v)} placeholder="https://cab8.in/terms" type="url" />
            <SettingField label="Privacy Policy URL" value={get("legal_privacy_url")} onChange={v => set("legal_privacy_url", v)} placeholder="https://cab8.in/privacy" type="url" />
            <SettingField label="Refund Policy URL" value={get("legal_refund_url")} onChange={v => set("legal_refund_url", v)} placeholder="https://cab8.in/refund" type="url" />
            <SettingField label="About Us URL" value={get("legal_about_url")} onChange={v => set("legal_about_url", v)} placeholder="https://cab8.in/about" type="url" />
          </div>
        </SettingsCard>

        {/* ── 7. ANNOUNCEMENT BANNER ── */}
        <SettingsCard title="🔔 Announcement Banner" subtitle="Show a pinned notice to all app users">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <Toggle value={get("banner_enabled") === "true"} onChange={v => set("banner_enabled", v ? "true" : "false")} label="Enable Banner" />
            <div style={{ display: "flex", gap: "8px" }}>
              {["info", "warning", "success", "error"].map(t => (
                <button key={t} onClick={() => set("banner_type", t)}
                  style={{ padding: "4px 12px", borderRadius: "8px", border: "1px solid", borderColor: get("banner_type") === t ? "rgba(37,99,235,0.6)" : "rgba(26,46,69,0.6)", background: get("banner_type") === t ? "rgba(37,99,235,0.2)" : "transparent", color: get("banner_type") === t ? "#60A5FA" : "#4A6080", cursor: "pointer", fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <SettingField label="Banner Message" value={get("banner_text")} onChange={v => set("banner_text", v)} placeholder="e.g. Service down 6–8 PM tonight for maintenance." multiline />
          {get("banner_enabled") === "true" && get("banner_text") && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid", borderColor: get("banner_type") === "error" ? "rgba(239,68,68,0.4)" : get("banner_type") === "warning" ? "rgba(245,158,11,0.4)" : get("banner_type") === "success" ? "rgba(16,185,129,0.4)" : "rgba(37,99,235,0.4)", background: get("banner_type") === "error" ? "rgba(239,68,68,0.08)" : get("banner_type") === "warning" ? "rgba(245,158,11,0.08)" : get("banner_type") === "success" ? "rgba(16,185,129,0.08)" : "rgba(37,99,235,0.08)" }}>
              <p style={{ fontSize: "12px", color: "#F0F6FF" }}>📢 Preview: {get("banner_text")}</p>
            </div>
          )}
        </SettingsCard>

        {/* ── 8. FEATURE TOGGLES ── */}
        <SettingsCard title="🔧 Feature Toggles" subtitle="Turn app features on or off globally">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Toggle value={get("feature_ride_board") !== "false"} onChange={v => set("feature_ride_board", v ? "true" : "false")} label="📋 Ride Board — Allow drivers to post shared rides" />
            <Toggle value={get("feature_union_apps") !== "false"} onChange={v => set("feature_union_apps", v ? "true" : "false")} label="📝 Union Applications — Accept new driver union applications" />
            <Toggle value={get("feature_customer_reg") !== "false"} onChange={v => set("feature_customer_reg", v ? "true" : "false")} label="👥 Customer Registration — Allow new customer sign-ups" />
            <Toggle value={get("feature_driver_reg") !== "false"} onChange={v => set("feature_driver_reg", v ? "true" : "false")} label="🚗 Driver Registration — Allow new driver sign-ups" />
            <Toggle value={get("feature_maintenance") === "true"} onChange={v => set("feature_maintenance", v ? "true" : "false")} label="🔧 Maintenance Mode — Show maintenance screen to all users" />
          </div>
        </SettingsCard>

        {/* ── 9. WORKING HOURS ── */}
        <SettingsCard title="🕐 Working Hours" subtitle="Support team availability shown to customers">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SettingField label="Weekday Hours" value={get("hours_weekday", "8:00 AM – 10:00 PM")} onChange={v => set("hours_weekday", v)} placeholder="8:00 AM – 10:00 PM" />
            <SettingField label="Weekend Hours" value={get("hours_weekend", "9:00 AM – 8:00 PM")} onChange={v => set("hours_weekend", v)} placeholder="9:00 AM – 8:00 PM" />
          </div>
          <Toggle value={get("hours_24x7") === "true"} onChange={v => set("hours_24x7", v ? "true" : "false")} label="24×7 Support Available" />
        </SettingsCard>

        {/* Save bar */}
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </div>
    </>
  );
}
