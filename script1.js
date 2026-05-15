// ==================== WILDLIFE RESCUE MAP - COMPLETE SCRIPT ====================

// Mảng lưu trữ các báo cáo
let reports = [];
let nextId = 1;

// Dữ liệu người hỗ trợ (có tọa độ)
const helpersData = [
  { name: " Danh Thái", role: "Bác sĩ Thú y", verified: true, phone: "0912 345 678", lat: 16.0580, lng: 108.2200, address: "Số 12 Trần Phú, Đà Nẵng" },
  { name: "Thu Trần", role: "Cứu hộ động vật hoang dã", verified: true, phone: "0988 765 432", lat: 16.0620, lng: 108.2150, address: "Số 45 Bạch Đằng, Đà Nẵng" },
  { name: "Hải Lê", role: "Vận chuyển động vật", verified: false, phone: "0933 221 144", lat: 16.0450, lng: 108.2100, address: "Số 78 Hùng Vương, Đà Nẵng" },
  { name: "Minh Tuấn", role: "Tình nguyện viên", verified: true, phone: "0909 888 777", lat: 16.0550, lng: 108.2180, address: "Số 234 Trưng Nữ Vương, Đà Nẵng" },
  { 
    name: "Thanh Hưng  ", 
    role: "Bác sĩ thú y chuyên nghiệp", 
    verified: true, 
    phone: "0903 456 789", 
    lat: 10.8231, 
    lng: 106.6297, 
    address: "Số 123 Nguyễn Đình Chiểu, Quận 3, TP.HCM",
    city: "TP.Hồ Chí Minh",
    available: "24/7",
    specialty: "Cấp cứu khẩn cấp"
  },
   { 
    name: "Bác sĩ Huyền Trang", 
    role: "Bác sĩ thú y", 
    verified: true, 
    phone: "0983 456 123", 
    lat: 21.0285, 
    lng: 105.8542, 
    address: "Số 67 Láng Hạ, Đống Đa, Hà Nội",
    city: "Hà Nội",
    available: "24/7",
    specialty: "Cấp cứu thú cưng"
  },
  { 
    name: "Thái Bảo ", 
    role: "Bác sĩ thú y", 
    verified: true, 
    phone: "0943 210 987", 
    lat: 16.4637, 
    lng: 107.5909, 
    address: "Số 56 Lê Lợi, Huế",
    city: "Huế",
    available: "8h-20h",
    specialty: "Động vật cung đình"
  },
];

// Biến lưu vùng tròn đang hiển thị
let activeCircle = null;

// Biến toàn cục
let activeTab = "all";
let searchKeyword = "";
let map = null;
let markersLayer = null;

// Biến camera
let video = null;
let canvas = null;
let stream = null;
let capturedPhoto = null;

// Biến vị trí
let currentLocation = null;
let currentAddress = "";


function isSecureContext() {
    if (window.isSecureContext === false) {
        alert("⚠️ Cần chạy qua HTTPS để sử dụng camera!\n\nVui lòng dùng: https://your-domain.com");
        return false;
    }
    return true;
}

