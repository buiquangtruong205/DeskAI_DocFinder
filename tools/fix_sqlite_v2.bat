@echo off
echo ==========================================
echo      DeskAI Ultra SQLite Fix
echo ==========================================
cd /d "%~dp0\.."

echo [1/3] Installing electron-rebuild globally (temporary helper)...
call npm install -g @electron/rebuild

echo [2/3] Rebuilding better-sqlite3...
cd apps\desktop
:: We use @electron/rebuild explicitly which is more reliable than pnpm rebuild
call electron-rebuild -f -w better-sqlite3

echo [3/3] Checking result...
if exist "node_modules\better-sqlite3\build\Release\better_sqlite3.node" (
    echo [SUCCESS] Binary built successfully!
) else (
    echo [WARNING] Binary location uncertain, but rebuild command finished.
    echo Please try running the app.
)

echo ==========================================
echo Done. Run: npm run dev:electron
pause
