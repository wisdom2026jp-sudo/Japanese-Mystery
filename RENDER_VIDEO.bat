@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════╗
echo ║   AutoGen Pro - 영상 자동 렌더링 시작           ║
echo ╚══════════════════════════════════════════════════╝
echo.

echo [1/4] Python 확인 중...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되지 않았습니다!
    echo.
    echo Python 3.8 이상을 설치하세요:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo ✅ Python 설치됨

echo.
echo [2/4] 필수 라이브러리 설치 중...
pip install moviepy requests pillow -q
if errorlevel 1 (
    echo ❌ 라이브러리 설치 실패
    pause
    exit /b 1
)
echo ✅ 라이브러리 준비 완료

echo.
echo [3/4] 영상 렌더링 시작...
echo ⏱️  약 5-10분 소요 (PC 사양에 따라 다름)
echo.

python render.py

if errorlevel 1 (
    echo.
    echo ❌ 렌더링 실패
    echo    render.py 파일을 확인하세요.
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║   ✅ 렌더링 완료!                                ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo 📁 파일 위치: final_output.mp4
echo.

echo [4/4] 폴더 열기...
start .

echo.
echo 완료! 브라우저에서 확인하거나
echo final_output.mp4를 YouTube에 업로드하세요.
echo.
pause
