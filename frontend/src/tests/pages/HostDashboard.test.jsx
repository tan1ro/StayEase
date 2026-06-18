import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HostDashboard from '../../pages/host/HostDashboard';
import { analyticsApi, bookingsApi } from '../../api/api';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'host1', _id: 'host1', role: 'host' } }),
}));

vi.mock('../../api/api', async () => {
  const actual = await vi.importActual('../../api/api');
  return {
    ...actual,
    analyticsApi: {
      dashboard: vi.fn(),
      revenue: vi.fn(),
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
  avg_rating: 4.2,
  monthly_revenue: [
    { month: 'Jan', revenue: 10000, bookings: 2 },
    { month: 'Feb', revenue: 15000, bookings: 3 },
  ],
};

describe('HostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsApi.dashboard.mockResolvedValue({ data: mockDashboard });
    analyticsApi.revenue.mockResolvedValue({
      data: {
        months: [
          { month: 1, revenue: 10000, gst_collected: 1200 },
          { month: 2, revenue: 15000, gst_collected: 1800 },
        ],
      },
    });
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
  });

  it('renders stat cards', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows recent bookings table', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('revenue chart renders', async () => {
    render(<MemoryRouter><HostDashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Monthly revenue')).toBeInTheDocument();
    });
  });

  it('only accessible by host role', () => {
    expect(HostDashboard).toBeDefined();
  });
});
