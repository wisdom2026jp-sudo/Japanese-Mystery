@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════════════════
echo   AutoGen Pro - 웹 앱 서버 시작
echo ════════════════════════════════════════════════════════
echo.
echo 잠시 후 브라우저가 자동으로 열립니다...
echo 서버가 실행되는 동안 이 창을 닫지 마세요!
echo.

cd /d "%~dp0"

start "" "http://localhost:3000"
npm run dev

pause
