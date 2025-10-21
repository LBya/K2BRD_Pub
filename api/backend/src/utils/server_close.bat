@echo off
REM *** Server Close Batch File ***
REM This batch file gracefully unloads all models and stops the LMS server.
echo Unloading all models...
lms unload --all

echo Stopping LMS server...
lms server stop

pause
