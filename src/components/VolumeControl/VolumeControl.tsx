import React, { useRef } from 'react';
import { Volume2, Volume1, VolumeX, Zap } from 'lucide-react';
import { Tooltip } from '../Common/Tooltip';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number, muted?: boolean) => void;
  onToggleMute: () => void;
  audioBoostEnabled?: boolean;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  audioBoostEnabled = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const maxVolume = audioBoostEnabled ? 2.0 : 1.0;
  const currentVolume = isMuted ? 0 : volume;
  const displayPercentage = Math.round(currentVolume * 100);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newVol = Math.max(0, Math.min(maxVolume, volume + delta));
    onVolumeChange(newVol, false);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />;
    }
    if (volume > 1.0) {
      return (
        <div className="relative">
          <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
          <Zap className="w-2.5 h-2.5 text-cyan-300 absolute -top-1 -right-1 fill-cyan-300" />
        </div>
      );
    }
    if (volume < 0.5) {
      return <Volume1 className="w-5 h-5 text-gray-200 group-hover:text-cyan-400 transition-colors" />;
    }
    return <Volume2 className="w-5 h-5 text-gray-200 group-hover:text-cyan-400 transition-colors" />;
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex items-center gap-2 group relative"
    >
      <Tooltip content={isMuted ? 'Unmute' : 'Mute'} shortcut="M">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {getVolumeIcon()}
        </button>
      </Tooltip>

      {/* Volume Slider & Percent container */}
      <div className="w-0 overflow-hidden group-hover:w-28 focus-within:w-28 transition-all duration-200 ease-out flex items-center gap-2">
        <div className="relative w-20 flex items-center">
          <input
            type="range"
            min={0}
            max={maxVolume}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onVolumeChange(val, val === 0);
            }}
            aria-label="Volume slider"
            className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-cyan-400 cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${
                volume > 1.0 ? '#00F0FF' : '#3B82F6'
              } 0%, ${
                volume > 1.0 ? '#00F0FF' : '#3B82F6'
              } ${(Math.min(maxVolume, currentVolume) / maxVolume) * 100}%, rgba(255,255,255,0.2) ${(Math.min(maxVolume, currentVolume) / maxVolume) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
        <span className="text-[11px] font-mono-time font-medium text-gray-300 w-8 select-none">
          {displayPercentage}%
        </span>
      </div>
    </div>
  );
};
