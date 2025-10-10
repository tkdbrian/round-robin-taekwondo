@echo off
title Sistema de Torneo Taekwon-Do - PORTABLE
cls
echo ================================================
echo    SISTEMA DE TORNEO TAEKWON-DO PORTABLE
echo ================================================
echo.
echo Iniciando sistema de torneo...
echo.

REM Intentar abrir con Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo Abriendo con Google Chrome...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window --disable-web-security --allow-file-access-from-files "%~dp0index.html"
    goto :end
)

REM Intentar abrir con Chrome (x86)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo Abriendo con Google Chrome...
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --new-window --disable-web-security --allow-file-access-from-files "%~dp0index.html"
    goto :end
)

REM Intentar abrir con Firefox
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    echo Abriendo con Mozilla Firefox...
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" -new-window "%~dp0index.html"
    goto :end
)

REM Intentar abrir con Firefox (x86)
if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
    echo Abriendo con Mozilla Firefox...
    start "" "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" -new-window "%~dp0index.html"
    goto :end
)

REM Intentar abrir con Edge
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo Abriendo con Microsoft Edge...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --new-window "%~dp0index.html"
    goto :end
)

REM Fallback: abrir con navegador por defecto
echo Abriendo con navegador por defecto...
start "" "%~dp0index.html"

:end
echo.
echo ================================================
echo   SISTEMA INICIADO CORRECTAMENTE!
echo ================================================
echo.
echo INSTRUCCIONES IMPORTANTES:
echo - NO cerrar esta ventana durante el torneo
echo - Si hay problemas, revisar INSTRUCCIONES_TORNEO.txt
echo - Para soporte: github.com/tkdbrian/round-robin-taekwondo
echo.
echo ¡LISTO PARA USAR EN TU TORNEO!
echo.
pause
