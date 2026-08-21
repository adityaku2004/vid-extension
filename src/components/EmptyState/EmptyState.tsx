import React, { useRef, useState } from 'react';
import {
  Film,
  FolderOpen,
  Subtitles,
  Settings,
  Keyboard,
  Play,
  Shield,
  Layers
} from 'lucide-react';
import { PlaylistItem } from '../../types';

interface EmptyStateProps {
  onOpenFiles: (files: FileList) => void;
  onSelectSample?: (video: PlaylistItem) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenFiles,
  onOpenSettings,
  onOpenShortcuts
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
      onOpenFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-y-auto selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b0d13] rounded-[14px] flex items-center justify-center">
              <Film className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-white">
                VLC MEDIA PLAYER
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest">
                EXTENSION
              </span>
            </div>
            <p className="text-xs text-gray-400">Desktop-grade local media playback</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Hotkeys</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Player settings"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Drag & Drop / Open File Hero Card */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-auto py-8">
        <div
          className={`relative rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 border-2 ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-2xl shadow-cyan-500/20'
              : 'border-white/10 bg-[#101114]/90 glass-panel shadow-2xl'
          }`}
        >
          {/* Animated Central Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Play className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 fill-cyan-400/20 stroke-cyan-400 ml-1 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Open Video or Movie File
          </h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed mb-8">
            Drag and drop any local video file here, or select files directly from your computer for smooth client-side playback.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm tracking-wide transition-all shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Browse Local Video</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,.mkv,.mp4,.webm,.mov,.m4v,.ogv,.avi"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => subtitleInputRef.current?.click()}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white font-semibold text-sm transition-all border border-white/10 flex items-center gap-2 active:scale-95"
            >
              <Subtitles className="w-4 h-4 text-cyan-400" />
              <span>Load Subtitles (.srt / .vtt / .ass)</span>
            </button>
            <input
              ref={subtitleInputRef}
              type="file"
              accept=".srt,.vtt,.ass,.ssa,.sub,.sbv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
            <span className="text-gray-500 font-medium">Supported Formats:</span>
            {['MKV (Matroska)', 'MP4 (H.264 / AV1)', 'WebM (VP9)', 'MOV', 'M4V', 'Embedded Subs (SRT/ASS)'].map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/5 font-mono-time text-[11px] text-cyan-300"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Features Bar */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Zero Data Uploads • 100% Private</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>VLC Audio Boost & Multi-Track SRT</span>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 font-mono-time">
          VLC WebExtension Core • Chrome & Firefox Compatible
        </div>
      </footer>
    </div>
  );
};
