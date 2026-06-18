import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { HostHero, HostPage, HostPanel } from '../../components/host/HostPageLayout';
import { analyticsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const CHART_BLUE = '#1A6BFF';
const PIE_COLORS = ['#1A6BFF', '#3D82FF', '#5C96FF', '#7AABFF', '#99C0FF'];

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
      <strong>{label}</strong>
      <div>{formatCurrency(payload[0]?.value ?? 0)}</div>
    </div>
  );
}

function OccupancyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
      <strong>{label}</strong>
      <div>{payload[0]?.value ?? 0}%</div>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const { data: analytics } = await analyticsApi.occupancy(year);
      setData(analytics);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [hostId, year]);

  useEffect(() => { load(); }, [load]);

  const occupancyChart = useMemo(
    () => (data?.monthly_occupancy || []).map((m) => ({
      name: m.month,
      rate: m.occupancy_percent ?? 0,
    })),
    [data],
  );

  const revenueChart = useMemo(
    () => (data?.monthly_revenue || []).map((m) => ({
      name: m.month,
      revenue: m.revenue ?? 0,
    })),
    [data],
  );

  const roomTypeData = useMemo(
    () => (data?.room_type_distribution || []).map((item) => ({
      name: item.type,
      value: item.count,
    })),
    [data],
  );

  const topRooms = data?.top_rooms || [];

  if (loading) return <Spinner label="Loading analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <HostPage>
      <HostHero
        title="Analytics"
        subtitle="Occupancy, revenue, and room performance for your listings."
        pills={[`Year ${year}`]}
        actions={(
          <select
            className="select host-dashboard__year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Select year"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      />

      <div className="host-dashboard__body">
        <section className="host-dashboard__panel host-dashboard__main">
          <div className="host-dashboard__panel-head">
            <h2>Monthly occupancy</h2>
            <span>{year}</span>
          </div>
          <div className="host-dashboard__chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip content={<OccupancyTooltip />} />
                <Bar dataKey="rate" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="host-dashboard__panel host-dashboard__aside">
          <div className="host-dashboard__panel-head">
            <h2>Room type mix</h2>
          </div>
          <div className="host-dashboard__chart" style={{ height: 240 }}>
            {roomTypeData.length === 0 ? (
              <div className="host-dashboard__empty">Add rooms to see distribution.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {roomTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="host-dashboard__panel" style={{ marginTop: '1.25rem' }}>
        <div className="host-dashboard__panel-head">
          <h2>Monthly revenue</h2>
          <span>{year}</span>
        </div>
        <div className="host-dashboard__chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_BLUE}
                strokeWidth={2.5}
                dot={{ fill: CHART_BLUE, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="host-dashboard__panel" style={{ marginTop: '1.25rem' }}>
        <div className="host-dashboard__panel-head">
          <h2>Top performing rooms</h2>
          <span>Top 3 by revenue</span>
        </div>
        {topRooms.length === 0 ? (
          <div className="host-dashboard__empty">No paid bookings yet for {year}.</div>
        ) : (
          <div className="host-dashboard__rank-list">
            {topRooms.slice(0, 3).map((room, index) => (
              <article key={room.room_id || room.room_number} className="host-dashboard__rank-item">
                <span className="host-dashboard__rank-num">{index + 1}</span>
                <div>
                  <div className="host-dashboard__rank-title">
                    {room.title || `Room ${room.room_number}`}
                  </div>
                  <div className="host-dashboard__rank-meta">
                    {room.bookings} booking{room.bookings !== 1 ? 's' : ''}
                    {room.avg_rating ? ` · ${Number(room.avg_rating).toFixed(1)} ★` : ''}
                  </div>
                </div>
                <div className="host-dashboard__rank-stat">{formatCurrency(room.revenue)}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </HostPage>
  );
}
