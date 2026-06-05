const forgotForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
}

async function handleForgotSubmit(event) {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
        showToast('Vui lòng nhập email', 'error');
        return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = 'Sending...';

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ ' + (data.message || 'Link reset đã được gửi!'), 'success');
        } else {
            showToast('❌ ' + (data.message || 'Email không tồn tại'), 'error');
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        showToast('Kết nối thất bại đến server!', 'error');
    } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Send Reset Link';
    }
}

if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotSubmit);
}
