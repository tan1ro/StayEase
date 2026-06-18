import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Building2, Calendar, IndianRupee, Plus, Star } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import { Icon, ICON } from '../../components/ui/Icon';
import { analyticsApi, bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const CHART_BLUE = '#1A6BFF';

function formatStayRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
      <strong>{label}</strong>
      <div>Revenue: {formatCurrency(payload[0]?.value ?? 0)}</div>
    </div>
  );
}

export default function HostDashboard() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const [dashRes, bookingsRes] = await Promise.all([
        analyticsApi.dashboard(),
        bookingsApi.list({ host_id: hostId }),
      ]);
      setStats(dashRes.data);
      setBookings((bookingsRes.data || []).slice(0, 5));
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => { load(); }, [load]);

  const revenueChart = useMemo(
    () => (stats?.monthly_revenue || []).map((m) => ({
      name: m.month,
      revenue: m.revenue ?? 0,
    })),
    [stats],
  );

  const firstName = user?.name?.split(' ')[0] || 'Host';

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!stats) return <ErrorMessage message="No dashboard data available." onRetry={load} />;

  return (
    <div className="host-page host-dashboard">
      <header className="host-dashboard__hero">
        <div className="host-dashboard__hero-text">
          <h1>Welcome back, {firstName}</h1>
          <p>Your hosting performance at a glance — live data from StayEase.</p>
        </div>
        <div className="host-dashboard__hero-meta">
          <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
            <Icon icon={Plus} size={ICON.sm} /> Add room
          </Link>
        </div>
      </header>

      <div className="host-dashboard__kpis" style={{ marginBottom: '1rem' }}>
        <Link to="/host/rooms/add" className="host-dashboard__action">
          <Icon icon={Plus} size={ICON.sm} /> Add Room
        </Link>
        <Link to="/host/rooms" className="host-dashboard__action">
          <Icon icon={Building2} size={ICON.sm} /> Manage Rooms
        </Link>
        <Link to="/host/bookings" className="host-dashboard__action">
          <Icon icon={Calendar} size={ICON.sm} /> View Bookings
        </Link>
        <Link to="/host/analytics" className="host-dashboard__action">
          <Icon icon={BarChart3} size={ICON.sm} /> Analytics
        </Link>
      </div>

      <div className="host-dashboard__kpis host-dashboard__kpis--wide">
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
            <Icon icon={Building2} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Total Rooms</div>
            <div className="host-dashboard__kpi-value">{stats.total_rooms ?? 0}</div>
            <div className="host-dashboard__kpi-hint">{stats.available_rooms ?? 0} live</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--occupancy">
            <Icon icon={Calendar} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Active Bookings</div>
            <div className="host-dashboard__kpi-value">{stats.active_bookings ?? 0}</div>
            <div className="host-dashboard__kpi-hint">{stats.confirmed_bookings ?? 0} confirmed</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
            <Icon icon={IndianRupee} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Total Revenue</div>
            <div className="host-dashboard__kpi-value">{formatCurrency(stats.total_revenue ?? 0)}</div>
            <div className="host-dashboard__kpi-hint">All paid bookings</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--rating">
            <Icon icon={Star} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Avg Rating</div>
            <div className="host-dashboard__kpi-value">{Number(stats.avg_rating ?? 0).toFixed(1)}</div>
            <div className="host-dashboard__kpi-hint">Across all listings</div>
          </div>
        </article>
      </div>

      <section className="host-dashboard__panel">
        <div className="host-dashboard__panel-head">
          <h2>Monthly revenue</h2>
          <span>Bar chart from your paid bookings</span>
        </div>
        {revenueChart.every((m) => m.revenue === 0) ? (
          <div className="host-dashboard__empty">Revenue data appears once you receive paid bookings.</div>
        ) : (
          <div className="host-dashboard__chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="host-dashboard__panel" style={{ marginTop: '1.25rem' }}>
        <div className="host-dashboard__panel-head">
          <h2>Recent bookings</h2>
          <Link to="/host/bookings" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="host-dashboard__empty">No bookings yet. Your latest reservations will appear here.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table trips-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Dates</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id || b.id}>
                    <td data-label="Guest">{b.guest_name || '—'}</td>
                    <td data-label="Room">{b.room_title || b.room_id || '—'}</td>
                    <td className="trips-table__dates" data-label="Dates">
                      {formatStayRange(b.check_in_date, b.check_out_date)}
                    </td>
                    <td data-label="Amount">{formatCurrency(b.total_price)}</td>
                    <td data-label="Status"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
