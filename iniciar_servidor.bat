@echo off
title Sistema Taekwon-Do - Servidor Local
color 0A

echo ===============================================
echo    SISTEMA DE PUNTUACION TAEKWON-DO v2.0
echo ===============================================
echo.
echo [INFO] Iniciando servidor local...
echo [INFO] El sistema se abrira automaticamente
echo.

:: Buscar Python instalado
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python encontrado
    echo [INFO] Iniciando servidor en puerto 8000...
    echo.
    echo ===============================================
    echo   SISTEMA DISPONIBLE EN:
    echo   http://localhost:8000
    echo ===============================================
    echo.
    echo Presiona CTRL+C para detener el servidor
    echo.
    
    :: Abrir navegador automaticamente
    timeout /t 2 /nobreak >nul
    start http://localhost:8000
    
    :: Iniciar servidor Python
    python -m http.server 8000
) else (
    echo [ERROR] Python no encontrado
    echo.
    echo Por favor instala Python desde:
    echo https://python.org/downloads
    echo.
    echo O usa la opcion 1: doble clic en index.html
    pause
)