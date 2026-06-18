import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  IndianRupee,
  MailCheck,
  MapPin,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { hostsApi } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import HostListingCard from '../../components/HostListingCard';
import HostProfileReviewCard from '../../components/HostProfileReviewCard';
import Spinner from '../../components/Spinner';
import { getInterestIcon } from '../../constants/hostInterests';
import { Icon, ICON } from '../../components/ui/Icon';
import { getAvatarUrl, getPrimaryRoomImage } from '../../utils/roomImages';
import SafeImage from '../../components/SafeImage';

const ABOUT_PREVIEW_LENGTH = 280;

function uniqueValues(items) {
  return [...new Set(items.filter(Boolean))];
}

export default function HostProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await hostsApi.getProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.normalized?.message || 'Host not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const firstName = useMemo(
    () => profile?.name?.split(' ')[0] || 'Host',
    [profile?.name],
  );

  if (loading) return <Spinner label="Loading host profile..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return null;

  const avatar = profile.avatar_url || getAvatarUrl(profile.name, profile.id);
  const stats = profile.stats || {};
  const details = profile.host_profile || {};
  const isTopHost = stats.avg_rating >= 4.8 && stats.total_reviews >= 10 && stats.listing_count >= 2;
  const reviews = profile.reviews || [];
  const aboutText = profile.about_me || `${profile.name} hosts verified hotel stays on StayEase across India.`;
  const aboutNeedsToggle = aboutText.length > ABOUT_PREVIEW_LENGTH;
  const aboutPreview = aboutNeedsToggle && !aboutExpanded
    ? `${aboutText.slice(0, ABOUT_PREVIEW_LENGTH).trim()}…`
    : aboutText;
  const interests = profile.interests || [];
  const listings = profile.listings || [];
  const cities = uniqueValues(listings.map((room) => room.location?.city));
  const featuredListing = listings[0];
  const moreListings = listings.slice(1);

  return (
    <div className="host-profile-page">
      <header className="host-hero">
        <div className="host-hero__inner">
          <div className="host-hero__identity">
            <div className="host-hero__avatar-shell">
              <img src={avatar} alt={profile.name} className="host-hero__avatar" />
              {profile.identity_verified && (
                <span className="host-hero__verified" title="Identity verified">
                  <Icon icon={BadgeCheck} size={ICON.sm} />
                </span>
              )}
            </div>

            <div className="host-hero__copy">
              <p className="host-hero__eyebrow">StayEase verified host</p>
              <h1>{profile.name}</h1>
              {details.work && <p className="host-hero__role">{details.work}</p>}
              <div className="host-hero__chips">
                {isTopHost && (
                  <span className="host-chip host-chip--gold">
                    <Icon icon={Award} size={ICON.sm} />
                    Top-rated host
                  </span>
                )}
                {cities.map((city) => (
                  <span key={city} className="host-chip">
                    <Icon icon={MapPin} size={ICON.sm} />
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="host-hero__stats">
            <div className="host-stat-tile host-stat-tile--reviews">
              <strong>{stats.total_reviews || 0}</strong>
              <span>Guest reviews</span>
            </div>
            <div className="host-stat-tile host-stat-tile--rating">
              <strong>
                {stats.avg_rating ? stats.avg_rating.toFixed(2) : '—'}
                <Icon icon={Star} size={ICON.sm} fill="currentColor" />
              </strong>
              <span>Avg. rating</span>
            </div>
            <div className="host-stat-tile host-stat-tile--years">
              <strong>{stats.years_hosting || 1}</strong>
              <span>Years hosting</span>
            </div>
            <div className="host-stat-tile host-stat-tile--listings">
              <strong>{stats.listing_count || 0}</strong>
              <span>Live listings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="host-profile-body">
        <section className="host-bento">
          <article className="host-story">
            <div className="host-story__header">
              <span className="host-section-tag">01 · Story</span>
              <h2>Meet {firstName}</h2>
            </div>

            {details.unique_highlight && (
              <blockquote className="host-story__quote">
                <Icon icon={Sparkles} size={ICON.md} />
                <p>&ldquo;{details.unique_highlight}&rdquo;</p>
              </blockquote>
            )}

            <p className="host-story__bio">{aboutPreview}</p>
            {aboutNeedsToggle && (
              <button
                type="button"
                className="host-story__toggle"
                onClick={() => setAboutExpanded((v) => !v)}
              >
                {aboutExpanded ? 'Show less' : 'Read full story'}
              </button>
            )}
          </article>

          <div className="host-trust-bento">
            <div className="host-trust-tile host-trust-tile--primary">
              <Icon icon={ShieldCheck} size={ICON.lg} />
              <strong>Verified on StayEase</strong>
              <p>Identity checked before listing goes live.</p>
            </div>
            <div className="host-trust-tile">
              <Icon icon={Receipt} size={ICON.md} />
              <strong>GST-ready stays</strong>
              <p>Transparent tax breakdown at checkout.</p>
            </div>
            <div className="host-trust-tile">
              <Icon icon={IndianRupee} size={ICON.md} />
              <strong>Secure payments</strong>
              <p>Book and pay only through StayEase.</p>
            </div>
            <div className="host-trust-tile">
              <Icon icon={MessageCircle} size={ICON.md} />
              <strong>{stats.response_rate || 100}% response</strong>
              <p>Typically replies within an hour.</p>
            </div>
            {profile.email_verified && (
              <div className="host-trust-tile host-trust-tile--compact">
                <Icon icon={MailCheck} size={ICON.md} />
                <span>Email confirmed</span>
              </div>
            )}
            {details.work && (
              <div className="host-trust-tile host-trust-tile--compact">
                <Icon icon={Briefcase} size={ICON.md} />
                <span>{details.work}</span>
              </div>
            )}
          </div>
        </section>

        {reviews.length > 0 && (
          <section className="host-panel host-panel--reviews">
            <div className="host-panel__head">
              <div>
                <span className="host-section-tag">02 · Voices</span>
                <h2>What guests are saying</h2>
              </div>
              <p className="host-panel__count">{reviews.length} verified review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="host-reviews-mosaic">
              {reviews.slice(0, 6).map((review, index) => (
                <div
                  key={review._id}
                  className={`host-reviews-mosaic__item host-reviews-mosaic__item--${(index % 3) + 1}`}
                >
                  <HostProfileReviewCard review={review} />
                </div>
              ))}
            </div>
          </section>
        )}

        {interests.length > 0 && (
          <section className="host-panel host-panel--expertise">
            <span className="host-section-tag">03 · Expertise</span>
            <h2>Message {firstName} about</h2>
            <p className="host-panel__lead">Great topics to ask before you reserve.</p>
            <ul className="host-expertise-cloud">
              {interests.map((interest, index) => {
                const InterestIcon = getInterestIcon(interest);
                return (
                  <li
                    key={interest}
                    className="host-expertise-pill"
                    style={{ '--pill-delay': `${index * 40}ms` }}
                  >
                    <Icon icon={InterestIcon} size={ICON.sm} />
                    {interest}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {listings.length > 0 && (
          <section className="host-panel host-panel--listings" id="host-listings">
            <div className="host-panel__head">
              <div>
                <span className="host-section-tag">04 · Stays</span>
                <h2>Properties by {firstName}</h2>
              </div>
              <p className="host-panel__count">{listings.length} on StayEase</p>
            </div>

            {featuredListing && (
              <Link to={`/rooms/${featuredListing._id}`} className="host-featured-stay">
                <SafeImage
                  src={getPrimaryRoomImage(featuredListing)}
                  alt={featuredListing.title}
                  className="host-featured-stay__image"
                  fallbackSeed={featuredListing._id}
                />
                <div className="host-featured-stay__overlay">
                  <span className="host-featured-stay__label">Featured stay</span>
                  <h3>{featuredListing.title}</h3>
                  <p>
                    {featuredListing.location?.area}, {featuredListing.location?.city}
                    {featuredListing.avg_rating > 0 && (
                      <>
                        {' · '}
                        <Icon icon={Star} size={ICON.sm} fill="currentColor" />
                        {featuredListing.avg_rating.toFixed(2)}
                      </>
                    )}
                  </p>
                  <span className="host-featured-stay__cta">
                    View listing <Icon icon={ChevronRight} size={ICON.sm} />
                  </span>
                </div>
              </Link>
            )}

            {moreListings.length > 0 && (
              <div className="host-listings-grid">
                {moreListings.map((room) => (
                  <HostListingCard key={room._id} room={room} />
                ))}
              </div>
            )}
          </section>
        )}

        <aside className="host-cta-strip">
          <div className="host-cta-strip__glow" aria-hidden />
          <Icon icon={ShieldCheck} size={ICON.lg} />
          <div>
            <strong>Your trip, protected on StayEase</strong>
            <p>Pay, message, and cancel through StayEase — GST invoice and support in one place.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
