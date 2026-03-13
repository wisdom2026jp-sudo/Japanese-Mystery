
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon, Zap, Laugh, Ghost, Moon, Rocket, AlertTriangle, Eye, Move, MapPin, Skull, Key, Grid, LayoutDashboard, Terminal, Info, RefreshCw, Languages, Volume2, Play, Youtube, StopCircle, History, Plus, Trash2, ChevronDown, ChevronUp, ListPlus, X, TrendingUp, Flame, Mic, Type, Calendar } from 'lucide-react';
import { generateHealingPlan, generateHealingImage, generateHookImage, generateHealingAudio, generateHealingVideo, generateTopicSuggestions } from './services/geminiService';
import { saveHistoryToFirestore, loadHistoryFromFirestore, deleteHistoryFromFirestore } from './services/firebaseService';
import { HealingPlan, GenerationStep, VisualStyle, PersonaType, Persona, MysteryEffect, SfxType, ContentLanguage, BatchQueueItem, HistoryItem } from './types';
import { ScriptCard } from './components/ScriptCard';
import { VideoPreview } from './components/VideoPreview';
import { PythonExport } from './components/PythonExport';
import { playSfxPreview } from './utils/sfxPlayer';
import { saveToLocalStorage } from './utils/autoSave';
import YoutubeUploadModal from './components/YoutubeUploadModal';
import ThumbnailEditor from './components/ThumbnailEditor';
import { BGM_LIBRARY, BgmTrack, pickRandomBgm, fetchBgmAsFile } from './utils/bgmLibrary';
import ContentCalendar from './components/ContentCalendar';
import { generateSeriesPlan, SeriesEpisode } from './services/geminiService';


declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface ExtendedPersona extends Persona {
  name_kr: string;
}

const PERSONAS: ExtendedPersona[] = [
  { id: 'urban_legend', name: '都市伝説・ミステリー', name_kr: '도시전설의 진실', icon: 'Ghost', description: '현대 괴담과 기묘한 사건', color: 'bg-red-950 text-red-400 border-red-900', label: 'Urban' },
  { id: 'true_story', name: '実話・心霊体験', name_kr: '실화 괴담', icon: 'Eye', description: '소름 돋는 실제 체험담', color: 'bg-blue-950 text-blue-400 border-blue-900', label: 'True Story' },
  { id: 'human_horror', name: 'ヒトコワ・狂気', name_kr: '심리적 공포', icon: 'Skull', description: '귀신보다 무서운 진짜 인간', color: 'bg-indigo-950 text-indigo-400 border-indigo-900', label: 'Psychological' },
  { id: 'folklore_curse', name: '呪い・土着信仰', name_kr: '민간신앙과 저주', icon: 'AlertTriangle', description: '마을의 금기와 벗어날 수 없는 저주', color: 'bg-amber-950 text-amber-400 border-amber-900', label: 'Folklore' }
];

const ALL_MYSTERY_PRESETS = [
  { title: "赤いコート", title_kr: "붉은 코트의 여자", query: "새벽 3시 교차로마다 나타나는 붉은 코트의 여자, 눈이 마주치면 일주일 안에 사라진다는 도쿄 도시전설" },
  { title: "人面犬", title_kr: "인면견", query: "고속도로를 시속 100km로 달리는 사람 얼굴의 개, 인면견을 목격한 자는 반드시 불행이 찾아오는 일본 괴담" },
  { title: "口裂け女", title_kr: "입찢긴 여자", query: "마스크 뒤에 귀까지 찢어진 입을 숨긴 여자, '나 예뻐?'라고 묻는 일본 최공포 도시전설의 진실" },
  { title: "青い血の女", title_kr: "파란 피의 여자", query: "오사카 지하철 마지막 칸에만 나타나는 파란 피를 흘리는 여자 승객, 종착역 이후 행방불명된 목격자들" },
  { title: "鏡の中の他人", title_kr: "거울 속 타인", query: "심야 12시, 거울 속 내 모습이 0.5초 늦게 움직인다는 괴담. 일본 연구소의 실험 영상이 유출된 사건" },
  { title: "呪いの絵画", title_kr: "저주받은 그림", query: "경매 때마다 소유자가 사망하는 메이지 시대 일본 화가의 그림, 그림 속 소녀의 눈동자가 밤마다 움직인다" },
  { title: "地下鉄の幽霊", title_kr: "지하철 유령 승객", query: "도쿄 마루노우치선 야간 운행 시 나타나는 승객 명부에 없는 탑승자, 17년째 같은 정류장에서 타고 내린다" },
  { title: "木の上の笑い声", title_kr: "나무 위의 웃음소리", query: "교토 후시미이나리 신사 폐쇄 구역 깊은 밤, 수십 미터 높이 삼나무 위에서 들려오는 어린아이의 웃음소리" },
  { title: "一本足の女", title_kr: "외다리 여인", query: "교토 산속 다리에서 불쑥 나타나는 다리가 하나인 여인, 만나는 자는 다음날 산 아래에서 죽은 채 발견된다" },
  { title: "電話鬼", title_kr: "전화 귀신", query: "바다 면한 당주에 있는 공중전화로부터 반복적으로 일본어로 수신되는 전화, 수신자 모두 3일 이내 실종" },
  { title: "善哉架橋", title_kr: "선재집", query: "오사카 특정 사찰에서 10년에 한 번씩 발굴되는 신원 미상 아이의 유해, DNA 검사 결과 항상 신원 불명 판정이 나오며 주지의 5대 연속 불가사의한 죽음이 이어진다" },
  { title: "香川県の海", title_kr: "카가와 해수욕장", query: "카가와현 해수욕장 특정 구역에서 매년 여름 실종되는 수영객들, 수색대가 발견한 것은 모래 위에 가지런히 정렬된 신발뿐이었다" },
  { title: "山の禁じ道", title_kr: "산의 금지된 길", query: "후지산 특정 등산로에서 메아리가 들리면 절대 돌아봐선 안 된다는 금기, 메아리는 이미 죽은 자가 산을 내려오라고 부르는 소리라는 100년 전설" },
  { title: "深夜のコンビニ", title_kr: "심야 편의점", query: "일본 전국 편의점 CCTV에 새벽 3시마다 포착되는 정체불명의 인물, 직원에게만 보이고 고객의 눈에는 보이지 않으며 그 직원들은 일주일 내에 사직서를 낸다" },
  { title: "決して教えない部屋", title_kr: "절대 가르쳐 주지 않는 방", query: "새로 이사한 집에는 반드시 도면에 없는 방이 하나 더 있다는 일본 부동산 괴담, 새 세입자마다 그 방 안에서 이전 거주자의 수수께끼 메모를 발견한다" },
  { title: "水川の仮面", title_kr: "강의 가면", query: "시즈오카 특정 강에서 매년 발견되는 신원 미상 얼굴 가면, 부검 결과 항상 3년 전에 사망이라는 불가사의한 결론이 나오며 강 주변 주민 모두 꿈에서 같은 얼굴을 본다" },
  { title: "呪いの田", title_kr: "저주의 논", query: "교토 외곽 특정 논에서 대대로 이어지는 저주, 그 논 소유 가문의 5대째까지 모두 같은 날짜에 사망했으며 현재 그 날이 다가오고 있다" },
  { title: "入れ替わりの恋人", title_kr: "바뀐 연인", query: "정확히 자정에 성격이 완전히 바뀌는 오사카 남성, 7년간 동거한 여자친구는 낮의 그와 밤의 그는 완전히 다른 사람이라며 실종 직전 충격적인 영상을 남겼다" },
  { title: "犬が返ってこない山", title_kr: "개가 돌아오지 않는 산", query: "나가노현 특정 산을 개와 함께 오르면 개만 돌아오지 않는다는 괴담, 돌아온 개들은 하나같이 산 방향을 바라보며 짖기를 평생 멈추지 않는다" },
  { title: "印籠の呪い", title_kr: "인장의 저주", query: "에도 시대 7인의 사무라이가 남긴 저주의 문서, 문서에 이름이 오른 가문의 후손들이 현대에도 같은 방식으로 죽어가고 있다는 계보 추적 충격 기록" },
  { title: "ブラッククリスマス", title_kr: "블랙 크리스마스", query: "크리스마스 이브 자정 일본 각지 어린이들의 꿈에 동시에 나타나는 검은 산타, 아이들이 아침에 일어나 그린 그림 속 얼굴이 모두 동일한 충격 사건" },
  { title: "正月の訪問者", title_kr: "정월의 방문자", query: "음력 설날 새벽 자신의 모습과 똑같은 존재가 문을 두드린다는 일본 전통 괴담, 눈을 마주치면 그 해 운이 모두 빠져나간다는 경고가 대대로 전해진다" },
  { title: "天井の裸足", title_kr: "천장의 맨발", query: "에도 시대 분가한 집 천장에서 들려오는 맨발 걷는 소리, 100년이 지난 지금도 그 건물 터에 세운 신축 아파트에서 같은 소리가 들린다는 신고가 이어진다" },
  { title: "混じり無しの電車", title_kr: "텅 빈 전차", query: "도쿄 특정 지하철 노선 마지막 열차의 특정 칸, 그 칸에 타면 다음 역에서 반드시 짙은 안개가 차 안을 가득 채우며 탑승자들은 종점에서 기억을 잃은 채 발견된다" },
  { title: "学校の七不思議", title_kr: "학교의 7가지 불가사의", query: "도쿄 한 중학교에서 전해지는 7번째 불가사의, 밤 11시 4번 교실 문을 7번 두드리면 1년 전 전학 간 학생의 목소리가 응답하며 전학 기록은 존재하지 않는다" },
  { title: "死後のSNS", title_kr: "사후 SNS", query: "3주 전 교통사고로 사망한 청년의 SNS 계정에서 지속적으로 올라오는 근황 사진들, 사진 배경은 모두 그가 죽기 전 가보고 싶다고 말했던 장소들이다" },
  { title: "医学部の怪談", title_kr: "의대의 괴담", query: "교토 대학 의학부 해부학 실습실에 2010년부터 전해지는 괴담, 새벽 2시에 실습실에 혼자 들어가면 이미 해부된 시신이 스스로 봉합되어 일어선다" },
  { title: "消えた町の記憶", title_kr: "사라진 마을의 기억", query: "도쿄 한 구역에 40년 전 번화한 마을이 있었다는 노인의 증언, 지도와 사진 어디에도 흔적이 없으며 그 자리에 서면 지금도 시장 소음이 들린다고 한다" },
  { title: "海底の灯台", title_kr: "해저 등대", query: "시즈오카 해안 수심 20m 해저에서 밤마다 불빛이 깜박이는 등대 구조물, 다이버들이 접근하면 영상이 끊기고 귀환한 뒤 잠수 중의 기억이 사라진다고 한다" },
  { title: "予言の歌声", title_kr: "예언의 노랫소리", query: "특정 가라오케 건물 지하 빈 방에서 들려오는 노래 소리, 내용은 아직 발생하지 않은 미래 뉴스이며 그 예언들이 모두 적중했다" },
  { title: "嫌いな窓外", title_kr: "불길한 창가", query: "마루노우치선 특정 좌석에 앉으면 반드시 창밖에서 손을 흔드는 여자가 보인다는 괴담, 그 여자를 목격한 네 명은 모두 정신과 치료를 받고 있다" },
  { title: "雨の夜の失踪", title_kr: "비오는 밤의 실종", query: "에히메현 특정 마을에서 비오는 날마다 다른 연령대의 아이들이 같은 지점에서 실종된다, 마을 신도비에 비에 젖은 아이를 따라가지 말라는 경고가 새겨져 있다" },
  { title: "無人島の日誌", title_kr: "무인도의 일지", query: "오키나와 무인도에서 발견된 오래된 생존 일지들, 내용은 모두 오늘도 그것이 왔다로 끝나며 탐험대원들은 귀환 후 모두 같은 악몽을 꾸었다고 한다" },
  { title: "神社の竜の穴", title_kr: "신사의 용 구멍", query: "홋카이도 특정 신사 경내 거대한 나무에 뚫린 구멍, 손을 넣으면 수백 개의 눈동자가 손을 잡아당기는 감각을 느낀다는 체험담이 전국에서 이어진다" },
];

