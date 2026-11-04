import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Film,
  Volume2,
  VolumeX,
  Activity,
  Type,
  Check,
  Scissors,
  Wand2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  BRollMoment,
  MotionGraphicItem,
  HookIntroConfig,
  BeatSyncConfig,
  CaptionSegment,
  GeneratedHook,
} from '../types';
import { sfx } from '../utils/soundEffects';

interface MotionGraphicsToolbarProps {
  bRollMoments: BRollMoment[];
  onUpdateBRoll: (items: BRollMoment[]) => void;
  motionGraphics: MotionGraphicItem[];
  onUpdateMotionGraphics: (items: MotionGraphicItem[]) => void;
  hookIntro: HookIntroConfig;
  onUpdateHookIntro: (cfg: HookIntroConfig) => void;
  beatSync: BeatSyncConfig;
  onUpdateBeatSync: (cfg: BeatSyncConfig) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  captions?: CaptionSegment[];
  onUpdateCaptions?: (items: CaptionSegment[]) => void;
  mediaTitle?: string;
  selectedLanguage?: string;
}

const HOOK_TEMPLATES = [
  'Wait for the end 🤯',
  "You won't believe this...",
  'Secret 99% of creators miss ⚡',
  'POV: Life changing hack 🔥',
  'Stop scrolling right now 👀',
];

