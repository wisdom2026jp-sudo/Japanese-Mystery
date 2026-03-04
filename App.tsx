
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon, Zap, Laugh, Ghost, Moon, Rocket, AlertTriangle, Eye, Move, MapPin, Skull, Key, Grid, LayoutDashboard, Terminal, Info, RefreshCw, Languages, Volume2, Play } from 'lucide-react';
import { generateHealingPlan, generateHealingImage, generateHookImage, generateHealingAudio, generateHealingVideo } from './services/geminiService';
import { HealingPlan, GenerationStep, VisualStyle, PersonaType, Persona, MysteryEffect, SfxType, ContentLanguage } from './types';
import { ScriptCard } from './components/ScriptCard';
import { VideoPreview } from './components/VideoPreview';
import { PythonExport } from './components/PythonExport';
import { playSfxPreview } from './utils/sfxPlayer';


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
  { id: 'success', name: '成功への刺激', name_kr: '성공의 자극', icon: 'Rocket', description: '동기부여 및 성공학', color: 'bg-yellow-950 text-yellow-400 border-yellow-900', label: 'Success' },
  { id: 'mystery', name: '都市伝説の真実', name_kr: '도시전설의 진실', icon: 'Ghost', description: '호기심과 충격적 진상', color: 'bg-red-950 text-red-400 border-red-900', label: 'Mystery' },
  { id: 'dopamine', name: '爆笑スナック', name_kr: '폭소 스낵', icon: 'Laugh', description: '공감 일상 유머', color: 'bg-emerald-950 text-emerald-400 border-emerald-900', label: 'Comedy' },
  { id: 'healer', name: '真夜中の癒やし', name_kr: '한밤중의 힐링', icon: 'Moon', description: '위로와 감성 콘텐츠', color: 'bg-purple-950 text-purple-400 border-purple-900', label: 'Healing' }
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
  { title: "善哉架橋", title_kr: "선재집", query: "가오롱의 사찰에서 10년마다 한 번씩 발굴되는 미성년 소녀의 유해, DNA 검사는 항상 '0세 이하'로 판정되는 에도 현상" },
  { title: "香川県の海", title_kr: "카가와 해수욕", query: "히노타 포리에서 자릴 잡은 슬롯머신의 비밀 방, 연속으로 사라지는 업주원들과 그들이 남기는 시력한 메모" },
  { title: "山の決し掃い", title_kr: "산의 다다조지이", query: "후지시를 등산하던 등산객들이 외롭긴 잡유에 끔이는 걸 목격. 산에서는 메아리가 죽은 자를 다다론다는 일본 전설" },
  { title: "深夜のコンビニ", title_kr: "심야 편의점", query: "일본 전국 편의점 CCTV에 반복된다는 너만 바지를 입은 존재, 카메라 압력위에요 트리위엔음의시간돌 직원만에게만 보인다" },
  { title: "決して教えない部屋", title_kr: "절대 가르쳐 주지 않는 방", query: "최신 이사한 집에는 반드시 '1수 더 많은 방'이 있다는 일본 부동산 굴이. 새 세입자마다 발견하는 모르는 메모" },
  { title: "水川の面", title_kr: "물강의 얼굴", query: "시즈오카의 시보가슴 강에서 매년 발견되는 신원 미상 얼굴, 부검고에는 '3년 전에 사망'이라는 좌치를 알 수 없는 결과가 나온다" },
  { title: "呪いの山田", title_kr: "저주의 논지", query: "투표마다 짝수로 번렉치를 쓰는 확률로 유명한 경기도의 논지, 그 논지 주인의 5대째 에도 현상과 기형 범죄 담당 상관관계" },
  { title: "入れ替わりの恋人", title_kr: "입품 교대의 연인", query: "정확히 자정 솔에 교대되는 오사카 커플, 7년간 요코하마를 철도를 타도 여성이 뭇 달러 접근하는 남성'" },
  { title: "犬が返ってこない山", title_kr: "개가 돌아오지 않는 산", query: "개를 데리고 등산하면 반드시 음신 펀체 달리는 나가이와코와 타무라 산의 커다란 비밀, 돌아온 개는 두 번 다시 슬라지지 않는다" },
  { title: "印籠さまの訴え", title_kr: "인세이먹의 저주", query: "에도 시대 7인의 사무라이가 안토 평은후 하나로 남긴 저주의 편지, 네 체인에 담긴 여인을 다시 만다 때까지 누구도 죽지 않는다" },
  { title: "ブラッククリスマス", title_kr: "블랙 크리스마스", query: "크리스마스 전날 중앙도파매한 일본의 어린이에게 맨션 바꿔옵니다는 맞춤 화이트업의 필에다 안상 상자의 정체" },
  { title: "正年の饋養者", title_kr: "정원 대나 인간", query: "음력 정월 복도를 폰다 나타나는 또 다른 사람의 모습으로 눈을 마주치는 짤마 나라 'can적대리인간', 목갛으면 운이 달아나는다" },
  { title: "天井裸足", title_kr: "천장 나해발", query: "에도 시대 집터 형제에서 말성먹는 동생의 나해발을 천장에 달아 놓은 비에, 집터 분가도 회복되지 않는다는 100년 전설" },
  { title: "混じり無しの電車", title_kr: "혼잡없는 전차", query: "도스미 대진늡 시간대 즐취만 연결되는 특정 카 안에 타면 다음 역에서 반드시 안개가 끌려 시야가 0으로 때어진다" },
  { title: "学校の七不思議", title_kr: "학교의 7가지 불가사의", query: "도쿄 중학교 훈실 장 안에서 다음 수업시간에 등장하는 당당하지 않은 학가형 서보드, 여넘 7번째 불가사의는 '4번방 덧심대' 이다" },
  { title: "死後のSNS", title_kr: "사후 SNS", query: "몇 주전 사망한 자녀의 계정에서 지속적으로 주어지는 '.나 지금 대늡에 있다' 라는 DM, 헤더 끊어도 계속 스킬록 사진가 와단 다" },
  { title: "医者に臣える鬼", title_kr: "의사에게 배우는 유령", query: "교토 대학 의학부 해부학 실습 도중 시신을 한다는 다이에란 제보하자 시신도 관리자도 없어질 때의 맥스터하이 주프날 작성자의 복수" },
  { title: "消えた町の記憶", title_kr: "사라진 마을의 기억", query: "도쿄 에시로 오코미 마을에서 64세 노인이 '40년 전 이 지역에 문컨 번화하는 마을이 있었다'는 증언, 지도에도 경역에도 흔적이 없다" },
  { title: "海の底の消灯台", title_kr: "바다 속 등대수로", query: "시즈오화 도리베 마음'0' 머래통누 하며 쉽지 않은 다이버들이 발견하는 수심 20m에 불이 켜지는 역대 등대수로, 취원함은 역대 해영사'0사" },
  { title: "白い筒の乱舎", title_kr: "흰 구덩의 목책", query: "제자들에게서 특정 가라오케를 로컷대에서 세우는 빈 구덩 속에서 들려오는 측가없는 남을 목소리에 다 함구동한 신주들에서 별다간에 끝랄" },
  { title: "嫌いな窓外", title_kr: "싫은 창밖", query: "도쿄 마루노우치 선 전도 22닌 창측의 잘 보이는 특정 자리, 그 자리와 서는 쑤매 4명은 정신송르지 헸는 의학적 연구보고를봐러온 다」" },
  { title: "雨の夕の消滅孩", title_kr: "비의 저녁 실종아이", query: "에히메 현 호우 마을에서 비오는 날마다 연령대가 다른 아이들이 같은 지점에서 사라로니를, 북경오라는 마을 뜰밖에겠다는 제보 당당 교유사의 반론" },
  { title: "耐忍の無人島", title_kr: "인내의 무인도", query: "오키나와 무인도를 횡수하다 발건한 특이한 서아르는 사류들, 같이 뒤 어부는 장가 엘리트 대원에 서 다 넙대로 맨 지나갑자기 사망합니다" },
  { title: "神社の竜篝", title_kr: "신사의 용른두리", query: "훗도 신사를 찾은 리포터가 동구락 컨 나무에 열린 용두 돌리기 구멍에서 갖안온 단란한 눈에 은박하는 수백의 얼굴들을 목격" },
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
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('mystery');
  const [selectedEffects, setSelectedEffects] = useState<MysteryEffect[]>(['night_vision', 'film_jitter']);
  const [selectedSfx, setSelectedSfx] = useState<SfxType[]>(['horror_noise', 'heartbeat']);
  const [hookText, setHookText] = useState<string>('都市伝説');
  const [plan, setPlan] = useState<HealingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [imgProgress, setImgProgress] = useState({ current: 0, total: 0 });

  const [userBgm, setUserBgm] = useState<File | null>(null);
  const [hasVideoKey, setHasVideoKey] = useState(false);

  // 언어 선택 state (기본값: 일본어)
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>('ja');

  // 프리셋 새로고침 state
  const [presetIndices, setPresetIndices] = useState<number[]>(() =>
    samplePresets(ALL_MYSTERY_PRESETS, new Set())
  );
  const [usedPresetIndices, setUsedPresetIndices] = useState<Set<number>>(() => new Set<number>());
  const [isPresetRefreshing, setIsPresetRefreshing] = useState(false);

  // 현재 재생 중인 SFX
  const [playingSfx, setPlayingSfx] = useState<SfxType | null>(null);

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setStep(GenerationStep.GENERATING_SCRIPT);
    setError(null);
    setPlan(null);
    setImgProgress({ current: 0, total: 0 });

    try {
      const generatedPlan = await generateHealingPlan(topic, selectedPersona);
      generatedPlan.selectedEffects = selectedEffects;
      generatedPlan.selectedSfx = selectedSfx;
      generatedPlan.hookText = hookText;
      setPlan(generatedPlan);

      const prompts = generatedPlan.story_image_prompts || [];
      setImgProgress({ current: 0, total: prompts.length });
      setStep(GenerationStep.GENERATING_IMAGE);

      const hookUrl = await generateHookImage(generatedPlan.hook_image_prompt, visualStyle);
      const storyUrls: string[] = [];

      for (let i = 0; i < prompts.length; i++) {
        setImgProgress(prev => ({ ...prev, current: i + 1 }));
        const url = await generateHealingImage(generatedPlan.mood, topic, prompts[i], visualStyle);
        if (url) {
          storyUrls.push(url);
          setPlan(prev => prev ? ({ ...prev, storyImageUrls: [...storyUrls] }) : null);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      setStep(GenerationStep.GENERATING_AUDIO);
      const narrationScript = contentLanguage === 'ko' ? generatedPlan.script_kr : generatedPlan.script_ja;
      const audioBase64 = await generateHealingAudio(narrationScript);

      setPlan(prev => prev ? ({
        ...prev,
        selectedEffects,
        storyImageUrls: storyUrls,
        hookImageUrl: hookUrl,
        audioBase64: audioBase64 || undefined
      }) : null);

      setStep(GenerationStep.COMPLETED);
    } catch (err: any) {
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

  const handleAnimateHook = async () => {
    if (!plan?.hookImageUrl) return;
    setStep(GenerationStep.GENERATING_HOOK_VIDEO);
    setVideoStatus("Veo 3.1 영상 엔진 가속 중... (映像エンジン起動中)");

    try {
      const resp = await fetch(plan.hookImageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const videoUrl = await generateHealingVideo(
            reader.result as string,
            topic,
            (msg) => setVideoStatus(msg)
          );
          if (videoUrl) {
            setPlan(prev => prev ? ({ ...prev, hookVideoUrl: videoUrl }) : null);
          }
          setStep(GenerationStep.COMPLETED);
          setVideoStatus("");
        } catch (innerErr: any) {
          setError("영상 생성 오류: " + innerErr.message);
          setStep(GenerationStep.COMPLETED);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      setError("오류: " + e.message);
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
            <p className="text-[#6B4A4A] text-[10px] font-bold uppercase tracking-widest">V3.6 JP Mystery Lab</p>
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
                      {p.id === 'success' ? <Rocket size={16} /> : p.id === 'mystery' ? <Ghost size={16} /> : p.id === 'dopamine' ? <Laugh size={16} /> : <Moon size={16} />}
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
                  onClick={() => { setTopic(p.query); setSelectedPersona('mystery'); }}
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

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">4. Master Topic (주제 입력)</label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border-2 border-[#1E1E2C] bg-[#0F0F1A] text-[#E8DDD0] placeholder-[#4A3A3A] focus:border-red-700 focus:bg-[#12121E] transition-all text-sm font-bold p-4 resize-none"
              placeholder="쇼츠의 핵심 주제를 자유롭게 입력하세요 (한글/일어 가능)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
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
                    playSfxPreview(sfx.id);
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

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">8. Background Music (BGM 업로드)</label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${userBgm ? 'bg-[#0A1210] border-emerald-700' : 'bg-[#12121E] border-[#1E1E2C] hover:border-amber-700'
              }`}>
              <div className={`p-3 rounded-xl ${userBgm ? 'bg-emerald-950' : 'bg-amber-950'}`}>
                <Sparkles size={20} className={userBgm ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900 mb-0.5">
                  {userBgm ? userBgm.name : 'BGM 파일 선택'}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {userBgm ? 'MP3 준비완료' : 'MP3/WAV 필수'}
                </p>
              </div>
              {!userBgm && (
                <span className="shrink-0 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded">필수</span>
              )}
              <input
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && setUserBgm(e.target.files[0])}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !topic}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl shadow-red-950/50 active:scale-[0.98] btn-mystery ${isGenerating ? 'bg-[#1A1A28] text-[#4A4A5A] shadow-none' : 'bg-red-800 text-white hover:bg-red-700'}`}
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Wand2 className="w-6 h-6" /><span>AI GENERATE</span></>}
          </button>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                <div className="flex p-1.5 bg-[#12121E] border border-[#1E1E2C] rounded-2xl w-fit shadow-sm">
                  <button onClick={() => setActiveTab('preview')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-red-800 text-white shadow-lg shadow-red-950' : 'text-[#6B5A5A] hover:text-[#9B8A7A]'}`}>
                    <LayoutDashboard size={18} /> DASHBOARD
                  </button>
                  <button onClick={() => setActiveTab('code')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-red-800 text-white shadow-lg shadow-red-950' : 'text-[#6B5A5A] hover:text-[#9B8A7A]'}`}>
                    <Terminal size={18} /> EXPORT ENGINE
                  </button>
                </div>

                {activeTab === 'preview' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScriptCard plan={plan} personaType={selectedPersona} language={contentLanguage} />
                    <div className="mt-10 bg-[#0E0E1A] border border-[#1E1E2C] rounded-[2.5rem] p-10 shadow-lg">
                      <h3 className="text-xl font-black text-[#E8DDD0] mb-8 flex items-center gap-3">
                        <Grid size={24} className="text-red-500" />
                        Storyboard Sequence (2K High-Res)
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
                              </div>
                              <div className="absolute top-4 left-4 bg-red-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Master Hook</div>
                            </div>
                            <div className="bg-[#12121E] p-3 rounded-2xl border border-[#1E1E2C]">
                              <p className="text-[10px] text-[#6B5A5A] font-bold mb-1 uppercase tracking-tighter line-clamp-2" title={plan.hook_image_prompt}>
                                {plan.hook_image_prompt}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-black text-red-500">STRICT 9:16 READY</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {plan.storyImageUrls?.map((url, i) => (
                          <div key={i} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="aspect-[9/16] rounded-3xl bg-[#1A1A28] overflow-hidden relative group border-2 border-[#1E1E2C] hover:border-red-700 transition-all shadow-md">
                              <img src={url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setEditingIndex({ index: i, prompt: plan.story_image_prompts[i] })}
                                  className="p-3 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                                >
                                  <Sparkles size={20} />
                                </button>
                                <button
                                  onClick={() => handleRegenerateImage(i)}
                                  className="p-3 bg-indigo-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                                >
                                  <Zap size={20} />
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
                    <PythonExport plan={plan} userBgm={userBgm} onAnimateHook={handleAnimateHook} isAnimatingHook={step === GenerationStep.GENERATING_HOOK_VIDEO} language={contentLanguage} />
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
                  />
                </div>
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




