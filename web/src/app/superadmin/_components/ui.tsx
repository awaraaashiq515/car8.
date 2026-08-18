"use client";
// ─── Reusable Settings UI components ─────────────────────────────────────────
import { useRef } from "react";

// ── SettingsCard ──────────────────────────────────────────────────────────────
export function SettingsCard({ title, subtitle, children }: {
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#0A1628", border: "1px solid #1A2E45", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderBottom: "1px solid #0F1E33", paddingBottom: "14px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#F0F6FF" }}>{title}</h2>
        <p style={{ color: "#4A6080", fontSize: "12px", marginTop: "3px" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// ── SettingField ──────────────────────────────────────────────────────────────
export function SettingField({ label, value, onChange, placeholder, type = "text", multiline = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean; hint?: string;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "#050D1A",
    border: "1px solid #1A2E45", borderRadius: "10px", color: "#F0F6FF",
    fontSize: "13px", outline: "none", fontFamily: "inherit",
    resize: multiline ? "vertical" : "none", transition: "border-color 0.2s",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ color: "#6B8BAE", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "monospace" }}>
        {label}
      </label>
      {type === "color" ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="color" value={value || "#2563EB"} onChange={e => onChange(e.target.value)}
            style={{ width: "48px", height: "38px", border: "1px solid #1A2E45", borderRadius: "8px", background: "#050D1A", cursor: "pointer", padding: "3px" }} />
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...inputStyle, flex: 1, width: "auto" }} />
        </div>
      ) : multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={inputStyle} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(37,99,235,0.6)")}
          onBlur={e => (e.currentTarget.style.borderColor = "#1A2E45")} />
      )}
      {hint && <p style={{ color: "#3B5A7A", fontSize: "11px" }}>{hint}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange, label }: {
  value: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => onChange(!value)}>
      <div style={{ width: "44px", height: "24px", borderRadius: "999px", background: value ? "linear-gradient(135deg,#2563EB,#06B6D4)" : "#1A2E45", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "3px", left: value ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
      </div>
      <span style={{ color: "#C5D9EF", fontSize: "13px", userSelect: "none" }}>{label}</span>
    </div>
  );
}

// ── ImageUploadField ──────────────────────────────────────────────────────────
export function ImageUploadField({ label, subtitle, value, onChange, small = false }: {
  label: string; subtitle: string; value: string;
  onChange: (v: string) => void; small?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }
  const size = small ? "52px" : "84px";
  const radius = small ? "10px" : "14px";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ color: "#6B8BAE", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "monospace" }}>{label}</label>
      <p style={{ color: "#4A6080", fontSize: "11px" }}>{subtitle}</p>
      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
        <div style={{ width: size, height: size, border: "2px dashed #1A2E45", borderRadius: radius, display: "flex", alignItems: "center", justifyContent: "center", background: "#050D1A", flexShrink: 0, overflow: "hidden", transition: "border-color 0.2s" }}>
          {value
            ? <img src={value} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span style={{ color: "#3B5A7A", fontSize: small ? "22px" : "30px" }}>🖼️</span>
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "8px 16px", border: "1px solid rgba(37,99,235,0.4)", borderRadius: "8px", background: "rgba(37,99,235,0.1)", color: "#60A5FA", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
            📁 Choose File
          </button>
          {value && (
            <button onClick={() => onChange("")}
              style={{ padding: "6px 16px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", background: "rgba(239,68,68,0.08)", color: "#F87171", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
              🗑️ Remove
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ── SaveBar ───────────────────────────────────────────────────────────────────
export function SaveBar({ onSave, saving, dirty }: {
  onSave: () => void; saving: boolean; dirty: boolean;
}) {
  return (
    <div style={{ position: "sticky", bottom: "16px", zIndex: 50, display: "flex", justifyContent: "flex-end", padding: "0 4px" }}>
      <button onClick={onSave} disabled={saving || !dirty}
        style={{ padding: "12px 32px", background: dirty ? "linear-gradient(135deg,#2563EB,#06B6D4)" : "#1A2E45", border: "none", borderRadius: "12px", color: dirty ? "#fff" : "#4A6080", fontSize: "14px", fontWeight: 600, cursor: dirty && !saving ? "pointer" : "not-allowed", opacity: saving ? 0.6 : 1, boxShadow: dirty ? "0 4px 20px rgba(37,99,235,0.4)" : "none", transition: "all 0.25s" }}>
        {saving ? "💾 Saving…" : dirty ? "💾 Save Changes" : "✓ Saved"}
      </button>
    </div>
  );
}
