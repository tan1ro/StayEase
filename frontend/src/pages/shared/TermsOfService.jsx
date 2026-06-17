import LegalPage from '../../components/LegalPage';

const sections = [
  {
    id: 'intro',
    title: 'Agreement to Terms',
    paragraphs: [
      'Welcome to StayEase. These Terms of Service ("Terms") govern your access to and use of the StayEase platform, including our website, APIs, and all related services. By registering an account or making a booking, you agree to be bound by these Terms and our Privacy Policy.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    paragraphs: [
      'You must be at least 18 years of age to create an account, list a property, or make a booking on StayEase. By using our services, you represent that you meet this requirement and have the legal capacity to enter into binding contracts under Indian law.',
    ],
  },
  {
    id: 'tourist',
    title: 'Tourist Responsibilities',
    paragraphs: ['As a tourist, you agree to:'],
    list: [
      'Provide accurate personal and booking information',
      'Respect the property, house rules, and host policies',
      'Pay all applicable charges including room tariff, dynamic pricing adjustments, GST, and cancellation fees',
      'Complete identity verification when requested',
      'Not engage in fraudulent bookings, chargebacks, or policy abuse',
    ],
  },
  {
    id: 'host',
    title: 'Host Responsibilities',
    paragraphs: ['As a host, you agree to:'],
    list: [
      'Provide accurate listing descriptions, photos, and amenities',
      'Honor confirmed bookings at the listed price and policy',
      'Maintain properties in a safe, clean, and habitable condition',
      'Set a clear cancellation policy (flexible, moderate, or strict) and honor it',
      'Comply with local licensing, safety, and tax requirements',
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    paragraphs: [
      'All prices on StayEase are displayed in Indian Rupees (INR). The total booking amount includes:',
    ],
    list: [
      'Base room tariff multiplied by number of nights',
      'Dynamic pricing adjustments (weekend surcharge, peak season, early bird discounts, etc.)',
      'Promotional offer discounts and referral credits (if applicable)',
      'Goods and Services Tax (GST) calculated per India hotel tariff slabs: 0% (under ₹1,000/night), 12% (₹1,000–₹7,500/night), 18% (above ₹7,500/night)',
      'GST is split equally as CGST and SGST on all invoices',
    ],
  },
  {
    id: 'cancellation',
    title: 'Cancellation & Refund Policy',
    paragraphs: [
      'Each listing displays its cancellation policy set by the host. StayEase enforces these policies automatically when you cancel a booking. Charges are calculated based on how many days remain before check-in:',
    ],
    list: [
      'Flexible: Full refund if cancelled 24+ hours before check-in. 50% refund within 24 hours.',
      'Moderate: Full refund if cancelled 5+ days before check-in. 50% refund if cancelled 1–5 days before. No refund within 24 hours.',
      'Strict: 50% refund if cancelled 7+ days before check-in. No refund within 7 days.',
      'Bookings cancelled before payment: no charge applied.',
      'Refunds are processed within 5–7 business days to the original payment method.',
      'GST on non-refundable portions is not refunded where applicable under tax law.',
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices & Tax',
    paragraphs: [
      'A tax invoice (PDF) is generated upon payment confirmation. Invoices include the StayEase GST registration number, itemised price breakdown, CGST/SGST split, and guest/host details as required under the CGST Act, 2017.',
      'Guests may download invoices from their trip history. Hosts receive copies of booking confirmations for their records.',
    ],
  },
  {
    id: 'prohibited',
    title: 'Prohibited Activities',
    paragraphs: ['The following are strictly prohibited and may result in immediate account termination:'],
    list: [
      'Fraudulent bookings, fake reviews, or identity misrepresentation',
      'Harassment of hosts, guests, or StayEase staff',
      'Circumventing platform fees by arranging off-platform payments',
      'Illegal activities on listed properties',
      'Scraping, automated access, or reverse engineering of the platform',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    paragraphs: [
      'StayEase acts as an intermediary platform connecting guests and hosts. We are not a party to the rental agreement between guest and host. StayEase is not liable for property conditions, host conduct, guest conduct, or disputes arising from stays, except as required by applicable law.',
      'Our total liability to you for any claim arising from use of the platform shall not exceed the amount you paid for the booking in question.',
    ],
  },
  {
    id: 'law',
    title: 'Governing Law & Disputes',
    paragraphs: [
      'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.',
      'For support or legal notices: legal@stayease.com',
    ],
  },
];

export default function TermsOfService() {
  return <LegalPage title="Terms of Service" updated="June 2025" sections={sections} />;
}
