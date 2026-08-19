import React from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../Common/Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_DATA = [
  { group: 'Playback Control', items: [
    { key: 'Space', desc: 'Play / Pause video' },
    { key: 'K', desc: 'Play / Pause toggle' },
    { key: 'N', desc: 'Next video in playlist' },
    { key: 'Shift + P', desc: 'Previous video in playlist' },
    { key: 'L', desc: 'Toggle repeat / loop' },
    { key: 'S', desc: 'Cycle playback speed' },
  ]},
  { group: 'Seeking & Navigation', items: [
    { key: '←', desc: 'Seek backward 5 seconds' },
    { key: '→', desc: 'Seek forward 5 seconds' },
    { key: 'J', desc: 'Seek backward 10 seconds' },
    { key: 'L', desc: 'Seek forward 10 seconds' },
    { key: 'Shift + ←', desc: 'Seek backward 30 seconds' },
    { key: 'Shift + →', desc: 'Seek forward 30 seconds' },
  ]},
  { group: 'Audio & Subtitles', items: [
    { key: '↑', desc: 'Increase volume 5%' },
    { key: '↓', desc: 'Decrease volume 5%' },
    { key: 'M', desc: 'Toggle mute' },
    { key: 'B', desc: 'Toggle Audio Boost (200%)' },
    { key: 'C', desc: 'Toggle subtitles / CC' },
  ]},
  { group: 'Screen & Interface', items: [
    { key: 'F', desc: 'Toggle Fullscreen' },
    { key: 'P', desc: 'Toggle Picture-in-Picture' },
    { key: 'A', desc: 'Cycle aspect ratio' },
    { key: 'O', desc: 'Open file picker' },
    { key: '?', desc: 'Show keyboard shortcuts' },
    { key: 'Esc', desc: 'Exit fullscreen / Close panels' },
  ]}
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      subtitle="Complete VLC-inspired desktop media player hotkeys"
      icon={<Keyboard className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {SHORTCUTS_DATA.map((section) => (
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
                  <kbd className="px-2 py-0.5 rounded font-mono-time text-[11px] font-bold bg-white/10 text-cyan-300 border border-white/10 shadow-sm">
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
