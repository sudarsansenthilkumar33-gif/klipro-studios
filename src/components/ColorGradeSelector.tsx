import React from 'react';
import { Palette, Crop, Sparkles, Sliders, Check, Repeat, Zap } from 'lucide-react';
import { ColorGradePreset, AutoFormatMode } from '../types';
import { COLOR_PRESETS } from '../utils/sampleData';

interface ColorGradeSelectorProps {
  colorGrade: ColorGradePreset;
  onColorGradeChange: (preset: ColorGradePreset) => void;
  autoFormatMode: AutoFormatMode;
  onAutoFormatModeChange: (mode: AutoFormatMode) => void;
  infiniteLoop: boolean;
  onInfiniteLoopChange: (enabled: boolean) => void;
}

export const ColorGradeSelector: React.FC<ColorGradeSelectorProps> = ({
  colorGrade,
  onColorGradeChange,
  autoFormatMode,
  onAutoFormatModeChange,
  infiniteLoop,
  onInfiniteLoopChange,
}) => {
  return (
    <div className="flex flex-col gap-4 text-white">
      {/* 9:16 Framing Mode */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Crop className="w-4 h-4 text-[#00E676]" />
          9:16 Auto-Format Framing Mode
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onAutoFormatModeChange('ambient_blur')}
            className={`p-3 rounded-xl border text-left transition-all ${
              autoFormatMode === 'ambient_blur'
                ? 'bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_15px_rgba(0,230,118,0.25)]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#00E676]">Ambient Blurred Fill</span>
              {autoFormatMode === 'ambient_blur' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Zero distortion. Centered subject with dynamic mirrored ambient glow.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onAutoFormatModeChange('smart_crop')}
            className={`p-3 rounded-xl border text-left transition-all ${
              autoFormatMode === 'smart_crop'
                ? 'bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_15px_rgba(0,230,118,0.25)]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#00E676]">Smart Center Crop</span>
              {autoFormatMode === 'smart_crop' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Full-bleed 9:16 zoom focused on center action.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onAutoFormatModeChange('letterbox')}
            className={`p-3 rounded-xl border text-left transition-all ${
              autoFormatMode === 'letterbox'
                ? 'bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_15px_rgba(0,230,118,0.25)]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#00E676]">Clean Letterbox</span>
              {autoFormatMode === 'letterbox' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Deep black borders with subtle neon vignette.
            </p>
          </button>
        </div>
      </div>

      {/* Cinematic Color Grading Presets */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Palette className="w-4 h-4 text-[#00E676]" />
          Color Grading / Auto-Enhance Presets
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = colorGrade === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onColorGradeChange(preset.id as ColorGradePreset)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold truncate">{preset.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-[#00E676] shrink-0" />}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-neutral-800">
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        preset.id === 'cyberpunk_neon'
                          ? 'linear-gradient(90deg, #00E676, #00B0FF, #E040FB)'
                          : preset.id === 'cinematic_teal'
                          ? 'linear-gradient(90deg, #FF6D00, #00B0FF)'
                          : preset.id === 'warm_vintage'
                          ? 'linear-gradient(90deg, #FFAB00, #FF6D00)'
                          : preset.id === 'moody_noir'
                          ? 'linear-gradient(90deg, #ffffff, #222222)'
                          : 'linear-gradient(90deg, #00E676, #ffffff)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Infinite Perfect Loop Matcher */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-[#00E676]" />
              Infinite Loop
            </label>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Crossfades the last 0.5s into the intro frame so the exported reel loops seamlessly on social feeds
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-3">
            <input
              type="checkbox"
              checked={infiniteLoop}
              onChange={(e) => onInfiniteLoopChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]" />
          </label>
        </div>

        {infiniteLoop && (
          <div className="mt-3 p-3 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center gap-2.5 animate-fade-in">
            <div className="p-1.5 rounded-lg bg-[#00E676] text-black shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] text-neutral-200">
              <strong className="text-[#00E676] font-bold">Seamless Loop Active:</strong> Final 0.5 seconds smoothly blends into frame 0.0s for infinite feed replay without visual cuts.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
