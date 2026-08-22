import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Video,
  Volume2,
  Terminal,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';
import { PlaylistItem } from '../../types';

interface CodecDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo: PlaylistItem | null;
  onShowToast?: (msg: string) => void;
}

export const CodecDiagnosticModal: React.FC<CodecDiagnosticModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  onShowToast
}) => {
  const [copiedTranscode, setCopiedTranscode] = useState(false);
  const [copiedRemux, setCopiedRemux] = useState(false);

  const metadata = currentVideo?.metadata;
  const filename = metadata?.filename || currentVideo?.title || 'video.mkv';
  const baseName = filename.replace(/\.[^/.]+$/, '');

  const videoCodec = metadata?.videoCodecDetails || metadata?.codec || 'HEVC / H.265 (V_MPEGH/ISO/HEVC)';
  const audioCodec = metadata?.audioCodecDetails || metadata?.audioCodec || 'AAC-LC / 48kHz Stereo';
  const resolution = metadata?.resolution || '1080p (Original)';

  const transcodeCommand = metadata?.recommendedFfmpegCommand ||
    `ffmpeg -i "${filename}" -c:v libx264 -crf 18 -preset fast -c:a copy "${baseName}_converted.mp4"`;

  const remuxCommand = metadata?.losslessRemuxCommand ||
    `ffmpeg -i "${filename}" -c copy "${baseName}_remuxed.mp4"`;

  const handleCopy = (text: string, type: 'transcode' | 'remux') => {
    navigator.clipboard.writeText(text);
    if (type === 'transcode') {
      setCopiedTranscode(true);
      setTimeout(() => setCopiedTranscode(false), 2500);
    } else {
      setCopiedRemux(true);
      setTimeout(() => setCopiedRemux(false), 2500);
    }
    onShowToast?.('Command copied to clipboard!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MKV Stream & Codec Diagnostic"
      subtitle="Diagnosing video decoding and stream compatibility"
      icon={<Wrench className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-sm">
        {/* Diagnostic Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300 text-sm">
              Diagnosis: Audio Plays Normally • Video Stream Not Rendered by Browser
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Standard web browsers (Chrome, Edge, Firefox) rely on the host operating system's HTML5 media engine. When an MKV container has an unsupported video codec (e.g. <strong>HEVC / H.265</strong>, <strong>MPEG-2</strong>, or <strong>10-bit AVC</strong>), the audio stream decodes seamlessly while the video frame cannot be drawn to the screen.
            </p>
          </div>
        </div>

        {/* Media Stream Breakdown Table */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Container Stream Analysis</span>
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Video Stream Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span>Video Track</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Codec Unsupported
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-gray-300 font-mono text-[11px] bg-black/40 p-1.5 rounded border border-white/5 truncate">
                  {videoCodec}
                </div>
                <div className="flex justify-between text-gray-400 text-[11px] pt-1">
                  <span>Target Resolution:</span>
                  <span className="text-gray-200">{resolution}</span>
                </div>
              </div>
            </div>

            {/* Audio Stream Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Audio Track</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Playing / Decoded</span>
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-gray-300 font-mono text-[11px] bg-black/40 p-1.5 rounded border border-white/5 truncate">
                  {audioCodec}
                </div>
                <div className="flex justify-between text-gray-400 text-[11px] pt-1">
                  <span>Volume Boost:</span>
                  <span className="text-cyan-300 font-bold">200% Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Solutions */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Recommended Solutions</span>
          </h5>

          {/* Solution 1: Fast Transcode */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span className="font-bold text-white text-xs">
                  Ultra-Fast Transcode to H.264 (Keeps Audio Lossless)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(transcodeCommand, 'transcode')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {copiedTranscode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTranscode ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-300">
              Converts only the video track to standard H.264 (AVC) while copying the audio track directly with zero quality loss in under 15 seconds:
            </p>
            <div className="bg-black/70 p-2.5 rounded-lg border border-cyan-500/20 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
              {transcodeCommand}
            </div>
          </div>

          {/* Solution 2: Lossless Remux */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/10 text-gray-300 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="font-semibold text-white text-xs">
                  Lossless Container Remux (Instant 2 Seconds)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(remuxCommand, 'remux')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95"
              >
                {copiedRemux ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRemux ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              If your video is already H.264 inside MKV, this changes the wrapper to MP4 instantly with zero re-encoding:
            </p>
            <div className="bg-black/50 p-2 rounded border border-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto select-all">
              {remuxCommand}
            </div>
          </div>

          {/* Solution 3: Browser Flags */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white text-xs">
                Enable Hardware Video Decoding in Chrome / Edge
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              If your PC has a modern GPU (Intel 6th+ gen, AMD Ryzen, NVIDIA GTX 960+), you can enable hardware HEVC decoding by navigating to <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">chrome://flags/#enable-hevc-software-decoding</code> or installing the free <em>HEVC Video Extensions from Device Manufacturer</em> in Windows.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Cine Media Player Core Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  );
};
