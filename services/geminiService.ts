
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HealingPlan, VisualStyle, PersonaType } from "../types";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 5,
  delay = 5000,
  factor = 1.5
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";

    // API 키 관련 에러
    if (error?.status === 401 || errorMsg.includes('api key') || errorMsg.includes('unauthorized')) {
      throw new Error("API_KEY_MISSING: Gemini API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
    }

    // 모델을 찾을 수 없음
    if (errorMsg.includes("requested entity was not found") || error?.status === 404) {
      throw new Error("VIDEO_MODEL_NOT_FOUND: Veo 3.1 영상 생성 모델에 접근할 수 없습니다. AI Studio에서 API 키를 다시 선택해주세요.");
    }

    // 할당량 초과
    const isRateLimitError =
      error?.status === 429 ||
      error?.code === 429 ||
      errorMsg.includes('429') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('rate limit');

    if (isRateLimitError) {
      if (retries > 0) {
        console.log(`⏳ API 할당량 제한. ${Math.ceil(delay / 1000)}초 후 재시도... (남은 시도: ${retries})`);
        await wait(delay);
        return retryWithBackoff(operation, retries - 1, delay * factor, factor);
      }
      throw new Error("QUOTA_EXCEEDED: API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    }

    // 서버 오류
    const isServerError = error?.status === 503 || error?.code === 503 || errorMsg.includes('503');
    if (retries > 0 && isServerError) {
      console.log(`🔄 서버 일시적 오류. ${Math.ceil(delay / 1000)}초 후 재시도... (남은 시도: ${retries})`);
      await wait(delay);
      return retryWithBackoff(operation, retries - 1, delay * factor, factor);
    }

    // 기타 에러는 그대로 전달
    throw error;
  }
}

// ─── 스타일 지시자 목록 (6종 스타일 뱅크) ───
const STYLE_DIRECTIVES: Record<string, string> = {
  cinematic_real:
    "STRICTLY REAL PHOTOGRAPH. HIGH-END CINEMATIC REALISM. 2K LEVEL DETAIL. MUST FEATURE AUTHENTIC JAPANESE PEOPLE AND LOCATIONS. NO TEXT. 9:16 VERTICAL.",
  j_horror_classic:
    "J-HORROR CINEMA STYLE. Inspired by Ringu (1998) and Ju-On (2002). Desaturated blue-gray palette. Long black hair partially covering face. Pale skin, dark eye sockets. Dim fluorescent lighting. Wet surfaces, tatami floors, narrow corridors. Hyper-realistic photo. NO TEXT. 9:16 VERTICAL.",
  manga_noir:
    "JAPANESE MANGA-NOIR ILLUSTRATION STYLE. Black ink with selective deep crimson accent. High contrast cel-shading. Dramatic screentone shadows. Expressive horror manga character design. Dynamic composition. NO TEXT on image. 9:16 VERTICAL.",
  vintage_film:
    "VINTAGE 8MM FILM AESTHETIC. Heavy film grain, light leaks, color bleeding. Faded warm tones with dark vignette. 1970s Japanese horror film look. Scratches on film. Slightly out-of-focus bokeh. Authentic retro photograph quality. NO TEXT. 9:16 VERTICAL.",
  cctv_cam:
    "CCTV SECURITY CAMERA FOOTAGE STYLE. Monochrome or desaturated green-tint night vision. Wide-angle distortion. Timestamp overlay allowed. Static noise grain. High surveillance camera angle (looking down). Eerie empty Japanese location. 9:16 VERTICAL.",
  ukiyo_e_horror:
    "JAPANESE UKIYO-E WOODBLOCK PRINT HORROR STYLE. Edo period art. Bold black outlines, flat color areas, traditional wave/cloud patterns. Yokai, oni, or ghostly yurei. Inspired by Kuniyoshi and Hokusai horror prints. Rich indigo, vermillion, and gold tones. 9:16 VERTICAL.",
};

function getStyleDirective(style: string): string {
  return STYLE_DIRECTIVES[style] ?? STYLE_DIRECTIVES['cinematic_real'];
}

const JAPANESE_PHOTO_RULES = STYLE_DIRECTIVES['cinematic_real']; // 하위 호환성 유지


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title_ja: { type: Type.STRING, description: "Ultra-high CTR YouTube Shorts title. Max 40 chars. MUST use one of: forbidden/warning(絶対に/削除される前), specific number(午前3時17分/3日で7人), viewer-targeting(あなたの後ろに/これを見た人に), or mystery-gap(誰も知らなかった/57年間封印) formula. Start with【閲覧注意】." },
    title_kr: { type: Type.STRING },
    title_alt_a: { type: Type.STRING, description: "Alternative title B using FORBIDDEN angle (絶対に/削除される前に). Max 40 chars." },
    title_alt_b: { type: Type.STRING, description: "Alternative title C using VIEWER-TARGETING angle (あなたの後ろに/これを見た人には). Max 40 chars." },
    description_ja: { type: Type.STRING, description: "SEO-optimized. First 2 lines = cliffhanger that stops scrolling (appears before 'more' button). Line 3-5 = story hook + CTA. End with 20+ hashtags." },
    script_ja: { type: Type.STRING, description: "EXACTLY 500-550 chars. STRICT STRUCTURE: [0-3sec PATTERN INTERRUPT: most terrifying moment/sound first, NO intro, drop viewer into peak fear]. [3-20sec IMMERSIVE SETUP: present tense '今夜、あなたの部屋では', specific locations, exact times, realistic names - make viewer feel they ARE in the story]. [20-60sec SLOW DREAD BUILD: short punchy sentences, escalating tension, 3 beats of increasing fear]. [60-80sec UNEXPECTED TWIST: subvert the expected, reveal something worse]. [80-90sec LOOP-TRIGGER ENDING: end with a question or revelation that forces loop - '最初の映像、もう一度確認してみてください' or connect ending to beginning]. Final sentence MUST be a COMMENT MAGNET: '今夜、あなたは一人ですか？' or '信じますか？コメントで教えてください。'. NO subscription request. NO sign-off." },
    script_kr: { type: Type.STRING },
    loop_hook: { type: Type.STRING, description: "The specific loop-trigger ending sentence used in the script. This is the last 1-2 sentences that make viewers replay the video." },
    comment_trigger: { type: Type.STRING, description: "The exact comment-magnet question at the end of script. Must provoke YES/NO debate or personal experience sharing." },
    mood: { type: Type.STRING, enum: ["rain", "night", "coffee", "forest", "school"] },
    bgm_descriptor: { type: Type.STRING },
    hook_image_prompt: { type: Type.STRING, description: "9:16 VERTICAL. MUST INCLUDE: a human face (terror expression OR mysterious silhouette). Single harsh light source, pitch black background. One unexpected anomaly (something that shouldn't be there). J-Horror aesthetic. Extreme close-up preferred. NO TEXT. If face is included, eyes must convey extreme emotion." },
    story_image_prompts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 10 horror cinematic image prompts. Each MUST include: a human element (silhouette/shadow/hand/face). Progressive tension: first 3 = atmospheric dread, middle 4 = supernatural presence visible, last 3 = terror peak. 9:16 vertical each."
    },
    optimal_upload_time: { type: Type.STRING, description: "Best JST upload time for this content type. Format: 'Wednesday 21:00 JST - Low competition, peak viewer engagement'" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "30+ tags: 10 broad(怖い話/ホラー), 10 niche-specific(topic name/location), 10 trending+long-tail. Include #Shorts #horror #japan" },
    creator_affirmation: { type: Type.STRING }
  },
  required: ["title_ja", "title_kr", "title_alt_a", "title_alt_b", "description_ja", "script_ja", "script_kr", "loop_hook", "comment_trigger", "mood", "bgm_descriptor", "hook_image_prompt", "story_image_prompts", "optimal_upload_time", "tags", "creator_affirmation"],
};

