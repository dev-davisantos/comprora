@echo off
setlocal
set "ROOT_DIR=%~dp0"

if not exist "%ROOT_DIR%backend\node_modules" (
  echo Backend dependencies are missing. Run "npm ci" in the backend folder first.
  pause
  exit /b 1
)
if not exist "%ROOT_DIR%frontend\node_modules" (
  echo Frontend dependencies are missing. Run "npm ci" in the frontend folder first.
  pause
  exit /b 1
)

start "Sistema de Compras - API" cmd /k "cd /d ""%ROOT_DIR%backend"" && npm run start:dev"
start "Sistema de Compras - Frontend" cmd /k "cd /d ""%ROOT_DIR%frontend"" && npm run dev -- --host 127.0.0.1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$url = 'http://127.0.0.1:5173/api/health'; for ($i = 0; $i -lt 180; $i++) { try { $health = Invoke-RestMethod -Uri $url -TimeoutSec 2; if ($health.service -eq 'sistema-compras') { Start-Process 'http://127.0.0.1:5173'; exit 0 } } catch { }; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo A API e o frontend nao ficaram prontos. Verifique as janelas abertas e as portas 3000 e 5173.
  pause
  exit /b 1
)
