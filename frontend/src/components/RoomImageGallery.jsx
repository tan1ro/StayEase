import { useEffect, useState } from 'react';
import { Grid3x3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import { getRoomGalleryImages } from '../utils/roomImages';

export default function RoomImageGallery({ photos = [], roomId, title = 'Room', initialPhotoId = '' }) {
  const images = getRoomGalleryImages(photos, roomId, 5);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!initialPhotoId || !photos.length) return;
    const index = photos.findIndex(
      (photo) => photo.public_id === initialPhotoId || photo.url?.includes(initialPhotoId),
    );
    if (index >= 0) setLightbox(index);
  }, [initialPhotoId, photos]);

  const openLightbox = (index) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setLightbox((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="photo-gallery" data-testid="photo-gallery">
        <button type="button" className="photo-gallery__main" onClick={() => openLightbox(0)}>
          <SafeImage
            src={images[0].url}
            alt={title}
            className="photo-gallery__image"
            fallbackSeed={roomId}
            fallbackIndex={0}
          />
        </button>
        <div className="photo-gallery__grid">
          {images.slice(1, 5).map((photo, idx) => (
            <button
              key={idx}
              type="button"
              className="photo-gallery__thumb"
              onClick={() => openLightbox(idx + 1)}
            >
              <SafeImage
                src={photo.url}
                alt={`${title} ${idx + 2}`}
                className="photo-gallery__image"
                fallbackSeed={roomId}
                fallbackIndex={idx + 1}
              />
              {idx === 3 && images.length > 1 && (
                <span className="photo-gallery__show-all">
                  <Grid3x3 size={16} /> Show all photos
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button type="button" className="lightbox__close" onClick={closeLightbox} aria-label="Close">
            <X size={20} />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Previous">
            <ChevronLeft size={28} />
          </button>
          <SafeImage
            src={images[lightbox].url}
            alt={title}
            className="lightbox__image"
            fallbackSeed={roomId}
            fallbackIndex={lightbox}
          />
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={next} aria-label="Next">
            <ChevronRight size={28} />
          </button>
          <span className="lightbox__counter">{lightbox + 1} / {images.length}</span>
        </div>
      )}
    </>
  );
}
