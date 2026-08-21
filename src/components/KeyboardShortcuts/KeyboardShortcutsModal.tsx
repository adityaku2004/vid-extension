import React from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../Common/Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skipSeconds?: number;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  skipSeconds = 10
}) => {
  const shortcutsData = [
    { group: 'Playback Control', items: [
      { key: 'Space / K', desc: 'Play / Pause video' },
      { key: 'N', desc: 'Next video in playlist' },
      { key: 'Shift + P', desc: 'Previous video in playlist' },
      { key: 'L', desc: 'Toggle repeat / loop' },
      { key: 'S', desc: 'Cycle playback speed' },
    ]},
    { group: 'Seeking & Navigation', items: [
      { key: '←', desc: `Seek backward ${skipSeconds}s (Configured in Settings)` },
      { key: '→', desc: `Seek forward ${skipSeconds}s (Configured in Settings)` },
      { key: 'Shift + ← / →', desc: 'Seek 30 seconds (Medium jump)' },
      { key: 'Ctrl + ← / →', desc: 'Seek 60 seconds (Long jump)' },
      { key: 'J / L', desc: 'Seek backward / forward 10 seconds' },
    ]},
    { group: 'Audio & Subtitles', items: [
      { key: '↑', desc: 'Increase volume 5%' },
      { key: '↓', desc: 'Decrease volume 5%' },
      { key: 'M', desc: 'Toggle mute' },
      { key: 'C', desc: 'Toggle subtitles / CC' },
      { key: 'Shift + B', desc: 'Toggle Audio Boost (200%)' },
    ]},
    { group: 'Bookmarks & Navigation', items: [
      { key: 'Shift + S', desc: 'Capture high-res screenshot to file' },
      { key: 'B', desc: 'Save Bookmark at current timestamp' },
      { key: 'Shift + M', desc: 'Open Bookmarks panel' },
      { key: 'F', desc: 'Toggle Fullscreen' },
      { key: 'P', desc: 'Toggle Picture-in-Picture' },
      { key: 'A', desc: 'Cycle aspect ratio' },
      { key: 'O', desc: 'Open file picker' },
      { key: '?', desc: 'Show keyboard shortcuts' },
      { key: 'Esc', desc: 'Exit fullscreen / Close panels' },
    ]},
    { group: 'Touch & Mouse Gestures', items: [
      { key: 'Double-click Left', desc: `Seek backward ${skipSeconds}s` },
      { key: 'Double-click Right', desc: `Seek forward ${skipSeconds}s` },
      { key: 'Swipe Up/Down Right', desc: 'Slide to adjust volume' },
      { key: 'Double-click Center', desc: 'Toggle fullscreen mode' },
      { key: 'Single click/tap', desc: 'Play / Pause video' },
      { key: 'Drag & Drop', desc: 'Drop video or subtitle files' },
    ]}
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      subtitle="Complete Cine Media desktop player hotkeys"
      icon={<Keyboard className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {shortcutsData.map((section) => (
          <div key={section.group} className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {section.group}
            </h4>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <span className="text-gray-300">{item.desc}</span>
                  <kbd className="px-2 py-0.5 rounded font-mono-time text-[11px] font-bold bg-white/10 text-cyan-300 border border-white/10 shadow-sm whitespace-nowrap ml-2">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
