/**
 * Browser Runtime & Messaging Abstraction
 */

import { ExtensionMessage } from './types';

declare const chrome: any;
declare const browser: any;

export const runtime = {
  /**
   * Send message to background / extension components
   */
  sendMessage: async <T = any, R = any>(message: ExtensionMessage<T>): Promise<R | null> => {
    // 1. Firefox WebExtension API
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
      try {
        return (await browser.runtime.sendMessage(message)) as R;
      } catch (e) {
        console.debug('Firefox sendMessage debug:', e);
        return null;
      }
    }

    // 2. Chrome MV3 / MV2 API
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise<R | null>((resolve) => {
        try {
          chrome.runtime.sendMessage(message, (response: any) => {
            if (chrome.runtime?.lastError) {
              // Expected if no listener is open yet
              resolve(null);
            } else {
              resolve(response as R);
            }
          });
        } catch {
          resolve(null);
        }
      });
    }

    // 3. Web fallback: CustomEvent on window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cine:extension-message', {
          detail: message
        })
      );
    }

    return null;
  },

  /**
   * Listen for messages from extension components
   */
  onMessage: (
    callback: (
      message: ExtensionMessage,
      sender: any,
      sendResponse: (response?: any) => void
    ) => boolean | void
  ): (() => void) => {
    // Chrome listener
    const chromeListener = (message: any, sender: any, sendResponse: any) => {
      return callback(message, sender, sendResponse);
    };

    // Web fallback listener
    const webListener = (event: Event) => {
      const customEvent = event as CustomEvent<ExtensionMessage>;
      if (customEvent.detail) {
        callback(customEvent.detail, { id: 'web-fallback' }, () => {});
      }
    };

    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
      browser.runtime.onMessage.addListener(chromeListener);
      return () => {
        try {
          browser.runtime.onMessage.removeListener(chromeListener);
        } catch {}
      };
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(chromeListener);
      return () => {
        try {
          chrome.runtime.onMessage.removeListener(chromeListener);
        } catch {}
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cine:extension-message', webListener);
      return () => {
        window.removeEventListener('cine:extension-message', webListener);
      };
    }

    return () => {};
  },

  /**
   * Get URL for extension asset
   */
  getURL: (path: string): string => {
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
      return browser.runtime.getURL(path);
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(path);
    }
    return `/${path.replace(/^\//, '')}`;
  }
};
