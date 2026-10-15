@echo off
setlocal
set "APP_DIR=%~dp0"
set "NODE_EXE=%APP_DIR%runtime\node.exe"
set "MAIN_JS=%APP_DIR%backend\dist\main.js"
set "PORT=4317"
set "APP_URL=http://127.0.0.1:%PORT%"
set "SERVE_FRONTEND=true"
set "NODE_ENV=production"
set "APP_DATA=%LOCALAPPDATA%\SistemaCompras"
set "DATABASE_FILE=%APP_DATA%\data\app.sqlite"

if not exist "%NODE_EXE%" (
  echo Runtime do Node.js nao encontrado. Reinstale o Sistema de Compras.
  pause
  exit /b 1
)
if not exist "%MAIN_JS%" (
  echo Arquivos da aplicacao incompletos. Reinstale o Sistema de Compras.
  pause
  exit /b 1
)

if not exist "%APP_DATA%\data" mkdir "%APP_DATA%\data"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { $health = Invoke-RestMethod -Uri '%APP_URL%/api/health' -TimeoutSec 2; if ($health.service -eq 'sistema-compras') { exit 0 } } catch { }; exit 1"
if errorlevel 1 (
  start "Sistema de Compras" /min "%NODE_EXE%" "%MAIN_JS%"
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "for ($i = 0; $i -lt 45; $i++) { try { $health = Invoke-RestMethod -Uri '%APP_URL%/api/health' -TimeoutSec 1; if ($health.service -eq 'sistema-compras') { Start-Process '%APP_URL%'; exit 0 } } catch { }; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo O Sistema de Compras nao iniciou. Verifique se a porta %PORT% esta livre.
  pause
  exit /b 1
)
