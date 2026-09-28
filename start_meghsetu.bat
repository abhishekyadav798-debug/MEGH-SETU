@echo off
title Start MeghSetu Platform
color 0b
echo ====================================================
echo             STARTING MEGH-SETU PLATFORM
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting MeghSetu Backend on port 5000...
start "MeghSetu Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting MeghSetu Frontend (Vite)...
start "MeghSetu Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo   Backend & Frontend are starting!
echo   Frontend URL: http://localhost:5173
echo   Backend URL:  http://localhost:5000
echo ====================================================
echo.
pause
