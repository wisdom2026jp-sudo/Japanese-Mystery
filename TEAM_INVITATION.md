# 팀원 초대 및 공유 메시지

## 🔐 Step 1: GitHub에서 팀원 초대

1. 저장소 페이지 열기:
   https://github.com/leestar20251214-sys/Japan-Mystery

2. "Settings" 탭 클릭

3. 왼쪽 메뉴에서 "Collaborators" 클릭

4. "Add people" 버튼 클릭

5. 팀원의 GitHub 계정 입력:
   - GitHub 사용자명
   - 또는 이메일 주소

6. 권한 선택:
   - Write (추천) - 코드 수정 가능
   - Read - 읽기만 가능

7. "Add [사용자명] to this repository" 클릭

8. 팀원에게 이메일 초대 자동 발송!

---

## 📧 Step 2: 팀원에게 보낼 메시지

아래 메시지를 복사해서 팀원들에게 보내세요:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

안녕하세요! 👋

**AutoGen Pro** 프로젝트에 초대합니다!
일본 미스테리 YouTube Shorts를 AI로 자동 생성하는 플랫폼입니다.

## 📦 저장소 정보

**GitHub 저장소:**
https://github.com/leestar20251214-sys/Japan-Mystery

**프로젝트 설명:**
- 일본어 미스테리/괴담 Shorts 자동 생성
- Gemini 3 Pro, Imagen 3, TTS 사용
- 2분 59초 영상 자동 제작
- YouTube 메타데이터 자동 생성

---

## 🚀 빠른 시작 (5-10분)

### 1️⃣ 필수 프로그램 설치

다음 3가지를 먼저 설치하세요:

**Node.js (필수):**
- https://nodejs.org
- LTS 버전 다운로드
- ⚠️ "Add to PATH" 체크 필수

**Python (필수):**
- https://www.python.org/downloads/
- Python 3.8 이상
- ⚠️ "Add Python to PATH" 체크 필수

**GitHub Desktop (필수):**
- https://desktop.github.com
- 설치 후 GitHub 로그인

---

### 2️⃣ 프로젝트 다운로드

**GitHub Desktop에서:**

1. File > Clone Repository
2. URL 탭 선택
3. 다음 URL 입력:
   ```
   https://github.com/leestar20251214-sys/Japan-Mystery
   ```
4. Local Path: 원하는 폴더 선택
   예: `C:\Users\본인이름\Documents\Japan-Mystery`
5. "Clone" 클릭
6. 다운로드 완료 (1-2분)

---

### 3️⃣ API 키 발급

**Google Gemini API (무료):**

1. https://aistudio.google.com/apikey 접속
2. Google 로그인
3. "Create API key" 클릭
4. API 키 복사 (나중에 사용)

**예시:**
```
AIzaSyB1234567890abcdefghijk...
```

⚠️ **중요:** 절대 타인과 공유 금지!

---

### 4️⃣ 프로젝트 설정

**터미널 (cmd 또는 PowerShell) 열기:**

```bash
# 프로젝트 폴더로 이동
cd C:\Users\본인이름\Documents\Japan-Mystery

# 패키지 설치 (1-2분)
npm install

# API 키 설정
echo "GEMINI_API_KEY=여기에_발급받은_API_키" > .env.local

# 개발 서버 실행
npm run dev
```

**성공 메시지:**
```
➜  Local:   http://localhost:3000/
```

---

### 5️⃣ 브라우저에서 접속

http://localhost:3000

**축하합니다! 설치 완료!** 🎉

---

## 📚 상세 가이드

프로젝트 폴더에서 다음 문서를 참고하세요:

- **QUICK_START.md** - 초보자용 상세 가이드
- **README.md** - 프로젝트 전체 설명
- **YOUTUBE_UPLOAD_GUIDE.md** - YouTube 업로드 방법

---

## 💡 사용 방법

1. 페르소나 선택 (예: 도시전설의 진실)
2. 주제 입력 또는 프리셋 선택
3. BGM 업로드 (선택)
4. "AI GENERATE" 클릭
5. 대기 (2-4분)
6. "DOWNLOAD MASTER PRODUCTION KIT" 클릭
7. ZIP 압축 해제 후 `RENDER_VIDEO.bat` 실행
8. `final_output.mp4` 완성!

---

## ❓ 문제 해결

**"명령을 찾을 수 없습니다" 에러:**
- Node.js/Python 재설치
- "Add to PATH" 체크 확인
- 컴퓨터 재시작

**API 키 오류:**
- `.env.local` 파일 확인
- 따옴표 없이 입력
- 앞뒤 공백 제거

**포트 사용 중 에러:**
```bash
npm run dev -- --port 3001
```

---

## 🔄 업데이트 받기

관리자가 코드를 업데이트하면:

**GitHub Desktop에서:**
1. 상단 "Fetch origin" 클릭
2. "Pull origin" 클릭
3. 완료!

**터미널에서:**
```bash
git pull
npm install  # 새 패키지가 있으면
npm run dev
```

---

## 🆘 도움이 필요하면

- GitHub Issues에 질문 남기기
- 관리자에게 직접 문의
- QUICK_START.md 문서 참고

---

## 📌 주의사항

1. **API 키는 각자 발급** (할당량 분산)
2. **.env.local 파일은 Git에 업로드 금지** (자동으로 제외됨)
3. **무료 플랜 제한** - 하루 약 50장 이미지 생성 가능
4. **테스트는 최소화** - 실제 필요한 것만 생성

---

## ✅ 최종 체크리스트

설치 후 확인:

- [ ] Node.js 실행됨 (`node --version`)
- [ ] Python 실행됨 (`python --version`)
- [ ] 프로젝트 Clone 완료
- [ ] `npm install` 성공
- [ ] `.env.local` 파일 생성
- [ ] `npm run dev` 실행
- [ ] http://localhost:3000 접속 가능
- [ ] 테스트 생성 성공

---

**함께 멋진 콘텐츠를 만들어봐요!** 🚀

궁금한 점이 있으면 언제든지 연락주세요!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

