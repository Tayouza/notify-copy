const { BrowserWindow, screen, nativeTheme, app } = require('electron');
const path = require('path');

class ToastWindow {
  constructor(config = {}) {
    this.config = config;
    this.window = null;
    this.isShowing = false;
    this.hideTimer = null;
    this.ready = false;
    this._pending = null;
    this._hideWinTimer = null;
    this._readyFallback = null;
  }

  getSize() {
    const mode = (this.config && this.config.toastMode) || 'full';
    if (mode === 'mini') return { width: 100, height: 100 };
    return { width: 340, height: 130 };
  }

  create() {
    if (this.window) return this.window;

    const size = this.getSize();
    const win = new BrowserWindow({
      width: size.width,
      height: size.height,
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
    this.ready = false;
    const size = this.getSize();
    try { win.setSize(size.width, size.height); } catch (e) {}
    if (htmlPath) {
      win.loadFile(htmlPath).catch(() => {
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
    if (ready && this._pending) {
      this._sendShow(this._pending);
    }
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
    const mode = (this.config && this.config.toastMode) || 'full';
    const margin = mode === 'mini' ? 8 : 24;
    const off = mode === 'mini' ? 10 : 16;
    const edge = mode === 'mini' ? 4 : 8;

    if (pos === 'cursor') {
      const cursor = screen.getCursorScreenPoint();
      let x = cursor.x + off;
      let y = cursor.y + off;
      if (x + width > workArea.x + workArea.width) x = cursor.x - width - off;
      if (x < workArea.x) x = workArea.x + edge;
      if (y + height > workArea.y + workArea.height) y = cursor.y - height - off;
      if (y < workArea.y) y = workArea.y + edge;
      return { x, y };
    }

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

    const mode = (this.config && this.config.toastMode) || 'full';
    const payload = {
      text: text || '',
      chars: (text || '').length,
      words: (text || '').trim() === '' ? 0 : (text || '').trim().split(/\s+/).length,
      lines: (text || '').split(/\n/).length,
      durationMs: mode === 'mini' ? 1600 : (this.config.durationMs || 2200),
      theme: this.getTheme(),
      accent: this.config.accent || '#6366f1',
      showPreview: this.config.showPreview !== false,
      mode: mode,
    };

    this._pending = payload;
    if (this.ready) {
      this._sendShow(payload);
    } else {
      // Fallback: se o renderer não sinalizar pronto a tempo, mostra mesmo assim
      if (this._readyFallback) clearTimeout(this._readyFallback);
      this._readyFallback = setTimeout(() => {
        if (this._pending) this._sendShow(this._pending);
      }, 400);
    }
  }

  _sendShow(payload) {
    const win = this.window;
    if (!win || win.isDestroyed()) return;
    this._pending = null;
    if (this._readyFallback) {
      clearTimeout(this._readyFallback);
      this._readyFallback = null;
    }

    const pos = this.computePosition();
    win.setPosition(pos.x, pos.y, false);

    // Cancela um hide em andamento (evita esconder o novo toast)
    if (this._hideWinTimer) {
      clearTimeout(this._hideWinTimer);
      this._hideWinTimer = null;
    }

    win.webContents.send('toast:show', payload);
    win.show();
    this.isShowing = true;

    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, payload.durationMs);
  }

  hide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    const win = this.window;
    if (!win || win.isDestroyed()) {
      this.isShowing = false;
      return;
    }
    try {
      win.webContents.send('toast:hide');
    } catch (e) {
      // ignore
    }
    // Não mexer no hideTimer do próximo toast dentro deste callback
    if (this._hideWinTimer) clearTimeout(this._hideWinTimer);
    this._hideWinTimer = setTimeout(() => {
      this._hideWinTimer = null;
      if (!win.isDestroyed()) win.hide();
      this.isShowing = false;
    }, 200);
  }

  updateTheme() {
    const win = this.window;
    if (win && !win.isDestroyed() && this.ready) {
      win.webContents.send('toast:theme', { theme: this.getTheme() });
    }
  }

  updateAccent() {
    const win = this.window;
    if (win && !win.isDestroyed() && this.ready) {
      win.webContents.send('toast:accent', {
        accent: this.config.accent || '#6366f1',
        accentEnd: null,
      });
    }
  }
}

module.exports = ToastWindow;