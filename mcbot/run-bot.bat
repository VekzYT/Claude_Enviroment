@echo off
cd /d "%~dp0"
title Claude bot

rem ===================================================================
rem  OPTIONAL - talk to the bots in plain English instead of commands.
rem  Get a key at  https://console.anthropic.com  ->  API keys,
rem  then put it between the quotes below and save this file.
rem ===================================================================
set ANTHROPIC_API_KEY=

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
if "%ANTHROPIC_API_KEY%"=="" (
  echo Running with fixed commands only. Say "claude help" in game.
  echo To talk to them in plain English, put an API key in this file.
) else (
  echo AI chat is ON - just talk to them normally.
)
echo Leave this window open. Close it to make the bots leave.
echo.
node index.js
pause
