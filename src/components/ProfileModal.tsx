import React from 'react';
import {
  X,
  User,
  Zap,
  Crown,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  RotateCcw,
  Film,
} from 'lucide-react';
import { UserAccount } from '../types';
import { KliProLogo } from './KliProLogo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount: UserAccount;
  onOpenPaywall: () => void;
  onResetQuota: () => void;
  removeWatermark: boolean;
  setRemoveWatermark: (val: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  onOpenPaywall,
  onResetQuota,
  removeWatermark,
  setRemoveWatermark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e0f14] border border-white/10 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00E676]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00E676]/20 to-blue-500/20 border border-[#00E676]/40 flex items-center justify-center text-[#00E676]">
            {userAccount.isVip ? (
              <Crown className="w-7 h-7 text-[#00E676] drop-shadow-[0_0_10px_rgba(0,230,118,0.6)]" />
            ) : (
              <User className="w-7 h-7 text-neutral-300" />
            )}
            {userAccount.isVip && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00E676] flex items-center justify-center text-[10px] text-black font-black">
                ✓
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Creator Account</h3>
              {userAccount.isVip ? (
                <span className="px-2 py-0.5 rounded-full bg-[#00E676]/20 border border-[#00E676]/40 text-[#00E676] text-[10px] font-black uppercase tracking-wider">
                  VIP Lifetime
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold uppercase">
                  Free Tier
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              ID: KLI-PRO-{userAccount.isVip ? 'VIP-ACTIVE' : 'FREE-TIER'}
            </p>
          </div>
        </div>

        {/* Quota Tracking Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-300">
              Free Edits Left:
            </span>
            <span className="text-sm font-black font-mono text-[#00E676]">
              {userAccount.isVip ? '∞ Unlimited Pro' : `${userAccount.freeExportsRemaining} / 2`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                userAccount.isVip
                  ? 'bg-gradient-to-r from-[#00E676] to-[#00B0FF] w-full shadow-[0_0_10px_rgba(0,230,118,0.5)]'
                  : userAccount.freeExportsRemaining > 0
                  ? 'bg-[#00E676]'
                  : 'bg-red-500'
              }`}
              style={{
                width: userAccount.isVip
                  ? '100%'
                  : `${(userAccount.freeExportsRemaining / 2) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Total Exports Completed: {userAccount.totalExports}</span>
            {!userAccount.isVip && (
              <span className="text-neutral-400">
                {userAccount.freeExportsRemaining === 0 ? 'Quota Depleted' : 'Trial Active'}
              </span>
            )}
          </div>
        </div>

        {/* Watermark Removal setting (VIP only or locked) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 text-[#00E676]">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                Remove KliPro AI Watermark
                {!userAccount.isVip && (
                  <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.2 rounded font-black uppercase">
                    Pro Perk
                  </span>
                )}
              </p>
              <p className="text-[10px] text-neutral-400">
                Semi-transparent top-right corner emblem
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!userAccount.isVip}
              checked={userAccount.isVip && removeWatermark}
              onChange={(e) => {
                if (!userAccount.isVip) {
                  onOpenPaywall();
                  return;
                }
                setRemoveWatermark(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div
              onClick={() => {
                if (!userAccount.isVip) onOpenPaywall();
              }}
              className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"
            />
          </label>
        </div>

        {/* Upgrade or VIP Status button */}
        {!userAccount.isVip ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPaywall();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] text-black font-black text-xs uppercase tracking-wider hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(0,230,118,0.4)] mb-3 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            Upgrade to KliPro Pro (From ₹49)
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/30 text-center mb-3">
            <p className="text-xs font-bold text-[#00E676] flex items-center justify-center gap-1.5">
              <Shield className="w-4 h-4" /> Pro Plan Active ({userAccount.planId ? userAccount.planId.toUpperCase() : 'VIP'})
            </p>
            {userAccount.utrVerified && (
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Verified Ref: {userAccount.utrVerified}
              </p>
            )}
          </div>
        )}

        {/* Developer / Demo Reset Helper */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-neutral-400 text-xs">
          <span className="text-[11px]">Testing Paywall Flow?</span>
          <button
            type="button"
            onClick={onResetQuota}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-[#00E676] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Trial (2 Edits)
          </button>
        </div>
      </div>
    </div>
  );
};
