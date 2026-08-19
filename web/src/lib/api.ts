export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:4001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
}

export type DriverOnlineStatus = "ONLINE" | "OFFLINE";

export type VehicleType = "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY";
export type RideType = "LOCAL" | "OUTSTATION" | "AIRPORT" | "HOURLY";
export type RideStatus =
  | "SEARCHING"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "ARRIVED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

export interface DriverResult {
  driverId: string;
  driverName: string;
  city: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  avatarPhoto?: string | null;
  ratingAvg: number;
  totalReviews?: number;
  pickupDistanceKm: number;
  etaMinutes: number;
  fare: number;
}

export interface SearchResponse {
  tripDistanceKm: number;
  baseFareEstimate: number;
  drivers: DriverResult[];
}

export interface Ride {
  id: string;
  customer_id: string;
  driver_id: string | null;
  ride_type: RideType;
  vehicle_type: VehicleType;
  pickup_text: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_text: string;
  drop_lat: number;
  drop_lng: number;
  distance_km: number;
  estimated_fare: number;
  final_fare: number | null;
  status: RideStatus;
  start_otp?: string;
  created_at: string;
  updated_at: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    city: string;
    vehicle_type: VehicleType;
    vehicle_number: string;
    rating_avg: number;
    total_reviews: number;
    avatar_photo?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    current_lat?: number | null;
    current_lng?: number | null;
  } | null;
  review?: DriverReview | null;
}

export interface DriverReview {
  id: string;
  ride_id: string;
  driver_id: string;
  customer_name: string;
  rating: number;
  comment?: string | null;
  tags: string[];
  tip_amount?: number;
  created_at: string;
}

export interface DriverReviewsResponse {
  rating_avg: number;
  total_reviews: number;
  breakdown: Record<number, number>;
  reviews: DriverReview[];
}

export interface DriverPublicProfile {
  id: string;
  driverName: string;
  city: string;
  district?: string | null;
  tehsil?: string | null;
  village?: string | null;
  standName?: string | null;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  seats: number;
  fuelType?: string | null;
  acAvailable: boolean;
  avatarPhoto?: string | null;
  vehiclePhotos: string[];
  experience?: string | null;
  permitZones?: string | null;
  isVerified: boolean;
  rcVerified: boolean;
  licenseVerified: boolean;
  aadharVerified: boolean;
  ratingAvg: number;
  totalReviews: number;
  completedTrips: number;
  memberSince?: string | null;
  breakdown: Record<number, number>;
  reviews: {
    id?: string;
    customer_name?: string;
    rating: number;
    comment?: string | null;
    tags?: string[];
    created_at: string;
  }[];
}

export interface DriverProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string | null;
  alt_phone?: string | null;
  emergency_contact?: string | null;
  license_number?: string | null;
  experience?: string | null;
  city: string;
  district?: string | null;
  tehsil?: string | null;
  village?: string | null;
  stand_name?: string | null;
  permit_zones?: string | null;
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  seats?: number | null;
  fuel_type?: string | null;
  ac_available?: number | boolean | null;
  rate_per_km: number;
  rc_photo?: string | null;
  aadhar_photo?: string | null;
  license_photo?: string | null;
  avatar_photo?: string | null;
  vehicle_photos?: string[] | string | null;
  insurance_expiry?: string | null;
  upi_id?: string | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  is_verified: number;
  is_online: number;
  rating_avg: number;
  total_reviews?: number;
  current_lat: number;
  current_lng: number;
}

export interface DriverRates {
  rate_per_km: number;
  vehicle_type: VehicleType;
  city: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("cab8_token") || window.localStorage.getItem("taximint_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("cab8_token", token);
}

export function setUserName(name: string) {
  window.localStorage.setItem("cab8_user_name", name);
}

export function getUserName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("cab8_user_name") || window.localStorage.getItem("taximint_user_name");
}

