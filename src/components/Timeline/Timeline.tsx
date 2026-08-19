import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TimeTooltip } from './TimeTooltip';

interface TimelineProps {
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  onSeek: (time: number) => void;
  accentColor?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  bufferedPercent,
  onSeek,
  accentColor = '#00F0FF'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [dragPercent, setDragPercent] = useState(0);

  const playedPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const currentPercent = isDragging ? dragPercent : playedPercent;

  const calculatePercentFromEvent = useCallback((e: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    return percent;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const percent = calculatePercentFromEvent(e);
    setHoverPercent(percent);
  }, [calculatePercentFromEvent]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const percent = calculatePercentFromEvent(e);
    setIsDragging(true);
    setDragPercent(percent);

    if (duration > 0) {
      onSeek((percent / 100) * duration);
    }
  }, [calculatePercentFromEvent, duration, onSeek]);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const percent = calculatePercentFromEvent(e);
      setDragPercent(percent);
      if (duration > 0) {
        onSeek((percent / 100) * duration);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      const percent = calculatePercentFromEvent(e);
      setIsDragging(false);
      if (duration > 0) {
        onSeek((percent / 100) * duration);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, calculatePercentFromEvent, duration, onSeek]);

  const hoverTime = (hoverPercent / 100) * duration;

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Video timeline seek bar"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onSeek(Math.max(0, currentTime - 5));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + 5));
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      className="relative w-full py-2.5 cursor-pointer group flex items-center select-none"
    >
      {/* Tooltip on Hover */}
      <TimeTooltip
        time={hoverTime}
        positionX={hoverPercent}
        visible={isHovering && duration > 0}
        duration={duration}
      />

      {/* Background Track */}
      <div className="relative w-full h-1 group-hover:h-2 transition-all duration-150 rounded-full bg-white/20 overflow-hidden">
        {/* Buffered Progress */}
        <div
          className="absolute top-0 left-0 bottom-0 bg-white/30 transition-all duration-200"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Hover ghost highlight */}
        {isHovering && (
          <div
            className="absolute top-0 left-0 bottom-0 bg-white/20 transition-all duration-75 pointer-events-none"
            style={{ width: `${hoverPercent}%` }}
          />
        )}

        {/* Played Progress Bar */}
        <div
          className="absolute top-0 left-0 bottom-0 transition-[width] duration-75"
          style={{
            width: `${currentPercent}%`,
            background: `linear-gradient(90deg, #3B82F6 0%, ${accentColor} 100%)`
          }}
        />
      </div>

      {/* Scrubber Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg pointer-events-none transition-transform duration-100 group-hover:scale-125"
        style={{
          left: `${currentPercent}%`,
          boxShadow: `0 0 10px ${accentColor}, 0 2px 4px rgba(0,0,0,0.6)`
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full mx-auto my-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
};
