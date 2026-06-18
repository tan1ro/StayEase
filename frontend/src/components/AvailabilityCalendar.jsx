import { useEffect, useMemo, useState } from 'react';
import { fetchBookedDates } from '../api/api';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isoFromParts(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(isoFromParts(year, month, day));
  }
  return cells;
}

function isBooked(iso, ranges) {
  return ranges.some((range) => iso >= range.check_in_date && iso < range.check_out_date);
}

export default function AvailabilityCalendar({ roomId, open }) {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (!open || !roomId) return;
    setLoading(true);
    fetchBookedDates(roomId)
      .then((data) => setRanges(Array.isArray(data) ? data : []))
      .catch(() => setRanges([]))
      .finally(() => setLoading(false));
  }, [open, roomId]);

  const months = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    return [
      { year: base.getFullYear(), month: base.getMonth(), label: base.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
      { year: next.getFullYear(), month: next.getMonth(), label: next.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
    ];
  }, [monthOffset, today]);

  if (!open) return null;

  return (
    <div className="card date-picker availability-calendar">
      <div className="availability-calendar__toolbar">
        <strong style={{ fontSize: '0.85rem' }}>Availability</strong>
        <div className="availability-calendar__nav">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMonthOffset((m) => m - 1)} aria-label="Previous month">‹</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMonthOffset((m) => m + 1)} aria-label="Next month">›</button>
        </div>
      </div>
      {loading ? (
        <p className="listing-muted">Loading calendar…</p>
      ) : (
        <div className="availability-calendar__months">
          {months.map(({ year, month, label }) => (
            <div key={`${year}-${month}`}>
              <div className="form-hint availability-calendar__month-label">{label}</div>
              <div className="availability-calendar__grid">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="listing-muted availability-calendar__weekday">{d}</span>
                ))}
                {buildMonthDays(year, month).map((iso, idx) => {
                  if (!iso) return <span key={`pad-${idx}`} />;
                  const booked = isBooked(iso, ranges);
                  const past = iso < today.toISOString().slice(0, 10);
                  const dayClass = [
                    'availability-calendar__day',
                    booked ? 'availability-calendar__day--booked' : '',
                    past ? 'availability-calendar__day--past' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <span key={iso} className={dayClass}>
                      {Number(iso.slice(-2))}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="form-hint" style={{ marginTop: '0.5rem' }}>
        <span style={{ color: 'var(--success)' }}>Green</span> = available · <span style={{ textDecoration: 'line-through' }}>Struck</span> = booked
      </p>
    </div>
  );
}