// Hàm thoát HTML
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Hàm tính khoảng cách Haversine (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Format khoảng cách
function formatDistance(distance) {
  if (distance === null) return "?";
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}

// Tìm người hỗ trợ gần nhất
function findNearestHelper(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;
  
  helpersData.forEach(helper => {
    const dist = calculateDistance(lat, lng, helper.lat, helper.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { ...helper, distance: dist };
    }
  });
  
  return nearest;
}

// Xóa vùng tròn đang hiển thị
function clearRadiusCircle() {
  if (activeCircle && map) {
    map.removeLayer(activeCircle);
    activeCircle = null;
  }
}

// Thêm vùng tròn bán kính 500m
function showRadiusCircle(lat, lng) {
  clearRadiusCircle();
  
  activeCircle = L.circle([lat, lng], {
    color: '#ff6b35',
    fillColor: '#ff6b35',
    fillOpacity: 0.15,
    radius: 500,
    weight: 2,
    opacity: 0.6,
    className: 'radius-circle'
  }).addTo(map);
  
  // Tự động xóa sau 5 giây
  setTimeout(() => {
    if (activeCircle && map) {
      map.removeLayer(activeCircle);
      activeCircle = null;
    }
  }, 5000);
}

// Lọc báo cáo
function filterReports() {
  let filtered = [...reports];
  
  if (activeTab !== "all" && activeTab !== "map" && activeTab !== "list") {
    filtered = filtered.filter(r => r.status === activeTab);
  }
  if (searchKeyword && searchKeyword.trim() !== "") {
    const kw = searchKeyword.toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.animal.toLowerCase().includes(kw) || 
      r.location.toLowerCase().includes(kw)
    );
  }
  return filtered;
} 
// Khởi tạo bản đồ
function initRealMap() {
  const mapContainer = document.getElementById("interactiveMap");
  if (!mapContainer) return;
  
  if (typeof L === 'undefined') {
    console.error("Leaflet chưa được tải!");
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Lỗi: Không thể tải bản đồ. Vui lòng kiểm tra kết nối mạng.</div>';
    return;
  }
  
  if (map) map.remove();
  
  map = L.map('interactiveMap').setView([16.0545, 108.2171], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  markersLayer = L.layerGroup().addTo(map);
  updateMapMarkers();
}

// Cập nhật marker
function updateMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  
  const filteredReports = filterReports();
  
  if (filteredReports.length === 0) {
    L.popup()
      .setLatLng([16.0545, 108.2171])
      .setContent(`
        <div style="text-align: center; padding: 10px;">
          <i class="fas fa-camera" style="font-size: 24px; color: #ff6b35;"></i>
          <h4>Chưa có báo cáo nào!</h4>
          <p>Nhấn nút <strong>"Report Now"</strong><br>chụp ảnh động vật cần cứu hộ</p>
        </div>
      `)
      .openOn(map);
    return;
  }
  
  filteredReports.forEach(report => {
    let markerColor = '#d62828';
    let statusText = '🚨 KHẨN CẤP';
    
    if (report.status === 'rescued') {
      markerColor = '#2a9d8f';
      statusText = '✅ ĐÃ CỨU';
    } else if (report.status === 'progress') {
      markerColor = '#3b82f6';
      statusText = '⏳ ĐANG XỬ LÝ';
    }
    
    // Tìm người hỗ trợ gần nhất
    const nearestHelper = findNearestHelper(report.lat, report.lng);
    
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
    
    const marker = L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(markersLayer);

    let helperHtml = '';
    if (nearestHelper) {
      const distText = formatDistance(nearestHelper.distance);
      helperHtml = `
        <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; margin: 8px 0;">
          <div style="font-weight: bold; margin-bottom: 5px;">
            <i class="fas fa-user-md"></i> 🏥 Người hỗ trợ gần nhất:
          </div>
          <div style="font-size: 13px;">
            👨‍⚕️ <strong>${escapeHtml(nearestHelper.name)}</strong><br>
            📍 Cách đây <strong style="color: #2a9d8f;">${distText}</strong><br>
            📞 ${nearestHelper.phone}
          </div>
        </div>
      `;
    } else {
      helperHtml = `
        <div style="background: #fff3cd; padding: 8px; border-radius: 8px; margin: 8px 0; font-size: 12px;">
          ⚠️ Chưa có người hỗ trợ trong khu vực
        </div>
      `;
    }
    
    const popupContent = `
      <div style="min-width: 260px; font-family: 'Segoe UI', sans-serif; max-height: 400px; overflow-y: auto;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${markerColor};">
          🐾 ${escapeHtml(report.animal)}
        </div>
        <div style="font-size: 13px; margin-bottom: 5px;">
          <i class="fas fa-map-marker-alt"></i> <strong>Địa điểm:</strong> ${escapeHtml(report.location)}
        </div>
        <div style="font-size: 12px; margin-bottom: 5px;">
          <i class="fas fa-calendar-alt"></i> <strong>Ngày:</strong> ${report.date}
        </div>
        ${report.photo ? `<img src="${report.photo}" style="width: 100%; border-radius: 8px; margin: 8px 0; max-height: 150px; object-fit: cover;">` : ''}
        ${report.description ? `<div style="font-size: 12px; margin-bottom: 8px; color: #666;"><i class="fas fa-info-circle"></i> ${escapeHtml(report.description)}</div>` : ''}
        <div style="margin-bottom: 10px;">
          <span style="background: ${markerColor}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 11px;">${statusText}</span>
        </div>
        ${helperHtml}
        <hr>
        <div style="font-size: 11px; color: #888; text-align: center; margin-top: 5px;">
          <i class="fas fa-map-marked-alt"></i> Vùng tròn thể hiện bán kính 500m
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);

    marker.on('click', function() {
      showRadiusCircle(report.lat, report.lng);
    });
  });
  
  if (filteredReports.length === 1) {
    map.setView([filteredReports[0].lat, filteredReports[0].lng], 15);
  } else if (filteredReports.length > 1) {
    map.fitBounds(filteredReports.map(r => [r.lat, r.lng]));
  }
}

function createReportCardHTML(report) {
  let statusDisplay = "", statusIcon = "", statusClass = "";
  
  if (report.status === "emergency") {
    statusDisplay = "🚨 Khẩn cấp";
    statusIcon = "🔴";
    statusClass = "emergency";
  } else if (report.status === "progress") {
    statusDisplay = "⏳ Đang xử lý";
    statusIcon = "🟡";
    statusClass = "progress";
  } else {
    statusDisplay = "✅ Đã cứu";
    statusIcon = "🟢";
    statusClass = "rescued";
  }
  
  return `
    <div class="report-card ${statusClass}" data-report-id="${report.id}">
      <div class="card-header">
        <span class="animal-name"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</span>
        <span class="status-tag">${statusIcon} ${statusDisplay}</span>
      </div>
      <div class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(report.location)}</div>
      <div class="date"><i class="fas fa-calendar-alt"></i> ${report.date}</div>
      ${report.photo ? `<img src="${report.photo}" class="report-photo">` : ''}
      ${report.description ? `<div class="description">${escapeHtml(report.description)}</div>` : ''}
      <div class="action-buttons">
        <button class="small-btn locate-btn" data-lat="${report.lat}" data-lng="${report.lng}"><i class="fas fa-location-dot"></i> Định vị</button>
      </div>
    </div>
  `;
}

// Gắn sự kiện
function attachCardEvents() {
  document.querySelectorAll('.locate-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleLocateClick);
    btn.addEventListener('click', window.handleLocateClick);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.handleLocateClick(e);
    });
  });
}

window.handleLocateClick = function(e) {
  e.stopPropagation();
  const lat = parseFloat(this.dataset.lat);
  const lng = parseFloat(this.dataset.lng);
  window.setActiveTab('map');
  setTimeout(() => {
    if (map) {
      map.setView([lat, lng], 16);
      showRadiusCircle(lat, lng);
      setTimeout(() => {
        markersLayer.eachLayer(layer => {
          if (Math.abs(layer.getLatLng().lat - lat) < 0.0001) {
            layer.openPopup();
          }
        });
      }, 500);
    }
  }, 300);
};

// Hiển thị danh sách báo cáo
function renderReportsPanel() {
  const container = document.getElementById("reportsPanel");
  if (!container) return;
  
  const filtered = filterReports();
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <i class="fas fa-camera" style="font-size: 48px; color: #ccc;"></i>
        <h3>Chưa có báo cáo nào</h3>
        <p>Nhấn <strong>"Report Now"</strong> để chụp ảnh và báo cáo động vật cần cứu hộ!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `<div style="margin-bottom: 12px; font-weight: 600;">📋 Danh sách báo cáo (${filtered.length})</div>`;
  filtered.forEach(r => container.innerHTML += createReportCardHTML(r));
  attachCardEvents();
}


// Tính khoảng cách từ helper đến báo cáo gần nhất
function getNearestReportDistance(helperLat, helperLng, reportsList) {
  if (!reportsList || reportsList.length === 0) {
    return { distance: null, report: null };
  }
  
  let minDistance = Infinity; // biến này dùng để lưu khoảng cách ngắn nhất 
  let nearest= null; // biến để lưu thông tin con vật 
  
  reportsList.forEach(report => { // duyệt qua từng con 
    const distance = calculateDistance(helperLat, helperLng, report.lat, report.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = report;
    }
  });
  
  return { distance: minDistance, report: nearest};
}

// Hiển thị danh sách người hỗ trợ
function renderNearbyHelpers() {
  const helpersDiv = document.getElementById("helpersList");
  if (!helpersDiv) return;
  
  const currentReports = filterReports();
  const maxDistance = 5; // km
  
  const helpersWithDistance = helpersData.map(helper => {
    const { distance, report } = getNearestReportDistance(helper.lat, helper.lng, currentReports);
    return { ...helper, nearestDistance: distance, nearestReport: report };
  });
  
  const filteredHelpers = helpersWithDistance.filter(h => 
    h.nearestDistance === null || h.nearestDistance <= maxDistance
  );
  
  filteredHelpers.sort((a, b) => {
    if (a.nearestDistance === null) return 1;
    if (b.nearestDistance === null) return -1;
    return a.nearestDistance - b.nearestDistance;
  });
  
  if (filteredHelpers.length === 0) {
    helpersDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #999;">
        <i class="fas fa-user-md" style="font-size: 32px;"></i>
        <p>Không có người hỗ trợ nào trong bán kính ${maxDistance}km</p>
      </div>
    `;
    return;
  }
  
  helpersDiv.innerHTML = "";
  
  filteredHelpers.forEach(helper => {
    const card = document.createElement("div");
    card.className = "helper-card";
    
    let distanceHtml = "";
    let distanceColor = "#2a9d8f";
    let distanceText = "";
    
    if (helper.nearestDistance !== null && helper.nearestReport) {
      distanceText = formatDistance(helper.nearestDistance);
      if (helper.nearestDistance > 3) distanceColor = "#f4a261";
      if (helper.nearestDistance > 5) distanceColor = "#e76f51";
      
      distanceHtml = `
        <div style="margin-top: 8px; font-size: 12px; color: ${distanceColor};">
          <i class="fas fa-location-dot"></i> 
          <strong>${distanceText}</strong> đến <strong>"${escapeHtml(helper.nearestReport.animal)}"</strong>
          ${helper.nearestDistance <= 2 ? ' 🏃‍♂️ Rất gần' : ''}
          ${helper.nearestDistance <= 1 ? ' ⚡ Có thể đến ngay' : ''}
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          <i class="fas fa-paw"></i> Động vật: ${escapeHtml(helper.nearestReport.animal)}
        </div>
      `;
    } else {
      distanceHtml = `
        <div style="margin-top: 8px; font-size: 12px; color: #999;">
          <i class="fas fa-info-circle"></i> Chưa có báo cáo nào
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="helper-info">
        <h4><i class="fas fa-user-md"></i> ${escapeHtml(helper.name)}</h4>
        <p>${escapeHtml(helper.role)} ${helper.verified ? '<span style="color:#2a9d8f;"> ✓ Đã xác thực</span>' : ' ⚠️ Chưa xác thực'}</p>
        ${distanceHtml}
        <div style="font-size: 11px; color: #888; margin-top: 4px;">
          <i class="fas fa-map-marker-alt"></i> ${escapeHtml(helper.address)}
        </div>
      </div>
      <button class="contact-btn" data-phone="${helper.phone}" data-name="${escapeHtml(helper.name)}" data-distance="${helper.nearestDistance !== null ? helper.nearestDistance.toFixed(1) : '?'}">
        <i class="fas fa-phone"></i> Liên hệ
      </button>
    `;
    helpersDiv.appendChild(card);
  });
  
  document.querySelectorAll('.contact-btn').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.name;
      const phone = btn.dataset.phone;
      const distance = btn.dataset.distance;
      if (confirm(`📞 Gọi cho ${name} (cách ${distance}km) qua số ${phone}?`)) {
        window.location.href = `tel:${phone}`;
      }
    };
  });
  
  const removedCount = helpersWithDistance.length - filteredHelpers.length;
  if (removedCount > 0) {
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText = "background: #fff3cd; padding: 8px; border-radius: 8px; margin-top: 10px; font-size: 12px; color: #856404; text-align: center;";
    infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> Đã ẩn ${removedCount} người hỗ trợ ở xa hơn ${maxDistance}km`;
    helpersDiv.appendChild(infoDiv);
  }
}
const daNangLat = 16.0545;
const daNangLng = 108.2171;
const HCMLat = 10.8231 ; 
const HCMLng = 106.6297 ; 
const HanoiLat = 21.0285 ; 
const HanoiLng = 105.8542 ; 

function offsetCoordinate(base, maxOffset = 0.002) {
  return base + (Math.random() - 0.5) * maxOffset;
}

function getSampleImage(animalType) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 200, 200);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 190, 190);
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 60px "Segoe UI Emoji"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let emoji = '🐾';
  if (animalType.includes('Chó')) emoji = '🐕';
  else if (animalType.includes('Mèo')) emoji = '🐈';
  else if (animalType.includes('Chim')) emoji = '🐦';
  else if (animalType.includes('Nhím')) emoji = '🦔';
  else if (animalType.includes('Thỏ')) emoji = '🐇';
  else emoji = '🐾';
  
  ctx.fillText(emoji, 100, 80);
  ctx.font = 'bold 14px "Segoe UI"';
  ctx.fillStyle = '#333';
  ctx.fillText(animalType, 100, 150);
  ctx.font = '12px "Segoe UI"';
  ctx.fillStyle = '#999';
  ctx.fillText('Đang cần cứu hộ', 100, 180);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

const sampleReports = [
  { animal: "Chó hoang bị thương", location: "Hẻm 491 Trưng Nữ Vương, Đà Nẵng", status: "emergency", lat: offsetCoordinate(daNangLat, 0.0015), lng: offsetCoordinate(daNangLng, 0.0015), description: "Chó bị gãy chân trước,  cần hỗ trợ khẩn cấp" },
  { animal: "Mèo mắc kẹt trên mái nhà", location: "Kiệt 483 Trưng Nữ Vương, Đà Nẵng", status: "progress", lat: offsetCoordinate(daNangLat, 0.002), lng: offsetCoordinate(daNangLng, -0.0018), description: "Mèo kêu thảm thiết vì bị bỏ đói, không thể tự xuống" },
  { animal: "Chim bồ câu gãy cánh", location: "Công viên 29/3, gần 491 Trưng Nữ Vương", status: "rescued", lat: offsetCoordinate(daNangLat, -0.0012), lng: offsetCoordinate(daNangLng, 0.0022), description: "Đã được đội cứu hộ đưa về chăm sóc" },
  { animal: "Nhím cảnh bị bỏ rơi", location: "Đường Nguyễn Văn Linh, gần 491 Trưng Nữ Vương", status: "emergency", lat: offsetCoordinate(daNangLat, 0.0025), lng: offsetCoordinate(daNangLng, 0.001), description: "Nhím trong thùng carton, rất yếu, không ăn uống" },
  { animal: "Thỏ bị lạc", location: "Chung cư 491 Trưng Nữ Vương", status: "rescued", lat: offsetCoordinate(daNangLat, 0.0008), lng: offsetCoordinate(daNangLng, -0.0005), description: "Đã tìm thấy chủ nhân, thỏ khỏe mạnh" },
  { animal: "Rùa cảnh bỏ trốn", location: "Vỉa hè 491 Trưng Nữ Vương", status: "progress", lat: offsetCoordinate(daNangLat, -0.001), lng: offsetCoordinate(daNangLng, 0.0012), description: "Rùa đang bò trên vỉa hè, nguy cơ bị xe cán" },
  { animal: "khỉ bị thương", location :"Khu du lịch suối tiên , Thủ đức , HCM ",status :"progress" ,lat :offsetCoordinate(HCMLat,0.0015) , lng :offsetCoordinate(HCMLng , 0.0018) , description : "đã cần người cứu giúp kịp thời "} , 
  { animal :"rùa bị bắt cóc" , location :"gần trường bách khoa hà nội" , status :"emmergency" ,lat : offsetCoordinate(HanoiLat,0.0013),  lng : offsetCoordinate(HanoiLng , -0.017) ,description :"đang cần người cứu trợ gấp" } 
];

sampleReports.forEach(report => {
  report.photo = getSampleImage(report.animal);
  report.date = new Date().toLocaleString('vi-VN');
});

if (reports.length === 0) {
  sampleReports.forEach((report) => {
    reports.push({ id: nextId++, ...report });
  });
  console.log(`✅ Đã thêm ${sampleReports.length} báo cáo mẫu xung quanh 491 Trưng Nữ Vương, Đà Nẵng`);
}


function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Trình duyệt không hỗ trợ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data.display_name) {
      let address = data.display_name;
      const parts = address.split(',');
      if (parts.length > 3) address = parts.slice(0, 4).join(',');
      return address.substring(0, 200);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("Lỗi lấy địa chỉ:", error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function initCamera() {
  video = document.getElementById('video');
  if (!video) return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("❌ Trình duyệt không hỗ trợ camera");
    return false;
  }
  try {
    const constraints = { video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } };
    try { stream = await navigator.mediaDevices.getUserMedia(constraints); } 
    catch (err) { stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } }); }
    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    await video.play();
    return true;
  } catch (err) {
    alert(`❌ Không thể truy cập camera: ${err.message}`);
    return false;
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
  if (video) video.srcObject = null;
}

function capturePhoto() {
  if (!video || !video.videoWidth) { alert("Camera chưa sẵn sàng!"); return; }
  canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
  document.getElementById('previewImg').src = capturedPhoto;
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('retakeBtn').style.display = 'flex';
  stopCamera();
  video.style.display = 'none';
}

function retakePhoto() {
  capturedPhoto = null;
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('captureBtn').style.display = 'flex';
  document.getElementById('retakeBtn').style.display = 'none';
  video.style.display = 'block';
  initCamera();
}

async function fetchLocationAndAddress() {
  const locationLoading = document.getElementById('locationLoading');
  const locationInfo = document.getElementById('locationInfo');
  const addressText = document.getElementById('addressText');
  locationLoading.style.display = 'block';
  locationInfo.style.display = 'none';
  try {
    const position = await getCurrentLocation();
    currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    currentAddress = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
    addressText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${escapeHtml(currentAddress)}`;
    locationLoading.style.display = 'none';
    locationInfo.style.display = 'flex';
    return true;
  } catch (error) {
    locationLoading.style.display = 'none';
    alert("Không thể lấy vị trí. Vui lòng bật GPS.");
    return false;
  }
}

