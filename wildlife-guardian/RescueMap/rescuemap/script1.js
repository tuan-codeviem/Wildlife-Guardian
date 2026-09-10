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
    if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:' || hostname === '') {
        return `http://localhost:3000${path}`;
    }
    return `${window.location.origin}${path}`;
}

// ═══════════════════════════════════════════════════════════════
// REVERSE GEOCODE
// ═══════════════════════════════════════════════════════════════
async function reverseGeocode(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&email=contact@wildlife-guardian.vn`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
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

window.showStatusNoteInput = function(id, newStatus) {
    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) currentUser = JSON.parse(rawUser);
    } catch (e) { }

    if (localStorage.getItem('isLoggedIn') !== 'true' && !currentUser) {
        return showToast("🚨 Cần đăng nhập để cập nhật trạng thái!", "error");
    }

    const btnRow = document.getElementById('status-btn-row-' + id);
    if (!btnRow) return;
    
    if (!btnRow.dataset.originalHtml) {
        btnRow.dataset.originalHtml = btnRow.innerHTML;
    }
    
    const statusText = newStatus === 'emergency' ? 'Khẩn cấp' : (newStatus === 'progress' ? 'Đang cứu hộ' : 'Đã an toàn');
    
    btnRow.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <input type="text" id="status-note-${id}" placeholder="Ghi chú cho trạng thái ${statusText}..." style="padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; font-size: 13px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 8px;">
                <button onclick="window.submitReportStatus('${id}', '${newStatus}')" style="background: #16a34a; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; flex: 1; font-weight: bold; font-size: 12px;">Gửi</button>
                <button onclick="window.cancelStatusInput('${id}')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; flex: 1; font-weight: bold; font-size: 12px;">Hủy</button>
            </div>
        </div>
    `;
    setTimeout(() => {
        const input = document.getElementById(`status-note-${id}`);
        if (input) input.focus();
    }, 50);
};

window.cancelStatusInput = function(id) {
    const btnRow = document.getElementById('status-btn-row-' + id);
    if (btnRow && btnRow.dataset.originalHtml) {
        btnRow.innerHTML = btnRow.dataset.originalHtml;
    }
};

window.submitReportStatus = async function(id, newStatus) {
    try {
        const noteInput = document.getElementById(`status-note-${id}`);
        const note = noteInput ? noteInput.value.trim() : "";

        const btnRow = document.getElementById('status-btn-row-' + id);
        if (btnRow) {
            btnRow.style.opacity = '0.5';
            btnRow.style.pointerEvents = 'none';
        }


        const response = await fetch(getApiUrl(`/api/rescuemap/${id}/status`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, statusNote: note })
        });

        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            throw new Error(`Bạn chưa khởi động lại Server! Vui lòng tắt terminal và chạy lại 'node server.js'`);
        }

        if (response.ok && result.success) {
            showToast("✅ " + result.message, "success");
            if (typeof popupDiv !== 'undefined' && popupDiv) popupDiv.style.display = 'none';
            fetchRescueReports();
        } else {
            showToast("❌ " + (result.message || "Cập nhật thất bại"), "error");
            if (btnRow) {
                btnRow.style.opacity = '1';
                btnRow.style.pointerEvents = 'auto';
            }
        }
    } catch (e) {
        showToast("❌ Lỗi: " + e.message, "error");
        const btnRow = document.getElementById('status-btn-row-' + id);
        if (btnRow) {
            btnRow.style.opacity = '1';
            btnRow.style.pointerEvents = 'auto';
        }
    }
};

