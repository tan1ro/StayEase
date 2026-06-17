import { useEffect, useState } from 'react';
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
import { analyticsApi, formatCurrency } from '../../api/api';

const PIE_COLORS = ['#4F7FE8', '#6B9AFF', '#8BB4FF', '#A8C8FF', '#D4E4FF'];
const CHART_BLUE = '#4F7FE8';
const CHART_BLUE_LIGHT = '#8BB4FF';

export default function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [revRes, occRes] = await Promise.all([
          analyticsApi.revenue({ year }),
          analyticsApi.occupancy({ year }),
        ]);
        setRevenue(
          revRes.data.months.map((m) => ({
            month: new Date(year, m.month - 1).toLocaleString('default', { month: 'short' }),
            revenue: m.revenue,
            gst: m.gst_collected,
          })),
        );
        setOccupancy(
          occRes.data.months.map((m) => ({
            month: new Date(year, m.month - 1).toLocaleString('default', { month: 'short' }),
            rate: m.occupancy_rate,
          })),
        );
      } catch (err) {
        setError(err.normalized?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  const pieData = revenue.filter((r) => r.revenue > 0).slice(0, 5);

  if (loading) return <Spinner label="Loading analytics..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Analytics</h1>
        <select className="select" style={{ width: 120 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <ErrorMessage message={error} />
      <div className="grid-2">
        <div className="card chart-card">
          <h3>Revenue by month</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={revenue}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill={CHART_BLUE} />
              <Bar dataKey="gst" fill={CHART_BLUE_LIGHT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>Occupancy rate</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={occupancy}>
              <XAxis dataKey="month" />
              <YAxis unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke={CHART_BLUE} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>Top months</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} dataKey="revenue" nameKey="month" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
