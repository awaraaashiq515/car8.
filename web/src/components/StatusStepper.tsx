import { RideStatus } from "@/lib/api";

const STEPS: { key: RideStatus; label: string }[] = [
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "DRIVER_ASSIGNED", label: "Driver assigned" },
  { key: "ONGOING", label: "On the way" },
  { key: "COMPLETED", label: "Completed" },
];

export function StatusStepper({ status }: { status: RideStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
        This trip was cancelled.
      </div>
    );
  }

  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status)
  );

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                i <= activeIndex ? "bg-highway" : "bg-asphalt-light"
              }`}
            />
            <span
              className={`mt-2 text-center text-[11px] ${
                i <= activeIndex ? "text-mist" : "text-slate-light"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1 h-0.5 flex-1 ${
                i < activeIndex ? "bg-highway" : "bg-asphalt-light"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
