// 1. THANH NAVBAR

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
