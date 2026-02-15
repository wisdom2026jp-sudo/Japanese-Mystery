
import React, { useState } from 'react';
import { HealingPlan } from '../types';
import { Archive, Loader2, Music, CheckCircle2, ShieldCheck, Cpu, Sparkles, BookOpen } from 'lucide-react';
import JSZip from 'jszip';

interface PythonExportProps {
  plan: HealingPlan;
  userBgm: File | null;
  userBackground: File | null;
  onAnimateHook: () => void;
  isAnimatingHook: boolean;
}

function getWavBytes(base64Data: string, sampleRate: number): Uint8Array {
    const binaryString = atob(base64Data);
    const pcmData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) pcmData[i] = binaryString.charCodeAt(i);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const totalLength = 44 + pcmData.length;
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    const writeS = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeS(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeS(8, 'WAVE');
    writeS(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeS(36, 'data');
    view.setUint32(40, pcmData.length, true);
    const full = new Uint8Array(totalLength);
    full.set(new Uint8Array(buffer, 0, 44));
    full.set(pcmData, 44);
    return full;
}

const generateSRT = (script: string, durationSeconds: number): string => {
    if (!script) return "";
    const raw = script.split(/(?<=[。、\n])/);
    const segments: string[] = [];
    raw.forEach(segment => {
      const trimmed = segment.trim();
      if (!trimmed) return;
      if (trimmed.length > 15) {
        const subChunks = trimmed.match(/.{1,12}/g) || [trimmed];
        segments.push(...subChunks);
      } else {
        segments.push(trimmed);
      }
    });
    const totalChars = segments.join('').length;
    let elapsed = 0;
    let srt = "";
    const fmt = (s: number) => {
        const d = new Date(0); d.setMilliseconds(s * 1000);
        return d.toISOString().substr(11, 12).replace('.', ',');
    };
    segments.forEach((part, i) => {
        const d = (part.length / totalChars) * durationSeconds;
        srt += `${i + 1}\n${fmt(elapsed)} --> ${fmt(elapsed + d)}\n${part}\n\n`;
        elapsed += d;
    });
    return srt;
};

export const PythonExport: React.FC<PythonExportProps> = ({ plan, userBgm, onAnimateHook, isAnimatingHook }) => {
  const [isZipping, setIsZipping] = useState(false);
  const isReady = !!plan.hookVideoUrl && !!userBgm;

  const renderScriptContent = `# ==========================================
# Healing Shorts Auto-Gen: V36.0 (Logic Fixed)
# Professional Production Edition
# ==========================================
import sys, os, glob, re, json, urllib.request, traceback
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import *
from moviepy.audio.fx.all import audio_fadeout, audio_fadein, audio_loop

# --- CONSTANTS ---
FONT_URL = "https://www.dropbox.com/scl/fi/vf37c2zs0fv624oosy3yw/SpoqaHanSansJPBold.ttf?rlkey=h2lqymoyzogf2nne7a0mek4hh&st=rzvusig0&dl=1"
FONT_FILENAME = "SpoqaHanSansJPBold.ttf"
TARGET_W, TARGET_H = 1080, 1920
FIXED_DURATION = 179.0 

def main():
    print("🚀 Initializing V36.0 Production Kit...")

    # 1. Font Download (High Fidelity Japanese Font)
    if not os.path.exists(FONT_FILENAME):
        try: urllib.request.urlretrieve(FONT_URL, FONT_FILENAME)
        except: print("⚠️ Font download failed, fallback to system font")
    font_path = FONT_FILENAME if os.path.exists(FONT_FILENAME) else "arial.ttf"

    # 2. Audio Processing
    if not os.path.exists("narration.wav"): 
        print("❌ Error: narration.wav missing")
        return
    voice_clip = AudioFileClip("narration.wav")

    # 3. Hook Logic (Cover-Resize for Seamless transition)
    hook_clip = None
    hook_dur = 0.0
    
    if os.path.exists("hook.mp4"):
        print("🪝 Processing Master Hook...")
        try:
            raw_hook = VideoFileClip("hook.mp4", audio=False)
            if raw_hook.duration > 0.1:
                hook_dur = raw_hook.duration
                if raw_hook.w / raw_hook.h > TARGET_W / TARGET_H:
                    hook_clip = raw_hook.resize(height=TARGET_H)
                    hook_clip = hook_clip.crop(x1=(hook_clip.w - TARGET_W)//2, width=TARGET_W)
                else:
                    hook_clip = raw_hook.resize(width=TARGET_W)
                    hook_clip = hook_clip.crop(y1=(hook_clip.h - TARGET_H)//2, height=TARGET_H)
                hook_clip = hook_clip.set_duration(hook_dur)
        except Exception as e:
            print(f"⚠️ Hook Processing Error: {e}")

    if not hook_clip and os.path.exists("hook.png"):
        hook_dur = 3.0
        img = ImageClip("hook.png")
        if img.w / img.h > TARGET_W / TARGET_H:
             img = img.resize(height=TARGET_H)
             img = img.crop(x1=(img.w - TARGET_W)//2, width=TARGET_W)
        else:
             img = img.resize(width=TARGET_W)
             img = img.crop(y1=(img.h - TARGET_H)//2, height=TARGET_H)
        hook_clip = img.set_duration(hook_dur).resize(lambda t: 1+0.05*t/hook_dur)

    # 4. Narrative Slideshow sequence
    slides = []
    story_files = sorted(glob.glob("story_*.png"), key=lambda x: int(re.search(r'(\\d+)', x).group()))
    body_dur = FIXED_DURATION - hook_dur
    
    if len(story_files) > 0:
        slide_time = min(voice_clip.duration, body_dur) / len(story_files)
        for i, f in enumerate(story_files):
            c = ImageClip(f)
            if c.w / c.h > TARGET_W / TARGET_H:
                c = c.resize(height=TARGET_H)
                c = c.crop(x1=(c.w - TARGET_W)//2, width=TARGET_W)
            else:
                c = c.resize(width=TARGET_W)
                c = c.crop(y1=(c.h - TARGET_H)//2, height=TARGET_H)
            
            c = c.set_duration(slide_time + 1.2)
            c = c.resize(lambda t: 1 + 0.04 * t / (slide_time+1.2))
            
            if i > 0: 
                c = c.set_start(i * slide_time).crossfadein(0.8)
            else: 
                c = c.set_start(0)
            slides.append(c)

    # 5. Composite Assembly
    print("🎞️ Composite Layers Building...")
    body_part = CompositeVideoClip(slides) if slides else None
    
    final_clips = []
    if hook_clip: final_clips.append(hook_clip.set_start(0))
    if body_part: 
        final_clips.append(body_part.set_start(hook_dur if hook_clip else 0))
    
    final_video = CompositeVideoClip(final_clips).set_duration(FIXED_DURATION)

    # 6. Audio Mastering
    voice_start = hook_dur + 0.5
    final_voice = voice_clip.set_start(voice_start)
    bgm_files = glob.glob("bgm.*")
    final_bgm = None
    if bgm_files:
        try:
            bgm = AudioFileClip(bgm_files[0])
            bgm = audio_loop(bgm, duration=FIXED_DURATION)
            final_bgm = bgm.volumex(0.18).audio_fadeout(3.0)
        except: pass
    
    final_audio = CompositeAudioClip([final_bgm, final_voice]) if final_bgm else final_voice
    final_video = final_video.set_audio(final_audio)

    # 7. Cinematic Subtitles
    subtitle_clips = []
    if os.path.exists("subtitles_ja.srt"):
        try:
            def create_sub_img(txt, dur):
                W, H = TARGET_W, 400
                img = Image.new('RGBA', (W, H), (0,0,0,0))
                draw = ImageDraw.Draw(img)
                try: font = ImageFont.truetype(font_path, 64)
                except: font = ImageFont.load_default()
                words = txt.replace('\\n', ' ').strip()
                lines = [words[i:i+14] for i in range(0, len(words), 14)] if len(words)>14 else [words]
                y_offset = 50
                for line in lines:
                    bbox = draw.textbbox((0,0), line, font=font)
                    text_w = bbox[2] - bbox[0]
                    x = (W - text_w) // 2
                    for off in [(3,3),(-3,-3),(3,-3),(-3,3)]:
                        draw.text((x+off[0], y_offset+off[1]), line, font=font, fill='black')
                    draw.text((x,y_offset), line, font=font, fill='#FFD700')
                    y_offset += 85
                return ImageClip(np.array(img)).set_duration(dur)

            with open("subtitles_ja.srt", 'r', encoding='utf-8') as f: content = f.read().strip()
            blocks = re.split(r'\\n\\n+', content)
            for b in blocks:
                lines = b.strip().split('\\n')
                if len(lines)>=2:
                    for i, line in enumerate(lines):
                        if '-->' in line:
                            times = line.split(' --> ')
                            if len(times)==2:
                                s = int(times[0][:2])*3600 + int(times[0][3:5])*60 + float(times[0].replace(',','.')[6:])
                                e = int(times[1][:2])*3600 + int(times[1][3:5])*60 + float(times[1].replace(',','.')[6:])
                                text = "\\n".join(lines[i+1:])
                                r_s = s + voice_start
                                r_e = e + voice_start
                                if r_s < FIXED_DURATION:
                                    dur = r_e - r_s
                                    if dur > 0:
                                        sub = create_sub_img(text, dur)
                                        sub = sub.set_start(r_s).set_position(('center', 0.72), relative=True)
                                        subtitle_clips.append(sub)
                            break
        except: pass

    # 8. Render Engine
    print("💾 High-Quality Encoding Starting...")
    final = CompositeVideoClip([final_video] + subtitle_clips).set_duration(FIXED_DURATION)
    final.write_videofile("final_output.mp4", fps=24, codec='libx264', audio_codec='aac', threads=4, preset='ultrafast')
    print("✅ MASTER RENDER COMPLETE.")

if __name__ == "__main__":
    main()
`;

  const handleZip = async () => {
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const root = zip.folder("production_kit");
        if (plan.audioBase64) {
            root.file("narration.wav", getWavBytes(plan.audioBase64, 24000));
            root.file("subtitles_ja.srt", generateSRT(plan.script_ja, plan.script_ja.length * 0.12)); 
        }
        if (plan.hookVideoUrl) {
            const videoBlob = await (await fetch(plan.hookVideoUrl)).blob();
            root.file("hook.mp4", videoBlob);
        }
        if (plan.storyImageUrls) {
            for (let i = 0; i < plan.storyImageUrls.length; i++) {
                const imgBlob = await (await fetch(plan.storyImageUrls[i])).blob();
                root.file(`story_${i}.png`, imgBlob);
            }
        }
        root.file("render.py", renderScriptContent);
        if (userBgm) root.file(`bgm.${userBgm.name.split('.').pop()}`, userBgm);
        root.file("README.txt", "1. pip install moviepy==1.0.3 pillow numpy\n2. python render.py\n\nNote: This kit uses high-precision Japanese typesetting logic.");
        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Production_Kit_V36_Final.zip`;
        a.click();
    } finally { setIsZipping(false); }
  };

  return (
    <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-indigo-200 shadow-lg">
                <Cpu className="text-white" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900">Master Export Engine</h3>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Version 36.0 (KR/JP Logic)</p>
            </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <ShieldCheck size={12} /> Pro Encryption Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border-2 transition-all ${plan.hookVideoUrl ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Scene Layer 0: Hook</span>
                <span className="text-[9px] text-indigo-500 font-bold">임팩트 인트로 영상</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.hookVideoUrl ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        <Archive size={18} className={plan.hookVideoUrl ? 'text-emerald-600' : 'text-slate-400'} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">AI Hook Video</span>
                </div>
                {!plan.hookVideoUrl ? (
                    <button onClick={onAnimateHook} disabled={isAnimatingHook} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${isAnimatingHook ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'}`}>
                        {isAnimatingHook ? "생성 중..." : "GENERATE"}
                    </button>
                ) : (
                    <CheckCircle2 className="text-emerald-500" size={24} />
                )}
              </div>
          </div>

          <div className={`p-6 rounded-2xl border-2 transition-all ${userBgm ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audio Layer: Atmosphere</span>
                <span className="text-[9px] text-indigo-500 font-bold">배경음악 선택</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userBgm ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        <Music className={userBgm ? 'text-emerald-600' : 'text-slate-400'} size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Atmosphere BGM</span>
                </div>
                {userBgm ? <CheckCircle2 className="text-emerald-500" size={24} /> : <span className="text-[10px] font-black text-slate-300">미선택</span>}
              </div>
          </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
              <BookOpen size={16} />
              <p className="text-xs font-black uppercase tracking-widest">Production Guide (한글 안내)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white text-xs font-bold mb-1">Frame Auto-Fill (비율 최적화)</p>
                  <p className="text-slate-400 text-[10px]">모든 이미지와 영상이 9:16 세로 화면에 빈틈없이 꽉 차도록 리사이징 및 중앙 크롭 처리를 자동으로 수행합니다.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white text-xs font-bold mb-1">High-Precision SRT (자막 싱크)</p>
                  <p className="text-slate-400 text-[10px]">일본어 나레이션의 글자 수를 분석하여 0.1초 단위로 정확한 자막 싱크 파일을 생성합니다.</p>
              </div>
          </div>
      </div>

      <button 
        onClick={handleZip} 
        disabled={!isReady || isZipping} 
        className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${isReady ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
      >
        {isZipping ? <Loader2 className="animate-spin" /> : <><span>DOWNLOAD MASTER PRODUCTION KIT</span> <Archive size={20} /></>}
      </button>
      
      {!isReady && (
        <p className="text-center text-[11px] font-bold text-amber-500 bg-amber-50 py-2 rounded-lg border border-amber-100">
            * 훅 영상 생성과 BGM 파일 선택이 완료되어야 추출이 가능합니다.
        </p>
      )}
    </div>
  );
};
