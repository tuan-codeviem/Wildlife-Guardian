// Cấu hình Token Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZmM2MjY2ZS03ZDI3LTQ3YzgtYTMxMi0wNDg3ZDc5YzRlNTYiLCJpZCI6NDM4ODM2LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAyOTY2OTl9.tDMoMdaTI7NA8otfGmZ1bwnMZFub0aSsaJLdYu54j6M';

let reports = [];

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

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
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


function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        if (m === '"') return "&quot;";
        if (m === "'") return "&#039;";
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
    return null;
}

function getApiUrl(path) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3000${path}`;
    }
    return `${window.location.origin}${path}`;
}

// ═══════════════════════════════════════════════════════════════
// REVERSE GEOCODE
// ═══════════════════════════════════════════════════════════════
async function reverseGeocode(lat, lng) {
    try {
        // Gọi trực tiếp API OpenStreetMap từ Front-end thay vì gọi qua Server
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
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
        r.location = newAddress;
        r._needGeocode = false;
    }
}

async function resolveAddressesInBackground(reportsList) {
    const needResolve = reportsList.filter(r =>
        r._needGeocode === true && !isNaN(r.lat) && !isNaN(r.lng)
    );
    if (needResolve.length === 0) return;
    for (const report of needResolve) {
        await new Promise(r => setTimeout(r, 1500));
        const addr = await reverseGeocode(report.lat, report.lng);
        updateCardAddress(report.id, addr);

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
        const response = await fetch(getApiUrl(`/api/rescuemap?t=${new Date().getTime()}`), { cache: 'no-store' });
        const dbData = await response.json();

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
                    date: (item.createdAt || item.date) ? new Date(item.createdAt || item.date).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN"),
                    description: item.description || item.note || "",
                    photo: rawPhoto,
                    _needGeocode: needGeocode,
                    reporterName: item.reportedBy?.fullName || item.reporter || "Khách",
                    reporterAvatar: item.reportedBy?.avatar || "",
                    reporterUserId: item.reportedBy?.userId || null
                };
            }).filter(report => !isNaN(report.lat) && !isNaN(report.lng));
        } else {
            reports = [];
        }

        renderReportsPanel();

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


function tr(key, fallback) {
    if (window.translations && window.currentLang && window.translations[window.currentLang]) {
        return window.translations[window.currentLang][key] || fallback;
    }
    return fallback;
}

function createReportCardHTML(report) {
    const statusMap = {
        emergency: { label: tr('rm_tab_emergency', 'Khẩn cấp'), class: 'report-emergency' },
        progress: { label: tr('rm_tab_progress', 'Đang xử lý'), class: 'report-progress' },
        rescued: { label: tr('rm_tab_rescued', 'Đã cứu'), class: 'report-rescued' },
        unknown: { label: tr('rm_tab_all', 'Không rõ'), class: '' }
    };
    const st = statusMap[report.status] || statusMap.emergency;

    const fallbackSrc = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(report.animal) + '&background=0a1c12&color=4ade80&size=128&bold=true';
    const photoSrc = (report.photo && (report.photo.startsWith('http') || report.photo.startsWith('data:image/')))
        ? report.photo
        : fallbackSrc;

    const isCoords = /^-?\d+\.\d+°[NS]/.test(report.location || '');
    const addrText = escapeHtml(report.location || 'Đang xác định...');
    const addressHTML = isCoords
        ? `<i class="fas fa-circle-notch fa-spin" style="font-size:9px;opacity:0.5;"></i> <span data-report-id="${report.id}" style="font-style:italic;color:#94a3b8;">${addrText}</span>`
        : `<span data-report-id="${report.id}">${addrText}</span>`;

    const dateStr = typeof report.date === 'string' ? report.date : new Date(report.date).toLocaleString('vi-VN');

    const descBlock = report.description
        ? `<div style="font-size:12px;color:#94a3b8;font-style:italic;margin-top:6px;padding-left:8px;border-left:2px solid rgba(255,255,255,0.2);">&ldquo;${escapeHtml(report.description)}&rdquo;</div>`
        : '';

    const phoneBlock = report.phone
        ? `<div class="location" style="margin-top:4px;"><i class="fas fa-phone-alt" style="color:#60a5fa;"></i> <a href="tel:${escapeHtml(report.phone)}" style="color:#60a5fa;text-decoration:none;font-weight:600;">${escapeHtml(report.phone)}</a></div>`
        : '';

    const reporter = report.reporterName || tr('rm_reporter_guest', 'Khách');
    const rAvatar = report.reporterAvatar || '';
    const rInitial = reporter.trim().charAt(0).toUpperCase();
    const avatarHtml = (rAvatar && (rAvatar.startsWith('http') || rAvatar.startsWith('/')))
        ? `<img src="${rAvatar}" alt="" style="width:18px;height:18px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='${rInitial}'">`
        : `<div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;">${rInitial}</div>`;

    let currentUserId = null;
    try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            // Ép về String để tránh lỗi so sánh ObjectId vs String
            currentUserId = (userObj.userId || userObj._id || '').toString().trim();
        }
    } catch (e) { }

    // Ép cả reporterUserId về String trước khi so sánh
    const reportOwnerIdStr = report.reporterUserId ? report.reporterUserId.toString().trim() : null;
    const isOwner = !!(currentUserId && reportOwnerIdStr && currentUserId === reportOwnerIdStr);
    const deleteBtnHtml = isOwner ? `<button class="small-btn delete-btn rcard-delete" data-id="${report.id}"><i class="fas fa-trash-alt"></i> Xóa</button>` : '';

    return `
    <div class="report-card ${st.class}" style="background: rgba(6,21,8,0.85); border: 1px solid rgba(255,255,255,0.09);">
        <div class="report-card-main" style="flex: 1; min-width: 0;">
            <img class="report-card-thumb" src="${photoSrc}" alt="${escapeHtml(report.animal)}" onerror="this.onerror=null;this.src='${fallbackSrc}'" style="border: 1px solid rgba(255,255,255,0.12);">
            <div class="report-card-info" style="flex: 1; min-width: 0;">
                <h4 title="${escapeHtml(report.animal)}" style="color: #f8fafc;">${escapeHtml(report.animal)}</h4>
                <span class="status-tag" style="margin-bottom: 6px; display: inline-block;">${st.label}</span>
                <div class="location" style="color: #94a3b8;"><i class="fas fa-map-marker-alt" style="color: #4ade80;"></i> ${addressHTML}</div>
                ${phoneBlock}
                <div class="location" style="margin-top:4px; color: #64748b;"><i class="fas fa-clock"></i> ${escapeHtml(dateStr)}</div>
                ${descBlock}
                <div style="display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.1);">
                    ${avatarHtml}
                    <span style="font-size:11px;color:#64748b;">${tr('rm_card_reporter', 'Đăng bởi: ')}<strong style="color:#94a3b8;">${escapeHtml(reporter)}</strong></span>
                </div>
            </div>
        </div>
        <div class="report-card-actions">
            <button class="small-btn locate-btn rcard-locate" data-id="${report.id}" data-lat="${report.lat}" data-lng="${report.lng}">
                <i class="fas fa-crosshairs"></i> Vị trí 3D
            </button>
            ${deleteBtnHtml}
        </div>
    </div>`;
}

