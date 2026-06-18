import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { analyticsApi, formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const CHART_BLUE = '#1A6BFF';
const PIE_COLORS = ['#1A6BFF', '#4588FF', '#6FA3FF', '#99BEFF', '#C3D9FF'];

export default function Analytics() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const [year, setYear] = useState(currentYear);
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hostId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [revRes, occRes, roomsRes] = await Promise.all([
          analyticsApi.revenue({ year, host_id: hostId }),
          analyticsApi.occupancy({ year }),
          roomsApi.list({ host_id: hostId }),
        ]);
        setRevenue(
          revRes.data.months.map((m) => ({
            month: new Date(year, m.month - 1).toLocaleString('default', { month: 'short' }),
            revenue: m.revenue,
          })),
        );
        setOccupancy(
          occRes.data.months.map((m) => ({
            month: new Date(year, m.month - 1).toLocaleString('default', { month: 'short' }),
            rate: m.occupancy_rate,
          })),
        );
        setRooms(roomsRes.data || []);
      } catch (err) {
        setError(err.normalized?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, hostId]);

  const roomTypeData = useMemo(() => {
    const counts = {};
    rooms.forEach((room) => {
      const type = room.room_category || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rooms]);

  const topRooms = useMemo(() => {
    return [...rooms]
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || (b.total_reviews || 0) - (a.total_reviews || 0))
      .slice(0, 3);
  }, [rooms]);

  if (loading) return <Spinner label="Loading analytics..." />;

  return (
    <div className="host-page">
      <div className="host-page__header">
        <h1 className="page-title">Analytics</h1>
        <select className="select" style={{ width: 120 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <ErrorMessage message={error} />

      <div className="grid-2">
        <div className="card chart-card">
          <h3>Monthly occupancy %</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={occupancy}>
              <XAxis dataKey="month" />
              <YAxis unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Monthly revenue</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={revenue}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke={CHART_BLUE} strokeWidth={2} dot={{ fill: CHART_BLUE }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Room type distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={roomTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {roomTypeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Top rooms</h3>
          {topRooms.length === 0 ? (
            <p className="host-page__subtitle">No rooms to rank yet.</p>
          ) : (
            <ol className="host-page__subtitle">
              {topRooms.map((room, index) => (
                <li key={room._id || room.id}>
                  #{index + 1} {room.title || room.room_number} — {room.avg_rating?.toFixed(1) || '0.0'} ★ ({room.total_reviews || 0} reviews)
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
