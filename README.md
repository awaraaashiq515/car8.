# Cab8 — customer booking flow scaffold

A working backend + customer web app covering one real slice of the full
Cab8 vision: search a route → see matched verified drivers with live
fare/ETA → book → track status. Everything else in the original spec
(operator/union/hotel/corporate portals, driver app, AI features, payments,
etc.) is intentionally out of scope for this first pass — build it out
portal by portal from here.

## What's included

**`/backend`** — Node + TypeScript + Express
- OTP auth issuing JWTs (`/auth/otp/request`, `/auth/otp/verify`)
- Ride search: haversine distance, fare estimate by vehicle type/ride type,
  nearest verified online drivers (`POST /rides/search`)
- Booking + lifecycle (`POST /rides`, `GET /rides/:id`, `PATCH /rides/:id/status`,
  `GET /rides`)
- SQLite via `better-sqlite3` for zero-setup local running
- Seed script with demo drivers around Shimla, Manali, Mandi, and Delhi

**`/web`** — Next.js 14 (App Router) + TypeScript + Tailwind
- `/` — route + vehicle + ride-type search
- `/results` — matched drivers with fare/ETA, OTP login inline before booking
- `/booking/[id]` — trip status tracker (polls every 5s)

## Why some choices differ from the original spec

- **Database:** SQLite instead of Postgres for this scaffold, because
  Prisma's engine binaries aren't reachable from this sandbox's network.
  The SQL in `backend/src/lib/schema.sql` is written to be Postgres-portable;
  swap the driver (`pg` + a query layer, or re-introduce Prisma) once you're
  running this somewhere with normal internet access.
- **Fonts:** the design calls for Archivo / Manrope / JetBrains Mono, but
  `next/font/google` couldn't fetch from `fonts.googleapis.com` in this
  sandbox either. `layout.tsx` has the exact code to restore them — it's
  commented out with instructions right there.
- **OTP delivery:** the verify code is returned directly in the API response
  (`devOnlyCode`) instead of being texted. Swap in Twilio Verify, MSG91, or
  similar before this touches real phone numbers.

## Running it locally

```bash
# Backend
cd backend
npm install
npm run seed   # populates demo drivers
npm run dev    # http://localhost:4000

# Web (separate terminal)
cd web
npm install
npm run dev    # http://localhost:3000
```

Try a search from Shimla Bus Stand → Manali Mall Road with an SUV — it'll
match the seeded drivers and show live fare/ETA.

## Before this goes anywhere near production

- Swap SQLite → Postgres, real OTP delivery, and restore the Google Fonts
  (all noted inline above)
- `next@14.2.35` carries several known advisories from `npm audit` — mostly
  edge-case Server Actions/App Router issues, low risk for local dev, but
  upgrade to a current Next 15/16 patch before shipping
- Add rate limiting, input sanitization beyond the current Zod checks, and
  proper RBAC once driver/operator/union roles come online
- Everything under "DELIVERABLES" in the original brief beyond this — SRS,
  ER diagrams, the other 8 portals, CI/CD, K8s, etc. — is still ahead of you
