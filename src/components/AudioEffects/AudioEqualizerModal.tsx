import React, { useState } from 'react';
import { Sliders, Zap, RotateCcw } from 'lucide-react';
import { Modal } from '../Common/Modal';

interface AudioEqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBoostEnabled: boolean;
  onToggleAudioBoost: (enabled: boolean) => void;
}

const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Cinema: [4, 3, 1, 0, -1, 1, 3, 4, 5, 4],
  'Bass Boost': [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
  'Vocal Enhancer': [-2, -1, 1, 3, 5, 5, 4, 2, 0, -1],
  'Night Mode (Quiet)': [-5, -4, -2, 0, 2, 2, 1, -1, -3, -5],
  Rock: [5, 4, 2, -1, -2, 1, 3, 5, 5, 6]
};

const FREQUENCIES = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'];

export const AudioEqualizerModal: React.FC<AudioEqualizerModalProps> = ({
  isOpen,
  onClose,
  audioBoostEnabled,
  onToggleAudioBoost
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [bands, setBands] = useState<number[]>(EQ_PRESETS.Flat);

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    setBands(EQ_PRESETS[presetName] || EQ_PRESETS.Flat);
  };

  const handleBandChange = (index: number, value: number) => {
    setSelectedPreset('Custom');
    const newBands = [...bands];
    newBands[index] = value;
    setBands(newBands);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audio Effects & Equalizer"
      subtitle="Cine Media hardware-mode audio enhancement and 10-band equalizer"
      icon={<Sliders className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-xs">
        {/* Audio Boost Section */}
        <div className="p-4 rounded-xl bg-[#14161c] border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Cine Media Volume Boost (200%)</div>
              <div className="text-gray-400 text-xs mt-0.5">
                Amplifies quiet audio signals beyond standard 100% volume ceiling
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleAudioBoost(!audioBoostEnabled)}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all ${
              audioBoostEnabled
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {audioBoostEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* EQ Presets Bar */}
        <div>
          <div className="text-gray-400 uppercase tracking-wider font-semibold text-[11px] mb-2">
            Equalizer Presets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(EQ_PRESETS).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedPreset === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Band Vertical Sliders */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex justify-between items-end h-40 px-2 gap-2">
            {bands.map((gain, i) => (
              <div key={FREQUENCIES[i]} className="flex flex-col items-center h-full justify-between flex-1">
                <span className="font-mono-time text-[10px] text-cyan-300 font-bold">
                  {gain > 0 ? `+${gain}` : gain}
                </span>

                <div className="relative h-28 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => handleBandChange(i, parseInt(e.target.value, 10))}
                    className="w-28 h-1 rounded-lg appearance-none bg-white/20 accent-cyan-400 cursor-pointer -rotate-90 origin-center"
                  />
                </div>

                <span className="text-[10px] font-mono-time text-gray-400 tracking-tight whitespace-nowrap">
                  {FREQUENCIES[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handlePresetSelect('Flat')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Flat</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs"
        >
          Apply
        </button>
      </div>
    </Modal>
  );
};
