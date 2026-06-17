import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  DoorOpen,
  Home,
  Hotel,
  MapPin,
  User,
  Users,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import AmenityPicker from '../../components/AmenityPicker';
import ErrorMessage from '../../components/ErrorMessage';
import ImageUploader from '../../components/ImageUploader';
import ListingWizardShell from '../../components/host/ListingWizardShell';
import PublishSuccessModal from '../../components/host/PublishSuccessModal';
import SuperhostGuidanceModal from '../../components/host/SuperhostGuidanceModal';
import {
  DescriptionStep,
  FinishIntro,
  HospitalityStep,
  OffersStep,
  PricingGstStep,
  ReviewPublishStep,
  SafetyStep,
  StayVibesStep,
  TitleStep,
} from '../../components/host/ListingWizardStayEaseSteps';
import { Icon, ICON } from '../../components/ui/Icon';
import { ROOM_CATEGORIES } from '../../constants/roomCategories';
import { buildDescriptionFromVibes } from '../../constants/stayVibes';
import { roomsApi } from '../../api/api';

const VIEWS = ['none', 'hill_view', 'beach_view', 'sea_view', 'garden_view', 'city_view', 'pool_view'];

const PLACE_TYPES = [
  {
    id: 'entire',
    label: 'An entire suite',
    description: 'Guests have the whole unit to themselves — ideal for suites, villas, or homestays.',
    icon: Home,
    categories: ['Suite', 'Villa', 'Homestay'],
  },
  {
    id: 'private',
    label: 'A private room',
    description: 'Guests have their own room in your hotel with access to shared spaces.',
    icon: DoorOpen,
    categories: ['Single', 'Double', 'Triple'],
  },
  {
    id: 'shared',
    label: 'A shared room',
    description: 'Guests share a room in a hostel or dormitory-style property.',
    icon: Users,
    categories: ['Dormitory'],
  },
];

function placeTypeForCategory(category) {
  return PLACE_TYPES.find((placeType) => placeType.categories.includes(category))?.id ?? 'private';
}

const BATHROOM_TYPES = [
  {
    id: 'bathroom_private_attached',
    label: 'Private and attached',
    description: "It's connected to the guest's room and is just for them.",
    countLabel: 'private and attached bathroom',
  },
  {
    id: 'bathroom_dedicated',
    label: 'Dedicated',
    description: "It's private, but accessed via a shared space, such as a hallway.",
    countLabel: 'dedicated bathroom',
  },
  {
    id: 'bathroom_shared',
    label: 'Shared',
    description: "It's shared with other people.",
    countLabel: 'shared bathroom',
  },
];

function totalBathrooms(form) {
  return (
    (form.bathroom_private_attached || 0)
    + (form.bathroom_dedicated || 0)
    + (form.bathroom_shared || 0)
  );
}

const WHO_ELSE_OPTIONS = [
  { id: 'me', label: 'Me', icon: User },
  { id: 'family', label: 'My family', icon: Users },
  { id: 'other_guests', label: 'Other guests', icon: UserCheck },
  { id: 'flatmates', label: 'Flatmates/housemates', icon: UsersRound },
];

function whoElseOptionsForListing(placeType, roomCategory) {
  if (placeType === 'shared') {
    return WHO_ELSE_OPTIONS.filter((option) => ['other_guests', 'flatmates', 'me'].includes(option.id));
  }
  if (placeType === 'private') {
    return WHO_ELSE_OPTIONS;
  }
  if (roomCategory === 'Homestay') {
    return WHO_ELSE_OPTIONS.filter((option) => ['me', 'family'].includes(option.id));
  }
  return [];
}

function sanitizeWhoElse(selections, placeType, roomCategory) {
  const allowed = new Set(whoElseOptionsForListing(placeType, roomCategory).map((option) => option.id));
  return (selections || []).filter((id) => allowed.has(id));
}

const WIZARD_STEPS = [
  { id: 'intro-1', section: 0 },
  { id: 'category', section: 0 },
  { id: 'place-type', section: 0 },
  { id: 'location', section: 0 },
  { id: 'basics', section: 0 },
  { id: 'bathrooms', section: 0 },
  { id: 'who-else', section: 0 },
  { id: 'intro-2', section: 1 },
  { id: 'amenities', section: 1 },
  { id: 'photos', section: 1 },
  { id: 'title', section: 1 },
  { id: 'stay-vibes', section: 1 },
  { id: 'description', section: 1 },
  { id: 'intro-3', section: 2 },
  { id: 'hospitality', section: 2 },
  { id: 'pricing-gst', section: 2 },
  { id: 'offers', section: 2 },
  { id: 'safety', section: 2 },
  { id: 'review', section: 2 },
];