window.showRescueMessageInput = function(id, reporterId, animalName, currentStatus, currentNoteEncoded) {
    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) currentUser = JSON.parse(rawUser);
    } catch (e) { }

    if (localStorage.getItem('isLoggedIn') !== 'true' && !currentUser) {
        return showToast("🚨 Cần đăng nhập để gửi tin nhắn cứu trợ!", "error");
    }

    const container = document.getElementById('rescue-msg-container-' + id);
    if (!container) return;
    
    if (!container.dataset.originalHtml) {
        container.dataset.originalHtml = container.innerHTML;
    }
    
    const decodedName = decodeURIComponent(animalName);
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <p style="font-size: 13px; color: #e2e8f0; margin: 0; text-align: center;">Ghi chú gửi người đăng:</p>
            <input type="text" id="rescue-msg-input-${id}" placeholder="Vd: Mình đang ở gần, mình sẽ đến..." style="padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; font-size: 13px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 8px;">
                <button onclick="window.submitRescueMessage('${id}', '${reporterId}', '${animalName}', '${currentStatus}', '${currentNoteEncoded || ''}')" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; flex: 1; font-weight: bold; font-size: 12px;"><i class="fas fa-paper-plane"></i> Gửi</button>
                <button onclick="window.cancelRescueMessageInput('${id}')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; flex: 1; font-weight: bold; font-size: 12px;">Hủy</button>
            </div>
        </div>
    `;
    setTimeout(() => {
        const input = document.getElementById(`rescue-msg-input-${id}`);
        if (input) input.focus();
    }, 50);
};

window.cancelRescueMessageInput = function(id) {
    const container = document.getElementById('rescue-msg-container-' + id);
    if (container && container.dataset.originalHtml) {
        container.innerHTML = container.dataset.originalHtml;
    }
};

window.submitRescueMessage = async function(id, reporterId, animalName, currentStatus, currentNoteEncoded) {
    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) currentUser = JSON.parse(rawUser);
    } catch (e) { }

    const input = document.getElementById(`rescue-msg-input-${id}`);
    const note = input ? input.value.trim() : "";
    if (!note) {
        return showToast("⚠️ Vui lòng nhập nội dung tin nhắn", "warning");
    }

    const container = document.getElementById('rescue-msg-container-' + id);
    if (container) {
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';
    }

    try {
        const decodedName = decodeURIComponent(animalName);
        const text = `[Từ Rescue Map - Báo cáo: ${decodedName}]\n${note}`;
        
        // 1. Gửi tin nhắn nội bộ (nếu báo cáo có tài khoản)
        if (reporterId) {
            await fetch(getApiUrl('/api/messages'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: currentUser.userId || currentUser._id,
                    receiver: reporterId,
                    text: text
                })
            });
        }

        // 2. Cập nhật thêm ghi chú vào báo cáo để hiển thị trên bản đồ
        const decodedCurrentNote = currentNoteEncoded ? decodeURIComponent(currentNoteEncoded) : "";
        const userName = currentUser.fullName || 'Tình nguyện viên';
        const appendedNote = decodedCurrentNote ? decodedCurrentNote + `\n[${userName} sẽ tới cứu]: ${note}` : `[${userName} sẽ tới cứu]: ${note}`;
        
        await fetch(getApiUrl(`/api/rescuemap/${id}/status`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: currentStatus, statusNote: appendedNote })
        });

        showToast("✅ Đã gửi ghi chú đến người đăng!", "success");
        if (container) {
            container.innerHTML = `<p style="color: #34d399; font-size: 13px; text-align: center; margin: 0; padding: 8px;"><i class="fas fa-check-circle"></i> Đã gửi ghi chú</p>`;
            container.style.opacity = '1';
        }
        
        // Cập nhật lại bản đồ để hiện ghi chú mới
        if (typeof fetchRescueReports === 'function') {
            fetchRescueReports();
        }
    } catch (e) {
        console.error("Lỗi gửi tin nhắn:", e);
        showToast("❌ Lỗi gửi tin nhắn", "error");
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            window.cancelRescueMessageInput(id);
        }
    }
};

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
                    reporterUserId: item.reportedBy?.userId || null,
                    statusNote: item.statusNote || ""
                };
            }).filter(report => !isNaN(report.lat) && !isNaN(report.lng));
        } else {
            reports = [];
        }

        renderReportsPanel();

        function tryAddMarkers(attempts) {
            if (viewer) {
                renderMarkersToMap(filterReports());

                // Tự động tìm và zoom nếu có reportId trên URL
                const urlParams = new URLSearchParams(window.location.search);
                const targetReportId = urlParams.get('reportId');
                if (targetReportId) {
                    // Xóa tham số khỏi URL để không bị chạy lại khi refresh
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Chờ một chút để UI render xong
                    setTimeout(() => {
                        let btn = document.querySelector(`.rcard-locate[data-id="${targetReportId}"]`);
                        if (btn) {
                            btn.click();
                        } else {
                            // Nếu đang ở tab khác, chuyển về tab All để hiển thị đầy đủ
                            window.setActiveTab('all');
                            setTimeout(() => {
                                btn = document.querySelector(`.rcard-locate[data-id="${targetReportId}"]`);
                                if (btn) btn.click();
                            }, 300);
                        }
                    }, 500);
                }
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

            // YÊU CẦU: Khi kích vào dấu chấm (marker báo cáo cứu hộ) -> hiển thị ngay bán kính 5m màu đỏ nhạt & truy vấn người cứu trợ xung quanh
            if (activeEntity.id !== 'active_zone_5m' && !activeEntity.id.toString().startsWith('nearby_rescuer_')) {
                let clickLat, clickLng;
                if (activeEntity.properties && activeEntity.properties.reportLat && activeEntity.properties.reportLng) {
                    clickLat = typeof activeEntity.properties.reportLat.getValue === 'function' ? activeEntity.properties.reportLat.getValue() : activeEntity.properties.reportLat;
                    clickLng = typeof activeEntity.properties.reportLng.getValue === 'function' ? activeEntity.properties.reportLng.getValue() : activeEntity.properties.reportLng;
                } else if (activeEntity.position) {
                    const pos = activeEntity.position.getValue(Cesium.JulianDate.now());
                    if (pos) {
                        const carto = Cesium.Cartographic.fromCartesian(pos);
                        clickLat = Cesium.Math.toDegrees(carto.latitude);
                        clickLng = Cesium.Math.toDegrees(carto.longitude);
                    }
                }
                if (clickLat && clickLng) {
                    // Đã tắt tự động quét theo yêu cầu user. Người dùng sẽ bấm nút trong popup.
                }
            }

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

            // YÊU CẦU: Cho phép click vào vị trí bất kỳ trên bản đồ 3D để xác định người cứu trợ gần nhất
            const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const clickLng = Cesium.Math.toDegrees(cartographic.longitude);
                const clickLat = Cesium.Math.toDegrees(cartographic.latitude);

                window.drawRescueZone5m(clickLat, clickLng);
                window.fetchAndRenderNearbyRescuers(clickLat, clickLng, 20000, false);
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

    let myUserId = '';
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) {
            const userObj = JSON.parse(rawUser);
            myUserId = userObj.userId || userObj._id || '';
        }
    } catch (e) { }

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

        const lat = report.lat;
        const lng = report.lng;

        const helpersHtml = `
            <div class="glass-card-item action-blue" onclick="window.drawRescueZone5m(${lat}, ${lng}); window.simulateSOSDispatch(null, '${report.id}', ${lat}, ${lng})">
                <div class="glass-card-header">
                    <span class="text-blue"><i class="fas fa-search-location"></i> Tìm Trạm / Đội Cứu Hộ</span>
                    <i class="fas fa-arrow-right icon-sm"></i>
                </div>
                <div class="glass-card-desc">Phát tín hiệu SOS tìm các điểm hỗ trợ gần nhất xung quanh khu vực này.</div>
            </div>
        `;

        const clinicHtml = `
            <div class="glass-card-item action-green">
                <div class="glass-card-header">
                    <span class="text-green"><i class="fas fa-first-aid"></i> ${tr('rm_card_btn_guide', 'Hướng dẫn sơ cứu')}</span>
                </div>
                <div class="glass-card-desc">Giữ yên tĩnh, giữ ấm, KHÔNG tự ý cho ăn uống.</div>
            </div>
        `;

        const popupContent = `
            <div class="rescue-popup dark-glass-theme">
                <button class="close-btn"><i class="fas fa-times"></i></button>
                <div class="rescue-header" style="${bgImage ? `background-image: url('${bgImage}');` : 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(2, 132, 199, 0.15));'}">
                    <div class="header-overlay"></div>
                    ${!bgImage ? `
                    <div class="header-placeholder">
                        <i class="fas fa-paw"></i>
                    </div>` : ''}
                    <div class="header-content">
                        <span class="rescue-badge" style="color: ${statusColor}; background-color: ${badgeBg};">${statusText}</span>
                        <h2 class="rescue-title">${escapeHtml(report.animal)}</h2>
                    </div>
                </div>

                <div class="rescue-details">
                    <!-- Location Info (Inline) -->
                    <div class="info-row">
                        <div class="info-icon"><i class="fas fa-map-marker-alt text-emerald"></i></div>
                        <div class="info-text">
                            <div class="info-label">Vị trí phát hiện</div>
                            <div class="info-value">${escapeHtml(report.location)}</div>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-icon"><i class="far fa-clock text-amber"></i></div>
                        <div class="info-text">
                            <div class="info-label">Thời gian báo cáo</div>
                            <div class="info-value">${report.date}</div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="desc-box">
                        <p>${escapeHtml(report.description || "Chưa có mô tả chi tiết.")}</p>
                    </div>
                    
                    <!-- Update Status or Rescue Message -->
                    ${(() => {
                        const reporterId = report.reporterUserId ? String(report.reporterUserId) : '';
                        const isAuthor = myUserId && reporterId && String(myUserId) === String(reporterId);
                        
                        if (isAuthor) {
                            return `
                            <div class="status-update-container" style="margin-top: 15px; margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2);">
                                <p style="font-size: 13px; color: #e2e8f0; margin-bottom: 10px; text-align: center; font-weight: 600;">Cập nhật trạng thái báo cáo:</p>
                                <div id="status-btn-row-${report.id}" style="display: flex; gap: 8px; transition: all 0.3s ease;">
                                    ${report.status !== 'emergency' ? `<button class="small-btn" onclick="window.showStatusNoteInput('${report.id}', 'emergency')" style="background: rgba(220, 38, 38, 0.2); border: 1px solid #dc2626; color: #ef4444; padding: 8px 10px; border-radius: 6px; cursor: pointer; flex: 1; font-size: 12px; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Khẩn cấp</button>` : ''}
                                    ${report.status !== 'progress' ? `<button class="small-btn" onclick="window.showStatusNoteInput('${report.id}', 'progress')" style="background: rgba(2, 132, 199, 0.2); border: 1px solid #0284c7; color: #3b82f6; padding: 8px 10px; border-radius: 6px; cursor: pointer; flex: 1; font-size: 12px; font-weight: bold;"><i class="fas fa-running"></i> Đang cứu hộ</button>` : ''}
                                    ${report.status !== 'rescued' ? `<button class="small-btn" onclick="window.showStatusNoteInput('${report.id}', 'rescued')" style="background: rgba(22, 163, 74, 0.2); border: 1px solid #16a34a; color: #22c55e; padding: 8px 10px; border-radius: 6px; cursor: pointer; flex: 1; font-size: 12px; font-weight: bold;"><i class="fas fa-check-circle"></i> Đã an toàn</button>` : ''}
                                </div>
                            </div>`;
                        } else if (myUserId) {
                            return `
                            <div id="rescue-msg-container-${report.id}" class="status-update-container" style="margin-top: 15px; margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2);">
                                <button class="small-btn glow-call-btn" onclick="window.showRescueMessageInput('${report.id}', '${reporterId}', '${encodeURIComponent(report.animal || '')}', '${report.status}', '${encodeURIComponent(report.statusNote || '')}')" style="width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                                    <i class="fas fa-hands-helping"></i> Sẽ tới cứu
                                </button>
                            </div>`;
                        } else {
                            return `
                            <div class="status-update-container" style="margin-top: 15px; margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); text-align: center;">
                                <p style="font-size: 12px; color: #94a3b8; margin: 0;">(Đăng nhập để tham gia cứu hộ)</p>
                            </div>`;
                        }
                    })()}

                    ${report.statusNote ? `
                    <!-- Status Note -->
                    <div class="info-row" style="margin-top: -5px; margin-bottom: 15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border-left: 3px solid ${statusColor};">
                        <div class="info-icon"><i class="fas fa-clipboard-list" style="color: ${statusColor};"></i></div>
                        <div class="info-text">
                            <div class="info-label">Ghi chú trạng thái</div>
                            <div class="info-value" style="font-style: italic;">${escapeHtml(report.statusNote)}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Action Cards -->
                    <div class="action-cards-container">
                        ${clinicHtml}
                        ${helpersHtml}
                    </div>
                    
                    <!-- Call Button -->
                    <button class="glow-call-btn" onclick="window.location.href='tel:${report.phone || ''}'">
                        <i class="fas fa-phone-volume"></i> ${tr('rm_card_btn_call', 'Gọi liên hệ khẩn cấp')}
                    </button>
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
            properties: { customHTML: popupContent, reportLat: renderLat, reportLng: renderLng, reportId: report.id }
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

    if (currentLocation && currentLocation.lat && currentLocation.lng) {
        // Không tìm kiếm tự động ở đây nữa
    } else {
        // Nếu chưa có tọa độ (đang fetch), thử lấy ngay lập tức
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            }, () => {
                // Fallback mặc định
                currentLocation = currentLocation || { lat: 16.0545, lng: 108.2171 };
            }, { enableHighAccuracy: true, timeout: 5000 });
        }
    }
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
            // Sử dụng Nominatim API theo yêu cầu
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&zoom=18&addressdetails=1&email=contact@wildlife-guardian.vn`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
            const data = await res.json();
            
            if (data && data.address) {
                const a = data.address;
                const parts = [
                    a.house_number,
                    a.road || a.pedestrian || a.footway,
                    a.suburb || a.neighbourhood || a.quarter,
                    a.city || a.town || a.county || a.state
                ].filter(Boolean);
                currentAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`);
            } else {
                currentAddress = data.display_name || `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
            }
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
    const lastReportTime = localStorage.getItem('lastReportTime');
    if (lastReportTime) {
        const timeDiff = Date.now() - parseInt(lastReportTime);
        if (timeDiff < 30000) {
            const secondsLeft = Math.ceil((30000 - timeDiff) / 1000);
            return showToast(`⏳ Vui lòng đợi ${secondsLeft} giây trước khi gửi báo cáo tiếp theo!`, "error");
        }
    }

    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser');
        if (rawUser) currentUser = JSON.parse(rawUser);
    } catch (e) { }

    const animalStatus = document.getElementById("animalStatus")?.value || "emergency";

    // YÊU CẦU 1: Nhóm 1 (Khẩn cấp/emergency) -> BỎ QUA ĐĂNG NHẬP, cho phép đăng ngay.
    //            Nhóm 2 (Đang xử lý/progress hoặc Đã an toàn/rescued) -> BẮT BUỘC ĐĂNG NHẬP.
    if (animalStatus !== 'emergency') {
        if (localStorage.getItem('isLoggedIn') !== 'true' && !currentUser) {
            return showToast("🚨 Trạng thái 'Đang xử lý / Đã an toàn' yêu cầu đăng nhập tài khoản trước khi gửi báo cáo!", "error");
        }
    }

    const animalName = document.getElementById("animalName")?.value.trim() || "";
    const animalDesc = document.getElementById("animalDesc")?.value.trim() || "";
    const phone = document.getElementById("reporterPhone")?.value.trim() || "";

    if (!animalName) {
        return showToast("Vui lòng nhập tên động vật!", "error");
    }
    if (!phone) {
        return showToast("Vui lòng nhập số điện thoại liên hệ!", "error");
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
        phone: phone,
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
            localStorage.setItem('lastReportTime', Date.now().toString());
            showToast("✅ Báo cáo đã được lưu lên bản đồ!", "success");

            let savedId = result && (result._id || result.id) ? String(result._id || result.id) : null;
            const savedPhotoUrl = finalPhotoUrl;

            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }

            // Đóng modal trước
            window.closeCameraModal();

            // Lấy dữ liệu mới nhất (chờ xử lý xong)
            await fetchRescueReports();

            // Fallback: nếu API server không trả về ID, lấy ID mới nhất vừa được tải về
            if (!savedId && reports.length > 0) {
                savedId = reports[0].id;
            }

            // Tự động bay camera tới vị trí vừa báo cáo và mở bảng thông tin
            if (viewer && currentLocation && savedId) {
                window.setActiveTab("map");
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(currentLocation.lng, currentLocation.lat, 1200),
                    duration: 2,
                    complete: function () {
                        const entity = viewer.entities.getById(`report_${savedId}`);
                        if (entity && typeof popupDiv !== 'undefined' && popupDiv) {
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

window.openCameraModal = async function (e, preselectedStatus = null) {
    window._reportSubmittedInCurrentSession = false;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const modal = document.getElementById("cameraModal");
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = 'hidden';

    document.getElementById("animalName").value = "";
    document.getElementById("animalDesc").value = "";
    if (preselectedStatus) {
        const statusEl = document.getElementById("animalStatus");
        if (statusEl) statusEl.value = preselectedStatus;
    }
    document.getElementById("previewSection").style.display = "none";

    const sosDispatch = document.getElementById("sosDispatchSection");
    if (sosDispatch) sosDispatch.style.display = "none";

    document.getElementById("captureBtn").style.display = "flex";
    document.getElementById("retakeBtn").style.display = "none";
    document.getElementById("locationInfo").style.display = "none";

    const previewImg = document.getElementById("previewImg");
    if (previewImg) previewImg.style.display = "none";

    capturedPhoto = null; currentLocation = null; currentAddress = "";

    video = document.getElementById("video"); video.style.display = "block";
    document.getElementById("scanOverlay").style.display = "flex";
    document.getElementById("captureBtn").innerHTML = '<i class="fas fa-camera"></i> Chụp ảnh';

    updateReporterInfo();
    await initCamera();
    await fetchLocationAndAddress();
}

window.closeCameraModal = function () {
    const modal = document.getElementById("cameraModal");
    if (modal) {
        modal.classList.remove("open");
        modal.style.display = '';
    }
    document.body.style.overflow = '';
    stopCamera();
};

window.openPrioritySelectModal = function (e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const modal = document.getElementById("prioritySelectModal");
    if (modal) {
        modal.classList.add("open");
        document.body.style.overflow = 'hidden';
    } else {
        window.openCameraModal(e, 'emergency');
    }
};

window.closePrioritySelectModal = function () {
    const modal = document.getElementById("prioritySelectModal");
    if (modal) {
        modal.classList.remove("open");
        document.body.style.overflow = '';
    }
};

window.selectReportPriority = function (status) {
    // Nếu là progress hoặc rescued -> kiểm tra đăng nhập trước
    if (status !== 'emergency') {
        let currentUser = null;
        try {
            const raw = localStorage.getItem('currentUser');
            if (raw) currentUser = JSON.parse(raw);
        } catch (e) { }
        if (localStorage.getItem('isLoggedIn') !== 'true' && !currentUser) {
            window.closePrioritySelectModal();
            showToast("🚨 Trạng thái 'Đang xử lý / Đã an toàn' yêu cầu đăng nhập trước. Đang chuyển tới trang Đăng nhập...", "error");
            sessionStorage.setItem("redirectAfterLogin", window.location.href);
            setTimeout(() => {
                window.location.href = "../../Auth/login.html";
            }, 1500);
            return;
        }
    }

    window.closePrioritySelectModal();
    window.openCameraModal(null, status);
};

// YÊU CẦU 2: Vẽ vòng tròn khoanh vùng 5m (Light Red) hỗ trợ cả Cesium và Leaflet L.circle
window.drawRescueZone5m = function (lat, lng) {
    if (!lat || !lng) return;
    // 1. Hỗ trợ Cesium 3D Globe
    if (typeof viewer !== 'undefined' && viewer) {
        try {
            const oldEntity = viewer.entities.getById('active_zone_5m');
            if (oldEntity) viewer.entities.remove(oldEntity);
            const oldPing = viewer.entities.getById('active_zone_5m_ping');
            if (oldPing) viewer.entities.remove(oldPing);
        } catch (e) { }

        // Vẽ vòng tròn cố định 5m
        viewer.entities.add({
            id: 'active_zone_5m',
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            ellipse: {
                semiMinorAxis: 5.0, // 5 mét
                semiMajorAxis: 5.0, // 5 mét
                material: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.2), // Đỏ nhạt
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#ef4444'),
                outlineWidth: 3
            }
        });

        // Vẽ hiệu ứng sóng radar quét (ping)
        let pingRadius = 0.1;
        viewer.entities.add({
            id: 'active_zone_5m_ping',
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            ellipse: {
                semiMinorAxis: new Cesium.CallbackProperty(() => {
                    pingRadius += 0.08;
                    if (pingRadius >= 5.0) pingRadius = 0.1;
                    return pingRadius;
                }, false),
                semiMajorAxis: new Cesium.CallbackProperty(() => {
                    return pingRadius;
                }, false),
                material: new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(() => {
                    return Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.6 * (1.0 - (pingRadius / 5.0)));
                }, false))
            }
        });

        // Zoom camera gần lại để thấy rõ vòng bán kính 5m màu đỏ nhạt
        try {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lng, lat, 70),
                duration: 1.2
            });
        } catch (e) { }
    }
    // 2. Hỗ trợ Leaflet 2D L.circle (theo yêu cầu đề bài)
    if (typeof L !== 'undefined' && window.leafletMap) {
        L.circle([lat, lng], {
            radius: 5, // Bán kính 5 mét
            color: '#ef4444',
            weight: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.35
        }).addTo(window.leafletMap);
    }
};

// YÊU CẦU 3: Truy vấn và hiển thị Người cứu trợ gần đây (Nearby Rescuers trong bán kính 5m)
window.fetchAndRenderNearbyRescuers = async function (lat, lng, radiusMeters = 5, updateModalUI = false) {
    if (radiusMeters === 5) radiusMeters = 50000; // Tự động mở rộng bán kính lên 50km để tìm thấy dữ liệu

    const nearbyBox = document.getElementById("nearbyRescuersBox");
    const nearbyList = document.getElementById("nearbyRescuersList");

    if (updateModalUI && nearbyBox && nearbyList) {
        nearbyBox.style.display = "block";
        nearbyList.innerHTML = `
            <div style="color: #ef4444; font-size: 13px; font-weight: bold; padding: 6px 0; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-satellite-dish fa-spin"></i> Khởi động quét radar tại hiện trường...
            </div>`;

        await new Promise(resolve => setTimeout(resolve, 1200));

        nearbyList.innerHTML = `
            <div style="color: #38bdf8; font-size: 13px; font-weight: bold; padding: 6px 0; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-search-location fa-beat"></i> Quét bán kính 10km tìm Trạm thú y / Cứu trợ...
            </div>`;

        await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
        // Delay để hiệu ứng radar trên bản đồ chạy một lúc trước khi hiển thị kết quả
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
        let rescuers = [];
        try {
            const url = getApiUrl(`/api/rescuers/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                rescuers = data.data || [];
            }
        } catch (apiErr) {
            console.warn("Không thể tải rescuers từ API, sử dụng dữ liệu mặc định.");
        }

        // Dùng API OpenStreetMap (Overpass API) để tự động tìm trạm thú y / cứu hộ có thật quanh vị trí sự cố
        let dynamicRescuers = [];
        try {
            // lệnh này là sẽ vẽ 1 hình tròn mờ bao quanh dấu chấm đó
            console.log("Đang tìm trạm thú y thật trên bản đồ OpenStreetMap...");
            const overpassQuery = `
                [out:json][timeout:10];
                (
                  node["amenity"="veterinary"](around:50000,${lat},${lng});
                  node["amenity"="animal_shelter"](around:50000,${lat},${lng});
                  node["shop"="pet"](around:50000,${lat},${lng});
                );
                out center 10;
            `;
            const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: "data=" + encodeURIComponent(overpassQuery),
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (osmRes.ok) {
                const osmData = await osmRes.json();
                if (osmData && osmData.elements && osmData.elements.length > 0) {
                    dynamicRescuers = osmData.elements.map(el => {
                        const tags = el.tags || {};
                        let name = tags.name || "";
                        if (!name) {
                            if (tags.amenity === 'veterinary') name = 'Phòng khám Thú y';
                            else if (tags.shop === 'pet') name = 'Cửa hàng Thú cưng';
                            else name = 'Trạm cứu hộ động vật';
                        }

                        let address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:province"]].filter(Boolean).join(", ");
                        if (!address) address = "Chưa rõ địa chỉ cụ thể";

                        return {
                            _id: "osm_" + el.id,
                            fullName: name,
                            address: address,
                            phone: tags.phone || tags["contact:phone"] || "N/A",
                            location: { coordinates: [el.lon, el.lat] },
                            status: "active",
                            website: tags.website || tags["contact:website"] || "",
                            openingHours: tags.opening_hours || ""
                        };
                    });
                }
            }
        } catch (err) {
            console.warn("Lỗi khi fetch Overpass API:", err);
        }

        // Đã xóa fallback ENV theo yêu cầu của user

        let allRescuers = [...rescuers, ...dynamicRescuers];

        // Tính khoảng cách cho từng trạm
        allRescuers.forEach(r => {
            const rLat = r.location?.coordinates?.[1] || lat;
            const rLng = r.location?.coordinates?.[0] || lng;
            r.distanceKm = calculateDistance(lat, lng, rLat, rLng);
        });

        // Lọc trùng theo tên và giữ lại những trạm gần nhất
        const uniqueRescuers = [];
        const seenNames = new Set();
        for (const r of allRescuers) {
            const nameKey = r.fullName.toLowerCase().trim();
            if (!seenNames.has(nameKey)) {
                seenNames.add(nameKey);
                uniqueRescuers.push(r);
            }
        }

        // Sắp xếp theo khoảng cách và chọn 2 trạm gần nhất
        uniqueRescuers.sort((a, b) => a.distanceKm - b.distanceKm);
        rescuers = uniqueRescuers.slice(0, 2);
        window.nearestRescuer = rescuers.length > 0 ? rescuers[0] : null;

        // Tự động chuyển đổi tọa độ thành địa chỉ thật (Reverse Geocoding) cho những trạm thiếu thông tin
        for (const r of rescuers) {
            if (!r.address || r.address === "Chưa rõ địa chỉ cụ thể") {
                const rLat = r.location?.coordinates?.[1];
                const rLng = r.location?.coordinates?.[0];
                if (rLat && rLng && typeof reverseGeocode === 'function') {
                    try {
                        const realAddr = await reverseGeocode(rLat, rLng);
                        if (realAddr && !realAddr.includes("undefined")) {
                            r.address = realAddr;
                        }
                    } catch (e) { }
                }
            }
        }

        if (updateModalUI && nearbyBox && nearbyList) {
            if (rescuers.length > 0) {
                const nearestDistance = rescuers[0].distanceKm;
                if (nearestDistance > 10) {
                    nearbyBox.querySelector(".rm-nearby-header span").innerHTML = `⚠️ Không có trạm thú y nào trong bán kính 10km!`;
                } else {
                    nearbyBox.querySelector(".rm-nearby-header span").innerHTML = `🚨 Tìm thấy ${rescuers.length} Trạm cứu hộ / thú y gần nhất!`;
                }

                nearbyList.innerHTML = rescuers.map(r => `
                    <div class="rm-rescuer-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 12px; margin-top:6px; font-size:12.5px; color:#e2e8f0;">
                        <div style="flex: 1; padding-right: 8px;">
                            <b style="color: #38bdf8; display: block; margin-bottom: 3px;"><i class="fas fa-clinic-medical"></i> ${escapeHtml(r.fullName)}</b>
                            <div style="font-size: 11px; color: #f87171; margin-bottom: 2px; font-weight: bold;"><i class="fas fa-route"></i> Cách: ${formatDistance(r.distanceKm)}</div>
                            ${r.phone && r.phone !== 'N/A' && r.phone !== 'Chưa cập nhật SĐT' ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">📞 SĐT: ${escapeHtml(r.phone)}</div>` : ''}
                            ${r.address ? `<div style="font-size: 11px; color: #64748b; line-height: 1.3;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(r.address)}</div>` : ''}
                        </div>
                        <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;">🟢 ${r.status === 'active' ? 'Sẵn sàng' : r.status}</span>
                    </div>
                `).join('');
            } else {
                nearbyBox.querySelector(".rm-nearby-header span").innerHTML = `⚠️ Không có trạm thú y nào trong bán kính 10km!`;
                nearbyList.innerHTML = `<div style="color: #cbd5e1; font-size: 12.5px; padding: 4px 0;">Không tìm thấy trạm thú y hoặc cứu hộ nào xung quanh khu vực này. Đội phản ứng nhanh sẽ tiếp nhận tọa độ khi bạn gửi báo cáo.</div>`;
            }
        }

        if (rescuers.length > 0) {
            showToast(`🎯 Hiển thị Trạm cứu hộ gần nhất: ${formatDistance(rescuers[0].distanceKm)}!`, "success");
            
            // Di chuyển camera tới vị trí trạm cứu hộ gần nhất (Bug 1 fix)
            if (typeof viewer !== 'undefined' && viewer && rescuers[0].location && rescuers[0].location.coordinates) {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(rescuers[0].location.coordinates[0], rescuers[0].location.coordinates[1], 800),
                    duration: 1.5
                });
            }

            rescuers.forEach((rescuer, idx) => {
                const rLat = rescuer.location?.coordinates?.[1] || lat;
                const rLng = rescuer.location?.coordinates?.[0] || lng;

                if (typeof viewer !== 'undefined' && viewer) {
                    const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M24 2C15.163 2 8 9.163 8 18c0 14.156 16 30 16 30s16-15.844 16-30c0-8.837-7.163-16-16-16z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/><circle cx="24" cy="18" r="11" fill="#ffffff"/><path d="M24 11v14M17 18h14" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/></svg>';
                    const customHTMLContent = `<div class="rescue-popup dark-glass-theme" style="padding:16px; min-width: 280px; max-width: 340px; border-top: 4px solid #ef4444; border-radius: 12px; font-family: 'Outfit', sans-serif;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                    <h4 style="color:#f87171; font-size:16px; margin:0;"><i class="fas fa-first-aid"></i> CỨU HỘ GẦN NHẤT</h4>
                                    <button class="close-btn" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:16px; margin-top:-5px;"><i class="fas fa-times"></i></button>
                                </div>
                                <h3 style="color:#ffffff; margin-top:0; margin-bottom:12px; font-size:17px; font-weight:700; line-height: 1.3;">${escapeHtml(rescuer.fullName || 'Trạm thú y / Cứu hộ')}</h3>
                                
                                <div style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px; margin-bottom: 15px;">
                                    <div style="font-size:14px; font-weight:bold; color:#fca5a5; margin-bottom:6px; display: flex; align-items: center; gap: 6px;"><i class="fas fa-route"></i> Khoảng cách: ${formatDistance(rescuer.distanceKm)}</div>
                                    ${rescuer.address ? `<div style="font-size:12px; color:#cbd5e1; line-height:1.4; display: flex; gap: 6px; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color:#fbbf24; margin-top:2px; min-width: 14px;"></i> <span>${escapeHtml(rescuer.address)}</span></div>` : ''}
                                </div>
                                
                                ${rescuer.phone && rescuer.phone !== 'N/A' && rescuer.phone !== 'Chưa cập nhật SĐT' ? `
                                    <a href="tel:${escapeHtml(rescuer.phone)}" style="display:flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration:none; padding: 12px; border-radius: 8px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: transform 0.2s;">
                                        <i class="fas fa-phone-volume"></i> GỌI KHẨN CẤP: ${escapeHtml(rescuer.phone)}
                                    </a>
                                ` : ''}
                                
                                <div style="display: flex; gap: 10px; margin-bottom: 4px;">
                                    ${rescuer.openingHours ? `<div style="flex:1; font-size:12px; color:#94a3b8;"><i class="fas fa-clock" style="color:#a78bfa;"></i> Giờ mở cửa: <br/> <b style="color:#cbd5e1;">${escapeHtml(rescuer.openingHours)}</b></div>` : ''}
                                    ${rescuer.website ? `<div style="flex:1; font-size:12px;"><i class="fas fa-globe" style="color:#60a5fa;"></i> Trang web: <br/> <a href="${escapeHtml(rescuer.website)}" target="_blank" style="color:#60a5fa; text-decoration:none; font-weight: bold;">Truy cập link</a></div>` : ''}
                                </div>
                                
                                <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                                    <span style="font-size:12px; font-weight: 600; padding: 4px 12px; background: rgba(16, 185, 129, 0.2); color:#34d399; border-radius: 12px; border: 1px solid rgba(16,185,129,0.3);">🟢 ${rescuer.status === 'active' ? 'Sẵn sàng hỗ trợ 24/7' : rescuer.status}</span>
                                </div>
                            </div>`;

                    const newEntity = viewer.entities.add({
                        id: `nearby_rescuer_${rescuer._id || idx}_${Math.random()}`,
                        position: Cesium.Cartesian3.fromDegrees(rLng, rLat),
                        billboard: {
                            image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgIcon),
                            width: 36,
                            height: 36,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        },
                        properties: {
                            customHTML: customHTMLContent
                        }
                    });

                    // Tự động hiển thị popup cho người cứu trợ gần nhất nếu người dùng chủ động bấm tìm (updateModalUI = true)
                    if (updateModalUI && idx === 0 && typeof popupDiv !== 'undefined' && popupDiv) {
                        // Delay nhẹ để đè lên popup mặc định (nếu có)
                        setTimeout(() => {
                            activeEntity = newEntity;
                            popupDiv.innerHTML = customHTMLContent;
                            popupDiv.style.display = 'block';

                            if (typeof viewer !== 'undefined' && viewer) {
                                viewer.flyTo(newEntity, {
                                    duration: 1.5,
                                    offset: new Cesium.HeadingPitchRange(viewer.camera.heading, -Math.PI / 2.5, 2000)
                                });
                            }

                            const closeBtn = popupDiv.querySelector('.close-btn');
                            if (closeBtn) {
                                closeBtn.onclick = () => { popupDiv.style.display = 'none'; activeEntity = null; };
                            }
                        }, 300);
                    }
                }
            });
        }
    } catch (e) {
        console.warn("Lỗi khi tải danh sách người cứu trợ gần đây:", e);
        if (updateModalUI && nearbyList) {
            nearbyList.innerHTML = `<div style="color: #f87171; font-size: 12px;">Có lỗi khi khoanh vùng.</div>`;
        }
    }
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

// ==========================================
// MÔ PHỎNG ĐIỀU PHỐI SOS (UBER FOR RESCUE)
// ==========================================
window.simulateSOSDispatch = async function(savedPhotoUrl, savedId, lat, lng) {
    // 0. Bật Modal nếu đang tắt (để gọi từ popup bản đồ)
    const cameraModal = document.getElementById("cameraModal");
    if (cameraModal) {
        cameraModal.classList.add("open");
        cameraModal.style.display = '';
    }

    const viewfinder = document.getElementById("cameraViewfinder");
    if (viewfinder) viewfinder.style.display = "none";
    
    // 1. Chuyển UI sang màn hình Radar
    const previewSec = document.getElementById("previewSection");
    if (previewSec) previewSec.style.display = "none";

    const sosSec = document.getElementById("sosDispatchSection");
    if (sosSec) sosSec.style.display = "flex";

    const sosTitle = document.getElementById("sosDispatchTitle");
    if (sosTitle) sosTitle.textContent = "Đang phát sóng tín hiệu SOS...";

    const sosSub = document.getElementById("sosDispatchSubtitle");
    if (sosSub) sosSub.textContent = "Hệ thống đang quét các Trạm thú y và Đội cứu hộ trong bán kính 10km.";

    const matchCard = document.getElementById("sosMatchCard");
    if (matchCard) matchCard.style.display = "none";

    // 2. Fetch danh sách báo cáo ngầm
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
        if (typeof viewer !== 'undefined' && viewer) renderMarkersToMap(filterReports());
    }

    // 3. Thực hiện fetch người cứu trợ và delay đếm ngược (đang quét)
    if (lat && lng) {
        await window.fetchAndRenderNearbyRescuers(lat, lng, 5, true);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Đã tìm thấy người cứu trợ -> Hiển thị kết quả
    if (sosTitle) sosTitle.textContent = "Đã tìm thấy Đội cứu trợ!";
    if (sosSub) sosSub.textContent = "Tín hiệu SOS của bạn đã được tiếp nhận thành công.";

    const matchName = document.getElementById("sosMatchName");
    const matchAddress = document.getElementById("sosMatchAddress");
    const matchEta = document.getElementById("sosMatchEta");

    if (window.nearestRescuer) {
        if (matchName) matchName.textContent = window.nearestRescuer.fullName;
        if (matchAddress) matchAddress.innerHTML = `<i class="fas fa-map-marker-alt"></i> ` + escapeHtml(window.nearestRescuer.address || "Đang xác định");
        const dist = window.nearestRescuer.distanceKm || 5;
        const eta = Math.max(5, Math.round(dist * 3)); // Trung bình 3 phút / km
        if (matchEta) matchEta.textContent = eta + " phút";
    } else {
        if (matchName) matchName.textContent = "Đội Phản Ứng Nhanh (Kiểm Lâm)";
        if (matchAddress) matchAddress.innerHTML = `<i class="fas fa-map-marker-alt"></i> Trạm Kiểm Lâm Khu Vực`;
        if (matchEta) matchEta.textContent = "15 phút";
    }

    if (matchCard) matchCard.style.display = "block";
    window._lastSubmittedId = savedId;
    window._reportSubmittedInCurrentSession = true;
}

window.finishSOSDispatch = function () {
    window.closeCameraModal();
}