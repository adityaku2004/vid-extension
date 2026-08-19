import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, X } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';

interface ResumePromptProps {
  show: boolean;
  savedTime: number;
  videoTitle: string;
  onResume: () => void;
  onStartOver: () => void;
  onDismiss: () => void;
}

export const ResumePrompt: React.FC<ResumePromptProps> = ({
  show,
  savedTime,
  videoTitle,
  onResume,
  onStartOver,
  onDismiss
}) => {
  if (!show || savedTime <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md p-4 rounded-xl glass-panel bg-[#101114]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="text-sm font-semibold text-white truncate">
              Resume Playback?
            </h4>
          </div>
          <p className="text-xs text-gray-300 mt-1 line-clamp-1">
            {videoTitle}
          </p>
          <p className="text-xs text-cyan-300 font-mono-time mt-0.5 font-medium">
            Last watched at {formatTime(savedTime, savedTime >= 3600)}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Dismiss resume prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onResume}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          Resume from {formatTime(savedTime)}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium transition-colors active:scale-98"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start Over
        </button>
      </div>
    </motion.div>
  );
};
