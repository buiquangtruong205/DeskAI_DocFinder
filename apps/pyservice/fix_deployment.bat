@echo off
cd /d %~dp0
echo STARTING FIX > install_log.txt
echo Installing tenacity... >> install_log.txt
venv\Scripts\python -m pip install tenacity >> install_log.txt 2>&1
if %errorlevel% neq 0 (
    echo PIP INSTALL FAILED >> install_log.txt
    exit /b 1
)

echo Verifying... >> install_log.txt
venv\Scripts\python -c "import tenacity; print('Tenacity START'); print(tenacity.__version__); print('Tenacity END')" >> install_log.txt 2>&1
if %errorlevel% neq 0 (
    echo IMPORT FAILED >> install_log.txt
    exit /b 1
)

echo DONE >> install_log.txt
