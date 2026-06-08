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
  const speciesData = [
    {
      name: "Asian Elephant",
      scientificName: "Elephas Maximus",
      status: "Endangered",
      statusClass: "en",
      category: "Mammals",
      isUnlocked: true,
      image: "https://i.natgeofe.com/k/63b1a8a7-0081-493e-8b53-81d01261ab5d/red-panda-full-body_square.jpg",
      modelUrl: "model-viewer/ngon-redpanda.glb",
      habitat: "Tropical forests, grasslands, and scrublands across South and Southeast Asia",
      behavior: "Highly social animals living in family groups led by a matriarch. Known for their intelligence and memory.",
      foundIn: "Vietnam, Thailand, India, Sri Lanka",
      diet: "Herbivore – grasses, leaves, bark, roots, and fruits. Can consume up to 150 kg of vegetation daily.",
      funFact: "Elephants can communicate using seismic vibrations through the ground!"
    },
    {
      name: "Indochinese Tiger",
      scientificName: "Panthera tigris corbetti",
      status: "Critically Endangered",
      statusClass: "ce",
      category: "Mammals",
      isUnlocked: false,
      image: "https://images.squarespace-cdn.com/content/v1/657b302ad0d11e71b22b40c3/80395f24-f05d-49c6-98e8-9ff4a4e7d623/photo_954.jpg",
      modelUrl: "",
      habitat: "Tropical and subtropical moist broadleaf forests of Southeast Asia",
      behavior: "Solitary and territorial. Primarily nocturnal hunters that stalk prey silently.",
      diet: "Carnivore – deer, wild pigs, and occasionally larger prey like buffalo.",
      foundIn: "Vietnam, Cambodia, Laos, Thailand",
      funFact: "No two tigers have the same stripe pattern – they're like fingerprints!"
    },
    {
      name: "Green Sea Turtle",
      scientificName: "Chelonia mydas",
      status: "Vulnerable",
      statusClass: "vu",
      category: "Reptiles",
      isUnlocked: true,
      image: "https://static.vecteezy.com/system/resources/thumbnails/071/755/687/small_2x/close-up-of-green-sea-turtle-swimming-in-aquarium-at-daytime-free-video.jpg",
      modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb",
      habitat: "Tropical and subtropical ocean waters, coral reefs, and seagrass beds",
      diet: "Herbivore – primarily seagrass and algae as adults.",
      behavior: "Migratory, traveling long distances between feeding and nesting grounds.",
      foundIn: "Pacific Ocean, Indian Ocean, Atlantic Ocean",
      funFact: "They can hold their breath for up to 5 hours while sleeping underwater!"
    },
    {
      name: "Red-crowned Crane",
      scientificName: "Grus Japonensis",
      status: "Critically Endangered",
      statusClass: "ce",
      category: "Birds",
      isUnlocked: false,
      image: "https://s3.animalia.bio/animals/photos/full/original/shutterstock-1043519431jpg.webp",
      modelUrl: "",
      habitat: "Wetlands, marshes, and riverbanks in East Asia",
      diet: "Omnivore – fish, amphibians, insects, plants, and grains.",
      behavior: "Known for elaborate courtship dances. Mate for life and both parents care for young.",
      foundIn: "Japan, China, Korea, Russia",
      funFact: "In Japanese culture, they symbolize luck, longevity, and fidelity!"
    },
    {
      name: "Great White Shark",
      scientificName: "Carcharodon carcharias",
      status: "Vulnerable",
      statusClass: "vu",
      category: "Fish",
      isUnlocked: false,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRX0fspKR6qR0hzEA4OGG5VmwEd9Nscsn-zAY2IA_ibK8Fgr69UXxtgxy02A77uTJG5cMl7Dk0zYGChz8vH_U4ecNtDnRIyPcRo0rZ1k74&s=10",
      modelUrl: "",
      habitat: "Coastal and offshore waters with temperatures between 12 and 24 °C.",
      behavior: "Highly migratory and curious predators. Often investigate objects by biting them.",
      diet: "Carnivore – marine mammals, fish, and seabirds.",
      foundIn: "Global coastal waters",
      funFact: "They can detect a single drop of blood in 100 liters of water!"
    }
  ];

  // ==========================================
  // 2. RENDER GALLERY
  // ==========================================
  const grid = document.getElementById("speciesGrid");

  function renderCards(dataArray) {
    grid.innerHTML = "";

    // Sort: Unlocked (premium) first
    const sorted = [...dataArray].sort((a, b) =>
      a.isUnlocked === b.isUnlocked ? 0 : a.isUnlocked ? -1 : 1
    );

    sorted.forEach((animal, idx) => {
      const card = document.createElement("div");

      if (animal.isUnlocked) {
        /* ── PREMIUM CARD ── */
        // HTML NOTE: class="sl-card premium-card wg-reveal"
        card.className = "sl-card premium-card wg-reveal";
        card.dataset.index = idx;
        card.innerHTML = `
          <div class="card-inner">
            <div class="card-img-wrap">
              <span class="status-tag ${animal.statusClass}">${animal.status}</span>
              <div class="premium-badge">🌟 3D Unlocked</div>
              <img src="${animal.image}" alt="${animal.name}" loading="lazy" />
            </div>
            <div class="card-body">
              <span class="card-cat">${animal.category}</span>
              <h3 class="card-title">${animal.name}</h3>
              <p class="card-sci">${animal.scientificName}</p>
            </div>
          </div>
        `;
        // Attach 3D Tilt
        attach3DTilt(card);

      } else {
        /* ── LOCKED CARD ── */
        // HTML NOTE: class="sl-card standard-card wg-reveal"
        card.className = "sl-card standard-card wg-reveal";
        card.innerHTML = `
          <div class="card-img-wrap">
            <span class="status-tag ${animal.statusClass}">${animal.status}</span>
            <div class="locked-overlay"><i class="fa-solid fa-lock"></i></div>
            <img src="${animal.image}" alt="${animal.name}" loading="lazy" />
          </div>
          <div class="card-body">
            <span class="card-cat">${animal.category}</span>
            <h3 class="card-title">${animal.name}</h3>
            <p class="card-sci">${animal.scientificName}</p>
            <div class="locked-text">
              🎮 Play game to unlock 3D Hologram
            </div>
          </div>
        `;
      }

      card.addEventListener("click", () => openBentoModal(animal));
      grid.appendChild(card);
    });

    initScrollReveal();
  }

  renderCards(speciesData);


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
    const filtered = speciesData.filter(a => {
      const matchCat    = currentCategory === "All" || a.category === currentCategory;
      const matchSearch = a.name.toLowerCase().includes(currentSearch);
      return matchCat && matchSearch;
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
    // ── Populate text ──
    bmStatus.textContent = animal.status;
    bmStatus.className   = `status-badge ${animal.statusClass}`;
    bmStatus.style.background = getStatusColor(animal.statusClass);
    bmName.textContent      = animal.name;
    bmScientific.textContent= animal.scientificName;
    bmHabitat.textContent   = animal.habitat;
    bmFoundIn.textContent   = animal.foundIn;
    bmDiet.textContent      = animal.diet;
    bmBehavior.textContent  = animal.behavior;
    bmFunFact.textContent   = animal.funFact;

    // ── Hero injection ──
    modalHero.innerHTML = "";

    if (animal.isUnlocked) {
      // 3D model-viewer – MUST fill container via CSS
      modalHero.innerHTML = `
        <model-viewer
          src="${animal.modelUrl}"
          alt="${animal.name} 3D Model"
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
        <img src="${animal.image}" alt="${animal.name}" class="locked-hero-img" />
        <div class="locked-cta-wrap">
          <span class="locked-cta-label">🔒 3D View Locked</span>
          <button class="locked-cta-btn"
            onclick="window.location.href='../Game/Main/Game/GameUnity.html'">
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
    };
    return map[statusClass] || "#64748b";
  }

}); // end DOMContentLoaded
