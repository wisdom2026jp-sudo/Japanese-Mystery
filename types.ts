
export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface HealingPlan {
  title_ja: string;
  title_kr: string;
  description_ja: string;
  script_ja: string;
  script_kr: string;
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

export type PersonaType = 'success' | 'mystery' | 'dopamine' | 'healer';

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
