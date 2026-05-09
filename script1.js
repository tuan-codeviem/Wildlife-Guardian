
let reports = [
  { id: 1, animal: "Injured Fox", location: "Central Park, Hanoi", status: "emergency", lat: 21.0285, lng: 105.8542, date: "2025-04-28" },
  { id: 2, animal: "Stray Cat (leg wound)", location: "District 3, Ho Chi Minh", status: "emergency", lat: 10.8231, lng: 106.6297, date: "2025-04-27" },
  { id: 3, animal: "Seagull with broken wing", location: "Da Nang Beach", status: "progress", lat: 16.0544, lng: 108.2022, date: "2025-04-26" },
  { id: 4, animal: "Rabbit rescued", location: "Vinh Ecolake", status: "rescued", lat: 18.6796, lng: 105.6817, date: "2025-04-25" },
  { id: 5, animal: "Python caught in net", location: "Can Tho River", status: "progress", lat: 10.0452, lng: 105.7469, date: "2025-04-27" },
  { id: 6, animal: "Deer hit by vehicle", location: "Ba Vi National Park", status: "emergency", lat: 21.0789, lng: 105.3609, date: "2025-04-28" },
  { id: 7, animal: "Pelican oil spill", location: "Quy Nhon shore", status: "progress", lat: 13.7679, lng: 109.2138, date: "2025-04-24" },
  { id: 8, animal: "Hedgehog safe", location: "Sapa town", status: "rescued", lat: 22.3355, lng: 103.8541, date: "2025-04-23" }
];

const helpers = [
  { name: "Dr. Minh Nguyen", role: "Veterinarian", verified: true, contact: "0912 345 678", phone: "0912 345 678" },
  { name: "Thu Tran", role: "Wildlife Rescue", verified: true, contact: "0988 765 432", phone: "0988 765 432" },
  { name: "Hai Le", role: "Animal Transport", verified: false, contact: "0933 221 144", phone: "0933 221 144" }
];

const clinics = [
  { name: "Hanoi Animal Hospital", type: "Veterinary Clinic", lat: 21.0285, lng: 105.8542, phone: "024 1234 567" },
  { name: "HCMC Wildlife Rescue Center", type: "Rescue Center", lat: 10.8231, lng: 106.6297, phone: "028 7654 321" },
  { name: "Da Nang Vet Clinic", type: "Clinic", lat: 16.0544, lng: 108.2022, phone: "0236 9876 54" },
  { name: "Can Tho Animal Care", type: "Clinic", lat: 10.0452, lng: 105.7469, phone: "0292 123 456" }
];

let activeTab = "all";
let searchKeyword = "";
let map = null;
let markersLayer = null;

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if(m === '&') return '&amp;';
    if(m === '<') return '&lt;';
    if(m === '>') return '&gt;';
    return m;
  });
}

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

function initRealMap() {
  const mapContainer = document.getElementById("interactiveMap");
  if (!mapContainer) return;
  
  if (map) {
    map.remove();
  }
  
  map = L.map('interactiveMap').setView([14.0583, 108.2772], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);
  
  markersLayer = L.layerGroup().addTo(map);
  updateMapMarkers();
}

