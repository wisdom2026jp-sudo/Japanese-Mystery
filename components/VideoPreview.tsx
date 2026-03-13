
import { Play, Volume2, Image as ImageIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { HealingPlan, MOOD_VIDEOS, ContentLanguage } from '../types';

interface VideoPreviewProps {
  plan: HealingPlan;
  userBgm: File | null;
  onBgmSelect: (file: File | null) => void;
  language: ContentLanguage;
  bgmVolume?: number;
}

async function decodeAudioData(base64Data: string, ctx: AudioContext, sampleRate: number = 24000): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

async function decodeUserFile(file: File, ctx: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ plan, userBgm, onBgmSelect, language, bgmVolume = 0.15 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 179;
  const hookDuration = 7.0;

  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopAll = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (voiceSourceRef.current) {
      try { voiceSourceRef.current.stop(); voiceSourceRef.current.disconnect(); } catch (e) { }
      voiceSourceRef.current = null;
    }
    if (bgmSourceRef.current) {
      try { bgmSourceRef.current.stop(); bgmSourceRef.current.disconnect(); } catch (e) { }
      bgmSourceRef.current = null;
    }
    if (gainNodeRef.current) {
      try { gainNodeRef.current.disconnect(); } catch (e) { }
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        if (!audioContextRef.current) return;
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(elapsed);
        if (elapsed >= totalDuration) { stopAll(); return; }
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      stopAll();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const storyImages = plan.storyImageUrls && plan.storyImageUrls.length > 0 ? plan.storyImageUrls : [plan.backgroundImageUrl || MOOD_VIDEOS.default];
  const activeImageIdx = Math.min(Math.floor(Math.max(0, currentTime - hookDuration) / ((totalDuration - 12) / storyImages.length)), storyImages.length - 1);
  const showHook = currentTime < hookDuration;

  const startPlayback = async () => {
    if (!plan.audioBase64) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const voiceBuffer = await decodeAudioData(plan.audioBase64, ctx);
      startTimeRef.current = ctx.currentTime;

      if (userBgm) {
        const bgmBuffer = await decodeUserFile(userBgm, ctx);
        const bgmSource = ctx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(bgmVolume, ctx.currentTime);
        bgmSource.connect(gain);
        gain.connect(ctx.destination);
        bgmSource.start(ctx.currentTime);
        bgmSourceRef.current = bgmSource;
        gainNodeRef.current = gain;
      }

      const voiceSource = ctx.createBufferSource();
      voiceSource.buffer = voiceBuffer;
      voiceSource.connect(ctx.destination);
      voiceSource.start(ctx.currentTime + hookDuration);
      voiceSourceRef.current = voiceSource;
      setIsPlaying(true);
    } catch (e) { stopAll(); }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <style>{`
        @keyframes jitter_v59 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(5px,-4px)} 50%{transform:translate(-4px,5px)} }
        @keyframes scanline_v59 { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      `}</style>

      <div className={`mx-auto w-[320px] aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px] border-slate-900 relative group`}>
        <div className={`absolute inset-0 w-full h-full transition-transform duration-[15s] linear ${isPlaying && !showHook ? 'scale-[1.3]' : 'scale-100'}`}>
          <img src={storyImages[activeImageIdx]} className="w-full h-full object-cover transition-opacity duration-1000" />
        </div>

        {plan.hookImageUrl && (
          <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${showHook || (!isPlaying && currentTime === 0) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`w-full h-full overflow-hidden ${plan.selectedEffects?.includes('night_vision') ? 'filter brightness-110 contrast-125' : ''}`}>
              {plan.hookVideoUrl ? (
                <video src={plan.hookVideoUrl} className="w-full h-full object-cover" autoPlay loop muted />
              ) : (
                <img src={plan.hookImageUrl} className={`w-full h-full object-cover ${isPlaying ? 'scale-110' : 'scale-100'}`} style={isPlaying && plan.selectedEffects?.includes('film_jitter') ? { animation: 'jitter_v59 0.1s infinite step-end' } : {}} />
              )}
            </div>

            {plan.selectedEffects?.includes('night_vision') && (
              <div className="absolute inset-0 z-20 bg-emerald-900/20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
                <div className="absolute inset-0 w-full h-1 bg-white/10 animate-[scanline_v59_4s_linear_infinite]" />
              </div>
            )}

            {plan.selectedEffects?.includes('tracking') && (
              <div className="absolute inset-0 z-30 pointer-events-none p-6 opacity-60">
                <div className="w-full h-full border border-white/30 relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            )}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black text-white tracking-widest animate-pulse">VIRAL HOOK (FX ON)</div>
            {/* 언어 표시 배지 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1.5 border border-white/20">
              <span>{language === 'ja' ? '🇯🇵' : '🇰🇷'}</span>
              <span>{language === 'ja' ? '日本語' : '한국어'}</span>
            </div>
          </div>
        )}

        {!showHook && isPlaying && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
            <ImageIcon size={10} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Scene {activeImageIdx + 1} / {storyImages.length}</span>
          </div>
        )}

        {!isPlaying && (
          <button onClick={startPlayback} className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white/10 backdrop-blur-xl p-10 rounded-full border border-white/20 shadow-2xl">
              <Play size={48} className="text-white fill-white translate-x-1" />
            </div>
          </button>
        )}
      </div>

      <div className="w-full px-4 space-y-3">
        <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all">
          <div className={`p-2 rounded-xl ${userBgm ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <Volume2 size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-black truncate">{userBgm ? userBgm.name : "Select Atmosphere BGM"}</p>
            <p className="text-[10px] text-slate-400">Audio file required for export</p>
          </div>
          <input type="file" className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && onBgmSelect(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
};
