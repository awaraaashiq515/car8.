"use client";

import { useState } from "react";
import { Ride, DriverProfile } from "@/lib/api";

interface TripSettlementModalProps {
  ride: Ride;
  driver?: DriverProfile | null;
  onComplete: () => void;
}

type PaymentMethod = "UPI" | "CASH" | "ONLINE";

export default function TripSettlementModal({
  ride,
  driver,
  onComplete,
}: TripSettlementModalProps) {
  const baseFare = ride.estimated_fare;
  const [extraToll, setExtraToll] = useState<number>(0);
  const totalAmount = baseFare + extraToll;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [cashTendered, setCashTendered] = useState<string>(String(totalAmount));
  const [isPaid, setIsPaid] = useState(false);
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [ratingTags, setRatingTags] = useState<string[]>(["Polite Passenger", "On Time"]);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Driver UPI ID
  const driverUpiId =
    driver?.upi_id ||
    (driver?.phone ? `${driver.phone.replace(/\D/g, "")}@upi` : "driver@oksbi");
  const driverName = driver?.name || "Taxi Driver";

  // Dynamic UPI URL for QR Code
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(driverUpiId)}&pn=${encodeURIComponent(
    driverName
  )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Cab8 Ride Fare - ${ride.id.slice(-6)}`)}`;

  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayUrl
  )}&margin=8`;

  // Change Calculation for Cash
  const cashNum = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, cashNum - totalAmount);

  function handleCopyUpi() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(driverUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  }

  function toggleTag(tag: string) {
    setRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleShareWhatsApp() {
    const text = `🚕 *Cab8 Trip Receipt*\n\n` +
      `📅 Date: ${new Date().toLocaleDateString()}\n` +
      `📍 Pickup: ${ride.pickup_text}\n` +
      `🏁 Dropoff: ${ride.drop_text}\n` +
      `📏 Distance: ${ride.distance_km} km\n` +
      `💰 Total Fare: ₹${totalAmount}\n` +
      `💳 Paid via: ${paymentMethod}\n` +
      `👨‍✈️ Driver: ${driverName} (${driver?.vehicle_number || "Taxi"})\n\n` +
      `Thank you for riding with Cab8! Have a great day ahead.`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0D182E] border border-blue-primary/40 shadow-2xl overflow-hidden my-auto animate-fade-up max-h-[92vh] flex flex-col"
        style={{ boxShadow: "0 0 50px rgba(37,99,235,0.25)" }}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-blue-900/40 border-b border-navy-border px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-display font-bold text-white text-base leading-tight">
                {isPaid ? "Payment Settled!" : "Collect Trip Payment"}
              </h3>
              <p className="text-[10px] text-muted font-mono">
                Ride ID: {ride.id.slice(-8).toUpperCase()} · {ride.vehicle_type}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-green/20 border border-green/40 text-green">
            COMPLETED
          </span>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* ── Total Fare Glowing Card ── */}
          <div className="rounded-2xl border border-green/30 bg-gradient-to-b from-green/10 via-[#0A1B28] to-[#0D182E] p-4 text-center relative overflow-hidden shadow-inner">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
              Total Amount to Collect
            </span>
            <div className="font-display text-4xl font-black text-green my-1 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              ₹{totalAmount}
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-muted mt-1 font-mono">
              <span>📏 {ride.distance_km} km</span>
              <span>•</span>
              <span className="text-white truncate max-w-[200px]">{ride.pickup_text} → {ride.drop_text}</span>
            </div>

            {/* Toll / Extra Charges option */}
            {!isPaid && (
              <div className="mt-3 pt-3 border-t border-navy-border/50 flex items-center justify-between text-xs">
                <span className="text-muted">Extra Toll / Parking:</span>
                <div className="flex items-center gap-1.5">
                  {[0, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExtraToll(amt)}
                      className={`px-2 py-0.5 rounded-lg font-mono text-[10px] border transition-all ${
                        extraToll === amt
                          ? "bg-blue-primary text-white border-blue-primary font-bold shadow"
                          : "bg-navy-deep border-navy-border text-muted hover:text-white"
                      }`}
                    >
                      {amt === 0 ? "None" : `+₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isPaid ? (
            <>
              {/* ── Payment Method Selector ── */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted block mb-2 font-semibold">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "UPI" as PaymentMethod, label: "UPI / QR", icon: "📱", desc: "PhonePe/GPay" },
                    { id: "CASH" as PaymentMethod, label: "Cash", icon: "💵", desc: "Hand-to-hand" },
                    { id: "ONLINE" as PaymentMethod, label: "Prepaid", icon: "💳", desc: "Online Wallet" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === m.id
                          ? "border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] font-bold scale-[1.02]"
                          : "border-navy-border bg-navy-deep text-muted hover:border-navy-hover hover:text-white"
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                      <span className="text-[9px] text-muted font-mono">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── UPI / QR Mode View ── */}
              {paymentMethod === "UPI" && (
                <div className="rounded-2xl border border-navy-border bg-navy-deep p-4 space-y-3 text-center animate-fade-in">
                  <p className="text-xs text-white font-semibold flex items-center justify-center gap-1.5">
                    <span>📲</span>
                    <span>Customer Scans &amp; Pays Directly to Your UPI</span>
                  </p>

                  {/* QR Code Container */}
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-xl mx-auto border-2 border-cyan-400/50">
                    <img
                      src={qrCodeImgUrl}
                      alt="UPI QR Code"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                    <div className="text-[10px] font-mono font-bold text-slate-900 mt-1">
                      Scan to Pay ₹{totalAmount}
                    </div>
                  </div>

                  {/* UPI ID display & copy */}
                  <div className="flex items-center justify-center gap-2 bg-navy-card rounded-xl px-3 py-2 border border-navy-border text-xs">
                    <span className="text-muted font-mono">UPI ID:</span>
                    <span className="text-cyan-400 font-mono font-bold">{driverUpiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="ml-1 text-[10px] font-mono text-blue-light hover:underline font-bold"
                    >
                      {copiedUpi ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted">
                    Supports Google Pay, PhonePe, Paytm, BHIM &amp; all Indian UPI Apps
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className="w-full py-3.5 rounded-xl font-display font-bold text-white bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 text-sm"
                  >
                    <span>✓</span>
                    <span>Payment Received in UPI (₹{totalAmount})</span>
                  </button>
                </div>
              )}

              {/* ── Cash Mode View with Change Calculator ── */}
              {paymentMethod === "CASH" && (
                <div className="rounded-2xl border border-navy-border bg-navy-deep p-4 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">Cash Given by Customer</label>
                    <span className="text-[10px] text-muted font-mono">Fare: ₹{totalAmount}</span>
                  </div>

                  {/* Quick tender amount buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[totalAmount, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(String(amt))}
                        className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                          cashNum === amt
                            ? "bg-amber-500/20 border-amber-400 text-amber"
                            : "bg-navy-card border-navy-border text-muted hover:text-white"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Cash Input */}
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">₹</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="Enter amount received"
                      className="w-full rounded-xl bg-navy-card border border-navy-border pl-8 pr-4 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Change to Return box */}
                  <div className="rounded-xl bg-[#091322] border border-amber-500/30 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-muted uppercase block">Change to Return</span>
                      <strong className="text-amber-400 text-xl font-bold font-display">
                        ₹{changeToReturn.toFixed(0)}
                      </strong>
                    </div>
                    {changeToReturn > 0 ? (
                      <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-lg">
                        Return ₹{changeToReturn.toFixed(0)} change
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-green bg-green/10 border border-green/30 px-2.5 py-1 rounded-lg">
                        Exact Amount
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className="w-full py-3.5 rounded-xl font-display font-bold text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:brightness-105 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 text-sm"
                  >
                    <span>✓</span>
                    <span>Confirm Cash Collected (₹{totalAmount})</span>
                  </button>
                </div>
              )}

              {/* ── Online Mode View ── */}
              {paymentMethod === "ONLINE" && (
                <div className="rounded-2xl border border-navy-border bg-navy-deep p-4 space-y-3 text-center animate-fade-in">
                  <div className="h-12 w-12 rounded-2xl bg-blue-primary/20 border border-blue-primary/40 flex items-center justify-center text-2xl mx-auto">
                    💳
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Prepaid In-App Payment</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Amount will be credited directly to your registered bank account / wallet balance.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className="w-full py-3.5 rounded-xl font-display font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 text-sm"
                  >
                    <span>✓</span>
                    <span>Confirm Settlement (₹{totalAmount})</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── STEP 2: Payment Received & Post-Ride Rating ── */
            <div className="space-y-4 animate-fade-up">
              <div className="rounded-2xl border border-green/40 bg-green/10 p-4 text-center space-y-1.5">
                <div className="h-12 w-12 rounded-full bg-green/20 border-2 border-green flex items-center justify-center text-2xl mx-auto shadow-lg text-green">
                  ✓
                </div>
                <h4 className="font-display text-base font-bold text-white">
                  Payment of ₹{totalAmount} Recorded
                </h4>
                <p className="text-xs text-green font-mono">
                  Settled via {paymentMethod} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Customer Rating Section */}
              <div className="rounded-2xl border border-navy-border bg-navy-deep p-4 space-y-2.5">
                <label className="text-xs font-semibold text-white block">
                  Rate Customer Experience
                </label>

                {/* 5-Star Buttons */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCustomerRating(star)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg transition-all ${
                        star <= customerRating
                          ? "bg-amber-500/20 border-amber-400 text-amber shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          : "bg-navy-card border-navy-border text-muted hover:border-navy-hover"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber ml-2">
                    {customerRating}.0 Rating
                  </span>
                </div>

                {/* Quick Feedback Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Polite Passenger",
                    "On Time",
                    "Clean & Respectful",
                    "Smooth Payment",
                    "Friendly",
                  ].map((tag) => {
                    const sel = ratingTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                          sel
                            ? "bg-blue-primary/20 border-blue-primary text-blue-light font-bold"
                            : "bg-navy-card border-navy-border text-muted hover:text-white"
                        }`}
                      >
                        {sel ? "✓ " : "+ "}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Share WhatsApp Receipt */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 rounded-xl border border-green/40 bg-green/10 text-green hover:bg-green/20 transition-all font-mono text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>📲</span>
                <span>Share WhatsApp Receipt with Customer</span>
              </button>

              {/* Final Ready for Next Ride Action */}
              <button
                type="button"
                onClick={onComplete}
                className="w-full py-4 rounded-2xl font-display font-black text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:brightness-110 transition-all shadow-[0_4px_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 text-base"
              >
                <span>Ready for Next Ride</span>
                <span>🚀</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