function updateMapMarkers() {
  if (!markersLayer) return;
  
  markersLayer.clearLayers();
  const filteredReports = filterReports();
  
  if (filteredReports.length === 0) {
    const emptyPopup = L.popup()
      .setLatLng([14.0583, 108.2772])
      .setContent('📭 No animal reports in this area. Be the first to report!')
      .openOn(map);
    
    setTimeout(() => {
      map.closePopup(emptyPopup);
    }, 3000);
    return;
  }
  
  filteredReports.forEach(report => {
    let markerColor = '#d62828'; 
    if (report.status === 'rescued') markerColor = '#2a9d8f'; 
    else if (report.status === 'progress') markerColor = '#3b82f6';
    
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${markerColor}; 
                    width: 20px; height: 20px; border-radius: 50%; 
                    border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    cursor: pointer;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
    
    const marker = L.marker([report.lat, report.lng], { icon: markerIcon }).addTo(markersLayer);
    
    const statusText = report.status === 'emergency' ? '🚨 EMERGENCY' : 
                       report.status === 'progress' ? '⏳ In Progress' : '✅ Rescued';
    const statusColor = report.status === 'emergency' ? '#d62828' : 
                        report.status === 'progress' ? '#f4a261' : '#2a9d8f';
    
    const popupContent = `
      <div style="min-width: 200px; font-family: 'Segoe UI', sans-serif;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${statusColor};">
          🐾 ${escapeHtml(report.animal)}
        </div>
        <div style="font-size: 13px; margin-bottom: 5px;">
          <i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${escapeHtml(report.location)}
        </div>
        <div style="font-size: 13px; margin-bottom: 10px;">
          <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 20px; font-size: 11px;">
            ${statusText}
          </span>
        </div>
        <hr style="margin: 8px 0;">
        <div style="display: flex; gap: 8px; justify-content: space-between;">
          <button onclick="window.contactRescuer('${escapeHtml(report.animal)}')" style="background: #256f5b; color: white; border: none; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 12px;">
            📞 Contact Rescuer
          </button>
          <button onclick="window.updateReportStatusFromMap(${report.id})" style="background: #eef2ff; color: #1e5a4a; border: none; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 12px;">
            ✏️ Update Status
          </button>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
  });
  
  if (filteredReports.length === 1) {
    map.setView([filteredReports[0].lat, filteredReports[0].lng], 12);
  } else if (filteredReports.length > 1) {
    const bounds = filteredReports.map(r => [r.lat, r.lng]);
    map.fitBounds(bounds);
  }
}

function createReportCardHTML(report) {
  let statusDisplay = "";
  let statusIcon = "";
  if (report.status === "emergency") {
    statusDisplay = "🚨 Emergency";
    statusIcon = "🔴";
  } else if (report.status === "progress") {
    statusDisplay = "⏳ In Progress";
    statusIcon = "🟡";
  } else {
    statusDisplay = "✅ Rescued";
    statusIcon = "🟢";
  }
  
  return `
    <div class="report-card ${report.status}" data-report-id="${report.id}">
      <div class="card-header">
        <span class="animal-name"><i class="fas fa-paw"></i> ${escapeHtml(report.animal)}</span>
        <span class="status-tag">${statusIcon} ${statusDisplay}</span>
      </div>
      <div class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(report.location)}</div>
      <div class="action-buttons">
        <button class="small-btn contact-card-btn" data-animal="${escapeHtml(report.animal)}">
          <i class="fas fa-phone-alt"></i> Contact
        </button>
        <button class="small-btn update-card-btn" data-id="${report.id}">
          <i class="fas fa-clinic-medical"></i> Update status
        </button>
        <button class="small-btn locate-btn" data-lat="${report.lat}" data-lng="${report.lng}" data-animal="${escapeHtml(report.animal)}">
          <i class="fas fa-location-dot"></i> Locate on map
        </button>
      </div>
    </div>
  `;
}
function attachCardEvents() {
  // Contact buttons
  document.querySelectorAll('.contact-card-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleContactClick);
    btn.addEventListener('click', window.handleContactClick);
  });
  
  // Update buttons
  document.querySelectorAll('.update-card-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleUpdateClick);
    btn.addEventListener('click', window.handleUpdateClick);
  });
  
  // Locate buttons
  document.querySelectorAll('.locate-btn').forEach(btn => {
    btn.removeEventListener('click', window.handleLocateClick);
    btn.addEventListener('click', window.handleLocateClick);
  });
}

window.handleContactClick = function(e) {
  e.stopPropagation();
  const animal = this.dataset.animal;
  window.contactRescuer(animal);
};

window.handleUpdateClick = function(e) {
  e.stopPropagation();
  const id = parseInt(this.dataset.id);
  window.updateReportStatusFromMap(id);
};

window.handleLocateClick = function(e) {
  e.stopPropagation();
  const lat = parseFloat(this.dataset.lat);
  const lng = parseFloat(this.dataset.lng);
  const animal = this.dataset.animal;
  
  window.setActiveTab('map');
  setTimeout(() => {
    if (map && markersLayer) {
      map.setView([lat, lng], 14);
      markersLayer.eachLayer(layer => {
        const layerLatLng = layer.getLatLng();
        if (Math.abs(layerLatLng.lat - lat) < 0.0001 && 
            Math.abs(layerLatLng.lng - lng) < 0.0001) {
          layer.openPopup();
        }
      });
    }
  }, 300);
};

// ========== RENDER FUNCTIONS ==========
function renderReportsPanel() {
  const container = document.getElementById("reportsPanel");
  if (!container) return;
  
  const filtered = filterReports();
  
  // Map tab
  if (activeTab === "map") {
    container.innerHTML = `
      <div class="empty-msg" style="text-align: center; padding: 20px;">
        <i class="fas fa-map-marked-alt" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
        <strong>🗺️ Map View Active</strong><br>
        Click on markers to see animal details.<br>
        <span style="font-size: 12px; color: #666;">📌 ${filtered.length} reports on map</span>
      </div>
    `;
    if (filtered.length > 0) {
      container.innerHTML += `<div style="margin-top: 15px;"><strong>📋 Quick list (${filtered.length} reports):</strong></div>`;
      filtered.forEach(r => {
        container.innerHTML += createReportCardHTML(r);
      });
    }
    attachCardEvents();
    return;
  }
  
  // List tab
  if (activeTab === "list") {
    container.innerHTML = `<div style="margin-bottom: 12px; font-weight: 600;"><i class="fas fa-list-ul"></i> All Reports (${filtered.length})</div>`;
    if (filtered.length === 0) {
      container.innerHTML += `<div class="empty-msg"><i class="fas fa-paw"></i> No reports found.</div>`;
    } else {
      filtered.forEach(r => {
        container.innerHTML += createReportCardHTML(r);
      });
    }
    attachCardEvents();
    return;
  }
  
  // Other tabs (All, Emergency, Progress, Rescued)
  const tabTitle = activeTab === 'all' ? '📋 All Reports' : 
                   activeTab === 'emergency' ? '🚨 Emergency Cases' : 
                   activeTab === 'progress' ? '🔄 In Progress' : '✅ Rescued Animals';
  
  container.innerHTML = `<div style="margin-bottom: 10px; font-weight: 600;">${tabTitle} (${filtered.length})</div>`;
  
  if (filtered.length === 0) {
    container.innerHTML += `<div class="empty-msg"><i class="far fa-frown"></i> No ${activeTab} cases at the moment.</div>`;
    return;
  }
  
  filtered.forEach(r => {
    container.innerHTML += createReportCardHTML(r);
  });
  
  attachCardEvents();
}

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
        <p>${escapeHtml(h.role)} ${h.verified ? '<span class="verified"><i class="fas fa-check-circle"></i> Verified</span>' : '<span style="opacity:0.6;">📞 Unverified</span>'}</p>
      </div>
      <button class="contact-btn helper-contact" data-phone="${h.phone}" data-name="${h.name}">
        <i class="fas fa-phone"></i> Contact
      </button>
    `;
    const btn = card.querySelector(".helper-contact");
    btn.addEventListener("click", () => {
      alert(`📱 Contact ${h.name} (${h.role}): ${h.contact}\n📞 Call: ${h.phone}`);
    });
    helpersDiv.appendChild(card);
  });
}

