@echo off
setlocal
cd /d "%~dp0\.."
echo === Avalon: install Macro-X (sans Visual Studio / sans cargo) ===
echo Prerequisite: Python 3 (py -3 ou python) doit etre installe.
where py >nul 2>&1
if errorlevel 1 (
  where python >nul 2>&1
  if errorlevel 1 (
    echo ERREUR: Python introuvable. Installe Python 3 depuis python.org puis reouvre ce script.
    pause
    exit /b 1
  )
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-agent-windows.ps1" -SourceDir "%~dp0..\agents\codex-drop\macro-x" -StartUi
if errorlevel 1 (
  echo ECHEC. Verifie que le dossier agents\codex-drop\macro-x contient avalon-agent.json
  pause
  exit /b 1
)
echo.
echo Ensuite dans Avalon: Agents -^> Installer le paquet agent -^> Demarrer
pause
