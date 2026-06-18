import { Link } from 'react-router-dom';
import Logo from '../Logo';
import ListingSetupRoomCard from './ListingSetupRoomCard';

export default function HostSetupShell({
  room,
  roomLoading,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  finishLaterTo = '/host/rooms',
  children,
}) {
  return (
    <div className="host-setup">
      <header className="host-setup__header">
        <div className="host-setup__header-start">
          <Logo to="/host" />
          <span className="host-setup__header-label">Update your listing</span>
        </div>
        <Link to={finishLaterTo} className="listing-wizard__header-btn">
          Save &amp; exit
        </Link>
      </header>

      <main className="host-setup__main">
        <div className="host-setup__content">{children}</div>
        <aside className="host-setup__aside" aria-label="Listing preview">
          <ListingSetupRoomCard room={room} loading={roomLoading} />
        </aside>
      </main>

      <footer className="host-setup__footer">
        <div className="host-setup__footer-nav">
          {onBack ? (
            <button type="button" className="listing-wizard__back" onClick={onBack}>
              Back
            </button>
          ) : (
            <Link to={finishLaterTo} className="listing-wizard__back">
              Finish later
            </Link>
          )}
          {onNext && (
            <button
              type="button"
              className="listing-wizard__next btn btn-primary"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
