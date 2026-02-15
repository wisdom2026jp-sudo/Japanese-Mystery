# Vercel 배포 가이드 (무료)

## 🚀 Vercel로 배포하기

### 장점:
- ✅ 완전 무료
- ✅ 자동 HTTPS
- ✅ 전세계 어디서나 접속
- ✅ 자동 빌드 & 배포
- ✅ 팀원 설치 불필요

---

## 📋 Step 1: Vercel 계정 생성

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인

---

## 📦 Step 2: 프로젝트 배포

### 2-1. GitHub 연결
```
Vercel Dashboard
→ "Add New..."
→ "Project"
→ GitHub 저장소 선택 (autogen-pro)
```

### 2-2. 환경 변수 설정
```
Configure Project 화면에서:

Environment Variables:
Key: GEMINI_API_KEY
Value: 본인의_API_키

⚠️ 주의: 팀원 모두가 같은 API 키 사용
→ 할당량 공유됨
```

### 2-3. 배포 설정
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install

→ "Deploy" 클릭
```

### 2-4. 완료!
```
배포 완료 (1-2분)
→ URL 생성: https://autogen-pro.vercel.app
```

---

## 🌐 팀원 접속

### 모든 팀원이:
```
1. 브라우저 열기
2. https://autogen-pro.vercel.app 접속
3. 바로 사용!
```

**설치 불필요! ✨**

---

## 🔐 보안 설정 (선택사항)

### 비밀번호 보호:

Vercel에서 기본적으로 제공하지 않으므로, 
간단한 인증을 추가하려면:

1. App.tsx에 비밀번호 체크 추가
2. 환경 변수로 비밀번호 설정

또는

**Vercel Pro** ($20/월):
- 팀 기능
- 비밀번호 보호
- 더 많은 빌드 시간

---

## 📊 사용량 관리

### 무료 플랜 제한:
- 빌드: 100시간/월
- 대역폭: 100GB/월
- 서버리스 함수: 100GB-Hours/월

**충분합니다!** 웬만하면 무료로 사용 가능

---

## 🔄 업데이트 자동 배포

### GitHub에 푸시하면 자동 배포:
```bash
git add .
git commit -m "업데이트"
git push

→ Vercel이 자동으로 새 버전 배포
→ 1-2분 후 반영
```

---

## ⚠️ 주의사항

### API 키 공유 이슈:
```
모든 팀원이 같은 API 키 사용
→ 할당량 빠르게 소진 가능

해결책:
1. 유료 API 플랜 구독
2. 사용자별 API 키 입력 기능 추가
3. 필요시에만 사용
```

---

## 💡 추천 설정

### 프로덕션 환경:
```
환경 변수에 별도 키 설정:
- VITE_GEMINI_API_KEY (클라이언트용)
```

### 보안 강화:
```
1. API 키를 사용자 입력으로 받기
2. LocalStorage에 저장
3. 각자 키 사용
```

