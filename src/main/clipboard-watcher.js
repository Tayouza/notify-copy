const { clipboard } = require('electron');

class ClipboardWatcher {
  constructor({ onChange, interval = 450, enabled = true } = {}) {
    this.onChange = onChange;
    this.interval = interval;
    this.enabled = enabled;
    this.lastValue = '';
    this.timer = null;
  }

  start() {
    this.stop();
    try {
      this.lastValue = (clipboard.readText() || '').trim();
    } catch (e) {
      this.lastValue = '';
    }
    this.timer = setInterval(() => {
      if (!this.enabled) return;
      try {
        let value = clipboard.readText();
        if (typeof value === 'string') {
          value = value.trim();
          if (value.length > 0 && value !== this.lastValue) {
            this.lastValue = value;
            if (typeof this.onChange === 'function') {
              this.onChange(value);
            }
          }
        }
      } catch (e) {
        // ignore errors
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setLastValue(value) {
    this.lastValue = value || '';
  }
}

module.exports = ClipboardWatcher;