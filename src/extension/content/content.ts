/**
 * Extension Content Script
 * Scans page for HTML5 video elements and provides a lightweight "Open in Cine Media Player" action.
 * Complies with strict security rules: No DRM bypass, no script injection.
 */

import { DetectedVideoInfo } from '../../browser/types';

declare const chrome: any;
declare const browser: any;
const ext = typeof browser !== 'undefined' ? browser : chrome;

// Listen for message from popup or background to detect videos
if (typeof ext !== 'undefined' && ext.runtime && ext.runtime.onMessage) {
  ext.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (res?: any) => void) => {
    if (message?.type === 'DETECT_VIDEOS') {
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

/**
 * Scan DOM for legitimate HTML5 video elements
 */
function scanPageForVideos(): DetectedVideoInfo[] {
  const videoElements = Array.from(document.querySelectorAll('video'));
  const detected: DetectedVideoInfo[] = [];

  videoElements.forEach((video, index) => {
    // Determine video source URL
    let src = video.currentSrc || video.src;
    if (!src) {
      const sourceEl = video.querySelector('source');
      if (sourceEl) src = sourceEl.src;
    }

    // Skip blob URLs that are internal media source extensions or invalid empty sources
    if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
      // If src is blob, standard direct cross-tab URL loading won't work across tabs, but if it has a direct src we can include it
      if (!src) return;
    }

    // Attempt to get meaningful label
    let title = video.getAttribute('title') || video.getAttribute('aria-label') || '';
    if (!title) {
      // Check nearest heading or page title
      const parentHeading = video.closest('section, article, div')?.querySelector('h1, h2, h3');
      title = parentHeading?.textContent?.trim() || `${document.title || 'Web Video'} (Stream ${index + 1})`;
    }

    // Check if video is likely an ad (e.g. tiny dimensions or aria-label ad)
    const isLikelyAd =
      (video.videoWidth > 0 && video.videoWidth < 200) ||
      (video.videoHeight > 0 && video.videoHeight < 150) ||
      /ad|sponsor|promo/i.test(video.className || '');

    detected.push({
      index: index + 1,
      src,
      title: title.slice(0, 80),
      duration: isFinite(video.duration) ? video.duration : undefined,
      videoWidth: video.videoWidth || undefined,
      videoHeight: video.videoHeight || undefined,
      isLikelyAd
    });
  });

  return detected;
}

/**
 * Open selected video in Cine Media Player
 */
function openInPlayer(video: DetectedVideoInfo) {
  if (typeof ext !== 'undefined' && ext.runtime && ext.runtime.sendMessage) {
    ext.runtime.sendMessage({
      type: 'OPEN_VIDEO_URL',
      payload: {
        videoUrl: video.src,
        title: video.title
      }
    });
  }
}

/**
 * Show a sleek non-intrusive floating modal if multiple videos exist on the page
 */
function showVideoSelectionModal(videos: DetectedVideoInfo[]) {
  // Remove existing modal if present
  const existing = document.getElementById('cine-video-picker-overlay');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'cine-video-picker-overlay';
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

  // Filter out probable ads to top non-ads
  const sortedVideos = [...videos].sort((a, b) => (a.isLikelyAd ? 1 : 0) - (b.isLikelyAd ? 1 : 0));

  let itemsHtml = sortedVideos
    .map(
      (v) => `
    <div 
      class="cine-video-option" 
      data-src="${encodeURIComponent(v.src)}" 
      data-title="${encodeURIComponent(v.title)}"
      style="
        padding: 10px 12px;
        margin-top: 8px;
        background: ${v.isLikelyAd ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 240, 255, 0.06)'};
        border: 1px solid ${v.isLikelyAd ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 240, 255, 0.2)'};
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      "
    >
      <div style="font-weight: 600; font-size: 13px; color: ${v.isLikelyAd ? '#94a3b8' : '#ffffff'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${v.index}. ${escapeHtml(v.title)} ${v.isLikelyAd ? '<span style="font-size: 10px; color: #f59e0b; margin-left: 4px;">[Ad/Preview]</span>' : ''}
      </div>
      <div style="font-size: 11px; color: #00F0FF; margin-top: 4px; opacity: 0.8; font-family: monospace;">
        ${v.videoWidth && v.videoHeight ? `${v.videoWidth}x${v.videoHeight}` : 'HTML5 Video'} ${v.duration ? `• ${Math.floor(v.duration)}s` : ''}
      </div>
    </div>
  `
    )
    .join('');

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

  // Bind close button
  document.getElementById('cine-modal-close')?.addEventListener('click', () => {
    container.remove();
  });

  // Bind click handlers
  container.querySelectorAll('.cine-video-option').forEach((el) => {
    el.addEventListener('click', () => {
      const src = decodeURIComponent(el.getAttribute('data-src') || '');
      const title = decodeURIComponent(el.getAttribute('data-title') || '');
      if (src) {
        openInPlayer({ index: 1, src, title });
        container.remove();
      }
    });

    el.addEventListener('mouseenter', () => {
      (el as HTMLElement).style.background = 'rgba(0, 240, 255, 0.15)';
      (el as HTMLElement).style.borderColor = '#00F0FF';
    });

    el.addEventListener('mouseleave', () => {
      (el as HTMLElement).style.background = 'rgba(0, 240, 255, 0.06)';
      (el as HTMLElement).style.borderColor = 'rgba(0, 240, 255, 0.2)';
    });
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
