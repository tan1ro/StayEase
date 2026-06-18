import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  BarChart3,
  BedDouble,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Grid,
  IndianRupee,
  Moon,
  Percent,
  Plus,
  Receipt,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import SafeImage from '../../components/SafeImage';
import StatusBadge from '../../components/StatusBadge';
import { hostPayout } from '../../components/HostPayoutBreakdown';
import { Icon, ICON } from '../../components/ui/Icon';
import { analyticsApi, bookingsApi, formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRoomImage } from '../../utils/roomImages';
import {
  getListingResumeLabel,
  getListingResumePath,
  isDraftListing,
  pickMostRecentDraft,
} from '../../utils/listingResume';

const CHART_BLUE = '#4F7FE8';
const CHART_GREEN = '#10b981';
const PIE_COLORS = ['#4F7FE8', '#6FA3FF', '#99BEFF', '#C3D9FF', '#4588FF'];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'listings', label: 'Listings' },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

function formatStayRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={entry.name}>{entry.name}: {formatter ? formatter(entry.value) : entry.value}</div>
      ))}
    </div>
  );
}

function DashboardTabs({ active, onChange }) {
  return (
    <div className="host-ui-tabs" role="tablist" aria-label="Dashboard sections">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={`host-ui-tabs__tab${active === id ? ' host-ui-tabs__tab--active' : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MonthlyMetricsTable({ rows, year }) {
  if (!rows?.length) {
    return <div className="host-dashboard__empty">No monthly data for {year}.</div>;
  }
  return (
    <div className="table-wrap host-dashboard__metrics-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue</th>
            <th>Bookings</th>
            <th>Occupancy</th>
            <th>Nights</th>
            <th>Fees</th>
            <th>GST</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td><strong>{formatCurrency(row.revenue ?? 0)}</strong></td>
              <td>{row.bookings ?? 0}</td>
              <td>{row.occupancy ?? 0}%</td>
              <td>{row.booked_nights ?? 0}</td>
              <td>{formatCurrency(row.platform_fees ?? 0)}</td>
              <td>{formatCurrency(row.gst_collected ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayoutMethodCard() {
  return (
    <article className="host-dashboard__panel host-dashboard__action-card">
      <div className="host-dashboard__action-card-inner">
        <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
          <Icon icon={Wallet} size={ICON.md} />
        </div>
        <div>
          <h3>Payout method</h3>
          <p>Add your UPI or bank details to receive earnings after guest check-in.</p>
          <Link to="/host/payouts" className="btn btn-outline btn-sm">Set up payouts</Link>
        </div>
      </div>
    </article>
  );
}

function GstReportsCard() {
  return (
    <article className="host-dashboard__panel host-dashboard__action-card">
      <div className="host-dashboard__action-card-inner">
        <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
          <Icon icon={BarChart3} size={ICON.md} />
        </div>
        <div>
          <h3>GST reports &amp; invoices</h3>
          <p>StayEase auto-generates CGST/SGST invoices for every paid booking.</p>
          <Link to="/host/bookings" className="btn btn-outline btn-sm">Go to bookings</Link>
        </div>
      </div>
    </article>
  );
}

export default function HostDashboard() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : 'overview';

  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const setTab = (id) => {
    if (id === 'overview') setSearchParams({});
    else setSearchParams({ tab: id });
  };

  const load = useCallback(async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const [dashRes, bookingsRes, roomsRes] = await Promise.all([
        analyticsApi.dashboard({ year }),
        bookingsApi.list({ host_id: hostId }),
        roomsApi.byHost(hostId),
      ]);
      setData(dashRes.data);
      setRooms(roomsRes.data || []);
      setRecentBookings((bookingsRes.data || []).slice(0, 5));
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [hostId, year]);

  useEffect(() => { load(); }, [load]);

  const revenueChart = useMemo(
    () => (data?.monthly_revenue || []).map((m) => ({
      name: m.month,
      revenue: m.revenue ?? 0,
      bookings: m.bookings ?? 0,
      fees: m.platform_fees ?? 0,
      gst: m.gst_collected ?? 0,
      occupancy: m.occupancy ?? 0,
      nights: m.booked_nights ?? 0,
    })),
    [data],
  );

  const statusChart = useMemo(
    () => (data?.booking_status_breakdown || []).filter((s) => s.count > 0),
    [data],
  );

  const categoryChart = useMemo(
    () => (data?.revenue_by_category || []).map((c) => ({
      name: c.category,
      revenue: c.revenue ?? 0,
    })),
    [data],
  );

  const roomRevenueMap = useMemo(() => {
    const map = {};
    (data?.top_rooms || []).forEach((r) => {
      if (r.room_id) map[r.room_id] = r;
    });
    return map;
  }, [data]);

  const occupancyChart = useMemo(
    () => (data?.monthly_occupancy || []).map((m) => ({
      name: m.month,
      rate: m.occupancy_percent ?? 0,
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

  const firstName = user?.name?.split(' ')[0] || 'Host';
  const liveListings = rooms.filter((r) => r.is_available).length;
  const recentDraft = pickMostRecentDraft(rooms);
  const avgListingRating = rooms.length
    ? rooms.reduce((s, r) => s + (r.avg_rating || 0), 0) / rooms.length
    : 0;
  const totalReviews = rooms.reduce((s, r) => s + (r.total_reviews || 0), 0);
  const hasEarnings = (data?.ytd_revenue ?? 0) > 0 || (data?.active_bookings ?? 0) > 0;

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="host-page host-dashboard">
      <header className="host-dashboard__hero">
        <div className="host-dashboard__hero-text">
          <h1>Welcome back, {firstName}</h1>
          <p>Your {year} performance at a glance — earnings, occupancy, and guest activity.</p>
        </div>
        <div className="host-dashboard__hero-meta">
          <span className="host-dashboard__hero-pill">{data.total_rooms ?? 0} listings</span>
          <span className="host-dashboard__hero-pill">{data.active_bookings ?? 0} active stays</span>
          <select
            className="host-dashboard__year select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Analytics year"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      <div className="host-dashboard__kpis host-dashboard__kpis--wide">
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
            <Icon icon={IndianRupee} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">{year} earnings</div>
            <div className="host-dashboard__kpi-value">{formatCurrency(data.ytd_revenue ?? 0)}</div>
            <div className="host-dashboard__kpi-hint">Net {formatCurrency(data.net_earnings ?? 0)}</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
            <Icon icon={Calendar} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">This month</div>
            <div className="host-dashboard__kpi-value">{formatCurrency(data.month_revenue ?? 0)}</div>
            <div className="host-dashboard__kpi-hint">{data.ytd_bookings ?? 0} paid stays in {year}</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--occupancy">
            <Icon icon={Percent} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Occupancy</div>
            <div className="host-dashboard__kpi-value">{data.occupancy_rate ?? 0}%</div>
            <div className="host-dashboard__kpi-hint">{data.ytd_occupancy_avg ?? 0}% avg in {year}</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--rating">
            <Icon icon={Star} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Avg guest rating</div>
            <div className="host-dashboard__kpi-value">{Number(data.avg_rating ?? 0).toFixed(1)}</div>
            <div className="host-dashboard__kpi-hint">{data.confirmed_bookings ?? 0} confirmed</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
            <Icon icon={Moon} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Nights booked</div>
            <div className="host-dashboard__kpi-value">{data.ytd_nights_booked ?? 0}</div>
            <div className="host-dashboard__kpi-hint">{data.avg_stay_nights ?? 0} nights avg stay</div>
          </div>
        </article>
        <article className="host-dashboard__kpi">
          <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
            <Icon icon={TrendingUp} size={ICON.md} />
          </div>
          <div>
            <div className="host-dashboard__kpi-label">Avg daily rate</div>
            <div className="host-dashboard__kpi-value">{formatCurrency(data.avg_daily_rate ?? 0)}</div>
            <div className="host-dashboard__kpi-hint">Peak month: {data.peak_month || '—'}</div>
          </div>
        </article>
      </div>

      <DashboardTabs active={activeTab} onChange={setTab} />

      {activeTab === 'overview' && (
        <>
          <nav className="host-dashboard__actions" aria-label="Quick actions">
            <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
              <Icon icon={Plus} size={ICON.sm} /> Add room
            </Link>
            <Link to="/host/rooms" className="host-dashboard__action">
              <Icon icon={Grid} size={ICON.sm} /> Listings
            </Link>
            <Link to="/host/calendar" className="host-dashboard__action">
              <Icon icon={CalendarDays} size={ICON.sm} /> Calendar
            </Link>
            <Link to="/host/bookings" className="host-dashboard__action">
              <Icon icon={Users} size={ICON.sm} /> Bookings
            </Link>
            <button type="button" className="host-dashboard__action" onClick={() => setTab('earnings')}>
              <Icon icon={TrendingUp} size={ICON.sm} /> Earnings
            </button>
            <Link to="/host/offers" className="host-dashboard__action">
              <Icon icon={Tag} size={ICON.sm} /> Offers
            </Link>
          </nav>

          <div className="host-dashboard__body">
            <div className="host-dashboard__main">
              <section className="host-dashboard__panel" id="analytics">
                <div className="host-dashboard__panel-head">
                  <h2>Analytics ({year})</h2>
                  <span>Revenue &amp; occupancy trends</span>
                </div>
                <div className="host-dashboard__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_BLUE} strokeWidth={2.5} dot={{ fill: CHART_BLUE, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="host-dashboard__chart-row">
                  <div>
                    <div className="host-dashboard__panel-head">
                      <h3>Monthly occupancy %</h3>
                    </div>
                    <div className="host-dashboard__chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyChart}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Bar dataKey="rate" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <div className="host-dashboard__panel-head">
                      <h3>Bookings per month</h3>
                    </div>
                    <div className="host-dashboard__chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChart}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="bookings" fill={CHART_GREEN} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>

              <section className="host-dashboard__panel" style={{ marginTop: '1.25rem' }}>
                <div className="host-dashboard__panel-head">
                  <h2>Top performing rooms</h2>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('listings')}>
                    View all <Icon icon={ArrowUpRight} size={ICON.sm} />
                  </button>
                </div>
                {(data.top_rooms || []).length === 0 ? (
                  <div className="host-dashboard__empty">No paid bookings yet for {year}. Share your listings to get started.</div>
                ) : (
                  <div className="host-dashboard__rank-list">
                    {data.top_rooms.map((room, index) => (
                      <article key={room.room_id || room.room_number} className="host-dashboard__rank-item">
                        <span className="host-dashboard__rank-num">{index + 1}</span>
                        <div>
                          <div className="host-dashboard__rank-title">{room.title || `Room ${room.room_number}`}</div>
                          <div className="host-dashboard__rank-meta">
                            {room.bookings} booking{room.bookings !== 1 ? 's' : ''}
                            {room.avg_rating ? ` · ${room.avg_rating.toFixed(1)} ★ (${room.total_reviews || 0})` : ''}
                          </div>
                        </div>
                        <div className="host-dashboard__rank-stat">{formatCurrency(room.revenue)}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="host-dashboard__aside">
              <section className="host-dashboard__panel">
                <div className="host-dashboard__panel-head">
                  <h3>Key insights</h3>
                  <span>{year}</span>
                </div>
                <div className="host-dashboard__insights">
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">Net earnings ({year})</div>
                    <div className="host-dashboard__insight-value">{formatCurrency(data.net_earnings ?? 0)}</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">Platform fees</div>
                    <div className="host-dashboard__insight-value">{formatCurrency(data.ytd_platform_fees ?? 0)}</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">GST collected</div>
                    <div className="host-dashboard__insight-value">{formatCurrency(data.ytd_gst_collected ?? 0)}</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">Lifetime earnings</div>
                    <div className="host-dashboard__insight-value">{formatCurrency(data.total_revenue ?? 0)}</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">Cancellation rate</div>
                    <div className="host-dashboard__insight-value">{data.cancellation_rate ?? 0}%</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">
                      <Icon icon={Clock} size={14} style={{ verticalAlign: 'middle' }} /> Avg stay
                    </div>
                    <div className="host-dashboard__insight-value">{data.avg_stay_nights ?? 0} nights</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">
                      <Icon icon={CalendarDays} size={14} style={{ verticalAlign: 'middle' }} /> Busiest day
                    </div>
                    <div className="host-dashboard__insight-value">{data.busiest_day || '—'}</div>
                  </div>
                  <div className="host-dashboard__insight">
                    <div className="host-dashboard__insight-label">
                      <Icon icon={BedDouble} size={14} style={{ verticalAlign: 'middle' }} /> Rooms live
                    </div>
                    <div className="host-dashboard__insight-value">{data.available_rooms ?? 0} / {data.total_rooms ?? 0}</div>
                  </div>
                </div>
              </section>

              <section className="host-dashboard__panel" style={{ marginTop: '1rem' }}>
                <div className="host-dashboard__panel-head">
                  <h3>Room type mix</h3>
                </div>
                <div className="host-dashboard__chart" style={{ height: 220 }}>
                  {roomTypeData.length === 0 ? (
                    <div className="host-dashboard__empty" style={{ padding: '1.5rem 1rem' }}>Add rooms to see mix.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roomTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
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

              <button type="button" className="host-dashboard__action" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setTab('earnings')}>
                <Icon icon={Receipt} size={ICON.sm} /> View earnings &amp; GST reports
              </button>
            </aside>
          </div>

          {(data.upcoming_check_ins || []).length > 0 && (
            <section className="host-dashboard__panel" style={{ marginBottom: '1.25rem' }}>
              <div className="host-dashboard__panel-head">
                <h2>Upcoming check-ins</h2>
                <Link to="/host/calendar" className="btn btn-ghost btn-sm">Calendar</Link>
              </div>
              <div className="host-dashboard__bookings">
                {data.upcoming_check_ins.map((b) => (
                  <article key={b._id || b.id} className="host-dashboard__booking">
                    <div>
                      <div className="host-dashboard__booking-name">{b.guest_name}</div>
                      <div className="host-dashboard__booking-dates">{formatStayRange(b.check_in_date, b.check_out_date)}</div>
                    </div>
                    <div>
                      <div className="host-dashboard__booking-amount">{formatCurrency(hostPayout(b))}</div>
                      <div className="host-dashboard__booking-paid">{b.total_nights ?? '—'} nights</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2 className="host-dashboard__section-title">Recent bookings</h2>
              <Link to="/host/bookings" className="btn btn-ghost btn-sm">All bookings</Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="host-dashboard__empty">No bookings yet. Your latest reservations will appear here.</div>
            ) : (
              <div className="host-dashboard__bookings">
                {recentBookings.map((b) => (
                  <article key={b._id || b.id} className="host-dashboard__booking">
                    <div>
                      <div className="host-dashboard__booking-name">{b.guest_name}</div>
                      <div className="host-dashboard__booking-dates">{formatStayRange(b.check_in_date, b.check_out_date)}</div>
                    </div>
                    <div>
                      <div className="host-dashboard__booking-amount">{formatCurrency(hostPayout(b))}</div>
                      <div className="host-dashboard__booking-paid">Guest paid {formatCurrency(b.total_price)}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'analytics' && (
        <>
          <div className="host-dashboard__kpis host-dashboard__kpis--compact">
            <article className="host-dashboard__kpi">
              <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
                <Icon icon={Wallet} size={ICON.md} />
              </div>
              <div>
                <div className="host-dashboard__kpi-label">Net earnings</div>
                <div className="host-dashboard__kpi-value">{formatCurrency(data.net_earnings ?? 0)}</div>
              </div>
            </article>
            <article className="host-dashboard__kpi">
              <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
                <Icon icon={TrendingUp} size={ICON.md} />
              </div>
              <div>
                <div className="host-dashboard__kpi-label">Avg daily rate</div>
                <div className="host-dashboard__kpi-value">{formatCurrency(data.avg_daily_rate ?? 0)}</div>
              </div>
            </article>
            <article className="host-dashboard__kpi">
              <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--occupancy">
                <Icon icon={Percent} size={ICON.md} />
              </div>
              <div>
                <div className="host-dashboard__kpi-label">YTD occupancy</div>
                <div className="host-dashboard__kpi-value">{data.ytd_occupancy_avg ?? 0}%</div>
              </div>
            </article>
            <article className="host-dashboard__kpi">
              <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--rating">
                <Icon icon={TrendingDown} size={ICON.md} />
              </div>
              <div>
                <div className="host-dashboard__kpi-label">Cancellation rate</div>
                <div className="host-dashboard__kpi-value">{data.cancellation_rate ?? 0}%</div>
              </div>
            </article>
          </div>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Revenue vs occupancy</h2>
              <span>{year} combined performance</span>
            </div>
            {revenueChart.every((m) => m.revenue === 0 && m.occupancy === 0) ? (
              <div className="host-dashboard__empty">Analytics appear once you have paid bookings in {year}.</div>
            ) : (
              <div className="host-dashboard__chart host-dashboard__chart--tall">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'Occupancy %') return [`${value}%`, name];
                      return [formatCurrency(value), name];
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="occupancy" name="Occupancy %" stroke={CHART_GREEN} strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Booked nights</h2>
                <span>{year}</span>
              </div>
              <div className="host-dashboard__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="nights" name="Nights" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <aside className="host-dashboard__aside">
              <section className="host-dashboard__panel">
                <div className="host-dashboard__panel-head">
                  <h3>Booking status</h3>
                </div>
                {statusChart.length === 0 ? (
                  <div className="host-dashboard__empty">No bookings yet.</div>
                ) : (
                  <div className="host-dashboard__chart" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChart} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} label>
                          {statusChart.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </aside>
          </div>

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Revenue by room category</h2>
                <span>{year}</span>
              </div>
              {categoryChart.length === 0 ? (
                <div className="host-dashboard__empty">Category breakdown appears with paid bookings.</div>
              ) : (
                <div className="host-dashboard__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill={CHART_BLUE} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="host-dashboard__panel host-dashboard__aside">
              <div className="host-dashboard__panel-head">
                <h3>Performance signals</h3>
              </div>
              <div className="host-dashboard__insights">
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">Busiest check-in day</div>
                  <div className="host-dashboard__insight-value">{data.busiest_day || '—'}</div>
                </div>
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">Peak revenue month</div>
                  <div className="host-dashboard__insight-value">{data.peak_month || '—'}</div>
                </div>
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">YTD GST collected</div>
                  <div className="host-dashboard__insight-value">{formatCurrency(data.ytd_gst_collected ?? 0)}</div>
                </div>
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">Total bookings (all time)</div>
                  <div className="host-dashboard__insight-value">{data.total_bookings ?? 0}</div>
                </div>
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">Completed stays</div>
                  <div className="host-dashboard__insight-value">{data.completed_bookings ?? 0}</div>
                </div>
                <div className="host-dashboard__insight">
                  <div className="host-dashboard__insight-label">Rooms currently booked</div>
                  <div className="host-dashboard__insight-value">{data.booked_rooms ?? 0}</div>
                </div>
              </div>
            </section>
          </div>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Monthly breakdown</h2>
              <span>{year} · revenue, occupancy &amp; GST</span>
            </div>
            <MonthlyMetricsTable rows={data.monthly_revenue} year={year} />
          </section>
        </>
      )}

      {activeTab === 'earnings' && (
        <>
          {!hasEarnings ? (
            <div className="host-dashboard__panel host-dashboard__empty-state">
              <div className="host-empty-card__art" aria-hidden="true">
                <span className="host-empty-card__block host-empty-card__block--a" />
                <span className="host-empty-card__block host-empty-card__block--b" />
              </div>
              <h2>You&apos;re ready to start earning</h2>
              <p>Performance and payout data will appear here once you get your first booking.</p>
              <Link to="/host/rooms/add" className="btn btn-primary">Create a listing</Link>
            </div>
          ) : (
            <div className="host-dashboard__kpis host-dashboard__kpis--compact">
              <article className="host-dashboard__kpi">
                <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
                  <Icon icon={IndianRupee} size={ICON.md} />
                </div>
                <div>
                  <div className="host-dashboard__kpi-label">YTD earnings</div>
                  <div className="host-dashboard__kpi-value">{formatCurrency(data.ytd_revenue ?? 0)}</div>
                </div>
              </article>
              <article className="host-dashboard__kpi">
                <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--occupancy">
                  <Icon icon={Receipt} size={ICON.md} />
                </div>
                <div>
                  <div className="host-dashboard__kpi-label">YTD platform fees</div>
                  <div className="host-dashboard__kpi-value">{formatCurrency(data.ytd_platform_fees ?? 0)}</div>
                </div>
              </article>
              <article className="host-dashboard__kpi">
                <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
                  <Icon icon={TrendingUp} size={ICON.md} />
                </div>
                <div>
                  <div className="host-dashboard__kpi-label">This month</div>
                  <div className="host-dashboard__kpi-value">{formatCurrency(data.month_revenue ?? 0)}</div>
                </div>
              </article>
              <article className="host-dashboard__kpi">
                <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--rating">
                  <Icon icon={Calendar} size={ICON.md} />
                </div>
                <div>
                  <div className="host-dashboard__kpi-label">Active bookings</div>
                  <div className="host-dashboard__kpi-value">{data.active_bookings ?? 0}</div>
                </div>
              </article>
            </div>
          )}

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Revenue &amp; fees</h2>
                <span>{year}</span>
              </div>
              {revenueChart.every((m) => m.revenue === 0 && m.fees === 0) ? (
                <div className="host-dashboard__empty">No earnings data for {year} yet.</div>
              ) : (
                <div className="host-dashboard__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill={CHART_BLUE} radius={[4, 4, 0, 0]} name="Earnings" />
                      <Bar dataKey="fees" fill="#99BEFF" radius={[4, 4, 0, 0]} name="Platform fees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="host-dashboard__panel host-dashboard__aside">
              <div className="host-dashboard__panel-head">
                <h2>GST collected</h2>
                <span>{year}</span>
              </div>
              {revenueChart.every((m) => m.gst === 0) ? (
                <div className="host-dashboard__empty">GST totals appear with paid bookings.</div>
              ) : (
                <div className="host-dashboard__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="gst" name="GST" stroke={CHART_GREEN} strokeWidth={2} dot={{ fill: CHART_GREEN, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <div className="host-dashboard__action-cards">
            <PayoutMethodCard />
            <GstReportsCard />
          </div>
        </>
      )}

      {activeTab === 'listings' && (
        <>
          {rooms.length === 0 ? (
            <div className="host-dashboard__panel host-dashboard__empty-state">
              <div className="host-empty-card__art host-empty-card__art--house" aria-hidden="true">
                <Icon icon={Building2} size={80} />
              </div>
              <h2>No listings yet</h2>
              <p>Create your first listing to start tracking occupancy, revenue, and guest ratings.</p>
              <Link to="/host/rooms/add" className="btn btn-primary">Get started</Link>
            </div>
          ) : (
            <>
              {recentDraft && (
                <div className="host-dashboard__draft-banner">
                  <div>
                    <strong>Listing in progress</strong>
                    <p>Resume your draft listing from where you stopped.</p>
                  </div>
                  <Link
                    to={getListingResumePath(recentDraft._id || recentDraft.id)}
                    className="btn btn-primary btn-sm"
                  >
                    {getListingResumeLabel(recentDraft)}
                  </Link>
                </div>
              )}

              <div className="host-dashboard__kpis host-dashboard__kpis--compact">
                <article className="host-dashboard__kpi">
                  <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--bookings">
                    <Icon icon={Building2} size={ICON.md} />
                  </div>
                  <div>
                    <div className="host-dashboard__kpi-label">Live listings</div>
                    <div className="host-dashboard__kpi-value">{liveListings}</div>
                    <div className="host-dashboard__kpi-hint">{rooms.length - liveListings} draft</div>
                  </div>
                </article>
                <article className="host-dashboard__kpi">
                  <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--rating">
                    <Icon icon={Star} size={ICON.md} />
                  </div>
                  <div>
                    <div className="host-dashboard__kpi-label">Avg rating</div>
                    <div className="host-dashboard__kpi-value">{avgListingRating ? avgListingRating.toFixed(1) : '—'}</div>
                    <div className="host-dashboard__kpi-hint">{totalReviews} reviews</div>
                  </div>
                </article>
                <article className="host-dashboard__kpi">
                  <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--earnings">
                    <Icon icon={Grid} size={ICON.md} />
                  </div>
                  <div>
                    <div className="host-dashboard__kpi-label">Total listings</div>
                    <div className="host-dashboard__kpi-value">{rooms.length}</div>
                  </div>
                </article>
                <article className="host-dashboard__kpi">
                  <div className="host-dashboard__kpi-icon host-dashboard__kpi-icon--occupancy">
                    <Icon icon={Star} size={ICON.md} />
                  </div>
                  <div>
                    <div className="host-dashboard__kpi-label">Top rated</div>
                    <div className="host-dashboard__kpi-value">
                      {Math.max(...rooms.map((r) => r.avg_rating || 0)).toFixed(1)}
                    </div>
                  </div>
                </article>
              </div>

              <section className="host-dashboard__panel">
                <div className="host-dashboard__panel-head">
                  <h2>Listing performance</h2>
                  <Link to="/host/rooms" className="btn btn-ghost btn-sm">Manage all</Link>
                </div>
                <div className="host-dashboard__rank-list">
                  {rooms.map((room) => {
                    const roomId = room._id || room.id;
                    const photo = getPrimaryRoomImage(room);
                    const stats = roomRevenueMap[roomId];
                    const draft = isDraftListing(room);
                    const rowTo = draft
                      ? getListingResumePath(roomId)
                      : `/host/rooms/${roomId}/editor`;
                    return (
                      <Link key={roomId} to={rowTo} className="host-listing-row host-dashboard__rank-item--clickable">
                        <div className="host-listing-row__media">
                          <SafeImage
                            src={photo}
                            alt={room.title || 'Room photo'}
                            className="safe-image"
                            fallbackSeed={roomId}
                          />
                        </div>
                        <div className="host-listing-row__body">
                          <h3 className="host-listing-row__title">{room.title || room.room_number}</h3>
                          <div className="host-listing-row__meta">
                            <span>{room.location?.city || '—'}</span>
                            <span>{room.room_category}</span>
                            {stats && <span>{stats.bookings} booking{stats.bookings !== 1 ? 's' : ''} in {year}</span>}
                            <span className={`host-listing-row__badge ${room.is_available ? 'host-listing-row__badge--live' : 'host-listing-row__badge--draft'}`}>
                              {room.is_available ? 'Live' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="host-dashboard__rank-stat">
                          <div>{room.avg_rating?.toFixed(1) || '—'} ★</div>
                          {stats && <div className="host-dashboard__rank-meta">{formatCurrency(stats.revenue)}</div>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
