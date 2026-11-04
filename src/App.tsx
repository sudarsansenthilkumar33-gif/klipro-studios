import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Film,
  Image as ImageIcon,
  Languages,
  Palette,
  Flame,
  CheckCircle2,
  Crown,
  Share2,
  Download,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Type,
  Sliders,
} from 'lucide-react';
import {
  MediaItem,
  CaptionSegment,
  BRollMoment,
  MotionGraphicItem,
  ColorGradePreset,
  AutoFormatMode,
  CaptionStyleMode,
  HookIntroConfig,
  BeatSyncConfig,
  UserAccount,
} from './types';
import {
  SAMPLE_MEDIA_ITEMS,
  INITIAL_CAPTIONS,
  INITIAL_BROLL,
  INITIAL_MOTION_GRAPHICS,
} from './utils/sampleData';
import { renderAndExportVideo } from './utils/exportVideo';
import { Header } from './components/Header';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { CaptionEditor } from './components/CaptionEditor';
import { MotionGraphicsToolbar } from './components/MotionGraphicsToolbar';
import { ColorGradeSelector } from './components/ColorGradeSelector';
import { PaywallModal } from './components/PaywallModal';
import { ShareSheetModal } from './components/ShareSheetModal';
import { ProfileModal } from './components/ProfileModal';
import { SplashScreen } from './components/SplashScreen';
import { KliProLogo } from './components/KliProLogo';

