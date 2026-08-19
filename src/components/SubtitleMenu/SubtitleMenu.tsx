import React, { useRef, useEffect } from 'react';
import {
  Subtitles,
  Upload,
  Check,
  Type,
  MoveVertical,
  Clock,
  Palette,
  Minus,
  Plus
} from 'lucide-react';
import { SubtitleTrack, SubtitleSettings, SubtitleSize, SubtitlePosition, SubtitleFont } from '../../types';
import { parseSRT } from '../../utils/srtParser';
import { parseVTT } from '../../utils/vttParser';
import { parseASS } from '../../utils/assParser';
import { generateId } from '../../utils/fileHelpers';

interface SubtitleMenuProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: SubtitleTrack[];
  selectedTrackId?: string | null;
  settings: SubtitleSettings;
  onSelectTrack: (trackId: string | null) => void;
  onAddCustomTrack: (track: SubtitleTrack) => void;
  onUpdateSettings: (newSettings: Partial<SubtitleSettings>) => void;
}

const COLOR_PRESETS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Yellow', value: '#FFEB3B' },
  { label: 'Cyan', value: '#00F0FF' },
  { label: 'Green', value: '#69F0AE' },
  { label: 'Orange', value: '#FFAB40' }
];

export const SubtitleMenu: React.FC<SubtitleMenuProps> = ({
  isOpen,
  onClose,
  tracks,
  selectedTrackId,
  settings,
  onSelectTrack,
  onAddCustomTrack,
  onUpdateSettings
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const nameLower = file.name.toLowerCase();
      let cues = [];
      if (nameLower.endsWith('.ass') || nameLower.endsWith('.ssa')) {
        cues = parseASS(text);
      } else if (nameLower.endsWith('.srt') || nameLower.endsWith('.sub') || nameLower.endsWith('.sbv')) {
        cues = parseSRT(text);
      } else {
        cues = parseVTT(text);
      }

      if (cues.length > 0) {
        const newTrack: SubtitleTrack = {
          id: generateId(),
          label: file.name.replace(/\.[^/.]+$/, ''),
          language: 'custom',
          isCustom: true,
          cues
        };
        onAddCustomTrack(newTrack);
        onSelectTrack(newTrack.id);
        onUpdateSettings({ enabled: true });
      }
    } catch (err) {
      console.error('Failed to parse subtitle file:', err);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 right-20 z-50 w-80 p-3 rounded-2xl glass-panel bg-[#101114]/95 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto space-y-4 text-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Subtitles & Closed Captions
          </span>
        </div>
        <button
          type="button"
          onClick={() => onUpdateSettings({ enabled: !settings.enabled })}
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
            settings.enabled
              ? 'bg-cyan-500 text-black'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          {settings.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Tracks List */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Tracks</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-normal capitalize"
          >
            <Upload className="w-3 h-3" />
            <span>Load File (.srt / .vtt / .ass)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt,.ass,.ssa,.sub,.sbv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectTrack(null);
              onUpdateSettings({ enabled: false });
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
              !settings.enabled || !selectedTrackId
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Off</span>
            {(!settings.enabled || !selectedTrackId) && (
              <Check className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {tracks.map((track) => {
            const isSelected = settings.enabled && selectedTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  onSelectTrack(track.id);
                  onUpdateSettings({ enabled: true });
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="truncate pr-2">{track.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Appearance Settings Section */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        {/* Size Selection */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            <Type className="w-3 h-3 text-cyan-400" />
            <span>Subtitle Size</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['small', 'medium', 'large', 'extralarge'] as SubtitleSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdateSettings({ size: sz })}
                className={`py-1 rounded text-center capitalize transition-colors text-[11px] ${
                  settings.size === sz
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {sz === 'extralarge' ? 'XL' : sz}
              </button>
            ))}
          </div>
        </div>

        {/* Position Selection */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            <MoveVertical className="w-3 h-3 text-cyan-400" />
            <span>Position</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['bottom', 'middle', 'top'] as SubtitlePosition[]).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => onUpdateSettings({ position: pos })}
                className={`py-1 rounded text-center capitalize transition-colors text-[11px] ${
                  settings.position === pos
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Color Presets */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            <Palette className="w-3 h-3 text-cyan-400" />
            <span>Text Color</span>
          </div>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => onUpdateSettings({ color: color.value })}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  settings.color === color.value
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Background Opacity */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Background Opacity</span>
            <span className="font-mono-time text-white">
              {Math.round(settings.backgroundOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.backgroundOpacity}
            onChange={(e) => onUpdateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Subtitle Timing / Sync */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Subtitle Sync</span>
            </div>
            <span className="font-mono-time text-cyan-300">
              {settings.syncOffset > 0 ? `+${settings.syncOffset.toFixed(1)}s` : `${settings.syncOffset.toFixed(1)}s`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ syncOffset: parseFloat((settings.syncOffset - 0.5).toFixed(1)) })}
              className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center gap-1 text-[11px]"
            >
              <Minus className="w-3 h-3" /> 0.5s
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ syncOffset: 0 })}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ syncOffset: parseFloat((settings.syncOffset + 0.5).toFixed(1)) })}
              className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3" /> 0.5s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
