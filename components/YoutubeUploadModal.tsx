import React, { useState, useRef } from 'react';
import {
    Youtube, Upload, Calendar, CheckCircle, Loader2,
    AlertCircle, LogIn, X, ExternalLink, Clock, Tag
} from 'lucide-react';
import { authorizeYouTube, uploadToYouTube, clearAccessToken } from '../services/youtubeUploadService';
import { HealingPlan } from '../types';

interface Props {
    plan: HealingPlan;
    onClose: () => void;
}

type UploadStatus = 'idle' | 'authorizing' | 'uploading' | 'done' | 'error';

const YoutubeUploadModal: React.FC<Props> = ({ plan, onClose }) => {
    const [token, setToken] = useState<string | null>(null);
    const [title, setTitle] = useState(plan.title_ja || '');
    const [description, setDescription] = useState(() => {
        const base = plan.description_ja || '';
        const hook = '\n\n━━━━━━━━━━━━━━━━━━━━━━\nあなたはこのような体験をしたことがありますか？\nコメントで教えてください👇\n\nチャンネル登録で続きの真相を公開予定です🔔';
        return base + hook;
    });
    const [tags, setTags] = useState((plan.tags || []).join(', '));
    const [file, setFile] = useState<File | null>(null);
    const [useSchedule, setUseSchedule] = useState(true);
    const [scheduleDate, setScheduleDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [scheduleTime, setScheduleTime] = useState('21:00');  // 최적 업로드 시간 JST 21:00
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    /* ── 구글 OAuth 인증 ── */
    const handleAuth = async () => {
        setStatus('authorizing');
        setError(null);
        try {
            const tok = await authorizeYouTube();
            setToken(tok);
            setStatus('idle');
        } catch (e: any) {
            setError(e.message);
            setStatus('error');
        }
    };

    const handleLogout = () => { clearAccessToken(); setToken(null); };

    /* ── 업로드 ── */
    const handleUpload = async () => {
        if (!file) { setError('영상 파일을 선택해주세요 (final_output.mp4)'); return; }

        let tok = token;
        if (!tok) {
            try {
                setStatus('authorizing');
                tok = await authorizeYouTube();
                setToken(tok);
            } catch (e: any) {
                setError(e.message); setStatus('error'); return;
            }
        }

        setStatus('uploading');
        setError(null);
        setProgress(0);

        try {
            let scheduledAt: Date | null = null;
            if (useSchedule && scheduleDate && scheduleTime) {
                scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00+09:00`);
                if (scheduledAt <= new Date()) {
                    setError('예약 시간은 현재 시간 이후여야 합니다.'); setStatus('error'); return;
                }
            }

            const id = await uploadToYouTube(
                file,
                {
                    title,
                    description: `${description}\n\n#閲覧注意 #都市伝説 #怖い話 #日本怪談 #Shorts`,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    scheduledAt,
                },
                setProgress,
                tok
            );

            setVideoId(id);
            setStatus('done');
        } catch (e: any) {
            setError(e.message);
            setStatus('error');
        }
    };

    const isWorking = status === 'uploading' || status === 'authorizing';
    const fileMB = file ? (file.size / 1024 / 1024).toFixed(1) : 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-[#0E0E1A] border border-[#2A1A1A] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* ── 헤더 ── */}
                <div className="bg-red-900 border-b border-red-800 p-6 flex items-center gap-4 shrink-0">
                    <div className="p-2.5 bg-white/10 rounded-xl">
                        <Youtube size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white font-black text-lg">YouTube 자동 업로드</h2>
                        <p className="text-red-200 text-xs font-bold">영상 파일 선택 후 즉시 또는 예약 게시</p>
                    </div>
                    <button onClick={onClose} disabled={isWorking}
                        className="text-red-300 hover:text-white transition-colors disabled:opacity-40">
                        <X size={22} />
                    </button>
                </div>

                {/* ── 스크롤 바디 ── */}
                <div className="overflow-y-auto custom-scrollbar p-6 space-y-5 flex-1">

                    {/* 인증 상태 */}
                    {!token ? (
                        <button onClick={handleAuth} disabled={status === 'authorizing'}
                            className="w-full py-3.5 bg-[#1A1A2A] border-2 border-[#3A4A8A] rounded-2xl flex items-center justify-center gap-3 text-[#8090F0] font-black hover:border-blue-500 hover:bg-[#1E1E35] transition-all disabled:opacity-50">
                            {status === 'authorizing'
                                ? <Loader2 size={18} className="animate-spin" />
                                : <LogIn size={18} />}
                            {status === 'authorizing' ? '구글 인증 중...' : 'Google 계정으로 로그인 (채널 연결)'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 py-2.5 px-4 bg-emerald-950/60 border border-emerald-800 rounded-xl">
                            <CheckCircle size={16} className="text-emerald-400" />
                            <span className="text-emerald-400 text-sm font-black flex-1">YouTube 채널 연결됨 ✅</span>
                            <button onClick={handleLogout} className="text-[#6B5A5A] hover:text-red-400 text-xs font-bold transition-colors">
                                로그아웃
                            </button>
                        </div>
                    )}

                    {/* 파일 선택 */}
                    <div>
                        <label className="block text-[11px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">
                            영상 파일 선택 (final_output.mp4)
                        </label>
                        <button onClick={() => fileRef.current?.click()} disabled={isWorking}
                            className={`w-full py-4 px-5 rounded-2xl border-2 border-dashed flex items-center gap-3 transition-all text-sm font-bold disabled:opacity-50
                ${file ? 'border-emerald-700 bg-emerald-950/30 text-emerald-400' : 'border-[#2A2A3A] bg-[#12121E] hover:border-red-700 text-[#8B7B6B]'}`}>
                            <Upload size={18} />
                            {file
                                ? `✅ ${file.name}  (${fileMB} MB)`
                                : 'render.py로 생성된 final_output.mp4 파일 선택'}
                        </button>
                        <input ref={fileRef} type="file" accept="video/*" className="hidden"
                            onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>

                    {/* 제목 */}
                    <div>
                        <label className="block text-[11px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">
                            제목 (자동 입력됨)
                        </label>
                        <input value={title} onChange={e => setTitle(e.target.value)} disabled={isWorking}
                            className="w-full px-4 py-3 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] font-bold text-sm focus:border-red-700 outline-none disabled:opacity-50"
                            placeholder="【閲覧注意】タイトル..." />
                        <p className="text-[9px] text-[#4A3A3A] font-bold mt-1">{title.length}/100자</p>
                    </div>

                    {/* 설명 */}
                    <div>
                        <label className="block text-[11px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2">
                            설명 (자동 입력됨)
                        </label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            disabled={isWorking} rows={4}
                            className="w-full px-4 py-3 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] font-bold text-sm focus:border-red-700 outline-none resize-none custom-scrollbar disabled:opacity-50" />
                    </div>

                    {/* 태그 */}
                    <div>
                        <label className="block text-[11px] font-black text-[#6B4A4A] uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Tag size={10} /> 태그 (AI 자동 생성 · 쉼표로 구분)
                        </label>
                        <textarea value={tags} onChange={e => setTags(e.target.value)}
                            disabled={isWorking} rows={2}
                            className="w-full px-4 py-3 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] font-bold text-xs focus:border-red-700 outline-none resize-none custom-scrollbar disabled:opacity-50" />
                    </div>

                    {/* 예약 토글 */}
                    <div className="p-4 bg-[#12121E] border border-[#1E1E2C] rounded-2xl space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <button onClick={() => setUseSchedule(v => !v)} disabled={isWorking}
                                className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${useSchedule ? 'bg-red-700' : 'bg-[#2A2A3A]'} disabled:opacity-40`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${useSchedule ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <div>
                                <p className="text-sm font-black text-[#C0B0A0] flex items-center gap-1.5">
                                    <Calendar size={13} />
                                    예약 게시 {useSchedule ? '켜짐' : '꺼짐 (즉시 공개)'}
                                </p>
                                <p className="text-[9px] text-[#4A3A3A] font-bold">오늘은 비공개로 저장, 설정 시간에 자동 공개</p>
                            </div>
                        </label>

                        {useSchedule && (
                            <div className="space-y-2">
                                {/* 날짜 */}
                                <input type="date" value={scheduleDate} min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setScheduleDate(e.target.value)} disabled={isWorking}
                                    className="w-full px-3 py-2.5 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] text-sm font-bold focus:border-red-700 outline-none disabled:opacity-50" />
                                {/* 시간 + JST */}
                                <div className="flex items-center gap-2">
                                    <select value={scheduleTime}
                                        onChange={e => setScheduleTime(e.target.value)} disabled={isWorking}
                                        className="flex-1 px-3 py-2.5 bg-[#0F0F1A] border-2 border-[#1E1E2C] rounded-xl text-[#E8DDD0] text-sm font-bold focus:border-red-700 outline-none disabled:opacity-50">
                                        {Array.from({ length: 24 }, (_, h) => {
                                            const hStr = String(h).padStart(2, '0');
                                            const label = h < 12 ? `오전 ${h === 0 ? 12 : h}:00` : `오후 ${h === 12 ? 12 : h - 12}:00`;
                                            return <option key={hStr} value={`${hStr}:00`}>{label}</option>;
                                        })}
                                    </select>
                                    <div className="flex items-center gap-1 text-[#6B5A5A] text-xs font-black shrink-0">
                                        <Clock size={12} /> JST
                                    </div>
                                </div>
                            </div>
                        )}

                        {useSchedule && scheduleDate && (
                            <p className="text-[10px] text-red-400 font-bold">
                                📅 {scheduleDate} {scheduleTime} JST에 자동 공개됩니다
                            </p>
                        )}

                        {/* 요일별 최적 업로드 배지 */}
                        <div className="pt-2 border-t border-[#1E1E2C]">
                            <p className="text-[9px] font-black text-[#4A3A3A] uppercase tracking-widest mb-2">알고리즘 최적 업로드 요일</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {[['월','보통'],['화','보통'],['수','최고'],['목','최고'],['금','보통'],['토','오후2시'],['일','오후2시']].map(([day, grade]) => (
                                    <span key={day} className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                                        grade === '최고' ? 'bg-amber-500 text-white' :
                                        grade === '오후2시' ? 'bg-blue-900/60 text-blue-300 border border-blue-800' :
                                        'bg-[#1A1A28] text-[#4A4A5A]'
                                    }`}>
                                        {day} {grade === '최고' ? '⭐' : grade === '오후2시' ? '🌅' : ''}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[8px] text-amber-400 font-bold mt-1.5">⭐ 수·목요일 21시 JST — 경쟁 낮고 알고리즘 노출 최대</p>
                        </div>
                    </div>

                    {/* 업로드 진행률 */}
                    {status === 'uploading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-[#8B7B6B]">
                                <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 유튜브에 업로드 중...</span>
                                <span className="text-red-400">{progress}%</span>
                            </div>
                            <div className="h-3 bg-[#1A1A28] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-900 to-red-600 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[9px] text-[#4A3A3A] font-bold text-center">창을 닫지 마세요</p>
                        </div>
                    )}

                    {/* 완료 */}
                    {status === 'done' && videoId && (
                        <div className="p-5 bg-emerald-950/40 border border-emerald-800 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
                                <CheckCircle size={24} /> 업로드 완료! 🎉
                            </div>
                            <p className="text-[#8B9B8B] text-sm font-bold">
                                {useSchedule ? `${scheduleDate} ${scheduleTime} JST에 자동 공개됩니다.` : '유튜브에 공개되었습니다!'}
                            </p>
                            <div className="flex gap-3">
                                <a href={`https://studio.youtube.com/video/${videoId}/edit`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex-1 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all">
                                    <ExternalLink size={14} /> YouTube Studio
                                </a>
                                <a href={`https://youtu.be/${videoId}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex-1 py-2.5 bg-[#1A1A2A] border border-[#3A3A5A] hover:border-blue-600 text-[#8090F0] rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all">
                                    <Youtube size={14} /> 영상 보기
                                </a>
                            </div>
                        </div>
                    )}

                    {/* 에러 */}
                    {error && status !== 'uploading' && (
                        <div className="p-4 bg-red-950/50 border border-red-900 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-black text-sm mb-1">오류 발생</p>
                                <p className="text-red-300/70 text-xs font-bold whitespace-pre-wrap">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 하단 버튼 ── */}
                <div className="p-6 border-t border-[#1E1E2C] shrink-0 space-y-3">
                    <button onClick={handleUpload}
                        disabled={!file || isWorking || status === 'done'}
                        className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all btn-mystery text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none">
                        {status === 'uploading'
                            ? <><Loader2 size={22} className="animate-spin" /> 업로드 중... ({progress}%)</>
                            : status === 'done'
                                ? <><CheckCircle size={22} /> 업로드 완료</>
                                : <><Youtube size={20} />
                                    <span className="text-center leading-tight">
                                        {useSchedule
                                            ? <>{scheduleDate}<br />{scheduleTime} JST 예약 업로드</>
                                            : '지금 바로 업로드'}
                                    </span>
                                </>}
                    </button>
                    <p className="text-[9px] text-[#3A2A2A] font-bold text-center">
                        Google Cloud Console → YouTube Data API v3 + OAuth 2.0 클라이언트 ID 필요
                    </p>
                </div>
            </div>
        </div>
    );
};

export default YoutubeUploadModal;
