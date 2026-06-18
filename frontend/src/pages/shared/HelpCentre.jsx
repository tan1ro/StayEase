import { Link } from 'react-router-dom';
import { CircleHelp, FileText, MessageCircle, Scale, Shield, Wallet } from 'lucide-react';
import { Icon, ICON } from '../../components/ui/Icon';

const TOPICS = [
  {
    icon: Shield,
    title: 'Cancellation options',
    body: 'Flexible, Moderate, and Strict policies — and how refunds are calculated.',
    to: '/help/cancellation',
  },
  {
    icon: Wallet,
    title: 'Billing & GST',
    body: 'Understand checkout breakdowns, service fees, and Indian hotel GST slabs.',
    to: '/help/billing-gst',
  },
  {
    icon: FileText,
    title: 'Invoices & receipts',
    body: 'Download tax invoices and hotel vouchers from your trip history.',
    to: '/help/invoices',
  },
  {
    icon: CircleHelp,
    title: 'Tourist guidelines',
    body: 'Travel responsibly, verify at check-in, and respect house rules.',
    to: '/help/tourist-guidelines',
  },
  {
    icon: Shield,
    title: 'Host guidelines',
    body: 'Listing standards, guest communication, and compliance for hosts.',
    to: '/help/host-guidelines',
  },
  {
    icon: Scale,
    title: 'Hosting responsibly',
    body: 'Safety, inclusion, neighbours, and legal compliance for hosts.',
    to: '/help/hosting-responsibly',
  },
  {
    icon: Scale,
    title: 'Local laws',
    body: 'Understand regional regulations for hosts and guests across India.',
    to: '/help/local-laws',
  },
  {
    icon: FileText,
    title: 'Service fees',
    body: 'See how StayEase service fees and GST are calculated on your stay.',
    to: '/help/service-fees',
  },
  {
    icon: MessageCircle,
    title: 'Nondiscrimination',
    body: 'Our commitment to inclusive hosting and travel for everyone.',
    to: '/help/nondiscrimination',
  },
  {
    icon: CircleHelp,
    title: 'Privacy & data',
    body: 'How we collect, use, and protect your personal information.',
    to: '/privacy-policy',
  },
];

export default function HelpCentre() {
  return (
    <div className="page-narrow">
      <h1 className="page-title">Help Centre</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Find answers about bookings, hosting, payments, and policies on StayEase.
      </p>

      <div className="help-grid">
        {TOPICS.map(({ icon, title, body, to }) => (
          <Link key={title} to={to} className="card help-card">
            <Icon icon={icon} size={ICON.lg} />
            <h2>{title}</h2>
            <p>{body}</p>
          </Link>
        ))}
      </div>

      <section className="card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Contact support</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Email us at{' '}
          <a href="mailto:support@stayease.com">support@stayease.com</a>
          {' '}or{' '}
          <a href="mailto:privacy@stayease.com">privacy@stayease.com</a>
          {' '}for account and privacy requests.
        </p>
      </section>

      <style>{`
        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .help-card {
          padding: 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .help-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .help-card h2 { font-size: 1rem; margin: 0.75rem 0 0.35rem; }
        .help-card p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
