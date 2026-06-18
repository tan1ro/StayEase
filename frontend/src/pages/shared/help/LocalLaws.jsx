import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Your local laws and taxes',
    paragraphs: [
      'Being prepared is key. We want to make sure you have everything you need to get your hosting journey off to a great start, and that includes reviewing local laws and regulations when you list your place on StayEase.',
    ],
  },
  {
    id: 'city-requirements',
    title: 'What some cities may require',
    paragraphs: [
      'Many cities in India have rules that cover home sharing and hotel operations, and the specific codes and ordinances can appear in many places (such as zoning, building, licensing, or tax codes).',
      'In some areas, you may need to register with local authorities, obtain a hotel or homestay licence, or comply with tourism department requirements before you list your place or accept guests. You may also be responsible for collecting and remitting certain taxes beyond what StayEase calculates automatically.',
    ],
  },
  {
    id: 'host-responsibility',
    title: 'Your responsibility as a host',
    paragraphs: [
      'You are responsible for where, when, and how you host, so we want you to be comfortable with the local laws and taxes that apply to your property. You can contact your local municipal corporation, state tourism department, or tax authority with any questions.',
      'To get you started, StayEase provides GST-inclusive pricing tools, automated tax invoices, and hosting resources designed for Indian hospitality.',
      'We ask that you educate yourself about the laws and regulations in your area and review our Nondiscrimination Policy before listing your place. When you accept our Terms of Service and list your place, you certify that you will follow applicable laws and regulations.',
    ],
  },
  {
    id: 'gst',
    title: 'GST and hotel tariffs in India',
    paragraphs: [
      'StayEase applies Indian hotel GST slabs to room tariff on every booking based on the effective nightly rate after dynamic pricing adjustments and before the guest service fee:',
      'GST treatment may change under government notification. The rate shown in your listing price preview and at guest checkout is authoritative for each booking.',
    ],
    list: [
      '₹7,500 per night or below — 5% GST (split equally as CGST and SGST)',
      'Above ₹7,500 per night — 18% GST (split equally as CGST and SGST)',
    ],
  },
  {
    id: 'advice',
    title: 'We don’t provide legal advice',
    paragraphs: [
      'StayEase does not provide legal advice, but we offer resources to help you better understand laws and regulations in your jurisdiction. For specific licensing, zoning, or tax questions, consult a qualified professional in your city or state.',
    ],
  },
];

export default function LocalLaws() {
  return <LegalPage title="Your local laws and taxes" updated={UPDATED} sections={sections} />;
}
