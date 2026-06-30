/**
 * WILDLIFE GUARDIAN – RESCUE NOTIFICATION SYSTEM
 * ================================================
 * Hệ thống thông báo cứu hộ khẩn cấp toàn trang.
 * - Polling API mỗi 30 giây để phát hiện báo cáo mới
 * - Hiển thị toast notification + âm thanh "ting"
 * - Toggle tắt/bật trong Settings Modal
 * - Hoạt động trên mọi trang của website
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // CONSTANTS & STORAGE KEYS
  // ═══════════════════════════════════════════
  const STORAGE_KEY_LAST_ID    = 'wg_rescue_last_report_id';
  const STORAGE_KEY_DISABLED   = 'wg_rescue_notif_disabled';
  const STORAGE_KEY_TIMESTAMP  = 'wg_rescue_last_poll_ts';
  const POLL_INTERVAL_MS       = 30000; // 30 giây
  const TOAST_DURATION_MS      = 8000;  // 8 giây tự đóng
  const MAX_TOASTS             = 3;     // Tối đa 3 toast cùng lúc

  let _pollTimer      = null;
  let _isInitialized  = false;
  let _activeToasts   = 0;

  // ═══════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════

  function getApiUrl(path) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://' + hostname + ':3000' + path;
    }
    return window.location.origin + path;
  }

  function isNotifDisabled() {
    return localStorage.getItem(STORAGE_KEY_DISABLED) === 'true';
  }

  function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ═══════════════════════════════════════════
  // WEB AUDIO – "TING" ALERT SOUND
  // ═══════════════════════════════════════════

  function playAlertSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tạo âm thanh "ting" trong trẻo (như tiếng chuông nhỏ)
      const playTone = (freq, startTime, duration, gainPeak) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Sine wave cho âm thanh mượt, thuần khiết
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Attack rất nhanh, decay theo hàm mũ (tạo độ ngân vang)
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Tiếng "ting" duy nhất: Nốt G6, âm lượng 0.5, độ ngân 1.2s
      playTone(1567.98, now, 1.2, 0.5); 

      // Tự đóng AudioContext sau khi xong
      setTimeout(() => {
        try { ctx.close(); } catch (e) {}
      }, 2000);
    } catch (e) {
      // Bỏ qua lỗi âm thanh (browser có thể chặn)
    }
  }

  // ═══════════════════════════════════════════
  // TOAST NOTIFICATION
  // ═══════════════════════════════════════════

  function getContainer() {
    let container = document.getElementById('wg-rescue-notif-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wg-rescue-notif-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function getStatusMeta(status) {
    const map = {
      emergency: {
        label:     '🆘 KHẨN CẤP',
        badgeClass:'',
        dotClass:  '',
        btnLabel:  'Xem trên bản đồ cứu hộ',
        toastClass:'wg-toast-emergency'
      },
      progress: {
        label:     '🏃 ĐANG XỬ LÝ',
        badgeClass:'wg-badge-progress',
        dotClass:  'wg-dot-progress',
        btnLabel:  'Xem trên bản đồ',
        toastClass:'wg-toast-progress'
      },
      rescued: {
        label:     '🌿 ĐÃ CỨU THÀNH CÔNG',
        badgeClass:'wg-badge-rescued',
        dotClass:  'wg-dot-rescued',
        btnLabel:  'Xem trên bản đồ',
        toastClass:'wg-toast-rescued'
      }
    };
    return map[status] || map['emergency'];
  }

  function showRescueToast(report, duration = TOAST_DURATION_MS) {
    if (_activeToasts >= MAX_TOASTS) return;

    // Lưu vào sessionStorage nếu là toast mới (thời gian tối đa)
    const STORAGE_ACTIVE = 'wg_rescue_active_toasts';
    if (duration === TOAST_DURATION_MS) {
      try {
        let active = JSON.parse(sessionStorage.getItem(STORAGE_ACTIVE) || '[]');
        report._expiresAt = Date.now() + duration;
        active = active.filter(t => t.id !== report.id);
        active.push(report);
        sessionStorage.setItem(STORAGE_ACTIVE, JSON.stringify(active));
      } catch (e) {}
    }

    const container = getContainer();
    const meta      = getStatusMeta(report.status);

    // Thumbnail
    const hasPhoto = report.photo && (report.photo.startsWith('http') || report.photo.startsWith('data:image/'));
    const thumbnailHtml = hasPhoto
      ? `<img class="wg-toast-thumbnail" src="${escHtml(report.photo)}" alt="${escHtml(report.animal)}" onerror="this.outerHTML='<div class=\\'wg-toast-thumbnail-placeholder\\'>🐾</div>'">`
      : `<div class="wg-toast-thumbnail-placeholder">🐾</div>`;

    // Location
    const location = report.location && report.location !== 'Đang xác định vị trí...'
      ? report.location
      : 'Đang xác định vị trí...';

    // Reporter
    const reporter = report.reporterName || 'Người dùng';

    // Map URL
    const mapUrl = (() => {
      let baseHref = '../RescueMap/rescuemap/index.html';
      // Tìm link trong navbar để lấy đường dẫn tuyệt đối chính xác nhất (bao gồm cả Live Server và file://)
      const navLink = document.querySelector('a[href*="RescueMap/rescuemap/index.html"]');
      if (navLink) {
        baseHref = navLink.href;
      } else {
        // Fallback nếu không tìm thấy (ví dụ trang nào đó không có navbar)
        const path = window.location.pathname;
        if (path.includes('/Social/frontend/')) baseHref = '../../RescueMap/rescuemap/index.html';
      }
      
      // Thêm query parameter reportId để tự động zoom
      if (report.id) {
        const separator = baseHref.includes('?') ? '&' : '?';
        return `${baseHref}${separator}reportId=${report.id}`;
      }
      return baseHref;
    })();

    // Tính thời gian "vừa rồi"
    const timeAgo = (() => {
      try {
        const d = new Date(report.createdAt || report.date);
        if (isNaN(d.getTime())) return 'vừa xong';
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return 'vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        return `${Math.floor(diff / 3600)} giờ trước`;
      } catch (e) { return 'vừa xong'; }
    })();

    const toast = document.createElement('div');
    toast.className = `wg-rescue-toast ${meta.toastClass}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    toast.innerHTML = `
      <div class="wg-toast-header">
        <span class="wg-toast-badge ${meta.badgeClass}">
          <span class="wg-pulse-dot ${meta.dotClass}"></span>
          ${meta.label}
        </span>
        <span class="wg-toast-header-title">${escHtml(timeAgo)}</span>
        <button class="wg-toast-close" aria-label="Đóng thông báo" title="Đóng">✕</button>
      </div>
      <div class="wg-toast-body">
        ${thumbnailHtml}
        <div class="wg-toast-info">
          <div class="wg-toast-animal">${escHtml(report.animal)}</div>
          <div class="wg-toast-meta">
            <div class="wg-toast-location">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${escHtml(location)}
            </div>
            <div class="wg-toast-reporter">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Đăng bởi: ${escHtml(reporter)}
            </div>
          </div>
        </div>
      </div>
      <div class="wg-toast-footer">
        <a href="${mapUrl}" class="wg-toast-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${meta.btnLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </a>
      </div>
      <div class="wg-toast-progress-bar"></div>
    `;

    container.appendChild(toast);
    _activeToasts++;

    // Nút đóng
    const closeBtn = toast.querySelector('.wg-toast-close');
    const dismissToast = () => {
      toast.classList.add('wg-toast-leave');
      setTimeout(() => {
        try { container.removeChild(toast); } catch (e) {}
        _activeToasts = Math.max(0, _activeToasts - 1);
      }, 450);

      // Xóa khỏi sessionStorage khi đóng
      try {
        let active = JSON.parse(sessionStorage.getItem(STORAGE_ACTIVE) || '[]');
        active = active.filter(t => t.id !== report.id);
        sessionStorage.setItem(STORAGE_ACTIVE, JSON.stringify(active));
      } catch (e) {}
    };
    if (closeBtn) closeBtn.addEventListener('click', dismissToast);

    // Cập nhật duration của thanh progress bar theo thời gian còn lại
    const progressBar = toast.querySelector('.wg-toast-progress-bar');
    if (progressBar) {
      progressBar.style.animationDuration = `${duration}ms`;
    }

    // Animate in (rất nhỏ timeout để đảm bảo transition chạy)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('wg-toast-enter');
      });
    });

    // Tự đóng sau thời gian duration (thay vì TOAST_DURATION_MS cố định)
    let autoClose = setTimeout(dismissToast, duration);

    // Hover để dừng tự đóng
    toast.addEventListener('mouseenter', () => clearTimeout(autoClose));
    toast.addEventListener('mouseleave', () => {
      autoClose = setTimeout(dismissToast, 3000);
      if (progressBar) {
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth; // trigger reflow
        progressBar.style.animation = 'progressShrink 3s linear forwards';
      }
    });
  }

  // ═══════════════════════════════════════════
  // POLLING LOGIC
  // ═══════════════════════════════════════════

  async function pollForNewReports() {
    if (isNotifDisabled()) return;

    try {
      const url = getApiUrl('/api/rescuemap?t=' + Date.now());
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      // Lấy báo cáo mới nhất (server trả về theo thứ tự mới nhất trước hoặc sort theo createdAt)
      // Sắp xếp an toàn theo createdAt để luôn lấy đúng cái mới nhất
      const sorted = data.slice().sort((a, b) => {
        const da = new Date(a.createdAt || a.date || 0).getTime();
        const db = new Date(b.createdAt || b.date || 0).getTime();
        return db - da;
      });

      const newest = sorted[0];
      if (!newest || !newest._id) return;

      const newestId = newest._id.toString();
      const lastId   = localStorage.getItem(STORAGE_KEY_LAST_ID);

      // Lần đầu khởi động: Chỉ lưu ID, không show toast (tránh spam khi mới vào trang)
      if (!lastId) {
        localStorage.setItem(STORAGE_KEY_LAST_ID, newestId);
        return;
      }

      // Có báo cáo mới
      if (newestId !== lastId) {
        // Tìm tất cả báo cáo mới hơn lastId
        const lastIdx = sorted.findIndex(r => r._id.toString() === lastId);
        const newReports = lastIdx === -1 ? [newest] : sorted.slice(0, lastIdx);

        // Cập nhật ID mới nhất
        localStorage.setItem(STORAGE_KEY_LAST_ID, newestId);

        // Hiển thị toast cho từng báo cáo mới (tối đa MAX_TOASTS)
        const toShow = newReports.slice(0, MAX_TOASTS);
        toShow.forEach((report, i) => {
          setTimeout(() => {
            const normalizedReport = {
              id:            report._id || report.id,
              animal:        report.animalName || report.animal || 'Động vật chưa rõ',
              status:        report.status || 'emergency',
              location:      (report.address || '').trim() || 'Đang xác định...',
              photo:         report.photo || null,
              reporterName:  report.reportedBy?.fullName || report.reporter || 'Người dùng',
              createdAt:     report.createdAt || report.date || null
            };
            showRescueToast(normalizedReport);
          }, i * 600);
        });

        // Phát âm thanh 1 lần
        playAlertSound();
      }
    } catch (e) {
      // Không làm gì nếu lỗi mạng – polling sẽ tiếp tục
    }
  }

  function startPolling() {
    if (_pollTimer) return;
    // Poll ngay lập tức lần đầu (sau 3 giây để trang tải xong)
    setTimeout(pollForNewReports, 3000);
    _pollTimer = setInterval(pollForNewReports, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  // ═══════════════════════════════════════════
  // SETTINGS TOGGLE – inject vào profileSetupModal
  // ═══════════════════════════════════════════

  function injectNotifToggle() {
    // Đợi modal tồn tại trong DOM
    const modal = document.getElementById('profileSetupModal');
    if (!modal) return;

    // Tránh inject nhiều lần
    if (document.getElementById('wg-notif-toggle-row')) return;

    const saveBtn = modal.querySelector('#saveProfileBtn');
    if (!saveBtn) return;

    const isDisabled = isNotifDisabled();

    const toggleRow = document.createElement('div');
    toggleRow.id = 'wg-notif-toggle-row';
    toggleRow.className = 'wg-notif-toggle-row';
    toggleRow.innerHTML = `
      <div class="wg-notif-toggle-label">
        <span class="wg-notif-toggle-title">
          🔔 Thông báo cứu hộ
        </span>
        <span class="wg-notif-toggle-desc">Hiện thị khi có báo cáo cứu hộ mới</span>
      </div>
      <label class="wg-toggle-switch" title="Bật/tắt thông báo cứu hộ">
        <input type="checkbox" id="wg-notif-toggle-input" ${isDisabled ? '' : 'checked'} aria-label="Bật tắt thông báo cứu hộ">
        <span class="wg-toggle-slider"></span>
      </label>
    `;

    // Chèn trước nút Save
    saveBtn.parentNode.insertBefore(toggleRow, saveBtn);

    // Sự kiện toggle
    const input = toggleRow.querySelector('#wg-notif-toggle-input');
    if (input) {
      input.addEventListener('change', function () {
        if (this.checked) {
          localStorage.removeItem(STORAGE_KEY_DISABLED);
          // Restart polling nếu đã dừng
          if (!_pollTimer) startPolling();
        } else {
          localStorage.setItem(STORAGE_KEY_DISABLED, 'true');
        }
      });
    }
  }

  // Lắng nghe khi Settings modal được mở (theo cơ chế của web)
  function watchSettingsModal() {
    const modal = document.getElementById('profileSetupModal');
    if (!modal) return;

    // Dùng MutationObserver để biết khi modal được hiện
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const display = modal.style.display;
          if (display === 'flex' || display === 'block') {
            // Modal đang mở
            setTimeout(injectNotifToggle, 50);
          }
        }
        // Cũng check childList changes (đề phòng)
        if (m.type === 'childList') {
          setTimeout(injectNotifToggle, 50);
        }
      });
    });

    observer.observe(modal, {
      attributes: true,
      attributeFilter: ['style'],
      childList: false
    });
  }

  // ═══════════════════════════════════════════
  // PUBLIC API (dùng nếu cần từ bên ngoài)
  // ═══════════════════════════════════════════
  window.WGRescueNotifier = {
    show:  showRescueToast,
    sound: playAlertSound,
    start: startPolling,
    stop:  stopPolling,
    isDisabled: isNotifDisabled
  };

  // ═══════════════════════════════════════════
  // KHỞI TẠO
  // ═══════════════════════════════════════════

  function init() {
    if (_isInitialized) return;
    _isInitialized = true;

    // Chỉ hoạt động khi đã đăng nhập
    if (!isLoggedIn()) return;

    // Tạo container
    getContainer();

    // Bắt đầu polling
    startPolling();

    // Tái hiển thị các toast chưa hết hạn (khi user chuyển trang)
    try {
      const active = JSON.parse(sessionStorage.getItem('wg_rescue_active_toasts') || '[]');
      const now = Date.now();
      const valid = active.filter(t => t._expiresAt && t._expiresAt > now);
      
      // Cập nhật lại danh sách hợp lệ
      sessionStorage.setItem('wg_rescue_active_toasts', JSON.stringify(valid));
      
      // Hiển thị lại các toast còn thời gian
      valid.forEach((t, i) => {
        setTimeout(() => {
          showRescueToast(t, t._expiresAt - now);
        }, i * 300); // delay một chút cho mượt
      });
    } catch (e) {}

    // Inject toggle vào Settings
    watchSettingsModal();

    // Tìm và watch dropdownSettingsBtn để inject toggle kịp thời
    const settingsBtn = document.getElementById('dropdownSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        setTimeout(injectNotifToggle, 100);
      });
    }

    // Ngoài ra, lắng nghe toàn bộ document click để bắt mọi trường hợp mở settings
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#dropdownSettingsBtn');
      if (btn) {
        setTimeout(injectNotifToggle, 150);
      }
    }, { capture: true });
  }

  // Đợi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM đã sẵn sàng
    init();
  }

  // ─── Dọn dẹp khi rời trang ───
  window.addEventListener('beforeunload', stopPolling);

})();
