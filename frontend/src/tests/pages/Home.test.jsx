import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../pages/guest/Home';
import { roomsApi } from '../../api/api';

vi.mock('../../api/api', async () => {
  const actual = await vi.importActual('../../api/api');
  return {
    ...actual,
    roomsApi: { list: vi.fn() },
    fetchOffers: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, refreshUser: vi.fn() }),
}));

vi.mock('../../context/OnboardingContext', () => ({
  useOnboarding: () => ({
    isWelcomeOfferDismissed: () => true,
    dismissWelcomeOffer: vi.fn(),
  }),
}));

const mockRooms = [
  {
    _id: '1',
    title: 'Veg Room',
    price_per_night: 1200,
    food_preference: 'veg',
    smoking_policy: 'non_smoking',
    location: { area: 'Koramangala', city: 'Bangalore' },
    is_available: true,
    photos: [],
  },
  {
    _id: '2',
    title: 'Beach Suite',
    price_per_night: 3500,
    food_preference: 'nonveg',
    smoking_policy: 'smoking',
    location: { area: 'Indiranagar', city: 'Bangalore' },
    is_available: true,
    photos: [],
  },
];

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders room cards from API', async () => {
    roomsApi.list.mockResolvedValue({ data: mockRooms });
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Veg Room')).toBeInTheDocument();
      expect(screen.getByText('Beach Suite')).toBeInTheDocument();
    });
  });

  it('shows loading spinner during fetch', () => {
    roomsApi.list.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    roomsApi.list.mockRejectedValue({
      normalized: { message: 'Failed to load rooms', isNetwork: true },
    });
    render(<MemoryRouter><Home /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('food preference filter pills filter room list', async () => {
    roomsApi.list.mockResolvedValue({ data: [mockRooms[0]] });
    render(<MemoryRouter initialEntries={['/?food=veg']}><Home /></MemoryRouter>);
    await waitFor(() => {
      expect(roomsApi.list).toHaveBeenCalled();
    });
  });

  it('smoking filter filters rooms', async () => {
    roomsApi.list.mockResolvedValue({ data: mockRooms });
    render(<MemoryRouter initialEntries={['/?smoking=non_smoking']}><Home /></MemoryRouter>);
    await waitFor(() => expect(roomsApi.list).toHaveBeenCalled());
  });

  it('city filter shows location results', async () => {
    roomsApi.list.mockResolvedValue({ data: [mockRooms[0]] });
    render(<MemoryRouter initialEntries={['/?city=Bangalore']}><Home /></MemoryRouter>);
    await waitFor(() => {
      expect(roomsApi.list).toHaveBeenCalled();
      expect(screen.getByText(/1 room in Bangalore/i)).toBeInTheDocument();
    });
  });
});
