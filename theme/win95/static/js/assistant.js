(() => {
  const assistant = document.getElementById("win95-assistant");
  if (!assistant) {
    return;
  }

  const textEl = assistant.querySelector("[data-assistant-text]");
  const nextBtn = assistant.querySelector("[data-assistant-next]");
  const hideBtn = assistant.querySelector("[data-assistant-hide]");
  const trayBtn = document.querySelector("[data-setting='assistant']");

  const authed = assistant.dataset.authed === "true";
  const registration = assistant.dataset.registration === "true";

  const tips = [];
  if (!authed && registration) {
    tips.push("It looks like you're new here. Click Start, then choose Register (Sign Up) to join the CTF.");
  }
  if (!authed) {
    tips.push("Already have an account? Click Start and choose Log In to continue.");
  }
  tips.push("Open Challenges from the desktop or Start menu. Double-click a row to open the Notepad challenge.");
  tips.push("Use Categories to filter challenges. All shows everything.");
  tips.push("Check Scoreboard from the Start menu to see current standings.");
  tips.push("Need your profile? Click Start and open Profile to update your info.");
  tips.push("Try the tray toggles to switch contrast or reduce motion.");

  let index = 0;

  const render = () => {
    if (!textEl) {
      return;
    }
    const message = tips[index % tips.length];
    textEl.textContent = message;
  };

  const setVisible = visible => {
    if (!window.Win95Settings) {
      assistant.classList.toggle("hidden", !visible);
      return;
    }
    const current = window.Win95Settings.get().assistant !== false;
    if (visible !== current) {
      const next = window.Win95Settings.toggle("assistant");
      if (trayBtn) {
        trayBtn.setAttribute("aria-pressed", next.assistant ? "true" : "false");
      }
    }
  };

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      index = (index + 1) % tips.length;
      render();
    });
  }

  if (hideBtn) {
    hideBtn.addEventListener("click", () => {
      setVisible(false);
    });
  }

  if (trayBtn) {
    trayBtn.addEventListener("click", () => {
      const next = window.Win95Settings.get().assistant !== false;
      if (next) {
        render();
      }
    });
  }

  render();
})();
