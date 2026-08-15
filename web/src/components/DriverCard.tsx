import { DriverResult } from "@/lib/api";

export function DriverCard({
  driver,
  onBook,
  booking,
}: {
  driver: DriverResult;
  onBook: (d: DriverResult) => void;
  booking: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-asphalt-light bg-asphalt-light/50 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold">{driver.driverName}</span>
          <span className="rounded-full bg-highway/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-highway">
            Verified
          </span>
        </div>
        <div className="mt-0.5 text-sm text-slate-light">
          {driver.vehicleType} · {driver.vehicleNumber} · {driver.city}
        </div>
        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-slate-light">
          <span>★ {driver.ratingAvg.toFixed(1)}</span>
          <span>{driver.etaMinutes} min away</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-mono text-lg font-semibold text-marigold">₹{driver.fare}</span>
        <button
          onClick={() => onBook(driver)}
          disabled={booking}
          className="rounded-lg bg-marigold px-4 py-1.5 text-sm font-bold text-asphalt transition hover:bg-marigold-dark disabled:opacity-50"
        >
          {booking ? "Booking…" : "Book"}
        </button>
      </div>
    </div>
  );
}