export function clearToken() {
  window.localStorage.removeItem("cab8_token");
  window.localStorage.removeItem("cab8_user_name");
  window.localStorage.removeItem("taximint_token");
  window.localStorage.removeItem("taximint_user_name");
}

// Driver-specific token (stored separately so driver portal is independent)
export function getDriverToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("cab8_driver_token") || window.localStorage.getItem("taximint_driver_token");
}
export function setDriverToken(token: string) {
  window.localStorage.setItem("cab8_driver_token", token);
}
export function clearDriverToken() {
  window.localStorage.removeItem("cab8_driver_token");
  window.localStorage.removeItem("taximint_driver_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  requestOtp: (phone: string) =>
    request<{ message: string; devOnlyCode: string }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string, name?: string) =>
    request<{ token: string; user: { id: string; phone: string; name: string | null } }>(
      "/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ phone, code, name }) }
    ),
  searchRides: (payload: {
    pickupText: string;
    pickupLat: number;
    pickupLng: number;
    dropText: string;
    dropLat: number;
    dropLng: number;
    vehicleType: VehicleType;
    rideType: RideType;
  }) =>
    request<SearchResponse>("/rides/search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  bookRide: (payload: {
    pickupText: string;
    pickupLat: number;
    pickupLng: number;
    dropText: string;
    dropLat: number;
    dropLng: number;
    vehicleType: VehicleType;
    rideType: RideType;
    driverId: string;
  }) => request<Ride>("/rides", { method: "POST", body: JSON.stringify(payload) }),
  getRide: (id: string) => request<Ride>(`/rides/${id}`),
  getPublicTrack: (id: string) => request<Ride>(`/rides/${id}/public-track`),
  updateRideStatus: (id: string, status: RideStatus) =>
    request<Ride>(`/rides/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  rateRide: (
    id: string,
    data: { rating: number; comment?: string; tags?: string[]; tipAmount?: number }
  ) =>
    request<{
      ok: boolean;
      message: string;
      newRatingAvg: number;
      totalReviews: number;
      review: DriverReview;
    }>(`/rides/${id}/rate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyRides: () => request<Ride[]>("/rides"),
  getProfile: () => request<{ user: UserProfile }>("/auth/me"),
  updateProfile: (data: {
    name?: string;
    email?: string | null;
    avatar_photo?: string | null;
    emergency_contact?: string | null;
  }) =>
    request<{ user: UserProfile; message: string }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getMessages: (rideId: string) => request<RideMessage[]>(`/rides/${rideId}/messages`),
  sendMessage: (rideId: string, text: string) =>
    request<RideMessage>(`/rides/${rideId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  getPublicDriverProfile: (driverId: string) =>
    request<DriverPublicProfile>(`/driver/${driverId}/public-profile`),
};

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email?: string | null;
  avatar_photo?: string | null;
  emergency_contact?: string | null;
  role: string;
  created_at: string;
}

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: "CUSTOMER" | "DRIVER";
  sender_name: string;
  text: string;
  created_at: string;
}

/** Driver portal API — uses driver JWT token */
async function driverRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getDriverToken();
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export const driverApi = {
  getProfile: () => driverRequest<DriverProfile>("/driver/profile"),
  toggleOnline: (online: boolean) =>
    driverRequest<{ is_online: number }>("/driver/toggle-online", {
      method: "PATCH",
      body: JSON.stringify({ online }),
    }),
  getPendingRides: () => driverRequest<Ride[]>("/driver/pending-rides"),
  getActiveRide: () => driverRequest<Ride | null>("/driver/active-ride"),
  respondToRide: (rideId: string, accept: boolean) =>
    driverRequest<Ride>(`/driver/rides/${rideId}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ accept }),
    }),
  updateStatus: (rideId: string, status: "ARRIVED" | "ONGOING" | "COMPLETED") =>
    driverRequest<Ride>(`/driver/rides/${rideId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  verifyOtp: (rideId: string, otp: string) =>
    driverRequest<Ride>(`/driver/rides/${rideId}/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    }),
  updateLocation: (lat: number, lng: number) =>
    driverRequest<{ success: boolean; current_lat: number; current_lng: number }>("/driver/location", {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    }),
  getDriverRides: () => driverRequest<Ride[]>("/driver/rides"),
  getRates: () => driverRequest<DriverRates>("/driver/rates"),
  updateRates: (rate_per_km: number) =>
    driverRequest<{ success: boolean; rate_per_km: number; vehicle_type: VehicleType; city: string }>("/driver/rates", {
      method: "PATCH",
      body: JSON.stringify({ rate_per_km }),
    }),
  getReviews: () => driverRequest<DriverReviewsResponse>("/driver/reviews"),
  getPublicReviews: (driverId: string) =>
    request<{ driver: Partial<DriverProfile>; rating_avg: number; total_reviews: number; reviews: DriverReview[] }>(
      `/driver/${driverId}/public-reviews`
    ),
  updateProfile: (data: Partial<DriverProfile>) =>
    driverRequest<DriverProfile>("/driver/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getMessages: (rideId: string) => driverRequest<RideMessage[]>(`/rides/${rideId}/messages`),
  sendMessage: (rideId: string, text: string) =>
    driverRequest<RideMessage>(`/rides/${rideId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

// ── Board API ──────────────────────────────────────────────────────────────
export type PostType        = "LOOKING" | "OFFERING";
export type PosterType      = "CUSTOMER" | "DRIVER";
export type BoardStatus     = "ACTIVE" | "FILLED" | "EXPIRED";
export type BookingStatus   = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export interface BoardPassenger {
  id:            string;
  customer_name: string;
  seats_booked:  number;
  status:        BookingStatus;
  created_at:    string;
}

export interface BoardPost {
  id:             string;
  poster_id:      string;
  poster_name:    string;
  poster_phone:   string;
  poster_type:    PosterType;
  post_type:      PostType;
  from_text:      string;
  to_text:        string;
  travel_date:    string;
  travel_time:    string | null;
  seats:          number;
  booked_seats:   number;          // computed: seats taken
  price_per_seat: number | null;
  vehicle_type:   string | null;
  description:    string | null;
  luggage_info:   string | null;
  notes:          string | null;
  status:         BoardStatus;
  created_at:     string;
  passengers?:    BoardPassenger[];
}

export interface BoardBooking {
  id:             string;
  post_id:        string;
  customer_id:    string;
  customer_name:  string;
  customer_phone: string;
  seats_booked:   number;
  status:         BookingStatus;
  created_at:     string;
}

export interface BoardMessage {
  id:           string;
  post_id:      string;
  sender_id:    string;
  sender_name:  string;
  sender_type:  "DRIVER" | "CUSTOMER";
  message:      string;
  created_at:   string;
}

export interface CreateBoardPost {
  post_type:      PostType;
  from_text:      string;
  to_text:        string;
  travel_date:    string;
  travel_time?:   string;
  seats:          number;
  price_per_seat?: number | null;
  vehicle_type?:  string | null;
  description?:   string | null;
  luggage_info?:  string | null;
  notes?:         string | null;
}

export const boardApi = {
  list: (filters?: { post_type?: PostType; from?: string; to?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.post_type) params.set("post_type", filters.post_type);
    if (filters?.from)      params.set("from", filters.from);
    if (filters?.to)        params.set("to", filters.to);
    if (filters?.date)      params.set("date", filters.date);
    const qs = params.toString();
    return request<BoardPost[]>(`/board${qs ? `?${qs}` : ""}`);
  },
  getOne: (id: string) => request<BoardPost>(`/board/${id}`),
  getMyPosts: () => request<BoardPost[]>("/board/my"),
  create: (data: CreateBoardPost) =>
    request<BoardPost>("/board", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: BoardStatus) =>
    request<BoardPost>(`/board/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deletePost: (id: string) =>
    request<{ success: boolean }>(`/board/${id}`, { method: "DELETE" }),

  // Bookings
  book: (postId: string, seats_booked: number) =>
    request<BoardBooking>(`/board/${postId}/book`, {
      method: "POST",
      body: JSON.stringify({ seats_booked }),
    }),
  getBookings: (postId: string) =>
    request<BoardBooking[]>(`/board/${postId}/bookings`),
  updateBooking: (postId: string, bookingId: string, status: "CONFIRMED" | "REJECTED") =>
    request<BoardBooking>(`/board/${postId}/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  cancelBooking: (postId: string, bookingId: string) =>
    request<{ success: boolean }>(`/board/${postId}/bookings/${bookingId}`, { method: "DELETE" }),

  // Chat
  getMessages: (postId: string) =>
    request<BoardMessage[]>(`/board/${postId}/messages`),
  sendMessage: (postId: string, message: string) =>
    request<BoardMessage>(`/board/${postId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};


/** Preset pickup/drop points matching the seeded demo drivers — stands in for
 * Google Places Autocomplete until a Maps API key is wired in. */
export const PLACE_PRESETS: Place[] = [
  // ── Himachal Pradesh — Mandi District ─────────────────
  { label: "Sarkaghat, Mandi, HP",           lat: 31.7000,  lng: 76.7333 },
  { label: "Sarkaghat Bus Stand, Mandi",     lat: 31.7015,  lng: 76.7340 },
  { label: "Kanyana, Sarkaghat, Mandi 175049", lat: 31.6850, lng: 76.7410 },
  { label: "Dharampur Tehsil, Mandi",        lat: 31.7912,  lng: 76.6710 },
  { label: "Baldwara, Mandi",                lat: 31.6321,  lng: 76.7215 },
  { label: "Mandi City Centre & Bus Stand",  lat: 31.7084,  lng: 76.9319 },
  { label: "Sundernagar Bus Stand, Mandi",   lat: 31.5312,  lng: 76.8974 },
  { label: "Jogindernagar, Mandi",           lat: 31.9866,  lng: 76.7766 },
  { label: "Ladbharol, Mandi",               lat: 31.9810,  lng: 76.6912 },
  { label: "Karsog Tehsil, Mandi",           lat: 31.3820,  lng: 77.2060 },
  { label: "Rewalsar Lake & Bus Stand",      lat: 31.6325,  lng: 76.8333 },
  { label: "Thunag (Seraj), Mandi",          lat: 31.5641,  lng: 77.1721 },
  { label: "Janjehli, Mandi",                lat: 31.4891,  lng: 77.2201 },
  { label: "Padhar Tehsil, Mandi",           lat: 31.8150,  lng: 76.8850 },
  { label: "Sandhol, Mandi",                 lat: 31.7610,  lng: 76.5820 },
  { label: "Aut, Mandi",                     lat: 31.7450,  lng: 77.2010 },

  // ── Himachal Pradesh — Hamirpur District ───────────────
  { label: "Hamirpur Bus Stand & City",      lat: 31.6855,  lng: 76.5216 },
  { label: "Bhoranj Tehsil, Hamirpur",       lat: 31.6512,  lng: 76.6340 },
  { label: "Barsar Tehsil, Hamirpur",        lat: 31.5210,  lng: 76.4510 },
  { label: "Nadaun, Hamirpur",               lat: 31.7820,  lng: 76.3480 },
  { label: "Sujanpur Tira, Hamirpur",        lat: 31.8340,  lng: 76.5020 },
  { label: "Tauni Devi, Hamirpur",           lat: 31.7310,  lng: 76.6120 },

  // ── Himachal Pradesh — Bilaspur District ──────────────
  { label: "Bilaspur Bus Stand & City",      lat: 31.3395,  lng: 76.7605 },
  { label: "Ghumarwin Tehsil, Bilaspur",     lat: 31.4390,  lng: 76.7110 },
  { label: "Jhandutta, Bilaspur",            lat: 31.3650,  lng: 76.6020 },
  { label: "Swarghat, Bilaspur",             lat: 31.2210,  lng: 76.5510 },
  { label: "Shri Naina Devi Ji, Bilaspur",   lat: 31.3050,  lng: 76.5380 },

  // ── Himachal Pradesh — Shimla District ────────────────
  { label: "Shimla Mall Road",               lat: 31.1041,  lng: 77.1670 },
  { label: "Shimla ISBT Tutikandi",          lat: 31.1048,  lng: 77.1734 },
  { label: "Shimla Railway Station",         lat: 31.0993,  lng: 77.1723 },
  { label: "Theog, Shimla",                  lat: 31.1210,  lng: 77.3520 },
  { label: "Rampur Bushehr, Shimla",         lat: 31.4456,  lng: 77.6282 },
  { label: "Rohru Tehsil, Shimla",           lat: 31.2020,  lng: 77.7510 },
  { label: "Jubbal, Shimla",                 lat: 31.1120,  lng: 77.6620 },
  { label: "Kotkhai, Shimla",                lat: 31.1210,  lng: 77.5310 },
  { label: "Chaupal, Shimla",                lat: 30.9510,  lng: 77.5810 },
  { label: "Narkanda, Shimla",               lat: 31.2713,  lng: 77.4561 },
  { label: "Kufri, Shimla",                  lat: 31.0983,  lng: 77.2644 },
  { label: "Chail, Shimla",                  lat: 30.9683,  lng: 77.1994 },

  // ── Himachal Pradesh — Kullu District ─────────────────
  { label: "Kullu Bus Stand & City",         lat: 31.9582,  lng: 77.1096 },
  { label: "Manali Mall Road & Bus Stand",   lat: 32.2432,  lng: 77.1892 },
  { label: "Old Manali",                     lat: 32.2567,  lng: 77.1737 },
  { label: "Solang Valley, Manali",          lat: 32.3167,  lng: 77.1578 },
  { label: "Bhuntar Airport, Kullu",         lat: 31.8767,  lng: 77.1525 },
  { label: "Kasol (Parvati Valley)",         lat: 32.0097,  lng: 77.3150 },
  { label: "Manikaran Sahib",                lat: 32.0276,  lng: 77.3477 },
  { label: "Jibhi (Tirthan Valley)",         lat: 31.6372,  lng: 77.4722 },
  { label: "Banjar Tehsil, Kullu",           lat: 31.6380,  lng: 77.3420 },
  { label: "Anni, Kullu",                    lat: 31.3520,  lng: 77.4210 },
  { label: "Nirmand, Kullu",                 lat: 31.4310,  lng: 77.5820 },
  { label: "Naggar Castle, Kullu",           lat: 32.1150,  lng: 77.1710 },

  // ── Himachal Pradesh — Kangra District ────────────────
  { label: "Dharamshala Bus Stand",          lat: 32.2190,  lng: 76.3234 },
  { label: "McLeod Ganj, Dharamshala",       lat: 32.2426,  lng: 76.3234 },
  { label: "Palampur Bus Stand & City",      lat: 32.1109,  lng: 76.5363 },
  { label: "Kangra Town & Fort",             lat: 32.0910,  lng: 76.2680 },
  { label: "Baijnath, Kangra",               lat: 32.0530,  lng: 76.6480 },
  { label: "Nurpur, Kangra",                 lat: 32.3010,  lng: 75.8920 },
  { label: "Dehra Gopipur, Kangra",          lat: 31.8920,  lng: 76.2210 },
  { label: "Jawali, Kangra",                 lat: 32.1420,  lng: 76.0120 },
  { label: "Jaisinghpur, Kangra",            lat: 31.8910,  lng: 76.6010 },
  { label: "Shahpur, Kangra",                lat: 32.2310,  lng: 76.1720 },
  { label: "Nagrota Bagwan, Kangra",         lat: 32.1120,  lng: 76.3810 },
  { label: "Bir Billing (Paragliding)",     lat: 32.0460,  lng: 76.7210 },

  // ── Himachal Pradesh — Solan District ─────────────────
  { label: "Solan Bus Stand & City",         lat: 30.9047,  lng: 77.0967 },
  { label: "Baddi Industrial Hub, Solan",    lat: 30.9578,  lng: 76.7912 },
  { label: "Nalagarh Tehsil, Solan",         lat: 31.0420,  lng: 76.7210 },
  { label: "Parwanoo, Solan",                lat: 30.8350,  lng: 76.9620 },
  { label: "Arki Tehsil, Solan",             lat: 31.1510,  lng: 76.9680 },
  { label: "Kasauli Hill Station",           lat: 30.8986,  lng: 76.9664 },
  { label: "Kandaghat, Solan",               lat: 30.9610,  lng: 77.1020 },

  // ── Himachal Pradesh — Sirmaur District ───────────────
  { label: "Nahan Bus Stand & City",         lat: 30.5590,  lng: 77.2950 },
  { label: "Paonta Sahib, Sirmaur",          lat: 30.4380,  lng: 77.6210 },
  { label: "Rajgarh Tehsil, Sirmaur",        lat: 30.8520,  lng: 77.3010 },
  { label: "Shillai, Sirmaur",               lat: 30.6820,  lng: 77.6910 },

  // ── Himachal Pradesh — Una District ───────────────────
  { label: "Una Bus Stand & City",           lat: 31.4684,  lng: 76.2706 },
  { label: "Amb Tehsil, Una",                lat: 31.6810,  lng: 76.1210 },
  { label: "Bangana Tehsil, Una",            lat: 31.6120,  lng: 76.3210 },
  { label: "Haroli, Una",                    lat: 31.4110,  lng: 76.2210 },
  { label: "Chintpurni Temple, Una",         lat: 31.8110,  lng: 76.1310 },

  // ── Himachal Pradesh — Chamba District ────────────────
  { label: "Chamba Bus Stand & City",        lat: 32.5534,  lng: 76.1258 },
  { label: "Dalhousie Mall Road",            lat: 32.5387,  lng: 75.9710 },
  { label: "Khajjiar Lake, Chamba",          lat: 32.5458,  lng: 76.0594 },
  { label: "Bharmour, Chamba",               lat: 32.4410,  lng: 76.5410 },
  { label: "Chowari, Chamba",                lat: 32.2610,  lng: 76.0120 },

  // ── Himachal Pradesh — Lahaul, Spiti & Kinnaur ───────
  { label: "Keylong, Lahaul",                lat: 32.5417,  lng: 77.0345 },
  { label: "Kaza, Spiti Valley",             lat: 32.2275,  lng: 78.0705 },
  { label: "Reckong Peo, Kinnaur",           lat: 31.5380,  lng: 78.2710 },
  { label: "Kalpa, Kinnaur",                 lat: 31.5450,  lng: 78.2560 },
  { label: "Sangla Valley (Chitkul)",        lat: 31.4210,  lng: 78.2610 },
  { label: "Sissu (Lahaul)",                 lat: 32.4780,  lng: 77.1210 },

  // ── Delhi NCR ─────────────────────────────────────────
  { label: "Delhi Connaught Place",          lat: 28.6139,  lng: 77.2090 },
  { label: "Delhi IGI Airport T3",           lat: 28.5562,  lng: 77.1000 },
  { label: "Delhi New Delhi Railway Stn",    lat: 28.6424,  lng: 77.2197 },
  { label: "Delhi Kashmere Gate ISBT",       lat: 28.6674,  lng: 77.2283 },
  { label: "Delhi Sarai Kale Khan ISBT",     lat: 28.6071,  lng: 77.2522 },
  { label: "Gurgaon Cyber City",             lat: 28.4595,  lng: 77.0266 },
  { label: "Noida Sector 18",                lat: 28.5708,  lng: 77.3261 },
  { label: "Ghaziabad Bus Stand",            lat: 28.6692,  lng: 77.4538 },
  { label: "Faridabad",                      lat: 28.4089,  lng: 77.3178 },

  // ── Punjab & Chandigarh ───────────────────────────────
  { label: "Chandigarh Sector 17 & ISBT",    lat: 30.7333,  lng: 76.7794 },
  { label: "Chandigarh Airport",             lat: 30.6735,  lng: 76.7885 },
  { label: "Mohali (SAS Nagar)",             lat: 30.67995, lng: 76.7221 },
  { label: "Panchkula",                      lat: 30.6942,  lng: 76.8606 },
  { label: "Amritsar Golden Temple",         lat: 31.6200,  lng: 74.8765 },
  { label: "Ludhiana Bus Stand",             lat: 30.9009,  lng: 75.8573 },
  { label: "Jalandhar Bus Stand",            lat: 31.3260,  lng: 75.5762 },
  { label: "Pathankot Bus Stand",            lat: 32.2744,  lng: 75.6520 },
  { label: "Patiala",                        lat: 30.3398,  lng: 76.3869 },
  { label: "Hoshiarpur",                     lat: 31.5246,  lng: 75.9112 },
  { label: "Ropar (Rupnagar)",               lat: 30.9664,  lng: 76.5231 },

  // ── Uttarakhand ───────────────────────────────────────
  { label: "Dehradun ISBT & City",           lat: 30.3165,  lng: 78.0322 },
  { label: "Rishikesh Bus Stand",            lat: 30.0869,  lng: 78.2676 },
  { label: "Haridwar Bus Stand & Ghat",      lat: 29.9457,  lng: 78.1642 },
  { label: "Mussoorie Mall Road",            lat: 30.4598,  lng: 78.0644 },
  { label: "Nainital Lake",                  lat: 29.3803,  lng: 79.4636 },
  { label: "Roorkee",                        lat: 29.8543,  lng: 77.8880 },
  { label: "Haldwani",                       lat: 29.2183,  lng: 79.5130 },

  // ── All-India Capitals & Major Hubs ───────────────────
  { label: "Mumbai (CSMT / Airport)",        lat: 19.0760,  lng: 72.8777 },
  { label: "Pune City Centre",               lat: 18.5204,  lng: 73.8567 },
  { label: "Jaipur Pink City",               lat: 26.9124,  lng: 75.7873 },
  { label: "Udaipur City",                   lat: 24.5854,  lng: 73.7125 },
  { label: "Lucknow Charbagh",               lat: 26.8467,  lng: 80.9462 },
  { label: "Agra Taj Mahal",                 lat: 27.1767,  lng: 78.0081 },
  { label: "Varanasi Cantt",                 lat: 25.3176,  lng: 82.9739 },
  { label: "Jammu Tawi",                     lat: 32.7266,  lng: 74.8570 },
  { label: "Srinagar Dal Lake",              lat: 34.0837,  lng: 74.7973 },
  { label: "Katra (Vaishno Devi)",          lat: 32.9904,  lng: 74.9318 },
  { label: "Bengaluru City",                 lat: 12.9716,  lng: 77.5946 },
  { label: "Hyderabad Deccan",               lat: 17.3850,  lng: 78.4867 },
  { label: "Kolkata Howrah",                 lat: 22.5726,  lng: 88.3639 },
  { label: "Ahmedabad City",                 lat: 23.0225,  lng: 72.5714 },
];

/**
 * Robust geocoding resolver for Himachal Pradesh and all Indian locations.
 * Accurately finds coordinates for cities, districts, tehsils, and custom search inputs.
 */
export function resolvePlaceCoordinates(label: string | null | undefined): Place {
  if (!label || !label.trim()) {
    return { label: "Mandi City Centre & Bus Stand", lat: 31.7084, lng: 76.9319 };
  }
  const q = label.trim().toLowerCase();

  // 1. Exact preset match
  const exact = PLACE_PRESETS.find((p) => p.label.toLowerCase() === q);
  if (exact) return exact;

  // 2. Substring preset match
  const presetSub = PLACE_PRESETS.find(
    (p) => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase())
  );
  if (presetSub) return { label, lat: presetSub.lat, lng: presetSub.lng };

  // 3. Keyword / District & Town Center Mapping
  const KEYWORD_MAP: { keywords: string[]; lat: number; lng: number }[] = [
    { keywords: ["sarkaghat", "kanyana", "baldara", "sandhol", "dharampur"], lat: 31.7000, lng: 76.7333 },
    { keywords: ["mandi", "rewalsar", "tihara", "balh", "kamand"], lat: 31.7084, lng: 76.9319 },
    { keywords: ["sundernagar", "sunder nagar", "baggi"], lat: 31.5312, lng: 76.8974 },
    { keywords: ["jogindernagar", "joginder nagar", "ladbharol"], lat: 31.9866, lng: 76.7766 },
    { keywords: ["kullu", "bhuntar", "kasol", "manikaran", "jibhi", "banjar", "tirthan"], lat: 31.9582, lng: 77.1096 },
    { keywords: ["manali", "solang", "vashisht", "rohtang", "gulaba", "naggar"], lat: 32.2432, lng: 77.1892 },
    { keywords: ["dharamshala", "dharamsala", "mcleod", "mcleodganj", "bhagsunag", "forsythganj"], lat: 32.2190, lng: 76.3234 },
    { keywords: ["kangra", "baijnath", "palampur", "bir", "billing", "nurpur", "jawali", "dehra"], lat: 32.0910, lng: 76.2680 },
    { keywords: ["shimla", "kufri", "fagu", "theog", "narkanda", "chail", "mashobra", "sanjauli", "tutikandi"], lat: 31.1048, lng: 77.1734 },
    { keywords: ["solan", "kasauli", "baddi", "nalagarh", "parwanoo", "arki", "kandaghat"], lat: 30.9047, lng: 77.0967 },
    { keywords: ["bilaspur", "ghumarwin", "naina devi", "swarghat", "namhol"], lat: 31.3395, lng: 76.7605 },
    { keywords: ["hamirpur", "nadaun", "sujanpur", "barsar", "bhoranj", "lambloo"], lat: 31.6855, lng: 76.5216 },
    { keywords: ["una", "amb", "gagret", "tahliwal", "chintpurni", "bangana"], lat: 31.4685, lng: 76.2708 },
    { keywords: ["chamba", "dalhousie", "khajjiar", "bharmour", "churah", "tissa"], lat: 32.5534, lng: 76.1258 },
    { keywords: ["kinnaur", "reckong", "kalpa", "sangla", "chitkul", "pooh"], lat: 31.5404, lng: 78.2709 },
    { keywords: ["lahaul", "spiti", "kaza", "keylong", "sissu", "jispa", "tabo"], lat: 32.5710, lng: 77.0320 },
    { keywords: ["sirmaur", "sirmour", "nahan", "paonta", "rajgarh", "renuka", "shillai"], lat: 30.5599, lng: 77.2955 },
    { keywords: ["chandigarh", "mohali", "panchkula", "zirakpur", "kharar"], lat: 30.7333, lng: 76.7794 },
    { keywords: ["delhi", "new delhi", "ncr", "gurgaon", "noida", "igi airport"], lat: 28.6139, lng: 77.2090 },
  ];

  for (const item of KEYWORD_MAP) {
    if (item.keywords.some((k) => q.includes(k))) {
      return { label, lat: item.lat, lng: item.lng };
    }
  }

  // 4. Fallback to Mandi Center
  return { label, lat: 31.7084, lng: 76.9319 };
}
