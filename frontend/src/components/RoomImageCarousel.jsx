import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import { getRoomGalleryImages } from '../utils/roomImages';

export default function RoomImageCarousel({ photos = [], roomId = 'room' }) {
  const images = getRoomGalleryImages(photos, roomId, photos.length || 1);
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  if (!images.length) {
    return <div className="carousel carousel--empty" data-testid="carousel-empty" />;
  }

  return (
    <div className="carousel">
      <SafeImage
        src={images[index]?.url}
        alt=""
        className="carousel__image"
        fallbackSeed={roomId}
        fallbackIndex={index}
      />
      {images.length > 1 && (
        <>
          <button type="button" className="carousel__nav carousel__nav--prev" onClick={prev} aria-label="Previous">
            <ChevronLeft size={24} />
          </button>
          <button type="button" className="carousel__nav carousel__nav--next" onClick={next} aria-label="Next">
            <ChevronRight size={24} />
          </button>
          <div className="carousel__dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel__dot ${i === index ? 'carousel__dot--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
      <style>{`
        .carousel {
          position: relative;
          border-radius: var(--radius-card);
          overflow: hidden;
          aspect-ratio: 16/10;
          background: var(--gradient-subtle);
        }
        .carousel--empty { min-height: 280px; }
        .carousel__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .carousel__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: var(--card-bg);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .carousel__nav--prev { left: 1rem; }
        .carousel__nav--next { right: 1rem; }
        .carousel__dots {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.4rem;
        }
        .carousel__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
        }
        .carousel__dot--active { background: #fff; }
      `}</style>
    </div>
  );
}
