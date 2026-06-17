---
name: stayease-fullstack-build
overview: Generate the full StayEase monorepo from scratch (FastAPI + Mongo/Motor + React/Vite) including Docker Compose (with local Mongo), full feature set per spec, robust error-handling pages, test suites, and GitHub Actions CI.
todos:
  - id: scaffold-repo
    content: Create full repo structure, root docs, gitignore, env examples
    status: completed
  - id: backend-core
    content: Implement FastAPI app (config, DB, auth, models, exception handling)
    status: completed
  - id: backend-features
    content: Implement rooms/filters, bookings+pricing+GST, offers, reviews, referrals, waitlist, attractions/weather, notifications
    status: completed
  - id: backend-integrations
    content: Implement Cloudinary uploads, FastAPI-Mail templates/sender, Twilio WhatsApp, APScheduler reminders, PDF invoices
    status: completed
  - id: backend-tests-seed
    content: Implement seed script and full pytest suite per spec
    status: completed
  - id: frontend-core
    content: Set up Vite React app, routing, Auth/Theme contexts, Axios API client
    status: completed
  - id: frontend-ui-pages
    content: Implement all components and guest/host/shared pages with CSS variables + Lucide icons
    status: completed
  - id: frontend-error-handling
    content: Add error boundaries and dedicated 401/403/404/network error pages; ensure no console-only errors
    status: completed
  - id: frontend-tests
    content: Add Vitest+RTL config and implement specified component/page tests
    status: completed
  - id: docker-ci
    content: Add Dockerfiles + docker-compose and GitHub Actions workflows; verify build/test commands
    status: completed
isProject: false
---

# StayEase full-stack build plan

## Goal
Generate the complete StayEase monorepo (backend + frontend + CI + Docker) exactly matching the provided specification, with **no existing code conflicts** (workspace currently only has `prompt.md`).

## Key decisions (confirmed)
- **Docker dev DB**: `docker-compose` runs a **local MongoDB container**; switching to MongoDB Atlas is done via `backend/.env` (`MONGO_URI`).
- **Payments**: `/api/bookings/{id}/pay` is a **mock payment** endpoint that marks booking paid, generates invoice PDF, stores it, and sends email/WhatsApp.

## Repository skeleton to generate
Create the full folder structure exactly as in spec:
- Backend under `[backend/](backend/)` with `main.py`, `config.py`, `database.py`, `models/`, `routes/`, `services/`, `templates/emails/`, `tests/`, `seed.py`, `.env.example`, `requirements.txt`.
- Frontend under `[frontend/](frontend/)` with Vite React app, `src/` structure, contexts, components, pages, tests, `.env.example`, configs.
- CI workflows under `[.github/workflows/](.github/workflows/)`.
- Root `[README.md](README.md)` and `[.gitignore](.gitignore)` (including all `.env` ignores from spec).

## Backend implementation plan (FastAPI + Motor)
- **Config & env**
  - Implement `[backend/config.py](backend/config.py)` using `python-dotenv` + Pydantic v2 settings.
  - Enforce **no hardcoded secrets/URLs**; everything reads from env.
- **MongoDB access layer**
  - Implement `[backend/database.py](backend/database.py)` to initialize Motor client, expose typed collection getters, and provide startup/shutdown lifecycle.
- **Models (Pydantic v2)**
  - Implement models in `[backend/models/](backend/models/)` matching the collections in the spec, including ObjectId handling and validation rules (email/phone/password/identity formats).
- **Auth**
  - Implement JWT auth (python-jose) + bcrypt hashing (passlib) in `[backend/services/auth.py](backend/services/auth.py)`.
  - Role dependencies (`guest|host|admin`) enforced across routes.
  - Endpoints in `[backend/routes/auth.py](backend/routes/auth.py)` per spec.
- **Rooms + filters + uploads**
  - Implement room CRUD + **full filter query params** for `GET /api/rooms` in `[backend/routes/rooms.py](backend/routes/rooms.py)`.
  - Implement Cloudinary integration in `[backend/services/cloudinary.py](backend/services/cloudinary.py)` and upload routes in `[backend/routes/uploads.py](backend/routes/uploads.py)` (photos/videos limits, primary photo).
- **Bookings + pricing + GST + waitlist**
  - Implement dynamic pricing engine in `[backend/services/pricing.py](backend/services/pricing.py)`.
  - Implement GST slab logic in `[backend/services/gst.py](backend/services/gst.py)` (0/12/18% slabs per nightly tariff).
  - Implement booking creation/cancel/double-booking prevention/waitlist auto-promote in `[backend/routes/bookings.py](backend/routes/bookings.py)` + `[backend/services/waitlist.py](backend/services/waitlist.py)`.
  - Implement `/api/pricing/calculate` in `[backend/routes/pricing.py](backend/routes/pricing.py)`.
- **Reviews, offers, referrals, analytics**
  - Implement review constraints (“only after completed booking”) in `[backend/routes/reviews.py](backend/routes/reviews.py)`.
  - Implement offers CRUD + validate endpoint in `[backend/routes/offers.py](backend/routes/offers.py)`.
  - Implement referral code generation + credits application in auth/register + booking pricing.
  - Implement host/guest dashboards + revenue/occupancy endpoints in `[backend/routes/analytics.py](backend/routes/analytics.py)`.
