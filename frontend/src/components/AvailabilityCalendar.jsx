import { useEffect, useMemo, useState } from 'react';
import { fetchBookedDates } from '../api/api';

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isBooked(iso, ranges) {
  return ranges.some((r) => iso >= r.check_in && iso < r.check_out);
}

export default function AvailabilityCalendar({ roomId, visible = true }) {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !visible) return;
    setLoading(true);
    fetchBookedDates(roomId)
      .then((data) => setRanges(data?.ranges || []))
      .catch(() => setRanges([]))
      .finally(() => setLoading(false));
  }, [roomId, visible]);

  const months = useMemo(() => {
    const today = new Date();
    return [0, 1].map((offset) => {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="card" style={{ padding: '0.75rem', marginTop: '0.75rem' }}>
      <p className="label" style={{ marginBottom: '0.5rem' }}>Availability</p>
      {loading ? (
        <p className="listing-muted" style={{ fontSize: '0.85rem' }}>Loading calendar…</p>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {months.map(({ year, month }) => {
            const label = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            const total = daysInMonth(year, month);
            const firstDow = new Date(year, month, 1).getDay();
            const cells = [];
            for (let i = 0; i < firstDow; i += 1) cells.push(null);
            for (let day = 1; day <= total; day += 1) {
              const iso = toIso(year, month, day);
              cells.push({ day, iso, booked: isBooked(iso, ranges) });
            }
            return (
              <div key={`${year}-${month}`} style={{ minWidth: 140 }}>
                <strong style={{ fontSize: '0.8rem' }}>{label}</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 4, fontSize: '0.7rem' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                    <span key={d} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{d}</span>
                  ))}
                  {cells.map((cell, idx) => (
                    cell ? (
                      <span
                        key={cell.iso}
                        style={{
                          textAlign: 'center',
                          padding: '2px 0',
                          borderRadius: 4,
                          background: cell.booked ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.12)',
                          color: cell.booked ? '#dc2626' : '#16a34a',
                          textDecoration: cell.booked ? 'line-through' : 'none',
                        }}
                        title={cell.booked ? 'Booked' : 'Available'}
                      >
                        {cell.day}
                      </span>
                    ) : <span key={`e-${idx}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="listing-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
        <span style={{ color: '#16a34a' }}>■</span> Available &nbsp;
        <span style={{ color: '#dc2626' }}>■</span> Booked
      </p>
    </div>
  );
}
