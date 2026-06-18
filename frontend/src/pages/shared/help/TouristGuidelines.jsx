import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Guidelines for guests',
    paragraphs: [
      'StayEase connects you with hosts across India. These guidelines help you travel responsibly, verify smoothly at check-in, and enjoy a safe stay.',
    ],
  },
  {
    id: 'booking',
    title: 'Before you book',
    paragraphs: ['When booking on StayEase, you agree to:'],
    list: [
      'Provide accurate trip, contact, and verification information',
      'Complete identity verification when booking for yourself, or provide a photograph of the staying guest when booking for someone else',
      'Review the listing\'s house rules, cancellation policy, and amenities before confirming',
      'Pay all charges shown in the checkout breakdown, including room tariff, dynamic pricing, service fees, GST, and any cancellation charges',
    ],
  },
  {
    id: 'check-in',
    title: 'Check-in & identity',
    paragraphs: [
      'Indian hotels and homestays commonly verify guests at check-in. StayEase collects verification details at booking to reduce friction on arrival.',
      'When booking for yourself, use a government ID saved on your profile (Aadhar, PAN, or Passport) or upload a new document. When booking for another person, provide their full name and a clear photograph — that guest must present the same photograph at check-in.',
      'Submitting false or misleading identity information is a breach of our Terms of Service.',
    ],
  },
  {
    id: 'during-stay',
    title: 'During your stay',
    paragraphs: ['As a guest, please:'],
    list: [
      'Respect the property, neighbours, and house rules set by the host',
      'Keep noise reasonable, especially in residential buildings and homestays',
      'Report safety or maintenance issues to the host and StayEase support promptly',
      'Do not exceed the booked guest count or use the property for unlawful activity',
    ],
  },
  {
    id: 'conduct',
    title: 'Prohibited conduct',
    paragraphs: ['You may not:'],
    list: [
      'Make fraudulent bookings or abuse offers and referrals',
      'Initiate improper chargebacks for confirmed stays',
      'Harass hosts, staff, or other guests',
      'Arrange off-platform payments to avoid fees or taxes',
    ],
  },
];

export default function TouristGuidelines() {
  return (
    <LegalPage
      title="Tourist guidelines"
      updated={UPDATED}
      sections={sections}
    />
  );
}