- **Attractions + weather**
  - Implement city-based attractions in `[backend/routes/attractions.py](backend/routes/attractions.py)`.
  - Implement Open-Meteo proxy endpoint in `[backend/routes/attractions.py](backend/routes/attractions.py)` or `[backend/routes/rooms.py](backend/routes/rooms.py)` as `/api/weather/{lat}/{lon}` (per spec).
- **Email + WhatsApp + scheduler**
  - Implement FastAPI-Mail templates in `[backend/templates/emails/](backend/templates/emails/)` and sending in `[backend/services/email.py](backend/services/email.py)`.
  - Implement Twilio WhatsApp text-only messages in `[backend/services/whatsapp.py](backend/services/whatsapp.py)`.
  - Implement APScheduler hourly reminder job in `[backend/services/scheduler.py](backend/services/scheduler.py)`.
- **Invoices (PDF)**
  - Implement PDF generation via reportlab (or WeasyPrint if easier to containerize) in `[backend/services/invoice.py](backend/services/invoice.py)`.
  - Store PDF in Cloudinary and record in `invoices` collection; email invoice on mocked payment.
- **Error handling**
  - Standardize API error envelope and FastAPI exception handlers in `[backend/main.py](backend/main.py)`:
    - 422 validation with field-level details.
    - 401/403 auth errors.
    - 404 not found.
    - 409 conflicts (double booking / triggers waitlist flow).
    - 500 generic with request id.
- **Seed + tests**
  - Implement idempotent `[backend/seed.py](backend/seed.py)` per spec.
  - Implement pytest suite under `[backend/tests/](backend/tests/)` (using `mongomock` or a separate test DB; prefer `mongomock_motor` if compatible).

## Frontend implementation plan (React/Vite)
- **App shell**
  - Configure React Router v6 routes exactly as specified in `[frontend/src/App.jsx](frontend/src/App.jsx)`.
  - Implement `AuthContext` + token storage, and `ThemeContext` implementing `stayease-theme` + `html.dark` class.
- **Design system & CSS variables**
  - Implement CSS variables (light/dark) in `[frontend/src/index.css](frontend/src/index.css)` and ensure every component uses vars only.
  - Load Inter font in `[frontend/index.html](frontend/index.html)`.
- **API layer & error normalization**
  - Implement Axios client in `[frontend/src/api/api.js](frontend/src/api/api.js)` with interceptors for auth + consistent error shape.
- **Reusable UI components**
  - Implement all specified components under `[frontend/src/components/](frontend/src/components/)`, using **Lucide React only** for icons.
  - Build `FilterBar.jsx` with URL query-param sync and mobile horizontal scrolling.
  - Build `RoomBadges.jsx` + `AmenityIcon.jsx` mapping exactly to spec.
  - Build `Spinner.jsx` + `ErrorMessage.jsx` used by every API call.
- **Pages (Guest + Host)**
  - Implement guest pages under `[frontend/src/pages/guest/](frontend/src/pages/guest/)` including booking flow with live pricing + waitlist modal on 409.
  - Implement host pages under `[frontend/src/pages/host/](frontend/src/pages/host/)` including analytics charts (Recharts) and manage rooms/offers.
  - Implement shared legal pages with ToC + sticky sidebar.
- **Frontend error pages**
  - Implement route-level error boundary + explicit pages:
    - 404 Not Found
    - 401/403 Unauthorized (role mismatch)
    - Network/500 fallback
  - Ensure UI displays errors (no console-only errors).
- **Frontend tests**
  - Add Vitest + RTL config (`[frontend/vitest.config.js](frontend/vitest.config.js)`, `[frontend/src/tests/setup.js](frontend/src/tests/setup.js)`) and implement the test files listed in the spec.

## Dockerization plan
- Add root `docker-compose.yml` with services:
  - `mongo` (dev only)
  - `backend` (FastAPI uvicorn)
  - `frontend` (Vite dev server)
- Add `backend/Dockerfile` and `frontend/Dockerfile` (dev-friendly) and ensure **all runtime config via env**.
- Add `.dockerignore` files for backend and frontend.

## CI plan (GitHub Actions)
- Generate `[.github/workflows/ci.yml](.github/workflows/ci.yml)` and `[.github/workflows/deploy.yml](.github/workflows/deploy.yml)` matching the spec.
- Ensure CI runs backend tests + frontend tests + lint.

## Documentation
- Generate `[README.md](README.md)` with all required sections from the spec (including full `.env.example` references and API/filter references).

## Verification checklist (done before finishing)
- `docker-compose up` brings up Mongo + backend + frontend locally.
- `pytest backend/tests/ -v` passes.
- `frontend` tests (`npm run test`) pass.
- Frontend/Backend show user-facing error states for auth/network/validation/conflict.
- FilterBar query params fully affect `GET /api/rooms` results.
- Theme toggle persists and applies `html.dark`.
- No emojis anywhere; icons are Lucide only.
- `.env` files are ignored; `.env.example` files committed with empty values.
