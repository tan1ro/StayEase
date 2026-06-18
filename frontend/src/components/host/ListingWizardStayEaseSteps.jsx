import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Bolt,
  CalendarCheck,
  CircleHelp,
  FileText,
  Leaf,
  MessageCircle,
  Pencil,
  Receipt,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '../../api/api';
import Modal from '../Modal';
import { Icon, ICON } from '../ui/Icon';
import { STAY_VIBES, STAYEASE_OFFERS } from '../../constants/stayVibes';
import { FACING_OPTIONS, VIEW_TYPE_LABELS } from '../../constants/roomPlacement';
import { listingPricePreview, guestPaysPerNightInclGst } from '../../utils/listingPricePreview';
import { hotelGstSlabSummary } from '../../constants/hotelGstSlabs';
import { LISTING_SAFETY_LINKS, SAFETY_DISCLOSURE_ITEMS } from '../../constants/listingSafetyLinks';
import HotelGstInfoAlert from './HotelGstInfoAlert';

export function StayVibesStep({ selected, onChange, category }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
      return;
    }
    if (selected.length >= 2) return;
    onChange([...selected, id]);
  };

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">
        What makes your {category?.toLowerCase() || 'room'} special?
      </h1>
      <p className="listing-wizard__subtitle">
        Choose up to 2 StayEase highlights. We&apos;ll use these to draft your listing description.
      </p>
      <div className="listing-wizard__vibe-grid">
        {STAY_VIBES.map(({ id, label, icon: VibeIcon }) => {
          const isActive = selected.includes(id);
          const isDisabled = !isActive && selected.length >= 2;
          return (
            <button
              key={id}
              type="button"
              className={`listing-wizard__vibe ${isActive ? 'listing-wizard__vibe--active' : ''}`}
              disabled={isDisabled}
              onClick={() => toggle(id)}
            >
              <Icon icon={VibeIcon} size={ICON.md} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <p className="listing-wizard__vibe-hint">
        <Icon icon={Leaf} size={ICON.sm} />
        StayEase highlights are tailored for Indian hotel and homestay guests.
      </p>
    </div>
  );
}

export function TitleStep({ title, roomNumber, onTitle, onRoomNumber }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Give your room a catchy title</h1>
      <p className="listing-wizard__subtitle">
        Short titles work best on StayEase search. You can always edit this later.
      </p>
      <div className="form-group">
        <input
          className="input listing-wizard__title-input"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="e.g. Sunlit double room near MG Road"
          maxLength={50}
        />
        <span className="form-hint">{title.length}/50</span>
      </div>
      <div className="form-group" style={{ marginTop: '1.25rem' }}>
        <label className="label">Room number</label>
        <input
          className="input"
          value={roomNumber}
          onChange={(e) => onRoomNumber(e.target.value)}
          placeholder="e.g. 204"
        />
      </div>
    </div>
  );
}

export function DescriptionStep({ description, onChange, vibeCount }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Create your description</h1>
      <p className="listing-wizard__subtitle">
        Share what makes your stay special{vibeCount > 0 ? ' — we pre-filled ideas from your highlights' : ''}.
      </p>
      <textarea
        className="textarea listing-wizard__description-input"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your room, neighbourhood, and what guests will love..."
        rows={8}
      />
      <span className="form-hint">{description.length} characters · minimum 50 to publish</span>
    </div>
  );
}

