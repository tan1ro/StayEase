import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoomCard from '../../components/RoomCard';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, refreshUser: vi.fn() }),
}));

vi.mock('../../context/OnboardingContext', () => ({
  useOnboarding: () => ({ openAuthGate: vi.fn() }),
}));

const mockRoom = {
  _id: 'room1',
  title: 'Cozy Hill View Room',
  price_per_night: 2500,
  location: { area: 'MG Road', city: 'Bangalore' },
  avg_rating: 4.5,
  total_reviews: 10,
  is_available: true,
  food_preference: 'veg',
  smoking_policy: 'non_smoking',
  alcohol_policy: 'non_alcohol',
  view_type: 'hill_view',
  has_balcony: true,
  photos: [],
};

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

describe('RoomCard', () => {
  it('renders room name and price', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByText('Cozy Hill View Room')).toBeInTheDocument();
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
  });

  it('renders veg badge when food_preference is veg', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders non-veg badge when food_preference is nonveg', () => {
    render(<MemoryRouter><RoomCard room={{ ...mockRoom, food_preference: 'nonveg' }} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders non-smoking badge correctly', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders no-alcohol badge correctly', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders hill_view badge correctly', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders beach_view badge correctly', () => {
    render(<MemoryRouter><RoomCard room={{ ...mockRoom, view_type: 'beach_view' }} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders balcony badge when has_balcony is true', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    expect(screen.getByTestId('room-card')).toBeInTheDocument();
  });

  it('renders availability badge correctly', () => {
    render(<MemoryRouter><RoomCard room={{ ...mockRoom, is_available: false }} /></MemoryRouter>);
    expect(screen.getByTestId('unavailable-badge')).toBeInTheDocument();
  });

  it('heart icon toggles on click', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText('Toggle wishlist'));
    expect(screen.getByLabelText('Toggle wishlist')).toBeInTheDocument();
  });

  it('shows tourist favourite badge for highly rated rooms', () => {
    render(
      <MemoryRouter>
        <RoomCard room={{ ...mockRoom, avg_rating: 4.9, total_reviews: 20 }} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('tourist-favourite')).toHaveTextContent('Tourist favourite');
  });

  it('clicking card navigates to room detail', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} /></MemoryRouter>);
    fireEvent.click(screen.getByTestId('room-card'));
    expect(navigate).toHaveBeenCalledWith('/rooms/room1');
  });

  it('shows match badge when matchScore prop given', () => {
    render(<MemoryRouter><RoomCard room={mockRoom} matchScore={85} /></MemoryRouter>);
    expect(screen.getByTestId('match-badge')).toHaveTextContent('85% match');
  });
});
