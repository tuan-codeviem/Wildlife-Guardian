/* ════════════════════════════════════════════════════════════════════
   Wildlife Guardian – feedback.js
   Frontend Feedback feature: star rating + form → POST /api/feedback
   ════════════════════════════════════════════════════════════════════ */

/* ── Star Rating interactive logic ── */
document.addEventListener('DOMContentLoaded', () => {
    const stars      = document.querySelectorAll('.fb-star');
    const ratingInput = document.getElementById('fbRating');
    if (!stars.length || !ratingInput) return;

    stars.forEach(star => {
        /* Hover: light up to hovered star */
        star.addEventListener('mouseenter', () => {
            const val = +star.dataset.val;
            stars.forEach(s => s.classList.toggle('fb-star-lit', +s.dataset.val <= val));
        });

        /* Click: lock selection */
        star.addEventListener('click', () => {
            const val = +star.dataset.val;
            ratingInput.value = val;
            stars.forEach(s => {
                s.classList.toggle('fb-star-lit',      +s.dataset.val <= val);
                s.classList.toggle('fb-star-selected', +s.dataset.val <= val);
            });
        });
    });

    /* Mouse leave: revert to selected state */
    document.getElementById('fbStars')?.addEventListener('mouseleave', () => {
        const selected = +(ratingInput?.value || 0);
        stars.forEach(s => s.classList.toggle('fb-star-lit', +s.dataset.val <= selected));
    });
});

/* ── Submit handler ── */
async function submitFeedback(event) {
    event.preventDefault();

    const name    = document.getElementById('fbName')?.value.trim();
    const email   = document.getElementById('fbEmail')?.value.trim();
    const type    = document.getElementById('fbType')?.value;
    const content = document.getElementById('fbContent')?.value.trim();
    const rating  = parseInt(document.getElementById('fbRating')?.value || '0');

    /* Validate */
    if (!name)              return _fbErr('Vui lòng nhập họ và tên!');
    if (!content)           return _fbErr('Vui lòng nhập nội dung phản hồi!');
    if (content.length < 10) return _fbErr('Nội dung quá ngắn (ít nhất 10 ký tự)!');

    /* Loading state */
    const btn = document.getElementById('fbSubmitBtn');
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...'; }

    /* Build API URL (hỗ trợ cả port 3000 và production) */
    const apiUrl = _getApiUrl('/api/feedback');

    const payload = { name, email, type, content, rating, createdAt: new Date().toISOString() };

    try {
        const res = await fetch(apiUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        /* Reset form */
        document.getElementById('feedbackForm')?.reset();
        document.querySelectorAll('.fb-star').forEach(s => s.classList.remove('fb-star-lit', 'fb-star-selected'));
        if (document.getElementById('fbRating')) document.getElementById('fbRating').value = '0';

        window.closeFeedbackModal?.();
        if (typeof showToast === 'function') showToast('✅ Cảm ơn bạn! Phản hồi đã được ghi nhận.', 'success');

    } catch (err) {
        console.warn('[feedback.js] API error:', err.message);

        /* Graceful offline fallback */
        if (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('network')) {
            document.getElementById('feedbackForm')?.reset();
            document.querySelectorAll('.fb-star').forEach(s => s.classList.remove('fb-star-lit', 'fb-star-selected'));
            window.closeFeedbackModal?.();
            if (typeof showToast === 'function') showToast('✅ Phản hồi đã lưu (offline mode)!', 'success');
        } else {
            _fbErr(`Lỗi: ${err.message}`);
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
    }
}

function _fbErr(msg) {
    if (typeof showToast === 'function') showToast(msg, 'error');
    else alert(msg);
}

function _getApiUrl(path) {
    if (window.location.port !== '3000') {
        const host = window.location.hostname || '127.0.0.1';
        return `http://${host === 'localhost' ? '127.0.0.1' : host}:3000${path}`;
    }
    return path;
}
