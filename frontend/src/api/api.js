import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'stayease_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
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
      setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new CustomEvent('stayease:unauthorized'));
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
  deletePhoto: (id, pid) => api.delete(`/api/rooms/${id}/photos/${pid}`),
  setPrimaryPhoto: (id, pid) => api.patch(`/api/rooms/${id}/photos/${pid}/primary`),
  uploadVideo: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/rooms/${id}/videos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteVideo: (id, vid) => api.delete(`/api/rooms/${id}/videos/${vid}`),
  sendInquiry: (id, data) => api.post(`/api/rooms/${id}/inquiries`, data),
  report: (id, data) => api.post(`/api/rooms/${id}/reports`, data),
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
  guestDashboard: () => api.get('/api/dashboard'),
  hostDashboard: () => api.get('/api/host/dashboard'),
};

export const waitlistApi = {
  join: (data) => api.post('/api/waitlist', data),
  byPhone: (phone) => api.get(`/api/waitlist/${phone}`),
  remove: (id) => api.delete(`/api/waitlist/${id}`),
};

export const wishlistApi = {
  list: () => api.get('/api/wishlist'),
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
