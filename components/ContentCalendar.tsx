
import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, Zap } from 'lucide-react';

interface ScheduledVideo {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM JST
  title: string;
  status: 'scheduled' | 'uploaded';
}

interface ContentCalendarProps {
  scheduledVideos?: ScheduledVideo[];
  onSchedule?: (date: string, time: string) => void;
}

// 최적 업로드 슬롯 (JST 기준, 요일: 0=일,1=월,...,6=토)
const OPTIMAL_SLOTS: Record<number, { time: string; label: string; score: number }[]> = {
  3: [{ time: '21:00', label: '🔥 최강 슬롯', score: 5 }],  // 수
  4: [{ time: '21:00', label: '🔥 최강 슬롯', score: 5 }],  // 목
  5: [{ time: '22:00', label: '⭐ 추천',      score: 4 }],  // 금
  6: [{ time: '14:00', label: '⭐ 추천',      score: 4 }],  // 토
  0: [{ time: '20:00', label: '👍 양호',       score: 3 }],  // 일
  1: [{ time: '21:00', label: '🕐 보통',       score: 2 }],  // 월
  2: [{ time: '21:00', label: '🕐 보통',       score: 2 }],  // 화
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ scheduledVideos = [], onSchedule }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const formatDate = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getSlotForDay = (dayOfWeek: number) => OPTIMAL_SLOTS[dayOfWeek]?.[0];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isToday = (d: number) => {
    const t = today;
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === d;
  };

  const isPast = (d: number) => {
    const date = new Date(viewYear, viewMonth, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const getVideoOnDate = (dateStr: string) =>
    scheduledVideos.find(v => v.date === dateStr);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6주 채우기
  while (cells.length % 7 !== 0) cells.push(null);

  const selDateObj = selectedDate ? new Date(selectedDate) : null;
  const selDayOfWeek = selDateObj ? selDateObj.getDay() : -1;
  const selSlot = selDayOfWeek >= 0 ? getSlotForDay(selDayOfWeek) : null;

  return (
    <div className="bg-[#0D0D1A] border border-[#1E1E2C] rounded-3xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-950 to-purple-950 p-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-900 rounded-xl">
          <Calendar size={18} className="text-indigo-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-black text-sm">콘텐츠 캘린더</h3>
          <p className="text-indigo-300 text-[10px] font-bold">최적 업로드 슬롯 자동 하이라이트 (JST)</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
            <ChevronLeft size={14} className="text-indigo-300" />
          </button>
          <span className="text-white font-black text-sm px-2">
            {viewYear}년 {MONTH_LABELS[viewMonth]}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
            <ChevronRight size={14} className="text-indigo-300" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-[#1E1E2C]">
        {DAY_LABELS.map((d, i) => {
          const slot = getSlotForDay(i);
          return (
            <div key={d} className={`py-2 text-center text-[10px] font-black border-r border-[#1E1E2C] last:border-r-0 ${
              slot && slot.score >= 4 ? 'text-red-400 bg-red-950/20' :
              slot && slot.score >= 3 ? 'text-amber-400 bg-amber-950/20' :
              'text-slate-500'
            }`}>
              {d}
              {slot && slot.score >= 4 && <div className="text-[7px] font-black text-red-500">{slot.time}</div>}
            </div>
          );
        })}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return (
            <div key={`empty-${idx}`} className="h-14 border-r border-b border-[#1E1E2C] last:border-r-0 bg-[#08080F]" />
          );

          const dateStr = formatDate(day);
          const dayOfWeek = (firstDay + day - 1) % 7;
          const slot = getSlotForDay(dayOfWeek);
          const video = getVideoOnDate(dateStr);
          const isSelected = selectedDate === dateStr;
          const past = isPast(day);

          return (
            <button
              key={day}
              onClick={() => !past && setSelectedDate(isSelected ? null : dateStr)}
              className={`h-14 border-r border-b border-[#1E1E2C] last:border-r-0 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-all relative
                ${past ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-950/40 cursor-pointer'}
                ${isToday(day) ? 'bg-indigo-950/30' : ''}
                ${isSelected ? 'bg-red-950/40 ring-1 ring-red-600 ring-inset' : ''}
                ${slot && slot.score >= 4 && !past ? 'bg-red-950/10' : ''}
              `}
            >
              <span className={`text-[11px] font-black leading-none ${
                isToday(day) ? 'text-indigo-300' :
                slot && slot.score >= 4 ? 'text-red-400' :
                slot && slot.score >= 3 ? 'text-amber-400' :
                'text-slate-400'
              }`}>{day}</span>

              {/* 최강 슬롯 표시 */}
              {slot && slot.score >= 4 && !past && (
                <span className="text-[7px] font-black text-red-500">{slot.time}</span>
              )}

              {/* 예약된 영상 */}
              {video && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  video.status === 'uploaded' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <div className="p-4 border-t border-[#1E1E2C] bg-[#0E0E1A]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-950 rounded-xl shrink-0">
              <Clock size={14} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-white mb-1">{selectedDate.replace(/-/g, '/')} 업로드 분석</p>
              {selSlot ? (
                <>
                  <p className="text-[11px] font-bold" style={{ color: selSlot.score >= 4 ? '#FF4444' : '#FFAA22' }}>
                    {selSlot.label} — 권장 업로드: {selSlot.time} JST
                  </p>
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < selSlot.score ? 'bg-red-500' : 'bg-[#2A1A1A]'}`} />
                    ))}
                    <span className="text-[9px] text-slate-500 ml-2 font-bold">{selSlot.score}/5점</span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 font-bold">이 요일은 알고리즘 피크 타임이 아닙니다</p>
              )}
              {onSchedule && selSlot && (
                <button
                  onClick={() => onSchedule(selectedDate, selSlot.time)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/70 text-red-300 rounded-xl text-[10px] font-black border border-red-900 transition-all"
                >
                  <Zap size={10} /> 이 슬롯에 업로드 예약
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="px-4 pb-4 pt-2 flex flex-wrap gap-3">
        {[
          { color: 'bg-red-500', label: '🔥 최강 슬롯 (수/목 21:00)' },
          { color: 'bg-amber-500', label: '⭐ 추천 (금 22:00 / 토 14:00)' },
          { color: 'bg-emerald-500', label: '✅ 업로드 완료' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[9px] text-slate-500 font-bold">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentCalendar;
