
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

const JAPANESE_PHOTO_RULES = "STRICTLY REAL PHOTOGRAPH. HIGH-END CINEMATIC REALISM. 2K LEVEL DETAIL. MUST FEATURE AUTHENTIC JAPANESE PEOPLE AND LOCATIONS. NO TEXT, NO LETTERS. 9:16 VERTICAL.";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title_ja: { type: Type.STRING, description: "Ultra-high CTR YouTube Shorts title. Max 40 chars. Must create extreme curiosity gap." },
    title_kr: { type: Type.STRING },
    description_ja: { type: Type.STRING, description: "SEO-optimized description. First 2 lines must be a cliffhanger teaser. Include 15+ hashtags." },
    script_ja: { type: Type.STRING, description: "200-220 chars Japanese narration. Hook in first 5 sec. Cliffhanger at end. Natural spoken pace." },
    script_kr: { type: Type.STRING },
    mood: { type: Type.STRING, enum: ["rain", "night", "coffee", "forest", "school"] },
    bgm_descriptor: { type: Type.STRING },
    hook_image_prompt: { type: Type.STRING },
    story_image_prompts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 5 horror cinematic image prompts for 59sec Shorts pace."
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    creator_affirmation: { type: Type.STRING }
  },
  required: ["title_ja", "title_kr", "description_ja", "script_ja", "script_kr", "mood", "bgm_descriptor", "hook_image_prompt", "story_image_prompts", "tags", "creator_affirmation"],
};

