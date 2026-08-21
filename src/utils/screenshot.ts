import { formatTime } from './formatTime';

export interface ScreenshotOptions {
  includeSubtitleText?: string | null;
  customFilename?: string;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export interface ScreenshotResult {
  success: boolean;
  width: number;
  height: number;
  filename: string;
  dataUrl?: string;
  copiedToClipboard?: boolean;
  error?: string;
}

/**
 * Captures a high-resolution snapshot of the current video frame and downloads it as a local file.
 */
export async function captureVideoScreenshot(
  video: HTMLVideoElement | null,
  videoTitle: string = 'video',
  currentTime: number = 0,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  if (!video) {
    return {
      success: false,
      width: 0,
      height: 0,
      filename: '',
      error: 'Video element not available'
    };
  }

  try {
    // 1. Get native video resolution (or fallback to render dimensions)
    const width = video.videoWidth || video.clientWidth || 1920;
    const height = video.videoHeight || video.clientHeight || 1080;

    if (width === 0 || height === 0) {
      throw new Error('Video frame dimensions are invalid');
    }

    // 2. Create offscreen canvas for pristine render
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 3. Draw high-resolution frame
    ctx.drawImage(video, 0, 0, width, height);

    // 4. Optionally draw subtitle text if present and requested
    if (options.includeSubtitleText) {
      const fontSize = Math.max(24, Math.round(height * 0.045));
      ctx.font = `600 ${fontSize}px "Segoe UI", Roboto, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      const lines = options.includeSubtitleText.split('\n');
      const lineHeight = fontSize * 1.3;
      const bottomMargin = Math.round(height * 0.08);

      lines.reverse().forEach((line, index) => {
        const y = height - bottomMargin - index * lineHeight;
        const x = width / 2;

        // Subtitle text stroke/shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.15));
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);

        // Subtitle fill
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, x, y);
      });
    }

    // 5. Construct formatted filename: Title_Snapshot_HH-MM-SS.png
    const timeFormatted = formatTime(currentTime || video.currentTime, true).replace(/:/g, '-');
    const safeTitle = (videoTitle || 'snapshot')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .trim()
      .slice(0, 60);

    const ext = options.format === 'image/jpeg' ? 'jpg' : options.format === 'image/webp' ? 'webp' : 'png';
    const filename = options.customFilename || `${safeTitle}_Snapshot_${timeFormatted}.${ext}`;
    const mimeType = options.format || 'image/png';
    const quality = options.quality ?? 0.95;

    // 6. Convert canvas to blob & trigger local file download
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        mimeType,
        quality
      );
    });

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    const dataUrl = canvas.toDataURL(mimeType, quality);

    // 7. Download file to user's device
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke URL after small delay
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 2000);

    // 8. Attempt clipboard copy (PNG format)
    let copiedToClipboard = false;
    if (typeof window !== 'undefined' && 'clipboard' in navigator && typeof ClipboardItem !== 'undefined') {
      try {
        // ClipboardItem requires standard image/png
        if (mimeType === 'image/png') {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          copiedToClipboard = true;
        }
      } catch {
        // Clipboard permission may be denied; file download still succeeded
        copiedToClipboard = false;
      }
    }

    return {
      success: true,
      width,
      height,
      filename,
      dataUrl,
      copiedToClipboard
    };
  } catch (err: any) {
    console.error('Failed to capture video snapshot:', err);
    return {
      success: false,
      width: 0,
      height: 0,
      filename: '',
      error: err?.message || 'Screenshot failed'
    };
  }
}
