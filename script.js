const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');
const loginForm = document.getElementById('loginForm');
const togglePasswordBtn = document.getElementById('togglePassword');
const googleBtn = document.getElementById('googleBtn');
const zaloBtn = document.getElementById('zaloBtn');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function clearError(groupElement) {
    groupElement.classList.remove('error');
    const errorSpan = groupElement.querySelector('.error-message');
    if (errorSpan) errorSpan.textContent = '';
}

function showErrorOnGroup(groupElement, message) {
    groupElement.classList.add('error');
    const errorSpan = groupElement.querySelector('.error-message');
    if (errorSpan) errorSpan.textContent = message;
}

function validateEmail() {
    const email = emailInput.value.trim();
    clearError(emailGroup);
    if (email === '') {
        showErrorOnGroup(emailGroup, 'Email cannot be empty');
        return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorOnGroup(emailGroup, 'Please enter a valid email address');
        return false;
    }
    return true;
}

function validatePassword() {
    const password = passwordInput.value;
    clearError(passwordGroup);
    if (password === '') {
        showErrorOnGroup(passwordGroup, 'Password cannot be empty');
        return false;
    }
    return true;
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    
    if (!validateEmail() || !validatePassword()) {
        showToast('Please fix the errors before signing in', 'error');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Login successful! Welcome ' + data.user.fullname, 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (error) {
        showToast('Connection error. Please make sure XAMPP is running.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
}

togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

loginForm.addEventListener('submit', handleLoginSubmit);
googleBtn.addEventListener('click', () => window.open('https://accounts.google.com/signin', '_blank'));
zaloBtn.addEventListener('click', () => window.open('https://zalo.me/', '_blank'));

console.log('🦁 Login page ready - Connected to database "login"');