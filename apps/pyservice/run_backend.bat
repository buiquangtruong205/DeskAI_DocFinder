@echo off
if not exist venv (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please run 'setup_python.bat' first to install dependencies.
    pause
    exit /b 1
)

echo [INFO] Starting Backend Server (No Reload)...
venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