// ========== UI CONTROL FUNCTIONS ==========
window.setActiveTab = function(tabId) {
  activeTab = tabId;
  
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  if (tabId === "map") {
    renderReportsPanel();
    if (!map) {
      initRealMap();
    } else {
      map.invalidateSize();
      updateMapMarkers();
    }
  } else {
    renderReportsPanel();
    if (map && markersLayer) {
      updateMapMarkers();
    }
  }
  
  renderNearbyHelpers();
};

function handleSearch() {
  const input = document.getElementById("searchInput");
  searchKeyword = input?.value || "";
  renderReportsPanel();
  if (map && markersLayer) {
    updateMapMarkers();
  }
}

// ========== GLOBAL FUNCTIONS (window) ==========
window.contactRescuer = function(animalName) {
  alert(`📞 Contacting rescue team for ${animalName}...\nHotline: 1900 1234 (24/7 animal rescue)`);
};

window.updateReportStatusFromMap = function(reportId) {
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const newStatus = prompt(
    `Update status for "${report.animal}":\nChoose:\n1 - emergency\n2 - progress\n3 - rescued`,
    report.status
  );
  
  let statusValue = newStatus?.toLowerCase();
  if (statusValue === '1' || statusValue === 'emergency') statusValue = 'emergency';
  else if (statusValue === '2' || statusValue === 'progress') statusValue = 'progress';
  else if (statusValue === '3' || statusValue === 'rescued') statusValue = 'rescued';
  else statusValue = null;
  
  if (statusValue && ["emergency", "progress", "rescued"].includes(statusValue)) {
    report.status = statusValue;
    renderReportsPanel();
    updateMapMarkers();
    alert(`✅ Status updated to ${statusValue.toUpperCase()}!`);
  } else if (newStatus) {
    alert("Invalid status. Please use: emergency, progress, rescued");
  }
};

// ========== DISTANCE & CLINIC FUNCTIONS ==========
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

function findNearestClinic(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;
  
  clinics.forEach(clinic => {
    const distance = calculateDistance(lat, lng, clinic.lat, clinic.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...clinic, distance: distance.toFixed(1) };
    }
  });
  
  return nearest;
}

window.callNearestClinic = function(phoneNumber, clinicName) {
  alert(`🏥 ${clinicName}\n📞 Phone: ${phoneNumber}\n\n🚑 Emergency team will be dispatched to your location!`);
};

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  // Check if Leaflet is loaded
  if (typeof L !== 'undefined') {
    initRealMap();
  } else {
    console.error("Leaflet not loaded");
  }
  
  renderReportsPanel();
  renderNearbyHelpers();
  
  // Tab listeners
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      window.setActiveTab(btn.dataset.tab);
    });
  });
  
  // Search listeners
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (searchInput) searchInput.addEventListener("keyup", (e) => { 
    if(e.key === "Enter") handleSearch(); 
  });
  
  // Set initial active tab
  window.setActiveTab("all");
});