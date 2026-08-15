import { nanoid } from "nanoid";
import { db } from "./lib/db";

const demoDrivers = [
  { phone: "9800000001", name: "Rakesh Thakur", city: "Shimla", vehicleType: "SEDAN", vehicleNumber: "HP03-AB-1234", lat: 31.1048, lng: 77.1734, ratePerKm: 16 },
  { phone: "9800000002", name: "Sunil Chauhan", city: "Manali", vehicleType: "SUV", vehicleNumber: "HP65-CD-4567", lat: 32.2432, lng: 77.1892, ratePerKm: 22 },
  { phone: "9800000003", name: "Vikram Negi", city: "Mandi", vehicleType: "HATCHBACK", vehicleNumber: "HP33-EF-7890", lat: 31.7084, lng: 76.9319, ratePerKm: 12 },
  { phone: "9800000004", name: "Amit Verma", city: "Delhi", vehicleType: "LUXURY", vehicleNumber: "DL01-GH-2345", lat: 28.6139, lng: 77.2090, ratePerKm: 35 },
  { phone: "9800000005", name: "Sanjay Kumar", city: "Shimla", vehicleType: "SUV", vehicleNumber: "HP03-IJ-6789", lat: 31.1100, lng: 77.1600, ratePerKm: 21 },
];

for (const d of demoDrivers) {
  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(d.phone) as any;
  if (!user) {
    const userId = nanoid();
    db.prepare("INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, 'DRIVER')").run(
      userId,
      d.phone,
      d.name
    );
    user = { id: userId };
  }
  const existing = db.prepare("SELECT * FROM driver_profiles WHERE user_id = ?").get(user.id);
  if (!existing) {
    db.prepare(
      `INSERT INTO driver_profiles
        (id, user_id, city, vehicle_type, vehicle_number, is_verified, is_online, rating_avg, rate_per_km, current_lat, current_lng)
       VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`
    ).run(
      nanoid(),
      user.id,
      d.city,
      d.vehicleType,
      d.vehicleNumber,
      4.5 + Math.random() * 0.5,
      d.ratePerKm,
      d.lat,
      d.lng
    );
    console.log(`Seeded driver ${d.name} (${d.city}, ${d.vehicleType})`);
  }
}

console.log("Seed complete.");
