// Cấu hình Token Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZmM2MjY2ZS03ZDI3LTQ3YzgtYTMxMi0wNDg3ZDc5YzRlNTYiLCJpZCI6NDM4ODM2LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAyOTY2OTl9.tDMoMdaTI7NA8otfGmZ1bwnMZFub0aSsaJLdYu54j6M';

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

let reports = [];
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

// ═══════════════════════════════════════════════════════════════
// HÀM HỖ TRỢ: CHUYỂN ĐỔI BASE64 SANG BLOB ĐỂ UPLOAD CLOUDINARY
// ═══════════════════════════════════════════════════════════════
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
}

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
        #reportsPanel { max-height: calc(100vh - 250px); overflow-y: auto; padding-right: 8px; }
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

function getSampleImage(animalType) {
    // Trả về null để các fallback URL ở createReportCardHTML & renderMarkersToMap hoạt động đúng.
    // (Trước đây hàm này tạo canvas base64 với emoji, khiến logic `report.photo ? ... : fallback`
    //  không bao giờ dùng được ảnh placeholder đẹp từ ui-avatars.com)
    return null;
}

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

function getApiUrl(path) {
    if (window.location.port !== '3000') {
        let host = window.location.hostname || '127.0.0.1';
        if (host === 'localhost') host = '127.0.0.1';
        return `http://${host}:3000${path}`;
    }
    return path;
}

// ═══════════════════════════════════════════════════════════════
// REVERSE GEOCODE – Lấy địa chỉ thực từ tọa độ lat/lng
// ═══════════════════════════════════════════════════════════════
async function reverseGeocode(lat, lng) {
    try {
        // Gọi qua backend proxy để tránh CORS (trước đây gọi trực tiếp Nominatim)
        const url = getApiUrl(`/api/geocode?lat=${lat}&lng=${lng}&zoom=16`);
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.address) {
            const a = data.address;
            const parts = [
                a.house_number,
                a.road || a.pedestrian || a.footway,
                a.suburb || a.neighbourhood || a.quarter,
                a.city || a.town || a.county || a.state
            ].filter(Boolean);
            return parts.length > 0
                ? parts.join(', ')
                : (data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

function updateCardAddress(reportId, newAddress) {
    const locEls = document.querySelectorAll(`[data-report-id="${reportId}"]`);
    locEls.forEach(el => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => {
            el.innerHTML = escapeHtml(newAddress);
            el.removeAttribute('style');         
            el.style.cssText = `
                line-height: 1.35;
                color: #86efac;
                font-style: normal;
                transition: color 1.5s ease;
            `;
            el.style.opacity = '1';
            setTimeout(() => {
                el.style.color = '#94a3b8';
            }, 2000);
        }, 300);
    });
    const r = reports.find(x => x.id === reportId);
    if (r) {
        r.location   = newAddress;
        r._needGeocode = false;
    }
}

async function resolveAddressesInBackground(reportsList) {
    const needResolve = reportsList.filter(r =>
        r._needGeocode === true && !isNaN(r.lat) && !isNaN(r.lng)
    );
    if (needResolve.length === 0) return;
    console.log(`📍 Đang reverse geocode ${needResolve.length} vị trí...`);
    for (const report of needResolve) {
        // Tăng delay lên 1.5s để tôn trọng rate limit 1 req/s của Nominatim
        await new Promise(r => setTimeout(r, 1500));
        const addr = await reverseGeocode(report.lat, report.lng);
        updateCardAddress(report.id, addr);
        console.log(`✅ [${report.animal}] Vị trí: ${addr}`);

        // Lưu kết quả vào DB để lần sau không phải geocode lại
        if (report.id) {
            try {
                await fetch(getApiUrl(`/api/rescuemap/${report.id}/address`), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: addr })
                });
            } catch (e) { console.warn("Lỗi lưu address vào DB:", e); }
        }
    }
}

