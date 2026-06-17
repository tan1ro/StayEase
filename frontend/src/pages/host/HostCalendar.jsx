import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Icon, ICON } from '../../components/ui/Icon';
import { bookingsApi, formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { daysInMonth, toISODate, BOOKING_CALENDAR_MONTHS, isMonthInBookingWindow } from '../../utils/dates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HostCalendar() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      roomsApi.byHost(user.id || user._id),
      bookingsApi.list(),
    ])
      .then(([roomsRes, bookingsRes]) => {
        setRooms(roomsRes.data);
        setBookings(bookingsRes.data || []);
        if (roomsRes.data.length) setSelectedRoom(roomsRes.data[0]);
      })
      .catch((err) => setError(err.normalized?.message || 'Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [user]);

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
  const today = toISODate(new Date());
  const basePrice = selectedRoom?.price_per_night || 0;
  const weekendPrice = Math.round(basePrice * 1.04);

  if (loading) return <Spinner label="Loading calendar..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="host-page host-calendar">
      <div className="host-calendar__main">
        <header className="host-calendar__header">
          <div className="host-calendar__month-nav">
            <button type="button" onClick={prevMonth} disabled={!canPrevMonth} aria-label="Previous month">
              <Icon icon={ChevronLeft} size={ICON.md} />
            </button>
            <h1>{monthLabel}</h1>
            <button type="button" onClick={nextMonth} disabled={!canNextMonth} aria-label="Next month">
              <Icon icon={ChevronRight} size={ICON.md} />
            </button>
          </div>
          {rooms.length > 1 && (
            <select
              className="select host-calendar__room-select"
              value={selectedRoom?._id || ''}
              onChange={(e) => setSelectedRoom(rooms.find((r) => r._id === e.target.value))}
            >
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>{r.title || r.room_number}</option>
              ))}
            </select>
          )}
        </header>

        <div className="host-calendar__grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="host-calendar__weekday">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="host-calendar__cell host-calendar__cell--empty" />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const iso = toISODate(new Date(year, month, day));
            const dow = new Date(year, month, day).getDay();
            const isWeekend = dow === 5 || dow === 6;
            const price = isWeekend ? weekendPrice : basePrice;
            const booked = bookedDates.has(iso);
            return (
              <div
                key={iso}
                className={[
                  'host-calendar__cell',
                  iso === today && 'host-calendar__cell--today',
                  booked && 'host-calendar__cell--booked',
                ].filter(Boolean).join(' ')}
              >
                <span className="host-calendar__day">{day}</span>
                {!booked && price > 0 && (
                  <span className="host-calendar__price">
                    {price >= 1000 ? `₹${(price / 1000).toFixed(1)}K` : formatCurrency(price)}
                  </span>
                )}
                {booked && <span className="host-calendar__booked-label">Booked</span>}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="host-calendar__sidebar">
        <button type="button" className="host-calendar__sidebar-row">
          <div>
            <strong>Pricing</strong>
            <p>{formatCurrency(basePrice)} – {formatCurrency(weekendPrice)} per night</p>
          </div>
          <Icon icon={ChevronRight} size={ICON.sm} />
        </button>
        <button type="button" className="host-calendar__sidebar-row">
          <div>
            <strong>Discounts</strong>
            <p>Manage in Offers — weekly &amp; monthly stays</p>
          </div>
          <Icon icon={ChevronRight} size={ICON.sm} />
        </button>
        <button type="button" className="host-calendar__sidebar-row">
          <div>
            <strong>Availability</strong>
            <p>Book up to {BOOKING_CALENDAR_MONTHS} months ahead · Same-day notice</p>
          </div>
          <Icon icon={ChevronRight} size={ICON.sm} />
        </button>
      </aside>
    </div>
  );
}
