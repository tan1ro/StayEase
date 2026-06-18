import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import { getRoomGalleryImages } from '../utils/roomImages';

const AUTO_SCROLL_MS = 4000;

export default function RoomImageCarousel({ photos = [], roomId = 'room', autoScrollMs = AUTO_SCROLL_MS }) {
  const images = getRoomGalleryImages(photos, roomId, Math.max(photos.length, 1));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const active = images[index] ?? images[0];

  const goToIndex = useCallback((nextIndex) => {
    setIndex((nextIndex + images.length) % images.length);
  }, [images.length]);

  const prev = (e) => {
    e?.stopPropagation();
    goToIndex(index - 1);
  };

  const next = (e) => {
    e?.stopPropagation();
    goToIndex(index + 1);
  };

  const goTo = (i) => (e) => {
    e.stopPropagation();
    goToIndex(i);
  };

  useEffect(() => {
    setIndex(0);
  }, [roomId, photos.length]);

  useEffect(() => {
    if (images.length <= 1 || paused || autoScrollMs <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    }, autoScrollMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [images.length, paused, autoScrollMs]);

  if (!images.length) {
    return <div className="carousel carousel--empty" data-testid="carousel-empty" />;
  }

  return (
    <div
      className="room-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="room-carousel__frame">
        <SafeImage
          src={active?.url}
          alt={`Room photo ${index + 1} of ${images.length}`}
          className="room-carousel__image"
          fallbackSeed={roomId}
          fallbackIndex={index}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="room-carousel__nav room-carousel__nav--prev"
              onClick={prev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="room-carousel__nav room-carousel__nav--next"
              onClick={next}
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
            <div className="room-carousel__dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`room-carousel__dot${i === index ? ' room-carousel__dot--active' : ''}`}
                  onClick={goTo(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .room-carousel {
          width: 100%;
          margin-bottom: 2rem;
        }
        .room-carousel__frame {
          position: relative;
          width: 100%;
          height: clamp(260px, 42vw, 420px);
          border-radius: 12px;
          overflow: hidden;
          background: var(--border, #e5e7eb);
        }
        .room-carousel--empty,
        .carousel.carousel--empty {
          min-height: 260px;
          border-radius: 12px;
          background: var(--border, #e5e7eb);
        }
        .room-carousel__image,
        .room-carousel__frame .safe-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: opacity 0.35s ease;
        }
        .room-carousel__frame .safe-image--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .room-carousel__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .room-carousel__nav:hover {
          transform: translateY(-50%) scale(1.05);
          background: #fff;
        }
        .room-carousel__nav--prev { left: 0.75rem; }
        .room-carousel__nav--next { right: 0.75rem; }
        .room-carousel__dots {
          position: absolute;
          bottom: 0.75rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          display: flex;
          gap: 0.35rem;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
        }
        .room-carousel__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: none;
          padding: 0;
          background: rgba(255, 255, 255, 0.45);
          cursor: pointer;
        }
        .room-carousel__dot--active {
          background: #fff;
          transform: scale(1.15);
        }
        @media (max-width: 768px) {
          .room-carousel {
            margin-bottom: 1.25rem;
          }
          .room-carousel__frame {
            height: 260px;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}
