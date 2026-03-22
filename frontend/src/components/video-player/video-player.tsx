"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  onProgress?: (time: number) => void;
  resumeTime?: number;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function VideoPlayer({ src, onProgress, resumeTime }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumeAppliedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    resumeAppliedRef.current = false;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (!resumeAppliedRef.current && typeof resumeTime === "number" && resumeTime > 0) {
        video.currentTime = resumeTime;
        resumeAppliedRef.current = true;
      }
    };
    const onTimeUpdate = () => {
      const seconds = video.currentTime || 0;
      setCurrentTime(seconds);
      onProgress?.(seconds);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onDurationChange = () => setDuration(video.duration || 0);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("durationchange", onDurationChange);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("durationchange", onDurationChange);
    };
  }, [onProgress, resumeTime, src]);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      void video.play();
      return;
    }
    video.pause();
  };

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const next = Math.max(0, Math.min(duration || 0, seconds));
    video.currentTime = next;
    setCurrentTime(next);
  };

  const changeVolume = (next: number) => {
    const normalized = Math.max(0, Math.min(1, next));
    setVolume(normalized);
    if (videoRef.current) {
      videoRef.current.volume = normalized;
    }
  };

  const changePlaybackRate = (next: number) => {
    setPlaybackRate(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = next;
    }
  };

  const enterFullscreen = async () => {
    if (!containerRef.current) {
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await containerRef.current.requestFullscreen();
  };

  return (
    <div ref={containerRef} className="relative bg-black">
      <video ref={videoRef} src={src} className="h-auto w-full" preload="metadata" playsInline />

      <div className="border-t border-white/10 bg-black/70 p-3">
        <div className="mb-3 h-1.5 w-full rounded-full bg-white/20">
          <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0)}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="w-full accent-teal-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-white">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            {isPlaying ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            type="button"
            onClick={() => seekTo(currentTime - 10)}
            className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10"
          >
            -10s
          </button>
          <button
            type="button"
            onClick={() => seekTo(currentTime + 10)}
            className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10"
          >
            +10s
          </button>

          <p className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>

          <div className="ml-auto inline-flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-xs">
              <Volume2 className="h-3.5 w-3.5" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => changeVolume(Number(event.target.value))}
                className="w-20 accent-teal-400"
              />
            </label>

            <select
              value={playbackRate}
              onChange={(event) => changePlaybackRate(Number(event.target.value))}
              className="rounded-lg border border-white/20 bg-black px-2 py-1.5 text-xs"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button
              type="button"
              onClick={() => void enterFullscreen()}
              className="inline-flex items-center rounded-lg border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

