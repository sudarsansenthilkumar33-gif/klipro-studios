import React, { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  QrCode,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Lock,
  Copy,
  Check,
  Crown,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { KliProLogo } from './KliProLogo';
import { SubscriptionPlan } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: (utr: string, planId: 'weekly' | 'monthly' | 'lifetime') => void;
  reason?: 'limit_reached' | 'manual_upgrade' | 'watermark_removal';
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Creator',
    price: 49,
    period: '/ week',
    subtitle: 'Low barrier, impulse creator pass',
    tag: 'Quick Pass',
  },
  {
    id: 'monthly',
    name: 'Monthly Unlimited',
    price: 149,
    period: '/ month',
    subtitle: 'Unlimited 9:16 AI exports, priority render',
    tag: 'Best Value & Recommended',
    isRecommended: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime VIP',
    price: 399,
    period: 'one-time',
    subtitle: 'Forever access, zero renewals, all future tools',
    tag: 'Lifetime Access',
  },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
  reason = 'limit_reached',
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'weekly' | 'monthly' | 'lifetime'>('monthly');
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [copiedUri, setCopiedUri] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  // Dynamically constructed standard NPCI UPI URI with selected price
  // Payee display name in UI is strictly "KliPro Studios" to keep personal handle & phone hidden from screen
  const upiUri = `upi://pay?pa=sudarsansenthilkumar33@oksbi&pn=KliPro%20Studios&am=${selectedPlan.price}&cu=INR&tn=KliPro%20VIP%20Upgrade`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;

  const handleOpenUpiApp = () => {
    // Deep link directly to installed UPI app
    window.location.href = upiUri;
  };

  const handleCopyPaymentString = () => {
    navigator.clipboard.writeText(upiUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleVerifyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length < 6) {
      setVerifyError('Please enter a valid 12-digit UTR / UPI reference number.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);

      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00E676', '#00B0FF', '#ffffff', '#FFD700'],
      });

      onUpgradeSuccess(cleanUtr, selectedPlan.id);
      onClose();
    }, 1200);
  };

  const handleInstantDemoVerify = () => {
    setIsVerifying(true);
    const mockUtr = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
    setTimeout(() => {
      setIsVerifying(false);
      confetti({
        particleCount: 150,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#00E676', '#00B0FF', '#ffffff', '#FFD700'],
      });
      onUpgradeSuccess(mockUtr, selectedPlan.id);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0b0c10] border border-[#00E676]/35 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,230,118,0.25)] text-white my-6 overflow-hidden">
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-[#00E676]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2.5">
            <KliProLogo size="lg" showText={false} glow={true} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E676]/15 border border-[#00E676]/30 text-[#00E676] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade to KliPro Pro
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Unlock <span className="text-[#00E676]">Unlimited AI Edits</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
            {reason === 'limit_reached'
              ? 'You have used your 2 free export quota. Pick a creator plan to unlock instant unlimited 9:16 rendering.'
              : 'Export without watermark, render 4K Ken Burns reels, and unlock all multilingual AI captions.'}
          </p>
        </div>

        {/* 3 High-Conversion Tiered Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#00E676]/12 border-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.3)] ring-1 ring-[#00E676]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#00E676] text-black font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                    Best Value
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-extrabold text-white">{plan.name}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-600" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 my-1.5">
                    <span className="text-2xl font-black text-[#00E676]">₹{plan.price}</span>
                    <span className="text-[10px] text-neutral-400 font-medium">{plan.period}</span>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                  {plan.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Indirect UPI Payment Box */}
        <div className="bg-black/75 rounded-2xl p-4 border border-white/10 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-[#00E676]" />
              Indirect UPI Gateway
            </div>
            <span className="text-[11px] font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/25">
              Payee: KliPro Studios
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Dynamic QR Code */}
            <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 group relative">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-32 h-32 rounded-lg object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-xl p-2 text-center">
                <span className="text-[9px] text-white font-bold">
                  Scan with GPay, PhonePe, Paytm, or BHIM
                </span>
              </div>
            </div>

            {/* Payment Details & Actions */}
            <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-between">
              <div>
                <p className="text-xs text-neutral-300 font-medium">
                  Scan QR with any UPI app, or tap below to launch your phone's UPI app:
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-semibold">
                    Google Pay
                  </span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-semibold">
                    PhonePe
                  </span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-semibold">
                    Paytm
                  </span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-semibold">
                    BHIM
                  </span>
                </div>
              </div>

              {/* Direct UPI App Trigger */}
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenUpiApp}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c968] text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_18px_rgba(0,230,118,0.4)] cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  Open UPI App (Pay Now ₹{selectedPlan.price})
                </button>

                <button
                  type="button"
                  onClick={handleCopyPaymentString}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedUri ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00E676]" />
                      <span className="text-[#00E676]">UPI Intent String Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI Intent String</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        {!showVerifyInput ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowVerifyInput(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wide border border-white/10 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#00E676]" />
              I Have Paid / Enter 12-Digit UTR
            </button>

            <button
              type="button"
              onClick={handleInstantDemoVerify}
              className="text-[11px] text-neutral-400 hover:text-[#00E676] transition-colors py-1 text-center cursor-pointer"
            >
              ⚡ Instant Demo Verification (Test without bank deduction)
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyPayment} className="space-y-3 bg-neutral-900/80 p-4 rounded-2xl border border-white/10">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Enter 12-Digit UPI UTR / Transaction Reference Number:
              </label>
              <input
                type="text"
                placeholder="e.g. 429381920194"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-[#00E676]"
                autoFocus
              />
              {verifyError && <p className="text-[11px] text-red-400 mt-1">{verifyError}</p>}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00E676] hover:bg-[#00c968] text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Confirming Payment...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 fill-black" />
                    Unlock VIP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyInput(false)}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
              >
                Back
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-[#00E676]" />
            Official NPCI UPI protocol. Direct peer-to-merchant gateway.
          </p>
        </div>
      </div>
    </div>
  );
};