async function fetchRescueReports() {
    try {
        console.log("Đang gọi API lấy dữ liệu từ MongoDB...");
        const response = await fetch(getApiUrl(`/api/rescuemap?t=${new Date().getTime()}`), { cache: 'no-store' });
        const dbData = await response.json();
        
        console.log("Dữ liệu từ API (MongoDB):", dbData);
        // Log riêng photo của từng item để dễ debug
        if (dbData && dbData.length > 0) {
            dbData.forEach((item, i) => {
                console.log(`📷 [${i}] ${item.animalName || item.animal} → photo: ${item.photo ? item.photo.substring(0, 60) + '...' : 'NULL'}`);
            });
        }
        
        if (dbData && dbData.length > 0) {
            reports = dbData.map(item => {
                const latVal = item.location && item.location.lat !== undefined ? parseFloat(item.location.lat) : NaN;
                const lngVal = item.location && item.location.lng !== undefined ? parseFloat(item.location.lng) : NaN;

                const rawAddr = (item.address || '').trim();
                const BAD = ['', 'chưa rõ địa chỉ', 'chưa rõ', 'undefined', 'null', 'không rõ'];
                const hasAddr = rawAddr && !BAD.includes(rawAddr.toLowerCase());

                let displayAddr;
                let needGeocode = false;

                if (hasAddr) {
                    displayAddr = rawAddr;
                } else if (!isNaN(latVal) && !isNaN(lngVal)) {
                    displayAddr = `${latVal.toFixed(4)}°N, ${lngVal.toFixed(4)}°E`;
                    needGeocode = true;  
                } else {
                    displayAddr = 'Đang xác định vị trí...';
                }

                // Lỗi 1 & 5 FIX (dứt điểm): Lấy ảnh trực tiếp từ DB.
                // item.photo có thể là: URL Cloudinary (http...), chuỗi Base64 (data:image/...), hoặc null.
                // Chỉ dùng getSampleImage (trả null) khi item.photo thực sự rỗng.
                const rawPhoto = item.photo && typeof item.photo === 'string' && item.photo.trim() !== '' 
                    ? item.photo.trim() 
                    : null;

                return {
                    id: item._id ? item._id.toString() : "",
                    animal: item.animalName || item.animal || "Chưa rõ tên",
                    location: displayAddr,
                    status: item.status || "emergency",
                    lat: latVal,
                    lng: lngVal,
                    date: item.createdAt || item.date || new Date().toLocaleString("vi-VN"),
                    description: item.description || item.note || "",
                    photo: rawPhoto,  // null nếu không có ảnh; có thể là URL hoặc base64
                    _needGeocode: needGeocode 
                };
            }).filter(report => !isNaN(report.lat) && !isNaN(report.lng));
        } else {
            reports = [];
        }

        renderReportsPanel();
        renderNearbyHelpers();
        renderNearestClinic();

        function tryAddMarkers(attempts) {
            if (viewer) {
                renderMarkersToMap(filterReports());
            } else if (attempts > 0) {
                setTimeout(() => tryAddMarkers(attempts - 1), 800);
            }
        }
        tryAddMarkers(5);

        setTimeout(() => resolveAddressesInBackground([...reports]), 1500);

    } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu từ DB:", error);
    }
}


function createReportCardHTML(report) {
    const STATUS = {
        emergency: {
            label:   'Khẩn cấp',
            icon:    'fas fa-circle-exclamation',
            color:   '#f87171',
            bg:      'rgba(239,68,68,0.15)',
            border:  'rgba(239,68,68,0.35)',
            cls:     'emergency'
        },
        progress: {
            label:   'Đang cứu hộ',
            icon:    'fas fa-spinner',
            color:   '#60a5fa',
            bg:      'rgba(59,130,246,0.15)',
            border:  'rgba(59,130,246,0.35)',
            cls:     'progress'
        },
        rescued: {
            label:   'An toàn',
            icon:    'fas fa-circle-check',
            color:   '#4ade80',
            bg:      'rgba(34,197,94,0.15)',
            border:  'rgba(34,197,94,0.35)',
            cls:     'rescued'
        }
    };
    const st = STATUS[report.status] || STATUS.rescued;

    const isCoords = /^-?\d+\.\d+°[NS]/.test(report.location || '');
    const addressHTML = isCoords
        ? `<span data-report-id="${report.id}"
               style="color:#64748b; font-style:italic;
                      display:inline-flex; align-items:center; gap:5px;">
             <i class="fas fa-circle-notch fa-spin" style="font-size:10px;"></i>
             ${escapeHtml(report.location)}
           </span>`
        : `<span data-report-id="${report.id}" style="line-height:1.35;">
             ${escapeHtml(report.location || 'Đang xác định...')}
           </span>`;

    // Lỗi 1 & 5 FIX: chỉ dùng những URL thực sự hợp lệ (chấp nhận http hoặc data:image/ cho ảnh vừa chụp)
    const photoSrc = (report.photo && (report.photo.startsWith('http') || report.photo.startsWith('data:image/')))
        ? report.photo
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(report.animal)}&background=0a1c12&color=4ade80&size=128&bold=true`;

    const descBlock = report.description
        ? `<div style="
              font-size:12.5px; color:#94a3b8;
              background:rgba(255,255,255,0.04);
              padding:10px 12px; border-radius:8px;
              margin-top:12px; font-style:italic;
              border-left:3px solid ${st.color};
              line-height:1.55;
           ">
             &ldquo;${escapeHtml(report.description)}&rdquo;
           </div>`
        : '';

    return `
