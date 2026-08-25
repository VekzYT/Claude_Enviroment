@echo off
cd /d "%~dp0"
title Claude bot

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
echo Starting the bot. First run downloads ViaProxy (47MB), one time.
echo Leave this window open. Close it to make the bot leave.
echo.
node index.js
pause
