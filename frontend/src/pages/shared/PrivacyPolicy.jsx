import LegalPage from '../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    paragraphs: [
      'StayEase Technologies Pvt. Ltd. ("StayEase", "we", "our", "us") operates a hotel and homestay booking platform connecting guests with hosts across India.',
      'This Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, and the choices you have. It applies when you use our website, create an account, list a property, or make a booking.',
      'By using StayEase, you acknowledge this policy together with our Terms of Service and Cookie Policy.',
    ],
  },
  {
    id: 'collect',
    title: 'Information We Collect',
    paragraphs: ['Depending on how you use StayEase, we may collect:'],
    list: [
      'Account data — name, email address, phone number, password hash, role (guest or host), and profile photo',
      'Identity data — government ID type and number (Aadhar, PAN, or Passport), uploaded ID documents, and guest check-in photographs when booking for someone else',
      'Booking data — property selected, room number, check-in and check-out dates, guest count, price breakdown, offer codes, host messages, and booking status',
      'Payment and billing data — transaction amounts, service fees, GST breakdown, invoice numbers, refund records, and payout details for hosts (we do not store full card numbers)',
      'Listing data — property descriptions, photos, videos, location, amenities, policies, and availability calendars',
      'Communications — emails, WhatsApp messages, support tickets, reviews, and inquiries sent through the Platform',
      'Technical data — IP address, browser type, device information, log data, and preferences stored in cookies or local storage (including theme and cookie consent choices)',
      'Referral and promotional data — referral codes used or shared, and offer redemption history',
    ],
  },
  {
    id: 'usage',
    title: 'How We Use Your Information',
    paragraphs: ['We use personal data to:'],
    list: [
      'Create and manage your account',
      'Process bookings, payments, invoices, refunds, and host payouts',
      'Verify guest identity and share necessary verification details with hosts for check-in',
      'Calculate GST, service fees, and dynamic pricing',
      'Send transactional messages — confirmations, reminders, cancellations, and review prompts — by email and WhatsApp',
      'Provide customer support and resolve disputes',
      'Detect fraud, abuse, and security incidents',
      'Improve Platform features, performance, and reliability',
      'Comply with legal, tax, and regulatory obligations',
    ],
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis & Consent',
    paragraphs: [
      'We process your data where necessary to perform our contract with you (for example completing a booking), where required by law (for example tax record retention), and where we have a legitimate interest (for example fraud prevention), balanced against your rights.',
      'Marketing communications are sent only where permitted and you may opt out at any time. Analytics cookies are used only if you accept them in our cookie banner or equivalent consent flow.',
      'You must accept our Terms of Service, this Privacy Policy, and Cookie Policy to register or complete a booking.',
    ],
  },
  {
    id: 'verification',
    title: 'Identity Verification & Host Sharing',
    paragraphs: [
      'When you book for yourself, we collect government ID details to meet hospitality verification norms. You may reuse an ID saved on your profile or upload a new document.',
      'When you book for another guest, we collect their name, optional phone number, and photograph. The staying guest must present the same photograph at check-in.',
      'We share the minimum verification information required with the host and property — such as guest name, ID type and number, or check-in photograph — solely to facilitate lawful check-in. Hosts must handle this data securely and only for operational purposes.',
    ],
  },
  {
    id: 'sharing',
    title: 'How We Share Information',
    paragraphs: [
      'We do not sell your personal data. We share information only as described below:',
    ],
    list: [
      'With hosts and guests — booking details and verification data needed to fulfil a reservation',
      'With service providers — companies that help us run the Platform under contractual confidentiality obligations',
      'With authorities — when required by law, court order, or to protect rights, safety, and security',
      'In a business transfer — if StayEase is merged, acquired, or sells assets, subject to continued protection of your data',
    ],
  },
  {
    id: 'third',
    title: 'Service Providers',
    paragraphs: ['Our key processors include:'],
    list: [
      'MongoDB Atlas — database hosting for accounts, bookings, and listings',
      'Cloudinary — media storage for room photos, identity documents, and guest photographs',
      'Payment partners — secure payment processing (card details handled by the payment provider)',
      'SMTP email providers — transactional email delivery',
      'Twilio — WhatsApp booking notifications and reminders',
      'Open-Meteo — anonymised weather data for destination pages (no personal data shared)',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies & Local Storage',
    paragraphs: [
      'We use essential browser storage for authentication, bookings, theme preferences, and cookie consent records. Optional analytics may be enabled only with your consent.',
      'For full details, see our Cookie Policy.',
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    paragraphs: [
      'We retain account information while your account is active. Booking, invoice, and payment records are typically retained for 7 years to meet Indian tax and accounting requirements.',
      'Identity documents and guest photographs are retained for the duration needed to complete verification, fulfil the booking, and resolve disputes, then archived or deleted according to our retention schedule unless law requires longer storage.',
      'You may request account deletion; we will remove or anonymise data where we are not legally required to keep it.',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    paragraphs: [
      'We use industry-standard safeguards including encrypted connections (HTTPS), access controls, and secure cloud infrastructure. No method of transmission or storage is completely secure; please use a strong password and protect your account credentials.',
    ],
  },
  {
    id: 'rights',
    title: 'Your Rights',
    paragraphs: [
      'Under applicable Indian law, including the Digital Personal Data Protection Act, 2023 where it applies to our processing, you may have the right to:',
    ],
    list: [
      'Access a copy of personal data we hold about you',
      'Correct inaccurate or incomplete data',
      'Request erasure of data not required to be retained by law',
      'Withdraw consent for optional processing such as analytics cookies',
      'Nominate a person to exercise rights on your behalf in certain circumstances',
      'Lodge a complaint with us or with the relevant data protection authority',
    ],
  },
  {
    id: 'children',
    title: 'Children',
    paragraphs: [
      'StayEase is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a child has provided us data, contact privacy@stayease.com and we will take appropriate steps to delete it.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. The "Last updated" date will change when we do. Material updates may be communicated by email or a notice on the Platform.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    paragraphs: [
      'Data protection and privacy requests: privacy@stayease.com',
      'General support: support@stayease.com',
      'Postal address: StayEase Technologies Pvt. Ltd., Koramangala, Bangalore 560034, Karnataka, India',
    ],
  },
];

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" updated={UPDATED} sections={sections} />;
}
