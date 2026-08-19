import React, { useState } from 'react';
import {
  Sliders,
  Subtitles,
  Palette,
  Keyboard,
  ShieldCheck,
  Zap,
  RotateCcw,
  RotateCw,
  FastForward,
  Check,
  Minus,
  Plus
} from 'lucide-react';
import { Modal } from '../Common/Modal';
import { PlayerSettings, SubtitleSettings, SubtitleSize, SubtitlePosition, SubtitleFont, AspectRatioMode } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerSettings: PlayerSettings;
  subtitleSettings: SubtitleSettings;
  onUpdatePlayerSettings: (newSettings: Partial<PlayerSettings>) => void;
  onUpdateSubtitleSettings: (newSettings: Partial<SubtitleSettings>) => void;
  onResetDefaults: () => void;
}

type TabType = 'player' | 'subtitles' | 'appearance' | 'shortcuts' | 'extension';

const ACCENT_PRESETS = [
  { name: 'Electric Cyan', value: '#00F0FF' },
  { name: 'VLC Blue', value: '#3B82F6' },
  { name: 'Cyber Purple', value: '#8B5CF6' },
  { name: 'Matrix Green', value: '#10B981' },
  { name: 'Amber Glow', value: '#F59E0B' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  playerSettings,
  subtitleSettings,
  onUpdatePlayerSettings,
  onUpdateSubtitleSettings,
  onResetDefaults
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('player');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Player & Extension Settings"
      subtitle="Configure playback parameters, subtitles, appearance, and shortcuts"
      icon={<Sliders className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-2xl"
    >
      {/* Tabs Header */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('player')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'player'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Playback</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subtitles')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'subtitles'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span>Subtitles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shortcuts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'shortcuts'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Shortcuts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('extension')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'extension'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Extension Info</span>
        </button>
      </div>

      {/* TAB CONTENT: PLAYER */}
      {activeTab === 'player' && (
        <div className="space-y-4 text-xs">
          {/* Default Playback Speed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">Default Playback Speed</div>
              <div className="text-gray-400 text-[11px]">Initial rate when loading a new video</div>
            </div>
            <select
              value={playerSettings.defaultSpeed}
              onChange={(e) => onUpdatePlayerSettings({ defaultSpeed: parseFloat(e.target.value) })}
              className="bg-black/60 border border-white/10 text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((spd) => (
                <option key={spd} value={spd}>
                  {spd}x {spd === 1 ? '(Normal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow Keys Fast Forward / Rewind Seek Duration */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <FastForward className="w-4 h-4 text-cyan-400" />
                  <span>Arrow Keys Fast Forward / Rewind</span>
                </div>
                <div className="text-gray-400 text-[11px] mt-0.5">
                  Seconds to skip forward (→) or rewind (←) when pressing arrow keys
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono-time text-xs font-bold whitespace-nowrap">
                <span>← {playerSettings.skipSeconds}s</span>
                <span className="text-cyan-500/40">|</span>
                <span>+{playerSettings.skipSeconds}s →</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <div className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">
                Quick Presets
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 3, 5, 10, 15, 30, 60].map((secs) => (
                  <button
                    key={secs}
                    type="button"
                    onClick={() => onUpdatePlayerSettings({ skipSeconds: secs })}
                    className={`py-1.5 rounded-lg text-xs font-mono-time font-bold transition-all text-center ${
                      playerSettings.skipSeconds === secs
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25 scale-[1.02]'
                        : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {secs}s
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Slider & Stepper */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Custom Duration</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlayerSettings({
                        skipSeconds: Math.max(1, (playerSettings.skipSeconds || 10) - 1)
                      })
                    }
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                    title="Decrease 1s"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={playerSettings.skipSeconds || 10}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= 120) {
                          onUpdatePlayerSettings({ skipSeconds: val });
                        }
                      }}
                      className="w-12 bg-black/60 border border-white/15 text-center text-cyan-300 font-mono-time font-bold rounded px-1 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-gray-400 ml-1 text-xs">sec</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlayerSettings({
                        skipSeconds: Math.min(120, (playerSettings.skipSeconds || 10) + 1)
                      })
                    }
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                    title="Increase 1s"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={Math.min(60, playerSettings.skipSeconds || 10)}
                onChange={(e) =>
                  onUpdatePlayerSettings({ skipSeconds: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Boost */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>VLC Audio Boost (Up to 200%)</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-gray-400 text-[11px]">
                Enables Web Audio preamp gain for quiet recordings and low-level videos
              </div>
            </div>
            <input
              type="checkbox"
              checked={playerSettings.audioBoost}
              onChange={(e) => onUpdatePlayerSettings({ audioBoost: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Auto Resume */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">Remember Playback Position</div>
              <div className="text-gray-400 text-[11px]">
                Prompt to resume playback from where you left off
              </div>
            </div>
            <input
              type="checkbox"
              checked={playerSettings.autoResume}
              onChange={(e) => onUpdatePlayerSettings({ autoResume: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Auto Play Next in Playlist */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">Auto-Play Next in Playlist</div>
              <div className="text-gray-400 text-[11px]">
                Automatically advance to subsequent video upon ending
              </div>
            </div>
            <input
              type="checkbox"
              checked={playerSettings.autoPlay}
              onChange={(e) => onUpdatePlayerSettings({ autoPlay: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Default Aspect Ratio */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">Default Aspect Ratio</div>
              <div className="text-gray-400 text-[11px]">Scaling and letterbox presentation mode</div>
            </div>
            <select
              value={playerSettings.defaultAspectRatio}
              onChange={(e) =>
                onUpdatePlayerSettings({ defaultAspectRatio: e.target.value as AspectRatioMode })
              }
              className="bg-black/60 border border-white/10 text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 uppercase"
            >
              <option value="contain">Contain (Original)</option>
              <option value="cover">Cover (Crop)</option>
              <option value="16:9">16:9 Widescreen</option>
              <option value="4:3">4:3 Standard</option>
              <option value="21:9">21:9 CinemaScope</option>
              <option value="fill">Fill (Stretch)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBTITLES */}
      {activeTab === 'subtitles' && (
        <div className="space-y-4 text-xs">
          {/* Subtitle Size */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="font-semibold text-white">Subtitle Font Size</div>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'extralarge'] as SubtitleSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onUpdateSubtitleSettings({ size: sz })}
                  className={`py-2 rounded-xl text-center capitalize transition-colors font-medium ${
                    subtitleSettings.size === sz
                      ? 'bg-cyan-500 text-black font-bold shadow-md'
                      : 'bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {sz === 'extralarge' ? 'Extra Large' : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle Font Family */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="font-semibold text-white">Subtitle Typography</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sans', label: 'Modern Sans' },
                { id: 'serif', label: 'Classic Serif' },
                { id: 'mono', label: 'Monospace' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdateSubtitleSettings({ font: f.id as SubtitleFont })}
                  className={`py-2 rounded-xl text-center transition-colors font-medium ${
                    subtitleSettings.font === f.id
                      ? 'bg-cyan-500 text-black font-bold shadow-md'
                      : 'bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle Color & Opacity */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div>
              <div className="font-semibold text-white mb-1.5">Subtitle Color</div>
              <div className="flex items-center gap-2">
                {['#FFFFFF', '#FFEB3B', '#00F0FF', '#69F0AE', '#FFAB40'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onUpdateSubtitleSettings({ color })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      subtitleSettings.color === color
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">Background Box Opacity</span>
                <span className="font-mono-time text-cyan-300">
                  {Math.round(subtitleSettings.backgroundOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={subtitleSettings.backgroundOpacity}
                onChange={(e) =>
                  onUpdateSubtitleSettings({ backgroundOpacity: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Subtitle Position */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="font-semibold text-white">Screen Placement</div>
            <div className="grid grid-cols-3 gap-2">
              {(['bottom', 'middle', 'top'] as SubtitlePosition[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onUpdateSubtitleSettings({ position: pos })}
                  className={`py-2 rounded-xl text-center capitalize transition-colors font-medium ${
                    subtitleSettings.position === pos
                      ? 'bg-cyan-500 text-black font-bold shadow-md'
                      : 'bg-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-4 text-xs">
          {/* Accent Color Selection */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="font-semibold text-white">Accent Theme Highlight</div>
            <div className="text-gray-400 text-[11px] mb-2">
              Custom color applied to timeline scrubber, indicators, and glow effects
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCENT_PRESETS.map((preset) => {
                const isSelected = playerSettings.themeAccent === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onUpdatePlayerSettings({ themeAccent: preset.value })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-white/10 border-cyan-400 text-white'
                        : 'bg-black/30 border-white/5 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="font-medium text-xs truncate">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Controls */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">Compact Control Dock</div>
              <div className="text-gray-400 text-[11px]">
                Reduces control padding for ultra-minimalist viewing experience
              </div>
            </div>
            <input
              type="checkbox"
              checked={playerSettings.compactControls}
              onChange={(e) => onUpdatePlayerSettings({ compactControls: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Hardware Acceleration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="font-semibold text-white">GPU Video Acceleration</div>
              <div className="text-gray-400 text-[11px]">
                Hardware decode rendering via browser WebGL/WebGPU pipeline
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-300 border border-green-500/30">
              Active
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SHORTCUTS */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {[
              { key: 'Space / K', desc: 'Play / Pause video' },
              {
                key: '← / →',
                desc: `Seek ${playerSettings.skipSeconds || 10}s (Rewind / Forward)`
              },
              { key: 'Shift + ← / →', desc: 'Seek 30s (Medium jump)' },
              { key: 'Ctrl + ← / →', desc: 'Seek 60s (Long jump)' },
              { key: 'J / L', desc: 'Seek 10s (Standard step)' },
              { key: '↑ / ↓', desc: 'Volume Up / Down 5%' },
              { key: 'M', desc: 'Toggle Mute' },
              { key: 'F', desc: 'Toggle Fullscreen' },
              { key: 'P', desc: 'Picture-in-Picture' },
              { key: 'C', desc: 'Toggle Subtitles' },
              { key: 'S', desc: 'Cycle Playback Speed' },
              { key: 'A', desc: 'Cycle Aspect Ratio' },
              { key: 'B', desc: 'Toggle Audio Boost (200%)' },
              { key: 'N', desc: 'Next video in playlist' },
              { key: 'Shift + P', desc: 'Previous video in playlist' },
              { key: 'L', desc: 'Toggle Loop' },
              { key: 'O', desc: 'Open file picker' },
              { key: 'Esc', desc: 'Exit fullscreen / close menu' }
            ].map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
              >
                <span className="text-gray-300 truncate pr-2">{shortcut.desc}</span>
                <span className="px-2 py-0.5 rounded font-mono-time text-[11px] font-bold bg-white/10 text-cyan-300 whitespace-nowrap">
                  {shortcut.key}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EXTENSION INFO */}
      {activeTab === 'extension' && (
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-gray-200 leading-relaxed">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Manifest V3 & WebExtension Ready
            </h4>
            <p className="text-gray-300 text-xs">
              This player is engineered for seamless deployment as a Chrome Extension, Firefox
              WebExtension, or standalone desktop web application.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold text-white block mb-0.5">🔒 100% Client-Side Playback</span>
              <span className="text-gray-400">
                All video and subtitle decoding happens locally in your browser memory. Zero server uploads.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold text-white block mb-0.5">⚡ Persistent State Abstraction</span>
              <span className="text-gray-400">
                Settings and playback bookmarks synchronize via Chrome/Firefox extension storage.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-all shadow-md shadow-cyan-500/20"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
