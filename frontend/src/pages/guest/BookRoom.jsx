import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, Receipt, Star } from 'lucide-react';
import PriceBreakdown from '../../components/PriceBreakdown';
import DatePicker from '../../components/DatePicker';
import RoomBadges from '../../components/RoomBadges';
import RoomFloorPicker from '../../components/RoomFloorPicker';
import BookingGuestVerification, {
  defaultGuestVerification,
  prepareBookingVerification,
} from '../../components/BookingGuestVerification';
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
import { useMultiRoomPricing } from '../../hooks/useMultiRoomPricing';
import { useAuth } from '../../context/AuthContext';
import { isRoomAvailableForDates } from '../../utils/adjacentRooms';
import { addDaysISO, todayISO, BOOKING_CALENDAR_MONTHS } from '../../utils/dates';

function formatStayDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatStayRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Select dates';
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const monthYear = start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return `${start.getDate()}–${end.getDate()} ${monthYear}`;
  }
  return `${formatStayDate(checkIn)} – ${formatStayDate(checkOut)}`;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function payBookingWithRetry(bookingId, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const { data } = await bookingsApi.pay(bookingId);
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function settleBatchPayment(bookings) {
  const paidBookings = [];
  for (const booking of bookings) {
    if (booking.payment_status === 'paid') {
      paidBookings.push(booking);
      continue;
    }
    const paid = await payBookingWithRetry(booking._id);
    paidBookings.push(paid);
  }
  return paidBookings;
}

export default function BookRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guestsPerRoom, setGuestsPerRoom] = useState(() => {
    const fromUrl = Number(searchParams.get('guests'));
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 1;
  });
  const [offerCode, setOfferCode] = useState('');
  const [offerApplied, setOfferApplied] = useState(null);
  const [offerError, setOfferError] = useState('');
  const [applyingOffer, setApplyingOffer] = useState(false);
  const [guestVerification, setGuestVerification] = useState(() => defaultGuestVerification(user));
  const [verificationError, setVerificationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState(null);
  const [confirmedPricing, setConfirmedPricing] = useState(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState(() => [roomId]);
  const [propertyRooms, setPropertyRooms] = useState([]);
  const [conflictError, setConflictError] = useState('');
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingVerificationPayload, setPendingVerificationPayload] = useState(null);
  const [pendingPaymentBookingIds, setPendingPaymentBookingIds] = useState(null);

  const dateValidationError = useMemo(() => {
    if (!checkIn || !checkOut) return '';
    const today = todayISO();
    if (checkIn < today) return 'Check-in cannot be in the past';
    if (checkOut <= checkIn) return 'Check-out must be after check-in';
    return '';
  }, [checkIn, checkOut]);

  const datesReady = Boolean(checkIn && checkOut && !dateValidationError);

  const activeOfferCode = offerApplied?.code;

  const activeRoomIds = selectedRoomIds.length ? selectedRoomIds : [roomId];

  const unavailableSelectedRooms = useMemo(
    () => propertyRooms.filter(
      (item) => activeRoomIds.includes(item._id) && !isRoomAvailableForDates(item),
    ),
    [propertyRooms, activeRoomIds],
  );

  const hasUnavailableSelection = unavailableSelectedRooms.length > 0 || (
    propertyRooms.length > 0 && activeRoomIds.length === 0
  );

  const { pricing, loading: pricingLoading, error: pricingError, nights } = useMultiRoomPricing(
    activeRoomIds,
    dateValidationError ? '' : checkIn,
    dateValidationError ? '' : checkOut,
    activeOfferCode,
  );

  useEffect(() => {
    setSelectedRoomIds([roomId]);
  }, [roomId]);

  useEffect(() => {
    setDateError(dateValidationError);
  }, [dateValidationError]);

  useEffect(() => {
    setGuestVerification(defaultGuestVerification(user));
    setWaitlistName(user?.name || '');
    setWaitlistPhone(user?.phone || '');
  }, [user?.id, user?.name, user?.phone, user?.identity_proof]);

  useEffect(() => {
    roomsApi.get(roomId).then(({ data }) => setRoom(data)).catch((err) => {
      setError(err.normalized?.message || 'Room not found');
    }).finally(() => setLoading(false));
  }, [roomId]);

  const photo = room?.photos?.find((p) => p.is_primary) || room?.photos?.[0];
  const location = [room?.location?.area, room?.location?.city].filter(Boolean).join(', ');

  const selectedRooms = useMemo(
    () => propertyRooms.filter((item) => activeRoomIds.includes(item._id)),
    [propertyRooms, activeRoomIds],
  );

  const selectedRoomLabel = useMemo(() => {
    if (selectedRooms.length > 1) {
      return selectedRooms.map((item) => item.room_number).filter(Boolean).join(', ');
    }
    return room?.room_number || '—';
  }, [selectedRooms, room?.room_number]);

  const roomCount = activeRoomIds.length;
  const maxGuestsPerRoom = useMemo(() => {
    if (selectedRooms.length) {
      return selectedRooms.reduce(
        (min, item) => Math.min(min, item.max_guests || room?.max_guests || 10),
        selectedRooms[0]?.max_guests || room?.max_guests || 10,
      );
    }
    return room?.max_guests || 10;
  }, [selectedRooms, room?.max_guests]);

  const maxTotalGuests = useMemo(() => {
    if (selectedRooms.length) {
      return selectedRooms.reduce((sum, item) => sum + (item.max_guests || room?.max_guests || 0), 0);
    }
    return room?.max_guests || 10;
  }, [selectedRooms, room?.max_guests]);

  const totalGuests = Math.min(guestsPerRoom * roomCount, maxTotalGuests);
  const guestsSummaryLabel = roomCount > 1
    ? `${totalGuests} guest${totalGuests !== 1 ? 's' : ''} (${guestsPerRoom} per room)`
    : `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`;

  useEffect(() => {
    setGuestsPerRoom((current) => Math.min(current, maxGuestsPerRoom));
  }, [maxGuestsPerRoom]);

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

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (dateError) return;
    if (!datesReady) {
      setError('Select valid check-in and check-out dates');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service, Privacy Policy, and Cookie Policy to continue');
      return;
    }
    if (hasUnavailableSelection) {
      setError('One or more selected rooms are already booked. Pick an open room from the floor map.');
      scrollToSection('booking-step-room');
      return;
    }

    setError('');
    setVerificationError('');
    try {
      const verificationPayload = await prepareBookingVerification(guestVerification, user);
      setPendingVerificationPayload(verificationPayload);
      setConfirmOpen(true);
    } catch (err) {
      if (err.fieldErrors) {
        setGuestVerification((prev) => ({ ...prev, fieldErrors: err.fieldErrors }));
      }
      setVerificationError(err.message || 'Complete guest verification to continue');
    }
  };

  const handleConfirmBooking = async () => {
    if (!pendingVerificationPayload) return;
    setSubmitting(true);
    setError('');
    setConflictError('');
    setShowWaitlistForm(false);
    const pricingSnapshot = pricing;

    try {
      let bookingsToSettle;
      let allPaidFromServer = false;

      if (pendingPaymentBookingIds?.length) {
        bookingsToSettle = pendingPaymentBookingIds.map((id) => ({
          _id: id,
          payment_status: 'pending',
        }));
      } else {
        const { data } = await bookingsApi.createBatch({
          room_ids: activeRoomIds,
          check_in_date: checkIn,
          check_out_date: checkOut,
          num_guests: totalGuests,
          offer_code: activeOfferCode || undefined,
          ...pendingVerificationPayload,
        });
        bookingsToSettle = Array.isArray(data?.bookings) ? data.bookings : [];
        allPaidFromServer = Boolean(data?.all_paid);
        if (!bookingsToSettle.length) {
          setError('Booking could not be completed. Please try again.');
          return;
        }
        setPendingPaymentBookingIds(bookingsToSettle.map((booking) => booking._id));
      }

      const paidBookings = allPaidFromServer
        && bookingsToSettle.every((booking) => booking.payment_status === 'paid')
        ? bookingsToSettle
        : await settleBatchPayment(bookingsToSettle);

      if (!paidBookings.every((booking) => booking.payment_status === 'paid')) {
        setError('Payment did not complete. Your rooms are reserved — tap confirm to retry payment.');
        return;
      }

      setConfirmOpen(false);
      setPendingPaymentBookingIds(null);
      setConfirmedBookings(paidBookings);
      setConfirmedPricing(pricingSnapshot);
    } catch (err) {
      if (err.normalized?.status === 409) {
        setConflictError(err.normalized.message || 'Room not available for selected dates');
        setShowWaitlistForm(true);
        setPendingPaymentBookingIds(null);
        const name = guestVerification.bookingFor === 'other'
          ? guestVerification.stayingGuestName
          : user?.name;
        const phone = guestVerification.bookingFor === 'other'
          ? guestVerification.stayingGuestPhone
          : user?.phone;
        setWaitlistName(name || '');
        setWaitlistPhone(phone || '');
        setError('');
        setConfirmOpen(false);
      } else if (pendingPaymentBookingIds?.length) {
        setError(
          err.normalized?.message
            || 'Payment could not be completed. Your rooms are reserved — tap confirm to retry payment.',
        );
      } else if (err.normalized) {
        setError(err.normalized.message);
        setConfirmOpen(false);
      } else {
        setError('Booking failed');
        setConfirmOpen(false);
      }
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

  const bookingPricing = confirmedPricing || (confirmedBookings?.length ? {
    subtotal: confirmedBookings.reduce((sum, booking) => sum + (booking.subtotal || 0), 0),
    total_price: confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0),
    gst_amount: confirmedBookings.reduce((sum, booking) => sum + (booking.gst_amount || 0), 0),
    gst_rate: confirmedBookings[0]?.gst_rate,
    price_breakdown: confirmedBookings[0]?.price_breakdown,
    total_nights: confirmedBookings[0]?.total_nights,
    final_price_per_night: confirmedBookings[0]?.final_price_per_night,
    guest_platform_fee: confirmedBookings.reduce((sum, booking) => sum + (booking.guest_platform_fee || 0), 0),
    gst_breakdown: confirmedBookings[0]?.gst_amount ? {
      cgst_amount: confirmedBookings.reduce((sum, booking) => sum + (booking.gst_amount || 0), 0) / 2,
      sgst_amount: confirmedBookings.reduce((sum, booking) => sum + (booking.gst_amount || 0), 0) / 2,
      cgst_rate: (confirmedBookings[0]?.gst_rate || 0) / 2,
      sgst_rate: (confirmedBookings[0]?.gst_rate || 0) / 2,
    } : undefined,
  } : null);

  if (confirmedBookings?.length) {
    const primaryBooking = confirmedBookings[0];
    const totalPaid = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    const roomNumbers = selectedRooms.length
      ? selectedRooms.map((item) => item.room_number).filter(Boolean).join(', ')
      : selectedRoomLabel;

    return (
      <div className="book-room">
        <div className="card" style={{ padding: '2rem', maxWidth: 720, margin: '0 auto', borderColor: 'var(--success, #16a34a)' }}>
          <h1 className="book-room__title" style={{ color: 'var(--success, #16a34a)' }}>
            ✅ Booking Confirmed!
          </h1>
          <div className="book-room__summary-rows" style={{ marginTop: '1.5rem' }}>
            <div className="book-room__summary-row">
              <span>Booking ID{confirmedBookings.length > 1 ? 's' : ''}</span>
              <strong>{confirmedBookings.map((booking) => booking._id).join(', ')}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Room{confirmedBookings.length > 1 ? 's' : ''}</span>
              <strong>{roomNumbers || room.title}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Check-in</span>
              <strong>{formatStayDate(primaryBooking.check_in_date)}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Check-out</span>
              <strong>{formatStayDate(primaryBooking.check_out_date)}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Nights</span>
              <strong>{primaryBooking.total_nights}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>GST</span>
              <strong>{formatCurrency(bookingPricing?.gst_amount || 0)}</strong>
            </div>
            <div className="book-room__summary-row">
              <span>Total paid</span>
              <strong>{formatCurrency(totalPaid)} (incl. GST)</strong>
            </div>
          </div>
          {bookingPricing && (
            <div style={{ marginTop: '1.5rem' }}>
              <PriceBreakdown pricing={bookingPricing} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link to={`/receipt/${primaryBooking._id}`} className="btn btn-primary">
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

      <h1 className="book-room__page-title">Confirm and pay</h1>

      <form className="book-room-layout" onSubmit={handleBook}>
        <div className="book-room__main">
          <section className="book-room__section card" id="booking-step-dates">
            <h2>1. Dates &amp; guests</h2>
            <p className="book-room__section-lead">Choose your stay dates — like picking a show date on BookMyShow.</p>
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
              <label className="label">{roomCount > 1 ? 'Guests per room' : 'Guests'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setGuestsPerRoom((count) => Math.max(1, count - 1))}
                >
                  <Minus size={14} />
                </button>
                <span>{guestsPerRoom}</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setGuestsPerRoom((count) => Math.min(maxGuestsPerRoom, count + 1))}
                >
                  <Plus size={14} />
                </button>
              </div>
              {roomCount > 1 && (
                <p className="book-room__guests-hint">
                  {totalGuests} guest{totalGuests !== 1 ? 's' : ''} total across {roomCount} rooms
                  {' '}(up to {maxTotalGuests})
                </p>
              )}
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

          {datesReady && (
            <section className="book-room__section card" id="booking-step-room">
              <h2>2. Pick your room{activeRoomIds.length > 1 ? 's' : ''}</h2>
              <p className="book-room__section-lead">
                Select one or more adjoining rooms on the floor map — great for families and groups staying together.
              </p>
              <RoomFloorPicker
                roomId={activeRoomIds[0] || roomId}
                currentRoom={room}
                checkIn={checkIn}
                checkOut={checkOut}
                selectedRoomIds={activeRoomIds}
                onChangeSelectedRoomIds={setSelectedRoomIds}
                onPropertyRoomsChange={setPropertyRooms}
              />
            </section>
          )}

          {datesReady && (
            <BookingGuestVerification
              value={guestVerification}
              onChange={setGuestVerification}
              user={user}
              error={verificationError}
            />
          )}

          <section className="book-room__section card" id="booking-step-confirm">
            <h2>4. Confirm &amp; pay</h2>
            <ErrorMessage message={error} />
            {conflictError && (
              <div
                className="host-alert-banner"
                role="alert"
                style={{ marginBottom: '1rem', borderColor: 'var(--danger, #dc2626)', background: 'rgba(220, 38, 38, 0.08)' }}
              >
                <span className="host-alert-banner__dot" aria-hidden="true" style={{ background: 'var(--danger, #dc2626)' }} />
                <div>
                  <strong style={{ color: 'var(--danger, #dc2626)' }}>Room not available for selected dates</strong>
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
                You&apos;re on the waitlist! We&apos;ll notify you.
              </p>
            )}
            <div className="book-room__offer">
              <label className="label" htmlFor="book-room-offer-code">Promo code</label>
              <p className="book-room__offer-lead">Have a code? Apply it here before you pay.</p>
              <div className="book-room__offer-row">
                <input
                  id="book-room-offer-code"
                  className="input"
                  value={offerCode}
                  onChange={(e) => { setOfferCode(e.target.value.toUpperCase()); setOfferApplied(null); setOfferError(''); }}
                  placeholder="e.g. WELCOME10"
                  autoComplete="off"
                />
                <button type="button" className="btn btn-outline" onClick={handleApplyOffer} disabled={applyingOffer}>
                  {applyingOffer ? '…' : 'Apply'}
                </button>
              </div>
              {offerApplied && (
                <p className="book-room__offer-applied">
                  <Check size={14} aria-hidden />
                  {offerApplied.discount_type === 'percentage'
                    ? `${offerApplied.discount_value}% off applied`
                    : `${formatCurrency(offerApplied.discount_value)} off applied`}
                </p>
              )}
              {offerError && <p className="form-error">{offerError}</p>}
            </div>
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
              disabled={submitting || !datesReady || !acceptedTerms || hasUnavailableSelection || !activeRoomIds.length}
            >
              {submitting ? 'Confirming…' : 'Confirm Booking'}
            </button>
          </section>
        </div>

        <aside className="book-room__summary card" aria-label="Booking summary">
          <div className="book-room__summary-header">
            {photo?.url ? (
              <SafeImage src={photo.url} alt={room.title} className="book-room__summary-photo" />
            ) : (
              <div className="book-room__summary-photo book-room__summary-photo--placeholder" aria-hidden />
            )}
            <div className="book-room__summary-header-body">
              <h3>{room.title}</h3>
              {room.avg_rating > 0 && (
                <p className="book-room__summary-rating">
                  <Icon icon={Star} size={ICON.sm} fill="currentColor" />
                  {room.avg_rating.toFixed(2)}
                  {room.total_reviews > 0 && ` (${room.total_reviews})`}
                </p>
              )}
              {location && <p className="book-room__summary-loc">{location}</p>}
            </div>
          </div>

          <div className="book-room__summary-policy">
            <strong>Free cancellation</strong>
            <p>Cancel before check-in for a full refund on eligible bookings.</p>
            <Link to="/help/cancellation">Full policy</Link>
          </div>

          <div className="book-room__summary-rows">
            <div className="book-room__summary-row book-room__summary-row--editable">
              <div className="book-room__summary-row-text">
                <span className="book-room__summary-label">Dates</span>
                <strong>{formatStayRange(checkIn, checkOut)}</strong>
              </div>
              <button
                type="button"
                className="book-room__summary-change"
                onClick={() => scrollToSection('booking-step-dates')}
              >
                Change
              </button>
            </div>
            <div className="book-room__summary-row book-room__summary-row--editable">
              <div className="book-room__summary-row-text">
                <span className="book-room__summary-label">Guests</span>
                <strong>{guestsSummaryLabel}</strong>
              </div>
              <button
                type="button"
                className="book-room__summary-change"
                onClick={() => scrollToSection('booking-step-dates')}
              >
                Change
              </button>
            </div>
            {selectedRoomLabel && (
              <div className="book-room__summary-row">
                <span>Room{activeRoomIds.length > 1 ? 's' : ''}</span>
                <strong>{selectedRoomLabel}</strong>
              </div>
            )}
          </div>

          <h4 className="book-room__summary-price-title">Price details</h4>
          {pricingLoading && <Spinner label="Calculating price…" />}
          {pricing && <PriceBreakdown pricing={pricing} compact />}
          {!pricing && !pricingLoading && (
            <p className="book-room__pricing-loading">
              {datesReady ? 'Select valid dates for pricing' : 'Choose dates to see your total'}
            </p>
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
            ? `Book Room${activeRoomIds.length > 1 ? 's' : ''} ${selectedRoomLabel} for ${formatCurrency(pricing.total_price)} incl. GST?${
              guestVerification.bookingFor === 'other'
                ? ` Checking in: ${guestVerification.stayingGuestName}.`
                : ''
            }`
            : `Confirm booking for Room${activeRoomIds.length > 1 ? 's' : ''} ${selectedRoomLabel || room.title}?`
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
