const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

function createTray(iconPath, config, options = {}) {
  let tray = null;
  try {
    let icon = nativeImage.createEmpty();
    if (iconPath && fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    } else {
      // fallback to a simple 16x16 icon if available; else empty
      const pngPath = path.join(__dirname, '../../assets/icon.png');
      if (fs.existsSync(pngPath)) {
        icon = nativeImage.createFromPath(pngPath);
      }
    }
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: 18, height: 18 });
    }
    tray = new Tray(icon);
  } catch (e) {
    tray = new Tray(nativeImage.createEmpty());
  }

  const buildMenu = () => {
    const menu = Menu.buildFromTemplate([
      {
        label: config.enabled ? 'Desativar' : 'Ativar',
        click: () => {
          if (options.onToggleEnabled) options.onToggleEnabled();
        },
      },
      { type: 'separator' },
      {
        label: 'Duração',
        submenu: [
          { label: 'Curta (1.2s)', type: 'radio', checked: config.durationMs === 1200, click: () => options.onSetDuration(1200) },
          { label: 'Normal (2.2s)', type: 'radio', checked: config.durationMs === 2200, click: () => options.onSetDuration(2200) },
          { label: 'Longa (3.5s)', type: 'radio', checked: config.durationMs === 3500, click: () => options.onSetDuration(3500) },
        ],
      },
      {
        label: 'Posição',
        submenu: [
          { label: 'Cursor', type: 'radio', checked: config.position === 'cursor', click: () => options.onSetPosition('cursor') },
          { label: 'Inferior direito', type: 'radio', checked: config.position === 'bottom-right', click: () => options.onSetPosition('bottom-right') },
          { label: 'Inferior esquerdo', type: 'radio', checked: config.position === 'bottom-left', click: () => options.onSetPosition('bottom-left') },
          { label: 'Superior direito', type: 'radio', checked: config.position === 'top-right', click: () => options.onSetPosition('top-right') },
          { label: 'Superior esquerdo', type: 'radio', checked: config.position === 'top-left', click: () => options.onSetPosition('top-left') },
          { label: 'Inferior central', type: 'radio', checked: config.position === 'bottom-center', click: () => options.onSetPosition('bottom-center') },
        ],
      },
      {
        label: 'Tema',
        submenu: [
          { label: 'Automático', type: 'radio', checked: config.theme === 'auto', click: () => options.onSetTheme('auto') },
          { label: 'Claro', type: 'radio', checked: config.theme === 'light', click: () => options.onSetTheme('light') },
          { label: 'Escuro', type: 'radio', checked: config.theme === 'dark', click: () => options.onSetTheme('dark') },
        ],
      },
      {
        label: 'Iniciar com o sistema',
        type: 'checkbox',
        checked: !!config.launchAtLogin,
        click: (item) => options.onSetLaunchAtLogin(item.checked),
      },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ]);
    return menu;
  };

  tray.setContextMenu(buildMenu());

  return {
    tray,
    update: (newConfig) => {
      config = newConfig;
      if (tray) {
        tray.setContextMenu(buildMenu());
      }
    },
  };
}

module.exports = { createTray };