<div class="report-card ${st.cls}" style="align-items: stretch;">
  <!-- Khối bên trái: Ảnh, Thông tin và Mô tả (Tự động co giãn) -->
  <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
    <div style="display:flex; gap:12px; align-items:flex-start;">
    <img src="${photoSrc}"
         alt="${escapeHtml(report.animal)}"
         style="width:72px; height:72px; object-fit:cover; border-radius:10px;
                border:1px solid rgba(255,255,255,0.1); flex-shrink:0;
                box-shadow:0 4px 12px rgba(0,0,0,0.4);"
         onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(report.animal)}&background=0a1c12&color=4ade80&size=128&bold=true'">
    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:5px;">
      <h4 style="
            margin:0; font-size:15px; font-weight:700;
            color:#f8fafc; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis;
            line-height:1.2;
         ">${escapeHtml(report.animal)}</h4>
      <span style="
              display:inline-flex; align-items:center; gap:5px;
              width:max-content; padding:4px 12px;
              border-radius:99px; font-size:11.5px; font-weight:700;
              color:${st.color}; background:${st.bg};
              border:1px solid ${st.border};
              letter-spacing:0.3px;
           ">
        <i class="${st.icon}" style="font-size:10px;"></i>
        ${st.label}
      </span>
      <p style="
           margin:0; font-size:12px; color:#94a3b8;
           display:flex; align-items:flex-start; gap:6px;
         ">
        <i class="fas fa-map-marker-alt"
           style="color:var(--green-main); margin-top:2px; flex-shrink:0; font-size:11px;"></i>
        ${addressHTML}
      </p>
      <p style="margin:0; font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:5px;">
        <i class="fas fa-clock" style="font-size:10px;"></i>
        ${escapeHtml(report.date || '')}
      </p>
    </div>
  </div>
  ${descBlock}
  </div>
  <!-- Khối bên phải: Cụm nút bấm (Cố định chiều rộng không bị ép) -->
  <div style="display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:8px; border-left:1px dashed rgba(150,150,150,0.25); padding-left:14px; margin-left:8px; flex-shrink:0;">
    <button class="report-action-btn locate-btn"
            data-lat="${report.lat}" data-lng="${report.lng}"
            style="
              width:110px; padding:8px 10px;
              background:rgba(34,197,94,0.1); color:#4ade80;
              border:1px solid rgba(34,197,94,0.25); border-radius:var(--radius-pill);
              font-family:var(--font); font-weight:600; cursor:pointer;
              font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:6px;
              transition:all 0.2s;
            "
            onmouseover="this.style.background='rgba(34,197,94,0.2)';this.style.transform='translateY(-1px)'"
            onmouseout="this.style.background='rgba(34,197,94,0.1)';this.style.transform='none'">
      <i class="fas fa-crosshairs"></i> Vị trí 3D
    </button>
    <button class="report-action-btn delete-btn"
            data-id="${report.id}"
            style="
              width:110px; padding:8px 10px;
              background:rgba(239,68,68,0.1); color:#f87171;
              border:1px solid rgba(239,68,68,0.25); border-radius:var(--radius-pill);
              font-family:var(--font); font-weight:600; cursor:pointer;
              font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:6px;
              transition:all 0.2s;
            "
            onmouseover="this.style.background='rgba(239,68,68,0.2)';this.style.transform='translateY(-1px)'"
            onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.transform='none'">
      <i class="fas fa-trash-alt"></i> Xóa
    </button>
  </div>
</div>`;
}


function renderReportsPanel() {
    const container = document.getElementById("reportsPanel");
    if (!container) return;
    const filtered = filterReports();
    if (filtered.length === 0) {
        container.innerHTML = `
          <div style="
            text-align:center; padding:40px 20px;
            color:var(--text-muted);
          ">
            <i class="fas fa-binoculars"
               style="font-size:42px; color:rgba(34,197,94,0.3); margin-bottom:14px; display:block;"></i>
            <h3 style="color:var(--text-light); font-size:16px; margin-bottom:6px;">Chưa có báo cáo nào</h3>
            <p style="font-size:13px; line-height:1.55;">
              Nhấn <strong style="color:var(--orange);">🚨 Report Now</strong><br>để báo cáo động vật cần cứu hộ!
            </p>
          </div>`;
        return;
    }
    container.innerHTML = `
      <div style="
        font-size:13px; font-weight:700; color:var(--green-light);
        border-bottom:1px solid var(--glass-border); padding-bottom:10px; margin-bottom:12px;
        display:flex; align-items:center; gap:7px; letter-spacing:0.3px;
      ">
        <i class="fas fa-list-ul" style="opacity:0.7;"></i>
        Danh sách báo cáo
        <span style="
          background:var(--green-dim); border:1px solid var(--green-border);
          color:var(--green-light); border-radius:99px;
          padding:2px 10px; font-size:11px; margin-left:auto;
        ">${filtered.length}</span>
      </div>`;
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
            const id = btn.dataset.id;
            if(confirm("Bạn có chắc muốn ẩn báo cáo này khỏi bản đồ? (Cần có API backend để xóa vĩnh viễn)")) {
                reports = reports.filter((r) => r.id !== id);
                renderReportsPanel(); renderNearbyHelpers(); renderNearestClinic();
                if (viewer) renderMarkersToMap(filterReports());
                showToast("Đã ẩn báo cáo khỏi giao diện!", "success");
            }
        };
    });
}

function initRealMap() {
    const mapContainer = document.getElementById("interactiveMap");
    if (!mapContainer) return;

    if (!document.getElementById("cesiumFixStyles")) {
        const style = document.createElement("style");
        style.id = "cesiumFixStyles";
        style.textContent = `
            /* Desktop: #interactiveMap absolute fills the full fixed wrapper */
            @media (min-width: 769px) {
                #interactiveMap {
                    position: absolute !important;
                    top: 0 !important; left: 0 !important;
                    width: 100% !important; height: 100% !important;
                    display: block !important;
                    overflow: hidden !important;
                }
            }
            /* Mobile: #interactiveMap is a flex-child, position:relative + fixed height */
            @media (max-width: 768px) {
                #interactiveMap {
                    position: relative !important;
                    width: 100% !important;
                    height: 55vh !important;
                    display: block !important;
                    overflow: hidden !important;
                    flex: 0 0 55vh !important;
                }
            }
            /* Cesium internal elements always fill their container */
            #interactiveMap .cesium-viewer,
            #interactiveMap .cesium-viewer-cesiumWidgetContainer,
            #interactiveMap .cesium-widget,
            #interactiveMap canvas {
                width: 100% !important; height: 100% !important;
                display: block !important;
                position: absolute !important;
                top: 0 !important; left: 0 !important;
            }
            .cesium-viewer-toolbar { display: none !important; }
            .cesium-widget-credits { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    if (viewer) { viewer.destroy(); viewer = null; }
    
    viewer = new Cesium.Viewer('interactiveMap', {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: false, timeline: false, infoBox: false, selectionIndicator: false,
        baseLayerPicker: false, geocoder: false, homeButton: false, navigationHelpButton: false, sceneModePicker: false,
        fullscreenButton: true, fullscreenElement: 'interactiveMap' 
    });
    
    if (viewer.cesiumWidget.creditContainer) {
        viewer.cesiumWidget.creditContainer.style.display = "none";
    }

    viewer.scene.camera.frustum.far = 100000000;
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(108.2171, 16.0545, 25000000), duration: 2 });

    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (viewer && viewer.resize) {
                try { viewer.resize(); } catch (e) { console.log("Cesium resize ignored"); }
            }
        }, 100); 
    });
    resizeObserver.observe(mapContainer);

    setupCustomPopup();
    renderMarkersToMap(filterReports());
}

