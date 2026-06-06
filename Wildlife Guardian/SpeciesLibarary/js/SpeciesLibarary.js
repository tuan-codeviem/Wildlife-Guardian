/* ═══════════════════════════════════════════════════════
   WILDLIFE GUARDIAN – SpeciesLibarary.js (PREMIUM)
   Handles Unified Modal, Sorting, Filtering, and Scroll Reveal
═══════════════════════════════════════════════════════ */

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
      isUnlocked: true, // UNLOCKED
      image: "https://i.natgeofe.com/k/63b1a8a7-0081-493e-8b53-81d01261ab5d/red-panda-full-body_square.jpg",
      modelUrl: "model-viewer/ngon-redpanda.glb",
      habitat: "Tropical forests, grasslands, and scrublands across South and Southeast Asia",
      behavior: "Highly social animals living in family groups led by a matriarch. Known for their intelligence and memory.",
      foundIn: "Vietnam, Thailand, India, Sri Lanka",
      diet: "Herbivore - grasses, leaves, bark, roots, and fruits. Can consume up to 150kg of vegetation daily.",
      funFact: "Elephants can communicate using seismic vibrations through the ground!"
    },
    {
      name: "Indochinese Tiger",
      scientificName: "Panthera tigris corbetti",
      status: "Critically Endangered",
      statusClass: "ce",
      category: "Mammals",
      isUnlocked: false, // LOCKED
      image: "https://images.squarespace-cdn.com/content/v1/657b302ad0d11e71b22b40c3/80395f24-f05d-49c6-98e8-9ff4a4e7d623/photo_954.jpg",
      modelUrl: "",
      habitat: "Tropical and subtropical moist broadleaf forests of Southeast Asia",
      behavior: "Solitary and territorial. Primarily nocturnal hunters that stalk prey silently.",
      diet: "Carnivore - deer, wild pigs, and occasionally larger prey like buffalo.",
      foundIn: "Vietnam, Cambodia, Laos, Thailand",
      funFact: "No two tigers have the same stripe pattern - they're like fingerprints!"
    },
    {
      name: "Green Sea Turtle",
      scientificName: "Chelonia mydas",
      status: "Vulnerable",
      statusClass: "vu",
      category: "Reptiles",
      isUnlocked: true, // UNLOCKED
      image: "https://static.vecteezy.com/system/resources/thumbnails/071/755/687/small_2x/close-up-of-green-sea-turtle-swimming-in-aquarium-at-daytime-free-video.jpg",
      modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb",
      habitat: "Tropical and subtropical ocean waters, coral reefs, and seagrass beds",
      diet: "Herbivore - primarily seagrass and algae as adults.",
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
      isUnlocked: false, // LOCKED
      image: "https://s3.animalia.bio/animals/photos/full/original/shutterstock-1043519431jpg.webp",
      modelUrl: "",
      habitat: "Wetlands, marshes, and riverbanks in East Asia",
      diet: "Omnivore - fish, amphibians, insects, plants, and grains.",
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
      diet: "Carnivore - marine mammals, fish, and seabirds.",
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

    // Sort logic: Unlocked first
    const sortedData = [...dataArray].sort((a, b) => {
      return (a.isUnlocked === b.isUnlocked) ? 0 : a.isUnlocked ? -1 : 1;
    });

    sortedData.forEach(animal => {
      const card = document.createElement("div");

      // Card Setup based on gamification state
      if (animal.isUnlocked) {
        card.className = "sl-card premium-card wg-reveal";
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
      } else {
        card.className = "sl-card standard-card wg-reveal";
        card.innerHTML = `
          <div class="card-img-wrap">
            <span class="status-tag ${animal.statusClass}">${animal.status}</span>
            <img src="${animal.image}" alt="${animal.name}" loading="lazy" />
          </div>
          <div class="card-body">
            <span class="card-cat">${animal.category}</span>
            <h3 class="card-title">${animal.name}</h3>
            <p class="card-sci">${animal.scientificName}</p>
            <div class="locked-text">
              <i class="fa-solid fa-gamepad"></i> Play game to unlock 3D view
            </div>
          </div>
        `;
      }

      // Event Listener for Unified Modal
      card.addEventListener("click", () => openBentoModal(animal));
      grid.appendChild(card);
    });

    // Re-trigger scroll reveal for newly added elements
    initScrollReveal();
  }

  // Initial Render
  renderCards(speciesData);

  // ==========================================
  // 3. FILTER & SEARCH LOGIC
  // ==========================================
  let currentCategory = "All";
  let currentSearch = "";

  const filterBtns = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("searchInput");

  function applyFilters() {
    const filtered = speciesData.filter(animal => {
      const matchCat = currentCategory === "All" || animal.category === currentCategory;
      const matchSearch = animal.name.toLowerCase().includes(currentSearch);
      return matchCat && matchSearch;
    });
    renderCards(filtered);
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-cat");
      applyFilters();
    });
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // ==========================================
  // 4. UNIFIED BENTO MODAL LOGIC
  // ==========================================
  const modalOverlay = document.getElementById("bentoModalOverlay");
  const closeBtn = document.getElementById("closeBentoModal");
  const modalHero = document.getElementById("modalHero");

  // Bento Info Elements
  const bmStatus = document.getElementById("bmStatus");
  const bmName = document.getElementById("bmName");
  const bmScientific = document.getElementById("bmScientific");
  const bmHabitat = document.getElementById("bmHabitat");
  const bmFoundIn = document.getElementById("bmFoundIn");
  const bmDiet = document.getElementById("bmDiet");
  const bmBehavior = document.getElementById("bmBehavior");
  const bmFunFact = document.getElementById("bmFunFact");

  function openBentoModal(animal) {
    // 1. Populate standard text data (Always the same)
    bmStatus.textContent = animal.status;
    bmStatus.className = `status-badge ${animal.statusClass}`;
    bmStatus.style.background = getStatusColor(animal.statusClass);

    bmName.textContent = animal.name;
    bmScientific.textContent = animal.scientificName;
    bmHabitat.textContent = animal.habitat;
    bmFoundIn.textContent = animal.foundIn;
    bmDiet.textContent = animal.diet;
    bmBehavior.textContent = animal.behavior;
    bmFunFact.textContent = animal.funFact;

    // 2. Render Hero Area dynamically based on gamification state
    modalHero.innerHTML = ""; // Clear previous content

    if (animal.isUnlocked) {
      // PREMIUM 3D VIEW
      modalHero.innerHTML = `
        <model-viewer 
          src="${animal.modelUrl}" 
          alt="${animal.name} 3D Model" 
          auto-rotate 
          camera-controls 
          rotation-per-second="30deg"
          shadow-intensity="1"
          environment-image="neutral">
        </model-viewer>
      `;
    } else {
      // STANDARD 2D VIEW WITH CTA
      modalHero.innerHTML = `
        <img src="${animal.image}" alt="${animal.name}" class="locked-hero-img" />
        <div class="locked-cta-wrap">
          <button class="locked-cta-btn" onclick="window.location.href='../Game/Main/Game/GameUnity.html'">
            <i class="fa-solid fa-gamepad"></i>
            Play Rescue Game to unlock Hologram
          </button>
        </div>
      `;
    }

    // 3. Show Modal
    modalOverlay.classList.add("show");
  }

  function closeModal() {
    modalOverlay.classList.remove("show");
    modalHero.innerHTML = ""; // Clean up 3D model to save memory
  }

  // Close Listeners
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Helper for Status Badge Color
  function getStatusColor(statusClass) {
    switch (statusClass) {
      case 'ce': return '#dc2626'; // Red
      case 'en': return '#f97316'; // Orange
      case 'vu': return '#eab308'; // Yellow
      case 'lc': return '#3b82f6'; // Blue
      default: return '#64748b';
    }
  }

  // ==========================================
  // 5. SCROLL REVEAL ANIMATIONS
  // ==========================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.wg-reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Optional: Stop observing once revealed
          // observer.unobserve(entry.target); 
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    reveals.forEach(el => observer.observe(el));

    // Check elements already in view on load
    setTimeout(() => {
      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight) {
          el.classList.add('active');
        }
      });
    }, 100);
  }

  initScrollReveal();

});
