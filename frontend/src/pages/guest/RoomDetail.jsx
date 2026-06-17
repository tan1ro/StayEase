import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Share2,
  Heart,
  Star,
  Wind,
  KeyRound,
  Mountain,
  Shield,
  Calendar,
  Flag,
  MapPin,
  ChevronRight,
  Wifi,
  UtensilsCrossed,
  Car,
} from 'lucide-react';
import AmenityIcon from '../../components/AmenityIcon';
import BookingCard from '../../components/BookingCard';
import {
  CancellationPolicyModal,
  HouseRulesModal,
  SafetyPropertyModal,
} from '../../components/ThingsToKnowModals';
import {
  AllReviewsModal,
  AmenitiesModal,
  MessageHostModal,
  NearbyAttractionsModal,
  ReportListingModal,
} from '../../components/ListingInteractionModals';
import AboutThisSpaceModal from '../../components/AboutThisSpaceModal';
import { getDescriptionPreview } from '../../utils/listingSpaceContent';
import { getCancellationSummary } from '../../utils/cancellationTimeline';
import ErrorMessage from '../../components/ErrorMessage';
import ReviewCard from '../../components/ReviewCard';
import WriteReviewModal from '../../components/WriteReviewModal';
import RoomImageGallery from '../../components/RoomImageGallery';
import Spinner from '../../components/Spinner';
import { attractionsApi, reviewsApi, roomsApi, wishlistApi, formatCurrency } from '../../api/api';
import { getAvatarUrl } from '../../utils/roomImages';
import SafeImage from '../../components/SafeImage';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { Icon, ICON } from '../../components/ui/Icon';
import { listingParamsFromSearch } from '../../utils/listingParams';

function hasAmenity(amenities, names) {
  const normalized = new Set(amenities.map((a) => a.toLowerCase()));
  return names.some((name) => normalized.has(name.toLowerCase()));
}

function getListingHighlights(room) {
  const amenities = room.amenities || [];
  const highlights = [];
  const checkInTime = room.policies?.check_in_time || '14:00';

  if (hasAmenity(amenities, ['AC', 'Air conditioning', 'Central AC', 'Portable AC'])) {
    highlights.push({
      icon: Wind,
      title: 'Designed for staying cool',
      body: 'Beat the heat with air conditioning and comfortable ventilation throughout the stay.',
    });
  }
  if (hasAmenity(amenities, ['Self check-in', 'Keypad entry', 'Smart lock', 'Mobile check-in', 'Self check-in kiosk'])) {
    highlights.push({
      icon: KeyRound,
      title: 'Self check-in',
      body: `Check yourself in after ${checkInTime}.`,
    });
  }
  if (hasAmenity(amenities, ['Wifi', 'WiFi', 'Free Wi-Fi', 'High-speed Wi-Fi', 'Premium Wi-Fi'])) {
    highlights.push({
      icon: Wifi,
      title: 'Stay connected',
      body: 'Wi-Fi is available for remote work, streaming, and staying in touch.',
    });
  }
  if (hasAmenity(amenities, ['Kitchen', 'Full kitchen', 'Kitchenette'])) {
    highlights.push({
      icon: UtensilsCrossed,
      title: 'Cook your own meals',
      body: 'A kitchen setup is available so you can prepare meals during your stay.',
    });
  }
  if (hasAmenity(amenities, ['Free parking', 'Parking', 'Garage', 'Valet parking'])) {
    highlights.push({
      icon: Car,
      title: 'Parking on premises',
      body: 'Parking is available for guests arriving by car.',
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      icon: KeyRound,
      title: 'Hosted stay',
      body: `Your host welcomes you from ${checkInTime}.`,
    });
  }

  return highlights.slice(0, 3);
}

