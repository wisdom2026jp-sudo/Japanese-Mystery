#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AutoGen Pro - Video Renderer v2.0 (자막 개선 버전)
일본 미스테리 Shorts 영상 렌더링 스크립트
"""

import os
import sys
from moviepy.editor import *
import re
import requests

print("=" * 60)
print("AutoGen Pro - Video Renderer v2.0")
print("자막 표시 개선 버전 - 2분45초까지 자막 표시")
print("=" * 60)
print()

# 설정
TARGET_WIDTH = 1080
TARGET_HEIGHT = 1920
FPS = 30
SUBTITLE_DURATION = 165  # 2분 45초 (자막/나레이션 길이)
VIDEO_DURATION = 179  # 2분 59초 (전체 영상)

# 자막 스타일
SUBTITLE_FONT_SIZE = 58
SUBTITLE_COLOR = 'yellow'
SUBTITLE_BG_COLOR = 'black'

def download_font():
    """일본어 폰트 다운로드"""
    font_path = "NotoSansJP-Bold.ttf"
    
    if os.path.exists(font_path):
        print(f"✅ 폰트 파일 있음: {font_path}")
        return font_path
    
    print("📥 일본어 폰트 다운로드 중...")
    try:
        url = "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            with open(font_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ 폰트 다운로드 완료")
            return font_path
        else:
            print("⚠️  폰트 다운로드 실패, 기본 폰트 사용")
            return None
    except:
        print("⚠️  폰트 다운로드 오류, 기본 폰트 사용")
        return None

def parse_srt(srt_path):
    """SRT 파일 파싱"""
    if not os.path.exists(srt_path):
        print(f"⚠️  자막 파일 없음: {srt_path}")
        return []
    
    print(f"📖 자막 파일 읽기: {srt_path}")
    
    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    subtitles = []
    blocks = content.strip().split('\n\n')
    
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3:
            continue
        
        try:
            time_line = lines[1]
            times = time_line.split(' --> ')
            if len(times) != 2:
                continue
            
            start_time, end_time = times[0].strip(), times[1].strip()
            text = '\n'.join(lines[2:]).strip()
            
            if not text:
                continue
            
            # 시간 변환: 00:00:01,500 -> 1.5
            def time_to_sec(t):
                t = t.replace(',', '.')
                parts = t.split(':')
                if len(parts) == 3:
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                return 0.0
            
            start = time_to_sec(start_time)
            end = time_to_sec(end_time)
            
            if start < end:
                subtitles.append({
                    'start': start,
                    'end': end,
                    'duration': end - start,
                    'text': text
                })
        
        except:
            continue
    
    print(f"  ✅ 자막 {len(subtitles)}개 파싱 완료")
    
    if subtitles:
        print(f"  📊 자막 범위: {subtitles[0]['start']:.1f}초 ~ {subtitles[-1]['end']:.1f}초")
    
    return subtitles

def create_subtitle_clips(subtitles, video_size, font_path=None):
    """자막 클립 생성 (MoviePy TextClip)"""
    clips = []
    
    if not subtitles:
        print("  ⚠️  자막 데이터 없음")
        return clips
    
    print(f"  🎬 자막 클립 {len(subtitles)}개 생성 중...")
    
    # 폰트 선택
    if font_path and os.path.exists(font_path):
        font = font_path
        print(f"  ✅ 폰트: {font_path}")
    else:
        # Windows 일본어 폰트 시도
        font = "C:\\Windows\\Fonts\\msgothic.ttc"
        if not os.path.exists(font):
            font = "Arial"
        print(f"  ⚠️  기본 폰트: {font}")
    
    for i, sub in enumerate(subtitles):
        try:
            # TextClip 생성
            txt = TextClip(
                sub['text'],
                fontsize=SUBTITLE_FONT_SIZE,
                color=SUBTITLE_COLOR,
                font=font,
                stroke_color=SUBTITLE_BG_COLOR,
                stroke_width=3,
                method='caption',
                size=(video_size[0] - 120, None),
                align='center'
            )
            
            # 타이밍 설정
            txt = txt.set_start(sub['start'])
            txt = txt.set_duration(sub['duration'])
            txt = txt.set_position(('center', video_size[1] - 280))
            
            clips.append(txt)
            
        except Exception as e:
            print(f"    ⚠️  자막 {i+1} 실패: {e}")
            # 간단한 버전으로 재시도
            try:
                simple = TextClip(
                    sub['text'][:40],
                    fontsize=SUBTITLE_FONT_SIZE,
                    color=SUBTITLE_COLOR
                ).set_start(sub['start']).set_duration(sub['duration']).set_position(('center', 1600))
                
                clips.append(simple)
            except:
                pass
    
    print(f"  ✅ 자막 클립 {len(clips)}개 생성 완료")
    return clips

def main():
    # 1. 파일 확인
    print("📁 Step 1: 파일 확인")
    
    files = {
        'bgm.mp3': os.path.exists('bgm.mp3'),
        'narration.wav': os.path.exists('narration.wav'),
        'subtitles_ja.srt': os.path.exists('subtitles_ja.srt'),
        'hook.mp4': os.path.exists('hook.mp4'),
        'hook.png': os.path.exists('hook.png')
    }
    
    for f, exists in files.items():
        print(f"  {'✅' if exists else '⚠️ '} {f}")
    
    story_images = [f"story_{i}.png" for i in range(15)]
    existing_images = [img for img in story_images if os.path.exists(img)]
    print(f"  ✅ 스토리 이미지: {len(existing_images)}/15개")
    
    if not existing_images:
        print("❌ 스토리 이미지가 없습니다!")
        sys.exit(1)
    
    print()
    
    # 2. 폰트
    print("📝 Step 2: 폰트 준비")
    font_path = download_font()
    print()
    
    # 3. 자막 파싱
    print("📖 Step 3: 자막 파싱")
    subtitles = parse_srt('subtitles_ja.srt')
    print()
    
    # 4. 영상 클립
    print("🎬 Step 4: 영상 클립 생성")
    
    clips = []
    hook_duration = 7
    
    # 후크
    if files['hook.mp4']:
        print("  🎥 후크 영상 로드")
        hook = VideoFileClip('hook.mp4').subclip(0, hook_duration)
        hook = hook.resize((TARGET_WIDTH, TARGET_HEIGHT))
        clips.append(hook)
    elif files['hook.png']:
        print("  🖼️  후크 이미지 로드")
        hook = ImageClip('hook.png', duration=hook_duration)
        hook = hook.resize((TARGET_WIDTH, TARGET_HEIGHT))
        clips.append(hook)
    else:
        print("  ⚠️  후크 없음, 첫 이미지 사용")
        hook = ImageClip(existing_images[0], duration=hook_duration)
        hook = hook.resize((TARGET_WIDTH, TARGET_HEIGHT))
        clips.append(hook)
    
    # 나레이션 길이 측정
    subtitle_end_time = SUBTITLE_DURATION
    if files['narration.wav']:
        try:
            temp_audio = AudioFileClip('narration.wav')
            subtitle_end_time = temp_audio.duration
            print(f"  🎙️  나레이션 길이감지: {subtitle_end_time:.1f}초")
            temp_audio.close()
        except:
            print("  ⚠️  나레이션 길이 측정 실패, 기본값 사용")

    # 스토리 이미지
    remaining = subtitle_end_time - hook_duration
    if remaining < 0: remaining = 10 # 안전장치
    
    img_duration = remaining / len(existing_images)
    
    print(f"  🖼️  스토리 이미지 {len(existing_images)}개 (각 {img_duration:.1f}초)")
    
    for img_path in existing_images:
        img = ImageClip(img_path, duration=img_duration)
        img = img.resize((TARGET_WIDTH, TARGET_HEIGHT))
        img = img.crossfadein(0.5).crossfadeout(0.5)
        clips.append(img)
    
    print()
    
    # 5. 영상 합치기
    print("🎞️  Step 5: 영상 합치기")
    final_video = concatenate_videoclips(clips, method="compose")
    
    # 전체 길이를 VIDEO_DURATION으로 늘림 (마지막 이미지 연장)
    if final_video.duration < VIDEO_DURATION:
        extension = VIDEO_DURATION - final_video.duration
        last_img = ImageClip(existing_images[-1], duration=extension)
        last_img = last_img.resize((TARGET_WIDTH, TARGET_HEIGHT))
        final_video = concatenate_videoclips([final_video, last_img], method="compose")
    
    print(f"  ✅ 영상 길이: {final_video.duration:.1f}초")
    print()
    
    # 6. 자막 추가 ⭐ 핵심!
    print("💬 Step 6: 자막 추가")
    if subtitles:
        subtitle_clips = create_subtitle_clips(
            subtitles,
            (TARGET_WIDTH, TARGET_HEIGHT),
            font_path
        )
        
        if subtitle_clips:
            final_video = CompositeVideoClip([final_video] + subtitle_clips)
            print(f"  ✅ 자막 {len(subtitle_clips)}개 추가됨")
        else:
            print("  ⚠️  자막 추가 실패")
    else:
        print("  ⚠️  자막 없음")
    print()
    
    # 7. 오디오
    print("🎵 Step 7: 오디오 추가")
    
    audio_clips = []
    
    if files['narration.wav']:
        print("  🎙️  나레이션 로드")
        narration = AudioFileClip('narration.wav')
        audio_clips.append(narration)
    
    if files['bgm.mp3']:
        print("  🎶 BGM 로드")
        bgm = AudioFileClip('bgm.mp3').volumex(0.25)
        
        # BGM 반복
        final_duration = max(VIDEO_DURATION, final_video.duration)
        if bgm.duration < final_duration:
            loops = int(final_duration / bgm.duration) + 1
            bgm = concatenate_audioclips([bgm] * loops)
        
        bgm = bgm.subclip(0, final_video.duration)
        audio_clips.append(bgm)
    
    if audio_clips:
        final_audio = CompositeAudioClip(audio_clips)
        final_video = final_video.set_audio(final_audio)
        print(f"  ✅ 오디오 {len(audio_clips)}개 추가")
    
    print()
    
    # 8. 렌더링
    print("🚀 Step 8: 최종 렌더링")
    print(f"  해상도: {TARGET_WIDTH}x{TARGET_HEIGHT}")
    print(f"  FPS: {FPS}")
    print(f"  자막 길이: {SUBTITLE_DURATION}초")
    print(f"  전체 길이: {VIDEO_DURATION}초")
    print()
    print("⏱️  렌더링 시작... (5-10분 소요)")
    print("=" * 60)
    
    try:
        final_video.write_videofile(
            'final_output.mp4',
            fps=FPS,
            codec='libx264',
            audio_codec='aac',
            preset='medium',
            threads=4,
            logger='bar'
        )
        
        print()
        print("=" * 60)
        print("✅ 렌더링 완료!")
        print("📁 파일: final_output.mp4")
        
        size = os.path.getsize('final_output.mp4') / (1024 * 1024)
        print(f"📊 크기: {size:.1f} MB")
        print("=" * 60)
        print()
        print("🎉 영상이 성공적으로 생성되었습니다!")
        print("🎬 final_output.mp4 파일을 확인하세요!")
        print()
        print("💡 자막은 0초 ~ 2분45초(165초)까지 표시됩니다")
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ 렌더링 오류: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        final_video.close()
        for clip in clips:
            clip.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  사용자 중단")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 오류: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
