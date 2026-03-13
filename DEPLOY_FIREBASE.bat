@echo off
echo ================================
echo  Mystery Factory Pro - Deploy
echo ================================
echo.

cd /d "%~dp0"

echo [1/2] Building...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying to Firebase...
call firebase deploy --only hosting

echo.
echo ================================
echo  Done! https://mystery-factory-pro.web.app
echo ================================
pause
