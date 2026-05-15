// ==========================================
// 1. Thanh NavBar
// ==========================================

const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

// Khi nhấn vào nút 3 gạch
hamburger.addEventListener("click", () => {
  // Bật/tắt class 'active' để dấu 3 gạch biến thành dấu X
  hamburger.classList.toggle("active");

  // Bật/tắt class 'show' để hiện hoặc ẩn menu
  mobileNav.classList.toggle("show");
});

// Xử lý khi nhấn vào các tab trên máy tính (đổi màu xanh)
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelector(".nav-item.active").classList.remove("active");
    this.classList.add("active");
  });
});
// ==========================================
// 2. Library (Grid) 
// ==========================================
 const speciesData =
 [
  {
    name: "Asian Elephant",
    scientificName: "Elephas Maximus",
    status: "Endangered",
    statusClass: "tag-en",
    category: "Mammals",
    habitat: "Tropical forests, grasslands, and scrublands across South and Southeast Asia",
    behavior: "Highly social animals living in family groups led by a matriarch. Known for their intelligence and memory.",
    foundIn: "Vietnam, Thailand, India, Sri Lanka",
    diet: "Herbivore - grasses, leaves, bark, roots, and fruits. Can consume up to 150kg of vegetation daily.",
    image: "https://t3.ftcdn.net/jpg/03/22/45/92/360_F_322459285_oT4RIQpH1otaXAzSsiSMCmvYo4GTAl0o.jpg",
    funFact: "Elephants can communicate using seismic vibrations through the ground!"
  },
  {
    name: "Red-crowned Crane",
    scientificName: "Grus Japonensis",
    status: "Critically Endangered",
    statusClass: "tag-ce",
    category: "Birds",
    habitat: "Wetlands, marshes, and riverbanks in East Asia",
    diet: "Omnivore - fish, amphibians, insects, plants, and grains.",
    behavior: "Known for elaborate courtship dances. Mate for life and both parents care for young.",
    foundIn: "Japan, China, Korea, Russia",
    image: "https://s3.animalia.bio/animals/photos/full/original/shutterstock-1043519431jpg.webp",
    funFact: "In Japanese culture, they symbolize luck, longevity, and fidelity!"
    },
  {
    name: "Green Sea Turtle",
    scientificName: "Chelonia mydas",
    status: "Vunerable",
    statusClass: "tag-vu",
    category: "Reptiles",
    habitat: "Tropical and subtropical ocean waters, coral reefs, and seagrass beds",
    diet: "Herbivore - primarily seagrass and algae as adults.",
    behavior:  "Migratory, traveling long distances between feeding and nesting grounds.", 
    foundIn: "Pacific Ocean, Indian Ocean, Atlantic Ocean",
    funFact: "They can hold their breath for up to 5 hours while sleeping underwater!",
    image: "https://static.vecteezy.com/system/resources/thumbnails/071/755/687/small_2x/close-up-of-green-sea-turtle-swimming-in-aquarium-at-daytime-free-video.jpg"
  },
  {
    name: "Indochinese Tiger",
    scientificName: "Panthera tigris corbetti",
    status: "Critically Endangered",
    statusClass: "tag-ce", 
    category: "Mammals",
    image: "https://images.squarespace-cdn.com/content/v1/657b302ad0d11e71b22b40c3/80395f24-f05d-49c6-98e8-9ff4a4e7d623/photo_954.jpg",
    habitat: "Tropical and subtropical moist broadleaf forests of Southeast Asia",
    behavior: "Solitary and territorial. Primarily nocturnal hunters that stalk prey silently.",
    diet: "Carnivore - deer, wild pigs, and occasionally larger prey like buffalo.",
    foundIn: "Vietnam, Cambodia, Laos, Thailand, Myanmar",
    funFact: "No two tigers have the same stripe pattern - they're like fingerprints!"
  },
  {
    name: "King Cobra",
    scientificName: "Ophiophagus hannah",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Reptiles",
    image: "https://i.natgeofe.com/k/0e282fd6-0422-45df-a2b8-ac03f00d38ad/king-cobra-hood-crop.jpg",
    habitat: "Dense highland forests, bamboo thickets, and mangrove swamps.",
    behavior: "Diurnal and relatively shy. Only aggressive when cornered or protecting eggs.",
    diet: "Carnivore - primarily eats other snakes, including venomous ones.",
    foundIn: "India, Southeast Asia, Southern China",
    funFact: "It is the only snake in the world that builds a nest for its eggs!"
  },
  {
    name: "Axolotl",
    scientificName: "Ambystoma mexicanum",
    status: "Critically Endangered",
    statusClass: "tag-ce",
    category: "Amphibians",
    image: "https://www.reptiles.swelluk.com/media/catalog/product/c/u/cute_kevin_2.png?store=swell_reptiles_store_view&image-type=image",
    habitat: "High-altitude freshwater lakes and canals.",
    behavior: "Neotenic, meaning they keep their larval features (like gills) their whole lives.",
    diet: "Carnivore - worms, insects, and small fish.",
    foundIn: "Lake Xochimilco, Mexico",
    funFact: "They have the incredible ability to regenerate lost limbs, heart, and even parts of their brain!"
  },
  {
    name: "Great White Shark",
    scientificName: "Carcharodon carcharias",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Fish",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRX0fspKR6qR0hzEA4OGG5VmwEd9Nscsn-zAY2IA_ibK8Fgr69UXxtgxy02A77uTJG5cMl7Dk0zYGChz8vH_U4ecNtDnRIyPcRo0rZ1k74&s=10",
    habitat: "Coastal and offshore waters with temperatures between 12 and 24 °C.",
    behavior: "Highly migratory and curious predators. Often investigate objects by biting them.",
    diet: "Carnivore - marine mammals, fish, and seabirds.",
    foundIn: "Global coastal waters",
    funFact: "They can detect a single drop of blood in 100 liters of water!"
  },
  {
    name: "Giant Panda",
    scientificName: "Ailuropoda melanoleuca",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Mammals",
    image: "https://nationalzoo.si.edu/sites/default/files/styles/wide/public/2025-01/20250108-817A0742-13RP.jpg?h=8165685c&itok=ZPPEtSRK",
    habitat: "Temperate broadleaf and mixed forests with dense bamboo.",
    behavior: "Generally solitary, spending 10-16 hours a day foraging and eating.",
    diet: "Herbivore - 99% of their diet is bamboo.",
    foundIn: "Central China",
    funFact: "A newborn panda is blind, pink, and about the size of a stick of butter!"
  }, 
  {
    name: "Monarch Butterfly",
    scientificName: "Danaus plexippus",
    status: "Endangered",
    statusClass: "tag-en",
    category: "Insects",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjJ8VjrwNssRqv8C6FldVyXvc3ABTOzthNYeRnWua0vf8G9yJYHLfg9gZlnzgB-dQMX-1mpMNt_J4OQj8OuBoEVFdZ9VvdD0BuHDllLA&s=10",
    habitat: "Open fields and meadows in the spring and summer, warm coasts and high altitudes in winter.",
    behavior: "They undergo a spectacular long-distance annual migration from southern Canada to central Mexico.",
    diet: "Nectar from flowers, including milkweed. As caterpillars, they eat milkweed plants.",
    foundIn: "North America, migrating from southern Canada to central Mexico.",
    funFact: "As caterpillars, monarchs store poisonous compounds from milkweed plants, making them poisonous to avoid predators!"
  },
  {
    name: "Honey Bee",
    scientificName: "Apis mellifera",
    status: "Least Concern",
    statusClass: "tag-lc",
    category: "Insects",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnrtagJNnA3revzc-BWSc-tEwk-Fna9MVVwr0ABsyInlofHrDEQ11_VZUP-dcE8XrKn9E7_r0gOUh777wzeIfsbtlF11tSXz1ALYKghA&s=10",
    habitat: "They live in hives or nests, above or below the ground, in marshes, heathlands, grasslands, and forests.",
    behavior: "Highly social insects that live in colonies with a queen, workers, and drones. They build hexagonal cells made of wax.",
    diet: "Nectar and pollen from flowers, which they convert into honey for surplus food storage.",
    foundIn: "Native to mainland Afro-Eurasia, but introduced globally to South America, North America, etc.",
    funFact: "Almost 90% of wild plants and 75% of leading global crops depend on animal pollination, heavily relying on bees!"
  },
  {
    name: "Great Hornbill",
    scientificName: "Buceros bicornis",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Birds",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTO6yioTrCZLX8RWnqTKvvH4QkxIR3y_XpEREKWvuOnMdz-aMYsrWytk7vOfR4nqZBrTbvpkJc0iGhlI2DYlfXqWl3o954whF0AqJsJiZ8&s=10",
    habitat: "Arboreal and live mainly in wet, tall, evergreen forests. They prefer dense old growth unlogged forests in hilly regions.",
    behavior: "Social birds that live in small groups. They move along branches by hopping and are very loud, producing deep roars and barks.",
    diet: "Mainly frugivores (eating figs and lipid-rich fruits), but also eat small mammals, birds, reptiles, and insects.",
    foundIn: "India, Bhutan, Nepal, Mainland Southeast Asia, and Sumatra.",
    funFact: "They are so fond of figs that up to 200 birds may gather in the same tree to feed on this fruit!"
  },
  {
    name: "Bali Myna",
    scientificName: "Leucopsar rothschildi",
    status: "Critically Endangered",
    statusClass: "tag-ce",
    category: "Birds",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3I5YRCF1AqgebLEDqBB5TTs8UkmdM-5fETXf1yomalh7AOKIwL0BpnbhGy4NNoNKI1L3Wis7DwMigoK58XGQtWJD_QiqYGKUez49oo33P&s=10",
    habitat: "Mountain regions, open shrub, palm-savanna, and tropical forests along the north coast of Bali.",
    behavior: "Typically stay high in treetops. They congregate in flocks of 20-40 birds before breaking off into pairs for mating.",
    diet: "Primarily insects (ants, termites, caterpillars), fruits (figs, papayas), nectar, worms, and small reptiles.",
    foundIn: "Only found on the island of Bali in Indonesia.",
    funFact: "In 2001, their population plummeted to an all-time low with only six individuals left in the wild, making them incredibly rare."
  },
  {
    name: "Whale Shark",
    scientificName: "Rhincodon typus",
    status: "Endangered",
    statusClass: "tag-en",
    category: "Fish",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi4I9tnt0bb5hbqz3YaLHRyDQmKlnnsdsqVd30sbWznyVt1YuYg6CU-cB8ZhnfPKy7tOSo2JOFLrCdUgCxSwbn5MyA0lvXTSZUJ1YgFKUD&s=10",
    habitat: "Open waters of the tropical oceans. They rarely swim below a depth of 700 meters.",
    behavior: "Docile and slow-moving. They are known to be very playful and sometimes allow swimmers to hitch a ride.",
    diet: "Filter feeder - primarily eats plankton, krill, and small fish by swimming with its huge mouth open.",
    foundIn: "All tropical and warm-temperate seas globally.",
    funFact: "Despite their name, they are not whales but fish! They are the largest known extant fish species in the world."
  },
  {
    name: "Clownfish",
    scientificName: "Amphiprioninae",
    status: "Least Concern",
    statusClass: "tag-lc",
    category: "Fish",
    image: "data:image/jpeg;base64,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",
    habitat: "Coral reefs and sheltered lagoons, living in mutualistic symbiosis with sea anemones.",
    behavior: "Highly territorial. They fiercely defend their host anemone from predators and other clownfish.",
    diet: "Omnivore - algae, zooplankton, worms, and small crustaceans.",
    foundIn: "Warm waters of the Indian and Pacific oceans, including the Great Barrier Reef.",
    funFact: "All clownfish are born male! The largest and most dominant one in a group will permanently change its sex to female."
  },
  {
    name: "Red Panda",
    scientificName: "Ailurus fulgens",
    status: "Endangered",
    statusClass: "tag-en",
    category: "Mammals",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ8RczQin_s_KbmTejvYATgsZztmK3bX1Wcda41GsaaCThP7CMcXb0ezOzWGXkoLzaG_Bh2u5ogeJaUhSAOmNlS_7BlKjJ5LuvtEY1qLJH2w&s=10",
    habitat: "High-altitude temperate forests with bamboo understories in the Himalayas.",
    behavior: "Solitary, arboreal, and mostly active from dusk to dawn. They use their bushy tails for balance and as a blanket.",
    diet: "Herbivore - mainly bamboo leaves and shoots, but they occasionally eat fruit, insects, and bird eggs.",
    foundIn: "Nepal, India, Bhutan, Myanmar, and southern China.",
    funFact: "They have a 'false thumb' which is actually an extended wrist bone that helps them tightly grasp bamboo stalks!"
  },
  {
    name: "Snow Leopard",
    scientificName: "Panthera uncia",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Mammals",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStgsxc1cCHAjh5yeviXjYiJ3ATU172-0A-PSnCGvX4SqYnGEPi0cK8aZ4avSirXSPeXYoXMekC6M69wRsExnK0fCz2VcIw03oFVmonprB-&s=10",
    habitat: "Rugged alpine and subalpine zones at elevations from 3,000 to 4,500 meters.",
    behavior: "Solitary and highly elusive. They are perfectly camouflaged, earning them the nickname 'ghost of the mountains'.",
    diet: "Carnivore - blue sheep, Argali wild sheep, ibex, marmots, and hares.",
    foundIn: "Mountain ranges of Central and South Asia, including the Himalayas.",
    funFact: "Unlike other big cats like lions and tigers, snow leopards cannot roar! They communicate through hisses, growls, and chuffs."
  },
  {
    name: "Giant Armadillo",
    scientificName: "Priodontes maximus",
    status: "Vulnerable",
    statusClass: "tag-vu",
    category: "Mammals",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHsmVR9UWXnWvkCszS7cq-w5Q6oQHsHY9854PbtbVG3iUb74ptBZvvB_7-wsZCr7qb5c307TyjNe72CuJyIvQ4laBBy9cx8TM_yh4MQwFt&s=10",
    habitat: "Grasslands, brushlands, and dense forests near water sources.",
    behavior: "Nocturnal and highly solitary. They are powerful diggers and create large burrows to sleep in during the day.",
    diet: "Insectivore - primarily ants and termites, which they extract using their large front claws.",
    foundIn: "Most of South America, especially Brazil, Argentina, and Paraguay",
    funFact: "They have up to 100 small teeth, which is more than any other land mammal in the world!"
  },
  {
    name: "Red-eyed Tree Frog",
    scientificName: "Agalychnis callidryas",
    status: "Least Concern",
    statusClass: "tag-lc",
    category: "Amphibians",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDCbRv9V0clDV4FhJjM5CqKY5eTIhK-3gUyNn0WpPWGFKmjQVBomX424D9W2LraexhhZExoxTv0gNP47gCq9tUI1CtiKg3UjIXaN08AZNA&s=10",
    habitat: "Neotropical rainforests, usually in the canopy near rivers or ponds.",
    behavior: "Nocturnal. When startled by a predator, they suddenly open their bright red eyes to confuse the attacker.",
    diet: "Carnivore - crickets, moths, flies, and sometimes even smaller frogs.",
    foundIn: "Central America to northern South America",
    funFact: "When sleeping, they tuck their bright legs under their green bodies to perfectly camouflage as a leaf!"
  },
  {
    name: "Golden Poison Frog",
    scientificName: "Phyllobates terribilis",
    status: "Endangered",
    statusClass: "tag-en",
    category: "Amphibians",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI_vnMwF0ci6W7WM_qWbrzRpas_gj2VaW2mktI9tZbr4adx04ME6tNMvCo-Iv1Yr4CmkEOFFazMjkXl7gItEtVDcDLrQ2rQa-zfO2c4lOdZQ&s=10",
    habitat: "Humid lowland forests of the Pacific coast, specifically with high rainfall.",
    behavior: "Diurnal (active during the day) and very bold. Their bright color is an active warning to predators.",
    diet: "Insectivore - highly dependent on specific toxic ants and beetles to maintain their own poison.",
    foundIn: "Pacific coast of Colombia",
    funFact: "A single Golden Poison Frog has enough venom in its skin to kill 10 grown human adults!"
  }
]

