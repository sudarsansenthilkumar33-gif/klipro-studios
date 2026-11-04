import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Transcribe / Generate captions & B-roll highlights
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const {
      targetLanguage = 'English',
      mediaType = 'video',
      title = 'Creator Clip',
      duration = 10,
      customContext = '',
      audioBase64 = null,
      audioMimeType = 'audio/webm',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Generating high-quality procedural subtitles.');
      return res.json({
        success: true,
        source: 'procedural',
        captions: getProceduralCaptions(targetLanguage, duration),
        bRollMoments: getProceduralBRoll(duration),
        motionGraphics: getProceduralMotionGraphics(duration),
        summary: 'Smart AI generated subtitles and dynamic kinetic overlays.',
      });
    }

    const prompt = `You are KliPro's expert AI video editor and short-form content producer (TikTok, Instagram Reels, YouTube Shorts).
Your job is to generate viral, CapCut-style dynamic subtitles, synchronized word-by-word highlights, smart b-roll cutaway moments, and motion graphic hits.

Media Details:
- Type: ${mediaType}
- Duration: approximately ${Math.round(duration)} seconds
- Target Caption Language: ${targetLanguage}
- Media Context / Hook: ${customContext || title || 'Engaging viral short-form media'}

Requirements:
1. Generate 3 to 6 energetic subtitle segments spanning the ${Math.round(duration)} seconds.
2. If Target Caption Language is NOT English (e.g. Tamil, Hindi, Spanish, French, German, Telugu, etc.), translate/compose authentic, natural phrasing in that target script/language (e.g. for Tamil use Tamil script தமிழ், for Hindi use Devanagari हिन्दी, for Spanish use Español, etc.).
3. Each caption segment MUST contain:
   - "start": start time in seconds (e.g. 0.0)
   - "end": end time in seconds (e.g. 2.4)
   - "text": the complete phrase
   - "highlightWord": a high-energy key word to pop in neon green (#00E676)
   - "words": array of word objects with individual rough timestamps: [{"word": "Stop", "start": 0.0, "end": 0.4}, ...]
4. Identify 2 to 3 "bRollMoments" (visual reaction or topic cutaway):
   - "time": timestamp in seconds
   - "duration": e.g. 1.5
   - "label": short punchy title (e.g. "Viral Stats", "Reaction Zoom", "Mind Blown")
   - "category": "reaction" | "highlight" | "stats" | "aesthetic"
5. Identify 2 to 4 "motionGraphics" hits (neon lines, zoom burst, kinetic badge):
   - "time": timestamp in seconds
   - "type": "neon_burst" | "kinetic_badge" | "zoom_hit" | "flash_accent"
   - "text": badge text e.g. "⚡ INSANE", "💥 VIRAL HOOK", "🔥 10X GROWTH", "👀 WAIT FOR IT"

Return STRICT JSON ONLY matching this schema:
{
  "summary": "Short hook summary",
  "captions": [
    {
      "start": 0.0,
      "end": 2.2,
      "text": "...",
      "highlightWord": "...",
      "words": [{"word": "...", "start": 0.0, "end": 0.5}]
    }
  ],
  "bRollMoments": [
    {
      "time": 2.5,
      "duration": 1.5,
      "label": "...",
      "category": "reaction"
    }
  ],
  "motionGraphics": [
    {
      "time": 0.2,
      "type": "kinetic_badge",
      "text": "🔥 VIRAL HOOK"
    }
  ]
}`;

    let contents: any = prompt;

    // Multimodal audio transcription if provided
    if (audioBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          },
          {
            text: prompt + '\nListen to the audio track and transcribe speech accurately with real timestamps, then adapt into the requested language.',
          },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : null;
    }

    if (!data || !Array.isArray(data.captions) || data.captions.length === 0) {
      return res.json({
        success: true,
        source: 'procedural_fallback',
        captions: getProceduralCaptions(targetLanguage, duration),
        bRollMoments: getProceduralBRoll(duration),
        motionGraphics: getProceduralMotionGraphics(duration),
        summary: 'Smart AI generated subtitles.',
      });
    }

    return res.json({
      success: true,
      source: 'gemini',
      captions: data.captions,
      bRollMoments: data.bRollMoments || getProceduralBRoll(duration),
      motionGraphics: data.motionGraphics || getProceduralMotionGraphics(duration),
      summary: data.summary || 'AI Transcribed & Edited',
    });
  } catch (error: any) {
    console.error('Gemini transcribe error:', error);
    const { targetLanguage = 'English', duration = 10 } = req.body;
    return res.json({
      success: true,
      source: 'procedural_fallback',
      captions: getProceduralCaptions(targetLanguage, duration),
      bRollMoments: getProceduralBRoll(duration),
      motionGraphics: getProceduralMotionGraphics(duration),
      summary: 'Smart AI fallback subtitles.',
    });
  }
});

