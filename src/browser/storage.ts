/**
 * Browser Extension Storage Abstraction
 * Supports Chrome (chrome.storage.local), Firefox (browser.storage.local),
 * and standard Web (window.localStorage) fallbacks.
 */

// Global declarations for cross-browser runtime
declare const chrome: any;
declare const browser: any;

export const storage = {
  /**
   * Check if running in browser extension context
   */
  isExtension: (): boolean => {
    try {
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
        return true;
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  /**
   * Get an item from storage
   */
  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      // 1. Firefox WebExtension API
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
        const result = await browser.storage.local.get(key);
        if (result && result[key] !== undefined) {
          return result[key] as T;
        }
      }
      // 2. Chrome MV3 / MV2 API
      else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await new Promise<any>((resolve) => {
          chrome.storage.local.get([key], (res: any) => {
            if (chrome.runtime?.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          });
        });
        if (result && result[key] !== undefined) {
          return result[key] as T;
        }
      }
      // 3. Fallback to localStorage
      else if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) {
          try {
            return JSON.parse(raw) as T;
          } catch {
            return raw as unknown as T;
          }
        }
      }
    } catch (e) {
      console.warn(`[storage.get] Error fetching key "${key}":`, e);
    }
    return defaultValue;
  },

  /**
   * Set an item in storage
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      // 1. Firefox WebExtension API
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
        await browser.storage.local.set({ [key]: value });
      }
      // 2. Chrome MV3 / MV2 API
      else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => resolve());
        });
      }
      // 3. Fallback to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[storage.set] Error storing key "${key}":`, e);
    }
  },

  /**
   * Remove an item from storage
   */
  remove: async (key: string): Promise<void> => {
    try {
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
        await browser.storage.local.remove(key);
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise<void>((resolve) => {
          chrome.storage.local.remove([key], () => resolve());
        });
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[storage.remove] Error removing key "${key}":`, e);
    }
  },

  /**
   * Clear all items in storage
   */
  clear: async (): Promise<void> => {
    try {
      if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
        await browser.storage.local.clear();
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise<void>((resolve) => {
          chrome.storage.local.clear(() => resolve());
        });
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('[storage.clear] Error clearing storage:', e);
    }
  }
};
