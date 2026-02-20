import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { HealingPlan } from '../types';

let ffmpeg: FFmpeg | null = null;

export interface RenderProgress {
    stage: string;
    progress: number;
    message: string;
}

export async function initFFmpeg(onProgress?: (progress: RenderProgress) => void): Promise<FFmpeg> {
    if (ffmpeg) return ffmpeg;

    onProgress?.({ stage: 'init', progress: 0, message: 'FFmpeg 초기화 중...' });

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
        onProgress?.({
            stage: 'encoding',
            progress: Math.round(progress * 100),
            message: `인코딩 중... ${Math.round(progress * 100)}%`
        });
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    onProgress?.({ stage: 'init', progress: 100, message: 'FFmpeg 준비 완료' });

    return ffmpeg;
}

async function generateSubtitleImage(
    text: string,
    width: number,
    height: number
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 투명 배경
    ctx.clearRect(0, 0, width, height);

    // 텍스트 스타일
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 줄바꿈 처리
    const lines = text.length > 14 ? [text.slice(0, 14), text.slice(14)] : [text];
    const lineHeight = 85;
    const startY = height * 0.72;

    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);

        // 검은 외곽선 (여러 번 그려서 두껍게)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.strokeText(line, width / 2, y);

        // 골드 텍스트
        ctx.fillStyle = '#FFD700';
        ctx.fillText(line, width / 2, y);
    });

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
}

function parseSRT(srtContent: string): Array<{ start: number, end: number, text: string }> {
    const blocks = srtContent.trim().split(/\n\n+/);
    const subtitles: Array<{ start: number, end: number, text: string }> = [];

    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length < 3) continue;

        const timeLine = lines[1];
        const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);

        if (match) {
            const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
            const end = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
            const text = lines.slice(2).join(' ');

            subtitles.push({ start, end, text });
        }
    }

    return subtitles;
}

export async function renderVideo(
    plan: HealingPlan,
    userBgm: File | null,
    onProgress?: (progress: RenderProgress) => void
): Promise<Blob> {

    onProgress?.({ stage: 'init', progress: 0, message: 'FFmpeg 로딩 중...' });

    const ff = await initFFmpeg(onProgress);

    onProgress?.({ stage: 'prepare', progress: 10, message: '에셋 준비 중...' });

    // 이미지들을 FFmpeg 가상 파일시스템에 쓰기
    const images = plan.storyImageUrls || [];

    for (let i = 0; i < images.length; i++) {
        onProgress?.({
            stage: 'prepare',
            progress: 10 + (i / images.length) * 20,
            message: `이미지 로딩 중... ${i + 1}/${images.length}`
        });

        const imageData = await fetchFile(images[i]);
        await ff.writeFile(`image_${i}.png`, imageData);
    }

    // 후크 이미지
    if (plan.hookImageUrl) {
        onProgress?.({ stage: 'prepare', progress: 30, message: '후크 이미지 로딩 중...' });
        const hookData = await fetchFile(plan.hookImageUrl);
        await ff.writeFile('hook.png', hookData);
    }

    // 오디오
    if (plan.audioBase64) {
        onProgress?.({ stage: 'prepare', progress: 35, message: '오디오 변환 중...' });

        // Base64를 WAV로 변환
        const audioBlob = await base64ToWav(plan.audioBase64);
        await ff.writeFile('narration.wav', await fetchFile(audioBlob));
    }

    // BGM
    if (userBgm) {
        onProgress?.({ stage: 'prepare', progress: 40, message: 'BGM 로딩 중...' });
        await ff.writeFile('bgm.mp3', await fetchFile(userBgm));
    }

    onProgress?.({ stage: 'render', progress: 45, message: '영상 합성 시작...' });

    // FFmpeg 명령어 (간소화 버전)
    // 실제로는 매우 복잡하므로, 기본적인 슬라이드쇼만 구현

    const duration = images.length > 0 ? 172 / images.length : 10;

    // 이미지를 비디오로 변환
    const commands: string[] = [];

    for (let i = 0; i < images.length; i++) {
        commands.push(
            '-loop', '1',
            '-t', duration.toString(),
            '-i', `image_${i}.png`
        );
    }

    // 간단한 concat
    commands.push(
        '-filter_complex',
        images.map((_, i) => `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=24[v${i}]`).join(';') +
        ';' + images.map((_, i) => `[v${i}]`).join('') + `concat=n=${images.length}:v=1:a=0[outv]`,
        '-map', '[outv]',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-t', '179',
        'output.mp4'
    );

    onProgress?.({ stage: 'render', progress: 50, message: '영상 렌더링 중... (이 작업은 시간이 걸립니다)' });

    await ff.exec(commands);

    onProgress?.({ stage: 'complete', progress: 100, message: '렌더링 완료!' });

    const data = await ff.readFile('output.mp4');
    return new Blob([data as any], { type: 'video/mp4' });
}

function base64ToWav(base64Data: string): Promise<Blob> {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // WAV 헤더 추가 (간소화)
    const pcmData = new Int16Array(bytes.buffer);
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const totalLength = 44 + bytes.length;

    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, bytes.length, true);

    const full = new Uint8Array(totalLength);
    full.set(new Uint8Array(buffer, 0, 44));
    full.set(bytes, 44);

    return Promise.resolve(new Blob([full], { type: 'audio/wav' }));
}
