// Mảng lưu trữ các báo cáo
let reports = [];
let nextId = 1;

// Dữ liệu hỗ trợ
const helpers = [
  { name: "Bác sĩ Minh Nguyễn", role: "Bác sĩ thú y", verified: true, phone: "0912 345 678" },
  { name: "Thu Trần", role: "Cứu hộ động vật hoang dã", verified: true, phone: "0988 765 432" },
  { name: "Hải Lê", role: "Vận chuyển động vật", verified: false, phone: "0933 221 144" },
  { name: "Lan Nguyễn", role: "Tình nguyện viên", verified: true, phone: "0909 888 777" }
];

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

// Kiểm tra môi trường an toàn cho camera
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
  
  // Kiểm tra Leaflet đã được tải
  if (typeof L === 'undefined') {
    console.error("Leaflet chưa được tải!");
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Lỗi: Không thể tải bản đồ. Vui lòng kiểm tra kết nối mạng.</div>';
    return;
  }
  
  if (map) map.remove();
  
  map = L.map('interactiveMap').setView([21.0285, 105.8542], 6);
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
      .setLatLng([21.0285, 105.8542])
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
    
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
    
    const marker = L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(markersLayer);
    
    const popupContent = `
      <div style="min-width: 240px; font-family: 'Segoe UI', sans-serif;">
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
        <hr>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="contact-popup-btn" data-animal="${escapeHtml(report.animal)}" style="background: #256f5b; color: white; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer;">📞 Liên hệ</button>
          <button class="update-popup-btn" data-id="${report.id}" style="background: #eef2ff; color: #1e5a4a; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer;">✏️ Cập nhật</button>
        </div>
      </div>
    `;
    marker.bindPopup(popupContent);
  });
  
  // Xử lý sự kiện cho popup buttons
  setTimeout(() => {
    document.querySelectorAll('.contact-popup-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        window.contactRescuer(btn.dataset.animal);
        map.closePopup();
      };
    });
    document.querySelectorAll('.update-popup-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        window.updateReportStatus(parseInt(btn.dataset.id));
        map.closePopup();
      };
    });
  }, 100);
  
  if (filteredReports.length === 1) {
    map.setView([filteredReports[0].lat, filteredReports[0].lng], 13);
  } else if (filteredReports.length > 1) {
    map.fitBounds(filteredReports.map(r => [r.lat, r.lng]));
  }
}

