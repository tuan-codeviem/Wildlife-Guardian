// Cấu hình Token Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZmM2MjY2ZS03ZDI3LTQ3YzgtYTMxMi0wNDg3ZDc5YzRlNTYiLCJpZCI6NDM4ODM2LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAyOTY2OTl9.tDMoMdaTI7NA8otfGmZ1bwnMZFub0aSsaJLdYu54j6M';

// Navbar Mobile Toggle
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
if (hamburger && mobileNav) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobileNav.classList.toggle("show");
  });
}

const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelector(".nav-item.active")?.classList.remove("active");
    this.classList.add("active");
  });
});

// Variables
let reports = [];
let nextId = 1;
const helpersData = [
  { name: "Danh Thái", role: "Bác sĩ Thú y", verified: true, phone: "0912 345 678", lat: 16.058, lng: 108.22, address: "Số 12 Trần Phú, Đà Nẵng", isClinic: false },
  { name: "Thu Trần", role: "Cứu hộ động vật hoang dã", verified: true, phone: "0988 765 432", lat: 16.062, lng: 108.215, address: "Số 45 Bạch Đằng, Đà Nẵng", isClinic: false },
  { name: "Hải Lê", role: "Vận chuyển động vật", verified: false, phone: "0933 221 144", lat: 16.045, lng: 108.21, address: "Số 78 Hùng Vương, Đà Nẵng", isClinic: false },
  { name: "Phòng khám Thú y Đà Nẵng", role: "Phòng khám thú y", verified: true, phone: "0236 389 9999", lat: 16.06, lng: 108.222, address: "234 Trưng Nữ Vương, Đà Nẵng", city: "Đà Nẵng", available: "8h-21h", specialty: "Cấp cứu - Chăm sóc đặc biệt", isClinic: true }
];

let activeTab = "all";
let searchKeyword = "";
let viewer = null;
let popupDiv = null;
let activeEntity = null;

let video = null;
let canvas = null;
let stream = null;
let capturedPhoto = null;
let currentLocation = null;
let currentAddress = "";
let toastContainer = null;

// ================= CÁC HÀM TIỆN ÍCH =================

function createToastContainer() {
  if (document.getElementById("customToastContainer")) return;
  const container = document.createElement("div");
  container.id = "customToastContainer";
  container.style.cssText = `position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10000; pointer-events: none;`;
  document.body.appendChild(container);
  toastContainer = container;
}

