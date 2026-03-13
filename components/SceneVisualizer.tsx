
import React from 'react';

interface SceneVisualizerProps {
  scriptJa: string;
}

const SCENES = [
  { id: 'interrupt', label: '⚡ 패턴 인터럽트', range: '0~3초', color: '#FF2020', bg: '#2D0808', maxChars: 30, desc: '가장 무서운 장면으로 시작' },
  { id: 'setup',     label: '🎭 세계관 구축',   range: '3~25초', color: '#FF8800', bg: '#2A1500', maxChars: 120, desc: '현재형 서사, 장소·이름 구체화' },
  { id: 'escalate',  label: '📈 공포 에스컬레이션', range: '25~55초', color: '#FFCC00', bg: '#2A2000', maxChars: 180, desc: '짧은 문장, 3번의 공포 상승' },
  { id: 'twist',     label: '🌪 예상 외 반전',  range: '55~75초', color: '#AA44FF', bg: '#1A0A2A', maxChars: 100, desc: '예상 뒤집기 — 2회차 루프 유도' },
  { id: 'loop',      label: '🔁 루프 트리거',   range: '75~90초', color: '#22DDBB', bg: '#081A16', maxChars: 80,  desc: '"처음을 다시 보세요" + 댓글 유도' },
];

export const SceneVisualizer: React.FC<SceneVisualizerProps> = ({ scriptJa }) => {
  const totalChars = scriptJa.length;
  if (!totalChars) return null;

  // 각 씬에 글자 수 배분 (비율 기반)
  const ratios = [30, 120, 180, 100, 80];
  const totalRatio = ratios.reduce((a, b) => a + b, 0);
  let pos = 0;
  const segments = SCENES.map((scene, i) => {
    const charCount = Math.round((ratios[i] / totalRatio) * totalChars);
    const text = scriptJa.slice(pos, pos + charCount);
    pos += charCount;
    return { ...scene, text, charCount, actualChars: text.length };
  });

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Script Scene Breakdown — 알고리즘 최적 구조 분석
      </p>

      {/* 진행 바 */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
        {segments.map(s => (
          <div
            key={s.id}
            style={{ backgroundColor: s.color, flex: s.maxChars }}
            className="rounded-full opacity-80"
          />
        ))}
      </div>

      {/* 씬별 상세 */}
      {segments.map((scene, idx) => {
        const utilPct = Math.min(100, Math.round((scene.actualChars / scene.maxChars) * 100));
        const isOver = scene.actualChars > scene.maxChars;
        return (
          <div key={scene.id}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: scene.color + '40', backgroundColor: scene.bg }}>
            <div className="flex items-center gap-3 px-4 py-2.5">
              {/* 씬 번호 */}
              <span className="text-[9px] font-black w-4 text-center"
                style={{ color: scene.color }}>{idx + 1}</span>
              {/* 레이블 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black" style={{ color: scene.color }}>{scene.label}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: scene.color + '20', color: scene.color }}>
                    {scene.range}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">{scene.desc}</span>
                </div>
                {/* 글자 채움 바 */}
                <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${utilPct}%`,
                      backgroundColor: isOver ? '#FF4444' : scene.color,
                    }} />
                </div>
              </div>
              {/* 글자 수 */}
              <span className={`text-[10px] font-black shrink-0 ${isOver ? 'text-red-400' : ''}`}
                style={!isOver ? { color: scene.color } : {}}>
                {scene.actualChars}<span className="text-slate-600 font-medium">/{scene.maxChars}자</span>
              </span>
            </div>

            {/* 해당 구간 텍스트 미리보기 */}
            {scene.text && (
              <div className="px-4 pb-3">
                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 font-serif-jp leading-relaxed">
                  {scene.text}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[9px] text-slate-600 font-bold text-center pt-1">
        총 {totalChars}자 · 목표: 500~550자
        {totalChars < 450 && <span className="text-amber-500 ml-2">⚠️ 스크립트가 짧습니다</span>}
        {totalChars > 600 && <span className="text-red-500 ml-2">⚠️ 스크립트가 깁니다</span>}
        {totalChars >= 450 && totalChars <= 600 && <span className="text-emerald-500 ml-2">✅ 최적 길이</span>}
      </p>
    </div>
  );
};

export default SceneVisualizer;