function bedConfigFromCount(count) {
  if (count <= 1) return 'single_bed';
  if (count === 2) return 'twin_beds';
  return 'king';
}

function toApiPayload(form, { isAvailable = false } = {}) {
  const title = form.title.trim().length >= 5 ? form.title.trim() : 'New StayEase listing';
  const description = form.description.trim().length >= 50
    ? form.description.trim()
    : 'A comfortable stay at our property with great amenities, a welcoming host, and everything you need for a relaxing trip.';
  const roomNumber = form.room_number.trim() || `R-${Date.now().toString().slice(-6)}`;

  return {
    room_number: roomNumber,
    title,
    description,
    room_category: form.room_category,
    bed_configuration: bedConfigFromCount(form.bed_count),
    price_per_night: form.price_per_night,
    max_guests: Math.min(form.max_guests, 10),
    amenities: form.amenities,
    location: form.location,
    food_preference: form.food_preference,
    smoking_policy: form.smoking_policy,
    alcohol_policy: form.alcohol_policy,
    view_type: form.view_type,
    has_balcony: form.has_balcony,
    policies: form.policies,
    is_available: isAvailable,
  };
}

const defaultForm = {
  room_number: '',
  title: '',
  description: '',
  room_category: 'Double',
  place_type: 'private',
  bed_configuration: 'double_bed',
  bed_count: 1,
  bedroom_count: 1,
  bedroom_has_lock: null,
  bathroom_private_attached: 1,
  bathroom_dedicated: 0,
  bathroom_shared: 0,
  bathroom_count: 1,
  who_else_there: [],
  price_per_night: 2000,
  max_guests: 2,
  food_preference: 'veg',
  smoking_policy: 'non_smoking',
  alcohol_policy: 'non_alcohol',
  view_type: 'none',
  has_balcony: false,
  show_precise_location: true,
  stay_vibes: [],
  weekend_boost: 4,
  planned_offers: [],
  gst_registered: false,
  amenities: [],
  location: { address: '', city: 'Bangalore', area: '', lat: 12.97, lng: 77.59 },
  policies: {
    check_in_time: '14:00',
    check_out_time: '11:00',
    cancellation: 'moderate',
    pet_allowed: false,
    smoking_allowed: false,
    alcohol_allowed: false,
  },
  is_available: false,
};

