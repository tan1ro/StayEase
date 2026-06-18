import LegalPage from '../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'intro',
    title: 'Agreement to Terms',
    paragraphs: [
      'Welcome to StayEase. These Terms of Service ("Terms") govern your access to and use of the StayEase website, applications, APIs, and related services (collectively, the "Platform").',
      'By creating an account, listing a property, or completing a booking, you agree to these Terms, our Privacy Policy, and our Cookie Policy. If you do not agree, do not use the Platform.',
      'Cancellation rules, billing, GST, service fees, and refund processing are set out in these Terms. You accept them when you tick the legal acceptance box at registration or before confirming a booking.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    paragraphs: [
      'You must be at least 18 years old and able to enter a binding contract under Indian law to register, host, or book on StayEase.',
      'Hosts must have the legal right to offer the accommodation they list and must comply with applicable licensing, safety, and tax obligations in their jurisdiction.',
    ],
  },
  {
    id: 'account',
    title: 'Accounts & Security',
    paragraphs: ['You are responsible for:'],
    list: [
      'Keeping your login credentials confidential',
      'All activity that occurs under your account',
      'Providing accurate registration details and updating them when they change',
      'Notifying us promptly at legal@stayease.com if you suspect unauthorised access',
    ],
  },
  {
    id: 'tourist',
    title: 'Guest Responsibilities',
    paragraphs: ['When you book on StayEase, you agree to:'],
    list: [
      'Provide accurate trip, contact, and verification information',
      'Complete identity verification when booking for yourself, or provide a photograph of the staying guest when booking for someone else',
      'Respect the property, house rules, and policies set by the host',
      'Pay all charges shown in the checkout breakdown, including room tariff, dynamic pricing adjustments, StayEase service fees, applicable GST, and any cancellation charges under these Terms',
      'Present the same government ID or guest photograph at check-in that you submitted during booking',
      'Not make fraudulent bookings, abuse offers or referrals, or initiate improper chargebacks',
    ],
  },
  {
    id: 'host',
    title: 'Host Responsibilities',
    paragraphs: ['When you list on StayEase, you agree to:'],
    list: [
      'Provide accurate descriptions, photos, amenities, room placement details, and pricing',
      'Honor confirmed bookings at the listed terms and cancellation policy',
      'Keep properties safe, clean, and fit for the booked occupancy',
      'Choose and honor one cancellation policy per listing: Flexible, Moderate, or Strict',
      'Comply with local licensing, fire safety, hospitality, and tax requirements',
      'Respond to guest inquiries and booking requests in a timely manner',
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings & Room Selection',
    paragraphs: [
      'A booking is confirmed only after you complete checkout, accept these Terms, and successful payment is recorded on the Platform.',
      'Where a host has multiple rooms in the same city, StayEase may display an interactive room map so you can compare floor, view, and availability before selecting a specific room listing.',
      'Availability is not guaranteed until payment is confirmed. If a room becomes unavailable before confirmation, you will be notified and not charged.',
      'StayEase may send booking confirmations, reminders, and updates by email and WhatsApp using the contact details you provide.',
    ],
  },
  {
    id: 'verification',
    title: 'Guest Identity Verification',
    paragraphs: [
      'Indian hotels and homestays commonly verify guests at check-in. StayEase collects verification details at booking to reduce friction on arrival.',
      'When booking for yourself, you may use a government ID already saved on your profile (Aadhar, PAN, or Passport) or upload a new document. When booking for another person, you must provide their full name and a clear photograph; that guest must present the same photograph at check-in.',
      'Verification data is handled as described in our Privacy Policy. Submitting false or misleading identity information is a breach of these Terms.',
    ],
  },
  {
    id: 'billing',
    title: 'Pricing, Service Fees & GST',
    paragraphs: [
      'All prices are shown in Indian Rupees (INR). Before you confirm a booking, StayEase displays an itemised breakdown that may include:',
    ],
    list: [
      'Base room tariff multiplied by the number of nights',
      'Dynamic pricing adjustments (for example weekend surcharge, peak season, early bird discount, long-stay discount, or last-minute surcharge)',
      'Promotional offer discounts and referral credits, where applicable',
      'StayEase guest service fee — currently 10% of the booking subtotal (before guest service fee and GST)',
      'Goods and Services Tax (GST) on the room tariff at Indian hotel slabs: 0% below ₹1,000/night, 5% for ₹1,001–₹7,500/night (ITC not allowed), 18% above ₹7,500/night (ITC allowed for businesses), and 0% for qualifying long-term dormitory stays (90+ nights up to ₹20,000/month per person), split equally as CGST and SGST where applicable',
      'Hosts pay a separate StayEase host service fee — currently 3% of the booking subtotal — deducted from the host payout (see Service fees)',
    ],
  },
  {
    id: 'billing-note',
    title: 'Price changes',
    paragraphs: [
      'We may change service fee percentages with reasonable notice on the Platform. Dynamic pricing rules may vary by listing and season. The breakdown shown at checkout is the amount you agree to pay.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    paragraphs: [
      'Payment is collected when you confirm a booking through payment partners integrated with StayEase. By confirming, you authorise us to charge your selected payment method for the total shown.',
      'You are responsible for any bank or card charges imposed by your payment provider. StayEase does not store full card numbers on its servers.',
      'If payment fails, the booking is not confirmed. Duplicate or erroneous charges should be reported to support@stayease.com within 7 days.',
    ],
  },
  {
    id: 'cancellation',
    title: 'Cancellation & Refunds',
    paragraphs: [
      'Each listing is associated with a host-selected cancellation policy. StayEase applies the policy below based on how long before the scheduled check-in time you cancel. Times are calculated in the property\'s local timezone unless stated otherwise on the listing.',
    ],
    list: [
      'Flexible — Full refund if cancelled at least 24 hours before check-in. 50% refund if cancelled within 24 hours of check-in.',
      'Moderate — Full refund if cancelled at least 5 days before check-in. 50% refund if cancelled between 1 and 5 days before check-in. No refund if cancelled within 24 hours of check-in.',
      'Strict — 50% refund if cancelled at least 7 days before check-in. No refund if cancelled within 7 days of check-in.',
      'If you cancel before payment is completed, no charge is applied.',
      'Approved refunds are returned to the original payment method within 5–7 business days, subject to your bank\'s processing times.',
      'GST on non-refundable portions may not be refunded where prohibited or restricted under applicable tax law.',
      'Hosts who cancel confirmed bookings may be subject to penalties, guest relocation support, and account review under our host standards.',
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices & Tax Records',
    paragraphs: [
      'After payment, StayEase generates a tax invoice (PDF) with itemised charges, CGST/SGST split, and booking details as required under the CGST Act, 2017 where applicable.',
      'Guests may download invoices and vouchers from trip history. Hosts receive booking confirmations and payout records for their accounts.',
      'StayEase and hosts are each responsible for their own tax filings. Nothing in these Terms constitutes tax advice.',
    ],
  },
  {
    id: 'prohibited',
    title: 'Prohibited Conduct',
    paragraphs: ['You may not:'],
    list: [
      'Misrepresent your identity, listing, or booking intent',
      'Post fake reviews, manipulate ratings, or abuse reporting tools',
      'Harass, threaten, or discriminate against other users (see our Nondiscrimination Policy)',
      'Arrange off-platform payments to avoid fees or taxes',
      'Use the Platform for unlawful activity or to violate another person\'s rights',
      'Scrape, reverse engineer, or overload our systems without written permission',
    ],
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    paragraphs: [
      'StayEase and its logos, software, and content are owned by StayEase Technologies Pvt. Ltd. or its licensors. You receive a limited, non-exclusive licence to use the Platform for personal or authorised business use.',
      'Hosts grant StayEase a licence to display listing content (photos, descriptions, and media) for marketing and operating the Platform.',
    ],
  },
  {
    id: 'liability',
    title: 'Platform Role & Limitation of Liability',
    paragraphs: [
      'StayEase is an intermediary that connects guests and hosts. We are not a party to the accommodation contract between guest and host, and we do not control properties or on-site conduct.',
      'To the fullest extent permitted by law, StayEase is not liable for property condition, personal injury, theft, host or guest conduct, or force majeure events. Our aggregate liability for any claim relating to the Platform shall not exceed the amount you paid StayEase for the booking giving rise to the claim.',
      'Nothing in these Terms limits liability that cannot be limited under applicable law.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time. The "Last updated" date at the top will change when we do. Material changes may be notified by email or an in-app notice.',
      'Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms. If you disagree, you should stop using the Platform and close your account.',
    ],
  },
  {
    id: 'law',
    title: 'Governing Law & Disputes',
    paragraphs: [
      'These Terms are governed by the laws of India. Courts in Bangalore, Karnataka shall have exclusive jurisdiction, subject to any mandatory consumer protections in your place of residence.',
      'For legal notices and support: legal@stayease.com | General support: support@stayease.com',
    ],
  },
];

export default function TermsOfService() {
  return <LegalPage title="Terms of Service" updated={UPDATED} sections={sections} />;
}
