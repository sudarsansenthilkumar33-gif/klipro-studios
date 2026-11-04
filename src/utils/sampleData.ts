import { MediaItem, CaptionSegment, BRollMoment, MotionGraphicItem } from '../types';

export const SAMPLE_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'sample-video-1',
    name: 'Tech & Macro Cinematic (Landscape 16:9)',
    type: 'video',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '16:9',
    duration: 10,
  },
  {
    id: 'sample-photo-1',
    name: 'Street Fashion Portrait (Ken Burns 9:16 Photo)',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '4:3',
    duration: 8,
  },
  {
    id: 'sample-video-2',
    name: 'High-Energy Action Trailer (16:9)',
    type: 'video',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '16:9',
    duration: 12,
  },
  {
    id: 'sample-photo-2',
    name: 'Cyberpunk Neon City (Ken Burns Photo)',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1080&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    aspectRatio: '16:9',
    duration: 8,
  },
];

export const INITIAL_CAPTIONS: CaptionSegment[] = [
  {
    id: 'cap-1',
    start: 0.2,
    end: 2.5,
    text: 'Stop scrolling and watch this secret!',
    highlightWord: 'secret!',
    words: [
      { word: 'Stop', start: 0.2, end: 0.6 },
      { word: 'scrolling', start: 0.6, end: 1.1 },
      { word: 'and', start: 1.1, end: 1.4 },
      { word: 'watch', start: 1.4, end: 1.8 },
      { word: 'this', start: 1.8, end: 2.1 },
      { word: 'secret!', start: 2.1, end: 2.5 },
    ],
  },
  {
    id: 'cap-2',
    start: 2.8,
    end: 5.5,
    text: 'Instant 9:16 auto format with kinetic glow.',
    highlightWord: 'kinetic glow.',
    words: [
      { word: 'Instant', start: 2.8, end: 3.3 },
      { word: '9:16', start: 3.3, end: 3.8 },
      { word: 'auto', start: 3.8, end: 4.2 },
      { word: 'format', start: 4.2, end: 4.6 },
      { word: 'with', start: 4.6, end: 4.9 },
      { word: 'kinetic', start: 4.9, end: 5.2 },
      { word: 'glow.', start: 5.2, end: 5.5 },
    ],
  },
  {
    id: 'cap-3',
    start: 5.8,
    end: 8.5,
    text: 'Scale your audience to 100K today!',
    highlightWord: '100K today!',
    words: [
      { word: 'Scale', start: 5.8, end: 6.3 },
      { word: 'your', start: 6.3, end: 6.7 },
      { word: 'audience', start: 6.7, end: 7.3 },
      { word: 'to', start: 7.3, end: 7.6 },
      { word: '100K', start: 7.6, end: 8.0 },
      { word: 'today!', start: 8.0, end: 8.5 },
    ],
  },
];

export const INITIAL_BROLL: BRollMoment[] = [
  {
    id: 'broll-1',
    time: 2.4,
    duration: 1.8,
    label: '⚡ Trending Reaction Cutaway',
    category: 'reaction',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'broll-2',
    time: 5.6,
    duration: 2.0,
    label: '🚀 Viral Analytics Spike',
    category: 'stats',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_MOTION_GRAPHICS: MotionGraphicItem[] = [
  {
    id: 'mg-1',
    time: 0.2,
    type: 'kinetic_badge',
    text: '💥 VIRAL HOOK',
  },
  {
    id: 'mg-2',
    time: 2.6,
    type: 'neon_burst',
    text: '⚡ 10X REACH',
  },
  {
    id: 'mg-3',
    time: 5.8,
    type: 'zoom_hit',
    text: '🚀 NEXT LEVEL',
  },
];

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English (US / UK)', label: 'English' },
  { code: 'ta', name: 'Tamil (தமிழ்)', label: 'Tamil' },
  { code: 'hi', name: 'Hindi (हिन्दी)', label: 'Hindi' },
  { code: 'es', name: 'Spanish (Español)', label: 'Spanish' },
  { code: 'fr', name: 'French (Français)', label: 'French' },
  { code: 'auto', name: '✨ Auto-Detect & Translate', label: 'Auto-Detect' },
  { code: 'te', name: 'Telugu (తెలుగు)', label: 'Telugu' },
  { code: 'de', name: 'German (Deutsch)', label: 'German' },
  { code: 'ja', name: 'Japanese (日本語)', label: 'Japanese' },
];

export const COLOR_PRESETS = [
  { id: 'auto_enhance', name: 'AI Auto-Enhance', filter: 'contrast(1.15) saturate(1.22) brightness(1.05)' },
  { id: 'cyberpunk_neon', name: 'Cyberpunk Neon', filter: 'contrast(1.25) saturate(1.4) hue-rotate(-12deg) brightness(1.02)' },
  { id: 'warm_vintage', name: 'Cinematic Warm', filter: 'sepia(0.25) saturate(1.22) contrast(1.12) brightness(1.03)' },
  { id: 'clean_crisp', name: 'Clean Vivid', filter: 'contrast(1.18) saturate(1.25) brightness(1.04)' },
  { id: 'moody_noir', name: 'Moody Noir', filter: 'contrast(1.35) saturate(0.18) brightness(0.95)' },
  { id: 'none', name: 'Original Raw', filter: 'none' },
];
