import { useEffect, useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { inquiriesApi } from '../../api/api';
import InquiryInbox from '../../components/InquiryInbox';
import Spinner from '../../components/Spinner';
import {
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostPage,
  HostPanel,
} from '../../components/host/HostPageLayout';

export default function HostMessages() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await inquiriesApi.list({ scope: 'received' });
      setInquiries(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner label="Loading guest messages..." />;

  const open = inquiries.filter((i) => i.status !== 'closed').length;

  return (
    <HostPage>
      <HostHero
        title="Messages"
        subtitle="Two-way conversations with guests interested in your listings."
        pills={[`${inquiries.length} threads`, `${open} open`]}
      />

      <HostKpiGrid>
        <HostKpi icon={MessageCircle} variant="bookings" label="Total threads" value={inquiries.length} hint="All conversations" />
        <HostKpi icon={Users} variant="rating" label="Open" value={open} hint="Awaiting reply" />
        <HostKpi icon={MessageCircle} variant="earnings" label="Closed" value={inquiries.length - open} hint="Resolved" />
        <HostKpi icon={Users} variant="occupancy" label="Response rate" value={inquiries.length ? `${Math.round(((inquiries.length - open) / inquiries.length) * 100)}%` : '—'} hint="Closed vs total" />
      </HostKpiGrid>

      <HostPanel title="Inbox">
        <InquiryInbox
          inquiries={inquiries}
          scope="received"
          loading={loading}
          error={error}
          onRetry={load}
          onReplied={load}
        />
      </HostPanel>
    </HostPage>
  );
}
