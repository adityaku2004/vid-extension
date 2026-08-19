import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface GestureOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeekRelative: (delta: number) => void;
  onToggleFullscreen: () => void;
  onFileDrop: (files: FileList) => void;
  skipSeconds?: number;
}

export const GestureOverlay: React.FC<GestureOverlayProps> = ({
  isPlaying,
  onTogglePlay,
  onSeekRelative,
  onToggleFullscreen,
  onFileDrop,
  skipSeconds = 10
}) => {
  const [rippleAction, setRippleAction] = useState<'play' | 'pause' | 'seek-back' | 'seek-fwd' | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const showActionRipple = (action: 'play' | 'pause' | 'seek-back' | 'seek-fwd') => {
    setRippleAction(action);
    setTimeout(() => {
      setRippleAction((prev) => (prev === action ? null : prev));
    }, 550);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary mouse click or touch
    if (e.button !== 0) return;

    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const widthRatio = clickX / rect.width;

    if (timeDiff < 300) {
      // DOUBLE CLICK
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickTimeRef.current = 0;

      if (widthRatio < 0.35) {
        // Left side double click -> Seek backward
        onSeekRelative(-skipSeconds);
        showActionRipple('seek-back');
      } else if (widthRatio > 0.65) {
        // Right side double click -> Seek forward
        onSeekRelative(skipSeconds);
        showActionRipple('seek-fwd');
      } else {
        // Center double click -> Fullscreen
        onToggleFullscreen();
      }
    } else {
      // SINGLE CLICK (delayed slightly to differentiate from double click)
      lastClickTimeRef.current = now;
      clickTimeoutRef.current = setTimeout(() => {
        onTogglePlay();
        showActionRipple(isPlaying ? 'pause' : 'play');
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  // Drag and Drop file handling onto player
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

  return (
    <div
      onPointerDown={handlePointerDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="absolute inset-0 z-10 select-none cursor-pointer"
    >
      {/* File Drop Highlight Indicator */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 text-center"
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

      {/* Ripple Feedback Animations */}
      <AnimatePresence>
        {rippleAction === 'play' && (
          <motion.div
            initial={{ opacity: 0.9, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 pointer-events-none"
          >
            <Play className="w-12 h-12 text-cyan-400 fill-cyan-400 ml-1" />
          </motion.div>
        )}

        {rippleAction === 'pause' && (
          <motion.div
            initial={{ opacity: 0.9, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-white/10 border border-white/20 pointer-events-none"
          >
            <Pause className="w-12 h-12 text-white fill-white" />
          </motion.div>
        )}

        {rippleAction === 'seek-back' && (
          <motion.div
            initial={{ opacity: 1, x: 0, scale: 0.9 }}
            animate={{ opacity: 0, x: -30, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute top-1/2 left-1/4 -translate-y-1/2 p-5 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex flex-col items-center pointer-events-none"
          >
            <RotateCcw className="w-8 h-8 text-cyan-400" />
            <span className="text-xs font-mono-time font-bold text-cyan-300 mt-1">-{skipSeconds}s</span>
          </motion.div>
        )}

        {rippleAction === 'seek-fwd' && (
          <motion.div
            initial={{ opacity: 1, x: 0, scale: 0.9 }}
            animate={{ opacity: 0, x: 30, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute top-1/2 right-1/4 -translate-y-1/2 p-5 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex flex-col items-center pointer-events-none"
          >
            <RotateCw className="w-8 h-8 text-cyan-400" />
            <span className="text-xs font-mono-time font-bold text-cyan-300 mt-1">+{skipSeconds}s</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