export const generateHealingPlan = async (topic: string, persona: PersonaType = 'mystery'): Promise<HealingPlan> => {
  const prompt = `You are Japan's #1 YouTube Shorts horror content strategist. Create a viral production plan for: "${topic}".
  Target: Japanese audience (18-35). Tone: ${persona}. Video: EXACTLY 59 seconds.

  ================================================================
  YOUTUBE SHORTS CTR MAXIMIZATION SYSTEM (Research-Based)
  ================================================================

  ★ TITLE FORMULA (title_ja) — MAX 40 CHARS, ULTRA HIGH CTR:
  Combine 2-3 of these proven psychological triggers:

  [TRIGGER A - 禁止/警告] (Forbidden/Warning language)
  → 「絶対に一人で見ないでください」「見てはいけなかった」「削除される前に見てください」

  [TRIGGER B - 具体的数字] (Specific numbers = believability)
  → 「午前3時17分」「3日後に消えた」「7回繰り返した者は...」

  [TRIGGER C - 未完結の謎] (Curiosity gap / unresolved mystery)
  → 「...その正体は」「誰も知らなかった理由」「今も解明されていない」

  [TRIGGER D - 実話/証拠] (Real story / evidence framing)
  → 「これは実話です」「撮影禁止区域の映像」「遺族が初めて語った」

  [TRIGGER E - 地名/固有名詞] (Specific = credible)
  → 京都, 青木ヶ原, 渋谷, 病院, 廃墟, 大学, 地下鉄

  TITLE EXAMPLES (DO NOT COPY, use as inspiration):
  ✓「【閲覧注意】午前3時の病院で撮れた映像...削除前に」(39字)
  ✓「【閲覧注意】京都の廃病院、7人が見た同じ夢の正体」(40字)
  ✓「【閲覧注意】絶対に一人で見るな。青木ヶ原の禁止区域」(40字)
  ✗ BAD: 「【閲覧注意】怖い話」(too vague, no curiosity gap)

  ★ DESCRIPTION (description_ja) — SEO + CURIOSITY STRUCTURE:
  CRITICAL: First 2 lines appear BEFORE the "more" button. Must be a cliffhanger:

  Line 1-2 (VISIBLE): Shocking teaser that STOPS the scroll.
    → "この映像を見た3名が、その夜に同じ悪夢を見た。あなたは大丈夫ですか？"
    → "削除申請が入ったため、今だけ公開しています。"

  Line 3-5 (AFTER MORE): Story context + call to action:
    → Brief story setup (2 sentences)
    → 「チャンネル登録で続きの真相を公開予定」
    → 「👇コメントで体験談をシェアしてください」

  HASHTAG BLOCK (20+ tags, SEO ordered by search volume):
  #怖い話 #都市伝説 #日本怪談 #閲覧注意 #Shorts #horror #怪談 #心霊 #ミステリー
  #ホラー #怖い #実話 #未解決 #謎 #日本ミステリー #JapaneseHorror #怪奇現象
  #恐怖 #オカルト #心霊現象 #不思議な話 #怖い動画

  ★ SCRIPT (script_ja) — 200-220 CHARS, SPOKEN WORD OPTIMIZED:
  STRUCTURE (psychological arc):
  [0-5sec]   PATTERN INTERRUPT: Drop audience into peak moment. NO intro.
             → "それは、信じてはいけないものを見た瞬間だった。"
             → "あの日から、彼女は二度と口を開かなかった。"

  [5-35sec]  STORY BUILD: Specific details = credibility.
             Use: exact times, real-sounding names, specific locations.
             Raise tension with: 「そこにいるはずのない人影が」「声が聞こえた時、電話は繋がっていた」

  [35-50sec] REVELATION/TWIST: The scariest moment.
             Subvert expectations. Make it personal: 「あなたは大丈夫ですか？」

  [50-55sec] CLIFFHANGER CLOSE (drives subscriptions):
             → "この謎は今も解明されていない。"
             → "続きは...チャンネルに。"

  ★ HOOK IMAGE (hook_image_prompt) — THUMBNAIL CTR PSYCHOLOGY:
  Apply the "3-second stop-scroll" formula:
  1. FACE with extreme emotion (terror, shock) OR mysterious silhouette
  2. HIGH CONTRAST: pitch black background + single harsh light
  3. ANOMALY: something that shouldn't be there
  4. J-Horror aesthetic (Ringu/Ju-On inspired)
  Must be: 9:16 vertical, 2K, NO TEXT, extreme close-up preferred.

  ★ TAGS (30+ tags, mix of high/low competition):
  Include: broad tags (怖い話, ホラー) + specific niche tags (Japanese urban legend names)
  + trending tags (Shorts, horror, japan) + long-tail tags (実話怪談 最新, 日本怪談 短編)

  Output as JSON. Make this go VIRAL.`;

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

export const generateHookImage = async (imagePrompt: string, style: VisualStyle = 'cinematic_real'): Promise<string | undefined> => {
  // ✅ 공포 썸네일 최적화: 높은 CTR을 위한 극적 공포 요소 강화
  const horrorEnhancement = [
    "EXTREME HORROR ATMOSPHERE",
    "deep crimson and black color grading",
    "dramatic chiaroscuro lighting with single light source",
    "film grain and motion blur for authenticity",
    "close-up composition for emotional impact",
    "supernatural tension visible in every element",
    "inspired by J-horror cinema (Ringu, Ju-On aesthetic)",
    "NO TEXT overlays, NO watermarks, NO borders"
  ].join(". ");
  const hookPrompt = `[STRICTLY 9:16 VERTICAL THUMBNAIL] ${imagePrompt}. ${horrorEnhancement}. ${JAPANESE_PHOTO_RULES}`;
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: hookPrompt }] },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: "2K" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
  });
};

export const generateHealingImage = async (mood: string, topic: string, specificPrompt?: string, style: VisualStyle = 'cinematic_real'): Promise<string | undefined> => {
  const prompt = `[STRICTLY 9:16 VERTICAL] Full vertical composition. Cinematic Japanese mood. High resolution. ${specificPrompt || topic}. ${JAPANESE_PHOTO_RULES}`;
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "9:16", imageSize: "2K" } }
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

  return retryWithBackoff(async () => {
    onProgress?.("AIエンジン接続中...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let op = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic cinematic movement for: ${topic}. Professional atmospheric camera work.`,
      image: { imageBytes: data, mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });
    onProgress?.("レンダリング中 (約1分)...");
    while (!op.done) {
      await wait(10000);
      op = await ai.operations.getVideosOperation({ operation: op });
    }
    const uri = op.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return undefined;
    const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  });
};

export const generateHealingAudio = async (text: string): Promise<string | undefined> => {
  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};
