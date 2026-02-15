# 🚀 팀원용 빠른 시작 가이드

안녕하세요! AutoGen Pro 팀원 환영합니다! 👋

이 가이드는 **개발 경험이 없어도** 5-10분이면 설치 완료할 수 있도록 작성되었습니다.

---

## ✅ 설치 전 체크리스트

다음 3가지만 설치되어 있으면 됩니다:

- [ ] **Node.js** (18 이상)
- [ ] **Python** (3.8 이상)
- [ ] **Git**

---

## 📥 Step 1: 필수 프로그램 설치

### 1-1. Node.js 설치

#### Windows:
1. https://nodejs.org 접속
2. "LTS" 버전 다운로드 (현재 20.x)
3. 다운로드한 파일 실행
4. **"Add to PATH" 체크 필수!**
5. 설치 완료

#### 확인:
```bash
# 터미널 열고 실행
node --version
# v20.x.x 같은 숫자 나오면 성공!
```

---

### 1-2. Python 설치

#### Windows:
1. https://www.python.org/downloads/ 접속
2. "Download Python 3.11.x" 클릭
3. 다운로드한 파일 실행
4. ⚠️ **"Add Python to PATH" 체크 필수!**
5. "Install Now" 클릭

#### 확인:
```bash
python --version
# Python 3.11.x 나오면 성공!
```

---

### 1-3. Git 설치

#### Windows:
1. https://git-scm.com/download/win 접속
2. 자동 다운로드 시작
3. 실행하고 계속 "Next" 클릭 (기본 설정 권장)

#### 확인:
```bash
git --version
# git version 2.x.x 나오면 성공!
```

---

## 🔑 Step 2: API 키 발급

Google Gemini API 키가 필요합니다 (무료):

1. https://aistudio.google.com/apikey 접속
2. Google 로그인
3. "Get API key" 또는 "Create API key" 클릭
4. API 키 복사 (나중에 사용)

**예시:**
```
AIzaSyB1234567890abcdefghijklmnop...
```

⚠️ **절대 타인과 공유하지 마세요!**

---

## 💻 Step 3: 프로젝트 설치

### 3-1. 저장소 복제

터미널(cmd 또는 PowerShell) 열고:

```bash
# 원하는 폴더로 이동 (예: 내 문서)
cd Documents

# 프로젝트 복제
git clone https://github.com/[관리자_계정]/autogen-pro.git

# 프로젝트 폴더로 이동
cd autogen-pro
```

---

### 3-2. 의존성 설치

```bash
# Node.js 패키지 설치 (1-2분 소요)
npm install
```

성공 메시지:
```
added 163 packages in 45s
```

---

### 3-3. API 키 설정

프로젝트 폴더에 `.env.local` 파일 생성:

#### Windows (PowerShell):
```powershell
echo "GEMINI_API_KEY=여기에_본인의_API_키_붙여넣기" > .env.local
```

#### 또는 수동으로:
1. 프로젝트 폴더 열기
2. 새 파일 생성: `.env.local`
3. 내용:
```
GEMINI_API_KEY=AIzaSyB1234567890...
```

---

## 🎉 Step 4: 실행!

```bash
npm run dev
```

성공 메시지:
```
VITE v6.4.1  ready in 509 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.0.x:3000/
```

### 접속:

브라우저에서 http://localhost:3000 열기

**축하합니다! 설치 완료!** 🎊

---

## 🔄 Step 5: 업데이트 받기

관리자가 코드를 업데이트했을 때:

```bash
# 프로젝트 폴더에서
git pull

# 새 패키지가 있으면
npm install

# 서버 재시작
npm run dev
```

---

## ❓ 문제 해결

### "명령을 찾을 수 없습니다" 에러

**원인:** PATH 설정 안 됨

**해결:**
1. Node.js / Python 재설치
2. "Add to PATH" 체크
3. 컴퓨터 재시작

---

### "API 키 오류"

**증상:** 생성 클릭 시 에러

**해결:**
1. `.env.local` 파일 확인
2. API 키 앞뒤 공백 제거
3. 따옴표 없이 입력:
```
GEMINI_API_KEY=AIza... (O)
GEMINI_API_KEY="AIza..." (X)
```

---

### "포트 이미 사용 중"

**증상:** `npm run dev` 시 에러

**해결:**
```bash
# 다른 포트로 실행
npm run dev -- --port 3001
```

브라우저: http://localhost:3001

---

### "npm install 실패"

**증상:** 패키지 설치 중 에러

**해결 (Windows):**
```powershell
# 관리자 권한으로 PowerShell 열기
npm cache clean --force
npm install
```

---

## 📚 사용법

### 기본 워크플로우:

```
1. 왼쪽 사이드바에서 페르소나 선택
   (예: 도시전설의 진실)

2. 주제 입력 또는 프리셋 선택
   (예: "키사라기 역" 클릭)

3. BGM 파일 업로드 (선택사항)
   MP3, WAV 등

4. "AI GENERATE" 클릭

5. 대기 (2-4분)
   - 스크립트 생성
   - 이미지 16장 생성
   - 음성 생성

6. 완료!
   - 프리뷰 확인
   - "DOWNLOAD MASTER PRODUCTION KIT" 클릭
```

---

## 💡 유용한 팁

### API 할당량 관리

**무료 플랜 제한:**
- 이미지: 하루 ~50장
- 텍스트: 분당 60회

**절약 팁:**
- 테스트는 최소한으로
- 실제 필요한 것만 생성
- 팀원끼리 시간대 분산

---

### 영상 렌더링

다운로드한 ZIP 파일:

```
1. 압축 해제
2. RENDER_VIDEO.bat 더블클릭 (Windows)
3. 5-10분 대기
4. final_output.mp4 완성!
```

---

## 🆘 도움이 필요하면

- **관리자에게 문의**
- **GitHub Issues** 활용
- **IMPROVEMENTS.md** 문서 참고

---

## 📌 중요 파일

```
autogen-pro/
├── .env.local           ⭐ API 키 (절대 공유 금지!)
├── README.md            📖 프로젝트 설명
├── TEAM_SHARING_GUIDE.md 👥 이 파일
└── package.json         📦 의존성 목록
```

---

## ✅ 최종 체크리스트

설치 후 확인:

- [ ] `npm run dev` 실행됨
- [ ] http://localhost:3000 접속 가능
- [ ] 페르소나 선택 가능
- [ ] 주제 입력 가능
- [ ] API 키 작동 확인 (테스트 생성)

**모두 체크되면 준비 완료!** 🎉

---

**환영합니다! 함께 멋진 콘텐츠를 만들어봐요!** 🚀
