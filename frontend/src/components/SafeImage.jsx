import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getRoomFallbackImage } from '../utils/roomImages';

export default function SafeImage({
  src,
  alt = '',
  className = '',
  fallbackSeed = 'room',
  fallbackIndex = 0,
}) {
  const fallback = getRoomFallbackImage(fallbackSeed, fallbackIndex);
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [failed, setFailed] = useState(!src);

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
      <div className={`safe-image safe-image--placeholder ${className}`} aria-label={alt}>
        <ImageIcon size={28} />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}
