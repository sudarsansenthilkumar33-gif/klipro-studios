import React from 'react';
import {
  Upload,
  Crown,
  Zap,
  User,
  Sparkles,
  Film,
  Download,
  Share2,
} from 'lucide-react';
import { UserAccount } from '../types';
import { KliProLogo } from './KliProLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  userAccount: UserAccount;
  onOpenProfile: () => void;
  onOpenPaywall: () => void;
  onUploadClick: () => void;
  onExportClick: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userAccount,
  onOpenProfile,
  onOpenPaywall,
  onUploadClick,
  onExportClick,
  isExporting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#060606]/92 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: KliPro Neon Emblem Logo */}
        <div className="flex items-center gap-3">
          <KliProLogo size="md" glow={true} />
        </div>

        {/* Center: Quota Tracker Badge */}
        <div className="hidden md:flex items-center gap-2">
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-white/10 hover:border-[#00E676]/40 transition-colors cursor-pointer"
          >
            {userAccount.isVip ? (
              <>
                <Crown className="w-3.5 h-3.5 text-[#00E676]" />
                <span className="text-xs font-black text-[#00E676]">
                  VIP Unlimited Edits
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                <span className="text-xs font-bold text-neutral-300">
                  Free Edits Left:{' '}
                  <span className="text-[#00E676] font-mono font-black">
                    {userAccount.freeExportsRemaining} / 2
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Upload media button */}
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            title="Import video (MP4/WEBM/MOV) or photo (JPG/PNG)"
          >
            <Upload className="w-3.5 h-3.5 text-[#00E676]" />
            <span className="hidden sm:inline">Import Media</span>
          </button>

          {/* Upgrade VIP button (if not VIP) */}
          {!userAccount.isVip && (
            <button
              type="button"
              onClick={onOpenPaywall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E676]/15 hover:bg-[#00E676]/25 border border-[#00E676]/40 text-[#00E676] text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,230,118,0.25)] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-[#00E676]" />
              <span className="hidden sm:inline">Upgrade Pro (₹49)</span>
              <span className="sm:hidden">Pro</span>
            </button>
          )}

          {/* Export 9:16 Video Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] hover:opacity-95 text-black text-xs font-black tracking-wide transition-all shadow-[0_0_20px_rgba(0,230,118,0.4)] cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export 9:16</span>
              </>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Profile & Quota"
          >
            <User className="w-4 h-4" />
            {userAccount.isVip && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.8)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
