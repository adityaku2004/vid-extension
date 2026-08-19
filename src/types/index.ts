export interface SubtitleCue {
  id: string | number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isCustom?: boolean;
  cues: SubtitleCue[];
  vttBlobUrl?: string;
  srcLang?: string;
}

export type SubtitleSize = 'small' | 'medium' | 'large' | 'extralarge';
export type SubtitlePosition = 'bottom' | 'middle' | 'top';
export type SubtitleFont = 'sans' | 'serif' | 'mono';

export interface SubtitleSettings {
  enabled: boolean;
  size: SubtitleSize;
  color: string; // e.g. '#ffffff', '#FFD700', '#00FFFF', '#76FF03'
  backgroundOpacity: number; // 0 to 1
  position: SubtitlePosition;
  font: SubtitleFont;
  bottomOffset: number; // in px or percentage
  syncOffset: number; // in seconds (positive delays, negative advances)
}

export interface VideoMetadata {
  filename: string;
  resolution?: string; // e.g. '1920x1080'
  duration?: number;
  fileSize?: number; // in bytes
  videoType?: string; // e.g. 'video/mp4', 'video/webm'
  framerate?: number;
  codec?: string;
  aspectRatio?: string;
}

export interface VideoBookmark {
  id: string;
  videoId: string;
  videoTitle?: string;
  timestamp: number; // in seconds
  label: string;
  createdAt: number;
  color?: string; // accent color e.g. '#00F0FF', '#FFD700', '#FF5252', '#69F0AE'
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  originalFile?: File;
  metadata?: VideoMetadata;
  duration?: number;
  subtitleTracks: SubtitleTrack[];
  selectedSubtitleTrackId?: string | null;
  lastPosition?: number;
  bookmarks?: VideoBookmark[];
  dateAdded: number;
  posterUrl?: string;
  isSample?: boolean;
}

export type AspectRatioMode = 'contain' | 'cover' | '16:9' | '4:3' | '21:9' | 'fill';

export interface PlayerSettings {
  defaultSpeed: number;
  skipSeconds: number;
  autoPlay: boolean;
  autoResume: boolean;
  rememberVolume: boolean;
  volume: number;
  isMuted: boolean;
  loop: boolean;
  audioBoost: boolean; // allow volume > 100% up to 200%
  defaultAspectRatio: AspectRatioMode;
  themeAccent: string; // e.g. '#00F0FF', '#3B82F6', '#8B5CF6', '#10B981'
  doubleClickAction: 'fullscreen' | 'playpause' | 'skip';
  showRemainingTime: boolean;
  compactControls: boolean;
  hardwareAcceleration: boolean;
}

export interface EqualizerBand {
  frequency: number; // in Hz: 60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000
  gain: number; // in dB: -12 to +12
  label: string;
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number; // 0 to 1 (or up to 2 if audio boost)
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isBuffering: boolean;
  isSeeking: boolean;
  aspectRatio: AspectRatioMode;
  error: string | null;
}

export interface ResumePromptState {
  show: boolean;
  videoId: string;
  title: string;
  savedTime: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  icon?: string;
  duration?: number;
}
