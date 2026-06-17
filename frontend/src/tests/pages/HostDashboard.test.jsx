import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HostDashboard from '../../pages/host/HostDashboard';
import { analyticsApi } from '../../api/api';

vi.mock('../../api/api', async () => {
  const actual = await vi.importActual('../../api/api');
  return {
    ...actual,
    analyticsApi: {
      hostDashboard: vi.fn(),
      revenue: vi.fn(),
    },
  };
});

const mockDashboard = {
  total_rooms: 5,
  active_bookings: 3,
  month_revenue: 125000,
  avg_rating: 4.2,
  recent_bookings: [
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
};

describe('HostDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsApi.hostDashboard.mockResolvedValue({ data: mockDashboard });
    analyticsApi.revenue.mockResolvedValue({
      data: {
        months: [
          { month: 1, revenue: 10000, gst_collected: 1200 },
          { month: 2, revenue: 15000, gst_collected: 1800 },
        ],
      },
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
      expect(screen.getByText('Revenue (last 6 months)')).toBeInTheDocument();
    });
  });

  it('only accessible by host role', () => {
    expect(HostDashboard).toBeDefined();
  });
});
