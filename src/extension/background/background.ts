/**
 * Extension Background Service Worker (Manifest V3 / Firefox WebExtension)
 * Responsible for context menus, message routing, command shortcuts, and tab orchestration.
 */

declare const chrome: any;
declare const browser: any;

// Helper for cross-browser runtime
const ext = typeof browser !== 'undefined' ? browser : chrome;

// 1. Install & Lifecycle setup
ext.runtime.onInstalled.addListener(() => {
  console.log('[Background] Cine Media Player Extension installed/updated.');

  // Create Context Menus
  try {
    ext.contextMenus.removeAll(() => {
      // Context menu for right-clicking video or audio elements on web pages
      ext.contextMenus.create({
        id: 'cine-open-media',
        title: 'Open Video in Cine Media Player',
        contexts: ['video', 'audio', 'link']
      });

      // Context menu for page context
      ext.contextMenus.create({
        id: 'cine-open-page-player',
        title: 'Open Cine Media Player',
        contexts: ['page', 'action']
      });
    });
  } catch (e) {
    console.debug('Context menu initialization note:', e);
  }
});

// 2. Context Menu Click Handler
ext.contextMenus.onClicked.addListener((info: any, tab?: any) => {
  if (info.menuItemId === 'cine-open-media') {
    const mediaUrl = info.srcUrl || info.linkUrl;
    if (mediaUrl) {
      const pageTitle = tab?.title ? `${tab.title} (Web Video)` : 'Web Stream Video';
      openOrFocusPlayer({ videoUrl: mediaUrl, title: pageTitle });
    }
  } else if (info.menuItemId === 'cine-open-page-player') {
    openOrFocusPlayer();
  }
});

// 3. Extension Keyboard Shortcuts / Commands
if (ext.commands && ext.commands.onCommand) {
  ext.commands.onCommand.addListener((command: string) => {
    console.log('[Background] Command received:', command);
    if (command === 'open-player') {
      openOrFocusPlayer();
    } else if (command === 'toggle-play' || command === 'next-video' || command === 'prev-video') {
      // Broadcast playback command to player tabs
      broadcastToPlayerTabs({
        type:
          command === 'toggle-play'
            ? 'COMMAND_PLAY_PAUSE'
            : command === 'next-video'
            ? 'COMMAND_NEXT'
            : 'COMMAND_PREV'
      });
    }
  });
}

// 4. Runtime Message Dispatcher
ext.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (res?: any) => void) => {
  if (!message || !message.type) return false;

  switch (message.type) {
    case 'OPEN_PLAYER': {
      openOrFocusPlayer(message.payload);
      sendResponse({ status: 'ok' });
      break;
    }

    case 'OPEN_VIDEO_URL': {
      openOrFocusPlayer(message.payload);
      sendResponse({ status: 'ok' });
      break;
    }

    case 'VIDEOS_DETECTED': {
      // Content script reported videos on the active page
      console.log('[Background] Videos detected on tab', sender?.tab?.id, message.payload);
      sendResponse({ status: 'received' });
      break;
    }

    default:
      break;
  }

  return true;
});

// 5. Helper to Open or Focus Player Tab
async function openOrFocusPlayer(params?: { videoUrl?: string; title?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.videoUrl) queryParams.set('src', params.videoUrl);
  if (params?.title) queryParams.set('title', params.title);
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const playerUrl = ext.runtime.getURL(`player.html${queryStr}`);
  const matchPattern = ext.runtime.getURL('player.html*');

  try {
    ext.tabs.query({ url: matchPattern }, (tabs: any[]) => {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        // Focus existing player tab and optionally update URL
        ext.tabs.update(tabs[0].id, { active: true, url: playerUrl });
        if (tabs[0].windowId && ext.windows) {
          ext.windows.update(tabs[0].windowId, { focused: true });
        }
      } else {
        // Create new player tab
        ext.tabs.create({ url: playerUrl });
      }
    });
  } catch (e) {
    console.warn('Error opening player tab:', e);
    ext.tabs.create({ url: playerUrl });
  }
}

// 6. Broadcast Message to Open Player Tabs
function broadcastToPlayerTabs(msg: any) {
  const matchPattern = ext.runtime.getURL('player.html*');
  try {
    ext.tabs.query({ url: matchPattern }, (tabs: any[]) => {
      if (tabs && tabs.length > 0) {
        for (const t of tabs) {
          if (t.id) {
            ext.tabs.sendMessage(t.id, msg).catch?.(() => {});
          }
        }
      }
    });
  } catch (e) {
    console.debug('Error broadcasting to player tabs:', e);
  }
}
