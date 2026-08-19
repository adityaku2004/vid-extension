import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  UploadCloud,
  Volume2,
  Volume1,
  VolumeX,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface GestureOverlayProps {
  isPlaying: boolean;
  volume?: number;
  isMuted?: boolean;
  audioBoost?: boolean;
  onTogglePlay: () => void;
  onSeekRelative: (delta: number) => void;
  onVolumeChange?: (newVolume: number, isMuted?: boolean) => void;
  onToggleFullscreen: () => void;
  onFileDrop: (files: FileList) => void;
  skipSeconds?: number;
}

export const GestureOverlay: React.FC<GestureOverlayProps> = ({
  isPlaying,
  volume = 1,
  isMuted = false,
  audioBoost = true,
  onTogglePlay,
  onSeekRelative,
  onVolumeChange,
  onToggleFullscreen,
  onFileDrop,
  skipSeconds = 10
}) => {
  const [rippleAction, setRippleAction] = useState<'play' | 'pause' | 'seek-back' | 'seek-fwd' | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [volumeHud, setVolumeHud] = useState<{ visible: boolean; volume: number; isMuted: boolean }>({
    visible: false,
    volume,
    isMuted
  });

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeHudTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Swipe gesture tracking state
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const startVolumeRef = useRef<number>(volume);
  const isSwipingRef = useRef<boolean>(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Sync volume HUD if volume changes externally while HUD is active
  useEffect(() => {
    if (volumeHud.visible) {
      setVolumeHud((prev) => ({ ...prev, volume, isMuted }));
    }
  }, [volume, isMuted, volumeHud.visible]);

  const showActionRipple = (action: 'play' | 'pause' | 'seek-back' | 'seek-fwd') => {
    setRippleAction(action);
    setTimeout(() => {
      setRippleAction((prev) => (prev === action ? null : prev));
    }, 600);
  };

  const showVolumeHudTemporarily = useCallback((vol: number, muted: boolean) => {
    setVolumeHud({ visible: true, volume: vol, isMuted: muted });
    if (volumeHudTimeoutRef.current) {
      clearTimeout(volumeHudTimeoutRef.current);
    }
    volumeHudTimeoutRef.current = setTimeout(() => {
      setVolumeHud((prev) => ({ ...prev, visible: false }));
    }, 1200);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button (left mouse button or touch)
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    isPointerDownRef.current = true;
    pointerStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now()
    };
    startVolumeRef.current = isMuted ? 0 : volume;
    isSwipingRef.current = false;

    // Capture pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = currentX - pointerStartRef.current.x;
    const deltaY = pointerStartRef.current.y - currentY; // Upward swipe is positive deltaY

    // Determine if user has begun a vertical swipe on the right side
    const isRightSide = pointerStartRef.current.x > rect.width * 0.45;

    if (!isSwipingRef.current) {
      if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX) && isRightSide) {
        isSwipingRef.current = true;
        // Cancel single click action
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
      }
    }

    if (isSwipingRef.current && onVolumeChange) {
      const maxVolume = audioBoost ? 2.0 : 1.0;
      // 240px vertical travel covers full 0-100% volume (or 0-200%)
      const sensitivity = 240;
      const volumeDelta = (deltaY / sensitivity) * maxVolume;
      const nextVolume = Math.max(0, Math.min(maxVolume, startVolumeRef.current + volumeDelta));

      onVolumeChange(nextVolume, false);
      showVolumeHudTemporarily(nextVolume, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    // If user was swiping (e.g. adjusting volume), don't trigger click / double-click
    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const widthRatio = clickX / rect.width;
    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    const distDiff = Math.hypot(clickX - lastClickPosRef.current.x, clickY - lastClickPosRef.current.y);

    if (timeDiff < 320 && distDiff < 50) {
      // DOUBLE TAP / DOUBLE CLICK DETECTED
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickTimeRef.current = 0;

      if (widthRatio < 0.4) {
        // Left side double-click -> Seek backward
        onSeekRelative(-skipSeconds);
        showActionRipple('seek-back');
      } else if (widthRatio > 0.6) {
        // Right side double-click -> Seek forward
        onSeekRelative(skipSeconds);
        showActionRipple('seek-fwd');
      } else {
        // Center double-click -> Toggle fullscreen
        onToggleFullscreen();
      }
    } else {
      // SINGLE TAP / SINGLE CLICK (delayed slightly to disambiguate from double-click)
      lastClickTimeRef.current = now;
      lastClickPosRef.current = { x: clickX, y: clickY };

      clickTimeoutRef.current = setTimeout(() => {
        onTogglePlay();
        showActionRipple(isPlaying ? 'pause' : 'play');
        clickTimeoutRef.current = null;
      }, 260);
    }
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    isSwipingRef.current = false;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };

  // Drag and Drop file handling onto player surface
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  // Calculate volume HUD percentage and bar height
  const effectiveVolume = volumeHud.isMuted ? 0 : volumeHud.volume;
  const volumePercentage = Math.round(effectiveVolume * 100);
  const maxPossibleVolume = audioBoost ? 200 : 100;
  const barFillPercent = Math.min(100, (volumePercentage / maxPossibleVolume) * 100);

  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="absolute inset-0 z-10 select-none cursor-pointer touch-none"
    >
      {/* File Drop Highlight Indicator */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
          >
            <UploadCloud className="w-16 h-16 text-cyan-400 animate-bounce mb-3" />
            <h3 className="text-xl font-bold text-white tracking-wide">
              Drop Video or Subtitles to Play
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Loads immediately with local client-side playback
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume HUD Indicator (Visible during right-side swipe gesture) */}
      <AnimatePresence>
        {volumeHud.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-1/2 right-8 md:right-16 -translate-y-1/2 z-30 p-4 rounded-3xl bg-black/75 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col items-center gap-3 pointer-events-none min-w-[76px]"
          >
            {/* Volume Icon */}
            <div className="p-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              {effectiveVolume === 0 ? (
                <VolumeX className="w-6 h-6 text-red-400" />
              ) : effectiveVolume < 0.5 ? (
                <Volume1 className="w-6 h-6 text-cyan-300" />
              ) : (
                <Volume2 className="w-6 h-6 text-cyan-300" />
              )}
            </div>

            {/* Vertical Volume Gauge Track */}
            <div className="relative w-3.5 h-32 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10 flex flex-col justify-end">
              <div
                className={`w-full rounded-full transition-all duration-75 ${
                  volumePercentage > 100
                    ? 'bg-gradient-to-t from-cyan-500 via-yellow-400 to-red-500 shadow-md shadow-yellow-500/30'
                    : 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-md shadow-cyan-500/30'
                }`}
                style={{ height: `${barFillPercent}%` }}
              />
            </div>

            {/* Volume Percentage Value */}
            <div className="flex flex-col items-center">
              <span className="font-mono-time font-bold text-sm text-white tracking-tight">
                {volumePercentage}%
              </span>
              {volumePercentage > 100 && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-400 tracking-wider uppercase mt-0.5">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Boost</span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple Feedback Animations for Tap / Double Tap */}
      <AnimatePresence>
        {rippleAction === 'play' && (
          <motion.div
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-cyan-500/25 border border-cyan-400/40 pointer-events-none shadow-2xl"
          >
            <Play className="w-14 h-14 text-cyan-400 fill-cyan-400 ml-1" />
          </motion.div>
        )}

        {rippleAction === 'pause' && (
          <motion.div
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-white/15 border border-white/25 pointer-events-none shadow-2xl"
          >
            <Pause className="w-14 h-14 text-white fill-white" />
          </motion.div>
        )}

        {/* Double-Tap Backward on Left Side */}
        {rippleAction === 'seek-back' && (
          <motion.div
            initial={{ opacity: 1, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, x: -40, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/4 -translate-y-1/2 p-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex flex-col items-center pointer-events-none shadow-2xl backdrop-blur-xs"
          >
            <RotateCcw className="w-10 h-10 text-cyan-400" />
            <span className="text-xs font-mono-time font-bold text-cyan-300 mt-1.5 whitespace-nowrap">
              -{skipSeconds}s
            </span>
          </motion.div>
        )}

        {/* Double-Tap Forward on Right Side */}
        {rippleAction === 'seek-fwd' && (
          <motion.div
            initial={{ opacity: 1, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, x: 40, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 right-1/4 -translate-y-1/2 p-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex flex-col items-center pointer-events-none shadow-2xl backdrop-blur-xs"
          >
            <RotateCw className="w-10 h-10 text-cyan-400" />
            <span className="text-xs font-mono-time font-bold text-cyan-300 mt-1.5 whitespace-nowrap">
              +{skipSeconds}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
