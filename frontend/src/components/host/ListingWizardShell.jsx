import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function ListingWizardShell({
  stepIndex,
  sectionCount = 3,
  sectionProgress,
  onBack,
  onNext,
  onSaveExit,
  saveExitLabel = 'Save & exit',
  nextLabel = 'Next',
  nextDisabled = false,
  children,
}) {
  const sections = Array.from({ length: sectionCount }, (_, i) => {
    if (i < sectionProgress.section) return 1;
    if (i === sectionProgress.section) return sectionProgress.fraction;
    return 0;
  });

  return (
    <div className="listing-wizard">
      <header className="listing-wizard__header">
        <Logo to="/host" />
        <div className="listing-wizard__header-actions">
          <button type="button" className="listing-wizard__header-btn">Questions?</button>
          {onSaveExit ? (
            <button type="button" className="listing-wizard__header-btn" onClick={onSaveExit}>
              {saveExitLabel}
            </button>
          ) : (
            <Link to="/host/rooms" className="listing-wizard__header-btn">Save &amp; exit</Link>
          )}
        </div>
      </header>

      <main className="listing-wizard__main">{children}</main>

      <footer className="listing-wizard__footer">
        <div className="listing-wizard__progress">
          {sections.map((fill, i) => (
            <span
              key={i}
              className="listing-wizard__progress-segment"
              style={{ '--fill': fill }}
            />
          ))}
        </div>
        <div className="listing-wizard__nav">
          {stepIndex > 0 ? (
            <button type="button" className="listing-wizard__back" onClick={onBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="listing-wizard__next btn btn-primary"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