const LOCAL_STORAGE_KEY = 'klipro_user_account_v3';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // User Account & Quota State
  const [userAccount, setUserAccount] = useState<UserAccount>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading localStorage', e);
    }
    return {
      freeExportsRemaining: 2,
      isVip: false,
      totalExports: 0,
      planId: undefined,
    };
  });

  // Save account to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userAccount));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  }, [userAccount]);

  // Media state
  const [media, setMedia] = useState<MediaItem>(SAMPLE_MEDIA_ITEMS[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Creator features states
  const [captions, setCaptions] = useState<CaptionSegment[]>(INITIAL_CAPTIONS);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US / UK)');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleMode>('viral_yellow');
  const [bRollMoments, setBRollMoments] = useState<BRollMoment[]>(INITIAL_BROLL);
  const [motionGraphics, setMotionGraphics] = useState<MotionGraphicItem[]>(INITIAL_MOTION_GRAPHICS);
  const [colorGrade, setColorGrade] = useState<ColorGradePreset>('auto_enhance');
  const [autoFormatMode, setAutoFormatMode] = useState<AutoFormatMode>('ambient_blur');
  const [removeWatermark, setRemoveWatermark] = useState(false);

  // Viral Creator Tools: Auto-Hook & Beat-Sync
  const [hookIntro, setHookIntro] = useState<HookIntroConfig>({
    enabled: true,
    text: 'Wait for the end 🤯',
    duration: 3.0,
  });

  const [beatSync, setBeatSync] = useState<BeatSyncConfig>({
    enabled: true,
    bpm: 128,
    sfxEnabled: true,
  });

  // Feature 2: Infinite Perfect Loop Matcher
  const [infiniteLoop, setInfiniteLoop] = useState(true);

  // Active Tab: 'captions' | 'motion' | 'color'
  const [activeTab, setActiveTab] = useState<'captions' | 'motion' | 'color'>('captions');

  // Modals & Export state
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'limit_reached' | 'manual_upgrade' | 'watermark_removal'>('limit_reached');
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState('');
  const [isGeneratingAiCaptions, setIsGeneratingAiCaptions] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Media toggle play/pause
  const handleTogglePlay = () => {
    if (media.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Upload handler for user videos and photos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    if (!isVideo && !isImage) {
      alert('Please select a valid video (MP4/WEBM/MOV) or photo (JPG/PNG).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newMedia: MediaItem = {
      id: `user-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: isVideo ? 'video' : 'photo',
      url: objectUrl,
      thumbnailUrl: objectUrl,
      aspectRatio: '16:9',
      duration: isVideo ? 12 : 8,
    };

    setMedia(newMedia);
    setCurrentTime(0);
    setIsPlaying(false);

    // Automatically trigger AI caption and highlight detection for user uploaded media
    handleGenerateAiCaptions(selectedLanguage, newMedia);
  };

  // Gemini AI Caption Generation handler
  const handleGenerateAiCaptions = async (targetLang: string, targetMedia = media) => {
    setIsGeneratingAiCaptions(true);
    try {
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: targetLang,
          mediaType: targetMedia.type,
          title: targetMedia.name,
          duration: targetMedia.duration || 10,
        }),
      });

      const data = await response.json();
      if (data && data.captions && data.captions.length > 0) {
        const formattedCaptions: CaptionSegment[] = data.captions.map(
          (c: any, index: number) => ({
            id: `cap-${Date.now()}-${index}`,
            start: c.start || 0,
            end: c.end || 2.5,
            text: c.text,
            highlightWord: c.highlightWord || '',
            words: c.words || [],
          })
        );
        setCaptions(formattedCaptions);

        if (data.bRollMoments && data.bRollMoments.length > 0) {
          const formattedBRoll: BRollMoment[] = data.bRollMoments.map(
            (b: any, index: number) => ({
              id: `broll-${Date.now()}-${index}`,
              time: b.time || 2,
              duration: b.duration || 1.8,
              label: b.label || 'Highlight Cutaway',
              category: b.category || 'reaction',
              mediaUrl:
                INITIAL_BROLL[index % INITIAL_BROLL.length]?.mediaUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            })
          );
          setBRollMoments(formattedBRoll);
        }

        if (data.motionGraphics && data.motionGraphics.length > 0) {
          const formattedMG: MotionGraphicItem[] = data.motionGraphics.map(
            (m: any, index: number) => ({
              id: `mg-${Date.now()}-${index}`,
              time: m.time || 0.5,
              type: m.type || 'kinetic_badge',
              text: m.text || '🔥 VIRAL HOOK',
            })
          );
          setMotionGraphics(formattedMG);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI captions:', err);
    } finally {
      setIsGeneratingAiCaptions(false);
    }
  };

  // Export 9:16 Video handler with Paywall verification
  const handleExportClick = async () => {
    // 2-Free-Export Quota Check:
    // If not VIP and remaining quota is 0, block download and show paywall!
    if (!userAccount.isVip && userAccount.freeExportsRemaining <= 0) {
      setPaywallReason('limit_reached');
      setIsPaywallOpen(true);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('Initializing 9:16 vertical render engine...');

    try {
      const blob = await renderAndExportVideo({
        media,
        captions,
        bRollMoments,
        motionGraphics,
        colorGrade,
        autoFormatMode,
        captionStyle,
        showWatermark: !userAccount.isVip || !removeWatermark,
        hookIntro,
        beatSync,
        infiniteLoop,
        videoElement: videoRef.current,
        onProgress: (prog, status) => {
          setExportProgress(prog);
          setExportStatusText(status);
        },
      });

      // Update Quota: decrement 1 free edit if not VIP
      setUserAccount((prev) => ({
        ...prev,
        freeExportsRemaining: prev.isVip ? 9999 : Math.max(0, prev.freeExportsRemaining - 1),
        totalExports: prev.totalExports + 1,
      }));

      const url = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedUrl(url);

      // Open 1-tap share modal
      setIsShareSheetOpen(true);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export encountered an issue. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // VIP Upgrade confirmation handler
  const handleUpgradeSuccess = (utr: string, planId: 'weekly' | 'monthly' | 'lifetime') => {
    setUserAccount({
      isVip: true,
      freeExportsRemaining: 9999,
      planId,
      totalExports: userAccount.totalExports,
      unlockedAt: new Date().toISOString(),
      utrVerified: utr,
    });
  };

  // Reset Quota for testing
  const handleResetQuota = () => {
    setUserAccount({
      isVip: false,
      freeExportsRemaining: 2,
      totalExports: 0,
      planId: undefined,
    });
    alert('Free trial reset! You now have 2 free exports remaining.');
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white flex flex-col selection:bg-[#00E676] selection:text-black">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <Header
        userAccount={userAccount}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPaywall={() => {
          setPaywallReason('manual_upgrade');
          setIsPaywallOpen(true);
        }}
        onUploadClick={() => fileInputRef.current?.click()}
        onExportClick={handleExportClick}
        isExporting={isExporting}
      />

      {/* Free Trial Quota Notice Banner (if Free Tier) */}
      {!userAccount.isVip && (
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-white/5 py-1.5 px-4 text-center select-none">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-neutral-300">
              Free Trial Active: You have{' '}
              <strong className="text-[#00E676] font-mono font-bold">
                {userAccount.freeExportsRemaining} of 2
              </strong>{' '}
              automated 9:16 edits left.
            </span>
            <button
              type="button"
              onClick={() => {
                setPaywallReason('manual_upgrade');
                setIsPaywallOpen(true);
              }}
              className="text-[#00E676] hover:underline font-bold text-xs ml-1 inline-flex items-center gap-1 cursor-pointer"
            >
              Upgrade Pro (From ₹49) →
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* Left Column: 9:16 Video Player & Auto-Framing Preview    */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Sample Switcher Pills */}
          <div className="w-full max-w-sm mb-3 flex items-center justify-between gap-1 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
              Sample:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {SAMPLE_MEDIA_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMedia(item);
                    setCurrentTime(0);
                    setIsPlaying(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    media.id === item.id
                      ? 'bg-[#00E676] text-black shadow-[0_0_10px_rgba(0,230,118,0.5)]'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {item.type === 'photo' ? '📷 ' : '🎬 '}
                  {item.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 9:16 Video Player Canvas */}
          <VideoPlayerPreview
            media={media}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            captions={captions}
            bRollMoments={bRollMoments}
            motionGraphics={motionGraphics}
            colorGrade={colorGrade}
            autoFormatMode={autoFormatMode}
            captionStyle={captionStyle}
            showWatermark={!userAccount.isVip || !removeWatermark}
            hookIntro={hookIntro}
            beatSync={beatSync}
            infiniteLoop={infiniteLoop}
            videoRef={videoRef}
          />

          {/* Quick Upload Helper Bar */}
          <div className="w-full max-w-sm mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {media.type === 'video' ? (
                <Film className="w-4 h-4 text-[#00E676]" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#00E676]" />
              )}
              <span className="text-xs text-neutral-300 truncate max-w-[170px]">
                {media.name}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#00E676] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" /> Change File
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Right Column: Automated Multi-Format Controls & AI Tools */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Navigation Tabs */}
          <div className="p-1.5 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('captions')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'captions'
                  ? 'bg-[#00E676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>AI Captions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('motion')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'motion'
                  ? 'bg-[#00E676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Hook, Beat & SFX</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('color')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-[#00E676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Settings, Loop & LUTs</span>
            </button>
          </div>

          {/* Tab 1: AI Multilingual Captions */}
          {activeTab === 'captions' && (
            <CaptionEditor
              captions={captions}
              onUpdateCaptions={setCaptions}
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => {
                setSelectedLanguage(lang);
                handleGenerateAiCaptions(lang);
              }}
              captionStyle={captionStyle}
              onCaptionStyleChange={setCaptionStyle}
              onGenerateAiCaptions={(lang) => handleGenerateAiCaptions(lang)}
              isGenerating={isGeneratingAiCaptions}
              currentTime={currentTime}
              onSeek={(time) => {
                setCurrentTime(time);
                if (videoRef.current && media.type === 'video') {
                  videoRef.current.currentTime = time;
                }
              }}
            />
          )}

          {/* Tab 2: Auto-Hook, Beat-Sync, B-Roll & Motion Graphics */}
          {activeTab === 'motion' && (
            <MotionGraphicsToolbar
              bRollMoments={bRollMoments}
              onUpdateBRoll={setBRollMoments}
              motionGraphics={motionGraphics}
              onUpdateMotionGraphics={setMotionGraphics}
              hookIntro={hookIntro}
              onUpdateHookIntro={setHookIntro}
              beatSync={beatSync}
              onUpdateBeatSync={setBeatSync}
              currentTime={currentTime}
              onSeek={(time) => {
                setCurrentTime(time);
                if (videoRef.current && media.type === 'video') {
                  videoRef.current.currentTime = time;
                }
              }}
              captions={captions}
              onUpdateCaptions={setCaptions}
              mediaTitle={media.name}
              selectedLanguage={selectedLanguage}
            />
          )}

          {/* Tab 3: 9:16 Auto-Format & Color Grading LUTs */}
          {activeTab === 'color' && (
            <ColorGradeSelector
              colorGrade={colorGrade}
              onColorGradeChange={setColorGrade}
              autoFormatMode={autoFormatMode}
              onAutoFormatModeChange={setAutoFormatMode}
              infiniteLoop={infiniteLoop}
              onInfiniteLoopChange={setInfiniteLoop}
            />
          )}

          {/* Export Action Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-black border border-[#00E676]/30 shadow-[0_0_30px_rgba(0,230,118,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00E676]" />
                Ready to Export 9:16 Video
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Burned-in kinetic subtitles, auto-hook intro, beat-sync zooms & 1080x1920 vertical format.
              </p>
            </div>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] text-black font-black text-sm tracking-wide hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,230,118,0.5)] cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{exportProgress}% Rendering</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>Export 9:16 Short</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Exporting Progress Modal Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full bg-[#0b0c10] border border-[#00E676]/30 rounded-3xl p-6 text-center text-white shadow-2xl">
            <div className="flex justify-center mb-3">
              <KliProLogo size="lg" showText={false} glow={true} />
            </div>

            <h3 className="text-lg font-black mb-1">Rendering 9:16 Video</h3>
            <p className="text-xs text-neutral-400 mb-4">{exportStatusText}</p>

            <div className="w-full bg-neutral-900 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#00E676] to-[#00b0ff] rounded-full transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
            </div>

            <span className="text-xs font-mono font-bold text-[#00E676]">
              {exportProgress}% Completed
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
        reason={paywallReason}
      />

      <ShareSheetModal
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        videoUrl={exportedUrl}
        videoBlob={exportedBlob}
        videoTitle={media.name}
        captions={captions}
        language={selectedLanguage}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userAccount={userAccount}
        onOpenPaywall={() => {
          setIsProfileOpen(false);
          setPaywallReason('manual_upgrade');
          setIsPaywallOpen(true);
        }}
        onResetQuota={handleResetQuota}
        removeWatermark={removeWatermark}
        setRemoveWatermark={setRemoveWatermark}
      />
    </div>
  );
}
