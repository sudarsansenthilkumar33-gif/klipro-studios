export type MediaType = 'video' | 'photo';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  duration: number; // in seconds
  audioUrl?: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  highlightWord?: string;
  words: WordTimestamp[];
}

export interface BRollMoment {
  id: string;
  time: number;
  duration: number;
  label: string;
  category: 'reaction' | 'stats' | 'highlight' | 'aesthetic';
  mediaUrl?: string;
}

export interface MotionGraphicItem {
  id: string;
  time: number;
  type: 'kinetic_badge' | 'neon_burst' | 'zoom_hit' | 'flash_accent';
  text: string;
}

export type AutoFormatMode = 'ambient_blur' | 'smart_crop' | 'letterbox';

export type ColorGradePreset =
  | 'auto_enhance'
  | 'cyberpunk_neon'
  | 'cinematic_teal'
  | 'warm_vintage'
  | 'moody_noir'
  | 'clean_crisp'
  | 'none';

export type CaptionStyleMode = 'viral_yellow' | 'neon_glow' | 'pop_karaoke' | 'box_highlight';

export interface HookIntroConfig {
  enabled: boolean;
  text: string;
  duration: number; // typically 3.0s
}

export interface GeneratedHook {
  text: string;
  score: number;
  style: string;
  reason: string;
}

export interface BeatSyncConfig {
  enabled: boolean;
  bpm: number;
  sfxEnabled: boolean;
}

export interface SocialKit {
  caption: string;
  hashtags: string[];
  bestTimes: string;
  estimatedReach: string;
}

export interface SubscriptionPlan {
  id: 'weekly' | 'monthly' | 'lifetime';
  name: string;
  price: number;
  period: string;
  subtitle: string;
  tag?: string;
  isRecommended?: boolean;
}

export interface UserAccount {
  freeExportsRemaining: number;
  isVip: boolean;
  totalExports: number;
  planId?: 'weekly' | 'monthly' | 'lifetime';
  unlockedAt?: string;
  utrVerified?: string;
}
