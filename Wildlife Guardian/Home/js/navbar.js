/* ═══════════════════════════════════════════════════════════════
   WILDLIFE GUARDIAN – navbar.js  (Shared Navbar Component)
   
   Cách dùng trên bất kỳ trang nào:
   1. Đặt <nav id="navbar" data-page="tên-trang"></nav> trong <body>
   2. Include: <link rel="stylesheet" href="/Wildlife Guardian/Home/css/nav.css">
   3. Include: <script src="/Wildlife Guardian/Home/js/navbar.js"></script>

   Giá trị data-page hợp lệ:
     "home"        → Home
     "rescue-map"  → Rescue Map
     "social"      → Social
     "species"     → Species
     "game"        → Game
     "contact"     → Contact Us
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Cấu hình các nav link ────────────────────────────────── */
  const NAV_LINKS = [
    { key: 'home',        label: 'Home',        href: '/Wildlife%20Guardian/Home/Home.html' },
    { key: 'rescue-map',  label: 'Rescue Map',  href: '/Wildlife%20Guardian/RescueMap/rescuemap/index.html' },
    { key: 'social',      label: 'Social',      href: '/Wildlife%20Guardian/Social/frontend/index.html' },
    { key: 'species',     label: 'Species',     href: '/Wildlife%20Guardian/SpeciesLibarary/SpeciesLibarary.html' },
    { key: 'game',        label: 'Game',        href: '/Wildlife%20Guardian/Game/Main/Game/GameUnity.html' },
    { key: 'contact',     label: 'Contact Us',  href: '/Wildlife%20Guardian/Contact/Contact.html' },
  ];

  /* ── SVG Logo ──────────────────────────────────────────────── */
  const LOGO_SVG = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="4"  y="8"  width="4" height="4"></rect>
      <rect x="16" y="8"  width="4" height="4"></rect>
      <rect x="8"  y="4"  width="4" height="4"></rect>
      <rect x="12" y="4"  width="4" height="4"></rect>
      <rect x="6"  y="14" width="12" height="6" rx="2"></rect>
    </svg>`;

  /* ── Tạo HTML Navbar ───────────────────────────────────────── */
  function buildNavbarHTML(activePage, reportBtnOnClick) {
    const desktopLinks = NAV_LINKS.map(link => {
      const isActive = link.key === activePage;
      return `<a href="${link.href}" class="nav-item${isActive ? ' active' : ''}">${link.label}</a>`;
    }).join('');

    const mobileLinks = NAV_LINKS.map(link => {
      const isActive = link.key === activePage;
      return `<a href="${link.href}"${isActive ? ' class="active-mobile"' : ''}>${link.label}</a>`;
    }).join('');

    const reportOnClick = reportBtnOnClick
      ? `onclick="${reportBtnOnClick}"`
      : '';

    return `
      <div class="mobile-nav" id="mobileNav">
        ${mobileLinks}
        <div class="mobile-actions">
          <button class="btn-report" ${reportOnClick}>🚨 Report Now</button>
          <button class="btn-login" id="btnLoginMobile">→ Log in</button>
        </div>
      </div>
      <div class="nav-container">
        <a class="logo-area" href="/Wildlife%20Guardian/Home/Home.html">
          <div class="logo-icon">${LOGO_SVG}</div>
          <span class="logo-text">Wildlife Guardian</span>
        </a>
        <div class="nav-menu" id="navMenu">
          ${desktopLinks}
        </div>
        <div class="nav-actions">
          <button class="btn-report" ${reportOnClick}>🚨 Report Now</button>
          <button class="btn-login" id="btnLoginDesktop">→ Log in</button>
          <button class="hamburger" id="hamburger">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>`;
  }

  /* ── Lấy current user từ localStorage ─────────────────────── */
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ── Cập nhật nút Login / Logout ──────────────────────────── */
  function updateAuthButtons() {
    const user = getCurrentUser();
    const isLoggedIn = !!user || !!localStorage.getItem('isLoggedIn');
    const displayName = user?.fullName || user?.username || 'Người dùng';

    ['btnLoginDesktop', 'btnLoginMobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;

      if (isLoggedIn) {
        btn.innerHTML = `<i class="fas fa-sign-out-alt"></i> ${displayName}`;
        btn.title = 'Nhấn để đăng xuất';
        btn.onclick = () => {
          if (confirm(`Đăng xuất khỏi tài khoản ${displayName}?`)) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            window.location.reload();
          }
        };
      } else {
        btn.textContent = '→ Log in';
        btn.onclick = () => {
          window.location.href = '/Wildlife%20Guardian/Auth/login.html';
        };
      }
    });
  }

  /* ── Setup Hamburger ──────────────────────────────────────── */
  function setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('show');
    });

    // Đóng khi click link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('show');
      });
    });

    // Đóng khi click ngoài
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('show');
      }
    });
  }

  /* ── Scroll behavior ─────────────────────────────────────── */
  function setupScrollBehavior(navbar) {
    if (!navbar) return;
    // Nếu đã có class scrolled (vd: trang map), giữ nguyên
    if (navbar.classList.contains('scrolled')) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // check on load
  }

  /* ── Progress Bar ─────────────────────────────────────────── */
  function setupProgressBar() {
    const bar = document.getElementById('wgProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
    }, { passive: true });
  }

  /* ── Khởi tạo chính ──────────────────────────────────────── */
  function init() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const activePage = navbar.dataset.page || '';

    // Lấy callback cho nút Report (nếu trang định nghĩa)
    const reportCallback = navbar.dataset.reportCallback || null;

    // Inject HTML
    navbar.innerHTML = buildNavbarHTML(activePage, reportCallback);

    // Setup các chức năng
    setupHamburger();
    setupScrollBehavior(navbar);
    setupProgressBar();
    updateAuthButtons();
  }

  /* ── Chạy khi DOM sẵn sàng ─────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Export để các trang có thể gọi lại nếu cần ─────────── */
  window.WG_Navbar = { updateAuthButtons };

})();
