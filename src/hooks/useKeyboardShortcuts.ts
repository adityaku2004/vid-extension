import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onChangeVolume: (delta: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onToggleSubtitles: () => void;
  onCyclePlaybackSpeed: () => void;
  skipSeconds?: number;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  onCycleAspectRatio?: () => void;
  onToggleBoost?: () => void;
  onOpenFilePicker?: () => void;
  onTogglePlaylist?: () => void;
  onToggleBookmarks?: () => void;
  onAddBookmark?: () => void;
  onTakeScreenshot?: () => void;
  onToggleSettings?: () => void;
  onToggleHelp?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const step = handlers.skipSeconds ?? 10;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          handlers.onTogglePlay();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onSeek(-30);
          } else if (e.ctrlKey || e.metaKey) {
            handlers.onSeek(-60);
          } else {
            handlers.onSeek(-step);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onSeek(30);
          } else if (e.ctrlKey || e.metaKey) {
            handlers.onSeek(60);
          } else {
            handlers.onSeek(step);
          }
          break;

        case 'j':
        case 'J':
          e.preventDefault();
          handlers.onSeek(-10);
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          handlers.onSeek(10);
          break;

        case 'ArrowUp':
          e.preventDefault();
          handlers.onChangeVolume(0.05);
          break;

        case 'ArrowDown':
          e.preventDefault();
          handlers.onChangeVolume(-0.05);
          break;

        case 'm':
        case 'M':
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onToggleBookmarks?.();
          } else {
            e.preventDefault();
            handlers.onToggleMute();
          }
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          handlers.onToggleFullscreen();
          break;

        case 'p':
        case 'P':
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onPrevVideo?.();
          } else {
            e.preventDefault();
            handlers.onTogglePip();
          }
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          handlers.onNextVideo?.();
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          handlers.onToggleSubtitles();
          break;

        case 's':
        case 'S':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onTakeScreenshot?.();
          } else {
            handlers.onCyclePlaybackSpeed();
          }
          break;

        case 'a':
        case 'A':
          e.preventDefault();
          handlers.onCycleAspectRatio?.();
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onToggleBoost?.();
          } else {
            handlers.onAddBookmark?.();
          }
          break;

        case 'o':
        case 'O':
          e.preventDefault();
          handlers.onOpenFilePicker?.();
          break;

        case '?':
        case '/':
          if (e.shiftKey || e.key === '?') {
            e.preventDefault();
            handlers.onToggleHelp?.();
          }
          break;

        case 'Escape':
          handlers.onEscape?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}
