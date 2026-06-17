# StayEase — Full-Stack Hotel Booking Platform

StayEase is a full-stack hotel booking platform inspired by Airbnb, with separate **tourist** and **host** portals. Tourists search, filter, and book rooms; hosts manage listings, bookings, offers, and analytics.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | FastAPI, MongoDB (Motor), JWT auth, APScheduler |
| **Frontend** | React 18, Vite, React Router |
| **Integrations** | Cloudinary (media), Gmail SMTP (email), Twilio (WhatsApp), ReportLab (invoices) |

## Features

- JWT authentication with tourist / host / admin roles
- Rich room search with filters (category, price, location, food preference, view type, amenities, and more)
- Dynamic pricing, GST billing, and PDF invoices
- Offers, referrals, waitlist, and cancellation policies
- Email and WhatsApp booking notifications
- Dark / light theme, mobile-friendly UI
- Host dashboard with analytics, payouts, and offer management

For the full architecture, API reference, and design spec, see [`prompt.md`](prompt.md).

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **MongoDB** (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register))

### 1. Clone and configure

```bash
git clone <repo-url>
cd StayEase
```

Copy the backend environment file and fill in your values (at minimum `MONGO_URI` and `JWT_SECRET`):

```bash
cp backend/.env.example backend/.env
```

See [`backend/.env.example`](backend/.env.example) for all supported variables. Email, Twilio, and Cloudinary are optional for core browsing and booking flows.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### 4. Seed sample data

With MongoDB running and `backend/.env` configured:

```bash
cd backend
python seed.py
```

This is **idempotent** — safe to re-run; it creates or updates hosts, rooms, offers, and sample bookings.

---

## Demo Accounts

All seeded accounts use the passwords below.

| Role | Email | Password |
|------|-------|----------|
| Tourist | `tourist@stayease.com` | `Guest@1234` |
| Host | `host@stayease.com` | `Host@1234` |
| Host | `rahul@stayease.com` | `Host@1234` |
| Host | `ananya@stayease.com` | `Host@1234` |
| Host | `vikram@stayease.com` | `Host@1234` |
| Host | `lakshmi@stayease.com` | `Host@1234` |

### Sample rooms (21 total)

| Host | Property | Location | Rooms |
|------|----------|----------|-------|
| host@stayease.com | StayEase Grand | Bangalore | 5 (Single, Double, Suite, Economy, Triple) |
| rahul@stayease.com | StayEase Beach Resort | North Goa | 4 (Pool Villa, Sea View, Cliffside Suite, Standard) |
| ananya@stayease.com | StayEase Hill Resort | Nandi Hills | 4 (Hill View, Triple, Villa Suite, Dormitory) |
| vikram@stayease.com | StayEase Urban Hotel | Mumbai | 4 (Sea View, Heritage Suite, Single, Premium Double) |
| lakshmi@stayease.com | StayEase Plantation Hotel | Coorg | 4 (Homestay, Cottage Suite, Estate, Valley Double) |

Room photos use curated Unsplash images matched to each property theme (city hotel, beach, hills, urban, plantation).

Seeded offers: `WELCOME10` (platform-wide), `SUMMER20` (primary host).

---

## Docker

Run the full stack (MongoDB + backend + frontend):

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| MongoDB | localhost:27017 |

After containers are up, seed the database from your host machine (with `MONGO_URI` pointing at the running instance):

```bash
cd backend && python seed.py
```

---

## Testing

**Backend** (from `backend/`):

```bash
pytest tests/ -v
pytest tests/ -v --cov=. --cov-report=term-missing
```

**Frontend** (from `frontend/`):

```bash
npm run test -- --run
npm run build
```

CI runs backend tests, frontend tests, lint (Black, Flake8, ESLint), and build on pushes to `main` and `dev`.

---

## Project Structure

```
StayEase/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── seed.py              # Demo hosts, rooms, offers, bookings
│   ├── routes/              # API route handlers
│   ├── models/              # Pydantic / MongoDB models
│   ├── services/            # Auth, email, GST, Cloudinary, etc.
│   ├── templates/emails/    # HTML email templates
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/guest/     # Home, search, booking, profile
│   │   ├── pages/host/      # Dashboard, rooms, analytics
│   │   ├── components/      # Shared UI
│   │   └── api/             # Axios API client
│   └── public/
├── docker-compose.yml
└── prompt.md                # Full product & API specification
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `MONGO_DB_NAME` | Yes | Database name (default: `stayease`) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `ALLOWED_ORIGINS` | Yes | CORS origins (e.g. `http://localhost:5173`) |
| `FRONTEND_URL` | Yes | Used in email links |
| `MAIL_*` | No | Gmail SMTP for transactional email |
| `TWILIO_*` | No | WhatsApp notifications |
| `CLOUDINARY_*` | No | Image/video uploads (seed uses external URLs) |
| `GST_RATE` / `GST_NUMBER` | No | GST billing (default rate: 0.18) |

Frontend (`frontend/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:8000`) |
| `VITE_APP_NAME` | App display name |

---

## License

This project was built as a placement / portfolio full-stack application. See [`prompt.md`](prompt.md) for implementation details and assumptions.