// Tạo thẻ báo cáo
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
        <button class="small-btn contact-card-btn" data-animal="${escapeHtml(report.animal)}"><i class="fas fa-phone-alt"></i> Liên hệ</button>
        <button class="small-btn update-card-btn" data-id="${report.id}"><i class="fas fa-clinic-medical"></i> Cập nhật</button>
        <button class="small-btn locate-btn" data-lat="${report.lat}" data-lng="${report.lng}"><i class="fas fa-location-dot"></i> Định vị</button>
      </div>
    </div>
  `;
}

// Gắn sự kiện
function attachCardEvents() {
  document.querySelectorAll('.contact-card-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleContactClick);
    btn.addEventListener('click', window.handleContactClick);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.handleContactClick(e);
    });
  });
  document.querySelectorAll('.update-card-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleUpdateClick);
    btn.addEventListener('click', window.handleUpdateClick);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.handleUpdateClick(e);
    });
  });
  document.querySelectorAll('.locate-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleLocateClick);
    btn.addEventListener('click', window.handleLocateClick);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.handleLocateClick(e);
    });
  });
}

window.handleContactClick = function(e) {
  e.stopPropagation();
  window.contactRescuer(this.dataset.animal);
};

window.handleUpdateClick = function(e) {
  e.stopPropagation();
  window.updateReportStatus(parseInt(this.dataset.id));
};

window.handleLocateClick = function(e) {
  e.stopPropagation();
  const lat = parseFloat(this.dataset.lat);
  const lng = parseFloat(this.dataset.lng);
  window.setActiveTab('map');
  setTimeout(() => {
    if (map) {
      map.setView([lat, lng], 14);
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

// Hiển thị người hỗ trợ
function renderNearbyHelpers() {
  const helpersDiv = document.getElementById("helpersList");
  if (!helpersDiv) return;
  helpersDiv.innerHTML = "";
  
  helpers.forEach(h => {
    const card = document.createElement("div");
    card.className = "helper-card";
    card.innerHTML = `
      <div class="helper-info">
        <h4><i class="fas fa-user-md"></i> ${escapeHtml(h.name)}</h4>
        <p>${escapeHtml(h.role)} ${h.verified ? '<span style="color:#2a9d8f;">✓ Đã xác thực</span>' : ''}</p>
      </div>
      <button class="contact-btn" data-phone="${h.phone}" data-name="${escapeHtml(h.name)}"><i class="fas fa-phone"></i> Liên hệ</button>
    `;
    helpersDiv.appendChild(card);
  });
  
  // Gắn sự kiện cho nút liên hệ
  document.querySelectorAll('.contact-btn').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.name;
      const phone = btn.dataset.phone;
      if (confirm(`📞 Gọi cho ${name} qua số ${phone}?`)) {
        window.location.href = `tel:${phone}`;
      }
    };
  });
}

window.setActiveTab = function(tabId) {
  activeTab = tabId;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  
  if (tabId === "map") {
    renderReportsPanel();
    if (!map) initRealMap();
    else { 
      map.invalidateSize(); 
      updateMapMarkers(); 
    }
  } else {
    renderReportsPanel();
    if (map) updateMapMarkers();
  }
};

function handleSearch() {
  searchKeyword = document.getElementById("searchInput")?.value || "";
  renderReportsPanel();
  if (map) updateMapMarkers();
}

window.contactRescuer = function(animalName) {
  if (confirm(`📞 Gọi đội cứu hộ cho ${animalName}?\nĐường dây nóng: 1900 1234`)) {
    window.location.href = "tel:19001234";
  }
};

window.updateReportStatus = function(reportId) {
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const statusOptions = {
    '1': 'emergency',
    '2': 'progress',
    '3': 'rescued'
  };
  
  const choice = prompt(`Cập nhật trạng thái cho "${report.animal}":\n1 - Khẩn cấp (🚨)\n2 - Đang xử lý (⏳)\n3 - Đã cứu (✅)`, "1");
  
  if (choice && statusOptions[choice]) {
    report.status = statusOptions[choice];
    renderReportsPanel();
    updateMapMarkers();
    alert(`✅ Đã cập nhật trạng thái thành công!`);
  }
};

// Lấy vị trí hiện tại
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

// Lấy địa chỉ từ tọa độ (Reverse Geocoding)
async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data.display_name) {
      let address = data.display_name;
      // Rút gọn địa chỉ cho mobile
      const parts = address.split(',');
      if (parts.length > 3) {
        address = parts.slice(0, 4).join(',');
      }
      return address.substring(0, 200);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error("Lỗi lấy địa chỉ:", error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Khởi tạo camera (tối ưu cho mobile)
async function initCamera() {
  video = document.getElementById('video');
  
  if (!video) {
    console.error("Không tìm thấy element video");
    return false;
  }
  
  // Kiểm tra hỗ trợ camera
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("❌ Trình duyệt không hỗ trợ camera");
    return false;
  }
  
  try {
    // Ưu tiên camera sau trên mobile
    const constraints = {
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn("Không lấy được camera sau, thử camera mặc định", err);
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
    }
    
    video.srcObject = stream;
    video.setAttribute('playsinline', true); // Quan trọng cho iOS
    await video.play();
    return true;
  } catch (err) {
    console.error("Lỗi camera:", err);
    if (err.name === 'NotAllowedError') {
      alert("❌ Bạn chưa cho phép truy cập camera.\nVui lòng cấp quyền trong trình duyệt và thử lại.");
    } else if (err.name === 'NotFoundError') {
      alert("❌ Không tìm thấy camera trên thiết bị.");
    } else if (err.name === 'NotReadableError') {
      alert("❌ Camera đang được sử dụng bởi ứng dụng khác.");
    } else {
      alert(`❌ Không thể truy cập camera: ${err.message}`);
    }
    return false;
  }
}

// Dừng camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    stream = null;
  }
  if (video) {
    video.srcObject = null;
  }
}

// Chụp ảnh
function capturePhoto() {
  if (!video || !video.videoWidth) {
    alert("Camera chưa sẵn sàng, vui lòng đợi!");
    return;
  }
  
  canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
  
  // Hiển thị preview
  const previewImg = document.getElementById('previewImg');
  previewImg.src = capturedPhoto;
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('retakeBtn').style.display = 'flex';
  
  // Dừng camera
  stopCamera();
  video.style.display = 'none';
}

// Chụp lại
function retakePhoto() {
  capturedPhoto = null;
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('captureBtn').style.display = 'flex';
  document.getElementById('retakeBtn').style.display = 'none';
  video.style.display = 'block';
  initCamera();
}

// Lấy vị trí và địa chỉ
async function fetchLocationAndAddress() {
  const locationLoading = document.getElementById('locationLoading');
  const locationInfo = document.getElementById('locationInfo');
  const addressText = document.getElementById('addressText');
  
  locationLoading.style.display = 'block';
  locationInfo.style.display = 'none';
  
  try {
    const position = await getCurrentLocation();
    currentLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    currentAddress = await getAddressFromCoords(currentLocation.lat, currentLocation.lng);
    addressText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${escapeHtml(currentAddress)}`;
    
    locationLoading.style.display = 'none';
    locationInfo.style.display = 'flex';
    
    return true;
  } catch (error) {
    locationLoading.style.display = 'none';
    console.error("Lỗi vị trí:", error);
    
    let errorMsg = "Không thể lấy vị trí.\n";
    if (error.code === 1) {
      errorMsg += "Vui lòng cho phép truy cập vị trí trong trình duyệt.";
    } else if (error.code === 2) {
      errorMsg += "Không xác định được vị trí. Vui lòng bật GPS.";
    } else {
      errorMsg += "Vui lòng kiểm tra kết nối GPS và thử lại.";
    }
    alert(errorMsg);
    return false;
  }
}

