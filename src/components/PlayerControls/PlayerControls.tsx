import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  PictureInPicture,
  Subtitles,
  Gauge,
  Settings,
  Repeat,
  Sparkles,
  Bookmark,
  BookmarkPlus
} from 'lucide-react';
import { PlaylistItem, PlayerSettings, SubtitleSettings, AspectRatioMode, VideoBookmark } from '../../types';
import { formatTime, formatRemainingTime } from '../../utils/formatTime';
import { Timeline } from '../Timeline/Timeline';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { PlaybackSpeedMenu } from '../PlaybackSpeed/PlaybackSpeedMenu';
import { SubtitleMenu } from '../SubtitleMenu/SubtitleMenu';
import { Tooltip } from '../Common/Tooltip';

interface PlayerControlsProps {
  currentVideo: PlaylistItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPip: boolean;
  settings: PlayerSettings;
  subtitleSettings: SubtitleSettings;
  bookmarks?: VideoBookmark[];
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSeekRelative: (seconds: number) => void;
  onVolumeChange: (volume: number, muted?: boolean) => void;
  onToggleMute: () => void;
  onSelectSpeed: (speed: number) => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  onSelectSubtitleTrack: (trackId: string | null) => void;
  onAddCustomSubtitleTrack: (track: any) => void;
  onUpdateSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
  onUpdatePlayerSettings: (settings: Partial<PlayerSettings>) => void;
  onToggleSettings: () => void;
  onToggleBookmarks?: () => void;
  onQuickAddBookmark?: () => void;
  onSelectBookmark?: (bookmark: VideoBookmark) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentVideo,
  isPlaying,
  currentTime,
  duration,
  bufferedPercent,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  isPip,
  settings,
  subtitleSettings,
  bookmarks = [],
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onSelectSpeed,
  onToggleFullscreen,
  onTogglePip,
  onNextVideo,
  onPrevVideo,
  onSelectSubtitleTrack,
  onAddCustomSubtitleTrack,
  onUpdateSubtitleSettings,
  onUpdatePlayerSettings,
  onToggleSettings,
  onToggleBookmarks,
  onQuickAddBookmark,
  onSelectBookmark
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showRemainingTime, setShowRemainingTime] = useState(settings.showRemainingTime ?? false);

  const formattedCurrentTime = formatTime(currentTime, duration >= 3600);
  const formattedDuration = showRemainingTime
    ? formatRemainingTime(currentTime, duration)
    : formatTime(duration, duration >= 3600);

  const currentVideoBookmarks = bookmarks.filter((bm) => currentVideo && bm.videoId === currentVideo.id);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 px-4 md:px-6 pb-4 pt-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto transition-opacity duration-200 flex flex-col gap-2">
      {/* 1. Timeline Scrubber */}
      <div className="w-full">
        <Timeline
          currentTime={currentTime}
          duration={duration}
          bufferedPercent={bufferedPercent}
          onSeek={onSeek}
          accentColor={settings.themeAccent || '#00F0FF'}
          bookmarks={currentVideoBookmarks}
          onSelectBookmark={onSelectBookmark}
        />
      </div>

      {/* 2. Control Buttons Row */}
      <div className="flex items-center justify-between gap-2 md:gap-4 select-none">
        {/* Left Side: Playback buttons, skip, playlist nav, volume */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous Video */}
          <Tooltip content="Previous Video" shortcut="Shift+P">
            <button
              type="button"
              onClick={onPrevVideo}
              aria-label="Previous Video"
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Skip Backward 10s */}
          <Tooltip content={`Rewind ${settings.skipSeconds}s`} shortcut="←">
            <button
              type="button"
              onClick={() => onSeekRelative(-settings.skipSeconds)}
              aria-label={`Skip backward ${settings.skipSeconds} seconds`}
              className="p-2 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/10 transition-colors flex items-center gap-0.5 group"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[11px] font-mono-time font-bold group-hover:text-cyan-400">
                {settings.skipSeconds}
              </span>
            </button>
          </Tooltip>

          {/* Main Play/Pause Button */}
          <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space / K">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="p-3 mx-1 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black stroke-black" />
              ) : (
                <Play className="w-5 h-5 fill-black stroke-black ml-0.5" />
              )}
            </button>
          </Tooltip>

          {/* Skip Forward 10s */}
          <Tooltip content={`Forward ${settings.skipSeconds}s`} shortcut="→">
            <button
              type="button"
              onClick={() => onSeekRelative(settings.skipSeconds)}
              aria-label={`Skip forward ${settings.skipSeconds} seconds`}
              className="p-2 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/10 transition-colors flex items-center gap-0.5 group"
            >
              <span className="text-[11px] font-mono-time font-bold group-hover:text-cyan-400">
                {settings.skipSeconds}
              </span>
              <RotateCw className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Next Video */}
          <Tooltip content="Next Video" shortcut="N">
            <button
              type="button"
              onClick={onNextVideo}
              aria-label="Next Video"
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Volume Control */}
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
            audioBoostEnabled={settings.audioBoost}
          />

          {/* Time Counter (Click to switch between total and remaining) */}
          <div
            onClick={() => {
              const next = !showRemainingTime;
              setShowRemainingTime(next);
              onUpdatePlayerSettings({ showRemainingTime: next });
            }}
            role="button"
            tabIndex={0}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-time font-semibold text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer select-none transition-colors"
            title="Click to toggle remaining time"
          >
            <span className="text-white">{formattedCurrentTime}</span>
            <span className="text-gray-500">/</span>
            <span className={showRemainingTime ? 'text-cyan-300' : 'text-gray-400'}>
              {formattedDuration}
            </span>
          </div>
        </div>

        {/* Right Side: Speed, Subtitles, Bookmarks, PiP, Fullscreen, Settings */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Bookmark Button */}
          <Tooltip content="Add Bookmark / Open Bookmarks (B)" shortcut="B">
            <button
              type="button"
              onClick={onToggleBookmarks || onQuickAddBookmark}
              aria-label="Bookmarks panel"
              className="relative p-2 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Bookmark className="w-4 h-4" />
              {currentVideoBookmarks.length > 0 && (
                <span className="text-[10px] font-bold font-mono-time text-cyan-400">
                  {currentVideoBookmarks.length}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Loop toggle */}
          <Tooltip content={settings.loop ? 'Loop Enabled' : 'Loop Disabled'} shortcut="L">
            <button
              type="button"
              onClick={() => onUpdatePlayerSettings({ loop: !settings.loop })}
              aria-label="Toggle loop"
              className={`p-2 rounded-xl transition-colors ${
                settings.loop
                  ? 'text-cyan-400 bg-cyan-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Subtitles Menu Button */}
          <div className="relative">
            <Tooltip content="Subtitles / Closed Captions" shortcut="C">
              <button
                type="button"
                onClick={() => {
                  setShowSubMenu(!showSubMenu);
                  setShowSpeedMenu(false);
                }}
                aria-label="Subtitles menu"
                className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
                  subtitleSettings.enabled
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/40'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Subtitles className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase hidden md:inline">CC</span>
              </button>
            </Tooltip>

            {/* Subtitle Menu Popover */}
            <SubtitleMenu
              isOpen={showSubMenu}
              onClose={() => setShowSubMenu(false)}
              tracks={currentVideo?.subtitleTracks || []}
              selectedTrackId={currentVideo?.selectedSubtitleTrackId}
              settings={subtitleSettings}
              onSelectTrack={onSelectSubtitleTrack}
              onAddCustomTrack={onAddCustomSubtitleTrack}
              onUpdateSettings={onUpdateSubtitleSettings}
            />
          </div>

          {/* Playback Speed Button */}
          <div className="relative">
            <Tooltip content="Playback Speed" shortcut="S">
              <button
                type="button"
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowSubMenu(false);
                }}
                aria-label="Playback speed"
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-200 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono-time font-bold border border-white/5"
              >
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>{playbackRate === 1 ? '1.0x' : `${playbackRate}x`}</span>
              </button>
            </Tooltip>

            {/* Playback Speed Popover */}
            <PlaybackSpeedMenu
              currentSpeed={playbackRate}
              isOpen={showSpeedMenu}
              onClose={() => setShowSpeedMenu(false)}
              onSelectSpeed={onSelectSpeed}
            />
          </div>

          {/* Picture in Picture */}
          <Tooltip content="Picture-in-Picture" shortcut="P">
            <button
              type="button"
              onClick={onTogglePip}
              aria-label="Toggle Picture in Picture"
              className="p-2 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/10 transition-colors"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} shortcut="F / Double Click">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="p-2 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
