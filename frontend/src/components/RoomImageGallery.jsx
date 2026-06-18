import { useEffect, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import SafeImage from './SafeImage';
import ImageLightbox from './ImageLightbox';
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

  const lightboxImages = images.map((photo, idx) => ({
    url: photo.url,
    alt: idx === 0 ? title : `${title} ${idx + 1}`,
    fallbackSeed: roomId,
    fallbackIndex: idx,
  }));

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

      <ImageLightbox
        open={lightbox !== null}
        index={lightbox}
        images={lightboxImages}
        onClose={closeLightbox}
        onIndexChange={setLightbox}
        roomId={roomId}
        ariaLabel={`${title} photos`}
      />
    </>
  );
}
