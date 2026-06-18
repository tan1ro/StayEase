import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostPage,
  HostPanel,
} from '../../components/host/HostPageLayout';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Icon, ICON } from '../../components/ui/Icon';
import { bookingsApi, formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  BOOKING_CALENDAR_MONTHS,
  compareISO,
  daysInMonth,
  formatDisplayDate,
  isMonthInBookingWindow,
  toISODate,
  todayISO,
} from '../../utils/dates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function bookingForNight(bookings, iso) {
  return bookings.find((b) => iso >= b.check_in_date && iso < b.check_out_date);
}

export default function HostCalendar() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!user) return Promise.resolve();
    setLoading(true);
    setError('');
    return Promise.all([
      roomsApi.byHost(user.id || user._id),
      bookingsApi.list(),
    ])
      .then(([roomsRes, bookingsRes]) => {
        setRooms(roomsRes.data || []);
        setBookings(bookingsRes.data || []);
        setSelectedRoom((prev) => {
          if (prev && roomsRes.data?.some((r) => r._id === prev._id)) {
            return roomsRes.data.find((r) => r._id === prev._id);
          }
          return roomsRes.data?.[0] || null;
        });
      })
      .catch((err) => setError(err.normalized?.message || 'Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const roomBookings = useMemo(
    () => bookings.filter((b) => b.room_id === selectedRoom?._id && b.status !== 'cancelled'),
    [bookings, selectedRoom],
  );

  const bookedDates = useMemo(() => {
    const set = new Set();
    roomBookings.forEach((b) => {
      const start = new Date(b.check_in_date);
      const end = new Date(b.check_out_date);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        set.add(toISODate(d));
      }
    });
    return set;
  }, [roomBookings]);

  const blockedDates = useMemo(
    () => new Set(selectedRoom?.blocked_dates || []),
    [selectedRoom],
  );

  const selectedBooking = useMemo(
    () => bookingForNight(roomBookings, selectedDate),
    [roomBookings, selectedDate],
  );

  const isSelectedBlocked = blockedDates.has(selectedDate);
  const isSelectedBooked = bookedDates.has(selectedDate);
  const isPast = compareISO(selectedDate, todayISO()) < 0;

  const toggleBlockedDate = async () => {
    if (!selectedRoom || isPast || isSelectedBooked) return;
    setSaving(true);
    setActionError('');
    const next = new Set(blockedDates);
    if (next.has(selectedDate)) next.delete(selectedDate);
    else next.add(selectedDate);
    const blockedList = [...next].sort();
    try {
      const { data } = await roomsApi.update(selectedRoom._id, { blocked_dates: blockedList });
      setSelectedRoom(data);
      setRooms((prev) => prev.map((r) => (r._id === data._id ? data : r)));
    } catch (err) {
      setActionError(err.normalized?.message || 'Could not update availability');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      if (!isMonthInBookingWindow(year - 1, 11)) return;
      setMonth(11);
      setYear((y) => y - 1);
    } else if (isMonthInBookingWindow(year, month - 1)) {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      if (!isMonthInBookingWindow(year + 1, 0)) return;
      setMonth(0);
      setYear((y) => y + 1);
    } else if (isMonthInBookingWindow(year, month + 1)) {
      setMonth((m) => m + 1);
    }
  };

  const canPrevMonth = isMonthInBookingWindow(
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1,
  );
  const canNextMonth = isMonthInBookingWindow(
    month === 11 ? year + 1 : year,
    month === 11 ? 0 : month + 1,
  );

  const monthLabel = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const today = todayISO();
  const basePrice = selectedRoom?.price_per_night || 0;
  const weekendPrice = Math.round(basePrice * 1.04);
  const roomId = selectedRoom?._id;
  const blockedCount = blockedDates.size;

  if (loading) return <Spinner label="Loading calendar..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  if (!rooms.length) {
    return (
      <HostPage>
        <HostHero title="Calendar" subtitle="Manage availability, pricing, and blocked dates." />
        <div className="host-dashboard__empty">
          <h3 style={{ margin: '0 0 0.5rem' }}>Create a listing first</h3>
          <p style={{ margin: '0 0 1rem' }}>Your calendar fills in once you add rooms to StayEase.</p>
          <Link to="/host/rooms/add" className="btn btn-primary">
            <Icon icon={Plus} size={ICON.sm} /> Create listing
          </Link>
        </div>
      </HostPage>
    );
  }

  return (
    <HostPage>
      <HostHero
        title="Calendar"
        subtitle="Block dates, review bookings, and manage nightly rates by room."
        pills={[
          selectedRoom?.title || 'Select room',
          `${roomBookings.length} bookings`,
          `${bookedDates.size} booked nights`,
        ]}
      />

      <HostKpiGrid>
        <HostKpi icon={CalendarDays} variant="bookings" label="Bookings" value={roomBookings.length} hint="This room" />
        <HostKpi icon={CalendarDays} variant="occupancy" label="Booked nights" value={bookedDates.size} hint={monthLabel} />
        <HostKpi icon={CalendarDays} variant="earnings" label="Base rate" value={formatCurrency(basePrice)} hint={`Weekend ${formatCurrency(weekendPrice)}`} />
        <HostKpi icon={CalendarDays} variant="rating" label="Blocked" value={blockedCount} hint="Manual blocks" />
      </HostKpiGrid>

      <div className="host-calendar__layout">
        <HostPanel
          title={monthLabel}
          subtitle="Tap a date to view details or block availability"
          actions={(
            <div className="host-calendar__toolbar">
              <select
                className="select host-calendar__room-select"
                value={roomId || ''}
                onChange={(e) => {
                  const room = rooms.find((r) => r._id === e.target.value);
                  setSelectedRoom(room || null);
                  setSelectedDate(today);
                }}
                aria-label="Select room"
              >
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>{r.title || r.room_number}</option>
                ))}
              </select>
              <div className="host-calendar__month-nav">
                <button type="button" onClick={prevMonth} disabled={!canPrevMonth} aria-label="Previous month">
                  <Icon icon={ChevronLeft} size={ICON.md} />
                </button>
                <button type="button" onClick={nextMonth} disabled={!canNextMonth} aria-label="Next month">
                  <Icon icon={ChevronRight} size={ICON.md} />
                </button>
              </div>
            </div>
          )}
        >
          <div className="host-calendar__legend">
            <span><i className="host-calendar__swatch host-calendar__swatch--available" aria-hidden /> Available</span>
            <span><i className="host-calendar__swatch host-calendar__swatch--booked" aria-hidden /> Booked</span>
            <span><i className="host-calendar__swatch host-calendar__swatch--blocked" aria-hidden /> Blocked</span>
            <span><i className="host-calendar__swatch host-calendar__swatch--selected" aria-hidden /> Selected</span>
          </div>

          <div className="host-calendar__grid">
            {WEEKDAYS.map((d) => (
              <div key={d} className="host-calendar__weekday">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="host-calendar__cell host-calendar__cell--empty" aria-hidden />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const iso = toISODate(new Date(year, month, day));
              const dow = new Date(year, month, day).getDay();
              const isWeekend = dow === 5 || dow === 6;
              const price = isWeekend ? weekendPrice : basePrice;
              const booked = bookedDates.has(iso);
              const blocked = blockedDates.has(iso);
              const isPastDay = compareISO(iso, today) < 0;
              const isSelected = iso === selectedDate;

              return (
                <button
                  key={iso}
                  type="button"
                  className={[
                    'host-calendar__cell',
                    iso === today && 'host-calendar__cell--today',
                    booked && 'host-calendar__cell--booked',
                    blocked && !booked && 'host-calendar__cell--blocked',
                    isPastDay && 'host-calendar__cell--past',
                    isSelected && 'host-calendar__cell--selected',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDate(iso)}
                  aria-label={`${formatDisplayDate(iso, { short: true })}${booked ? ', booked' : blocked ? ', blocked' : ', available'}`}
                  aria-pressed={isSelected}
                >
                  <span className="host-calendar__day">{day}</span>
                  {!booked && !blocked && price > 0 && (
                    <span className="host-calendar__price">
                      {price >= 1000 ? `₹${(price / 1000).toFixed(1)}K` : formatCurrency(price)}
                    </span>
                  )}
                  {booked && <span className="host-calendar__booked-label">Booked</span>}
                  {blocked && !booked && <span className="host-calendar__blocked-label">Blocked</span>}
                </button>
              );
            })}
          </div>
        </HostPanel>

        <aside className="host-calendar__sidebar">
          <HostPanel title={formatDisplayDate(selectedDate, { short: true })} subtitle="Selected date">
            {selectedBooking ? (
              <>
                <p className="host-calendar__detail-status host-calendar__detail-status--booked">Booked</p>
                <p className="host-calendar__detail-meta">
                  {formatDisplayDate(selectedBooking.check_in_date, { short: true })}
                  {' – '}
                  {formatDisplayDate(selectedBooking.check_out_date, { short: true })}
                </p>
                <p className="host-calendar__detail-meta">Guest: {selectedBooking.guest_name || 'Guest'}</p>
                <p className="host-calendar__detail-meta">
                  {formatCurrency(selectedBooking.total_price || 0)} · {selectedBooking.status}
                </p>
                <Link to="/host/bookings" className="btn btn-outline btn-sm">View bookings</Link>
              </>
            ) : isSelectedBlocked ? (
              <>
                <p className="host-calendar__detail-status host-calendar__detail-status--blocked">Blocked</p>
                <p className="host-calendar__detail-meta">Guests cannot book this night.</p>
                {!isPast && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={toggleBlockedDate} disabled={saving}>
                    {saving ? 'Saving…' : 'Unblock date'}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="host-calendar__detail-status">Available</p>
                <p className="host-calendar__detail-meta">
                  {formatCurrency(basePrice)} base · {formatCurrency(weekendPrice)} weekend
                </p>
                {!isPast && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={toggleBlockedDate} disabled={saving}>
                    {saving ? 'Saving…' : 'Block date'}
                  </button>
                )}
              </>
            )}
            <ErrorMessage message={actionError} />
          </HostPanel>

          <HostPanel title="Quick links">
            <div className="host-calendar__links">
              <Link
                to={roomId ? `/host/rooms/${roomId}/editor?tab=space&section=pricing` : '/host/rooms'}
                className="host-calendar__sidebar-row"
              >
                <div>
                  <strong>Pricing</strong>
                  <p>{formatCurrency(basePrice)} – {formatCurrency(weekendPrice)} per night</p>
                </div>
                <Icon icon={ChevronRight} size={ICON.sm} />
              </Link>
              <Link to="/host/offers" className="host-calendar__sidebar-row">
                <div>
                  <strong>Discounts</strong>
                  <p>Weekly &amp; monthly stay offers</p>
                </div>
                <Icon icon={ChevronRight} size={ICON.sm} />
              </Link>
              <Link
                to={roomId ? `/host/rooms/${roomId}/editor?tab=space&section=availability` : '/host/rooms'}
                className="host-calendar__sidebar-row"
              >
                <div>
                  <strong>Availability</strong>
                  <p>
                    {selectedRoom?.is_available ? 'Published' : 'Unpublished'}
                    {' · '}
                    Book up to {BOOKING_CALENDAR_MONTHS} months ahead
                  </p>
                </div>
                <Icon icon={ChevronRight} size={ICON.sm} />
              </Link>
              <Link
                to={roomId ? `/host/rooms/${roomId}/editor` : '/host/rooms'}
                className="host-calendar__sidebar-row"
              >
                <div>
                  <strong>Listing editor</strong>
                  <p>Photos, amenities, arrival guide</p>
                </div>
                <Icon icon={ChevronRight} size={ICON.sm} />
              </Link>
            </div>
          </HostPanel>
        </aside>
      </div>
    </HostPage>
  );
}
