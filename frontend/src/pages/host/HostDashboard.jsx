import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import {
  BarChart3,
  Building2,
  Calendar,
  IndianRupee,
  Plus,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import HostPayoutBreakdown from '../../components/HostPayoutBreakdown';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostKpi, HostKpiGrid, HostTabs } from '../../components/host/HostPageLayout';
import { analyticsApi, bookingsApi, formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  HOST_PAYOUT_PREFS_KEY,
  loadJsonPref,
  DEFAULT_HOST_PAYOUT_PREFS,
  payoutMethodLabel,
} from '../../constants/accountSettings';
import { isListingIncomplete } from '../../components/host/HostListingCard';

const CHART_BLUE = '#1A6BFF';
const PIE_COLORS = ['#1A6BFF', '#3D82FF', '#5C96FF', '#7AABFF', '#99C0FF'];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'listings', label: 'Listings' },
];

function formatStayRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
}

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
      <strong>{label}</strong>
      <div>{formatCurrency(payload[0]?.value ?? 0)}{suffix}</div>
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

export default function HostDashboard() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'overview';

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const payoutPrefs = useMemo(
    () => loadJsonPref(HOST_PAYOUT_PREFS_KEY, DEFAULT_HOST_PAYOUT_PREFS),
    [activeTab],
  );

  const load = useCallback(async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const [dashRes, bookingsRes, roomsRes] = await Promise.all([
        analyticsApi.dashboard(),
        bookingsApi.list({ host_id: hostId }),
        roomsApi.byHost(hostId),
      ]);
      setStats(dashRes.data);
      setBookings(bookingsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => { load(); }, [load]);

  const setTab = (id) => {
    if (id === 'overview') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: id }, { replace: true });
    }
  };

  const revenueChart = useMemo(
    () => (stats?.monthly_revenue || []).map((m) => ({
      name: m.month,
      revenue: m.revenue ?? 0,
      occupancy: m.occupancy ?? 0,
    })),
    [stats],
  );

  const occupancyChart = useMemo(
    () => (stats?.monthly_occupancy || []).map((m) => ({
      name: m.month,
      rate: m.occupancy_percent ?? 0,
    })),
    [stats],
  );

  const roomTypeData = useMemo(
    () => (stats?.room_type_distribution || []).map((item) => ({
      name: item.type,
      value: item.count,
    })),
    [stats],
  );

  const draftCount = rooms.filter((r) => !r.is_available || isListingIncomplete(r)).length;
  const recentBookings = bookings.slice(0, 5);
  const upcoming = stats?.upcoming_check_ins || [];
  const topRooms = stats?.top_rooms || [];
  const firstName = user?.name?.split(' ')[0] || 'Host';
  const payoutLabel = payoutMethodLabel(payoutPrefs);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!stats) return <ErrorMessage message="No dashboard data available." onRetry={load} />;

  return (
    <div className="host-page host-dashboard">
      <header className="host-dashboard__hero">
        <div className="host-dashboard__hero-text">
          <h1>Welcome back, {firstName}</h1>
          <p>Your hosting performance at a glance — revenue, occupancy, and guest activity.</p>
        </div>
        <div className="host-dashboard__hero-meta">
          <span className="host-dashboard__hero-pill">
            {stats.total_rooms ?? 0} listing{(stats.total_rooms ?? 0) === 1 ? '' : 's'}
          </span>
          <span className="host-dashboard__hero-pill">
            {stats.active_bookings ?? 0} active stay{(stats.active_bookings ?? 0) === 1 ? '' : 's'}
          </span>
          <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
            <Icon icon={Plus} size={ICON.sm} /> Add room
          </Link>
        </div>
      </header>

      {draftCount > 0 && (
        <div className="host-dashboard__draft-banner">
          <div>
            <strong>{draftCount} listing{draftCount === 1 ? '' : 's'} need attention</strong>
            <p>Complete photos, pricing, and availability to start earning on StayEase.</p>
          </div>
          <Link to="/host/rooms" className="btn btn-primary btn-sm">Finish listings</Link>
        </div>
      )}

      <HostTabs tabs={TABS} active={activeTab} onChange={setTab} />

      {activeTab === 'overview' && (
        <>
          <HostKpiGrid>
            <HostKpi
              icon={Building2}
              variant="bookings"
              label="Live listings"
              value={stats.available_rooms ?? 0}
              hint={`${stats.total_rooms ?? 0} total rooms`}
            />
            <HostKpi
              icon={Calendar}
              variant="occupancy"
              label="Active bookings"
              value={stats.active_bookings ?? 0}
              hint={`${stats.confirmed_bookings ?? 0} confirmed`}
            />
            <HostKpi
              icon={IndianRupee}
              variant="earnings"
              label="This month"
              value={formatCurrency(stats.month_revenue ?? 0)}
              hint="Paid check-ins"
            />
            <HostKpi
              icon={TrendingUp}
              variant="occupancy"
              label="Occupancy"
              value={`${Number(stats.occupancy_rate ?? 0).toFixed(0)}%`}
              hint="Current month"
            />
            <HostKpi
              icon={IndianRupee}
              variant="earnings"
              label="Total revenue"
              value={formatCurrency(stats.total_revenue ?? 0)}
              hint="All paid bookings"
            />
            <HostKpi
              icon={Star}
              variant="rating"
              label="Avg rating"
              value={Number(stats.avg_rating ?? 0).toFixed(1)}
              hint="Across listings"
            />
            <HostKpi
              icon={BarChart3}
              variant="bookings"
              label="YTD bookings"
              value={stats.ytd_bookings ?? 0}
              hint={`${stats.ytd_nights_booked ?? 0} nights`}
            />
            <HostKpi
              icon={Wallet}
              variant="earnings"
              label="Net earnings (YTD)"
              value={formatCurrency(stats.net_earnings ?? 0)}
              hint="After platform fees"
            />
          </HostKpiGrid>

          <div className="host-dashboard__actions" style={{ marginTop: '0.25rem' }}>
            <Link to="/host/rooms" className="host-dashboard__action">
              <Icon icon={Building2} size={ICON.sm} /> Manage rooms
            </Link>
            <Link to="/host/bookings" className="host-dashboard__action">
              <Icon icon={Calendar} size={ICON.sm} /> View bookings
            </Link>
            <Link to="/host/calendar" className="host-dashboard__action">
              <Icon icon={Calendar} size={ICON.sm} /> Calendar
            </Link>
            <Link to="/host/analytics" className="host-dashboard__action">
              <Icon icon={BarChart3} size={ICON.sm} /> Full analytics
            </Link>
          </div>

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Analytics ({currentYear})</h2>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('analytics')}>
                  View details
                </button>
              </div>
              <p className="host-dashboard__panel-sub">Monthly occupancy %</p>
              <div className="host-dashboard__chart host-dashboard__chart--tall">
                {occupancyChart.every((m) => m.rate === 0) ? (
                  <div className="host-dashboard__empty">Occupancy data appears once you receive bookings.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis unit="%" tick={{ fontSize: 12 }} />
                      <Tooltip content={<OccupancyTooltip />} />
                      <Bar dataKey="rate" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="host-dashboard__panel host-dashboard__aside">
              <div className="host-dashboard__panel-head">
                <h2>Top performing rooms</h2>
                <span>This year</span>
              </div>
              {topRooms.length === 0 ? (
                <div className="host-dashboard__empty">No paid bookings yet.</div>
              ) : (
                <div className="host-dashboard__rank-list">
                  {topRooms.slice(0, 3).map((room, index) => (
                    <article key={room.room_id || room.room_number} className="host-dashboard__rank-item">
                      <span className="host-dashboard__rank-num">{index + 1}</span>
                      <div>
                        <div className="host-dashboard__rank-title">{room.title || `Room ${room.room_number}`}</div>
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
          </div>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Recent bookings</h2>
              <Link to="/host/bookings" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="host-dashboard__empty">No bookings yet. Your latest reservations will appear here.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table trips-table">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Dates</th>
                      <th>Earnings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b._id || b.id}>
                        <td data-label="Guest">{b.guest_name || '—'}</td>
                        <td data-label="Room">{b.room_title || b.room_id || '—'}</td>
                        <td className="trips-table__dates" data-label="Dates">
                          {formatStayRange(b.check_in_date, b.check_out_date)}
                        </td>
                        <td data-label="Earnings">{formatCurrency(b.host_payout ?? b.subtotal ?? b.total_price)}</td>
                        <td data-label="Status"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {upcoming.length > 0 && (
            <section className="host-dashboard__panel">
              <div className="host-dashboard__panel-head">
                <h2>Upcoming check-ins</h2>
                <span>Next {upcoming.length}</span>
              </div>
              <div className="host-insights-list">
                {upcoming.map((b) => (
                  <div key={b._id || b.id} className="host-insights-row">
                    <div>
                      <strong>{b.guest_name || 'Guest'}</strong>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {b.room_title || 'Room'} · {formatStayRange(b.check_in_date, b.check_out_date)}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <>
          <HostKpiGrid>
            <HostKpi icon={TrendingUp} variant="occupancy" label="YTD occupancy" value={`${Number(stats.ytd_occupancy_avg ?? 0).toFixed(0)}%`} hint={`Peak: ${stats.peak_month || '—'}`} />
            <HostKpi icon={Calendar} variant="bookings" label="Avg stay" value={`${stats.avg_stay_nights ?? 0} nights`} hint={`Busiest: ${stats.busiest_day || '—'}`} />
            <HostKpi icon={IndianRupee} variant="earnings" label="Avg daily rate" value={formatCurrency(stats.avg_daily_rate ?? 0)} hint="Per booked night" />
            <HostKpi icon={BarChart3} variant="rating" label="Cancellation rate" value={`${stats.cancellation_rate ?? 0}%`} hint={`${stats.cancelled_bookings ?? 0} cancelled`} />
          </HostKpiGrid>

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Revenue vs occupancy</h2>
                <span>{currentYear}</span>
              </div>
              <div className="host-dashboard__chart host-dashboard__chart--tall">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={CHART_BLUE} strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
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
          </div>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Monthly breakdown</h2>
              <span>Revenue, fees & GST</span>
            </div>
            <div className="table-wrap host-dashboard__metrics-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Bookings</th>
                    <th>Occupancy</th>
                    <th>Platform fees</th>
                    <th>GST collected</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.monthly_revenue || []).map((m) => (
                    <tr key={m.month}>
                      <td data-label="Month">{m.month}</td>
                      <td data-label="Revenue">{formatCurrency(m.revenue ?? 0)}</td>
                      <td data-label="Bookings">{m.bookings ?? 0}</td>
                      <td data-label="Occupancy">{m.occupancy ?? 0}%</td>
                      <td data-label="Platform fees">{formatCurrency(m.platform_fees ?? 0)}</td>
                      <td data-label="GST">{formatCurrency(m.gst_collected ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Top performing rooms</h2>
              <Link to="/host/rooms" className="btn btn-ghost btn-sm">Manage listings</Link>
            </div>
            {topRooms.length === 0 ? (
              <div className="host-dashboard__empty">No paid bookings yet for {currentYear}.</div>
            ) : (
              <div className="host-dashboard__rank-list">
                {topRooms.slice(0, 5).map((room, index) => (
                  <article key={room.room_id || room.room_number} className="host-dashboard__rank-item">
                    <span className="host-dashboard__rank-num">{index + 1}</span>
                    <div>
                      <div className="host-dashboard__rank-title">{room.title || `Room ${room.room_number}`}</div>
                      <div className="host-dashboard__rank-meta">
                        {room.bookings} bookings
                        {room.avg_rating ? ` · ${Number(room.avg_rating).toFixed(1)} ★` : ''}
                      </div>
                    </div>
                    <div className="host-dashboard__rank-stat">{formatCurrency(room.revenue)}</div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'earnings' && (
        <>
          <HostKpiGrid>
            <HostKpi icon={IndianRupee} variant="earnings" label="YTD revenue" value={formatCurrency(stats.ytd_revenue ?? 0)} hint="Gross host earnings" />
            <HostKpi icon={Wallet} variant="bookings" label="Platform fees" value={formatCurrency(stats.ytd_platform_fees ?? 0)} hint="StayEase host fee" />
            <HostKpi icon={TrendingUp} variant="occupancy" label="Net earnings" value={formatCurrency(stats.net_earnings ?? 0)} hint="After fees" />
            <HostKpi icon={BarChart3} variant="rating" label="GST collected" value={formatCurrency(stats.ytd_gst_collected ?? 0)} hint="On your bookings" />
          </HostKpiGrid>

          <div className="host-dashboard__body">
            <section className="host-dashboard__panel host-dashboard__main">
              <div className="host-dashboard__panel-head">
                <h2>Revenue &amp; fees</h2>
                <span>{currentYear} summary</span>
              </div>
              <div className="host-earnings-list">
                <div className="host-earnings-row">
                  <span>Gross booking revenue</span>
                  <strong>{formatCurrency(stats.ytd_revenue ?? 0)}</strong>
                </div>
                <div className="host-earnings-row">
                  <span>Platform fees (3%)</span>
                  <strong>-{formatCurrency(stats.ytd_platform_fees ?? 0)}</strong>
                </div>
                <div className="host-earnings-row">
                  <span>Net host earnings</span>
                  <strong>{formatCurrency(stats.net_earnings ?? 0)}</strong>
                </div>
                <div className="host-earnings-row">
                  <span>GST collected from guests</span>
                  <strong>{formatCurrency(stats.ytd_gst_collected ?? 0)}</strong>
                </div>
                <div className="host-earnings-row">
                  <span>This month</span>
                  <strong>{formatCurrency(stats.month_revenue ?? 0)}</strong>
                </div>
              </div>
            </section>

            <section className="host-dashboard__panel host-dashboard__aside">
              <div className="host-dashboard__panel-head">
                <h2>Payout method</h2>
                <Link to="/host/settings#payments" className="btn btn-ghost btn-sm">Edit</Link>
              </div>
              {payoutLabel ? (
                <div className="host-earnings-stack">
                  <p style={{ margin: 0, fontWeight: 600 }}>{payoutLabel}</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Transfers are sent within 24 hours of guest check-in.
                  </p>
                  <Link to="/host/payouts" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                    View payout history
                  </Link>
                </div>
              ) : (
                <div className="host-dashboard__empty host-insights-empty__body">
                  <p>Set up UPI or bank details to receive earnings.</p>
                  <Link to="/host/settings#payments" className="btn btn-primary btn-sm">Set up payouts</Link>
                </div>
              )}
            </section>
          </div>

          {recentBookings.length > 0 && (
            <section className="host-dashboard__panel">
              <div className="host-dashboard__panel-head">
                <h2>Recent booking earnings</h2>
              </div>
              <div className="host-earnings-stack host-earnings-stack--spaced">
                {recentBookings.slice(0, 3).map((b) => (
                  <div key={b._id || b.id} className="card" style={{ padding: '1rem' }}>
                    <strong>{b.guest_name || 'Guest'}</strong>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      {formatStayRange(b.check_in_date, b.check_out_date)}
                    </span>
                    <HostPayoutBreakdown booking={b} compact />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === 'listings' && (
        <>
          <HostKpiGrid>
            <HostKpi icon={Building2} variant="bookings" label="Total listings" value={rooms.length} hint={`${stats.available_rooms ?? 0} live`} />
            <HostKpi icon={Star} variant="rating" label="Avg rating" value={Number(stats.avg_rating ?? 0).toFixed(1)} hint="Portfolio average" />
            <HostKpi icon={IndianRupee} variant="earnings" label="Booked tonight" value={stats.booked_rooms ?? 0} hint={`${stats.total_rooms ?? 0} total rooms`} />
            <HostKpi icon={Calendar} variant="occupancy" label="Draft / inactive" value={draftCount} hint="Need publishing" />
          </HostKpiGrid>

          <section className="host-dashboard__panel">
            <div className="host-dashboard__panel-head">
              <h2>Your listings</h2>
              <Link to="/host/rooms/add" className="btn btn-primary btn-sm">
                <Icon icon={Plus} size={ICON.sm} /> Add room
              </Link>
            </div>
            {rooms.length === 0 ? (
              <div className="host-dashboard__empty">
                <p>No listings yet. Add your first room to start hosting.</p>
                <Link to="/host/rooms/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create listing</Link>
              </div>
            ) : (
              <div className="host-listings-grid">
                {rooms.map((room) => {
                  const roomId = room._id || room.id;
                  const status = room.is_available ? 'Live' : 'Draft';
                  const location = [room.location?.area, room.location?.city].filter(Boolean).join(', ');
                  return (
                    <article key={roomId} className="host-listing-card">
                      <Link to={`/host/rooms/${roomId}/editor`} className="host-listing-card__media">
                        {room.photos?.[0]?.url ? (
                          <img src={room.photos[0].url} alt="" />
                        ) : (
                          <div className="host-listing-card__placeholder">
                            <Icon icon={Building2} size={ICON.xl} />
                          </div>
                        )}
                      </Link>
                      <div className="host-listing-card__body">
                        <div className="host-listing-card__top">
                          <div>
                            <h3>{room.title || 'Untitled listing'}</h3>
                            <p>{room.room_category || 'Room'} · {location || 'India'}</p>
                          </div>
                        </div>
                        <div className="host-listing-card__meta">
                          <span className={`host-listing-card__status host-listing-card__status--${room.is_available ? 'live' : 'draft'}`}>
                            {status}
                          </span>
                          <span>{formatCurrency(room.price_per_night)}/night</span>
                          {room.avg_rating ? <span>{Number(room.avg_rating).toFixed(1)} ★</span> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