// API: 1-Tap Viral Hooks & Retention Predictor
app.post('/api/ai/generate-hooks', async (req, res) => {
  try {
    const { title = 'Creator Reel', language = 'English', currentHook = '' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        source: 'procedural',
        hooks: getProceduralHooks(title, language),
      });
    }

    const prompt = `You are an elite short-form retention engineer specializing in TikTok, Instagram Reels, and YouTube Shorts algorithms.
Generate 3 viral hook headlines for a video titled "${title}" (Target Language: ${language}).
Current hook: "${currentHook || 'Wait for the end'}".

Every hook must:
1. Stop the thumb in the first 0.8 seconds using psychological curiosity gaps, contrarian statements, or high-stakes framing.
2. Be under 7 words.
3. Contain 1 high-impact emoji.
4. If language is not English (e.g. Tamil, Hindi, Spanish), write authentic natural viral phrasing in that script/language.

Return STRICT JSON ONLY:
{
  "hooks": [
    {
      "text": "Hook text here 🤯",
      "score": 96,
      "style": "Curiosity Gap",
      "reason": "Forces immediate watch time until the final reveal"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : null;
    }

    if (!data || !Array.isArray(data.hooks) || data.hooks.length === 0) {
      return res.json({
        success: true,
        source: 'procedural_fallback',
        hooks: getProceduralHooks(title, language),
      });
    }

    return res.json({
      success: true,
      source: 'gemini',
      hooks: data.hooks,
    });
  } catch (error: any) {
    console.error('Gemini hook generation error:', error);
    return res.json({
      success: true,
      source: 'procedural_fallback',
      hooks: getProceduralHooks(req.body?.title, req.body?.language),
    });
  }
});

// API: 1-Click Post-Ready Social Kit
app.post('/api/ai/social-kit', async (req, res) => {
  try {
    const { title = 'Viral Reel', captions = [], language = 'English' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        source: 'procedural',
        kit: getProceduralSocialKit(title, language),
      });
    }

    const captionContext = Array.isArray(captions)
      ? captions.map((c: any) => c.text).join(' ')
      : '';

    const prompt = `You are a viral social media strategist managing top creator accounts on Instagram Reels, YouTube Shorts, and TikTok.
Create a high-engagement "Post-Ready Social Kit" for this short-form video:
- Title: ${title}
- Language: ${language}
- Video Subtitles: ${captionContext || 'Fast paced viral short created with KliPro'}

Requirements:
1. "caption": A catchy, 2-line post description ending with a call to action (save/share/comment).
2. "hashtags": Array of exactly 15 high-performing hashtags (mix of broad e.g. #reels #viral and niche topic tags).
3. "bestTimes": Optimal global posting window based on audience engagement (e.g., "6:30 PM - 9:00 PM (Peak Feed Traffic)").
4. "estimatedReach": e.g., "85K - 320K potential impressions".

Return STRICT JSON ONLY:
{
  "caption": "...",
  "hashtags": ["#viral", "#reels", ...],
  "bestTimes": "6:30 PM - 9:00 PM IST / EST",
  "estimatedReach": "85K - 350K Views"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : null;
    }

    if (!data || !data.caption) {
      return res.json({
        success: true,
        source: 'procedural_fallback',
        kit: getProceduralSocialKit(title, language),
      });
    }

    return res.json({
      success: true,
      source: 'gemini',
      kit: data,
    });
  } catch (error: any) {
    console.error('Gemini social kit error:', error);
    return res.json({
      success: true,
      source: 'procedural_fallback',
      kit: getProceduralSocialKit(req.body?.title, req.body?.language),
    });
  }
});

