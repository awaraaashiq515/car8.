// ─── All shared TypeScript types for the Super Admin portal ──────────────────

export interface Stats {
  totalUsers: number; totalDrivers: number; onlineDrivers: number;
  verifiedDrivers: number; totalRides: number; completedRides: number;
  cancelledRides: number; activeRides: number; totalBoardPosts: number;
  activeBoardPosts: number; boardBookings: number; unionApps: number;
  pendingUnion: number; totalRevenue: number;
}

export interface User {
  id: string; phone: string; name: string | null;
  role: string; created_at: string;
}

export interface Driver {
  id: string; user_id: string; name: string; phone: string;
  city: string; vehicle_type: string; vehicle_number: string;
  is_verified: number; is_online: number; rating_avg: number;
  rate_per_km: number; created_at: string;
}

export interface Ride {
  id: string; customer_name: string; customer_phone: string;
  driver_name: string | null; driver_phone: string | null;
  vehicle_number: string | null; ride_type: string; vehicle_type: string;
  pickup_text: string; drop_text: string; distance_km: number;
  estimated_fare: number; final_fare: number | null;
  status: string; created_at: string;
}

export interface BoardPost {
  id: string; poster_name: string; poster_phone: string;
  from_text: string; to_text: string; travel_date: string;
  seats: number; price_per_seat: number | null; status: string;
  booking_count: number; created_at: string;
}

export interface UnionApp {
  id: string; name: string; phone: string; email: string | null;
  city: string; vehicle: string; plate: string; make: string | null;
  model: string | null; year: string | null; status: string;
  applied: string; source: string; experience: string | null;
}

export type AppSettings = Record<string, string>;
