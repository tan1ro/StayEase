import { useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

export default function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => {
    const v = videoRef.current;
    if (v?.requestFullscreen) v.requestFullscreen();
  };

  if (!src) return null;

  return (
    <div className="video-player">
      <video ref={videoRef} src={src} poster={poster} onEnded={() => setPlaying(false)} />
      <div className="video-player__controls">
        <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button type="button" onClick={fullscreen} aria-label="Fullscreen">
          <Maximize size={20} />
        </button>
      </div>
      <style>{`
        .video-player {
          position: relative;
          border-radius: var(--radius-card);
          overflow: hidden;
          background: #000;
        }
        .video-player video {
          width: 100%;
          display: block;
        }
        .video-player__controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
        }
        .video-player__controls button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
