@echo off
title Creando Ejecutable Taekwon-Do
color 0A

echo ===============================================
echo    CREANDO EJECUTABLE TAEKWON-DO SCORING
echo ===============================================
echo.
echo [INFO] Creando ejecutable portable sin dependencias...
echo.

:: Crear estructura básica
echo [1/4] Preparando archivos...
if not exist "portable" mkdir portable
copy "index.html" "portable\"
copy "script.js" "portable\"
copy "styles.css" "portable\"
copy "manifest.json" "portable\"

:: Crear launcher HTML mejorado
echo [2/4] Creando launcher...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="es"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Sistema Taekwon-Do Round Robin^</title^>
echo     ^<style^>
echo         body { 
echo             margin: 0; 
echo             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
echo             background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%^);
echo             display: flex;
echo             justify-content: center;
echo             align-items: center;
echo             min-height: 100vh;
echo         }
echo         .launcher {
echo             background: white;
echo             padding: 40px;
echo             border-radius: 20px;
echo             box-shadow: 0 20px 40px rgba(0,0,0,0.1^);
echo             text-align: center;
echo             max-width: 500px;
echo         }
echo         .logo { font-size: 3rem; margin-bottom: 20px; }
echo         h1 { color: #333; margin-bottom: 10px; }
echo         .version { color: #666; margin-bottom: 30px; }
echo         .start-btn {
echo             background: linear-gradient(135deg, #667eea, #764ba2^);
echo             color: white;
echo             border: none;
echo             padding: 15px 30px;
echo             font-size: 1.1rem;
echo             border-radius: 10px;
echo             cursor: pointer;
echo             transition: transform 0.2s;
echo         }
echo         .start-btn:hover { transform: translateY(-2px^); }
echo         .info { margin-top: 20px; color: #666; font-size: 0.9rem; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="launcher"^>
echo         ^<div class="logo"^>🥋^</div^>
echo         ^<h1^>Sistema Taekwon-Do^</h1^>
echo         ^<p class="version"^>Round Robin ^& Brackets - v1.0^</p^>
echo         ^<button class="start-btn" onclick="window.location.href='index.html'"^>
echo             ▶️ Iniciar Sistema
echo         ^</button^>
echo         ^<div class="info"^>
echo             ^<p^>✅ Sistema offline - No requiere internet^</p^>
echo             ^<p^>💾 Auto-guardado automático^</p^>
echo             ^<p^>📊 Exportación a HTML/CSV^</p^>
echo         ^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "portable\launcher.html"

:: Crear script de ejecución
echo [3/4] Creando script de inicio...
(
echo @echo off
echo title Sistema Taekwon-Do Round Robin
echo cls
echo echo ===============================================
echo echo    SISTEMA TAEKWON-DO ROUND ROBIN v1.0
echo echo ===============================================
echo echo.
echo echo [INFO] Iniciando sistema local...
echo echo [INFO] El sistema se abrira automaticamente
echo echo.
echo timeout /t 2 /nobreak ^>nul
echo start launcher.html
echo echo.
echo echo ===============================================
echo echo   SISTEMA DISPONIBLE
echo echo   Cierra esta ventana cuando termines
echo echo ===============================================
echo pause
) > "portable\Iniciar_Taekwondo.bat"

:: Crear documentación
echo [4/4] Creando documentación...
(
echo ===============================================
echo    SISTEMA TAEKWON-DO ROUND ROBIN v1.0
echo ===============================================
echo.
echo INSTRUCCIONES DE USO:
echo.
echo 1. Hacer doble clic en "Iniciar_Taekwondo.bat"
echo 2. Se abrira el navegador automaticamente
echo 3. El sistema funciona completamente SIN INTERNET
echo.
echo CARACTERÍSTICAS:
echo - Torneos Round Robin (3-5 competidores^)
echo - Torneos con Brackets (6-8 competidores^)
echo - Sistema de 4 jueces
echo - Auto-guardado automático
echo - Exportación a HTML y CSV
echo - Historial de peleas con fecha/hora
echo.
echo ARCHIVOS INCLUIDOS:
echo - launcher.html (pantalla de inicio^)
echo - index.html (aplicación principal^)
echo - script.js (lógica del sistema^)
echo - styles.css (estilos^)
echo - manifest.json (configuración^)
echo - Iniciar_Taekwondo.bat (ejecutor^)
echo.
echo SOPORTE:
echo - Desarrollado por: Brian E. Lipnjak
echo - Version: 1.0
echo - Fecha: Octubre 2025
echo.
echo ===============================================
) > "portable\LEEME.txt"

echo.
echo ===============================================
echo   ✅ EJECUTABLE PORTABLE CREADO
echo ===============================================
echo.
echo Ubicación: .\portable\
echo.
echo Para usar:
echo 1. Copia la carpeta "portable" a cualquier PC
echo 2. Ejecuta "Iniciar_Taekwondo.bat"
echo 3. Disfruta del sistema!
echo.
echo El sistema funciona completamente SIN INTERNET
echo.
pause