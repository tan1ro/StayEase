import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import Modal from '../../components/Modal';
import {
  SettingsCta,
  SettingsLayout,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
} from '../../components/settings/SettingsLayout';
import { analyticsApi, authApi, bookingsApi, formatCurrency, referralsApi, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { maskEmail, PROFILE_SECTIONS } from '../../constants/accountSettings';
import { formatRangeLabel } from '../../utils/dates';

const PIE_COLORS = ['#4F7FE8', '#6B9AFF', '#E85D75', '#E8A84F'];

function loadPastTrips() {
  return bookingsApi.list({ scope: 'traveling' }).then(({ data }) => {
    const today = new Date().toISOString().slice(0, 10);
    return data.filter((b) => b.status !== 'cancelled' && b.check_out_date <= today);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [active, setActive] = useState('about');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [referralStats, setReferralStats] = useState({ count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewBooking, setReviewBooking] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'settings') {
      navigate('/settings', { replace: true });
      return;
    }
    if (hash && PROFILE_SECTIONS.some((section) => section.id === hash && section.id !== 'settings')) {
      setActive(hash);
    }
  }, [navigate]);

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
    referralsApi.stats().then(({ data }) => setReferralStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (active !== 'trips') return;
    setTripsLoading(true);
    loadPastTrips()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setTripsLoading(false));
  }, [active]);

  useEffect(() => {
    if (active !== 'wishlist' || !user?.wishlist?.length) {
      if (active === 'wishlist') setWishlistRooms([]);
      return;
    }
    setWishlistLoading(true);
    Promise.all(user.wishlist.map((id) => roomsApi.get(id).then((r) => r.data).catch(() => null)))
      .then((rooms) => setWishlistRooms(rooms.filter(Boolean)))
      .finally(() => setWishlistLoading(false));
  }, [active, user?.wishlist]);

  useEffect(() => {
    if (active !== 'dashboard') return;
    setDashboardLoading(true);
    analyticsApi.guestDashboard()
      .then(({ data }) => setDashboard(data))
      .catch(() => setDashboard(null))
      .finally(() => setDashboardLoading(false));
  }, [active]);

  const handleSelect = (id) => {
    if (id === 'settings') {
      navigate('/settings');
      return;
    }
    setActive(id);
    setError('');
    setSuccess('');
    window.history.replaceState(null, '', `#${id}`);
  };

  const saveProfile = async (fields = {}) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', fields.name ?? name);
      fd.append('phone', fields.phone ?? phone);
      fd.append('about_me', fields.about ?? about);
      fd.append('notification_prefs', JSON.stringify({
        email: fields.emailPrefs ?? emailPrefs,
        whatsapp: fields.whatsappPrefs ?? whatsappPrefs,
      }));
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Profile updated');
      setModal(null);
    } catch (err) {
      setError(err.normalized?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrips = () => {
    loadPastTrips().then(setBookings).catch(() => {});
  };

  const alert = success ? (
    <p className="account-settings__alert account-settings__alert--success">{success}</p>
  ) : error ? (
    <ErrorMessage message={error} />
  ) : null;

  const spendData = dashboard?.recent_bookings?.map((b, i) => ({
    month: `B${i + 1}`,
    spent: b.total_price,
  })) || [];

  const statusData = [
    { name: 'Confirmed', value: dashboard?.upcoming_trips || 0 },
    { name: 'Total', value: dashboard?.total_bookings || 0 },
  ];

  const aboutPanel = (
    <SettingsPanel title="About me" subtitle="Your public traveller profile and notification preferences.">
      {alert}
      <SettingsSection>
        <SettingsRow label="Name" value={user?.name || 'Not provided'} action="Edit" onAction={() => setModal('name')} />
        <SettingsRow label="Email" value={maskEmail(user?.email)} action="View" onAction={() => setModal('email')} />
        <SettingsRow
          label="Phone"
          value={user?.phone || 'Not provided'}
          action={user?.phone ? 'Edit' : 'Add'}
          onAction={() => setModal('phone')}
        />
        <SettingsRow
          label="About me"
          value={user?.about_me ? 'Provided' : 'Not provided'}
          action={user?.about_me ? 'Edit' : 'Add'}
          onAction={() => setModal('about')}
        />
      </SettingsSection>
      <SettingsSection title="Verification & referrals">
        <div className="profile-settings__embed">
          <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
        </div>
        <div className="profile-settings__embed">
          <ReferralCard
            code={user?.referral_code}
            credits={user?.referral_credits}
            referredCount={referralStats.total_referred}
          />
        </div>
      </SettingsSection>
      <SettingsSection title="Notifications">
        <SettingsToggleRow
          label="Email notifications"
          description="Booking updates, receipts, and trip reminders."
          checked={emailPrefs}
          onChange={(value) => {
            setEmailPrefs(value);
            saveProfile({ emailPrefs: value });
          }}
        />
        <SettingsToggleRow
          label="WhatsApp notifications"
          description="Quick alerts for check-in details and host messages."
          checked={whatsappPrefs}
          onChange={(value) => {
            setWhatsappPrefs(value);
            saveProfile({ whatsappPrefs: value });
          }}
        />
      </SettingsSection>
    </SettingsPanel>
  );

  const tripsPanel = (
    <SettingsPanel title="Past trips" subtitle="Completed stays, invoices, and reviews.">
      {alert}
      {tripsLoading ? (
        <Spinner label="Loading trips..." />
      ) : bookings.length === 0 ? (
        <SettingsSection>
          <p className="account-settings__section-desc">You have not completed any trips yet.</p>
          <SettingsCta to="/">Browse stays</SettingsCta>
        </SettingsSection>
      ) : (
        <SettingsSection>
          {bookings.map((booking) => (
            <div key={booking._id} className="profile-trip-row">
              <div className="profile-trip-row__main">
                <strong>{booking.room_title || 'Stay'}</strong>
                <span>{formatRangeLabel(booking.check_in_date, booking.check_out_date)}</span>
                <span>{formatCurrency(booking.total_price)}</span>
                {booking.has_review && <span className="booking-reviewed-note">You reviewed this stay</span>}
              </div>
              <div className="profile-trip-row__actions">
                {booking.can_review && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setReviewBooking(booking)}>
                    <Star size={14} /> Rate hotel
                  </button>
                )}
                <Link to={`/receipt/${booking._id}`} className="btn btn-outline btn-sm">
                  <Download size={14} /> Invoice
                </Link>
                <Link to={`/rooms/${booking.room_id}`} className="btn btn-primary btn-sm">Book again</Link>
              </div>
            </div>
          ))}
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const wishlistPanel = (
    <SettingsPanel title="Wishlist" subtitle="Stays you have saved for later.">
      {alert}
      {wishlistLoading ? (
        <Spinner label="Loading wishlist..." />
      ) : wishlistRooms.length === 0 ? (
        <SettingsSection>
          <p className="account-settings__section-desc">No saved stays yet. Tap the heart on any listing to save it here.</p>
          <SettingsCta to="/">Explore stays</SettingsCta>
        </SettingsSection>
      ) : (
        <div className="profile-wishlist-grid">
          {wishlistRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onWishlistToggle={(roomId, isWishlisted) => {
                if (isWishlisted === false) {
                  setWishlistRooms((prev) => prev.filter((r) => (r._id || r.id) !== roomId));
                }
                refreshUser();
              }}
            />
          ))}
        </div>
      )}
    </SettingsPanel>
  );

  const dashboardPanel = (
    <SettingsPanel title="Dashboard" subtitle="Your travel spending and booking activity.">
      {alert}
      {dashboardLoading ? (
        <Spinner label="Loading dashboard..." />
      ) : dashboard ? (
        <>
          <div className="profile-dashboard-stats">
            <div className="profile-dashboard-stats__card">
              <span>Total spent</span>
              <strong>{formatCurrency(dashboard.total_spent)}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Total bookings</span>
              <strong>{dashboard.total_bookings}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Upcoming</span>
              <strong>{dashboard.upcoming_trips}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Referral credits</span>
              <strong>{formatCurrency(dashboard.referral_credits)}</strong>
            </div>
          </div>
          <div className="profile-dashboard-charts">
            <div className="profile-dashboard-charts__card">
              <h3>Recent spend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={spendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="spent" fill="#4F7FE8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="profile-dashboard-charts__card">
              <h3>Booking status</h3>
              <ResponsiveContainer width="100%" height={240}>
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
      ) : (
        <SettingsSection>
          <p className="account-settings__section-desc">Dashboard data is unavailable right now.</p>
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const panels = {
    about: aboutPanel,
    trips: tripsPanel,
    wishlist: wishlistPanel,
    dashboard: dashboardPanel,
  };

  return (
    <>
      <SettingsLayout
        title="Profile"
        sections={PROFILE_SECTIONS}
        activeId={active}
        onSelect={handleSelect}
        onDone={() => navigate(-1)}
      >
        {panels[active]}
      </SettingsLayout>

      <Modal open={modal === 'name'} onClose={() => setModal(null)} title="Name">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'phone'} onClose={() => setModal(null)} title="Phone number">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'about'} onClose={() => setModal(null)} title="About me">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Bio</label>
            <textarea className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="Tell hosts a little about yourself" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'email'} onClose={() => setModal(null)} title="Email address">
        <p className="account-settings__panel-subtitle">Your login email cannot be changed here. Contact support if you need to update it.</p>
        <div className="account-settings__row-value" style={{ marginTop: '1rem' }}>{user?.email}</div>
      </Modal>

      <WriteReviewModal
        open={!!reviewBooking}
        booking={reviewBooking}
        roomTitle={reviewBooking?.room_title}
        onClose={() => setReviewBooking(null)}
        onSubmitted={refreshTrips}
      />
    </>
  );
}