// 랜덤하게 중복 없이 8개 선택
function samplePresets(all: typeof ALL_MYSTERY_PRESETS, exclude: Set<number>, count = 8) {
  const available = all.map((_, i) => i).filter(i => !exclude.has(i));
  const pool = available.length >= count ? available : all.map((_, i) => i);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic_real');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('urban_legend');
  const [selectedEffects, setSelectedEffects] = useState<MysteryEffect[]>(['night_vision', 'film_jitter']);
  const [selectedSfx, setSelectedSfx] = useState<SfxType[]>(['horror_noise', 'heartbeat']);
  const [hookText, setHookText] = useState<string>('都市伝説');
  const [plan, setPlan] = useState<HealingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'calendar'>('preview');
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [imgProgress, setImgProgress] = useState({ current: 0, total: 0 });

  const [userBgm, setUserBgm] = useState<File | null>(null);
  const [userHookVideo, setUserHookVideo] = useState<File | null>(null);
  const [hasVideoKey, setHasVideoKey] = useState(false);
  // BGM 자동 선택 state
  const [selectedBgmTrack, setSelectedBgmTrack] = useState<BgmTrack | null>(null);
  const [isBgmLoading, setIsBgmLoading] = useState(false);

  // 언어 선택
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>('ja');

  // BGM 볼륨 (기본 18%)
  const [bgmVolume, setBgmVolume] = useState(0.18);

  // TTS 보이스 선택
  const [ttsVoice, setTtsVoice] = useState('Charon');
  // 시리즈 기획 state
  const [showSeries, setShowSeries] = useState(false);
  const [seriesEpisodes, setSeriesEpisodes] = useState<SeriesEpisode[]>([]);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);

  // ① 생성 취소용 ref
  const cancelledRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // ② 생성 이력 (Firestore)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // ③ 배치 생성 큐
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchInput, setBatchInput] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // ④ 이미지 드래그 state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // ⑤ AI 주제 추천 state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // 프리셋 새로고침 state
  const [presetIndices, setPresetIndices] = useState<number[]>(() =>
    samplePresets(ALL_MYSTERY_PRESETS, new Set())
  );
  const [usedPresetIndices, setUsedPresetIndices] = useState<Set<number>>(() => new Set<number>());
  const [isPresetRefreshing, setIsPresetRefreshing] = useState(false);

  // 현재 재생 중인 SFX
  const [playingSfx, setPlayingSfx] = useState<SfxType | null>(null);

  // 인기 소재 TOP5 힌트 패널
  const [showTrending, setShowTrending] = useState(false);

  // API 키가 있으면 Video 기능 활성화
  useEffect(() => {
    if (process.env.API_KEY) setHasVideoKey(true);
  }, []);

  // Firestore에서 이력 초기 로드
  useEffect(() => {
    loadHistoryFromFirestore()
      .then(items => setHistory(items))
      .catch(() => {
        // Firestore 실패 시 LocalStorage 폴백
        try {
          const raw = localStorage.getItem('mf_history');
          if (raw) setHistory(JSON.parse(raw));
        } catch {}
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  // 이력 저장 함수 - Firestore 저장 (이미지 base64 제외)
  const saveToHistory = useCallback((newPlan: HealingPlan, topicText: string) => {
    const planForStorage: HealingPlan = {
      ...newPlan,
      storyImageUrls: undefined,
      hookImageUrl: undefined,
      hookVideoUrl: undefined,
      backgroundVideoUrl: undefined,
      backgroundImageUrl: undefined,
      audioBase64: undefined,
    };
    const item = {
      topic: topicText,
      createdAt: new Date().toLocaleString('ko-KR'),
      plan: planForStorage,
      language: contentLanguage,
      bgmVolume,
    };
    // Firestore 저장
    saveHistoryToFirestore(item)
      .then(id => {
        setHistory(prev => [{ id, ...item }, ...prev].slice(0, 30));
      })
      .catch(() => {
        // 실패 시 LocalStorage 폴백
        const fallback: HistoryItem = { id: Date.now().toString(), ...item };
        setHistory(prev => {
          const next = [fallback, ...prev].slice(0, 20);
          try { localStorage.setItem('mf_history', JSON.stringify(next)); } catch {}
          return next;
        });
      });
  }, [contentLanguage, bgmVolume]);

  // 플랜 자동 저장 (변경 후 5초 뒤)
  useEffect(() => {
    if (!plan) return;
    const timer = setTimeout(() => {
      saveToLocalStorage(plan, userBgm);
    }, 5000);
    return () => clearTimeout(timer);
  }, [plan, userBgm]);

  // 이력에서 불러오기
  const loadFromHistory = (item: HistoryItem) => {
    setPlan(item.plan);
    setTopic(item.topic);
    setContentLanguage(item.language);
    setBgmVolume(item.bgmVolume);
    setStep(GenerationStep.COMPLETED);
    setShowHistory(false);
  };

  // 이력 삭제 (Firestore)
  const deleteHistory = (id: string) => {
    deleteHistoryFromFirestore(id).catch(() => {});
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  // 이미지 드래그 재배치
  const handleImageDragStart = (e: React.DragEvent, idx: number) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleImageDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx || !plan?.storyImageUrls) return;
    const urls = [...plan.storyImageUrls];
    const prompts = [...plan.story_image_prompts];
    const [dragUrl] = urls.splice(dragIndex, 1);
    const [dragPrompt] = prompts.splice(dragIndex, 1);
    urls.splice(idx, 0, dragUrl);
    prompts.splice(idx, 0, dragPrompt);
    setPlan(prev => prev ? { ...prev, storyImageUrls: urls, story_image_prompts: prompts } : null);
    setDragIndex(null);
  };

  const handleRefreshPresets = () => {
    setIsPresetRefreshing(true);
    setTimeout(() => {
      const newUsed = new Set<number>([...usedPresetIndices, ...presetIndices]);
      const next = samplePresets(ALL_MYSTERY_PRESETS, newUsed);
      setPresetIndices(next);
      setUsedPresetIndices(newUsed);
      setIsPresetRefreshing(false);
    }, 280);
  };

  const visiblePresets = presetIndices.map(i => ALL_MYSTERY_PRESETS[i]);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await window.aistudio?.hasSelectedApiKey();
      setHasVideoKey(!!hasKey);
    };
    checkKey();
  }, []);

  const handleGenerate = async (e: React.FormEvent, overrideTopic?: string) => {
    e?.preventDefault();
    const activeTopic = overrideTopic || topic;
    if (!activeTopic.trim()) return;

    cancelledRef.current = false;
    setIsCancelling(false);
    setStep(GenerationStep.GENERATING_SCRIPT);
    setError(null);
    setPlan(null);
    setImgProgress({ current: 0, total: 0 });

    try {
      const generatedPlan = await generateHealingPlan(activeTopic, selectedPersona);
      if (cancelledRef.current) { setStep(GenerationStep.IDLE); return; }
      generatedPlan.selectedEffects = selectedEffects;
      generatedPlan.selectedSfx = selectedSfx;
      generatedPlan.hookText = hookText;
      setPlan(generatedPlan);

      const prompts = generatedPlan.story_image_prompts || [];
      setImgProgress({ current: 0, total: prompts.length });
      setStep(GenerationStep.GENERATING_IMAGE);

      const hookUrl = await generateHookImage(generatedPlan.hook_image_prompt, visualStyle);
      if (cancelledRef.current) { setStep(GenerationStep.IDLE); return; }
      const storyUrls: string[] = [];

      for (let i = 0; i < prompts.length; i++) {
        if (cancelledRef.current) break;
        setImgProgress(prev => ({ ...prev, current: i + 1 }));
        const url = await generateHealingImage(generatedPlan.mood, activeTopic, prompts[i], visualStyle);
        if (url) {
          storyUrls.push(url);
          setPlan(prev => prev ? ({ ...prev, storyImageUrls: [...storyUrls] }) : null);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      if (cancelledRef.current) { setStep(GenerationStep.IDLE); return; }

      setStep(GenerationStep.GENERATING_AUDIO);
      const narrationScript = contentLanguage === 'ko' ? generatedPlan.script_kr : generatedPlan.script_ja;
      const audioBase64 = await generateHealingAudio(narrationScript, ttsVoice);

      const finalPlan: HealingPlan = {
        ...generatedPlan,
        selectedEffects,
        storyImageUrls: storyUrls,
        hookImageUrl: hookUrl,
        audioBase64: audioBase64 || undefined
      };
      setPlan(finalPlan);
      setStep(GenerationStep.COMPLETED);

      // ② 이력에 자동 저장
      saveToHistory(finalPlan, activeTopic);

    } catch (err: any) {
      if (cancelledRef.current) { setStep(GenerationStep.IDLE); return; }
      const errorMessage = err.message || "알 수 없는 오류가 발생했습니다.";
      if (errorMessage.includes("API_KEY_MISSING")) {
        setError("🔑 API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요.");
      } else if (errorMessage.includes("QUOTA_EXCEEDED")) {
        setError("⏰ API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      } else if (errorMessage.includes("VIDEO_MODEL_NOT_FOUND")) {
        setError("🎥 영상 생성 모델에 접근할 수 없습니다. AI Studio에서 API 키를 다시 선택해주세요.");
      } else {
        setError(`❌ 오류 발생: ${errorMessage}`);
      }
      setStep(GenerationStep.ERROR);
    }
  };

  // ① 생성 취소
  const handleCancel = () => {
    cancelledRef.current = true;
    setIsCancelling(true);
    setVideoStatus('');
  };

  // ③ 배치 생성 시작
  const handleBatchAdd = () => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const items: BatchQueueItem[] = lines.map(l => ({ id: Date.now() + Math.random() + l, topic: l, status: 'pending' }));
    setBatchQueue(prev => [...prev, ...items]);
    setBatchInput('');
  };

  const handleBatchStart = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning(true);
    for (let i = 0; i < batchQueue.length; i++) {
      if (cancelledRef.current) break;  // 취소 요청 시 배치 중단
      const item = batchQueue[i];
      if (item.status !== 'pending') continue;
      setBatchQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'running' } : q));
      try {
        await handleGenerate(null as any, item.topic);
        setBatchQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'done' } : q));
      } catch {
        setBatchQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error', errorMsg: '생성 실패' } : q));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsBatchRunning(false);
  };

  const handleAnimateHook = async () => {
    if (!plan?.hookImageUrl) return;
    setStep(GenerationStep.GENERATING_HOOK_VIDEO);
    setVideoStatus("Veo 3.1 영상 엔진 가속 중... (映像エンジン起動中)");
    setError(null);

    try {
      // data URL인 경우 직접 base64 추출 (fetch 불필요)
      let imageBase64: string;
      if (plan.hookImageUrl.startsWith('data:')) {
        imageBase64 = plan.hookImageUrl;
      } else {
        // URL인 경우 fetch → base64 변환
        const resp = await fetch(plan.hookImageUrl);
        if (!resp.ok) throw new Error(`이미지 로드 실패: ${resp.status}`);
        const blob = await resp.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const videoUrl = await generateHealingVideo(
        imageBase64,
        topic,
        (msg) => setVideoStatus(msg)
      );
      if (videoUrl) {
        setPlan(prev => prev ? ({ ...prev, hookVideoUrl: videoUrl }) : null);
      }
      setStep(GenerationStep.COMPLETED);
      setVideoStatus("");
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('VIDEO_MODEL_NOT_FOUND') || msg.includes('404')) {
        setError('🎥 Veo 모델 접근 불가: AI Studio에서 API 키를 다시 발급받거나 Veo 미리보기 승인이 필요합니다.');
      } else {
        setError('영상 생성 오류: ' + msg);
      }
      setStep(GenerationStep.COMPLETED);
    }
  };

  const handleRegenerateImage = async (index: number | 'hook', newPrompt?: string) => {
    if (!plan) return;
    setError(null);
    const targetStep = index === 'hook' ? 'HOOK' : `STORY #${index + 1}`;
    setVideoStatus(`[${targetStep}] 이미지 다시 생성 중...`);

    try {
      if (index === 'hook') {
        const finalPrompt = newPrompt || plan.hook_image_prompt;
        const url = await generateHookImage(finalPrompt, visualStyle);
        if (url) {
          setPlan(prev => prev ? ({ ...prev, hookImageUrl: url, hook_image_prompt: finalPrompt }) : null);
        }
      } else {
        const finalPrompt = newPrompt || plan.story_image_prompts[index];
        const url = await generateHealingImage(plan.mood, topic, finalPrompt, visualStyle);
        if (url) {
          const newUrls = [...(plan.storyImageUrls || [])];
          newUrls[index] = url;
          const newPrompts = [...plan.story_image_prompts];
          newPrompts[index] = finalPrompt;
          setPlan(prev => prev ? ({ ...prev, storyImageUrls: newUrls, story_image_prompts: newPrompts }) : null);
        }
      }
      setVideoStatus("");
    } catch (err: any) {
      setError(`이미지 재생성 실패: ${err.message}`);
      setVideoStatus("");
    }
  };

  const [editingIndex, setEditingIndex] = useState<{ index: number | 'hook', prompt: string } | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showThumbnailEditor, setShowThumbnailEditor] = useState(false);
  const isGenerating = step !== GenerationStep.IDLE && step !== GenerationStep.COMPLETED && step !== GenerationStep.ERROR;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A12]">
      <aside className="w-full md:w-[420px] bg-[#0D0D18] border-r border-[#2A1A1A] p-8 flex flex-col z-10 shadow-2xl shadow-black/60 overflow-y-auto custom-scrollbar">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <div className="p-2 bg-red-900 rounded-xl animate-flicker">
              <Sparkles className="w-6 h-6 text-red-300" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">ミステリーファクトリー</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-950 text-red-300 text-[9px] font-black rounded uppercase tracking-widest border border-red-900">Mystery Factory Pro</span>
            <p className="text-[#6B4A4A] text-[10px] font-bold uppercase tracking-widest">V3.8 JP Mystery Lab</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8 flex-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. Content Niche (페르소나)</label>
              <Info size={12} className="text-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPersona(p.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedPersona === p.id ? `border-red-700 shadow-lg shadow-red-950 ${p.color}` : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#3A1A1A]'
                    }`}
                  title={p.description}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#1A1A2A] rounded-lg">
                      {p.id === 'urban_legend' ? <Ghost size={16} /> : p.id === 'true_story' ? <Eye size={16} /> : p.id === 'human_horror' ? <Skull size={16} /> : <AlertTriangle size={16} />}
                    </div>
                  </div>
                  <p className="text-xs font-black mb-1">{p.name}</p>
                  <p className="text-[10px] text-red-400 font-bold mb-1">[{p.name_kr}]</p>
                  <p className="text-[9px] opacity-60 font-medium leading-tight">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">2. JP Mystery Presets (일본 괴담 특화)</label>
              <button
                type="button"
                onClick={handleRefreshPresets}
                disabled={isGenerating || isPresetRefreshing}
                title={`새로운 괴담 8개 보기 (총 ${ALL_MYSTERY_PRESETS.length}개 풀)`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-[10px] font-black transition-all ${isPresetRefreshing
                  ? 'border-red-900 bg-red-950/30 text-red-900 cursor-wait'
                  : 'border-red-700 bg-red-950/40 text-red-400 hover:bg-red-800 hover:text-white hover:border-red-700 active:scale-95'
                  }`}
              >
                <RefreshCw size={11} className={isPresetRefreshing ? 'animate-spin' : ''} />
                새로고침
              </button>
            </div>
            <div className={`grid grid-cols-2 gap-2 transition-opacity duration-300 ${isPresetRefreshing ? 'opacity-30' : 'opacity-100'}`}>
              {visiblePresets.map((p, i) => (
                <button
                  key={`${presetIndices[i]}-${i}`}
                  type="button"
                  onClick={() => { setTopic(p.query); setSelectedPersona('urban_legend'); }}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-[#12121E] border border-[#2A1A1A] rounded-xl text-xs font-bold text-[#C0B0A0] hover:border-red-700 hover:shadow-md hover:shadow-red-950 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-red-500" />
                      <span>{p.title}</span>
                    </div>
                    <span className="text-[10px] text-[#6B5A5A] ml-5">{p.title_kr}</span>
                  </div>
                  <Sparkles size={12} className="text-indigo-300 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>


          {/* ===== 언어 선택 옵션 ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
              3. Language (자막 · 나레이션 언어)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContentLanguage('ja')}
                disabled={isGenerating}
                className={`relative flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${contentLanguage === 'ja'
                  ? 'border-red-700 bg-red-950/40 shadow-md shadow-red-950'
                  : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#3A1A1A]'
                  }`}
              >
                <span className="text-2xl">🇯🇵</span>
                <div className="text-center">
                  <p className="text-xs font-black text-[#E8DDD0]">日本語</p>
                  <p className="text-[9px] text-[#6B5A5A] font-bold">일본어 (기본값)</p>
                </div>
                {contentLanguage === 'ja' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setContentLanguage('ko')}
                disabled={isGenerating}
                className={`relative flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${contentLanguage === 'ko'
                  ? 'border-blue-700 bg-blue-950/40 shadow-md shadow-blue-950'
                  : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#1A2A3A]'
                  }`}
              >
                <span className="text-2xl">🇰🇷</span>
                <div className="text-center">
                  <p className="text-xs font-black text-[#E8DDD0]">한국어</p>
                  <p className="text-[9px] text-[#6B5A5A] font-bold">Korean</p>
                </div>
                {contentLanguage === 'ko' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-[#6B5A5A] font-bold mt-2">
              {contentLanguage === 'ja'
                ? '📌 자막 · 나레이션이 일본어로 생성됩니다'
                : '📌 자막 · 나레이션이 한국어로 생성됩니다'}
            </p>
          </div>

          {/* ===== 4. 이미지 스타일 뱅크 ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
              4. Image Style Bank (비주얼 스타일)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'cinematic_real',  emoji: '🎥', label: 'Cinematic Real',  desc: '실사 시네마틱', tag: '기본' },
                { id: 'j_horror_classic',emoji: '👁', label: 'J-Horror Classic', desc: '링/주온 스타일', tag: '🔥추천' },
                { id: 'manga_noir',      emoji: '🖤', label: 'Manga Noir',       desc: '흑백 망가 느낌', tag: '' },
                { id: 'vintage_film',    emoji: '📽', label: 'Vintage Film',     desc: '8mm 필름 질감', tag: '' },
                { id: 'cctv_cam',        emoji: '📹', label: 'CCTV Cam',         desc: '감시카메라 시점', tag: '⚡인기' },
                { id: 'ukiyo_e_horror',  emoji: '🏮', label: 'Ukiyo-e Horror',   desc: '에도 목판화', tag: '' },
              ] as { id: string; emoji: string; label: string; desc: string; tag: string }[]).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setVisualStyle(s.id as any)}
                  disabled={isGenerating}
                  className={`relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    visualStyle === s.id
                      ? 'border-amber-600 bg-amber-950/40 shadow-md shadow-amber-950'
                      : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#3A2A1A]'
                  }`}
                >
                  {s.tag && (
                    <span className="absolute top-1.5 right-1.5 text-[7px] font-black bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded-full">{s.tag}</span>
                  )}
                  <span className="text-base">{s.emoji}</span>
                  <span className={`text-[10px] font-black ${visualStyle === s.id ? 'text-amber-300' : 'text-[#C0B0A0]'}`}>{s.label}</span>
                  <span className="text-[8px] text-[#6B5A5A] font-medium">{s.desc}</span>
                  {visualStyle === s.id && (
                    <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">5. Master Topic (주제 입력)</label>
              <button
                type="button"
                onClick={async () => {
                  if (!history.length) return;
                  try {
                    const successTopics = history.slice(0, 10).map(h => h.topic);
                    const suggestions = await generateTopicSuggestions(successTopics, 6);
                    setAiSuggestions(suggestions);
                  } catch {}
                }}
                disabled={isGenerating || !history.length}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 rounded-xl text-[10px] font-black border border-indigo-800 transition-all disabled:opacity-40"
                title={!history.length ? "먼저 영상을 1편 생성해야 추천 가능" : "AI 주제 추천 (히트 패턴 분석)"}
              >
                <Sparkles size={11} />
                AI 추천
              </button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="mb-3 p-3 bg-indigo-950/40 border border-indigo-800 rounded-2xl space-y-1.5">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">💡 AI 분석 추천 주제 (클릭해서 선택)</p>
                {aiSuggestions.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => { setTopic(s); setAiSuggestions([]); }}
                    className="w-full text-left px-3 py-2 bg-[#12121E] hover:bg-indigo-950 border border-[#1E1E2C] hover:border-indigo-700 rounded-xl text-xs font-bold text-[#E8DDD0] transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <textarea
              rows={3}
              className="w-full rounded-2xl border-2 border-[#1E1E2C] bg-[#0F0F1A] text-[#E8DDD0] placeholder-[#4A3A3A] focus:border-red-700 focus:bg-[#12121E] transition-all text-sm font-bold p-4 resize-none"
              placeholder="쇼츠의 핵심 주제를 자유롭게 입력하세요 (한글/일어 가능)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />

            {/* 인기 소재 TOP5 힌트 패널 */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowTrending(!showTrending)}
                className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Flame size={10} />
                지금 일본에서 뜨는 소재 TOP 5
                {showTrending ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {showTrending && (
                <div className="mt-2 p-3 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-1">
                  {[
                    { rank: '1위', label: '특정 장소 실화 괴담', query: '東京の特定の場所に伝わる実話怪談、目撃者が初めて語る禁断の真相' },
                    { rank: '2위', label: '실종 사건 미해결 미스터리', query: '未解決の失踪事件の真相、生存者が初めて語った衝撃の証言' },
                    { rank: '3위', label: '심야 CCTV·편의점 괴담', query: '深夜コンビニのCCTVに映り込んだ正体不明の存在、店員だけに見えるもの' },
                    { rank: '4위', label: '사후 SNS 활동 괴담', query: '死亡した人物のSNSから届き続けるメッセージ、その送信者の正体とは' },
                    { rank: '5위', label: '학교 불가사의 시리즈', query: '某中学校の七不思議、誰も知らない8番目の不思議の真相が今明かされる' },
                  ].map((item) => (
                    <button
                      key={item.rank}
                      type="button"
                      onClick={() => { setTopic(item.query); setShowTrending(false); setSelectedPersona('urban_legend'); }}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-amber-900/30 transition-all group"
                    >
                      <span className="text-[9px] font-black text-amber-500 w-6 shrink-0">{item.rank}</span>
                      <span className="text-[9px] font-bold text-[#C0B0A0] group-hover:text-[#E8DDD0] transition-colors">{item.label}</span>
                    </button>
                  ))}
                  <p className="text-[8px] text-[#4A3A3A] font-bold pt-1">👆 클릭하면 주제 자동 입력됩니다</p>
                </div>
              )}
            </div>
          </div>


          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">5. Viral Hook FX (영상 효과)</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: 'night_vision', label: '암시(暗視)', label_kr: '나이트비전', icon: Eye, color: 'text-emerald-500' },
                { id: 'tracking', label: '追跡', label_kr: '트래킹', icon: Move, color: 'text-indigo-500' },
                { id: 'film_jitter', label: '振動', label_kr: '지터 효과', icon: Zap, color: 'text-amber-500' },
              ].map((fx) => (
                <button
                  key={fx.id}
                  type="button"
                  onClick={() => {
                    const next = selectedEffects.includes(fx.id as MysteryEffect)
                      ? selectedEffects.filter(e => e !== fx.id)
                      : [...selectedEffects, fx.id];
                    setSelectedEffects(next as MysteryEffect[]);
                  }}
                  disabled={isGenerating}
                  className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedEffects.includes(fx.id as MysteryEffect) ? 'border-red-700 bg-red-950/40 shadow-md shadow-red-950' : 'border-[#1E1E2C] bg-[#12121E]'}`}
                  title={fx.label_kr}
                >
                  <fx.icon size={16} className={selectedEffects.includes(fx.id as MysteryEffect) ? fx.color : 'text-[#4A4A5A]'} />
                  <span className="text-[9px] font-black">{fx.label}</span>
                  <span className="text-[8px] opacity-50 font-bold">{fx.label_kr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ===== UPDATE 1: 특수 음향 효과 (SFX) ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">6. Horror SFX (공포 음향 효과)</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([
                { id: 'horror_noise', label: '🔴 恐怖ノイズ', label_kr: '공포 노이즈' },
                { id: 'heartbeat', label: '💜 心臓の鼓動', label_kr: '심장 박동' },
                { id: 'transition_whoosh', label: '💨 切替効果', label_kr: '장면전환 음' },
                { id: 'deep_rumble', label: '🌑 低音振動', label_kr: '저음 진동' },
                { id: 'static_burst', label: '⚡ 静電気', label_kr: '정전기 버스트' },
              ] as { id: SfxType, label: string, label_kr: string }[]).map((sfx) => (
                <button
                  key={sfx.id}
                  type="button"
                  onClick={() => {
                    // 선택 / 해제 토글
                    const next = selectedSfx.includes(sfx.id)
                      ? selectedSfx.filter(s => s !== sfx.id)
                      : [...selectedSfx, sfx.id];
                    setSelectedSfx(next);
                    // 미리듣기 재생
                    setPlayingSfx(sfx.id);
                    playSfxPreview(sfx.id).then(() => {
                      // 재생 완료 후 아이콘 복원
                    });
                    // SFX 최대 지속시간(3초) 후 아이콘 복원
                    setTimeout(() => setPlayingSfx(prev => prev === sfx.id ? null : prev), 3200);
                  }}
                  disabled={isGenerating}
                  className={`relative py-2 px-3 rounded-xl border-2 flex flex-col items-start gap-0.5 transition-all text-left group overflow-hidden ${selectedSfx.includes(sfx.id)
                    ? 'border-red-700 bg-red-950/40 shadow-md shadow-red-950'
                    : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#3A1A1A]'
                    }`}
                >
                  {/* 재생 중 웨이브 애니메이션 배경 */}
                  {playingSfx === sfx.id && (
                    <span className="absolute inset-0 bg-red-500/10 animate-pulse rounded-xl pointer-events-none" />
                  )}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black">{sfx.label}</span>
                    {/* 미리듣기 아이콘 */}
                    <span
                      className={`ml-1 shrink-0 transition-all ${playingSfx === sfx.id ? 'text-red-500' : 'text-slate-300 group-hover:text-slate-500'
                        }`}
                    >
                      {playingSfx === sfx.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Play size={10} className="fill-current" />}
                    </span>
                  </div>
                  <span className="text-[9px] opacity-60 font-medium">{sfx.label_kr}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Volume2 size={10} className="text-slate-400" />
              <p className="text-[9px] text-slate-400 font-bold">클릭하면 미리듣기 + 선택이 동시에 됩니다 ▶</p>
            </div>
          </div>

          {/* ===== UPDATE 3: 훅 문구 커스터마이징 ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">7. Hook Title Text (훅 타이틀 문구)</label>
            <div className="flex items-center gap-3 p-3 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-2xl focus-within:border-red-700 transition-all">
              <div className="p-2 bg-red-950 rounded-xl">
                <Skull size={16} className="text-red-400" />
              </div>
              <input
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                disabled={isGenerating}
                className="flex-1 bg-transparent text-sm font-black text-[#E8DDD0] outline-none"
                placeholder="都市伝説"
                maxLength={6}
              />
              <span className="text-[9px] text-[#6B5A5A] font-bold shrink-0">최대 6자</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-1">📌 훅 영상 좌측에 세로로 표시되는 타이틀 문구</p>
          </div>

          {/* ===== 9. TTS 나레이션 보이스 선택 ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
              <span className="flex items-center gap-2"><Mic size={12} /> 9. Narration Voice (나레이션 보이스)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'Charon',  label: 'Charon',  desc: '깊고 묵직한 남성', tag: '👹 추천' },
                { id: 'Fenrir',  label: 'Fenrir',  desc: '어둡고 낮은 남성', tag: '🌑 공포' },
                { id: 'Kore',    label: 'Kore',    desc: '냉정한 여성',       tag: '👁 미스터리' },
                { id: 'Aoede',   label: 'Aoede',   desc: '부드러운 여성',     tag: '🌙 분위기' },
                { id: 'Puck',    label: 'Puck',    desc: '중성적 내레이터',   tag: '' },
                { id: 'Orbit',   label: 'Orbit',   desc: '또렷한 내레이터',   tag: '' },
              ] as { id: string; label: string; desc: string; tag: string }[]).map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setTtsVoice(v.id)}
                  disabled={isGenerating}
                  className={`relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    ttsVoice === v.id
                      ? 'border-red-700 bg-red-950/50 shadow-md shadow-red-950'
                      : 'border-[#1E1E2C] bg-[#12121E] hover:border-[#3A1A1A]'
                  }`}
                >
                  {v.tag && (
                    <span className="absolute top-1.5 right-1.5 text-[7px] font-black bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full">{v.tag}</span>
                  )}
                  <span className={`text-xs font-black ${ ttsVoice === v.id ? 'text-red-300' : 'text-[#C0B0A0]'}`}>{v.label}</span>
                  <span className="text-[9px] text-[#6B5A5A] font-medium">{v.desc}</span>
                  {ttsVoice === v.id && (
                    <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#6B5A5A] font-bold mt-2">📌 Charon / Fenrir — 공포 나레이션 최적화 보이스</p>
          </div>

          {/* ===== 10. BGM 자동 선택 ===== */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
              10. Background Music (BGM 자동 선택)
            </label>

            {/* 현재 선택된 BGM 표시 */}
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 mb-3 transition-all ${
              userBgm ? 'bg-[#0A1210] border-emerald-700' : 'bg-[#12121E] border-[#1E1E2C]'
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${ userBgm ? 'bg-emerald-950' : 'bg-[#1A1228]'}`}>
                <Volume2 size={18} className={userBgm ? 'text-emerald-500' : 'text-[#6B4A8A]'} />
              </div>
              <div className="flex-1 min-w-0">
                {userBgm ? (
                  <>
                    <p className="text-xs font-black text-emerald-400 truncate">{userBgm.name}</p>
                    <p className="text-[9px] text-emerald-700 font-bold">✅ BGM 준비완료 ({(userBgm.size / 1024 / 1024).toFixed(1)} MB)</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-black text-[#8B6A8A]">BGM 미선택</p>
                    <p className="text-[9px] text-[#4A3A4A] font-bold">아래 버튼으로 자동 선택하세요</p>
                  </>
                )}
              </div>
              {userBgm && (
                <button onClick={() => { setUserBgm(null); setSelectedBgmTrack(null); }}
                  className="shrink-0 p-1.5 bg-red-950/40 hover:bg-red-950 rounded-lg border border-red-900/30 transition-all">
                  <X size={12} className="text-red-500" />
                </button>
              )}
            </div>

            {/* 자동 선택 버튼들 */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                disabled={isBgmLoading || isGenerating}
                onClick={async () => {
                  setIsBgmLoading(true);
                  try {
                    const track = pickRandomBgm(selectedBgmTrack?.id);
                    setSelectedBgmTrack(track);
                    const file = await fetchBgmAsFile(track);
                    setUserBgm(file);
                  } catch (e) {
                    console.error('BGM 로드 실패:', e);
                  } finally {
                    setIsBgmLoading(false);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all border-2 ${
                  isBgmLoading
                    ? 'border-[#2A1A3A] bg-[#12121E] text-[#4A3A5A]'
                    : 'border-purple-800 bg-purple-950/50 text-purple-300 hover:bg-purple-900/50 hover:border-purple-600'
                }`}
              >
                {isBgmLoading
                  ? <><Loader2 size={13} className="animate-spin" /> 로딩 중...</>
                  : <><RefreshCw size={13} /> 🎲 랜덤 자동 선택</>}
              </button>

              {/* 직접 업로드 */}
              <label className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-black text-[10px] border-2 border-[#2A2A3A] bg-[#12121E] text-[#7070A0] hover:border-amber-700 hover:text-amber-500 cursor-pointer transition-all">
                <Plus size={12} /> 직접
                <input type="file" className="hidden" accept="audio/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setUserBgm(f); setSelectedBgmTrack(null); }
                  }}
                />
              </label>
            </div>

            {/* BGM 라이브러리 목록 (접기/펼치기) */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-[#5A4A6A] hover:text-[#8A7AAA] transition-colors list-none select-none">
                <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                라이브러리 목록 보기 ({BGM_LIBRARY.length}곡)
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {BGM_LIBRARY.map(track => (
                  <button
                    key={track.id}
                    type="button"
                    disabled={isBgmLoading || isGenerating}
                    onClick={async () => {
                      setIsBgmLoading(true);
                      try {
                        setSelectedBgmTrack(track);
                        const file = await fetchBgmAsFile(track);
                        setUserBgm(file);
                      } catch {}
                      setIsBgmLoading(false);
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      selectedBgmTrack?.id === track.id && userBgm
                        ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400'
                        : 'border-[#1E1E2C] bg-[#0E0E1A] text-[#6B5A7A] hover:border-purple-800 hover:text-purple-400'
                    }`}
                  >
                    <span className="text-[8px]">♪</span>
                    <span className="truncate">{track.label}</span>
                    {selectedBgmTrack?.id === track.id && userBgm && (
                      <span className="ml-auto text-[8px] font-black text-emerald-500">▶ 선택됨</span>
                    )}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* ① 생성 버튼 + 취소 버튼 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isGenerating || !topic}
              className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl shadow-red-950/50 active:scale-[0.98] btn-mystery ${isGenerating ? 'bg-[#1A1A28] text-[#4A4A5A] shadow-none' : 'bg-red-800 text-white hover:bg-red-700'}`}
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Wand2 className="w-6 h-6" /><span>AI GENERATE</span></>}
            </button>
            {isGenerating && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-5 py-5 rounded-2xl bg-red-950 border-2 border-red-800 text-red-400 hover:bg-red-900 transition-all font-black flex items-center gap-2 text-sm"
                title="생성 취소"
              >
                <StopCircle size={18} />
                {isCancelling ? '취소중...' : '취소'}
              </button>
            )}
          </div>

          {/* ② 생성 이력 패널 */}
          <div className="border-t border-[#2A1A1A] pt-6">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2"><History size={13} /> 생성 이력 ({history.length})</div>
              {showHistory ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
            {showHistory && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {history.length === 0 && <p className="text-[10px] text-slate-600 font-bold text-center py-4">아직 이력이 없습니다</p>}
                {history.map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 bg-[#12121E] border border-[#2A1A1A] rounded-xl">
                    <button onClick={() => loadFromHistory(h)} className="flex-1 text-left">
                      <p className="text-[10px] font-black text-[#E8DDD0] truncate">{h.topic.slice(0, 30)}...</p>
                      <p className="text-[9px] text-slate-600 font-bold">{h.createdAt}</p>
                    </button>
                    <button onClick={() => deleteHistory(h.id)} className="p-1 text-slate-700 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== 시리즈 3부작 기획 패널 ===== */}
          <div className="border-t border-[#2A1A1A] pt-6">
            <button
              type="button"
              onClick={() => setShowSeries(!showSeries)}
              className="flex items-center justify-between w-full text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-400 transition-colors"
            >
              <div className="flex items-center gap-2"><Sparkles size={13} /> 시리즈 3부작 자동 기획</div>
              {showSeries ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
            {showSeries && (
              <div className="mt-3 space-y-3">
                <p className="text-[9px] text-[#6B5A5A] font-bold">현재 주제를 기반으로 전·중·후편 시리즈를 AI가 자동 설계합니다</p>
                <button
                  type="button"
                  disabled={!topic || isSeriesLoading || isGenerating}
                  onClick={async () => {
                    setIsSeriesLoading(true);
                    try {
                      const eps = await generateSeriesPlan(topic, selectedPersona);
                      setSeriesEpisodes(eps);
                    } catch (e) { console.error(e); }
                    setIsSeriesLoading(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-amber-800 bg-amber-950/40 text-amber-300 text-xs font-black hover:border-amber-600 transition-all disabled:opacity-40"
                >
                  {isSeriesLoading ? <><Loader2 size={13} className="animate-spin" /> 기획 중...</> : <><Zap size={13}/> 3부작 시리즈 기획 생성</>}
                </button>
                {seriesEpisodes.length > 0 && (
                  <div className="space-y-2">
                    {seriesEpisodes.map(ep => (
                      <div key={ep.episode} className="p-3 rounded-xl border border-amber-900/40 bg-amber-950/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-800 text-amber-200">{ep.episode === 1 ? '前編' : ep.episode === 2 ? '中編' : '後編'}</span>
                          <span className="text-[10px] font-black text-amber-300 truncate">{ep.title_ja}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium line-clamp-2">{ep.script_outline_ja}</p>
                        <p className="text-[9px] text-red-400 font-bold mt-1">↪ {ep.cliffhanger_ja}</p>
                        <button
                          type="button"
                          onClick={() => setTopic(ep.title_ja)}
                          className="mt-1.5 text-[8px] font-black text-amber-600 hover:text-amber-400 transition-colors"
                        >이 에피소드로 생성 →</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ③ 배치 생성 패널 */}
          <div className="border-t border-[#2A1A1A] pt-6">
            <button
              type="button"
              onClick={() => setShowBatch(!showBatch)}
              className="flex items-center justify-between w-full text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2"><ListPlus size={13} /> 배치 생성 (대량 자동화)</div>
              {showBatch ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
            {showBatch && (
              <div className="mt-3 space-y-3">
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-[#2A1A1A] bg-[#0F0F1A] text-[#E8DDD0] text-xs font-bold p-3 resize-none placeholder-[#4A3A3A] focus:border-red-700 outline-none"
                  placeholder={`주제 여러 개 입력 (줄바꾸기로 구분):\n\u5c71の決し掃い\n\u6df1夜のコンビニ\n으싅 소리...`}
                  value={batchInput}
                  onChange={e => setBatchInput(e.target.value)}
                  disabled={isBatchRunning}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleBatchAdd} disabled={!batchInput.trim() || isBatchRunning}
                    className="flex-1 py-2 rounded-xl bg-[#1E1E2C] text-[#C0B0A0] text-xs font-black hover:bg-[#2A2A3A] transition-all flex items-center justify-center gap-1">
                    <Plus size={12} /> 큐에 추가
                  </button>
                  <button type="button" onClick={handleBatchStart} disabled={isBatchRunning || batchQueue.filter(q => q.status === 'pending').length === 0}
                    className="flex-1 py-2 rounded-xl bg-red-800 text-white text-xs font-black hover:bg-red-700 transition-all flex items-center justify-center gap-1">
                    {isBatchRunning ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    {isBatchRunning ? '실행중...' : '배치 시작'}
                  </button>
                </div>
                {batchQueue.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {batchQueue.map((q, i) => (
                      <div key={q.id} className="flex items-center gap-2 text-[10px] font-bold">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${ q.status==='pending'?'bg-slate-600': q.status==='running'?'bg-amber-400 animate-pulse': q.status==='done'?'bg-emerald-500':'bg-red-500'}`}/>
                        <span className="text-[#C0B0A0] truncate flex-1">{q.topic.slice(0,20)}</span>
                        <span className={`shrink-0 ${ q.status==='done'?'text-emerald-500': q.status==='error'?'text-red-500': q.status==='running'?'text-amber-400':'text-slate-600'}`}>
                          {q.status==='pending'?'대기':q.status==='running'?'실행중':q.status==='done'?'완료':'실패'}
                        </span>
                        {q.status !== 'running' && (
                          <button onClick={() => setBatchQueue(prev => prev.filter((_,idx)=>idx!==i))} className="text-slate-700 hover:text-red-500">
                            <X size={10}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-12">
          {/* Status Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <LayoutDashboard className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#E8DDD0] tracking-tight">Production Center</h1>
                <p className="text-xs font-bold text-[#6B5A5A] uppercase tracking-widest">Current Step: <span className="text-red-500">{step}</span></p>
              </div>
            </div>
            {!hasVideoKey && (
              <button onClick={() => window.aistudio?.openSelectKey()} className="flex items-center gap-2 px-4 py-2 bg-amber-950 border border-amber-800 text-amber-400 rounded-xl text-xs font-black animate-pulse shadow-sm">
                <Key size={14} /> Veo Activation 필수
              </button>
            )}
          </div>

          {isGenerating && step === GenerationStep.GENERATING_IMAGE && (
            <div className="mb-10 bg-red-900 p-6 rounded-3xl shadow-xl flex items-center justify-between text-white overflow-hidden relative border border-red-800">
              <div className="relative z-10 flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <ImageIcon className="animate-pulse" size={28} />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">Nano Banana Pro Render Active</p>
                  <p className="text-sm font-bold opacity-70">2K 고화질 프레임 생성 중: {imgProgress.current} / {imgProgress.total}</p>
                </div>
              </div>
              <div className="flex gap-1.5 relative z-10">
                {Array.from({ length: imgProgress.total }).map((_, i) => (
                  <div key={i} className={`h-2 w-6 rounded-full transition-all duration-500 ${i < imgProgress.current ? 'bg-white' : 'bg-white/20'}`} />
                ))}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
            </div>
          )}

          {videoStatus && (
            <div className="mb-10 p-6 bg-slate-900 rounded-3xl text-white flex items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <Loader2 className="animate-spin" size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Veo 3.1 AI Rendering</p>
                <p className="text-base font-bold">{videoStatus}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-10 p-6 bg-red-950/60 border-2 border-red-900 rounded-3xl text-red-400 flex items-start gap-4 shadow-lg">
              <AlertTriangle className="shrink-0 mt-1" size={24} />
              <div>
                <p className="font-black text-lg mb-1">System Alert</p>
                <p className="text-sm font-bold opacity-80">{error}</p>
                <button onClick={() => window.aistudio?.openSelectKey()} className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-md">
                  RETRY WITH PRO KEY
                </button>
              </div>
            </div>
          )}

          {plan ? (
            <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                <div className="flex p-1.5 bg-[#12121E] border border-[#1E1E2C] rounded-2xl w-fit shadow-sm">
                  <button onClick={() => setActiveTab('preview')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-red-800 text-white shadow-lg shadow-red-950' : 'text-[#6B5A5A] hover:text-[#9B8A7A]'}`}>
                    <LayoutDashboard size={18} /> DASHBOARD
                  </button>
                  <button onClick={() => setActiveTab('code')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-red-800 text-white shadow-lg shadow-red-950' : 'text-[#6B5A5A] hover:text-[#9B8A7A]'}`}>
                    <Terminal size={18} /> EXPORT ENGINE
                  </button>
                  <button onClick={() => setActiveTab('calendar')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-indigo-800 text-white shadow-lg shadow-indigo-950' : 'text-[#6B5A5A] hover:text-[#9B8A7A]'}`}>
                    <Calendar size={18} /> SCHEDULE
                  </button>
                </div>

                {activeTab === 'calendar' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-[#E8DDD0] mb-2 flex items-center gap-3">
                        <Calendar size={22} className="text-indigo-400" /> Upload Schedule
                      </h3>
                      <p className="text-[11px] text-[#6B5A5A] font-bold mb-6">수/목 21:00 JST — 알고리즘 최강 슬롯. 날짜를 클릭해 업로드 적합도를 확인하세요.</p>
                      <ContentCalendar
                        scheduledVideos={[]}
                        onSchedule={(date, time) => {
                          alert(`✅ ${date} ${time} JST 업로드 예약\n이 기능은 YouTube Data API 연동 후 자동 예약이 가능합니다.`);
                        }}
                      />
                    </div>
                  </div>
                ) : activeTab === 'preview' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScriptCard
                      plan={plan}
                      personaType={selectedPersona}
                      language={contentLanguage}
                      topic={topic}
                      onScriptChange={(ja, kr) => setPlan(prev => prev ? { ...prev, script_ja: ja, script_kr: kr } : null)}
                    />
                    <div className="mt-10 bg-[#0E0E1A] border border-[#1E1E2C] rounded-[2.5rem] p-10 shadow-lg">
                      <h3 className="text-xl font-black text-[#E8DDD0] mb-8 flex items-center gap-3">
                        <Grid size={24} className="text-red-500" />
                        Storyboard Sequence
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.hookImageUrl && (
                          <div className="space-y-3">
                            <div className="aspect-[9/16] rounded-3xl bg-[#1A1A28] overflow-hidden relative group border-4 border-red-800 shadow-xl shadow-red-950/50">
                              <img src={plan.hookImageUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setEditingIndex({ index: 'hook', prompt: plan.hook_image_prompt })}
                                  className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                                  title="프롬프트 수정"
                                >
                                  <Sparkles size={20} />
                                </button>
                                <button
                                  onClick={() => handleRegenerateImage('hook')}
                                  className="p-3 bg-indigo-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                  title="즉시 다시 생성"
                                >
                                  <Zap size={20} />
                                </button>
                                <button
                                  onClick={() => setShowThumbnailEditor(true)}
                                  className="p-3 bg-purple-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                  title="✏️ 썸네일 텍스트 에디터"
                                >
                                  <Type size={20} />
                                </button>
                                <button
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = plan.hookImageUrl!;
                                    a.download = `hook_image_${Date.now()}.png`;
                                    a.click();
                                  }}
                                  className="p-3 bg-emerald-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                  title="훅 이미지 다운로드"
                                >
                                  <ImageIcon size={20} />
                                </button>
                              </div>
                              <div className="absolute top-4 left-4 bg-red-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Master Hook</div>
                            </div>
                            <div className="bg-[#12121E] p-3 rounded-2xl border border-[#1E1E2C] space-y-2">
                              <p className="text-[10px] text-[#6B5A5A] font-bold uppercase tracking-tighter line-clamp-2" title={plan.hook_image_prompt}>
                                {plan.hook_image_prompt}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-black text-red-500">HOOK IMAGE READY</span>
                              </div>
                              {/* Kling AI 바로가기 */}
                              <a
                                href="https://kling.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-800 rounded-xl text-[9px] font-black text-purple-400 transition-all"
                              >
                                <Zap size={9} /> Kling AI로 훅 영상 제작 (무료)
                              </a>
                              {/* 외부 훅 영상 업로드 */}
                              <label className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-[9px] font-black cursor-pointer transition-all border ${
                                userHookVideo
                                  ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                                  : 'bg-[#1A1A28] border-[#2A2A3A] hover:border-emerald-700 text-[#6B5A5A]'
                              }`}>
                                <Play size={9} />
                                {userHookVideo ? `✅ ${userHookVideo.name.slice(0, 18)}...` : '외부 훅 영상 업로드 (.mp4)'}
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={e => setUserHookVideo(e.target.files?.[0] || null)}
                                />
                              </label>
                              {userHookVideo && (
                                <button
                                  onClick={() => setUserHookVideo(null)}
                                  className="w-full text-[8px] text-[#6B5A5A] hover:text-red-400 font-bold transition-colors"
                                >
                                  ✕ 업로드 취소 (AI 생성 사용)
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      {plan.storyImageUrls?.map((url, i) => (
                        <div
                          key={i}
                          className={`space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-grab active:cursor-grabbing ${ dragIndex === i ? 'opacity-40 scale-95' : 'opacity-100'} transition-all`}
                          style={{ animationDelay: `${i * 50}ms` }}
                          draggable
                          onDragStart={e => handleImageDragStart(e, i)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleImageDrop(e, i)}
                        >
                            <div className="aspect-[9/16] rounded-3xl bg-[#1A1A28] overflow-hidden relative group border-2 border-[#1E1E2C] hover:border-red-700 transition-all shadow-md">
                              <img src={url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setEditingIndex({ index: i, prompt: plan.story_image_prompts[i] })}
                                  className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                                  title="프롬프트 수정"
                                >
                                  <Sparkles size={20} />
                                </button>
                                <button
                                  onClick={() => handleRegenerateImage(i)}
                                  className="p-3 bg-indigo-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                  title="즉시 재생성"
                                >
                                  <Zap size={20} />
                                </button>
                                <button
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `story_${i + 1}_${Date.now()}.png`;
                                    a.click();
                                  }}
                                  className="p-3 bg-emerald-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                  title={`스토리 ${i + 1} 다운로드`}
                                >
                                  <ImageIcon size={20} />
                                </button>
                              </div>
                              <div className="absolute top-4 right-4 bg-black/70 text-white text-[10px] px-3 py-1 rounded-full font-black backdrop-blur-md border border-white/20">SCENE #{i + 1}</div>
                            </div>
                            <div className="bg-[#12121E] p-3 rounded-2xl border border-[#1E1E2C]">
                              <p className="text-[10px] text-[#6B5A5A] font-bold mb-1 uppercase tracking-tighter line-clamp-2" title={plan.story_image_prompts[i]}>
                                {plan.story_image_prompts[i]}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#3A2A2A] rounded-full"></span>
                                <span className="text-[9px] font-black text-[#6B5A5A]">2K CINEMATIC VER.</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PythonExport plan={plan} userBgm={userBgm} onAnimateHook={handleAnimateHook} isAnimatingHook={step === GenerationStep.GENERATING_HOOK_VIDEO} language={contentLanguage} bgmVolume={bgmVolume} onBgmVolumeChange={setBgmVolume} userHookVideo={userHookVideo} />
                  </div>
                )}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-12">
                  <VideoPreview
                    plan={plan}
                    userBgm={userBgm}
                    onBgmSelect={setUserBgm}
                    language={contentLanguage}
                    bgmVolume={bgmVolume}
                  />
                </div>
              </div>
            </div>

            {/* ── YouTube 업로드 버튼 (전체 너비) ── */}
            <div className="mt-8 p-6 bg-[#0D0D18] border border-[#2A1A1A] rounded-3xl flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-950 border border-red-900 rounded-2xl">
                  <Youtube size={22} className="text-red-400" />
                </div>
                <div>
                  <p className="text-[#E8DDD0] font-black text-base">🎬 YouTube에 게시하기</p>
                  <p className="text-[#6B5A5A] text-xs font-bold mt-0.5">render.py로 생성된 영상을 예약 또는 즉시 업로드</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-red-800 hover:bg-red-700 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-red-950/50 active:scale-[0.97]"
              >
                <Youtube size={20} /> YouTube 업로드
              </button>
            </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-[#12121E] rounded-3xl shadow-2xl flex items-center justify-center mb-8 border border-[#2A1A1A] animate-ghost-float animate-red-glow">
                <Ghost size={40} className="text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-[#E8DDD0] mb-4 tracking-tight animate-flicker">Pro Studio Ready</h2>
              <p className="text-[#6B5A5A] font-bold max-w-md leading-relaxed">
                왼쪽 패널에서 페르소나와 주제를 선택하세요.<br />
                일본 시장에 최적화된 기획과 2K 고화질 영상을 자동 생성합니다.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── YouTube 업로드 모달 ── */}
      {showUploadModal && plan && (
        <YoutubeUploadModal
          plan={plan}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* ── 썸네일 텍스트 에디터 모달 ── */}
      {showThumbnailEditor && plan?.hookImageUrl && (
        <ThumbnailEditor
          hookImageUrl={plan.hookImageUrl}
          titleJa={plan.title_ja}
          onClose={() => setShowThumbnailEditor(false)}
        />
      )}

      {/* Prompt Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0E0E1A] border border-[#2A1A1A] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-900 p-8 text-white border-b border-red-800">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={24} />
                <h3 className="text-xl font-black">Edit Image Prompt</h3>
              </div>
              <p className="text-indigo-100 text-sm font-bold">이미지의 구도나 피사체를 직접 수정할 수 있습니다.</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Current Target</label>
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-black text-indigo-600 w-fit">
                  {editingIndex.index === 'hook' ? 'MASTER HOOK VIDEO' : `STORY SCENE #${editingIndex.index + 1}`}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Modify Prompt (상세 설명 입력)</label>
                <textarea
                  className="w-full h-40 p-5 bg-[#0F0F1A] border-2 border-[#1E1E2C] text-[#E8DDD0] placeholder-[#4A3A3A] rounded-2xl text-sm font-bold focus:border-red-700 focus:bg-[#12121E] transition-all outline-none resize-none"
                  value={editingIndex.prompt}
                  onChange={(e) => setEditingIndex({ ...editingIndex, prompt: e.target.value })}
                  placeholder="예: 빗속에 서 있는 일본 아이, 공포스러운 눈빛, 9:16 세로형..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingIndex(null)}
                  className="flex-1 py-4 rounded-2xl bg-[#1A1A28] text-[#8B7B6B] font-black hover:bg-[#222232] transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    handleRegenerateImage(editingIndex.index, editingIndex.prompt);
                    setEditingIndex(null);
                  }}
                  className="flex-2 py-4 px-8 rounded-2xl bg-red-800 text-white font-black hover:bg-red-700 shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 size={20} />
                  REGENERATE NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




