import { Link } from 'react-router-dom';
import {
  Beef,
  Building2,
  CalendarClock,
  Check,
  Clock,
  DoorOpen,
  IndianRupee,
  Leaf,
  LogIn,
  LogOut,
  Mountain,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  TreePine,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  X,
} from 'lucide-react';
import { formatCurrency } from '../api/api';
import Modal from './Modal';

const FOOD_LABELS = {
  veg: { label: 'Veg Only', icon: Leaf },
  nonveg: { label: 'Non-Veg', icon: Beef },
  both: { label: 'Veg & Non-Veg', icon: UtensilsCrossed },
};

const CANCELLATION_LABELS = {
  flexible: { label: 'Flexible', icon: ShieldCheck },
  moderate: { label: 'Moderate', icon: Shield },
  strict: { label: 'Strict', icon: ShieldAlert },
};

const VIEW_LABELS = {
  hill_view: { label: 'Hill View', icon: Mountain },
  beach_view: { label: 'Beach & Sea View', icon: Waves },
  sea_view: { label: 'Beach & Sea View', icon: Waves },
  garden_view: { label: 'Garden View', icon: TreePine },
  city_view: { label: 'City View', icon: Building2 },
  pool_view: { label: 'Pool View', icon: Waves },
};

function formatCategory(value) {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime12(time) {
  if (!time) return '—';
  const [hourStr, minuteStr = '00'] = time.split(':');
  const hour = Number(hourStr);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${ampm}`;
}

function CompareValue({ icon: Icon, children, muted = false }) {
  return (
    <span
      className={muted ? 'listing-muted' : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', verticalAlign: 'middle' }}
    >
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden />}
      <span>{children}</span>
    </span>
  );
}

function BoolValue({ ok, yesLabel = 'Yes', noLabel = 'No', yesIcon: YesIcon = Check, noIcon: NoIcon = X }) {
  if (ok) {
    return (
      <CompareValue icon={YesIcon}>
        <span style={{ color: 'var(--success, #16a34a)' }}>{yesLabel}</span>
      </CompareValue>
    );
  }
  return (
    <CompareValue icon={NoIcon} muted>
      {noLabel}
    </CompareValue>
  );
}

function FeatureLabel({ icon: Icon, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden style={{ opacity: 0.75 }} />}
      <strong>{children}</strong>
    </span>
  );
}

function foodCell(room) {
  const cfg = FOOD_LABELS[room.food_preference];
  if (!cfg) return <CompareValue muted>—</CompareValue>;
  return <CompareValue icon={cfg.icon}>{cfg.label}</CompareValue>;
}

function viewCell(room) {
  const cfg = VIEW_LABELS[room.view_type];
  if (!cfg) return <CompareValue muted>—</CompareValue>;
  return <CompareValue icon={cfg.icon}>{cfg.label}</CompareValue>;
}

function cancellationCell(room) {
  const key = room.policies?.cancellation || 'moderate';
  const cfg = CANCELLATION_LABELS[key] || {
    label: formatCategory(key),
    icon: Shield,
  };
  return <CompareValue icon={cfg.icon}>{cfg.label}</CompareValue>;
}

function hasWifi(room) {
  return (room.amenities || []).some((a) => /wifi/i.test(a));
}

export default function CompareRoomsModal({ open, onClose, rooms }) {
  if (!rooms?.length) return null;

  const rows = [
    {
      label: 'Price / night',
      icon: IndianRupee,
      render: (r) => (
        <CompareValue icon={IndianRupee}>
          <strong>{formatCurrency(r.price_per_night)}</strong>
        </CompareValue>
      ),
    },
    {
      label: 'Room type',
      icon: Building2,
      render: (r) => (
        <CompareValue icon={Building2}>{formatCategory(r.room_category)}</CompareValue>
      ),
    },
    {
      label: 'Max guests',
      icon: Users,
      render: (r) => (
        <CompareValue icon={Users}>{r.max_guests ?? '—'}</CompareValue>
      ),
    },
    {
      label: 'Food',
      icon: UtensilsCrossed,
      render: foodCell,
    },
    {
      label: 'View',
      icon: Mountain,
      render: viewCell,
    },
    {
      label: 'Rating',
      icon: Star,
      render: (r) => (
        r.avg_rating ? (
          <CompareValue icon={Star}>
            <strong>{r.avg_rating.toFixed(1)}</strong>
            <span className="listing-muted" style={{ fontSize: '0.85rem' }}>/ 5</span>
          </CompareValue>
        ) : (
          <CompareValue muted>—</CompareValue>
        )
      ),
    },
    {
      label: 'Balcony',
      icon: DoorOpen,
      render: (r) => <BoolValue ok={r.has_balcony} yesLabel="Balcony" noLabel="No balcony" yesIcon={DoorOpen} />,
    },
    {
      label: 'WiFi',
      icon: Wifi,
      render: (r) => <BoolValue ok={hasWifi(r)} yesLabel="WiFi" noLabel="No WiFi" yesIcon={Wifi} />,
    },
    {
      label: 'Check-in',
      icon: LogIn,
      render: (r) => (
        <CompareValue icon={Clock}>{formatTime12(r.policies?.check_in_time || '14:00')}</CompareValue>
      ),
    },
    {
      label: 'Check-out',
      icon: LogOut,
      render: (r) => (
        <CompareValue icon={Clock}>{formatTime12(r.policies?.check_out_time || '11:00')}</CompareValue>
      ),
    },
    {
      label: 'Cancellation',
      icon: CalendarClock,
      render: cancellationCell,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare rooms" size="lg">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table compare-rooms-table">
          <thead>
            <tr>
              <th><FeatureLabel icon={Building2}>Feature</FeatureLabel></th>
              {rooms.map((r) => (
                <th key={r._id || r.id}>{r.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>
                  <FeatureLabel icon={row.icon}>{row.label}</FeatureLabel>
                </td>
                {rooms.map((r) => (
                  <td key={`${r._id}-${row.label}`}>{row.render(r)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td />
              {rooms.map((r) => (
                <td key={`book-${r._id}`}>
                  <Link to={`/rooms/${r._id || r.id}`} className="btn btn-primary btn-sm" onClick={onClose}>
                    Book
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <style>{`
        .compare-rooms-table td,
        .compare-rooms-table th {
          vertical-align: middle;
        }
        .compare-rooms-table tbody tr:hover {
          background: var(--bg-secondary, rgba(0,0,0,0.03));
        }
      `}</style>
    </Modal>
  );
}
