import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Eye, Lock, Monitor, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { useTheme } from '../../context/ThemeContext';
import { analyticsApi, authApi, formatCurrency, referralsApi } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import IdentityVerification from '../../components/IdentityVerification';
import ReferralCard from '../../components/ReferralCard';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostPage } from '../../components/host/HostPageLayout';
import {
  SettingsCta,
  SettingsFeatureCard,
  SettingsInfoBox,
  SettingsLayout,
  SettingsLinkRow,
  SettingsPanel,
  SettingsRequirements,
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
  SettingsUrlField,
} from '../../components/settings/SettingsLayout';
import {
  ADDRESS_PREFS_KEY,
  DEFAULT_ADDRESS_PREFS,
  DEFAULT_HOST_BOOKING_NOTIFS,
  DEFAULT_HOST_HOSTING_PREFS,
  DEFAULT_HOST_PAYOUT_PREFS,
  DEFAULT_HOST_TAX_PREFS,
  DEFAULT_LOCALE_PREFS,
  DEFAULT_NOTIFICATION_DETAIL,
  DEFAULT_PRIVACY_PREFS,
  HOST_BOOKING_NOTIF_KEY,
  HOST_HOSTING_PREFS_KEY,
  HOST_PAYOUT_PREFS_KEY,
  HOST_SETTINGS_SECTIONS,
  HOST_TAX_PREFS_KEY,
  LOCALE_PREFS_KEY,
  NOTIFICATION_DETAIL_KEY,
  PREFERRED_NAME_KEY,
  PRIVACY_PREFS_KEY,
  PRO_TOOLS_PREFS_KEY,
  DEFAULT_PRO_TOOLS_PREFS,
  firstName,
  formatTimezoneLabel,
  hostRequirementItems,
  identityActionLabel,
  identityStatusLabel,
  loadJsonPref,
  maskEmail,
  maskGstin,
  maskPan,
  payoutMethodLabel,
  saveJsonPref,
} from '../../constants/accountSettings';
import { getAvatarUrl } from '../../utils/roomImages';

const REQUIREMENT_ACTIONS = {
  phone: 'phone',
  identity: 'identity',
  avatar: 'photo',
  gstin: 'gstin',
  payout: 'payout',
  address: 'business-address',
};

const HOST_NOTIFICATION_LABELS = {
  hostingInsights: 'Insights and tips',
  hostingUpdates: 'Pricing trends and suggestions',
  stayeaseUpdates: 'News and updates',
};

function normalizePhone(value) {
  return (value || '').replace(/\D/g, '').slice(-10);
}

