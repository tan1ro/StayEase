# StayEase — Full-Stack Hotel Booking Platform
## Complete Codex Build Specification

---

Build a complete full-stack Hotel Booking Platform called **"StayEase"**
modelled after Airbnb with TWO portals:

**PORTAL 1 — GUEST PORTAL** (traveller side)
**PORTAL 2 — HOST PORTAL** (hotel/room manager side)

### Stack
- **Backend:** FastAPI (Python)
- **Database:** MongoDB Atlas (Motor async driver)
- **Frontend:** React.js (Vite)
- **Validation:** Pydantic v2, python-dotenv
- **HTTP:** Axios, React Router v6
- **Charts:** Recharts for analytics
- **Testing:** React Testing Library + Vitest (frontend), Pytest (backend)
- **CI/CD:** GitHub Actions
- **Email:** FastAPI-Mail (Nodemailer-equivalent)
- **WhatsApp:** Twilio WhatsApp API
- **File uploads:** Cloudinary (images/videos)
- **PDF:** WeasyPrint or reportlab for invoices
- **Icons:** Lucide React (for ALL icons — zero emojis anywhere in the UI)
- **NO hardcoded values** — everything from `.env`

---

## DESIGN SYSTEM

### Theme
Light + Dark mode toggle, persisted in `localStorage`.
Toggle button in navbar (sun/moon **icon from Lucide React**).

### LIGHT MODE CSS variables
```css
--primary:         #1A6BFF;
--primary-dark:    #0F4FCC;
--primary-light:   #E8F0FF;
--bg:              #F7F9FC;
--card-bg:         #FFFFFF;
--text-primary:    #0D1B3E;
--text-secondary:  #717171;
--text-muted:      #B0B8C1;
--success:         #00A699;
--danger:          #FF385C;
--warning:         #F59E0B;
--border:          #EBEBEB;
--shadow-sm:       0 1px 4px rgba(0,0,0,0.08);
--shadow-md:       0 4px 16px rgba(0,0,0,0.10);
--shadow-hover:    0 8px 28px rgba(0,0,0,0.14);
--input-bg:        #FFFFFF;
--navbar-bg:       #FFFFFF;
```

### DARK MODE (`class="dark"` on `<html>`)
```css
--bg:              #0F1117;
--card-bg:         #1A1D27;
--text-primary:    #F1F5F9;
--text-secondary:  #94A3B8;
--text-muted:      #475569;
--border:          #2D3148;
--input-bg:        #1E2235;
--navbar-bg:       #13151F;
--shadow-sm:       0 1px 4px rgba(0,0,0,0.4);
--shadow-md:       0 4px 16px rgba(0,0,0,0.5);
```

All components must use CSS variables **only**.
Theme toggle button: Lucide `Sun` / `Moon` icon, top-right navbar.
Persist choice in `localStorage` key `"stayease-theme"`.
Apply `"dark"` class to `document.documentElement`.

**Font:** Inter from Google Fonts
**Cards:** border-radius 16px, `var(--shadow-sm)`, hover: `translateY(-2px)`, `var(--shadow-hover)`
**Buttons:** border-radius 50px (pill), font-weight 600
**Inputs:** border-radius 12px, focus ring 3px primary/20%

### Icon Library
Use **Lucide React** exclusively for all icons. Zero emojis anywhere in the UI.
Examples:
- Heart → `<Heart />` (wishlist)
- Star → `<Star />` (ratings)
- MapPin → `<MapPin />` (location)
- Wifi → `<Wifi />`, `<Wind />` (AC), `<Tv />`, `<Car />`, `<UtensilsCrossed />` (kitchen)
- Sun/Moon → theme toggle
- Leaf → vegetarian
- Drumstick → non-vegetarian (use `<Beef />` or `<Drumstick />`)
- Cigarette → smoking
- CigaretteOff → non-smoking
- Wine → alcohol
- WineOff → non-alcohol (use `<Ban />` with wine label)
- Mountain → hill view
- Waves → beachside
- Columns → balcony
- BedSingle → single bedroom
- BedDouble → double bedroom
- Building → triple bedroom / suite
- ChevronLeft, ChevronRight → carousel
- Bell → notifications
- User → profile
- LogOut → log out
- Settings → account settings
- Globe → language/currency
- HelpCircle → help
- Home → become a host / host dashboard
- BarChart2 → analytics
- Tag → offers
- Wallet → payouts
- Plus → add room
- Edit → edit room
- Trash2 → delete
- Check, X → confirm / cancel
- Upload → file uploader
- Image → image placeholder
- Video → video uploader
- Download → invoice download
- Calendar → date picker
- Users → guests count
- Clock → check-in / check-out time
- Shield → identity verification
- Copy → copy referral code
- Share2 → share referral
- TrendingUp → revenue trend
- Percent → discount/GST

---

## PROJECT STRUCTURE

