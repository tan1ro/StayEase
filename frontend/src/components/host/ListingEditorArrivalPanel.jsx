import { useEffect, useState } from 'react';
import ErrorMessage from '../ErrorMessage';
import { CHECK_IN_METHODS } from '../../constants/listingEditorSections';
import { LISTING_TIME_OPTIONS } from '../../utils/listingEditorUtils';

function EditorSaveBar({ onSave, saving, disabled }) {
  return (
    <div className="host-editor__savebar">
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={disabled || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function TimeField({ label, value, onChange, placeholder = 'Select time' }) {
  return (
    <label className="host-editor__time-field">
      <span className="host-editor__time-field-label">{label}</span>
      <select className="select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {LISTING_TIME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function ListingEditorArrivalPanel({
  section,
  room,
  onSave,
  onDraftChange,
  saving,
  error,
}) {
  const guide = room.arrival_guide || {};
  const policies = room.policies || {};

  const patchDraft = (patch) => onDraftChange?.(patch);

  const [checkInStart, setCheckInStart] = useState(policies.check_in_time || '14:00');
  const [checkInEnd, setCheckInEnd] = useState(guide.check_in_end_time || '');
  const [checkOut, setCheckOut] = useState(policies.check_out_time || '11:00');
  const [directions, setDirections] = useState(guide.directions || '');
  const [checkInMethod, setCheckInMethod] = useState(guide.check_in_method || '');
  const [wifiNetwork, setWifiNetwork] = useState(guide.wifi_network || '');
  const [wifiPassword, setWifiPassword] = useState(guide.wifi_password || '');
  const [houseManual, setHouseManual] = useState(guide.house_manual || '');
  const [checkoutInstructions, setCheckoutInstructions] = useState(guide.checkout_instructions || '');
  const [guidebook, setGuidebook] = useState(guide.guidebook || '');
  const [interaction, setInteraction] = useState(guide.interaction_preferences || '');
  const [foodPreference, setFoodPreference] = useState(room.food_preference || 'veg');
  const [smokingPolicy, setSmokingPolicy] = useState(room.smoking_policy || 'non_smoking');
  const [alcoholPolicy, setAlcoholPolicy] = useState(room.alcohol_policy || 'non_alcohol');
  const [maxGuests, setMaxGuests] = useState(room.max_guests || 2);
  const [cancellation, setCancellation] = useState(policies.cancellation || 'moderate');
  const [hasCctv, setHasCctv] = useState((room.amenities || []).includes('CCTV'));

  useEffect(() => {
    const g = room.arrival_guide || {};
    const p = room.policies || {};
    setCheckInStart(p.check_in_time || '14:00');
    setCheckInEnd(g.check_in_end_time || '');
    setCheckOut(p.check_out_time || '11:00');
    setDirections(g.directions || '');
    setCheckInMethod(g.check_in_method || '');
    setWifiNetwork(g.wifi_network || '');
    setWifiPassword(g.wifi_password || '');
    setHouseManual(g.house_manual || '');
    setCheckoutInstructions(g.checkout_instructions || '');
    setGuidebook(g.guidebook || '');
    setInteraction(g.interaction_preferences || '');
    setFoodPreference(room.food_preference || 'veg');
    setSmokingPolicy(room.smoking_policy || 'non_smoking');
    setAlcoholPolicy(room.alcohol_policy || 'non_alcohol');
    setMaxGuests(room.max_guests || 2);
    setCancellation(p.cancellation || 'moderate');
    setHasCctv((room.amenities || []).includes('CCTV'));
  }, [room]);

  const saveGuide = (patch) => onSave({
    arrival_guide: { ...guide, ...patch },
  });

  if (section === 'checkin') {
    return (
      <>
        <h1>Check-in &amp; checkout</h1>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <h2 className="host-editor__form-title">Check-in window</h2>
          <div className="host-editor__time-grid">
            <TimeField label="Start time" value={checkInStart} onChange={(v) => {
              setCheckInStart(v);
              patchDraft({ policies: { ...policies, check_in_time: v } });
            }} />
            <TimeField label="End time" value={checkInEnd} onChange={(v) => {
              setCheckInEnd(v);
              patchDraft({ arrival_guide: { ...guide, check_in_end_time: v || null } });
            }} placeholder="End time" />
          </div>
          <h2 className="host-editor__form-title">Checkout</h2>
          <TimeField label="Time" value={checkOut} onChange={(v) => {
            setCheckOut(v);
            patchDraft({ policies: { ...policies, check_out_time: v } });
          }} placeholder="Time" />
        </div>
        <EditorSaveBar
          saving={saving}
          onSave={() => onSave({
            policies: {
              ...policies,
              check_in_time: checkInStart,
              check_out_time: checkOut,
            },
            arrival_guide: { ...guide, check_in_end_time: checkInEnd || null },
          })}
        />
      </>
    );
  }

  if (section === 'directions') {
    return (
      <>
        <h1>Directions</h1>
        <p className="host-page__subtitle">Help guests find your property — landmarks, gate codes, and parking tips.</p>
        <ErrorMessage message={error} />
        <textarea
          className="textarea"
          rows={8}
          value={directions}
          onChange={(e) => {
            setDirections(e.target.value);
            patchDraft({ arrival_guide: { ...guide, directions: e.target.value } });
          }}
          placeholder="Example: Turn at the blue temple arch, third building on the left. Reception is on the ground floor."
        />
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ directions })} />
      </>
    );
  }

  if (section === 'checkin_method') {
    return (
      <>
        <h1>Check-in method</h1>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">How do guests check in?</label>
          <select className="select" value={checkInMethod} onChange={(e) => {
            setCheckInMethod(e.target.value);
            patchDraft({ arrival_guide: { ...guide, check_in_method: e.target.value } });
          }}>
            <option value="">Select a method</option>
            {CHECK_IN_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <EditorSaveBar saving={saving} disabled={!checkInMethod} onSave={() => saveGuide({ check_in_method: checkInMethod })} />
      </>
    );
  }

  if (section === 'wifi') {
    return (
      <>
        <h1>WiFi details</h1>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Network name</label>
          <input className="input" value={wifiNetwork} onChange={(e) => {
            setWifiNetwork(e.target.value);
            patchDraft({ arrival_guide: { ...guide, wifi_network: e.target.value } });
          }} placeholder="StayEase_Guest" />
          <label className="label" style={{ marginTop: '1rem' }}>Password</label>
          <input className="input" value={wifiPassword} onChange={(e) => {
            setWifiPassword(e.target.value);
            patchDraft({ arrival_guide: { ...guide, wifi_password: e.target.value } });
          }} placeholder="WiFi password" />
        </div>
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ wifi_network: wifiNetwork, wifi_password: wifiPassword })} />
      </>
    );
  }

  if (section === 'manual') {
    return (
      <>
        <h1>House manual</h1>
        <p className="host-page__subtitle">AC, geyser, kitchen, and appliance instructions for guests.</p>
        <ErrorMessage message={error} />
        <textarea className="textarea" rows={8} value={houseManual} onChange={(e) => {
          setHouseManual(e.target.value);
          patchDraft({ arrival_guide: { ...guide, house_manual: e.target.value } });
        }} />
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ house_manual: houseManual })} />
      </>
    );
  }

  if (section === 'rules') {
    return (
      <>
        <h1>House rules</h1>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Maximum guests</label>
          <input className="input" type="number" min={1} max={10} value={maxGuests} onChange={(e) => {
            const next = Number(e.target.value);
            setMaxGuests(next);
            patchDraft({ max_guests: next });
          }} />
          <label className="label" style={{ marginTop: '1rem' }}>Cancellation policy</label>
          <select className="select" value={cancellation} onChange={(e) => {
            setCancellation(e.target.value);
            patchDraft({ policies: { ...policies, cancellation: e.target.value } });
          }}>
            <option value="flexible">Flexible</option>
            <option value="moderate">Moderate</option>
            <option value="strict">Strict</option>
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Smoking</label>
          <select className="select" value={smokingPolicy} onChange={(e) => {
            setSmokingPolicy(e.target.value);
            patchDraft({ smoking_policy: e.target.value });
          }}>
            <option value="non_smoking">Non-smoking</option>
            <option value="smoking">Smoking allowed</option>
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Alcohol</label>
          <select className="select" value={alcoholPolicy} onChange={(e) => {
            setAlcoholPolicy(e.target.value);
            patchDraft({ alcohol_policy: e.target.value });
          }}>
            <option value="non_alcohol">No alcohol</option>
            <option value="alcohol">Alcohol allowed</option>
          </select>
        </div>
        <EditorSaveBar
          saving={saving}
          onSave={() => onSave({
            max_guests: maxGuests,
            smoking_policy: smokingPolicy,
            alcohol_policy: alcoholPolicy,
            policies: {
              ...policies,
              cancellation,
              smoking_allowed: smokingPolicy === 'smoking',
              alcohol_allowed: alcoholPolicy === 'alcohol',
            },
          })}
        />
      </>
    );
  }

  if (section === 'hospitality') {
    return (
      <>
        <h1>Indian hospitality preferences</h1>
        <p className="host-page__subtitle">Food and dining expectations for guests.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Food served at property</label>
          <select className="select" value={foodPreference} onChange={(e) => {
            setFoodPreference(e.target.value);
            patchDraft({ food_preference: e.target.value });
          }}>
            <option value="veg">Pure veg</option>
            <option value="both">Veg &amp; non-veg</option>
            <option value="nonveg">Non-veg only</option>
          </select>
        </div>
        <EditorSaveBar saving={saving} onSave={() => onSave({ food_preference: foodPreference })} />
      </>
    );
  }

  if (section === 'checkout') {
    return (
      <>
        <h1>Checkout instructions</h1>
        <ErrorMessage message={error} />
        <textarea
          className="textarea"
          rows={6}
          value={checkoutInstructions}
          onChange={(e) => {
            setCheckoutInstructions(e.target.value);
            patchDraft({ arrival_guide: { ...guide, checkout_instructions: e.target.value } });
          }}
          placeholder="Key return, strip linens, switch off AC, etc."
        />
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ checkout_instructions: checkoutInstructions })} />
      </>
    );
  }

  if (section === 'guidebook') {
    return (
      <>
        <h1>Local guidebook</h1>
        <p className="host-page__subtitle">Create a guidebook to share your local tips with guests.</p>
        <ErrorMessage message={error} />
        <textarea
          className="textarea"
          rows={8}
          value={guidebook}
          onChange={(e) => {
            setGuidebook(e.target.value);
            patchDraft({ arrival_guide: { ...guide, guidebook: e.target.value } });
          }}
          placeholder="Best breakfast spots, metro routes, temple timings, and weekend getaways."
        />
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ guidebook })} />
      </>
    );
  }

  if (section === 'interaction') {
    return (
      <>
        <h1>Interaction preferences</h1>
        <ErrorMessage message={error} />
        <textarea
          className="textarea"
          rows={6}
          value={interaction}
          onChange={(e) => {
            setInteraction(e.target.value);
            patchDraft({ arrival_guide: { ...guide, interaction_preferences: e.target.value } });
          }}
          placeholder="How much contact guests can expect — available on WhatsApp, self check-in only, etc."
        />
        <EditorSaveBar saving={saving} onSave={() => saveGuide({ interaction_preferences: interaction })} />
      </>
    );
  }

  if (section === 'safety') {
    const amenities = room.amenities || [];
    return (
      <>
        <h1>Guest safety</h1>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="listing-wizard__safety-row">
            <span>Exterior security camera in common areas</span>
            <input type="checkbox" checked={hasCctv} onChange={(e) => {
              setHasCctv(e.target.checked);
              const amenities = room.amenities || [];
              patchDraft({
                amenities: e.target.checked
                  ? [...new Set([...amenities, 'CCTV'])]
                  : amenities.filter((a) => a !== 'CCTV'),
              });
            }} />
          </label>
        </div>
        <EditorSaveBar
          saving={saving}
          onSave={() => onSave({
            amenities: hasCctv
              ? [...new Set([...amenities, 'CCTV'])]
              : amenities.filter((a) => a !== 'CCTV'),
          })}
        />
      </>
    );
  }

  return null;
}
