@echo off
set "VENV_PATH=%~dp0..\..\\.venv"
set "WORK_DIR=%~dp0..\.."

echo Activating virtual environment...
call %VENV_PATH%\Scripts\activate.bat

echo Changing to working directory: %WORK_DIR%
cd /d "%WORK_DIR%"

echo Starting Uvicorn server...
python -m uvicorn src.main:app --reload
