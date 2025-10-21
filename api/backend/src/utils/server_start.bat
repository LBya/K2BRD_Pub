@echo off
REM *** Server Start Batch File ***
REM This batch file launches the LMS server, loads a model, and starts streaming logs.
REM Kick off the LMS server – because waiting forever is not an option.
echo Starting LMS server...
lms server start

REM Load the Mistral model with a custom identifier – the star of the show!
echo Loading Mistral model...
lms load "lmstudio-community/Mistral-7B-Instruct-v0.3-GGUF/Mistral-7B-Instruct-v0.3-Q4_K_M.gguf" --identifier "minstral lms"

REM Optional model alternatives – uncomment these lines if you fancy a change of pace:
REM If you want to try the DeepSeek model for a deeper dive, remove the REM below:
REM lms load "lmstudio-community/DeepSeek-R1-Distill-Qwen-14B-GGUF/DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf" --identifier "deepseek lms"

REM Or, if you’re in the mood for Qwen’s charm, remove the REM here:
REM lms load "lmstudio-community/Qwen2.5-0.5B-Instruct-GGUF/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf" --identifier "qwen lms"

REM Now, let’s stream those logs – grab a cuppa, it might be entertaining!
echo Streaming LMS logs...
lms log stream

pause
