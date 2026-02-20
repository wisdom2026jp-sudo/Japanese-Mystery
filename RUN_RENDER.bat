# 간편 실행 스크립트
# 스크린샷 폴더에 이 파일을 만들고 더블클릭하세요

@echo off
chcp 65001 >nul
cls

echo ════════════════════════════════════════════════════════
echo   AutoGen Pro - 영상 렌더링 시작
echo ════════════════════════════════════════════════════════
echo.

echo 📁 현재 폴더: %CD%
echo.

echo 📝 파일 확인 중...
if exist bgm.mp3 (echo   ✓ bgm.mp3) else (echo   ✗ bgm.mp3)
if exist narration.wav (echo   ✓ narration.wav) else (echo   ✗ narration.wav)
if exist render.py (echo   ✓ render.py) else (echo   ✗ render.py - 파일 없음!)
echo.

if not exist render.py (
    echo ❌ render.py 파일이 없습니다!
    echo.
    pause
    exit /b 1
)

echo 🚀 Python으로 렌더링 시작...
echo ════════════════════════════════════════════════════════
echo.

python render.py

if errorlevel 1 (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ❌ 렌더링 중 오류 발생
    echo ════════════════════════════════════════════════════════
    echo.
    echo 가능한 원인:
    echo 1. Python이 설치되지 않음
    echo 2. moviepy 패키지 미설치: pip install moviepy pillow requests
    echo 3. 메모리 부족
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════
echo ✅ 완료!
echo ════════════════════════════════════════════════════════
echo.

if exist final_output.mp4 (
    echo 📹 final_output.mp4 파일 생성 완료!
    echo 📊 파일 크기:
    dir final_output.mp4 | findstr "final_output"
    echo.
    echo 폴더를 열어 확인하세요...
    start.
) else (
    echo ⚠️  final_output.mp4 파일이 생성되지 않았습니다.
    echo 위의 오류 메시지를 확인하세요.
)

echo.
pause
