"use client";

/**
 * The signature visual for Cab8: a route drawing itself between two pins,
 * echoing the "search a route" moment that every booking starts with. Kept
 * to a single orchestrated draw-in rather than ambient looping motion.
 */
export function RouteRibbon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 40 150 C 200 150, 220 40, 380 60 C 520 78, 560 160, 760 50"
        stroke="#F2A93B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="10 10"
        className="animate-dash-draw"
        style={{ strokeDasharray: 400, strokeDashoffset: 400 }}
      />
      <circle cx="40" cy="150" r="8" fill="#2F9E7A" />
      <circle cx="40" cy="150" r="14" fill="#2F9E7A" opacity="0.25" />
      <circle cx="760" cy="50" r="8" fill="#F2A93B" />
      <circle cx="760" cy="50" r="14" fill="#F2A93B" opacity="0.25" />
    </svg>
  );
}