export const generateHealingPlan = async (topic: string, persona: PersonaType = 'urban_legend'): Promise<HealingPlan> => {
  const prompt = `You are Japan's #1 YouTube Shorts algorithm specialist with a proven track record of 10M+ view videos. Your mission: create a viral production plan for "${topic}" that DOMINATES the algorithm.

  Target: Japanese audience (18-35). Platform: YouTube Shorts. Goal: Maximum loop rate + CTR + comment engagement.

  ================================================================
  ⚠️ YOUTUBE MONETIZATION SAFETY (NON-NEGOTIABLE)
  ================================================================
  1. NO explicit gore, excessive blood, graphic violence descriptions.
  2. NO detailed murder methods or weapons.
  3. Focus: PSYCHOLOGICAL HORROR — unseen dread, atmosphere, suggestive terror.
  4. Safe for general audiences while still being deeply unsettling.

  ================================================================
  PERSONA ENGINE — Deeply adapt ALL content to this persona: [${persona}]
  ================================================================
  'urban_legend' → Modern internet rumors, "friend of a friend" credibility, social media evidence, curiosity-first narration
  'true_story'   → Documentary tone, exact dates/locations (e.g., "2019年11月3日、午前2時41分"), victim testimonials, police records
  'human_horror' → Psychological dread ONLY. Stalkers, gaslighting, neighbors, obsession. NO supernatural. Most terrifying = human logic.
  'folklore_curse' → Rural isolation, ancient shrine taboos, generation-spanning curses, dialect-infused eeriness, inescapable fate

  ================================================================
  🏆 ALGORITHM DOMINATION SYSTEM — 2025 VERIFIED FORMULA
  ================================================================

  ━━━ TITLE (title_ja) — THE #1 FACTOR IN ALGORITHM SUCCESS ━━━
  MAX 40 chars. MUST start with【閲覧注意】. MUST use EXACTLY ONE of:

  [TYPE-1 FORBIDDEN]: Creates urgency + FOMO
  ✓「【閲覧注意】削除される前に見てください。○○の映像」
  ✓「【閲覧注意】絶対に夜一人で見ないでください。これは実話です」

  [TYPE-2 SPECIFIC NUMBER]: Numbers = instant credibility
  ✓「【閲覧注意】午前3時17分だけ現れる○○の正体」
  ✓「【閲覧注意】3日で7人が消えた場所の映像が出てきた」

  [TYPE-3 VIEWER-TARGETING]: Makes it personal → stops scroll dead
  ✓「【閲覧注意】これを最後まで見た人に、必ず起こること」
  ✓「【閲覧注意】あなたの後ろに、今いるかもしれません」

  [TYPE-4 SEALED MYSTERY]: Curiosity + credibility gap
  ✓「【閲覧注意】57年間封印されていた映像が発見された」
  ✓「【閲覧注意】誰も知らなかった理由が、ついに判明した」

  BAD TITLES (DO NOT USE): 「【閲覧注意】怖い話」「都市伝説の話」(too generic, zero CTR)
  Also generate: title_alt_a (FORBIDDEN angle) + title_alt_b (VIEWER-TARGETING angle) as A/B test variants.

  ━━━ DESCRIPTION — THE SCROLL-STOP TACTIC ━━━
  CRITICAL: First 2 lines appear BEFORE "more" button — these are your ONLY shot to hook non-subscribers:
  Line 1-2 must be a cliffhanger that sounds URGENT and EXCLUSIVE:
  ✓「この映像を見た後、3人が同じ夜に同じ悪夢を見た。あなたは大丈夫ですか？」
  ✓「削除申請が来ているため、今だけ公開しています。」
  Lines 3-5: Brief story setup + CTA (「👇コメントで体験談を」「チャンネル登録で続報を」)
  HASHTAG BLOCK (30+): #怖い話 #都市伝説 #日本怪談 #閲覧注意 #Shorts #horror #怪談 #心霊 #ミステリー #ホラー #実話 #未解決 #謎 #日本ミステリー #JapaneseHorror #怪奇現象 #恐怖 #オカルト #心霊現象 #不思議 #怖い動画 #japan #怪談話 #都市伝説2025 #心霊スポット #Japanese #scary #creepy

  ━━━ SCRIPT (script_ja) — THE LOOP-RATE MAXIMIZER ━━━
  EXACTLY 500-550 Japanese characters. PRESENT TENSE PREFERRED. Structure:

  [0~3sec] ⚡ PATTERN INTERRUPT (Most critical seconds of the video)
  Drop viewer directly into the PEAK FEAR moment. No greeting. No intro. No context.
  Use PRESENT TENSE to shatter passive viewing:
  → "今夜、あなたの部屋のドアの前に、何かがいます。"
  → "それは、絶対に振り返ってはいけないもの、でした。"
  The first line must create IMMEDIATE physical unease.

  [3~25sec] 🎭 IMMERSIVE WORLD-BUILDING (Second-person, present tense)
  Pull viewer INTO the story as a participant, not observer:
  → 「あなたは今、○○という場所を歩いています」
  → 「その街に住む人は、この話を絶対にしません」
  Specific details create credibility: exact times (午前2時43分), real-sounding names (田中美咲、26歳), famous Japanese locations.

  [25~55sec] 📈 ESCALATION ENGINE (Short sentences = breathing rhythm)
  Progressive fear through short punchy sentences. Each sentence = new dread:
  → 「気づいた時には、声が止まっていた。」
  → 「電話は、繋がったままだった。」
  → 「画面の中に、もう一人いた。」
  Build 3 separate beats of escalating terror.

  [55~75sec] 🌪 UNEXPECTED INVERSION (The algorithm's favorite moment)
  Subvert the viewer's expectation COMPLETELY. The real horror was different from what they thought.
  This is where 2nd viewing begins — viewers loop back to "check" the earlier details.

  [75~90sec] 🔁 LOOP-TRIGGER ENDING (The most important part)
  DO NOT say チャンネル登録. DO NOT say さようなら.
  Instead, force the loop with ONE of these strategies:
  STRATEGY A - Direct callback: 「最初の映像を、もう一度だけ見てください。今なら、わかるはずです」
  STRATEGY B - Viewer implication: 「この動画を最後まで見たあなたに、ひとつだけ聞かせてください」
  STRATEGY C - Unresolved revelation: 「まだ、終わっていません。あの夜以来、毎晩同じ時間に...」
  The final 1-2 sentences are the comment_trigger — must provoke a binary debate or personal confession:
  ✓「今夜、あなたは一人ですか？コメントで教えてください。」
  ✓「信じますか？それとも信じませんか？」
  ✓「あなたの家の近くに、似た場所はありますか？」
  ✓「この動画を見終えた人は、コメントに『完走』と書いてください。」

  ━━━ HOOK IMAGE — THE 0.3-SECOND SCROLL-STOPPER ━━━
  9:16 VERTICAL. MANDATORY ELEMENTS (all must be present):
  1. HUMAN FACE or silhouette — WITHOUT a face, CTR drops 50%+ (proven data)
  2. SINGLE HARSH LIGHT SOURCE — creates extreme shadow drama
  3. ONE IMPOSSIBLE ELEMENT — something that shouldn't be there
  4. J-Horror DNA — inspired by Ringu and Ju-On visual language
  Format: extreme close-up OR over-shoulder shot looking at something wrong
  NO TEXT. NO BORDERS. Pure visual terror.

  ━━━ STORY IMAGES (10 prompts) — VISUAL TENSION ARC ━━━
  Each prompt MUST include a human element (silhouette/shadow/partial face/hand)
  Arc: [1-3] atmospheric dread → [4-7] supernatural presence appears → [8-10] climax terror
  9:16 vertical. Photorealistic Japanese settings.

  ━━━ TAGS (30+) — ALGORITHM DISCOVERY FORMULA ━━━
  10 broad high-traffic: 怖い話, ホラー, 都市伝説, 心霊, 怪談, 閲覧注意, 恐怖, 実話, 心霊現象, ミステリー
  10 niche/topic-specific: [include the specific location, event type, and legend name from the topic]
  10 long-tail: 実話怪談 最新, 日本怪談 長編, 心霊スポット 日本, 都市伝説 怖い話, JapaneseHorror Shorts
  Always include: #Shorts #horror #japan #scary #creepy

  Output as complete JSON. This video MUST go viral.`;

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.85,
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }]
      }
    });

    const plan = JSON.parse(response.text) as HealingPlan;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      plan.groundingSources = chunks
        .filter(c => c.web)
        .map(c => ({ title: c.web?.title, uri: c.web?.uri }));
    }
    return plan;
  });
};

