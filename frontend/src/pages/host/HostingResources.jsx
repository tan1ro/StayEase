import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, Video } from 'lucide-react';
import { Icon, ICON } from '../../components/ui/Icon';

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Host resource centre',
    description: 'GST billing tips, pricing guides, and best practices for Indian hotels.',
    to: '/host/insights',
  },
  {
    icon: MessageCircle,
    title: 'Community forum',
    description: 'Chat with StayEase hosts across Bangalore, Goa, and hill stations.',
    disabled: true,
  },
  {
    icon: Users,
    title: 'Host meetups',
    description: 'Connect with hosts in your city for local hospitality insights.',
    disabled: true,
  },
  {
    icon: Video,
    title: 'Hosting webinars',
    description: 'Free sessions on GST compliance, guest communication, and pricing.',
    disabled: true,
  },
];

export default function HostingResources() {
  return (
    <div className="host-page">
      <h1>Hosting resources</h1>
      <p className="host-page__subtitle">Tools and guides built for StayEase hosts in India</p>
      <div className="host-resources-grid">
        {RESOURCES.map(({ icon, title, description, to, disabled }) => {
          const className = 'host-resource-card card';
          const inner = (
            <>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
              <Icon icon={icon} size={ICON.xl} />
            </>
          );
          if (disabled) {
            return <div key={title} className={`${className} host-resource-card--disabled`}>{inner}</div>;
          }
          return <Link key={title} to={to} className={className}>{inner}</Link>;
        })}
      </div>
    </div>
  );
}
