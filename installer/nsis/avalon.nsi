; Avalon Agentique Platform — NSIS installer
; Prefer `tauri build` (generates NSIS automatically). This script is a fallback/manual path.

Unicode true
Name "Avalon Agentique Platform"
BrandingText "Avalon Capital"
OutFile "..\..\release\Avalon-Agentique-Platform-Setup.exe"
InstallDir "$PROGRAMFILES64\Avalon Capital\Avalon Agentique Platform"
InstallDirRegKey HKLM "Software\Avalon Capital\Agentique Platform" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

!include "MUI2.nsh"

!define PRODUCT_VERSION "0.1.0"
!define PRODUCT_PUBLISHER "Avalon Capital"

Var StartMenuFolder

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Avalon Agentique Platform" SecMain
  SetOutPath "$INSTDIR"

  ; Payload produced by tauri/cargo release — adjust path when using manual NSIS
  ; File /r "..\..\apps\desktop\src-tauri\target\release\Avalon Agentique Platform.exe"
  ; File /r "..\..\target\release\avalon-core.exe"

  ; Application data lives under LocalAppData — never next to secrets in Program Files
  CreateDirectory "$LOCALAPPDATA\Avalon Capital\Agentique Platform"
  CreateDirectory "$LOCALAPPDATA\Avalon Capital\Agentique Platform\secure"
  CreateDirectory "$LOCALAPPDATA\Avalon Capital\Agentique Platform\workspaces"
  CreateDirectory "$LOCALAPPDATA\Avalon Capital\Agentique Platform\logs"

  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Avalon Agentique Platform.lnk" "$INSTDIR\Avalon Agentique Platform.exe"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  !insertmacro MUI_STARTMENU_WRITE_END

  CreateShortCut "$DESKTOP\Avalon Agentique Platform.lnk" "$INSTDIR\Avalon Agentique Platform.exe"

  WriteRegStr HKLM "Software\Avalon Capital\Agentique Platform" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Avalon Capital\Agentique Platform" "Version" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvalonAgentique" "DisplayName" "Avalon Agentique Platform"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvalonAgentique" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvalonAgentique" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvalonAgentique" "Publisher" "${PRODUCT_PUBLISHER}"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Avalon Agentique Platform.lnk"
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  RMDir /r "$SMPROGRAMS\$StartMenuFolder"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvalonAgentique"
  DeleteRegKey HKLM "Software\Avalon Capital\Agentique Platform"
  ; Intentionally leave %LOCALAPPDATA% data for user recovery — do not wipe vault on uninstall
SectionEnd
