# StayEase — Hotel Booking System

## Overview

StayEase is a full-stack hotel booking platform built for the Indian market, with separate **Guest** and **Host** portals. Guests can search rooms with rich filters, book stays with GST-inclusive pricing, manage trips, write reviews, and save favourites. Hosts can list rooms, manage bookings, run promotional offers, and track occupancy and revenue through an analytics dashboard.

The backend is a FastAPI REST API backed by MongoDB Atlas (Motor async driver). The frontend is a React + Vite single-page application with JWT authentication, responsive UI, and real-time price previews.

## Features

### Guest Portal

- Browse and search rooms with filters (category, price, dates, guests, food preference, smoking/alcohol policy, view type, balcony)
- Smart Room Recommender with match % scoring based on preferences
- Live GST-inclusive price preview with dynamic pricing (weekends, peak season, early-bird, offers)
- Secure booking flow with guest identity verification (Aadhar / PAN / Passport)
- Trip history with status filters, search, cancellation, and post-checkout reviews
- Wishlist to save favourite rooms
- Waitlist join when a room is unavailable — auto-notified on cancellation
- Nearby attractions by city with category tabs and live Open-Meteo weather widget
- Printable GST invoice and receipt (ReportLab PDF)
- Referral credits applied at checkout
- In-app notifications and email / WhatsApp booking alerts
- Host messaging and listing inquiries

### Host Portal

- Dashboard with room counts, booking stats, revenue, and occupancy metrics
- Create and manage room listings (photos, videos, amenities, policies, blocked dates)
- Manage incoming bookings with status tabs and cancellation handling
- Promotional offers and coupon codes (percentage / flat discounts)
- Occupancy and revenue analytics with monthly charts
- Guest inquiry inbox with reply thread
- Host public profile page with reviews
- Listing reports and moderation support

### Unique Features

- Smart Room Recommender with match % scoring
- Dynamic Pricing Engine (weekend/peak/early-bird)
- Guest Reviews & Ratings (unlocked post-checkout)
- Nearby Attractions + Live Weather
- Waitlist System with auto-promote on cancellation
- Occupancy Analytics Dashboard
- Printable GST Invoice & Receipt

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (Motor async) |
| Frontend | React.js (Vite) |
| Auth | JWT (python-jose + passlib) |
| Email | FastAPI-Mail |
| WhatsApp | Twilio API |
| File Upload | Cloudinary |
| PDF | ReportLab |
| CI/CD | GitHub Actions |
| Testing | Pytest + Vitest |

## Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Git

## MongoDB Atlas Setup

Step-by-step instructions:

1. Create an account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. Add a database user with **read/write** access
4. Add **0.0.0.0/0** to the IP whitelist (Network Access → Add IP Address)
5. Get your connection string from **Connect → Drivers** (choose Python / Motor)
6. Replace `<password>` and `<dbname>` in the URI with your credentials

Example URI format:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in MONGO_URI, MONGO_DB_NAME=stayease, JWT_SECRET
python seed.py
uvicorn main:app --reload
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
# App runs at http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Guest | guest@stayease.com | Demo@123 |
| Host | host@stayease.com | demo123 |

