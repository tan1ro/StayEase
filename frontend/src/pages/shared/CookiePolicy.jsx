import LegalPage from '../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    paragraphs: [
      'This Cookie Policy explains how StayEase ("we", "our", "us") uses cookies, local storage, and similar technologies when you visit stayease.com and related services.',
      'It should be read with our Privacy Policy and Terms of Service. When you click "Accept all" or "Essential only" on our cookie banner, or when you accept our policies during registration or booking, you consent to the practices described here for the choice you make.',
    ],
  },
  {
    id: 'what',
    title: 'What Are Cookies & Local Storage?',
    paragraphs: [
      'Cookies are small text files placed on your device. Local storage is a browser feature that lets websites save data between visits. StayEase uses these technologies for essential functionality and, only with your permission, optional analytics.',
      'We do not use third-party advertising cookies or cross-site tracking for ad targeting.',
    ],
  },
  {
    id: 'essential',
    title: 'Essential Storage (Always Active)',
    paragraphs: [
      'These items are necessary for StayEase to operate. They cannot be disabled without breaking core features:',
    ],
    list: [
      'stayease_token — keeps you signed in securely between sessions',
      'stayease-cookie-consent — records your cookie choice (essential only or accept all) and consent version',
      'Theme preference — remembers light or dark mode',
      'Session and draft data — supports in-progress bookings, host listing drafts, and similar workflow state where applicable',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics (Optional)',
    paragraphs: [
      'If you select "Accept all" on our cookie banner, we may set analytics cookies or equivalent technologies to understand how visitors use StayEase — for example which pages are viewed, how long sessions last, and where errors occur.',
      'If you select "Essential only", analytics storage is not enabled. You can change your choice by clearing site data for StayEase and reloading the page to see the banner again.',
    ],
  },
  {
    id: 'consent-flows',
    title: 'Where We Ask for Consent',
    paragraphs: [
      'Cookie banner — shown on first visit until you choose Essential only or Accept all.',
      'Registration — you must accept our Terms of Service, Privacy Policy, and Cookie Policy to create an account.',
      'Booking — you must accept the same policies again before confirming a reservation and payment.',
    ],
  },
  {
    id: 'third-party',
    title: 'Third-Party Technologies',
    paragraphs: [
      'StayEase does not place advertising network cookies. Embedded services you interact with directly — such as payment checkout or map embeds — may set their own cookies governed by those providers\' policies.',
      'Links to external websites are not covered by this Cookie Policy.',
    ],
  },
  {
    id: 'manage',
    title: 'Managing Your Preferences',
    paragraphs: [
      'Browser settings — you can delete cookies and local storage at any time. Clearing essential storage will sign you out and reset your theme and cookie preference.',
      'Reset cookie choice — clear site data for StayEase in your browser settings, then reload the page to see the cookie banner again.',
      'Do Not Track — StayEase does not currently respond to DNT browser signals; use the cookie banner and browser controls instead.',
    ],
  },
  {
    id: 'updates',
    title: 'Updates',
    paragraphs: [
      'We may update this Cookie Policy when our technologies or legal requirements change. Check the "Last updated" date at the top of this page.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      'Questions about cookies or this policy: cookies@stayease.com',
    ],
  },
];

export default function CookiePolicy() {
  return <LegalPage title="Cookie Policy" updated={UPDATED} sections={sections} />;
}
