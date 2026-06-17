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
import { Calendar, Grid, Plus, Tag } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import { hostPayout } from '../../components/HostPayoutBreakdown';
import { Icon, ICON } from '../../components/ui/Icon';
import { analyticsApi, formatCurrency } from '../../api/api';

export default function HostDashboard() {
  const [data, setData] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, revRes] = await Promise.all([
        analyticsApi.hostDashboard(),
        analyticsApi.revenue({ year: new Date().getFullYear() }),
      ]);
      setData(dashRes.data);
      const months = revRes.data.months?.slice(-6).map((m) => ({
        name: new Date(2024, m.month - 1).toLocaleString('default', { month: 'short' }),
        revenue: m.revenue,
      })) || [];
      setRevenue(months);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="host-page">
      <h1>Today</h1>
      <p className="host-page__subtitle">Your StayEase hosting overview</p>
      <div className="stat-cards">
        <div className="stat-card card"><div className="stat-card__label">Total rooms</div><div className="stat-card__value">{data.total_rooms}</div></div>
        <div className="stat-card card"><div className="stat-card__label">Active bookings</div><div className="stat-card__value">{data.active_bookings}</div></div>
        <div className="stat-card card"><div className="stat-card__label">Monthly earnings</div><div className="stat-card__value">{formatCurrency(data.month_revenue)}</div></div>
        <div className="stat-card card"><div className="stat-card__label">Platform fees (month)</div><div className="stat-card__value">{formatCurrency(data.month_platform_fees || 0)}</div></div>
        <div className="stat-card card"><div className="stat-card__label">Avg rating</div><div className="stat-card__value">{data.avg_rating}</div></div>
      </div>

      <div className="host-quick-actions">
        <Link to="/host/rooms/add" className="btn btn-primary btn-sm"><Icon icon={Plus} size={ICON.sm} /> Add Room</Link>
        <Link to="/host/rooms" className="btn btn-outline btn-sm"><Icon icon={Grid} size={ICON.sm} /> Manage Rooms</Link>
        <Link to="/host/bookings" className="btn btn-outline btn-sm"><Icon icon={Calendar} size={ICON.sm} /> Bookings</Link>
        <Link to="/host/offers" className="btn btn-outline btn-sm"><Icon icon={Tag} size={ICON.sm} /> Create Offer</Link>
      </div>

      <div className="card chart-card--short">
        <h3>Revenue (last 6 months)</h3>
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
            {(data.recent_bookings || []).map((b) => (
              <tr key={b._id}>
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
    </div>
  );
}