function setupCustomPopup() {
    const container = document.getElementById("interactiveMap");
    if (!container) return;
    container.style.position = 'relative'; 
    if (popupDiv) popupDiv.remove();

    popupDiv = document.createElement('div');
    popupDiv.id = 'cesiumPopupDiv';          
    popupDiv.className = 'cesium-popup-overlay'; 
    popupDiv.style.position = 'absolute';
    popupDiv.style.top = '80px';    
    popupDiv.style.right = '20px';
    popupDiv.style.backgroundColor = 'transparent';
    popupDiv.style.padding = '0px';
    popupDiv.style.display = 'none';
    popupDiv.style.zIndex = '1050';
    popupDiv.style.pointerEvents = 'auto';
    container.appendChild(popupDiv);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties && pickedObject.id.properties.customHTML) {
            activeEntity = pickedObject.id;
            const htmlContent = typeof activeEntity.properties.customHTML.getValue === 'function' ? activeEntity.properties.customHTML.getValue() : activeEntity.properties.customHTML;
            popupDiv.innerHTML = htmlContent;
            popupDiv.style.display = 'block';

            const closeBtn = popupDiv.querySelector('.close-btn');
            if(closeBtn) closeBtn.onclick = () => { popupDiv.style.display = 'none'; activeEntity = null; };
        } else {
            activeEntity = null; popupDiv.style.display = 'none';
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function renderMarkersToMap(reportsData) {
    if (!viewer) return;
    
    viewer.entities.removeAll(); 
    if (popupDiv) popupDiv.style.display = 'none';
    
    if (reportsData.length === 0) return;
    
    const locationCount = {}; // Lưu số lượng marker tại mỗi tọa độ để tạo độ lệch

    reportsData.forEach(report => {
        let markerColor = Cesium.Color.fromCssColorString('#ef4444'); 
        let statusText = '🆘 KHẨN CẤP'; let statusColor = '#dc2626'; let badgeBg = '#fef2f2';

        if (report.status === 'rescued') {
            markerColor = Cesium.Color.fromCssColorString('#22c55e');
            statusText = '🌿 AN TOÀN'; statusColor = '#16a34a'; badgeBg = '#dcfce7';
        } else if (report.status === 'progress') {
            markerColor = Cesium.Color.fromCssColorString('#3b82f6');
            statusText = '🏃 ĐANG CỨU HỘ'; statusColor = '#0284c7'; badgeBg = '#f0f9ff';
        }
        
        // Lỗi 5 FIX: chỉ dùng những URL thực sự hợp lệ (phải bắt đầu bằng http hoặc data:image/ cho ảnh vừa chụp)
        const hasRealPhoto = report.photo && (report.photo.startsWith('http') || report.photo.startsWith('data:image/'));
        const bgImage = hasRealPhoto
            ? report.photo
            : null;
        const onlyHelpers = helpersData.filter(h => !h.isClinic);
        const helpersWithDist = onlyHelpers.map(h => ({ ...h, distance: calculateDistance(h.lat, h.lng, report.lat, report.lng) })).filter(h => h.distance <= 5).sort((a, b) => a.distance - b.distance).slice(0, 2);
        
        let helpersHtml = '';
        if (helpersWithDist.length > 0) {
            helpersHtml = helpersWithDist.map(h => `
                <div class="detail-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span style="color: #16a34a; font-weight: 700;"><i class="fas fa-user-shield"></i> ${escapeHtml(h.name)}</span>
                        <span style="color: #64748b; font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 10px;">${formatDistance(h.distance)}</span>
                    </div>
                    <div style="color: #475569; font-size: 12px; margin-top: 4px;">${escapeHtml(h.role)} - 📞 ${h.phone}</div>
                </div>
            `).join('');
        } else {
            helpersHtml = `<div style="color: #aaa; font-size: 11px; text-align: center;">Không có người hỗ trợ trong bán kính 5km</div>`;
        }

        const clinics = helpersData.filter(h => h.isClinic);
        const clinicsWithDist = clinics.map(c => ({ ...c, distance: calculateDistance(c.lat, c.lng, report.lat, report.lng) })).sort((a, b) => a.distance - b.distance);
        
        let clinicHtml = '';
        if (clinicsWithDist.length > 0) {
            const c = clinicsWithDist[0];
            clinicHtml = `
                <div class="detail-item" style="flex-direction: column; align-items: flex-start; background: #f0fdf4; padding: 8px; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span style="color: #059669; font-weight: 700;"><i class="fas fa-clinic-medical"></i> ${escapeHtml(c.name)}</span>
                        <span style="color: #64748b; font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 10px;">${formatDistance(c.distance)}</span>
                    </div>
                    <div style="color: #475569; font-size: 12px; margin-top: 4px;">📞 ${c.phone} | ${c.available}</div>
                </div>
            `;
        } else {
            clinicHtml = `<div style="color: #aaa; font-size: 11px; text-align: center;">Không tìm thấy phòng khám</div>`;
        }

        const popupContent = `
            <div class="rescue-popup light-theme">
                <button class="close-btn"><i class="fas fa-times"></i></button>
                <div class="rescue-header" style="background-color: #e8f5e9; ${bgImage ? `background-image: url('${bgImage}');` : ''}">
                    ${!bgImage ? `
                    <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;">
                        <div style="text-align:center; opacity:0.5;">
                            <i class="fas fa-paw" style="font-size:32px; color:#10b981;"></i>
                        </div>
                    </div>` : ''}
                    <span class="rescue-badge" style="color: ${statusColor}; border: none; background-color: ${badgeBg}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${statusText}</span>
                    <div class="rescue-title-container">
                        <h2 class="rescue-title"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</h2>
                    </div>
                </div>

                <div class="rescue-details">
                    <div class="detail-section">
                        <div class="detail-title" style="color:#10b981;"><i class="fas fa-map-marker-alt"></i> ĐỊA ĐIỂM CỨU HỘ</div>
                        <div class="detail-box">
                            <div class="detail-item">
                                <div class="detail-item-title"><i class="fas fa-location-arrow"></i> Vị trí</div>
                                <div class="detail-item-value">${escapeHtml(report.location)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-item-title"><i class="far fa-clock"></i> Thời gian</div>
                                <div class="detail-item-value">${report.date}</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-title" style="color:#f59e0b;"><i class="fas fa-info-circle"></i> MÔ TẢ TÌNH TRẠNG</div>
                        <div class="detail-box" style="font-style: italic; font-size: 13px; color: #475569; background: #fffbeb; border-left: 3px solid #fcd34d;">
                            ${escapeHtml(report.description || "Chưa có mô tả chi tiết.")}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="detail-title" style="color:#059669;"><i class="fas fa-hospital"></i> PHÒNG KHÁM GẦN NHẤT</div>
                        <div class="detail-box">${clinicHtml}</div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-title" style="color:#3b82f6;"><i class="fas fa-hands-helping"></i> LỰC LƯỢNG HỖ TRỢ</div>
                        <div class="detail-box">${helpersHtml}</div>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 12px 0;">
                    <div style="display: flex; gap: 8px; justify-content: space-between;">
                        <button onclick="alert('Đang gọi liên hệ hỗ trợ...')" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 10px 12px; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: transform 0.2s;">
                            <i class="fas fa-phone-volume"></i> Gọi liên hệ khẩn cấp
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Sửa lỗi 3: Logic tạo độ lệch (offset) hình tròn cho các marker trùng tọa độ
        const locKey = `${report.lat.toFixed(5)}_${report.lng.toFixed(5)}`;
        if (!locationCount[locKey]) locationCount[locKey] = 0;
        
        const count = locationCount[locKey];
        let renderLat = report.lat;
        let renderLng = report.lng;
        if (count > 0) {
            const offsetRadius = 0.0002; // Khoảng 20m độ lệch để tránh đè chập nhau
            const angle = count * (Math.PI / 3); // Phân bổ góc 60 độ xung quanh
            renderLat += offsetRadius * Math.cos(angle);
            renderLng += offsetRadius * Math.sin(angle);
        }
        locationCount[locKey]++;

        viewer.entities.add({
            id: `report_${report.id}`,
            position: Cesium.Cartesian3.fromDegrees(renderLng, renderLat),
            point: { pixelSize: 18, color: markerColor, outlineColor: Cesium.Color.WHITE, outlineWidth: 3, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            properties: { customHTML: popupContent }
        });
    });
}

async function initCamera() {
    video = document.getElementById("video");
    if (!video) return false;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream; video.setAttribute("playsinline", true);
        await video.play(); return true;
    } catch (err) {
        showToast(`❌ Không thể truy cập camera`, "error"); return false;
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

    const previewImg = document.getElementById("previewImg");
    previewImg.src = capturedPhoto;
    previewImg.style.display = "block";

    document.getElementById("previewSection").style.display = "block";
    document.getElementById("captureBtn").style.display = "none";
    document.getElementById("retakeBtn").style.display = "flex";
    document.getElementById("scanOverlay").style.display = "none";
    stopCamera(); video.style.display = "none";
}

function retakePhoto() {
    capturedPhoto = null;
    const previewImg = document.getElementById("previewImg");
    if (previewImg) previewImg.style.display = "none";
    document.getElementById("previewSection").style.display = "none";
    document.getElementById("captureBtn").style.display = "flex";
    document.getElementById("retakeBtn").style.display = "none";
    document.getElementById("scanOverlay").style.display = "flex";
    video.style.display = "block";
    initCamera();
}

async function fetchLocationAndAddress() {
    const locationLoading = document.getElementById("locationLoading");
    const locationInfo = document.getElementById("locationInfo");
    const addressText = document.getElementById("addressText");
    
    if (locationLoading) locationLoading.style.display = "block";
    if (locationInfo) locationInfo.style.display = "none";
    
    try {
        if (!navigator.geolocation) {
            throw new Error("Trình duyệt không hỗ trợ GPS");
        }

        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true, 
                timeout: 10000,
                maximumAge: 0 
            });
        });
        currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // Tách phần lấy địa chỉ ra một try-catch riêng. Nếu API lỗi, vẫn giữ lại được tọa độ GPS.
        try {
            // Gọi qua backend proxy để tránh CORS
            const res = await fetch(getApiUrl(`/api/geocode?lat=${currentLocation.lat}&lng=${currentLocation.lng}&zoom=18`));
            const data = await res.json();
            currentAddress = data.display_name ? data.display_name : `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
        } catch (apiError) {
            currentAddress = `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
        }
        
        if (addressText) addressText.innerHTML = escapeHtml(currentAddress);
        if (locationLoading) locationLoading.style.display = "none";
        if (locationInfo) locationInfo.style.display = "flex";
    } catch (e) {
        if (locationLoading) locationLoading.style.display = "none";
        let errorMsg = "Không lấy được vị trí GPS. Hãy bật Vị trí và dùng link có HTTPS/localhost.";
        if (e.code === 1) errorMsg = "Bạn đã từ chối quyền truy cập vị trí. Hãy bật lại!";
        else if (e.code === 2) errorMsg = "Không tìm thấy tín hiệu GPS hiện tại.";
        else if (e.code === 3) errorMsg = "Hết thời gian chờ lấy vị trí GPS.";
        
        showToast(errorMsg, "error");
    }
}

// ═══════════════════════════════════════════════════════════════
// HÀM SUBMIT REPORT ĐÃ ĐƯỢC TÍCH HỢP UPLOAD CLOUDINARY
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// HÀM SUBMIT REPORT ĐÃ FIX LỖI ẢNH (HỖ TRỢ FALLBACK BASE64)
// ═══════════════════════════════════════════════════════════════
async function submitReport() {
    const animalName   = document.getElementById("animalName")?.value.trim() || "";
    const animalStatus = document.getElementById("animalStatus")?.value || "emergency";
    const animalDesc   = document.getElementById("animalDesc")?.value.trim() || "";

    if (!animalName) {
        return showToast("Vui lòng nhập tên động vật!", "error");
    }
    if (!currentLocation) {
        return showToast("Chưa lấy được vị trí GPS. Hãy thử lại!", "error");
    }

    const submitBtn = document.getElementById('submitReportBtn');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    // FIX: Mặc định gán luôn ảnh vừa chụp (Base64) làm ảnh sẽ lưu. 
    // Nếu upload Cloudinary thành công thì ghi đè lại bằng Link sau.
    let finalPhotoUrl = capturedPhoto; 

    // --- BƯỚC MỚI THÊM VÀO: UPLOAD ẢNH LÊN CLOUDINARY ---
    if (capturedPhoto) {
        try {
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang tải ảnh lên...</span>';
            
            const formData = new FormData();
            formData.append('image', dataURItoBlob(capturedPhoto), 'capture.jpg'); 
            
            console.log("Đang tải ảnh lên Cloudinary qua API backend...");
            const uploadRes = await fetch(getApiUrl('/api/upload'), {
                method: 'POST',
                body: formData
            });
            
            const uploadData = await uploadRes.json();
            if (uploadRes.ok) {
                // FIX: Quét rộng các key API Cloudinary thường trả về
                finalPhotoUrl = uploadData.secure_url || uploadData.url || uploadData.imageUrl || capturedPhoto; 
                console.log("✅ Tải ảnh thành công:", finalPhotoUrl);
            } else {
                console.warn("⚠️ API upload lỗi, tự động chuyển sang lưu ảnh dạng Base64 gốc.");
            }
        } catch (error) {
            console.warn("❌ Lỗi mạng khi gọi API tải ảnh. Tự động chuyển sang lưu Base64.", error);
            // FIX: Bỏ lệnh `return;` ở đây để hệ thống không bị kẹt, vẫn tiếp tục gửi được báo cáo!
        }
    }

    // --- BƯỚC LƯU DATABASE: Gửi thông tin cứu hộ ---
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang gửi báo cáo...</span>';

    const payload = {
        animalName  : animalName,
        status      : animalStatus,
        description : animalDesc,
        location    : { lat: currentLocation.lat, lng: currentLocation.lng },
        address     : currentAddress || `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`,
        date        : new Date().toLocaleString("vi-VN"),
        photo       : finalPhotoUrl // Lúc này photo chắc chắn có data (Link Cloudinary hoặc chuỗi Base64)
    };

    try {
        const response = await fetch(getApiUrl('/api/rescuemap'), {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(payload)
        });

        const contentType = response.headers.get("content-type") || "";
        let result;
        if (contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const rawText = await response.text();
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
            return showToast(`❌ Lỗi Server. Mở F12 để xem chi tiết!`, "error");
        }

        if (response.ok) { 
            showToast("✅ Báo cáo đã được lưu lên bản đồ!", "success");

            // Lấy ID và ảnh từ kết quả POST
            const savedId = result && result.id ? result.id : null;
            const savedPhotoUrl = finalPhotoUrl;
            console.log("📸 finalPhotoUrl:", savedPhotoUrl ? savedPhotoUrl.substring(0, 80) + '...' : 'NULL');
            console.log("🆔 savedId:", savedId);

            // Đóng modal TRUỚC khi await để tránh race condition với fetchRescueReports
            await closeCameraModal();

            // Fetch lại danh sách từ DB
            await fetchRescueReports();

            // ============================================================
            // Đảm bảo ảnh được lưu vào MongoDB (trường hợp DB chưa có ảnh)
            // ============================================================
            if (savedPhotoUrl && savedId) {
                const newReport = reports.find(r => r.id === savedId);

                if (newReport && !newReport.photo) {
                    console.log("🔧 DB chưa có ảnh, đang PATCH vào MongoDB...");
                    try {
                        const patchRes = await fetch(getApiUrl(`/api/rescuemap/${savedId}/photo`), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photo: savedPhotoUrl })
                        });
                        if (patchRes.ok) {
                            console.log("✅ PATCH thành công! Ảnh đã vào MongoDB.");
                            newReport.photo = savedPhotoUrl;
                        } else {
                            console.warn("⚠️ PATCH thất bại:", await patchRes.text());
                        }
                    } catch (e) {
                        console.warn("❌ Lỗi mạng khi PATCH:", e);
                    }
                } else if (newReport && newReport.photo) {
                    console.log("✅ DB đã có ảnh:", newReport.photo.substring(0, 70) + '...');
                } else if (!newReport) {
                    console.warn("⚠️ Không tìm thấy report với id:", savedId, "- thử fallback...");
                    // Fallback: patch report cuối cùng
                    if (reports.length > 0) {
                        const last = reports[reports.length - 1];
                        if (!last.photo && last.id) {
                            try {
                                await fetch(getApiUrl(`/api/rescuemap/${last.id}/photo`), {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ photo: savedPhotoUrl })
                                });
                                last.photo = savedPhotoUrl;
                                console.log("✅ Fallback PATCH thành công.");
                            } catch (e) { console.warn("❌ Fallback PATCH lỗi:", e); }
                        }
                    }
                }

                // Re-render UI với ảnh đúng (luôn chạy dù DB đã có hay vừa patch)
                renderReportsPanel();
                if (viewer) renderMarkersToMap(filterReports());
            }

            // FlyTo tới điểm vừa báo cáo trên Cesium
            if (viewer && currentLocation) {
                window.setActiveTab("map");
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(currentLocation.lng, currentLocation.lat, 1500),
                    duration: 2,
                    complete: function () {
                        if (reports.length > 0) {
                            const newReport = reports[reports.length - 1];
                            const entity = viewer.entities.getById(`report_${newReport.id}`);
                            if (entity && popupDiv) {
                                activeEntity = entity;
                                const html = typeof entity.properties.customHTML.getValue === 'function'
                                    ? entity.properties.customHTML.getValue()
                                    : entity.properties.customHTML;
                                popupDiv.innerHTML = html;
                                popupDiv.style.display = 'block';
                                const closeBtn = popupDiv.querySelector('.close-btn');
                                if (closeBtn) closeBtn.onclick = () => { popupDiv.style.display = 'none'; activeEntity = null; };
                            }
                        }
                    }
                });
            }
        } else {
            const errMsg = result?.error || result?.message || `HTTP ${response.status}`;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
            showToast(`❌ Server lỗi: ${errMsg}`, "error");
        }
    } catch (networkError) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
        showToast(`❌ Lỗi kết nối. Kiểm tra server có đang chạy không?`, "error");
    }
}

window.openCameraModal = async function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById("cameraModal");
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = 'hidden';
    
    document.getElementById("animalName").value = "";
    document.getElementById("animalDesc").value = "";
    document.getElementById("previewSection").style.display = "none";
    document.getElementById("captureBtn").style.display = "flex";
    document.getElementById("retakeBtn").style.display = "none";
    document.getElementById("locationInfo").style.display = "none";
    
    const previewImg = document.getElementById("previewImg");
    if (previewImg) previewImg.style.display = "none";

    capturedPhoto = null; currentLocation = null; currentAddress = "";
    
    video = document.getElementById("video"); video.style.display = "block";
    document.getElementById("scanOverlay").style.display = "flex";
    document.getElementById("captureBtn").innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';
    
    await initCamera(); await fetchLocationAndAddress();
}

window.closeCameraModal = function() {
    const modal = document.getElementById("cameraModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = '';
    stopCamera();
};

window.setActiveTab = function (tabId) {
    activeTab = tabId;
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
    
    renderReportsPanel();
    
    if (!viewer) {
        initRealMap(); 
    } else {
        renderMarkersToMap(filterReports());
        setTimeout(() => { if(viewer && viewer.resize) viewer.resize(); }, 50);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    addToastAnimations();
    addPanelStyles(); 
    setTimeout(() => { if (typeof Cesium !== "undefined") initRealMap(); }, 500);
    
    fetchRescueReports();
    
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab)));
    
    document.getElementById("searchBtn")?.addEventListener("click", () => { searchKeyword = document.getElementById("searchInput").value; window.setActiveTab("map"); renderReportsPanel(); });
    document.getElementById("searchInput")?.addEventListener("keyup", (e) => { if (e.key === "Enter") { searchKeyword = e.target.value; window.setActiveTab("map"); renderReportsPanel(); }});
    
    document.getElementById("captureBtn")?.addEventListener("click", capturePhoto);
    document.getElementById("retakeBtn")?.addEventListener("click", retakePhoto);
    document.getElementById("submitReportBtn")?.addEventListener("click", submitReport);
    
    window.addEventListener("click", (e) => {
        if (e.target.id === "cameraModal")  window.closeCameraModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { window.closeCameraModal(); }
    });
    
    const viewHomeBtn = document.getElementById("viewHomeBtn");
    if (viewHomeBtn) {
        viewHomeBtn.addEventListener("click", () => {
            if (viewer) {
                viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(108.2171, 16.0545, 25000000), duration: 2 });
                if (popupDiv) popupDiv.style.display = 'none'; activeEntity = null;
            }
        });
    }

    /* Support Force button */
    document.getElementById("supportForceBtn")?.addEventListener("click", () => {
        showToast("📞 Đang kết nối lực lượng hỗ trợ...", "success");
        let directoryModal = document.getElementById("supportDirectoryModal");
        if (!directoryModal) {
            directoryModal = document.createElement("div");
            directoryModal.id = "supportDirectoryModal";
            directoryModal.className = "rm-modal-overlay open";
            
            const volunteerHtml = helpersData.filter(h => !h.isClinic).map(h => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #0f172a; font-size: 15px;"><i class="fas fa-user-shield" style="color: #10b981;"></i> ${escapeHtml(h.name)} ${h.verified ? '<i class="fas fa-check-circle" style="color: #3b82f6; font-size: 12px;" title="Đã xác thực"></i>' : ''}</h4>
                        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${escapeHtml(h.role)}</p>
                        <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(h.address)}</p>
                    </div>
                    <button onclick="window.location.href='tel:${h.phone}'" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#10b981'; this.style.color='white'" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#10b981'"><i class="fas fa-phone"></i> Gọi</button>
                </div>
            `).join('');

            const clinicHtml = helpersData.filter(h => h.isClinic).map(h => `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #065f46; font-size: 15px;"><i class="fas fa-clinic-medical" style="color: #059669;"></i> ${escapeHtml(h.name)}</h4>
                        <p style="margin: 4px 0 0 0; color: #047857; font-size: 13px;">${escapeHtml(h.specialty)} | 🕐 ${h.available}</p>
                        <p style="margin: 2px 0 0 0; color: #059669; font-size: 12px; opacity: 0.8;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(h.address)}</p>
                    </div>
                    <button onclick="window.location.href='tel:${h.phone}'" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'"><i class="fas fa-phone"></i> Gọi</button>
                </div>
            `).join('');

            directoryModal.innerHTML = `
                <div class="rm-modal" style="max-width: 600px;">
                    <div class="rm-modal-header" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <div class="rm-modal-title" style="color: white;">
                            <i class="fas fa-address-book"></i>
                            <span>Danh bạ Lực lượng Hỗ trợ</span>
                        </div>
                        <button class="rm-modal-close" style="color: white; opacity: 0.8;" onclick="this.closest('.rm-modal-overlay').classList.remove('open')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="rm-form-section" style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a; margin-bottom: 12px;"><i class="fas fa-user-friends" style="color: #3b82f6;"></i> Tình nguyện viên & Chuyên gia</h3>
                        ${volunteerHtml}
                        
                        <h3 style="margin-top: 24px; font-size: 16px; color: #0f172a; margin-bottom: 12px;"><i class="fas fa-hospital" style="color: #ef4444;"></i> Trạm Y tế & Phòng khám Thú y</h3>
                        ${clinicHtml}
                    </div>
                </div>
            `;
            document.body.appendChild(directoryModal);
            
            directoryModal.addEventListener('click', (e) => {
                if(e.target === directoryModal) directoryModal.classList.remove('open');
            });
        } else {
            directoryModal.classList.add("open");
        }
    });
    
    window.setActiveTab("all"); 
});