'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';

interface VideoPlayerProps {
  src: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

function extractYouTubeId(url: string): string | null {
  // Already an embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

function isYouTubeUrl(src: string): boolean {
  return src.includes('youtube.com') || src.includes('youtu.be');
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

  const youtubeId = useMemo(() => {
    if (!isYouTubeUrl(src)) return null;
    return extractYouTubeId(src);
  }, [src]);

  useEffect(() => {
    if (youtubeId) return;

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
  }, [src, initialTime, youtubeId]);

  if (youtubeId) {
    const startParam = initialTime > 0 ? `&start=${Math.floor(initialTime)}` : '';
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1${startParam}`;

    return (
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

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