export const generateHookImage = async (imagePrompt: string, style: string = 'cinematic_real'): Promise<string | undefined> => {
  const horrorEnhancement = [
    "EXTREME HORROR ATMOSPHERE",
    "deep crimson and black color grading",
    "dramatic chiaroscuro lighting with single light source",
    "film grain and motion blur for authenticity",
    "close-up composition for emotional impact",
    "supernatural tension visible in every element",
    "implied psychological terror",
    "strictly NO explicit gore, NO excessive blood, NO graphic violence",
    "NO TEXT overlays, NO watermarks, NO borders"
  ].join(". ");
  const styleDir = getStyleDirective(style);
  const hookPrompt = `[STRICTLY 9:16 VERTICAL THUMBNAIL] ${imagePrompt}. ${horrorEnhancement}. SAFE FOR YOUTUBE. ${styleDir}`;
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: hookPrompt }] },
      config: { responseModalities: ['TEXT', 'IMAGE'] }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
  });
};

export const generateHealingImage = async (mood: string, topic: string, specificPrompt?: string, style: string = 'cinematic_real'): Promise<string | undefined> => {
  const horrorSafeguard = "SAFE FOR YOUTUBE: Focus on eerie atmosphere, shadows, and psychological dread. STRICTLY NO explicit gore, NO blood, NO graphic violence.";
  const styleDir = getStyleDirective(style);
  const prompt = `[STRICTLY 9:16 VERTICAL] ${specificPrompt || topic}. ${horrorSafeguard} ${styleDir}`;
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: ['TEXT', 'IMAGE'] }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
  });
};