function renderReportsPanel() {
    const container = document.getElementById('reportsPanel');
    if (!container) return;
    container.innerHTML = '';
    const filtered = filterReports();
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:36px 16px;color:#94a3b8;"><i class="fas fa-binoculars" style="font-size:40px;color:rgba(34,197,94,0.28);margin-bottom:12px;display:block;"></i><h3 style="color:#f8fafc;font-size:15px;margin-bottom:6px;">Chưa có báo cáo nào</h3><p style="font-size:12.5px;line-height:1.6;">Nhấn <strong style="color:#f97316;">&#128680; Report Now</strong><br>trên thanh menu để báo cáo!</p></div>';
        return;
    }
    const heading = document.createElement('div');
    heading.style.cssText = 'font-size:12.5px;font-weight:700;color:#4ade80;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;margin-bottom:12px;display:flex;align-items:center;gap:7px;letter-spacing:0.3px;';
    heading.innerHTML = '<i class="fas fa-list-ul" style="opacity:0.7;"></i> Danh sách báo cáo <span style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;border-radius:99px;padding:2px 9px;font-size:10.5px;margin-left:auto;">' + filtered.length + '</span>';
    container.appendChild(heading);

    filtered.forEach(function (report) {
        container.insertAdjacentHTML('beforeend', createReportCardHTML(report));
        var card = container.lastElementChild;
        if (!card) return;

        var locBtn = card.querySelector('.rcard-locate');
        if (locBtn) {
            locBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var rid = locBtn.dataset.id;
                var lat = parseFloat(locBtn.dataset.lat);
                var lng = parseFloat(locBtn.dataset.lng);
                if (isNaN(lat) || isNaN(lng)) { showToast('⚠️ Tọa độ không hợp lệ!', 'error'); return; }
                var orig = locBtn.innerHTML;
                locBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:11px;"></i> Đang bay...';
                locBtn.disabled = true; locBtn.style.opacity = '0.7';
                window.setActiveTab('map');
                function tryOpen(attempts) {
                    var pd = popupDiv || document.getElementById('customPopup');
                    var entity = viewer && viewer.entities.getById('report_' + rid);
                    if (viewer && !viewer.isDestroyed() && entity && pd) {
                        viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(lng, lat, 1200), duration: 2,
                            complete: function () {
                                locBtn.innerHTML = orig; locBtn.disabled = false; locBtn.style.opacity = '1';
                                var html = entity.properties && entity.properties.customHTML
                                    ? (typeof entity.properties.customHTML.getValue === 'function' ? entity.properties.customHTML.getValue() : entity.properties.customHTML)
                                    : null;
                                if (html) {
                                    activeEntity = entity;
                                    pd.innerHTML = html; pd.style.display = 'block';
                                    var cb = pd.querySelector('.close-btn');
                                    if (cb) cb.onclick = function () { pd.style.display = 'none'; activeEntity = null; };
                                    if (entity.point) {
                                        entity.point.pixelSize = new Cesium.ConstantProperty(26);
                                        entity.point.outlineWidth = new Cesium.ConstantProperty(5);
                                        setTimeout(function () { if (entity.point) { entity.point.pixelSize = new Cesium.ConstantProperty(18); entity.point.outlineWidth = new Cesium.ConstantProperty(3); } }, 1500);
                                    }
                                }
                            },
                            cancel: function () { locBtn.innerHTML = orig; locBtn.disabled = false; locBtn.style.opacity = '1'; }
                        });
                    } else if (attempts > 0) {
                        setTimeout(function () { tryOpen(attempts - 1); }, 400);
                    } else {
                        locBtn.innerHTML = orig; locBtn.disabled = false; locBtn.style.opacity = '1';
                        showToast('⚠️ Bản đồ chưa sẵn sàng, thử lại!', 'error');
                    }
                }
                tryOpen(10);
            });
        }

        // --- ĐOẠN ĐÃ ĐƯỢC FIX LỖI BẤM XÓA ---
        var delBtn = card.querySelector('.rcard-delete');
        if (delBtn) {
            delBtn.addEventListener('click', async function (e) {
                e.stopPropagation();
                var id = delBtn.dataset.id;

                // Chặn đứng ngay lập tức nếu bài viết bị lỗi rỗng ID (Nguyên nhân gây ra URL lỗi 404 HTML)
                if (!id || id === 'undefined' || id.trim() === '') {
                    showToast('❌ Báo cáo này bị lỗi dữ liệu (Không có ID gốc) nên không thể xóa!', 'error');
                    return;
                }

                if (confirm('Bạn có chắc chắn muốn xóa báo cáo này khỏi hệ thống?')) {

                    let myUserId = "";
                    try {
                        const me = JSON.parse(localStorage.getItem('currentUser'));
                        // Ép về String để đảm bảo khớp với ownerId lưu trong MongoDB (String)
                        if (me) myUserId = (me.userId || me._id || '').toString().trim();
                    } catch (err) { }

                    console.log('🗑️ [DELETE] Gửi xóa báo cáo ID:', id, '| Với userId:', myUserId);

                    // Validation: Chặn khi không có thông tin user
                    if (!myUserId) {
                        showToast('❌ Bạn chưa đăng nhập hoặc không lấy được thông tin phiên đăng nhập!', 'error');
                        return;
                    }

                    delBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    delBtn.disabled = true;

                    try {
                        // Mã hóa URL để không bị lỗi Fetch Error do khoảng trắng
                        // Fix thêm lỗi "undefined" nếu lỡ bài viết đó chưa có ID
                        const safeId = encodeURIComponent((id || '').toString().trim());
                        const safeUserId = encodeURIComponent((myUserId || '').toString().trim());
                        const url = getApiUrl(`/api/rescuemap/${safeId}?userId=${safeUserId}`);

                        const response = await fetch(url, {
                            method: 'DELETE',
                            headers: { 'Accept': 'application/json' }
                        });

                        // Chống lỗi "Parse JSON" (Tách bạch xem server trả JSON hay HTML Error)
                        const contentType = response.headers.get("content-type");
                        let result;
                        if (contentType && contentType.includes("application/json")) {
                            result = await response.json();
                        } else {
                            const textError = await response.text();
                            console.error("❌ Lỗi Server trả về (Không phải JSON):", textError);
                            throw new Error(`Server trả về HTML lỗi (Status ${response.status}). F12 xem chi tiết.`);
                        }

                        if (response.ok && result.success) {
                            reports = reports.filter(function (r) { return r.id !== id; });
                            renderReportsPanel();
                            if (viewer) renderMarkersToMap(filterReports());
                            showToast('✅ ' + result.message, 'success');
                        } else {
                            showToast('❌ ' + (result.message || 'Không thể xóa báo cáo!'), 'error');
                            delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Xóa';
                            delBtn.disabled = false;
                        }
                    } catch (error) {
                        console.error('🚨 Lỗi hệ thống khi gọi DELETE:', error);
                        // ĐÃ SỬA: In thẳng tên lỗi lên màn hình để dễ dàng biết bệnh
                        showToast(`❌ Lỗi: ${error.message || 'Mất kết nối tới Server'}`, 'error');
                        delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Xóa';
                        delBtn.disabled = false;
                    }
                }
            });
        }
        // -------------------------------------
    });
}


