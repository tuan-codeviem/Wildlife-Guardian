/* ═══════════════════════════════════════════════════════
   WILDLIFE GUARDIAN – scroll.js  DEFINITIVE
   
   STATS NUMBERS:
   ✅ One-way ONLY: reveal once, count once, NEVER reset
   ✅ countUp starts AFTER reveal animation finishes (750ms)
      → eliminates competing-animation jank on mobile
   ✅ countUp throttled to 30fps (33ms ticks) for mobile
   
   CARDS (feat / comm / news):
   ✅ Two-way with FADE: use rootMargin '-15% 0px -15% 0px'
      so elements fade BEFORE reaching viewport edge
   ✅ CSS transition handles the smooth fade-out
   
   PARALLAX:
   ✅ Desktop only (skipped on touch devices)
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     1. HERO PARTICLE CANVAS
  ══════════════════════════════════════════════════ */
  (function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    const hero = document.querySelector('.hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, particles = [];
    let mouseX = -9999, mouseY = -9999;

    const COLORS = ['#22c55e', '#4ade80', '#86efac', '#f97316', '#fb923c', '#a3e635', '#34d399'];
    const COUNT = 120;

    function resize() {
      const r = hero.getBoundingClientRect();
      W = canvas.width = r.width;
      H = canvas.height = r.height;
    }

    class Dot {
      spawn(fromBottom) {
        this.x = Math.random() * W;
        this.y = fromBottom ? H + 5 : Math.random() * H;
        this.r = Math.random() * 1.5 + 0.4;
        this.a0 = Math.random() * 0.45 + 0.12;
        this.a = this.a0;
        this.vx = (Math.random() - 0.5) * 0.32;
        this.vy = -(Math.random() * 0.4 + 0.15);
        this.col = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.tw = Math.random() * Math.PI * 2;
        this.twS = Math.random() * 0.016 + 0.007;
      }
      update() {
        this.tw += this.twS;
        this.a = this.a0 * (0.55 + 0.45 * Math.sin(this.tw));
        const dx = this.x - mouseX, dy = this.y - mouseY;
        const d2 = dx * dx + dy * dy;
        if (d2 < 7000) {
          const d = Math.sqrt(d2), f = (84 - d) / 84 * 0.85;
          this.vx += dx / d * f; this.vy += dy / d * f;
        }
        this.vx *= 0.97; this.vy *= 0.97;
        this.x += this.vx; this.y += this.vy;
        if (this.y < -8 || this.x < -8 || this.x > W + 8) this.spawn(true);
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.a;
        ctx.shadowColor = this.col;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.col;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawLines() {
      const D = 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < D * D) {
            ctx.save();
            ctx.globalAlpha = (1 - Math.sqrt(d2) / D) * 0.15;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, () => {
        const d = new Dot(); d.spawn(false); return d;
      });
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      drawLines();
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }

    hero.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    });

    init();
    loop();
  })();


  /* ══════════════════════════════════════════════════
     2. SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════ */
  const progressBar = document.getElementById('wgProgress');
  let rafPending = false;
  const isTouch = window.matchMedia('(hover: none)').matches;
  let heroTextEl = null;

  function updateProgress() {
    rafPending = false;
    if (!progressBar) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;

    /* Parallax: desktop only to avoid mobile jank */
    if (!isTouch && window.scrollY < window.innerHeight) {
      if (!heroTextEl) heroTextEl = document.querySelector('.hero-text');
      if (heroTextEl) {
        const pct = window.scrollY / window.innerHeight;
        heroTextEl.style.transform = `translateY(${window.scrollY * 0.12}px)`;
        heroTextEl.style.opacity = `${Math.max(0, 1 - pct * 1.5)}`;
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) { rafPending = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });


  /* ══════════════════════════════════════════════════
     3. NAVBAR
  ══════════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });


  /* ══════════════════════════════════════════════════
     4. WG-REVEAL (section headers, CTA blocks)
     Two-way with rootMargin fade zone
  ══════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════
     4. WG-REVEAL — Two-way with Hysteresis
     
     FLICKER FIX: “Hysteresis” pattern.
     A card can only be hidden after being visible ≥1000ms.
     If IO toggles rapidly at the edge (<1000ms), the
     hide timer gets cancelled on re-entry → no flash.
     When the user genuinely scrolls away (>1000ms later),
     the card fades out normally.
  ══════════════════════════════════════════════════ */
  const MIN_VISIBLE_MS = 1000; /* hysteresis window */

  function makeTwoWayObserver(selector, staggerMs, rootMargin) {
    const cards      = [...document.querySelectorAll(selector)];
    const visibleAt  = new WeakMap(); /* timestamp when .visible was added */
    const hideTimers = new WeakMap();

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;

        if (entry.isIntersecting) {
          /* ---- ENTER ---- */
          /* Cancel any pending hide */
          if (hideTimers.has(el)) {
            clearTimeout(hideTimers.get(el));
            hideTimers.delete(el);
          }
          /* Record the moment it becomes visible */
          if (!visibleAt.has(el)) visibleAt.set(el, Date.now());
          const i     = cards.indexOf(el);
          const delay = parseInt(el.dataset.delay ?? i * staggerMs);
          setTimeout(() => el.classList.add('visible'), delay);

        } else {
          /* ---- EXIT ---- */
          /* How long has it been visible? */
          const since   = visibleAt.get(el) || Date.now();
          const elapsed = Date.now() - since;
          /* Wait at least MIN_VISIBLE_MS before hiding */
          const wait    = Math.max(0, MIN_VISIBLE_MS - elapsed);

          if (!hideTimers.has(el)) {
            const t = setTimeout(() => {
              el.classList.remove('visible');
              visibleAt.delete(el); /* reset so next entry restarts timer */
              hideTimers.delete(el);
            }, wait);
            hideTimers.set(el, t);
          }
        }
      });
    }, { threshold: 0.06, rootMargin });

    cards.forEach(el => io.observe(el));
    return io;
  }

  function initReveal() {
    makeTwoWayObserver('.wg-reveal', 0, '0px 0px -40px 0px');
  }


  /* ══════════════════════════════════════════════════
     5. STAT ITEMS — STRICTLY ONE-WAY
  ══════════════════════════════════════════════════ */
  function initCounters() {
    const REVEAL_MS = 700;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (el.dataset.done) return;
        if (entry.isIntersecting) {
          const delay = parseInt(el.dataset.delay || 0);
          setTimeout(() => {
            el.classList.add('visible');
            setTimeout(() => {
              const numEl = el.querySelector('.stat-num');
              const target = parseInt(numEl?.dataset.count || 0);
              if (numEl && !el.dataset.counted) {
                el.dataset.counted = 'y';
                countUp(numEl, target, 1400);
              }
              el.dataset.done = 'y';
            }, REVEAL_MS + 60);
          }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.stat-item').forEach(el => io.observe(el));
  }

  function countUp(el, target, dur) {
    const TICK = 33;
    const steps = Math.round(dur / TICK);
    let step = 0;
    function tick() {
      step++;
      const t = step / steps;
      const ease = 1 - Math.pow(1 - Math.min(t, 1), 4);
      el.textContent = Math.floor(ease * target).toLocaleString();
      if (step < steps) setTimeout(tick, TICK);
      else el.textContent = target.toLocaleString();
    }
    tick();
  }


  /* ══════════════════════════════════════════════════
     6. FEATURE CARDS — Two-way hysteresis + 3D tilt
  ══════════════════════════════════════════════════ */
  function initFeatures() {
    makeTwoWayObserver('.feat-card', 80, '0px 0px -40px 0px');

    /* 3D tilt — desktop only */
    if (!isTouch) {
      document.querySelectorAll('.feat-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width  - 0.5;
          const y = (e.clientY - r.top)  / r.height - 0.5;
          card.style.transform  = `translate3d(0,0,0) scale(1.04) rotateX(${-y*6}deg) rotateY(${x*6}deg)`;
          card.style.transition = 'transform .06s linear';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform  = '';
          card.style.transition = 'transform .4s cubic-bezier(.22,1,.36,1)';
        });
      });
    }
  }


  /* ══════════════════════════════════════════════════
     7. COMMUNITY CARDS — ONE-WAY + stagger
  ══════════════════════════════════════════════════ */
  function initComm() {
    /* Observe both .comm-card and .comm-card-v2 */
    const cards = [...document.querySelectorAll('.comm-card, .comm-card-v2')];

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const i = cards.indexOf(el);
          const delay = parseInt(el.dataset.delay || i * 55);
          setTimeout(() => el.classList.add('visible'), delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(el => io.observe(el));
  }


  /* ══════════════════════════════════════════════════
     8. NEWS CARDS — ONE-WAY + stagger
  ══════════════════════════════════════════════════ */
  function initNews() {
    const cards = [...document.querySelectorAll('.news-card')];

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const i = cards.indexOf(el);
          setTimeout(() => el.classList.add('visible'), i * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(el => io.observe(el));
  }



  /* ══════════════════════════════════════════════════
     9. SCROLL HINT
  ══════════════════════════════════════════════════ */
  function initScrollHint() {
    const hint = document.querySelector('.scroll-hint');
    if (!hint) return;
    let done = false;
    window.addEventListener('scroll', () => {
      if (!done && window.scrollY > 60) {
        done = true;
        hint.style.cssText += ';opacity:0;transform:translateX(-50%) translateY(14px);transition:opacity .5s ease,transform .5s ease;pointer-events:none';
      }
    }, { passive: true });
  }


  /* ══════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════ */
  function boot() {
    updateProgress();
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
    initReveal();
    initCounters();
    initFeatures();
    initComm();
    initNews();
    initScrollHint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();