function showToast(message, type = "success") {
  createToastContainer();
  const toast = document.createElement("div");
  toast.style.cssText = `background: ${type === "success" ? "linear-gradient(135deg, #2a9d8f, #1a5e2a)" : "linear-gradient(135deg, #e76f51, #d62828)"}; color: white; padding: 14px 24px; border-radius: 50px; display: flex; align-items: center; gap: 12px; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 10px; animation: slideUp 0.3s ease; font-size: 14px; pointer-events: none;`;
  const icon = document.createElement("i");
  icon.className = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-triangle";
  icon.style.fontSize = "20px";
  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideDown 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function addToastAnimations() {
  if (document.getElementById("toastAnimations")) return;
  const style = document.createElement("style");
  style.id = "toastAnimations";
  style.textContent = `
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
    /* Hiệu ứng hover cho nút bấm báo cáo */
    .report-action-btn:hover { filter: brightness(0.95); transform: translateY(-1px); }
    .report-action-btn:active { transform: translateY(0); }
  `;
  document.head.appendChild(style);
}

function addPanelStyles() {
  if (document.getElementById("panelFixStyles")) return;
  const style = document.createElement("style");
  style.id = "panelFixStyles";
  style.textContent = `
    #reportsPanel {
      max-height: calc(100vh - 250px);
      overflow-y: auto;
      padding-right: 8px;
    }
    #reportsPanel::-webkit-scrollbar { width: 6px; }
    #reportsPanel::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    #reportsPanel::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
    #reportsPanel::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
  `;
  document.head.appendChild(style);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distance) {
  if (distance === null) return "?";
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}

function filterReports() {
  let filtered = [...reports];
  if (activeTab !== "all" && activeTab !== "map" && activeTab !== "list") {
    filtered = filtered.filter((r) => r.status === activeTab);
  }
  if (searchKeyword && searchKeyword.trim() !== "") {
    const kw = searchKeyword.toLowerCase().trim();
    filtered = filtered.filter((r) => r.animal.toLowerCase().includes(kw) || r.location.toLowerCase().includes(kw));
  }
  return filtered;
}

// ================= RENDER COMPONENTS TÌNH NGUYỆN VIÊN & PHÒNG KHÁM =================

function renderNearbyHelpers() {
  const helpersDiv = document.getElementById("helpersList");
  if (!helpersDiv) return;
  const currentReports = filterReports();
  const onlyHelpers = helpersData.filter((h) => !h.isClinic);
  const helpersWithDistance = onlyHelpers.map((helper) => {
    let minDistance = Infinity, nearestReport = null;
    currentReports.forEach((report) => {
      const dist = calculateDistance(helper.lat, helper.lng, report.lat, report.lng);
      if (dist < minDistance) { minDistance = dist; nearestReport = report; }
    });
    return { ...helper, nearestDistance: minDistance, nearestReport };
  });
  
  const filteredHelpers = helpersWithDistance.filter((h) => h.nearestDistance !== Infinity && h.nearestDistance <= 5);
  filteredHelpers.sort((a, b) => a.nearestDistance - b.nearestDistance);
  
  if (filteredHelpers.length === 0) {
    helpersDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#999;"><i class="fas fa-user-md"></i><p>Không có người hỗ trợ trong bán kính 5km</p></div>`;
    return;
  }
  
  helpersDiv.innerHTML = "";
  filteredHelpers.forEach((helper) => {
    const card = document.createElement("div");
    card.className = "helper-card";
    card.innerHTML = `<div><h4 style="margin:0;"><i class="fas fa-user-md"></i> ${escapeHtml(helper.name)}</h4><p style="margin:4px 0; font-size:12px;">${escapeHtml(helper.role)} ${helper.verified ? "✓ Đã xác thực" : "⚠️ Chưa xác thực"}</p><div style="font-size:12px;"><i class="fas fa-location-dot"></i> Cách ${formatDistance(helper.nearestDistance)} đến <strong>${escapeHtml(helper.nearestReport.animal)}</strong></div><div style="font-size:11px; color:#888;">${escapeHtml(helper.address)}</div></div><button class="contact-btn" data-phone="${helper.phone}" data-name="${escapeHtml(helper.name)}"><i class="fas fa-phone"></i> Gọi</button>`;
    helpersDiv.appendChild(card);
  });
  
  document.querySelectorAll(".contact-btn").forEach((btn) => {
    btn.onclick = () => { if (confirm(`📞 Gọi cho ${btn.dataset.name}?`)) window.location.href = `tel:${btn.dataset.phone}`; };
  });
}

function renderNearestClinic() {
  const clinicDiv = document.getElementById("nearestClinic");
  if (!clinicDiv) return;
  const currentReports = filterReports();
  const clinics = helpersData.filter((h) => h.isClinic === true);
  if (clinics.length === 0) {
    clinicDiv.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-hospital"></i><p>Không có phòng khám</p></div>`;
    return;
  }
  let targetLat = 16.0545, targetLng = 108.2171;
  if (currentReports.length > 0) {
    const priority = currentReports.find((r) => r.status === "emergency") || currentReports[0];
    targetLat = priority.lat; targetLng = priority.lng;
  }
  const clinicsWithDistance = clinics.map((c) => ({ ...c, distance: calculateDistance(targetLat, targetLng, c.lat, c.lng) }));
  clinicsWithDistance.sort((a, b) => a.distance - b.distance);
  const nearest = clinicsWithDistance[0];
  const distText = formatDistance(nearest.distance);
  
  clinicDiv.innerHTML = `<div class="clinic-card" style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-radius:12px; padding:14px; border-left:4px solid #2a9d8f;"><div style="display:flex; gap:12px; align-items:center;"><div style="background:#2a9d8f; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fas fa-hospital" style="color:white;"></i></div><div><h4 style="margin:0;">🏥 ${escapeHtml(nearest.name)}</h4><div>📍 Cách ${distText}</div></div></div><div style="margin-top:8px; font-size:12px;">${nearest.address} | 🕐 ${nearest.available} | 📋 ${nearest.specialty}</div><button class="clinic-contact-btn" data-phone="${nearest.phone}" data-name="${escapeHtml(nearest.name)}" style="margin-top:10px; width:100%;"><i class="fas fa-phone"></i> Gọi ngay</button></div>`;
  
  const btn = clinicDiv.querySelector(".clinic-contact-btn");
  if (btn) btn.onclick = () => { if (confirm(`📞 Gọi cho ${btn.dataset.name}?`)) window.location.href = `tel:${btn.dataset.phone}`; };
}

// ================= QUẢN LÝ BÁO CÁO (PANEL TRÁI) =================

function createReportCardHTML(report) {
  let statusDisplay = "", statusIcon = "", statusClass = "";
  let statusColor = "", statusBg = "";
  
  if (report.status === "emergency") { 
    statusDisplay = "Khẩn cấp"; statusIcon = "🚨"; statusClass = "emergency"; 
    statusColor = "#d62828"; statusBg = "#fbeae9";
  } else if (report.status === "progress") { 
    statusDisplay = "Đang xử lý"; statusIcon = "⏳"; statusClass = "progress"; 
    statusColor = "#e67e22"; statusBg = "#fdf3e8";
  } else { 
    statusDisplay = "Đã cứu"; statusIcon = "✅"; statusClass = "rescued"; 
    statusColor = "#2a9d8f"; statusBg = "#e9f5f4";
  }
  
  const photoSrc = report.photo ? report.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(report.animal)}&background=random&size=128`;

  // Thẻ báo cáo phiên bản mới: Lớn hơn, đẹp hơn, giống với thẻ người hỗ trợ
  return `<div class="report-card ${statusClass}" style="margin-bottom: 16px; padding: 16px; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #eaeaea; transition: transform 0.2s;">
    <div style="display: flex; gap: 16px; margin-bottom: 12px;">
        <img src="${photoSrc}" style="width: 85px; height: 85px; object-fit: cover; border-radius: 10px; border: 1px solid #f0f0f0;">
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <h4 style="margin: 0; font-size: 16px; color: #222;">${escapeHtml(report.animal)}</h4>
            </div>
            <span style="display: inline-block; width: max-content; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; color: ${statusColor}; background: ${statusBg}; margin-bottom: 8px;">${statusIcon} ${statusDisplay}</span>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #555; display: flex; align-items: flex-start; gap: 6px;"><i class="fas fa-map-marker-alt" style="color: #e63946; margin-top: 3px;"></i> <span style="line-height: 1.3;">${escapeHtml(report.location)}</span></p>
            <p style="margin: 0; font-size: 12px; color: #888;"><i class="fas fa-clock"></i> ${report.date}</p>
        </div>
    </div>
    
    ${report.description ? `
      <div style="font-size: 13px; color: #444; background: #f8f9fa; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; font-style: italic; border-left: 3px solid #ccc; line-height: 1.5;">
        "${escapeHtml(report.description)}"
      </div>` : ""}
      
    <div style="display: flex; gap: 10px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
      <button class="report-action-btn locate-btn" data-lat="${report.lat}" data-lng="${report.lng}" style="flex: 1; padding: 10px; background: #e0f2fe; color: #0284c7; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fas fa-location-dot"></i> Định vị</button>
      <button class="report-action-btn delete-btn" data-id="${report.id}" style="padding: 10px 16px; background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-trash"></i></button>
    </div>
  </div>`;
}

function renderReportsPanel() {
  const container = document.getElementById("reportsPanel");
  if (!container) return;
  const filtered = filterReports();
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-camera" style="font-size:48px; color:#ccc;"></i><h3>Chưa có báo cáo</h3><p>Nhấn "Report Now" để báo cáo động vật cần cứu!</p></div>`;
    return;
  }
  container.innerHTML = `<div class="helpers-header" style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;"><i class="fas fa-list-ul"></i> Danh sách báo cáo (${filtered.length})</div>`;
  filtered.forEach((r) => (container.innerHTML += createReportCardHTML(r)));
  
  document.querySelectorAll(".locate-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      window.setActiveTab("map");
      setTimeout(() => { 
        if (viewer) viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lng, lat, 2000), duration: 2 }); 
      }, 200);
    };
  });
  
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      if(confirm("Bạn có chắc muốn xóa báo cáo này?")) {
        reports = reports.filter((r) => r.id !== id);
        renderReportsPanel(); renderNearbyHelpers(); renderNearestClinic();
        if (viewer) updateMapMarkers();
        showToast("Đã xóa báo cáo!", "success");
      }
    };
  });
}

