
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Download, X, Type, Palette, AlignCenter, AlignLeft, AlignRight, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface ThumbnailEditorProps {
  hookImageUrl: string;
  titleJa: string;
  onClose: () => void;
}

type TextAlign = 'left' | 'center' | 'right';
type Layout = 'top' | 'middle' | 'bottom' | 'diagonal' | 'side-left';

const PRESETS: { label: string; color: string; stroke: string; bg: string }[] = [
  { label: '🔴 Horror Red', color: '#FF1111', stroke: '#FFFFFF', bg: 'rgba(0,0,0,0.75)' },
  { label: '⚪ Ghost White', color: '#FFFFFF', stroke: '#CC0000', bg: 'rgba(0,0,0,0.65)' },
  { label: '🟡 Warning Gold', color: '#FFD700', stroke: '#000000', bg: 'rgba(20,0,0,0.80)' },
  { label: '🟣 Sinister Purple', color: '#CC44FF', stroke: '#000000', bg: 'rgba(10,0,20,0.80)' },
  { label: '🩸 Blood Dark', color: '#FF3333', stroke: '#000000', bg: 'rgba(40,0,0,0.85)' },
];

const LAYOUTS: { label: string; value: Layout }[] = [
  { label: '상단 강조', value: 'top' },
  { label: '중앙', value: 'middle' },
  { label: '하단 강조', value: 'bottom' },
  { label: '대각선', value: 'diagonal' },
  { label: '좌측 세로', value: 'side-left' },
];

