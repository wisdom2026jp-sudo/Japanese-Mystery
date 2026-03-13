
import React, { useState } from 'react';
import { Copy, Check, Music2, Youtube, MessageSquareQuote, Zap, Ghost, Laugh, Moon, Languages, ChevronDown, ChevronUp, ExternalLink, Search, Sparkles, Pencil, Save, X, Lightbulb, Loader2, Download, ImageIcon, Eye, Skull, AlertTriangle, RefreshCw, MessageCircle, Clock, Repeat2 } from 'lucide-react';
import { HealingPlan, PersonaType, ContentLanguage } from '../types';
import { generateAlternativeTitles, generateThumbnail } from '../services/geminiService';
import { SceneVisualizer } from './SceneVisualizer';

interface ScriptCardProps {
  plan: HealingPlan;
  personaType: PersonaType;
  language: ContentLanguage;
  topic: string;
  onScriptChange?: (scriptJa: string, scriptKr: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ plan, personaType, language, topic, onScriptChange }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [showAlt, setShowAlt] = useState(false);
  const [editingScript, setEditingScript] = useState(false);
  const [editedJa, setEditedJa] = useState(plan.script_ja);
  const [editedKr, setEditedKr] = useState(plan.script_kr);
  // A/B 타이틀
  const [abTitles, setAbTitles] = useState<string[]>([]);
  const [loadingAB, setLoadingAB] = useState(false);
  // 썸네일
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loadingThumb, setLoadingThumb] = useState(false);

  const isJa = language === 'ja';
  const primaryScript = isJa ? editedJa : editedKr;
  const altScript = isJa ? editedKr : editedJa;
  const primaryDesc = plan.description_ja;
  const primaryTitle = isJa ? plan.title_ja : plan.title_kr;
  const altTitle = isJa ? plan.title_kr : plan.title_ja;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveScript = () => {
    setEditingScript(false);
    if (onScriptChange) {
      onScriptChange(editedJa, editedKr);
    }
  };

  const handleCancelEdit = () => {
    setEditedJa(plan.script_ja);
    setEditedKr(plan.script_kr);
    setEditingScript(false);
  };

  // A/B 타이틀 생성
  const handleGenerateAB = async () => {
    setLoadingAB(true);
    try {
      const titles = await generateAlternativeTitles(topic, plan.title_ja);
      setAbTitles(titles);
    } catch { setAbTitles([]); }
    setLoadingAB(false);
  };

  // 썸네일 생성 + 다운로드
  const handleGenerateThumbnail = async () => {
    setLoadingThumb(true);
    try {
      const url = await generateThumbnail(plan);
      if (url) {
        setThumbnail(url);
        // 자동 다운로드
        const a = document.createElement('a');
        a.href = url;
        a.download = `thumbnail_${Date.now()}.png`;
        a.click();
      }
    } catch {}
    setLoadingThumb(false);
  };

  const getPersonaLabels = () => {
    switch (personaType) {
      case 'urban_legend': return { affirmation: 'Warning for You', messageIcon: <Ghost className="text-slate-500" /> };
      case 'true_story': return { affirmation: 'Survivor Journal', messageIcon: <Eye className="text-blue-500" /> };
      case 'human_horror': return { affirmation: 'Dark Psychology', messageIcon: <Skull className="text-purple-500" /> };
      default: return { affirmation: 'Forbidden Rule', messageIcon: <AlertTriangle className="text-amber-500" /> };
    }
  };

  const labels = getPersonaLabels();

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transition-all hover:shadow-2xl">

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-b border-slate-100">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">Pro Sync v3.8</span>
              <span className="text-[10px] font-medium text-slate-400">ID: {plan.title_ja?.substring(0, 8) || 'NO_TITLE'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleGenerateThumbnail} disabled={loadingThumb}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-[10px] font-black transition-all border border-purple-200 disabled:opacity-50"
                title="YouTube 썸네일 (16:9) 생성 & 다운로드">
                {loadingThumb ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                썸네일 생성
              </button>
              <button onClick={handleGenerateAB} disabled={loadingAB}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-[10px] font-black transition-all border border-amber-200 disabled:opacity-50"
                title="A/B 테스트용 타이틀 3종 생성">
                {loadingAB ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
                A/B 타이틀
              </button>
            </div>
          </div>

          {/* A/B 타이틀 결과 */}
          {abTitles.length > 0 && (
            <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">🔬 A/B 타이틀 3종 (클릭해서 복사)</p>
              {abTitles.map((t, i) => (
                <button key={i} onClick={() => handleCopy(t, `ab_${i}`)}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-amber-100 rounded-xl text-xs font-bold text-slate-800 border border-amber-200 transition-all flex items-center justify-between gap-2">
                  <span><span className="text-amber-500 font-black mr-1">#{i+1}</span>{t}</span>
                  {copied === `ab_${i}` ? <Check size={12} className="text-emerald-500 shrink-0" /> : <Copy size={12} className="text-slate-300 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-start gap-6 mt-2">
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

          {/* CTR 트리거 자동 분석 */}
          {(() => {
            const title = primaryTitle;
            const checks = [
              { label: '警告文', regex: /閲覧注意|絶対に|見てはいけない|削除/, emoji: '🚨' },
              { label: '数字', regex: /[0-9０-９]/, emoji: '🔢' },
              { label: '実話/証拠', regex: /実話|実際|撮影禁止|証拠|遺族/, emoji: '📋' },
              { label: '地名', regex: /京都|東京|大阪|渋谷|青木|病院|廃墟|地下鉄|新宿|横浜|名古屋/, emoji: '📍' },
              { label: '謎・未解決', regex: /正体|不明|解明|消えた|謎|なぜ|秘密|今も/, emoji: '🔍' },
            ];
            const passed = checks.filter(c => c.regex.test(title));
            const score = passed.length;
            return (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CTR 트리거 분석</p>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    score >= 4 ? 'bg-emerald-100 text-emerald-700' :
                    score >= 2 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {score}/5점 {score >= 4 ? '🔥 최강 CTR' : score >= 2 ? '👍 보통' : '⚠️ 보완 필요'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {checks.map(c => (
                    <span key={c.label} className={`px-2 py-1 rounded-full text-[9px] font-black border ${
                      c.regex.test(title)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50'
                    }`}>
                      {c.emoji} {c.label} {c.regex.test(title) ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
                {score < 3 && (
                  <p className="text-[8px] text-amber-500 font-bold mt-2">💡 A/B 타이틀 버튼으로 더 강한 제목을 생성해보세요</p>
                )}
              </div>
            );
          })()}

          {/* ─── AI 자동 생성 A/B 제목 대안 (새 필드) ─── */}
          {(plan.title_alt_a || plan.title_alt_b) && (
            <div className="mt-3 p-3 bg-gradient-to-br from-amber-50 to-red-50 border border-amber-200 rounded-2xl space-y-2">
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                <RefreshCw size={9} /> AI 자동 생성 제목 변형 (A/B 테스트용)
              </p>
              {plan.title_alt_a && (
                <button onClick={() => handleCopy(plan.title_alt_a!, 'alt_a')}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-red-50 rounded-xl text-[11px] font-bold text-slate-800 border border-red-100 transition-all flex items-center justify-between gap-2 group">
                  <span><span className="text-red-400 font-black mr-2">[금지형]</span>{plan.title_alt_a}</span>
                  {copied === 'alt_a' ? <Check size={11} className="text-emerald-500 shrink-0" /> : <Copy size={11} className="text-slate-300 group-hover:text-red-400 shrink-0" />}
                </button>
              )}
              {plan.title_alt_b && (
                <button onClick={() => handleCopy(plan.title_alt_b!, 'alt_b')}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-indigo-50 rounded-xl text-[11px] font-bold text-slate-800 border border-indigo-100 transition-all flex items-center justify-between gap-2 group">
                  <span><span className="text-indigo-400 font-black mr-2">[시청자겨냥]</span>{plan.title_alt_b}</span>
                  {copied === 'alt_b' ? <Check size={11} className="text-emerald-500 shrink-0" /> : <Copy size={11} className="text-slate-300 group-hover:text-indigo-400 shrink-0" />}
                </button>
              )}
            </div>
          )}
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

      {/* Grounding Sources */}
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

      {/* Creator Affirmation */}
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

      {/* 대체 언어 보기 */}
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

        {/* ─── 알고리즘 최적화 인사이트 패널 ─── */}
        {(plan.loop_hook || plan.comment_trigger || plan.optimal_upload_time) && (
          <div className="mt-5 space-y-3">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
              🏆 Algorithm Booster — 자동 삽입된 바이럴 요소
            </p>

            {plan.loop_hook && (
              <div className="flex items-start gap-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                  <Repeat2 size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">🔁 루프 트리거 엔딩 (시청 2회차 유도)</p>
                  <p className="text-xs font-bold text-slate-700 font-serif-jp">{plan.loop_hook}</p>
                </div>
                <button onClick={() => handleCopy(plan.loop_hook!, 'loop_hook')} className="shrink-0 p-1.5 hover:bg-indigo-100 rounded-lg transition-all">
                  {copied === 'loop_hook' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
            )}

            {plan.comment_trigger && (
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0">
                  <MessageCircle size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">💬 댓글 폭발 유도 질문</p>
                  <p className="text-xs font-bold text-slate-700 font-serif-jp">{plan.comment_trigger}</p>
                </div>
                <button onClick={() => handleCopy(plan.comment_trigger!, 'comment_trigger')} className="shrink-0 p-1.5 hover:bg-emerald-100 rounded-lg transition-all">
                  {copied === 'comment_trigger' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
            )}

            {plan.optimal_upload_time && (
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">⏰ 최적 업로드 시간 (알고리즘 분석)</p>
                  <p className="text-xs font-bold text-slate-700">{plan.optimal_upload_time}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Script Section - 편집 기능 포함 */}
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
          <div className="flex items-center gap-2">
            {!editingScript ? (
              <>
                <button
                  onClick={() => setEditingScript(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded-xl text-[10px] font-black transition-all border border-amber-500/30"
                  title="스크립트 직접 편집"
                >
                  <Pencil size={11} /> 편집
                </button>
                <button
                  onClick={() => handleCopy(primaryScript, 'script_main')}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  {copied === 'script_main' ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-400 rounded-xl text-[10px] font-black transition-all border border-emerald-500/30"
                >
                  <Save size={11} /> 저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-[10px] font-black transition-all"
                >
                  <X size={11} /> 취소
                </button>
              </>
            )}
          </div>
        </div>

        {editingScript ? (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                {isJa ? '🇯🇵 일본어 스크립트 편집' : '🇰🇷 한국어 스크립트 편집'}
              </p>
              <textarea
                className="w-full h-48 bg-slate-800 text-slate-100 rounded-2xl p-4 font-serif-jp text-sm leading-relaxed resize-none border-2 border-amber-500/40 focus:border-amber-400 outline-none transition-all"
                value={isJa ? editedJa : editedKr}
                onChange={(e) => isJa ? setEditedJa(e.target.value) : setEditedKr(e.target.value)}
                placeholder="스크립트를 직접 수정하세요..."
              />
              <div className="flex justify-between mt-1">
                <p className="text-[9px] text-amber-400 font-bold">✏️ 수정 후 저장 버튼을 누르면 나레이션 생성에 반영됩니다</p>
                <p className="text-[9px] text-slate-500 font-bold">{(isJa ? editedJa : editedKr).length}자</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="font-serif-jp text-xl leading-relaxed text-slate-100 whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {primaryScript}
          </p>
        )}

        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Duration: 00:59</span>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Optimized for TTS Narration
          </div>
        </div>

        {/* 🎬 씨 분할 시각화 */}
        <SceneVisualizer scriptJa={editedJa} />
      </div>
    </div>
  );
};
