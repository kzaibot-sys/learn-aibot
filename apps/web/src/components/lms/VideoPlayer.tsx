'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize,
  SkipBack, SkipForward, PictureInPicture2,
  Loader2, RotateCcw,
} from 'lucide-react';

/* ---------- types ---------- */

interface VideoPlayerProps {
  src: string;
  lessonId: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onComplete?: () => void;
}

/* ---------- helpers ---------- */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getStorageKey(lessonId: string): string {
  return `video-pos-${lessonId}`;
}

function getSavedPosition(lessonId: string): number {
  try {
    const val = localStorage.getItem(getStorageKey(lessonId));
    return val ? parseFloat(val) || 0 : 0;
  } catch {
    return 0;
  }
}

function savePosition(lessonId: string, time: number): void {
  try {
    localStorage.setItem(getStorageKey(lessonId), String(Math.floor(time)));
  } catch {
    // localStorage unavailable
  }
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

/* ---------- component ---------- */

export function VideoPlayer({
  src,
  lessonId,
  initialTime = 0,
  onTimeUpdate,
  onComplete,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedTime = useRef(0);
  const lastSavedTime = useRef(0);
  const completeFired = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const saveIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const serverReportIntervalRef = useRef<ReturnType<typeof setInterval>>();

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
  const [buffering, setBuffering] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{ side: 'left' | 'right'; key: number } | null>(null);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const [progressHover, setProgressHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Touch swipe refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const seekIndicatorKey = useRef(0);

  // Compute effective start time: max of localStorage and server initialTime
  const effectiveStartTime = useRef(Math.max(getSavedPosition(lessonId), initialTime));

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
    const startTime = effectiveStartTime.current;

    const setStartTime = () => {
      if (startTime > 0 && video.duration && startTime < video.duration - 1) {
        video.currentTime = startTime;
      }
    };

    const initVideo = async () => {
      if (src.includes('.m3u8')) {
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStartTime();
          });
          hlsInstance = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', setStartTime, { once: true });
        }
      } else {
        video.src = src;
        video.load();
        video.addEventListener('loadedmetadata', setStartTime, { once: true });
      }
    };

    initVideo();
    return () => { hlsInstance?.destroy(); };
  }, [src]);

  // Auto-save position to localStorage every 5 seconds
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        savePosition(lessonId, video.currentTime);
      }
    }, 5000);

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [lessonId]);

  // Report to server every 10 seconds
  useEffect(() => {
    serverReportIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        const ct = Math.floor(video.currentTime);
        if (Math.abs(ct - lastReportedTime.current) >= 10) {
          lastReportedTime.current = ct;
          onTimeUpdate?.(ct);
        }
      }
    }, 10000);

    return () => {
      if (serverReportIntervalRef.current) clearInterval(serverReportIntervalRef.current);
    };
  }, [onTimeUpdate]);

  // On unmount: save final position and report to server
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && video.currentTime > 0) {
        savePosition(lessonId, video.currentTime);
        onTimeUpdate?.(Math.floor(video.currentTime));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Time update handler (for UI only, no server reporting here)
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;

    setCurrentTime(video.currentTime);

    // Mark complete at 90%
    if (!completeFired.current && video.duration > 0 && video.currentTime / video.duration >= 0.9) {
      completeFired.current = true;
      onComplete?.();
    }

    // Buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }, [onComplete, isDragging]);

  // Buffering detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onPlaying = () => setBuffering(false);

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFSChange = () => {
      const isFS = !!document.fullscreenElement;
      setFullscreen(isFS);

      // Auto-rotate on mobile
      if (isTouchDevice() && screen.orientation) {
        try {
          if (isFS) {
            (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> })
              .lock('landscape').catch(() => {});
          } else {
            screen.orientation.unlock();
          }
        } catch {
          // Orientation lock not supported
        }
      }
    };

    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          resetHideTimer();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          resetHideTimer();
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          resetHideTimer();
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const newVol = Math.min(1, video.volume + 0.1);
            video.volume = newVol;
            setVolume(newVol);
            if (newVol > 0) { setMuted(false); video.muted = false; }
          }
          resetHideTimer();
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            const newVol = Math.max(0, video.volume - 0.1);
            video.volume = newVol;
            setVolume(newVol);
            if (newVol === 0) { setMuted(true); video.muted = true; }
          }
          resetHideTimer();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setMuted(prev => { video.muted = !prev; return !prev; });
          resetHideTimer();
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
    } else {
      container.requestFullscreen();
    }
  }

  // Seek on progress bar click
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  // Progress bar drag
  function handleProgressMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
    const progressBar = e.currentTarget;

    const onMove = (moveEvent: MouseEvent) => {
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      setCurrentTime(ratio * duration);
    };

    const onUp = (upEvent: MouseEvent) => {
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
      const video = videoRef.current;
      if (video) video.currentTime = ratio * duration;
      setCurrentTime(ratio * duration);
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Progress bar touch drag
  function handleProgressTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    e.stopPropagation();
    setIsDragging(true);
    const progressBar = e.currentTarget;
    const touch = e.touches[0];
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    setCurrentTime(ratio * duration);

    const onMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const t = moveEvent.touches[0];
      const r = progressBar.getBoundingClientRect();
      const rat = Math.max(0, Math.min(1, (t.clientX - r.left) / r.width));
      setCurrentTime(rat * duration);
    };

    const onEnd = (endEvent: TouchEvent) => {
      const t = endEvent.changedTouches[0];
      const r = progressBar.getBoundingClientRect();
      const rat = Math.max(0, Math.min(1, (t.clientX - r.left) / r.width));
      const video = videoRef.current;
      if (video) video.currentTime = rat * duration;
      setCurrentTime(rat * duration);
      setIsDragging(false);
      progressBar.removeEventListener('touchmove', onMove);
      progressBar.removeEventListener('touchend', onEnd);
    };

    progressBar.addEventListener('touchmove', onMove, { passive: false });
    progressBar.addEventListener('touchend', onEnd);
  }

  // Progress bar hover for time tooltip
  function handleProgressHover(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime({ time: ratio * duration, x: e.clientX - rect.left });
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

  // Show seek indicator overlay
  function showSeekOverlay(side: 'left' | 'right') {
    seekIndicatorKey.current += 1;
    setSeekIndicator({ side, key: seekIndicatorKey.current });
    setTimeout(() => {
      setSeekIndicator(prev => prev?.key === seekIndicatorKey.current ? null : prev);
    }, 600);
  }

  // Double tap to seek (mobile) + single tap toggle play
  const lastTap = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  function handleContainerClick(e: React.MouseEvent) {
    // Ignore clicks on controls area
    if ((e.target as HTMLElement).closest('[data-controls]')) return;

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
        showSeekOverlay('left');
      } else if (x > (rect.width * 2) / 3) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showSeekOverlay('right');
      }
      lastTap.current = { time: 0, x: 0 };
    } else {
      lastTap.current = { time: now, x };
      setTimeout(() => {
        if (Date.now() - lastTap.current.time >= 280) {
          togglePlay();
        }
      }, 300);
    }
    resetHideTimer();
  }

  // Touch swipe to seek
  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest('[data-controls]')) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    if ((e.target as HTMLElement).closest('[data-controls]')) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // Require horizontal swipe: |dx| > 60, |dy| < 40, duration < 400ms
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40 && elapsed < 400) {
      const video = videoRef.current;
      if (!video) return;
      if (dx > 0) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showSeekOverlay('right');
      } else {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showSeekOverlay('left');
      }
    }

    touchStartRef.current = null;
  }

  // Prevent right-click context menu
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-speed-menu]')) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [showSpeedMenu]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none"
      style={{ padding: fullscreen ? 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' : undefined }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); setHoverTime(null); }}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        playsInline
        controlsList="nodownload"
        disablePictureInPicture={false}
        onClick={handleContainerClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) setDuration(video.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          // Save final position on end
          const video = videoRef.current;
          if (video) {
            savePosition(lessonId, video.currentTime);
            onTimeUpdate?.(Math.floor(video.currentTime));
          }
        }}
        onContextMenu={handleContextMenu}
      />

      {/* Buffering spinner */}
      {buffering && playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      )}

      {/* Seek indicator overlay */}
      {seekIndicator && (
        <div
          key={seekIndicator.key}
          className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-10 animate-pulse ${
            seekIndicator.side === 'left' ? 'left-0 w-1/3' : 'right-0 w-1/3'
          }`}
        >
          <div className="flex flex-col items-center gap-1 bg-black/50 rounded-full px-5 py-3">
            {seekIndicator.side === 'left' ? (
              <RotateCcw className="w-6 h-6 text-white" />
            ) : (
              <RotateCcw className="w-6 h-6 text-white transform scale-x-[-1]" />
            )}
            <span className="text-white text-sm font-medium">
              {seekIndicator.side === 'left' ? '-10s' : '+10s'}
            </span>
          </div>
        </div>
      )}

      {/* Center play button (when paused and not buffering) */}
      {!playing && !buffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl hover:bg-primary hover:scale-110 transition-all duration-200">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div
        data-controls
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Gradient background for controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        <div className="relative px-3 sm:px-4 pb-3 pt-16">
          {/* Progress bar */}
          <div
            className={`relative mb-3 cursor-pointer group/progress ${
              progressHover || isDragging ? 'h-3' : 'h-1.5 sm:h-1'
            } transition-all duration-150`}
            onClick={handleSeek}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onMouseEnter={() => setProgressHover(true)}
            onMouseLeave={() => { setProgressHover(false); setHoverTime(null); }}
            onMouseMove={handleProgressHover}
          >
            {/* Track */}
            <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-[width] duration-200"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/30 transition-opacity duration-150 ${
                progressHover || isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: `calc(${progress}% - 8px)` }}
            />

            {/* Time tooltip on hover */}
            {hoverTime && (progressHover || isDragging) && (
              <div
                className="absolute -top-9 -translate-x-1/2 bg-background/90 text-foreground text-xs font-mono px-2 py-1 rounded-md shadow-lg pointer-events-none border border-border/30"
                style={{ left: `${hoverTime.x}px` }}
              >
                {formatTime(hoverTime.time)}
              </div>
            )}
          </div>

          {/* Bottom controls row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause with animation */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-all duration-200 min-w-[48px] min-h-[48px] flex items-center justify-center hover:scale-110"
            >
              {playing ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6" fill="white" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="white" />
              )}
            </button>

            {/* Skip back/forward — visible on desktop */}
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) { v.currentTime = Math.max(0, v.currentTime - 10); showSeekOverlay('left'); }
              }}
              className="text-white/70 hover:text-white transition-colors hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) { v.currentTime = Math.min(v.duration, v.currentTime + 10); showSeekOverlay('right'); }
              }}
              className="text-white/70 hover:text-white transition-colors hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume — desktop only */}
            <div className="hidden sm:flex items-center gap-1 group/vol">
              <button
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  const newMuted = !muted;
                  video.muted = newMuted;
                  setMuted(newMuted);
                }}
                className="text-white/70 hover:text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                <VolumeIcon className="w-5 h-5" />
              </button>
              <div className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-200">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-primary h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white/80 text-[11px] sm:text-xs font-mono ml-1 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Speed selector */}
            <div className="relative" data-speed-menu>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                className="text-white/70 hover:text-white transition-colors text-xs font-semibold min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/10"
              >
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-card border border-border/50 rounded-xl p-1.5 shadow-2xl min-w-[90px] backdrop-blur-md">
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); changeSpeed(s); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 text-xs rounded-lg transition-all ${
                        speed === s
                          ? 'bg-primary/20 text-primary font-semibold'
                          : 'text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <span>{s}x</span>
                      {speed === s && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP — desktop only */}
            {typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && (
              <button
                onClick={togglePiP}
                className="text-white/70 hover:text-white transition-colors hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center hover:scale-110"
            >
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
