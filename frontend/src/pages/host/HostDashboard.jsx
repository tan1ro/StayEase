import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, CalendarDays, Grid, Plus, Tag } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import { hostPayout } from '../../components/HostPayoutBreakdown';
import { Icon, ICON } from '../../components/ui/Icon';
import { analyticsApi, bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function HostDashboard() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const [data, setData] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const year = new Date().getFullYear();
      const [dashRes, revRes, bookingsRes] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.revenue({ year }),
        bookingsApi.list({ host_id: hostId }),
      ]);
      setData(dashRes.data);
      const months = (dashRes.data.monthly_revenue || revRes.data.months || []).map((m, i) => ({
        name: m.month || new Date(year, (m.month || i + 1) - 1).toLocaleString('default', { month: 'short' }),
        revenue: m.revenue ?? 0,
      }));
      setRevenue(months);
      setRecentBookings((bookingsRes.data || []).slice(0, 5));
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [hostId]);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="host-page">
      <h1>Dashboard</h1>
      <p className="host-page__subtitle">Overview of your rooms, bookings, and earnings</p>
      <div className="stat-cards">
        <div className="stat-card card">
          <div className="stat-card__label">Total Rooms</div>
          <div className="stat-card__value">{data.total_rooms ?? 0}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__label">Active Bookings</div>
          <div className="stat-card__value">{data.active_bookings ?? 0}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__label">Total Revenue</div>
          <div className="stat-card__value">{formatCurrency(data.total_revenue ?? 0)}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__label">Avg Rating</div>
          <div className="stat-card__value">{data.avg_rating ?? 0}</div>
        </div>
      </div>

      <div className="host-quick-actions">
        <Link to="/host/rooms/add" className="btn btn-primary btn-sm"><Icon icon={Plus} size={ICON.sm} /> Add Room</Link>
        <Link to="/host/rooms" className="btn btn-outline btn-sm"><Icon icon={Grid} size={ICON.sm} /> Manage Rooms</Link>
        <Link to="/host/calendar" className="btn btn-outline btn-sm"><Icon icon={CalendarDays} size={ICON.sm} /> Calendar</Link>
        <Link to="/host/bookings" className="btn btn-outline btn-sm"><Icon icon={Calendar} size={ICON.sm} /> Bookings</Link>
        <Link to="/host/analytics" className="btn btn-outline btn-sm">Analytics</Link>
        <Link to="/host/offers" className="btn btn-outline btn-sm"><Icon icon={Tag} size={ICON.sm} /> Offers</Link>
      </div>

      <div className="card chart-card--short">
        <h3>Monthly revenue</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={revenue}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Bar dataKey="revenue" fill="#4F7FE8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Recent bookings</h2>
      {recentBookings.length === 0 ? (
        <p className="host-page__subtitle">No bookings yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tourist</th>
                <th>Dates</th>
                <th>Your earnings</th>
                <th>Guest paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b._id || b.id}>
                  <td>{b.guest_name}</td>
                  <td>{b.check_in_date} → {b.check_out_date}</td>
                  <td><strong>{formatCurrency(hostPayout(b))}</strong></td>
                  <td>{formatCurrency(b.total_price)}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
