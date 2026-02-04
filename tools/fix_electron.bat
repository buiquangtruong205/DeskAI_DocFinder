@echo off
setlocal
echo ==========================================
echo      DeskAI Electron Fix Script
echo ==========================================

cd /d "%~dp0\.."
echo Working directory: %CD%

echo [1/5] Cleaning old modules...
if exist node_modules rmdir /s /q node_modules
if exist apps\desktop\node_modules rmdir /s /q apps\desktop\node_modules
if exist pnpm-lock.yaml del pnpm-lock.yaml

echo [2/5] Cleaning pnpm cache/store for electron...
call pnpm store prune

echo [3/5] Installing dependencies (forcing scripts)...
:: --force tells pnpm to ignore side-effect cache and run postinstall scripts (like electron download)
call pnpm install --force

echo [4/5] Rebuilding Electron specifically...
cd apps\desktop
call pnpm rebuild electron

echo [4.5/5] Manually triggering Electron download...
if exist "node_modules\electron\install.js" (
    cd node_modules\electron
    echo Running install.js...
    node install.js
    cd ..\..\..
)

cd ..\..

echo [5/5] Verifying Electron installation...
if exist "apps\desktop\node_modules\electron\dist\electron.exe" (
    echo [SUCCESS] Electron binary found at apps\desktop\node_modules\electron\dist\electron.exe
) else (
    if exist "node_modules\electron\dist\electron.exe" (
        echo [SUCCESS] Electron binary found at node_modules\electron\dist\electron.exe
    ) else (
        echo [ERROR] Electron binary is STILL MISSING. 
        echo Please check your internet connection or proxy settings.
        echo Try running: node apps\desktop\node_modules\electron\install.js manually.
    )
)

echo ==========================================
echo Done. You can now run: npm run dev:electron
echo ==========================================
pause
