@echo off
setlocal
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v22.18.0-win-x64;%PATH%"
npm.cmd run dev >> dev-server.out.log 2>> dev-server.err.log
