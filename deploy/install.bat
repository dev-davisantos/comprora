@echo off
setlocal
set "SOURCE_DIR=%~dp0app"
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\Sistema de Compras"

if not exist "%SOURCE_DIR%\runtime\node.exe" (
  echo Arquivos de instalacao incompletos. Extraia novamente o pacote completo.
  pause
  exit /b 1
)

if not exist "%LOCALAPPDATA%\Programs" mkdir "%LOCALAPPDATA%\Programs"
robocopy "%SOURCE_DIR%" "%INSTALL_DIR%" /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP
if errorlevel 8 (
  echo Nao foi possivel copiar os arquivos para "%INSTALL_DIR%".
  pause
  exit /b 1
)

set "SC_INSTALL_DIR=%INSTALL_DIR%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$shell = New-Object -ComObject WScript.Shell; $target = Join-Path $env:SC_INSTALL_DIR 'run.bat'; foreach ($folder in @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('Desktop'))) { $shortcut = $shell.CreateShortcut((Join-Path $folder 'Sistema de Compras.lnk')); $shortcut.TargetPath = $target; $shortcut.WorkingDirectory = $env:SC_INSTALL_DIR; $shortcut.Save() }"
if errorlevel 1 (
  echo Aplicacao instalada, mas nao foi possivel criar os atalhos.
  pause
  exit /b 1
)

echo Instalacao concluida. Iniciando o Sistema de Compras no navegador...
start "" "%INSTALL_DIR%\run.bat"