function CounterRow({ label, value, onChange, min = 1, max = 10 }) {
  const safeValue = Number.isFinite(value) ? value : min;
  return (
    <div className="listing-wizard__counter">
      <span>{label}</span>
      <div className="listing-wizard__counter-controls">
        <button
          type="button"
          className="listing-wizard__counter-btn"
          disabled={safeValue <= min}
          onClick={() => onChange(safeValue - 1)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="listing-wizard__counter-value">{safeValue}</span>
        <button
          type="button"
          className="listing-wizard__counter-btn"
          disabled={safeValue >= max}
          onClick={() => onChange(safeValue + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function StepIntro({ step, title, body, illustration }) {
  return (
    <div className="listing-wizard__intro">
      <div className="listing-wizard__intro-text">
        <p className="listing-wizard__step-label">Step {step}</p>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      <div className="listing-wizard__intro-art" aria-hidden="true">
        {illustration}
      </div>
    </div>
  );
}

function CategoryGrid({ value, onChange }) {
  return (
    <div className="listing-wizard__step">
      <h1 className="listing-wizard__title">Which of these best describes your place?</h1>
      <div className="listing-wizard__option-grid">
        {ROOM_CATEGORIES.map(({ value: cat, label, icon: CatIcon }) => (
          <button
            key={cat}
            type="button"
            className={`listing-wizard__option-card ${value === cat ? 'listing-wizard__option-card--active' : ''}`}
            onClick={() => onChange(cat)}
          >
            <Icon icon={CatIcon} size={ICON.lg} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlaceTypeSummary({ roomCategory, placeType }) {
  const match = PLACE_TYPES.find((placeTypeOption) => placeTypeOption.id === placeType)
    || PLACE_TYPES.find((placeTypeOption) => placeTypeOption.categories.includes(roomCategory));

  if (!match) return null;

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">What type of place will guests have?</h1>
      <p className="listing-wizard__subtitle">
        Based on your <strong>{roomCategory}</strong> selection — this can&apos;t be changed here.
      </p>
      <div className="listing-wizard__option-list">
        <div className="listing-wizard__option-row listing-wizard__option-row--active listing-wizard__option-row--locked">
          <div>
            <strong>{match.label}</strong>
            <p>{match.description}</p>
          </div>
          <Icon icon={match.icon} size={ICON.xl} />
        </div>
      </div>
    </div>
  );
}

function BathroomTypeRow({ label, description, countLabel, value, onChange }) {
  const pluralLabel = value === 1 ? countLabel : `${countLabel}s`;

  return (
    <div className="listing-wizard__bathroom-row">
      <div className="listing-wizard__bathroom-copy">
        <strong>{label}</strong>
        <p>{description}</p>
        <span className="listing-wizard__bathroom-count-label">
          {String(value).padStart(2, '0')} {pluralLabel}
        </span>
      </div>
      <div className="listing-wizard__counter-controls">
        <button
          type="button"
          className="listing-wizard__counter-btn"
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="listing-wizard__counter-value">{value}</span>
        <button
          type="button"
          className="listing-wizard__counter-btn"
          disabled={value >= 10}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function BasicsStep({ form, set, showLockQuestion }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Let&apos;s start with the basics</h1>
      <p className="listing-wizard__subtitle">How many people can stay here?</p>
      <div className="listing-wizard__counter-list">
        <CounterRow label="Guests" value={form.max_guests} onChange={(v) => set('max_guests', v)} max={10} />
        <CounterRow label="Bedrooms" value={form.bedroom_count} onChange={(v) => set('bedroom_count', v)} max={10} />
        <CounterRow label="Beds" value={form.bed_count} onChange={(v) => set('bed_count', v)} max={10} />
      </div>

      {showLockQuestion && (
        <div className="listing-wizard__lock-section">
          <h2 className="listing-wizard__lock-title">Does every bedroom have a lock?</h2>
          <div className="listing-wizard__lock-options" role="radiogroup" aria-label="Does every bedroom have a lock?">
            {[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={form.bedroom_has_lock === value}
                className={`listing-wizard__lock-option ${form.bedroom_has_lock === value ? 'listing-wizard__lock-option--active' : ''}`}
                onClick={() => set('bedroom_has_lock', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BathroomsStep({ form, set }) {
  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">What kind of bathrooms are available to guests?</h1>
      <p className="listing-wizard__subtitle">
        Guests need to know whether the bathroom is private, dedicated, or shared.
      </p>
      <div className="listing-wizard__bathroom-list">
        {BATHROOM_TYPES.map((bathroomType) => (
          <BathroomTypeRow
            key={bathroomType.id}
            label={bathroomType.label}
            description={bathroomType.description}
            countLabel={bathroomType.countLabel}
            value={form[bathroomType.id] || 0}
            onChange={(v) => set(bathroomType.id, v)}
          />
        ))}
      </div>
      {totalBathrooms(form) < 1 && (
        <p className="listing-wizard__bathroom-hint">Add at least one bathroom to continue.</p>
      )}
    </div>
  );
}

function WhoElseStep({ form, set, availableOptions }) {
  const selected = form.who_else_there || [];

  const toggleOption = (id) => {
    if (selected.includes(id)) {
      set('who_else_there', selected.filter((item) => item !== id));
      return;
    }
    set('who_else_there', [...selected, id]);
  };

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Who else might be there?</h1>
      <p className="listing-wizard__subtitle">
        Guests need to know whether they&apos;ll encounter other people during their stay.
      </p>

      {availableOptions.length === 0 ? (
        <div className="listing-wizard__who-else-empty">
          <strong>Guests will have the space to themselves</strong>
          <p>
            For a {form.room_category.toLowerCase()}, guests book the full unit — no shared living areas with
            others during their stay.
          </p>
        </div>
      ) : (
        <div className="listing-wizard__who-else-list">
          {availableOptions.map((option) => {
            const isActive = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className={`listing-wizard__who-else-row ${isActive ? 'listing-wizard__who-else-row--active' : ''}`}
                onClick={() => toggleOption(option.id)}
                aria-pressed={isActive}
              >
                <span>{option.label}</span>
                <Icon icon={option.icon} size={ICON.lg} />
              </button>
            );
          })}
        </div>
      )}

      <p className="listing-wizard__who-else-note">
        We&apos;ll show this information on your listing and in search results.
      </p>
      {availableOptions.length > 0 && selected.length === 0 && (
        <p className="listing-wizard__bathroom-hint">Select at least one option to continue.</p>
      )}
    </div>
  );
}

function LocationStep({ form, setLoc, set }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${form.location.lng - 0.02}%2C${form.location.lat - 0.02}%2C${form.location.lng + 0.02}%2C${form.location.lat + 0.02}&layer=mapnik&marker=${form.location.lat}%2C${form.location.lng}`;

  return (
    <div className="listing-wizard__step listing-wizard__step--narrow">
      <h1 className="listing-wizard__title">Where&apos;s your place located?</h1>
      <p className="listing-wizard__subtitle">
        Your address is only shared with guests after they&apos;ve made a reservation.
      </p>
      <div className="form-group">
        <label className="label">Street address</label>
        <input className="input" value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} placeholder="Building, street, landmark" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="label">City</label>
          <input className="input" value={form.location.city} onChange={(e) => setLoc('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Area / neighbourhood</label>
          <input className="input" value={form.location.area} onChange={(e) => setLoc('area', e.target.value)} />
        </div>
      </div>
      <div className="listing-wizard__map">
        <div className="listing-wizard__map-pin">
          <Icon icon={MapPin} size={ICON.sm} />
          <span>{form.location.address || `${form.location.area}, ${form.location.city}` || 'Pin your location'}</span>
        </div>
        <iframe title="Map preview" src={mapUrl} className="listing-wizard__map-frame" loading="lazy" />
      </div>
      <label className="listing-wizard__toggle">
        <div>
          <strong>Show precise location</strong>
          <p>Let guests see your property&apos;s exact location on the map before they book.</p>
        </div>
        <input
          type="checkbox"
          checked={form.show_precise_location}
          onChange={(e) => set('show_precise_location', e.target.checked)}
        />
      </label>
    </div>
  );
}

function ListingWizard({ initial = defaultForm }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initial);
  const [roomId, setRoomId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [published, setPublished] = useState(null);
  const [showSuperhostGuidance, setShowSuperhostGuidance] = useState(true);
  const [superhostMatchRequested, setSuperhostMatchRequested] = useState(false);

  const step = WIZARD_STEPS[stepIndex];
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setLoc = (key, val) => setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }));
  const setPol = (key, val) => setForm((f) => ({ ...f, policies: { ...f.policies, [key]: val } }));

  const sectionProgress = useMemo(() => {
    const stepsInSection = WIZARD_STEPS.filter((s) => s.section === step.section);
    const indexInSection = stepsInSection.findIndex((s) => s.id === step.id);
    return {
      section: step.section,
      fraction: (indexInSection + 1) / stepsInSection.length,
    };
  }, [step]);

  const canProceed = useCallback(() => {
    switch (step.id) {
      case 'category':
        return !!form.room_category;
      case 'place-type':
        return !!form.place_type;
      case 'location':
        return form.location.city.trim().length > 0 && form.location.area.trim().length > 0;
      case 'photos':
        return photos.length >= 1;
      case 'title':
        return form.title.trim().length >= 5;
      case 'description':
        return form.description.trim().length >= 50;
      case 'pricing-gst':
        return form.price_per_night >= 100;
      case 'basics':
        if (form.place_type === 'shared') return true;
        return form.bedroom_has_lock === true || form.bedroom_has_lock === false;
      case 'bathrooms':
        return totalBathrooms(form) >= 1;
      case 'who-else': {
        const options = whoElseOptionsForListing(form.place_type, form.room_category);
        if (options.length === 0) return true;
        return (form.who_else_there || []).length > 0;
      }
      default:
        return true;
    }
  }, [step.id, form, photos.length]);

  const ensureDraft = async () => {
    if (roomId) return roomId;
    const { data } = await roomsApi.create(toApiPayload(form, { isAvailable: false }));
    setRoomId(data._id);
    return data._id;
  };

  const handlePhotoUpload = async (file) => {
    const id = roomId || await ensureDraft();
    setUploading(true);
    setError('');
    try {
      const { data } = await roomsApi.uploadPhoto(id, file);
      setPhotos(data.photos || []);
    } catch (err) {
      setError(err.normalized?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const goNext = async () => {
    setError('');
    if (step.id === 'photos' && !roomId) {
      setLoading(true);
      try {
        await ensureDraft();
      } catch (err) {
        setError(err.normalized?.message || 'Could not save draft');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (stepIndex < WIZARD_STEPS.length - 1) {
      if (WIZARD_STEPS[stepIndex + 1].id === 'description' && !form.description.trim()) {
        const draft = buildDescriptionFromVibes(form.stay_vibes, form);
        if (draft) set('description', draft);
      }
      setStepIndex((i) => i + 1);
      return;
    }

    setLoading(true);
    try {
      const payload = toApiPayload(form, { isAvailable: true });
      let id = roomId;
      if (roomId) {
        await roomsApi.update(roomId, payload);
      } else {
        const { data } = await roomsApi.create(payload);
        id = data._id;
      }
      setPublished({ id, title: form.title.trim() });
    } catch (err) {
      setError(err.normalized?.message || 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step.id) {
      case 'intro-1':
        return (
          <StepIntro
            step={1}
            title="Tell us about your place"
            body="Welcome to StayEase hosting — India's hotel platform with GST-ready billing, WhatsApp alerts, and transparent pricing for guests nationwide."
            illustration={
              <div className="listing-wizard__house-illustration">
                <Building2 size={120} strokeWidth={1} />
              </div>
            }
          />
        );
      case 'category':
        return (
          <CategoryGrid
            value={form.room_category}
            onChange={(category) => {
              const placeType = placeTypeForCategory(category);
              setForm((current) => ({
                ...current,
                room_category: category,
                place_type: placeType,
                bedroom_has_lock: category === 'Dormitory' ? null : current.bedroom_has_lock,
                who_else_there: sanitizeWhoElse(current.who_else_there, placeType, category),
              }));
            }}
          />
        );
      case 'place-type':
        return (
          <PlaceTypeSummary
            roomCategory={form.room_category}
            placeType={form.place_type}
          />
        );
      case 'location':
        return <LocationStep form={form} setLoc={setLoc} set={set} />;
      case 'basics':
        return (
          <BasicsStep
            form={form}
            set={set}
            showLockQuestion={form.place_type !== 'shared'}
          />
        );
      case 'bathrooms':
        return (
          <BathroomsStep
            form={form}
            set={set}
          />
        );
      case 'who-else':
        return (
          <WhoElseStep
            form={form}
            set={set}
            availableOptions={whoElseOptionsForListing(form.place_type, form.room_category)}
          />
        );
      case 'intro-2':
        return (
          <StepIntro
            step={2}
            title="Make your place stand out"
            body="Add amenities, photos, and a StayEase listing story that highlights what makes your property special in India."
            illustration={
              <div className="listing-wizard__house-illustration listing-wizard__house-illustration--accent">
                <Hotel size={120} strokeWidth={1} />
              </div>
            }
          />
        );
      case 'amenities':
        return (
          <div className="listing-wizard__step">
            <h1 className="listing-wizard__title">Tell guests what your place has to offer</h1>
            <p className="listing-wizard__subtitle">You can add more amenities after you publish your listing.</p>
            <AmenityPicker selected={form.amenities} onChange={(next) => set('amenities', next)} />
          </div>
        );
      case 'photos':
        return (
          <div className="listing-wizard__step listing-wizard__step--narrow">
            <h1 className="listing-wizard__title">Add some photos of your {form.room_category.toLowerCase()} room</h1>
            <p className="listing-wizard__subtitle">
              You&apos;ll need at least 1 photo to get started. You can add more or make changes later.
            </p>
            <div className="listing-wizard__photo-drop">
              <Icon icon={Camera} size={48} />
              <ImageUploader photos={photos} onUpload={handlePhotoUpload} uploading={uploading} />
            </div>
          </div>
        );
      case 'title':
        return (
          <TitleStep
            title={form.title}
            roomNumber={form.room_number}
            onTitle={(v) => set('title', v)}
            onRoomNumber={(v) => set('room_number', v)}
          />
        );
      case 'stay-vibes':
        return (
          <StayVibesStep
            selected={form.stay_vibes}
            onChange={(v) => set('stay_vibes', v)}
            category={form.room_category}
          />
        );
      case 'description':
        return (
          <DescriptionStep
            description={form.description}
            onChange={(v) => set('description', v)}
            vibeCount={form.stay_vibes.length}
          />
        );
      case 'intro-3':
        return <FinishIntro />;
      case 'hospitality':
        return <HospitalityStep form={form} set={set} setPol={setPol} />;
      case 'pricing-gst':
        return (
          <PricingGstStep
            price={form.price_per_night}
            onPrice={(v) => set('price_per_night', v)}
            weekendBoost={form.weekend_boost}
            onWeekendBoost={(v) => set('weekend_boost', v)}
          />
        );
      case 'offers':
        return (
          <OffersStep
            selected={form.planned_offers}
            onChange={(v) => set('planned_offers', v)}
          />
        );
      case 'safety':
        return (
          <SafetyStep
            amenities={form.amenities}
            onAmenitiesChange={(v) => set('amenities', v)}
            gstRegistered={form.gst_registered}
            onGstRegistered={(v) => set('gst_registered', v)}
          />
        );
      case 'review':
        return (
          <ReviewPublishStep
            form={form}
            photosCount={photos.length}
            plannedOffers={form.planned_offers}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ListingWizardShell
      stepIndex={stepIndex}
      sectionCount={3}
      sectionProgress={sectionProgress}
      onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
      onNext={goNext}
      nextLabel={
        step.id === 'review'
          ? (loading ? 'Creating…' : 'Create listing')
          : 'Next'
      }
      nextDisabled={!canProceed() || loading}
    >
      <ErrorMessage message={error} />
      {superhostMatchRequested && (
        <p className="listing-wizard__superhost-note">
          We&apos;ll match you with a StayEase Superhost soon. You can keep building your listing in the meantime.
        </p>
      )}
      {renderStep()}
      <SuperhostGuidanceModal
        open={showSuperhostGuidance && step.id === 'intro-1'}
        onStartAlone={() => setShowSuperhostGuidance(false)}
        onMatchSuperhost={() => {
          setSuperhostMatchRequested(true);
          setShowSuperhostGuidance(false);
        }}
      />
      <PublishSuccessModal
        open={!!published}
        roomId={published?.id}
        title={published?.title}
        onClose={() => navigate('/host/rooms')}
      />
    </ListingWizardShell>
  );
}

// Legacy single-page form for editing existing rooms
function RoomForm({ initial = defaultForm, roomId, isEdit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [photos, setPhotos] = useState(initial.photos || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setLoc = (key, val) => setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }));
  const setPol = (key, val) => setForm((f) => ({ ...f, policies: { ...f.policies, [key]: val } }));

  const save = async (publish) => {
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, is_available: publish };
      if (isEdit) {
        await roomsApi.update(roomId, payload);
      } else {
        const { data } = await roomsApi.create(payload);
        navigate(`/host/rooms/edit/${data._id}`);
        return;
      }
      navigate('/host/rooms');
    } catch (err) {
      setError(err.normalized?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!roomId) return;
    setUploading(true);
    try {
      const { data } = await roomsApi.uploadPhoto(roomId, file);
      setPhotos(data.photos || []);
    } catch (err) {
      setError(err.normalized?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <ErrorMessage message={error} />
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Basic Info</h2>
        <div className="form-row">
          <div className="form-group"><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
          <div className="form-group"><label className="label">Room Number</label><input className="input" value={form.room_number} onChange={(e) => set('room_number', e.target.value)} required /></div>
        </div>
        <div className="form-group"><label className="label">Description (min 50 chars)</label><textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} required minLength={50} /></div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Category</label>
            <select className="select" value={form.room_category} onChange={(e) => set('room_category', e.target.value)}>
              {ROOM_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Max guests</label><input type="number" className="input" min={1} max={10} value={form.max_guests} onChange={(e) => set('max_guests', Number(e.target.value))} /></div>
          <div className="form-group"><label className="label">Price/night</label><input type="number" className="input" value={form.price_per_night} onChange={(e) => set('price_per_night', Number(e.target.value))} /></div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Location</h2>
        <div className="form-group"><label className="label">Address</label><input className="input" value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="label">City</label><input className="input" value={form.location.city} onChange={(e) => setLoc('city', e.target.value)} /></div>
          <div className="form-group"><label className="label">Area</label><input className="input" value={form.location.area} onChange={(e) => setLoc('area', e.target.value)} /></div>
        </div>
      </section>

      <section className="card amenity-picker-section" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Amenities</h2>
        <AmenityPicker selected={form.amenities} onChange={(next) => set('amenities', next)} />
      </section>

      {isEdit && (
        <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2>Photos</h2>
          <ImageUploader photos={photos} onUpload={handlePhotoUpload} uploading={uploading} />
        </section>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => save(false)} disabled={loading}>Save as Draft</button>
        <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={loading}>Publish</button>
      </div>
    </form>
  );
}

export default function AddRoom() {
  return <ListingWizard />;
}

export { RoomForm };
