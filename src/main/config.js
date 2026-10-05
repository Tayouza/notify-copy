const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

const DEFAULT_CONFIG = {
  enabled: true,
  position: 'cursor',
  durationMs: 2200,
  theme: 'auto',
  showPreview: true,
  launchAtLogin: false,
  accent: '#6366f1',
  toastMode: 'full',
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(merged.accent || '')) {
        merged.accent = DEFAULT_CONFIG.accent;
      }
      if (merged.toastMode !== 'mini' && merged.toastMode !== 'full') {
        merged.toastMode = DEFAULT_CONFIG.toastMode;
      }
      return merged;
    }
  } catch (e) {
    // ignore and use defaults
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    // ignore write errors
  }
}

module.exports = {
  DEFAULT_CONFIG,
  readConfig,
  writeConfig,
  CONFIG_FILE,
};