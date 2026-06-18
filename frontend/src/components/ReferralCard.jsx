import { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';

export default function ReferralCard({ code, credits = 0, referredCount = 0 }) {
  const [copied, setCopied] = useState(false);
  const shareLink = `${window.location.origin}/register?ref=${code}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'StayEase Referral', url: shareLink });
    } else {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="referral-card card">
      <h3>Refer &amp; Earn</h3>
      <div className="referral-card__row">
        <span>Your code: <strong>{code}</strong></span>
        <button type="button" className="btn btn-outline btn-sm" onClick={copyCode}>
          <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="referral-card__row">
        <span className="referral-card__link">{shareLink}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={share}>
          <Share2 size={14} /> Share
        </button>
      </div>
      <div className="referral-card__stats">
        <div><strong>₹{credits}</strong><span>Credits earned</span></div>
        <div><strong>{referredCount}</strong><span>People referred</span></div>
      </div>
    </div>
  );
}
