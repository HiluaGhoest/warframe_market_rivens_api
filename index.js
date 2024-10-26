const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const {shell} = require('electron');

let mainWindow;
let overlayWindow;

// Obtendo o caminho dos recursos da aplicação
const resourcesPath = process.resourcesPath;

// Function to check if the server is running
function checkServerRunning() {
    return new Promise((resolve) => {
        http.get('http://127.0.0.1:8000/notify', (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).on('error', () => {
            resolve(false);
        });
    });
}

// Start the server and return a promise that resolves when the server is running
function startServer() {
    return new Promise((resolve) => {
        // Construindo o caminho para o .bat
        const batFilePath = path.join(resourcesPath, 'server', 'start_server.bat'); // Caminho start_server.bat
        console.log(batFilePath); // Verifica o caminho gerado

        // Open a local file in the default app
        shell.openExternal(batFilePath);
        
        // Verificar se o servidor está rodando
        const interval = setInterval(async () => {
            const isRunning = await checkServerRunning();
            if (isRunning) {
                clearInterval(interval);
                console.log('Servidor está rodando. Inicializando app...');
                resolve(); // Resolver quando o servidor estiver rodando
            } else {
                console.log('Aguardando o servidor iniciar...');
            }
        }, 1000); // Verificar a cada 1 segundos
    });
}


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 1000,
        icon: path.join(__dirname, 'IconMouseOver.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'obfuscated', 'html/index.html'));
    // mainWindow.setMenu(null);
    mainWindow.maximize();
}


function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
      width: 400,
      height: 1000,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
      },
  });

  overlayWindow.loadFile(path.join(__dirname, 'obfuscated', 'html/overlay.html'));
  overlayWindow.setMenu(null);
  overlayWindow.setIgnoreMouseEvents(true);

  mainWindow.on('close', (event) => {
      event.preventDefault();
      app.quit();
  });
}

app.whenReady().then(async () => {
  app.setPath('userData', path.join(app.getPath('appData'), 'riven_shark'));
  globalShortcut.register('CommandOrControl+Shift+I', () => false);
  globalShortcut.register('F12', () => false);

  try {
        await startServer();
        console.log('Server started successfully.');


        // Adicione um atraso aqui, se necessário
        setTimeout(() => {
            createWindow();
            createOverlayWindow();
            registerHotkeys();
            overlayWindow.setPosition(0, 0);
            overlayWindow.hide();
        }, 1000);
  } catch (error) {
      console.error('Failed to start the server:', error);
      app.quit();
  }

  app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
      }
  });
});

ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
});

app.on('browser-window-created', (event, window) => {
    // Remove menu from all new windows
    // window.setMenuBarVisibility(false);
    // window.removeMenu();
});

ipcMain.on('send-overlay-data', (event, data) => {
    if (overlayWindow) {
        overlayWindow.webContents.send('update-overlay', data);
        overlayWindow.show();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function registerHotkeys() {
    for (let i = 1; i <= 9; i++) {
        globalShortcut.register(`Control+${i}`, () => {
            overlayWindow.webContents.send('get-snipe-command', i);
        });
    }
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
    if (overlayWindow) {
        overlayWindow.destroy();
    }

    if (mainWindow) {
        mainWindow.destroy();
    }
    // Construindo o caminho para o .bat
    const stopBatPath = path.join(resourcesPath, 'server', 'stop_server.bat'); // Caminho stop_server.bat
    console.log(stopBatPath); // Verifica o caminho gerado
    shell.openExternal(stopBatPath);

    const cmd = spawn(stopBatPath, {
        detached: true,
        shell: true,
    });

    cmd.stdout.on('data', (data) => {
        console.log(`Output: ${data}`);
    });

    cmd.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });

    cmd.on('exit', (code) => {
        console.log(`Executable saiu com código: ${code}`);
    });
});

