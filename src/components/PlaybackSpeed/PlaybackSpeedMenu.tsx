import React, { useRef, useEffect } from 'react';
import { Check, Gauge, Minus, Plus } from 'lucide-react';

interface PlaybackSpeedMenuProps {
  currentSpeed: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export const PlaybackSpeedMenu: React.FC<PlaybackSpeedMenuProps> = ({
  currentSpeed,
  isOpen,
  onClose,
  onSelectSpeed
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 right-16 z-50 w-52 p-2 rounded-xl glass-panel bg-[#101114]/95 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>Playback Speed</span>
        </div>
        <span className="text-xs font-mono-time font-bold text-cyan-400">
          {currentSpeed}x
        </span>
      </div>

      {/* Fine-tune +/- controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-lg mb-1.5 text-xs">
        <span className="text-gray-400">Fine Tune:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectSpeed(Math.max(0.2, parseFloat((currentSpeed - 0.05).toFixed(2))))}
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Slow down 0.05x"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSpeed(Math.min(4.0, parseFloat((currentSpeed + 0.05).toFixed(2))))}
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Speed up 0.05x"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Speed Presets Grid */}
      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
        {SPEED_OPTIONS.map((speed) => {
          const isSelected = Math.abs(currentSpeed - speed) < 0.01;
          return (
            <button
              key={speed}
              type="button"
              onClick={() => {
                onSelectSpeed(speed);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{speed === 1 ? '1.0x (Normal)' : `${speed}x`}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
