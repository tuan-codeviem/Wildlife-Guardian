/**
 * WILDLIFE GUARDIAN – theme.js
 * Global Unified Theme Switcher Engine (Dark / Light Mode)
 * Ensures cross-page & cross-tab synchronization and anti-FOUC
 */

(function () {
  const STORAGE_KEY = "wg_theme";
  const LEGACY_KEY = "wg_species_theme";

  // 1. Determine current theme (wg_theme -> wg_species_theme -> default 'dark')
  function getCurrentTheme() {
    return (
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_KEY) ||
      document.documentElement.getAttribute("data-theme") ||
      "dark"
    );
  }

  // 2. SVG Icons
  const sunIcon = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  const moonIcon = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  // 3. Update toggle button icons & accessibility labels
  function updateThemeIcons(theme) {
    const isDark = theme === "dark";
    // In Dark Mode -> display Sun icon (click to switch to Light)
    // In Light Mode -> display Moon icon (click to switch to Dark)
    const iconSvg = isDark ? sunIcon : moonIcon;
    const titleText = isDark ? "Chuyển sang chế độ Sáng (Light Mode)" : "Chuyển sang chế độ Tối (Dark Mode)";

    const buttons = document.querySelectorAll(".theme-toggle-btn, #themeToggleBtn, #mobileThemeToggleBtn");
    buttons.forEach((btn) => {
      btn.innerHTML = iconSvg;
      btn.setAttribute("title", titleText);
      btn.setAttribute("aria-label", titleText);
    });
  }

  // 4. Set theme with instant transition freeze to prevent frame drop
  function setTheme(theme) {
    document.documentElement.classList.add("theme-switching");
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(LEGACY_KEY, theme);
    updateThemeIcons(theme);

    // Force reflow
    void document.documentElement.offsetHeight;

    // Smoothly re-enable transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-switching");
      });
    });

    // Notify other components if needed
    window.dispatchEvent(new CustomEvent("wg-theme-changed", { detail: { theme } }));
  }

  // 5. Toggle between Dark and Light
  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || getCurrentTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  }

  // 6. Bind events to all theme buttons on the page
  function bindToggleEvents() {
    const buttons = document.querySelectorAll(".theme-toggle-btn, #themeToggleBtn, #mobileThemeToggleBtn");
    buttons.forEach((btn) => {
      if (!btn.dataset.themeBound) {
        btn.dataset.themeBound = "true";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleTheme();
        });
      }
    });
    updateThemeIcons(getCurrentTheme());
  }

  // 7. Initial run
  const initialTheme = getCurrentTheme();
  document.documentElement.setAttribute("data-theme", initialTheme);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggleEvents);
  } else {
    bindToggleEvents();
  }

  // 8. Cross-tab real-time synchronization
  window.addEventListener("storage", (e) => {
    if ((e.key === STORAGE_KEY || e.key === LEGACY_KEY) && e.newValue) {
      if (e.newValue !== document.documentElement.getAttribute("data-theme")) {
        setTheme(e.newValue);
      }
    }
  });

  // Global API
  window.wgTheme = {
    get: getCurrentTheme,
    set: setTheme,
    toggle: toggleTheme,
    updateIcons: updateThemeIcons,
  };
})();
