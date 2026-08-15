export type VehicleType = "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY";
export type RideType = "LOCAL" | "OUTSTATION" | "AIRPORT" | "HOURLY";

const BASE_FARE = 50;
const PER_KM_RATE: Record<VehicleType, number> = {
  HATCHBACK: 12,
  SEDAN: 16,
  SUV: 22,
  LUXURY: 35,
};
const RIDE_TYPE_SURCHARGE: Record<RideType, number> = {
  LOCAL: 0,
  AIRPORT: 100,
  OUTSTATION: 0,
  HOURLY: 0,
};

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(
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
  return Math.round(R * c * 10) / 10;
}

export function estimateFare(
  km: number,
  vehicleType: VehicleType,
  rideType: RideType,
  driverRatePerKm?: number
): number {
  const perKm = driverRatePerKm ?? PER_KM_RATE[vehicleType];
  const fare = BASE_FARE + km * perKm + RIDE_TYPE_SURCHARGE[rideType];
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
