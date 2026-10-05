const { BrowserWindow, screen, nativeTheme, app } = require('electron');
const path = require('path');

class ToastWindow {
  constructor(config = {}) {
    this.config = config;
    this.window = null;
    this.isShowing = false;
    this.hideTimer = null;
    this.ready = false;
  }

  create() {
    if (this.window) return this.window;

    const win = new BrowserWindow({
      width: 340,
      height: 130,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      hasShadow: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Ignore mouse events; forward to underlying windows
    win.setIgnoreMouseEvents(true, { forward: true });

    // macOS specific
    if (process.platform === 'darwin') {
      try {
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.setWindowButtonVisibility(false);
      } catch (e) {
        // ignore
      }
    }

    this.window = win;
    return win;
  }

  load(htmlPath) {
    const win = this.create();
    if (htmlPath) {
      win.loadFile(htmlPath).catch(() => {
        // fallback if file not found
        const placeholder = 'data:text/html;charset=utf-8,' + encodeURIComponent(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:transparent;font-family:system-ui}</style></head><body></body></html>'
        );
        win.loadURL(placeholder);
      });
    } else {
      const placeholder = 'data:text/html;charset=utf-8,' + encodeURIComponent(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:transparent;font-family:system-ui}</style></head><body></body></html>'
      );
      win.loadURL(placeholder);
    }
  }

  setReady(ready) {
    this.ready = ready;
  }

  getTheme() {
    const theme = this.config.theme || 'auto';
    if (theme === 'light') return 'light';
    if (theme === 'dark') return 'dark';
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  computePosition() {
    const win = this.create();
    const [width, height] = win.getSize();
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const workArea = display.workArea;
    const pos = this.config.position || 'cursor';

    if (pos === 'cursor') {
      const cursor = screen.getCursorScreenPoint();
      let x = cursor.x + 16;
      let y = cursor.y + 16;
      if (x + width > workArea.x + workArea.width) x = workArea.x + workArea.width - width - 8;
      if (x < workArea.x) x = workArea.x + 8;
      if (y + height > workArea.y + workArea.height) y = cursor.y - height - 16;
      if (y < workArea.y) y = workArea.y + 8;
      return { x, y };
    }

    const margin = 24;
    let x = workArea.x;
    let y = workArea.y;

    if (pos === 'bottom-right') {
      x = workArea.x + workArea.width - width - margin;
      y = workArea.y + workArea.height - height - margin;
    } else if (pos === 'bottom-left') {
      x = workArea.x + margin;
      y = workArea.y + workArea.height - height - margin;
    } else if (pos === 'top-right') {
      x = workArea.x + workArea.width - width - margin;
      y = workArea.y + margin;
    } else if (pos === 'top-left') {
      x = workArea.x + margin;
      y = workArea.y + margin;
    } else if (pos === 'bottom-center') {
      x = workArea.x + Math.floor((workArea.width - width) / 2);
      y = workArea.y + workArea.height - height - margin;
    } else {
      // fallback
      const cursor = screen.getCursorScreenPoint();
      x = cursor.x + 16;
      y = cursor.y + 16;
    }
    return { x, y };
  }

  show(text) {
    const win = this.create();
    if (!win) return;

    const payload = {
      text: text || '',
      chars: (text || '').length,
      words: (text || '').trim() === '' ? 0 : (text || '').trim().split(/\s+/).length,
      lines: (text || '').split(/\n/).length,
      durationMs: this.config.durationMs || 2200,
      theme: this.getTheme(),
      accent: this.config.accent || '#6366f1',
      showPreview: this.config.showPreview !== false,
    };

    const pos = this.computePosition();
    win.setPosition(pos.x, pos.y, false);

    // Send show after ready; if not ready yet, still try to show
    const sendShow = () => {
      if (win.isDestroyed()) return;
      win.webContents.send('toast:show', payload);
      win.show();
      this.isShowing = true;

      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      this.hideTimer = setTimeout(() => {
        this.hide();
      }, payload.durationMs);
    };

    if (this.ready) {
      sendShow();
    } else {
      // Wait a bit for renderer to be ready
      setTimeout(sendShow, 100);
    }
  }

  hide() {
    const win = this.window;
    if (!win || win.isDestroyed()) {
      this.isShowing = false;
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      return;
    }
    try {
      win.webContents.send('toast:hide');
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.hide();
      }
      this.isShowing = false;
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    }, 200);
  }

  updateTheme() {
    const win = this.window;
    if (win && !win.isDestroyed() && this.ready) {
      win.webContents.send('toast:theme', { theme: this.getTheme() });
    }
  }
}

module.exports = ToastWindow;