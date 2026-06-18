import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getRoomFallbackImage } from '../utils/roomImages';

export default function SafeImage({
  src,
  alt = '',
  className = '',
  style,
  fallbackSeed = 'room',
  fallbackIndex = 0,
}) {
  const fallback = getRoomFallbackImage(fallbackSeed, fallbackIndex);
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src || fallback);
    setFailed(!src);
  }, [src, fallback]);

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setFailed(false);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div className={`safe-image safe-image--placeholder ${className}`} style={style} aria-label={alt}>
        <ImageIcon size={28} />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={handleError}
    />
  );
}
