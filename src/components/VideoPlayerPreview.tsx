import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Flame,
  Activity,
  Layers,
  Crop,
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
} from '../types';
import { COLOR_PRESETS } from '../utils/sampleData';
import { KliProLogo } from './KliProLogo';
import { sfx } from '../utils/soundEffects';

interface VideoPlayerPreviewProps {
  media: MediaItem;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  captions: CaptionSegment[];
  bRollMoments: BRollMoment[];
  motionGraphics: MotionGraphicItem[];
  colorGrade: ColorGradePreset;
  autoFormatMode: AutoFormatMode;
  captionStyle: CaptionStyleMode;
  showWatermark: boolean;
  hookIntro: HookIntroConfig;
  beatSync: BeatSyncConfig;
  infiniteLoop?: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  media,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onTogglePlay,
  captions,
  bRollMoments,
  motionGraphics,
  colorGrade,
  autoFormatMode,
  captionStyle,
  showWatermark,
  hookIntro,
  beatSync,
  infiniteLoop = false,
  videoRef,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const photoAnimationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSfxTriggerRef = useRef<number>(-1);

  // Active color grade filter
  const activeFilter = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorGrade);
    return preset ? preset.filter : 'none';
  }, [colorGrade]);

  // Handle Photo Ken Burns Animation timer when playing
  useEffect(() => {
    if (media.type === 'photo') {
      let lastTimestamp = performance.now();
      const updatePhotoPlayback = (now: number) => {
        if (isPlaying) {
          const delta = (now - lastTimestamp) / 1000;
          const nextTime = currentTime + delta;
          if (nextTime >= media.duration) {
            onTimeUpdate(0);
          } else {
            onTimeUpdate(nextTime);
          }
        }
        lastTimestamp = now;
        photoAnimationRef.current = requestAnimationFrame(updatePhotoPlayback);
      };

      photoAnimationRef.current = requestAnimationFrame(updatePhotoPlayback);
      return () => {
        if (photoAnimationRef.current) cancelAnimationFrame(photoAnimationRef.current);
      };
    }
  }, [media, isPlaying, currentTime, onTimeUpdate]);

  // Video timeupdate sync
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && media.type === 'video') {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Find active caption segment
  const activeCaption = useMemo(() => {
    return captions.find((c) => currentTime >= c.start && currentTime <= c.end);
  }, [captions, currentTime]);

  // Find active B-Roll
  const activeBRoll = useMemo(() => {
    return bRollMoments.find(
      (b) => currentTime >= b.time && currentTime <= b.time + b.duration
    );
  }, [bRollMoments, currentTime]);

  // Find active Motion Graphic item (active for 1.4 seconds around trigger)
  const activeMotionGraphic = useMemo(() => {
    return motionGraphics.find(
      (mg) => currentTime >= mg.time && currentTime <= mg.time + 1.4
    );
  }, [motionGraphics, currentTime]);

  // Smart Beat-Sync Calculation: periodic 1.8s kinetic zoom pulse
  const beatScaleBump = useMemo(() => {
    if (!beatSync.enabled) return 1;
    const beatInterval = 1.8;
    const phase = currentTime % beatInterval;
    if (phase < 0.2) {
      // 1.0 -> 1.07 -> 1.0
      const intensity = Math.sin((phase / 0.2) * Math.PI);
      return 1 + intensity * 0.07;
    }
    return 1;
  }, [beatSync.enabled, currentTime]);

  // SFX triggers for Beat & Motion Graphics
  useEffect(() => {
    if (!isPlaying || !beatSync.sfxEnabled) return;
    const currentFloor = Math.floor(currentTime * 10);
    if (lastSfxTriggerRef.current !== currentFloor) {
      if (activeMotionGraphic && Math.abs(currentTime - activeMotionGraphic.time) < 0.15) {
        sfx.playPopHit();
        lastSfxTriggerRef.current = currentFloor;
      } else if (beatSync.enabled && (currentTime % 1.8) < 0.15) {
        sfx.playWhoosh();
        lastSfxTriggerRef.current = currentFloor;
      }
    }
  }, [currentTime, isPlaying, beatSync, activeMotionGraphic]);

  // Ken Burns calculation for photos (smooth pan and zoom over duration)
  const photoKenBurnsTransform = useMemo(() => {
    if (media.type !== 'photo') return '';
    const progress = (currentTime % media.duration) / media.duration;
    const scale = (1.05 + Math.sin(progress * Math.PI) * 0.18) * beatScaleBump;
    const translateX = Math.cos(progress * Math.PI) * 15;
    const translateY = Math.sin(progress * Math.PI) * 12;
    return `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
  }, [media.type, currentTime, media.duration, beatScaleBump]);

  const [videoError, setVideoError] = useState(false);

  // Reset video error when media changes
  useEffect(() => {
    setVideoError(false);
  }, [media.url]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn('Video failed to load or unsupported codec:', media.url, e);
    setVideoError(true);
  };

  // Infinite Perfect Loop crossfade calculation: blends last 0.5s into opening frame
  const loopCrossfadeOpacity = useMemo(() => {
    if (!infiniteLoop || media.duration <= 1) return 0;
    const loopStartTime = Math.max(0.5, media.duration - 0.5);
    if (currentTime >= loopStartTime) {
      return Math.min(1, Math.max(0, (currentTime - loopStartTime) / 0.5));
    }
    return 0;
  }, [infiniteLoop, currentTime, media.duration]);

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-sm mx-auto">
      {/* 9:16 Aspect Ratio Frame */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[9/16] rounded-[28px] overflow-hidden bg-black border-2 border-white/10 shadow-[0_0_55px_rgba(0,0,0,0.85)] group transition-all duration-300"
      >
        {/* ============================================================ */}
        {/* LAYER 1: Ambient Blurred Mirror Background (Auto-Format 9:16) */}
        {/* ============================================================ */}
        {autoFormatMode === 'ambient_blur' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none scale-125 filter blur-3xl brightness-60 opacity-90 transition-all duration-500">
            <img
              src={media.thumbnailUrl || media.url}
              alt="ambient-bg"
              className="w-full h-full object-cover"
              style={{
                filter: activeFilter,
                transform: media.type === 'photo' ? photoKenBurnsTransform : undefined,
              }}
            />
          </div>
        )}

        {/* Ambient Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/60 pointer-events-none z-10" />

        {/* ============================================================ */}
        {/* LAYER 2: Sharp Main Media (Video or Photo Ken Burns)        */}
        {/* ============================================================ */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            autoFormatMode === 'smart_crop' ? 'scale-100' : 'p-0'
          }`}
          style={{
            transform: media.type === 'video' ? `scale(${beatScaleBump})` : undefined,
          }}
        >
          {media.type === 'video' ? (
            videoError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center bg-neutral-900/90 rounded-2xl border border-white/10 m-4">
                <span className="text-2xl mb-2">⚠️</span>
                <p className="text-xs font-bold text-white mb-1">Video Stream Notice</p>
                <p className="text-[10px] text-neutral-400 mb-3">
                  This media format could not be decoded directly by the browser.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVideoError(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#00E676] text-black font-extrabold text-xs cursor-pointer"
                >
                  Retry Playback
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={media.url}
                playsInline
                muted={isMuted}
                crossOrigin="anonymous"
                onError={handleVideoError}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className={`max-w-full max-h-full transition-transform duration-300 ${
                  autoFormatMode === 'smart_crop'
                    ? 'w-full h-full object-cover scale-110'
                    : 'w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]'
                }`}
                style={{ filter: activeFilter }}
              />
            )
          ) : (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={media.url}
                alt={media.name}
                className="w-full h-full object-cover transition-all duration-150 ease-out drop-shadow-2xl"
                style={{
                  filter: activeFilter,
                  transform: photoKenBurnsTransform,
                }}
              />
            </div>
          )}

          {/* Infinite Loop Crossfade Layer: Dissolves into frame 0.0 during last 0.5s */}
          {loopCrossfadeOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-75"
              style={{ opacity: loopCrossfadeOpacity }}
            >
              <img
                src={media.thumbnailUrl || media.url}
                alt="loop-intro-frame"
                className={
                  autoFormatMode === 'smart_crop'
                    ? 'w-full h-full object-cover scale-110'
                    : 'w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]'
                }
                style={{ filter: activeFilter }}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* LAYER 3: Cinematic Light Leaks & Floating Particles (Photos)  */}
        {/* ============================================================ */}
        {media.type === 'photo' && (
          <>
            {/* Light leak sweep */}
            <div className="absolute inset-0 z-14 pointer-events-none overflow-hidden">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-300/12 to-transparent animate-light-leak" />
            </div>

            {/* Ambient glowing dust particles */}
            <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
              <div className="absolute w-2 h-2 rounded-full bg-[#00E676]/60 blur-[1px] top-1/4 left-1/4 animate-[floatParticle_4s_infinite_ease-in-out]" />
              <div className="absolute w-3 h-3 rounded-full bg-white/40 blur-[1px] top-2/3 right-1/4 animate-[floatParticle_5s_infinite_ease-in-out_1s]" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#00b0ff]/50 blur-[1px] top-1/2 left-2/3 animate-[floatParticle_3.5s_infinite_ease-in-out_2s]" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00E676]/40 blur-[1px] bottom-1/4 left-1/3 animate-[floatParticle_4.5s_infinite_ease-in-out_0.5s]" />
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* LAYER 4: Auto-Hook Text Intro (First 3 Seconds)              */}
        {/* ============================================================ */}
        {hookIntro.enabled && currentTime <= hookIntro.duration && (
          <div
            className={`absolute top-12 inset-x-3 z-35 flex flex-col items-center pointer-events-none transition-all duration-300 ${
              currentTime > hookIntro.duration - 0.4
                ? 'opacity-0 scale-95 -translate-y-2'
                : 'opacity-100 scale-100'
            }`}
          >
            <div className="animate-hook-pop px-3.5 py-1.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-[#00E676] shadow-[0_0_25px_rgba(0,230,118,0.7)] text-center max-w-[94%] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping shrink-0" />
              <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase drop-shadow-md">
                {hookIntro.text}
              </span>
            </div>
            {/* Visual timer countdown bar */}
            <div className="w-28 h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00E676] to-[#00b0ff] rounded-full transition-all duration-100"
                style={{
                  width: `${Math.max(
                    0,
                    (1 - currentTime / hookIntro.duration) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LAYER 5: Dynamic B-Roll Cutaway Overlay                     */}
        {/* ============================================================ */}
        {activeBRoll && (
          <div className="absolute top-20 right-4 z-25 max-w-[150px] animate-scale-in">
            <div className="p-1 rounded-2xl bg-black/80 backdrop-blur-md border border-[#00E676]/50 shadow-[0_0_20px_rgba(0,230,118,0.35)] overflow-hidden">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-neutral-900">
                {activeBRoll.mediaUrl && (
                  <img
                    src={activeBRoll.mediaUrl}
                    alt={activeBRoll.label}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-1 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-black text-[#00E676] uppercase">
                  B-ROLL
                </div>
              </div>
              <p className="text-[10px] font-bold text-white px-1.5 py-1 truncate">
                {activeBRoll.label}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LAYER 6: Dynamic Motion Graphic Hits (Neon Burst / Badges)   */}
        {/* ============================================================ */}
        {activeMotionGraphic && (
          <div className="absolute top-1/3 inset-x-0 z-30 flex items-center justify-center pointer-events-none px-4">
            {activeMotionGraphic.type === 'kinetic_badge' && (
              <div className="animate-bounce scale-110 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#00E676] to-[#00b0ff] text-black font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(0,230,118,0.8)] border border-white flex items-center gap-1.5 transform rotate-[-2deg]">
                <Flame className="w-4 h-4 fill-black" />
                {activeMotionGraphic.text}
              </div>
            )}

            {activeMotionGraphic.type === 'neon_burst' && (
              <div className="relative px-5 py-2 rounded-full bg-black/90 border-2 border-[#00E676] text-white font-black text-xs tracking-widest uppercase shadow-[0_0_35px_rgba(0,230,118,0.9)] animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
                <span className="text-[#00E676]">{activeMotionGraphic.text}</span>
              </div>
            )}

            {activeMotionGraphic.type === 'zoom_hit' && (
              <div className="px-6 py-2 rounded-2xl bg-white text-black font-black text-base uppercase tracking-tight shadow-[0_0_40px_rgba(255,255,255,0.9)] transform scale-105">
                ⚡ {activeMotionGraphic.text} ⚡
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* LAYER 7: CapCut-Style Kinetic Word-by-Word Subtitles         */}
        {/* ============================================================ */}
        {activeCaption && (
          <div className="absolute bottom-24 inset-x-0 z-35 flex items-center justify-center px-4 pointer-events-none text-center">
            <div className="max-w-[88%] transition-all duration-150">
              {/* Viral Yellow (High Retention Bold Yellow with Black Stroke) */}
              {captionStyle === 'viral_yellow' && (
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  {activeCaption.words && activeCaption.words.length > 0 ? (
                    activeCaption.words.map((w, idx) => {
                      const isWordActive =
                        currentTime >= w.start && currentTime <= w.end;
                      return (
                        <span
                          key={idx}
                          className={`font-black text-xl sm:text-2xl uppercase tracking-tight transition-transform duration-100 ${
                            isWordActive
                              ? 'text-[#FFE600] scale-125 inline-block drop-shadow-[0_0_15px_rgba(255,230,0,0.8)]'
                              : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                          }`}
                          style={{
                            textShadow:
                              '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 12px rgba(0,0,0,0.9)',
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })
                  ) : (
                    <span
                      className="font-black text-2xl text-[#FFE600] uppercase tracking-tight"
                      style={{
                        textShadow:
                          '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 12px rgba(0,0,0,0.9)',
                      }}
                    >
                      {activeCaption.text}
                    </span>
                  )}
                </div>
              )}

              {/* Karaoke Pop (Word Bounce & Active Green Glow) */}
              {captionStyle === 'pop_karaoke' && (
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  {activeCaption.words && activeCaption.words.length > 0 ? (
                    activeCaption.words.map((w, idx) => {
                      const isWordActive =
                        currentTime >= w.start && currentTime <= w.end;
                      const isPast = currentTime > w.end;
                      return (
                        <span
                          key={idx}
                          className={`font-black tracking-tight text-lg sm:text-xl transition-all duration-100 ${
                            isWordActive
                              ? 'text-[#00E676] scale-125 inline-block drop-shadow-[0_0_15px_rgba(0,230,118,0.9)]'
                              : isPast
                              ? 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                              : 'text-white/60'
                          }`}
                          style={{
                            textShadow:
                              '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.9)',
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })
                  ) : (
                    <span
                      className="font-black text-xl text-[#00E676]"
                      style={{
                        textShadow:
                          '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                      }}
                    >
                      {activeCaption.text}
                    </span>
                  )}
                </div>
              )}

              {/* Neon Glow (#00E676 Border Glow Card) */}
              {captionStyle === 'neon_glow' && (
                <div
                  className="font-black text-xl text-white neon-text-glow uppercase px-3.5 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-[#00E676]/60 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                  style={{
                    textShadow:
                      '0 0 12px rgba(0,230,118,0.8), 0 0 25px rgba(0,230,118,0.5)',
                  }}
                >
                  {activeCaption.text}
                </div>
              )}

              {/* Box Highlight */}
              {captionStyle === 'box_highlight' && (
                <div className="font-extrabold text-lg text-black bg-[#FFE600] px-3.5 py-1 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.8)] transform -rotate-1">
                  {activeCaption.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LAYER 8: Crisp "KliPro AI" Top-Right Watermark Badge        */}
        {/* ============================================================ */}
        {showWatermark && (
          <div className="absolute top-4 right-4 z-40 transition-opacity duration-300">
            <KliProLogo size="watermark" />
          </div>
        )}

        {/* Click-to-Play Center Overlay */}
        <div
          onClick={onTogglePlay}
          className="absolute inset-0 z-45 cursor-pointer flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className="w-16 h-16 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110">
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-[#00E676] fill-[#00E676] ml-1" />
            )}
          </div>
        </div>

        {/* Top Indicators inside video */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-1.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-[#00E676] uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
            9:16 REEL
          </span>
          {beatSync.enabled && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-[#00E676]/30 text-[9px] font-bold text-[#00E676] uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00E676]" />
              BEAT-SYNC
            </span>
          )}
        </div>
      </div>

      {/* Scrub Bar & Player Controls Toolbar */}
      <div className="w-full mt-3 p-3 rounded-2xl glass-panel text-white">
        {/* Timeline Progress */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-neutral-400 w-9 text-right">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min="0"
            max={media.duration || 10}
            step="0.05"
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onTimeUpdate(val);
              if (videoRef.current && media.type === 'video') {
                videoRef.current.currentTime = val;
              }
            }}
            className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00E676]"
          />

          <span className="text-[10px] font-mono text-neutral-400 w-9">
            {formatTime(media.duration || 10)}
          </span>
        </div>

        {/* Playback action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-2 rounded-xl bg-white/10 hover:bg-[#00E676] hover:text-black transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onTimeUpdate(0);
                if (videoRef.current && media.type === 'video') {
                  videoRef.current.currentTime = 0;
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Media Info / Badges */}
          <div className="text-center">
            <span className="text-xs font-semibold text-neutral-300 truncate max-w-[140px] block">
              {media.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {media.type === 'video' && (
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
