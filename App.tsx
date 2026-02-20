
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Youtube, Wand2, Image as ImageIcon, Zap, Laugh, Ghost, Moon, Rocket, AlertTriangle, Eye, Move, MapPin, Skull, Key, Grid, Diamond, LayoutDashboard, Terminal, Info } from 'lucide-react';
import { generateHealingPlan, generateHealingImage, generateHookImage, generateHealingAudio, generateHealingVideo } from './services/geminiService';
import { HealingPlan, GenerationStep, VisualStyle, PersonaType, Persona, MysteryEffect } from './types';
import { ScriptCard } from './components/ScriptCard';
import { VideoPreview } from './components/VideoPreview';
import { PythonExport } from './components/PythonExport';
import { saveToLocalStorage, loadFromLocalStorage, hasBackup } from './utils/autoSave';

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
  { id: 'success', name: '成功への刺激', name_kr: '성공의 자극', icon: 'Rocket', description: '동기부여 및 성공학', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Success' },
  { id: 'mystery', name: '都市伝説の真実', name_kr: '도시전설의 진실', icon: 'Ghost', description: '호기심과 충격적 진상', color: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Mystery' },
  { id: 'dopamine', name: '爆笑スナック', name_kr: '폭소 스낵', icon: 'Laugh', description: '공감 일상 유머', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Comedy' },
  { id: 'healer', name: '真夜中の癒やし', name_kr: '한밤중의 힐링', icon: 'Moon', description: '위로와 감성 콘텐츠', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Healing' }
];

const MYSTERY_PRESETS = [
  { title: "きさらぎ駅", title_kr: "키사라기 역", query: "Google Maps에 없는 이세계 역, 키사라기 역의 실체와 탈출 기록" },
  { title: "コトリバコ", title_kr: "코토리바코", query: "일본 2ch 역사상 최악의 저주 상자 '코토리바코'와 8각형 상자의 진실" },
  { title: "八尺様", title_kr: "팔척귀신", query: "포...포... 소리를 내는 2미터 거구의 여자 요괴 하치샤쿠사마 기담" },
  { title: "犬鳴トンネル", title_kr: "이누나키 터널", query: "일본 헌법이 통하지 않는다는 전설의 마을, 이누나키 터널 잠입" },
  { title: "テケテケ", title_kr: "테케테케", query: "하반신이 없는 채 시속 100km로 쫓아오는 테케테케의 공포" },
  { title: "くねくね", title_kr: "쿠네쿠네", query: "논밭에서 춤추는 하얀 물체, 보면 미쳐버린다는 쿠네쿠네 괴담" },
  { title: "さとるくん", title_kr: "사토루 군", query: "공중전화로 미래를 알려주는 사토루 군을 부르는 위험한 의식" },
  { title: "両面宿儺", title_kr: "료멘스쿠나", query: "오래된 창고에서 발견된 머리 두 개 달린 미라, 료멘스쿠나의 저주" }
];

export default function App() {
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic_real');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('mystery');
  const [selectedEffects, setSelectedEffects] = useState<MysteryEffect[]>(['night_vision', 'film_jitter']);
  const [plan, setPlan] = useState<HealingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [imgProgress, setImgProgress] = useState({ current: 0, total: 0 });

  const [userBgm, setUserBgm] = useState<File | null>(null);
  const [hasVideoKey, setHasVideoKey] = useState(false);

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
      const audioBase64 = await generateHealingAudio(generatedPlan.script_ja);

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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-[420px] bg-white border-r border-slate-200 p-8 flex flex-col z-10 shadow-xl overflow-y-auto custom-scrollbar">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">ミステリーファクトリー</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded uppercase tracking-widest">Mystery Factory Pro</span>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">V3.6 JP Mystery Lab</p>
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
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedPersona === p.id ? `border-indigo-600 shadow-lg ${p.color}` : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                    }`}
                  title={p.description}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {p.id === 'success' ? <Rocket size={16} /> : p.id === 'mystery' ? <Ghost size={16} /> : p.id === 'dopamine' ? <Laugh size={16} /> : <Moon size={16} />}
                    </div>
                  </div>
                  <p className="text-xs font-black mb-1">{p.name}</p>
                  <p className="text-[10px] text-indigo-500 font-bold mb-1">[{p.name_kr}]</p>
                  <p className="text-[9px] opacity-60 font-medium leading-tight">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">2. JP Mystery Presets (일본 괴담 특화)</label>
            <div className="grid grid-cols-2 gap-2">
              {MYSTERY_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setTopic(p.query); setSelectedPersona('mystery'); }}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-600 hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-red-500" />
                      <span>{p.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-5">{p.title_kr}</span>
                  </div>
                  <Sparkles size={12} className="text-indigo-300 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">3. Master Topic (주제 입력)</label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold p-4 resize-none"
              placeholder="쇼츠의 핵심 주제를 자유롭게 입력하세요 (한글/일어 가능)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">4. Viral Hook FX (영상 효과)</label>
            <div className="grid grid-cols-3 gap-2">
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
                  className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${selectedEffects.includes(fx.id as MysteryEffect) ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50'
                    }`}
                  title={fx.label_kr}
                >
                  <fx.icon size={16} className={selectedEffects.includes(fx.id as MysteryEffect) ? fx.color : 'text-slate-400'} />
                  <span className="text-[9px] font-black">{fx.label}</span>
                  <span className="text-[8px] opacity-50 font-bold">{fx.label_kr}</span>
                </button>
              ))}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">5. Background Music (BGM 업로드)</label>
                <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${userBgm
                  ? 'bg-white border-emerald-500'
                  : 'bg-white border-slate-200 hover:border-amber-400'
                  }`}>
                  <div className={`p-3 rounded-xl ${userBgm ? 'bg-emerald-100' : 'bg-amber-100'}`}>
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
                    <span className="shrink-0 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded">
                      필수
                    </span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && setUserBgm(e.target.files[0])}
                  />
                </label>
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !topic}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl active:scale-[0.98] ${isGenerating ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Production Center</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Step: <span className="text-indigo-600">{step}</span></p>
              </div>
            </div>
            {!hasVideoKey && (
              <button onClick={() => window.aistudio?.openSelectKey()} className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-black animate-pulse shadow-sm">
                <Key size={14} /> Veo Activation 필수
              </button>
            )}
          </div>

          {isGenerating && step === GenerationStep.GENERATING_IMAGE && (
            <div className="mb-10 bg-indigo-600 p-6 rounded-3xl shadow-xl flex items-center justify-between text-white overflow-hidden relative">
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
            <div className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 flex items-start gap-4 shadow-lg">
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
                <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
                  <button onClick={() => setActiveTab('preview')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutDashboard size={18} /> DASHBOARD
                  </button>
                  <button onClick={() => setActiveTab('code')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Terminal size={18} /> EXPORT ENGINE
                  </button>
                </div>

                {activeTab === 'preview' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScriptCard plan={plan} personaType={selectedPersona} />
                    <div className="mt-10 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                      <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <Grid size={24} className="text-indigo-600" />
                        Storyboard Sequence (2K High-Res)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plan.hookImageUrl && (
                          <div className="space-y-3">
                            <div className="aspect-[9/16] rounded-3xl bg-slate-100 overflow-hidden relative group border-4 border-indigo-600 shadow-xl">
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
                              <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Master Hook</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter line-clamp-2" title={plan.hook_image_prompt}>
                                {plan.hook_image_prompt}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-black text-indigo-600">STRICT 9:16 READY</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {plan.storyImageUrls?.map((url, i) => (
                          <div key={i} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="aspect-[9/16] rounded-3xl bg-slate-100 overflow-hidden relative group border-2 border-slate-100 hover:border-indigo-400 transition-all shadow-md">
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
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter line-clamp-2" title={plan.story_image_prompts[i]}>
                                {plan.story_image_prompts[i]}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                <span className="text-[9px] font-black text-slate-500">2K CINEMATIC VER.</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PythonExport plan={plan} userBgm={userBgm} userBackground={null} onAnimateHook={handleAnimateHook} isAnimatingHook={step === GenerationStep.GENERATING_HOOK_VIDEO} />
                  </div>
                )}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-12">
                  <VideoPreview
                    plan={plan}
                    userBgm={userBgm}
                    onBgmSelect={setUserBgm}
                    userBackground={null}
                    onBackgroundSelect={() => { }}
                    onAnimate={() => { }}
                    onAnimateHook={handleAnimateHook}
                    isAnimating={false}
                    isAnimatingHook={step === GenerationStep.GENERATING_HOOK_VIDEO}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-100">
                <Zap size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Pro Studio Ready</h2>
              <p className="text-slate-400 font-bold max-w-md leading-relaxed">
                왼쪽 패널에서 페르소나와 주제를 선택하세요.<br />
                일본 시장에 최적화된 기획과 2K 고화질 영상을 자동 생성합니다.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Prompt Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white">
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
                  className="w-full h-40 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-600 focus:bg-white transition-all outline-none resize-none"
                  value={editingIndex.prompt}
                  onChange={(e) => setEditingIndex({ ...editingIndex, prompt: e.target.value })}
                  placeholder="예: 빗속에 서 있는 일본 아이, 공포스러운 눈빛, 9:16 세로형..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingIndex(null)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    handleRegenerateImage(editingIndex.index, editingIndex.prompt);
                    setEditingIndex(null);
                  }}
                  className="flex-2 py-4 px-8 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
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




