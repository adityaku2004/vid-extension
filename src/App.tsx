import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  PlaylistItem,
  PlayerSettings,
  SubtitleSettings,
  SubtitleTrack,
  ToastMessage,
  VideoBookmark
} from './types';
import { SAMPLE_VIDEOS } from './utils/sampleMedia';
import { parseSRT } from './utils/srtParser';
import { parseVTT } from './utils/vttParser';
import { parseASS } from './utils/assParser';
import { extractMkvSubtitles, isMkvContainer } from './utils/mkvSubtitleParser';
import { inspectAndDiagnoseMkv } from './utils/mkvDiagnostics';
import { cleanTitleFromFilename, generateId, isVideoFile, isSubtitleFile } from './utils/fileHelpers';
import { formatTime } from './utils/formatTime';
import { browserAPI } from './browser/browserAPI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { EmptyState } from './components/EmptyState/EmptyState';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { SettingsModal } from './components/Settings/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcuts/KeyboardShortcutsModal';
import { AudioEqualizerModal } from './components/AudioEffects/AudioEqualizerModal';
import { Toast } from './components/Common/Toast';

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  defaultSpeed: 1.0,
  skipSeconds: 10,
  autoPlay: true,
  autoResume: true,
  rememberVolume: true,
  volume: 1.0,
  isMuted: false,
  loop: false,
  audioBoost: true,
  defaultAspectRatio: 'contain',
  themeAccent: '#00F0FF',
  doubleClickAction: 'fullscreen',
  showRemainingTime: false,
  compactControls: false,
  hardwareAcceleration: true
};

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  enabled: true,
  size: 'medium',
  color: '#FFFFFF',
  backgroundOpacity: 0.6,
  position: 'bottom',
  font: 'sans',
  bottomOffset: 24,
  syncOffset: 0
};

// Gather initial bookmarks from sample videos
const INITIAL_BOOKMARKS: VideoBookmark[] = SAMPLE_VIDEOS.flatMap(
  (video) => video.bookmarks || []
);

