import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  MailCheck,
  MessageCircle,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { hostsApi } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import ReviewCard from '../../components/ReviewCard';
import RoomCard from '../../components/RoomCard';
import SafeImage from '../../components/SafeImage';
import Spinner from '../../components/Spinner';
import { Icon, ICON } from '../../components/ui/Icon';
import { getAvatarUrl } from '../../utils/roomImages';

function HostBadge({ icon: BadgeIcon, label }) {
  return (
    <span className="host-profile-badge">
      <Icon icon={BadgeIcon} size={ICON.sm} />
      {label}
    </span>
  );
}

export default function HostProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <Spinner label="Loading host profile..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return null;

  const avatar = profile.avatar_url || getAvatarUrl(profile.name, profile.id);
  const stats = profile.stats || {};
  const isTopHost = stats.avg_rating >= 4.8 && stats.total_reviews >= 10 && stats.listing_count >= 2;
  const reviewsByListing = profile.reviews_by_listing || [];
  const hasGroupedReviews = reviewsByListing.length > 0;

  return (
    <div className="host-profile-page">
      <section className="host-profile-hero card">
        <div className="host-profile-hero__main">
          <img src={avatar} alt={profile.name} className="host-profile-hero__avatar" />
          <div className="host-profile-hero__intro">
            <p className="host-profile-hero__eyebrow">StayEase host</p>
            <h1>{profile.name}</h1>
            {isTopHost && <p className="host-profile-hero__tag">Top-rated host on StayEase</p>}
            <div className="host-profile-hero__badges">
              {profile.identity_verified && <HostBadge icon={BadgeCheck} label="Identity verified" />}
              {profile.email_verified && <HostBadge icon={MailCheck} label="Email confirmed" />}
              <HostBadge icon={ShieldCheck} label="Secure payments" />
            </div>
          </div>
        </div>

        <div className="host-profile-stats">
          <div>
            <strong>{stats.total_reviews || 0}</strong>
            <span>Reviews</span>
          </div>
          <div>
            <strong>
              <Icon icon={Star} size={ICON.sm} fill="currentColor" />
              {stats.avg_rating ? stats.avg_rating.toFixed(2) : '—'}
            </strong>
            <span>Rating</span>
          </div>
          <div>
            <strong>{stats.years_hosting || 1}</strong>
            <span>Years hosting</span>
          </div>
          <div>
            <strong>{stats.listing_count || 0}</strong>
            <span>Listings</span>
          </div>
          <div>
            <strong>{stats.response_rate || 100}%</strong>
            <span>Response rate</span>
          </div>
        </div>
      </section>

      <section className="host-profile-listings">
        <div className="host-profile-listings__header">
          <h2>{profile.name.split(' ')[0]}&apos;s listings</h2>
          <p>{profile.listings?.length || 0} stays · ratings synced from guest reviews</p>
        </div>
        {profile.listings?.length ? (
          <div className="grid-rooms">
            {profile.listings.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        ) : (
          <div className="empty-state card">This host has no active listings right now.</div>
        )}
      </section>

      <div className="host-profile-grid">
        <section className="host-profile-panel card">
          <h2>About {profile.name.split(' ')[0]}</h2>
          {profile.about_me ? (
            <p className="host-profile-about">{profile.about_me}</p>
          ) : (
            <p className="listing-muted">
              {profile.name} hosts verified stays on StayEase across India.
            </p>
          )}

          <div className="host-profile-facts">
            <div>
              <Icon icon={Building2} size={ICON.md} />
              <div>
                <strong>{stats.listing_count || 0} listings</strong>
                <p>Browse every stay hosted by {profile.name.split(' ')[0]}.</p>
              </div>
            </div>
            <div>
              <Icon icon={MessageCircle} size={ICON.md} />
              <div>
                <strong>Quick responses</strong>
                <p>Hosts on StayEase typically reply within an hour.</p>
              </div>
            </div>
          </div>

          <p className="host-profile-security">
            <Icon icon={ShieldCheck} size={ICON.sm} />
            To protect your payment, always book and communicate through StayEase.
          </p>
        </section>

        <section className="host-profile-panel card">
          <h2>Guest reviews by property</h2>
          {!hasGroupedReviews ? (
            <p className="listing-muted">No guest reviews yet for this host&apos;s listings.</p>
          ) : (
            <div className="host-profile-reviews-by-listing">
              {reviewsByListing.map((listing) => (
                <article key={listing.room_id} className="host-profile-listing-reviews">
                  <Link to={`/rooms/${listing.room_id}`} className="host-profile-listing-reviews__header">
                    {listing.photo_url ? (
                      <SafeImage
                        src={listing.photo_url}
                        alt={listing.room_title}
                        className="host-profile-listing-reviews__photo"
                      />
                    ) : (
                      <div className="host-profile-listing-reviews__photo host-profile-listing-reviews__photo--placeholder" />
                    )}
                    <div>
                      <h3>{listing.room_title}</h3>
                      <p>
                        <Icon icon={Star} size={ICON.sm} fill="currentColor" />
                        {listing.avg_rating.toFixed(2)}
                        <span> · {listing.total_reviews} review{listing.total_reviews !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </Link>
                  <div className="host-profile-reviews">
                    {listing.reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} compact />
                    ))}
                  </div>
                  {listing.total_reviews > listing.reviews.length && (
                    <Link to={`/rooms/${listing.room_id}#reviews`} className="host-profile-listing-reviews__more">
                      View all {listing.total_reviews} reviews for this stay
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
