import { useEffect, useState } from 'react';
import { inquiriesApi } from '../../api/api';
import InquiryInbox from '../../components/InquiryInbox';
import Spinner from '../../components/Spinner';

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

  if (loading) {
    return <Spinner label="Loading guest messages..." />;
  }

  return (
    <div>
      <h1 className="page-title">Messages</h1>
      <p className="page-subtitle">Two-way conversations with guests interested in your listings.</p>
      <InquiryInbox
        inquiries={inquiries}
        scope="received"
        loading={loading}
        error={error}
        onRetry={load}
        onReplied={load}
      />
    </div>
  );
}
