import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { Briefcase, Download, Eye, Heart, Lock, Monitor, Star, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { analyticsApi, authApi, bookingsApi, formatCurrency, referralsApi, roomsApi } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import IdentityVerification from '../../components/IdentityVerification';
import ReferralCard from '../../components/ReferralCard';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import WriteReviewModal from '../../components/WriteReviewModal';
import { Icon, ICON } from '../../components/ui/Icon';
import {
  SettingsCta,
  SettingsFeatureCard,
  SettingsInfoBox,
  SettingsLayout,
  SettingsLinkRow,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
  SettingsUrlField,
} from '../../components/settings/SettingsLayout';
import {
  ADDRESS_PREFS_KEY,
  DEFAULT_ADDRESS_PREFS,
  DEFAULT_GUEST_TAX_PREFS,
  DEFAULT_LOCALE_PREFS,
  DEFAULT_NOTIFICATION_DETAIL,
  DEFAULT_PRIVACY_PREFS,
  DEFAULT_PRO_TOOLS_PREFS,
  GUEST_SETTINGS_SECTIONS,
  GUEST_TAX_PREFS_KEY,
  LOCALE_PREFS_KEY,
  NOTIFICATION_DETAIL_KEY,
  PREFERRED_NAME_KEY,
  PRIVACY_PREFS_KEY,
  PRO_TOOLS_PREFS_KEY,
  firstName,
  formatTimezoneLabel,
  loadJsonPref,
  maskEmail,
  maskGstin,
  saveJsonPref,
} from '../../constants/accountSettings';
import { getAvatarUrl } from '../../utils/roomImages';
import { formatRangeLabel } from '../../utils/dates';

const PIE_COLORS = ['#4F7FE8', '#6B9AFF', '#E85D75', '#E8A84F'];

const HASH_ALIASES = { about: 'personal', settings: 'personal' };

function normalizePhone(value) {
  return (value || '').replace(/\D/g, '').slice(-10);
}

function loadPastTrips() {
  return bookingsApi.list({ scope: 'traveling' }).then(({ data }) => {
    const today = new Date().toISOString().slice(0, 10);
    return data.filter((b) => b.status !== 'cancelled' && b.check_out_date <= today);
  });
}

const NOTIFICATION_LABELS = {
  travelOffers: 'Inspiration and offers',
  tripPlanning: 'Trip planning',
  stayeaseUpdates: 'News and programmes',
  feedback: 'Feedback',
  travelRegulations: 'Travel regulations',
  tripReminders: 'Trip reminders',
  accountAlerts: 'Account and security alerts',
};

function formatNotifStatus(on) {
  return on ? 'On' : 'Off';
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser, canAccessHostPortal, becomeHost } = useAuth();
  const { consent, acceptAll, acceptEssential } = useCookieConsent();

  const [active, setActive] = useState('trips');
  const [securityTab, setSecurityTab] = useState('Login');
  const [notifTab, setNotifTab] = useState('Offers and updates');
  const [taxTab, setTaxTab] = useState('Taxpayers');
  const [paymentTab, setPaymentTab] = useState('Payments');

  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState(() => localStorage.getItem(PREFERRED_NAME_KEY) || '');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);

  const [pastTrips, setPastTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [travelDashboard, setTravelDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [referralStats, setReferralStats] = useState({ total_referred: 0 });
  const [reviewBooking, setReviewBooking] = useState(null);

  const [addressPrefs, setAddressPrefs] = useState(() => loadJsonPref(ADDRESS_PREFS_KEY, DEFAULT_ADDRESS_PREFS));
  const [privacyPrefs, setPrivacyPrefs] = useState(() => loadJsonPref(PRIVACY_PREFS_KEY, DEFAULT_PRIVACY_PREFS));
  const [localePrefs, setLocalePrefs] = useState(() => loadJsonPref(LOCALE_PREFS_KEY, DEFAULT_LOCALE_PREFS));
  const [notifDetail, setNotifDetail] = useState(() => loadJsonPref(NOTIFICATION_DETAIL_KEY, DEFAULT_NOTIFICATION_DETAIL));
  const [proToolsPrefs, setProToolsPrefs] = useState(() => loadJsonPref(PRO_TOOLS_PREFS_KEY, DEFAULT_PRO_TOOLS_PREFS));
  const [guestTaxPrefs, setGuestTaxPrefs] = useState(() => loadJsonPref(GUEST_TAX_PREFS_KEY, DEFAULT_GUEST_TAX_PREFS));
  const [gstinInput, setGstinInput] = useState('');

  const [taxSummary, setTaxSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const hash = (location.hash || window.location.hash).replace('#', '');
    const resolved = HASH_ALIASES[hash] || hash;
    if (resolved && GUEST_SETTINGS_SECTIONS.some((s) => s.id === resolved)) {
      setActive(resolved);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAbout(user.about_me || '');
      if (!localStorage.getItem(PREFERRED_NAME_KEY)) {
        setPreferredName(firstName(user.name));
      }
      setPhone(user.phone || '');
      setEmailPrefs(user.notification_prefs?.email ?? true);
      setWhatsappPrefs(user.notification_prefs?.whatsapp ?? false);
      if (!proToolsPrefs.profileSlug) {
        setProToolsPrefs((prev) => ({
          ...prev,
          profileSlug: user.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '',
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    referralsApi.stats().then(({ data }) => setReferralStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (active !== 'trips') return;
    setTripsLoading(true);
    loadPastTrips()
      .then(setPastTrips)
      .catch(() => setPastTrips([]))
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
    if (active === 'taxes') {
      Promise.all([
        analyticsApi.guestDashboard().then(({ data }) => data).catch(() => null),
        bookingsApi.list({ scope: 'traveling' }).then(({ data }) => data || []).catch(() => []),
      ])
        .then(([dash, bookings]) => {
          const paid = bookings.filter((b) => b.payment_status === 'paid' && b.status !== 'cancelled');
          const total_gst = paid.reduce((sum, b) => sum + (b.gst_amount || 0), 0);
          setTaxSummary({ ...dash, total_gst });
        })
        .catch(() => setTaxSummary(null));
    }
    if (active === 'dashboard') {
      setDashboardLoading(true);
      const guestId = user?.id || user?._id;
      Promise.all([
        analyticsApi.guestDashboard().then(({ data }) => data).catch(() => null),
        guestId
          ? bookingsApi.list({ guest_id: guestId }).then(({ data }) => data || []).catch(() => [])
          : Promise.resolve([]),
      ])
        .then(([dash, allBookings]) => {
          const year = new Date().getFullYear();
          const paid = allBookings.filter((b) => b.payment_status === 'paid' && b.status !== 'cancelled');
          const yearPaid = paid.filter((b) => (b.check_in_date || '').startsWith(String(year)));
          const totalSpentYear = yearPaid.reduce((sum, b) => sum + (b.total_price || 0), 0);
          const totalNights = yearPaid.reduce((sum, b) => sum + (b.total_nights || 0), 0);
          const totalGst = yearPaid.reduce((sum, b) => sum + (b.gst_amount || 0), 0);
          const monthly = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(year, i, 1).toLocaleDateString('en-IN', { month: 'short' }),
            spent: yearPaid
              .filter((b) => Number((b.check_in_date || '').slice(5, 7)) === i + 1)
              .reduce((sum, b) => sum + (b.total_price || 0), 0),
          }));
          const statusBreakdown = [
            { name: 'Confirmed', value: allBookings.filter((b) => b.status === 'confirmed').length },
            { name: 'Completed', value: allBookings.filter((b) => b.status === 'completed').length },
            { name: 'Cancelled', value: allBookings.filter((b) => b.status === 'cancelled').length },
          ];
          setTravelDashboard({
            ...dash,
            spend_year: totalSpentYear,
            nights_year: totalNights,
            avg_per_night: totalNights ? totalSpentYear / totalNights : 0,
            gst_year: totalGst,
            monthly_spend: monthly,
            status_breakdown: statusBreakdown,
          });
        })
        .catch(() => setTravelDashboard(null))
        .finally(() => setDashboardLoading(false));
    }
    if (active === 'payments') {
      bookingsApi.list({ scope: 'traveling' })
        .then(({ data }) => setRecentBookings((data || []).slice(0, 5)))
        .catch(() => setRecentBookings([]));
    }
  }, [active, user?.id, user?._id]);

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  const handleSelect = (id) => {
    setActive(id);
    clearMessages();
    window.history.replaceState(null, '', `#${id}`);
  };

  const saveProfile = async (fields = {}) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', fields.name ?? name);
      fd.append('phone', normalizePhone(fields.phone ?? phone));
      fd.append('about_me', fields.about ?? about ?? user?.about_me ?? '');
      fd.append('notification_prefs', JSON.stringify({
        email: fields.emailPrefs ?? emailPrefs,
        whatsapp: fields.whatsappPrefs ?? whatsappPrefs,
      }));
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Settings updated');
      setModal(null);
    } catch (err) {
      setError(err.normalized?.message || 'Could not update settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferredName = () => {
    localStorage.setItem(PREFERRED_NAME_KEY, preferredName.trim());
    setSuccess('Preferred name saved');
    setModal(null);
  };

  const saveAddressPref = (key, value) => {
    const next = { ...addressPrefs, [key]: value };
    setAddressPrefs(next);
    saveJsonPref(ADDRESS_PREFS_KEY, next);
    setSuccess('Address saved');
    setModal(null);
  };

  const saveGuestTaxPrefs = () => {
    const next = { gstin: gstinInput.trim().toUpperCase() };
    setGuestTaxPrefs(next);
    saveJsonPref(GUEST_TAX_PREFS_KEY, next);
    setSuccess('Tax information saved');
    setModal(null);
  };

  const saveAvatar = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Profile photo updated');
      setModal(null);
    } catch (err) {
      setError(err.normalized?.message || 'Could not upload photo');
    } finally {
      setLoading(false);
    }
  };

  const openGstinModal = () => {
    setGstinInput(guestTaxPrefs.gstin || '');
    setModal('gstin');
  };

  const avatarUrl = user?.avatar_url || getAvatarUrl(user?.name, user?.id);

  const updatePrivacy = (key, value) => {
    const next = { ...privacyPrefs, [key]: value };
    setPrivacyPrefs(next);
    saveJsonPref(PRIVACY_PREFS_KEY, next);
    setSuccess('Privacy preference saved');
    setError('');
  };

  const updateLocale = (key, value) => {
    const next = { ...localePrefs, [key]: value };
    setLocalePrefs(next);
    saveJsonPref(LOCALE_PREFS_KEY, next);
    setSuccess('Language & currency preference saved');
    setError('');
    setModal(null);
  };

  const updateNotifDetail = (key, value) => {
    const next = { ...notifDetail, [key]: value };
    setNotifDetail(next);
    saveJsonPref(NOTIFICATION_DETAIL_KEY, next);
    setSuccess('Notification preference saved');
    setError('');
    setModal(null);
  };

  const updateProTools = (patch) => {
    const next = { ...proToolsPrefs, ...patch };
    setProToolsPrefs(next);
    saveJsonPref(PRO_TOOLS_PREFS_KEY, next);
    setSuccess('Professional hosting preference saved');
    setError('');
  };

  const refreshTrips = () => {
    loadPastTrips().then(setPastTrips).catch(() => {});
  };

  const alert = success ? (
    <p className="account-settings__alert account-settings__alert--success">{success}</p>
  ) : error ? (
    <ErrorMessage message={error} />
  ) : null;

  const spendData = travelDashboard?.monthly_spend || travelDashboard?.recent_bookings?.map((b, i) => ({
    month: `B${i + 1}`,
    spent: b.total_price,
  })) || [];

  const statusData = travelDashboard?.status_breakdown || [
    { name: 'Confirmed', value: travelDashboard?.upcoming_trips || 0 },
    { name: 'Total', value: travelDashboard?.total_bookings || 0 },
  ];

  const tripsPanel = (
    <SettingsPanel title="Past trips" subtitle="Completed stays, invoices, and reviews.">
      {alert}
      {tripsLoading ? (
        <Spinner label="Loading trips..." />
      ) : pastTrips.length === 0 ? (
        <SettingsSection>
          <p className="account-settings__section-desc">You have not completed any trips yet.</p>
          <SettingsCta to="/">Browse stays</SettingsCta>
        </SettingsSection>
      ) : (
        <SettingsSection>
          {pastTrips.map((booking) => (
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
    <SettingsPanel title="My Spending" subtitle="Your travel spending and booking activity this year.">
      {alert}
      {dashboardLoading ? (
        <Spinner label="Loading dashboard..." />
      ) : travelDashboard ? (
        <>
          <div className="profile-dashboard-stats">
            <div className="profile-dashboard-stats__card">
              <span>Total spent this year</span>
              <strong>{formatCurrency(travelDashboard.spend_year ?? travelDashboard.total_spent)}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Total nights stayed</span>
              <strong>{travelDashboard.nights_year ?? '—'}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Average per night</span>
              <strong>{formatCurrency(travelDashboard.avg_per_night ?? 0)}</strong>
            </div>
            <div className="profile-dashboard-stats__card">
              <span>Total GST paid</span>
              <strong>{formatCurrency(travelDashboard.gst_year ?? 0)}</strong>
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

  const personalPanel = (
    <SettingsPanel title="Personal information">
      {alert}
      <SettingsSection>
        <SettingsRow label="Legal name" value={user?.name || 'Not provided'} action="Edit" onAction={() => setModal('name')} />
        <SettingsRow
          label="Preferred first name"
          value={preferredName || 'Not provided'}
          action={preferredName ? 'Edit' : 'Add'}
          onAction={() => setModal('preferred-name')}
        />
        <SettingsRow label="Email address" value={maskEmail(user?.email)} action="Edit" onAction={() => setModal('email')} />
        <SettingsRow
          label="Phone numbers"
          description="Add a number so confirmed hosts and StayEase can get in touch. You can add other numbers and choose how they're used."
          value={user?.phone || undefined}
          action={user?.phone ? 'Edit' : 'Add'}
          onAction={() => setModal('phone')}
        />
        <SettingsRow
          label="Identity verification"
          value={user?.email_verified ? 'Verified' : 'Not started'}
          action={user?.email_verified ? 'View' : 'Start'}
          onAction={() => setModal('identity')}
        />
        <SettingsRow
          label="Residential address"
          value={addressPrefs.residentialAddress ? 'Provided' : 'Not provided'}
          action={addressPrefs.residentialAddress ? 'Edit' : 'Add'}
          onAction={() => setModal('residential-address')}
        />
        <SettingsRow
          label="Postal address"
          value={addressPrefs.postalAddress ? 'Provided' : 'Not provided'}
          action={addressPrefs.postalAddress ? 'Edit' : 'Add'}
          onAction={() => setModal('postal-address')}
        />
        <SettingsRow
          label="Emergency contact"
          value={addressPrefs.emergencyContact ? 'Provided' : 'Not provided'}
          action={addressPrefs.emergencyContact ? 'Edit' : 'Add'}
          onAction={() => setModal('emergency')}
        />
        <SettingsRow
          label="About me"
          value={user?.about_me ? 'Provided' : 'Not provided'}
          action={user?.about_me ? 'Edit' : 'Add'}
          onAction={() => setModal('about')}
        />
      </SettingsSection>
      <SettingsSection title="Referrals">
        <div className="profile-settings__embed">
          <ReferralCard
            code={user?.referral_code}
            credits={user?.referral_credits}
            referredCount={referralStats.total_referred}
          />
        </div>
      </SettingsSection>
      <SettingsInfoBox
        items={[
          {
            icon: Lock,
            title: "Why isn't my info shown here?",
            text: 'Some account details are masked to protect your identity. Contact privacy@stayease.com for data requests.',
          },
          {
            icon: Briefcase,
            title: 'Which details can be edited?',
            text: 'Contact and personal info can be updated any time. Identity changes may require re-verification before your next booking.',
          },
          {
            icon: Eye,
            title: 'What info is shared with others?',
            text: 'Hosts only see your contact details after a booking is confirmed. Read our Privacy Policy for full details.',
          },
        ]}
      />
    </SettingsPanel>
  );

  const securityPanel = (
    <SettingsPanel
      title="Login & security"
      tabs={['Login', 'Shared access']}
      activeTab={securityTab}
      onTabChange={setSecurityTab}
    >
      {alert}
      {securityTab === 'Login' ? (
        <>
          <SettingsSection title="Login">
            <SettingsRow label="Passkeys" description="Use your fingerprint, face, or PIN." action="Add" onAction={() => setModal('passkeys')} />
            <SettingsRow label="Password" value="Not created" action="Create" onAction={() => setModal('password')} />
          </SettingsSection>
          <SettingsSection title="Social accounts">
            <SettingsRow label="Google" value="Not connected" action="Connect" onAction={() => setModal('google')} />
          </SettingsSection>
          <SettingsSection title="Device history">
            <div className="account-settings__device">
              <Monitor size={20} />
              <div>
                <strong>{navigator.platform || 'This device'} · {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}</strong>
                <span className="account-settings__device-badge">CURRENT SESSION</span>
                <p className="account-settings__device-meta">India · Active now</p>
              </div>
            </div>
          </SettingsSection>
          <SettingsSection title="Account">
            <SettingsRow label="Account deactivation" description="This action cannot be undone." action="Deactivate" onAction={() => setModal('deactivate')} />
          </SettingsSection>
        </>
      ) : (
        <SettingsSection title="Shared access" description="Invite a co-traveller or family member to help manage trips.">
          <SettingsRow label="Co-travellers" value="None added" action="Add" onAction={() => setModal('shared')} />
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const privacyPanel = (
    <SettingsPanel title="Privacy">
      {alert}
      <SettingsSection title="Messages">
        <SettingsToggleRow
          label="Show people when I've read their messages"
          checked={privacyPrefs.showReadReceipts}
          onChange={(v) => updatePrivacy('showReadReceipts', v)}
        />
        <SettingsLinkRow label="Blocked people" to="/messages" />
      </SettingsSection>
      {canAccessHostPortal && (
        <SettingsSection title="Listings">
          <SettingsToggleRow
            label="Include my listing(s) in search engines"
            description="Turning this on means search engines, like Google, will display your listing page(s) in search results."
            checked={privacyPrefs.listingsInSearch}
            onChange={(v) => updatePrivacy('listingsInSearch', v)}
          />
        </SettingsSection>
      )}
      <SettingsSection title="Reviews">
        <p className="account-settings__section-desc">
          Choose what&apos;s shared when you write a review. Updating this setting will change what&apos;s displayed for all past reviews.
        </p>
        <SettingsToggleRow label="Show my home city and country" description="E.g. city and country" checked={privacyPrefs.shareReviewCity} onChange={(v) => updatePrivacy('shareReviewCity', v)} />
        <SettingsToggleRow label="Show my trip type" description="E.g. stayed with kids or pets" checked={privacyPrefs.shareReviewTripType} onChange={(v) => updatePrivacy('shareReviewTripType', v)} />
        <SettingsToggleRow label="Show my length of stay" description="E.g. a few nights, about a week, etc." checked={privacyPrefs.shareReviewLength} onChange={(v) => updatePrivacy('shareReviewLength', v)} />
        <SettingsToggleRow label="Show my booked services" description="E.g. gourmet brunch or tasting menu" checked={privacyPrefs.shareReviewBookedServices} onChange={(v) => updatePrivacy('shareReviewBookedServices', v)} />
      </SettingsSection>
      <SettingsSection title="Data privacy">
        <SettingsLinkRow label="Request my personal data" onClick={() => { window.location.href = 'mailto:privacy@stayease.com?subject=Data%20access%20request'; }} />
        <SettingsToggleRow
          label="Help improve StayEase features"
          description="When this is on, anonymised usage data may be used to improve search, pricing, and support tools."
          checked={privacyPrefs.analyticsOptIn}
          onChange={(v) => {
            updatePrivacy('analyticsOptIn', v);
            if (v) acceptAll();
            else acceptEssential();
          }}
        />
      </SettingsSection>
      <SettingsInfoBox
        items={[
          {
            icon: Lock,
            title: 'Committed to privacy',
            text: 'StayEase is committed to keeping your data protected. Read details in our Privacy Policy.',
          },
        ]}
      />
      <p className="account-settings__legal-links">
        <Link to="/privacy-policy">Privacy Policy</Link>
        {' · '}
        <Link to="/terms">Terms of Service</Link>
      </p>
      {consent && (
        <p className="account-settings__legal-meta">
          Analytics cookies: {consent.analytics ? 'Enabled' : 'Disabled'}
        </p>
      )}
    </SettingsPanel>
  );

  const notificationsPanel = (
    <SettingsPanel
      title="Notifications"
      tabs={['Offers and updates', 'Account']}
      activeTab={notifTab}
      onTabChange={setNotifTab}
    >
      {alert}
      {notifTab === 'Offers and updates' ? (
        <>
          <SettingsSection title="Travel tips and offers" description="Inspire your next trip with personalised recommendations and special offers.">
            {['travelOffers', 'tripPlanning'].map((key) => (
              <SettingsRow
                key={key}
                label={NOTIFICATION_LABELS[key]}
                value={formatNotifStatus(notifDetail[key])}
                action="Edit"
                onAction={() => setModal(`notif-${key}`)}
              />
            ))}
          </SettingsSection>
          <SettingsSection title="StayEase updates" description="Stay up to date on the latest news from StayEase, and let us know how we can improve.">
            {['stayeaseUpdates', 'feedback', 'travelRegulations'].map((key) => (
              <SettingsRow
                key={key}
                label={NOTIFICATION_LABELS[key]}
                value={formatNotifStatus(notifDetail[key])}
                action="Edit"
                onAction={() => setModal(`notif-${key}`)}
              />
            ))}
          </SettingsSection>
          <SettingsToggleRow
            label="Unsubscribe from all marketing emails"
            checked={notifDetail.marketingOptOut}
            onChange={(v) => updateNotifDetail('marketingOptOut', v)}
          />
        </>
      ) : (
        <SettingsSection title="Account" description="Important alerts about your trips, payments, and security.">
          <SettingsRow label="Email updates" value={formatNotifStatus(emailPrefs)} action="Edit" onAction={() => setModal('email-notif')} />
          <SettingsRow label="WhatsApp trip updates" value={formatNotifStatus(whatsappPrefs)} action="Edit" onAction={() => setModal('whatsapp-notif')} />
          <SettingsRow label="Trip reminders" value={formatNotifStatus(notifDetail.tripReminders)} action="Edit" onAction={() => setModal('notif-tripReminders')} />
          <SettingsRow label="Account and security alerts" value={formatNotifStatus(notifDetail.accountAlerts)} action="Edit" onAction={() => setModal('notif-accountAlerts')} />
          <SettingsLinkRow label="View in-app notifications" to="/notifications" />
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const taxesPanel = (
    <SettingsPanel
      title="Taxes"
      tabs={['Taxpayers', 'Tax documents']}
      activeTab={taxTab}
      onTabChange={setTaxTab}
    >
      {alert}
      {taxTab === 'Taxpayers' ? (
        <>
          <SettingsSection
            title="Taxpayer information"
            description="Tax info is required for most countries/regions."
            footer={<SettingsCta onClick={openGstinModal}>Add tax info</SettingsCta>}
          >
            <SettingsRow
              label="GSTIN"
              value={guestTaxPrefs.gstin ? maskGstin(guestTaxPrefs.gstin) : undefined}
              action={guestTaxPrefs.gstin ? 'Edit' : 'Add'}
              onAction={openGstinModal}
            />
          </SettingsSection>
          <SettingsSection
            title="Value Added Tax (VAT)"
            description="If you are VAT-registered, please add your VAT ID."
            footer={<SettingsCta onClick={openGstinModal}>Add VAT ID number</SettingsCta>}
          >
            {taxSummary ? (
              <>
                <SettingsRow label="Total GST paid" value={formatCurrency(taxSummary.total_gst || 0)} />
                <SettingsRow label="Total spent on trips" value={formatCurrency(taxSummary.total_spent || 0)} />
              </>
            ) : (
              <SettingsRow label="Trip tax summary" value="No data yet" action="View trips" to="/bookings" />
            )}
          </SettingsSection>
          <SettingsSection title="Need help?">
            <p className="account-settings__section-desc">
              Get answers to questions about taxes in our <Link to="/help">Help Centre</Link>.
            </p>
          </SettingsSection>
        </>
      ) : (
        <SettingsSection title="Tax documents" description="Download GST invoices from your completed bookings.">
          <SettingsLinkRow label="View trips & invoices" to="/bookings" />
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const paymentsPanel = (
    <SettingsPanel
      title="Payments"
      tabs={['Payments', 'Payouts', 'Service fee', 'Donations']}
      activeTab={paymentTab}
      onTabChange={setPaymentTab}
    >
      {alert}
      {paymentTab === 'Payments' && (
        <>
          <SettingsSection title="Your payments" description="Keep track of all your payments and refunds.">
            <SettingsCta to="/bookings">Manage payments</SettingsCta>
          </SettingsSection>
          <SettingsSection title="Payment methods" description="Add a payment method using our secure payment system, then start planning your next trip.">
            <SettingsRow label="Cards & UPI" value="None added" action="Add" onAction={() => setModal('payment-method')} />
          </SettingsSection>
          <SettingsSection title="StayEase gift credit">
            <SettingsCta onClick={() => setModal('gift-card')}>Add gift card</SettingsCta>
          </SettingsSection>
          <SettingsSection title="Coupons">
            <SettingsRow label="Your coupons" value="0" />
            <div className="account-settings__promo">
              <Icon icon={Tag} size={ICON.lg} />
              <div>
                <strong>Get 10% off your next stay</strong>
                <p>Book within 7 days and save up to ₹2,000. Terms apply.</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal('coupon')}>Claim now</button>
              </div>
            </div>
            <SettingsCta onClick={() => setModal('coupon')}>Add coupon</SettingsCta>
          </SettingsSection>
          {recentBookings.length > 0 && (
            <SettingsSection title="Recent payments">
              {recentBookings.map((b) => (
                <SettingsRow
                  key={b._id || b.id}
                  label={b.room_title || 'Stay'}
                  value={`${formatCurrency(b.total_price)} · ${b.payment_status || b.status}`}
                  action="Receipt"
                  to={`/receipt/${b._id || b.id}`}
                />
              ))}
            </SettingsSection>
          )}
          <SettingsInfoBox
            items={[
              {
                icon: Heart,
                title: 'Make all payments through StayEase',
                text: "Always pay and communicate through StayEase to ensure you're protected under our Terms of Service.",
              },
            ]}
          />
        </>
      )}
      {paymentTab === 'Payouts' && (
        <SettingsSection title="Payouts" description="Payouts apply to hosts. Switch to host mode to manage earnings.">
          <SettingsCta to={canAccessHostPortal ? '/host/payouts' : '/host'} variant="outline">
            {canAccessHostPortal ? 'Manage payouts' : 'Switch to hosting'}
          </SettingsCta>
        </SettingsSection>
      )}
      {paymentTab === 'Service fee' && (
        <SettingsSection title="Service fee" description="StayEase service fees are shown at checkout before you confirm a booking.">
          <SettingsLinkRow label="Learn about service fees" to="/help/service-fees" />
        </SettingsSection>
      )}
      {paymentTab === 'Donations' && (
        <SettingsSection title="Donations" description="Support community stays and local hospitality initiatives through StayEase.">
          <SettingsCta onClick={() => setModal('donation')}>Make a donation</SettingsCta>
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const localePanel = (
    <SettingsPanel title="Languages & currency">
      {alert}
      <SettingsSection>
        <SettingsRow label="Preferred language" value={localePrefs.language} action="Edit" onAction={() => setModal('language')} />
        <SettingsRow label="Preferred currency" value={localePrefs.currency} action="Edit" onAction={() => setModal('currency')} />
        <SettingsRow label="Time zone" value={formatTimezoneLabel(localePrefs.timezone)} action="Edit" onAction={() => setModal('timezone')} />
      </SettingsSection>
    </SettingsPanel>
  );

  const bookingPermissionsPanel = (
    <SettingsPanel title="Booking permissions">
      {alert}
      <SettingsSection description="Requirements hosts may ask for before confirming a booking.">
        <SettingsRow
          label="Government ID"
          value={user?.email_verified ? 'Verified' : 'Required before first booking'}
          action={user?.email_verified ? 'View' : 'Verify'}
          onAction={() => setModal('identity')}
        />
        <SettingsRow
          label="Profile photo"
          value={user?.avatar_url ? 'Provided' : 'Not required'}
          action={user?.avatar_url ? 'Edit' : 'Add'}
          onAction={() => setModal('photo')}
        />
        <SettingsRow
          label="Phone number"
          value={user?.phone ? 'Provided' : 'Required for booking updates'}
          action={user?.phone ? 'Edit' : 'Add'}
          onAction={() => setModal('phone')}
        />
      </SettingsSection>
    </SettingsPanel>
  );

  const travelWorkPanel = (
    <SettingsPanel title="Travel for work" subtitle="Keep work trips organized with downloadable invoices and GST-ready receipts.">
      {alert}
      <SettingsSection>
        <SettingsLinkRow label="Download invoices from My trips" to="/bookings" />
        <SettingsRow
          label="Company GSTIN on invoices"
          value={guestTaxPrefs.gstin ? maskGstin(guestTaxPrefs.gstin) : undefined}
          action={guestTaxPrefs.gstin ? 'Edit' : 'Add'}
          onAction={openGstinModal}
        />
        <SettingsRow
          label="Expense reports"
          description="Export receipts with CGST/SGST breakdown for reimbursement."
          value="Available after checkout"
          action="View"
          to="/bookings"
        />
      </SettingsSection>
    </SettingsPanel>
  );

  const proToolsPanel = (
    <SettingsPanel title="Professional hosting tools">
      {alert}
      <SettingsSection>
        <SettingsToggleRow
          label="Enable professional hosting tools"
          description="Access GST reports, bulk calendar tools, and multi-listing insights."
          checked={proToolsPrefs.enabled}
          onChange={(v) => updateProTools({ enabled: v })}
        />
      </SettingsSection>
      <SettingsSection
        title="Create a custom profile URL"
        description="Give guests a direct link to all your StayEase listings."
        footer={(
          <SettingsUrlField
            prefix="stayease.in/host/"
            value={proToolsPrefs.profileSlug}
            onChange={(e) => setProToolsPrefs((prev) => ({ ...prev, profileSlug: e.target.value }))}
            onSave={() => updateProTools({ profileSlug: proToolsPrefs.profileSlug })}
          />
        )}
      />
      {!canAccessHostPortal && (
        <SettingsFeatureCard
          icon={<Icon icon={Briefcase} size={ICON.lg} />}
          title="Start hosting on StayEase"
          description="Upgrade your account to list rooms, manage bookings, and use professional hosting tools."
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={async () => { await becomeHost(); navigate('/host'); }}>
              Become a host
            </button>
          )}
        />
      )}
    </SettingsPanel>
  );

  const panels = {
    trips: tripsPanel,
    wishlist: wishlistPanel,
    dashboard: dashboardPanel,
    personal: personalPanel,
    security: securityPanel,
    privacy: privacyPanel,
    notifications: notificationsPanel,
    taxes: taxesPanel,
    payments: paymentsPanel,
    locale: localePanel,
    'booking-permissions': bookingPermissionsPanel,
    'travel-work': travelWorkPanel,
    'pro-tools': proToolsPanel,
  };

  return (
    <>
      <SettingsLayout
        title="Account settings"
        sections={GUEST_SETTINGS_SECTIONS}
        activeId={active}
        onSelect={handleSelect}
        onDone={() => navigate(-1)}
      >
        {panels[active]}
      </SettingsLayout>

      <Modal open={modal === 'name'} onClose={() => setModal(null)} title="Legal name">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'preferred-name'} onClose={() => setModal(null)} title="Preferred first name">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); savePreferredName(); }}>
          <div className="form-group">
            <label className="label">Preferred first name</label>
            <input className="input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="How hosts should address you" />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
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

      <Modal open={modal === 'phone'} onClose={() => setModal(null)} title="Phone number">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'residential-address'} onClose={() => setModal(null)} title="Residential address">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveAddressPref('residentialAddress', e.target.residential.value); }}>
          <div className="form-group">
            <label className="label">Address</label>
            <textarea className="textarea" name="residential" defaultValue={addressPrefs.residentialAddress} rows={3} required />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'postal-address'} onClose={() => setModal(null)} title="Postal address">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveAddressPref('postalAddress', e.target.postal.value); }}>
          <div className="form-group">
            <label className="label">Postal address</label>
            <textarea className="textarea" name="postal" defaultValue={addressPrefs.postalAddress} rows={3} required />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'emergency'} onClose={() => setModal(null)} title="Emergency contact">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveAddressPref('emergencyContact', e.target.emergency.value); }}>
          <div className="form-group">
            <label className="label">Name and phone</label>
            <input className="input" name="emergency" defaultValue={addressPrefs.emergencyContact} placeholder="Name · +91…" required />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'identity'} onClose={() => setModal(null)} title="Identity verification">
        <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
        <p style={{ marginTop: '1rem' }}>
          <Link to="/verify-identity" className="btn btn-outline btn-sm">Upload ID proof</Link>
        </p>
      </Modal>

      <Modal open={modal === 'email-notif' || modal === 'whatsapp-notif'} onClose={() => setModal(null)} title="Notification channels">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <SettingsToggleRow label="Email updates" checked={emailPrefs} onChange={setEmailPrefs} />
          <SettingsToggleRow label="WhatsApp trip updates" checked={whatsappPrefs} onChange={setWhatsappPrefs} />
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal?.startsWith('notif-')} onClose={() => setModal(null)} title="Notification preference">
        {modal?.startsWith('notif-') && (
          <SettingsToggleRow
            label={NOTIFICATION_LABELS[modal.replace('notif-', '')] || 'Notifications'}
            checked={notifDetail[modal.replace('notif-', '')]}
            onChange={(v) => updateNotifDetail(modal.replace('notif-', ''), v)}
          />
        )}
      </Modal>

      <Modal open={modal === 'language'} onClose={() => setModal(null)} title="Preferred language">
        <select className="select" value={localePrefs.language} onChange={(e) => updateLocale('language', e.target.value)}>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Kannada">Kannada</option>
        </select>
      </Modal>

      <Modal open={modal === 'currency'} onClose={() => setModal(null)} title="Preferred currency">
        <select className="select" value={localePrefs.currency} onChange={(e) => updateLocale('currency', e.target.value)}>
          <option value="Indian rupee">Indian rupee (INR)</option>
          <option value="US dollar">US dollar (USD)</option>
        </select>
      </Modal>

      <Modal open={modal === 'timezone'} onClose={() => setModal(null)} title="Time zone">
        <select className="select" value={localePrefs.timezone} onChange={(e) => updateLocale('timezone', e.target.value)}>
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
          <option value="UTC">UTC</option>
        </select>
      </Modal>

      <Modal open={modal === 'email'} onClose={() => setModal(null)} title="Email address">
        <p style={{ color: 'var(--text-secondary)' }}>Contact support to change your login email: <a href="mailto:support@stayease.com">support@stayease.com</a></p>
      </Modal>

      <Modal open={modal === 'photo'} onClose={() => setModal(null)} title="Profile photo">
        <div className="account-settings__photo-modal">
          <img src={avatarUrl} alt="" className="account-settings__avatar-preview account-settings__avatar-preview--large" />
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => saveAvatar(e.target.files?.[0])}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            A profile photo helps hosts recognize you at check-in.
          </p>
        </div>
      </Modal>

      <Modal open={modal === 'gstin'} onClose={() => setModal(null)} title="Tax information">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveGuestTaxPrefs(); }}>
          <div className="form-group">
            <label className="label">GSTIN</label>
            <input className="input" value={gstinInput} onChange={(e) => setGstinInput(e.target.value)} placeholder="22AAAAA0000A1Z5" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Used on invoices for work travel and expense reimbursement.
          </p>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={!!modal && ['passkeys', 'password', 'google', 'deactivate', 'shared', 'payment-method', 'gift-card', 'coupon', 'donation'].includes(modal)} onClose={() => setModal(null)} title="Coming soon">
        <p style={{ color: 'var(--text-secondary)' }}>This feature is not available in the demo build yet. Email <a href="mailto:support@stayease.com">support@stayease.com</a> for help.</p>
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
