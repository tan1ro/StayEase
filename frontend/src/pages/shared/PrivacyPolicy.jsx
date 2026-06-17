import LegalPage from '../../components/LegalPage';

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    paragraphs: [
      'StayEase ("we", "our", "us") operates a hotel and homestay booking platform connecting guests with hosts across India. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, mobile applications, and services.',
      'By creating an account or making a booking, you consent to the practices described in this policy.',
    ],
  },
  {
    id: 'collect',
    title: 'Data We Collect',
    paragraphs: ['We collect the following categories of personal data:'],
    list: [
      'Identity data: name, email address, phone number, government ID (Aadhar, PAN, or Passport) for identity verification',
      'Booking data: check-in/check-out dates, guest count, room preferences, payment and billing records',
      'Financial data: transaction amounts, GST breakdown, invoice details, refund and cancellation records',
      'Technical data: IP address, browser type, device information, and theme preferences stored in localStorage',
      'Communication data: emails, WhatsApp messages, and in-app notifications related to your bookings',
    ],
  },
  {
    id: 'usage',
    title: 'How We Use Your Data',
    paragraphs: ['Your data is used to:'],
    list: [
      'Process and manage bookings, payments, invoices, and refunds',
      'Calculate GST and generate tax invoices per India regulations',
      'Send booking confirmations, reminders, cancellation notices, and review requests',
      'Verify guest identity for security and fraud prevention',
      'Apply referral credits and promotional offers',
      'Improve platform features and customer support',
    ],
  },
  {
    id: 'third',
    title: 'Third-Party Services',
    paragraphs: [
      'We share limited data with trusted third-party providers solely to operate our platform. We never sell your personal data to advertisers or data brokers.',
    ],
    list: [
      'MongoDB Atlas — secure database hosting for account and booking records',
      'Cloudinary — storage of room photos, identity documents, and invoice PDFs',
      'Twilio — WhatsApp booking notifications and reminders',
      'SMTP email providers — transactional emails (confirmations, invoices, cancellations)',
      'Open-Meteo — weather data for destination pages (no personal data shared)',
    ],
  },
  {
    id: 'billing-privacy',
    title: 'Billing & Payment Privacy',
    paragraphs: [
      'Payment processing on StayEase uses mock payments in development and secure payment gateways in production. We store invoice numbers, GST breakdowns, and transaction records for 7 years as required by Indian tax law.',
      'Cancellation charges and refund amounts are recorded and linked to your booking history. You can view these in your trip receipts at any time.',
    ],
  },
  {
    id: 'rights',
    title: 'Your Rights',
    paragraphs: ['Under applicable Indian data protection principles, you have the right to:'],
    list: [
      'Access a copy of your personal data held by StayEase',
      'Request correction of inaccurate information',
      'Request deletion of your account and associated data (subject to legal retention requirements)',
      'Withdraw consent for marketing communications at any time',
      'Lodge a complaint with our Data Protection Officer',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies & Local Storage',
    paragraphs: [
      'StayEase uses browser localStorage to persist your authentication token and theme preference (light/dark mode). We do not use third-party advertising cookies or cross-site tracking.',
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    paragraphs: [
      'Account data is retained while your account is active. Booking and invoice records are retained for 7 years for tax compliance. Identity documents are retained until verification is complete, then archived securely.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    paragraphs: [
      'For privacy inquiries, data access requests, or complaints:',
      'Email: privacy@stayease.com',
      'Address: StayEase Technologies Pvt. Ltd., Koramangala, Bangalore 560034, Karnataka, India',
    ],
  },
];

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" updated="June 2025" sections={sections} />;
}
