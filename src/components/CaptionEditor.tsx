import React, { useState } from 'react';
import {
  Languages,
  Sparkles,
  Type,
  Plus,
  Trash2,
  Clock,
  Flame,
  Check,
} from 'lucide-react';
import { CaptionSegment, CaptionStyleMode } from '../types';
import { AVAILABLE_LANGUAGES } from '../utils/sampleData';

interface CaptionEditorProps {
  captions: CaptionSegment[];
  onUpdateCaptions: (captions: CaptionSegment[]) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  captionStyle: CaptionStyleMode;
  onCaptionStyleChange: (style: CaptionStyleMode) => void;
  onGenerateAiCaptions: (language: string) => Promise<void>;
  isGenerating: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  captions,
  onUpdateCaptions,
  selectedLanguage,
  onLanguageChange,
  captionStyle,
  onCaptionStyleChange,
  onGenerateAiCaptions,
  isGenerating,
  currentTime,
  onSeek,
}) => {
  const handleTextChange = (id: string, newText: string) => {
    const updated = captions.map((cap) => {
      if (cap.id !== id) return cap;
      const words = newText.split(/\s+/).filter(Boolean);
      const dur = cap.end - cap.start;
      const wordDur = words.length > 0 ? dur / words.length : dur;
      return {
        ...cap,
        text: newText,
        words: words.map((w, i) => ({
          word: w,
          start: cap.start + i * wordDur,
          end: cap.start + (i + 1) * wordDur,
        })),
      };
    });
    onUpdateCaptions(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateCaptions(captions.filter((c) => c.id !== id));
  };

  const handleAddCaption = () => {
    const lastCap = captions[captions.length - 1];
    const newStart = lastCap ? lastCap.end + 0.3 : 0.5;
    const newEnd = newStart + 2.5;
    const newCap: CaptionSegment = {
      id: `cap-${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: 'New viral kinetic highlight',
      highlightWord: 'kinetic',
      words: [
        { word: 'New', start: newStart, end: newStart + 0.7 },
        { word: 'viral', start: newStart + 0.7, end: newStart + 1.4 },
        { word: 'kinetic', start: newStart + 1.4, end: newStart + 2.0 },
        { word: 'highlight', start: newStart + 2.0, end: newEnd },
      ],
    };
    onUpdateCaptions([...captions, newCap]);
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Top Bar: Language Selector & Gemini AI Trigger */}
      <div className="p-4 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/10">
        <div className="flex-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            <Languages className="w-4 h-4 text-[#00E676]" />
            Caption Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#00E676] cursor-pointer"
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:self-end">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onGenerateAiCaptions(selectedLanguage)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] text-black font-extrabold text-xs tracking-wide hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,230,118,0.4)] cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Gemini Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                Auto-Generate Captions (Gemini AI)
              </>
            )}
          </button>
        </div>
      </div>

      {/* CapCut-Style Subtitle Presets */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
          <Type className="w-4 h-4 text-[#00E676]" />
          CapCut-Style Word-by-Word Subtitle Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Viral Yellow */}
          <button
            type="button"
            onClick={() => onCaptionStyleChange('viral_yellow')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              captionStyle === 'viral_yellow'
                ? 'bg-amber-400/15 border-amber-400 text-white shadow-[0_0_15px_rgba(255,230,0,0.35)] ring-1 ring-amber-400'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#FFE600] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-[#FFE600]" /> Viral Yellow
              </span>
              {captionStyle === 'viral_yellow' && <Check className="w-3.5 h-3.5 text-[#FFE600]" />}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Bold yellow text with thick black stroke (Top Retention)
            </div>
          </button>

          {/* Neon Glow */}
          <button
            type="button"
            onClick={() => onCaptionStyleChange('neon_glow')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              captionStyle === 'neon_glow'
                ? 'bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_15px_rgba(0,230,118,0.35)] ring-1 ring-[#00E676]'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#00E676] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00E676]" /> Neon Glow
              </span>
              {captionStyle === 'neon_glow' && <Check className="w-3.5 h-3.5 text-[#00E676]" />}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Signature #00E676 border glow card
            </div>
          </button>

          {/* Karaoke Pop */}
          <button
            type="button"
            onClick={() => onCaptionStyleChange('pop_karaoke')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              captionStyle === 'pop_karaoke'
                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,176,255,0.35)] ring-1 ring-cyan-400'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 flex items-center gap-1">
                ⚡ Karaoke Pop
              </span>
              {captionStyle === 'pop_karaoke' && <Check className="w-3.5 h-3.5 text-cyan-400]" />}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              Smooth word-by-word active scale highlight
            </div>
          </button>
        </div>
      </div>

      {/* Caption Timeline Editor */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#00E676]" />
            Synchronized Timeline Subtitles ({captions.length})
          </label>
          <button
            type="button"
            onClick={handleAddCaption}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#00E676] text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {captions.map((cap) => {
            const isActive = currentTime >= cap.start && currentTime <= cap.end;
            return (
              <div
                key={cap.id}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-[#00E676]/10 border-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                    : 'bg-black/50 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div
                    onClick={() => onSeek(cap.start)}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#00E676] cursor-pointer hover:underline"
                  >
                    <span>{cap.start.toFixed(1)}s</span>
                    <span>→</span>
                    <span>{cap.end.toFixed(1)}s</span>
                    {isActive && (
                      <span className="ml-1 px-1.5 py-0.2 rounded bg-[#00E676] text-black text-[9px] font-bold uppercase">
                        Active
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(cap.id)}
                    className="p-1 rounded-md text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Delete subtitle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={cap.text}
                  onChange={(e) => handleTextChange(cap.id, e.target.value)}
                  className="w-full bg-neutral-900/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00E676]"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
