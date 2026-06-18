import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Eye, Lock, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { analyticsApi, authApi, formatCurrency } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import IdentityVerification from '../../components/IdentityVerification';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostPage } from '../../components/host/HostPageLayout';
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
  DEFAULT_LOCALE_PREFS,
  DEFAULT_NOTIFICATION_DETAIL,
  DEFAULT_PRIVACY_PREFS,
  HOST_SETTINGS_SECTIONS,
  LOCALE_PREFS_KEY,
  NOTIFICATION_DETAIL_KEY,
  PRIVACY_PREFS_KEY,
  loadJsonPref,
  maskEmail,
  saveJsonPref,
} from '../../constants/accountSettings';

export default function HostSettings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [active, setActive] = useState('personal');
  const [securityTab, setSecurityTab] = useState('Login');
  const [notifTab, setNotifTab] = useState('Offers and updates');
  const [taxTab, setTaxTab] = useState('Taxpayers');
  const [paymentTab, setPaymentTab] = useState('Payments');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);

  const [proTools, setProTools] = useState(false);
  const [profileSlug, setProfileSlug] = useState('');
  const [instantBook, setInstantBook] = useState(true);
  const [guestPhotoRequired, setGuestPhotoRequired] = useState(false);

  const [privacyPrefs, setPrivacyPrefs] = useState(() => loadJsonPref(PRIVACY_PREFS_KEY, DEFAULT_PRIVACY_PREFS));
  const [localePrefs, setLocalePrefs] = useState(() => loadJsonPref(LOCALE_PREFS_KEY, DEFAULT_LOCALE_PREFS));
  const [notifDetail, setNotifDetail] = useState(() => loadJsonPref(NOTIFICATION_DETAIL_KEY, DEFAULT_NOTIFICATION_DETAIL));
  const [taxSummary, setTaxSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && HOST_SETTINGS_SECTIONS.some((s) => s.id === hash)) {
      setActive(hash);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAbout(user.about_me || '');
      setProfileSlug(user.name?.toLowerCase().replace(/\s+/g, '-') || '');
      setEmailPrefs(user.notification_prefs?.email ?? true);
      setWhatsappPrefs(user.notification_prefs?.whatsapp ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (active === 'taxes') {
      analyticsApi.hostDashboard()
        .then(({ data }) => setTaxSummary(data))
        .catch(() => setTaxSummary(null));
    }
  }, [active]);

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
      fd.append('phone', phone);
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

  const updateLocale = (key, value) => {
    const next = { ...localePrefs, [key]: value };
    setLocalePrefs(next);
    saveJsonPref(LOCALE_PREFS_KEY, next);
    setSuccess('Preference saved');
    setModal(null);
  };

  const alert = success ? (
    <p className="account-settings__alert account-settings__alert--success">{success}</p>
  ) : error ? (
    <ErrorMessage message={error} />
  ) : null;

  const personalPanel = (
    <SettingsPanel title="Personal information">
      {alert}
      <SettingsSection>
        <SettingsRow label="Legal name" value={user?.name} action="Edit" onAction={() => setModal('name')} />
        <SettingsRow label="Email address" value={maskEmail(user?.email)} action="Edit" onAction={() => setModal('email')} />
        <SettingsRow label="Phone numbers" description="Used for guest contact and payout verification." value={user?.phone || undefined} action={user?.phone ? 'Edit' : 'Add'} onAction={() => setModal('phone')} />
        <SettingsRow label="Identity verification" value={user?.email_verified ? 'Verified' : 'Not started'} action={user?.email_verified ? 'View' : 'Start'} onAction={() => setModal('identity')} />
        <SettingsRow label="About you" value={user?.about_me ? 'Provided' : 'Not provided'} action={user?.about_me ? 'Edit' : 'Add'} onAction={() => setModal('about')} />
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
            <SettingsRow label="Password" value="Not created" action="Create" onAction={() => setModal('password')} />
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
      <SettingsSection title="Listings">
        <SettingsToggleRow
          label="Include my listing(s) in search engines"
          description="When on, search engines like Google may display your listing pages."
          checked={privacyPrefs.listingsInSearch ?? false}
          onChange={(v) => {
            const next = { ...privacyPrefs, listingsInSearch: v };
            setPrivacyPrefs(next);
            saveJsonPref(PRIVACY_PREFS_KEY, next);
            setSuccess('Privacy preference saved');
          }}
        />
      </SettingsSection>
      <SettingsSection title="Data privacy">
        <SettingsLinkRow label="Request my personal data" onClick={() => { window.location.href = 'mailto:privacy@stayease.com'; }} />
        <SettingsLinkRow label="Delete my account" onClick={() => setModal('deactivate')} />
      </SettingsSection>
      <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
        <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
      </p>
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
        <SettingsSection title="Account">
          <SettingsRow label="Email updates" value={emailPrefs ? 'On' : 'Off'} action="Edit" onAction={() => setModal('channels')} />
          <SettingsRow label="WhatsApp alerts" value={whatsappPrefs ? 'On' : 'Off'} action="Edit" onAction={() => setModal('channels')} />
          <SettingsLinkRow label="View in-app notifications" to="/notifications" />
        </SettingsSection>
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
            footer={<SettingsCta onClick={() => setModal('gstin')}>Add tax info</SettingsCta>}
          >
            <SettingsRow label="GSTIN" value="Not provided" action="Add" onAction={() => setModal('gstin')} />
          </SettingsSection>
          <SettingsSection
            title="Value Added Tax (VAT)"
            description="If you are GST-registered, add your GST ID for automated CGST/SGST invoices."
            footer={<SettingsCta onClick={() => setModal('gstin')}>Add VAT ID number</SettingsCta>}
          />
          {taxSummary && (
            <SettingsSection title="Earnings summary">
              <SettingsRow label="Month revenue" value={formatCurrency(taxSummary.month_revenue || 0)} />
              <SettingsRow label="Month platform fees" value={formatCurrency(taxSummary.month_platform_fees || 0)} />
            </SettingsSection>
          )}
        </>
      ) : (
        <SettingsSection title="Tax documents">
          <SettingsLinkRow label="GST reports & invoices" to="/host/bookings" />
          <SettingsLinkRow label="Download invoices from Bookings" to="/host/bookings" />
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
          footer={<SettingsCta to="/host/payouts">Set up payouts</SettingsCta>}
        >
            <SettingsLinkRow label="View earnings" to="/host?tab=earnings" />
        </SettingsSection>
      )}
      {paymentTab === 'Service fee' && (
        <SettingsSection title="Service fee">
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
        <SettingsRow label="Time zone" value={localePrefs.timezone} action="Edit" onAction={() => setModal('timezone')} />
        <SettingsRow label="Display theme" value={theme === 'dark' ? 'Dark' : 'Light'} action="Edit" onAction={() => setModal('theme')} />
      </SettingsSection>
    </SettingsPanel>
  );

  const hostingPrefsPanel = (
    <SettingsPanel title="Hosting preferences" subtitle="Defaults applied across your StayEase listings.">
      {alert}
      <SettingsSection title="Booking settings">
        <SettingsToggleRow label="Instant Book" description="Guests can book without waiting for approval." checked={instantBook} onChange={setInstantBook} />
        <SettingsToggleRow label="Require guest profile photo" description="Guests must add a photo before booking." checked={guestPhotoRequired} onChange={setGuestPhotoRequired} />
        <SettingsLinkRow label="Edit per-listing booking rules" to="/host/rooms" />
      </SettingsSection>
      <SettingsSection title="Guest requirements">
        <SettingsRow label="Government ID" value="Required for all guests" />
        <SettingsRow label="GST invoicing" value="Automatic on every paid booking" action="Learn more" to="/host/bookings" />
      </SettingsSection>
      <SettingsSection title="Local laws">
        <SettingsLinkRow label="Review Indian hospitality laws" to="/help/local-laws" />
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
          checked={proTools}
          onChange={setProTools}
        />
      </SettingsSection>
      <SettingsSection
        title="Custom profile URL"
        description="Give guests a direct link to all your StayEase listings."
        footer={(
          <SettingsUrlField
            prefix="stayease.in/host/"
            value={profileSlug}
            onChange={(e) => setProfileSlug(e.target.value)}
            onSave={() => setSuccess('Profile URL saved')}
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

  return (
    <HostPage>
      <SettingsLayout
        sections={HOST_SETTINGS_SECTIONS}
        activeId={active}
        onSelect={handleSelect}
      >
        {panels[active]}
      </SettingsLayout>

      <Modal open={modal === 'name' || modal === 'phone' || modal === 'about'} onClose={() => setModal(null)} title="Edit profile">
        <form className="account-settings__inline-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <div className="form-group">
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">About</label>
            <textarea className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'identity'} onClose={() => setModal(null)} title="Identity verification">
        <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
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

      <Modal open={!!modal && ['password', 'deactivate', 'cohost', 'gstin', 'payment-method', 'email', 'notif-hostingInsights', 'notif-hostingUpdates', 'notif-stayeaseUpdates'].includes(modal)} onClose={() => setModal(null)} title="Coming soon">
        <p style={{ color: 'var(--text-secondary)' }}>This feature is not available in the demo build yet.</p>
      </Modal>
    </HostPage>
  );
}
