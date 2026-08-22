import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Music2, AlertTriangle, Terminal, Check, Copy, Sliders, Info, Zap, Wrench } from 'lucide-react';
import { PlaylistItem } from '../../types';

interface AudioOnlyVisualizerProps {
  currentVideo: PlaylistItem | null;
  isPlaying: boolean;
  onOpenDiagnostic: () => void;
  onOpenEqualizer?: () => void;
  onShowToast?: (msg: string) => void;
}

export const AudioOnlyVisualizer: React.FC<AudioOnlyVisualizerProps> = ({
  currentVideo,
  isPlaying,
  onOpenDiagnostic,
  onOpenEqualizer,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const metadata = currentVideo?.metadata;
  const isMkv = metadata?.videoType?.includes('matroska') || currentVideo?.title.toLowerCase().endsWith('.mkv');
  const videoCodec = metadata?.videoCodecDetails || metadata?.codec || 'HEVC / Unsupported';
  const audioCodec = metadata?.audioCodecDetails || metadata?.audioCodec || 'AAC Stereo';

  const ffmpegCommand = metadata?.recommendedFfmpegCommand ||
    `ffmpeg -i "${metadata?.filename || 'video.mkv'}" -c:v libx264 -c:a copy output.mp4`;

  const handleCopyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ffmpegCommand);
    setCopied(true);
    onShowToast?.('FFmpeg fix command copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0B0C10]/95 via-[#10121A]/95 to-[#0B0C10]/95 backdrop-blur-md select-none">
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -top-10 animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none -bottom-10" />

      {/* Main Center Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-5"
      >
        {/* Animated Visualizer Waves */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <Music2 className={`w-10 h-10 text-cyan-400 ${isPlaying ? 'animate-bounce' : ''}`} />
          </div>
          {isPlaying && (
            <div className="absolute -inset-2 rounded-3xl border border-cyan-400/30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          )}
        </div>

        {/* Dynamic Frequency Bars */}
        <div className="flex items-center justify-center gap-1.5 h-12 w-64 px-4 py-2 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
          {[40, 75, 55, 90, 65, 100, 80, 45, 95, 70, 85, 60, 90, 50, 75, 40].map((height, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-blue-400"
              animate={
                isPlaying
                  ? {
                      height: [`${Math.max(15, height * 0.3)}%`, `${height}%`, `${Math.max(20, height * 0.5)}%`],
                    }
                  : { height: '20%' }
              }
              transition={{
                duration: 0.6 + (i % 5) * 0.15,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                delay: i * 0.05
              }}
            />
          ))}
        </div>

        {/* Track Details & Diagnosis Tag */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Audio Playing • Video Codec ({videoCodec}) Not Supported in Browser</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1 max-w-md">
            {currentVideo?.title || 'Audio Stream'}
          </h3>

          <p className="text-xs text-gray-400 max-w-md leading-relaxed">
            The audio stream (<span className="text-cyan-300 font-mono-time">{audioCodec}</span>) is playing at full quality. The video stream is encoded in a format that browser HTML5 engines cannot decode natively.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDiagnostic();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Wrench className="w-4 h-4" />
            <span>Diagnose & Fix Guide</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCommand}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs backdrop-blur-md transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Terminal className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Command Copied!' : 'Copy FFmpeg Fast-Remux Fix'}</span>
          </button>

          {onOpenEqualizer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEqualizer();
              }}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="Audio Equalizer & 200% Boost"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