// ================= CESIUM MAP CẬP NHẬT LỖI HIỂN THỊ =================

function initRealMap() {
  const mapContainer = document.getElementById("interactiveMap");
  if (!mapContainer) return;

  if (!document.getElementById("cesiumFixStyles")) {
    const style = document.createElement("style");
    style.id = "cesiumFixStyles";
    style.textContent = `
      #interactiveMap {
        width: 100%;
        height: 100%;
        min-height: 400px;
        flex-grow: 1;
        position: relative;
        display: block;
        overflow: hidden !important;
      }
      #interactiveMap .cesium-viewer,
      #interactiveMap .cesium-viewer-cesiumWidgetContainer,
      #interactiveMap .cesium-widget,
      #interactiveMap canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
        position: absolute !important; 
        top: 0;
        left: 0;
      }
    `;
    document.head.appendChild(style);
  }

  if (viewer) { viewer.destroy(); viewer = null; }
  
  viewer = new Cesium.Viewer('interactiveMap', {
    terrain: Cesium.Terrain.fromWorldTerrain(), 
    animation: false, timeline: false, infoBox: false, selectionIndicator: false,
    baseLayerPicker: false, geocoder: false, homeButton: false, navigationHelpButton: false, sceneModePicker: false,
    fullscreenButton: true, 
    fullscreenElement: 'interactiveMap' 
  });
  
  if (viewer.cesiumWidget.creditContainer) {
    viewer.cesiumWidget.creditContainer.style.display = "none";
  }

  viewer.scene.camera.frustum.far = 100000000;

  viewer.camera.flyTo({ 
    destination: Cesium.Cartesian3.fromDegrees(108.2171, 16.0545, 10000), 
    duration: 2 
  });

  let resizeTimeout;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (viewer && viewer.resize) {
        try {
          viewer.resize();
        } catch (e) {
          console.log("Cesium resize ignored");
        }
      }
    }, 100); 
  });
  resizeObserver.observe(mapContainer);

  setupCustomPopup();
  updateMapMarkers();
}

