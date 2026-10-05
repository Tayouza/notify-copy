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
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...parsed };
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