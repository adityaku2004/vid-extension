import React from 'react';
import { formatTime } from '../../utils/formatTime';

interface TimeTooltipProps {
  time: number;
  positionX: number; // percentage 0 to 100
  visible: boolean;
  duration: number;
}

export const TimeTooltip: React.FC<TimeTooltipProps> = ({
  time,
  positionX,
  visible,
  duration
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute bottom-6 -translate-x-1/2 pointer-events-none z-30 transition-transform duration-75"
      style={{ left: `${Math.max(4, Math.min(96, positionX))}%` }}
    >
      <div className="px-2.5 py-1 rounded bg-[#101114]/95 border border-cyan-500/30 text-white font-mono-time text-xs font-semibold shadow-xl backdrop-blur-md flex items-center justify-center">
        <span>{formatTime(time, duration >= 3600)}</span>
      </div>
      <div className="w-1.5 h-1.5 bg-[#101114] border-r border-b border-cyan-500/30 rotate-45 mx-auto -mt-1" />
    </div>
  );
};