export const generateHealingVideo = async (
  imageBase64: string,
  topic: string,
  onProgress?: (msg: string) => void
): Promise<string | undefined> => {
  const [header, data] = imageBase64.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

  // 시도할 모델 목록 (우선순위 순)
  const MODELS = [
    'veo-3.1-fast-generate-preview',
    'veo-2.0-generate-001',
  ];

  for (const model of MODELS) {
    try {
      onProgress?.(`🎬 영상 엔진 연결 중... (${model})`);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model,
        prompt: `Cinematic horror atmosphere for: ${topic}. Slow camera movement, dramatic lighting, Japanese horror aesthetic.`,
        image: { imageBytes: data, mimeType },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
      });
      onProgress?.(`⏳ 렌더링 중... (약 1~2분 소요)`);
      while (!op.done) {
        await wait(10000);
        op = await ai.operations.getVideosOperation({ operation: op });
      }
      const uri = op.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error('영상 URI를 받지 못했습니다.');
      onProgress?.('📥 영상 다운로드 중...');
      const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
      if (!res.ok) throw new Error(`다운로드 실패: ${res.status}`);
      const blob = await res.blob();
      onProgress?.('✅ 영상 생성 완료!');
      return URL.createObjectURL(blob);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const is404 = err?.status === 404 || msg.includes('not found') || msg.includes('404');
      if (is404 && model !== MODELS[MODELS.length - 1]) {
        // 다음 모델로 폴백
        onProgress?.(`⚠️ ${model} 접근 불가 → 폴백 모델 시도 중...`);
        continue;
      }
      // 마지막 모델도 실패 or 다른 에러
      if (is404) {
        throw new Error('VIDEO_MODEL_NOT_FOUND: Veo 모델 접근 권한이 없습니다. Google AI Studio에서 Veo Preview 접근을 신청해주세요.');
      }
      throw err;
    }
  }
  return undefined;
};

