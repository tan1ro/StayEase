import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Billing on StayEase',
    paragraphs: [
      'All prices on StayEase are shown in Indian Rupees (INR). Before you confirm a booking, you see an itemised breakdown of every charge — room tariff, dynamic pricing adjustments, service fees, and applicable GST.',
      'The amount shown at checkout is the amount you agree to pay. Hosts receive payouts after StayEase deducts the host service fee.',
    ],
  },
  {
    id: 'breakdown',
    title: 'What appears on your bill',
    paragraphs: ['A typical guest checkout breakdown may include:'],
    list: [
      'Base room tariff multiplied by the number of nights',
      'Dynamic pricing adjustments (weekend surcharge, peak season, early bird discount, long-stay discount, or last-minute surcharge)',
      'Promotional offer discounts and referral credits, where applicable',
      'StayEase guest service fee — currently 10% of the booking subtotal (before guest service fee and GST)',
      'Goods and Services Tax (GST) on the room tariff at Indian hotel slabs',
    ],
  },
  {
    id: 'gst-slabs',
    title: 'GST slabs for hotel stays',
    paragraphs: ['StayEase applies Indian hotel GST based on the effective nightly rate after dynamic pricing and before the guest service fee:'],
    list: [
      'Below ₹1,000 per night — 0% GST (exempt)',
      '₹1,001 to ₹7,500 per night — 5% GST (split equally as CGST and SGST; ITC not allowed)',
      'Above ₹7,500 per night — 18% GST (split equally as CGST and SGST; ITC allowed for businesses)',
      'Long-term dormitory stays (90+ nights, up to ₹20,000/month per person) — 0% GST (exempt)',
    ],
  },
  {
    id: 'host-fees',
    title: 'Host service fee',
    paragraphs: [
      'Hosts pay a separate StayEase host service fee — currently 3% of the booking subtotal — deducted from the host payout. See our Service fees page for a full explanation.',
    ],
  },
  {
    id: 'changes',
    title: 'Price changes',
    paragraphs: [
      'We may change service fee percentages with reasonable notice on the Platform. Dynamic pricing rules may vary by listing and season. The breakdown shown at checkout is always authoritative.',
    ],
  },
];

export default function BillingGst() {
  return (
    <LegalPage
      title="Billing & GST"
      updated={UPDATED}
      sections={sections}
    />
  );
}
