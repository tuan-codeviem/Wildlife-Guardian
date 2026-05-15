
let reports = [];
let nextId = 1;
const helpersData = [
  { name: "Danh Thái", role: "Bác sĩ Thú y", verified: true, phone: "0912 345 678", lat: 16.0580, lng: 108.2200, address: "Số 12 Trần Phú, Đà Nẵng", isClinic: false },
  { name: "Thu Trần", role: "Cứu hộ động vật hoang dã", verified: true, phone: "0988 765 432", lat: 16.0620, lng: 108.2150, address: "Số 45 Bạch Đằng, Đà Nẵng", isClinic: false },
  { name: "Hải Lê", role: "Vận chuyển động vật", verified: false, phone: "0933 221 144", lat: 16.0450, lng: 108.2100, address: "Số 78 Hùng Vương, Đà Nẵng", isClinic: false },
  { name: "Minh Tuấn", role: "Tình nguyện viên", verified: true, phone: "0909 888 777", lat: 16.0550, lng: 108.2180, address: "Số 234 Trưng Nữ Vương, Đà Nẵng", isClinic: false },
  { 
    name: "Thanh Hưng", role: "Bác sĩ thú y chuyên nghiệp", verified: true, phone: "0903 456 789", lat: 10.8231, lng: 106.6297, address: "Số 123 Nguyễn Đình Chiểu, Quận 3, TP.HCM", city: "TP.Hồ Chí Minh", available: "24/7", specialty: "Cấp cứu khẩn cấp", isClinic: false
  },
  { 
    name: "Bác sĩ Huyền Trang", role: "Bác sĩ thú y", verified: true, phone: "0983 456 123", lat: 21.0285, lng: 105.8542, address: "Số 67 Láng Hạ, Đống Đa, Hà Nội", city: "Hà Nội", available: "24/7", specialty: "Cấp cứu thú cưng", isClinic: false
  },
  { 
    name: "Thái Bảo", role: "Bác sĩ thú y", verified: true, phone: "0943 210 987", lat: 16.4637, lng: 107.5909, address: "Số 56 Lê Lợi, Huế", city: "Huế", available: "8h-20h", specialty: "Động vật cung đình", isClinic: false
  },
  { 
    name: "Phòng khám Thú y Sài Gòn Xanh", role: "Phòng khám thú y", verified: true, phone: "028 6686 1234", lat: 10.8281, lng: 106.6397, address: "120/4 Lê Văn Việt, Quận 9, TP. Thủ Đức, HCM", city: "TP.Hồ Chí Minh", available: "24/7", specialty: "Cấp cứu 24/7 - X-quang - Siêu âm", isClinic: true
  },
  { 
    name: "Phòng khám Thú y Hà Nội", role: "Phòng khám thú y", verified: true, phone: "024 3832 8888", lat: 21.0245, lng: 105.8442, address: "67 Láng Hạ, Đống Đa, Hà Nội", city: "Hà Nội", available: "24/7", specialty: "Cấp cứu - Ngoại khoa - Xét nghiệm", isClinic: true
  },
  { 
    name: "Phòng khám Thú y Đà Nẵng", role: "Phòng khám thú y", verified: true, phone: "0236 389 9999", lat: 16.0600, lng: 108.2220, address: "234 Trưng Nữ Vương, Hải Châu, Đà Nẵng", city: "Đà Nẵng", available: "8h-21h", specialty: "Cấp cứu - Chăm sóc đặc biệt", isClinic: true
  }
];

let activeCircle = null;
let activeTab = "all";
let searchKeyword = "";
let map = null;
let markersLayer = null;

let video = null;
let canvas = null;
let stream = null;
let capturedPhoto = null;
let currentLocation = null;
let currentAddress = "";

let toastContainer = null;

function createToastContainer() {
  if (document.getElementById('customToastContainer')) return;
  const container = document.createElement('div');
  container.id = 'customToastContainer';
  container.style.cssText = `position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10000; pointer-events: none;`;
  document.body.appendChild(container);
  toastContainer = container;
}

