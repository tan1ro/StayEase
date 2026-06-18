import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';

export default function ImageLightbox({
  open,
  index,
  images = [],
  onClose,
  onIndexChange,
  roomId,
  ariaLabel = 'Photo viewer',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        onIndexChange(index === 0 ? images.length - 1 : index - 1);
      }
      if (e.key === 'ArrowRight') {
        onIndexChange(index === images.length - 1 ? 0 : index + 1);
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || index == null || !images[index]) return null;

  const current = images[index];
  const imageSrc = current.url || current.image;
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => {
            stop(e);
            onIndexChange(index === 0 ? images.length - 1 : index - 1);
          }}
          aria-label="Previous photo"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      <div className="lightbox__stage" onClick={stop}>
        <SafeImage
          src={imageSrc}
          alt={current.alt || ''}
          className="lightbox__image"
          fallbackSeed={current.fallbackSeed || roomId}
          fallbackIndex={current.fallbackIndex ?? index}
        />
      </div>
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => {
            stop(e);
            onIndexChange(index === images.length - 1 ? 0 : index + 1);
          }}
          aria-label="Next photo"
        >
          <ChevronRight size={28} />
        </button>
      )}
      <span className="lightbox__counter">
        {index + 1} / {images.length}
      </span>
    </div>,
    document.body,
  );
}
