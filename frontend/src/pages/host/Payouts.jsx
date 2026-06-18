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
import { formatCurrency } from '../../api/api';

const MOCK_PAYOUTS = [
  { id: 1, date: '2025-05-15', amount: 45000, status: 'paid', method: 'Bank transfer' },
  { id: 2, date: '2025-04-15', amount: 38200, status: 'paid', method: 'Bank transfer' },
  { id: 3, date: '2025-06-01', amount: 12500, status: 'pending', method: 'Bank transfer' },
];

export default function Payouts() {
  const total = MOCK_PAYOUTS.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = MOCK_PAYOUTS.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <HostPage>
      <HostHero
        title="Payouts"
        subtitle="Track transfers to your bank or UPI after guest check-in."
        pills={[`${formatCurrency(total)} paid`, `${formatCurrency(pending)} pending`]}
      />

      <HostKpiGrid>
        <HostKpi icon={IndianRupee} variant="earnings" label="Total paid out" value={formatCurrency(total)} hint="All time" />
        <HostKpi icon={Wallet} variant="bookings" label="Pending" value={formatCurrency(pending)} hint="Processing" />
        <HostKpi icon={Calendar} variant="occupancy" label="Next payout" value="Jun 15" hint="Estimated date" />
        <HostKpi icon={Wallet} variant="rating" label="Method" value="Bank" hint="Primary account" />
      </HostKpiGrid>

      <HostPanel title="Payout history" subtitle="Recent transfers to your account">
        <HostList>
          {MOCK_PAYOUTS.map((p) => (
            <HostListItem
              key={p.id}
              title={formatCurrency(p.amount)}
              meta={`${p.date} · ${p.method}`}
              value={(
                <span className={`host-badge host-badge--${p.status === 'paid' ? 'live' : 'pending'}`}>
                  {p.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              )}
            />
          ))}
        </HostList>
      </HostPanel>
    </HostPage>
  );
}