export default function App() {
  // Persistence for settings & playlist
  const [playerSettings, setPlayerSettings] = useLocalStorage<PlayerSettings>(
    'cine_player_settings',
    DEFAULT_PLAYER_SETTINGS
  );

  const [subtitleSettings, setSubtitleSettings] = useLocalStorage<SubtitleSettings>(
    'cine_subtitle_settings',
    DEFAULT_SUBTITLE_SETTINGS
  );

  // Playlist & Active Media State
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(SAMPLE_VIDEOS);
  const [currentVideo, setCurrentVideo] = useState<PlaylistItem | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [currentPlaybackDuration, setCurrentPlaybackDuration] = useState<number>(0);
  const seekToVideoRef = useRef<((time: number) => void) | null>(null);
  const lastHistorySyncRef = useRef<number>(0);

  // Bookmarks State & Persistence
  const [bookmarks, setBookmarks] = useLocalStorage<VideoBookmark[]>(
    'cine_video_bookmarks_list',
    INITIAL_BOOKMARKS
  );

  // Modals & Panels State
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistTab, setPlaylistTab] = useState<'playlist' | 'bookmarks' | 'history' | 'library'>('playlist');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, duration: number = 2000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, text, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check URL query parameters for direct stream URL loading (?src=...&title=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const src = urlParams.get('src');
      const title = urlParams.get('title');
      if (src) {
        const newItem: PlaylistItem = {
          id: generateId(),
          title: title ? decodeURIComponent(title) : 'Web Stream Video',
          url: src,
          dateAdded: Date.now(),
          subtitleTracks: []
        };
        setPlaylist((prev) => [newItem, ...prev]);
        setCurrentVideo(newItem);
        showToast(`Playing: ${newItem.title}`);
      }
    } catch (e) {
      console.debug('URL params read note:', e);
    }
  }, [showToast]);

  // Playlist Navigation
  const handleSelectVideo = useCallback((video: PlaylistItem) => {
    setCurrentVideo(video);
  }, []);

  const handleNextVideo = useCallback(() => {
    if (!currentVideo || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      setCurrentVideo(playlist[currentIndex + 1]);
    } else if (playerSettings.loop && playlist.length > 0) {
      setCurrentVideo(playlist[0]);
    }
  }, [currentVideo, playlist, playerSettings.loop]);

  const handlePrevVideo = useCallback(() => {
    if (!currentVideo || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(playlist[currentIndex - 1]);
    }
  }, [currentVideo, playlist]);

  // Listen to Extension Runtime messages and Global Commands
  useEffect(() => {
    const removeListener = browserAPI.runtime.onMessage((message) => {
      if (!message || !message.type) return;

      if (message.type === 'COMMAND_PLAY_PAUSE') {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
      } else if (message.type === 'COMMAND_NEXT') {
        handleNextVideo();
      } else if (message.type === 'COMMAND_PREV') {
        handlePrevVideo();
      } else if (message.type === 'OPEN_VIDEO_URL' && message.payload?.videoUrl) {
        const newItem: PlaylistItem = {
          id: generateId(),
          title: message.payload.title || 'Web Stream Video',
          url: message.payload.videoUrl,
          dateAdded: Date.now(),
          subtitleTracks: []
        };
        setPlaylist((prev) => [newItem, ...prev]);
        setCurrentVideo(newItem);
        showToast(`Playing: ${newItem.title}`);
      }
    });

    return () => removeListener();
  }, [handleNextVideo, handlePrevVideo, showToast]);

  // Bookmark Management Handlers
  const handleAddBookmark = useCallback(
    (label?: string, color?: string, time?: number) => {
      if (!currentVideo) return;
      const targetTime = time !== undefined ? Math.max(0, time) : Math.max(0, currentPlaybackTime);
      const formattedTime = formatTime(targetTime, currentPlaybackDuration >= 3600);
      const newBm: VideoBookmark = {
        id: generateId(),
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        timestamp: targetTime,
        label: label || `Bookmark at ${formattedTime}`,
        createdAt: Date.now(),
        color: color || '#00F0FF'
      };

      setBookmarks((prev) => {
        const filtered = prev.filter(
          (b) => !(b.videoId === currentVideo.id && Math.abs(b.timestamp - targetTime) < 0.8)
        );
        const updated = [...filtered, newBm];
        return updated;
      });
      showToast(`Saved bookmark: "${newBm.label}"`);
    },
    [currentVideo, currentPlaybackTime, currentPlaybackDuration, setBookmarks, showToast]
  );

  const handleUpdateBookmark = useCallback(
    (id: string, newLabel: string, newColor?: string) => {
      setBookmarks((prev) =>
        prev.map((bm) =>
          bm.id === id ? { ...bm, label: newLabel, color: newColor || bm.color } : bm
        )
      );
      showToast('Bookmark updated');
    },
    [setBookmarks, showToast]
  );

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => prev.filter((bm) => bm.id !== id));
    },
    [setBookmarks]
  );

  const handleClearBookmarks = useCallback(
    (videoId: string) => {
      setBookmarks((prev) => prev.filter((bm) => bm.videoId !== videoId));
    },
    [setBookmarks]
  );

  const handleOpenBookmarksPanel = useCallback(() => {
    setPlaylistTab('bookmarks');
    setIsPlaylistOpen(true);
  }, []);

  const handleOpenPlaylistPanel = useCallback(() => {
    setPlaylistTab('playlist');
    setIsPlaylistOpen(true);
  }, []);

  // Process Local Files (Supports MKV, MP4, WebM, and SRT/VTT/ASS subtitles)
  const handleOpenLocalFiles = useCallback(
    async (files: FileList) => {
      const videoFiles: File[] = [];
      const subFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isVideoFile(file)) {
          videoFiles.push(file);
        } else if (isSubtitleFile(file)) {
          subFiles.push(file);
        }
      }

      // Parse dropped subtitles
      const parsedSubs: SubtitleTrack[] = [];
      for (const subFile of subFiles) {
        try {
          const text = await subFile.text();
          const nameLower = subFile.name.toLowerCase();
          let cues = [];

          if (nameLower.endsWith('.ass') || nameLower.endsWith('.ssa')) {
            cues = parseASS(text);
          } else if (nameLower.endsWith('.srt') || nameLower.endsWith('.sub') || nameLower.endsWith('.sbv')) {
            cues = parseSRT(text);
          } else {
            cues = parseVTT(text);
          }

          if (cues.length > 0) {
            parsedSubs.push({
              id: generateId(),
              label: subFile.name.replace(/\.[^/.]+$/, ''),
              language: 'custom',
              isCustom: true,
              cues
            });
          }
        } catch (e) {
          console.warn('Error reading subtitle file:', e);
        }
      }

      if (videoFiles.length > 0) {
        let totalEmbeddedSubsFound = 0;
        const newItems: PlaylistItem[] = [];

        for (const file of videoFiles) {
          const objectUrl = URL.createObjectURL(file);
          const isMkv = await isMkvContainer(file);
          let embeddedSubs: SubtitleTrack[] = [];
          let mkvInfo: Awaited<ReturnType<typeof inspectAndDiagnoseMkv>> | null = null;

          if (isMkv) {
            try {
              mkvInfo = await inspectAndDiagnoseMkv(file, file.name);
              embeddedSubs = await extractMkvSubtitles(file);
              totalEmbeddedSubsFound += embeddedSubs.length;
            } catch (e) {
              console.warn('Error extracting MKV metadata or embedded subtitles:', e);
            }
          }

          const combinedSubs = [...embeddedSubs, ...parsedSubs];

          newItems.push({
            id: generateId(),
            title: cleanTitleFromFilename(file.name),
            url: objectUrl,
            originalFile: file,
            dateAdded: Date.now(),
            metadata: {
              filename: file.name,
              fileSize: file.size,
              videoType: isMkv ? 'video/x-matroska (MKV Container)' : (file.type || 'video/mp4'),
              codec: mkvInfo?.videoCodecName,
              videoCodecDetails: mkvInfo?.videoCodecName,
              audioCodec: mkvInfo?.audioCodecName,
              audioCodecDetails: mkvInfo?.audioCodecName,
              resolution: mkvInfo?.videoTrack?.pixelWidth
                ? `${mkvInfo.videoTrack.pixelWidth}×${mkvInfo.videoTrack.pixelHeight}`
                : undefined,
              hasUnsupportedVideoCodec: mkvInfo ? !mkvInfo.isBrowserCompatibleVideo : false,
              isAudioOnly: mkvInfo ? mkvInfo.isAudioOnlyPlayable || !mkvInfo.hasVideoTrack : false,
              issueDescription: mkvInfo?.issueDescription,
              recommendedFfmpegCommand: mkvInfo?.recommendedFfmpegCommand,
              losslessRemuxCommand: mkvInfo?.losslessRemuxCommand
            },
            subtitleTracks: combinedSubs,
            selectedSubtitleTrackId: combinedSubs.length > 0 ? combinedSubs[0].id : null
          });
        }

        setPlaylist((prev) => [...newItems, ...prev]);
        setCurrentVideo(newItems[0]);

        if (newItems[0]?.metadata?.hasUnsupportedVideoCodec) {
          showToast(
            `MKV Loaded: Audio stream ready. Video format (${newItems[0].metadata.codec}) detected.`
          );
        } else if (totalEmbeddedSubsFound > 0) {
          setSubtitleSettings((prev) => ({ ...prev, enabled: true }));
          showToast(
            `Loaded MKV video with ${totalEmbeddedSubsFound} embedded subtitle track${
              totalEmbeddedSubsFound > 1 ? 's' : ''
            }`
          );
        } else {
          showToast(`Loaded ${newItems.length} video${newItems.length > 1 ? 's' : ''}`);
        }
      } else if (parsedSubs.length > 0 && currentVideo) {
        const updatedVideo = {
          ...currentVideo,
          subtitleTracks: [...currentVideo.subtitleTracks, ...parsedSubs],
          selectedSubtitleTrackId: parsedSubs[0].id
        };
        setCurrentVideo(updatedVideo);
        setPlaylist((prev) =>
          prev.map((item) => (item.id === currentVideo.id ? updatedVideo : item))
        );
        setSubtitleSettings((prev) => ({ ...prev, enabled: true }));
        showToast(`Attached subtitle "${parsedSubs[0].label}"`);
      } else {
        showToast('Please select a supported video or subtitle file');
      }
    },
    [currentVideo, setSubtitleSettings, showToast]
  );

  const handlePlayUrl = useCallback(
    (url: string, title: string) => {
      const newItem: PlaylistItem = {
        id: generateId(),
        title: title || 'Web Stream Video',
        url,
        dateAdded: Date.now(),
        subtitleTracks: []
      };
      setPlaylist((prev) => [newItem, ...prev]);
      setCurrentVideo(newItem);
      showToast(`Playing: ${newItem.title}`);
    },
    [showToast]
  );

  const handlePlaySingleFile = useCallback(
    async (file: File) => {
      const dt = new DataTransfer();
      dt.items.add(file);
      await handleOpenLocalFiles(dt.files);
    },
    [handleOpenLocalFiles]
  );

  // Time & History tracking
  const handleTimeUpdate = useCallback(
    (time: number, duration: number) => {
      setCurrentPlaybackTime(time);
      setCurrentPlaybackDuration(duration);

      if (currentVideo && duration > 0) {
        const now = Date.now();
        if (now - lastHistorySyncRef.current > 4000 || (duration > 0 && time / duration > 0.95)) {
          lastHistorySyncRef.current = now;
          browserAPI.indexedDB.saveHistoryItem({
            id: currentVideo.id,
            name: currentVideo.title,
            sourceUrl: currentVideo.originalFile ? undefined : currentVideo.url,
            isLocalFile: !!currentVideo.originalFile,
            duration: duration,
            position: time,
            completed: duration > 0 && time / duration >= 0.95
          });
        }
      }
    },
    [currentVideo]
  );

  const handleRemoveFromPlaylist = useCallback((id: string) => {
    setPlaylist((prev) => prev.filter((item) => item.id !== id));
    setCurrentVideo((curr) => (curr?.id === id ? null : curr));
  }, []);

  const handleRenamePlaylistItem = useCallback((id: string, newTitle: string) => {
    setPlaylist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
    setCurrentVideo((curr) => (curr?.id === id ? { ...curr, title: newTitle } : curr));
  }, []);

  const handleReorderPlaylist = useCallback((fromIndex: number, toIndex: number) => {
    setPlaylist((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleAddSampleVideos = useCallback(() => {
    setPlaylist((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const newSamples = SAMPLE_VIDEOS.filter((s) => !existingIds.has(s.id));
      return [...prev, ...newSamples];
    });
    if (!currentVideo && SAMPLE_VIDEOS.length > 0) {
      setCurrentVideo(SAMPLE_VIDEOS[0]);
    }
    showToast('Loaded 4 open-source sample movies');
  }, [currentVideo, showToast]);

  const handleClearPlaylist = useCallback(() => {
    setPlaylist([]);
    setCurrentVideo(null);
    showToast('Playlist cleared');
  }, [showToast]);

  // Subtitle track selection
  const handleSelectSubtitleTrack = useCallback(
    (trackId: string | null) => {
      if (!currentVideo) return;
      const updated = { ...currentVideo, selectedSubtitleTrackId: trackId };
      setCurrentVideo(updated);
      setPlaylist((prev) =>
        prev.map((item) => (item.id === currentVideo.id ? updated : item))
      );
    },
    [currentVideo]
  );

  const handleAddCustomSubtitleTrack = useCallback(
    (track: SubtitleTrack) => {
      if (!currentVideo) return;
      const updated = {
        ...currentVideo,
        subtitleTracks: [...currentVideo.subtitleTracks, track],
        selectedSubtitleTrackId: track.id
      };
      setCurrentVideo(updated);
      setPlaylist((prev) =>
        prev.map((item) => (item.id === currentVideo.id ? updated : item))
      );
      showToast(`Subtitle loaded: ${track.label}`);
    },
    [currentVideo, showToast]
  );

  return (
    <div className="w-full h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Toast Overlay */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Main View: Empty State vs Video Player */}
      {!currentVideo ? (
        <EmptyState
          onOpenFiles={handleOpenLocalFiles}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      ) : (
        <VideoPlayer
          currentVideo={currentVideo}
          playlist={playlist}
          settings={playerSettings}
          subtitleSettings={subtitleSettings}
          bookmarks={bookmarks}
          onBackToLibrary={() => setCurrentVideo(null)}
          onSelectVideo={handleSelectVideo}
          onNextVideo={handleNextVideo}
          onPrevVideo={handlePrevVideo}
          onAddLocalFiles={handleOpenLocalFiles}
          onAddSampleVideos={handleAddSampleVideos}
          onSelectSubtitleTrack={handleSelectSubtitleTrack}
          onAddCustomSubtitleTrack={handleAddCustomSubtitleTrack}
          onUpdateSubtitleSettings={(newSubSettings) =>
            setSubtitleSettings((prev) => ({ ...prev, ...newSubSettings }))
          }
          onUpdatePlayerSettings={(newPlayerSettings) =>
            setPlayerSettings((prev) => ({ ...prev, ...newPlayerSettings }))
          }
          onTogglePlaylist={handleOpenPlaylistPanel}
          onToggleBookmarks={handleOpenBookmarksPanel}
          onAddBookmark={handleAddBookmark}
          onSelectBookmark={(bm) => {
            if (currentVideo && bm.videoId !== currentVideo.id) {
              const target = playlist.find((v) => v.id === bm.videoId);
              if (target) setCurrentVideo(target);
            }
            if (seekToVideoRef.current) {
              seekToVideoRef.current(bm.timestamp);
            }
          }}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onToggleEqualizer={() => setIsEqualizerOpen(!isEqualizerOpen)}
          onToggleShortcuts={() => setIsShortcutsOpen(!isShortcutsOpen)}
          onShowToast={showToast}
          onTimeUpdate={handleTimeUpdate}
          onRegisterSeek={(seekFn) => {
            seekToVideoRef.current = seekFn;
          }}
        />
      )}

      {/* Slide-in Playlist, Bookmarks, History & Library Panel */}
      <PlaylistPanel
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        playlist={playlist}
        currentVideoId={currentVideo?.id}
        currentTime={currentPlaybackTime}
        duration={currentPlaybackDuration}
        bookmarks={bookmarks}
        initialTab={playlistTab}
        onSeek={(time) => {
          if (seekToVideoRef.current) {
            seekToVideoRef.current(time);
          }
        }}
        onSelectVideo={(video) => {
          handleSelectVideo(video);
          setIsPlaylistOpen(false);
        }}
        onRemoveVideo={handleRemoveFromPlaylist}
        onRenameVideo={handleRenamePlaylistItem}
        onReorderPlaylist={handleReorderPlaylist}
        onAddLocalFiles={handleOpenLocalFiles}
        onAddSampleVideos={handleAddSampleVideos}
        onClearPlaylist={handleClearPlaylist}
        onAddBookmark={handleAddBookmark}
        onUpdateBookmark={handleUpdateBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onClearBookmarks={handleClearBookmarks}
        onShowToast={showToast}
        onPlayUrl={handlePlayUrl}
        onPlayFile={handlePlaySingleFile}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        playerSettings={playerSettings}
        subtitleSettings={subtitleSettings}
        onUpdatePlayerSettings={(newSettings) =>
          setPlayerSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onUpdateSubtitleSettings={(newSettings) =>
          setSubtitleSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onResetDefaults={() => {
          setPlayerSettings(DEFAULT_PLAYER_SETTINGS);
          setSubtitleSettings(DEFAULT_SUBTITLE_SETTINGS);
          showToast('Settings reset to defaults');
        }}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        skipSeconds={playerSettings.skipSeconds}
      />

      {/* Audio Equalizer & Boost Modal */}
      <AudioEqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        audioBoostEnabled={playerSettings.audioBoost}
        onToggleAudioBoost={(enabled) => {
          setPlayerSettings((prev) => ({ ...prev, audioBoost: enabled }));
          showToast(enabled ? 'Cine Media Volume Boost ON (200%)' : 'Volume Boost OFF');
        }}
      />
    </div>
  );
}
