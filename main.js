const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'favicon.ico'),
        title: 'Sistema Taekwon-Do Round Robin',
        show: false // No mostrar hasta que esté listo
    });

    // Cargar la aplicación
    win.loadFile('index.html');

    // Mostrar cuando esté listo
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });

    // Configurar menú personalizado
    const menuTemplate = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Nueva Categoría',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        win.webContents.executeJavaScript('window.location.reload()');
                    }
                },
                {
                    label: 'Exportar Resultados',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        win.webContents.executeJavaScript('if(window.tournament) tournament.exportResults()');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                {
                    label: 'Tabla de Posiciones',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        win.webContents.executeJavaScript('if(window.tournament) tournament.showTournamentResults()');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Pantalla Completa',
                    accelerator: 'F11',
                    click: () => {
                        win.setFullScreen(!win.isFullScreen());
                    }
                },
                {
                    label: 'Herramientas de Desarrollador',
                    accelerator: 'F12',
                    click: () => {
                        win.webContents.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de',
                    click: () => {
                        win.webContents.executeJavaScript(`
                            alert('Sistema de Puntuación Taekwon-Do\\n\\nVersión: 1.0.0\\nDesarrollado por: Brian E. Lipnjak\\n\\nSistema completo para torneos Round Robin y Brackets');
                        `);
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Prevenir navegación externa
    win.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Configuración adicional para Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('com.taekwondo.scoring');
}