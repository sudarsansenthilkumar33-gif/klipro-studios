import React, { useEffect, useState } from 'react';
import { KliProLogo } from './KliProLogo';
import { Sparkles, Cpu, Film } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  message?: string;
  isOverlay?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  message = 'Initializing KliPro Neural Video Engine...',
  isOverlay = false,
}) => {
  const [progress, setProgress] = useState(15);
  const [stepLabel, setStepLabel] = useState('Calibrating 9:16 Auto-Framing');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onFinish) setTimeout(onFinish, 250);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15 + 10);
        if (next > 40 && next < 70) {
          setStepLabel('Syncing Multilingual CapCut Subtitles');
        } else if (next >= 70) {
          setStepLabel('Loading Motion Graphic & B-Roll Shaders');
        }
        return next > 100 ? 100 : next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`${
        isOverlay ? 'fixed inset-0 z-50' : 'min-h-screen'
      } flex flex-col items-center justify-center bg-[#070707] text-white px-6 select-none`}
    >
      {/* Background ambient neon radial gradient */}
      <div className="absolute w-96 h-96 rounded-full bg-[#00E676]/10 blur-[130px] pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none -bottom-10" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* Large Neon Emblem Logo */}
        <div className="animate-neon-pulse p-4 rounded-3xl bg-neutral-900/60 border border-white/10 mb-6 backdrop-blur-xl">
          <KliProLogo size="xl" showText={false} glow={true} />
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-1 text-white">
          KLI<span className="text-[#00E676] drop-shadow-[0_0_15px_rgba(0,230,118,0.7)]">PRO</span>
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#00E676] font-semibold mb-6 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
          Automated Multi-Format AI Studio
        </p>

        {/* Progress bar */}
        <div className="w-full bg-neutral-900/80 rounded-full h-2 p-0.5 border border-white/10 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#00E676] via-[#00ff88] to-[#00b0ff] rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(0,230,118,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between w-full text-[11px] text-neutral-400 font-mono">
          <span className="truncate max-w-[220px] text-neutral-300">{stepLabel}</span>
          <span className="text-[#00E676] font-bold">{progress}%</span>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Film className="w-3 h-3 text-[#00E676]" /> 9:16 Ken Burns
          </div>
          <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Cpu className="w-3 h-3 text-[#00E676]" /> Gemini Captions
          </div>
        </div>
      </div>
    </div>
  );
};
