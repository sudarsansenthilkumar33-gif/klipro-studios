import React from 'react';

interface KliProLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'watermark';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const KliProLogo: React.FC<KliProLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  glow = true,
}) => {
  const sizeMap = {
    watermark: { icon: 20, font: 'text-xs', pad: 'px-2 py-1' },
    sm: { icon: 24, font: 'text-base', pad: 'p-1' },
    md: { icon: 34, font: 'text-xl', pad: 'p-1.5' },
    lg: { icon: 46, font: 'text-2xl', pad: 'p-2' },
    xl: { icon: 68, font: 'text-4xl', pad: 'p-3' },
  };

  const current = sizeMap[size];

  if (size === 'watermark') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/15 shadow-xl select-none pointer-events-none ${className}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="8" fill="#060606" />
          <path
            d="M10 8V32M10 20L26 8M16 16L28 32"
            stroke="#00E676"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon points="19,17 25,20 19,23" fill="#00E676" />
        </svg>
        <span className="text-[11px] font-black tracking-wider text-white drop-shadow-sm">
          KLI<span className="text-[#00E676]">PRO</span>
        </span>
        <span className="text-[8px] font-black tracking-widest text-[#00E676] bg-[#00E676]/20 px-1 py-0.2 rounded border border-[#00E676]/30">
          AI
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Neon Emblem Icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-black border border-[#00E676]/40 ${current.pad} ${
          glow ? 'shadow-[0_0_20px_rgba(0,230,118,0.35)]' : ''
        }`}
      >
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="kliProNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E676" />
              <stop offset="60%" stopColor="#00E676" />
              <stop offset="100%" stopColor="#00B0FF" />
            </linearGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hexagon/Rounded Shield Base */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="#090A0D"
            stroke="url(#kliProNeonGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Dynamic Speedlines */}
          <path
            d="M6 14H10M6 24H12M6 34H9"
            stroke="#00E676"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />

          {/* Futuristic K Icon */}
          <path
            d="M16 11V37M16 24L32 11M21 19.5L34 37"
            stroke="url(#kliProNeonGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonBlur)"
          />

          {/* Embedded Play Button Apex */}
          <polygon
            points="22,21 28,24 22,27"
            fill="#FFFFFF"
            className="animate-pulse"
          />
        </svg>

        {/* Ambient Glow Aura */}
        {glow && (
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00B0FF] opacity-30 blur-sm -z-10" />
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none text-white ${current.font}`}>
            KLI<span className="text-[#00E676] drop-shadow-[0_0_12px_rgba(0,230,118,0.7)]">PRO</span>
          </div>
          <span className="text-[9px] font-semibold tracking-widest uppercase text-neutral-400 mt-0.5">
            Auto 9:16 AI Studio
          </span>
        </div>
      )}
    </div>
  );
};
