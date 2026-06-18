import { useEffect, useState } from 'react';
import { inquiriesApi } from '../../api/api';
import InquiryInbox from '../../components/InquiryInbox';
import Spinner from '../../components/Spinner';

export default function Messages() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await inquiriesApi.list({ scope: 'sent' });
      setInquiries(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Messages</h1>
      <p className="page-subtitle">Messages you&apos;ve sent to hosts before booking.</p>
      <InquiryInbox
        inquiries={inquiries}
        scope="sent"
        loading={loading}
        error={error}
        onRetry={load}
      />
    </div>
  );
}
