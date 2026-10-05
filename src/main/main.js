const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { readConfig, writeConfig } = require('./config');
const ClipboardWatcher = require('./clipboard-watcher');
const ToastWindow = require('./toast-window');
const { createTray } = require('./tray');

// Platform flags - must be set before app is ready
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

let config = readConfig();
let trayManager = null;
let toastWindow = null;
let watcher = null;
let demoMode = process.env.NOTIFYCOPY_DEMO === '1' || process.argv.includes('--demo');
let captureMode = process.env.NOTIFYCOPY_CAPTURE === '1';

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
    toastWindow.updateTheme();
  }
  updateTray();
  setupLoginItem();
  writeConfig(config);
}

async function captureToast() {
  if (!toastWindow || !toastWindow.window) return;
  const win = toastWindow.window;
  if (win.isDestroyed()) return;
  try {
    const docsDir = path.join(__dirname, '../../docs');
    fs.mkdirSync(docsDir, { recursive: true });
    const pngPath = path.join(docsDir, 'preview.png');
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
  const toastHtml = path.join(__dirname, '../renderer/toast.html');
  if (toastWindow) {
    toastWindow.load(fs.existsSync(toastHtml) ? toastHtml : null);
    return toastWindow.window;
  }
  toastWindow = new ToastWindow(config);
  toastWindow.load(fs.existsSync(toastHtml) ? toastHtml : null);
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
  await createWindow();
  // Small delay on Linux for transparency
  if (process.platform === 'linux') {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  setupTray();
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