async function submitReport() {
  const animalName = document.getElementById('animalName').value.trim();
  const animalStatus = document.getElementById('animalStatus').value;
  const animalDesc = document.getElementById('animalDesc').value.trim();
  if (!animalName) { alert("Vui lòng nhập tên/loài động vật!"); return; }
  if (!capturedPhoto) { alert("Vui lòng chụp ảnh động vật!"); return; }
  if (!currentLocation) { alert("Vui lòng chờ lấy vị trí GPS..."); return; }
  
  const newReport = {
    id: nextId++,
    animal: animalName,
    location: currentAddress,
    status: animalStatus,
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    date: new Date().toLocaleString('vi-VN'),
    description: animalDesc,
    photo: capturedPhoto
  };
  reports.push(newReport);
  closeCameraModal();
  renderReportsPanel();
  renderNearbyHelpers();
  if (map) { updateMapMarkers(); window.setActiveTab('map'); setTimeout(() => { map.setView([currentLocation.lat, currentLocation.lng], 16); showRadiusCircle(currentLocation.lat, currentLocation.lng); }, 500); }
  alert(`✅ Đã gửi báo cáo thành công!`);
}

async function openCameraModal(e) {
  if (e) e.preventDefault();
  if (!isSecureContext()) return;
  const modal = document.getElementById('cameraModal');
  if (!modal) return;
  modal.style.display = 'block';
  document.getElementById('animalName').value = '';
  document.getElementById('animalDesc').value = '';
  document.getElementById('animalStatus').value = 'emergency';
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('captureBtn').style.display = 'flex';
  document.getElementById('retakeBtn').style.display = 'none';
  document.getElementById('locationInfo').style.display = 'none';
  capturedPhoto = null;
  currentLocation = null;
  video = document.getElementById('video');
  video.style.display = 'block';
  const captureBtn = document.getElementById('captureBtn');
  captureBtn.disabled = true;
  captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang khởi tạo...';
  const cameraOk = await initCamera();
  if (cameraOk) {
    captureBtn.disabled = false;
    captureBtn.innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';
    await fetchLocationAndAddress();
  } else {
    captureBtn.disabled = false;
    captureBtn.innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';
  }
}