```
stayease/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── config.py
│   ├── models/
│   │   ├── user.py
│   │   ├── room.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   ├── offer.py
│   │   ├── waitlist.py
│   │   ├── invoice.py
│   │   ├── attraction.py
│   │   └── notification.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── rooms.py
│   │   ├── bookings.py
│   │   ├── reviews.py
│   │   ├── pricing.py
│   │   ├── analytics.py
│   │   ├── waitlist.py
│   │   ├── attractions.py
│   │   ├── offers.py
│   │   ├── invoices.py
│   │   ├── notifications.py
│   │   ├── uploads.py
│   │   └── webhooks.py
│   ├── services/
│   │   ├── auth.py
│   │   ├── recommender.py
│   │   ├── pricing.py
│   │   ├── waitlist.py
│   │   ├── email.py          ← FastAPI-Mail templates
│   │   ├── whatsapp.py       ← Twilio WhatsApp
│   │   ├── cloudinary.py     ← image/video upload
│   │   ├── invoice.py        ← PDF generation
│   │   ├── scheduler.py      ← APScheduler for reminders
│   │   └── gst.py            ← GST calculation
│   ├── templates/
│   │   └── emails/
│   │       ├── booking_confirmation.html
│   │       ├── booking_reminder.html
│   │       ├── cancellation.html
│   │       ├── offer.html
│   │       ├── review_request.html
│   │       └── invoice.html
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_rooms.py
│   │   ├── test_bookings.py
│   │   ├── test_reviews.py
│   │   ├── test_pricing.py
│   │   ├── test_offers.py
│   │   └── test_waitlist.py
│   ├── seed.py
│   ├── .env                  ← never committed
│   ├── .env.example          ← committed, all keys with empty values
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── package.json
│   ├── .env                  ← never committed
│   ├── .env.example          ← committed, all keys with empty values
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── theme.js
│       ├── api/
│       │   └── api.js
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Logo.jsx
│       │   ├── UserMenu.jsx
│       │   ├── SearchBar.jsx
│       │   ├── FilterBar.jsx         ← ALL new filters here
│       │   ├── RoomCard.jsx
│       │   ├── RoomImageCarousel.jsx
│       │   ├── VideoPlayer.jsx
│       │   ├── BookingCard.jsx
│       │   ├── StarRating.jsx
│       │   ├── ReviewCard.jsx
│       │   ├── PriceBreakdown.jsx
│       │   ├── GSTBreakdown.jsx
│       │   ├── WaitlistModal.jsx
│       │   ├── OfferBanner.jsx
│       │   ├── ReferralCard.jsx
│       │   ├── NotificationBanner.jsx
│       │   ├── AttractionCard.jsx
│       │   ├── WeatherWidget.jsx
│       │   ├── ThemeToggle.jsx
│       │   ├── ImageUploader.jsx
│       │   ├── VideoUploader.jsx
│       │   ├── IdentityVerification.jsx
│       │   ├── Spinner.jsx
│       │   ├── Badge.jsx
│       │   ├── Modal.jsx
│       │   ├── RoomBadges.jsx        ← veg/nonveg/smoking/alcohol badges
│       │   ├── AmenityIcon.jsx       ← icon mapper for amenities
│       │   └── ErrorMessage.jsx
│       ├── pages/
│       │   ├── guest/
│       │   │   ├── Home.jsx
│       │   │   ├── RoomDetail.jsx
│       │   │   ├── BookRoom.jsx
│       │   │   ├── BookingHistory.jsx
│       │   │   ├── FindMyRoom.jsx
│       │   │   ├── Receipt.jsx
│       │   │   ├── Wishlist.jsx
│       │   │   └── Profile.jsx
│       │   ├── host/
│       │   │   ├── HostDashboard.jsx
│       │   │   ├── ManageRooms.jsx
│       │   │   ├── AddRoom.jsx
│       │   │   ├── EditRoom.jsx
│       │   │   ├── ManageBookings.jsx
│       │   │   ├── Analytics.jsx
│       │   │   ├── ManageOffers.jsx
│       │   │   └── Payouts.jsx
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   └── VerifyIdentity.jsx
│       │   └── shared/
│       │       ├── PrivacyPolicy.jsx
│       │       └── TermsOfService.jsx
│       └── tests/
│           ├── components/
│           │   ├── RoomCard.test.jsx
│           │   ├── StarRating.test.jsx
│           │   ├── PriceBreakdown.test.jsx
│           │   ├── GSTBreakdown.test.jsx
│           │   └── FilterBar.test.jsx
│           └── pages/
│               ├── Home.test.jsx
│               ├── BookRoom.test.jsx
│               └── HostDashboard.test.jsx
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .gitignore                ← must include .env files
└── README.md
```

---

## ENVIRONMENT VARIABLES

### `.gitignore` (root level, committed)
```
# Environment files — NEVER commit these
backend/.env
frontend/.env
*.env
!*.env.example

# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.venv/
venv/
*.pyc

# Node
node_modules/
frontend/dist/
frontend/.vite/

# OS
.DS_Store
Thumbs.db

# Coverage
.coverage
htmlcov/
coverage/
```

### `backend/.env.example` (committed — all keys present, values empty)
```ini
# Application
APP_NAME=StayEase
APP_HOST=0.0.0.0
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:5173

# MongoDB Atlas
MONGO_URI=
MONGO_DB_NAME=stayease

# JWT
JWT_SECRET=
JWT_EXPIRE_MINUTES=10080

# FastAPI-Mail (Gmail SMTP)
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Open-Meteo
OPEN_METEO_BASE_URL=https://api.open-meteo.com

# India GST
GST_RATE=0.18
GST_NUMBER=

# App URLs (for email links)
FRONTEND_URL=http://localhost:5173
```

### `backend/.env` (NOT committed — developer fills this)
Same keys as `.env.example` but with actual values.

### `frontend/.env.example` (committed)
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=StayEase
```

### `frontend/.env` (NOT committed — developer fills this)
Same keys as `.env.example` but with actual values.

---

## DATABASE COLLECTIONS

### `users`
```
_id, name, email (unique), phone,
password_hash, role (guest|host|admin),
avatar_url, about_me,
identity_proof: {
  type (aadhar|pan|passport),
  number, document_url, verified (bool)
},
email_verified (bool),
referral_code (unique, auto-generated 8-char alphanumeric),
referred_by (user_id),
referral_credits (float, default 0),
wishlist: [room_id],
notification_prefs: {
  email: bool, whatsapp: bool
},
created_at
```

### `rooms`
```
_id, host_id, room_number,
title, description,
room_type (Single|Double|Triple|Suite),
bed_configuration (single_bed|double_bed|twin_beds|queen|king),
price_per_night, amenities[],
is_available, max_guests,
location: { city, area, lat, lng, address },
photos: [{ url, public_id, is_primary }],
videos: [{ url, public_id }],
avg_rating, total_reviews,

# NEW DETAILED ROOM FLAGS
food_preference (veg|nonveg|both),
  ← "veg" = vegetarian-only kitchen/menu
  ← "nonveg" = non-vegetarian available
  ← "both" = both options available
