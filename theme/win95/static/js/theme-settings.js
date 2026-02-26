(function () {
  const STORAGE_KEY = "win95-settings";
  const defaultSettings = {
    sound: false,
    contrast: false,
    motion: false,
    assistant: true
  };

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Object.assign({}, defaultSettings, saved || {});
    } catch (err) {
      return Object.assign({}, defaultSettings);
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function applySettings(settings) {
    const body = document.body;
    body.classList.toggle("sound-on", !!settings.sound);
    body.classList.toggle("high-contrast", !!settings.contrast);
    body.classList.toggle("reduced-motion", !!settings.motion);
    body.classList.toggle("assistant-hidden", settings.assistant === false);
  }

  function init() {
    const settings = readSettings();
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced && settings.motion === false) {
      settings.motion = true;
    }
    applySettings(settings);
    writeSettings(settings);
    return settings;
  }

  function toggle(key) {
    const settings = readSettings();
    settings[key] = !settings[key];
    applySettings(settings);
    writeSettings(settings);
    return settings;
  }

  window.Win95Settings = {
    init: init,
    toggle: toggle,
    get: readSettings
  };
})();
