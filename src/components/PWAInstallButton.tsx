import React, { useState } from 'react';
import { DownloadCloud, Check, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed in standalone mode, do not display
  if (isInstalled) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const success = await installApp();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-[#00E676] hover:border-[#00E676]/40 transition-all cursor-pointer"
        title="Install KliPro to your desktop or mobile home screen"
      >
        {installedSuccess ? (
          <Check className="w-3.5 h-3.5 text-[#00E676]" />
        ) : (
          <DownloadCloud className="w-3.5 h-3.5 text-[#00E676]" />
        )}
        <span className="hidden sm:inline">
          {installedSuccess ? 'Installed!' : 'Install App'}
        </span>
      </button>

      {/* iOS Safari Guided Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-sm w-full bg-[#0d0e12] border border-white/10 rounded-3xl p-6 text-white text-center shadow-2xl">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center mx-auto mb-3 text-[#00E676]">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black mb-1.5">Install KliPro on iOS</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Install KliPro directly on your iPhone or iPad for fullscreen standalone editing:
            </p>

            <div className="space-y-2.5 text-left text-xs bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00E676] text-black font-extrabold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap the Safari <strong>Share</strong> button at bottom
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00E676] text-black font-extrabold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00E676] text-black font-extrabold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <span>
                  Tap <strong>"Add"</strong> in top-right corner
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E676] text-black font-extrabold text-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
