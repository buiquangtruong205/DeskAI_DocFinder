@echo off
echo ==========================================
echo      DeskAI SQLite Fix Script
echo ==========================================
cd /d "%~dp0\.."

echo Rebuilding better-sqlite3 for Electron 29.4.6...
:: This ensures the native module is built against Electron's headers, not Node.js
call pnpm rebuild better-sqlite3 --config.npm_config_runtime=electron --config.npm_config_target=29.4.6 --config.npm_config_disturl=https://electronjs.org/headers

echo ==========================================
echo Done! Try running the app now.
echo ==========================================
pause
