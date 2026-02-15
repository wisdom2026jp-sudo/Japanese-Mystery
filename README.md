# 🎬 Healing Shorts Auto-Gen - Professional Edition

일본 미스테리/힐링 쇼츠 자동 생성 플랫폼 (한일 동시 생성)

## ✨ 주요 기능

### 1. **AI 콘텐츠 생성**
- **Gemini 3 Pro**: 스크립트 및 기획 자동 생성
- **Imagen 3**: 2K 고화질 이미지 생성 (9:16 세로)
- **Gemini TTS**: 일본어 자연스러운 음성 생성 (Puck Voice)
- **Veo 3.1**: AI 영상 생성 (후크/인트로 영상)

### 2. **4가지 페르소나**
1. **성공의 자극** (Success) - 동기부여 및 성공학
2. **도시전설의 진실** (Mystery) - 호기심과 충격적 진상
3. **폭소 스낵** (Comedy) - 공감 일상 유머
4. **한밤중의 힐링** (Healing) - 위로와 감성 콘텐츠

### 3. **시각 효과**
- 🌙 **나이트비전**: 어두운 공포 분위기
- 🎯 **트래킹**: 목표 추적 효과
- ⚡ **지터 효과**: 필름 흔들림 효과

### 4. **프로덕션 키트 내보내기**
- Python MoviePy 기반 렌더링 스크립트
- 자막 SRT 파일 자동 생성
- 이미지/오디오/영상 일괄 다운로드

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- Gemini API Key (Google AI Studio)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. API 키 설정
# .env.local 파일에 다음 내용 추가:
GEMINI_API_KEY=your_api_key_here

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📖 사용 방법

### 1단계: 페르소나 선택
- 4가지 콘텐츠 타입 중 선택
- 일본 미스테리 프리셋 활용 가능

### 2단계: 주제 입력
- 한글 또는 일어로 주제 입력
- AI가 자동으로 기획안 생성

### 3단계: 시각 효과 선택
- 나이트비전, 트래킹, 지터 중 선택
- 여러 효과 동시 적용 가능

### 4단계: AI 생성
- "AI GENERATE" 버튼 클릭
- 스크립트 → 이미지 → 오디오 순차 생성

### 5단계: 프로덕션 키트 다운로드
1. 후크 영상 생성 (Veo 3.1)
2. BGM 파일 업로드
3. "DOWNLOAD MASTER PRODUCTION KIT" 클릭
4. `python render.py` 실행하여 최종 영상 렌더링

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (Gemini 3 Pro, Imagen 3, Veo 3.1)
- **Export**: MoviePy (Python)

## 📊 프로젝트 구조

```
AutoGen_Pro/
├── components/          # React 컴포넌트
│   ├── ScriptCard.tsx   # 스크립트 카드
│   ├── VideoPreview.tsx # 비디오 프리뷰
│   └── PythonExport.tsx # 내보내기 컴포넌트
├── services/           
│   └── geminiService.ts # Gemini API 통합
├── App.tsx             # 메인 애플리케이션
├── index.css           # 글로벌 스타일
├── types.ts            # TypeScript 타입 정의
└── .env.local          # 환경 변수 (API 키)
```

## 🔧 보완 사항 (2026-02-15)

### ✅ 완료된 개선사항
1. **CSS 파일 추가**
   - 커스텀 스크롤바
   - 애니메이션 효과
   - 반응형 디자인

2. **에러 처리 개선**
   - API 키 누락 감지
   - 할당량 초과 재시도 로직
   - 사용자 친화적 에러 메시지

3. **코드 품질**
   - 타입 안전성 강화
   - 중복 코드 제거
   - 주석 추가

### 📝 향후 개선 계획
- [ ] 다국어 지원 확대 (영어, 중국어, 아랍어)
- [ ] 템플릿 라이브러리 추가
- [ ] 배치 생성 기능
- [ ] 클라우드 스토리지 연동

## 🐛 알려진 이슈

### TypeScript 경고
- `@types/node` 설치 필요 (개발 환경에만 영향)
- 해결: `npm install --save-dev @types/node`

### API 제한
- Gemini API 무료 플랜: 1분당 15회 요청 제한
- Veo 영상 생성: Beta 단계로 가용성 제한적

## 📄 라이선스

이 프로젝트는 AI Studio 템플릿을 기반으로 개발되었습니다.

## 🙋 지원

문제가 발생하면 다음을 확인하세요:
1. `.env.local` 파일에 API 키가 올바르게 설정되었는지 확인
2. Node.js 버전이 18 이상인지 확인
3. 의존성이 모두 설치되었는지 확인 (`npm install`)

---

**Powered by Google Gemini 3 Pro & Veo 3.1**
