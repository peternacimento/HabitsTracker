@echo off
title HabitsTracker

echo Iniciando HabitsTracker...
echo.

REM Backend
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Aguarda o backend subir
timeout /t 3 /nobreak >nul

REM Frontend
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Docs API: http://localhost:8000/docs
echo.
echo Pressione qualquer tecla para abrir o browser...
pause >nul
start http://localhost:5173
