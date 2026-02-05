@echo off
cd /d %~dp0
echo STARTING MODEL CHECK > model_log.txt
venv\Scripts\python simple_check.py >> model_log.txt 2>&1
echo DONE >> model_log.txt
