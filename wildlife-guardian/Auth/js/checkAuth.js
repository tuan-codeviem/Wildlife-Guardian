// File: checkAuth.js
document.addEventListener("DOMContentLoaded", () => {
    // Kiểm tra xem trình duyệt có lưu user nào không
    const user = localStorage.getItem("currentUser");

    if (!user) {
        // Nếu chưa đăng nhập -> Lưu lại link trang hiện tại
        sessionStorage.setItem("redirectAfterLogin", window.location.href);
        
        // Đá bay sang trang đăng nhập chung
        window.location.href = "../Auth/login.html"; 
    }
});