import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, Star } from 'lucide-react';
import ReferralCard from '../../components/ReferralCard';
import IdentityVerification from '../../components/IdentityVerification';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import WriteReviewModal from '../../components/WriteReviewModal';
import { analyticsApi, authApi, bookingsApi, referralsApi, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../api/api';

const TABS = ['About me', 'Past trips', 'Wishlist', 'Dashboard'];
const PIE_COLORS = ['#4F7FE8', '#6B9AFF', '#E85D75', '#E8A84F'];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [referralStats, setReferralStats] = useState({ count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewBooking, setReviewBooking] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAbout(user.about_me || '');
      setEmailPrefs(user.notification_prefs?.email ?? true);
      setWhatsappPrefs(user.notification_prefs?.whatsapp ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (window.location.hash === '#settings') setTab(0);
  }, []);

  useEffect(() => {
    if (tab === 1) {
      bookingsApi.list({ scope: 'traveling' }).then(({ data }) => {
        const today = new Date().toISOString().slice(0, 10);
        setBookings(data.filter((b) => b.status !== 'cancelled' && b.check_out_date <= today));
      }).catch(() => {});
    }
    if (tab === 2 && user?.wishlist?.length) {
      Promise.all(user.wishlist.map((id) => roomsApi.get(id).then((r) => r.data).catch(() => null)))
        .then((rooms) => setWishlistRooms(rooms.filter(Boolean)));
    }
    if (tab === 3) {
      analyticsApi.guestDashboard().then(({ data }) => setDashboard(data)).catch(() => {});
    }
    referralsApi.stats().then(({ data }) => setReferralStats(data)).catch(() => {});
  }, [tab, user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', phone);
      fd.append('about_me', about);
      fd.append('notification_prefs', JSON.stringify({ email: emailPrefs, whatsapp: whatsappPrefs }));
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.normalized?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const spendData = dashboard?.recent_bookings?.map((b, i) => ({
    month: `B${i + 1}`,
    spent: b.total_price,
  })) || [];

  const statusData = [
    { name: 'Confirmed', value: dashboard?.upcoming_trips || 0 },
    { name: 'Total', value: dashboard?.total_bookings || 0 },
  ];

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} type="button" className={`tab ${tab === i ? 'tab--active' : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      {success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</p>}

      {tab === 0 && (
        <form onSubmit={saveProfile} className="card" style={{ padding: '1.5rem', maxWidth: 600 }}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">About me</label>
            <textarea className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} />
          </div>
          <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
          <ReferralCard code={user?.referral_code} credits={user?.referral_credits} referredCount={referralStats.total_referred} />
          <div className="form-group" id="settings">
            <label style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="checkbox" checked={emailPrefs} onChange={(e) => setEmailPrefs(e.target.checked)} />
              Email notifications
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={whatsappPrefs} onChange={(e) => setWhatsappPrefs(e.target.checked)} />
              WhatsApp notifications
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>Save</button>
        </form>
      )}

      {tab === 1 && (
        <div>
          {bookings.length === 0 ? (
            <div className="empty-state">No past trips.</div>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <strong>{b.room_title || 'Stay'}</strong>
                  <p>{b.check_in_date} → {b.check_out_date}</p>
                  <p>{formatCurrency(b.total_price)}</p>
                  {b.has_review && <span className="booking-reviewed-note">You reviewed this stay</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {b.can_review && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setReviewBooking(b)}>
                      <Star size={14} /> Rate stay
                    </button>
                  )}
                  <Link to={`/receipt/${b._id}`} className="btn btn-outline btn-sm"><Download size={14} /> Invoice</Link>
                  <Link to={`/rooms/${b.room_id}`} className="btn btn-primary btn-sm">Book again</Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 2 && (
        wishlistRooms.length === 0 ? (
          <div className="empty-state">No wishlist items.</div>
        ) : (
          <div className="grid-rooms">
            {wishlistRooms.map((room) => <RoomCard key={room._id} room={room} />)}
          </div>
        )
      )}

      {tab === 3 && (
        dashboard ? (
          <>
            <div className="stat-cards">
              <div className="stat-card card"><div className="stat-card__label">Total spent</div><div className="stat-card__value">{formatCurrency(dashboard.total_spent)}</div></div>
              <div className="stat-card card"><div className="stat-card__label">Total bookings</div><div className="stat-card__value">{dashboard.total_bookings}</div></div>
              <div className="stat-card card"><div className="stat-card__label">Upcoming</div><div className="stat-card__value">{dashboard.upcoming_trips}</div></div>
              <div className="stat-card card"><div className="stat-card__label">Referral credits</div><div className="stat-card__value">{formatCurrency(dashboard.referral_credits)}</div></div>
            </div>
            <div className="grid-2">
              <div className="card" style={{ padding: '1rem', height: 280 }}>
                <h3>Recent spend</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={spendData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="spent" fill="#4F7FE8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ padding: '1rem', height: 280 }}>
                <h3>Booking status</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : <Spinner />
      )}

      <WriteReviewModal
        open={!!reviewBooking}
        booking={reviewBooking}
        roomTitle={reviewBooking?.room_title}
        onClose={() => setReviewBooking(null)}
        onSubmitted={() => {
          if (tab === 1) {
            bookingsApi.list({ scope: 'traveling' }).then(({ data }) => {
              const today = new Date().toISOString().slice(0, 10);
              setBookings(data.filter((b) => b.status !== 'cancelled' && b.check_out_date <= today));
            }).catch(() => {});
          }
        }}
      />
    </div>
  );
}
