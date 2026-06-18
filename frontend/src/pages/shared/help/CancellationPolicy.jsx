import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'How cancellations work',
    paragraphs: [
      'Every StayEase listing has a cancellation policy chosen by the host. The policy is shown on the room page and in your trip details before and after you book.',
      'When you cancel, StayEase calculates your refund based on how far in advance you cancel relative to the scheduled check-in time. Times use the property\'s local timezone unless the listing states otherwise.',
    ],
  },
  {
    id: 'flexible',
    title: 'Flexible',
    paragraphs: ['Listings with a Flexible policy offer:'],
    list: [
      'Full refund if you cancel at least 24 hours before check-in',
      '50% refund if you cancel within 24 hours of check-in',
    ],
  },
  {
    id: 'moderate',
    title: 'Moderate',
    paragraphs: ['Listings with a Moderate policy offer:'],
    list: [
      'Full refund if you cancel at least 5 days before check-in',
      '50% refund if you cancel between 1 and 5 days before check-in',
      'No refund if you cancel within 24 hours of check-in',
    ],
  },
  {
    id: 'strict',
    title: 'Strict',
    paragraphs: ['Listings with a Strict policy offer:'],
    list: [
      '50% refund if you cancel at least 7 days before check-in',
      'No refund if you cancel within 7 days of check-in',
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds & processing',
    paragraphs: [
      'If you cancel before payment is completed, no charge is applied.',
      'Approved refunds are returned to your original payment method within 5–7 business days, subject to your bank\'s processing times.',
      'GST on non-refundable portions may not be refunded where prohibited or restricted under applicable tax law.',
      'Hosts who cancel confirmed bookings may be subject to penalties, guest relocation support, and account review under our host standards.',
    ],
  },
  {
    id: 'cancel-trip',
    title: 'Cancel a booking',
    paragraphs: [
      'Open My bookings, select the trip you want to change, and choose Cancel reservation. You will see the estimated refund before you confirm.',
      'For questions about a specific cancellation, contact support@stayease.com with your booking reference.',
    ],
  },
];

export default function CancellationPolicy() {
  return (
    <LegalPage
      title="Cancellation options"
      updated={UPDATED}
      sections={sections}
    />
  );
}
