; Avalon Agentique Platform NSIS stub — used when packaging outside Tauri bundler
Name "Avalon Agentique Platform"
OutFile "..\..\release\Avalon-Agentique-Platform-Setup.exe"
InstallDir "$PROGRAMFILES64\Avalon Capital\Avalon Agentique Platform"
RequestExecutionLevel admin
Page directory
Page instfiles
Section "Install"
  SetOutPath $INSTDIR
  ; File /r "...\payload\*"
  CreateShortCut "$DESKTOP\Avalon Agentique Platform.lnk" "$INSTDIR\Avalon Agentique Platform.exe"
  CreateShortCut "$SMPROGRAMS\Avalon Capital\Avalon Agentique Platform.lnk" "$INSTDIR\Avalon Agentique Platform.exe"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd
Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"
SectionEnd