export const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({ hookImageUrl, titleJa, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(titleJa);
  const [fontSize, setFontSize] = useState(72);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [layout, setLayout] = useState<Layout>('bottom');
  const [align, setAlign] = useState<TextAlign>('center');
  const [showBg, setShowBg] = useState(true);
  const [mode, setMode] = useState<'16:9' | '9:16'>('16:9');
  const [imgLoaded, setImgLoaded] = useState(false);

  const W_16_9 = 1280, H_16_9 = 720;
  const W_9_16 = 720, H_9_16 = 1280;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = mode === '16:9' ? W_16_9 : W_9_16;
    const H = mode === '16:9' ? H_16_9 : H_9_16;
    canvas.width = W;
    canvas.height = H;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 배경 이미지 크롭 fill
      const scale = Math.max(W / img.width, H / img.height);
      const sw = W / scale, sh = H / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      // 어두운 그라디언트 오버레이
      const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 텍스트 그리기
      const preset = PRESETS[selectedPreset];
      const fs = mode === '9:16' ? Math.round(fontSize * 0.85) : fontSize;
      ctx.font = `900 ${fs}px "Noto Sans JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      const lines = wrapText(ctx, text, W - 80);
      const lineHeight = fs * 1.3;
      const totalH = lines.length * lineHeight;

      let baseY: number;
      let baseX: number;
      switch (layout) {
        case 'top': baseY = 80 + totalH / 2; break;
        case 'middle': baseY = H / 2 - totalH / 2 + lineHeight / 2; break;
        case 'bottom': baseY = H - 80 - totalH + lineHeight / 2; break;
        case 'diagonal': baseY = H * 0.65 - totalH / 2; break;
        case 'side-left': baseY = H / 2 - totalH / 2 + lineHeight / 2; break;
        default: baseY = H - 80;
      }
      switch (align) {
        case 'left': baseX = 60; break;
        case 'right': baseX = W - 60; break;
        default: baseX = W / 2;
      }

      lines.forEach((line, i) => {
        const y = baseY + i * lineHeight;
        if (showBg) {
          const metrics = ctx.measureText(line);
          const tw = metrics.width;
          let bx: number;
          if (align === 'center') bx = baseX - tw / 2 - 20;
          else if (align === 'left') bx = baseX - 20;
          else bx = baseX - tw - 20;
          ctx.fillStyle = preset.bg;
          roundRect(ctx, bx, y - fs * 0.65, tw + 40, fs * 1.3, 12);
          ctx.fill();
        }
        // 외곽선
        ctx.strokeStyle = preset.stroke;
        ctx.lineWidth = fs * 0.06;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, baseX, y);
        // 메인 텍스트
        ctx.fillStyle = preset.color;
        ctx.fillText(line, baseX, y);
      });

      setImgLoaded(true);
    };
    img.src = hookImageUrl;
  }, [hookImageUrl, text, fontSize, selectedPreset, layout, align, showBg, mode]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const wrapText = (ctx: CanvasRenderingContext2D, txt: string, maxW: number): string[] => {
    const words = txt.split('');
    const lines: string[] = [];
    let cur = '';
    for (const ch of words) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [txt];
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `thumbnail_${mode}_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[#0E0E1A] border border-[#2A1A1A] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-red-900 to-indigo-900 p-5 flex items-center gap-4 shrink-0">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Type size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-black text-lg">썸네일 텍스트 에디터</h2>
            <p className="text-red-200 text-xs font-bold">캔버스에서 직접 편집 → PNG 다운로드</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode(mode === '16:9' ? '9:16' : '16:9')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all border border-white/20">
              {mode === '16:9' ? '🖥 16:9 썸네일' : '📱 9:16 쇼츠'}
            </button>
            <button onClick={onClose} className="text-red-300 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 캔버스 미리보기 */}
          <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full rounded-xl shadow-2xl"
              style={{ objectFit: 'contain' }}
            />
          </div>

          {/* 오른쪽: 컨트롤 패널 */}
          <div className="w-72 bg-[#0D0D18] border-l border-[#2A1A1A] overflow-y-auto custom-scrollbar p-5 space-y-5 shrink-0">

            {/* 텍스트 입력 */}
            <div>
              <label className="block text-[10px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">📝 제목 텍스트</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] text-sm font-bold focus:border-red-700 outline-none resize-none"
              />
            </div>

            {/* 폰트 크기 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-[#6B4A4A] uppercase tracking-widest">📐 폰트 크기</label>
                <span className="text-[11px] font-black text-red-400">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setFontSize(Math.max(24, fontSize - 8))} className="p-1.5 bg-[#1A1A28] rounded-lg border border-[#2A2A3A] hover:border-red-700 transition-all"><ChevronDown size={14} className="text-slate-400" /></button>
                <input type="range" min={24} max={160} step={4} value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-red-600" />
                <button onClick={() => setFontSize(Math.min(160, fontSize + 8))} className="p-1.5 bg-[#1A1A28] rounded-lg border border-[#2A2A3A] hover:border-red-700 transition-all"><ChevronUp size={14} className="text-slate-400" /></button>
              </div>
            </div>

            {/* 컬러 프리셋 */}
            <div>
              <label className="block text-[10px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">🎨 컬러 프리셋</label>
              <div className="space-y-1.5">
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => setSelectedPreset(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selectedPreset === i ? 'border-red-600 bg-red-950/40' : 'border-[#2A2A3A] bg-[#12121E] hover:border-[#3A3A5A]'}`}>
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                    <span className="text-[#C0B0A0]">{p.label}</span>
                    {selectedPreset === i && <span className="ml-auto text-red-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 레이아웃 */}
            <div>
              <label className="block text-[10px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">📐 텍스트 위치</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LAYOUTS.map(l => (
                  <button key={l.value} onClick={() => setLayout(l.value)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${layout === l.value ? 'border-red-600 bg-red-950/40 text-red-400' : 'border-[#2A2A3A] bg-[#12121E] text-[#6B5A5A] hover:border-[#3A3A5A]'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-[10px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">↔ 텍스트 정렬</label>
              <div className="flex gap-2">
                {([['left', <AlignLeft size={14} />], ['center', <AlignCenter size={14} />], ['right', <AlignRight size={14} />]] as [TextAlign, React.ReactNode][]).map(([a, icon]) => (
                  <button key={a} onClick={() => setAlign(a)}
                    className={`flex-1 py-2 flex items-center justify-center rounded-xl border transition-all ${align === a ? 'border-red-600 bg-red-950/40 text-red-400' : 'border-[#2A2A3A] bg-[#12121E] text-[#6B5A5A] hover:border-[#3A3A5A]'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* 배경 박스 토글 */}
            <div>
              <button onClick={() => setShowBg(!showBg)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showBg ? 'border-indigo-600 bg-indigo-950/40 text-indigo-400' : 'border-[#2A2A3A] bg-[#12121E] text-[#6B5A5A]'}`}>
                <span className="text-xs font-black">🌑 텍스트 배경 박스</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${showBg ? 'bg-indigo-600 text-white' : 'bg-[#2A2A3A] text-[#6B5A5A]'}`}>{showBg ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* 새로고침 */}
            <button onClick={drawCanvas}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1A28] hover:bg-[#222238] border border-[#2A2A3A] hover:border-indigo-700 rounded-xl text-xs font-black text-[#8080C0] transition-all">
              <RefreshCw size={13} /> 미리보기 새로고침
            </button>

            {/* 다운로드 */}
            <button onClick={handleDownload}
              className="w-full py-4 bg-red-800 hover:bg-red-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/50 transition-all active:scale-[0.97]">
              <Download size={18} /> {mode} PNG 다운로드
            </button>

            <p className="text-[9px] text-[#3A2A2A] font-bold text-center">
              고해상도 {mode === '16:9' ? '1280×720' : '720×1280'} PNG로 저장됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
