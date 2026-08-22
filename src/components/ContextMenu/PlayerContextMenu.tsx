import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  PictureInPicture,
  Subtitles,
  Gauge,
  Sliders,
  Ratio,
  Info,
  Settings,
  Zap,
  Bookmark,
  BookmarkPlus,
  Camera,
  Wrench
} from 'lucide-react';
import { AspectRatioMode } from '../../types';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface PlayerContextMenuProps {
  position: ContextMenuPosition | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  isFullscreen: boolean;
  subtitlesEnabled: boolean;
  playbackRate: number;
  aspectRatio: AspectRatioMode;
  audioBoostEnabled: boolean;
  onTogglePlay: () => void;
  onSeekRelative: (seconds: number) => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onToggleSubtitles: () => void;
  onCycleSpeed: () => void;
  onCycleAspectRatio: () => void;
  onToggleAudioBoost: () => void;
  onOpenSettings: () => void;
  onShowStats: () => void;
  onAddBookmark?: () => void;
  onOpenBookmarks?: () => void;
  onTakeScreenshot?: () => void;
  onOpenDiagnostic?: () => void;
}

export const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({
  position,
  isOpen,
  onClose,
  isPlaying,
  isFullscreen,
  subtitlesEnabled,
  playbackRate,
  aspectRatio,
  audioBoostEnabled,
  onTogglePlay,
  onSeekRelative,
  onToggleFullscreen,
  onTogglePip,
  onToggleSubtitles,
  onCycleSpeed,
  onCycleAspectRatio,
  onToggleAudioBoost,
  onOpenSettings,
  onShowStats,
  onAddBookmark,
  onOpenBookmarks,
  onTakeScreenshot,
  onOpenDiagnostic
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', onClose);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  // Ensure menu doesn't overflow viewport boundaries
  const adjustedX = Math.min(position.x, window.innerWidth - 240);
  const adjustedY = Math.min(position.y, window.innerHeight - 440);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-56 p-1.5 rounded-2xl glass-panel bg-[#101114]/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
        <span>Cine Media Player</span>
        <span className="font-mono-time text-gray-400">v3.0-ext</span>
      </div>

      <button
        type="button"
        onClick={() => {
          onTogglePlay();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {isPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">Space</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSeekRelative(-10);
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span>Skip -10s</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">←</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onSeekRelative(10);
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <RotateCw className="w-4 h-4 text-gray-400" />
          <span>Skip +10s</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">→</span>
      </button>

      <div className="my-1 border-t border-white/5" />

      {/* Bookmarks options */}
      {onAddBookmark && (
        <button
          type="button"
          onClick={() => {
            onAddBookmark();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BookmarkPlus className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Add Bookmark</span>
          </div>
          <span className="text-[10px] font-mono-time text-gray-400">B</span>
        </button>
      )}

      {onOpenBookmarks && (
        <button
          type="button"
          onClick={() => {
            onOpenBookmarks();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-gray-400" />
            <span>View Bookmarks</span>
          </div>
        </button>
      )}

      {onTakeScreenshot && (
        <button
          type="button"
          onClick={() => {
            onTakeScreenshot();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-cyan-300 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Take Screenshot</span>
          </div>
          <span className="text-[10px] font-mono-time text-gray-500">Shift+S</span>
        </button>
      )}

      <div className="my-1 border-t border-white/5" />

      <button
        type="button"
        onClick={() => {
          onCycleSpeed();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Gauge className="w-4 h-4 text-gray-400" />
          <span>Speed: {playbackRate}x</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">S</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onToggleSubtitles();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Subtitles className="w-4 h-4 text-gray-400" />
          <span>Subtitles: {subtitlesEnabled ? 'On' : 'Off'}</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">C</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onCycleAspectRatio();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Ratio className="w-4 h-4 text-gray-400" />
          <span>Aspect Ratio: {aspectRatio.toUpperCase()}</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">A</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onToggleAudioBoost();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Audio Boost (200%)</span>
        </div>
        <span className={`text-[10px] font-bold ${audioBoostEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>
          {audioBoostEnabled ? 'ON' : 'OFF'}
        </span>
      </button>

      <div className="my-1 border-t border-white/5" />

      <button
        type="button"
        onClick={() => {
          onTogglePip();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <PictureInPicture className="w-4 h-4 text-gray-400" />
          <span>Picture in Picture</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">P</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onToggleFullscreen();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {isFullscreen ? <Minimize className="w-4 h-4 text-gray-400" /> : <Maximize className="w-4 h-4 text-gray-400" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </div>
        <span className="text-[10px] font-mono-time text-gray-500">F</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onShowStats();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-gray-400" />
          <span>Stats for Nerds</span>
        </div>
      </button>

      {onOpenDiagnostic && (
        <button
          type="button"
          onClick={() => {
            onOpenDiagnostic();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>MKV & Codec Diagnostic</span>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Player Settings</span>
        </div>
      </button>
    </div>
  );
};