function initRealMap() {
    const mapContainer = document.getElementById("interactiveMap");
    if (!mapContainer) return;

    if (!document.getElementById("cesiumFixStyles")) {
        const style = document.createElement("style");
        style.id = "cesiumFixStyles";
        style.textContent = `
            @media (min-width: 769px) {
                #interactiveMap {
                    position: absolute !important;
                    top: 0 !important; left: 0 !important;
                    width: 100% !important; height: 100% !important;
                    display: block !important;
                    overflow: visible !important;
                }
            }
            @media (max-width: 768px) {
                #interactiveMap {
                    position: relative !important;
                    width: 100% !important;
                    height: calc(65% - 68px - 4px) !important;
                    margin-top: 68px !important;
                    margin-bottom: 4px !important;
                    display: block !important;
                    overflow: visible !important;
                    flex: 0 0 calc(65% - 68px - 4px) !important;
                }
            }
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

    // Cấu hình Terrain an toàn hỗ trợ đa phiên bản Cesium (Chống crash WebGL)
    let terrainConfig = {};
    try {
        terrainConfig = { terrain: Cesium.Terrain.fromWorldTerrain() };
    } catch (e) {
        try { terrainConfig = { terrainProvider: Cesium.createWorldTerrain() }; } catch (err) { }
    }

    viewer = new Cesium.Viewer('interactiveMap', {
        ...terrainConfig,
        animation: false, timeline: false, infoBox: false, selectionIndicator: false,
        baseLayerPicker: false, geocoder: false, homeButton: false, navigationHelpButton: false, sceneModePicker: false,
        fullscreenButton: true, fullscreenElement: 'interactiveMap'
    });

    if (viewer.cesiumWidget.creditContainer) {
        viewer.cesiumWidget.creditContainer.style.display = "none";
    }

    viewer.scene.camera.frustum.far = 100000000;
    // Giới hạn zoom xa (không cho zoom nhỏ trái đất đến mức biến mất)
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 35000000;
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
    // Các style position, top, right đã được chuyển sang CSS để Responsive tốt hơn
    popupDiv.style.backgroundColor = 'transparent';
    popupDiv.style.padding = '0px';
    popupDiv.style.display = 'none';
    popupDiv.style.pointerEvents = 'auto';
    container.appendChild(popupDiv);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties && pickedObject.id.properties.customHTML) {
            activeEntity = pickedObject.id;

            // Hiệu ứng lướt mượt zoom vào map
            viewer.flyTo(activeEntity, {
                duration: 1.5,
                offset: new Cesium.HeadingPitchRange(viewer.camera.heading, -Math.PI / 2.5, 2000)
            });

            const htmlContent = typeof activeEntity.properties.customHTML.getValue === 'function' ? activeEntity.properties.customHTML.getValue() : activeEntity.properties.customHTML;
            popupDiv.innerHTML = htmlContent;
            popupDiv.style.display = 'block';

            const closeBtn = popupDiv.querySelector('.close-btn');
            if (closeBtn) closeBtn.onclick = () => {
                popupDiv.style.display = 'none';
                activeEntity = null;
            };
        } else {
            activeEntity = null;
            if (popupDiv) {
                popupDiv.style.display = 'none';
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function renderMarkersToMap(reportsData) {
    if (!viewer) return;

    viewer.entities.removeAll();
    if (popupDiv) {
        popupDiv.style.display = 'none';
    }

    if (reportsData.length === 0) return;

    const locationCount = {};

    reportsData.forEach(report => {
        let markerColor = Cesium.Color.fromCssColorString('#ef4444');
        let statusText = '🆘 ' + tr('rm_status_text_emergency', 'KHẨN CẤP'); let statusColor = '#dc2626'; let badgeBg = '#fef2f2';

        if (report.status === 'rescued') {
            markerColor = Cesium.Color.fromCssColorString('#22c55e');
            statusText = '🌿 ' + tr('rm_status_text_rescued', 'AN TOÀN'); statusColor = '#16a34a'; badgeBg = '#dcfce7';
        } else if (report.status === 'progress') {
            markerColor = Cesium.Color.fromCssColorString('#3b82f6');
            statusText = '🏃 ' + tr('rm_status_text_progress', 'ĐANG CỨU HỘ'); statusColor = '#0284c7'; badgeBg = '#f0f9ff';
        }

        const hasRealPhoto = report.photo && (report.photo.startsWith('http') || report.photo.startsWith('data:image/'));
        const bgImage = hasRealPhoto
            ? report.photo
            : null;

        const helpersHtml = `
            <div class="detail-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 10px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'" onclick="window.open('https://env4wildlife.org/', '_blank')">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span style="color: #f87171; font-weight: 700;"><i class="fas fa-phone-alt"></i> Hotline ENV (Miễn phí)</span>
                    <i class="fas fa-external-link-alt" style="color: #fca5a5; font-size: 12px;"></i>
                </div>
                <div style="color: #fecaca; font-size: 12px; margin-top: 4px;">📞 <a href="tel:18001522" style="color: #f87171; font-weight: 700; text-decoration: none;" onclick="event.stopPropagation()">1800-1522</a> (Báo cáo vi phạm & Hỗ trợ)</div>
            </div>
        `;

        const clinicHtml = `
            <div class="detail-item" style="flex-direction: column; align-items: flex-start; background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span style="color: #34d399; font-weight: 700;"><i class="fas fa-info-circle"></i> ${tr('rm_card_btn_guide', 'Sơ cứu nhanh')}</span>
                </div>
                <div style="color: #a7f3d0; font-size: 12px; margin-top: 4px;">Giữ yên tĩnh, giữ ấm, KHÔNG tự ý cho ăn uống.</div>
            </div>
        `;

        const popupContent = `
            <div class="rescue-popup dark-glass-theme">
                <button class="close-btn"><i class="fas fa-times"></i></button>
                <div class="rescue-header" style="${bgImage ? `background-image: url('${bgImage}');` : 'background-color: rgba(16, 185, 129, 0.1);'}">
                    ${!bgImage ? `
                    <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;">
                        <div style="text-align:center; opacity:0.8;">
                            <i class="fas fa-paw" style="font-size:40px; color:#34d399;"></i>
                        </div>
                    </div>` : ''}
                    <span class="rescue-badge" style="color: ${statusColor}; background-color: ${badgeBg}; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${statusText}</span>
                    <div class="rescue-title-container">
                        <h2 class="rescue-title"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</h2>
                    </div>
                </div>

                <div class="rescue-details">
                    <div class="detail-section">
                        <div class="detail-title" style="color:#34d399;"><i class="fas fa-map-marker-alt"></i> ĐỊA ĐIỂM CỨU HỘ</div>
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
                        <div class="detail-title" style="color:#fbbf24;"><i class="fas fa-info-circle"></i> MÔ TẢ TÌNH TRẠNG</div>
                        <div class="detail-box" style="font-style: italic; font-size: 13px; color: #cbd5e1; border-left: 3px solid #fbbf24; background: rgba(251, 191, 36, 0.1);">
                            ${escapeHtml(report.description || "Chưa có mô tả chi tiết.")}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <div class="detail-title" style="color:#10b981;"><i class="fas fa-first-aid"></i> HƯỚNG DẪN SƠ CỨU</div>
                        <div class="detail-box" style="padding: 0; background: transparent; border: none;">${clinicHtml}</div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-title" style="color:#60a5fa;"><i class="fas fa-phone-volume"></i> LIÊN HỆ KHẨN CẤP</div>
                        <div class="detail-box" style="padding: 0; background: transparent; border: none;">${helpersHtml}</div>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.2); margin: 15px 0;">
                    <div style="display: flex; gap: 8px; justify-content: space-between;">
                        <button onclick="window.location.href='tel:${report.phone || ''}'" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: transform 0.2s;">
                            <i class="fas fa-phone-volume"></i> ${tr('rm_card_btn_call', 'Gọi liên hệ khẩn cấp')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const locKey = `${report.lat.toFixed(5)}_${report.lng.toFixed(5)}`;
        if (!locationCount[locKey]) locationCount[locKey] = 0;

        const count = locationCount[locKey];
        let renderLat = report.lat;
        let renderLng = report.lng;
        if (count > 0) {
            const offsetRadius = 0.0002;
            const angle = count * (Math.PI / 3);
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

        try {
            // Gọi trực tiếp API OpenStreetMap từ Front-end thay vì gọi qua Server
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&zoom=18&addressdetails=1`);
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

async function submitReport() {
    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) currentUser = JSON.parse(rawUser);
    } catch (e) { }

    if (localStorage.getItem('isLoggedIn') !== 'true' && !currentUser) {
        return showToast("Vui lòng đăng nhập tài khoản trước khi gửi báo cáo!", "error");
    }

    const animalName = document.getElementById("animalName")?.value.trim() || "";
    const animalStatus = document.getElementById("animalStatus")?.value || "emergency";
    const animalDesc = document.getElementById("animalDesc")?.value.trim() || "";

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

    let finalPhotoUrl = capturedPhoto;

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
                finalPhotoUrl = uploadData.secure_url || uploadData.url || uploadData.imageUrl || capturedPhoto;
                console.log("✅ Tải ảnh thành công:", finalPhotoUrl);
            } else {
                console.warn("⚠️ API upload lỗi, tự động chuyển sang lưu ảnh dạng Base64 gốc.");
            }
        } catch (error) {
            console.warn("❌ Lỗi mạng khi gọi API tải ảnh. Tự động chuyển sang lưu Base64.", error);
        }
    }

    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang gửi báo cáo...</span>';

    const payload = {
        animalName: animalName,
        status: animalStatus,
        description: animalDesc,
        location: { lat: currentLocation.lat, lng: currentLocation.lng },
        address: currentAddress || `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`,
        date: new Date().toLocaleString("vi-VN"),
        photo: finalPhotoUrl,
        reporter: currentUser ? currentUser.fullName : "Khách",
        reportedBy: currentUser ? {
            // Ép về String để đảm bảo nhất quán với schema { type: String }
            userId: (currentUser.userId || currentUser._id || '').toString().trim(),
            fullName: currentUser.fullName || 'Khách',
            email: currentUser.email || '',
            avatar: currentUser.avatar || ''
        } : undefined
    };

    try {
        const response = await fetch(getApiUrl('/api/rescuemap'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

            const savedId = result && result.id ? result.id : null;
            const savedPhotoUrl = finalPhotoUrl;

            await closeCameraModal();
            await fetchRescueReports();

            if (savedPhotoUrl && savedId) {
                const newReport = reports.find(r => r.id === savedId);

                if (newReport && !newReport.photo) {
                    try {
                        const patchRes = await fetch(getApiUrl(`/api/rescuemap/${savedId}/photo`), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photo: savedPhotoUrl })
                        });
                        if (patchRes.ok) {
                            newReport.photo = savedPhotoUrl;
                        }
                    } catch (e) { }
                } else if (!newReport) {
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
                            } catch (e) { }
                        }
                    }
                }

                renderReportsPanel();
                if (viewer) renderMarkersToMap(filterReports());
            }

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

window.openCameraModal = async function (e) {
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
    updateReporterInfo();
}

window.closeCameraModal = function () {
    const modal = document.getElementById("cameraModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = '';
    stopCamera();
};

function updateReporterInfo() {
    const wrapper = document.querySelector('.rm-reporter-wrap');
    const avatarEl = document.getElementById('reporterAvatar');
    const nameEl = document.getElementById('reporterName');
    const badgeEl = document.getElementById('reporterBadge');
    const userIdEl = document.getElementById('reporterUserId');
    const fullNameEl = document.getElementById('reporterFullName');
    const emailEl = document.getElementById('reporterEmail');
    const avatarUrlEl = document.getElementById('reporterAvatarUrl');

    if (!wrapper || !avatarEl || !nameEl) return;
    wrapper.style.display = 'flex';

    let user = null;
    try {
        const raw = localStorage.getItem('currentUser');
        if (raw) user = JSON.parse(raw);
    } catch (e) { }

    if (user && (user.fullName || user.userId)) {
        const name = user.fullName || 'Người dùng';
        const avatarUrl = user.avatar || '';
        const initial = name.trim().charAt(0).toUpperCase();

        nameEl.textContent = name;
        if (badgeEl) badgeEl.textContent = user.email || 'Đã đăng nhập';

        if (avatarEl.tagName === 'DIV' || avatarEl.tagName === 'SPAN') {
            if (avatarUrl) {
                avatarEl.innerHTML = `<img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML='${initial}'">`;
            } else {
                avatarEl.textContent = initial;
            }
        } else {
            avatarEl.src = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        }

        if (userIdEl) userIdEl.value = user.userId || '';
        if (fullNameEl) fullNameEl.value = name;
        if (emailEl) emailEl.value = user.email || '';
        if (avatarUrlEl) avatarUrlEl.value = avatarUrl;

    } else {
        nameEl.textContent = 'Khách (Guest)';
        if (badgeEl) badgeEl.textContent = 'Không đăng nhập';
        if (avatarEl.tagName === 'DIV' || avatarEl.tagName === 'SPAN') {
            avatarEl.innerHTML = '<i class="fas fa-user" style="font-size:14px;"></i>';
        } else {
            avatarEl.src = 'https://cdn-icons-png.flaticon.com/512/6522/6522516.png';
        }
    }
}
window.setActiveTab = function (tabId) {
    activeTab = tabId;
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));

    renderReportsPanel();

    if (!viewer) {
        initRealMap();
    } else {
        renderMarkersToMap(filterReports());
        setTimeout(() => { if (viewer && viewer.resize) viewer.resize(); }, 50);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    addToastAnimations();
    // Chặn lỗi sập JS nếu hàm updateNavbarAuth không tồn tại
    // Chặn lỗi sập JS nếu hàm updateNavbarAuth không tồn tại
    if (typeof updateNavbarAuth === 'function') updateNavbarAuth();
    setTimeout(() => { if (typeof Cesium !== "undefined") initRealMap(); }, 500);

    fetchRescueReports();

    document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => window.setActiveTab(btn.dataset.tab)));

    document.getElementById("searchBtn")?.addEventListener("click", () => { searchKeyword = document.getElementById("searchInput").value; window.setActiveTab("map"); renderReportsPanel(); });
    document.getElementById("searchInput")?.addEventListener("keyup", (e) => { if (e.key === "Enter") { searchKeyword = e.target.value; window.setActiveTab("map"); renderReportsPanel(); } });

    document.getElementById("captureBtn")?.addEventListener("click", capturePhoto);
    document.getElementById("retakeBtn")?.addEventListener("click", retakePhoto);
    document.getElementById("submitReportBtn")?.addEventListener("click", submitReport);

    window.addEventListener("click", (e) => {
        if (e.target.id === "cameraModal") window.closeCameraModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            window.closeCameraModal();
        }
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

    window.setActiveTab("all");

    // Re-render when language changes
    const langBtns = document.querySelectorAll('.lang-toggle-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                renderReportsPanel();
                if (viewer) renderMarkersToMap(filterReports());
            }, 100);
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'report') {
        setTimeout(() => {
            if (typeof window.openCameraModal === 'function') {
                window.openCameraModal(new Event('click'));
            }
        }, 800);
    }
});