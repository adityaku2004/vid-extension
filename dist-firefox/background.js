(() => {
  // src/extension/background/background.ts
  var ext = typeof browser !== "undefined" ? browser : chrome;
  ext.runtime.onInstalled.addListener(() => {
    console.log("[Background] Cine Media Player Extension installed/updated.");
    try {
      ext.contextMenus.removeAll(() => {
        ext.contextMenus.create({
          id: "cine-open-media",
          title: "Open Video in Cine Media Player",
          contexts: ["video", "audio", "link"]
        });
        ext.contextMenus.create({
          id: "cine-open-page-player",
          title: "Open Cine Media Player",
          contexts: ["page", "action"]
        });
      });
    } catch (e) {
      console.debug("Context menu initialization note:", e);
    }
  });
  ext.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "cine-open-media") {
      const mediaUrl = info.srcUrl || info.linkUrl;
      if (mediaUrl) {
        const pageTitle = tab?.title ? `${tab.title} (Web Video)` : "Web Stream Video";
        openOrFocusPlayer({ videoUrl: mediaUrl, title: pageTitle });
      }
    } else if (info.menuItemId === "cine-open-page-player") {
      openOrFocusPlayer();
    }
  });
  if (ext.commands && ext.commands.onCommand) {
    ext.commands.onCommand.addListener((command) => {
      console.log("[Background] Command received:", command);
      if (command === "open-player") {
        openOrFocusPlayer();
      } else if (command === "toggle-play" || command === "next-video" || command === "prev-video") {
        broadcastToPlayerTabs({
          type: command === "toggle-play" ? "COMMAND_PLAY_PAUSE" : command === "next-video" ? "COMMAND_NEXT" : "COMMAND_PREV"
        });
      }
    });
  }
  ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;
    switch (message.type) {
      case "OPEN_PLAYER": {
        openOrFocusPlayer(message.payload);
        sendResponse({ status: "ok" });
        break;
      }
      case "OPEN_VIDEO_URL": {
        openOrFocusPlayer(message.payload);
        sendResponse({ status: "ok" });
        break;
      }
      case "VIDEOS_DETECTED": {
        console.log("[Background] Videos detected on tab", sender?.tab?.id, message.payload);
        sendResponse({ status: "received" });
        break;
      }
      default:
        break;
    }
    return true;
  });
  async function openOrFocusPlayer(params) {
    const queryParams = new URLSearchParams();
    if (params?.videoUrl) queryParams.set("src", params.videoUrl);
    if (params?.title) queryParams.set("title", params.title);
    const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const playerUrl = ext.runtime.getURL(`player.html${queryStr}`);
    const matchPattern = ext.runtime.getURL("player.html*");
    try {
      ext.tabs.query({ url: matchPattern }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id) {
          ext.tabs.update(tabs[0].id, { active: true, url: playerUrl });
          if (tabs[0].windowId && ext.windows) {
            ext.windows.update(tabs[0].windowId, { focused: true });
          }
        } else {
          ext.tabs.create({ url: playerUrl });
        }
      });
    } catch (e) {
      console.warn("Error opening player tab:", e);
      ext.tabs.create({ url: playerUrl });
    }
  }
  function broadcastToPlayerTabs(msg) {
    const matchPattern = ext.runtime.getURL("player.html*");
    try {
      ext.tabs.query({ url: matchPattern }, (tabs) => {
        if (tabs && tabs.length > 0) {
          for (const t of tabs) {
            if (t.id) {
              ext.tabs.sendMessage(t.id, msg).catch?.(() => {
              });
            }
          }
        }
      });
    } catch (e) {
      console.debug("Error broadcasting to player tabs:", e);
    }
  }
})();
