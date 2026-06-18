import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import HostSetupShell from '../../../components/host/HostSetupShell';
import { Icon, ICON } from '../../../components/ui/Icon';
import {
  isIdentitySetupComplete,
  isPhoneSetupComplete,
  useListingSetupRoom,
} from '../../../hooks/useListingSetupRoom';

const TASKS = [
  {
    id: 'identity',
    title: 'Verify your identity',
    description: "We'll gather some information to help confirm you're you.",
    to: '/host/listings/setup/identity',
  },
  {
    id: 'phone',
    title: 'Confirm your phone number',
    description: "We'll call or text you to confirm your number. Standard messaging rates apply.",
    to: '/host/listings/setup/phone',
  },
];

export default function ListingSetupOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, loading, setupQuery } = useListingSetupRoom();

  const identityDone = isIdentitySetupComplete(user);
  const phoneDone = isPhoneSetupComplete(user?.id);
  const allDone = identityDone && phoneDone;

  const statusFor = (id) => {
    if (id === 'identity') return identityDone;
    if (id === 'phone') return phoneDone;
    return false;
  };

  return (
    <HostSetupShell
      room={room}
      roomLoading={loading}
      finishLaterTo={room?._id ? `/host/rooms/${room._id}/editor` : '/host/rooms'}
      onNext={allDone ? () => navigate('/host/rooms') : undefined}
      nextLabel="Go to listings"
    >
      <div className="host-setup-page">
        <h1 className="host-setup-page__title">Key details to take care of</h1>
        <ul className="host-setup-checklist">
          {TASKS.map((task) => {
            const done = statusFor(task.id);
            return (
              <li key={task.id}>
                <Link to={`${task.to}${setupQuery}`} className="host-setup-checklist__row">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <span className={`host-setup-checklist__status ${done ? 'host-setup-checklist__status--done' : ''}`}>
                      {done ? (
                        <>
                          <Icon icon={Check} size={ICON.sm} />
                          Complete
                        </>
                      ) : (
                        'Required'
                      )}
                    </span>
                  </div>
                  <Icon icon={ChevronRight} size={ICON.lg} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </HostSetupShell>
  );
}
