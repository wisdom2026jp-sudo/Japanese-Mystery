
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
    title_ja: { type: Type.STRING, description: "YouTube Shorts Title (Japanese)." },
    title_kr: { type: Type.STRING },
    description_ja: { type: Type.STRING, description: "Description with Japanese hashtags." },
    script_ja: { type: Type.STRING, description: "1500 characters Japanese narration. Professional tone." },
    script_kr: { type: Type.STRING },
    mood: { type: Type.STRING, enum: ["rain", "night", "coffee", "forest", "school"] },
    bgm_descriptor: { type: Type.STRING },
    hook_image_prompt: { type: Type.STRING },
    story_image_prompts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 15 detailed cinematic image prompts."
    },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    creator_affirmation: { type: Type.STRING }
  },
  required: ["title_ja", "title_kr", "description_ja", "script_ja", "script_kr", "mood", "bgm_descriptor", "hook_image_prompt", "story_image_prompts", "tags", "creator_affirmation"],
};

export const generateHealingPlan = async (topic: string, persona: PersonaType = 'mystery'): Promise<HealingPlan> => {
  const prompt = `Create a professional YouTube Shorts production plan for: "${topic}". 
  Target: Japanese audience. Tone: ${persona}.
  Video length: 2:59.
  
  CRITICAL INSTRUCTIONS for YouTube Algorithm:
  1. title_ja: Must be an extremely attention-grabbing, viral click-bait title (max 50 chars). User power words, emojis, and mystery hooks.
  2. description_ja: Write a detailed, engaging description including a summary of the mystery and emotional hooks.
  3. tags: Provide 20+ viral search tags related to Japanese mystery and the specific topic.
  
  You MUST provide exactly 15 distinct image prompts for the storyboard.
  EACH PROMPT MUST DESCRIBE A VERTICAL (9:16) COMPOSITION.
  Use Google Search to find real historical facts or urban legends related to the topic for Japanese authenticity.
  JSON format required.`;

  return retryWithBackoff(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8,
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
  const hookPrompt = `[STRICTLY 9:16 VERTICAL] Authentic Japanese scene. Full vertical frame. High-end cinematic photography. No horizontal margins. ${imagePrompt}. ${JAPANESE_PHOTO_RULES}`;
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
