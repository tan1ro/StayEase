import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Minus, Plus, Receipt, Star } from 'lucide-react';
import PriceBreakdown from '../../components/PriceBreakdown';
import DatePicker from '../../components/DatePicker';
import RoomBadges from '../../components/RoomBadges';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import SafeImage from '../../components/SafeImage';
import { Icon, ICON } from '../../components/ui/Icon';
import LegalAcceptance from '../../components/LegalAcceptance';
import {
  bookingsApi,
  formatCurrency,
  joinWaitlist,
  roomsApi,
  validateOffer,
} from '../../api/api';
import { useRoomPricing } from '../../hooks/useRoomPricing';
import { useAuth } from '../../context/AuthContext';
import { addDaysISO, todayISO, BOOKING_CALENDAR_MONTHS } from '../../utils/dates';

function formatStayDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);
  const [offerCode, setOfferCode] = useState('');
  const [offerApplied, setOfferApplied] = useState(null);
  const [offerError, setOfferError] = useState('');
  const [applyingOffer, setApplyingOffer] = useState(false);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [confirmedPricing, setConfirmedPricing] = useState(null);
  const [conflictError, setConflictError] = useState('');
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const dateValidationError = useMemo(() => {
    if (!checkIn || !checkOut) return '';
    const today = todayISO();
    if (checkIn < today) return 'Check-in cannot be in the past';
    if (checkOut <= checkIn) return 'Check-out must be after check-in';
    return '';
  }, [checkIn, checkOut]);

  const activeOfferCode = offerApplied?.code || offerCode;

  const { pricing, loading: pricingLoading, error: pricingError, nights } = useRoomPricing(
    roomId,
    dateValidationError ? '' : checkIn,
    dateValidationError ? '' : checkOut,
    activeOfferCode,
  );

  useEffect(() => {
    setDateError(dateValidationError);
  }, [dateValidationError]);

  useEffect(() => {
    if (user) {
      setGuestName(user.name || '');
      setGuestPhone(user.phone || '');
      setWaitlistName(user.name || '');
      setWaitlistPhone(user.phone || '');
    }
  }, [user?.id, user?.name, user?.phone]);

  useEffect(() => {
    roomsApi.get(roomId).then(({ data }) => setRoom(data)).catch((err) => {
      setError(err.normalized?.message || 'Room not found');
    }).finally(() => setLoading(false));
  }, [roomId]);

  const photo = room?.photos?.find((p) => p.is_primary) || room?.photos?.[0];
  const location = [room?.location?.area, room?.location?.city].filter(Boolean).join(', ');

  const handleApplyOffer = async () => {
    const code = offerCode.trim().toUpperCase();
    if (!code) {
      setOfferError('Enter an offer code');
      return;
    }
    setApplyingOffer(true);
    setOfferError('');
    try {
      const data = await validateOffer(code);
      setOfferApplied(data);
      setOfferCode(code);
    } catch (err) {
      setOfferApplied(null);
      setOfferError(err.normalized?.message || 'Invalid offer code');
    } finally {
      setApplyingOffer(false);
    }
  };

  const handleBook = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!guestName.trim()) {
      setError('Guest name is required');
      return;
    }
    if (!/^\d{10}$/.test(guestPhone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (dateError) return;
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service, Privacy Policy, and Cookie Policy to continue');
      return;
    }
    setError('');
    setConfirmOpen(true);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setError('');
    setConflictError('');
    setShowWaitlistForm(false);
    try {
      const { data: booking } = await bookingsApi.create({
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: guests,
        offer_code: activeOfferCode || undefined,
        booking_for: 'self',
        staying_guest_name: guestName.trim(),
        staying_guest_phone: guestPhone,
      });
      const { data: paid } = await bookingsApi.pay(booking._id);
      setConfirmOpen(false);
      setConfirmedBooking(paid);
      setConfirmedPricing(pricing);
    } catch (err) {
      if (err.normalized?.status === 409) {
        setConflictError(err.normalized.message || 'Room not available for selected dates');
        setShowWaitlistForm(true);
        setWaitlistName(guestName);
        setWaitlistPhone(guestPhone);
        setError('');
      } else if (err.normalized) {
        setError(err.normalized.message);
      } else {
        setError('Booking failed');
      }
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (e) => {
    e?.preventDefault?.();
    if (!waitlistName.trim() || !/^\d{10}$/.test(waitlistPhone)) {
      setWaitlistError('Name and 10-digit phone required');
      return;
    }
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      await joinWaitlist({
        room_id: roomId,
        guest_name: waitlistName.trim(),
        guest_phone: waitlistPhone,
        check_in_date: checkIn,
        check_out_date: checkOut,
      });
      setWaitlistSuccess(true);
    } catch (err) {
      setWaitlistError(err.normalized?.message || 'Could not join waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) return <Spinner label="Loading booking..." />;
  if (!room) return <ErrorMessage message={error || 'Room not found'} />;

  const bookingPricing = confirmedPricing || (confirmedBooking ? {
    subtotal: confirmedBooking.subtotal,
    total_price: confirmedBooking.total_price,
    gst_amount: confirmedBooking.gst_amount,
    gst_rate: confirmedBooking.gst_rate,
    price_breakdown: confirmedBooking.price_breakdown,
    total_nights: confirmedBooking.total_nights,
    final_price_per_night: confirmedBooking.final_price_per_night,
    guest_platform_fee: confirmedBooking.guest_platform_fee,
    gst_breakdown: confirmedBooking.gst_amount ? {
      cgst_amount: confirmedBooking.gst_amount / 2,
      sgst_amount: confirmedBooking.gst_amount / 2,
      cgst_rate: confirmedBooking.gst_rate / 2,
      sgst_rate: confirmedBooking.gst_rate / 2,
    } : undefined,
  } : null);

  if (confirmedBooking) {
    return (
      <div className="book-room">
        <div className="card" style={{ padding: '2rem', maxWidth: 720, margin: '0 auto', borderColor: 'var(--success, #16a34a)' }}>
          <h1 className="book-room__title" style={{ color: 'var(--success, #16a34a)' }}>
            ✅ Booking Confirmed!
          </h1>
          <div className="book-room__summary-rows" style={{ marginTop: '1.5rem' }}>
            <div className="book-room__summary-row">
              <span>Booking ID</span>
              <strong>{confirmedBooking._id}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Room</span>
              <strong>{room.title}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Check-in</span>
              <strong>{formatStayDate(confirmedBooking.check_in_date)}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Check-out</span>
              <strong>{formatStayDate(confirmedBooking.check_out_date)}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Nights</span>
              <strong>{confirmedBooking.total_nights}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Total paid</span>
              <strong>{formatCurrency(confirmedBooking.total_price)} (incl. GST)</strong>
            </div>
          </div>
          {bookingPricing && (
            <div style={{ marginTop: '1.5rem' }}>
              <PriceBreakdown pricing={bookingPricing} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link to={`/receipt/${confirmedBooking._id}`} className="btn btn-primary">
              <Icon icon={Receipt} size={ICON.sm} /> Download Receipt
            </Link>
            <Link to="/bookings" className="btn btn-outline">View My Bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-room">
      <Link to={`/rooms/${roomId}`} className="book-room__back">
        <Icon icon={ArrowLeft} size={ICON.md} />
        Back to listing
      </Link>

      <div className="card book-room__section" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {photo?.url ? (
          <SafeImage src={photo.url} alt={room.title} style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 160, height: 120, background: 'var(--border)', borderRadius: 8 }} />
        )}
        <div>
          <h1 className="book-room__title" style={{ marginBottom: '0.25rem' }}>{room.title}</h1>
          <p className="listing-muted">{room.room_category} · {location}</p>
          <p><strong>{formatCurrency(room.price_per_night)}</strong> / night</p>
          {room.avg_rating > 0 && (
            <p className="book-room__summary-rating">
              <Icon icon={Star} size={ICON.sm} /> {room.avg_rating.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <form className="book-room-layout" onSubmit={handleBook}>
        <div className="book-room__main">
          <section className="book-room__section card">
            <h2>Guest details</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Guest name</label>
                <input
                  className="input"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Mobile (10 digits)</label>
                <input
                  className="input"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  pattern="\d{10}"
                  required
                />
              </div>
            </div>
          </section>

          <section className="book-room__section card">
            <h2>Your trip</h2>
            {dateError && <ErrorMessage message={dateError} />}
            {pricingError && <ErrorMessage message={pricingError} />}
            <div className="form-row book-room__dates">
              <div className="form-group">
                <DatePicker
                  id="check-in"
                  label="Check-in"
                  value={checkIn}
                  onChange={setCheckIn}
                  min={todayISO()}
                  maxMonthsAhead={BOOKING_CALENDAR_MONTHS}
                  required
                />
              </div>
              <div className="form-group">
                <DatePicker
                  id="check-out"
                  label="Check-out"
                  value={checkOut}
                  onChange={setCheckOut}
                  min={checkIn ? addDaysISO(checkIn, 1) : todayISO()}
                  maxMonthsAhead={BOOKING_CALENDAR_MONTHS}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Guests</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGuests((g) => Math.max(1, g - 1))}>
                  <Minus size={14} />
                </button>
                <span>{guests}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGuests((g) => Math.min(room.max_guests, g + 1))}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Offer code</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  value={offerCode}
                  onChange={(e) => { setOfferCode(e.target.value.toUpperCase()); setOfferApplied(null); setOfferError(''); }}
                  placeholder="e.g. WELCOME10"
                />
                <button type="button" className="btn btn-outline" onClick={handleApplyOffer} disabled={applyingOffer}>
                  {applyingOffer ? '…' : 'Apply'}
                </button>
              </div>
              {offerApplied && (
                <p style={{ color: 'var(--success, #16a34a)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <Check size={14} style={{ verticalAlign: 'middle' }} /> {offerApplied.discount_type === 'percentage' ? `${offerApplied.discount_value}% off applied` : `${formatCurrency(offerApplied.discount_value)} off applied`}
                </p>
              )}
              {offerError && <p className="form-error">{offerError}</p>}
            </div>
            <RoomBadges
              food_preference={room.food_preference}
              smoking_policy={room.smoking_policy}
              alcohol_policy={room.alcohol_policy}
              view_type={room.view_type}
              has_balcony={room.has_balcony}
              room_category={room.room_category}
            />
          </section>

          <section className="book-room__section card">
            <ErrorMessage message={error} />
            {conflictError && (
              <div className="host-alert-banner" role="alert" style={{ marginBottom: '1rem' }}>
                <span className="host-alert-banner__dot" aria-hidden="true" />
                <div>
                  <strong>Room not available for selected dates</strong>
                  <p>{conflictError}</p>
                </div>
              </div>
            )}
            {showWaitlistForm && !waitlistSuccess && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--bg-secondary)' }}>
                <h3>Join Waitlist</h3>
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Name</label>
                      <input className="input" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="label">Phone</label>
                      <input className="input" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                    </div>
                  </div>
                  {waitlistError && <p className="form-error">{waitlistError}</p>}
                  {waitlistLoading ? <Spinner size={24} label="" /> : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleJoinWaitlist}>Join Waitlist</button>
                  )}
                </div>
              </div>
            )}
            {waitlistSuccess && (
              <p style={{ color: 'var(--success, #16a34a)', marginBottom: '1rem' }}>
                You&apos;re on the waitlist! We&apos;ll notify you when this room becomes available.
              </p>
            )}
            <LegalAcceptance
              id="book-room-legal-acceptance"
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              className="book-room__terms"
              suffix=", including billing and cancellation charges."
            />
            <button
              type="submit"
              className="btn btn-primary book-room__submit"
              disabled={submitting || !!dateError || !acceptedTerms || !checkIn || !checkOut}
            >
              {submitting ? 'Confirming…' : 'Confirm Booking'}
            </button>
          </section>
        </div>

        <aside className="book-room__summary card">
          <h3>Price summary</h3>
          {pricingLoading && <Spinner label="Calculating price…" />}
          {pricing && <PriceBreakdown pricing={pricing} compact />}
          {!pricing && !pricingLoading && checkIn && checkOut && !dateError && (
            <p className="book-room__pricing-loading">Select valid dates for pricing</p>
          )}
          {nights > 0 && pricing && (
            <p className="book-room__gst-note">{nights} night{nights !== 1 ? 's' : ''} · incl. GST</p>
          )}
        </aside>
      </form>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleConfirmBooking}
        title="Confirm your booking?"
        message={
          pricing
            ? `Book ${room.title} for ${formatCurrency(pricing.total_price)} incl. GST?`
            : `Confirm booking for ${room.title}?`
        }
        confirmLabel="Yes, book now"
        cancelLabel="Go back"
        confirmClassName="btn btn-primary"
        confirming={submitting}
        error={error}
      />
    </div>
  );
}
