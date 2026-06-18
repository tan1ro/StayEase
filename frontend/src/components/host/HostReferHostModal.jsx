import { useEffect, useMemo, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import Modal from '../Modal';
import { referralsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Icon, ICON } from '../ui/Icon';

function buildHostReferralLink(code) {
  if (!code) return '';
  const params = new URLSearchParams({ ref: code, as: 'host' });
  return `${window.location.origin}/register?${params.toString()}`;
}

export default function HostReferHostModal({ open, onClose }) {
  const { user } = useAuth();
  const [code, setCode] = useState(user?.referral_code || '');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    if (user?.referral_code) {
      setCode(user.referral_code);
      return;
    }
    setLoading(true);
    referralsApi.myCode()
      .then(({ data }) => setCode(data.referral_code || ''))
      .catch(() => setCode(''))
      .finally(() => setLoading(false));
  }, [open, user?.referral_code]);

  const referralLink = useMemo(() => buildHostReferralLink(code), [code]);

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Join StayEase as a host',
        text: 'Sign up on StayEase with my referral link and start hosting with GST-ready billing.',
        url: referralLink,
      });
      return;
    }
    await copyLink();
  };

  return (
    <Modal open={open} onClose={onClose} title="Refer a host" size="sm">
      <div className="host-refer-modal">
        <p className="host-refer-modal__lead">
          Invite someone to host on StayEase. When they sign up with your link, you earn
          {' '}
          <strong>₹200</strong>
          {' '}
          in referral credits.
        </p>

        {loading ? (
          <p className="host-refer-modal__muted">Loading your referral link…</p>
        ) : code ? (
          <>
            <div className="host-refer-modal__field">
              <span className="host-refer-modal__label">Your code</span>
              <strong className="host-refer-modal__code">{code}</strong>
            </div>

            <div className="host-refer-modal__link-box">
              <span className="host-refer-modal__link">{referralLink}</span>
            </div>

            <div className="host-refer-modal__actions">
              <button type="button" className="btn btn-outline" onClick={copyLink}>
                <Icon icon={Copy} size={ICON.sm} />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button type="button" className="btn btn-primary" onClick={shareLink}>
                <Icon icon={Share2} size={ICON.sm} />
                Share
              </button>
            </div>
          </>
        ) : (
          <p className="host-refer-modal__muted">Could not load your referral code. Try again later.</p>
        )}
      </div>
    </Modal>
  );
}
