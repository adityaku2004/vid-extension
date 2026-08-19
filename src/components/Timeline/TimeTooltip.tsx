import React from 'react';
import { Bookmark } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';
import { VideoBookmark } from '../../types';

interface TimeTooltipProps {
  time: number;
  positionX: number; // percentage 0 to 100
  visible: boolean;
  duration: number;
  matchedBookmark?: VideoBookmark | null;
}

export const TimeTooltip: React.FC<TimeTooltipProps> = ({
  time,
  positionX,
  visible,
  duration,
  matchedBookmark
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute bottom-6 -translate-x-1/2 pointer-events-none z-30 transition-transform duration-75"
      style={{ left: `${Math.max(4, Math.min(96, positionX))}%` }}
    >
      <div className="px-2.5 py-1 rounded-xl bg-[#101114]/95 border border-cyan-500/30 text-white font-mono-time text-xs font-semibold shadow-xl backdrop-blur-md flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {matchedBookmark && (
            <Bookmark
              className="w-3 h-3 flex-shrink-0"
              style={{ color: matchedBookmark.color || '#00F0FF', fill: matchedBookmark.color || '#00F0FF' }}
            />
          )}
          <span>{formatTime(time, duration >= 3600)}</span>
        </div>
        {matchedBookmark && (
          <span className="text-[10px] text-cyan-300 font-sans font-medium max-w-[160px] truncate">
            {matchedBookmark.label}
          </span>
        )}
      </div>
      <div className="w-1.5 h-1.5 bg-[#101114] border-r border-b border-cyan-500/30 rotate-45 mx-auto -mt-1" />
    </div>
  );
};
