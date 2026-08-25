@echo off
cd /d "%~dp0"
title Claude bot

rem ===================================================================
rem  OPTIONAL - talk to the bots in plain English instead of commands.
rem  Fill in ONE of these, then save the file.
rem
rem  FREE, no card needed:
rem    GROQ        console.groq.com          <- best free option
rem    OPENROUTER  openrouter.ai/keys        free models, slower limits
rem    GEMINI      aistudio.google.com       free tier
rem
rem  PAID:
rem    ANTHROPIC   console.anthropic.com
rem    OPENAI      platform.openai.com       (needs credits, not Plus)
rem    XAI / Grok  console.x.ai              (no free tier, $25 signup)
rem ===================================================================
set GROQ_API_KEY=
set OPENROUTER_API_KEY=
set GEMINI_API_KEY=
set ANTHROPIC_API_KEY=
set OPENAI_API_KEY=
set XAI_API_KEY=

rem Optional: a different model than the default for your provider.
set MC_AI_MODEL=

rem Optional: no key at all - run a model on this PC. Install from ollama.com,
rem then run "ollama pull llama3.2" once and uncomment the next line.
rem set MC_AI_PROVIDER=ollama

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
