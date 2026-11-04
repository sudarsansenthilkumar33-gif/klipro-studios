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
import { COLOR_PRESETS } from './sampleData';

export interface ExportProgressCallback {
  (progress: number, status: string): void;
}

export async function renderAndExportVideo(params: {
  media: MediaItem;
  captions: CaptionSegment[];
  bRollMoments: BRollMoment[];
  motionGraphics: MotionGraphicItem[];
  colorGrade: ColorGradePreset;
  autoFormatMode: AutoFormatMode;
  captionStyle: CaptionStyleMode;
  showWatermark: boolean;
  hookIntro?: HookIntroConfig;
  beatSync?: BeatSyncConfig;
  infiniteLoop?: boolean;
  videoElement?: HTMLVideoElement | null;
  onProgress?: ExportProgressCallback;
}): Promise<Blob> {
  const {
    media,
    captions,
    bRollMoments,
    motionGraphics,
    colorGrade,
    autoFormatMode,
    captionStyle,
    showWatermark,
    hookIntro = { enabled: true, text: 'Wait for the end 🤯', duration: 3.0 },
    beatSync = { enabled: true, bpm: 128, sfxEnabled: true },
    infiniteLoop = false,
    videoElement,
    onProgress,
  } = params;

  const width = 720;
  const height = 1280; // 9:16 vertical standard
  const fps = 30;
  const totalDuration = Math.min(media.duration || 8, 12); // clamp to max 12s for fast responsive export

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  // Pre-load images if media is photo or fallback thumbnail
  let photoImg: HTMLImageElement | null = null;
  let fallbackImg: HTMLImageElement | null = null;

  if (media.thumbnailUrl || media.url) {
    fallbackImg = new Image();
    fallbackImg.crossOrigin = 'anonymous';
    fallbackImg.src = media.thumbnailUrl || media.url;
  }

  if (media.type === 'photo') {
    photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      photoImg!.onload = resolve;
      photoImg!.onerror = resolve; // fallback gracefully
      photoImg!.src = media.url;
    });
  }

  // Preload b-roll images
  const bRollImages: Record<string, HTMLImageElement> = {};
  for (const b of bRollMoments) {
    if (b.mediaUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = b.mediaUrl;
      bRollImages[b.id] = img;
    }
  }

  // Setup MediaStream & MediaRecorder
  const stream = canvas.captureStream(fps);

  // Audio Context for beat soundtrack
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      audioDestination = audioContext.createMediaStreamDestination();
      audioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
  } catch (e) {
    console.warn('AudioContext init skipped', e);
  }

  // Pick supported mimeType
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 3_500_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: selectedMime });
      resolve(finalBlob);
    };
  });

  mediaRecorder.start();

  // Draw loop
  const totalFrames = Math.floor(totalDuration * fps);
  let currentFrame = 0;

  if (videoElement && media.type === 'video') {
    videoElement.currentTime = 0;
    try {
      await videoElement.play();
    } catch {}
  }

  return new Promise((resolve, reject) => {
    const renderNextFrame = () => {
      const currentTime = currentFrame / fps;
      const progress = Math.round((currentFrame / totalFrames) * 100);

      if (onProgress) {
        onProgress(progress, `Rendering frame ${currentFrame}/${totalFrames} (9:16)`);
      }

      // 1. Clear background
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, width, height);

      // Beat scale calculation
      let beatBump = 1;
      if (beatSync.enabled) {
        const beatInterval = 1.8;
        const phase = currentTime % beatInterval;
        if (phase < 0.2) {
          beatBump = 1 + Math.sin((phase / 0.2) * Math.PI) * 0.06;
        }
      }

      // 2. Draw Ambient Blurred Background (Auto-Format 9:16)
      if (autoFormatMode === 'ambient_blur') {
        ctx.save();
        ctx.filter = 'blur(28px) brightness(0.65)';
        if (photoImg && photoImg.complete) {
          ctx.drawImage(photoImg, -width * 0.2, -height * 0.2, width * 1.4, height * 1.4);
        } else if (fallbackImg && fallbackImg.complete) {
          ctx.drawImage(fallbackImg, -width * 0.2, -height * 0.2, width * 1.4, height * 1.4);
        } else if (videoElement && videoElement.readyState >= 2) {
          try {
            ctx.drawImage(videoElement, -width * 0.2, -height * 0.2, width * 1.4, height * 1.4);
          } catch {}
        }
        ctx.restore();
      }

      // Vignette
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.3,
        width / 2,
        height / 2,
        height * 0.7
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Main Sharp Media
      ctx.save();
      // Apply color filter approximation
      if (colorGrade === 'cyberpunk_neon') {
        ctx.filter = 'contrast(1.25) saturate(1.4) brightness(1.02)';
      } else if (colorGrade === 'cinematic_teal') {
        ctx.filter = 'contrast(1.2) saturate(1.15) brightness(1.02)';
      } else if (colorGrade === 'warm_vintage') {
        ctx.filter = 'sepia(0.28) saturate(1.18) contrast(1.1)';
      } else if (colorGrade === 'moody_noir') {
        ctx.filter = 'contrast(1.35) saturate(0.2)';
      } else {
        ctx.filter = 'contrast(1.15) saturate(1.2) brightness(1.05)';
      }

      if (media.type === 'photo' && photoImg && photoImg.complete) {
        // Ken Burns effect + beat bump
        const p = (currentTime % media.duration) / media.duration;
        const scale = (1.05 + Math.sin(p * Math.PI) * 0.16) * beatBump;
        const tx = Math.cos(p * Math.PI) * 20;
        const ty = Math.sin(p * Math.PI) * 15;

        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(tx, ty);

        const imgRatio = photoImg.width / photoImg.height;
        const targetRatio = width / height;
        let dw = width;
        let dh = height;
        if (imgRatio > targetRatio) {
          dw = height * imgRatio;
        } else {
          dh = width / imgRatio;
        }
        ctx.drawImage(photoImg, -dw / 2, -dh / 2, dw, dh);
      } else if (videoElement && videoElement.readyState >= 2) {
        try {
          ctx.translate(width / 2, height / 2);
          ctx.scale(beatBump, beatBump);
          ctx.translate(-width / 2, -height / 2);

          const vRatio = (videoElement.videoWidth || 16) / (videoElement.videoHeight || 9);
          const dw = width;
          const dh = width / vRatio;
          const dy = (height - dh) / 2;
          ctx.drawImage(videoElement, 0, dy, dw, dh);
        } catch {
          if (fallbackImg && fallbackImg.complete) {
            ctx.drawImage(fallbackImg, 0, 0, width, height);
          }
        }
      } else if (fallbackImg && fallbackImg.complete) {
        ctx.drawImage(fallbackImg, 0, 0, width, height);
      }

      // Infinite Loop Crossfade: Blend final 0.5s directly into the initial frame
      if (infiniteLoop && currentTime >= Math.max(0.5, totalDuration - 0.5)) {
        const loopAlpha = (currentTime - (totalDuration - 0.5)) / 0.5;
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, loopAlpha));
        if (photoImg && photoImg.complete) {
          ctx.drawImage(photoImg, 0, 0, width, height);
        } else if (fallbackImg && fallbackImg.complete) {
          ctx.drawImage(fallbackImg, 0, 0, width, height);
        }
        ctx.restore();
      }

      ctx.restore();

      // 4. Floating particles & Light Leaks for photos
      if (media.type === 'photo') {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 230, 118, 0.4)';
        for (let i = 0; i < 6; i++) {
          const px = (width * 0.2 + (i * 120 + currentTime * 40)) % width;
          const py = (height * 0.3 + (i * 150 - currentTime * 30)) % height;
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. Auto-Hook Text Intro (First 3 Seconds)
      if (hookIntro.enabled && currentTime <= hookIntro.duration) {
        ctx.save();
        const hookProgress = currentTime / hookIntro.duration;
        const alpha = hookProgress > 0.8 ? (1 - hookProgress) / 0.2 : 1;
        ctx.globalAlpha = Math.max(0, alpha);

        const bannerY = 140;
        ctx.font = '900 26px sans-serif';
        ctx.textAlign = 'center';
        const textMetrics = ctx.measureText(hookIntro.text);
        const bannerW = Math.min(width - 60, textMetrics.width + 60);

        // Dark pill background with neon border
        ctx.fillStyle = 'rgba(6, 6, 6, 0.9)';
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00E676';
        ctx.shadowBlur = 20;

        // Rounded rect
        const rx = width / 2 - bannerW / 2;
        const ry = bannerY - 26;
        const rw = bannerW;
        const rh = 52;
        const radius = 18;

        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, radius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillText(hookIntro.text, width / 2, bannerY + 8);
        ctx.restore();
      }

      // 6. Draw B-Roll Cutaway if active
      const activeBRoll = bRollMoments.find(
        (b) => currentTime >= b.time && currentTime <= b.time + b.duration
      );
      if (activeBRoll && bRollImages[activeBRoll.id]) {
        const bImg = bRollImages[activeBRoll.id];
        if (bImg.complete) {
          ctx.save();
          const bw = 240;
          const bh = 140;
          const bx = width - bw - 30;
          const by = 220;
          ctx.shadowColor = 'rgba(0, 230, 118, 0.5)';
          ctx.shadowBlur = 20;
          ctx.strokeStyle = '#00E676';
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.drawImage(bImg, bx, by, bw, bh);

          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(bx, by + bh - 30, bw, 30);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(activeBRoll.label, bx + 10, by + bh - 10);
          ctx.restore();
        }
      }

      // 7. Draw Motion Graphic Hits if active
      const activeMG = motionGraphics.find(
        (mg) => currentTime >= mg.time && currentTime <= mg.time + 1.3
      );
      if (activeMG) {
        ctx.save();
        ctx.textAlign = 'center';
        const mgY = height * 0.4;

        ctx.fillStyle = '#00E676';
        ctx.shadowColor = '#00E676';
        ctx.shadowBlur = 30;
        const textWidth = ctx.measureText(activeMG.text).width + 60;
        ctx.fillRect(width / 2 - textWidth / 2, mgY - 24, textWidth, 48);

        ctx.fillStyle = '#000000';
        ctx.font = '900 24px sans-serif';
        ctx.fillText(activeMG.text, width / 2, mgY + 8);
        ctx.restore();
      }

      // 8. Draw CapCut Kinetic Subtitles
      const activeCap = captions.find(
        (c) => currentTime >= c.start && currentTime <= c.end
      );
      if (activeCap) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const subY = height * 0.82;

        ctx.font = '900 32px sans-serif';

        if (captionStyle === 'viral_yellow') {
          // Thick black outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 9;
          ctx.strokeText(activeCap.text, width / 2, subY);

          // Bold yellow fill
          ctx.fillStyle = '#FFE600';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText(activeCap.text, width / 2, subY);
        } else if (captionStyle === 'neon_glow') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(activeCap.text, width / 2, subY);

          ctx.fillStyle = '#00E676';
          ctx.shadowColor = '#00E676';
          ctx.shadowBlur = 20;
          ctx.fillText(activeCap.text, width / 2, subY);
        } else {
          // Karaoke Pop default
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(activeCap.text, width / 2, subY);

          ctx.fillStyle = '#00E676';
          ctx.shadowColor = '#00E676';
          ctx.shadowBlur = 15;
          ctx.fillText(activeCap.text, width / 2, subY);
        }
        ctx.restore();
      }

      // 9. Draw Crisp "KliPro AI" Watermark in Top-Right Corner
      if (showWatermark) {
        ctx.save();
        const wX = width - 170;
        const wY = 40;

        ctx.fillStyle = 'rgba(6, 6, 6, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(wX, wY, 140, 36, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('KLI', wX + 14, wY + 23);
        ctx.fillStyle = '#00E676';
        ctx.fillText('PRO', wX + 44, wY + 23);

        ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.fillRect(wX + 85, wY + 9, 28, 18);
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
        ctx.strokeRect(wX + 85, wY + 9, 28, 18);
        ctx.font = '900 11px sans-serif';
        ctx.fillStyle = '#00E676';
        ctx.fillText('AI', wX + 93, wY + 22);
        ctx.restore();
      }

      currentFrame++;

      if (currentFrame < totalFrames) {
        requestAnimationFrame(renderNextFrame);
      } else {
        mediaRecorder.stop();
        recordingPromise.then(resolve).catch(reject);
      }
    };

    renderNextFrame();
  });
}
