import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  PlaylistItem,
  PlayerSettings,
  SubtitleSettings,
  SubtitleTrack,
  AspectRatioMode,
  VideoBookmark
} from '../../types';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TopInfoBar } from '../PlayerControls/TopInfoBar';
import { PlayerControls } from '../PlayerControls/PlayerControls';
import { SubtitleOverlay } from './SubtitleOverlay';
import { GestureOverlay } from './GestureOverlay';
import { PlayerContextMenu } from '../ContextMenu/PlayerContextMenu';
import { ResumePrompt } from '../ResumePrompt/ResumePrompt';
import { extensionStorage } from '../../utils/extensionStorage';

interface VideoPlayerProps {
  currentVideo: PlaylistItem | null;
  playlist: PlaylistItem[];
  settings: PlayerSettings;
  subtitleSettings: SubtitleSettings;
  bookmarks?: VideoBookmark[];
  onBackToLibrary: () => void;
  onSelectVideo: (video: PlaylistItem) => void;
  onNextVideo: () => void;
  onPrevVideo: () => void;
  onAddLocalFiles: (files: FileList) => void;
  onAddSampleVideos: () => void;
  onSelectSubtitleTrack: (trackId: string | null) => void;
  onAddCustomSubtitleTrack: (track: SubtitleTrack) => void;
  onUpdateSubtitleSettings: (newSettings: Partial<SubtitleSettings>) => void;
  onUpdatePlayerSettings: (newSettings: Partial<PlayerSettings>) => void;
  onTogglePlaylist: () => void;
  onToggleBookmarks?: () => void;
  onAddBookmark?: (label?: string, color?: string, time?: number) => void;
  onSelectBookmark?: (bookmark: VideoBookmark) => void;
  onToggleSettings: () => void;
  onToggleEqualizer: () => void;
  onToggleShortcuts: () => void;
  onShowToast: (text: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  playlist,
  settings,
  subtitleSettings,
  bookmarks = [],
  onBackToLibrary,
  onSelectVideo,
  onNextVideo,
  onPrevVideo,
  onAddLocalFiles,
  onAddSampleVideos,
  onSelectSubtitleTrack,
  onAddCustomSubtitleTrack,
  onUpdateSubtitleSettings,
  onUpdatePlayerSettings,
  onTogglePlaylist,
  onToggleBookmarks,
  onAddBookmark,
  onSelectBookmark,
  onToggleSettings,
  onToggleEqualizer,
  onToggleShortcuts,
  onShowToast
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ show: boolean; savedTime: number }>({
    show: false,
    savedTime: 0
  });

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    bufferedPercent,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    aspectRatio,
    setAspectRatio,
    error,
    setError,
    activeCue,
    togglePlay,
    play,
    seekTo,
    seekRelative,
    updateVolume,
    changePlaybackRate,
    togglePip
  } = useVideoPlayer({
    currentVideo,
    settings,
    subtitleSettings,
    onVideoEnd: onNextVideo,
    onShowToast
  });

  // Cycle Aspect Ratio mode
  const cycleAspectRatio = useCallback(() => {
    const modes: AspectRatioMode[] = ['contain', 'cover', '16:9', '4:3', '21:9', 'fill'];
    const currentIndex = modes.indexOf(aspectRatio);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setAspectRatio(nextMode);
    onShowToast(`Aspect Ratio: ${nextMode.toUpperCase()}`);
  }, [aspectRatio, setAspectRatio, onShowToast]);

  // Check saved playback position when video changes
  useEffect(() => {
    if (!currentVideo || !settings.autoResume) {
      setResumePrompt({ show: false, savedTime: 0 });
      return;
    }

    extensionStorage.getPlaybackPosition(currentVideo.id).then((saved) => {
      if (saved && saved > 10) {
        setResumePrompt({ show: true, savedTime: saved });
      } else {
        setResumePrompt({ show: false, savedTime: 0 });
      }
    });
  }, [currentVideo, settings.autoResume]);

  // Handle Controls Auto-hide on mouse inactivity
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !contextMenuPos) {
        setControlsVisible(false);
      }
    }, 2800);
  }, [isPlaying, contextMenuPos]);

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setControlsVisible(false);
    }
  };

  // Right-click Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setControlsVisible(true);
  };

  const handleQuickAddBookmark = useCallback(() => {
    if (onAddBookmark) {
      onAddBookmark(undefined, undefined, currentTime);
    }
  }, [onAddBookmark, currentTime]);

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onSeek: (secs) => seekRelative(secs),
    skipSeconds: settings.skipSeconds,
    onChangeVolume: (delta) => updateVolume(volume + delta),
    onToggleMute: () => updateVolume(volume, !isMuted),
    onToggleFullscreen: toggleFullscreen,
    onTogglePip: togglePip,
    onToggleSubtitles: () =>
      onUpdateSubtitleSettings({ enabled: !subtitleSettings.enabled }),
    onCyclePlaybackSpeed: () => {
      const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length] || 1.0;
      changePlaybackRate(nextSpeed);
    },
    onNextVideo,
    onPrevVideo,
    onCycleAspectRatio: cycleAspectRatio,
    onToggleBoost: () => {
      const next = !settings.audioBoost;
      onUpdatePlayerSettings({ audioBoost: next });
      onShowToast(next ? 'VLC Audio Boost ON (200%)' : 'Audio Boost OFF');
    },
    onOpenFilePicker: onBackToLibrary,
    onTogglePlaylist,
    onToggleBookmarks,
    onAddBookmark: handleQuickAddBookmark,
    onToggleSettings,
    onToggleHelp: onToggleShortcuts,
    onEscape: () => {
      if (contextMenuPos) setContextMenuPos(null);
    }
  });

  // Aspect ratio styling calculation
  const getVideoStyle = (): React.CSSProperties => {
    switch (aspectRatio) {
      case 'cover':
        return { objectFit: 'cover' };
      case 'fill':
        return { objectFit: 'fill' };
      case '16:9':
        return { objectFit: 'contain', aspectRatio: '16/9' };
      case '4:3':
        return { objectFit: 'contain', aspectRatio: '4/3' };
      case '21:9':
        return { objectFit: 'contain', aspectRatio: '21/9' };
      case 'contain':
      default:
        return { objectFit: 'contain' };
    }
  };

  const currentVideoBookmarks = bookmarks.filter((bm) => currentVideo && bm.videoId === currentVideo.id);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-screen bg-[#050505] overflow-hidden flex items-center justify-center select-none ${
        !controlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* 1. Main HTML5 Video Surface */}
      <video
        ref={videoRef}
        src={currentVideo?.url}
        style={getVideoStyle()}
        playsInline
        preload="auto"
        className="w-full h-full max-h-screen transition-all duration-200"
      />

      {/* 2. Subtitle Renderer Layer */}
      <SubtitleOverlay
        cue={activeCue}
        settings={subtitleSettings}
        controlsVisible={controlsVisible}
      />

      {/* 3. Interactive Gesture Overlay (Seek ripples, click play/pause, drag/drop) */}
      <GestureOverlay
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeekRelative={seekRelative}
        onToggleFullscreen={toggleFullscreen}
        onFileDrop={onAddLocalFiles}
        skipSeconds={settings.skipSeconds}
      />

      {/* 4. Loading Buffering State Animation */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/30 backdrop-blur-xs">
          <div className="p-4 rounded-3xl glass-panel flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono-time text-cyan-300 font-medium tracking-wide">
              Buffering stream...
            </span>
          </div>
        </div>
      )}

      {/* 5. Error Screen Recovery State */}
      {error && (
        <div className="absolute inset-0 z-35 flex flex-col items-center justify-center p-6 bg-black/90 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1.5">Unable to play video</h3>
          <p className="text-xs text-gray-300 max-w-sm mb-6 leading-relaxed">
            {error}. The browser may not support this specific video container or codec.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToLibrary}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs tracking-wide transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Choose Another File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onAddSampleVideos();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Load Sample Movies</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Resume Playback Banner */}
      <ResumePrompt
        show={resumePrompt.show}
        savedTime={resumePrompt.savedTime}
        videoTitle={currentVideo?.title || 'Current Video'}
        onResume={() => {
          seekTo(resumePrompt.savedTime);
          setResumePrompt({ show: false, savedTime: 0 });
          play();
        }}
        onStartOver={() => {
          seekTo(0);
          if (currentVideo) {
            extensionStorage.clearPlaybackPosition(currentVideo.id);
          }
          setResumePrompt({ show: false, savedTime: 0 });
          play();
        }}
        onDismiss={() => setResumePrompt({ show: false, savedTime: 0 })}
      />

      {/* 7. Top Header Information Bar */}
      <div
        className={`transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <TopInfoBar
          currentVideo={currentVideo}
          duration={duration}
          aspectRatio={aspectRatio}
          onBack={onBackToLibrary}
          onTogglePlaylist={onTogglePlaylist}
          onToggleBookmarks={onToggleBookmarks}
          onToggleSettings={onToggleSettings}
          onToggleEqualizer={onToggleEqualizer}
          onCycleAspectRatio={cycleAspectRatio}
          playlistCount={playlist.length}
          bookmarkCount={currentVideoBookmarks.length}
        />
      </div>

      {/* 8. Bottom Playback Controls Bar */}
      <div
        className={`transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PlayerControls
          currentVideo={currentVideo}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          bufferedPercent={bufferedPercent}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          isPip={false}
          settings={settings}
          subtitleSettings={subtitleSettings}
          bookmarks={bookmarks}
          onTogglePlay={togglePlay}
          onSeek={seekTo}
          onSeekRelative={seekRelative}
          onVolumeChange={updateVolume}
          onToggleMute={() => updateVolume(volume, !isMuted)}
          onSelectSpeed={changePlaybackRate}
          onToggleFullscreen={toggleFullscreen}
          onTogglePip={togglePip}
          onNextVideo={onNextVideo}
          onPrevVideo={onPrevVideo}
          onSelectSubtitleTrack={onSelectSubtitleTrack}
          onAddCustomSubtitleTrack={onAddCustomSubtitleTrack}
          onUpdateSubtitleSettings={onUpdateSubtitleSettings}
          onUpdatePlayerSettings={onUpdatePlayerSettings}
          onToggleSettings={onToggleSettings}
          onToggleBookmarks={onToggleBookmarks}
          onQuickAddBookmark={handleQuickAddBookmark}
          onSelectBookmark={(bm) => {
            seekTo(bm.timestamp);
            onSelectBookmark?.(bm);
          }}
        />
      </div>

      {/* 9. Sleek Right-Click Context Menu */}
      <PlayerContextMenu
        position={contextMenuPos}
        isOpen={Boolean(contextMenuPos)}
        onClose={() => setContextMenuPos(null)}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        subtitlesEnabled={subtitleSettings.enabled}
        playbackRate={playbackRate}
        aspectRatio={aspectRatio}
        audioBoostEnabled={settings.audioBoost}
        onTogglePlay={togglePlay}
        onSeekRelative={seekRelative}
        onToggleFullscreen={toggleFullscreen}
        onTogglePip={togglePip}
        onToggleSubtitles={() =>
          onUpdateSubtitleSettings({ enabled: !subtitleSettings.enabled })
        }
        onCycleSpeed={() => {
          const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
          const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length] || 1.0;
          changePlaybackRate(nextSpeed);
        }}
        onCycleAspectRatio={cycleAspectRatio}
        onToggleAudioBoost={() => {
          const next = !settings.audioBoost;
          onUpdatePlayerSettings({ audioBoost: next });
          onShowToast(next ? 'VLC Audio Boost ON' : 'Audio Boost OFF');
        }}
        onOpenSettings={onToggleSettings}
        onAddBookmark={handleQuickAddBookmark}
        onOpenBookmarks={onToggleBookmarks}
        onShowStats={() => {
          onShowToast(
            `${currentVideo?.metadata?.resolution || '1080p'} • ${
              currentVideo?.metadata?.videoType || 'video/mp4'
            } • Buffer ${Math.round(bufferedPercent)}%`
          );
        }}
      />
    </div>
  );
};
