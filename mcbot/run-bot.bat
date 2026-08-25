@echo off
cd /d "%~dp0"
title Claude bot

rem ===================================================================
rem  OPTIONAL - talk to the bots in plain English instead of commands.
rem  Fill in ONE of these three, then save the file. Any of them works.
rem
rem   Claude   https://console.anthropic.com   -> API keys
rem   ChatGPT  https://platform.openai.com     -> API keys
rem   Gemini   https://aistudio.google.com     -> Get API key
rem ===================================================================
set ANTHROPIC_API_KEY=
set OPENAI_API_KEY=
set GEMINI_API_KEY=

rem Optional: pick a different model than the default for your provider.
set MC_AI_MODEL=

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Get it here:  https://nodejs.org   ^(pick the LTS button^)
  echo   Then run this again.
  echo.
  pause
  exit /b
)

if not exist node_modules (
  echo Installing the bot's libraries, one time, please wait...
  call npm install --no-audit --no-fund
)

rem Your server, on this same PC. No tunnel needed.
set MC_HOST=127.0.0.1
set MC_PORT=25565
set MC_VERSION=26.2
set MC_USERNAME=Claude
set MC_PREFIX=claude
set MC_BACKEND_PROXY=

echo.
echo Leave this window open. Close it to make the bots leave.
node index.js
pause
