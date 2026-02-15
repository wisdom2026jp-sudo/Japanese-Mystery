# 팀원과 공유하기 가이드

## 📦 Step 1: GitHub 저장소 만들기

### 1. GitHub 계정 생성 (없으면)
https://github.com

### 2. 새 저장소 생성
```
Repository name: autogen-pro
Description: 일본 미스테리 Shorts 자동 생성 도구
Private (팀원만 접근)
```

### 3. 로컬 코드 업로드

터미널에서 실행:

```bash
# 이 폴더에서
cd f:\06_일본미스테리\AutoGen_Pro

# Git 초기화
git init

# .gitignore 파일 생성 (중요!)
echo "node_modules/
.env.local
*.mp4
*.zip
dist/
.DS_Store" > .gitignore

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: AutoGen Pro"

# GitHub 저장소와 연결 (본인의 저장소 URL로 변경)
git remote add origin https://github.com/본인계정/autogen-pro.git

# 업로드
git push -u origin main
```

---

## 👥 Step 2: 팀원 초대

### GitHub에서:
```
Settings → Collaborators → Add people
→ 팀원 GitHub 계정 입력
```

---

## 💻 Step 3: 팀원이 설치하는 방법

### 각 팀원이 실행:

```bash
# 1. 저장소 복제
git clone https://github.com/본인계정/autogen-pro.git
cd autogen-pro

# 2. 의존성 설치
npm install

# 3. Python 설치 확인
python --version

# 4. API 키 설정
# .env.local 파일 생성
echo "GEMINI_API_KEY=각자의_API_키" > .env.local

# 5. 개발 서버 실행
npm run dev
```

### 접속:
```
http://localhost:3000
```

---

## 🔑 Step 4: API 키 관리

### 각 팀원이 개별 API 키 발급:

1. https://aistudio.google.com/apikey 접속
2. "Create API key" 클릭
3. 자신의 `.env.local`에 설정

**이유:**
- 할당량 분산 (각자 무료 플랜 사용)
- 사용량 개별 추적
- 보안 (각자 키 관리)

---

## 📋 팀원용 빠른 시작 가이드

### 필수 요구사항:
- Node.js 18+ 설치
- Python 3.8+ 설치
- Git 설치
- Gemini API 키

### 5분 설치:
```bash
git clone [저장소_URL]
cd autogen-pro
npm install
echo "GEMINI_API_KEY=본인_키" > .env.local
npm run dev
```

### 문제 해결:
- Node.js: https://nodejs.org
- Python: https://python.org
- Git: https://git-scm.com

---

## 🔄 업데이트 받기

### 본인이 코드 수정 후:
```bash
git add .
git commit -m "업데이트 내용"
git push
```

### 팀원이 최신 버전 받기:
```bash
git pull
npm install  # 새 패키지가 있으면
```

---

## 💡 권장 작업 흐름

```
본인 (관리자)
└─> GitHub 업데이트
    └─> 팀원들 git pull
        └─> 각자 localhost:3000에서 사용
```

