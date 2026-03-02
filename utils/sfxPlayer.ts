/**
 * sfxPlayer.ts
 * Web Audio API를 사용하여 브라우저에서 공포 SFX를 실시간 합성·재생합니다.
 * render.py의 numpy generate_sfx() 로직을 JS로 포팅한 구현체입니다.
 */

import { SfxType } from '../types';

const SAMPLE_RATE = 44100;

/** 공유 AudioContext (첫 호출 시 생성) */
let _ctx: AudioContext | null = null;
function getCtx(): AudioContext {
    if (!_ctx || _ctx.state === 'closed') {
        _ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    return _ctx;
}

/** Float32Array PCM → AudioBuffer */
function pcmToBuffer(ctx: AudioContext, pcm: Float32Array): AudioBuffer {
    const buf = ctx.createBuffer(1, pcm.length, SAMPLE_RATE);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i];
    return buf;
}

/** AudioBuffer 즉시 재생 (gain 조절 가능) */
function playBuffer(ctx: AudioContext, buf: AudioBuffer, gainVal = 0.65): void {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime);
}

/** normalize Float32Array to -1.0 ~ 1.0 */
function normalize(arr: Float32Array): Float32Array {
    let max = 0;
    for (let i = 0; i < arr.length; i++) if (Math.abs(arr[i]) > max) max = Math.abs(arr[i]);
    if (max === 0) return arr;
    const out = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) out[i] = (arr[i] / max) * 0.7;
    return out;
}

// ─── 개별 SFX 합성 함수들 ──────────────────────────────────

function makeHorrorNoise(samples: number): Float32Array {
    const out = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / SAMPLE_RATE;
        const noise = (Math.random() * 2 - 1) * 0.3;
        const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.4 * Math.exp(-t * 0.8);
        out[i] = noise + rumble;
    }
    return normalize(out);
}

function makeHeartbeat(samples: number): Float32Array {
    const out = new Float32Array(samples);
    // 1초마다 더블 비트: 0.0, 0.25초 오프셋
    for (let beat = 0; beat * SAMPLE_RATE < samples; beat++) {
        for (const pulseOffset of [0.0, 0.25]) {
            const startSample = Math.round((beat + pulseOffset) * SAMPLE_RATE);
            const pulseDur = Math.round(0.18 * SAMPLE_RATE);
            for (let j = 0; j < pulseDur; j++) {
                const idx = startSample + j;
                if (idx >= samples) break;
                const t = j / SAMPLE_RATE;
                out[idx] += Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 18) * 0.8;
            }
        }
    }
    return normalize(out);
}

function makeTransitionWhoosh(samples: number): Float32Array {
    const out = new Float32Array(samples);
    let phase = 0;
    for (let i = 0; i < samples; i++) {
        const t = i / SAMPLE_RATE;
        const dur = samples / SAMPLE_RATE;
        // 주파수 300Hz → 40Hz 선형 스윕
        const freq = 300 - (300 - 40) * (t / dur);
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        out[i] = Math.sin(phase) * Math.exp(-t * 2.5) * 0.6;
    }
    return normalize(out);
}

function makeDeepRumble(samples: number): Float32Array {
    const out = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / SAMPLE_RATE;
        out[i] =
            Math.sin(2 * Math.PI * 30 * t) * 0.5 +
            Math.sin(2 * Math.PI * 55 * t) * 0.3 +
            (Math.random() * 2 - 1) * 0.05;
    }
    return normalize(out);
}

function makeStaticBurst(samples: number): Float32Array {
    const out = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const t = i / SAMPLE_RATE;
        out[i] = (Math.random() * 2 - 1) * 0.7 * Math.exp(-t * 4);
    }
    return normalize(out);
}

// ─── 공개 인터페이스 ──────────────────────────────────────

const SFX_DURATION: Record<SfxType, number> = {
    horror_noise: 2.5,
    heartbeat: 3.0,
    transition_whoosh: 2.0,
    deep_rumble: 2.5,
    static_burst: 1.5,
};

/**
 * 지정한 SFX 타입을 즉시 합성하여 재생합니다.
 * @param sfxType  재생할 SFX 종류
 */
export function playSfxPreview(sfxType: SfxType): void {
    try {
        const ctx = getCtx();
        // suspended 상태면 resume (브라우저 자동재생 정책)
        if (ctx.state === 'suspended') ctx.resume();

        const dur = SFX_DURATION[sfxType];
        const samples = Math.round(dur * SAMPLE_RATE);
        let pcm: Float32Array;

        switch (sfxType) {
            case 'horror_noise': pcm = makeHorrorNoise(samples); break;
            case 'heartbeat': pcm = makeHeartbeat(samples); break;
            case 'transition_whoosh': pcm = makeTransitionWhoosh(samples); break;
            case 'deep_rumble': pcm = makeDeepRumble(samples); break;
            case 'static_burst': pcm = makeStaticBurst(samples); break;
            default: return;
        }

        playBuffer(ctx, pcmToBuffer(ctx, pcm));
    } catch (e) {
        console.warn('[sfxPlayer] 재생 실패:', e);
    }
}
