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
    image: "https://t3.ftcdn.net/jpg/03/22/45/92/360_F_322459285_oT4RIQpH1otaXAzSsiSMCmvYo4GTAl0o.jpg"
  },
  {
    name: "Red-crowned Crane",
    scientificName: "Grus Japonensis",
    status: "Critically Endangered",
    statusClass: "tag-ce",
    category: "Birds",
    image: "https://s3.animalia.bio/animals/photos/full/original/shutterstock-1043519431jpg.webp"
    },
  {
    name: "Green Sea Turtle",
    scientificName: "Chelonia mydas",
    status: "Vunerable",
    statusClass: "tag-vu",
    category: "Reptiles",
    image: "https://static.vecteezy.com/system/resources/thumbnails/071/755/687/small_2x/close-up-of-green-sea-turtle-swimming-in-aquarium-at-daytime-free-video.jpg"
  }
];

const grid = document.getElementById("Cards-grid");

function renderCards(dataArray){
  // Dọn sạch khay
  grid.innerHTML = "";
  //Vòng lặp, lấy từng con vật (animal) trong mảng dataArray
  dataArray.forEach(animal => {
    const cardHTML = 
    ` <div class = "card">
          <div class = "card-image-container">
            <span class="status-tag ${animal.statusClass}">${animal.status}</span>
            <img src = "${animal.image}" alt = "${animal.name}">
            <div class="card-image-down">
                <h3 class="card-name">${animal.name}</h3>
                <p class="scientific-name">${animal.scientificName}</p>
            </div>
          </div>
          <div class = "card-content">
              <span class="card-category">${animal.category}</span>
          </div>
      </div>
    `;
    grid.innerHTML += cardHTML;
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