const grid = document.getElementById("Cards-grid");

function renderCards(dataArray){
  grid.innerHTML = "";
  dataArray.forEach(animal => {
    
    // TẠO MỘT THẺ Card Div 
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    
    cardElement.innerHTML = `
          <div class="card-image-container">
            <span class="status-tag ${animal.statusClass}">${animal.status}</span>
            <img src="${animal.image}" alt="${animal.name}">
            <div class="card-image-down">
                <h3 class="card-name">${animal.name}</h3>
                <p class="scientific-name">${animal.scientificName}</p>
            </div>
          </div>
          <div class="card-content">
              <span class="card-category">${animal.category}</span>
              <i class="fa-solid fa-chevron-right" style="color: #64748b;"></i>
          </div>
    `;

    cardElement.addEventListener("click", () => {
        openModal(animal); 
    });

    // Nhét thẻ div hoàn chỉnh vào khay grid
    grid.appendChild(cardElement);
  });
}
  renderCards(speciesData);

  // ==========================================
// 3. XỬ LÝ LỌC BẰNG BUTTON THEO DANH MỤC (CATEGORY) VÀ TÌM KIẾM 
// ==========================================

let currentCategory = "All";
let currentSearchTerm = "";

const categoryButtons = document.querySelectorAll(".Block2_Top_LeftTools button");
const searchInput = document.querySelector(".Block2_Top_Search input");

