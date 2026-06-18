import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';
import CancellationPolicy from './CancellationPolicy';
import DateRangePicker from './DateRangePicker';
import { formatCurrency } from '../api/api';
import { useRoomPricing } from '../hooks/useRoomPricing';
import { nightsBetween } from '../utils/listingParams';

export default function BookingCard({
  room,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 1,
  onDatesChange,
  onPricingChange,
  previewMode = false,
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
  }, [initialCheckIn, initialCheckOut]);

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  const roomId = room?._id || room?.id;
  const nights = nightsBetween(checkIn, checkOut);
  const { pricing, loading } = useRoomPricing(roomId, checkIn, checkOut);

  useEffect(() => {
    onDatesChange?.({ checkIn, checkOut, guests });
  }, [checkIn, checkOut, guests, onDatesChange]);

  useEffect(() => {
    onPricingChange?.(pricing);
  }, [pricing, onPricingChange]);

  if (!room) return null;

  const bookUrl = checkIn && checkOut
    ? `/book/${roomId}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
    : `/book/${roomId}`;

  const hasTotal = Boolean(pricing?.total_price && pricing?.total_nights);
  const displayNights = pricing?.total_nights ?? nights;

  return (
    <aside className="booking-widget">
      <div className="booking-widget__card">
        <p className="booking-widget__price">
          {loading && nights ? (
            <span>Calculating price…</span>
          ) : hasTotal ? (
            <>
              <strong>{formatCurrency(pricing.total_price)}</strong>
              <span> for {displayNights} night{displayNights !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <strong>{formatCurrency(room.price_per_night)}</strong>
              <span> / night + taxes</span>
            </>
          )}
        </p>
        {hasTotal && (
          <p className="booking-widget__price-note">
            Includes taxes, surcharges, and StayEase service fee
          </p>
        )}

        <div className="booking-widget__inputs">
          <DateRangePicker
            variant="booking"
            start={checkIn}
            end={checkOut}
            onChange={({ start, end }) => {
              setCheckIn(start);
              setCheckOut(end);
            }}
            onFocus={() => setShowCalendar(true)}
            startLabel="Check-in"
            endLabel="Checkout"
          />
          <AvailabilityCalendar roomId={roomId} visible={showCalendar} />
          <label className="booking-widget__guests">
            <span className="booking-widget__label">Guests</span>
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} aria-label="Guests">
              {Array.from({ length: room.max_guests || 4 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} guest{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="booking-widget__chevron" />
          </label>
        </div>

        {previewMode ? (
          <p className="booking-widget__preview-note">Preview mode — booking is disabled</p>
        ) : (
          <>
            <Link to={bookUrl} className="booking-widget__reserve">
              Reserve
            </Link>
            <p className="booking-widget__note">You won&apos;t be charged yet</p>
          </>
        )}
        <CancellationPolicy policy={room.policies?.cancellation || 'moderate'} compact />
      </div>
    </aside>
  );
}
