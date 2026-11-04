import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Flame,
  Film,
  Sparkles,
  Clock,
  Hash,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { KliProLogo } from './KliProLogo';
import { SocialKit, CaptionSegment } from '../types';
import { sfx } from '../utils/soundEffects';

interface ShareSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoBlob: Blob | null;
  videoTitle: string;
  socialKit?: SocialKit | null;
  captions?: CaptionSegment[];
  language?: string;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoBlob,
  videoTitle,
  socialKit: initialSocialKit,
  captions = [],
  language = 'English',
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoadingKit, setIsLoadingKit] = useState(false);

  const [kit, setKit] = useState<SocialKit>(() => {
    return (
      initialSocialKit || {
        caption: `This 9:16 reel is breaking the algorithm! 🔥 Auto-edited with synchronized kinetic captions & beat-sync zooms using #KliPro. Drop a comment below if you want the breakdown! 👇✨`,
        hashtags: [
          '#ViralReels',
          '#ShortsFeed',
          '#TrendingAudio',
          '#CapCutEdit',
          '#KliPro',
          '#ContentCreator',
          '#ReelKaroFeelKaro',
          '#CreatorEconomy',
          '#VideoEditingHacks',
          '#InstagramGrowth',
          '#ShortFormContent',
          '#ReelAlgorithm',
          '#VideoProduction',
          '#CreatorTools',
          '#FYP',
        ],
        bestTimes: '6:00 PM - 9:30 PM (Peak Feed Traffic)',
        estimatedReach: '120K - 450K Potential Impressions',
      }
    );
  });

  // When opened, fetch personalized social kit if available
  useEffect(() => {
    if (isOpen && !initialSocialKit) {
      let isMounted = true;
      setIsLoadingKit(true);
      fetch('/api/ai/social-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          captions,
          language,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data && data.kit && data.kit.caption) {
            setKit(data.kit);
          }
        })
        .catch((e) => console.log('Social kit fetch notice:', e))
        .finally(() => {
          if (isMounted) setIsLoadingKit(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, videoTitle, language, initialSocialKit]);

  if (!isOpen) return null;

  const sampleCaption = kit.caption;

  const handleCopyAll = () => {
    const fullText = `${kit.caption}\n\n${kit.hashtags.join(' ')}\n\n⏰ Best Time to Post: ${kit.bestTimes}\n🚀 Potential Reach: ${kit.estimatedReach}`;
    navigator.clipboard.writeText(fullText);
    sfx.playPopHit();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyCaptionOnly = () => {
    navigator.clipboard.writeText(kit.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHashtagsOnly = () => {
    navigator.clipboard.writeText(kit.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (videoBlob && navigator.canShare && navigator.canShare({ files: [new File([videoBlob], 'klipro_export.mp4', { type: 'video/mp4' })] })) {
          const file = new File([videoBlob], 'klipro_export.mp4', { type: 'video/mp4' });
          await navigator.share({
            files: [file],
            title: videoTitle || 'KliPro Video',
            text: sampleCaption,
          });
          return;
        }

        await navigator.share({
          title: videoTitle || 'KliPro Video',
          text: sampleCaption,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Native share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${sampleCaption}\nWatch & edit in KliPro: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleInstagramShare = () => {
    // Copy caption and trigger download so user can upload directly to IG Stories
    navigator.clipboard.writeText(sampleCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);

    // Download video directly
    handleDownloadVideo();
  };

  const handleYouTubeShortsShare = () => {
    window.open('https://studio.youtube.com/channel/create/short', '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadVideo = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `klipro_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e0f14] border border-white/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,230,118,0.15)] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00E676]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4 shrink-0">
          <div className="flex justify-center mb-2">
            <KliProLogo size="md" showText={false} glow={true} />
          </div>
          <h3 className="text-xl font-black text-white">Video Export Ready!</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            1080x1920 (9:16) format ready for high-retention feeds
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-4">
          {/* Direct Download Action */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-[#00E676]/30 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,230,118,0.15)]">
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-2.5 rounded-xl bg-[#00E676]/15 text-[#00E676]">
                <Film className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Rendered 9:16 MP4 Video</p>
                <p className="text-[10px] text-neutral-400">Burned kinetic subtitles • Beat zooms</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadVideo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c968] text-black font-black text-xs transition-colors shrink-0 shadow-[0_0_15px_rgba(0,230,118,0.3)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </button>
          </div>

          {/* Feature 4: 1-Click Post-Ready Social Kit */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-[#00E676]/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00E676]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Social Media Kit
                </span>
                {isLoadingKit && (
                  <span className="text-[10px] text-neutral-400 italic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
                    AI tailoring...
                  </span>
                )}
              </div>

              {/* 1-Click Copy All Button */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E676] hover:bg-[#00c968] text-black font-extrabold text-xs transition-all shadow-[0_0_12px_rgba(0,230,118,0.3)] cursor-pointer"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied Kit!' : 'Copy All'}</span>
              </button>
            </div>

            {/* AI-Crafted Caption */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  AI Viral Caption Description
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaptionOnly}
                  className="text-[10px] text-[#00E676] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCaption ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-neutral-200 font-medium leading-relaxed select-all">
                {kit.caption}
              </p>
            </div>

            {/* 15 Targeted Hashtags */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#00E676]" />
                  15 Algorithm-Targeted Hashtags
                </span>
                <button
                  type="button"
                  onClick={handleCopyHashtagsOnly}
                  className="text-[10px] text-[#00E676] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedHashtags ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedHashtags ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {kit.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Meta Data: Recommended Posting Time & Reach */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-neutral-400 text-[10px] flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-[#00E676]" />
                  Best Time to Post:
                </span>
                <span className="font-bold text-white mt-0.5 block">{kit.bestTimes}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-neutral-400 text-[10px] flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3 text-[#00E676]" />
                  Estimated Reach:
                </span>
                <span className="font-bold text-[#00E676] mt-0.5 block">{kit.estimatedReach}</span>
              </div>
            </div>
          </div>

          {/* 1-Tap Native Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs transition-all border border-white/10 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            1-Tap Native Share (All Apps)
          </button>

          {/* Social platform shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-[#25D366]/20 border border-white/5 hover:border-[#25D366]/40 transition-all text-neutral-200 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-[11px] font-bold">WhatsApp</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/40 transition-all text-neutral-200 cursor-pointer"
            >
              <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-[11px] font-bold">IG Stories</span>
            </button>

            {/* YouTube Shorts */}
            <button
              type="button"
              onClick={handleYouTubeShortsShare}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-red-500/20 border border-white/5 hover:border-red-500/40 transition-all text-neutral-200 cursor-pointer"
            >
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="text-[11px] font-bold">YT Shorts</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 mt-2 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Link Copied!' : 'Copy Studio Link'}
          </button>

          {copiedAll && (
            <span className="text-[11px] text-[#00E676] font-semibold animate-pulse">
              Full Social Kit copied! Ready to post.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