smoking_policy (smoking|non_smoking),
alcohol_policy (alcohol|non_alcohol),
  ← "non_alcohol" = dry room / no alcohol permitted
view_type (hill_view|beach_view|garden_view|sea_view|city_view|pool_view|none),
has_balcony (bool),

# ROOM DETAIL TYPES (extended)
room_category (Single|Double|Triple|Suite|Villa|Dormitory),
  ← Single: 1 bed for 1-2 guests
  ← Double: 1 large bed for 2 guests
  ← Triple: 3 beds for up to 3 guests
  ← Suite: premium multi-room

policies: {
  check_in_time, check_out_time,
  cancellation (flexible|moderate|strict),
  pet_allowed, smoking_allowed, alcohol_allowed
},
created_at
```

### `bookings`
```
_id, room_id, guest_id, host_id,
guest_name, guest_phone, guest_email,
check_in_date, check_out_date,
total_nights, num_guests,
base_price, final_price_per_night,
price_breakdown[],
subtotal, gst_rate, gst_amount,
total_price,
offer_code, discount_amount,
payment_status (pending|paid|refunded),
status (confirmed|cancelled|completed),
invoice_url,
created_at
```

### `reviews`
```
_id, booking_id, room_id,
guest_id, guest_name, rating (1-5),
title, body, would_recommend,
photos: [url],
host_response, created_at
```

### `offers`
```
_id, host_id (null=platform-wide),
code (unique uppercase),
type (percentage|flat),
value, min_booking_amount,
max_discount, valid_from, valid_until,
usage_limit, used_count,
applicable_rooms: [] (empty=all),
is_active, created_at
```

### `invoices`
```
_id, booking_id, invoice_number,
guest_details, host_details,
room_details, line_items[],
subtotal, gst_breakdown, total,
pdf_url, created_at
```

### `notifications`
```
_id, user_id, type, title, body,
channel (email|whatsapp|in-app),
sent_at, read (bool)
```

### `waitlist`
```
_id, room_id, guest_id, guest_name,
guest_phone, check_in_date,
check_out_date,
status (waiting|notify|expired),
created_at
```

### `attractions`
```
_id, city, name, category,
distance_km, description, open_hours
```

---

## ROOM TYPES & FILTERS (Full Detail)

### Room Categories
| Category | Description | Max Guests | Icon |
|---|---|---|---|
| Single | 1 single bed, compact | 1–2 | `BedSingle` |
| Double | 1 double/queen/king bed | 2 | `BedDouble` |
| Triple | 3 single beds or 1 double + 1 single | 3 | `Bed` |
| Suite | Separate living + bedroom | 2–4 | `Building2` |
| Villa | Entire private villa | 4–10 | `Home` |
| Dormitory | Shared bunk beds | 1 | `Users` |

### Food Preference Flags
| Flag | Meaning | Icon | Badge Color |
|---|---|---|---|
| `veg` | Vegetarian only | `Leaf` (green) | `#16A34A` |
| `nonveg` | Non-veg available | `Beef` (red) | `#DC2626` |
| `both` | Both options | `UtensilsCrossed` | `#2563EB` |

### Smoking Policy
| Flag | Icon | Badge Color |
|---|---|---|
| `smoking` | `Cigarette` (amber) | `#D97706` |
| `non_smoking` | `CigaretteOff` (green) | `#16A34A` |

### Alcohol Policy
| Flag | Icon | Badge Color |
|---|---|---|
| `alcohol` | `Wine` (purple) | `#7C3AED` |
| `non_alcohol` | `WineOff` or `<Ban/>` (gray) | `#6B7280` |

### View Type
| Flag | Icon |
|---|---|
| `hill_view` | `Mountain` |
| `beach_view` | `Waves` |
| `sea_view` | `Waves` |
| `garden_view` | `TreePine` |
| `city_view` | `Building` |
| `pool_view` | `Droplets` |

### Balcony
| Flag | Icon |
|---|---|
| `has_balcony: true` | `Columns` or `DoorOpen` |

---

## FILTER BAR (FilterBar.jsx)

The filter bar appears below the search bar on the home page. It is a horizontally scrollable pill-filter row on mobile and a wrapping grid on desktop.

### Filter Groups

**Room Category** (multi-select pills):
- All | Single | Double | Triple | Suite | Villa | Dormitory
- Icons: `BedSingle`, `BedDouble`, `Bed`, `Building2`, `Home`, `Users`

**Food Preference** (multi-select pills):
- Veg Only (`Leaf`) | Non-Veg (`Beef`) | Both (`UtensilsCrossed`)

**Smoking Policy** (single-select toggle):
- Any | Smoking Allowed (`Cigarette`) | Non-Smoking (`CigaretteOff`)

**Alcohol Policy** (single-select toggle):
- Any | Alcohol Allowed (`Wine`) | No Alcohol (`WineOff`)

**View Type** (multi-select pills):
- Any | Hill View (`Mountain`) | Beach View (`Waves`) | Garden View (`TreePine`) | Sea View (`Waves`) | City View (`Building`) | Pool View (`Droplets`)

**Balcony** (toggle):
- With Balcony (`DoorOpen`) | Any

**Price Range** (slider):
- Min ₹0 — Max ₹50,000 per night

**Availability** (date range picker inline):
- Check-in / Check-out quick filter

**Guest Count** (stepper +/−):
- Min 1, Max 10

**Sort By** (dropdown):
- Recommended | Price: Low to High | Price: High to Low | Top Rated | Newest

### Filter URL query params (all optional):
```
?type=Single,Double
&food=veg,nonveg
&smoking=non_smoking
&alcohol=non_alcohol
&view=hill_view,beach_view
&balcony=true
&min_price=500
&max_price=10000
&guests=2
&city=Bangalore
&search=sea
&sort=price_asc
&available=true
&check_in=2025-12-20
&check_out=2025-12-23
```

