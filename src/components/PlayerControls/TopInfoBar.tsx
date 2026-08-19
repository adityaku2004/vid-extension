import React from 'react';
import { ArrowLeft, ListVideo, Settings, Sliders, Ratio, Info, Bookmark } from 'lucide-react';
import { PlaylistItem, AspectRatioMode } from '../../types';
import { formatTime } from '../../utils/formatTime';
import { formatFileSize } from '../../utils/fileHelpers';
import { Tooltip } from '../Common/Tooltip';

interface TopInfoBarProps {
  currentVideo: PlaylistItem | null;
  duration: number;
  aspectRatio: AspectRatioMode;
  onBack: () => void;
  onTogglePlaylist: () => void;
  onToggleBookmarks?: () => void;
  onToggleSettings: () => void;
  onToggleEqualizer: () => void;
  onCycleAspectRatio: () => void;
  playlistCount: number;
  bookmarkCount?: number;
}

export const TopInfoBar: React.FC<TopInfoBarProps> = ({
  currentVideo,
  duration,
  aspectRatio,
  onBack,
  onTogglePlaylist,
  onToggleBookmarks,
  onToggleSettings,
  onToggleEqualizer,
  onCycleAspectRatio,
  playlistCount,
  bookmarkCount = 0
}) => {
  const metadata = currentVideo?.metadata;
  const resolution = metadata?.resolution || (duration > 0 ? 'HD 1080p' : '');
  const fileSize = metadata?.fileSize ? formatFileSize(metadata.fileSize) : '';

  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-4 md:px-6 py-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between pointer-events-auto transition-opacity duration-200">
      {/* Left side: Back button and Movie Title & Metadata */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        <Tooltip content="Close Player & Open Library">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to file library"
            className="p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Tooltip>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-white tracking-wide truncate max-w-md md:max-w-xl">
              {currentVideo?.title || 'Unknown Media'}
            </h1>
            {currentVideo?.isSample && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SAMPLE
              </span>
            )}
          </div>

          {/* Subtitle / Tech specs */}
          <div className="flex items-center gap-2.5 text-xs text-gray-400 font-mono-time mt-0.5">
            {resolution && <span>{resolution}</span>}
            {resolution && duration > 0 && <span>•</span>}
            {duration > 0 && <span>{formatTime(duration, duration >= 3600)}</span>}
            {fileSize && <span>•</span>}
            {fileSize && <span>{fileSize}</span>}
            {metadata?.videoType && (
              <>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline uppercase text-[11px] text-gray-500">
                  {metadata.videoType.split('/')[1] || metadata.videoType}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Aspect Ratio, Equalizer, Bookmarks, Playlist toggle, Settings */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <Tooltip content={`Aspect Ratio: ${aspectRatio.toUpperCase()}`} shortcut="A">
          <button
            type="button"
            onClick={onCycleAspectRatio}
            aria-label="Cycle aspect ratio"
            className="p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs font-mono-time font-medium backdrop-blur-md"
          >
            <Ratio className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] uppercase">{aspectRatio}</span>
          </button>
        </Tooltip>

        <Tooltip content="Audio Effects & Boost">
          <button
            type="button"
            onClick={onToggleEqualizer}
            aria-label="Audio Equalizer"
            className="p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-cyan-400 transition-colors backdrop-blur-md"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </Tooltip>

        {onToggleBookmarks && (
          <Tooltip content="Video Bookmarks" shortcut="Shift+M">
            <button
              type="button"
              onClick={onToggleBookmarks}
              aria-label="Toggle Bookmarks"
              className="relative p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-cyan-400 transition-colors backdrop-blur-md"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-black">
                  {bookmarkCount}
                </span>
              )}
            </button>
          </Tooltip>
        )}

        <Tooltip content="Playlist Queue">
          <button
            type="button"
            onClick={onTogglePlaylist}
            aria-label="Toggle Playlist"
            className="relative p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-cyan-400 transition-colors backdrop-blur-md"
          >
            <ListVideo className="w-4 h-4" />
            {playlistCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-black">
                {playlistCount}
              </span>
            )}
          </button>
        </Tooltip>

        <Tooltip content="Player Settings">
          <button
            type="button"
            onClick={onToggleSettings}
            aria-label="Open Settings"
            className="p-2 rounded-xl bg-black/40 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-cyan-400 transition-colors backdrop-blur-md"
          >
            <Settings className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