function showToast(message, type = 'success') {
  createToastContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `background: ${type === 'success' ? 'linear-gradient(135deg, #2a9d8f, #1a5e2a)' : 'linear-gradient(135deg, #e76f51, #d62828)'}; color: white; padding: 14px 24px; border-radius: 50px; display: flex; align-items: center; gap: 12px; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 10px; animation: slideUp 0.3s ease; font-size: 14px; pointer-events: none;`;
  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
  icon.style.fontSize = '20px';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function addToastAnimations() {
  if (document.getElementById('toastAnimations')) return;
  const style = document.createElement('style');
  style.id = 'toastAnimations';
  style.textContent = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
  `;
  document.head.appendChild(style);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistance(distance) {
  if (distance === null) return "?";
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}

function findNearestHelper(lat, lng) {
  let nearest = null, minDistance = Infinity;
  helpersData.forEach(helper => {
    if (helper.isClinic) return;
    const dist = calculateDistance(lat, lng, helper.lat, helper.lng);
    if (dist < minDistance) { minDistance = dist; nearest = { ...helper, distance: dist }; }
  });
  return nearest;
}

function findNearestClinic(lat, lng) {
  let nearest = null, minDistance = Infinity;
  helpersData.forEach(helper => {
    if (!helper.isClinic) return;
    const dist = calculateDistance(lat, lng, helper.lat, helper.lng);
    if (dist < minDistance) { minDistance = dist; nearest = { ...helper, distance: dist }; }
  });
  return nearest;
}

function clearRadiusCircle() {
  if (activeCircle && map) { map.removeLayer(activeCircle); activeCircle = null; }
}

function showRadiusCircle(lat, lng) {
  clearRadiusCircle();
  activeCircle = L.circle([lat, lng], { color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 0.15, radius: 500, weight: 2, opacity: 0.6 }).addTo(map);
  setTimeout(() => { if (activeCircle && map) { map.removeLayer(activeCircle); activeCircle = null; } }, 5000);
}

function filterReports() {
  let filtered = [...reports];
  if (activeTab !== "all" && activeTab !== "map" && activeTab !== "list") {
    filtered = filtered.filter(r => r.status === activeTab);
  }
  if (searchKeyword && searchKeyword.trim() !== "") {
    const kw = searchKeyword.toLowerCase().trim();
    filtered = filtered.filter(r => r.animal.toLowerCase().includes(kw) || r.location.toLowerCase().includes(kw));
  }
  return filtered;
}

function deleteReport(reportId) {
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10001;`;
  const dialog = document.createElement('div');
  dialog.style.cssText = `background:white; border-radius:20px; padding:24px; width:300px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.3);`;
  dialog.innerHTML = `<i class="fas fa-trash-alt" style="font-size:48px; color:#d62828; margin-bottom:16px;"></i><h3>Xóa báo cáo?</h3><p>Bạn có chắc muốn xóa?</p><div style="display:flex; gap:12px; margin-top:20px;"><button id="confirmDeleteBtn" style="flex:1; background:#d62828; color:white; border:none; padding:10px; border-radius:30px; cursor:pointer;">Xóa</button><button id="cancelDeleteBtn" style="flex:1; background:#ccc; border:none; padding:10px; border-radius:30px; cursor:pointer;">Hủy</button></div>`;
  modal.appendChild(dialog);
  document.body.appendChild(modal);
  document.getElementById('confirmDeleteBtn').onclick = () => {
    reports = reports.filter(r => r.id !== reportId);
    renderReportsPanel();
    renderNearbyHelpers();
    renderNearestClinic();
    if (map) updateMapMarkers();
    showToast('Đã xóa báo cáo!', 'success');
    modal.remove();
  };
  document.getElementById('cancelDeleteBtn').onclick = () => modal.remove();
}

function updateReport(report) {
  const newAnimal = prompt('✏️ Nhập tên/loài động vật:', report.animal);
  if (!newAnimal || newAnimal.trim() === '') { showToast('Tên không được để trống!', 'error'); return; }
  const newStatus = prompt('📌 Chọn tình trạng (emergency/progress/rescued):', report.status);
  if (!newStatus || !['emergency', 'progress', 'rescued'].includes(newStatus)) { showToast('Tình trạng không hợp lệ!', 'error'); return; }
  const newDesc = prompt('📝 Mô tả thêm:', report.description || '');
  report.animal = newAnimal.trim();
  report.status = newStatus;
  report.description = newDesc || '';
  report.date = new Date().toLocaleString('vi-VN');
  renderReportsPanel();
  renderNearbyHelpers();
  renderNearestClinic();
  if (map) updateMapMarkers();
  showToast('Đã cập nhật báo cáo!', 'success');
}

function createReportCardHTML(report) {
  let statusDisplay = "", statusIcon = "", statusClass = "";
  if (report.status === "emergency") { statusDisplay = "🚨 Khẩn cấp"; statusIcon = "🔴"; statusClass = "emergency"; }
  else if (report.status === "progress") { statusDisplay = "⏳ Đang xử lý"; statusIcon = "🟡"; statusClass = "progress"; }
  else { statusDisplay = "✅ Đã cứu"; statusIcon = "🟢"; statusClass = "rescued"; }
  return `<div class="report-card ${statusClass}" style="background:white; border-radius:12px; padding:12px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.1); border-left:4px solid ${report.status==='emergency'?'#d62828':report.status==='progress'?'#3b82f6':'#2a9d8f'}"><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="font-weight:bold;"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</span><span class="status-tag">${statusIcon} ${statusDisplay}</span></div><div style="font-size:13px; color:#555;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(report.location)}</div><div style="font-size:12px; color:#888;"><i class="fas fa-calendar-alt"></i> ${report.date}</div>${report.photo ? `<img src="${report.photo}" style="width:100%; max-height:150px; object-fit:cover; border-radius:8px; margin:8px 0;">` : ''}${report.description ? `<div style="font-size:13px; margin:8px 0;">${escapeHtml(report.description)}</div>` : ''}<div style="display:flex; gap:8px; margin-top:8px;"><button class="small-btn locate-btn" data-lat="${report.lat}" data-lng="${report.lng}" style="background:#2a9d8f; color:white; border:none; padding:6px 12px; border-radius:20px; cursor:pointer;"><i class="fas fa-location-dot"></i> Định vị</button><button class="small-btn update-btn" data-id="${report.id}" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:20px; cursor:pointer;"><i class="fas fa-edit"></i> Cập nhật</button><button class="small-btn delete-btn" data-id="${report.id}" style="background:#d62828; color:white; border:none; padding:6px 12px; border-radius:20px; cursor:pointer;"><i class="fas fa-trash"></i> Xóa</button></div></div>`;
}

function attachCardEvents() {
  document.querySelectorAll('.locate-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      setActiveTab('map');
      setTimeout(() => {
        if (map) {
          map.setView([lat, lng], 16);
          showRadiusCircle(lat, lng);
          setTimeout(() => {
            markersLayer.eachLayer(layer => {
              if (Math.abs(layer.getLatLng().lat - lat) < 0.0001 && Math.abs(layer.getLatLng().lng - lng) < 0.0001) {
                layer.openPopup();
              }
            });
          }, 300);
        }
      }, 200);
    };
  });
  document.querySelectorAll('.update-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const report = reports.find(r => r.id === id);
      if (report) updateReport(report);
    };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      deleteReport(id);
    };
  });
}

