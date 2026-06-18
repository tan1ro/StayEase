import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, IndianRupee, Wallet } from 'lucide-react';
import {
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostList,
  HostListItem,
  HostPage,
  HostPanel,
} from '../../components/host/HostPageLayout';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { analyticsApi, bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_HOST_PAYOUT_PREFS,
  HOST_PAYOUT_PREFS_KEY,
  loadJsonPref,
  payoutMethodLabel,
} from '../../constants/accountSettings';

export default function Payouts() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const payoutPrefs = useMemo(
    () => loadJsonPref(HOST_PAYOUT_PREFS_KEY, DEFAULT_HOST_PAYOUT_PREFS),
    [],
  );

  useEffect(() => {
    if (!hostId) return;
    setLoading(true);
    Promise.all([
      analyticsApi.dashboard().then(({ data }) => data),
      bookingsApi.list({ host_id: hostId }).then(({ data }) => data || []),
    ])
      .then(([dash, list]) => {
        setStats(dash);
        setBookings(list);
      })
      .catch((err) => setError(err.normalized?.message || 'Failed to load payouts'))
      .finally(() => setLoading(false));
  }, [hostId]);

  const paidBookings = bookings.filter((b) => b.payment_status === 'paid' && b.status !== 'cancelled');
  const pendingPayout = paidBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.host_payout ?? b.subtotal ?? 0), 0);
  const totalPaid = paidBookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.host_payout ?? b.subtotal ?? 0), 0);

  const payoutHistory = paidBookings
    .slice()
    .sort((a, b) => (b.check_out_date || '').localeCompare(a.check_out_date || ''))
    .slice(0, 8);

  if (loading) return <Spinner label="Loading payouts..." />;
  if (error) return <ErrorMessage message={error} />;

  const payoutLabel = payoutMethodLabel(payoutPrefs);

  return (
    <HostPage>
      <HostHero
        title="Payouts"
        subtitle="Track transfers to your bank or UPI after guest check-in."
        pills={[`${formatCurrency(totalPaid)} paid out`, `${formatCurrency(pendingPayout)} pending`]}
      />

      <HostKpiGrid>
        <HostKpi icon={IndianRupee} variant="earnings" label="Total paid out" value={formatCurrency(totalPaid)} hint="Completed stays" />
        <HostKpi icon={Wallet} variant="bookings" label="Pending transfer" value={formatCurrency(pendingPayout)} hint="Confirmed & paid" />
        <HostKpi icon={Calendar} variant="occupancy" label="This month" value={formatCurrency(stats?.month_revenue ?? 0)} hint="Host earnings" />
        <HostKpi icon={Wallet} variant="rating" label="Payout method" value={payoutLabel ? 'Set up' : 'Not set'} hint={payoutLabel || 'Add in settings'} />
      </HostKpiGrid>

      {!payoutLabel && (
        <div className="host-dashboard__draft-banner">
          <div>
            <strong>Set up your payout method</strong>
            <p>Add UPI or bank details in settings to receive earnings after check-in.</p>
          </div>
          <Link to="/host/settings#payments" className="btn btn-primary btn-sm">Set up payouts</Link>
        </div>
      )}

      <HostPanel title="Payout history" subtitle="Based on paid bookings from your listings">
        {payoutHistory.length === 0 ? (
          <div className="host-dashboard__empty">Payouts appear here once guests complete paid stays.</div>
        ) : (
          <HostList>
            {payoutHistory.map((b) => (
              <HostListItem
                key={b._id || b.id}
                title={formatCurrency(b.host_payout ?? b.subtotal ?? b.total_price)}
                meta={`${b.guest_name || 'Guest'} · ${b.room_title || 'Room'} · Check-out ${b.check_out_date || '—'}`}
                value={(
                  <span className={`host-badge host-badge--${b.status === 'completed' ? 'live' : 'pending'}`}>
                    {b.status === 'completed' ? 'Paid' : 'Pending'}
                  </span>
                )}
              />
            ))}
          </HostList>
        )}
      </HostPanel>
    </HostPage>
  );
}
