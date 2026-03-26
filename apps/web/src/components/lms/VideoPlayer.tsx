'use client';

import { useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayer({ src, initialTime = 0, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedTime = useRef(0);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;

    const currentTime = Math.floor(video.currentTime);
    if (Math.abs(currentTime - lastReportedTime.current) >= 5) {
      lastReportedTime.current = currentTime;
      onTimeUpdate(currentTime);
    }
  }, [onTimeUpdate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const initHls = async () => {
      if (src.includes('.m3u8')) {
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (initialTime > 0) video.currentTime = initialTime;
          });
          return () => hls.destroy();
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          if (initialTime > 0) video.currentTime = initialTime;
        }
      } else {
        video.src = src;
        if (initialTime > 0) video.currentTime = initialTime;
      }
    };

    initHls();
  }, [src, initialTime]);

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
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