categoryButtons[0].classList.add("active-btn");

// Hàm lọc cả search cả category
function filterData(){
  const filteredList = speciesData.filter(animal => {
        const filteredCategory = (currentCategory === "All"  || (animal.category === currentCategory));

        const animalName = animal.name.toLowerCase();
        const matchSearch = animalName.includes(currentSearchTerm);

        return filteredCategory && matchSearch;
  });
  renderCards(filteredList); 
}

//CẬP NHẬT BIẾN CURRENT CATEGORY 
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      categoryButtons.forEach(btn => btn.classList.remove("active-btn"));
        button.classList.add("active-btn");

        currentCategory = button.innerText.trim();
        filterData();
    })
})
// CẬP NHẬT BIẾN CURRENTSEARCHTERM
searchInput.addEventListener("input", (e) => {
    // Cập nhật biến ghi nhớ và gọi hàm lọc trung tâm
    currentSearchTerm = e.target.value.toLowerCase().trim();
    filterData();
});


// ==========================================
// 5. MODAL POPUP (CẬP NHẬT ĐIỀN ĐỦ DỮ LIỆU)
// ==========================================
const modal = document.getElementById("detail-modal");
const closeModalBtn = document.getElementById("close-modal");

function openModal(data) {
    // 1. Đổ dữ liệu vào Ảnh và Tiêu đề
    document.getElementById("modal-img").src = data.image;
    document.getElementById("modal-name").innerText = data.name;
    document.getElementById("modal-scientific").innerText = data.scientificName;
    
    // 2. Đổ dữ liệu vào 5 Box thông tin
    document.getElementById("modal-habitat").innerText = data.habitat;
    document.getElementById("modal-behavior").innerText = data.behavior;
    document.getElementById("modal-diet").innerText = data.diet;
    document.getElementById("modal-foundin").innerText = data.foundIn;
    document.getElementById("modal-funfact").innerText = data.funFact;
    
    // 3. Đổ dữ liệu vào Status Tag
    const statusEl = document.getElementById("modal-status");
    statusEl.innerText = data.status;
    statusEl.className = `status-tag ${data.statusClass}`; 

    modal.classList.add("show");
}

// Hàm đóng Modal
function closeModal() {
    modal.classList.remove("show"); 
}

closeModalBtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(); 
});