function setupCustomPopup() {
  const container = document.getElementById("interactiveMap");
  if (!container) return;
  container.style.position = 'relative'; 
  if (popupDiv) popupDiv.remove();

  popupDiv = document.createElement('div');
  popupDiv.style.position = 'absolute';
  popupDiv.style.top ='20px' ;  
  popupDiv.style.right ='20px' ;  
  popupDiv.style.backgroundColor = 'transparent'; 
  popupDiv.style.padding = '0px';
  popupDiv.style.display = 'none';
  popupDiv.style.zIndex = '1000';
  popupDiv.style.pointerEvents = 'auto'; 
  container.appendChild(popupDiv);

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction(function (movement) {
    const pickedObject = viewer.scene.pick(movement.position);
    
    if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties && pickedObject.id.properties.customHTML) {
      activeEntity = pickedObject.id;
      
      const htmlContent = typeof activeEntity.properties.customHTML.getValue === 'function' 
        ? activeEntity.properties.customHTML.getValue() 
        : activeEntity.properties.customHTML;
      popupDiv.innerHTML = htmlContent;
      popupDiv.style.display = 'block';

      const closeBtn = popupDiv.querySelector('.close-btn');
      if(closeBtn) {
        closeBtn.onclick = () => { popupDiv.style.display = 'none'; activeEntity = null; };
      }
    } else {
      activeEntity = null;
      popupDiv.style.display = 'none';
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function updateMapMarkers() {
  if (!viewer) return;
  viewer.entities.removeAll();
  if (popupDiv) popupDiv.style.display = 'none';
  
  const filteredReports = filterReports();
  if (filteredReports.length === 0) return;
  
  filteredReports.forEach(report => {
    let markerColor = Cesium.Color.fromCssColorString('#d62828'); 
    let statusText = '🚨 KHẨN CẤP';
    let statusColor = '#ff4d4d';
    let badgeBg = 'rgba(214, 40, 40, 0.2)';

    if (report.status === 'rescued') {
      markerColor = Cesium.Color.fromCssColorString('#2a9d8f');
      statusText = '✅ ĐÃ CỨU';
      statusColor = '#2a9d8f';
      badgeBg = 'rgba(42, 157, 143, 0.2)';
    } else if (report.status === 'progress') {
      markerColor = Cesium.Color.fromCssColorString('#3b82f6');
      statusText = '⏳ ĐANG XỬ LÝ';
      statusColor = '#66a3ff';
      badgeBg = 'rgba(59, 130, 246, 0.2)';
    }
    
    const bgImage = report.photo ? report.photo : 'https://via.placeholder.com/400x200?text=No+Image';
    
    const onlyHelpers = helpersData.filter(h => !h.isClinic);
    const helpersWithDist = onlyHelpers.map(h => {
      return { ...h, distance: calculateDistance(h.lat, h.lng, report.lat, report.lng) };
    }).filter(h => h.distance <= 5).sort((a, b) => a.distance - b.distance).slice(0, 2);
    
    let helpersHtml = '';
    if (helpersWithDist.length > 0) {
      helpersHtml = helpersWithDist.map(h => `
        <div class="detail-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; width:100%;">
            <span style="color: #4ade80; font-weight: bold;"><i class="fas fa-user-md"></i> ${escapeHtml(h.name)}</span>
            <span style="color: #aaa; font-size: 11px;">Cách ${formatDistance(h.distance)}</span>
          </div>
          <div style="color: #ddd; font-size: 11px; margin-top: 2px;">${escapeHtml(h.role)} - 📞 ${h.phone}</div>
        </div>
      `).join('');
    } else {
      helpersHtml = `<div style="color: #aaa; font-size: 11px; text-align: center;">Không có người hỗ trợ trong bán kính 5km</div>`;
    }

    const clinics = helpersData.filter(h => h.isClinic);
    const clinicsWithDist = clinics.map(c => {
      return { ...c, distance: calculateDistance(c.lat, c.lng, report.lat, report.lng) };
    }).sort((a, b) => a.distance - b.distance);
    
    let clinicHtml = '';
    if (clinicsWithDist.length > 0) {
      const c = clinicsWithDist[0];
      clinicHtml = `
        <div class="detail-item" style="flex-direction: column; align-items: flex-start;">
          <div style="display:flex; justify-content:space-between; width:100%;">
            <span style="color: #60a5fa; font-weight: bold;"><i class="fas fa-clinic-medical"></i> ${escapeHtml(c.name)}</span>
            <span style="color: #aaa; font-size: 11px;">Cách ${formatDistance(c.distance)}</span>
          </div>
          <div style="color: #ddd; font-size: 11px; margin-top: 2px;">📞 ${c.phone} | ${c.available}</div>
        </div>
      `;
    } else {
      clinicHtml = `<div style="color: #aaa; font-size: 11px; text-align: center;">Không tìm thấy phòng khám</div>`;
    }

    const popupContent = `
      <div class="rescue-popup">
        <button class="close-btn"><i class="fas fa-times"></i></button>
        <div class="rescue-header" style="background-image: url('${bgImage}')">
          <span class="rescue-badge" style="color: ${statusColor}; border-color: ${statusColor}; background-color: ${badgeBg};">
            ${statusText}
          </span>
          <div class="rescue-title-container">
            <h2 class="rescue-title"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</h2>
          </div>
        </div>

        <div class="rescue-details">
          <div class="detail-section">
            <div class="detail-title"><i class="fas fa-map-marker-alt"></i> THÔNG TIN ĐỊA ĐIỂM</div>
            <div class="detail-box">
              <div class="detail-item">
                <div class="detail-item-title">Vị trí</div>
                <div class="detail-item-value">${escapeHtml(report.location)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-item-title">Thời gian</div>
                <div class="detail-item-value">${report.date}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-title"><i class="fas fa-info-circle"></i> MÔ TẢ TÌNH TRẠNG</div>
            <div class="detail-box" style="font-style: italic; font-size: 13px; color: #ddd;">
              ${escapeHtml(report.description || "Chưa có mô tả chi tiết.")}
            </div>
          </div>
          
          <div class="detail-section">
            <div class="detail-title"><i class="fas fa-hospital"></i> PHÒNG KHÁM GẦN NHẤT</div>
            <div class="detail-box">
              ${clinicHtml}
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-title"><i class="fas fa-hands-helping"></i> NGƯỜI HỖ TRỢ GẦN ĐÂY</div>
            <div class="detail-box">
              ${helpersHtml}
            </div>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 12px 0;">
          
          <div style="display: flex; gap: 8px; justify-content: space-between;">
            <button onclick="alert('Đang gọi liên hệ hỗ trợ...')" style="flex: 1; background: #256f5b; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold;">
              <i class="fas fa-phone"></i> Liên hệ
            </button>
          </div>
        </div>
      </div>
    `;
    
    viewer.entities.add({
      id: `report_${report.id}`,
      position: Cesium.Cartesian3.fromDegrees(report.lng, report.lat),
      point: { pixelSize: 18, color: markerColor, outlineColor: Cesium.Color.WHITE, outlineWidth: 3, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      properties: { customHTML: popupContent }
    });
  });
}

// ================= MÁY ẢNH & ĐỊA ĐIỂM =================

async function initCamera() {
  video = document.getElementById("video");
  if (!video) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    await video.play();
    return true;
  } catch (err) {
    showToast(`❌ Không thể truy cập camera`, "error");
    return false;
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach((track) => track.stop()); stream = null; }
  if (video) video.srcObject = null;
}

function capturePhoto() {
  if (!video) return;
  canvas = document.createElement("canvas");
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL("image/jpeg", 0.8);
  document.getElementById("previewImg").src = capturedPhoto;
  document.getElementById("previewSection").style.display = "block";
  document.getElementById("captureBtn").style.display = "none";
  document.getElementById("retakeBtn").style.display = "flex";
  stopCamera(); video.style.display = "none";
}

function retakePhoto() {
  capturedPhoto = null;
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("captureBtn").style.display = "flex";
  document.getElementById("retakeBtn").style.display = "none";
  video.style.display = "block";
  initCamera();
}

async function fetchLocationAndAddress() {
  const locationLoading = document.getElementById("locationLoading");
  const locationInfo = document.getElementById("locationInfo");
  const addressText = document.getElementById("addressText");
  locationLoading.style.display = "block";
  locationInfo.style.display = "none";
  
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
    });
    currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&zoom=18`);
    const data = await res.json();
    currentAddress = data.display_name ? data.display_name : `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
    
    addressText.innerHTML = escapeHtml(currentAddress);
    locationLoading.style.display = "none";
    locationInfo.style.display = "flex";
  } catch (e) {
    locationLoading.style.display = "none";
    showToast("Không lấy được vị trí GPS", "error");
  }
}

