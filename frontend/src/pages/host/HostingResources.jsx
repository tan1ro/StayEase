import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, Video } from 'lucide-react';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostHero, HostPage, HostPanel } from '../../components/host/HostPageLayout';

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Host resource centre',
    description: 'GST billing tips, pricing guides, and best practices for Indian hotels.',
    to: '/host?tab=analytics',
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
    <HostPage>
      <HostHero
        title="Hosting resources"
        subtitle="Tools and guides built for StayEase hosts in India"
        pills={['Guides', 'Community', 'Webinars']}
      />

      <HostPanel title="Explore resources">
        <div className="host-ui-resource-grid">
          {RESOURCES.map(({ icon, title, description, to, disabled }) => {
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
              return <div key={title} className="host-ui-resource-card host-ui-resource-card--disabled">{inner}</div>;
            }
            return <Link key={title} to={to} className="host-ui-resource-card">{inner}</Link>;
          })}
        </div>
      </HostPanel>
    </HostPage>
  );
}
