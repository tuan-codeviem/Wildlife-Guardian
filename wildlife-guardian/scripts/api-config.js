/**
 * api-config.js - Cấu hình URL API dùng chung cho toàn bộ dự án
 * Tự động phát hiện môi trường: Local (localhost:3000) hoặc Azure (không có port)
 */
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  // Nếu đang chạy trên máy local thì dùng port 3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // Nếu deploy lên server (Azure, Render...) thì dùng cùng origin, không cần port
  return window.location.origin;
})();