Run `python seed.py` in the backend folder to create these accounts along with 5 sample rooms, 2 bookings, and 2 offers.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register a new guest or host account |
| POST | `/api/auth/login` | Login and receive JWT access token |
| GET | `/api/auth/me` | Get current authenticated user profile |
| PATCH | `/api/auth/profile` | Update profile (name, phone, avatar, preferences) |
| POST | `/api/auth/verify-identity` | Upload identity document for verification |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend email verification OTP |
| GET | `/api/rooms` | List/search rooms with filters |
| POST | `/api/rooms` | Create a new room listing (host) |
| POST | `/api/rooms/recommend` | Smart room recommender with match scores |
| GET | `/api/rooms/host/{host_id}` | List all rooms for a host |
| GET | `/api/rooms/{id}` | Get room details by ID |
| GET | `/api/rooms/{id}/alternatives` | Similar available rooms for given dates |
| GET | `/api/rooms/{id}/rating` | Aggregated rating summary for a room |
| PATCH | `/api/rooms/{id}` | Update room listing (host) |
| DELETE | `/api/rooms/{id}` | Delete room listing (host) |
| POST | `/api/rooms/{id}/photos` | Upload room photo to Cloudinary |
| DELETE | `/api/rooms/{id}/photos/{pid}` | Delete a room photo |
| PATCH | `/api/rooms/{id}/photos/{pid}/primary` | Set primary photo |
| PATCH | `/api/rooms/{id}/photos/reorder` | Reorder room photos |
| POST | `/api/rooms/{id}/videos` | Upload room video |
| DELETE | `/api/rooms/{id}/videos/{vid}` | Delete room video |
| POST | `/api/rooms/{id}/inquiries` | Send inquiry message to host |
| POST | `/api/rooms/{id}/reports` | Report a listing |
| POST | `/api/bookings` | Create a new booking |
| GET | `/api/bookings` | List bookings (filter by guest_id, host_id, status) |
| GET | `/api/bookings/room/{id}` | List bookings for a room (host) |
| GET | `/api/bookings/{id}` | Get booking details |
| DELETE | `/api/bookings/{id}` | Cancel a booking |
| GET | `/api/bookings/{id}/cancellation-preview` | Preview cancellation refund breakdown |
| POST | `/api/bookings/{id}/pay` | Mark booking as paid and generate invoice PDF |
| GET | `/api/bookings/{id}/receipt` | Get booking receipt data |
| GET | `/api/bookings/{id}/invoice` | Get invoice details and PDF URL |
| POST | `/api/bookings/verification-upload` | Upload guest verification document |
| POST | `/api/pricing/calculate` | Calculate dynamic price with GST breakdown |
| POST | `/api/reviews` | Submit a post-checkout review |
| GET | `/api/reviews/room/{id}` | List reviews for a room |
| GET | `/api/reviews/property/{room_id}` | Property-level review stats and list |
| GET | `/api/reviews/booking/{booking_id}` | Review eligibility for a booking |
| GET | `/api/reviews/eligible/room/{room_id}` | Check if current user can review a room |
| PATCH | `/api/reviews/{id}/host-response` | Host reply to a review |
| POST | `/api/offers` | Create promotional offer (host) |
| GET | `/api/offers` | List offers |
| GET | `/api/offers/{code}` | Get offer by code |
| PATCH | `/api/offers/{id}` | Update offer |
| DELETE | `/api/offers/{id}` | Delete offer |
| POST | `/api/offers/validate` | Validate offer code against a room/dates |
| GET | `/api/dashboard` | Role-aware dashboard stats (host or guest) |
| GET | `/api/guest/dashboard` | Guest dashboard stats |
| GET | `/api/host/dashboard` | Host dashboard stats |
| GET | `/api/analytics/occupancy` | Monthly occupancy analytics (host) |
| GET | `/api/analytics/revenue` | Monthly revenue analytics (host) |
| POST | `/api/waitlist` | Join waitlist for unavailable dates |
| GET | `/api/waitlist/{phone}` | Get waitlist entries by phone number |
| DELETE | `/api/waitlist/{id}` | Remove waitlist entry |
| POST | `/api/wishlist/{room_id}` | Toggle room on user wishlist |
| GET | `/api/wishlist` | Get full room objects in wishlist |
| GET | `/api/notifications` | List last 20 notifications for current user |
| PATCH | `/api/notifications/{id}/read` | Mark notification as read |
| POST | `/api/notifications/test-email` | Send test email (dev/admin) |
| GET | `/api/attractions/{city}` | Nearby attractions for a city |
| GET | `/api/weather/{lat}/{lon}` | Live weather proxy (Open-Meteo) |
| GET | `/api/hosts/{host_id}/profile` | Public host profile with reviews |
| GET | `/api/inquiries` | List guest/host inquiry threads |
| POST | `/api/inquiries/{inquiry_id}/replies` | Reply to an inquiry |
| GET | `/api/invoices/{booking_id}` | Get invoice by booking ID |
| GET | `/api/referrals/my-code` | Get current user's referral code |
| GET | `/api/referrals/stats` | Referral usage statistics |

## Running Tests

```bash
# Backend
cd backend && pytest tests/ -v --cov

# Frontend
cd frontend && npm run test
```

## Assumptions Made

- Payment gateway is mocked (mark as paid button)
- WhatsApp requires Twilio sandbox setup
- Cloudinary free tier used for photo/video storage
- GST calculated per India hotel tariff slabs:
  Below ₹1000/night → 0%, ₹1000–₹7500 → 12%, Above ₹7500 → 18%
- Identity verification is manual (admin reviews uploaded docs)
- Referral credits applied as discount at checkout

## AI Tools Used

I built this project using Claude (Anthropic) as my primary AI development partner and Cursor IDE with AI assistance for real-time code suggestions. Claude helped me design the full system architecture, generate FastAPI route handlers with proper async Motor MongoDB integration, build the React component tree, implement the GST calculation service following India's hotel tariff slabs, and design the double-booking prevention logic using date overlap queries. Cursor's inline AI suggestions accelerated writing repetitive boilerplate like Pydantic models and API layer functions.

The most challenging part was converting synchronous route handlers to fully async Motor MongoDB calls while preserving FastAPI's dependency injection for JWT authentication. Claude helped me debug the lifespan context manager pattern for database connection management. Another challenge was implementing the dynamic pricing engine with correctly stacking multipliers — Claude walked me through the order of operations to ensure weekend surcharges, peak season adjustments, and offer code discounts applied in the right sequence.