function closeCameraModal() {
  const modal = document.getElementById('cameraModal');
  if (modal) modal.style.display = 'none';
  stopCamera();
}

// ==================== ĐIỀU KHIỂN TAB & TÌM KIẾM ====================

window.setActiveTab = function(tabId) {
  activeTab = tabId;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  if (tabId === "map") {
    renderReportsPanel();
    if (!map) initRealMap();
    else { map.invalidateSize(); updateMapMarkers(); }
  } else {
    renderReportsPanel();
    if (map) updateMapMarkers();
  }
  renderNearbyHelpers();
};

function handleSearch() {
  searchKeyword = document.getElementById("searchInput")?.value || "";
  renderReportsPanel();
  renderNearbyHelpers();
  if (map) updateMapMarkers();
}

// ==================== KHỞI TẠO ====================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Ứng dụng cứu hộ động vật đã khởi động!");
  
  setTimeout(() => {
    if (typeof L !== 'undefined') initRealMap();
    else console.error("Leaflet chưa được tải");
  }, 500);
  
  renderReportsPanel();
  renderNearbyHelpers();
  
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab));
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); window.setActiveTab(btn.dataset.tab); });
  });
  
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
  
  window.addEventListener("click", (e) => { if (e.target.classList?.contains("modal")) closeCameraModal(); });
  
  window.setActiveTab("map");
  
  if (!window.isSecureContext) console.warn("⚠️ Đang chạy trong môi trường HTTP. Camera có thể không hoạt động!");
});