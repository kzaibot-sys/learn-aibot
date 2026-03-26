import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayer({ src, initialTime = 0, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastReportedTime = useRef(0);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;

    const currentTime = Math.floor(video.currentTime);
    // Debounce: only report every 5 seconds
    if (Math.abs(currentTime - lastReportedTime.current) >= 5) {
      lastReportedTime.current = currentTime;
      onTimeUpdate(currentTime);
    }
  }, [onTimeUpdate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
      });
    } else {
      // Regular video
      video.src = src;
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialTime]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}
