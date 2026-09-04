/* ═══════════════════════════════════════════════════════════════════
   WILDLIFE GUARDIAN – SpeciesLibarary.js  ·  v3.0 HOLOGRAPHIC
   Features:
     - Render Cards (Premium Unlocked / Glassmorphism Locked)
     - 3D Tilt Effect on Premium Cards (mouse-tracking)
     - Animated Gradient Border (CSS-driven)
     - Shimmer Badge
     - Holographic Modal open / close with smooth animations
     - Bento Box Stagger (fade-up one by one)
     - Filter & Search
     - Scroll Reveal (IntersectionObserver)
═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. MOCK DATA
  // ==========================================
  let speciesData = [];

  // ==========================================
  // 2. RENDER GALLERY
  // ==========================================
  const grid = document.getElementById("speciesGrid");

  function renderCards(dataArray) {
    grid.innerHTML = "";

    // Update hero count
    const countEl = document.getElementById('speciesCountNum');
    const totalEl = document.getElementById('totalSpeciesCount');
    if (countEl) countEl.textContent = dataArray.length;
    if (totalEl) totalEl.textContent = dataArray.length + ' species found';

    if (dataArray.length === 0) {
      grid.innerHTML = `
        <div class="sl-empty-state">
          <span class="sl-empty-icon">🦕</span>
          <h3>No species found</h3>
          <p>Try a different search term or category</p>
        </div>`;
      return;
    }

    // Sort: Unlocked (premium) first
    const sorted = [...dataArray].sort((a, b) =>
      a.isUnlocked === b.isUnlocked ? 0 : a.isUnlocked ? -1 : 1
    );

    // Placeholder images by category
    const catPlaceholders = {
      mammal:    'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=300&fit=crop',
      bird:      'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop',
      reptile:   'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=400&h=300&fit=crop',
      amphibian: 'https://images.unsplash.com/photo-1566076137-f51a57c7e0b5?w=400&h=300&fit=crop',
      fish:      'https://images.unsplash.com/photo-1534082753625-78c1f2abb7d7?w=400&h=300&fit=crop',
      insect:    'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&h=300&fit=crop',
    };
    const defaultPlaceholder = 'https://images.unsplash.com/photo-1446329813274-7c9036bd9a1f?w=400&h=300&fit=crop';

    sorted.forEach((animal, idx) => {
      const card = document.createElement("div");
      
      const lang = (localStorage.getItem("appLang") || "EN").toLowerCase();
      const name = animal.animalName[lang];
      const category = animal.category[lang];

      const catKey = (animal.category.en || '').toLowerCase().replace(/s$/, '');
      const thumbUrl = animal.thumbnailUrl || catPlaceholders[catKey] || defaultPlaceholder;
      
      let statusText = category;
      let statusClass = "en";
      if (animal.status) {
        statusText = animal.status[lang];
        const enStatus = animal.status.en.toLowerCase();
        if (enStatus.includes("critically")) statusClass = "ce";
        else if (enStatus.includes("endangered")) statusClass = "en";
        else if (enStatus.includes("vulnerable")) statusClass = "vu";
        else if (enStatus.includes("near") || enStatus.includes("threatened")) statusClass = "nt";
        else statusClass = "lc";
      }

      if (animal.isUnlocked) {
        /* ── PREMIUM CARD ── */
        card.className = "sl-card premium-card wg-reveal";
        card.dataset.index = idx;
        card.innerHTML = `
          <div class="card-img-wrap">
            <img src="${thumbUrl}" alt="${name}" loading="lazy" onerror="this.src='${defaultPlaceholder}'" />
          </div>
          <div class="card-overlay"></div>
          <div class="card-top">
            <span class="status-tag ${statusClass}">${statusText}</span>
            <div class="premium-badge">✨ 3D</div>
          </div>
          <div class="card-inner">
            <div class="card-body">
              <span class="card-cat">${category}</span>
              <h3 class="card-title">${name}</h3>
              <p class="card-sci">${animal.scientificName}</p>
              <div class="card-cta"><i class="fa-solid fa-cube"></i> View 3D Model →</div>
            </div>
          </div>
        `;
        attach3DTilt(card);

      } else {
        /* ── LOCKED CARD ── */
        card.className = "sl-card standard-card wg-reveal";
        card.innerHTML = `
          <div class="card-img-wrap">
            <img src="${thumbUrl}" alt="${name}" loading="lazy" onerror="this.src='${defaultPlaceholder}'" />
          </div>
          <div class="card-overlay"></div>
          <div class="card-top">
            <span class="status-tag ${statusClass}">${statusText}</span>
          </div>
          <div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>
          <div class="card-inner">
            <div class="card-body">
              <span class="card-cat">${category}</span>
              <h3 class="card-title">${name}</h3>
              <p class="card-sci">${animal.scientificName}</p>
              <div class="card-cta"><i class="fa-solid fa-gamepad"></i> Play to unlock →</div>
            </div>
          </div>
        `;
      }

      card.addEventListener("click", () => openBentoModal(animal));
      grid.appendChild(card);
    });

    initScrollReveal();
  }

  async function initLibrary() {
    try {
      // Load from local animals.json (local preview mode)
      const res = await fetch(`../scripts/animals.json`);
      speciesData = await res.json();

      // 2. Lấy trạng thái mở khóa của User (nếu có đăng nhập)
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const userId = currentUser._id || currentUser.userId || currentUser.id;

        const API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3000' : location.origin;
        const unlockRes = await fetch(`${API_BASE_URL}/api/users/${userId}/unlocked`);
        const unlockData = await unlockRes.json();
        
        if (unlockData.success && unlockData.unlockedSpecies) {
          speciesData.forEach(animal => {
            animal.isUnlocked = unlockData.unlockedSpecies.includes(animal.speciesId);
          });
        } else {
          speciesData.forEach(animal => animal.isUnlocked = false);
        }
      } else {
        // Chưa đăng nhập thì khóa hết
        speciesData.forEach(animal => animal.isUnlocked = false);
      }

      // 3. Render
      renderCards(speciesData);
    } catch (e) {
      console.error("Lỗi khởi tạo thư viện:", e);
      renderCards(speciesData);
    }
  }

  // Chạy hàm khởi tạo
  initLibrary();


  // ==========================================
  // 3. 3D TILT EFFECT (Premium Cards only)
  //    Mouse-tracking rotateX / rotateY
  // ==========================================
  function attach3DTilt(card) {
    const INTENSITY = 12; // max degrees of tilt

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      const rotX = -dy * INTENSITY;
      const rotY =  dx * INTENSITY;

      card.style.transform = `
        perspective(800px)
        rotateX(${rotX}deg)
        rotateY(${rotY}deg)
        scale3d(1.04, 1.04, 1.04)
      `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `
        perspective(800px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
      `;
      card.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
    });

    card.addEventListener("mouseenter", () => {
      // Remove the slow transition when entering so tilt feels live
      card.style.transition = "transform 0.1s linear, box-shadow 0.4s ease";
    });
  }


  // ==========================================
  // 4. FILTER & SEARCH
  // ==========================================
  let currentCategory = "All";
  let currentSearch   = "";

  const filterBtns  = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("searchInput");

  function applyFilters() {
    const lang = (localStorage.getItem("appLang") || "EN").toLowerCase();
    const filtered = speciesData.filter(a => {
      // Check if Category string includes the keyword (e.g. "Mammals" vs "Mammal")
      const catMatches = currentCategory === "All" || a.category.en.toLowerCase().includes(currentCategory.toLowerCase().replace('s',''));
      const nameMatches = a.animalName[lang].toLowerCase().includes(currentSearch);
      return catMatches && nameMatches;
    });
    renderCards(filtered);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.cat;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Lắng nghe sự kiện đổi ngôn ngữ để render lại toàn bộ thẻ
  const langBtns = document.querySelectorAll(".lang-toggle-btn");
  langBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Đợi localStorage cập nhật xong từ script language_EN_VI
      setTimeout(() => {
        applyFilters();
      }, 50);
    });
  });

  // ==========================================
  // 5. HOLOGRAPHIC MODAL – OPEN / CLOSE
  // ==========================================
  const modalOverlay = document.getElementById("bentoModalOverlay");
  const closeBtn     = document.getElementById("closeBentoModal");
  const modalHero    = document.getElementById("modalHero");

  // Bento text targets
  const bmStatus    = document.getElementById("bmStatus");
  const bmName      = document.getElementById("bmName");
  const bmScientific= document.getElementById("bmScientific");
  const bmHabitat   = document.getElementById("bmHabitat");
  const bmFoundIn   = document.getElementById("bmFoundIn");
  const bmDiet      = document.getElementById("bmDiet");
  const bmBehavior  = document.getElementById("bmBehavior");
  const bmFunFact   = document.getElementById("bmFunFact");

  function openBentoModal(animal) {
    const lang = (localStorage.getItem("appLang") || "EN").toLowerCase();
    
    let statusText = animal.category[lang];
    let statusClass = "en";
    if (animal.status) {
        statusText = animal.status[lang];
        const enStatus = animal.status.en.toLowerCase();
        if (enStatus.includes("critically")) statusClass = "ce";
        else if (enStatus.includes("endangered")) statusClass = "en";
        else if (enStatus.includes("vulnerable")) statusClass = "vu";
        else if (enStatus.includes("near") || enStatus.includes("threatened")) statusClass = "nt";
        else statusClass = "lc";
    }

    // ── Populate text ──
    bmStatus.textContent = statusText;
    bmStatus.className   = `status-badge ${statusClass}`;
    if (typeof getStatusColor === "function") {
        bmStatus.style.background = getStatusColor(statusClass);
    }
    bmName.textContent      = animal.animalName[lang];
    bmScientific.textContent= animal.scientificName;
    bmHabitat.textContent   = animal.habitat[lang];
    bmFoundIn.textContent   = animal.distribution[lang];
    bmDiet.textContent      = animal.diet[lang];
    bmBehavior.textContent  = animal.behavior[lang];
    bmFunFact.textContent   = animal.funFact[lang];

    // ── Hero injection ──
    modalHero.innerHTML = "";

    if (animal.isUnlocked) {
      // 3D model-viewer – MUST fill container via CSS
      modalHero.innerHTML = `
        <model-viewer
          src="${animal.model3dUrl}"
          alt="${animal.animalName[lang]} 3D Model"
          auto-rotate
          camera-controls
          rotation-per-second="20deg"
          shadow-intensity="1.2"
          environment-image="neutral">
        </model-viewer>
      `;
    } else {
      // Locked 2D view
      modalHero.innerHTML = `
        <img src="${animal.thumbnailUrl}" alt="${animal.animalName[lang]}" class="locked-hero-img" />
        <div class="locked-cta-wrap">
          <span class="locked-cta-label">🔒 3D View Locked</span>
          <button class="locked-cta-btn"
            onclick="window.location.href='../Game/GameUnity.html'">
            <i class="fa-solid fa-gamepad"></i>
            Play Rescue Game to unlock
          </button>
        </div>
      `;
    }

    // ── Show overlay ──
    modalOverlay.classList.add("show");
    document.body.style.overflow = "hidden"; // prevent background scroll

    // ── Stagger Bento boxes ──
    triggerBentoStagger();
  }

  function closeModal() {
    modalOverlay.classList.remove("show");
    document.body.style.overflow = "";

    // Clean up 3D model after transition ends to free memory
    setTimeout(() => {
      if (modalHero) modalHero.innerHTML = "";
      // Reset bento boxes for next open
      resetBentoBoxes();
    }, 400);
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  window.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Keyboard ESC
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });


  // ==========================================
  // 6. BENTO STAGGER (Fade-up one by one)
  // ==========================================
  function triggerBentoStagger() {
    // Includes both regular bento-box and bento-header-box
    const boxes = document.querySelectorAll(".bento-info-grid .bento-box, .bento-header-box");

    // Reset first
    boxes.forEach(box => {
      box.classList.remove("bento-animated");
      // Force inline for header box which isn't .bento-box
      if (!box.classList.contains("bento-box")) {
        box.style.opacity = "0";
        box.style.transform = "translateY(24px)";
        box.style.transition = "none";
      }
    });

    // Stagger each box with increasing delay
    boxes.forEach((box, i) => {
      const delay = i * 90; // ms between each box

      setTimeout(() => {
        box.classList.add("bento-animated");
        // Also handle header-box which is outside .bento-box styling
        if (!box.classList.contains("bento-box")) {
          box.style.opacity    = "1";
          box.style.transform  = "translateY(0)";
          box.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1),
                                   transform 0.55s cubic-bezier(0.16,1,0.3,1)`;
        }
      }, delay);
    });
  }

  function resetBentoBoxes() {
    const boxes = document.querySelectorAll(".bento-box");
    boxes.forEach(box => {
      box.classList.remove("bento-animated");
    });
    // Reset header box
    const headerBox = document.querySelector(".bento-header-box");
    if (headerBox) {
      headerBox.style.opacity   = "";
      headerBox.style.transform = "";
      headerBox.style.transition= "";
    }
  }


  // ==========================================
  // 7. SCROLL REVEAL (IntersectionObserver)
  // ==========================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll(".wg-reveal");

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.08 });

    reveals.forEach(el => obs.observe(el));

    // Immediately reveal elements already in viewport
    setTimeout(() => {
      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight) el.classList.add("active");
      });
    }, 80);
  }

  initScrollReveal();


  // ==========================================
  // 8. HELPERS
  // ==========================================
  function getStatusColor(statusClass) {
    const map = {
      ce:  "#dc2626",
      en:  "#f97316",
      vu:  "#eab308",
      lc:  "#3b82f6",
      nt:  "#0d9488",
    };
    return map[statusClass] || "#64748b";
  }

}); // end DOMContentLoaded
