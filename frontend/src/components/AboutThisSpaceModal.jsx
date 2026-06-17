import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';
import { buildAboutSpaceSections, splitDescription } from '../utils/listingSpaceContent';

export default function AboutThisSpaceModal({ open, onClose, room }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !room) return null;

  const { intro, spaceDetails } = splitDescription(room.description || '');
  const sections = buildAboutSpaceSections(room);

  return (
    <div className="listing-space-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="about-space-title">
      <div className="listing-space-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="listing-space-modal__close" onClick={onClose} aria-label="Close">
          <Icon icon={X} size={ICON.lg} />
        </button>

        <h2 id="about-space-title" className="listing-space-modal__title">About this space</h2>

        <div className="listing-space-modal__body">
          <p className="listing-space-modal__lead">{intro}</p>

          {spaceDetails && (
            <section className="listing-space-modal__section">
              <h3>The space</h3>
              <p>{spaceDetails}</p>
            </section>
          )}

          {sections.map((section) => (
            <section key={section.title} className="listing-space-modal__section">
              <h3>{section.title}</h3>
              {section.type === 'list' ? (
                <ul className="listing-space-modal__list">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
