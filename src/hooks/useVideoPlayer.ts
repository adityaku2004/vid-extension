import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistItem, PlayerSettings, SubtitleSettings, SubtitleCue, AspectRatioMode } from '../types';
import { extensionStorage } from '../utils/extensionStorage';

interface UseVideoPlayerProps {
  currentVideo: PlaylistItem | null;
  settings: PlayerSettings;
  subtitleSettings: SubtitleSettings;
  onVideoEnd?: () => void;
  onShowToast?: (text: string) => void;
}

export function useVideoPlayer({
  currentVideo,
  settings,
  subtitleSettings,
  onVideoEnd,
  onShowToast
}: UseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(settings.volume ?? 1);
  const [isMuted, setIsMuted] = useState(settings.isMuted ?? false);
  const [playbackRate, setPlaybackRate] = useState(settings.defaultSpeed ?? 1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>(settings.defaultAspectRatio ?? 'contain');
  const [error, setError] = useState<string | null>(null);
  const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  // Seeking & Buffering optimization refs
  const targetSeekTimeRef = useRef<number | null>(null);
  const lastSeekTimestampRef = useRef<number>(0);
  const accumulatedDeltaRef = useRef<number>(0);
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSeekingInternalRef = useRef<boolean>(false);

  // Initialize and attach Web Audio Gain Node for Audio Boost
  const setupAudioGraph = useCallback(() => {
    if (!videoRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(videoRef.current);
      const gain = ctx.createGain();

      source.connect(gain);
      gain.connect(ctx.destination);

      audioContextRef.current = ctx;
      audioSourceRef.current = source;
      gainNodeRef.current = gain;
    } catch (e) {
      console.warn('Audio Context init note (may already be attached):', e);
    }
  }, []);

  // Update volume & gain
  const updateVolume = useCallback((newVol: number, muted?: boolean) => {
    const video = videoRef.current;
    if (!video) return;

    const targetMute = muted !== undefined ? muted : isMuted;
    const clampedVol = Math.max(0, Math.min(settings.audioBoost ? 2.0 : 1.0, newVol));

    setVolume(clampedVol);
    setIsMuted(targetMute);

    video.muted = targetMute;

    if (clampedVol > 1.0) {
      video.volume = 1.0;
      setupAudioGraph();
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = targetMute ? 0 : clampedVol;
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
    } else {
      video.volume = clampedVol;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = targetMute ? 0 : 1.0;
      }
    }
  }, [isMuted, settings.audioBoost, setupAudioGraph]);

  // Play / Pause handling
  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    try {
      if (video.paused || video.ended) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Playback toggle error:', err);
      }
    }
  }, []);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      await video.play();
      setIsPlaying(true);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Play error:', err);
      }
    }
  }, []);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, []);

  // Seek relative or absolute with fast keyframe seeking & optimistic state
  const seekTo = useCallback(
    (targetTime: number, options?: { fast?: boolean }) => {
      const video = videoRef.current;
      if (!video || !isFinite(duration) || duration <= 0) return;

      const clampedTime = Math.max(0, Math.min(duration, targetTime));
      targetSeekTimeRef.current = clampedTime;
      isSeekingInternalRef.current = true;
      lastSeekTimestampRef.current = performance.now();

      // Immediately update React time state optimistically for 0ms UI latency
      setCurrentTime(clampedTime);

      // Perform fast keyframe seek if supported by browser media engine
      const useFast = options?.fast !== false;
      const mediaEl = video as HTMLVideoElement & { fastSeek?: (time: number) => void };

      if (useFast && typeof mediaEl.fastSeek === 'function') {
        try {
          mediaEl.fastSeek(clampedTime);
        } catch {
          video.currentTime = clampedTime;
        }
      } else {
        video.currentTime = clampedTime;
      }

      // Debounce saving playback position to IndexedDB / storage so rapid seeking doesn't block I/O
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
      if (currentVideo) {
        savePositionTimeoutRef.current = setTimeout(() => {
          extensionStorage.savePlaybackPosition(currentVideo.id, clampedTime);
        }, 600);
      }
    },
    [duration, currentVideo]
  );

  const seekRelative = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const now = performance.now();
      const isRapidSuccession =
        targetSeekTimeRef.current !== null &&
        now - lastSeekTimestampRef.current < 450;

      // Base seek target on accumulated pending target if user is tapping quickly
      const baseTime = isRapidSuccession && targetSeekTimeRef.current !== null
        ? targetSeekTimeRef.current
        : video.currentTime || 0;

      // Update cumulative delta tracking for toast notification
      if (isRapidSuccession) {
        accumulatedDeltaRef.current += deltaSeconds;
      } else {
        accumulatedDeltaRef.current = deltaSeconds;
      }

      const newTarget = Math.max(0, Math.min(duration || Infinity, baseTime + deltaSeconds));
      seekTo(newTarget, { fast: true });

      const totalDelta = accumulatedDeltaRef.current;
      onShowToast?.(`${totalDelta > 0 ? '+' : ''}${totalDelta}s`);
    },
    [duration, seekTo, onShowToast]
  );

  // Change playback speed
  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    onShowToast?.(`Speed ${rate}x`);
  }, [onShowToast]);

  // Picture in Picture
  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPip(true);
      } else {
        onShowToast?.('Picture-in-Picture not supported');
      }
    } catch (err) {
      console.warn('PiP error:', err);
      onShowToast?.('Failed to toggle Picture-in-Picture');
    }
  }, [onShowToast]);

  // Calculate Subtitles
  useEffect(() => {
    if (!subtitleSettings.enabled || !currentVideo) {
      setActiveCue(null);
      return;
    }

    const selectedTrack = currentVideo.subtitleTracks.find(
      (t) => t.id === currentVideo.selectedSubtitleTrackId
    );

    if (!selectedTrack || !selectedTrack.cues || selectedTrack.cues.length === 0) {
      setActiveCue(null);
      return;
    }

    // Apply subtitle sync offset
    const adjustedTime = currentTime - (subtitleSettings.syncOffset || 0);

    const matchingCue = selectedTrack.cues.find(
      (cue) => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime
    );

    setActiveCue(matchingCue || null);
  }, [currentTime, subtitleSettings.enabled, subtitleSettings.syncOffset, currentVideo]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const checkAudioState = () => {
      const hasMetadataUnsupported = currentVideo?.metadata?.hasUnsupportedVideoCodec || currentVideo?.metadata?.isAudioOnly;
      if (hasMetadataUnsupported) {
        setIsAudioOnly(true);
      } else if (video.videoWidth === 0 && (video.duration > 0 || video.currentTime > 0)) {
        setIsAudioOnly(true);
      } else if (video.videoWidth > 0) {
        setIsAudioOnly(false);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      checkAudioState();
    };
    const onPause = () => setIsPlaying(false);

    const onWaiting = () => {
      // Debounce buffering spinner by 200ms so rapid key seeks don't flash intrusive loading spinners
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = setTimeout(() => {
        setIsBuffering(true);
      }, 200);
    };

    const onPlaying = () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
      setIsBuffering(false);
      setIsPlaying(true);
      setError(null);
      checkAudioState();
    };

    const onSeeked = () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
      setIsBuffering(false);
      isSeekingInternalRef.current = false;
      targetSeekTimeRef.current = null;
    };

    const onCanPlay = () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
      setIsBuffering(false);
    };

    const onTimeUpdate = () => {
      const now = performance.now();
      const isRecentlySeeked = now - lastSeekTimestampRef.current < 250;

      // Only update from video.currentTime if we are not actively seeking or waiting for a recent seek to settle
      if (!isSeeking && !isRecentlySeeked && !isSeekingInternalRef.current) {
        setCurrentTime(video.currentTime);
      }

      if (video.currentTime > 0.5 && video.videoWidth === 0 && (video.duration > 0 || !video.paused)) {
        setIsAudioOnly(true);
      }

      // Update buffer progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const dur = video.duration || 1;
        setBufferedPercent(Math.min(100, (bufferedEnd / dur) * 100));
      }

      // Periodically record playback position (debounced)
      if (currentVideo && Math.floor(video.currentTime) % 5 === 0 && !isRecentlySeeked) {
        extensionStorage.savePlaybackPosition(currentVideo.id, video.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsBuffering(false);
      setError(null);
      checkAudioState();

      // Apply initial rate & volume
      video.playbackRate = playbackRate;
      video.muted = isMuted;
      video.volume = Math.min(1, volume);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (settings.loop) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        onVideoEnd?.();
      }
    };

    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      const mediaError = video.error;
      let msg = 'Unable to play this video format.';
      if (mediaError?.code === 3) msg = 'Video decoding error occurred.';
      if (mediaError?.code === 4) msg = 'Format or codec not supported by browser.';
      setError(msg);
    };

    const onEnterPip = () => setIsPip(true);
    const onLeavePip = () => setIsPip(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('enterpictureinpicture', onEnterPip);
    video.addEventListener('leavepictureinpicture', onLeavePip);

    return () => {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('enterpictureinpicture', onEnterPip);
      video.removeEventListener('leavepictureinpicture', onLeavePip);
    };
  }, [currentVideo, isSeeking, playbackRate, isMuted, volume, settings.loop, onVideoEnd]);

  // Clean up AudioContext and timers on unmount
  useEffect(() => {
    return () => {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      if (savePositionTimeoutRef.current) clearTimeout(savePositionTimeoutRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    bufferedPercent,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    isSeeking,
    setIsSeeking,
    isPip,
    aspectRatio,
    setAspectRatio,
    error,
    setError,
    activeCue,
    isAudioOnly,
    setIsAudioOnly,
    togglePlay,
    play,
    pause,
    seekTo,
    seekRelative,
    updateVolume,
    changePlaybackRate,
    togglePip
  };
}