function initRealMap() {
  const mapContainer = document.getElementById("interactiveMap");
  if (!mapContainer) return;
  if (typeof L === 'undefined') { console.error("Leaflet chưa tải"); return; }
  if (map) map.remove();
  map = L.map('interactiveMap').setView([16.0545, 108.2171], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19 }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  updateMapMarkers();
}

function updateMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  const filteredReports = filterReports();
  filteredReports.forEach(report => {
    let markerColor = '#d62828';
    let statusText = '🚨 KHẨN CẤP';
    if (report.status === 'rescued') 
      { markerColor = '#2a9d8f'; statusText = '✅ ĐÃ CỨU'; }
    else if (report.status === 'progress') 
      { markerColor = '#3b82f6'; statusText = '⏳ ĐANG XỬ LÝ'; }
    const nearestHelper = findNearestHelper(report.lat, report.lng);
    const nearestClinic = findNearestClinic(report.lat, report.lng);
    const markerIcon = L.divIcon({ className: 'custom-marker', html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`, iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] });
    const marker = L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(markersLayer);
    let helperHtml = nearestHelper ? 
    `<div style="background:#f0fdf4; padding:10px; border-radius:8px; margin:8px 0;"><div style="font-weight:bold;">🏥 Người hỗ trợ gần nhất:</div><div>👨‍⚕️ <strong>${escapeHtml(nearestHelper.name)}</strong><br>📍 Cách ${formatDistance(nearestHelper.distance)}<br>📞 ${nearestHelper.phone}</div></div>` : `<div style="background:#fff3cd; padding:8px; border-radius:8px;">⚠️ Chưa có người hỗ trợ gần</div>`;
    let clinicHtml = nearestClinic ? 
    `<div style="background:#e8f5e9; padding:10px; border-radius:8px;"><div style="font-weight:bold;">🏪 Phòng khám gần nhất:</div><div>🏥 <strong>${escapeHtml(nearestClinic.name)}</strong><br>📍 Cách ${formatDistance(nearestClinic.distance)}<br>📞 ${nearestClinic.phone}<br>🕐 ${nearestClinic.available}</div></div>` : '';
    const popupContent = `<div style="min-width:260px;"><div style="font-weight:bold; font-size:16px;">🐾 ${escapeHtml(report.animal)}</div><div><i class="fas fa-map-marker-alt"></i> ${escapeHtml(report.location)}</div><div><i class="fas fa-calendar-alt"></i> ${report.date}</div>${report.photo ? `<img src="${report.photo}" style="width:100%; border-radius:8px; margin:8px 0; max-height:150px;">` : ''}${report.description ? `<div>${escapeHtml(report.description)}</div>` : ''}<div><span style="background:${markerColor}; color:white; padding:3px 10px; border-radius:20px;">${statusText}</span></div>${helperHtml}${clinicHtml}<hr><div style="font-size:11px; text-align:center;">🔘 Nhấn vào marker để hiện bán kính 500m</div></div>`;
    marker.bindPopup(popupContent);
    marker.on('click', function() {
       showRadiusCircle(report.lat, report.lng); });
  });
  if (filteredReports.length === 1) map.setView([filteredReports[0].lat, filteredReports[0].lng], 15);
  else if (filteredReports.length > 1) map.fitBounds(filteredReports.map(r => [r.lat, r.lng]));
}

function renderReportsPanel() {
  const container = document.getElementById("reportsPanel");
  if (!container) return;
  const filtered = filterReports();
  if (filtered.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-camera" style="font-size:48px; color:#ccc;"></i><h3>Chưa có báo cáo</h3><p>Nhấn "Report Now" để báo cáo động vật cần cứu!</p></div>`; return; }
  container.innerHTML = `<div style="margin-bottom:12px; font-weight:bold;">📋 Danh sách báo cáo (${filtered.length})</div>`;
  filtered.forEach(r => container.innerHTML += createReportCardHTML(r));
  attachCardEvents();
}

function renderNearbyHelpers() {
  const helpersDiv = document.getElementById("helpersList");
  if (!helpersDiv) return;
  const currentReports = filterReports();
  const onlyHelpers = helpersData.filter(h => !h.isClinic);
  const helpersWithDistance = onlyHelpers.map(helper => {
    let minDistance = Infinity, nearestReport = null;
    currentReports.forEach(report => {
       const dist = calculateDistance(helper.lat, helper.lng, report.lat, report.lng); if (dist < minDistance) { minDistance = dist; nearestReport = report; } });
    return { ...helper, nearestDistance: minDistance, nearestReport };
  });
  const filteredHelpers = helpersWithDistance.filter(h => h.nearestDistance !== Infinity && h.nearestDistance <= 5);
  filteredHelpers.sort((a,b) => a.nearestDistance - b.nearestDistance);
  if (filteredHelpers.length === 0) { helpersDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#999;"><i class="fas fa-user-md"></i><p>Không có người hỗ trợ trong bán kính 5km</p></div>`; return; }
  helpersDiv.innerHTML = "";
  filteredHelpers.forEach(helper => {
    const card = document.createElement("div");
    card.className = "helper-card";
    card.style.cssText = "background:#fff; border-radius:12px; padding:12px; margin-bottom:10px; box-shadow:0 1px 4px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center;";
    card.innerHTML = `<div><h4 style="margin:0;"><i class="fas fa-user-md"></i> ${escapeHtml(helper.name)}</h4><p style="margin:4px 0; font-size:12px;">${escapeHtml(helper.role)} ${helper.verified ? '✓ Đã xác thực' : '⚠️ Chưa xác thực'}</p><div style="font-size:12px;"><i class="fas fa-location-dot"></i> Cách ${formatDistance(helper.nearestDistance)} đến <strong>${escapeHtml(helper.nearestReport.animal)}</strong></div><div style="font-size:11px; color:#888;">${escapeHtml(helper.address)}</div></div><button class="contact-btn" data-phone="${helper.phone}" data-name="${escapeHtml(helper.name)}" style="background:#2a9d8f; color:white; border:none; padding:8px 16px; border-radius:20px; cursor:pointer;"><i class="fas fa-phone"></i> Gọi</button>`;
    helpersDiv.appendChild(card);
  });
  document.querySelectorAll('.contact-btn').forEach(btn => { btn.onclick = () => { if(confirm(`📞 Gọi cho ${btn.dataset.name}?`)) window.location.href = `tel:${btn.dataset.phone}`; }; });
}

function renderNearestClinic() {
  const clinicDiv = document.getElementById("nearestClinic");
  if (!clinicDiv) return;
  const currentReports = filterReports();
  const clinics = helpersData.filter(h => h.isClinic === true);
  if (clinics.length === 0) { clinicDiv.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-hospital"></i><p>Không có phòng khám</p></div>`; return; }
  let targetLat = 16.0545, targetLng = 108.2171;
  if (currentReports.length > 0) { const priority = currentReports.find(r => r.status === 'emergency') || currentReports[0]; targetLat = priority.lat; targetLng = priority.lng; }
  const clinicsWithDistance = clinics.map(c => ({ ...c, distance: calculateDistance(targetLat, targetLng, c.lat, c.lng) }));
  clinicsWithDistance.sort((a,b) => a.distance - b.distance);
  const nearest = clinicsWithDistance[0];
  const distText = formatDistance(nearest.distance);
  clinicDiv.innerHTML = `<div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-radius:12px; padding:14px; border-left:4px solid #2a9d8f;"><div style="display:flex; gap:12px; align-items:center;"><div style="background:#2a9d8f; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fas fa-hospital" style="color:white;"></i></div><div><h4 style="margin:0;">🏥 ${escapeHtml(nearest.name)}</h4><div>📍 Cách ${distText}</div></div></div><div style="margin-top:8px; font-size:12px;">${nearest.address} | 🕐 ${nearest.available} | 📋 ${nearest.specialty}</div><button class="clinic-contact-btn" data-phone="${nearest.phone}" data-name="${escapeHtml(nearest.name)}" style="margin-top:10px; background:#2a9d8f; color:white; border:none; padding:8px; width:100%; border-radius:30px; cursor:pointer;"><i class="fas fa-phone"></i> Gọi ngay</button></div>`;
  const btn = clinicDiv.querySelector('.clinic-contact-btn');
  if(btn) btn.onclick = () => {
     if(confirm(`📞 Gọi cho ${btn.dataset.name}?`)) window.location.href = `tel:${btn.dataset.phone}`;
     };
}

function getSampleImage(animalType) {
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0,0,200,200);
  ctx.fillStyle = '#ff6b35'; ctx.font = 'bold 60px "Segoe UI Emoji"';
   ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let emoji = '🐾';
  if(animalType.includes('Chó')) emoji = '🐕';
  else if(animalType.includes('Mèo')) emoji = '🐈';
  else if(animalType.includes('Chim')) emoji = '🐦';
  else if(animalType.includes('Nhím')) emoji = '🦔';
  else if(animalType.includes('Thỏ')) emoji = '🐇';
  else if(animalType.includes('Rùa')) emoji = '🐢';
  else if(animalType.includes('khỉ')) emoji = '🐒';
  ctx.fillText(emoji, 100, 80);
  ctx.font = 'bold 14px "Segoe UI"'; ctx.fillStyle = '#333'; ctx.fillText(animalType, 100, 150);
  ctx.font = '12px "Segoe UI"'; ctx.fillStyle = '#999'; ctx.fillText('Đang cần cứu hộ', 100, 180);
  return canvas.toDataURL('image/jpeg', 0.8);
}

const daNangLat = 16.0545, daNangLng = 108.2171, HCMLat = 10.8231, HCMLng = 106.6297, HanoiLat = 21.0285, HanoiLng = 105.8542;
function offsetCoordinate(base, maxOffset = 0.002) { return base + (Math.random() - 0.5) * maxOffset; }
const sampleReports = [
  { animal: "Chó hoang bị thương", location: "Hẻm 491 Trưng Nữ Vương, Đà Nẵng", status: "emergency", lat: offsetCoordinate(daNangLat, 0.0015), lng: offsetCoordinate(daNangLng, 0.0015), description: "Chó bị gãy chân trước, cần hỗ trợ khẩn cấp" },
  { animal: "Mèo mắc kẹt trên mái nhà", location: "Kiệt 483 Trưng Nữ Vương, Đà Nẵng", status: "progress", lat: offsetCoordinate(daNangLat, 0.002), lng: offsetCoordinate(daNangLng, -0.0018), description: "Mèo kêu thảm thiết" },
  { animal: "Chim bồ câu gãy cánh", location: "Công viên 29/3", status: "rescued", lat: offsetCoordinate(daNangLat, -0.0012), lng: offsetCoordinate(daNangLng, 0.0022), description: "Đã cứu" },
  { animal: "Nhím cảnh bị bỏ rơi", location: "Đường Nguyễn Văn Linh", status: "emergency", lat: offsetCoordinate(daNangLat, 0.0025), lng: offsetCoordinate(daNangLng, 0.001), description: "Nhím trong thùng carton" },
  { animal: "Khỉ bị thương", location: "Khu du lịch Suối Tiên, HCM", status: "progress", lat: offsetCoordinate(HCMLat, 0.0015), lng: offsetCoordinate(HCMLng, 0.0018), description: "Cần cứu giúp" },
  { animal: "Rùa bị bắt cóc", location: "Gần trường Bách Khoa Hà Nội", status: "emergency", lat: offsetCoordinate(HanoiLat, 0.0013), lng: offsetCoordinate(HanoiLng, -0.0017), description: "Cần hỗ trợ gấp" }
];
sampleReports.forEach(report => { report.photo = getSampleImage(report.animal); report.date = new Date().toLocaleString('vi-VN'); });
if (reports.length === 0) {
   sampleReports.forEach(report => { reports.push({ id: nextId++, ...report }); }); }

async function initCamera() {
  video = document.getElementById('video');
  if (!video) return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showToast('❌ Trình duyệt không hỗ trợ camera', 'error'); return false; }
  try {
    const constraints = {
       video: { facingMode: { 
        exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } };
    try { stream = await navigator.mediaDevices.getUserMedia(constraints);

     } catch (err) { 
      stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
    video.srcObject = stream; video.setAttribute('playsinline', true); await video.play(); return true;
  } catch (err) { showToast(`❌ Không thể truy cập camera: ${err.message}`, 'error'); return false; }
}
function stopCamera() { if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; } if (video) video.srcObject = null; }
function capturePhoto() {
  if (!video || !video.videoWidth) { showToast('Camera chưa sẵn sàng!', 'error'); 
    return; }
  canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
  document.getElementById('previewImg').src = capturedPhoto; document.getElementById('previewSection').style.display = 'block';
  document.getElementById('captureBtn').style.display = 'none'; document.getElementById('retakeBtn').style.display = 'flex';
  stopCamera(); video.style.display = 'none';
}
function retakePhoto() { 
  capturedPhoto = null; 
  document.getElementById('previewSection').style.display = 'none';
   document.getElementById('captureBtn').style.display = 'flex'; document.getElementById('retakeBtn').style.display = 'none';
    video.style.display = 'block';
    
    initCamera(); }
async function getCurrentLocation() {
   return new Promise((resolve, reject) => { if (!navigator.geolocation) reject("GPS không hỗ trợ");
     else navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
     }); }
async function getAddressFromCoords(lat, lng) {
  try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
   const data = await res.json();
    if (data.display_name) return data.display_name.split(',')[0]+','+data.display_name.split(',')[1]+','+data.display_name.split(',')[2]; return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; } catch(e) { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
   }
}
async function fetchLocationAndAddress() {
  const locationLoading = document.getElementById('locationLoading');
   const addressText = document.getElementById('addressText');
  locationLoading.style.display = 'block';
  try { const pos = await getCurrentLocation();
     currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      currentAddress = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
       addressText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${escapeHtml(currentAddress)}`;
        locationLoading.style.display = 'none'; return true; }
  catch(e) { locationLoading.style.display = 'none'; 
    showToast('Không lấy được vị trí, bật GPS', 'error'); return false; }
}
async function submitReport() {
  const animalName = document.getElementById('animalName').value.trim(); 
  const animalStatus = document.getElementById('animalStatus').value;
 const animalDesc = document.getElementById('animalDesc').value.trim();
  if (!animalName) { showToast('Nhập tên động vật!', 'error'); return; }
  if (!capturedPhoto) { showToast('Chụp ảnh động vật!', 'error'); return; }
  if (!currentLocation) { showToast('Chờ lấy vị trí GPS...', 'error'); return; }
  const newReport = { id: nextId++, animal: animalName, location: currentAddress, status: animalStatus, lat: currentLocation.lat, lng: currentLocation.lng, date: new Date().toLocaleString('vi-VN'), description: animalDesc, photo: capturedPhoto };
  reports.push(newReport); closeCameraModal();
   renderReportsPanel(); renderNearbyHelpers();
    renderNearestClinic();
  if (map) { updateMapMarkers();
     setActiveTab('map');
     setTimeout(() => { map.setView([currentLocation.lat, currentLocation.lng], 16);
       showRadiusCircle(currentLocation.lat, currentLocation.lng); }, 500); }
  showToast('✅ Gửi báo cáo thành công!', 'success');
}
async function openCameraModal(e) {
  if (e) e.preventDefault(); const modal = document.getElementById('cameraModal');
   if (!modal) return;
    modal.style.display = 'block';
  document.getElementById('animalName').value = '';
   document.getElementById('animalDesc').value = '';
    document.getElementById('animalStatus').value = 'emergency';
  document.getElementById('previewSection').style.display = 'none';
   document.getElementById('captureBtn').style.display = 'flex';
    document.getElementById('retakeBtn').style.display = 'none';
  capturedPhoto = null;
  currentLocation = null; 
  video = document.getElementById('video');
   video.style.display = 'block';
    const captureBtn = document.getElementById('captureBtn');
  captureBtn.disabled = true;
   captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang khởi tạo...';
  const ok = await initCamera(); 
  if (ok) { captureBtn.disabled = false;
     captureBtn.innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';
      await fetchLocationAndAddress(); } else { captureBtn.disabled = false;
         captureBtn.innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh'; }
}
function closeCameraModal() { 
  const modal = document.getElementById('cameraModal');
   if (modal) modal.style.display = 'none'; stopCamera(); }

window.setActiveTab = function(tabId) {
  activeTab = tabId;
  const mapContainer = document.querySelector('.map-container');
   const reportsPanel = document.getElementById('reportsPanel');
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
  if (tabId === "map") {
     if(mapContainer) mapContainer.style.display = 'block';
     if(reportsPanel) reportsPanel.style.display = 'none';
      if (!map) initRealMap(); 
      else { map.invalidateSize();
         updateMapMarkers(); 
        } }
  else { if(mapContainer) mapContainer.style.display = 'none';
     if(reportsPanel) reportsPanel.style.display = 'block';
      renderReportsPanel(); renderNearbyHelpers(); renderNearestClinic();
       if(map) updateMapMarkers(); }
};
function handleSearch() { searchKeyword = document.getElementById("searchInput")?.value || ""; 
  if (activeTab === 'list') {
     renderReportsPanel();
      renderNearbyHelpers();
       renderNearestClinic();

   } if (map) updateMapMarkers(); }

document.addEventListener("DOMContentLoaded", () => {
  addToastAnimations();
   setTimeout(() => { if (typeof L !== 'undefined') initRealMap(); }, 500);
  renderReportsPanel();
   renderNearbyHelpers();
    renderNearestClinic();
  document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab)));
  const searchBtn = document.getElementById("searchBtn");
   const searchInput = document.getElementById("searchInput");
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
   if (searchInput) searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") handleSearch(); });
  const reportBtn = document.getElementById("reportNowBtn");
   if (reportBtn) reportBtn.addEventListener("click", openCameraModal);
  document.getElementById("captureBtn")?.addEventListener("click", capturePhoto); 
  document.getElementById("retakeBtn")?.addEventListener("click", retakePhoto);
  document.getElementById("submitReportBtn")?.addEventListener("click", submitReport);
   document.querySelectorAll(".close-modal").forEach(btn => btn.addEventListener("click", closeCameraModal));
  window.addEventListener("click", (e) => { 
    if (e.target.classList?.contains("modal")) closeCameraModal();
   });
  window.setActiveTab("map");
});