export const generateHealingAudio = async (text: string, voiceName: string = 'Charon'): Promise<string | undefined> => {
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

/**
 * 썸네일 전용 생성 (16:9 고화질 - YouTube 썸네일 최적화)
 */
export const generateThumbnail = async (plan: HealingPlan): Promise<string | undefined> => {
  const thumbPrompt = [
    `[YOUTUBE THUMBNAIL 16:9 HORIZONTAL]`,
    plan.hook_image_prompt,
    `EXTREME HORROR ATMOSPHERE. Deep crimson and pitch black. Single harsh light source.`,
    `Ultra dramatic. J-Horror aesthetic (Ringu/Ju-On). Extreme close-up face with terror.`,
    `NO TEXT, NO LETTERS, NO WATERMARK. Hyper realistic photograph. 4K quality.`,
    `STRICTLY HORIZONTAL 16:9 WIDESCREEN FORMAT.`
  ].join(' ');

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: thumbPrompt }] },
      config: { responseModalities: ['TEXT', 'IMAGE'] }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
  });
};

/**
 * AI 주제 추천 - 성공 패턴 분석 기반
 */
export const generateTopicSuggestions = async (
  successfulTopics: string[],
  count = 6
): Promise<string[]> => {
  const examples = successfulTopics.slice(0, 5).join('\n- ');
  const prompt = `You are a Japanese horror YouTube content strategist.

These topics performed well (933~2,862 views):
- ${examples}

Analyze the patterns (location specificity, forbidden themes, mysterious disappearances, urban legends, supernatural encounters) and generate ${count} NEW unique topic ideas following the same successful formula.

Requirements:
- Each topic: 15-30 Japanese characters
- Must feel real and credible (specific locations, times, names)
- High curiosity gap
- Different from the examples above

Return ONLY a JSON array of strings, no explanation:
["topic1", "topic2", ...]`;

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.9 }
    });
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  });
};

