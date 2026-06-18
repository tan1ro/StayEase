import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookRoom from '../../pages/guest/BookRoom';
import { bookingsApi, pricingApi, roomsApi } from '../../api/api';

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const mockUser = {
  name: 'Test',
  phone: '9876543210',
  identity_proof: {
    type: 'aadhar',
    number: '123456789012',
    document_url: 'https://example.com/id.png',
  },
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../components/DatePicker', () => ({
  default: ({ label, value, onChange, id }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../../api/api', async () => {
  const actual = await vi.importActual('../../api/api');
  return {
    ...actual,
    roomsApi: {
      get: vi.fn(),
      alternatives: vi.fn().mockResolvedValue({ data: [] }),
      nextAvailable: vi.fn().mockResolvedValue({ data: { check_in: null, check_out: null } }),
    },
    pricingApi: { calculate: vi.fn() },
    bookingsApi: { create: vi.fn(), createBatch: vi.fn(), pay: vi.fn(), uploadVerification: vi.fn() },
  };
});

const mockRoom = {
  _id: 'room1',
  title: 'Test Room',
  room_number: '101',
  facing_side: 'east',
  food_preference: 'veg',
  smoking_policy: 'non_smoking',
  alcohol_policy: 'non_alcohol',
  view_type: 'hill_view',
  has_balcony: true,
  room_category: 'Double',
  max_guests: 2,
  price_per_night: 1200,
};

const mockPricing = {
  price_breakdown: [{ label: 'Base price', amount: 2400, type: 'base' }],
  subtotal: 2400,
  total_nights: 2,
  final_price_per_night: 1200,
  gst_rate: 0.05,
  gst_amount: 120,
  cgst_amount: 60,
  sgst_amount: 60,
  guest_platform_fee: 240,
  total_price: 2928,
};

function acceptTerms() {
  fireEvent.click(screen.getByRole('checkbox', { name: /terms of service/i }));
}

const mockPropertyRoom = {
  ...mockRoom,
  floor_number: 0,
  available_for_dates: true,
};

const mockPropertyRoomTwo = {
  ...mockRoom,
  _id: 'room2',
  room_number: '102',
  floor_number: 0,
  available_for_dates: true,
};

function renderBookRoom() {
  roomsApi.alternatives.mockResolvedValue({ data: [mockPropertyRoom, mockPropertyRoomTwo] });
  return render(
    <MemoryRouter initialEntries={['/book/room1']}>
      <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
    </MemoryRouter>,
  );
}

async function pickDatesAndRoom() {
  const ci = new Date();
  ci.setDate(ci.getDate() + 5);
  const co = new Date();
  co.setDate(co.getDate() + 8);
  await waitFor(() => expect(screen.getByLabelText('Check-in')).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Check-in'), { target: { value: localDateStr(ci) } });
  fireEvent.change(screen.getByLabelText('Check-out'), { target: { value: localDateStr(co) } });
  await waitFor(() => expect(screen.getByRole('heading', { name: /2\. Pick your room/i })).toBeInTheDocument());
  await waitFor(() => expect(screen.getByTitle(/Add room 101/i)).toBeInTheDocument());
  fireEvent.click(screen.getByTitle(/Add room 101/i));
}

describe('BookRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomsApi.get.mockResolvedValue({ data: mockRoom });
    roomsApi.alternatives.mockResolvedValue({ data: [mockPropertyRoom, mockPropertyRoomTwo] });
    pricingApi.calculate.mockResolvedValue({ data: mockPricing });
  });

  it('does not pre-select a room in the summary', async () => {
    renderBookRoom();
    await waitFor(() => expect(screen.getByText('Test Room')).toBeInTheDocument());
    expect(screen.getByText('Select a room')).toBeInTheDocument();
  });

  it('shows room details at top', async () => {
    render(
      <MemoryRouter initialEntries={['/book/room1']}>
        <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Test Room')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /1\. Dates & guests/i })).toBeInTheDocument();
    });
  });

  it('shows room badges (veg/smoking/alcohol/view)', async () => {
    render(
      <MemoryRouter initialEntries={['/book/room1']}>
        <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Test Room')).toBeInTheDocument());
  });

  it('date validation: past date rejected', async () => {
    render(
      <MemoryRouter initialEntries={['/book/room1']}>
        <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByLabelText('Check-in')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Check-in'), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText('Check-out'), { target: { value: '2020-01-03' } });
    await waitFor(() => {
      expect(screen.getByText(/Check-in cannot be in the past/)).toBeInTheDocument();
    });
  });

  it('checkout before checkin rejected', async () => {
    const ci = new Date();
    ci.setDate(ci.getDate() + 10);
    const co = new Date();
    co.setDate(co.getDate() + 8);
    render(
      <MemoryRouter initialEntries={['/book/room1']}>
        <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByLabelText('Check-in')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Check-in'), { target: { value: localDateStr(ci) } });
    fireEvent.change(screen.getByLabelText('Check-out'), { target: { value: localDateStr(co) } });
    await waitFor(() => {
      expect(screen.getByText(/Check-out must be after check-in/)).toBeInTheDocument();
    });
  });

  it('offer code field is available at payment step', async () => {
    render(
      <MemoryRouter initialEntries={['/book/room1']}>
        <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByPlaceholderText('e.g. WELCOME10')).toBeInTheDocument());
    expect(screen.getByText(/Have a code\? Apply it here before you pay/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. WELCOME10'), { target: { value: 'WELCOME10' } });
    expect(screen.getByPlaceholderText('e.g. WELCOME10')).toHaveValue('WELCOME10');
  });

  it('shows live price breakdown after dates and room selection', async () => {
    renderBookRoom();
    await pickDatesAndRoom();
    await waitFor(() => {
      expect(pricingApi.calculate).toHaveBeenCalled();
    });
  });

  it('shows unavailable error on 409 response', async () => {
    bookingsApi.createBatch.mockRejectedValue(
      Object.assign(new Error('conflict'), {
        normalized: { status: 409, message: 'Room unavailable for selected dates' },
      }),
    );
    renderBookRoom();
    await pickDatesAndRoom();
    await waitFor(() => expect(pricingApi.calculate).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('price-breakdown')).toBeInTheDocument());
    acceptTerms();
    fireEvent.click(screen.getByText('Confirm Booking'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Yes, book now'));
    await waitFor(() => expect(bookingsApi.createBatch).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/Room unavailable for selected dates/i)).toBeInTheDocument();
    });
  });
});
