(function () {
  const windows = new Map();
  const STORAGE_KEY = "win95-window-state";
  let zIndex = 20;
  const taskContainer = document.getElementById("taskbar-tasks");

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Ignore storage errors to avoid blocking the UI.
    }
  }

  const storedState = readState();

  function saveWindowState(id, win) {
    storedState[id] = {
      left: win.offsetLeft,
      top: win.offsetTop,
      width: win.offsetWidth,
      height: win.offsetHeight
    };
    writeState(storedState);
  }

  function restoreWindowState(id, win) {
    const data = storedState[id];
    if (!data) {
      return;
    }
    win.style.left = `${data.left}px`;
    win.style.top = `${data.top}px`;
    win.style.width = `${data.width}px`;
    win.style.height = `${data.height}px`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function bringToFront(win) {
    zIndex += 1;
    win.style.zIndex = String(zIndex);
    win.classList.add("is-active");
    windows.forEach((value) => {
      if (value.el !== win) {
        value.el.classList.remove("is-active");
        value.task.classList.remove("is-active");
      }
    });
    const info = windows.get(win.dataset.windowId);
    if (info) {
      info.task.classList.add("is-active");
    }
  }

  function setMinimized(win, minimized) {
    win.classList.toggle("minimized", minimized);
    const info = windows.get(win.dataset.windowId);
    if (info) {
      info.task.classList.toggle("is-minimized", minimized);
    }
  }

  function toggleWindow(win) {
    const isMin = win.classList.contains("minimized");
    if (isMin) {
      setMinimized(win, false);
      bringToFront(win);
    } else {
      setMinimized(win, true);
    }
  }

  function registerWindow(win) {
    const id = win.dataset.windowId || `win-${Math.random().toString(36).slice(2)}`;
    win.dataset.windowId = id;
    const title = win.dataset.windowTitle || "Window";
    restoreWindowState(id, win);
    const task = document.createElement("button");
    task.className = "task-button";
    task.type = "button";
    task.textContent = title;
    task.setAttribute("data-window-id", id);
    task.addEventListener("click", function () {
      toggleWindow(win);
    });
    taskContainer.appendChild(task);
    windows.set(id, { el: win, task: task });

    win.addEventListener("mousedown", function () {
      bringToFront(win);
    });

    const minBtn = win.querySelector("[data-action='minimize']");
    if (minBtn) {
      minBtn.addEventListener("click", function (e) {
        e.preventDefault();
        setMinimized(win, true);
      });
    }

    const closeBtn = win.querySelector("[data-action='close']");
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        win.classList.add("minimized");
        const info = windows.get(win.dataset.windowId);
        if (info && info.task) {
          info.task.style.display = "none";
        }
      });
    }

    attachDrag(win);
    attachResize(win);
    bringToFront(win);
  }

  function pointerXY(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function attachDrag(win) {
    const bar = win.querySelector(".title-bar");
    if (!bar) {
      return;
    }
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let frame = null;

    function onMove(e) {
      if (!dragging) {
        return;
      }
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(function () {
        const pt = pointerXY(e);
        const dx = pt.x - startX;
        const dy = pt.y - startY;
        const maxLeft = Math.max(0, window.innerWidth - win.offsetWidth - 16);
        const maxTop = Math.max(0, window.innerHeight - win.offsetHeight - 48);
        const nextLeft = clamp(startLeft + dx, 0, maxLeft);
        const nextTop = clamp(startTop + dy, 0, maxTop);
        win.style.left = `${nextLeft}px`;
        win.style.top = `${nextTop}px`;
        frame = null;
      });
    }

    function onStart(e) {
      if (e.button !== undefined && e.button !== 0) {
        return;
      }
      // Prevent text selection while dragging
      if (e.cancelable !== false) {
        e.preventDefault();
      }
      dragging = true;
      const pt = pointerXY(e);
      startX = pt.x;
      startY = pt.y;
      startLeft = win.offsetLeft;
      startTop = win.offsetTop;
      bringToFront(win);
    }

    function onEnd() {
      if (!dragging) {
        return;
      }
      dragging = false;
      saveWindowState(win.dataset.windowId, win);
    }

    bar.addEventListener("mousedown", onStart);
    bar.addEventListener("touchstart", onStart, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);

    bar.setAttribute("tabindex", "0");
    bar.addEventListener("keydown", function (e) {
      if (!e.altKey) {
        return;
      }
      const step = 10;
      if (e.key === "ArrowLeft") {
        win.style.left = `${win.offsetLeft - step}px`;
      }
      if (e.key === "ArrowRight") {
        win.style.left = `${win.offsetLeft + step}px`;
      }
      if (e.key === "ArrowUp") {
        win.style.top = `${win.offsetTop - step}px`;
      }
      if (e.key === "ArrowDown") {
        win.style.top = `${win.offsetTop + step}px`;
      }
    });
  }

  function attachResize(win) {
    const handle = win.querySelector(".resize-handle");
    if (!handle) {
      return;
    }
    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    let frame = null;

    function onMove(e) {
      if (!resizing) {
        return;
      }
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(function () {
        const pt = pointerXY(e);
        const dx = pt.x - startX;
        const dy = pt.y - startY;
        const maxW = Math.max(320, window.innerWidth - win.offsetLeft - 16);
        const maxH = Math.max(240, window.innerHeight - win.offsetTop - 48);
        win.style.width = `${clamp(startW + dx, 320, maxW)}px`;
        win.style.height = `${clamp(startH + dy, 240, maxH)}px`;
        frame = null;
      });
    }

    function onStart(e) {
      if (e.button !== undefined && e.button !== 0) {
        return;
      }
      resizing = true;
      const pt = pointerXY(e);
      startX = pt.x;
      startY = pt.y;
      startW = win.offsetWidth;
      startH = win.offsetHeight;
      bringToFront(win);
      e.stopPropagation();
    }

    function onEnd() {
      if (!resizing) {
        return;
      }
      resizing = false;
      saveWindowState(win.dataset.windowId, win);
    }

    handle.addEventListener("mousedown", onStart);
    handle.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  }

  function attachModalDrag(modal) {
    const content = modal.querySelector(".modal-content");
    if (!content) {
      return;
    }
    const bar = content.querySelector(".title-bar");
    if (!bar || bar._win95drag) {
      return;
    }
    bar._win95drag = true;
    content.style.position = "relative";

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let frame = null;

    function onMove(e) {
      if (!dragging) {
        return;
      }
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(function () {
        const pt = pointerXY(e);
        const dx = pt.x - startX;
        const dy = pt.y - startY;
        content.style.left = `${startLeft + dx}px`;
        content.style.top = `${startTop + dy}px`;
        frame = null;
      });
    }

    function onStart(e) {
      if (e.button !== undefined && e.button !== 0) {
        return;
      }
      if (e.cancelable !== false) {
        e.preventDefault();
      }
      dragging = true;
      const pt = pointerXY(e);
      startX = pt.x;
      startY = pt.y;
      startLeft = content.offsetLeft;
      startTop = content.offsetTop;
    }

    function onEnd() {
      if (!dragging) {
        return;
      }
      dragging = false;
    }

    bar.addEventListener("mousedown", onStart);
    bar.addEventListener("touchstart", onStart, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".win95-window").forEach(registerWindow);

    // Watch for dynamically injected modal content (challenge notepad)
    const challengeModal = document.getElementById("challenge-window");
    if (challengeModal) {
      const observer = new MutationObserver(function () {
        attachModalDrag(challengeModal);
      });
      observer.observe(challengeModal, { childList: true, subtree: true });
    }
  });

  window.Win95Windows = {
    bringToFront: bringToFront,
    toggleWindow: toggleWindow
  };
})();
