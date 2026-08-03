@echo off
setlocal
cd /d "%~dp0\.."
echo === Avalon: install Macro-X (sans Visual Studio / sans cargo) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-agent-windows.ps1" -SourceDir "%~dp0..\agents\codex-drop\macro-x" -StartUi
if errorlevel 1 (
  echo ECHEC. Verifie que le dossier agents\codex-drop\macro-x contient avalon-agent.json
  pause
  exit /b 1
)
echo.
echo Ensuite dans Avalon: Agents -^> Installer le paquet agent -^> Demarrer
pause
