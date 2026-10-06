const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { readConfig, writeConfig } = require('./config');
const ClipboardWatcher = require('./clipboard-watcher');
const ToastWindow = require('./toast-window');
const { createTray } = require('./tray');
const cursor = require('./cursor');

// Platform flags - must be set before app is ready
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  // X11/XWayland: garante posicionamento preciso. No Wayland nativo o compositor
  // ignora setPosition e o toast não fica no cursor (nem perto da borda).
  app.commandLine.appendSwitch('ozone-platform-hint', 'x11');
}

let config = readConfig();
let trayManager = null;
let toastWindow = null;
let watcher = null;
let demoMode = process.env.NOTIFYCOPY_DEMO === '1' || process.argv.includes('--demo');
let captureMode = process.env.NOTIFYCOPY_CAPTURE === '1';
let miniMode = process.argv.includes('--mini');
let forceAccent = null;
let currentMode = null;
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--accent=')) {
    const v = process.argv[i].split('=')[1];
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v || '')) {
      forceAccent = v;
    }
  }
}

function setupLoginItem() {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!config.launchAtLogin,
      openAsHidden: false,
    });
  } catch (e) {
    // ignore
  }
}

function updateTray() {
  if (trayManager) {
    trayManager.update(config);
  }
}

function applyConfigChanges() {
  if (watcher) {
    watcher.setEnabled(config.enabled);
  }
  if (toastWindow) {
    toastWindow.config = config;
    const mode = config.toastMode || 'full';
    // Só recarrega o HTML quando o estilo muda (evita recarregar a cada ajuste)
    if (mode !== currentMode) {
      currentMode = mode;
      const htmlPath = mode === 'mini'
        ? path.join(__dirname, '../renderer/mini.html')
        : path.join(__dirname, '../renderer/toast.html');
      toastWindow.load(fs.existsSync(htmlPath) ? htmlPath : null);
    }
    toastWindow.updateTheme();
    toastWindow.updateAccent();
  }
  updateTray();
  setupLoginItem();
  // Não persiste quando flags de sessão (--mini/--accent) foram usadas
  if (!miniMode && !forceAccent) {
    writeConfig(config);
  }
}

async function captureToast() {
  if (!toastWindow || !toastWindow.window) return;
  const win = toastWindow.window;
  if (win.isDestroyed()) return;
  try {
    const docsDir = path.join(__dirname, '../../docs');
    fs.mkdirSync(docsDir, { recursive: true });
    const fileName = (config.toastMode === 'mini') ? 'preview-mini.png' : 'preview.png';
    const pngPath = path.join(docsDir, fileName);
    const image = await win.webContents.capturePage();
    fs.writeFileSync(pngPath, image.toPNG());
    console.log(`CAPTURED ${pngPath}`);
  } catch (e) {
    console.error('Failed to capture:', e);
  }
}

function startDemo() {
  // Show demo toast
  if (toastWindow) {
    const demoText = 'Texto copiado com sucesso!';
    toastWindow.show(demoText);
  }
  console.log('DEMO_READY');
  if (captureMode) {
    setTimeout(() => {
      captureToast();
      setTimeout(() => {
        app.quit();
      }, 1000);
    }, 800);
  } else {
    setTimeout(() => {
      app.quit();
    }, 3000);
  }
}

async function createWindow() {
  const mode = config.toastMode || 'full';
  currentMode = mode;
  const htmlPath = mode === 'mini' 
    ? path.join(__dirname, '../renderer/mini.html')
    : path.join(__dirname, '../renderer/toast.html');
  if (toastWindow) {
    toastWindow.load(fs.existsSync(htmlPath) ? htmlPath : null);
    return toastWindow.window;
  }
  toastWindow = new ToastWindow(config);
  toastWindow.load(fs.existsSync(htmlPath) ? htmlPath : null);
  return toastWindow.window;
}

function setupWatcher() {
  if (demoMode) return;
  watcher = new ClipboardWatcher({
    onChange: (text) => {
      if (!config.enabled) return;
      if (toastWindow) {
        toastWindow.show(text);
      }
    },
    interval: 450,
    enabled: config.enabled,
  });
  watcher.start();
}

function setupTray() {
  const assetsDir = path.join(__dirname, '../../assets');
  const iconPath = path.join(assetsDir, 'icon.png');
  trayManager = createTray(iconPath, config, {
    onToggleEnabled: () => {
      config.enabled = !config.enabled;
      applyConfigChanges();
    },
    onSetDuration: (ms) => {
      config.durationMs = ms;
      applyConfigChanges();
    },
    onSetPosition: (pos) => {
      config.position = pos;
      applyConfigChanges();
    },
    onSetTheme: (theme) => {
      config.theme = theme;
      applyConfigChanges();
      if (toastWindow) {
        toastWindow.updateTheme();
      }
    },
    onSetAccent: (hex) => {
      config.accent = hex;
      applyConfigChanges();
    },
    onSetToastMode: (mode) => {
      config.toastMode = mode;
      applyConfigChanges();
    },
    onSetLaunchAtLogin: (checked) => {
      config.launchAtLogin = checked;
      applyConfigChanges();
    },
  });
}

function setupIpc() {
  ipcMain.on('toast:ready', () => {
    if (toastWindow) {
      toastWindow.setReady(true);
    }
  });
}

function ensureSingleInstance() {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return false;
  }
  return true;
}

async function init() {
  if (!ensureSingleInstance()) return;

  // Hide dock on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  setupIpc();
  cursor.startTracking();
  if (miniMode) {
    config.toastMode = 'mini';
  }
  if (forceAccent) {
    config.accent = forceAccent;
  }
  await createWindow();
  // Small delay on Linux for transparency
  if (process.platform === 'linux') {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  setupTray();
  nativeTheme.on('updated', () => {
    if (toastWindow) toastWindow.updateTheme();
  });
  setupWatcher();
  setupLoginItem();
  applyConfigChanges();

  // Demo mode
  if (demoMode) {
    startDemo();
  }
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('will-quit', () => {
  if (watcher) {
    watcher.stop();
    watcher = null;
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});