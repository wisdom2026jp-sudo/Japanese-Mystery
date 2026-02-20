# 👥 친구들에게 공유하기 - 완벽 가이드

이 문서는 **관리자(본인)**가 팀원들에게 프로젝트를 공유하는 전체 과정을 설명합니다.

---

## 📋 목차

1. [GitHub에서 팀원 초대하기](#1-github에서-팀원-초대하기)
2. [초대 메시지 보내기](#2-초대-메시지-보내기)
3. [팀원 설치 과정 안내](#3-팀원-설치-과정-안내)
4. [문제 해결 지원](#4-문제-해결-지원)
5. [첫 영상 함께 만들기](#5-첫-영상-함께-만들기)

---

## 1. GitHub에서 팀원 초대하기

### Step 1-1: 저장소 페이지 열기

브라우저에서 다음 주소로 이동:
```
https://github.com/leestar20251214-sys/Japan-Mystery
```

### Step 1-2: Settings 메뉴 접근

1. 저장소 페이지 상단의 **"Settings"** 탭 클릭
2. 왼쪽 사이드바에서 **"Collaborators"** 클릭
3. 비밀번호 확인 요청 시 GitHub 비밀번호 입력

### Step 1-3: 팀원 추가

1. **"Add people"** 버튼 클릭 (초록색 버튼)

2. 팀원 정보 입력:
   - GitHub 사용자명 (예: `john_doe`)
   - 또는 이메일 주소 (예: `john@example.com`)

3. 검색 결과에서 올바른 사용자 선택

4. 권한 선택:
   - **Write** (권장) - 코드 수정 및 Push 가능
   - **Read** - 읽기 전용 (코드 보기만 가능)
   - **Admin** - 저장소 설정 변경 가능 (신중하게)

5. **"Add [사용자명] to this repository"** 클릭

6. 완료! 팀원에게 자동으로 이메일 초대장 발송됨

### Step 1-4: 여러 명 초대

각 팀원마다 Step 1-3 반복

**추천 순서:**
1. 핵심 팀원부터 초대
2. 각자 설치 확인 후 다음 팀원 초대
3. 한 번에 모두 초대하지 말고 순차적으로

---

## 2. 초대 메시지 보내기

### Step 2-1: Slack/Discord/Email 준비

팀원들이 주로 사용하는 채널 선택

### Step 2-2: 초대 메시지 복사

**Option A: 상세 버전 (처음 사용하는 팀원)**

`TEAM_INVITATION.md` 파일 열기:
```
F:\06_일본미스테리\AutoGen_Pro\TEAM_INVITATION.md
```

전체 내용 복사 → 팀원에게 전송

**Option B: 간단 버전 (개발 경험 있는 팀원)**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 AutoGen Pro 프로젝트에 초대합니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

일본 미스테리 YouTube Shorts를 AI로 자동 생성하는 플랫폼입니다.

📦 저장소:
https://github.com/leestar20251214-sys/Japan-Mystery

🚀 빠른 시작:

1. GitHub Desktop 설치:
   https://desktop.github.com

2. Clone Repository:
   - File > Clone Repository
   - URL: https://github.com/leestar20251214-sys/Japan-Mystery
   - Local Path: 원하는 폴더 선택

3. 설치 및 실행:
   cd Japan-Mystery
   npm install
   
4. API 키 설정:
   - https://aistudio.google.com/apikey 에서 발급
   - .env.local 파일 생성:
     GEMINI_API_KEY=발급받은_키
   
5. 실행:
   npm run dev
   
6. 접속:
   http://localhost:3000

📖 상세 가이드:
프로젝트 폴더의 QUICK_START.md 참고

❓ 질문:
언제든지 연락주세요!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2-3: 추가 안내사항

메시지에 다음 정보 추가:

**중요 알림:**
```
⚠️ 주의사항:
1. API 키는 각자 발급하세요 (할당량 분산)
2. .env.local 파일은 절대 GitHub에 업로드하지 마세요
3. 무료 플랜 제한: 하루 약 50장 이미지 생성 가능
4. 테스트는 최소화하고 실제 필요한 것만 생성하세요
```

**예상 소요 시간:**
```
⏱️ 설치 시간:
- 필수 프로그램 설치: 10-15분
- 프로젝트 Clone: 2-3분
- 패키지 설치: 2-3분
- API 키 발급: 2-3분
━━━━━━━━━━━━━━━━━
총 시간: 20-25분
```

---

## 3. 팀원 설치 과정 안내

### Step 3-1: 팀원이 따라야 할 순서

**체크리스트 제공:**

```
✅ 팀원용 설치 체크리스트

필수 프로그램:
□ Node.js 18+ 설치
  https://nodejs.org
  
□ Python 3.8+ 설치
  https://www.python.org/downloads/
  
□ GitHub Desktop 설치
  https://desktop.github.com

프로젝트 설정:
□ GitHub 초대 수락 (이메일 확인)

□ GitHub Desktop에서 Clone
  - URL: https://github.com/leestar20251214-sys/Japan-Mystery
  
□ 터미널 열고 프로젝트 폴더로 이동

□ npm install 실행

□ Gemini API 키 발급
  https://aistudio.google.com/apikey
  
□ .env.local 파일 생성
  GEMINI_API_KEY=발급받은_키
  
□ npm run dev 실행

□ http://localhost:3000 접속 확인

□ 테스트 생성 (간단한 주제로)

━━━━━━━━━━━━━━━━━
모두 체크되면 설치 완료! 🎉
```

### Step 3-2: 각 단계별 스크린샷 (선택사항)

팀원이 어려워하면:
1. 각 단계 스크린샷 캡처
2. Slack/Discord에 올려서 공유
3. 화면 공유로 실시간 도움

---

## 4. 문제 해결 지원

### 자주 발생하는 문제

#### ❌ 문제 1: "명령을 찾을 수 없습니다"

**원인:** Node.js 또는 Python이 PATH에 없음

**해결:**
```
1. Node.js/Python 재설치
2. 설치 시 "Add to PATH" 체크 필수
3. 컴퓨터 재시작
4. 터미널 재시작
```

---

#### ❌ 문제 2: "npm install 실패"

**원인:** 네트워크 문제 또는 권한 문제

**해결:**
```powershell
# 캐시 삭제
npm cache clean --force

# 재시도
npm install

# 여전히 실패하면 관리자 권한으로 실행
```

---

#### ❌ 문제 3: "API 키 오류"

**원인:** .env.local 파일 형식 오류

**해결:**
```
올바른 형식:
GEMINI_API_KEY=AIzaSyB1234567890...

잘못된 형식:
GEMINI_API_KEY="AIzaSyB1234567890..."  (따옴표 X)
GEMINI_API_KEY = AIzaSyB1234567890...  (공백 X)
```

---

#### ❌ 문제 4: "포트 이미 사용 중"

**원인:** 3000번 포트가 다른 프로그램에 의해 사용 중

**해결:**
```bash
# 다른 포트로 실행
npm run dev -- --port 3001

# 브라우저에서 접속
http://localhost:3001
```

---

#### ❌ 문제 5: "GitHub Clone 실패"

**원인:** 초대를 아직 수락하지 않음

**해결:**
```
1. 이메일 확인 (GitHub에서 발송)
2. "View invitation" 클릭
3. "Accept invitation" 클릭
4. 다시 Clone 시도
```

---

## 5. 첫 영상 함께 만들기

### Step 5-1: 전체 팀 온라인 미팅

모든 팀원 설치 완료 후:

1. Zoom/Discord 화면 공유 세션
2. 관리자가 시연
3. 팀원들이 따라하기

### Step 5-2: 시연 시나리오

```
데모 주제: "키사라기 역의 미스테리"

1. 페르소나 선택: "도시전설의 진실"
2. 프리셋 클릭: "きさらぎ駅"
3. BGM 업로드: (샘플 MP3 제공)
4. "AI GENERATE" 클릭
5. 대기 (2-4분) - 이 시간에 Q&A
6. 결과 확인:
   - 스크립트 읽기
   - 이미지 확인
   - 오디오 재생
7. "DOWNLOAD MASTER PRODUCTION KIT" 클릭
8. ZIP 압축 해제
9. RENDER_VIDEO.bat 실행
10. final_output.mp4 확인
```

### Step 5-3: 역할 분담

팀 규모에 따라:

**소규모 팀 (2-3명):**
```
역할 A: 주제 기획 & 스크립트 검토
역할 B: 이미지 선별 & 썸네일 제작
역할 C: BGM 선정 & 영상 렌더링
```

**중규모 팀 (4-6명):**
```
팀 1: 미스테리 장르
팀 2: 힐링 장르
팀 3: 코미디 장르
→ 각 팀이 주 2-3개 영상 제작
```

---

## 6. 지속적인 협업

### Step 6-1: 업데이트 공유

관리자가 코드 개선 후:

1. GitHub Desktop에서 Commit & Push
2. 팀 채널에 공지:
   ```
   📢 업데이트 공지
   
   변경 사항:
   - BGM 업로드 UI 개선
   - 자동 저장 기능 추가
   
   업데이트 방법:
   GitHub Desktop > Fetch origin > Pull origin
   
   또는
   git pull
   npm install
   ```

### Step 6-2: 주간 미팅

매주 고정 시간에:
- 이번 주 제작 영상 리뷰
- 개선 사항 논의
- 다음 주 목표 설정

---

## 📊 성공 지표

### 팀원 온보딩 성공 기준:

- [ ] 모든 팀원이 저장소 Clone 완료
- [ ] 모든 팀원이 localhost:3000 접속 가능
- [ ] 각자 테스트 영상 1개 생성 성공
- [ ] GitHub Desktop으로 업데이트 받기 성공
- [ ] 문제 발생 시 스스로 해결 또는 질문하기

### 1주일 후:

- [ ] 팀 전체 10개 이상 영상 제작
- [ ] YouTube 업로드 3개 이상
- [ ] 조회수 1,000회 이상 영상 1개
- [ ] 팀원들이 독립적으로 작업 가능

---

## 📞 지속적인 지원

### 커뮤니케이션 채널

**Slack/Discord 채널 구성:**
```
#공지 - 중요 업데이트
#질문 - 기술 지원
#완성작 - 제작 영상 공유
#아이디어 - 주제 브레인스토밍
```

### 문서 업데이트

팀원 피드백 반영:
- 자주 묻는 질문 → FAQ 추가
- 새로운 문제 → 문제 해결 가이드 업데이트
- 좋은 아이디어 → 기능 개선

---

## ✅ 최종 체크리스트

공유 전:
- [ ] GitHub 저장소 업로드 완료
- [ ] QUICK_START.md 문서 확인
- [ ] TEAM_INVITATION.md 준비
- [ ] 샘플 BGM 파일 준비 (선택)

공유 중:
- [ ] GitHub에서 팀원 초대 완료
- [ ] 초대 메시지 전송 완료
- [ ] 각 팀원 설치 진행 상황 확인

공유 후:
- [ ] 전체 팀원 설치 완료
- [ ] 첫 영상 함께 제작
- [ ] 주간 미팅 일정 설정
- [ ] 역할 분담 완료

---

## 🎉 축하합니다!

모든 팀원이 AutoGen Pro를 사용할 준비가 되었습니다!

**이제 함께 멋진 콘텐츠를 만들어보세요!** 🚀

---

## 부록: 빠른 참조

### 주요 URL

- GitHub 저장소: https://github.com/leestar20251214-sys/Japan-Mystery
- Gemini API: https://aistudio.google.com/apikey
- Node.js: https://nodejs.org
- Python: https://www.python.org/downloads/
- GitHub Desktop: https://desktop.github.com

### 주요 명령어

```bash
# 프로젝트 Clone
git clone https://github.com/leestar20251214-sys/Japan-Mystery.git

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 업데이트 받기
git pull
npm install

# Python 의존성 설치
pip install moviepy requests pillow
```

### 긴급 연락처

- 관리자: [본인 연락처]
- GitHub Issues: https://github.com/leestar20251214-sys/Japan-Mystery/issues
- 팀 Slack/Discord: [채널 링크]

---

**문서 작성일:** 2026-02-15  
**최종 수정일:** 2026-02-15  
**버전:** 1.0
