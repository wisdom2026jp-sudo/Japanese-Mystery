# 🎥 YouTube Shorts 업로드 가이드

## 📦 이 폴더에 포함된 파일

```
Production_Kit/
├── 📹 final_output.mp4          # 최종 영상 (렌더링 후 생성)
├── 🎵 narration.wav             # 일본어 나레이션
├── 🎵 bgm.mp3                   # 배경음악
├── 🖼️ hook.png/mp4              # 후크 이미지/영상
├── 🖼️ story_0.png ~ story_14.png # 스토리 이미지 15장
├── 📝 subtitles_ja.srt          # 자막 파일
├── 🐍 render.py                 # Python 렌더링 스크립트
├── 🚀 RENDER_VIDEO.bat          # 원클릭 렌더링 (Windows)
├── 📺 YOUTUBE_METADATA.txt      # YouTube 메타데이터 ⭐
└── 📖 README.md                 # 이 파일
```

---

## 🎬 STEP 1: 영상 렌더링

### Windows:
```
RENDER_VIDEO.bat 더블클릭
```

### Mac/Linux:
```bash
python3 render.py
```

⏱️ **예상 시간**: 5-10분  
✅ **완료**: `final_output.mp4` 파일 생성

---

## 📺 STEP 2: YouTube 업로드

### 1. YouTube Studio 접속
```
https://studio.youtube.com
```

### 2. Shorts 업로드
- "만들기" 버튼 클릭
- "동영상 업로드" 선택
- `final_output.mp4` 드래그 앤 드롭

### 3. 메타데이터 입력

**📄 `YOUTUBE_METADATA.txt` 파일을 열고 복사/붙여넣기:**

#### ✏️ 제목
```
YOUTUBE_METADATA.txt 에서
【タイトル】 부분을 복사
```

#### 📝 설명
```
YOUTUBE_METADATA.txt 에서
【説明】 부분을 복사

⚠️ 주의: 해시태그가 포함되어 있음
```

#### 🏷️ 태그
```
YouTube Studio 하단 "더보기" 클릭
→ "태그" 입력란에
YOUTUBE_METADATA.txt 의 【タグ】 복사/붙여넣기
```

#### 🎨 썸네일
```
hook.png 를 썸네일로 업로드
또는
YOUTUBE_METADATA.txt 의
【サムネイル制作のヒント】 참고하여 제작
```

### 4. 카테고리 & 설정
- **카테고리**: People & Blogs (22)
- **시청자**: 어린이용이 아님
- **제한사항**: 없음

### 5. 게시 시간
```
YOUTUBE_METADATA.txt 의
【最適投稿時間】 참고

예: 21:00-23:00 (미스테리 장르)
```

---

## 🔥 최대 조회수 전략 (알고리즘 최적화)

### 📊 업로드 후 첫 1시간이 중요!

#### ✅ 즉시 해야 할 일:

1. **커뮤니티 탭 예고**
   ```
   "새로운 Shorts 업로드했어요! 🎬"
   + 썸네일 이미지
   ```

2. **SNS 공유**
   - Twitter (X)
   - Instagram Stories
   - TikTok (재업로드)

3. **친구/가족에게 공유**
   - 초기 조회수 & 좋아요 중요

#### 📈 engagement 높이는 법:

- **핀 댓글 달기**
  ```
  「この動画について質問があればコメントしてくださ！」
  ```

- **모든 댓글에 즉시 답변**
  - 처음 몇 시간이 중요

- **질문형 댓글 유도**
  ```
  「あなたはどう思いますか？」
  ```

---

## 🎯 바이럴 체크리스트

### 영상 분석 (24시간 후)

- [ ] 조회수 1,000+ 도달?
- [ ] 평균 시청 시간 40%+?
- [ ] 좋아요 비율 5%+?
- [ ] 댓글 10개+?

### 개선 포인트

**조회수 낮으면:**
- 썸네일 변경 (A/B 테스트)
- 제목 수정 (더 자극적으로)
- 재업로드 시간대 변경

**시청 유지율 낮으면:**
- 첫 3초를 더 임팩트 있게
- 스토리 구성 재검토

---

## 📌 참고 자료

### YouTube Shorts 최적화
- [공식 가이드](https://support.google.com/youtube/answer/10059070)
- [알고리즘 분석](https://creatoracademy.youtube.com)

### 무료 리소스
- **음악**: [YouTube Audio Library](https://studio.youtube.com/channel/UC/music)
- **효과음**: [Pixabay](https://pixabay.com/sound-effects/)
- **썸네일 제작**: [Canva](https://www.canva.com)

---

## 💡 Pro Tips

### 시리즈화 전략
```
같은 포맷으로 10개 이상 만들기
→ 재생목록 생성
→ 연속 재생 유도
```

### 최적 업로드 주기
```
주 3-5회 (일관성 중요)
같은 시간대 권장
```

### 분석 도구
```
YouTube Studio → 분석
→ 시청자 유지율 확인
→ 트래픽 소스 확인
→ 다음 영상 개선
```

---

## 🆘 문제 해결

### ❓ "영상이 Shorts로 인식 안 됨"
- 세로 비율(9:16) 확인
- 길이 60초 이하 확인
- #Shorts 해시태그 추가

### ❓ "조회수가 안 올라감"
- 첫 24시간이 중요
- 친구/가족에게 공유
- 커뮤니티 탭 활용

### ❓ "수익화 가능?"
- 구독자 1,000명, 시청 시간 4,000시간 필요
- Shorts는 조회수 1,000만회 (90일)도 가능

---

## 🎊 완료!

모든 설정이 끝나면:
1. ✅ 게시 버튼 클릭
2. 🎉 첫 조회수 기다리기
3. 📊 24시간 후 분석 확인

**행운을 빕니다! 🚀**

---

**이 가이드가 도움이 되셨다면 다음 영상도 만들어보세요!**