### Backend: `GET /api/rooms`
Update to accept ALL filter params above.
Each filter is optional; unset = no filter applied.
`type` and `food` and `view` accept comma-separated values (OR logic).

---

## ROOM BADGES COMPONENT (`RoomBadges.jsx`)

Displayed on:
1. `RoomCard.jsx` — compact row of icon badges
2. `RoomDetail.jsx` — expanded badges section

```jsx
// RoomBadges.jsx renders icon + label badges
// Props: food_preference, smoking_policy, alcohol_policy,
//        view_type, has_balcony, room_category

<RoomBadges
  food_preference="veg"
  smoking_policy="non_smoking"
  alcohol_policy="non_alcohol"
  view_type="hill_view"
  has_balcony={true}
  room_category="Double"
/>
```

Each badge = small pill with icon + label, styled with CSS variables.
Veg badge = green background.
Non-veg = light red background.
Non-smoking = light green.
Smoking = amber.
No-alcohol = light gray.
Alcohol = light purple.
Hill/Beach view = light blue.
Balcony = light teal.

---

## AMENITY ICONS (`AmenityIcon.jsx`)

All amenity checkboxes in the Add/Edit Room form use Lucide icons.

```
WiFi            → <Wifi />
AC              → <Wind />
TV              → <Tv />
Parking         → <Car />
Kitchen         → <UtensilsCrossed />
Jacuzzi         → <Droplets />
Pool            → <Waves />
Gym             → <Dumbbell />
Balcony         → <DoorOpen />
Minibar         → <GlassWater />
Sea View        → <Waves />
Garden View     → <TreePine />
Laundry         → <Shirt />
Iron            → <Shirt />
Hair Dryer      → <Wind />
Hot Water       → <Thermometer />
CCTV            → <Camera />
Security Guard  → <Shield />
Lift            → <ArrowUpDown />
Room Service    → <Bell />
Breakfast       → <Coffee />
Power Backup    → <Zap />
```

---

## AUTHENTICATION & USER SYSTEM

JWT-based auth (python-jose).
Bcrypt password hashing (passlib).
Role-based access: `guest` | `host` | `admin`.
Routes protected by role dependency.

```
POST /api/auth/register
  Body: name, email, phone, password, role
  Auto-generate unique referral_code
  If referred_by code provided:
    credit referrer ₹200 referral_credits
  Send welcome email

POST /api/auth/login
  Returns: { access_token, token_type, user }

GET  /api/auth/me
  Returns current user profile

POST /api/auth/verify-identity
  Body: multipart form — id_type, id_number, document file
  Upload doc to Cloudinary
  Set identity_proof.verified = false (manual/auto)

PATCH /api/auth/profile
  Update: name, phone, about_me,
          avatar (file upload), notification_prefs

POST /api/auth/verify-email
  Send OTP to email, verify it

POST /api/auth/resend-otp
```

### Validations
- Email: regex + uniqueness check
- Phone: 10-digit India mobile
- Password: min 8 chars, 1 uppercase, 1 number, 1 special char
- Identity proof: Aadhar 12 digits, PAN format AAAAA9999A, Passport starts with letter
- All validation errors: 422 with field-level messages

---

## TWO-PORTAL STRUCTURE

### GUEST PORTAL (role: guest)
```
/                  → Home (listings + all filters)
/rooms/:id         → Room detail
/book/:roomId      → Book room
/bookings          → My trips
/wishlist          → Saved rooms
/find-my-room      → Recommender
/profile           → Guest profile
/receipt/:id       → Booking receipt
```

### HOST PORTAL (role: host)
```
/host              → Host dashboard
/host/rooms        → Manage rooms
/host/rooms/add    → Add new room
/host/rooms/edit/:id → Edit room
/host/bookings     → Manage bookings
/host/analytics    → Revenue analytics
/host/offers       → Manage offers
/host/payouts      → Payout history
```

### Shared
```
/privacy-policy    → Privacy policy
/terms             → Terms of service
/login             → Login
/register          → Register
```

