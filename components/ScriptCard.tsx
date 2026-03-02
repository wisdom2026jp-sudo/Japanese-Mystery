
import React, { useState } from 'react';
import { Copy, Check, Music2, Youtube, MessageSquareQuote, Zap, Ghost, Laugh, Moon, Languages, ChevronDown, ChevronUp, ExternalLink, Search, Sparkles } from 'lucide-react';
import { HealingPlan, PersonaType, ContentLanguage } from '../types';

interface ScriptCardProps {
  plan: HealingPlan;
  personaType: PersonaType;
  language: ContentLanguage;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ plan, personaType, language }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  // 언어가 ja면 기본 한국어 번역 숨김, ko면 기본보기
  const [showAlt, setShowAlt] = useState(false);

  const isJa = language === 'ja';
  // 주언어 스크립트
  const primaryScript = isJa ? plan.script_ja : plan.script_kr;
  // 대체언어 스크립트
  const altScript = isJa ? plan.script_kr : plan.script_ja;
  const primaryDesc = plan.description_ja; // description은 항상 일본어 (메타데이터용)
  const primaryTitle = isJa ? plan.title_ja : plan.title_kr;
  const altTitle = isJa ? plan.title_kr : plan.title_ja;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getPersonaLabels = () => {
    switch (personaType) {
      case 'success': return { affirmation: 'Alpha Mindset Tip', messageIcon: <Zap className="text-yellow-500" /> };
      case 'mystery': return { affirmation: 'Warning for You', messageIcon: <Ghost className="text-slate-500" /> };
      case 'dopamine': return { affirmation: 'Creator Joke', messageIcon: <Laugh className="text-emerald-500" /> };
      default: return { affirmation: 'Midnight Whisper', messageIcon: <Moon className="text-indigo-500" /> };
    }
  };

  const labels = getPersonaLabels();

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-b border-slate-100">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">Pro Sync v3.0</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{personaType}</span>
          </div>
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 leading-tight font-serif-jp tracking-tight">{primaryTitle}</h2>
              <p className="text-sm font-semibold text-indigo-500/80">{altTitle}</p>
            </div>
            <button
              onClick={() => handleCopy(primaryTitle, 'title_main')}
              className="shrink-0 p-3 bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md rounded-2xl transition-all border border-slate-100"
            >
              {copied === 'title_main' ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white text-indigo-700 border border-indigo-100 shadow-sm">
            <Sparkles size={12} />
            Mood: {plan.mood.toUpperCase()}
          </div>
          {plan.tags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
              #{tag.replace('#', '')}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/80 backdrop-blur-sm border border-indigo-100 p-4 rounded-2xl shadow-sm">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Music2 size={18} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">BGM Recommendation</p>
            <p className="font-bold text-slate-700">{plan.bgm_descriptor}</p>
          </div>
        </div>
      </div>

      {/* Grounding Sources (Gemini Search) */}
      {plan.groundingSources && plan.groundingSources.length > 0 && (
        <div className="px-8 py-5 bg-blue-50/40 border-b border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-blue-600" />
            <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Reliable Evidence (Search Grounding)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.groundingSources.map((source, idx) => (
              <a
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <span className="truncate max-w-[140px]">{source.title || 'Source'}</span>
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Creator Affirmation Area */}
      {plan.creator_affirmation && (
        <div className="px-8 py-6 bg-amber-50/30 border-b border-amber-100 flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            {React.cloneElement(labels.messageIcon as any, { className: 'shrink-0', size: 22 })}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">{labels.affirmation}</h3>
            <p className="text-base text-slate-800 italic font-medium leading-relaxed">
              "{plan.creator_affirmation}"
            </p>
          </div>
        </div>
      )}

      {/* 대체 언어 보기 (JP 선택 시 → 한국어 번역 / KO 선택 시 → 일본어 원문) */}
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setShowAlt(!showAlt)}
          className="flex justify-between items-center w-full group"
        >
          <div className="flex items-center gap-2">
            <Languages size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <h3 className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">
              {isJa ? 'Script Summary (KR) · 한국어 번역' : '原文スクリプト (JP) · 일본어 원문'}
            </h3>
          </div>
          {showAlt ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
        </button>
        {showAlt && (
          <div className="mt-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-inner animate-in slide-in-from-top-2 duration-300">
            <p className="text-sm leading-relaxed text-slate-600 font-medium">
              {altScript}
            </p>
          </div>
        )}
      </div>

      {/* Metadata Section */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Youtube size={20} className="text-red-600" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Metadata (Shorts Description)</h3>
          </div>
          <button
            onClick={() => handleCopy(plan.description_ja, 'desc')}
            className="px-4 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-full text-[10px] font-black transition-all shadow-sm"
          >
            {copied === 'desc' ? 'COPIED!' : 'COPY DATA'}
          </button>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <p className="font-serif-jp text-sm leading-relaxed text-slate-700 whitespace-pre-wrap h-24 overflow-y-auto custom-scrollbar">
            {plan.description_ja}
          </p>
        </div>
      </div>

      {/* Full Script Section */}
      <div className="p-8 bg-slate-900">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <MessageSquareQuote size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
              Narration Master Script · {isJa ? '🇯🇵 日本語' : '🇰🇷 한국어'}
            </h3>
          </div>
          <button
            onClick={() => handleCopy(primaryScript, 'script_main')}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            {copied === 'script_main' ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p className="font-serif-jp text-xl leading-relaxed text-slate-100 whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {primaryScript}
        </p>
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Duration: 02:59</span>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Optimized for Puck Voice (TTS)
          </div>
        </div>
      </div>
    </div>
  );
};
