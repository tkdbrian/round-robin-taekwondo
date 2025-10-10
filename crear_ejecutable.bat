@echo off
echo ============================================
echo   CREAR EJECUTABLE PARA TAEKWON-DO SCORING
echo ============================================
echo.
echo Este script creara un ejecutable portable
echo que funciona sin internet en cualquier PC
echo.
pause

echo Instalando herramientas necesarias...
npm install -g electron-builder electron

echo Creando package.json para Electron...
echo {
echo   "name": "taekwondo-scoring",
echo   "version": "1.0.0",
echo   "description": "Sistema de Puntuacion Taekwon-Do",
echo   "main": "main.js",
echo   "scripts": {
echo     "start": "electron .",
echo     "build": "electron-builder",
echo     "dist": "electron-builder --publish=never"
echo   },
echo   "build": {
echo     "appId": "com.taekwondo.scoring",
echo     "productName": "Taekwon-Do Scoring System",
echo     "directories": {
echo       "output": "dist"
echo     },
echo     "files": [
echo       "**/*",
echo       "!node_modules",
echo       "!dist"
echo     ],
echo     "win": {
echo       "target": "portable",
echo       "icon": "icon.ico"
echo     }
echo   },
echo   "devDependencies": {
echo     "electron": "latest",
echo     "electron-builder": "latest"
echo   }
echo } > package.json

echo Creando archivo principal de Electron...
echo const { app, BrowserWindow } = require('electron');
echo const path = require('path');
echo.
echo function createWindow() {
echo   const win = new BrowserWindow({
echo     width: 1200,
echo     height: 800,
echo     webPreferences: {
echo       nodeIntegration: true,
echo       contextIsolation: false
echo     },
echo     icon: path.join(__dirname, 'icon.ico')
echo   });
echo.
echo   win.loadFile('index.html');
echo   win.setTitle('Sistema Taekwon-Do - Round Robin');
echo }
echo.
echo app.whenReady().then(createWindow);
echo.
echo app.on('window-all-closed', () => {
echo   if (process.platform !== 'darwin') {
echo     app.quit();
echo   }
echo });
echo.
echo app.on('activate', () => {
echo   if (BrowserWindow.getAllWindows().length === 0) {
echo     createWindow();
echo   }
echo }); > main.js

echo.
echo Instalando dependencias...
npm install

echo.
echo Creando ejecutable portable...
npm run dist

echo.
echo ============================================
echo   EJECUTABLE CREADO EN: dist/
echo ============================================
echo.
echo El archivo .exe estara en la carpeta 'dist'
echo y podras copiarlo a cualquier PC sin necesidad
echo de instalar nada.
echo.
pause