'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings,
  SkipBack, SkipForward, PictureInPicture2,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onComplete?: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ src, initialTime = 0, onTimeUpdate, onComplete }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedTime = useRef(0);
  const completeFired = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [seeking, setSeeking] = useState(false);

  // YouTube URL warning
  useEffect(() => {
    if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
      console.warn('[VideoPlayer] YouTube URLs are not supported. Please download the video first.');
    }
  }, [src]);

  // Initialize HLS or direct source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hlsInstance: { destroy: () => void } | null = null;

    const initVideo = async () => {
      if (src.includes('.m3u8')) {
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (initialTime > 0) video.currentTime = initialTime;
          });
          hlsInstance = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          if (initialTime > 0) video.currentTime = initialTime;
        }
      } else {
        video.src = src;
        video.load();
        if (initialTime > 0) {
          video.addEventListener('loadedmetadata', () => {
            video.currentTime = initialTime;
          }, { once: true });
        }
      }
    };

    initVideo();
    return () => { hlsInstance?.destroy(); };
  }, [src, initialTime]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || seeking) return;

    setCurrentTime(video.currentTime);

    // Report every 5 seconds
    const ct = Math.floor(video.currentTime);
    if (Math.abs(ct - lastReportedTime.current) >= 5) {
      lastReportedTime.current = ct;
      onTimeUpdate?.(ct);
    }

    // Mark complete at 90%
    if (!completeFired.current && video.duration > 0 && video.currentTime / video.duration >= 0.9) {
      completeFired.current = true;
      onComplete?.();
    }

    // Buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }, [onTimeUpdate, onComplete, seeking]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      resetHideTimer();
    }
  }, [playing, resetHideTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setMuted(prev => { video.muted = !prev; return !prev; });
          break;
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      container.requestFullscreen();
      setFullscreen(true);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setMuted(val === 0);
    video.muted = val === 0;
  }

  function changeSpeed(s: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }

  async function togglePiP() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {}
  }

  // Double tap to seek (mobile)
  const lastTap = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  function handleContainerClick(e: React.MouseEvent) {
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const timeDiff = now - lastTap.current.time;

    if (timeDiff < 300 && Math.abs(x - lastTap.current.x) < 50) {
      // Double tap
      const video = videoRef.current;
      if (!video) return;
      if (x < rect.width / 3) {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else if (x > (rect.width * 2) / 3) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      }
      lastTap.current = { time: 0, x: 0 };
    } else {
      lastTap.current = { time: now, x };
      // Single tap — toggle play
      setTimeout(() => {
        if (Date.now() - lastTap.current.time >= 280) {
          togglePlay();
        }
      }, 300);
    }
    resetHideTimer();
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        playsInline
        onClick={handleContainerClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) setDuration(video.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* Center play button (when paused) */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl hover:bg-primary transition-colors">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-2 sm:px-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar — taller on mobile for touch */}
        <div
          className="relative h-2 sm:h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/progress hover:h-2.5 transition-all"
          onClick={handleSeek}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="white" />}
          </button>

          {/* Skip back/forward */}
          <button
            onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
            className="text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10); }}
            className="text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-1.5 group/vol">
            <button
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                const newMuted = !muted;
                video.muted = newMuted;
                setMuted(newMuted);
              }}
              className="text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-primary h-1 cursor-pointer"
            />
          </div>

          {/* Time */}
          <span className="text-white/70 text-[10px] sm:text-xs font-mono ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white/70 hover:text-white transition-colors text-xs font-medium min-w-[44px] min-h-[44px] flex items-center justify-center rounded border border-white/20"
            >
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-card border border-border/50 rounded-xl p-1 shadow-xl min-w-[80px]">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-3 py-2.5 sm:py-1.5 text-xs rounded-lg transition-colors ${
                      speed === s ? 'bg-orange-500/20 text-primary' : 'text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP */}
          {'pictureInPictureEnabled' in document && (
            <button onClick={togglePiP} className="text-white/70 hover:text-white transition-colors hidden sm:block">
              <PictureInPicture2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
