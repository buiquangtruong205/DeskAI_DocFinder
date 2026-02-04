@echo off
echo ==========================================
echo       DeskAI Python Setup Script
echo ==========================================

echo [1/4] Checking for Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo 'python' command not found. Trying 'py'...
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python not found! Please install Python 3.10+ from python.org.
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    )
    set PYTHON_CMD=py
) else (
    set PYTHON_CMD=python
)
echo Using: %PYTHON_CMD%
%PYTHON_CMD% --version

echo [2/4] Creating virtual environment (venv)...
if exist venv (
    echo venv already exists. Deleting to ensure clean install...
    rmdir /s /q venv
)
%PYTHON_CMD% -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create venv.
    pause
    exit /b 1
)

echo [3/4] Installing dependencies...
if not exist venv\Scripts\python.exe (
    echo [ERROR] venv\Scripts\python.exe not found! Checks your antivirus or permissions.
    pause
    exit /b 1
)

venv\Scripts\python -m pip install --upgrade pip
venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install requirements.
    pause
    exit /b 1
)

echo [4/4] Starting Server...
echo ==========================================
echo Setup Complete! Server starting now...
echo Press Ctrl+C to stop.
echo ==========================================
venv\Scripts\uvicorn app.main:app --reload --port 8000
pause
