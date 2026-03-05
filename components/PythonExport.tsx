
import React, { useState } from 'react';
import { HealingPlan, ContentLanguage } from '../types';
import { Archive, Loader2, Music, CheckCircle2, ShieldCheck, Cpu, Sparkles, BookOpen } from 'lucide-react';
import JSZip from 'jszip';

interface PythonExportProps {
    plan: HealingPlan;
    userBgm: File | null;
    onAnimateHook: () => void;
    isAnimatingHook: boolean;
    language: ContentLanguage;
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
        if (trimmed.length > 25) {
            const subChunks = trimmed.match(/.{1,20}/g) || [trimmed];
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

export const PythonExport: React.FC<PythonExportProps> = ({ plan, userBgm, onAnimateHook, isAnimatingHook, language }) => {
    const [isZipping, setIsZipping] = useState(false);
    const isReady = !!plan.hookVideoUrl && !!userBgm;
    const isJa = language === 'ja';
    // 선택된 언어의 나레이션 스크립트
    const narrationScript = isJa ? plan.script_ja : plan.script_kr;
    // 자막 파일명
    const subtitleFilename = isJa ? 'subtitles_ja.srt' : 'subtitles_ko.srt';

    const renderScriptContent = `# ==========================================
# Healing Shorts Auto-Gen: V37.1 (NumPy 2.0 Patch)
# Feature: Strong Crash Guard / Cinematic Pill Subtitles
# ==========================================
import sys, os, glob, re, json, urllib.request, traceback
import numpy as np
import random
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import *
from moviepy.audio.fx.all import audio_fadeout, audio_fadein, audio_loop

# --- 1. 라이브러리 충돌 방지 패치 (튕김 방지 핵심) ---
try:
    import moviepy.video.VideoClip as _vc
    # NumPy 2.0 호환성 패치
    if not hasattr(np, 'product'): np.product = np.prod
    
    # zero-size array 오류 방지용 blit_on 패치
    _orig_blit = _vc.VideoClip.blit_on
    def _safe_blit(self, picture, t):
        if picture is None or picture.size == 0: return picture
        try: return _orig_blit(self, picture, t)
        except: return picture
    _vc.VideoClip.blit_on = _safe_blit
    print("🔧 Safety Patches Applied Successfully.")
except Exception as e:
    print(f"⚠️ Patch failed: {e}")

# --- CONSTANTS ---
FONT_URL = "https://www.dropbox.com/scl/fi/vf37c2zs0fv624oosy3yw/SpoqaHanSansJPBold.ttf?rlkey=h2lqymoyzogf2nne7a0mek4hh&st=rzvusig0&dl=1"
FONT_FILENAME = "SpoqaHanSansJPBold.ttf"
TARGET_W, TARGET_H = 1080, 1920
FIXED_DURATION = 59.0          # YouTube Shorts 최적: 59초
NARRATION_END  = 55.0          # 나레이션/자막은 55초까지
FADEOUT_DUR    = 4.0           # 마지막 4초 페이드아웃
SELECTED_EFFECTS = ${JSON.stringify(plan.selectedEffects || [])}
SELECTED_SFX = ${JSON.stringify(plan.selectedSfx || [])}
HOOK_TEXT = "${(plan.hookText || '都市伝説').replace(/"/g, '\\"')}"

# ===== UPDATE 1: SFX 생성 함수 (numpy로 공포 음향 자동 생성) =====
def generate_sfx(sfx_type, duration=2.0, sample_rate=44100):
    """공포 음향 효과를 numpy로 자동 생성"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.zeros(len(t))
    try:
        if sfx_type == 'horror_noise':
            noise = np.random.randn(len(t)) * 0.3
            rumble_freq = 40
            rumble = np.sin(2 * np.pi * rumble_freq * t) * 0.4 * np.exp(-t * 0.8)
            audio = noise + rumble
        elif sfx_type == 'heartbeat':
            for beat_t in np.arange(0, duration, 1.0):
                for pulse_offset in [0.0, 0.25]:
                    pt = t - beat_t - pulse_offset
                    mask = (pt >= 0) & (pt < 0.18)
                    audio[mask] += np.sin(2 * np.pi * 70 * pt[mask]) * np.exp(-pt[mask] * 18) * 0.8
        elif sfx_type == 'transition_whoosh':
            freq = np.linspace(300, 40, len(t))
            phase = 2 * np.pi * np.cumsum(freq) / sample_rate
            audio = np.sin(phase) * np.exp(-t * 2.5) * 0.6
        elif sfx_type == 'deep_rumble':
            audio = (np.sin(2 * np.pi * 30 * t) * 0.5 +
                     np.sin(2 * np.pi * 55 * t) * 0.3 +
                     np.random.randn(len(t)) * 0.05)
        elif sfx_type == 'static_burst':
            audio = np.random.randn(len(t)) * 0.7
            envelope = np.exp(-t * 4)
            audio = audio * envelope
        # 정규화
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.65
        # 스테레오 변환 (2채널)
        stereo = np.column_stack([audio, audio])
        return AudioArrayClip(stereo, fps=sample_rate)
    except Exception as e:
        print(f"  ⚠️ SFX 생성 실패 ({sfx_type}): {e}")
        return None


def apply_mystery_effects(clip, effects, is_hook=False):
    if not effects: return clip
    
    # 1. Night Vision (Greenish digital look)
    if 'night_vision' in effects:
        def nv_filter(get_frame, t):
            frame = get_frame(t).astype(float)
            frame[:, :, 0] *= 0.1 # R
            frame[:, :, 1] *= 1.4 # G
            frame[:, :, 2] *= 0.2 # B
            for y in range(0, frame.shape[0], 6):
                frame[y:y+2, :, :] *= 0.6
            return np.clip(frame, 0, 255).astype('uint8')
        clip = clip.fl(nv_filter)

    # 2. Film Jitter
    if 'film_jitter' in effects:
        def jitter_pos(t):
            if random.random() > 0.85: 
                return (random.randint(-8, 8), random.randint(-8, 8))
            return (0, 0)
        clip = clip.set_position(jitter_pos)

    # 3. Tracking (UI Overlay)
    if 'tracking' in effects:
        overlay_img = Image.new('RGBA', (TARGET_W, TARGET_H), (0,0,0,0))
        draw = ImageDraw.Draw(overlay_img)
        m, l = 120, 80
        color = (0, 255, 0, 160) if 'night_vision' in effects else (255, 255, 255, 140)
        draw.line([(m, m), (m + l, m)], fill=color, width=6)
        draw.line([(m, m), (m, m + l)], fill=color, width=6)
        draw.line([(TARGET_W - m, m), (TARGET_W - m - l, m)], fill=color, width=6)
        draw.line([(TARGET_W - m, m), (TARGET_W - m, m + l)], fill=color, width=6)
        draw.line([(m, TARGET_H - m), (m + l, TARGET_H - m)], fill=color, width=6)
        draw.line([(m, TARGET_H - m), (m, TARGET_H - m - l)], fill=color, width=6)
        draw.line([(TARGET_W - m, TARGET_H - m), (TARGET_W - m - l, TARGET_H - m)], fill=color, width=6)
        draw.line([(TARGET_W - m, TARGET_H - m), (TARGET_W - m, TARGET_H - m - l)], fill=color, width=6)
        if is_hook:
            draw.ellipse([m, TARGET_H - m - 40, m + 30, TARGET_H - m - 10], fill=(255,0,0,200))

        overlay_clip = ImageClip(np.array(overlay_img)).set_duration(clip.duration).set_start(clip.start)
        clip = CompositeVideoClip([clip, overlay_clip])
    
    # 4. Mandatory Vertical Title for Hook (都市伝説)
    if is_hook:
        try:
            title_img = Image.new('RGBA', (TARGET_W, TARGET_H), (0,0,0,0))
            draw_t = ImageDraw.Draw(title_img)
            f_path = "SpoqaHanSansJPBold.ttf" if os.path.exists("SpoqaHanSansJPBold.ttf") else "arial.ttf"
            try: font_t = ImageFont.truetype(f_path, 169)
            except: font_t = ImageFont.load_default()
            
            # ===== UPDATE 3: HOOK_TEXT 변수 사용 =====
            v_text = HOOK_TEXT
            curr_y = 250
            for char in v_text:
                bbox = draw_t.textbbox((0,0), char, font=font_t)
                char_w = bbox[2] - bbox[0]
                try:
                    draw_t.text((70 + (169-char_w)//2, curr_y), char, font=font_t, fill=(180,0,0,255), stroke_width=6, stroke_fill=(255,255,255,255))
                except:
                    for off in [(-4,-4), (4,-4), (-4,4), (4,4), (-4,0), (4,0), (0,-4), (0,4)]:
                        draw_t.text((70 + (169-char_w)//2 + off[0], curr_y + off[1]), char, font=font_t, fill=(255,255,255,255))
                    draw_t.text((70 + (169-char_w)//2, curr_y), char, font=font_t, fill=(180,0,0,255))
                curr_y += 190
            title_clip = ImageClip(np.array(title_img)).set_duration(clip.duration).set_start(clip.start)
            clip = CompositeVideoClip([clip, title_clip])
        except: pass
        
    return clip

def main():
    print("🚀 Initializing V37.1 Production Kit...")

    if not os.path.exists(FONT_FILENAME):
        try: urllib.request.urlretrieve(FONT_URL, FONT_FILENAME)
        except: pass
    font_path = FONT_FILENAME if os.path.exists(FONT_FILENAME) else "arial.ttf"

    if not os.path.exists("narration.wav"): 
        print("❌ Error: narration.wav missing")
        return
    voice_clip = AudioFileClip("narration.wav")

    hook_clip = None
    hook_dur = 0.0
    if os.path.exists("hook.mp4"):
        try:
            raw_hook = VideoFileClip("hook.mp4", audio=False)
            if raw_hook.duration > 0.1:
                hook_dur = raw_hook.duration
                if raw_hook.w / raw_hook.h > TARGET_W / TARGET_H:
                    temp_resize = raw_hook.resize(height=TARGET_H)
                    hook_clip = temp_resize.crop(x1=(temp_resize.w - TARGET_W)//2, width=TARGET_W)
                else:
                    temp_resize = raw_hook.resize(width=TARGET_W)
                    hook_clip = temp_resize.crop(y1=(temp_resize.h - TARGET_H)//2, height=TARGET_H)
                hook_clip = hook_clip.set_duration(hook_dur)
                hook_clip = apply_mystery_effects(hook_clip, SELECTED_EFFECTS, is_hook=True)
        except: pass

    if not hook_clip and os.path.exists("hook.png"):
        hook_dur = 4.0
        hook_clip = ImageClip("hook.png").set_duration(hook_dur).resize(height=TARGET_H)
        if hook_clip.w > TARGET_W: hook_clip = hook_clip.crop(x1=(hook_clip.w-TARGET_W)//2, width=TARGET_W)
        hook_clip = hook_clip.resize(lambda t: 1+0.06*t/hook_dur)
        hook_clip = apply_mystery_effects(hook_clip, SELECTED_EFFECTS, is_hook=True)

    slides = []
    story_files = sorted(glob.glob("story_*.png"), key=lambda x: int(re.search(r'(\\d+)', x).group()))
    body_dur = FIXED_DURATION - hook_dur
    
    if len(story_files) > 0:
        slide_time = min(voice_clip.duration, body_dur) / len(story_files)
        for i, f in enumerate(story_files):
            c = ImageClip(f)
            if c.w / c.h > TARGET_W / TARGET_H:
                temp_resize = c.resize(height=TARGET_H)
                c = temp_resize.crop(x1=(temp_resize.w - TARGET_W)//2, width=TARGET_W)
            else:
                temp_resize = c.resize(width=TARGET_W)
                c = temp_resize.crop(y1=(temp_resize.h - TARGET_H)//2, height=TARGET_H)
            
            c = c.set_duration(slide_time + 1.2).resize(lambda t: 1 + 0.04 * t / (slide_time+1.2))
            if i > 0: c = c.set_start(i * slide_time).crossfadein(0.8)
            else: c = c.set_start(0)
            slides.append(c)

    body_part = CompositeVideoClip(slides) if slides else None
    final_clips = []
    if hook_clip: final_clips.append(hook_clip.set_start(0))
    if body_part: final_clips.append(body_part.set_start(hook_dur))
    final_video = CompositeVideoClip(final_clips).set_duration(FIXED_DURATION)

    voice_start = hook_dur + 0.5
    final_voice = voice_clip.set_start(voice_start)
    bgm_files = glob.glob("bgm.*")
    
    # ===== UPDATE 1: SFX 믹싱 =====
    sfx_audio_clips = [final_voice]
    if bgm_files:
        try:
            bgm = AudioFileClip(bgm_files[0]).volumex(0.18).audio_loop(duration=FIXED_DURATION).audio_fadeout(3.0)
            sfx_audio_clips.append(bgm)
        except: pass
    
    if SELECTED_SFX:
        print(f"  🔊 SFX 생성 중: {SELECTED_SFX}")
        story_files_sfx = sorted(glob.glob("story_*.png"))
        story_count = len(story_files_sfx)
        if story_count > 0:
            slide_dur = (FIXED_DURATION - hook_dur) / max(story_count, 1)
            for sfx_type in SELECTED_SFX:
                sfx_dur = 3.0 if sfx_type == 'heartbeat' else 2.5
                sfx_clip = generate_sfx(sfx_type, duration=sfx_dur)
                if sfx_clip:
                    insert_points = [hook_dur + 0.3]
                    mid = story_count // 2
                    if mid > 0:
                        insert_points.append(hook_dur + mid * slide_dur)
                    if story_count > 2:
                        insert_points.append(hook_dur + (story_count - 2) * slide_dur)
                    for pt in insert_points:
                        try:
                            sfx_audio_clips.append(sfx_clip.volumex(0.55).set_start(pt))
                        except: pass
        print("  ✅ SFX 믹싱 완료")
    
    final_audio = CompositeAudioClip(sfx_audio_clips)
    final_video = final_video.set_audio(final_audio)

    subtitle_clips = []
    if os.path.exists("${subtitleFilename}"):
        def create_pill_sub(txt, dur):
            W, H = TARGET_W, 300
            f_p = "SpoqaHanSansJPBold.ttf" if os.path.exists("SpoqaHanSansJPBold.ttf") else "arial.ttf"
            try: font = ImageFont.truetype(f_p, 60)
            except: font = ImageFont.load_default()
            clean_txt = txt.replace('\\n', ' ').strip()
            
            # 자간(Letter Spacing) 및 자평(Horizontal Scale) 적용하여 글자별 렌더링
            char_imgs = []
            total_tw = 0
            for char in clean_txt:
                c_bbox = ImageDraw.Draw(Image.new('RGBA', (1,1))).textbbox((0,0), char, font=font)
                cw, ch = c_bbox[2]-c_bbox[0], c_bbox[3]-c_bbox[1]
                if cw == 0: cw = 20 # 공백 처리
                
                # 자평 90% (가로 너비 축소)
                new_cw = max(1, int(cw * 0.9))
                # 텍스트 여유 공간 포함 서피스 생성
                c_surf = Image.new('RGBA', (cw, ch + 40), (0,0,0,0))
                ImageDraw.Draw(c_surf).text((0, 10), char, font=font, fill='#FFD700')
                # 가로 압축 리사이즈
                c_surf = c_surf.resize((new_cw, ch + 40), Image.LANCZOS)
                
                char_imgs.append((c_surf, total_tw))
                # 자간 최소화 (다음 글자와의 간격을 90%로 설정하여 사이를 좁힘)
                total_tw += int(new_cw * 0.92)
            
            img = Image.new('RGBA', (W, H), (0,0,0,0))
            draw = ImageDraw.Draw(img)
            # 배경 캡슐 (압축된 전체 너비 기준)
            pad_x, pad_y = 55, 35
            max_h = 65
            rect = [(W-total_tw)//2 - pad_x, (H-max_h)//2 - pad_y, (W+total_tw)//2 + pad_x, (H+max_h)//2 + pad_y]
            try: draw.rounded_rectangle(rect, radius=60, fill=(0,0,0,170))
            except: draw.rectangle(rect, fill=(0,0,0,170))
            
            # 글자 배치
            start_x = (W - total_tw) // 2
            for c_img, x_off in char_imgs:
                img.paste(c_img, (start_x + x_off, (H - c_img.height)//2), c_img)
                
            return ImageClip(np.array(img)).set_duration(dur)

        try:
            with open("${subtitleFilename}", 'r', encoding='utf-8') as f: content = f.read().strip()
            blocks = re.split(r'\\n\\n+', content)
            for b in blocks:
                lines = b.strip().split('\\n')
                if len(lines)>=2 and '-->' in lines[1]:
                    times = lines[1].split(' --> ')
                    s = int(times[0][:2])*3600 + int(times[0][3:5])*60 + float(times[0].replace(',','.')[6:])
                    e = int(times[1][:2])*3600 + int(times[1][3:5])*60 + float(times[1].replace(',','.')[6:])
                    sub = create_pill_sub("\\n".join(lines[2:]), e-s)
                    if sub:
                        sub = sub.set_start(s + voice_start).set_position(('center', 0.75), relative=True)
                        subtitle_clips.append(sub)
        except: pass

    # ===== 구독/좋아요 유도 자막 (영상 마지막 174~179초) =====
    try:
        CTA_START = 174.0   # 나레이션 종료 직후
        CTA_END   = FIXED_DURATION  # 179초
        cta_dur   = CTA_END - CTA_START  # 5초

        CW, CH = TARGET_W, 320
        cta_img = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        draw_c  = ImageDraw.Draw(cta_img)

        # 배경 반투명 박스
        try: draw_c.rounded_rectangle([40, 30, CW-40, CH-30], radius=36, fill=(0, 0, 0, 185))
        except: draw_c.rectangle([40, 30, CW-40, CH-30], fill=(0, 0, 0, 185))

        # 폰트 설정
        try:
            font_cta_main = ImageFont.truetype(font_path, 46)
            font_cta_sub  = ImageFont.truetype(font_path, 36)
        except:
            font_cta_main = font_cta_sub = ImageFont.load_default()

        # 1행 - 메인 문구
        line1 = "面白いお話をもっと聞きたい方は"
        bbox1 = draw_c.textbbox((0, 0), line1, font=font_cta_main)
        w1 = bbox1[2] - bbox1[0]
        draw_c.text(((CW - w1) // 2, 55), line1, font=font_cta_main, fill=(255, 255, 255, 240))

        # 2행 - 강조 문구
        line2 = "チャンネル登録と👍いいねを"
        bbox2 = draw_c.textbbox((0, 0), line2, font=font_cta_main)
        w2 = bbox2[2] - bbox2[0]
        draw_c.text(((CW - w2) // 2, 115), line2, font=font_cta_main, fill=(255, 220, 60, 255))

        # 3행 - 정중한 마무리
        line3 = "よろしくお願いいたします 🙏"
        bbox3 = draw_c.textbbox((0, 0), line3, font=font_cta_sub)
        w3 = bbox3[2] - bbox3[0]
        draw_c.text(((CW - w3) // 2, 178), line3, font=font_cta_sub, fill=(200, 230, 255, 220))

        cta_clip = (
            ImageClip(np.array(cta_img))
            .set_duration(cta_dur)
            .set_start(CTA_START)
            .set_position(("center", 0.72), relative=True)
            .crossfadein(0.8)
            .crossfadeout(1.0)
        )
        subtitle_clips.append(cta_clip)
        print(f"  ✅ 구독 유도 자막 추가 ({CTA_START}초 ~ {CTA_END}초)")
    except Exception as e:
        print(f"  ⚠️ 구독 유도 자막 실패: {e}")

    print("💾 High-Quality Encoding Starting (V39.0 - 59sec Shorts)...")
    # ★ 59초 고정 + 마지막 4초 페이드아웃 (YouTube Shorts 최적화)
    final = CompositeVideoClip([final_video] + subtitle_clips).set_duration(FIXED_DURATION)
    final = final.subclip(0, FIXED_DURATION)               # 59초로 강제 자름
    final = final.fadeout(FADEOUT_DUR)                     # 영상 마지막 4초 페이드아웃
    if final.audio:
        final = final.set_audio(final.audio.audio_fadeout(FADEOUT_DUR))  # 오디오도 페이드아웃
    final.write_videofile("final_output.mp4", fps=24, codec='libx264', audio_codec='aac', threads=4, preset='ultrafast')

    print("\\n" + "="*60)
    print("✅ MASTER RENDER COMPLETE (V38.0)")
    print("📁 final_output.mp4  - 최종 영상")
    print(f"🔊 SFX 음향효과     - {SELECTED_SFX}")
    print(f"🎬 훅 타이틀        - {HOOK_TEXT}")
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\\n" + "!"*60)
        print("❌ CRITICAL ERROR")
        print(f"Error Details: {e}")
        print("-"*60)
        traceback.print_exc()
        print("!"*60)
    finally:
        print("\\n" + "="*60)
        input("창을 닫으려면 엔터를 누르세요 (Press Enter to close)...")
`;

    const handleZip = async () => {
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const root = zip.folder("production_kit")!;

            // File Name Safe Title
            const safeTitle = (plan.title_ja || "shorts_video").replace(/[\\/:*?"<>|]/g, "_").trim();
            const finalizedRenderScript = renderScriptContent.replace("final_output.mp4", `${safeTitle}.mp4`);

            // 1. YouTube Metadata Generation
            const metadataContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 YOUTUBE SHORTS METADATA (Algorithm Optimized)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] TITLE (Filename)
👉 ${plan.title_ja}

[2] DESCRIPTION
${plan.description_ja}

[3] HASHTAGS
${plan.tags.slice(0, 5).map(t => `#${t.replace(/\s+/g, '')}`).join(' ')} #shorts #mystery #japan

[4] SEARCH TAGS
${plan.tags.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 TIP: 이 파일의 내용을 복사하여 유튜브 스튜디오에 붙여넣으세요.
영상의 파일명도 이미 [${safeTitle}.mp4]로 설정되어 알고리즘 점수에 가산점이 붙습니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            root.file("youtube_metadata.txt", metadataContent);

            if (plan.audioBase64) {
                const wavData = getWavBytes(plan.audioBase64, 24000);
                const pcmLength = wavData.length - 44;
                const audioDuration = pcmLength / 48000;
                root.file("narration.wav", wavData);
                // 선택 언어 스크립트로 자막 생성
                root.file(subtitleFilename, generateSRT(narrationScript, audioDuration));
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
            root.file("render.py", finalizedRenderScript);
            if (userBgm) root.file(`bgm.${userBgm.name.split('.').pop()}`, userBgm);
            root.file("README.txt", "1. pip install moviepy==1.0.3 pillow numpy\n2. python render.py\n\nYouTube 알고리즘 최적화 데이터가 포함되어 있습니다.");

            const blob = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `Production_Kit_${safeTitle}.zip`;
            a.click();
        } catch (error) {
            console.error("Zipping Error:", error);
        } finally {
            setIsZipping(false);
        }
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
