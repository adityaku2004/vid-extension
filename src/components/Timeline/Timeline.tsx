import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TimeTooltip } from './TimeTooltip';
import { VideoBookmark } from '../../types';

interface TimelineProps {
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  onSeek: (time: number) => void;
  accentColor?: string;
  bookmarks?: VideoBookmark[];
  onSelectBookmark?: (bookmark: VideoBookmark) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  bufferedPercent,
  onSeek,
  accentColor = '#00F0FF',
  bookmarks = [],
  onSelectBookmark
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

  // Find if hover is close to any bookmark (within ±1.8% of timeline or ±2.5s)
  const matchedBookmark = duration > 0
    ? bookmarks.find((bm) => {
        const bmPercent = (bm.timestamp / duration) * 100;
        return Math.abs(bmPercent - hoverPercent) < 2.0 || Math.abs(bm.timestamp - hoverTime) < 3.0;
      })
    : null;

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
        matchedBookmark={matchedBookmark}
      />

      {/* Background Track */}
      <div className="relative w-full h-1 group-hover:h-2 transition-all duration-150 rounded-full bg-white/20 overflow-visible">
        {/* Buffered Progress */}
        <div
          className="absolute top-0 left-0 bottom-0 bg-white/30 transition-all duration-200 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Hover ghost highlight */}
        {isHovering && (
          <div
            className="absolute top-0 left-0 bottom-0 bg-white/20 transition-all duration-75 pointer-events-none rounded-full"
            style={{ width: `${hoverPercent}%` }}
          />
        )}

        {/* Played Progress Bar */}
        <div
          className="absolute top-0 left-0 bottom-0 transition-[width] duration-75 rounded-full"
          style={{
            width: `${currentPercent}%`,
            background: `linear-gradient(90deg, #3B82F6 0%, ${accentColor} 100%)`
          }}
        />

        {/* Bookmark Visual Pins on Track */}
        {duration > 0 &&
          bookmarks.map((bm) => {
            const pinPercent = Math.min(100, Math.max(0, (bm.timestamp / duration) * 100));
            const pinColor = bm.color || '#00F0FF';
            return (
              <div
                key={bm.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(bm.timestamp);
                  onSelectBookmark?.(bm);
                }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-2.5 h-2.5 group-hover:w-3.5 group-hover:h-3.5 rounded-full transition-all duration-150 cursor-pointer hover:scale-150 flex items-center justify-center"
                style={{
                  left: `${pinPercent}%`,
                  backgroundColor: pinColor,
                  boxShadow: `0 0 8px ${pinColor}, 0 1px 3px rgba(0,0,0,0.8)`
                }}
                title={`Bookmark: "${bm.label}"`}
              >
                <span className="w-1 h-1 rounded-full bg-black/60" />
              </div>
            );
          })}
      </div>

      {/* Scrubber Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg pointer-events-none transition-transform duration-100 group-hover:scale-125 z-30"
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