async function submitReport() {
  const animalName = document.getElementById("animalName").value.trim();
  const animalStatus = document.getElementById("animalStatus").value;
  const animalDesc = document.getElementById("animalDesc").value.trim();
  
  if (!animalName) return showToast("Nhập tên động vật!", "error");
  if (!capturedPhoto) return showToast("Chụp ảnh động vật!", "error");
  if (!currentLocation) return showToast("Đang chờ vị trí GPS...", "error");
  
  reports.push({
    id: nextId++, animal: animalName, location: currentAddress, status: animalStatus,
    lat: currentLocation.lat, lng: currentLocation.lng, date: new Date().toLocaleString("vi-VN"),
    description: animalDesc, photo: capturedPhoto
  });
  
  closeCameraModal();
  renderReportsPanel();
  renderNearbyHelpers();
  renderNearestClinic();
  
  if (viewer) {
    updateMapMarkers();
    window.setActiveTab("map");
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(currentLocation.lng, currentLocation.lat, 1500), duration: 2 });
  }
  showToast("✅ Gửi báo cáo thành công!", "success");
}

window.openCameraModal = async function(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById("cameraModal");
  if (!modal) return;
  modal.style.display = "block";
  
  document.getElementById("animalName").value = "";
  document.getElementById("animalDesc").value = "";
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("captureBtn").style.display = "flex";
  document.getElementById("retakeBtn").style.display = "none";
  document.getElementById("locationInfo").style.display = "none";
  capturedPhoto = null; currentLocation = null; currentAddress = "";
  
  video = document.getElementById("video"); video.style.display = "block";
  document.getElementById("captureBtn").innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';
  
  await initCamera();
  await fetchLocationAndAddress();
}