function hostYears(createdAt) {
  if (!createdAt) return 1;
  const years = Math.floor((Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return Math.max(1, years);
}

function Highlight({ icon: HighlightIcon, title, body }) {
  return (
    <div className="highlight">
      <Icon icon={HighlightIcon} size={ICON.lg} />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { openAuthGate } = useOnboarding();
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [policyModal, setPolicyModal] = useState(null);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [attractionsModalOpen, setAttractionsModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const [reviewEligibility, setReviewEligibility] = useState({
    can_review: false,
    has_review: false,
    booking: null,
  });
  const [reviewOpen, setReviewOpen] = useState(false);

  const listingParams = useMemo(() => listingParamsFromSearch(searchParams), [searchParams]);
  const { checkIn: checkInParam, checkOut: checkOutParam, guests: guestsParam } = listingParams;

  const [widgetDates, setWidgetDates] = useState({
    checkIn: checkInParam,
    checkOut: checkOutParam,
    guests: guestsParam,
  });
  const [widgetPricing, setWidgetPricing] = useState(null);

  useEffect(() => {
    setWidgetDates({
      checkIn: checkInParam,
      checkOut: checkOutParam,
      guests: guestsParam,
    });
  }, [checkInParam, checkOutParam, guestsParam]);

  useEffect(() => {
    if (!listingParams.scrollToReview || loading || !room) return;
    const timer = window.setTimeout(() => {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (reviews.length > 0) setReviewsModalOpen(true);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [room, loading, listingParams.scrollToReview, reviews.length]);

  useEffect(() => {
    if (!listingParams.scrollToReview || !reviewEligibility.can_review) return;
    const timer = window.setTimeout(() => {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setReviewOpen(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [listingParams.scrollToReview, reviewEligibility.can_review]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: roomData } = await roomsApi.get(id);
        setRoom(roomData);
        setSaved(user?.wishlist?.includes(id));
        const [revRes, attrRes] = await Promise.all([
          reviewsApi.byRoom(id).catch(() => ({ data: [] })),
          attractionsApi.byCity(roomData.location?.city || 'Bangalore').catch(() => ({ data: [] })),
        ]);
        setReviews(revRes.data);
        setAttractions(attrRes.data);
      } catch (err) {
        setError(err.normalized?.message || 'Room not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.wishlist]);

  const reloadListingReviews = async () => {
    const [roomRes, reviewsRes] = await Promise.all([
      roomsApi.get(id),
      reviewsApi.byRoom(id).catch(() => ({ data: [] })),
    ]);
    setRoom(roomRes.data);
    setReviews(reviewsRes.data);
  };

  useEffect(() => {
    if (!user?.id) {
      setReviewEligibility({ can_review: false, has_review: false, booking: null });
      return;
    }
    let cancelled = false;
    reviewsApi
      .eligibleForRoom(id)
      .then(({ data }) => {
        if (!cancelled) setReviewEligibility(data || { can_review: false, has_review: false, booking: null });
      })
      .catch(() => {
        if (!cancelled) setReviewEligibility({ can_review: false, has_review: false, booking: null });
      });
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const handleOpenReview = () => {
    if (!user) {
      openAuthGate({
        title: 'Log in to write a review',
        message: 'Sign in to rate stays you have completed on StayEase.',
        cta: 'Log in',
      });
      return;
    }
    if (reviewEligibility.can_review) {
      setReviewOpen(true);
    }
  };

  const handleReviewSubmitted = async () => {
    setReviewEligibility({ can_review: false, has_review: true, booking: reviewEligibility.booking });
    await reloadListingReviews();
  };

  const handleSave = async () => {
    if (!user) {
      openAuthGate({
        title: 'Log in to save this stay',
        message: 'Create an account or log in to save stays to your wishlist.',
        cta: 'Log in',
      });
      return;
    }
    try {
      await wishlistApi.add(id);
      setSaved((v) => !v);
      await refreshUser();
    } catch { /* handled */ }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: room?.title, url });
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice('Link copied to clipboard');
      setTimeout(() => setShareNotice(''), 3000);
    } catch {
      setShareNotice('Copy this link: ' + url);
    }
  };

  const handleMessageHost = () => {
    if (!user) {
      openAuthGate({
        title: 'Log in to message your host',
        message: 'Create an account or log in to contact the host before booking.',
        cta: 'Log in',
      });
      return;
    }
    setMessageModalOpen(true);
  };

  const handleReportListing = () => {
    if (!user) {
      openAuthGate({
        title: 'Log in to report this listing',
        message: 'Sign in so we can follow up on your report if needed.',
        cta: 'Log in',
      });
      return;
    }
    setReportModalOpen(true);
  };

  if (loading) return <Spinner label="Loading room..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!room) return null;

  const host = room.host || { name: 'Host', about_me: null };
  const hostProfileId = host.id || room.host_id;
  const hostProfileUrl = hostProfileId ? `/hosts/${hostProfileId}` : null;
  const hostAvatar = host.avatar_url || getAvatarUrl(host.name, host.id || host.name);
  const amenities = room.amenities || [];
  const visibleAmenities = amenities.slice(0, 5);
  const listingHighlights = getListingHighlights(room);
  const description = room.description || '';
  const { intro: descriptionPreview, hasMore: hasMoreDescription } = getDescriptionPreview(description);
  const cancellation = room.policies?.cancellation || 'moderate';
  const checkInTime = room.policies?.check_in_time || '14:00';
  const checkOutTime = room.policies?.check_out_time || '11:00';

  const formatTime12 = (time) => {
    const [hourStr, minuteStr = '00'] = time.split(':');
    const hour = Number(hourStr);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minuteStr} ${ampm}`;
  };

  const ratingCategories = [
    { label: 'Cleanliness', score: (room.avg_rating || 4.5).toFixed(1) },
    { label: 'Accuracy', score: (room.avg_rating || 4.5).toFixed(1) },
    { label: 'Check-in', score: Math.min(5, (room.avg_rating || 4.5) + 0.1).toFixed(1) },
    { label: 'Communication', score: Math.min(5, (room.avg_rating || 4.5) + 0.1).toFixed(1) },
    { label: 'Location', score: (room.avg_rating || 4.5).toFixed(1) },
    { label: 'Value', score: Math.max(4, (room.avg_rating || 4.5) - 0.2).toFixed(1) },
  ];

  const reviewCount = reviews.length || room.total_reviews || 0;
  const visibleReviews = reviews.slice(0, 4);

  const mobileBookUrl = widgetDates.checkIn && widgetDates.checkOut
    ? `/book/${id}?check_in=${widgetDates.checkIn}&check_out=${widgetDates.checkOut}&guests=${widgetDates.guests}`
    : `/book/${id}`;

  return (
    <div className="listing-page">
      {/* Title bar */}
      <div className="listing-header">
        <h1 className="listing-header__title">{room.title}</h1>
        <div className="listing-header__actions">
          <button type="button" className="listing-header__btn" onClick={handleShare}>
            <Icon icon={Share2} size={ICON.sm} /> Share
          </button>
          <button type="button" className={`listing-header__btn ${saved ? 'listing-header__btn--saved' : ''}`} onClick={handleSave}>
            <Icon icon={Heart} size={ICON.sm} fill={saved ? 'currentColor' : 'none'} /> Save
          </button>
        </div>
        {shareNotice && <p className="listing-share-notice" role="status">{shareNotice}</p>}
      </div>

      <RoomImageGallery
        photos={room.photos}
        roomId={id}
        title={room.title}
        initialPhotoId={listingParams.photoId}
      />

      <div className="listing-body">
        <div className="listing-main">
          {/* Summary */}
          <div className="listing-summary">
            <h2>
              {room.room_category} in {room.location?.area}, {room.location?.city}
            </h2>
            <p className="listing-summary__meta">
              {room.max_guests} guests · {room.room_category} · {room.bed_configuration?.replace('_', ' ')}
            </p>
            {room.avg_rating > 0 && (
              <p className="listing-summary__rating">
                <Icon icon={Star} size={ICON.sm} fill="currentColor" /> {room.avg_rating.toFixed(2)} · {room.total_reviews} reviews
              </p>
            )}
          </div>

          <hr className="listing-divider" />

          {/* Host row */}
          {hostProfileUrl ? (
            <Link to={hostProfileUrl} className="listing-host-row listing-host-row--link">
              <img src={hostAvatar} alt={host.name} className="listing-host-row__avatar" />
              <div>
                <strong>Hosted by {host.name}</strong>
                <p>{hostYears(host.created_at)} years hosting · View profile</p>
              </div>
            </Link>
          ) : (
            <div className="listing-host-row">
              <img src={hostAvatar} alt={host.name} className="listing-host-row__avatar" />
              <div>
                <strong>Hosted by {host.name}</strong>
                <p>{hostYears(host.created_at)} years hosting</p>
              </div>
            </div>
          )}

          <hr className="listing-divider" />

          {/* Highlights */}
          <div className="listing-highlights">
            {listingHighlights.map((item) => (
              <Highlight key={item.title} icon={item.icon} title={item.title} body={item.body} />
            ))}
            {room.view_type && room.view_type !== 'none' && (
              <Highlight
                icon={Mountain}
                title={`${room.view_type.replace(/_/g, ' ')} view`}
                body="Guests say the views are lovely."
              />
            )}
          </div>

          <hr className="listing-divider" />

          {/* Description */}
          <section className="listing-section">
            <p className="listing-description">{descriptionPreview}</p>
            {hasMoreDescription && (
              <>
                <p className="listing-description-teaser">
                  <strong>The space...</strong>
                </p>
                <button
                  type="button"
                  className="listing-show-more-btn"
                  onClick={() => setAboutModalOpen(true)}
                >
                  Show more
                </button>
              </>
            )}
          </section>

          <hr className="listing-divider" />

          {/* Where you'll sleep */}
          <section className="listing-section">
            <h3>Where you&apos;ll sleep</h3>
            <div className="sleep-cards">
              <div className="sleep-card">
                <SafeImage
                  src={room.photos?.[0]?.url}
                  alt="Bedroom"
                  className="sleep-card__image"
                  fallbackSeed={`sleep-${id}`}
                />
                <div className="sleep-card__info">
                  <strong>Bedroom</strong>
                  <span>{room.bed_configuration?.replace('_', ' ')} · up to {room.max_guests} guests</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="listing-divider" />

          {/* Amenities */}
          {amenities.length > 0 && (
            <section className="listing-section">
              <h3>What this place offers</h3>
              <div className="amenities-grid">
                {visibleAmenities.map((a) => (
                  <AmenityIcon key={a} name={a} showLabel />
                ))}
              </div>
              {amenities.length > 5 && (
                <button type="button" className="listing-btn-outline" onClick={() => setAmenitiesModalOpen(true)}>
                  Show all {amenities.length} amenities
                </button>
              )}
            </section>
          )}

          <hr className="listing-divider" />

          {/* Reviews */}
          <section className="listing-section" id="reviews">
            <div className="listing-section__header">
              <h3>
                <Icon icon={Star} size={ICON.md} fill="currentColor" /> {room.avg_rating?.toFixed(2) || '—'} · {reviewCount} reviews
              </h3>
              {reviewEligibility.can_review && (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenReview}>
                  <Icon icon={Star} size={ICON.sm} /> Write a review
                </button>
              )}
            </div>
            {reviewEligibility.can_review && (
              <div className="listing-review-cta">
                <p>You stayed here recently. Share your experience to help other travellers.</p>
                <button type="button" className="listing-btn-outline" onClick={handleOpenReview}>
                  Rate your stay
                </button>
              </div>
            )}
            {reviewEligibility.has_review && !reviewEligibility.can_review && (
              <p className="listing-review-thanks" role="status">
                Thanks — you&apos;ve already reviewed your stay at this property.
              </p>
            )}
            <div className="rating-grid">
              {ratingCategories.map(({ label, score }) => (
                <div key={label} className="rating-bar">
                  <span>{label}</span>
                  <div className="rating-bar__track">
                    <div className="rating-bar__fill" style={{ width: `${(score / 5) * 100}%` }} />
                  </div>
                  <span>{score}</span>
                </div>
              ))}
            </div>
            {reviews.length === 0 ? (
              <p className="listing-muted">No reviews yet.</p>
            ) : (
              <>
                <div className="reviews-grid">
                  {visibleReviews.map((r) => (
                    <ReviewCard key={r._id} review={r} compact />
                  ))}
                </div>
                {reviews.length > 4 && (
                  <button
                    type="button"
                    className="listing-btn-outline"
                    onClick={() => setReviewsModalOpen(true)}
                  >
                    Show all {reviews.length} reviews
                  </button>
                )}
              </>
            )}
          </section>

          <hr className="listing-divider" />

          {/* Location */}
          <section className="listing-section" id="location">
            <h3>Where you&apos;ll be</h3>
            <p className="listing-muted listing-location-name">
              {room.location?.area}, {room.location?.city}, India
            </p>
            <div className="listing-map">
              <Icon icon={MapPin} size={ICON.xl} />
              <span>{room.location?.city}</span>
            </div>
            <p className="listing-muted">
              This listing&apos;s location is verified. The exact address will be provided after booking.
            </p>
            {attractions.length > 0 && (
              <div className="listing-nearby">
                <h4>Neighbourhood highlights</h4>
                <p>{attractions[0]?.description}</p>
                {attractions.length > 1 && (
                  <button
                    type="button"
                    className="listing-show-more"
                    onClick={() => setAttractionsModalOpen(true)}
                  >
                    Show more <Icon icon={ChevronRight} size={ICON.sm} />
                  </button>
                )}
              </div>
            )}
          </section>

          <hr className="listing-divider" />

          {/* Meet your host */}
          <section className="listing-section">
            <h3>Meet your host</h3>
            <div className="host-card-wrap">
              <div className="host-card">
                {hostProfileUrl ? (
                  <Link to={hostProfileUrl} className="host-card__profile-link">
                    <img src={hostAvatar} alt={host.name} className="host-card__avatar" />
                    <strong>{host.name}</strong>
                  </Link>
                ) : (
                  <>
                    <img src={hostAvatar} alt={host.name} className="host-card__avatar" />
                    <strong>{host.name}</strong>
                  </>
                )}
                <span className="host-card__role">Host</span>
                <div className="host-card__stats">
                  <div><strong>{room.total_reviews || 0}</strong><span>Reviews</span></div>
                  <div><strong>{room.avg_rating?.toFixed(2) || '—'}★</strong><span>Rating</span></div>
                  <div><strong>{hostYears(host.created_at)}</strong><span>Years hosting</span></div>
                </div>
                {hostProfileUrl && (
                  <Link to={hostProfileUrl} className="listing-btn-outline host-card__view-profile">
                    View host profile
                  </Link>
                )}
              </div>
              <div className="host-details">
                <h4>Host details</h4>
                {host.about_me && <p>{host.about_me}</p>}
                <p className="listing-muted">Response rate: 100%</p>
                <p className="listing-muted">Responds within an hour</p>
                <button type="button" className="listing-btn-outline" onClick={handleMessageHost}>
                  Message host
                </button>
                <p className="host-security">
                  <Icon icon={Shield} size={ICON.sm} />
                  To help protect your payment, always use StayEase to send money and communicate with hosts.
                </p>
              </div>
            </div>
          </section>

          <hr className="listing-divider" />

          {/* Things to know */}
          <section className="listing-section">
            <h3>Things to know</h3>
            <div className="things-grid">
              <div>
                <Icon icon={Calendar} size={ICON.lg} />
                <h4>Cancellation policy</h4>
                <p>{getCancellationSummary(cancellation)}</p>
                <button type="button" className="listing-show-more" onClick={() => setPolicyModal('cancellation')}>
                  Learn more
                </button>
              </div>
              <div>
                <Icon icon={KeyRound} size={ICON.lg} />
                <h4>House rules</h4>
                <p>Check-in after {formatTime12(checkInTime)}</p>
                <p>Checkout before {formatTime12(checkOutTime)}</p>
                {room.policies?.pet_allowed && <p>Pets allowed</p>}
                <button type="button" className="listing-show-more" onClick={() => setPolicyModal('house-rules')}>
                  Learn more
                </button>
              </div>
              <div>
                <Icon icon={Shield} size={ICON.lg} />
                <h4>Safety & property</h4>
                <p>Smoke alarm installed</p>
                <p>Exterior security cameras on property</p>
                <button type="button" className="listing-show-more" onClick={() => setPolicyModal('safety')}>
                  Learn more
                </button>
              </div>
            </div>
          </section>

          <button type="button" className="listing-report" onClick={handleReportListing}>
            <Icon icon={Flag} size={ICON.sm} /> Report this listing
          </button>
        </div>

        <div className="listing-sidebar hide-mobile">
          <BookingCard
            room={room}
            initialCheckIn={checkInParam}
            initialCheckOut={checkOutParam}
            initialGuests={guestsParam}
            onDatesChange={setWidgetDates}
            onPricingChange={setWidgetPricing}
          />
        </div>
      </div>

      <div className="mobile-booking-bar hide-desktop">
        <div className="mobile-booking-bar__price">
          {widgetPricing?.total_price && widgetPricing?.total_nights ? (
            <>
              <strong>{formatCurrency(widgetPricing.total_price)}</strong>
              <span> for {widgetPricing.total_nights} night{widgetPricing.total_nights !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <strong>{formatCurrency(room.price_per_night)}</strong>
              <span> / night</span>
            </>
          )}
        </div>
        <Link to={mobileBookUrl} className="mobile-booking-bar__reserve">
          Reserve
        </Link>
      </div>

      <AboutThisSpaceModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        room={room}
      />
      <AllReviewsModal
        open={reviewsModalOpen}
        onClose={() => setReviewsModalOpen(false)}
        reviews={reviews}
        roomTitle={room.title}
        avgRating={room.avg_rating || 0}
      />
      <AmenitiesModal
        open={amenitiesModalOpen}
        onClose={() => setAmenitiesModalOpen(false)}
        amenities={amenities}
      />
      <NearbyAttractionsModal
        open={attractionsModalOpen}
        onClose={() => setAttractionsModalOpen(false)}
        attractions={attractions}
        city={room.location?.city || 'the area'}
      />
      <MessageHostModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        roomId={id}
        hostName={host.name}
      />
      <ReportListingModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        roomId={id}
        roomTitle={room.title}
      />

      <CancellationPolicyModal
        open={policyModal === 'cancellation'}
        onClose={() => setPolicyModal(null)}
        policy={cancellation}
        checkIn={checkInParam}
        checkInTime={checkInTime}
      />
      <HouseRulesModal
        open={policyModal === 'house-rules'}
        onClose={() => setPolicyModal(null)}
        room={room}
      />
      <SafetyPropertyModal
        open={policyModal === 'safety'}
        onClose={() => setPolicyModal(null)}
        room={room}
      />
      <WriteReviewModal
        open={reviewOpen}
        booking={reviewEligibility.booking}
        roomTitle={room.title}
        onClose={() => setReviewOpen(false)}
        onSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