// Gửi báo cáo
async function submitReport() {
  const animalName = document.getElementById('animalName').value.trim();
  const animalStatus = document.getElementById('animalStatus').value;
  const animalDesc = document.getElementById('animalDesc').value.trim();
  
  if (!animalName) {
    alert("Vui lòng nhập tên/loài động vật!");
    document.getElementById('animalName').focus();
    return;
  }
  
  if (!capturedPhoto) {
    alert("Vui lòng chụp ảnh động vật!");
    return;
  }
  
  if (!currentLocation) {
    alert("Vui lòng chờ lấy vị trí GPS...");
    return;
  }
  
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
  
  // Đóng modal
  closeCameraModal();
  
  // Cập nhật giao diện
  renderReportsPanel();
  if (map) {
    updateMapMarkers();
    window.setActiveTab('map');
    setTimeout(() => {
      map.setView([currentLocation.lat, currentLocation.lng], 14);
      setTimeout(() => {
        markersLayer.eachLayer(layer => {
          if (Math.abs(layer.getLatLng().lat - currentLocation.lat) < 0.0001) {
            layer.openPopup();
          }
        });
      }, 500);
    }, 500);
  }
  
  alert(`✅ Đã gửi báo cáo thành công!\n\n🐾 Động vật: ${animalName}\n📍 Địa chỉ: ${currentAddress}\n📌 Đã thêm lên bản đồ cứu hộ!`);
}

// Mở modal camera
async function openCameraModal(e) {
  if (e) e.preventDefault();
  
  // Kiểm tra HTTPS
  if (!isSecureContext()) return;
  
  const modal = document.getElementById('cameraModal');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  // Reset form
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
  
  // Hiển thị loading
  const captureBtn = document.getElementById('captureBtn');
  captureBtn.disabled = true;
  captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang khởi tạo...';
  
  // Khởi tạo camera
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

// Đóng modal camera
function closeCameraModal() {
  const modal = document.getElementById('cameraModal');
  if (modal) {
    modal.style.display = 'none';
  }
  stopCamera();
}

// Khởi tạo sự kiện
document.addEventListener("DOMContentLoaded", () => {
  console.log("Ứng dụng đã khởi động!");
  
  // Khởi tạo bản đồ
  setTimeout(() => {
    if (typeof L !== 'undefined') {
      initRealMap();
    } else {
      console.error("Leaflet chưa được tải, kiểm tra lại thẻ script trong HTML");
    }
  }, 500);
  
  renderReportsPanel();
  renderNearbyHelpers();
  
  // Tab events
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab));
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      window.setActiveTab(btn.dataset.tab);
    });
  });
  
  // Search events
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
    searchBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleSearch();
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }
  
  // Report button
  const reportBtn = document.getElementById("reportNowBtn");
  if (reportBtn) {
    reportBtn.addEventListener("click", openCameraModal);
    reportBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      openCameraModal(e);
    });
  }
  
  // Camera buttons
  const captureBtn = document.getElementById("captureBtn");
  const retakeBtn = document.getElementById("retakeBtn");
  const submitBtn = document.getElementById("submitReportBtn");
  
  if (captureBtn) {
    captureBtn.addEventListener("click", capturePhoto);
    captureBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      capturePhoto();
    });
  }
  
  if (retakeBtn) {
    retakeBtn.addEventListener("click", retakePhoto);
    retakeBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      retakePhoto();
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener("click", submitReport);
    submitBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      submitReport();
    });
  }
  
  // Close modal
  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", closeCameraModal);
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeCameraModal();
    });
  });
  
  window.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("modal")) {
      closeCameraModal();
    }
  });
  
  // Set active tab
  window.setActiveTab("all");
  
  // Thông báo nếu không phải HTTPS
  if (!window.isSecureContext) {
    console.warn("⚠️ Đang chạy trong môi trường không an toàn (HTTP). Camera có thể không hoạt động!");
  }
});