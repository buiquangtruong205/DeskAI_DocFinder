@echo off
echo ========================================
echo Updating Dependencies and Starting App
echo ========================================

echo.
echo [1/5] Stopping existing processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Processes stopped.

echo.
echo [2/5] Updating Python dependencies...
cd apps\pyservice
venv\Scripts\pip install --upgrade google-genai
venv\Scripts\pip uninstall -y google-generativeai
venv\Scripts\pip install -r requirements.txt
cd ..\..

echo.
echo [3/5] Starting Python Backend...
start "Python Backend" cmd /k "cd apps\pyservice && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo.
echo [4/5] Waiting for backend to start...
timeout /t 10 /nobreak >nul

echo.
echo [5/5] Starting Desktop Application...
cd apps\desktop
start "Desktop App" cmd /k "npm run dev:electron"

echo.
echo ========================================
echo Application updated and starting...
echo Backend: http://127.0.0.1:8000
echo Frontend will open automatically
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul