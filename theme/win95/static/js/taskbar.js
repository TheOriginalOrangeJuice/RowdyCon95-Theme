(function () {
  function updateClock() {
    const clock = document.getElementById("tray-clock");
    if (!clock) {
      return;
    }
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function bindStartMenu() {
    const startButton = document.getElementById("start-button");
    const startMenu = document.getElementById("start-menu");
    if (!startButton || !startMenu) {
      return;
    }

    function closeMenu() {
      startMenu.classList.remove("open");
      startButton.classList.remove("is-active");
    }

    function toggleMenu() {
      startMenu.classList.toggle("open");
      startButton.classList.toggle("is-active");
    }

    startButton.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", function (e) {
      if (!startMenu.contains(e.target) && e.target !== startButton) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey && e.key === "Escape") || (e.altKey && key === "s")) {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  function bindTrayToggles() {
    const toggles = document.querySelectorAll("[data-setting]");
    if (!toggles.length || !window.Win95Settings) {
      return;
    }
    const settings = window.Win95Settings.init();
    toggles.forEach(function (btn) {
      const key = btn.getAttribute("data-setting");
      btn.setAttribute("aria-pressed", settings[key] ? "true" : "false");
      btn.addEventListener("click", function () {
        const next = window.Win95Settings.toggle(key);
        btn.setAttribute("aria-pressed", next[key] ? "true" : "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindStartMenu();
    bindTrayToggles();
    updateClock();
    setInterval(updateClock, 30000);
  });
})();
