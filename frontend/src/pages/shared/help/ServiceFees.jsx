import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'StayEase service fees',
    paragraphs: [
      'To help StayEase operate securely and cover services such as customer support, payment processing, GST invoicing, guest verification, and WhatsApp booking alerts, we charge service fees when a booking is confirmed.',
      'StayEase uses a split-fee structure: guests pay a service fee added to the booking total; hosts pay a service fee deducted from their payout.',
      'Current percentages are also summarised in our Terms of Service. The price breakdown shown at checkout or in your host earnings dashboard is always authoritative.',
    ],
  },
  {
    id: 'guest-fee',
    title: 'Guest service fee',
    paragraphs: [
      'Guests currently pay a 10% service fee on the booking subtotal. The subtotal includes the nightly room tariff and any dynamic pricing adjustments or offer discounts, but excludes the guest service fee and GST.',
      'The guest service fee appears in the price breakdown before you confirm your reservation, alongside CGST and SGST calculated per Indian hotel tariff slabs.',
    ],
  },
  {
    id: 'host-fee',
    title: 'Host service fee',
    paragraphs: [
      'Hosts currently pay a 3% service fee on the booking subtotal. The fee is deducted automatically when calculating your payout.',
      'You can preview guest totals and your expected earnings in the listing editor price cards and on each confirmed booking in your earnings dashboard.',
    ],
  },
  {
    id: 'preview',
    title: 'Preview your price breakdown',
    paragraphs: [
      'When creating or editing a listing, use the weekday and weekend price cards to preview what your guest will pay — including service fee and GST — and what you will earn after the host service fee.',
    ],
  },
  {
    id: 'gst-on-fees',
    title: 'GST on room charges',
    paragraphs: [
      'GST applies to the room tariff at 5% or 18% depending on the effective nightly rate, as described in our Terms of Service and local laws help page. StayEase generates tax invoices with CGST/SGST split on paid bookings where required.',
      'We may update service fee percentages with reasonable notice in accordance with our Terms of Service.',
    ],
  },
];

export default function ServiceFees() {
  return (
    <LegalPage
      title="StayEase service fees"
      updated={UPDATED}
      sections={sections}
    />
  );
}