export default function HostSettings() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { consent, acceptAll, acceptEssential } = useCookieConsent();

  const [active, setActive] = useState('personal');
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

  const [proToolsPrefs, setProToolsPrefs] = useState(() => loadJsonPref(PRO_TOOLS_PREFS_KEY, DEFAULT_PRO_TOOLS_PREFS));
  const [hostingPrefs, setHostingPrefs] = useState(() => loadJsonPref(HOST_HOSTING_PREFS_KEY, DEFAULT_HOST_HOSTING_PREFS));
  const instantBook = hostingPrefs.instantBook ?? true;
  const guestPhotoRequired = hostingPrefs.guestPhotoRequired ?? false;

  const [addressPrefs, setAddressPrefs] = useState(() => loadJsonPref(ADDRESS_PREFS_KEY, DEFAULT_ADDRESS_PREFS));
  const [taxPrefs, setTaxPrefs] = useState(() => loadJsonPref(HOST_TAX_PREFS_KEY, DEFAULT_HOST_TAX_PREFS));
  const [payoutPrefs, setPayoutPrefs] = useState(() => loadJsonPref(HOST_PAYOUT_PREFS_KEY, DEFAULT_HOST_PAYOUT_PREFS));
  const [bookingNotifs, setBookingNotifs] = useState(() => loadJsonPref(HOST_BOOKING_NOTIF_KEY, DEFAULT_HOST_BOOKING_NOTIFS));
  const [privacyPrefs, setPrivacyPrefs] = useState(() => loadJsonPref(PRIVACY_PREFS_KEY, DEFAULT_PRIVACY_PREFS));
  const [localePrefs, setLocalePrefs] = useState(() => loadJsonPref(LOCALE_PREFS_KEY, DEFAULT_LOCALE_PREFS));
  const [notifDetail, setNotifDetail] = useState(() => loadJsonPref(NOTIFICATION_DETAIL_KEY, DEFAULT_NOTIFICATION_DETAIL));
  const [taxSummary, setTaxSummary] = useState(null);
  const [referralStats, setReferralStats] = useState({ total_referred: 0 });

  const [gstinInput, setGstinInput] = useState('');
  const [panInput, setPanInput] = useState('');
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [payoutHolder, setPayoutHolder] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);

  const profileSlug = proToolsPrefs.profileSlug || '';
  const avatarUrl = user?.avatar_url || getAvatarUrl(user?.name, user?.id);
  const requirements = useMemo(
    () => hostRequirementItems(user, taxPrefs, payoutPrefs, addressPrefs),
    [user, taxPrefs, payoutPrefs, addressPrefs],
  );

  useEffect(() => {
    const hash = (location.hash || window.location.hash).replace('#', '');
    if (hash && HOST_SETTINGS_SECTIONS.some((s) => s.id === hash)) {
      setActive(hash);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAbout(user.about_me || '');
      if (!localStorage.getItem(PREFERRED_NAME_KEY)) {
        setPreferredName(firstName(user.name));
      }
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
    if (active === 'taxes') {
      analyticsApi.hostDashboard()
        .then(({ data }) => setTaxSummary(data))
        .catch(() => setTaxSummary(null));
    }
  }, [active]);

  useEffect(() => {
    referralsApi.stats()
      .then(({ data }) => setReferralStats(data))
      .catch(() => setReferralStats({ total_referred: 0 }));
  }, []);

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  const saveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', normalizePhone(phone));
      fd.append('about_me', about);
      fd.append('notification_prefs', JSON.stringify({ email: emailPrefs, whatsapp: whatsappPrefs }));
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
    const next = { ...addressPrefs, [key]: value.trim() };
    setAddressPrefs(next);
    saveJsonPref(ADDRESS_PREFS_KEY, next);
    setSuccess('Address saved');
    setModal(null);
  };

  const saveTaxPrefs = () => {
    const next = {
      gstin: gstinInput.trim().toUpperCase(),
      pan: panInput.trim().toUpperCase(),
      businessName: businessNameInput.trim(),
    };
    setTaxPrefs(next);
    saveJsonPref(HOST_TAX_PREFS_KEY, next);
    setSuccess('Tax information saved');
    setModal(null);
  };

  const savePayoutPrefs = () => {
    const next = {
      method: payoutMethod,
      upiId: payoutMethod === 'upi' ? payoutUpi.trim() : '',
      accountHolder: payoutMethod === 'bank' ? payoutHolder.trim() : '',
      accountNumber: payoutMethod === 'bank' ? payoutAccount.trim() : '',
      ifsc: payoutMethod === 'bank' ? payoutIfsc.trim().toUpperCase() : '',
    };
    setPayoutPrefs(next);
    saveJsonPref(HOST_PAYOUT_PREFS_KEY, next);
    setSuccess('Payout method saved');
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

  const updateLocale = (key, value) => {
    const next = { ...localePrefs, [key]: value };
    setLocalePrefs(next);
    saveJsonPref(LOCALE_PREFS_KEY, next);
    setSuccess('Preference saved');
    setModal(null);
  };

  const updatePrivacy = (key, value) => {
    const next = { ...privacyPrefs, [key]: value };
    setPrivacyPrefs(next);
    saveJsonPref(PRIVACY_PREFS_KEY, next);
    setSuccess('Privacy preference saved');
  };

  const updateBookingNotif = (key, value) => {
    const next = { ...bookingNotifs, [key]: value };
    setBookingNotifs(next);
    saveJsonPref(HOST_BOOKING_NOTIF_KEY, next);
    setSuccess('Notification preference saved');
  };

  const updateNotifDetail = (key, value) => {
    const next = { ...notifDetail, [key]: value };
    setNotifDetail(next);
    saveJsonPref(NOTIFICATION_DETAIL_KEY, next);
    setSuccess('Notification preference saved');
    setError('');
    setModal(null);
  };

  const updateHostingPref = (key, value) => {
    const next = { ...hostingPrefs, [key]: value };
    setHostingPrefs(next);
    saveJsonPref(HOST_HOSTING_PREFS_KEY, next);
    setSuccess('Hosting preference saved');
    setError('');
  };

  const openRequirement = (id) => {
    const target = REQUIREMENT_ACTIONS[id];
    if (target === 'gstin') {
      setGstinInput(taxPrefs.gstin || '');
      setPanInput(taxPrefs.pan || '');
      setBusinessNameInput(taxPrefs.businessName || '');
      setActive('taxes');
      window.history.replaceState(null, '', '#taxes');
    } else if (target === 'payout') {
      setPayoutMethod(payoutPrefs.method || 'upi');
      setPayoutUpi(payoutPrefs.upiId || '');
      setPayoutHolder(payoutPrefs.accountHolder || '');
      setPayoutAccount(payoutPrefs.accountNumber || '');
      setPayoutIfsc(payoutPrefs.ifsc || '');
      setActive('payments');
      window.history.replaceState(null, '', '#payments');
    } else if (target) {
      setModal(target);
    }
  };

  const openTaxModal = () => {
    setGstinInput(taxPrefs.gstin || '');
    setPanInput(taxPrefs.pan || '');
    setBusinessNameInput(taxPrefs.businessName || '');
    setModal('gstin');
  };

  const openPayoutModal = () => {
    setPayoutMethod(payoutPrefs.method || 'upi');
    setPayoutUpi(payoutPrefs.upiId || '');
    setPayoutHolder(payoutPrefs.accountHolder || '');
    setPayoutAccount(payoutPrefs.accountNumber || '');
    setPayoutIfsc(payoutPrefs.ifsc || '');
    setModal('payout');
  };

  const alert = success ? (
    <p className="account-settings__alert account-settings__alert--success">{success}</p>
  ) : error ? (
    <ErrorMessage message={error} />
  ) : null;

  const personalPanel = (
    <SettingsPanel title="Personal information">
      {alert}
      <SettingsRequirements
        title="Required for hosting"
        description="Complete these items to receive payouts and appear as a verified host."
        items={requirements.map((item) => ({
          ...item,
          action: 'Add',
          onAction: () => openRequirement(item.id),
        }))}
      />
      <SettingsSection>
        <SettingsRow
          label="Profile photo"
          description="Guests see this on your listings and host profile."
          value={user?.avatar_url ? 'Provided' : 'Not provided'}
          action={user?.avatar_url ? 'Edit' : 'Add'}
          onAction={() => setModal('photo')}
        >
          <img src={avatarUrl} alt="" className="account-settings__avatar-preview" />
        </SettingsRow>
        <SettingsRow label="Legal name" value={user?.name || 'Not provided'} action="Edit" onAction={() => setModal('name')} />
        <SettingsRow
          label="Preferred first name"
          value={preferredName || firstName(user?.name) || 'Not provided'}
          action={preferredName ? 'Edit' : 'Add'}
          onAction={() => setModal('preferred-name')}
        />
        <SettingsRow label="Email address" value={maskEmail(user?.email)} action="Edit" onAction={() => setModal('email')} />
        <SettingsRow
          label="Phone numbers"
          description="Used for guest contact and payout verification."
          value={user?.phone || undefined}
          action={user?.phone ? 'Edit' : 'Add'}
          onAction={() => setModal('phone')}
        />
        <SettingsRow
          label="Identity verification"
          value={identityStatusLabel(user)}
          action={identityActionLabel(user)}
          onAction={() => setModal('identity')}
        />
        <SettingsRow
          label="Business address"
          description="Required for GST invoicing and payout compliance in India."
          value={addressPrefs.residentialAddress ? 'Provided' : 'Not provided'}
          action={addressPrefs.residentialAddress ? 'Edit' : 'Add'}
          onAction={() => setModal('business-address')}
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
          label="About you"
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
          { icon: Lock, title: "Why isn't my info shown here?", text: 'Some details are masked for security. Host payout info is never shared with guests.' },
          { icon: Eye, title: 'What guests see', text: 'Guests see your first name, profile photo, and listing details — not your email or phone until a booking is confirmed.' },
        ]}
      />
    </SettingsPanel>
  );

  const securityPanel = (
    <SettingsPanel title="Login & security" tabs={['Login', 'Shared access']} activeTab={securityTab} onTabChange={setSecurityTab}>
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
        <SettingsSection title="Shared access" description="Invite a co-host to help manage listings and bookings. Coming soon.">
          <SettingsRow label="Co-hosts" value="None added" action="Add" onAction={() => setModal('cohost')} />
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
          checked={privacyPrefs.showReadReceipts ?? true}
          onChange={(v) => updatePrivacy('showReadReceipts', v)}
        />
        <SettingsLinkRow label="Blocked people" to="/host/messages" />
      </SettingsSection>
      <SettingsSection title="Listings">
        <SettingsToggleRow
          label="Include my listing(s) in search engines"
          description="When on, search engines like Google may display your listing pages."
          checked={privacyPrefs.listingsInSearch ?? false}
          onChange={(v) => updatePrivacy('listingsInSearch', v)}
        />
      </SettingsSection>
      <SettingsSection title="Data privacy">
        <SettingsLinkRow label="Request my personal data" onClick={() => { window.location.href = 'mailto:privacy@stayease.com'; }} />
        <SettingsToggleRow
          label="Help improve StayEase features"
          description="When this is on, anonymised usage data may be used to improve search, pricing, and support tools."
          checked={privacyPrefs.analyticsOptIn ?? true}
          onChange={(v) => {
            updatePrivacy('analyticsOptIn', v);
            if (v) acceptAll();
            else acceptEssential();
          }}
        />
        <SettingsLinkRow label="Delete my account" onClick={() => setModal('deactivate')} />
      </SettingsSection>
      <p className="account-settings__legal-links">
        <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
      </p>
      {consent && (
        <p className="account-settings__legal-meta">
          Analytics cookies: {consent.analytics ? 'Enabled' : 'Disabled'}
        </p>
      )}
    </SettingsPanel>
  );

  const notificationsPanel = (
    <SettingsPanel title="Notifications" tabs={['Offers and updates', 'Account']} activeTab={notifTab} onTabChange={setNotifTab}>
      {alert}
      {notifTab === 'Offers and updates' ? (
        <SettingsSection title="Hosting insights and rewards" description="Learn about best hosting practices and exclusive perks.">
          <SettingsRow label="Insights and tips" value={notifDetail.hostingInsights ? 'On' : 'Off'} action="Edit" onAction={() => setModal('notif-hostingInsights')} />
          <SettingsRow label="Pricing trends and suggestions" value={notifDetail.hostingUpdates ? 'On' : 'Off'} action="Edit" onAction={() => setModal('notif-hostingUpdates')} />
          <SettingsRow label="News and updates" value={notifDetail.stayeaseUpdates ? 'On' : 'Off'} action="Edit" onAction={() => setModal('notif-stayeaseUpdates')} />
        </SettingsSection>
      ) : (
        <>
          <SettingsSection title="Hosting activity" description="Alerts about bookings, guests, and payouts.">
            <SettingsToggleRow label="New booking requests" checked={bookingNotifs.newBooking ?? true} onChange={(v) => updateBookingNotif('newBooking', v)} />
            <SettingsToggleRow label="Cancellations" checked={bookingNotifs.cancellation ?? true} onChange={(v) => updateBookingNotif('cancellation', v)} />
            <SettingsToggleRow label="Guest messages" checked={bookingNotifs.guestMessage ?? true} onChange={(v) => updateBookingNotif('guestMessage', v)} />
            <SettingsToggleRow label="Payout transfers" checked={bookingNotifs.payout ?? true} onChange={(v) => updateBookingNotif('payout', v)} />
            <SettingsToggleRow label="New reviews" checked={bookingNotifs.review ?? true} onChange={(v) => updateBookingNotif('review', v)} />
          </SettingsSection>
          <SettingsSection title="Channels">
            <SettingsRow label="Email updates" value={emailPrefs ? 'On' : 'Off'} action="Edit" onAction={() => setModal('channels')} />
            <SettingsRow label="WhatsApp alerts" value={whatsappPrefs ? 'On' : 'Off'} action="Edit" onAction={() => setModal('channels')} />
            <SettingsLinkRow label="View in-app notifications" to="/notifications" />
          </SettingsSection>
        </>
      )}
    </SettingsPanel>
  );

  const taxesPanel = (
    <SettingsPanel title="Taxes" tabs={['Taxpayers', 'Tax documents']} activeTab={taxTab} onTabChange={setTaxTab}>
      {alert}
      {taxTab === 'Taxpayers' ? (
        <>
          <SettingsSection
            title="Taxpayer information"
            description="Tax info is required for GST invoicing on paid bookings in India."
          >
            <SettingsRow
              label="GSTIN"
              value={taxPrefs.gstin ? maskGstin(taxPrefs.gstin) : undefined}
              action={taxPrefs.gstin ? 'Edit' : 'Add'}
              onAction={openTaxModal}
            />
            <SettingsRow
              label="PAN"
              value={taxPrefs.pan ? maskPan(taxPrefs.pan) : undefined}
              action={taxPrefs.pan ? 'Edit' : 'Add'}
              onAction={openTaxModal}
            />
            <SettingsRow
              label="Registered business name"
              value={taxPrefs.businessName || undefined}
              action={taxPrefs.businessName ? 'Edit' : 'Add'}
              onAction={openTaxModal}
            />
          </SettingsSection>
          <SettingsSection
            title="Value Added Tax (VAT)"
            description="If you are GST-registered, add your GST ID for automated CGST/SGST invoices."
            footer={<SettingsCta onClick={openTaxModal}>{taxPrefs.gstin ? 'Edit tax info' : 'Add tax info'}</SettingsCta>}
          />
          {taxSummary && (
            <SettingsSection title="Earnings summary">
              <SettingsRow label="Month revenue" value={formatCurrency(taxSummary.month_revenue || 0)} />
              <SettingsRow label="Month platform fees" value={formatCurrency(taxSummary.month_platform_fees || 0)} />
              <SettingsRow label="YTD GST collected" value={formatCurrency(taxSummary.ytd_gst_collected || 0)} />
            </SettingsSection>
          )}
        </>
      ) : (
        <SettingsSection title="Tax documents">
          <SettingsLinkRow label="GST reports & invoices" to="/host/bookings" />
          <SettingsLinkRow label="Download invoices from Bookings" to="/host/bookings" />
          <SettingsLinkRow label="View earnings & GST breakdown" to="/host?tab=earnings" />
        </SettingsSection>
      )}
    </SettingsPanel>
  );

  const paymentsPanel = (
    <SettingsPanel title="Payments" tabs={['Payments', 'Payouts', 'Service fee']} activeTab={paymentTab} onTabChange={setPaymentTab}>
      {alert}
      {paymentTab === 'Payments' && (
        <SettingsSection
          title="Your payments"
          description="Manage payment methods for StayEase service fees."
          footer={<SettingsCta onClick={() => setModal('payment-method')}>Manage payments</SettingsCta>}
        />
      )}
      {paymentTab === 'Payouts' && (
        <SettingsSection
          title="Payouts"
          description="Add your UPI or bank details to receive earnings after guest check-in."
        >
          <SettingsRow
            label="Payout method"
            description="Transfers are sent within 24 hours of guest check-in."
            value={payoutMethodLabel(payoutPrefs) || undefined}
            action={payoutMethodLabel(payoutPrefs) ? 'Edit' : 'Set up'}
            onAction={openPayoutModal}
          />
          <SettingsRow label="Payout schedule" value="After guest check-in" />
          <SettingsRow label="Currency" value="Indian rupee (INR)" />
          <SettingsLinkRow label="View payout history" to="/host/payouts" />
          <SettingsLinkRow label="View earnings" to="/host?tab=earnings" />
        </SettingsSection>
      )}
      {paymentTab === 'Service fee' && (
        <SettingsSection title="Service fee">
          <SettingsRow label="Host service fee" value="3% of booking subtotal" />
          <SettingsLinkRow label="Learn about host service fees" to="/help/service-fees" />
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
        <SettingsRow label="Display theme" value={theme === 'dark' ? 'Dark' : 'Light'} action="Edit" onAction={() => setModal('theme')} />
      </SettingsSection>
    </SettingsPanel>
  );

  const hostingPrefsPanel = (
    <SettingsPanel title="Hosting preferences" subtitle="Defaults applied across your StayEase listings.">
      {alert}
      <SettingsSection title="Booking settings">
        <SettingsToggleRow label="Instant Book" description="Guests can book without waiting for approval." checked={instantBook} onChange={(v) => updateHostingPref('instantBook', v)} />
        <SettingsToggleRow label="Require guest profile photo" description="Guests must add a photo before booking." checked={guestPhotoRequired} onChange={(v) => updateHostingPref('guestPhotoRequired', v)} />
        <SettingsLinkRow label="Edit per-listing booking rules" to="/host/rooms" />
      </SettingsSection>
      <SettingsSection title="Guest requirements">
        <SettingsRow label="Government ID" value="Required for all guests" />
        <SettingsRow label="GST invoicing" value="Automatic on every paid booking" action="Learn more" to="/host/bookings" />
      </SettingsSection>
      <SettingsSection title="Local laws">
        <SettingsLinkRow label="Review Indian hospitality laws" to="/help/local-laws" />
        <SettingsLinkRow label="Non-discrimination policy" to="/help/nondiscrimination" />
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
          onChange={(v) => {
            const next = { ...proToolsPrefs, enabled: v };
            setProToolsPrefs(next);
            saveJsonPref(PRO_TOOLS_PREFS_KEY, next);
            setSuccess('Preference saved');
          }}
        />
      </SettingsSection>
      <SettingsSection
        title="Custom profile URL"
        description="Give guests a direct link to all your StayEase listings."
        footer={(
          <SettingsUrlField
            prefix="stayease.in/host/"
            value={profileSlug}
            onChange={(e) => setProToolsPrefs((prev) => ({ ...prev, profileSlug: e.target.value }))}
            onSave={() => {
              saveJsonPref(PRO_TOOLS_PREFS_KEY, { ...proToolsPrefs, profileSlug });
              setSuccess('Profile URL saved');
            }}
          />
        )}
      />
      <SettingsFeatureCard
        icon={<Icon icon={Receipt} size={ICON.lg} />}
        title="GST invoicing"
        description="StayEase auto-generates CGST/SGST invoices on every paid booking — built for Indian hotel billing."
        action={<Link to="/host?tab=earnings" className="btn btn-outline btn-sm">View earnings</Link>}
      />
      <SettingsInfoBox
        items={[
          { icon: Briefcase, title: 'Built for Indian hosts', text: 'GST slabs, UPI payouts, and CGST/SGST invoices are included out of the box on StayEase.' },
        ]}
      />
    </SettingsPanel>
  );

  const panels = {
    personal: personalPanel,
    security: securityPanel,
    privacy: privacyPanel,
    notifications: notificationsPanel,
    taxes: taxesPanel,
    payments: paymentsPanel,
    locale: localePanel,
    'hosting-prefs': hostingPrefsPanel,
    'pro-tools': proToolsPanel,
  };

  const handleSelect = (id) => {
    setActive(id);
    clearMessages();
    window.history.replaceState(null, '', `#${id}`);
  };

  const comingSoonModals = [
    'password', 'deactivate', 'cohost', 'payment-method',
    'passkeys', 'google',
  ];

  return (
    <HostPage>
      <SettingsLayout
        sections={HOST_SETTINGS_SECTIONS}
        activeId={active}
        onSelect={handleSelect}
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
            <input className="input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="How guests should address you" />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'phone'} onClose={() => setModal(null)} title="Phone number">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'about'} onClose={() => setModal(null)} title="About you">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Bio</label>
            <textarea className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="Tell guests about your hosting style" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
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
            Use a clear photo of yourself. Guests see this on your listings.
          </p>
        </div>
      </Modal>

      <Modal open={modal === 'business-address'} onClose={() => setModal(null)} title="Business address">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveAddressPref('residentialAddress', e.target.address.value); }}>
          <div className="form-group">
            <label className="label">Business / property address</label>
            <textarea className="textarea" name="address" defaultValue={addressPrefs.residentialAddress} rows={3} required />
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

      <Modal open={modal === 'gstin'} onClose={() => setModal(null)} title="Tax information">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveTaxPrefs(); }}>
          <div className="form-group">
            <label className="label">GSTIN</label>
            <input className="input" value={gstinInput} onChange={(e) => setGstinInput(e.target.value)} placeholder="22AAAAA0000A1Z5" />
          </div>
          <div className="form-group">
            <label className="label">PAN</label>
            <input className="input" value={panInput} onChange={(e) => setPanInput(e.target.value)} placeholder="AAAAA9999A" />
          </div>
          <div className="form-group">
            <label className="label">Registered business name</label>
            <input className="input" value={businessNameInput} onChange={(e) => setBusinessNameInput(e.target.value)} placeholder="As on GST certificate" />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'payout'} onClose={() => setModal(null)} title="Payout method">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); savePayoutPrefs(); }}>
          <div className="form-group">
            <label className="label">Method</label>
            <select className="select" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
              <option value="upi">UPI</option>
              <option value="bank">Bank transfer</option>
            </select>
          </div>
          {payoutMethod === 'upi' ? (
            <div className="form-group">
              <label className="label">UPI ID</label>
              <input className="input" value={payoutUpi} onChange={(e) => setPayoutUpi(e.target.value)} placeholder="name@upi" required />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="label">Account holder name</label>
                <input className="input" value={payoutHolder} onChange={(e) => setPayoutHolder(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Account number</label>
                <input className="input" value={payoutAccount} onChange={(e) => setPayoutAccount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">IFSC code</label>
                <input className="input" value={payoutIfsc} onChange={(e) => setPayoutIfsc(e.target.value)} placeholder="SBIN0001234" required />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </Modal>

      <Modal open={modal === 'identity'} onClose={() => setModal(null)} title="Identity verification">
        <IdentityVerification verified={user?.identity_proof?.verified} onSuccess={refreshUser} />
        <p style={{ marginTop: '1rem' }}>
          <Link to="/verify-identity" className="btn btn-outline btn-sm">Upload ID proof</Link>
        </p>
      </Modal>

      <Modal open={modal === 'channels'} onClose={() => setModal(null)} title="Notification channels">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <SettingsToggleRow label="Email updates" checked={emailPrefs} onChange={setEmailPrefs} />
          <SettingsToggleRow label="WhatsApp alerts" checked={whatsappPrefs} onChange={setWhatsappPrefs} />
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'language'} onClose={() => setModal(null)} title="Preferred language">
        <select className="select" value={localePrefs.language} onChange={(e) => updateLocale('language', e.target.value)}>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
        </select>
      </Modal>

      <Modal open={modal === 'currency'} onClose={() => setModal(null)} title="Preferred currency">
        <select className="select" value={localePrefs.currency} onChange={(e) => updateLocale('currency', e.target.value)}>
          <option value="Indian rupee">Indian rupee (INR)</option>
        </select>
      </Modal>

      <Modal open={modal === 'timezone'} onClose={() => setModal(null)} title="Time zone">
        <select className="select" value={localePrefs.timezone} onChange={(e) => updateLocale('timezone', e.target.value)}>
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
        </select>
      </Modal>

      <Modal open={modal === 'theme'} onClose={() => setModal(null)} title="Display theme">
        <div className="account-settings__inline-form">
          <button type="button" className="btn btn-outline" onClick={() => { setTheme('light'); setSuccess('Theme updated'); setModal(null); }}>Light</button>
          <button type="button" className="btn btn-outline" onClick={() => { setTheme('dark'); setSuccess('Theme updated'); setModal(null); }}>Dark</button>
        </div>
      </Modal>

      <Modal open={modal === 'email'} onClose={() => setModal(null)} title="Email address">
        <p style={{ color: 'var(--text-secondary)' }}>Contact support to change your login email: <a href="mailto:support@stayease.com">support@stayease.com</a></p>
      </Modal>

      <Modal open={modal?.startsWith('notif-')} onClose={() => setModal(null)} title="Notification preference">
        {modal?.startsWith('notif-') && (
          <SettingsToggleRow
            label={HOST_NOTIFICATION_LABELS[modal.replace('notif-', '')] || 'Notifications'}
            checked={notifDetail[modal.replace('notif-', '')]}
            onChange={(v) => updateNotifDetail(modal.replace('notif-', ''), v)}
          />
        )}
      </Modal>

      <Modal open={!!modal && comingSoonModals.includes(modal)} onClose={() => setModal(null)} title="Coming soon">
        <p style={{ color: 'var(--text-secondary)' }}>This feature is not available in the demo build yet.</p>
      </Modal>
    </HostPage>
  );
}
