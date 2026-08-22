/**
 * Browser Tabs Abstraction
 * Handles opening the dedicated player tab, focusing tabs, and sending messages.
 */

declare const chrome: any;
declare const browser: any;

export const tabs = {
  /**
   * Open or focus the Cine Media Player tab
   */
  openPlayer: async (params?: { videoUrl?: string; title?: string }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.videoUrl) queryParams.set('src', params.videoUrl);
    if (params?.title) queryParams.set('title', params.title);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // 1. Firefox WebExtension API
    if (typeof browser !== 'undefined' && browser.tabs && browser.runtime) {
      try {
        const playerUrl = browser.runtime.getURL(`player.html${queryString}`);
        const existingTabs = await browser.tabs.query({ url: browser.runtime.getURL('player.html*') });
        if (existingTabs && existingTabs.length > 0 && existingTabs[0].id) {
          await browser.tabs.update(existingTabs[0].id, { active: true, url: playerUrl });
          if (existingTabs[0].windowId) {
            await browser.windows.update(existingTabs[0].windowId, { focused: true });
          }
          return;
        }
        await browser.tabs.create({ url: playerUrl });
        return;
      } catch (e) {
        console.warn('Firefox tabs.openPlayer error:', e);
      }
    }

    // 2. Chrome MV3 / MV2 API
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      try {
        const playerUrl = chrome.runtime.getURL(`player.html${queryString}`);
        chrome.tabs.query({ url: chrome.runtime.getURL('player.html*') }, (matchedTabs: any[]) => {
          if (matchedTabs && matchedTabs.length > 0 && matchedTabs[0].id) {
            chrome.tabs.update(matchedTabs[0].id, { active: true, url: playerUrl });
            if (matchedTabs[0].windowId && chrome.windows) {
              chrome.windows.update(matchedTabs[0].windowId, { focused: true });
            }
          } else {
            chrome.tabs.create({ url: playerUrl });
          }
        });
        return;
      } catch (e) {
        console.warn('Chrome tabs.openPlayer error:', e);
      }
    }

    // 3. Fallback for Web preview
    if (typeof window !== 'undefined') {
      if (params?.videoUrl) {
        // Dispatch custom event or URL update
        window.dispatchEvent(
          new CustomEvent('cine:open-video', {
            detail: { url: params.videoUrl, title: params.title }
          })
        );
      }
    }
  },

  /**
   * Get active tab in current window
   */
  getActiveTab: async (): Promise<any> => {
    if (typeof browser !== 'undefined' && browser.tabs) {
      try {
        const result = await browser.tabs.query({ active: true, currentWindow: true });
        return result[0] || null;
      } catch {
        return null;
      }
    }

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve) => {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (res: any[]) => {
            resolve(res?.[0] || null);
          });
        } catch {
          resolve(null);
        }
      });
    }

    return null;
  }
};
