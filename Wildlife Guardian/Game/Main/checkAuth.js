// File: checkAuth.js
document.addEventListener("DOMContentLoaded", () => {
    // Kiểm tra xem trình duyệt có lưu user nào không
    const user = localStorage.getItem("currentUser");

    if (!user) {
        // Nếu chưa đăng nhập -> Lưu lại link trang hiện tại
        sessionStorage.setItem("redirectAfterLogin", window.location.href);
        
        // Đá bay sang trang đăng nhập chung
        window.location.href = "../../../Auth/login.html"; 
    } else {
        // Nếu ĐÃ đăng nhập -> Đổi nút "Login" trên thanh Navbar thành "Logout"
        const loginBtns = document.querySelectorAll(".btn-login");
        loginBtns.forEach((btn) => {
            btn.innerHTML = `← Log out`;
            btn.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem("currentUser");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("username");
                window.location.reload(); 
            };
        });
    }
});