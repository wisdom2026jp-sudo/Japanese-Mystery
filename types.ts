
export type ContentLanguage = 'ja' | 'ko';

// 배치 생성 큐 아이템
export interface BatchQueueItem {
  id: string;
  topic: string;
  status: 'pending' | 'running' | 'done' | 'error';
  plan?: HealingPlan;
  errorMsg?: string;
}

// 생성 이력 아이템
export interface HistoryItem {
  id: string;
  topic: string;
  createdAt: string;
  plan: HealingPlan;
  language: ContentLanguage;
  bgmVolume: number;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface HealingPlan {
  title_ja: string;
  title_kr: string;
  // A/B 테스트 대체 제목
  title_alt_a?: string;  // FORBIDDEN angle 버전
  title_alt_b?: string;  // VIEWER-TARGETING angle 버전
  description_ja: string;
  script_ja: string;
  script_kr: string;
  // 알고리즘 최적화 필드
  loop_hook?: string;         // 루프 재생 유도 엔딩 문장
  comment_trigger?: string;   // 댓글 폭발 유도 질문
  optimal_upload_time?: string; // 최적 업로드 시간 (JST)
  mood: string;
  bgm_descriptor: string;
  tags: string[];
  hook_image_prompt: string;
  story_image_prompts: string[];
  creator_affirmation: string;
  backgroundImageUrl?: string;
  storyImageUrls?: string[];
  hookImageUrl?: string;
  hookVideoUrl?: string;
  backgroundVideoUrl?: string;
  audioBase64?: string;
  selectedEffects?: MysteryEffect[];
  selectedSfx?: string[];
  hookText?: string;
  groundingSources?: GroundingSource[];
}

export type MysteryEffect = 'night_vision' | 'tracking' | 'film_jitter';

export type SfxType = 'horror_noise' | 'heartbeat' | 'transition_whoosh' | 'deep_rumble' | 'static_burst';

export type VisualStyle = 'warm_film' | 'blue_hour' | 'dreamy_soft' | 'cinematic_real';

export type PersonaType = 'urban_legend' | 'true_story' | 'human_horror' | 'folklore_curse';

export interface Persona {
  id: PersonaType;
  name: string;
  icon: string;
  description: string;
  color: string;
  label: string;
}

export enum GenerationStep {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  GENERATING_HOOK_VIDEO = 'GENERATING_HOOK_VIDEO',
  PROCESSING_ASSETS = 'PROCESSING_ASSETS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export const MOOD_VIDEOS: Record<string, string> = {
  rain: "https://picsum.photos/seed/rain/1080/1920",
  night: "https://picsum.photos/seed/night/1080/1920",
  coffee: "https://picsum.photos/seed/coffee/1080/1920",
  forest: "https://picsum.photos/seed/forest/1080/1920",
  school: "https://picsum.photos/seed/school/1080/1920",
  default: "https://picsum.photos/seed/calm/1080/1920"
};
