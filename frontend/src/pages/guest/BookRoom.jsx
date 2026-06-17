import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, Receipt, ShieldCheck, Star } from 'lucide-react';
import PriceBreakdown from '../../components/PriceBreakdown';
import CancellationPolicy from '../../components/CancellationPolicy';
import DatePicker from '../../components/DatePicker';
import RoomBadges from '../../components/RoomBadges';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import WaitlistModal from '../../components/WaitlistModal';
import SafeImage from '../../components/SafeImage';
import BookingGuestVerification, {
  defaultGuestVerification,
  prepareBookingVerification,
} from '../../components/BookingGuestVerification';
import { Icon, ICON } from '../../components/ui/Icon';
import { bookingsApi, formatCurrency, roomsApi } from '../../api/api';
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
  const [hostMessage, setHostMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [guestVerification, setGuestVerification] = useState(() => defaultGuestVerification(user));
  const [verificationError, setVerificationError] = useState('');

  const dateValidationError = useMemo(() => {
    if (!checkIn || !checkOut) return '';
    const today = todayISO();
    if (checkIn < today) return 'Check-in cannot be in the past';
    if (checkOut <= checkIn) return 'Check-out must be after check-in';
    return '';
  }, [checkIn, checkOut]);

  const { pricing, loading: pricingLoading, error: pricingError, nights } = useRoomPricing(
    roomId,
    dateValidationError ? '' : checkIn,
    dateValidationError ? '' : checkOut,
    offerCode,
  );

  useEffect(() => {
    setDateError(dateValidationError);
  }, [dateValidationError]);

  useEffect(() => {
    if (!user) return;
    setGuestVerification((prev) => ({
      ...defaultGuestVerification(user),
      bookingFor: prev.bookingFor,
      stayingGuestName: prev.stayingGuestName,
      stayingGuestPhone: prev.stayingGuestPhone,
      idType: prev.idType,
      idNumber: prev.idNumber,
      useSavedId: user?.identity_proof?.document_url ? prev.useSavedId : false,
    }));
  }, [user?.id, user?.identity_proof?.document_url]);

  useEffect(() => {
    roomsApi.get(roomId).then(({ data }) => setRoom(data)).catch((err) => {
      setError(err.normalized?.message || 'Room not found');
    }).finally(() => setLoading(false));
  }, [roomId]);

  const photo = room?.photos?.find((p) => p.is_primary) || room?.photos?.[0];
  const location = [room?.location?.area, room?.location?.city].filter(Boolean).join(', ');

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (dateError) return;
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setSubmitting(true);
    setError('');
    setVerificationError('');
    try {
      const verificationPayload = await prepareBookingVerification(guestVerification, user);
      const { data } = await bookingsApi.create({
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: guests,
        offer_code: offerCode || undefined,
        host_message: hostMessage.trim() || undefined,
        ...verificationPayload,
      });
      navigate(`/receipt/${data._id}`);
    } catch (err) {
      if (err.normalized?.status === 409) {
        setWaitlistOpen(true);
      } else if (err.normalized) {
        setError(err.normalized.message);
      } else {
        if (err.fieldErrors) {
          setGuestVerification((prev) => ({ ...prev, fieldErrors: err.fieldErrors }));
        }
        setVerificationError(err.message || 'Booking failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading booking..." />;
  if (!room) return <ErrorMessage message={error || 'Room not found'} />;

  return (
    <div className="book-room">
      <Link to={`/rooms/${roomId}`} className="book-room__back">
        <Icon icon={ArrowLeft} size={ICON.md} />
        Back to listing
      </Link>

      <h1 className="book-room__title">Request to book</h1>
      <p className="book-room__subtitle">
        Complete your StayEase reservation with GST-inclusive pricing and instant confirmation.
      </p>

      <form className="book-room-layout" onSubmit={handleBook}>
        <div className="book-room__main">
          <section className="book-room__section card">
            <h2>Write a message to your host</h2>
            <p className="book-room__section-lead">
              Share why you&apos;re visiting {room.location?.city || 'the area'} and any special requests.
            </p>
            <textarea
              className="textarea book-room__message"
              value={hostMessage}
              onChange={(e) => setHostMessage(e.target.value)}
              placeholder={`Hi! I'm planning a stay from ${formatStayDate(checkIn) || '…'} to ${formatStayDate(checkOut) || '…'}. Looking forward to my visit.`}
              rows={4}
              maxLength={500}
            />
            <span className="form-hint">{hostMessage.length}/500</span>
          </section>

          <BookingGuestVerification
            user={user}
            value={guestVerification}
            onChange={setGuestVerification}
            error={verificationError}
          />

          <section className="book-room__section card">
            <h2>Your trip</h2>
            {dateError && <ErrorMessage message={dateError} />}
            {pricingError && (
              <ErrorMessage
                message={pricingError}
                onRetry={() => setOfferCode((code) => code)}
              />
            )}
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
            <div className="form-row">
              <div className="form-group">
                <label className="label">Guests</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={room.max_guests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="label">Offer code (optional)</label>
                <input
                  className="input"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value)}
                  placeholder="e.g. WELCOME10"
                />
              </div>
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
            <h2>Proceed to payment</h2>
            <p className="book-room__section-lead">
              You&apos;ll receive a GST invoice by email and a WhatsApp confirmation once your booking is confirmed.
            </p>
            <ul className="book-room__perks">
              <li><Icon icon={Receipt} size={ICON.sm} /> CGST &amp; SGST invoice included</li>
              <li><Icon icon={MessageCircle} size={ICON.sm} /> WhatsApp alerts to you and your host</li>
              <li><Icon icon={ShieldCheck} size={ICON.sm} /> Secure payment on StayEase</li>
            </ul>
            <ErrorMessage message={error} />
            <CancellationPolicy policy={room.policies?.cancellation || 'moderate'} />
            <label className="book-room__terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="book-room__terms-text">
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>
                , including billing and cancellation charges.
              </span>
            </label>
            <button
              type="submit"
              className="btn btn-primary book-room__submit"
              disabled={submitting || !!dateError || !acceptedTerms || !checkIn || !checkOut}
            >
              {submitting ? 'Confirming…' : 'Confirm booking'}
            </button>
            <p className="book-room__pay-note">
              By selecting the button, I agree to the booking terms. You won&apos;t be charged until the booking is confirmed.
            </p>
          </section>
        </div>

        <aside className="book-room__summary card">
          <div className="book-room__summary-header">
            {photo?.url ? (
              <SafeImage src={photo.url} alt="" className="book-room__summary-photo" />
            ) : (
              <div className="book-room__summary-photo book-room__summary-photo--placeholder" />
            )}
            <div>
              <h3>{room.title}</h3>
              {location && (
                <p className="book-room__summary-loc">
                  <Icon icon={MapPin} size={ICON.sm} />
                  {location}
                </p>
              )}
              {room.avg_rating > 0 && (
                <p className="book-room__summary-rating">
                  <Icon icon={Star} size={ICON.sm} />
                  {room.avg_rating.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="book-room__summary-rows">
            <div className="book-room__summary-row">
              <span>Dates</span>
              <strong>
                {checkIn && checkOut
                  ? `${formatStayDate(checkIn)} – ${formatStayDate(checkOut)}`
                  : 'Select dates'}
              </strong>
            </div>
            <div className="book-room__summary-row">
              <span>Guests</span>
              <strong>{guests} guest{guests !== 1 ? 's' : ''}</strong>
            </div>
            {nights > 0 && (
              <div className="book-room__summary-row">
                <span>Duration</span>
                <strong>{nights} night{nights !== 1 ? 's' : ''}</strong>
              </div>
            )}
          </div>

          {pricingLoading && <p className="book-room__pricing-loading">Updating price…</p>}
          {pricing && <PriceBreakdown pricing={pricing} compact />}
          {!pricing && !pricingLoading && checkIn && checkOut && !dateError && (
            <p className="book-room__pricing-loading">Enter valid dates to see GST-inclusive total</p>
          )}
          {pricing && (
            <p className="book-room__gst-note">
              Price includes applicable CGST &amp; SGST for Indian hotel stays.
            </p>
          )}
        </aside>
      </form>

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        roomId={roomId}
        checkIn={checkIn}
        checkOut={checkOut}
        guestName={user?.name}
        guestPhone={user?.phone}
      />
    </div>
  );
}