export function HospitalityStep({ form, set, setPol }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Indian hospitality preferences</h1>
      <p className="listing-wizard__subtitle">
        Help guests know what to expect — food, house rules, and local norms.
      </p>
      <div className="listing-wizard__hospitality-card">
        <label className="label">Food served at property</label>
        <div className="listing-wizard__pill-row">
          {[
            { value: 'veg', label: 'Pure veg' },
            { value: 'both', label: 'Veg & non-veg' },
            { value: 'nonveg', label: 'Non-veg only' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`pill ${form.food_preference === value ? 'pill--active' : ''}`}
              onClick={() => set('food_preference', value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="listing-wizard__hospitality-card">
        <label className="label">Smoking policy</label>
        <div className="listing-wizard__pill-row">
          {[
            { value: 'non_smoking', label: 'Non-smoking' },
            { value: 'smoking', label: 'Smoking allowed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`pill ${form.smoking_policy === value ? 'pill--active' : ''}`}
              onClick={() => {
                set('smoking_policy', value);
                setPol('smoking_allowed', value === 'smoking');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="listing-wizard__hospitality-card">
        <label className="label">Alcohol policy</label>
        <div className="listing-wizard__pill-row">
          {[
            { value: 'non_alcohol', label: 'No alcohol' },
            { value: 'alcohol', label: 'Alcohol allowed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`pill ${form.alcohol_policy === value ? 'pill--active' : ''}`}
              onClick={() => {
                set('alcohol_policy', value);
                setPol('alcohol_allowed', value === 'alcohol');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="listing-wizard__hospitality-card">
        <label className="label">View from the room</label>
        <select
          className="select"
          value={form.view_type}
          onChange={(e) => set('view_type', e.target.value)}
        >
          {Object.entries(VIEW_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <label className="label" style={{ marginTop: '1rem' }}>Facing side</label>
        <select
          className="select"
          value={form.facing_side || 'none'}
          onChange={(e) => set('facing_side', e.target.value)}
        >
          {FACING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <label className="label" style={{ marginTop: '1rem' }}>Floor label (optional)</label>
        <input
          className="input"
          value={form.floor_label || ''}
          onChange={(e) => set('floor_label', e.target.value)}
          placeholder="e.g. 4th floor"
          maxLength={40}
        />
        <label className="label" style={{ marginTop: '1rem' }}>View notes for guests (optional)</label>
        <textarea
          className="textarea"
          rows={3}
          value={form.view_description || ''}
          onChange={(e) => set('view_description', e.target.value)}
          placeholder="Describe which side has the best view, balcony outlook, etc."
          maxLength={300}
        />
        <label className="listing-wizard__checkbox" style={{ marginTop: '1rem' }}>
          <input
            type="checkbox"
            checked={form.has_balcony}
            onChange={(e) => set('has_balcony', e.target.checked)}
          />
          <span>Room has a balcony</span>
        </label>
      </div>
    </div>
  );
}

function gstSlabLabel(price) {
  return hotelGstSlabSummary(price);
}

const BOOKING_MODES = [
  {
    id: 'review_first',
    label: 'Approve your first 5 bookings',
    recommended: true,
    description: 'Start by reviewing reservation requests, then switch to Instant Book so guests can book automatically.',
    icon: CalendarCheck,
  },
  {
    id: 'instant_book',
    label: 'Use Instant Book',
    description: 'Let guests book automatically.',
    icon: Bolt,
  },
];

export function BookingSettingsStep({ bookingMode, onBookingMode }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow listing-wizard__step--centered">
      <h1 className="listing-wizard__title">Pick your booking settings</h1>
      <p className="listing-wizard__subtitle">
        You can change this at any time in your listing settings.
      </p>
      <div className="listing-wizard__option-list" role="radiogroup" aria-label="Booking settings">
        {BOOKING_MODES.map(({ id, label, recommended, description, icon: ModeIcon }) => {
          const isActive = bookingMode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`listing-wizard__option-row ${isActive ? 'listing-wizard__option-row--active' : ''}`}
              onClick={() => onBookingMode(id)}
            >
              <div>
                {recommended && <span className="listing-wizard__recommended-badge">Recommended</span>}
                <strong>{label}</strong>
                <p>{description}</p>
              </div>
              <Icon icon={ModeIcon} size={ICON.lg} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceTierModal({
  open,
  onClose,
  title,
  price,
  onPrice,
  weekendBoost,
  onWeekendBoost,
  isWeekend,
}) {
  const preview = listingPricePreview(price);
  const { gst } = preview;

  const handlePriceChange = (raw) => {
    const next = Math.max(100, Math.round(Number(raw) || 0));
    if (isWeekend && onWeekendBoost) {
      const weekday = Math.max(100, Math.round(next / (1 + weekendBoost / 100)));
      onPrice(weekday);
      return;
    }
    onPrice(next);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="listing-wizard__price-modal">
        <div className="listing-wizard__price-modal-hero">
          <div className="listing-wizard__price-display">
            <span>₹</span>
            <input
              type="number"
              min={100}
              step={50}
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              aria-label={`${title} price per night`}
            />
            <Icon icon={Pencil} size={ICON.sm} />
          </div>
        </div>
        <div className="listing-wizard__price-modal-breakdown">
          <div className="listing-wizard__price-modal-row">
            <span>Base price</span>
            <span>{formatCurrency(preview.subtotal)}</span>
          </div>
          <div className="listing-wizard__price-modal-row">
            <span>Guest service fee</span>
            <span>{formatCurrency(preview.guestPlatformFee)}</span>
          </div>
          <div className="listing-wizard__price-modal-row listing-wizard__price-modal-row--total">
            <span>Guest price before taxes</span>
            <span>{formatCurrency(preview.guestPriceBeforeTaxes)}</span>
          </div>
        </div>
        <p className="listing-wizard__price-modal-earn">
          You earn <strong>{formatCurrency(preview.hostEarns)}</strong>
        </p>
        <div className="listing-wizard__gst-card listing-wizard__gst-card--modal">
          <p className="listing-wizard__gst-slab">
            <Icon icon={Receipt} size={ICON.sm} />
            GST slab: {gstSlabLabel(price)}
          </p>
          <div className="listing-wizard__gst-rows">
            <span>CGST ({(gst.cgst_rate * 100).toFixed(1).replace(/\.0$/, '')}%)</span>
            <span>{formatCurrency(gst.cgst_amount)}</span>
            <span>SGST ({(gst.sgst_rate * 100).toFixed(1).replace(/\.0$/, '')}%)</span>
            <span>{formatCurrency(gst.sgst_amount)}</span>
            <span className="listing-wizard__gst-rows-total">Guest pays (incl. GST)</span>
            <span className="listing-wizard__gst-rows-total">
              {formatCurrency(preview.guestPaysInclGst)}
            </span>
          </div>
        </div>
        <div className="listing-wizard__price-modal-actions">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PricingGstStep({ price, onPrice, weekendBoost, onWeekendBoost }) {
  const [modalTier, setModalTier] = useState(null);
  const weekdayPrice = Math.max(100, Math.round(Number(price) || 0));
  const weekendPrice = Math.round(weekdayPrice * (1 + weekendBoost / 100));
  const weekdayGuestTotal = guestPaysPerNightInclGst(weekdayPrice);
  const weekendGuestTotal = guestPaysPerNightInclGst(weekendPrice);

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow listing-wizard__step--centered">
      <h1 className="listing-wizard__title">Now, set your nightly price</h1>
      <p className="listing-wizard__subtitle">
        Tip: {formatCurrency(weekdayGuestTotal)} incl. GST is a common guest price in your area.
        {' '}
        You can change this anytime.
      </p>
      <div className="listing-wizard__price-tier-grid">
        <button
          type="button"
          className="listing-wizard__price-tier"
          onClick={() => setModalTier('weekday')}
        >
          <span className="listing-wizard__price-tier-label">Weekday</span>
          <span className="listing-wizard__price-tier-value">{formatCurrency(weekdayGuestTotal)}</span>
          <span className="listing-wizard__price-tier-note">per night incl. GST</span>
        </button>
        <button
          type="button"
          className="listing-wizard__price-tier"
          onClick={() => setModalTier('weekend')}
        >
          <span className="listing-wizard__price-tier-label">Weekend</span>
          <span className="listing-wizard__price-tier-value">{formatCurrency(weekendGuestTotal)}</span>
          <span className="listing-wizard__price-tier-note">Fri &amp; Sat · incl. GST</span>
        </button>
      </div>
      <div className="listing-wizard__weekend-card listing-wizard__weekend-card--centered">
        <div>
          <strong>Weekend adjustment</strong>
          <p>Adjust how much higher Fri &amp; Sat rates are vs weekday.</p>
        </div>
        <div className="listing-wizard__weekend-controls">
          <button type="button" className="listing-wizard__counter-btn" onClick={() => onWeekendBoost(Math.max(0, weekendBoost - 1))}>−</button>
          <span>+{weekendBoost}%</span>
          <button type="button" className="listing-wizard__counter-btn" onClick={() => onWeekendBoost(Math.min(30, weekendBoost + 1))}>+</button>
        </div>
      </div>
      <HotelGstInfoAlert pricePerNight={weekdayPrice} />
      <PriceTierModal
        open={modalTier === 'weekday'}
        onClose={() => setModalTier(null)}
        title="Weekday"
        price={weekdayPrice}
        onPrice={onPrice}
        isWeekend={false}
      />
      <PriceTierModal
        open={modalTier === 'weekend'}
        onClose={() => setModalTier(null)}
        title="Weekend"
        price={weekendPrice}
        onPrice={onPrice}
        weekendBoost={weekendBoost}
        onWeekendBoost={onWeekendBoost}
        isWeekend
      />
    </div>
  );
}

export function OffersStep({ selected, onChange }) {
  const toggle = (id) => {
    onChange(
      selected.includes(id) ? selected.filter((o) => o !== id) : [...selected, id],
    );
  };

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow listing-wizard__step--centered">
      <h1 className="listing-wizard__title">Boost bookings with StayEase offers</h1>
      <p className="listing-wizard__subtitle">
        Select launch discounts — you can fine-tune them in Manage Offers after publishing.
      </p>
      <div className="listing-wizard__offer-list">
        {STAYEASE_OFFERS.map(({ id, label, description, percent }) => (
          <label key={id} className="listing-wizard__offer-row">
            <div>
              <strong>{label}</strong>
              <span className="listing-wizard__offer-badge">{percent}% off</span>
              <p>{description}</p>
            </div>
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => toggle(id)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function SafetyStep({ amenities, onAmenitiesChange, safetyDisclosures, onSafetyDisclosuresChange }) {
  const isChecked = (item) => {
    if (item.amenityKey) return amenities.includes(item.amenityKey);
    return Boolean(safetyDisclosures?.[item.id]);
  };

  const toggleItem = (item) => {
    if (item.amenityKey) {
      const has = amenities.includes(item.amenityKey);
      onAmenitiesChange(
        has ? amenities.filter((a) => a !== item.amenityKey) : [...amenities, item.amenityKey],
      );
      return;
    }
    onSafetyDisclosuresChange({
      ...safetyDisclosures,
      [item.id]: !safetyDisclosures?.[item.id],
    });
  };

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow listing-wizard__step--centered">
      <h1 className="listing-wizard__title">Share safety details</h1>
      <p className="listing-wizard__safety-question">
        Does your place have any of these?
        <button
          type="button"
          className="listing-wizard__safety-help"
          aria-label="Learn more about safety disclosures"
          title="Disclose security cameras, noise monitors, and weapons so guests know what to expect."
        >
          <Icon icon={CircleHelp} size={ICON.sm} />
        </button>
      </p>
      <div className="listing-wizard__safety-list">
        {SAFETY_DISCLOSURE_ITEMS.map((item) => (
          <label key={item.id} className="listing-wizard__safety-row">
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={isChecked(item)}
              onChange={() => toggleItem(item)}
            />
          </label>
        ))}
      </div>
      <div className="listing-wizard__safety-important">
        <h2>Important things to know</h2>
        <p>
          Security cameras that monitor indoor spaces are not allowed even if they&apos;re turned off.
          All exterior security cameras must be disclosed.
        </p>
        <p>
          Be sure to comply with your{' '}
          <Link to={LISTING_SAFETY_LINKS.localLaws}>local laws</Link>
          {' '}and review StayEase&apos;s{' '}
          <Link to={LISTING_SAFETY_LINKS.antiDiscrimination}>anti-discrimination policy</Link>
          {' '}and{' '}
          <Link to={LISTING_SAFETY_LINKS.serviceFees}>StayEase Service Fees</Link>
          .
        </p>
      </div>
    </div>
  );
}

export function ReviewPublishStep({ form, photosCount, plannedOffers }) {
  const preview = listingPricePreview(form.price_per_night);
  const bookingLabel = form.booking_mode === 'instant_book'
    ? 'Instant Book'
    : 'Review first 5 bookings';

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Ready to publish on StayEase?</h1>
      <p className="listing-wizard__subtitle">Review your listing before it goes live to guests across India.</p>
      <div className="listing-wizard__review-card">
        <h3>{form.title || 'Untitled room'}</h3>
        <p>{form.location.area}, {form.location.city} · {form.room_category} · Room {form.room_number || '—'}</p>
        <div className="listing-wizard__review-stats">
          <div>
            <Icon icon={BadgeIndianRupee} size={ICON.md} />
            <span>{formatCurrency(form.price_per_night)}/night</span>
          </div>
          <div>
            <Icon icon={Receipt} size={ICON.md} />
            <span>{formatCurrency(preview.guestPriceBeforeTaxes)} + taxes</span>
          </div>
          <div>
            <Icon icon={Zap} size={ICON.md} />
            <span>{bookingLabel}</span>
          </div>
          <div>
            <Icon icon={FileText} size={ICON.md} />
            <span>{photosCount} photo{photosCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {plannedOffers.length > 0 && (
          <p className="listing-wizard__review-offers">
            Launch offers selected: {plannedOffers.length} — set up in Manage Offers after publish.
          </p>
        )}
      </div>
      <ul className="listing-wizard__review-perks">
        <li><Icon icon={Zap} size={ICON.sm} /> Instant GST invoice on every booking</li>
        <li><Icon icon={MessageCircle} size={ICON.sm} /> WhatsApp booking alerts to you and guests</li>
        <li><Icon icon={ShieldCheck} size={ICON.sm} /> Flexible, moderate, or strict cancellation policies</li>
      </ul>
    </div>
  );
}

export function FinishIntro() {
  return (
    <div className="listing-wizard__intro">
      <div className="listing-wizard__intro-text">
        <p className="listing-wizard__step-label">Step 3</p>
        <h1>Finish up and publish</h1>
        <p>
          Set Indian hospitality preferences, preview GST-inclusive pricing, and launch on StayEase
          with automated invoices, email confirmations, and host analytics.
        </p>
      </div>
      <div className="listing-wizard__intro-art" aria-hidden="true">
        <div className="listing-wizard__house-illustration listing-wizard__house-illustration--gst">
          <Receipt size={120} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