function getProceduralHooks(title: string, language: string = 'English') {
  const langLower = (language || '').toLowerCase();
  if (langLower.includes('tamil')) {
    return [
      {
        text: 'இதை பார்க்காமல் ஸ்க்ரோல் பண்ணாதீங்க! 😱',
        score: 96,
        style: 'High Urgency',
        reason: 'Immediate stop-scroll reflex trigger',
      },
      {
        text: '99% மக்களுக்கு தெரியாத ரகசியம் ⚡',
        score: 94,
        style: 'Secret Hook',
        reason: 'Curiosity gap encourages full 100% video retention',
      },
      {
        text: 'கடைசி வரை பாருங்க, ட்விஸ்ட் இருக்கு! 🔥',
        score: 91,
        style: 'Climax Tease',
        reason: 'Direct instruction to watch through to the end',
      },
    ];
  }

  if (langLower.includes('hindi')) {
    return [
      {
        text: 'ये सीक्रेट 99% लोग नहीं जानते! 🤯',
        score: 95,
        style: 'Secret Hook',
        reason: 'Triggers curiosity about undisclosed industry knowledge',
      },
      {
        text: 'रुकिए! ये ट्रिक आपकी जिंदगी बदल देगी ⚡',
        score: 93,
        style: 'Value Promise',
        reason: 'Stops mindless scrolling with massive value proposition',
      },
      {
        text: 'लास्ट तक देखना मत भूलना 🔥',
        score: 91,
        style: 'Retention Driver',
        reason: 'Forces algorithm completion rate higher',
      },
    ];
  }

  return [
    {
      text: 'Stop scrolling right now 👀',
      score: 95,
      style: 'Pattern Interrupt',
      reason: 'Interrupts passive feed scrolling in under 0.5s',
    },
    {
      text: 'The secret 99% of creators miss ⚡',
      score: 94,
      style: 'Curiosity Gap',
      reason: 'FOMO driven hook that maximizes average percentage viewed',
    },
    {
      text: "You won't believe what happens next 🤯",
      score: 91,
      style: 'Suspense Teaser',
      reason: 'Keeps viewers glued to the screen through the climax',
    },
  ];
}

function getProceduralSocialKit(title: string, language: string = 'English') {
  return {
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
    bestTimes: '6:00 PM - 9:30 PM (Peak High-Engagement Window)',
    estimatedReach: '120K - 450K Potential Impressions',
  };
}