// ─── 시리즈 3부작 자동 기획 ───
export interface SeriesEpisode {
  episode: 1 | 2 | 3;
  title_ja: string;
  hook: string;
  script_outline_ja: string;
  cliffhanger_ja: string;
}

export const generateSeriesPlan = async (
  baseTopic: string,
  persona: PersonaType = 'urban_legend'
): Promise<SeriesEpisode[]> => {
  const prompt = `You are Japan's top horror series planner. Create a viral 3-EPISODE YouTube Shorts series.
Base topic: "${baseTopic}" | Persona: ${persona}

Each episode MUST:
- End with a cliffhanger forcing viewers to episode 2 or 3
- Use suffix 【前編】【中編】【後編】 in title
- Escalate: Ep1(mystery setup) → Ep2(shocking escalation) → Ep3(terrifying finale)

Return ONLY valid JSON array (no markdown, no explanation):
[
  {"episode":1,"title_ja":"【閲覧注意】...【前編】","hook":"(3-second opening scene)","script_outline_ja":"(100 chars outline)","cliffhanger_ja":"(last sentence driving to Ep2)"},
  {"episode":2,"title_ja":"【閲覧注意】...【中編】","hook":"...","script_outline_ja":"...","cliffhanger_ja":"(driving to Ep3)"},
  {"episode":3,"title_ja":"【閲覧注意】...【後編】","hook":"...","script_outline_ja":"...","cliffhanger_ja":"(final revelation)"}
]`;

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.9 }
    });
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed as SeriesEpisode[] : [];
  });
};
/**
 * 타이틀 A/B 3종 생성
 */
export const generateAlternativeTitles = async (topic: string, baseTitle: string): Promise<string[]> => {
  const prompt = `You are Japan's #1 YouTube CTR optimization expert.

Base title: "${baseTitle}"
Topic: "${topic}"

Generate 3 alternative titles using DIFFERENT psychological triggers:
- Title 1: Focus on FORBIDDEN/WARNING angle (絶対に/見てはいけない)
- Title 2: Focus on SPECIFIC TIME/NUMBER (午前3時/7日間)
- Title 3: Focus on REAL STORY/EVIDENCE (実話/撮影禁止区域)

Rules:
- Each max 40 Japanese characters
- Must start with【閲覧注意】
- Different from base title
- Ultra high CTR potential

Return ONLY JSON array: ["title1", "title2", "title3"]`;

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.85 }
    });
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  });
};
