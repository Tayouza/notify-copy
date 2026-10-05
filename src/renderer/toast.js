(function () {
  const toastEl = document.getElementById("toast");
  const previewEl = document.getElementById("toast-preview");
  const countEl = document.getElementById("toast-count");
  const labelEl = document.getElementById("toast-label");
  const progressEl = document.getElementById("toast-progress");

  if (!toastEl || !previewEl || !countEl || !progressEl) {
    return;
  }

  let hideTimer = null;
  let currentDuration = 2200;
  let isVisible = false;

  const DEFAULT_ACCENT = "#6366f1";

  function setAccent(accent) {
    if (accent && typeof accent === "string") {
      toastEl.style.setProperty("--accent", accent);
      toastEl.dataset.accent = accent;
    } else {
      toastEl.style.removeProperty("--accent");
      delete toastEl.dataset.accent;
    }
  }

  setAccent(DEFAULT_ACCENT);

  function formatCount(chars) {
    const count = typeof chars === "number" && !isNaN(chars) ? chars : 0;
    if (count === 1) {
      return "1 caracter";
    }
    return count + " caracteres";
  }

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
    toastEl.classList.remove("is-visible");
    toastEl.classList.add("is-hiding");
  }

  function show(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }

    const text = typeof payload.text === "string" ? payload.text : "";
    const chars = typeof payload.chars === "number" ? payload.chars : text.length;
    const durationMs =
      typeof payload.durationMs === "number" && payload.durationMs > 0
        ? payload.durationMs
        : 2200;
    const theme =
      payload.theme === "light" || payload.theme === "dark" ? payload.theme : null;
    const accent =
      typeof payload.accent === "string" && payload.accent
        ? payload.accent
        : DEFAULT_ACCENT;
    const showPreview = payload.showPreview !== false;

    currentDuration = durationMs;

    previewEl.textContent = showPreview ? text : "";
    countEl.textContent = formatCount(chars);
    if (labelEl) {
      labelEl.textContent = "Copiado";
    }

    setAccent(accent);

    if (theme) {
      toastEl.dataset.theme = theme;
    } else {
      delete toastEl.dataset.theme;
    }

    clearHideTimer();

    toastEl.classList.remove("is-hiding");
    void toastEl.offsetWidth;
    toastEl.classList.add("is-visible");
    isVisible = true;

    progressEl.style.animation = "none";

    requestAnimationFrame(() => {
      progressEl.style.animation =
        "toast-progress-run " + currentDuration + "ms linear forwards";
    });

    hideTimer = setTimeout(hide, currentDuration);
  }

  function setTheme(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }
    const theme =
      payload.theme === "light" || payload.theme === "dark" ? payload.theme : null;
    if (theme) {
      toastEl.dataset.theme = theme;
    } else {
      delete toastEl.dataset.theme;
    }
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