function getProceduralCaptions(lang: string, duration: number) {
  const dur = Math.max(duration, 6);
  const langLower = lang.toLowerCase();

  if (langLower.includes('tamil')) {
    return [
      {
        start: 0.2,
        end: Math.min(dur * 0.32, 2.5),
        text: 'இதுவரை நீங்கள் பார்த்திராத மேஜிக்!',
        highlightWord: 'மேஜிக்!',
        words: [
          { word: 'இதுவரை', start: 0.2, end: 0.7 },
          { word: 'நீங்கள்', start: 0.7, end: 1.2 },
          { word: 'பார்த்திராத', start: 1.2, end: 1.8 },
          { word: 'மேஜிக்!', start: 1.8, end: 2.5 },
        ],
      },
      {
        start: Math.min(dur * 0.35, 2.8),
        end: Math.min(dur * 0.68, 5.5),
        text: 'ஒரே கிளிக்கில் 9:16 சினிமாட்டிக் வீடியோ!',
        highlightWord: 'சினிமாட்டிக்',
        words: [
          { word: 'ஒரே', start: 2.8, end: 3.3 },
          { word: 'கிளிக்கில்', start: 3.3, end: 4.0 },
          { word: '9:16', start: 4.0, end: 4.6 },
          { word: 'சினிமாட்டிக்', start: 4.6, end: 5.2 },
          { word: 'வீடியோ!', start: 5.2, end: 5.5 },
        ],
      },
      {
        start: Math.min(dur * 0.7, 5.8),
        end: Math.min(dur * 0.95, 8.5),
        text: 'KliPro உடன் வைரல் ஆகுங்கள்!',
        highlightWord: 'வைரல்',
        words: [
          { word: 'KliPro', start: 5.8, end: 6.4 },
          { word: 'உடன்', start: 6.4, end: 7.0 },
          { word: 'வைரல்', start: 7.0, end: 7.8 },
          { word: 'ஆகுங்கள்!', start: 7.8, end: 8.5 },
        ],
      },
    ];
  }

  if (langLower.includes('hindi')) {
    return [
      {
        start: 0.2,
        end: Math.min(dur * 0.32, 2.5),
        text: 'ये वायरल ट्रिक बिल्कुल मत छोड़ना!',
        highlightWord: 'वायरल',
        words: [
          { word: 'ये', start: 0.2, end: 0.6 },
          { word: 'वायरल', start: 0.6, end: 1.2 },
          { word: 'ट्रिक', start: 1.2, end: 1.7 },
          { word: 'बिल्कुल', start: 1.7, end: 2.1 },
          { word: 'छोड़ना!', start: 2.1, end: 2.5 },
        ],
      },
      {
        start: Math.min(dur * 0.35, 2.8),
        end: Math.min(dur * 0.68, 5.5),
        text: 'सिर्फ एक सेकंड में 9:16 ऑटो रील्स!',
        highlightWord: 'ऑटो रील्स!',
        words: [
          { word: 'सिर्फ', start: 2.8, end: 3.3 },
          { word: 'एक', start: 3.3, end: 3.7 },
          { word: 'सेकंड', start: 3.7, end: 4.2 },
          { word: 'में', start: 4.2, end: 4.6 },
          { word: '9:16', start: 4.6, end: 5.0 },
          { word: 'ऑटो रील्स!', start: 5.0, end: 5.5 },
        ],
      },
      {
        start: Math.min(dur * 0.7, 5.8),
        end: Math.min(dur * 0.95, 8.5),
        text: 'KliPro AI के साथ अभी ट्राई करें!',
        highlightWord: 'KliPro AI',
        words: [
          { word: 'KliPro', start: 5.8, end: 6.3 },
          { word: 'AI', start: 6.3, end: 6.8 },
          { word: 'के', start: 6.8, end: 7.2 },
          { word: 'साथ', start: 7.2, end: 7.7 },
          { word: 'अभी', start: 7.7, end: 8.1 },
          { word: 'ट्राई करें!', start: 8.1, end: 8.5 },
        ],
      },
    ];
  }

  if (langLower.includes('spanish')) {
    return [
      {
        start: 0.2,
        end: Math.min(dur * 0.32, 2.5),
        text: '¡Este truco cambiará tus videos!',
        highlightWord: 'cambiará',
        words: [
          { word: '¡Este', start: 0.2, end: 0.6 },
          { word: 'truco', start: 0.6, end: 1.2 },
          { word: 'cambiará', start: 1.2, end: 1.9 },
          { word: 'tus', start: 1.9, end: 2.2 },
          { word: 'videos!', start: 2.2, end: 2.5 },
        ],
      },
      {
        start: Math.min(dur * 0.35, 2.8),
        end: Math.min(dur * 0.68, 5.5),
        text: 'Edición automática 9:16 instantánea.',
        highlightWord: 'instantánea.',
        words: [
          { word: 'Edición', start: 2.8, end: 3.4 },
          { word: 'automática', start: 3.4, end: 4.2 },
          { word: '9:16', start: 4.2, end: 4.8 },
          { word: 'instantánea.', start: 4.8, end: 5.5 },
        ],
      },
      {
        start: Math.min(dur * 0.7, 5.8),
        end: Math.min(dur * 0.95, 8.5),
        text: '¡Crea contenido viral con KliPro!',
        highlightWord: 'viral',
        words: [
          { word: '¡Crea', start: 5.8, end: 6.4 },
          { word: 'contenido', start: 6.4, end: 7.1 },
          { word: 'viral', start: 7.1, end: 7.7 },
          { word: 'con', start: 7.7, end: 8.0 },
          { word: 'KliPro!', start: 8.0, end: 8.5 },
        ],
      },
    ];
  }

  // Default English
  return [
    {
      start: 0.2,
      end: Math.min(dur * 0.32, 2.5),
      text: 'Stop scrolling and watch this secret!',
      highlightWord: 'secret!',
      words: [
        { word: 'Stop', start: 0.2, end: 0.6 },
        { word: 'scrolling', start: 0.6, end: 1.2 },
        { word: 'and', start: 1.2, end: 1.5 },
        { word: 'watch', start: 1.5, end: 1.9 },
        { word: 'this', start: 1.9, end: 2.2 },
        { word: 'secret!', start: 2.2, end: 2.5 },
      ],
    },
    {
      start: Math.min(dur * 0.35, 2.8),
      end: Math.min(dur * 0.68, 5.5),
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
      start: Math.min(dur * 0.7, 5.8),
      end: Math.min(dur * 0.95, 8.5),
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
}

function getProceduralBRoll(dur: number) {
  return [
    {
      time: Math.min(dur * 0.28, 2.5),
      duration: 1.6,
      label: '⚡ Reaction Cutaway',
      category: 'reaction',
    },
    {
      time: Math.min(dur * 0.65, 5.2),
      duration: 1.8,
      label: '📈 Dynamic Metric Pulse',
      category: 'stats',
    },
  ];
}

function getProceduralMotionGraphics(dur: number) {
  return [
    {
      time: 0.2,
      type: 'kinetic_badge',
      text: '🔥 VIRAL HOOK',
    },
    {
      time: Math.min(dur * 0.35, 3.0),
      type: 'neon_burst',
      text: '⚡ BOOSTED',
    },
    {
      time: Math.min(dur * 0.72, 6.0),
      type: 'zoom_hit',
      text: '🚀 NEXT LEVEL',
    },
  ];
}

// Serve PWA manifest with standard MIME type for PWABuilder
app.get('/manifest.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

// Serve Service Worker with root scope permissions
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Serve static assets from /public directory
app.use(express.static(path.resolve(__dirname, 'public')));

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KliPro AI Studio server running on port ${PORT}`);
  });
}

startServer();
