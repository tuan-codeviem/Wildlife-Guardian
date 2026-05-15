// Lấy các phần tử từ giao diện
const emailInput = document.getElementById('email'); // Đây là ô nhập username
const passwordInput = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const togglePasswordBtn = document.getElementById('togglePassword');
const toast = document.getElementById('toast');

// Hàm hiển thị thông báo (Toast)
function showToast(message, type = 'success') {
    if (toast) {
        toast.textContent = message;   //Hàm showToast: Hiển thị thông báo dạng cửa sổ nhỏ (toast message) rồi tự ẩn sau 3 giây bằng setTimeout.
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message); // Backup nếu không có thẻ toast trong HTML
    }
}

// Xử lý ẩn/hiện mật khẩu
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
}
//async/await: Giúp viết mã xử lý mạng nhìn giống như mã chạy tuần tự, dễ đọc và bảo trì hơn.
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const username = emailInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu', 'error');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                username: username, // Gửi 'username' thay vì 'email' để khớp với server.js
                password: password
            })
        });
        
        const data = await response.json();
        
        // 3. Xử lý kết quả trả về từ Server
        if (response.ok && data.success) {
            showToast('✅ ' + data.message, 'success');
            
            // Lưu thông tin đăng nhập theo chuẩn cũ của Rescue Map
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);

            // ĐỒNG BỘ: Lưu thêm currentUser để các trang Game, Social nhận diện được
            if (data.user) {
                localStorage.setItem("currentUser", JSON.stringify(data.user));
            }

            // Chuyển hướng sau 1.5 giây
            setTimeout(() => {
                window.location.href = 'rescuemap.html'; 
            }, 1500);
        } else {
            // Hiển thị lỗi từ server (ví dụ: Sai tài khoản hoặc mật khẩu)
            showToast('❌ ' + (data.message || 'Đăng nhập thất bại'), 'error');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showToast('Kết nối thất bại! Hãy chắc chắn Server Node.js đang chạy.', 'error');
    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
}

// Gán sự kiện submit cho Form
if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
}

console.log('🦁 Wildlife Guardian Login System - Connected to Node.js Backend');
