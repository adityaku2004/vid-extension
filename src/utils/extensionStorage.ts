/**
 * Abstraction layer for Chrome Extension / Firefox WebExtension storage
 * and standard LocalStorage in browsers.
 */

declare const chrome: {
  storage?: {
    local?: {
      get: (keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>, callback?: () => void) => Promise<void>;
      remove: (keys: string | string[], callback?: () => void) => Promise<void>;
      clear: (callback?: () => void) => Promise<void>;
    };
  };
  runtime?: {
    lastError?: { message?: string };
    id?: string;
  };
};

export const extensionStorage = {
  /**
   * Check if running in browser extension context
   */
  isExtension: (): boolean => {
    return typeof chrome !== 'undefined' && Boolean(chrome?.runtime?.id && chrome?.storage?.local);
  },

  /**
   * Get an item from storage
   */
  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        const result = await chrome.storage.local.get(key);
        if (result && result[key] !== undefined) {
          return result[key] as T;
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
      }
    } catch (e) {
      console.warn('Storage get error for key:', key, e);
    }
    return defaultValue;
  },

  /**
   * Set an item in storage
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        await chrome.storage.local.set({ [key]: value });
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('Storage set error for key:', key, e);
    }
  },

  /**
   * Remove an item from storage
   */
  remove: async (key: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        await chrome.storage.local.remove(key);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage remove error for key:', key, e);
    }
  },

  /**
   * Save playback position for a video (by filename or ID)
   */
  savePlaybackPosition: async (videoKey: string, timeInSeconds: number): Promise<void> => {
    if (!videoKey || timeInSeconds <= 0) return;
    const positions = await extensionStorage.get<Record<string, number>>('vlc_video_positions', {});
    positions[videoKey] = Math.floor(timeInSeconds);
    await extensionStorage.set('vlc_video_positions', positions);
  },

  /**
   * Retrieve playback position for a video
   */
  getPlaybackPosition: async (videoKey: string): Promise<number | null> => {
    if (!videoKey) return null;
    const positions = await extensionStorage.get<Record<string, number>>('vlc_video_positions', {});
    return positions[videoKey] || null;
  },

  /**
   * Clear playback position for a video
   */
  clearPlaybackPosition: async (videoKey: string): Promise<void> => {
    if (!videoKey) return null;
    const positions = await extensionStorage.get<Record<string, number>>('vlc_video_positions', {});
    delete positions[videoKey];
    await extensionStorage.set('vlc_video_positions', positions);
  }
};
