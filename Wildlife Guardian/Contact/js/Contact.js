/* ═══════════════════════════════════════════════════════════════════
   WILDLIFE GUARDIAN – Contact.js
   ▸ Scroll progress bar
   ▸ Navbar scroll glass effect
   ▸ Particle canvas (hero)
   ▸ Intersection Observer scroll reveals (.wg-reveal)
   ▸ Contact form validation + submit feedback
   ▸ Textarea character counter
   ▸ Login/logout toggle (mirrors Home behaviour)
═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────
     1.  SCROLL PROGRESS BAR
  ─────────────────────────────────────────────── */
  const progressBar = document.getElementById('wgProgress');

  function updateProgress() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const progress     = docHeight > 0 ? scrollTop / docHeight : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();


  /* ──────────────────────────────────────────────
     2.  NAVBAR – transparent → glass on scroll
  ─────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();


  /* ──────────────────────────────────────────────
     3.  HAMBURGER MENU
  ─────────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('show');
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('show');
      });
    });

    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('show');
      }
    });
  }


  /* ──────────────────────────────────────────────
     4.  LOGIN / LOGOUT TOGGLE  (mirrors Home)
  ─────────────────────────────────────────────── */
  function setupLoginBtn(btn) {
    if (!btn) return;
    const user = localStorage.getItem('currentUser') || localStorage.getItem('isLoggedIn');
    if (user) {
      btn.textContent = '← Log out';
      btn.onclick = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.location.reload();
      };
    } else {
      btn.textContent = '→ Log in';
      btn.onclick = () => { window.location.href = '../Auth/login.html'; };
    }
  }

  setupLoginBtn(document.getElementById('desktopLoginBtn'));
  setupLoginBtn(document.getElementById('mobileLoginBtn'));


  /* ──────────────────────────────────────────────
     5.  PARTICLE CANVAS  (hero background)
         Same algorithm as Home's hero canvas
  ─────────────────────────────────────────────── */
  const canvas  = document.getElementById('ct-canvas');
  const ctx     = canvas ? canvas.getContext('2d') : null;
  let   particles = [];
  let   animId;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.6 + 0.4,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
      hue:   Math.random() > 0.85 ? 30 : 130, // orange accent or green
    };
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 8000), 130);
    for (let i = 0; i < count; i++) particles.push(createParticle());
  }

  function drawParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });

    animId = requestAnimationFrame(drawParticles);
  }

  if (canvas && ctx) {
    resizeCanvas();
    initParticles();
    drawParticles();
    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); }, { passive: true });
  }


  /* ──────────────────────────────────────────────
     6.  SCROLL REVEAL  (IntersectionObserver)
  ─────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.wg-reveal, .team-card');

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);

      setTimeout(() => el.classList.add('visible'), delay);
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => {
    // Team cards need same reveal class
    el.classList.add('wg-reveal');
    revealObs.observe(el);
  });


  /* ──────────────────────────────────────────────
     7.  FORM – validation + submit
  ─────────────────────────────────────────────── */
  const form        = document.getElementById('ctContactForm');
  const nameInput   = document.getElementById('ctName');
  const emailInput  = document.getElementById('ctEmail');
  const subjectInput= document.getElementById('ctSubject');
  const msgInput    = document.getElementById('ctMessage');
  const submitBtn   = document.getElementById('ctSubmitBtn');
  const successBox  = document.getElementById('ctSuccess');
  const charCount   = document.getElementById('ctCharCount');

  // Character counter
  if (msgInput && charCount) {
    msgInput.addEventListener('input', () => {
      const len = msgInput.value.length;
      charCount.textContent = `${len} / 500`;
      charCount.style.color = len > 450 ? '#f97316' : '';
      if (len > 500) msgInput.value = msgInput.value.slice(0, 500);
    });
  }

  function showError(input, errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(input, errorId) {
    const errorEl = document.getElementById(errorId);
    if (input) input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  }

  function validateField(input, errorId, validatorFn, message) {
    if (!input) return true;
    if (validatorFn(input.value.trim())) {
      clearError(input, errorId);
      return true;
    } else {
      showError(input, errorId, message);
      return false;
    }
  }

  // Live validation on blur
  if (nameInput) {
    nameInput.addEventListener('blur', () =>
      validateField(nameInput, 'ctNameError', v => v.length >= 2, 'Please enter your name (min 2 characters)'));
  }
  if (emailInput) {
    emailInput.addEventListener('blur', () =>
      validateField(emailInput, 'ctEmailError', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email address'));
  }
  if (subjectInput) {
    subjectInput.addEventListener('blur', () =>
      validateField(subjectInput, 'ctSubjectError', v => v.length >= 3, 'Please enter a subject (min 3 characters)'));
  }
  if (msgInput) {
    msgInput.addEventListener('blur', () =>
      validateField(msgInput, 'ctMessageError', v => v.length >= 10, 'Please enter your message (min 10 characters)'));
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all fields
      const validName    = validateField(nameInput,    'ctNameError',    v => v.length >= 2,   'Please enter your name (min 2 characters)');
      const validEmail   = validateField(emailInput,   'ctEmailError',   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email address');
      const validSubject = validateField(subjectInput, 'ctSubjectError', v => v.length >= 3,   'Please enter a subject (min 3 characters)');
      const validMsg     = validateField(msgInput,     'ctMessageError', v => v.length >= 10,  'Please enter your message (min 10 characters)');

      if (!validName || !validEmail || !validSubject || !validMsg) return;

      // Show loading
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Simulated send (replace with your actual API call)
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Show success
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      form.reset();
      if (charCount) charCount.textContent = '0 / 500';

      if (successBox) {
        successBox.classList.add('show');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => successBox.classList.remove('show'), 8000);
      }
    });
  }


  /* ──────────────────────────────────────────────
     8.  DONATE BUTTON – simple scroll / alert
  ─────────────────────────────────────────────── */
  const donateBtn    = document.getElementById('donateNowBtn');
  const learnMoreBtn = document.getElementById('learnMoreBtn');

  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      // Replace with your actual payment / donation page
      alert('Thank you for your generosity! 🐾\nDonation gateway integration coming soon.');
    });
  }

  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      window.location.href = '../Home/Home.html';
    });
  }


  /* ──────────────────────────────────────────────
     9.  SMOOTH SCROLL for anchor links
  ─────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = navbar ? navbar.offsetHeight : 68;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
