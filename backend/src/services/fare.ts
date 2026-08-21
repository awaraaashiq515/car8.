/** Top-level vehicle categories */
export type VehicleCategory = "CAR" | "BIKE" | "AUTO" | "GOODS" | "HEAVY";

export type VehicleType =
  // ── CAR ──────────────────────────────────────
  | "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY"
  // ── BIKE ─────────────────────────────────────
  | "BIKE" | "ELECTRIC_BIKE"
  // ── AUTO / RICKSHAW ───────────────────────────
  | "AUTO" | "E_RICKSHAW"
  // ── GOODS (light & medium trucks / tempo) ─────
  | "PICKUP_TRUCK" | "MINI_TRUCK" | "TEMPO" | "TRUCK"
  // ── HEAVY MACHINERY ───────────────────────────
  | "JCB" | "TRACTOR" | "CRANE" | "TIPPER";

export type RideType = "LOCAL" | "OUTSTATION" | "AIRPORT" | "HOURLY";

/** Map each VehicleType to its parent VehicleCategory */
export const VEHICLE_CATEGORY_MAP: Record<VehicleType, VehicleCategory> = {
  HATCHBACK: "CAR", SEDAN: "CAR", SUV: "CAR", LUXURY: "CAR",
  BIKE: "BIKE", ELECTRIC_BIKE: "BIKE",
  AUTO: "AUTO", E_RICKSHAW: "AUTO",
  PICKUP_TRUCK: "GOODS", MINI_TRUCK: "GOODS", TEMPO: "GOODS", TRUCK: "GOODS",
  JCB: "HEAVY", TRACTOR: "HEAVY", CRANE: "HEAVY", TIPPER: "HEAVY",
};

/** Base platform fee per booking (₹) */
const BASE_FARE: Record<VehicleCategory, number> = {
  CAR:   50,
  BIKE:  20,
  AUTO:  30,
  GOODS: 80,
  HEAVY: 200,
};

/** Default per-km rate — drivers can override via rate_per_km */
export const PER_KM_RATE: Record<VehicleType, number> = {
  // CAR
  HATCHBACK: 12, SEDAN: 16, SUV: 22, LUXURY: 35,
  // BIKE
  BIKE: 7, ELECTRIC_BIKE: 6,
  // AUTO
  AUTO: 9, E_RICKSHAW: 7,
  // GOODS
  PICKUP_TRUCK: 18, MINI_TRUCK: 22, TEMPO: 20, TRUCK: 30,
  // HEAVY (per hour when HOURLY, otherwise per km)
  JCB: 80, TRACTOR: 50, CRANE: 100, TIPPER: 60,
};

const RIDE_TYPE_SURCHARGE: Record<RideType, number> = {
  LOCAL: 0,
  AIRPORT: 100,
  OUTSTATION: 0,
  HOURLY: 0,
};

const distanceCache = new Map<string, number>();

/** Haversine straight-line distance in km */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Synchronous distance in km with road curvature multiplier */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const straight = haversineKm(lat1, lng1, lat2, lng2);
  if (straight === 0) return 0;
  // Road terrain factor (hills and highway routes are typically 1.35x - 1.45x crow distance)
  const roadFactor = straight < 10 ? 1.25 : 1.4;
  return Math.round(straight * roadFactor * 10) / 10;
}

/**
 * Real Driving Road Distance in KM via OSRM Driving Engine.
 * Fetches the actual highway and street driving route distance, with in-memory caching.
 */
export async function getRoadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> {
  if (lat1 === lat2 && lng1 === lng2) return 0;

  const key = `${lat1.toFixed(4)},${lng1.toFixed(4)}-${lat2.toFixed(4)},${lng2.toFixed(4)}`;
  if (distanceCache.has(key)) {
    return distanceCache.get(key)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as any;
      if (data?.routes?.[0]?.distance) {
        const roadKm = Math.round(data.routes[0].distance / 100) / 10;
        distanceCache.set(key, roadKm);
        return roadKm;
      }
    }
  } catch (e) {
    // Network fallback
  }

  const fallback = distanceKm(lat1, lng1, lat2, lng2);
  distanceCache.set(key, fallback);
  return fallback;
}

export function estimateFare(
  km: number,
  vehicleType: VehicleType,
  rideType: RideType,
  driverRatePerKm?: number
): number {
  const category = VEHICLE_CATEGORY_MAP[vehicleType] ?? "CAR";
  const baseFee = BASE_FARE[category];
  const perKm = driverRatePerKm ?? PER_KM_RATE[vehicleType];
  const fare = baseFee + km * perKm + RIDE_TYPE_SURCHARGE[rideType];
  return Math.round(fare);
}

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Mandi":       { lat: 31.7084, lng: 76.9319 },
  "Shimla":      { lat: 31.1048, lng: 77.1734 },
  "Manali":      { lat: 32.2432, lng: 77.1892 },
  "Dharamshala": { lat: 32.2190, lng: 76.3234 },
  "Kullu":       { lat: 31.9582, lng: 77.1096 },
  "Solan":       { lat: 30.9047, lng: 77.0967 },
  "Bilaspur":    { lat: 31.3395, lng: 76.7605 },
  "Hamirpur":    { lat: 31.6855, lng: 76.5216 },
  "Una":         { lat: 31.4684, lng: 76.2706 },
  "Delhi":       { lat: 28.6139, lng: 77.2090 },
  "Chandigarh":  { lat: 30.7333, lng: 76.7794 },
  "Dehradun":    { lat: 30.3165, lng: 78.0322 },
  "Amritsar":    { lat: 31.6340, lng: 74.8723 },
};
