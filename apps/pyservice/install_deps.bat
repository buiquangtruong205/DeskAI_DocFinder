@echo off
echo [INFO] Installing tenacity...
venv\Scripts\python -m pip install tenacity
if %errorlevel% neq 0 (
    echo [ERROR] Install failed with code %errorlevel%
    exit /b %errorlevel%
)
echo [INFO] Verifying installation...
venv\Scripts\python -c "import tenacity; print('Tenacity installed:', tenacity.__version__)"
if %errorlevel% neq 0 (
    echo [ERROR] Verification failed
    exit /b %errorlevel%
)
echo [INFO] Success!
