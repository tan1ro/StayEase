import {
  BadgeIndianRupee,
  FileText,
  Leaf,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '../../api/api';
import { calculateGST } from '../GSTBreakdown';
import { Icon, ICON } from '../ui/Icon';
import { STAY_VIBES, STAYEASE_OFFERS } from '../../constants/stayVibes';

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
    </div>
  );
}

function gstSlabLabel(price) {
  if (price < 1000) return '0% — tariff under ₹1,000/night';
  if (price <= 7500) return '12% — standard hotel slab (₹1,000–₹7,500)';
  return '18% — premium slab (above ₹7,500)';
}

export function PricingGstStep({ price, onPrice, weekendBoost, onWeekendBoost }) {
  const gst = calculateGST(price, 1);
  const weekendPrice = Math.round(price * (1 + weekendBoost / 100));

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Set your price with GST insight</h1>
      <p className="listing-wizard__subtitle">
        StayEase calculates CGST &amp; SGST automatically on every booking — unique to Indian hotel billing.
      </p>
      <div className="listing-wizard__price-hero">
        <span className="listing-wizard__price-label">Base price per night</span>
        <div className="listing-wizard__price-display">
          <span>₹</span>
          <input
            type="number"
            min={100}
            step={50}
            value={price}
            onChange={(e) => onPrice(Number(e.target.value))}
            aria-label="Base price per night"
          />
        </div>
        <p className="listing-wizard__gst-slab">
          <Icon icon={Receipt} size={ICON.sm} />
          GST slab: {gstSlabLabel(price)}
        </p>
      </div>
      <div className="listing-wizard__gst-card">
        <h3>Guest pays (1 night, incl. GST)</h3>
        <p className="listing-wizard__gst-total">{formatCurrency(gst.grand_total)}</p>
        <div className="listing-wizard__gst-rows">
          <span>Room tariff</span><span>{formatCurrency(gst.subtotal)}</span>
          <span>CGST ({(gst.cgst_rate * 100).toFixed(0)}%)</span><span>{formatCurrency(gst.cgst_amount)}</span>
          <span>SGST ({(gst.sgst_rate * 100).toFixed(0)}%)</span><span>{formatCurrency(gst.sgst_amount)}</span>
        </div>
      </div>
      <div className="listing-wizard__weekend-card">
        <div>
          <strong>Weekend adjustment</strong>
          <p>Fri &amp; Sat suggested rate: {formatCurrency(weekendPrice)}</p>
        </div>
        <div className="listing-wizard__weekend-controls">
          <button type="button" className="listing-wizard__counter-btn" onClick={() => onWeekendBoost(Math.max(0, weekendBoost - 1))}>−</button>
          <span>+{weekendBoost}%</span>
          <button type="button" className="listing-wizard__counter-btn" onClick={() => onWeekendBoost(Math.min(30, weekendBoost + 1))}>+</button>
        </div>
      </div>
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
    <div className="listing-wizard__step listing-wizard__step--narrow">
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

export function SafetyStep({ amenities, onAmenitiesChange, gstRegistered, onGstRegistered }) {
  const hasCctv = amenities.includes('CCTV');
  const toggleCctv = () => {
    onAmenitiesChange(
      hasCctv ? amenities.filter((a) => a !== 'CCTV') : [...amenities, 'CCTV'],
    );
  };

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Safety &amp; compliance</h1>
      <p className="listing-wizard__subtitle">StayEase requires transparency for guest trust and Indian regulations.</p>
      <div className="listing-wizard__safety-list">
        <label className="listing-wizard__safety-row">
          <span>Exterior CCTV in common areas</span>
          <input type="checkbox" checked={hasCctv} onChange={toggleCctv} />
        </label>
        <label className="listing-wizard__safety-row">
          <span>Property is GST-registered for invoicing</span>
          <input type="checkbox" checked={gstRegistered} onChange={(e) => onGstRegistered(e.target.checked)} />
        </label>
      </div>
      <div className="listing-wizard__compliance-note">
        <Icon icon={ShieldCheck} size={ICON.md} />
        <p>
          StayEase generates tax invoices with CGST/SGST split on every paid booking.
          Guests receive email and WhatsApp confirmations automatically.
        </p>
      </div>
    </div>
  );
}

export function ReviewPublishStep({ form, photosCount, plannedOffers }) {
  const gst = calculateGST(form.price_per_night, 1);

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
            <span>{formatCurrency(gst.grand_total)} incl. GST</span>
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
