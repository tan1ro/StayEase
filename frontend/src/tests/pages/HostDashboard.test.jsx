import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HostDashboard from '../../pages/host/HostDashboard';
import { analyticsApi, bookingsApi, roomsApi } from '../../api/api';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'host1', _id: 'host1', role: 'host' } }),
}));

vi.mock('../../api/api', async () => {
  const actual = await vi.importActual('../../api/api');
  return {
    ...actual,
    analyticsApi: {
      dashboard: vi.fn(),
    },
    roomsApi: {
      byHost: vi.fn(),
    },
    bookingsApi: {
      list: vi.fn(),
    },
  };
});

const mockDashboard = {
  total_rooms: 5,
  active_bookings: 3,
  total_revenue: 125000,
  total_bookings: 12,
  cancelled_bookings: 1,
  avg_rating: 4.2,
  ytd_revenue: 25000,
  ytd_platform_fees: 2500,
  ytd_gst_collected: 3000,
  net_earnings: 22500,
  ytd_bookings: 5,
  ytd_nights_booked: 14,
  avg_daily_rate: 1785,
  ytd_occupancy_avg: 38,
  peak_month: 'Feb',
  cancellation_rate: 8.3,
  occupancy_rate: 42,
  completed_bookings: 8,
  avg_stay_nights: 2.5,
  busiest_day: 'Friday',
  booking_status_breakdown: [
    { status: 'confirmed', count: 3, label: 'Confirmed' },
    { status: 'completed', count: 8, label: 'Completed' },
    { status: 'cancelled', count: 1, label: 'Cancelled' },
  ],
  revenue_by_category: [{ category: 'Double', revenue: 12000 }],
  monthly_revenue: [
    { month: 'Jan', revenue: 10000, bookings: 2, occupancy: 35, booked_nights: 6, platform_fees: 500, gst_collected: 600 },
    { month: 'Feb', revenue: 15000, bookings: 3, occupancy: 48, booked_nights: 8, platform_fees: 750, gst_collected: 900 },
  ],
  monthly_occupancy: [
    { month: 'Jan', occupancy_percent: 35 },
    { month: 'Feb', occupancy_percent: 48 },
  ],
  room_type_distribution: [{ type: 'Double', count: 3 }],
  top_rooms: [
    { room_id: 'r1', title: 'Room 101', bookings: 4, revenue: 12000, avg_rating: 4.8, total_reviews: 10 },
  ],
};

describe('HostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsApi.dashboard.mockResolvedValue({ data: mockDashboard });
    bookingsApi.list.mockResolvedValue({
      data: [
        {
          _id: 'b1',
          guest_name: 'Alice',
          check_in_date: '2025-07-01',
          check_out_date: '2025-07-03',
          total_price: 5000,
          host_payout: 4850,
          subtotal: 5000,
          status: 'confirmed',
        },
      ],
    });
    roomsApi.byHost.mockResolvedValue({
      data: [{ _id: 'r1', title: 'Cozy Suite', is_available: true, avg_rating: 4.5, location: { city: 'Goa' }, room_category: 'Deluxe' }],
    });
  });

  it('renders stat cards', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('5 listings')).toBeInTheDocument();
      expect(screen.getByText('3 active stays')).toBeInTheDocument();
    });
  });

  it('shows recent bookings table', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('renders analytics charts and top rooms', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Analytics \(\d{4}\)/i })).toBeInTheDocument();
      expect(screen.getByText('Monthly occupancy %')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Top performing rooms/i })).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });
  });

  it('switches to analytics tab', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Analytics' })).toBeInTheDocument());
    screen.getByRole('tab', { name: 'Analytics' }).click();
    await waitFor(() => {
      expect(screen.getByText('Revenue vs occupancy')).toBeInTheDocument();
      expect(screen.getByText('Monthly breakdown')).toBeInTheDocument();
    });
  });

  it('switches to earnings tab', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Earnings' })).toBeInTheDocument());
    screen.getByRole('tab', { name: 'Earnings' }).click();
    await waitFor(() => {
      expect(screen.getByText('Revenue & fees')).toBeInTheDocument();
      expect(screen.getByText('Payout method')).toBeInTheDocument();
    });
  });
});