window.closeCameraModal = function() {
  document.getElementById("cameraModal").style.display = "none";
  stopCamera();
}

function getSampleImage(animalType) {
  const canvas = document.createElement("canvas"); canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f0f0f0"; ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = "#ff6b35"; ctx.font = 'bold 60px "Segoe UI Emoji"'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let emoji = "🐾";
  if (animalType.includes("Chó")) emoji = "🐕"; 
  else if (animalType.includes("Mèo")) emoji = "🐈";
  else if (animalType.includes("Chim")) emoji = "🐦";
  else if (animalType.includes("Khỉ")) emoji = "🐒";
  ctx.fillText(emoji, 100, 80); ctx.font = 'bold 14px "Segoe UI"'; ctx.fillStyle = "#333"; ctx.fillText(animalType, 100, 150);
  return canvas.toDataURL("image/jpeg", 0.8);
}

if (reports.length === 0) {
  const daNangLat = 16.0545, daNangLng = 108.2171;
  function offsetCoordinate(base, maxOffset = 0.002) { return base + (Math.random() - 0.5) * maxOffset; }
  
  const sampleReports = [
    { animal: "Chó hoang bị thương", location: "Hẻm 491 Trưng Nữ Vương, Đà Nẵng", status: "emergency", lat: offsetCoordinate(daNangLat, 0.0015), lng: offsetCoordinate(daNangLng, 0.0015), description: "Chó bị gãy chân trước, cần y tế gấp" },
    { animal: "Mèo mắc kẹt trên mái nhà", location: "Kiệt 483 Trưng Nữ Vương, Đà Nẵng", status: "progress", lat: offsetCoordinate(daNangLat, 0.002), lng: offsetCoordinate(daNangLng, -0.0018), description: "Mèo kêu thảm thiết từ đêm qua, mái nhà quá cao" },
    { animal: "Chim bồ câu gãy cánh", location: "Công viên APEC, Đà Nẵng", status: "rescued", lat: offsetCoordinate(daNangLat, -0.001), lng: offsetCoordinate(daNangLng, 0.002), description: "Đã được đưa về trạm sơ cứu động vật an toàn" },
    { animal: "Khỉ đi lạc vào khu dân cư", location: "Bán đảo Sơn Trà, Đà Nẵng", status: "progress", lat: offsetCoordinate(daNangLat, 0.005), lng: offsetCoordinate(daNangLng, 0.003), description: "Đang tìm cách lùa khỉ về rừng, người dân không nên đến gần" }
  ];
  sampleReports.forEach((report) => {
    report.photo = getSampleImage(report.animal); report.date = new Date().toLocaleString("vi-VN");
    reports.push({ id: nextId++, ...report });
  });
}

