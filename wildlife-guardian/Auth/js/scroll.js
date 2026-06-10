document.addEventListener("DOMContentLoaded", function () {
  // 1. Tìm tất cả các phần tử có class "reveal"
  const reveals = document.querySelectorAll(".reveal");

  // 2. Cài đặt cho Observer
  const revealOptions = {
    threshold: 0.15, // Phần tử hiện ra khoảng 15% là bắt đầu chạy hiệu ứng
    rootMargin: "0px 0px -50px 0px", // Kích hoạt sớm một chút trước khi cuộn tới hẳn
  };

  // 3. Tạo một "Người quan sát" (IntersectionObserver)
  const revealOnScroll = new IntersectionObserver(function (entries, observer) {
    entries.forEach((entry) => {
      // Nếu phần tử chưa xuất hiện trong màn hình thì bỏ qua
      if (!entry.isIntersecting) {
        return;
      } else {
        // Nếu đã xuất hiện, thêm class 'active' để chạy CSS
        entry.target.classList.add("active");

        // (Tùy chọn) Ngừng theo dõi sau khi đã hiện để hiệu ứng chỉ chạy 1 lần
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  // 4. Bắt đầu quan sát từng phần tử
  reveals.forEach((reveal) => {
    revealOnScroll.observe(reveal);
  });
});
