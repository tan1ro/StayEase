import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Guidelines for hosts',
    paragraphs: [
      'When you list on StayEase, you join a community of hospitality providers across India. These guidelines summarise your responsibilities and help you deliver great guest experiences.',
    ],
  },
  {
    id: 'listing',
    title: 'Your listing',
    paragraphs: ['When you list on StayEase, you agree to:'],
    list: [
      'Provide accurate descriptions, photos, amenities, room placement details, and pricing',
      'Keep availability calendars up to date and honour confirmed bookings at the listed terms',
      'Choose and honour one cancellation policy per listing: Flexible, Moderate, or Strict',
      'Set clear house rules and communicate them before check-in',
    ],
  },
  {
    id: 'property',
    title: 'Property standards',
    paragraphs: ['Hosts must:'],
    list: [
      'Keep properties safe, clean, and fit for the booked occupancy',
      'Maintain working locks, lighting, and essential amenities advertised on the listing',
      'Respond to guest inquiries and booking requests in a timely manner',
      'Verify guest identity at check-in using the details submitted during booking',
    ],
  },
  {
    id: 'compliance',
    title: 'Licensing & taxes',
    paragraphs: [
      'You must have the legal right to offer the accommodation you list and comply with applicable licensing, fire safety, hospitality, and tax obligations in your jurisdiction.',
      'StayEase provides GST-inclusive pricing tools and automated tax invoices, but you remain responsible for local registrations and filings. See our Local laws help page for more.',
    ],
  },
  {
    id: 'cancellations',
    title: 'Cancellations by hosts',
    paragraphs: [
      'Avoid cancelling confirmed bookings except in genuine emergencies. Host-initiated cancellations may result in penalties, guest relocation support, and account review.',
      'If you must cancel, notify the guest immediately and contact support@stayease.com so we can assist with relocation where possible.',
    ],
  },
];

export default function HostGuidelines() {
  return (
    <LegalPage
      title="Host guidelines"
      updated={UPDATED}
      sections={sections}
    />
  );
}