export const MotionGraphicsToolbar: React.FC<MotionGraphicsToolbarProps> = ({
  bRollMoments,
  onUpdateBRoll,
  motionGraphics,
  onUpdateMotionGraphics,
  hookIntro,
  onUpdateHookIntro,
  beatSync,
  onUpdateBeatSync,
  currentTime,
  onSeek,
  captions = [],
  onUpdateCaptions,
  mediaTitle = 'Viral Short',
  selectedLanguage = 'English',
}) => {
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [suggestedHooks, setSuggestedHooks] = useState<GeneratedHook[]>([]);
  const [trimmerNotice, setTrimmerNotice] = useState<string | null>(null);

  // Dynamic real-time AI Retention Score calculation based on hook text
  const retentionScore = useMemo(() => {
    if (!hookIntro.enabled || !hookIntro.text.trim()) return 0;
    const txt = hookIntro.text.trim().toLowerCase();
    let score = 55;

    // Power words / curiosity triggers (+25)
    const powerWords = [
      'wait', 'end', 'secret', 'never', 'hack', 'algorithm', 'pov', 'stop',
      'million', '99%', 'trick', 'shocking', 'magic', 'mystery', 'why',
      'warning', "don't", 'insane', 'free', 'crazy', 'how to', 'watch',
    ];
    if (powerWords.some((pw) => txt.includes(pw))) score += 24;

    // Length check: ideal hook is 2-6 words (+12)
    const wordCount = txt.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 7) score += 12;

    // Emojis check (+8)
    if (/[\u{1F300}-\u{1F9FF}]/u.test(hookIntro.text)) score += 8;

    // Punctuation punchiness (+5)
    if (/[!?\.\.]{1,}/.test(hookIntro.text)) score += 5;

    return Math.min(98, Math.max(68, score));
  }, [hookIntro.text, hookIntro.enabled]);

  // Handle Generate Viral Hooks via Gemini
  const handleGenerateViralHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const response = await fetch('/api/ai/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaTitle,
          language: selectedLanguage,
          currentHook: hookIntro.text,
        }),
      });
      const data = await response.json();
      if (data && data.hooks && data.hooks.length > 0) {
        setSuggestedHooks(data.hooks);
        // Automatically update the top banner with the #1 highest-scoring viral hook
        onUpdateHookIntro({ ...hookIntro, text: data.hooks[0].text });
        sfx.playPopHit();
      }
    } catch (err) {
      console.error('Failed to generate viral hooks:', err);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // Feature 3: 1-Tap Smart Silence & Breath Trimmer (Jump-Cut dead air > 0.4s)
  const handleJumpCutSilence = () => {
    if (!captions || captions.length <= 1) {
      setTrimmerNotice('Need at least 2 caption segments to detect dead air pauses.');
      return;
    }

    let totalSaved = 0;
    let gapsTrimmed = 0;
    const newCaps: CaptionSegment[] = [];

    const sorted = [...captions].sort((a, b) => a.start - b.start);
    let timeShift = 0;

    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      if (i === 0) {
        if (cur.start > 0.4) {
          const cut = cur.start - 0.1;
          timeShift += cut;
          totalSaved += cut;
          gapsTrimmed++;
        }
      } else {
        const prev = newCaps[i - 1];
        const currentEffectiveStart = cur.start - timeShift;
        const gap = currentEffectiveStart - prev.end;
        if (gap > 0.4) {
          const cut = gap - 0.12; // compress to snappy 0.12s pause
          timeShift += cut;
          totalSaved += cut;
          gapsTrimmed++;
        }
      }

      const duration = cur.end - cur.start;
      const newStart = Math.max(0, cur.start - timeShift);
      const newEnd = newStart + duration;

      const newWords = (cur.words || []).map((w) => ({
        ...w,
        start: Math.max(0, w.start - timeShift),
        end: Math.max(0, w.end - timeShift),
      }));

      newCaps.push({
        ...cur,
        start: Math.round(newStart * 100) / 100,
        end: Math.round(newEnd * 100) / 100,
        words: newWords,
      });
    }

    if (gapsTrimmed > 0 && onUpdateCaptions) {
      onUpdateCaptions(newCaps);
      sfx.playPopHit();
      setTrimmerNotice(
        `⚡ Trimmed ${totalSaved.toFixed(1)}s of dead air across ${gapsTrimmed} pauses! Pacing is now ultra-snappy.`
      );
    } else {
      setTrimmerNotice('✨ Pacing is already tight! No pauses longer than 0.4s detected.');
    }

    setTimeout(() => setTrimmerNotice(null), 5000);
  };

  const handleAddMotionGraphic = (type: MotionGraphicItem['type'], text: string) => {
    const newItem: MotionGraphicItem = {
      id: `mg-${Date.now()}`,
      time: Math.round(currentTime * 10) / 10,
      type,
      text,
    };
    onUpdateMotionGraphics([...motionGraphics, newItem]);
    sfx.playPopHit();
  };

  const handleDeleteMG = (id: string) => {
    onUpdateMotionGraphics(motionGraphics.filter((m) => m.id !== id));
  };

  const handleDeleteBRoll = (id: string) => {
    onUpdateBRoll(bRollMoments.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* 1. Auto-Hook Text Intro & AI Viral Retention Predictor */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#00E676]" />
              Auto-Hook Text Intro
            </label>

            {/* AI Retention Score Badge */}
            {hookIntro.enabled && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all ${
                  retentionScore >= 90
                    ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.35)]'
                    : retentionScore >= 80
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-amber-500/20 border-amber-500 text-amber-400'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                AI Retention Score: {retentionScore}/100 {retentionScore >= 90 ? '🔥' : '⚡'}
              </span>
            )}
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hookIntro.enabled}
              onChange={(e) =>
                onUpdateHookIntro({ ...hookIntro, enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]" />
          </label>
        </div>

        {hookIntro.enabled && (
          <div className="space-y-3 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={hookIntro.text}
                onChange={(e) =>
                  onUpdateHookIntro({ ...hookIntro, text: e.target.value })
                }
                placeholder="e.g. Wait for the end 🤯"
                className="flex-1 bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00E676]"
              />

              {/* Generate Viral Hooks Button powered by Gemini */}
              <button
                type="button"
                onClick={handleGenerateViralHooks}
                disabled={isGeneratingHooks}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)] hover:opacity-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isGeneratingHooks ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>Generate Viral Hooks</span>
              </button>
            </div>

            {/* AI Generated Hook Suggestions List */}
            {suggestedHooks.length > 0 && (
              <div className="p-3 rounded-xl bg-[#00E676]/5 border border-[#00E676]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#00E676] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Algorithm-Optimized Hooks (Tap to Apply):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestedHooks([])}
                    className="text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {suggestedHooks.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onUpdateHookIntro({ ...hookIntro, text: h.text });
                        sfx.playPopHit();
                      }}
                      className="p-2 rounded-lg bg-black/60 hover:bg-[#00E676]/15 border border-white/10 hover:border-[#00E676] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-white group-hover:text-[#00E676]">
                          {h.text}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {h.style} • {h.reason}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {h.score}/100 🔥
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick viral templates */}
            <div className="flex flex-wrap gap-1.5">
              {HOOK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onUpdateHookIntro({ ...hookIntro, text: tmpl })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    hookIntro.text === tmpl
                      ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676]'
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {tmpl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400">
              High-retention headline automatically pops in on mobile feeds and smoothly fades out after 3.0s.
            </p>
          </div>
        )}
      </div>

      {/* Feature 3: 1-Tap Smart Silence & Breath Trimmer (Jump-Cut dead air > 0.4s) */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-[#00E676]" />
              Smart Silence & Breath Trimmer
            </label>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Detects audio gaps &gt; 0.4s and applies viral jump-cuts for snappy pacing
            </p>
          </div>

          <button
            type="button"
            onClick={handleJumpCutSilence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E676] hover:bg-[#00c968] text-black font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)] cursor-pointer shrink-0"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Jump-Cut (Trim Pauses)</span>
          </button>
        </div>

        {trimmerNotice && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-[#00E676]/15 border border-[#00E676]/40 text-xs font-semibold text-[#00E676] flex items-center gap-2 animate-fade-in">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>{trimmerNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Smart Beat-Sync Zooms & SFX */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Activity className="w-4 h-4 text-[#00E676]" />
          Smart Beat-Sync Zooms & SFX Audio
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Beat-Sync Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00E676]" />
                Auto Beat-Matching Zooms
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Kinetic camera push-in zoom pulse on rhythm beats
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={beatSync.enabled}
                onChange={(e) =>
                  onUpdateBeatSync({ ...beatSync, enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]" />
            </label>
          </div>

          {/* Sound Effects Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#00E676]" />
                Whoosh & Pop SFX Transitions
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Web Audio synthesized whoosh & hit audio
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={beatSync.sfxEnabled}
                onChange={(e) =>
                  onUpdateBeatSync({ ...beatSync, sfxEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676]" />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Motion Graphic Presets Quick Add */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#00E676]" />
            Insert Motion Graphic Hit (at {currentTime.toFixed(1)}s)
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleAddMotionGraphic('kinetic_badge', '💥 VIRAL HOOK')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00E676]/20 border border-white/10 hover:border-[#00E676]/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-extrabold text-[#00E676] group-hover:scale-105 transition-transform">
              💥 VIRAL HOOK
            </div>
            <div className="text-[10px] text-neutral-400">Kinetic Badge</div>
          </button>

          <button
            type="button"
            onClick={() => handleAddMotionGraphic('neon_burst', '⚡ INSANE')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00E676]/20 border border-white/10 hover:border-[#00E676]/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-extrabold text-cyan-400 group-hover:scale-105 transition-transform">
              ⚡ INSANE
            </div>
            <div className="text-[10px] text-neutral-400">Neon Speedline</div>
          </button>

          <button
            type="button"
            onClick={() => handleAddMotionGraphic('zoom_hit', '🚀 10X GROWTH')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00E676]/20 border border-white/10 hover:border-[#00E676]/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-extrabold text-purple-400 group-hover:scale-105 transition-transform">
              🚀 10X GROWTH
            </div>
            <div className="text-[10px] text-neutral-400">Zoom Burst Hit</div>
          </button>

          <button
            type="button"
            onClick={() => handleAddMotionGraphic('kinetic_badge', '👀 WAIT FOR IT')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00E676]/20 border border-white/10 hover:border-[#00E676]/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-extrabold text-amber-400 group-hover:scale-105 transition-transform">
              👀 WAIT FOR IT
            </div>
            <div className="text-[10px] text-neutral-400">Suspense Badge</div>
          </button>
        </div>
      </div>

      {/* Active Motion Graphics List */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Zap className="w-4 h-4 text-[#00E676]" />
          Active Motion Graphic Hits ({motionGraphics.length})
        </label>

        {motionGraphics.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">No motion graphic hits yet. Tap above to insert.</p>
        ) : (
          <div className="space-y-2">
            {motionGraphics.map((mg) => {
              const isActive = currentTime >= mg.time && currentTime <= mg.time + 1.4;
              return (
                <div
                  key={mg.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-[#00E676]/15 border-[#00E676]'
                      : 'bg-black/50 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSeek(mg.time)}
                      className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#00E676] hover:bg-[#00E676] hover:text-black transition-colors cursor-pointer"
                    >
                      {mg.time.toFixed(1)}s
                    </button>
                    <span className="text-xs font-bold text-white">{mg.text}</span>
                    <span className="text-[10px] text-neutral-400 uppercase">({mg.type})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMG(mg.id)}
                    className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active B-Roll Moments List */}
      <div className="p-4 rounded-2xl glass-card border border-white/10">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Film className="w-4 h-4 text-[#00E676]" />
          Smart B-Roll & Reaction Cutaways ({bRollMoments.length})
        </label>

        {bRollMoments.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">No b-roll cutaways configured.</p>
        ) : (
          <div className="space-y-2">
            {bRollMoments.map((br) => {
              const isActive = currentTime >= br.time && currentTime <= br.time + br.duration;
              return (
                <div
                  key={br.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-[#00E676]/15 border-[#00E676]'
                      : 'bg-black/50 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSeek(br.time)}
                      className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#00E676] hover:bg-[#00E676] hover:text-black transition-colors cursor-pointer"
                    >
                      {br.time.toFixed(1)}s ({br.duration}s)
                    </button>
                    <span className="text-xs font-semibold text-white">{br.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBRoll(br.id)}
                    className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
