import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'stayease_token';
const USER_KEY = 'stayease_user';

export { API_BASE_URL, TOKEN_KEY, USER_KEY };

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('stayease-token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function normalizeError(error) {
  if (!error.response) {
    return {
      status: 0,
      message: 'Network error. Please check your connection and try again.',
      fields: {},
      isNetwork: true,
    };
  }

  const { status, data } = error.response;
  let message = 'Something went wrong';
  const fields = {};

  if (typeof data?.detail === 'string') {
    message = data.detail;
  } else if (typeof data?.detail === 'object' && data.detail !== null) {
    if (data.detail.message) {
      message = data.detail.message;
    } else {
      Object.entries(data.detail).forEach(([key, val]) => {
        fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
      });
      message = Object.values(fields).join('. ') || message;
    }
  } else if (data?.message) {
    message = data.message;
  }

  return { status, message, fields, isNetwork: false, raw: data };
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeError(error);
    error.normalized = normalized;

    if (normalized.status === 401 && !error.config?.skipAuthRedirect) {
      clearAuthStorage();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (formData) =>
    api.patch('/api/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyIdentity: (formData) =>
    api.post('/api/auth/verify-identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyEmail: (otp) => api.post('/api/auth/verify-email', { otp }),
  resendOtp: () => api.post('/api/auth/resend-otp'),
};

export const roomsApi = {
  list: (params) => api.get('/api/rooms', { params }),
  get: (id) => api.get(`/api/rooms/${id}`),
  alternatives: (id, params) => api.get(`/api/rooms/${id}/alternatives`, { params }),
  create: (data) => api.post('/api/rooms', data),
  update: (id, data) => api.patch(`/api/rooms/${id}`, data),
  remove: (id) => api.delete(`/api/rooms/${id}`),
  recommend: (data) => api.post('/api/rooms/recommend', data),
  getRating: (id) => api.get(`/api/rooms/${id}/rating`),
  byHost: (hostId) => api.get(`/api/rooms/host/${hostId}`),
  uploadPhoto: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/rooms/${id}/photos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: (id, pid) => api.delete(`/api/rooms/${id}/photos/${encodeURIComponent(pid)}`),
  setPrimaryPhoto: (id, pid) => api.patch(`/api/rooms/${id}/photos/${encodeURIComponent(pid)}/primary`),
  reorderPhotos: (id, publicIds) => api.patch(`/api/rooms/${id}/photos/reorder`, { public_ids: publicIds }),
  uploadVideo: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/rooms/${id}/videos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteVideo: (id, vid) => api.delete(`/api/rooms/${id}/videos/${encodeURIComponent(vid)}`),
  sendInquiry: (id, data) => api.post(`/api/rooms/${id}/inquiries`, data),
  report: (id, data) => api.post(`/api/rooms/${id}/reports`, data),
  bookedDates: (id) => api.get(`/api/rooms/${id}/booked-dates`),
};

export const bookingsApi = {
  create: (data) => api.post('/api/bookings', data),
  uploadVerification: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/bookings/verification-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (params) => api.get('/api/bookings', { params }),
  get: (id) => api.get(`/api/bookings/${id}`),
  byRoom: (roomId) => api.get(`/api/bookings/room/${roomId}`),
  cancel: (id) => api.delete(`/api/bookings/${id}`),
  cancellationPreview: (id) => api.get(`/api/bookings/${id}/cancellation-preview`),
  pay: (id) => api.post(`/api/bookings/${id}/pay`),
  receipt: (id) => api.get(`/api/bookings/${id}/receipt`),
  invoice: (id) => api.get(`/api/bookings/${id}/invoice`),
};

export const reviewsApi = {
  create: (data) => api.post('/api/reviews', data),
  byRoom: (roomId) => api.get(`/api/reviews/room/${roomId}`),
  byProperty: (roomId) => api.get(`/api/reviews/property/${roomId}`),
  byBooking: (bookingId) => api.get(`/api/reviews/booking/${bookingId}`),
  eligibleForRoom: (roomId) => api.get(`/api/reviews/eligible/room/${roomId}`),
  hostResponse: (id, response) => api.patch(`/api/reviews/${id}/host-response`, { response }),
};

export const hostsApi = {
  getProfile: (hostId) => api.get(`/api/hosts/${hostId}/profile`),
};

export const pricingApi = {
  calculate: (data) => api.post('/api/pricing/calculate', data),
};

export const offersApi = {
  list: (params) => api.get('/api/offers', { params }),
  get: (code) => api.get(`/api/offers/${code}`),
  create: (data) => api.post('/api/offers', data),
  update: (id, data) => api.patch(`/api/offers/${id}`, data),
  remove: (id) => api.delete(`/api/offers/${id}`),
  validate: (data) => api.post('/api/offers/validate', data),
};

export const analyticsApi = {
  occupancy: (params) => api.get('/api/analytics/occupancy', { params }),
  revenue: (params) => api.get('/api/analytics/revenue', { params }),
  guestDashboard: () => api.get('/api/guest/dashboard'),
  hostDashboard: () => api.get('/api/dashboard'),
  dashboard: () => api.get('/api/dashboard'),
};

export const waitlistApi = {
  join: (data) => api.post('/api/waitlist', data),
  byPhone: (phone) => api.get(`/api/waitlist/${phone}`),
  remove: (id) => api.delete(`/api/waitlist/${id}`),
};

export const wishlistApi = {
  list: () => api.get('/api/wishlist'),
  toggle: (roomId) => api.post(`/api/wishlist/${roomId}`),
  add: (roomId) => api.post(`/api/wishlist/${roomId}`),
};

export const referralsApi = {
  myCode: () => api.get('/api/referrals/my-code'),
  stats: () => api.get('/api/referrals/stats'),
};

export const notificationsApi = {
  list: () => api.get('/api/notifications'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
};

export const inquiriesApi = {
  list: (params) => api.get('/api/inquiries', { params }),
  reply: (id, data) => api.post(`/api/inquiries/${id}/replies`, data),
};

export const attractionsApi = {
  byCity: (city) => api.get(`/api/attractions/${city}`),
  weather: (lat, lon) => api.get(`/api/weather/${lat}/${lon}`),
};

export const invoicesApi = {
  get: (bookingId) => api.get(`/api/invoices/${bookingId}`),
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function roomId(room) {
  return room?._id || room?.id;
}

// ── Named exports (spec API) — return response.data ──

export const fetchRooms = (params) => api.get('/api/rooms', { params }).then((r) => r.data);
export const fetchRoom = (id) => api.get(`/api/rooms/${id}`).then((r) => r.data);
export const createRoom = (data) => api.post('/api/rooms', data).then((r) => r.data);
export const updateRoom = (id, data) => api.patch(`/api/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id) => api.delete(`/api/rooms/${id}`).then((r) => r.data);
export const recommendRooms = (data) => api.post('/api/rooms/recommend', data).then((r) => r.data);
export const fetchBookedDates = (id) => api.get(`/api/rooms/${id}/booked-dates`).then((r) => r.data);

export const createBooking = (data) => api.post('/api/bookings', data).then((r) => r.data);
export const fetchBookings = (params) => api.get('/api/bookings', { params }).then((r) => r.data);
export const fetchBooking = (id) => api.get(`/api/bookings/${id}`).then((r) => r.data);
export const cancelBooking = (id) => api.delete(`/api/bookings/${id}`).then((r) => r.data);
export const payBooking = (id) => api.post(`/api/bookings/${id}/pay`).then((r) => r.data);

export const loginUser = (data) => api.post('/api/auth/login', data).then((r) => r.data);
export const registerUser = (data) => api.post('/api/auth/register', data).then((r) => r.data);
export const fetchMe = () => api.get('/api/auth/me').then((r) => r.data);
export const updateProfile = (data) => api.patch('/api/auth/profile', data).then((r) => r.data);

export const submitReview = (data) => api.post('/api/reviews', data).then((r) => r.data);
export const fetchRoomReviews = (roomId) => api.get(`/api/reviews/room/${roomId}`).then((r) => r.data);

export const calculatePrice = (data) => api.post('/api/pricing/calculate', data).then((r) => r.data);

export const validateOffer = (code) => api.get(`/api/offers/${code}`).then((r) => r.data);
export const fetchOffers = (params) => api.get('/api/offers', { params }).then((r) => r.data);
export const createOffer = (data) => api.post('/api/offers', data).then((r) => r.data);
export const deleteOffer = (id) => api.delete(`/api/offers/${id}`).then((r) => r.data);

export const fetchDashboard = () => api.get('/api/dashboard').then((r) => r.data);
export const fetchAnalytics = (year) => api.get('/api/analytics/occupancy', { params: { year } }).then((r) => r.data);

export const joinWaitlist = (data) => api.post('/api/waitlist', data).then((r) => r.data);
export const checkWaitlist = (phone) => api.get(`/api/waitlist/${phone}`).then((r) => r.data);

export const toggleWishlist = (roomId) => api.post(`/api/wishlist/${roomId}`).then((r) => r.data);
export const fetchWishlist = () => api.get('/api/wishlist').then((r) => r.data);

export const fetchWeather = (lat, lon) => api.get(`/api/weather/${lat}/${lon}`).then((r) => r.data);
export const fetchAttractions = (city) => api.get(`/api/attractions/${city}`).then((r) => r.data);

export const fetchNotifications = () => api.get('/api/notifications').then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`).then((r) => r.data);
