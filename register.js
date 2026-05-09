const fullnameInput = document.getElementById('fullname');
const regEmailInput = document.getElementById('regEmail');
const regPasswordInput = document.getElementById('regPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('termsCheckbox');
const registerForm = document.getElementById('registerForm');
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

function validateFullname() {
    const fullname = fullnameInput.value.trim();
    const group = document.getElementById('fullnameGroup');
    clearError(group);
    if (fullname === '') {
        showErrorOnGroup(group, 'Full name cannot be empty');
        return false;
    }
    if (fullname.length < 2) {
        showErrorOnGroup(group, 'Full name must be at least 2 characters');
        return false;
    }
    return true;
}

function validateRegEmail() {
    const email = regEmailInput.value.trim();
    const group = document.getElementById('regEmailGroup');
    clearError(group);
    if (email === '') {
        showErrorOnGroup(group, 'Email cannot be empty');
        return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorOnGroup(group, 'Please enter a valid email address');
        return false;
    }
    return true;
}

function validateRegPassword() {
    const password = regPasswordInput.value;
    const group = document.getElementById('regPasswordGroup');
    clearError(group);
    if (password === '') {
        showErrorOnGroup(group, 'Password cannot be empty');
        return false;
    }
    if (password.length < 8) {
        showErrorOnGroup(group, 'Password must be at least 8 characters');
        return false;
    }
    if (!/[A-Z]/.test(password)) {
        showErrorOnGroup(group, 'Password must contain at least one uppercase letter');
        return false;
    }
    if (!/[0-9]/.test(password)) {
        showErrorOnGroup(group, 'Password must contain at least one number');
        return false;
    }
    return true;
}

function validateConfirmPassword() {
    const password = regPasswordInput.value;
    const confirm = confirmPasswordInput.value;
    const group = document.getElementById('confirmPasswordGroup');
    clearError(group);
    if (confirm === '') {
        showErrorOnGroup(group, 'Please confirm your password');
        return false;
    }
    if (password !== confirm) {
        showErrorOnGroup(group, 'Passwords do not match');
        return false;
    }
    return true;
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    if (!validateFullname() || !validateRegEmail() || !validateRegPassword() || !validateConfirmPassword()) {
        showToast('Please fix the errors before signing up', 'error');
        return;
    }
    
    if (!termsCheckbox.checked) {
        showToast('Please agree to the Terms of Service', 'error');
        return;
    }
    
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullname: fullnameInput.value.trim(),
                email: regEmailInput.value.trim(),
                password: regPasswordInput.value,
                confirmPassword: confirmPasswordInput.value,
                terms: termsCheckbox.checked
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (error) {
        showToast('Connection error. Please make sure XAMPP is running.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
}

document.getElementById('toggleRegPassword')?.addEventListener('click', () => {
    const pwd = document.getElementById('regPassword');
    const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
    pwd.setAttribute('type', type);
});

document.getElementById('toggleConfirmPassword')?.addEventListener('click', () => {
    const pwd = document.getElementById('confirmPassword');
    const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
    pwd.setAttribute('type', type);
});

registerForm.addEventListener('submit', handleRegisterSubmit);
console.log('📝 Register page ready');