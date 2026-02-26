(() => {
  const STORAGE_KEY = "win95ChallengeStatus";
  const classMap = {
    solved: "challenge-row-solved",
    attempted: "challenge-row-attempted",
    failed: "challenge-row-failed",
  };

  const readMap = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  };

  const writeMap = map => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (error) {
      // Ignore storage errors to avoid blocking the UI.
    }
  };

  let statusMap = readMap();
  let isApplying = false;

  const computeStatus = detail => {
    const status = detail.status;
    const attempts = Number(detail.attempts || 0);
    const maxAttempts = Number(detail.maxAttempts || 0);

    if (status === "correct" || status === "already_solved") {
      return "solved";
    }

    if (status === "incorrect") {
      const attemptsUsed = attempts + 1;
      if (maxAttempts > 0 && attemptsUsed >= maxAttempts) {
        return "failed";
      }
      return "attempted";
    }

    return null;
  };

  const applyStatus = (row, status) => {
    Object.values(classMap).forEach(className => row.classList.remove(className));
    if (status && classMap[status]) {
      row.classList.add(classMap[status]);
    }
    const statusCell = row.querySelector(".challenge-status");
    if (statusCell) {
      let nextText = "Open";
      if (status === "solved") {
        nextText = "Solved";
      } else if (status === "attempted") {
        nextText = "Attempted";
      } else if (status === "failed") {
        nextText = "Failed";
      }
      if (statusCell.textContent !== nextText) {
        statusCell.textContent = nextText;
      }
    }
  };

  const applyAll = () => {
    if (isApplying) {
      return;
    }
    isApplying = true;
    const rows = document.querySelectorAll("tr[data-challenge-id]");
    rows.forEach(row => {
      const id = row.getAttribute("data-challenge-id");
      const entry = statusMap[id];
      let status = null;

      if (row.dataset.solved === "true") {
        status = "solved";
      } else if (entry && entry.status) {
        status = entry.status;
      }

      applyStatus(row, status);
    });
    isApplying = false;
  };

  const observeList = () => {
    const target = document.querySelector(".list-view tbody");
    if (!target) {
      return;
    }
    const observer = new MutationObserver(() => {
      if (!isApplying) {
        applyAll();
      }
    });
    // Only re-apply when rows are added/removed; avoid loops from text/class updates.
    observer.observe(target, { childList: true });
  };

  window.addEventListener("win95-challenge-status", event => {
    const detail = event.detail || {};
    if (!detail.id) {
      return;
    }
    const status = computeStatus(detail);
    if (!status) {
      return;
    }
    statusMap[detail.id] = {
      status,
      updatedAt: Date.now(),
    };
    writeMap(statusMap);
    applyAll();
  });

  window.addEventListener("load-challenges", () => {
    setTimeout(applyAll, 50);
  });

  document.addEventListener("DOMContentLoaded", () => {
    applyAll();
    observeList();
  });
})();
