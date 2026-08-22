/**
 * Compatibility wrapper for extensionStorage using browserAPI.storage
 */

import { storage } from '../browser/storage';

export const extensionStorage = {
  isExtension: (): boolean => {
    return storage.isExtension();
  },

  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    return await storage.get<T>(key, defaultValue);
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    await storage.set<T>(key, value);
  },

  remove: async (key: string): Promise<void> => {
    await storage.remove(key);
  },

  savePlaybackPosition: async (videoKey: string, timeInSeconds: number): Promise<void> => {
    if (!videoKey || timeInSeconds <= 0) return;
    const positions = await storage.get<Record<string, number>>('cine_video_positions', {});
    positions[videoKey] = Math.floor(timeInSeconds);
    await storage.set('cine_video_positions', positions);
  },

  getPlaybackPosition: async (videoKey: string): Promise<number | null> => {
    if (!videoKey) return null;
    const positions = await storage.get<Record<string, number>>('cine_video_positions', {});
    return positions[videoKey] || null;
  },

  clearPlaybackPosition: async (videoKey: string): Promise<void> => {
    if (!videoKey) return;
    const positions = await storage.get<Record<string, number>>('cine_video_positions', {});
    delete positions[videoKey];
    await storage.set('cine_video_positions', positions);
  },

  saveBookmarks: async (videoKey: string, bookmarks: any[]): Promise<void> => {
    if (!videoKey) return;
    const allBookmarks = await storage.get<Record<string, any[]>>('cine_video_bookmarks', {});
    allBookmarks[videoKey] = bookmarks;
    await storage.set('cine_video_bookmarks', allBookmarks);
  },

  getBookmarks: async (videoKey: string): Promise<any[]> => {
    if (!videoKey) return [];
    const allBookmarks = await storage.get<Record<string, any[]>>('cine_video_bookmarks', {});
    return allBookmarks[videoKey] || [];
  },

  getAllBookmarks: async (): Promise<Record<string, any[]>> => {
    return await storage.get<Record<string, any[]>>('cine_video_bookmarks', {});
  }
};
