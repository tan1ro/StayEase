import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SUPERHOSTS = [
  { name: 'Priya Sharma', size: 88, top: '18%', left: '8%' },
  { name: 'Rahul Mehta', size: 64, top: '12%', left: '38%' },
  { name: 'Ananya Reddy', size: 72, top: '8%', left: '68%' },
  { name: 'Vikram Singh', size: 56, top: '42%', left: '22%' },
  { name: 'Lakshmi Iyer', size: 80, top: '38%', left: '52%' },
  { name: 'Arjun K', size: 48, top: '55%', left: '78%' },
  { name: 'Meera S', size: 60, top: '62%', left: '6%' },
  { name: 'Karthik B', size: 52, top: '68%', left: '42%' },
];

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150&bold=true`;
}

export default function SuperhostGuidanceModal({ open, onStartAlone, onMatchSuperhost }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="listing-guidance-overlay" role="dialog" aria-modal="true" aria-labelledby="superhost-guidance-title">
      <div className="listing-guidance-modal">
        <div className="listing-guidance-modal__hero" aria-hidden="true">
          {SUPERHOSTS.map((host) => (
            <img
              key={host.name}
              className="listing-guidance-modal__avatar"
              src={avatarUrl(host.name)}
              alt=""
              width={host.size}
              height={host.size}
              style={{
                width: host.size,
                height: host.size,
                top: host.top,
                left: host.left,
              }}
            />
          ))}
        </div>

        <div className="listing-guidance-modal__body">
          <h2 id="superhost-guidance-title" className="listing-guidance-modal__title">
            Get one-to-one guidance from a Superhost
          </h2>
          <p className="listing-guidance-modal__text">
            We&apos;ll match you with an experienced host on StayEase. They&apos;ll guide you over chat or
            video as you list your property. You can also start on your own and get matched later.
          </p>
          <div className="listing-guidance-modal__actions">
            <button type="button" className="listing-guidance-modal__link" onClick={onStartAlone}>
              Start on your own
            </button>
            <button type="button" className="btn btn-primary listing-guidance-modal__cta" onClick={onMatchSuperhost}>
              Match with a Superhost
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