window.setActiveTab = function (tabId) {
  activeTab = tabId;
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
  
  renderReportsPanel();
  
  if (!viewer) {
    initRealMap(); 
  } else {
    updateMapMarkers();
    setTimeout(() => { if(viewer && viewer.resize) viewer.resize(); }, 50);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  addToastAnimations();
  addPanelStyles(); 
  setTimeout(() => { if (typeof Cesium !== "undefined") initRealMap(); }, 500);
  
  renderReportsPanel();
  renderNearbyHelpers();
  renderNearestClinic();
  
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab)));
  
  document.getElementById("searchBtn")?.addEventListener("click", () => { searchKeyword = document.getElementById("searchInput").value; window.setActiveTab("map"); renderReportsPanel(); });
  document.getElementById("searchInput")?.addEventListener("keyup", (e) => { if (e.key === "Enter") { searchKeyword = e.target.value; window.setActiveTab("map"); renderReportsPanel(); }});
  
  document.getElementById("captureBtn")?.addEventListener("click", capturePhoto);
  document.getElementById("retakeBtn")?.addEventListener("click", retakePhoto);
  document.getElementById("submitReportBtn")?.addEventListener("click", submitReport);
  
  window.addEventListener("click", (e) => { if (e.target.classList?.contains("modal")) closeCameraModal(); });
  
  window.setActiveTab("all"); 
});