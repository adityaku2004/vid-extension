(() => {
  // src/extension/content/content.ts
  var ext = typeof browser !== "undefined" ? browser : chrome;
  if (typeof ext !== "undefined" && ext.runtime && ext.runtime.onMessage) {
    ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "DETECT_VIDEOS") {
        const videos = scanPageForVideos();
        sendResponse({ videos });
        if (videos.length > 1) {
          showVideoSelectionModal(videos);
        } else if (videos.length === 1) {
          openInPlayer(videos[0]);
        }
      }
      return true;
    });
  }
  function scanPageForVideos() {
    const videoElements = Array.from(document.querySelectorAll("video"));
    const detected = [];
    videoElements.forEach((video, index) => {
      let src = video.currentSrc || video.src;
      if (!src) {
        const sourceEl = video.querySelector("source");
        if (sourceEl) src = sourceEl.src;
      }
      if (!src || src.startsWith("blob:") || src.startsWith("data:")) {
        if (!src) return;
      }
      let title = video.getAttribute("title") || video.getAttribute("aria-label") || "";
      if (!title) {
        const parentHeading = video.closest("section, article, div")?.querySelector("h1, h2, h3");
        title = parentHeading?.textContent?.trim() || `${document.title || "Web Video"} (Stream ${index + 1})`;
      }
      const isLikelyAd = video.videoWidth > 0 && video.videoWidth < 200 || video.videoHeight > 0 && video.videoHeight < 150 || /ad|sponsor|promo/i.test(video.className || "");
      detected.push({
        index: index + 1,
        src,
        title: title.slice(0, 80),
        duration: isFinite(video.duration) ? video.duration : void 0,
        videoWidth: video.videoWidth || void 0,
        videoHeight: video.videoHeight || void 0,
        isLikelyAd
      });
    });
    return detected;
  }
  function openInPlayer(video) {
    if (typeof ext !== "undefined" && ext.runtime && ext.runtime.sendMessage) {
      ext.runtime.sendMessage({
        type: "OPEN_VIDEO_URL",
        payload: {
          videoUrl: video.src,
          title: video.title
        }
      });
    }
  }
  function showVideoSelectionModal(videos) {
    const existing = document.getElementById("cine-video-picker-overlay");
    if (existing) existing.remove();
    const container = document.createElement("div");
    container.id = "cine-video-picker-overlay";
    container.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #0f1117;
    border: 1px solid rgba(0, 240, 255, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.15);
    border-radius: 16px;
    padding: 16px 20px;
    width: 360px;
    max-width: 90vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    animation: cineFadeIn 0.2s ease-out;
  `;
    const sortedVideos = [...videos].sort((a, b) => (a.isLikelyAd ? 1 : 0) - (b.isLikelyAd ? 1 : 0));
    let itemsHtml = sortedVideos.map(
      (v) => `
    <div 
      class="cine-video-option" 
      data-src="${encodeURIComponent(v.src)}" 
      data-title="${encodeURIComponent(v.title)}"
      style="
        padding: 10px 12px;
        margin-top: 8px;
        background: ${v.isLikelyAd ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 240, 255, 0.06)"};
        border: 1px solid ${v.isLikelyAd ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 240, 255, 0.2)"};
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      "
    >
      <div style="font-weight: 600; font-size: 13px; color: ${v.isLikelyAd ? "#94a3b8" : "#ffffff"}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${v.index}. ${escapeHtml(v.title)} ${v.isLikelyAd ? '<span style="font-size: 10px; color: #f59e0b; margin-left: 4px;">[Ad/Preview]</span>' : ""}
      </div>
      <div style="font-size: 11px; color: #00F0FF; margin-top: 4px; opacity: 0.8; font-family: monospace;">
        ${v.videoWidth && v.videoHeight ? `${v.videoWidth}x${v.videoHeight}` : "HTML5 Video"} ${v.duration ? `\u2022 ${Math.floor(v.duration)}s` : ""}
      </div>
    </div>
  `
    ).join("");
    container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 14px; font-weight: 700; color: #00F0FF;">CINE MEDIA</span>
        <span style="font-size: 11px; background: rgba(0, 240, 255, 0.2); color: #00F0FF; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${videos.length} Videos</span>
      </div>
      <button id="cine-modal-close" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 0 4px;">&times;</button>
    </div>
    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Select a video to open in Cine Media Player:</div>
    <div style="max-height: 260px; overflow-y: auto;">
      ${itemsHtml}
    </div>
  `;
    document.body.appendChild(container);
    document.getElementById("cine-modal-close")?.addEventListener("click", () => {
      container.remove();
    });
    container.querySelectorAll(".cine-video-option").forEach((el) => {
      el.addEventListener("click", () => {
        const src = decodeURIComponent(el.getAttribute("data-src") || "");
        const title = decodeURIComponent(el.getAttribute("data-title") || "");
        if (src) {
          openInPlayer({ index: 1, src, title });
          container.remove();
        }
      });
      el.addEventListener("mouseenter", () => {
        el.style.background = "rgba(0, 240, 255, 0.15)";
        el.style.borderColor = "#00F0FF";
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "rgba(0, 240, 255, 0.06)";
        el.style.borderColor = "rgba(0, 240, 255, 0.2)";
      });
    });
  }
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
