# render.py 자동 복사 스크립트
# 사용법: 스크린샷 폴더(Production_Kit)에서 이 파일을 실행하세요

@echo off
chcp 65001 >nul
cls

echo ════════════════════════════════════════════════════════
echo   render.py v2.0 업데이트
echo ════════════════════════════════════════════════════════
echo.

set "SOURCE=F:\06_일본미스테리\AutoGen_Pro\render.py"
set "TARGET=%CD%\render.py"

if not exist "%SOURCE%" (
    echo ❌ 원본 파일이 없습니다!
    echo    %SOURCE%
    echo.
    pause
    exit /b 1
)

echo 📁 원본: %SOURCE%
echo 📁 대상: %TARGET%
echo.

echo 📋 기존 파일 백업 중...
if exist "%TARGET%" (
    copy /Y "%TARGET%" "%TARGET%.backup" >nul
    echo   ✅ 백업 완료: render.py.backup
) else (
    echo   ℹ️  기존 파일 없음
)

echo.
echo 📥 새 render.py 복사 중...
copy /Y "%SOURCE%" "%TARGET%" >nul

if errorlevel 1 (
    echo   ❌ 복사 실패!
    pause
    exit /b 1
)

echo   ✅ 복사 완료!
echo.

echo ════════════════════════════════════════════════════════
echo   ✅ render.py v2.0 업데이트 완료!
echo ════════════════════════════════════════════════════════
echo.
echo 💡 변경 사항:
echo    - 자막이 2분 45초까지 정확히 표시됩니다
echo    - MoviePy TextClip 사용 (더 안정적)
echo    - 일본어 폰트 자동 선택
echo    - 개선된 SRT 파싱
echo.
echo 🚀 이제 다음을 실행하세요:
echo    python render.py
echo.

pause
