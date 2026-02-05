@echo off
echo ========================================
echo Starting DeskAI DocFinder Application
echo ========================================

REM Always run from the script's directory
cd /d "%~dp0"
echo Current directory: %CD%

echo.
echo [1/5] Stopping existing processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Processes stopped.

echo.
echo [2/5] Checking Python environment...
if not exist "apps\pyservice\venv" (
    echo [ERROR] Virtual environment not found at: %CD%\apps\pyservice\venv
    echo Please make sure you're running this from the project root directory.
    pause
    exit /b 1
)

if not exist "apps\pyservice\venv\Scripts\python.exe" (
    echo [ERROR] Python not found in virtual environment.
    echo Please run setup_python.bat first.
    pause
    exit /b 1
)

echo Python environment OK!

echo.
echo [3/5] Starting Python Backend...
start /min "Python Backend" cmd /c "cd /d %CD%\apps\pyservice && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo.
echo [4/5] Waiting for backend to fully load...
echo This may take 15-30 seconds for model loading...
echo.
echo Progress: [          ] 0%%
timeout /t 3 /nobreak >nul
echo Progress: [##        ] 20%%
timeout /t 3 /nobreak >nul
echo Progress: [####      ] 40%%
timeout /t 3 /nobreak >nul
echo Progress: [######    ] 60%%
timeout /t 3 /nobreak >nul
echo Progress: [########  ] 80%%
timeout /t 3 /nobreak >nul
echo Progress: [##########] 100%%

echo Backend should be ready now!

echo.
echo [5/5] Starting Desktop Application...
cd apps\desktop
echo Starting Electron app...
npm run dev:electron

echo.
echo Application started!
pause