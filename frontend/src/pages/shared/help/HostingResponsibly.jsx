import { Link } from 'react-router-dom';
import LegalPage from '../../../components/LegalPage';

const UPDATED = '17 June 2026';

const sections = [
  {
    id: 'overview',
    title: 'Hosting responsibly on StayEase',
    paragraphs: [
      'Responsible hosting means providing safe, welcoming accommodation while respecting your neighbours, guests, and local regulations. StayEase is built for Indian hospitality — from GST-ready billing to guest identity verification at check-in.',
    ],
  },
  {
    id: 'safety',
    title: 'Safety first',
    paragraphs: ['Every host should:'],
    list: [
      'Install and maintain smoke detectors, fire extinguishers, and clear emergency exits where required',
      'Share accurate check-in instructions and emergency contact numbers',
      'Keep common areas well lit and secure',
      'Report serious incidents to local authorities and StayEase support promptly',
    ],
  },
  {
    id: 'community',
    title: 'Neighbours & community',
    paragraphs: [
      'Homestays and small hotels operate within residential and commercial neighbourhoods. Set quiet hours, manage guest parking, and communicate house rules to prevent disturbances.',
      'Inform guests about local customs, waste disposal, and any society or building rules that apply.',
    ],
  },
  {
    id: 'inclusion',
    title: 'Inclusive hosting',
    paragraphs: [
      'StayEase prohibits discrimination based on race, religion, national origin, disability, sex, marital status, or other protected characteristics. Review our Nondiscrimination Policy before listing.',
    ],
  },
  {
    id: 'compliance',
    title: 'Legal & tax compliance',
    paragraphs: [
      'Register with local authorities where required, maintain valid licences, and file taxes in accordance with Indian law. StayEase automates GST on bookings but does not replace professional tax or legal advice.',
    ],
  },
  {
    id: 'resources',
    title: 'More resources',
    paragraphs: [
      'Visit Hosting resources in your host dashboard for pricing guides, GST tips, and best practices. Our Help Centre covers service fees, local laws, and cancellation policies in detail.',
    ],
  },
];

export default function HostingResponsibly() {
  return (
    <LegalPage title="Hosting responsibly" updated={UPDATED} sections={sections}>
      <p className="legal-page__cta">
        <Link to="/host/resources" className="btn btn-primary btn-sm">Hosting resources</Link>
        {' '}
        <Link to="/help/host-guidelines" className="btn btn-outline btn-sm">Host guidelines</Link>
      </p>
    </LegalPage>
  );
}
