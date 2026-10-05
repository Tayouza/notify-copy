(function () {
  const miniToastEl = document.getElementById("mini-toast");
  const pages = document.querySelectorAll(".page");

  if (!miniToastEl || !pages.length) {
    return;
  }

  let hideTimer = null;
  let isVisible = false;
  let currentDuration = 1400;

  const DEFAULT_ACCENT = "#6366f1";
  const DEFAULT_ACCENT_END = "#8b5cf6";

  function shadeColor(color, percent) {
    try {
      let r = parseInt(color.substr(1, 2), 16);
      let g = parseInt(color.substr(3, 2), 16);
      let b = parseInt(color.substr(5, 2), 16);

      r = parseInt((r * (100 + percent)) / 100, 10);
      g = parseInt((g * (100 + percent)) / 100, 10);
      b = parseInt((b * (100 + percent)) / 100, 10);

      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      const rr = (r.toString(16).length === 1 ? "0" + r.toString(16) : r.toString(16));
      const gg = (g.toString(16).length === 1 ? "0" + g.toString(16) : g.toString(16));
      const bb = (b.toString(16).length === 1 ? "0" + b.toString(16) : b.toString(16));

      return "#" + rr + gg + bb;
    } catch (e) {
      return null;
    }
  }

  function rotateHue(hex, degrees) {
    try {
      let r = parseInt(hex.substr(1, 2), 16) / 255;
      let g = parseInt(hex.substr(3, 2), 16) / 255;
      let b = parseInt(hex.substr(5, 2), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h,
        s,
        l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      h = (h + degrees / 360) % 1;
      if (h < 0) h += 1;

      let r1, g1, b1;
      if (s === 0) {
        r1 = g1 = b1 = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r1 = hue2rgb(p, q, h);
        g1 = hue2rgb(p, q, h + 1 / 3);
        b1 = hue2rgb(p, q, h + 1 / 3 * 2);
      }

      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      return "#" + toHex(r1) + toHex(g1) + toHex(b1);
    } catch (e) {
      return null;
    }
  }

  function deriveAccentEnd(accent) {
    if (!accent) return DEFAULT_ACCENT_END;
    let derived = shadeColor(accent, 12);
    if (!derived) derived = rotateHue(accent, 25);
    if (!derived) derived = DEFAULT_ACCENT_END;
    return derived;
  }

  function normalizeAccent(value, fallback) {
    if (typeof value !== "string") return fallback;
    let c = value.trim();
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    }
    return /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
  }

  function isValidAccent(value) {
    return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  }

  function setAccent(accent, accentEnd) {
    const root = document.documentElement;
    const safeAccent = normalizeAccent(accent, DEFAULT_ACCENT);
    root.style.setProperty("--accent", safeAccent);
    miniToastEl.dataset.accent = safeAccent;

    const safeEnd = isValidAccent(accentEnd) ? accentEnd.trim() : deriveAccentEnd(safeAccent);
    root.style.setProperty("--accent-end", safeEnd);
  }

  setAccent(DEFAULT_ACCENT, DEFAULT_ACCENT_END);

  function clearHideTimer() {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function hide() {
    if (!isVisible) {
      return;
    }
    clearHideTimer();
    isVisible = false;
    miniToastEl.classList.remove("is-visible");
    miniToastEl.classList.add("is-hiding");
  }

  function show(payload) {
    if (!payload || typeof payload !== "object") {
      payload = {};
    }

    const accent = typeof payload.accent === "string" && payload.accent ? payload.accent : DEFAULT_ACCENT;
    const accentEnd = typeof payload.accentEnd === "string" ? payload.accentEnd : null;
    const durationMs = typeof payload.durationMs === "number" && payload.durationMs > 0 ? payload.durationMs : 1400;
    const theme = payload.theme === "light" || payload.theme === "dark" ? payload.theme : null;

    currentDuration = durationMs;

    setAccent(accent, accentEnd);

    if (theme) {
      miniToastEl.dataset.theme = theme;
    } else {
      delete miniToastEl.dataset.theme;
    }

    clearHideTimer();

    miniToastEl.classList.remove("is-hiding");
    void miniToastEl.offsetWidth;
    miniToastEl.classList.add("is-visible");
    isVisible = true;

    hideTimer = setTimeout(hide, currentDuration);
  }

  function setTheme(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }
    const theme = payload.theme === "light" || payload.theme === "dark" ? payload.theme : null;
    if (theme) {
      miniToastEl.dataset.theme = theme;
    } else {
      delete miniToastEl.dataset.theme;
    }
  }

  function setAccentPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }
    const accent = typeof payload.accent === "string" && payload.accent ? payload.accent : DEFAULT_ACCENT;
    const accentEnd = typeof payload.accentEnd === "string" ? payload.accentEnd : null;
    setAccent(accent, accentEnd);
  }

  const notifycopy = window.notifycopy;

  if (notifycopy && typeof notifycopy.onShow === "function") {
    try {
      notifycopy.onShow(show);
    } catch (e) {}
  }
  if (notifycopy && typeof notifycopy.onHide === "function") {
    try {
      notifycopy.onHide(hide);
    } catch (e) {}
  }
  if (notifycopy && typeof notifycopy.onTheme === "function") {
    try {
      notifycopy.onTheme(setTheme);
    } catch (e) {}
  }
  if (notifycopy && typeof notifycopy.onAccent === "function") {
    try {
      notifycopy.onAccent(setAccentPayload);
    } catch (e) {}
  }

  function sendReady() {
    if (notifycopy && typeof notifycopy.ready === "function") {
      try {
        notifycopy.ready();
      } catch (e) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendReady);
  } else {
    sendReady();
  }
})();