### NAVBAR
If guest:
```
Logo | Search | [Become a Host] [<Sun/>/<Moon/>] [User Menu ▾]
```
If host (on /host/* routes):
```
Logo | [Switch to Guest View] [<Sun/>/<Moon/>] [User Menu ▾]
```

### USER MENU DROPDOWN
(Lucide icons, no emojis)
```
<Heart />    Wishlists         → /wishlist
<Plane />    Trips             → /bookings
<MessageCircle /> Messages    (placeholder)
<User />     Profile           → /profile
─────────────────────────────────
<Bell />     Notifications     → /notifications
<Settings /> Account settings → /profile#settings
<Globe />    Languages & currency (INR, placeholder)
<HelpCircle /> Help Centre    → /help (placeholder)
─────────────────────────────────
<Home />     Become a host    → /host (if guest)
             Switch to guest  → /    (if host)
─────────────────────────────────
<LogOut />   Log out
```

---

## ALL API ENDPOINTS

### AUTH
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/profile
POST   /api/auth/verify-identity
POST   /api/auth/verify-email
POST   /api/auth/resend-otp
```

### ROOMS
```
POST   /api/rooms
GET    /api/rooms
  Query params:
    type, food, smoking, alcohol, view,
    balcony, min_price, max_price,
    guests, city, search, sort,
    available, check_in, check_out,
    host_id
GET    /api/rooms/{id}
PATCH  /api/rooms/{id}
DELETE /api/rooms/{id}
POST   /api/rooms/{id}/photos
DELETE /api/rooms/{id}/photos/{pid}
PATCH  /api/rooms/{id}/photos/{pid}/primary
POST   /api/rooms/{id}/videos
DELETE /api/rooms/{id}/videos/{vid}
POST   /api/rooms/recommend
GET    /api/rooms/{id}/rating
GET    /api/rooms/host/{host_id}
```

### BOOKINGS
```
POST   /api/bookings
GET    /api/bookings           ?status=&guest_id=&host_id=
GET    /api/bookings/{id}
GET    /api/bookings/room/{id}
DELETE /api/bookings/{id}
GET    /api/bookings/{id}/receipt
POST   /api/bookings/{id}/pay
GET    /api/bookings/{id}/invoice
```

### REVIEWS
```
POST   /api/reviews
GET    /api/reviews/room/{id}
PATCH  /api/reviews/{id}/host-response
```

### PRICING
```
POST   /api/pricing/calculate
  Body: room_id, check_in, check_out, offer_code (optional)
  Returns: full price breakdown + GST
```

### OFFERS
```
POST   /api/offers
GET    /api/offers
GET    /api/offers/{code}
PATCH  /api/offers/{id}
DELETE /api/offers/{id}
POST   /api/offers/validate
```

### REFERRALS
```
GET    /api/referrals/my-code
GET    /api/referrals/stats
```

### INVOICES
```
GET    /api/invoices/{booking_id}
```

### ANALYTICS
```
GET    /api/analytics/occupancy   ?year=
GET    /api/analytics/revenue     ?year=&host_id=
GET    /api/dashboard
GET    /api/host/dashboard
```

### NOTIFICATIONS
```
GET    /api/notifications
PATCH  /api/notifications/{id}/read
POST   /api/notifications/test-email
```

### WAITLIST
```
POST   /api/waitlist
GET    /api/waitlist/{phone}
DELETE /api/waitlist/{id}
```

### WISHLIST
```
POST   /api/wishlist/{room_id}
GET    /api/wishlist
```

### ATTRACTIONS & WEATHER
```
GET    /api/attractions/{city}
GET    /api/weather/{lat}/{lon}
```

---

## GST & BILLING (India)

India GST on hotel stays:
- Room tariff < ₹1000/night → 0% GST
- Room tariff ₹1000–₹7500/night → 12% GST
- Room tariff > ₹7500/night → 18% GST

GST breakdown in every booking:
```
base_amount (subtotal before GST)
cgst_rate, cgst_amount (half of GST)
sgst_rate, sgst_amount (half of GST)
total_gst, grand_total
GST number shown on invoice
```

`services/gst.py`:
```python
def calculate_gst(price_per_night: float, nights: int) -> dict:
    subtotal = price_per_night * nights
    if price_per_night < 1000:
        rate = 0.0
    elif price_per_night <= 7500:
        rate = 0.12
    else:
        rate = 0.18
    gst = subtotal * rate
    half = gst / 2
    return {
        "subtotal": subtotal,
        "gst_rate": rate,
        "cgst_rate": rate / 2,
        "cgst_amount": half,
        "sgst_rate": rate / 2,
        "sgst_amount": half,
        "total_gst": gst,
        "grand_total": subtotal + gst,
    }
```

### INVOICE PDF
- StayEase header with logo
- Invoice number: `INV-{YYYYMMDD}-{booking_short_id}`
- "TAX INVOICE" (required India GST heading)
- Booking details table
- Room details with food/smoking/alcohol flags
- Price breakdown with dynamic pricing line items
- GST line items (CGST + SGST separately)
- Grand total in bold
- GST Registration Number from env
- Footer: StayEase address, support email
- Save PDF to Cloudinary, store URL in `invoices`
- Email with PDF attached

---

## EMAIL SYSTEM (FastAPI-Mail + HTML templates)

All emails in `backend/templates/emails/` with inline CSS.
Brand colors: `#1A6BFF` primary, white background, Inter font.

### Trigger Points
1. **Register** → welcome email + referral code + onboarding tips
2. **Booking confirmed** → guest: confirmation + invoice PDF attached; host: new booking alert
3. **Booking cancelled** → guest: cancellation; host: cancellation alert
4. **Scheduled reminders** (APScheduler, every hour):
   - 7 days before check-in → Email + WhatsApp
   - 3 days before check-in → Email + WhatsApp
   - 24 hours before check-in → Email + WhatsApp
   - Check-in morning → WhatsApp only
   - 24 hours after check-out → Email + WhatsApp (review request)
5. **Offer created** → email blast to relevant guests
6. **Invoice generated** → email to guest with PDF
7. **Referral credited** → "You earned ₹200 referral credit!"

---

## WHATSAPP MESSAGING (Twilio)

`services/whatsapp.py` — Twilio WhatsApp Sandbox.
All phone numbers: `+91XXXXXXXXXX` format.

Messages (text only, no emojis):
1. Booking confirmation — room number, dates, total, booking ID
2. 7-day reminder — trip in 7 days, room, city, check-in date
3. 3-day reminder — 3 days until stay, pack bags, room, area
4. 24hr reminder — check-in tomorrow, time, address, area
5. Check-in day — today is check-in day, room ready
6. Post checkout — rate your stay, review link
7. Waitlist notify — room now available, book now
8. Offer alert — use code, discount, validity

---

## ROOM PHOTOS & VIDEOS

`services/cloudinary.py`:
- `upload_image(file)` → `{ url, public_id }`
- `upload_video(file)` → `{ url, public_id }`
- `delete_asset(public_id)`

Each room: max 10 photos, max 2 videos, one `is_primary`.

**`ImageUploader.jsx`**: drag-and-drop, preview grid, set primary (star icon), delete, progress bar.

**`VideoUploader.jsx`**: single drop zone, mp4/mov/webm, video preview, max 100MB with error.

**`RoomImageCarousel.jsx`**: full-width, dots, prev/next arrows (`ChevronLeft`/`ChevronRight` Lucide icons), primary photo first, gradient placeholder if none.

**`VideoPlayer.jsx`**: HTML5 video, controls: play/pause, volume, fullscreen.

---

## OFFERS & REFERRAL SYSTEM

### Offer Types
- `percentage`: discount by %
- `flat`: fixed ₹ amount off

### Referral System
- On register: auto-generate 8-char alphanumeric `referral_code`
- New user registers with code → referee gets ₹100, referrer gets ₹200
- Credits in `referral_credits`, auto-applied at checkout
- Shown as "Referral credit: -₹200" line item

### ReferralCard component
- Your code: `{code}` [Copy — `<Copy />` icon]
- Share link: `stayease.com/r/{code}` [Share — `<Share2 />` icon]
- Credits earned: ₹{amount}
- People referred: {count}

---

## PROFILE PAGE — GUEST (`/profile`)

Four tabs:

**TAB 1 — About me:**
- Avatar (uploadable, circular) with `<Upload />` icon
- Name, email, phone (inline editable)
- About me textarea
- Identity verification: `<Shield />` icon + status badge
- Upload ID proof modal (Aadhar/PAN/Passport)
- Referral card
- Notification preferences toggles (Email / WhatsApp)

**TAB 2 — Past trips:**
- Completed bookings list
- "Leave review" button (`<Star />`)
- "Book again" button
- "Download invoice" button (`<Download />`)

**TAB 3 — Wishlist:**
- Grid of saved rooms (same `RoomCard` style)
- Remove with heart toggle

**TAB 4 — Dashboard:**
- Total spent / nights / avg cost / total GST
- Monthly spend bar chart (Recharts, blue palette)
- Booking status pie chart
- Top cities list

---

## HOST PORTAL PAGES

### `/host` (Dashboard)
- Stat cards: Total rooms, Active bookings, Monthly revenue, Avg rating
- Recent bookings table (last 10)
- Pending actions: unreviewed checkouts, rooms with no photos
- Revenue chart (last 6 months, Recharts)
- Quick actions: `<Plus />` Add Room, `<Grid />` Manage Rooms, `<Calendar />` Bookings, `<Tag />` Create Offer

### `/host/rooms` (Manage Rooms)
- Table: Photo | Room# | Type | Food | Smoking | Price | Status | Rating | Actions
- Toggle availability inline
- Edit (`<Edit />`) / Delete (`<Trash2 />`) buttons
- Bulk actions

### `/host/rooms/add` and `/host/rooms/edit/:id`

**SECTION 1 — Basic Info:**
- Title, Room Number, Room Category (Single/Double/Triple/Suite/Villa/Dormitory), Description (min 50 chars), Max guests, Price per night

**SECTION 2 — Location:**
- Address, City, Area, Pincode, Latitude, Longitude

**SECTION 3 — Room Preferences:**
- **Food Preference** (radio: Veg Only / Non-Veg / Both) — with `<Leaf />`, `<Beef />`, `<UtensilsCrossed />` icons
- **Smoking Policy** (toggle: Smoking Allowed / Non-Smoking) — with `<Cigarette />` / `<CigaretteOff />` icons
- **Alcohol Policy** (toggle: Alcohol Allowed / No Alcohol) — with `<Wine />` / `<WineOff />` icons
- **View Type** (dropdown or radio: None / Hill View / Beach View / Sea View / Garden View / City View / Pool View) — with respective Lucide icons
- **Balcony** (toggle: Yes / No) — with `<DoorOpen />` icon

**SECTION 4 — Amenities:**
- Checkbox grid with Lucide icons (see AmenityIcon.jsx above)

**SECTION 5 — Photos & Videos:**
- `ImageUploader` (up to 10)
- `VideoUploader` (up to 2)

**SECTION 6 — Policies:**
- Check-in time, Check-out time, Cancellation policy, Pet allowed, Smoking allowed

Save as Draft | Publish buttons

### `/host/bookings` (Manage Bookings)
- Filter: All / Upcoming / Active / Completed / Cancelled
- Table: guest, room, dates, food pref, amount, GST, total, status, actions
- Download invoice per booking
- Export as CSV

### `/host/analytics`
- Year + month filter
- Revenue by month (bar chart, Recharts)
- Occupancy rate by month (line chart)
- Room type performance (pie)
- Top performing rooms ranked
- Revenue breakdown: base + GST collected
- Export CSV

### `/host/offers`
- List with usage stats
- Create/edit offer form
- Toggle active/inactive
- Expiry badge (red if expired)

### `/host/payouts`
- Total / Pending / Paid out
- Payout history table (mock data)

---

## PRIVACY POLICY & TERMS

Both pages: max-width 800px, table of contents with anchor links, sticky sidebar ToC on desktop.

**`/privacy-policy`:** data collected (name, email, phone, ID proof, booking), usage, third parties (Cloudinary, Twilio, MongoDB Atlas), user rights, cookies, contact: privacy@stayease.com

**`/terms`:** eligibility (18+), host/guest responsibilities, booking/cancellation, prohibited activities, liability, India governing law, disputes

**Footer** (all pages):
- Left: StayEase logo + tagline
- Center: Explore | Host | Company
- Right: Privacy | Terms | Help | © 2025 StayEase
- Social icon placeholders (Lucide: `<Twitter />`, `<Instagram />`, `<Linkedin />`)

---

## DYNAMIC PRICING ENGINE

```
Weekend (Fri/Sat nights):       +20%
Peak months (Dec/Jan/Mar):      +30%
Long stay 7+ nights:            -10%
Last minute ≤2 days ahead:      +15%
Early bird 30+ days ahead:      -5%
Offer code:                     additional discount
GST:                            applied on final price
```

All shown as named line items in checkout and invoice.

---

## UNIQUE FEATURES (all 7)

1. **SMART ROOM RECOMMENDER** — 3-step wizard → ranked results with match % badge (`POST /api/rooms/recommend`)

2. **GUEST REVIEWS & RATINGS** — after completed bookings only; host responds; star breakdown on room detail

3. **DYNAMIC PRICING ENGINE** — all multipliers + offer + GST; live breakdown in checkout

4. **NEARBY ATTRACTIONS + WEATHER** — Open-Meteo weather widget; MongoDB attractions by city; category tabs

5. **PRINTABLE RECEIPT + PDF INVOICE** — `/receipt/:id` (browser print); PDF via reportlab; emailed after payment

6. **OCCUPANCY ANALYTICS** — guest personal spend dashboard; host revenue + occupancy Recharts

7. **WAITLIST SYSTEM** — auto-promote on cancel; WhatsApp + email notify

---

## UNIT TESTS — BACKEND (pytest)

### `tests/conftest.py`
MongoDB test client (mongomock or separate test DB from `.env.test`), FastAPI TestClient fixture, seed fixture: 2 users, 3 rooms (including 1 veg+non-smoking+hill-view, 1 nonveg+smoking+beach-view), 2 bookings.

### `tests/test_auth.py`
```
test_register_success
test_register_duplicate_email_fails
test_register_invalid_email_format
test_register_weak_password_fails
test_login_success_returns_token
test_login_wrong_password_fails
test_get_me_without_token_fails
test_identity_validation_aadhar_format
test_identity_validation_pan_format
```

### `tests/test_rooms.py`
```
test_create_room_as_host
test_create_room_as_guest_forbidden
test_get_all_rooms
test_get_room_by_id
test_filter_rooms_by_type
test_filter_rooms_by_food_preference_veg
test_filter_rooms_by_food_preference_nonveg
test_filter_rooms_by_smoking_policy
test_filter_rooms_by_alcohol_policy
test_filter_rooms_by_view_type
test_filter_rooms_by_balcony
test_filter_rooms_combined_food_and_view
test_filter_available_rooms
test_update_room_by_owner
test_update_room_by_non_owner_forbidden
test_delete_room_with_active_booking_fails
test_upload_room_photo (mock Cloudinary)
```

### `tests/test_bookings.py`
```
test_create_booking_success
test_create_booking_past_date_fails
test_create_booking_checkout_before_checkin
test_double_booking_prevention
test_cancel_booking_success
test_cancel_already_cancelled_fails
test_booking_gst_calculation_correct
test_booking_total_price_correct
test_waitlist_promoted_on_cancel
```

### `tests/test_pricing.py`
```
test_weekend_surcharge_applied
test_peak_month_surcharge
test_long_stay_discount
test_last_minute_surcharge
test_early_bird_discount
test_gst_rate_below_1000
test_gst_rate_1000_to_7500
test_gst_rate_above_7500
test_offer_code_discount_applied
test_expired_offer_rejected
test_invalid_offer_code_rejected
```

### `tests/test_reviews.py`
```
test_review_after_completed_booking
test_review_before_checkout_fails
test_duplicate_review_fails
test_host_can_respond_to_review
test_rating_average_updates_on_review
```

### `tests/test_offers.py`
```
test_create_offer_as_host
test_validate_valid_offer_code
test_validate_expired_offer_fails
test_validate_over_limit_offer_fails
test_referral_credit_on_register
test_referral_code_uniqueness
```

### `tests/test_waitlist.py`
```
test_join_waitlist_on_conflict
test_waitlist_promoted_on_cancel
test_check_waitlist_by_phone
```

Run with: `pytest backend/tests/ -v --cov`

---

## UNIT TESTS — FRONTEND (Vitest + RTL)

### `vitest.config.js`
```js
environment: 'jsdom'
setupFiles: 'src/tests/setup.js'
coverage: 'v8'
```

### `src/tests/setup.js`
```js
import '@testing-library/jest-dom'
```

### `tests/components/FilterBar.test.jsx`
```
renders all filter groups
food preference filter: veg pill activates correctly
food preference filter: nonveg pill activates correctly
smoking filter: non-smoking toggle activates
alcohol filter: non-alcohol toggle activates
view type: hill_view pill selects
view type: beach_view pill selects
balcony toggle filters rooms
multiple filters combined update query params
clear all filters resets state
```

### `tests/components/RoomCard.test.jsx`
```
renders room name and price
renders veg badge when food_preference is veg
renders non-veg badge when food_preference is nonveg
renders non-smoking badge correctly
renders no-alcohol badge correctly
renders hill_view badge correctly
renders beach_view badge correctly
renders balcony badge when has_balcony is true
renders availability badge correctly
heart icon toggles on click
clicking card navigates to room detail
shows match badge when matchScore prop given
```

### `tests/components/StarRating.test.jsx`
```
renders 5 stars
readonly mode shows correct filled stars
interactive mode updates on click
half-star renders for 0.5 values
```

### `tests/components/PriceBreakdown.test.jsx`
```
renders base price
shows weekend surcharge line item
shows peak season surcharge
shows long stay discount as negative
shows GST line items (CGST + SGST)
renders correct grand total
```

### `tests/components/GSTBreakdown.test.jsx`
```
0% GST for price < 1000
12% GST for price 1000-7500
18% GST for price > 7500
CGST and SGST split correctly
```

### `tests/pages/Home.test.jsx`
```
renders room cards from API
food preference filter pills filter room list
smoking filter filters rooms
search input filters rooms
shows loading spinner during fetch
shows error message on API failure
```

### `tests/pages/BookRoom.test.jsx`
```
shows room details at top
shows room badges (veg/smoking/alcohol/view)
date validation: past date rejected
checkout before checkin rejected
offer code applied correctly
shows live price breakdown on date change
shows waitlist modal on 409 response
```

### `tests/pages/HostDashboard.test.jsx`
```
renders stat cards
shows recent bookings table
revenue chart renders
only accessible by host role
```

Run with: `npm run test`

---

## CI/CD — GITHUB ACTIONS

### `.github/workflows/ci.yml`
```yaml
name: StayEase CI
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - name: Create backend .env from secrets
        run: |
          cat > backend/.env << EOF
          MONGO_URI=${{ secrets.MONGO_URI }}
          MONGO_DB_NAME=stayease_test
          JWT_SECRET=${{ secrets.JWT_SECRET }}
          MAIL_USERNAME=${{ secrets.MAIL_USERNAME }}
          MAIL_PASSWORD=${{ secrets.MAIL_PASSWORD }}
          MAIL_FROM=${{ secrets.MAIL_FROM }}
          MAIL_SERVER=smtp.gmail.com
          MAIL_PORT=587
          MAIL_USE_TLS=True
          TWILIO_ACCOUNT_SID=${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN=${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
          CLOUDINARY_CLOUD_NAME=${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY=${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET=${{ secrets.CLOUDINARY_API_SECRET }}
          OPEN_METEO_BASE_URL=https://api.open-meteo.com
          GST_RATE=0.18
          GST_NUMBER=TEST_GST
          FRONTEND_URL=http://localhost:5173
          APP_NAME=StayEase
          APP_HOST=0.0.0.0
          APP_PORT=8000
          ALLOWED_ORIGINS=http://localhost:5173
          EOF
      - run: pytest backend/tests/ -v --cov=backend --cov-report=xml
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - name: Create frontend .env
        run: |
          echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env
          echo "VITE_APP_NAME=StayEase" >> frontend/.env
      - run: cd frontend && npm run test -- --coverage
      - run: cd frontend && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install black flake8
      - run: black --check backend/
      - run: flake8 backend/ --max-line-length=100
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npx eslint src/ --ext .js,.jsx
```

### `.github/workflows/deploy.yml`
```yaml
name: StayEase Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy backend
        run: echo "Add your backend deployment command here (e.g. Railway, Render, EC2)"
      - name: Deploy frontend
        run: echo "Add your frontend deployment command here (e.g. Vercel, Netlify, S3)"
```

### GitHub Secrets Required
```
MONGO_URI
JWT_SECRET
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## SEED FILE (`backend/seed.py`)

Create (skip if already exist — idempotent):
- 2 users: 1 guest (`guest@stayease.com`), 1 host (`host@stayease.com`)
- 5 rooms with Bangalore locations, covering all combinations:
  - Room 1: Single, Veg, Non-Smoking, No-Alcohol, Hill View, Balcony — ₹1200/night
  - Room 2: Double, NonVeg, Non-Smoking, Alcohol, City View, No Balcony — ₹3500/night
  - Room 3: Triple, Both, Smoking, Alcohol, Beach View, Balcony — ₹2800/night
  - Room 4: Suite, Veg, Non-Smoking, No-Alcohol, Sea View, Balcony — ₹8500/night
  - Room 5: Double, NonVeg, Non-Smoking, No-Alcohol, Garden View, No Balcony — ₹950/night
- 5 attraction categories for Bangalore
- 2 active offers: `WELCOME10`, `SUMMER20`
- 1 referral between guest and host account
- 2 sample bookings (1 confirmed, 1 completed)
- 1 sample review on completed booking

---

## README.md

Include all of the following sections:

1. Overview + feature list
2. Tech stack table
3. Architecture diagram (ASCII)
4. MongoDB Atlas setup
5. Backend setup + env vars (full `.env.example` reference)
6. Frontend setup + env vars
7. Twilio WhatsApp sandbox setup
8. Cloudinary setup
9. FastAPI-Mail Gmail setup
10. Full API reference table
11. Room filter parameters table (all new food/smoking/alcohol/view/balcony params)
12. Running tests (backend + frontend)
13. CI/CD explanation + GitHub Secrets setup
14. GST billing notes
15. Unique features explained
16. Assumptions made
17. AI tools paragraph

---

## FINAL RULES

Generate **every single file completely**.
No TODOs, no placeholders, no skipped files.
No hardcoded values — **everything from `.env`**.
No external UI component libraries (no MUI/Tailwind/Bootstrap).
**CSS variables only** — all components must support light and dark mode.
Dark mode class on `html` element, persisted in `localStorage`.
**Zero emojis** anywhere in the UI — use Lucide React icons exclusively.
User menu dropdown matches Airbnb screenshot exactly.
Room cards: full card clickable, heart toggles.
Sticky booking card on room detail.
Red Reserve button (Airbnb style).
GST auto-calculated based on India slabs.
All emails use HTML templates with brand styling.
WhatsApp messages sent via Twilio (text only, no emojis in messages).
PDF invoices generated and emailed on payment.
APScheduler for reminder scheduling.
All tests written and passing.
GitHub Actions CI runs on every push.
All errors displayed on page, not console.
Loading spinners (`<Spinner />`) on every API call.
Mobile responsive (flexbox + grid, no libraries).
`.env` files never committed — only `.env.example` committed.
`.gitignore` includes all `.env` patterns.
`requirements.txt` pinned versions.
`package.json` pinned versions.

### Self-review checklist after generating all files:
```
✓ Guest portal fully functional
✓ Host portal fully functional
✓ User menu matches Airbnb screenshot (Lucide icons, no emojis)
✓ Light + dark mode working
✓ JWT auth with role-based access
✓ Identity validation (Aadhar/PAN/Passport)
✓ Email validated on registration
✓ GST calculated per India slabs
✓ PDF invoice generated + emailed
✓ WhatsApp messages via Twilio (text only)
✓ Scheduled reminders (7d/3d/24h/post)
✓ Offer codes + referral system
✓ Room photos + videos via Cloudinary
✓ All 7 unique features complete
✓ Waitlist auto-promote on cancel
✓ Full test suite (backend + frontend)
✓ GitHub Actions CI/CD configured
✓ Privacy policy + terms pages
✓ Food preference filter (veg/nonveg/both) + badges
✓ Smoking policy filter + badges
✓ Alcohol policy filter + badges
✓ View type filter (hill/beach/sea/garden/city/pool) + badges
✓ Balcony filter + badge
✓ Room category filter (Single/Double/Triple/Suite/Villa/Dormitory)
✓ All filters wired to backend query params
✓ All icons from Lucide React — zero emojis
✓ .env files never committed
✓ .env.example files committed with all keys
✓ .gitignore covers all .env patterns
✓ Nothing hardcoded anywhere
```


I want you to generate it. Dockerize, and make sure proper error handling both frontend and backend errors and their pages when required. I want you build it.

