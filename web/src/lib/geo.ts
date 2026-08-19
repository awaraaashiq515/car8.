import { Place, PLACE_PRESETS } from "@/lib/api";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestPreset(lat: number, lng: number): Place {
  return PLACE_PRESETS.reduce((best, p) => {
    const d = haversine(lat, lng, p.lat, p.lng);
    return d < haversine(lat, lng, best.lat, best.lng) ? p : best;
  }, PLACE_PRESETS[0]);
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // 1. Nominatim Reverse Geocoding (High detail: Landmark, Road, Locality, City, PIN)
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(nomUrl, { headers: { "Accept-Language": "en" } });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const parts: string[] = [];

      const landmark = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic || "";
      if (landmark) parts.push(landmark);

      const road = addr.road || addr.street || addr.footway || addr.path || "";
      if (road && !parts.includes(road)) parts.push(road);

      const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.hamlet || "";
      if (locality && !parts.includes(locality)) parts.push(locality);

      const city = addr.city || addr.town || addr.municipality || addr.tehsil || addr.subdistrict || addr.county || "";
      if (city && !parts.includes(city) && !parts.some((p) => p.toLowerCase().includes(city.toLowerCase()))) {
        parts.push(city);
      }

      const state = addr.state ? addr.state.replace("Himachal Pradesh", "HP") : "";
      const pin = addr.postcode || "";

      if (state) {
        parts.push(pin ? `${state} ${pin}` : state);
      }

      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch {}

  try {
    // 2. BigDataCloud Fallback
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl);
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || data.principalSubdivisionDistrict || "";
      const district = data.principalSubdivisionDistrict || "";
      const state = data.principalSubdivision ? data.principalSubdivision.replace("Himachal Pradesh", "HP") : "";
      const parts = [locality];
      if (district && district.toLowerCase() !== locality.toLowerCase()) parts.push(district);
      if (state && state.toLowerCase() !== district.toLowerCase() && state.toLowerCase() !== locality.toLowerCase()) parts.push(state);
      if (parts.filter(Boolean).length > 0) {
        return parts.filter(Boolean).join(", ");
      }
    }
  } catch {}

  // 3. Fallback to closest preset
  return getNearestPreset(lat, lng).label;
}

export async function checkLocationPermission(): Promise<"granted" | "prompt" | "denied" | "unsupported"> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }

  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state as "granted" | "prompt" | "denied";
    }
  } catch {}

  return "prompt";
}

export function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Fallback without high accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}
