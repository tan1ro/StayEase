import { Link } from 'react-router-dom';
import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Invoices & receipts on StayEase',
    paragraphs: [
      'After payment is confirmed, StayEase generates GST-compliant tax invoices and booking vouchers for every reservation.',
      'Invoices include itemised charges, CGST/SGST split, booking reference, property details, and guest information as required under the CGST Act, 2017 where applicable.',
    ],
  },
  {
    id: 'guests',
    title: 'For guests',
    paragraphs: [
      'Download your tax invoice and hotel voucher from My bookings after your reservation is confirmed.',
      'Open the trip, then use View receipt to see the voucher and invoice. You can print or save them as PDF from your browser.',
    ],
    list: [
      'Tax invoice — itemised GST breakdown for your records or business reimbursement',
      'Hotel voucher — confirmation details to present at check-in alongside your government ID',
    ],
  },
  {
    id: 'hosts',
    title: 'For hosts',
    paragraphs: [
      'Hosts receive booking confirmations and payout records in the host dashboard. Earnings and payout history are available under Earnings and Payouts.',
      'StayEase and hosts are each responsible for their own tax filings. Nothing on the Platform constitutes tax advice.',
    ],
  },
  {
    id: 'issues',
    title: 'Missing or incorrect invoices',
    paragraphs: [
      'If an invoice is missing or contains an error, contact support@stayease.com within 7 days of payment with your booking reference. We will reissue corrected documents where required.',
    ],
  },
];

export default function InvoicesReceipts() {
  return (
    <LegalPage title="Invoices & receipts" updated={UPDATED} sections={sections}>
      <p className="legal-page__cta">
        <Link to="/bookings" className="btn btn-primary btn-sm">Go to My bookings</Link>
      </p>
    </LegalPage>
  );
}
