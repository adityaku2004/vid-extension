/**
 * Shared types for Browser Extension Abstraction Layer
 */

export interface WatchHistoryItem {
  id: string;
  name: string;
  duration: number;
  position: number;
  lastPlayed?: number; // timestamp
  completed: boolean;
  isFavorite?: boolean;
  posterUrl?: string;
  videoType?: string;
  resolution?: string;
  sourceUrl?: string;
  isLocalFile?: boolean;
  fileSize?: number;
}

export interface LibraryFolder {
  id: string;
  name: string;
  dateAdded: number;
  fileCount: number;
  handle?: any; // FileSystemDirectoryHandle if supported
}

export interface LibraryItem {
  id: string;
  folderId?: string;
  name: string;
  path?: string;
  fileSize: number;
  lastModified: number;
  duration?: number;
  handle?: any; // FileSystemFileHandle if supported
}

export type ExtensionMessageType =
  | 'OPEN_PLAYER'
  | 'OPEN_VIDEO_URL'
  | 'DETECT_VIDEOS'
  | 'VIDEOS_DETECTED'
  | 'GET_PLAYER_STATUS'
  | 'PLAYER_STATUS'
  | 'COMMAND_PLAY_PAUSE'
  | 'COMMAND_NEXT'
  | 'COMMAND_PREV'
  | 'GET_HISTORY'
  | 'HISTORY_DATA';

export interface ExtensionMessage<T = any> {
  type: ExtensionMessageType;
  payload?: T;
}

export interface DetectedVideoInfo {
  index: number;
  src: string;
  title: string;
  duration?: number;
  videoWidth?: number;
  videoHeight?: number;
  isLikelyAd?: boolean;
}
