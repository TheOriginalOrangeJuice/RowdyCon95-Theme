(() => {
  const init = window.init || {};
  const DEFAULT_ICON = "/themes/win95/static/img/icons/folder.svg";
  const ALL_ICON = "/themes/win95/static/img/icons/computer.svg";

  const classMap = {
    solved: "challenge-row-solved",
    attempted: "challenge-row-attempted",
    failed: "challenge-row-failed",
  };

  const keywordIcons = {
    web: "/themes/win95/static/img/icons/globe.svg",
    pwn: "/themes/win95/static/img/icons/terminal.svg",
    reverse: "/themes/win95/static/img/icons/computer.svg",
    rev: "/themes/win95/static/img/icons/computer.svg",
    crypto: "/themes/win95/static/img/icons/key.svg",
    forensics: "/themes/win95/static/img/icons/note.svg",
    osint: "/themes/win95/static/img/icons/users.svg",
    misc: "/themes/win95/static/img/icons/folder.svg",
    cloud: "/themes/win95/static/img/icons/globe.svg",
    mobile: "/themes/win95/static/img/icons/team.svg",
    hardware: "/themes/win95/static/img/icons/computer.svg",
  };

  const parseJSON = (value, fallback) => {
    if (typeof value !== "string") {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  };

  const sanitizeIconUrl = value => {
    if (typeof value !== "string") {
      return null;
    }

    const icon = value.trim();
    if (!icon) {
      return null;
    }

    const lower = icon.toLowerCase();
    if (
      lower.startsWith("javascript:") ||
      lower.startsWith("data:") ||
      lower.startsWith("vbscript:")
    ) {
      return null;
    }

    // Keep icons local only. This avoids external fetches and mixed content.
    if (icon.startsWith("//") || icon.includes("://")) {
      return null;
    }

    if (icon.startsWith("/")) {
      return icon;
    }

    if (icon.startsWith("themes/") || icon.startsWith("files/")) {
      return `/${icon}`;
    }

    return null;
  };

  const iconMap = (() => {
    const settings = init.themeSettings || {};
    const raw = settings.win95_category_icons;
    if (raw && typeof raw === "object") {
      return raw;
    }
    if (typeof raw === "string") {
      return parseJSON(raw, {});
    }
    return {};
  })();

  let activeCategory = null;
  const statusMap = new Map();
  let lastRefresh = 0;

  const rows = () => Array.from(document.querySelectorAll("tr.challenge-row[data-challenge-id]"));
  const buttons = () => Array.from(document.querySelectorAll("button[data-category-filter]"));

  const computeStatus = detail => {
    const status = detail.status;
    const attempts = Number(detail.attempts || 0);
    const maxAttempts = Number(detail.maxAttempts || 0);

    if (status === "correct" || status === "already_solved") {
      return "solved";
    }

    if (status === "incorrect") {
      // CTFd updates attempts reactively; use the reported count directly.
      if (maxAttempts > 0 && attempts >= maxAttempts) {
        return "failed";
      }
      return "attempted";
    }

    return null;
  };

  const setStatusCell = (row, status) => {
    const cell = row.querySelector(".challenge-status");
    if (!cell) {
      return;
    }

    let text = "Open";
    if (status === "solved") {
      text = "Solved";
    } else if (status === "attempted") {
      text = "Attempted";
    } else if (status === "failed") {
      text = "Failed";
    }

    if (cell.textContent !== text) {
      cell.textContent = text;
    }
  };

  const applyStatus = (row, status) => {
    Object.values(classMap).forEach(name => row.classList.remove(name));
    if (status && classMap[status]) {
      row.classList.add(classMap[status]);
    }
    setStatusCell(row, status);
  };

  const applyStatuses = () => {
    rows().forEach(row => {
      const id = row.getAttribute("data-challenge-id");
      const solvedByMe = row.getAttribute("data-solved") === "true";
      const entry = statusMap.get(id);
      let status = null;

      if (solvedByMe) {
        status = "solved";
        statusMap.delete(id);
      } else if (entry) {
        status = entry;
      }

      applyStatus(row, status);
    });
  };

  const updateStatusBar = () => {
    const allRows = rows();
    const visibleRows = allRows.filter(row => !row.hidden);
    const visibleEl = document.getElementById("challenge-visible-count");
    const totalEl = document.getElementById("challenge-total-count");

    if (visibleEl) {
      visibleEl.textContent = String(visibleRows.length);
    }
    if (totalEl) {
      totalEl.textContent = String(allRows.length);
    }
  };

  const applyFilter = () => {
    rows().forEach(row => {
      const rowCategory = row.getAttribute("data-category") || "";
      row.hidden = !!activeCategory && rowCategory !== activeCategory;
    });

    buttons().forEach(btn => {
      const category = btn.getAttribute("data-category-filter") || null;
      const active = category === activeCategory;
      if (!activeCategory && !category) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      }
    });

    updateStatusBar();
  };

  const getIconForCategory = category => {
    const normalized = String(category || "").trim().toLowerCase();
    if (!normalized) {
      return ALL_ICON;
    }

    if (iconMap[normalized]) {
      const mapped = sanitizeIconUrl(iconMap[normalized]);
      if (mapped) {
        return mapped;
      }
    }
    if (iconMap[category]) {
      const mapped = sanitizeIconUrl(iconMap[category]);
      if (mapped) {
        return mapped;
      }
    }

    const hit = Object.keys(keywordIcons).find(keyword => normalized.includes(keyword));
    return hit ? keywordIcons[hit] : DEFAULT_ICON;
  };

  const applyCategoryIcons = () => {
    const iconNodes = document.querySelectorAll("img[data-category-icon-for]");
    iconNodes.forEach(node => {
      const category = node.getAttribute("data-category-icon-for") || "";
      const nextSrc = getIconForCategory(category);
      if (node.getAttribute("src") !== nextSrc) {
        node.setAttribute("src", nextSrc);
      }
    });
  };

  const bindCategoryButtons = () => {
    // No-op. We use delegated click handling to survive Alpine re-renders.
  };

  const requestChallengeRefresh = () => {
    const now = Date.now();
    if (now - lastRefresh < 3000) {
      return;
    }
    lastRefresh = now;
    window.dispatchEvent(new CustomEvent("load-challenges"));
  };

  const refreshUI = () => {
    bindCategoryButtons();
    applyCategoryIcons();
    applyFilter();
    applyStatuses();
  };

  const observeChallengeDom = () => {
    const body = document.querySelector(".challenge-list-body");
    if (body) {
      const tableObserver = new MutationObserver(() => {
        refreshUI();
      });
      tableObserver.observe(body, { childList: true });
    }

    const categories = document.getElementById("challenge-category-grid");
    if (categories) {
      const categoryObserver = new MutationObserver(() => refreshUI());
      categoryObserver.observe(categories, { childList: true, subtree: true });
    }
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

    statusMap.set(String(detail.id), status);
    applyStatuses();
    requestChallengeRefresh();
  });

  window.addEventListener("load-challenges", () => {
    setTimeout(() => {
      refreshUI();
    }, 80);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      requestChallengeRefresh();
    }
  });

  window.addEventListener("focus", requestChallengeRefresh);
  document.addEventListener("click", event => {
    const btn = event.target.closest("button[data-category-filter]");
    if (!btn) {
      return;
    }
    const category = btn.getAttribute("data-category-filter") || null;
    activeCategory = category;
    applyFilter();
  });

  document.addEventListener("DOMContentLoaded", () => {
    refreshUI();
    observeChallengeDom();

    setInterval(() => {
      if (!document.hidden) {
        requestChallengeRefresh();
      }
    }, 15000);
  });
})();
