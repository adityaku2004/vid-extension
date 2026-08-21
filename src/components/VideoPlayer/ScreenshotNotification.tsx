import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Check, Download, Copy, X } from 'lucide-react';

export interface ScreenshotNotificationData {
  dataUrl: string;
  filename: string;
  width: number;
  height: number;
  copiedToClipboard?: boolean;
}

interface ScreenshotNotificationProps {
  data: ScreenshotNotificationData | null;
  onClose: () => void;
}

export const ScreenshotNotification: React.FC<ScreenshotNotificationProps> = ({
  data,
  onClose
}) => {
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-[#101114]/95 border border-cyan-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto flex items-start gap-3 select-none"
      >
        {/* Thumbnail Preview */}
        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 shadow-md">
          <img
            src={data.dataUrl}
            alt="Screenshot Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 p-0.5 rounded bg-black/70 text-cyan-400">
            <Camera className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white tracking-wide">Screenshot Saved</h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 -mr-1 -mt-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-gray-300 font-mono-time truncate mt-0.5" title={data.filename}>
            {data.filename}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-time font-bold bg-white/10 text-cyan-300 border border-white/10">
              {data.width} × {data.height}
            </span>
            {data.copiedToClipboard && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
