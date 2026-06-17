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
      <style>{`
        .referral-card { padding: 1.25rem; }
        .referral-card h3 { margin-bottom: 1rem; }
        .referral-card__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .referral-card__link {
          font-size: 0.8rem;
          color: var(--text-secondary);
          word-break: break-all;
        }
        .referral-card__stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .referral-card__stats div {
          display: flex;
          flex-direction: column;
        }
        .referral-card__stats span {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
