/**
 * Universal Browser Extension Abstraction Layer (browserAPI)
 * Provides unified access to storage, tabs, runtime, fileSystem, indexedDB, notifications, and contextMenus
 * without scattering chrome.* or browser.* calls across React components.
 */

import { storage } from './storage';
import { tabs } from './tabs';
import { runtime } from './runtime';
import { fileSystem } from './fileSystem';
import { indexedDBManager } from './indexedDB';

declare const chrome: any;
declare const browser: any;

export const browserAPI = {
  // Sub-modules
  storage,
  tabs,
  runtime,
  fileSystem,
  indexedDB: indexedDBManager,

  // Environment checks
  isExtension: (): boolean => {
    return storage.isExtension();
  },

  isFirefox: (): boolean => {
    return (
      typeof browser !== 'undefined' ||
      (typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent))
    );
  },

  isChrome: (): boolean => {
    return (
      typeof chrome !== 'undefined' &&
      typeof browser === 'undefined' &&
      (typeof navigator !== 'undefined' && /chrome|chromium|edg/i.test(navigator.userAgent))
    );
  },

  // Notifications
  notifications: {
    show: (title: string, message: string, iconUrl?: string) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: iconUrl || chrome.runtime?.getURL('icon48.png') || '',
            title,
            message
          });
          return;
        }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body: message, icon: iconUrl });
        }
      } catch (e) {
        console.debug('Notification error:', e);
      }
    },

    requestPermission: async (): Promise<boolean> => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }
  },

  // Context Menus
  contextMenus: {
    create: (options: any, callback?: () => void) => {
      if (typeof chrome !== 'undefined' && chrome.contextMenus) {
        try {
          chrome.contextMenus.create(options, callback);
        } catch (e) {
          console.debug('contextMenus.create error:', e);
        }
      }
    },
    removeAll: (callback?: () => void) => {
      if (typeof chrome !== 'undefined' && chrome.contextMenus) {
        try {
          chrome.contextMenus.removeAll(callback);
        } catch {}
      }
    }
  },

  // Commands / Keyboard shortcuts
  commands: {
    getAll: async (): Promise<any[]> => {
      if (typeof chrome !== 'undefined' && chrome.commands) {
        return new Promise((resolve) => {
          chrome.commands.getAll((commands: any[]) => {
            resolve(commands || []);
          });
        });
      }
      return [];
    }
  }
};

export default browserAPI;
