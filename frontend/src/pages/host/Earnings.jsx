import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Wallet } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import HostSideNav from '../../components/host/HostSideNav';
import { Icon, ICON } from '../../components/ui/Icon';
import { analyticsApi, formatCurrency } from '../../api/api';

const TABS = [
  { id: 'performance', label: 'Performance', sub: 'Summary' },
  { id: 'upcoming', label: 'Upcoming', sub: 'Next payouts' },
  { id: 'paid', label: 'Paid', sub: 'Completed' },
  { id: 'reports', label: 'Reports', sub: 'GST & invoices' },
];

const TAB_META = {
  performance: { title: 'Performance', subtitle: 'Summary of your earnings and bookings' },
  upcoming: { title: 'Upcoming', subtitle: 'Payouts processing after guest check-in' },
  paid: { title: 'Paid', subtitle: 'Completed payouts to your account' },
  reports: { title: 'Reports', subtitle: 'GST invoices and tax documents' },
};

const MOCK_UPCOMING = [
  { id: 1, date: '2026-06-20', amount: 18400, bookings: 3 },
  { id: 2, date: '2026-07-05', amount: 9200, bookings: 1 },
];

const MOCK_PAID = [
  { id: 1, date: '2026-05-15', amount: 45000, method: 'UPI / Bank' },
  { id: 2, date: '2026-04-15', amount: 38200, method: 'UPI / Bank' },
];

function PayoutMethodCard() {
  return (
    <article className="host-panel card">
      <div className="host-panel__icon" aria-hidden="true">
        <Icon icon={Wallet} size={ICON.lg} />
      </div>
      <div className="host-panel__body">
        <h2>Payout method</h2>
        <p>Add your UPI or bank details to receive earnings after guest check-in.</p>
        <Link to="/host/payouts" className="btn btn-outline btn-sm">Set up payouts</Link>
      </div>
    </article>
  );
}

function GstReportsCard() {
  return (
    <article className="host-panel card">
      <div className="host-panel__icon" aria-hidden="true">
        <Icon icon={BarChart3} size={ICON.lg} />
      </div>
      <div className="host-panel__body">
        <h2>GST reports &amp; invoices</h2>
        <p>StayEase auto-generates CGST/SGST invoices for every paid booking. Download them from Bookings.</p>
        <Link to="/host/bookings" className="btn btn-outline btn-sm">Go to bookings</Link>
      </div>
    </article>
  );
}

export default function Earnings() {
  const [tab, setTab] = useState('performance');
  const [dashboard, setDashboard] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.hostDashboard(),
      analyticsApi.revenue({ year: new Date().getFullYear() }),
    ])
      .then(([dash, rev]) => {
        setDashboard(dash.data);
        setRevenue(rev.data);
      })
      .catch((err) => setError(err.normalized?.message || 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading earnings..." />;
  if (error) return <ErrorMessage message={error} />;

  const ytdRevenue = revenue?.months?.reduce((s, m) => s + (m.revenue || 0), 0) || 0;
  const ytdPlatformFees = revenue?.months?.reduce((s, m) => s + (m.platform_fees || 0), 0) || 0;
  const meta = TAB_META[tab];

  return (
    <div className="host-page host-split">
      <aside className="host-split__sidebar">
        <HostSideNav
          title="Earnings"
          items={TABS.map((t) => ({ ...t, onClick: setTab }))}
          activeId={tab}
        />
      </aside>

      <div className="host-split__main">
        <header className="host-split__header">
          <h1>{meta.title}</h1>
          <p className="host-page__subtitle">{meta.subtitle}</p>
        </header>

        {tab === 'performance' && (
          <div className="host-split__body">
            {dashboard?.active_bookings === 0 && ytdRevenue === 0 ? (
              <div className="host-empty-card host-empty-card--centered">
                <div className="host-empty-card__art">
                  <span className="host-empty-card__block host-empty-card__block--a" />
                  <span className="host-empty-card__block host-empty-card__block--b" />
                </div>
                <h2>You&apos;re ready to start earning</h2>
                <p>You&apos;ll see performance data here once you get your first booking on StayEase.</p>
              </div>
            ) : (
              <div className="stat-cards">
                <div className="stat-card card">
                  <div className="stat-card__label">YTD earnings</div>
                  <div className="stat-card__value">{formatCurrency(ytdRevenue)}</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-card__label">YTD platform fees</div>
                  <div className="stat-card__value">{formatCurrency(ytdPlatformFees)}</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-card__label">This month</div>
                  <div className="stat-card__value">{formatCurrency(dashboard?.month_revenue)}</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-card__label">Platform fees (month)</div>
                  <div className="stat-card__value">{formatCurrency(dashboard?.month_platform_fees || 0)}</div>
                </div>
                <div className="stat-card card">
                  <div className="stat-card__label">Active bookings</div>
                  <div className="stat-card__value">{dashboard?.active_bookings}</div>
                </div>
              </div>
            )}
            <div className="host-earnings-stack host-earnings-stack--spaced">
              <PayoutMethodCard />
            </div>
          </div>
        )}

        {tab === 'upcoming' && (
          <div className="host-split__body">
            <div className="host-earnings-list">
              {MOCK_UPCOMING.map((p) => (
                <div key={p.id} className="host-earnings-row card">
                  <div>
                    <strong>{formatCurrency(p.amount)}</strong>
                    <p>{p.date} · {p.bookings} booking{p.bookings > 1 ? 's' : ''}</p>
                  </div>
                  <span className="host-badge host-badge--pending">Processing</span>
                </div>
              ))}
            </div>
            <div className="host-earnings-stack host-earnings-stack--spaced">
              <PayoutMethodCard />
            </div>
          </div>
        )}

        {tab === 'paid' && (
          <div className="host-split__body">
            <div className="host-earnings-list">
              {MOCK_PAID.map((p) => (
                <div key={p.id} className="host-earnings-row card">
                  <div>
                    <strong>{formatCurrency(p.amount)}</strong>
                    <p>{p.date} · {p.method}</p>
                  </div>
                  <span className="host-badge host-badge--live">Paid</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="host-split__body">
            <div className="host-earnings-stack">
              <GstReportsCard />
              <PayoutMethodCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
