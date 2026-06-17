import { Link } from 'react-router-dom';
import {
  Bell,
  Camera,
  Clock,
  Cigarette,
  CigaretteOff,
  Headphones,
  ContactRound,
  PawPrint,
  Users,
  Wind,
  Wine,
  WineOff,
} from 'lucide-react';
import ListingPolicyModal from './ListingPolicyModal';
import { getCancellationTimeline } from '../utils/cancellationTimeline';
import { Icon, ICON } from './ui/Icon';

export function CancellationPolicyModal({ open, onClose, policy = 'moderate', checkIn, checkInTime }) {
  const timeline = getCancellationTimeline(policy, checkIn, checkInTime);

  return (
    <ListingPolicyModal
      open={open}
      onClose={onClose}
      title="Cancellation policy"
      footer={(
        <>
          <p className="listing-policy-modal__note">
            Time shown is based on the location of the listing.
          </p>
          <p className="listing-policy-modal__note">
            <strong>Refund eligibility</strong>
            <br />
            If you&apos;re making scheduled payments, your refund or amount due will depend on how much
            you&apos;ve paid at the time of cancellation.
          </p>
          <Link to="/terms#cancellation" className="listing-policy-modal__link">
            How to find any cancellation policy
          </Link>
        </>
      )}
    >
      <div className="policy-timeline">
        {timeline.map((item, index) => (
          <div key={item.tier} className="policy-timeline__item">
            <div>
              <strong className="policy-timeline__tier">{item.tier}</strong>
              <p className="policy-timeline__deadline">{item.deadline}</p>
              <p className="policy-timeline__desc">{item.description}</p>
            </div>
            {index < timeline.length - 1 && <hr className="policy-timeline__divider" />}
          </div>
        ))}
      </div>
    </ListingPolicyModal>
  );
}

function formatTime12(time = '14:00') {
  const [hourStr, minuteStr = '00'] = time.split(':');
  const hour = Number(hourStr);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${ampm}`;
}

export function HouseRulesModal({ open, onClose, room }) {
  const policies = room?.policies || {};
  const checkIn = formatTime12(policies.check_in_time || '14:00');
  const checkOut = formatTime12(policies.check_out_time || '11:00');

  const duringStay = [
    policies.pet_allowed
      ? { icon: PawPrint, text: 'Pets allowed' }
      : { icon: PawPrint, text: 'No pets' },
    room?.smoking_policy === 'smoking'
      ? { icon: Cigarette, text: 'Smoking allowed' }
      : { icon: CigaretteOff, text: 'No smoking' },
    room?.alcohol_policy === 'alcohol'
      ? { icon: Wine, text: 'Alcohol allowed on premises' }
      : { icon: WineOff, text: 'No alcohol on premises' },
    { icon: Users, text: `Maximum ${room?.max_guests || 2} guests` },
  ];

  return (
    <ListingPolicyModal
      open={open}
      onClose={onClose}
      title="House rules"
      subtitle="You'll be staying in someone's home, so please treat it with care and respect."
    >
      <section className="policy-section">
        <h3 className="policy-section__title">Checking in and out</h3>
        <div className="policy-list">
          <div className="policy-list__item">
            <Icon icon={Clock} size={ICON.lg} />
            <span>Check-in after {checkIn}</span>
          </div>
          <hr className="policy-list__divider" />
          <div className="policy-list__item">
            <Icon icon={Clock} size={ICON.lg} />
            <span>Checkout before {checkOut}</span>
          </div>
        </div>
      </section>

      <section className="policy-section">
        <h3 className="policy-section__title">During your stay</h3>
        <div className="policy-list">
          {duringStay.map((item, index) => {
            const PolicyIcon = item.icon;
            return (
              <div key={item.text}>
                <div className="policy-list__item">
                  <Icon icon={PolicyIcon} size={ICON.lg} />
                  <span>{item.text}</span>
                </div>
                {index < duringStay.length - 1 && <hr className="policy-list__divider" />}
              </div>
            );
          })}
        </div>
      </section>
    </ListingPolicyModal>
  );
}

export function SafetyPropertyModal({ open, onClose, room }) {
  const policies = room?.policies || {};
  const hasSmoking = room?.smoking_policy === 'smoking' || policies.smoking_allowed;

  return (
    <ListingPolicyModal
      open={open}
      onClose={onClose}
      title="Safety & property"
      subtitle="Avoid surprises by looking over these important details about your host's property."
    >
      <section className="policy-section">
        <h3 className="policy-section__title">Safety devices</h3>
        <div className="policy-list">
          <div className="policy-list__item policy-list__item--stacked">
            <Icon icon={Camera} size={ICON.lg} />
            <div>
              <strong>Exterior security cameras on property</strong>
              <p className="policy-list__subtext">
                Cameras monitor the entrance and common areas for guest safety. No cameras inside private rooms.
              </p>
            </div>
          </div>
          <hr className="policy-list__divider" />
          <div className="policy-list__item">
            <Icon icon={Wind} size={ICON.lg} />
            <span>{hasSmoking ? 'Carbon monoxide alarm installed' : 'No carbon monoxide alarm'}</span>
          </div>
          <hr className="policy-list__divider" />
          <div className="policy-list__item">
            <Icon icon={Bell} size={ICON.lg} />
            <span>Smoke alarm installed</span>
          </div>
        </div>
      </section>

      <section className="policy-section">
        <h3 className="policy-section__title">Property info</h3>
        <div className="policy-list">
          <div className="policy-list__item">
            <Icon icon={Headphones} size={ICON.lg} />
            <span>24/7 StayEase guest support available</span>
          </div>
          <hr className="policy-list__divider" />
          <div className="policy-list__item">
            <Icon icon={ContactRound} size={ICON.lg} />
            <span>Valid government ID required at check-in</span>
          </div>
        </div>
      </section>
    </ListingPolicyModal>
  );
}
