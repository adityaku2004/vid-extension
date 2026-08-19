import React from 'react';
import { SubtitleCue, SubtitleSettings } from '../../types';

interface SubtitleOverlayProps {
  cue: SubtitleCue | null;
  settings: SubtitleSettings;
  controlsVisible?: boolean;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  cue,
  settings,
  controlsVisible = false
}) => {
  if (!cue || !settings.enabled || !cue.text) return null;

  const getSizeClasses = () => {
    switch (settings.size) {
      case 'small':
        return 'text-sm sm:text-base md:text-lg';
      case 'large':
        return 'text-xl sm:text-2xl md:text-3xl font-semibold';
      case 'extralarge':
        return 'text-2xl sm:text-3xl md:text-4xl font-bold';
      case 'medium':
      default:
        return 'text-base sm:text-xl md:text-2xl font-medium';
    }
  };

  const getPositionClasses = () => {
    switch (settings.position) {
      case 'top':
        return 'top-12 md:top-16';
      case 'middle':
        return 'top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return controlsVisible ? 'bottom-24 md:bottom-28' : 'bottom-8 md:bottom-12';
    }
  };

  return (
    <div
      className={`absolute left-0 right-0 z-30 pointer-events-none flex justify-center px-6 transition-all duration-200 ${getPositionClasses()}`}
    >
      <div
        className={`max-w-4xl text-center px-4 py-1.5 rounded-md leading-relaxed tracking-wide transition-all duration-100 ${getSizeClasses()}`}
        style={{
          color: settings.color,
          backgroundColor: `rgba(0, 0, 0, ${settings.backgroundOpacity})`,
          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.6)',
          fontFamily: settings.font === 'mono' ? 'JetBrains Mono, monospace' : settings.font === 'serif' ? 'Georgia, serif' : 'Plus Jakarta Sans, sans-serif'
        }}
      >
        <span className="whitespace-pre-line select-none">{cue.text}</span>
      </div>
    </div>
  );
};
