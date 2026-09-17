(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------
     Scroll progress bar
  ----------------------------------------------------------------- */
  const progressBar = document.getElementById('scrollProgress');
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* -----------------------------------------------------------------
     Nav: shrink + blur on scroll
  ----------------------------------------------------------------- */
  const nav = document.getElementById('nav');
  function updateNav() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  document.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* -----------------------------------------------------------------
     Cursor glow (desktop / hover-capable only)
  ----------------------------------------------------------------- */
  const glow = document.getElementById('cursorGlow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    let cx = gx, cy = gy;
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; });
    function loop() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* -----------------------------------------------------------------
     Generic scroll reveal via IntersectionObserver
  ----------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    // Only hide content via CSS once we know the observer will reveal it again.
    document.documentElement.classList.add('js-reveal-ready');

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay || 0;
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => io.observe(el));

    // Safety net: if anything goes wrong (e.g. an element never intersects
    // due to layout edge cases), force everything visible after a max wait.
    setTimeout(() => {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }, 4000);
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Stagger hero lines a touch more deliberately right away */
  const heroReveals = document.querySelectorAll('#hero [data-reveal]');
  heroReveals.forEach((el, i) => {
    el.style.transitionDelay = (i * 90) + 'ms';
  });

  /* -----------------------------------------------------------------
     Hero word-cycle (Media / Marketing / Branding / Technology)
  ----------------------------------------------------------------- */
  const words = ['Media', 'Marketing', 'Branding', 'Technology'];
  const cycleWordEl = document.getElementById('cycleWord');
  const cycleLineEl = document.querySelector('.cycle-line');
  const heroHeadlineEl = document.querySelector('.hero-headline-fill');

  /* Shrinks the whole headline's font-size (all three lines scale together,
     since they share one font-size) just enough that the longest word on
     the cycling line never overflows its container. Measures real
     rendered widths rather than relying on a fixed clamp() guess, so it
     self-corrects for font-rendering differences across devices. */
  function fitCycleLine() {
    if (!cycleLineEl || !heroHeadlineEl) return;
    heroHeadlineEl.style.fontSize = '';
    const containerWidth = cycleLineEl.parentElement.clientWidth;
    let current = parseFloat(getComputedStyle(heroHeadlineEl).fontSize);
    let guard = 0;
    while (cycleLineEl.scrollWidth > containerWidth && guard < 40) {
      current -= 1;
      heroHeadlineEl.style.fontSize = current + 'px';
      guard++;
    }
  }

  if (cycleWordEl && !reduceMotion) {
    let idx = 0;
    setInterval(() => {
      cycleWordEl.classList.add('swap-out');
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        cycleWordEl.textContent = words[idx];
        cycleWordEl.classList.remove('swap-out');
        cycleWordEl.classList.add('swap-in');
        fitCycleLine();
        setTimeout(() => cycleWordEl.classList.remove('swap-in'), 520);
      }, 480);
    }, 2400);
  }

  // Fit on load (covers whichever word starts visible) and on resize/orientation change.
  window.addEventListener('load', fitCycleLine);
  window.addEventListener('resize', fitCycleLine);
  fitCycleLine();

  /* -----------------------------------------------------------------
     Ledger rows tally in when the ledger enters view
  ----------------------------------------------------------------- */
  const ledgerTable = document.getElementById('ledgerTable');
  if (ledgerTable && 'IntersectionObserver' in window && !reduceMotion) {
    const ledgerIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ledgerTable.classList.add('is-active');
          ledgerIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    ledgerIO.observe(ledgerTable);
    setTimeout(() => ledgerTable.classList.add('is-active'), 4000);
  } else if (ledgerTable) {
    ledgerTable.classList.add('is-active');
  }

  /* -----------------------------------------------------------------
     How-it-works: fill connecting line + activate markers as steps enter
  ----------------------------------------------------------------- */
  const stepsWrap = document.getElementById('stepsWrap');
  const stepsLineFill = document.getElementById('stepsLineFill');
  const stepEls = document.querySelectorAll('[data-step]');
  if (stepsWrap && stepEls.length && 'IntersectionObserver' in window) {
    let activeCount = 0;
    const stepIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
          stepIO.unobserve(entry.target);
          activeCount++;
          const pct = (activeCount / stepEls.length) * 100;
          if (stepsLineFill) stepsLineFill.style.width = pct + '%';
        }
      });
    }, { threshold: 0.5 });
    stepEls.forEach((el) => stepIO.observe(el));
  }

  /* -----------------------------------------------------------------
     Magnetic buttons
  ----------------------------------------------------------------- */
  const magnets = document.querySelectorAll('.magnetic');
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    magnets.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* -----------------------------------------------------------------
     Pillar card cursor-tracked glow
  ----------------------------------------------------------------- */
  const tiltCards = document.querySelectorAll('[data-tilt]');
  if (window.matchMedia('(hover: hover)').matches) {
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  }

  /* -----------------------------------------------------------------
     Smooth in-page nav scrolling (native scroll-behavior already set,
     this just accounts for fixed header offset)
  ----------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* -----------------------------------------------------------------
     Partner With Us modal
  ----------------------------------------------------------------- */
  const partnerModal = document.getElementById('partnerModal');
  const openTriggers = document.querySelectorAll('[data-open-partner]');
  const closeTriggers = partnerModal ? partnerModal.querySelectorAll('[data-close-partner]') : [];
  let lastFocused = null;

  function openPartnerModal() {
    if (!partnerModal) return;
    lastFocused = document.activeElement;
    partnerModal.classList.add('is-open');
    partnerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const closeBtn = partnerModal.querySelector('.partner-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closePartnerModal() {
    if (!partnerModal) return;
    partnerModal.classList.remove('is-open');
    partnerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  openTriggers.forEach((btn) => btn.addEventListener('click', openPartnerModal));
  closeTriggers.forEach((btn) => btn.addEventListener('click', closePartnerModal));

  if (partnerModal) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && partnerModal.classList.contains('is-open')) closePartnerModal();
    });
  }
})();
