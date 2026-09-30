/* ==========================================================================
   STACKLY — script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    setTimeout(() => preloader.classList.add('is-hidden'), 400);
  });
  // fallback in case 'load' already fired
  setTimeout(() => preloader && preloader.classList.add('is-hidden'), 2500);

  /* ---------- AOS init ---------- */
  if (window.AOS) {
    AOS.init({ duration: 800, once: true, offset: 60, easing: 'ease-out-cubic' });
  }

  /* ---------- Custom cursor ---------- */
  const cursorDot = document.getElementById('cursorDot');
  if (cursorDot && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => { cursorDot.style.width = '26px'; cursorDot.style.height = '26px'; });
      el.addEventListener('mouseleave', () => { cursorDot.style.width = '10px'; cursorDot.style.height = '10px'; });
    });
  }

  /* ---------- Sticky header on scroll ---------- */
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    backToTop.classList.toggle('visible', y > 600);
    updateActiveNav();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Hamburger / mobile drawer ---------- */
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  const toggleDrawer = () => {
    hamburger.classList.toggle('active');
    drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
  };
  hamburger.addEventListener('click', toggleDrawer);
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = Array.from(navLinks).map(l => {
    const href = l.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return null; // skip cross-page links (e.g. blog.html nav)
    try { return document.querySelector(href); } catch (e) { return null; }
  }).filter(Boolean);
  function updateActiveNav(){
    if (!sections.length) return; // nothing to track on pages with no in-page anchors
    let current = sections[0];
    const scrollPos = window.scrollY + 140;
    sections.forEach(sec => { if (sec.offsetTop <= scrollPos) current = sec; });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));
  }
  onScroll(); // run once now that navLinks/sections exist

  /* ---------- Animated stat counters ---------- */
  const statNums = document.querySelectorAll('.stat-num');
  const countUp = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
  };
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { countUp(entry.target); statObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  statNums.forEach(el => statObserver.observe(el));

  /* ---------- Menu tabs ---------- */
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.menu-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
      if (window.gsap) {
        gsap.fromTo(`.menu-panel[data-panel="${tab.dataset.tab}"] .menu-card`,
          { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .5, stagger: .08, ease: 'power2.out' });
      }
    });
  });

  /* ---------- Testimonial slider ---------- */
  const testiCards = document.querySelectorAll('.testi-card');
  const testiDotsWrap = document.getElementById('testiDots');
  let testiIndex = 0;
  testiCards.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => showTesti(i));
    testiDotsWrap.appendChild(dot);
  });
  function showTesti(i){
    testiCards[testiIndex].classList.remove('active');
    testiDotsWrap.children[testiIndex].classList.remove('active');
    testiIndex = i;
    testiCards[testiIndex].classList.add('active');
    testiDotsWrap.children[testiIndex].classList.add('active');
  }
  if (testiCards.length) setInterval(() => showTesti((testiIndex + 1) % testiCards.length), 5000);

  /* ---------- GSAP hero entrance timeline ---------- */
  if (window.gsap) {
    // split first hero line into characters
    const firstLine = document.querySelector('.hero-title .line:not(.hero-title--accent)');
    if (firstLine) {
      firstLine.innerHTML = firstLine.textContent.split(' ').map(w =>
        '<span class="word">' + w.split('').map(c => '<span class="char">' + c + '</span>').join('') + '</span>').join(' ');
    }

    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('[data-gsap="tag"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, delay: .3 })
      .fromTo('.hero-title .char', { yPercent: 120, rotationX: -80, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, duration: .9, stagger: .035, ease: 'back.out(1.6)' }, '-=.3')
      .fromTo('.hero-title--accent', { opacity: 0, y: 50, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: .9 }, '-=.6')
      .fromTo('[data-gsap="fade"]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .15 }, '-=.4')
      .fromTo('.plate-stage', { opacity: 0, scale: .8, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.5)' }, '-=.9')
      .fromTo('.orbit-chip', { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .5, stagger: .12 }, '-=.5');

    // continuous plate float + slow rotation
    gsap.to('.plate-main', { rotate: 6, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 50%' });
    gsap.to('.plate-stage', { y: -14, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // parallax blobs on scroll
    gsap.to('.hero-blob--1', { y: 120, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.to('.hero-blob--2', { y: -80, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

    // section title reveal via ScrollTrigger for a few key headings
    gsap.utils.toArray('.section-title').forEach(title => {
      gsap.fromTo(title, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: title, start: 'top 85%' }
      });
    });

    // phone mock float in app CTA
    gsap.to('.phone-mock', { y: -16, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }


  /* ==================================================================
     V2 — NEW ANIMATIONS
     ================================================================== */

  /* ---------- scroll progress ---------- */
  const prog = document.getElementById('scrollProgress');
  const updateProg = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  };
  addEventListener('scroll', updateProg, { passive: true }); updateProg();

  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- cursor ring (lerped follower) ---------- */
  const ring = document.getElementById('cursorRing');
  if (ring && finePointer) {
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop(){ rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
    document.querySelectorAll('a, button, [data-tilt], .g-item').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ---------- button ripple ---------- */
  document.querySelectorAll('.btn, .btn-login, .store-badge').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(dot); setTimeout(() => dot.remove(), 700);
    });
  });

  /* ---------- magnetic buttons ---------- */
  if (finePointer && window.gsap) {
    document.querySelectorAll('.btn, .btn-login, .icon-btn, .social-row a').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ---------- hero mouse parallax (bubbles + plate tilt) ---------- */
  const hero = document.querySelector('.hero');
  if (hero && finePointer && window.gsap) {
    const bubbles = hero.querySelectorAll('.hero-bubble');
    const chips = hero.querySelectorAll('.orbit-chip');
    hero.addEventListener('mousemove', e => {
      const nx = (e.clientX / innerWidth - .5), ny = (e.clientY / innerHeight - .5);
      bubbles.forEach(b => gsap.to(b, { x: nx * b.dataset.depth, y: ny * b.dataset.depth, duration: .8, ease: 'power3.out' }));
      chips.forEach((c, i) => gsap.to(c, { x: -nx * (18 + i * 8), duration: .9, ease: 'power3.out', overwrite: 'auto' }));
      gsap.to('.plate-photo', { rotationY: nx * 18, rotationX: -ny * 18, transformPerspective: 900, duration: .8, ease: 'power3.out' });
    });
    hero.addEventListener('mouseleave', () => {
      gsap.to(bubbles, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.5)' });
      gsap.to('.plate-photo', { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1,.5)' });
    });
  }
  if (window.gsap) {
    // bubbles bob independently
    gsap.utils.toArray('.hero-bubble').forEach((b, i) => {
      gsap.to(b, { scale: 1.06, rotation: i % 2 ? 6 : -6, duration: 3 + i * .6, delay: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    gsap.from('.hero-bubble', { scale: 0, opacity: 0, duration: .9, stagger: .15, delay: 1.2, ease: 'back.out(2)' });
  }

  /* ---------- 3D tilt cards ---------- */
  if (finePointer) {
    // AOS leaves a slow transform transition on elements; release it once revealed
    document.addEventListener('aos:in', e => {
      const el = e.detail;
      if (el && el.hasAttribute('data-tilt')) setTimeout(() => { el.removeAttribute('data-aos'); el.classList.remove('aos-animate'); }, 1300);
    });
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        if (card.hasAttribute('data-aos')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        card.style.transition = 'transform .12s linear';
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 9) + 'deg) rotateY(' + (px * 9) + 'deg) translateY(-6px) scale(1.02)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .6s cubic-bezier(.4,0,.2,1)';
        card.style.transform = '';
      });
    });
  }

  if (window.gsap && window.ScrollTrigger) {

    /* ---------- word-by-word scroll highlight ---------- */
    document.querySelectorAll('.reveal-words').forEach(p => {
      p.innerHTML = p.textContent.trim().split(/\s+/).map(w => '<span class="w">' + w + '</span>').join(' ');
      const words = p.querySelectorAll('.w');
      ScrollTrigger.create({
        trigger: p, start: 'top 85%', end: 'bottom 45%', scrub: true,
        onUpdate: self => { const n = Math.floor(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); }
      });
    });

    /* ---------- image parallax ---------- */
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      gsap.to(el, { y: parseFloat(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('.blog-img img, .contact-photo img').forEach(img => {
      gsap.fromTo(img, { yPercent: -8, scale: 1.2 }, { yPercent: 8, scale: 1.2, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- how-it-works: photo pop-in sequence ---------- */
    gsap.from('.how-step-photo', { clearProps: 'transform', scale: 0, rotation: -90, opacity: 0, duration: 1, stagger: .25, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.how-steps', start: 'top 80%' } });

    /* ---------- photo strip speeds up with scroll velocity ---------- */
    const groups = document.querySelectorAll('.photo-group');
    const tw = gsap.to(groups, { xPercent: -100, ease: 'none', duration: 40, repeat: -1 });
    groups.forEach(g => g.style.animation = 'none');
    ScrollTrigger.create({
      onUpdate: self => {
        const v = Math.min(Math.abs(self.getVelocity()) / 400, 6);
        gsap.to(tw, { timeScale: 1 + v, duration: .3, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: 1, duration: 1.2 }) });
      }
    });

    /* ---------- featured cards: fan-in ---------- */
    gsap.from('.featured-card', { y: 90, rotation: (i) => (i - 1.5) * 6, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.featured-track', start: 'top 82%' }, clearProps: 'transform,opacity' });

    /* ---------- section background color-shift glow ---------- */
    gsap.utils.toArray('.marquee-strip').forEach(m => {
      gsap.to(m.querySelector('.marquee-track'), { x: -120, ease: 'none', scrollTrigger: { trigger: m, scrub: 1 } });
    });
  }


  /* ---------- clip-path image reveals (position check; works even while clipped) ---------- */
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const checkReveal = () => {
    revealEls.forEach((el, i) => {
      if (el.classList.contains('revealed') || el.dataset.pending) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) {
        el.dataset.pending = '1';
        setTimeout(() => el.classList.add('revealed'), (i % 3) * 120);
      }
    });
  };
  addEventListener('scroll', checkReveal, { passive: true });
  addEventListener('resize', checkReveal);
  addEventListener('load', checkReveal);
  checkReveal();
  setTimeout(checkReveal, 1200);

});
/* ==========================================================================
   BLOG PAGE (blog.html) — animations for the 7 sections
   Everything below is guarded by element checks, so it safely does nothing
   on pages (like index.html) that don't contain these elements.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 2. Featured story: clip-path wipe-in on scroll ---------- */
  const featMedia = document.querySelector('[data-blogp-wipe]');
  if (featMedia) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { featMedia.classList.add('in-view'); io.unobserve(featMedia); }
      });
    }, { threshold: 0.3 });
    io.observe(featMedia.parentElement); /* observe unclipped wrapper; clip-path hides featMedia from the observer */
  }

  /* ---------- 3. Category filter tabs ---------- */
  const filterBtns = document.querySelectorAll('.blogp-filter');
  const blogpCards = document.querySelectorAll('.blogp-card');
  if (filterBtns.length && blogpCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        blogpCards.forEach(card => {
          const match = f === 'all' || card.dataset.cat === f;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ---------- 4. Trending: drag-to-scroll + center-scale focus + progress bar ---------- */
  const trendTrack = document.getElementById('blogpTrendTrack');
  const trendProgress = document.getElementById('blogpTrendProgress');
  if (trendTrack) {
    let isDown = false, startX = 0, scrollStart = 0;
    trendTrack.addEventListener('pointerdown', e => {
      isDown = true; trendTrack.classList.add('is-dragging');
      startX = e.clientX; scrollStart = trendTrack.scrollLeft;
      trendTrack.setPointerCapture(e.pointerId);
    });
    trendTrack.addEventListener('pointermove', e => {
      if (!isDown) return;
      trendTrack.scrollLeft = scrollStart - (e.clientX - startX);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
      trendTrack.addEventListener(ev, () => { isDown = false; trendTrack.classList.remove('is-dragging'); })
    );

    const trendCards = trendTrack.querySelectorAll('.blogp-trend-card');
    const updateTrend = () => {
      const trackRect = trendTrack.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = null, closestDist = Infinity;
      trendCards.forEach(card => {
        const r = card.getBoundingClientRect();
        const dist = Math.abs((r.left + r.width / 2) - center);
        if (dist < closestDist) { closestDist = dist; closest = card; }
      });
      trendCards.forEach(c => c.classList.toggle('is-center', c === closest));
      if (trendProgress) {
        const max = trendTrack.scrollWidth - trendTrack.clientWidth;
        trendProgress.style.width = (max > 0 ? (trendTrack.scrollLeft / max) * 100 : 0) + '%';
      }
    };
    trendTrack.addEventListener('scroll', updateTrend, { passive: true });
    addEventListener('resize', updateTrend);
    updateTrend();
  }

  /* ---------- 6. Subscribe form: underline + checkmark-draw success ---------- */
  const subForm = document.getElementById('blogpSubForm');
  if (subForm) {
    const subBtn = subForm.querySelector('button');
    const subSuccess = document.getElementById('blogpSubSuccess');
    const subEmail = document.getElementById('blogpSubEmail');
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!subEmail.checkValidity()) { subEmail.reportValidity(); return; }
      subBtn.classList.add('is-sent');
      subSuccess.classList.add('show');
      setTimeout(() => {
        subBtn.classList.remove('is-sent');
        subSuccess.classList.remove('show');
        subForm.reset();
      }, 3200);
    });
  }

  /* ---------- 7. Latest reads: cursor-following image preview ---------- */
  const blogpPreview = document.getElementById('blogpPreview');
  const blogpPreviewImg = document.getElementById('blogpPreviewImg');
  const listRows = document.querySelectorAll('.blogp-list-row');
  if (blogpPreview && listRows.length && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    listRows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        blogpPreviewImg.src = row.dataset.previewImg || '';
        blogpPreview.classList.add('show');
      });
      row.addEventListener('mousemove', (e) => {
        blogpPreview.style.left = e.clientX + 'px';
        blogpPreview.style.top = e.clientY + 'px';
      });
      row.addEventListener('mouseleave', () => blogpPreview.classList.remove('show'));
    });
  }

});


/* ==========================================================================
   ABOUT PAGE (about.html) — 7 sections, all-new animation language
   Guarded: does nothing on pages without <main class="abt-page">.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('.abt-page');
  if (!page) return;
  document.body.classList.add('abt-js');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* watch(): fire cb once when el enters view (or is already above the viewport).
     Always pass an element that is NOT hidden by clip-path / zero size,
     otherwise IntersectionObserver never fires. */
  const watch = (el, cb, threshold = 0.25) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        // also fire for elements already scrolled past (page refresh mid-page, anchor jumps, fast scrolling)
        if (en.isIntersecting || en.boundingClientRect.bottom < 0) { cb(en.target); io.unobserve(en.target); }
      });
    }, { threshold });
    io.observe(el);
  };

  /* ---------- shared: rising headline masks ---------- */
  page.querySelectorAll('.abt-rise').forEach(el => watch(el, t => t.classList.add('is-in'), 0.4));

  /* ---------- 1. HERO: split letters, start after preloader, flashlight ---------- */
  const title = page.querySelector('.abt-title');
  if (title) {
    let ci = 0;
    title.querySelectorAll('.abt-line').forEach(line => {
      const text = line.textContent.trim();
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      const words = text.split(' ');
      words.forEach((w, wi) => {
        const word = document.createElement('span');
        word.className = 'abt-word';
        Array.from(w).forEach(ch => {
          const s = document.createElement('span');
          s.className = 'abt-char';
          s.textContent = ch;
          s.style.setProperty('--ci', ci++);
          word.appendChild(s);
        });
        line.appendChild(word);
        if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });
  }
  const setReady = () => document.body.classList.add('abt-ready');
  const pre = document.getElementById('preloader');
  if (!pre || pre.classList.contains('is-hidden')) {
    setReady();
  } else {
    const mo = new MutationObserver(() => {
      if (pre.classList.contains('is-hidden')) { mo.disconnect(); setTimeout(setReady, 150); }
    });
    mo.observe(pre, { attributes: true, attributeFilter: ['class'] });
    setTimeout(setReady, 3200); // safety net
  }

  const hero = page.querySelector('.abt-hero');
  if (hero) {
    let tx = 50, ty = 50, cx = 50, cy = 50, lastMove = -9999, visible = true, running = false;
    const loop = (now) => {
      if (!visible) { running = false; return; }
      const idle = now - lastMove > 2600 || !fine;
      if (idle && !reduce) {
        const t = now / 1000;
        tx = 50 + 30 * Math.sin(t * 0.55);
        ty = 50 + 24 * Math.sin(t * 0.83 + 1.2);
      }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty('--mx', cx.toFixed(2) + '%');
      hero.style.setProperty('--my', cy.toFixed(2) + '%');
      requestAnimationFrame(loop);
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      lastMove = performance.now();
    });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    start();
  }

  /* ---------- 2. STORY: polaroids develop + receipt prints ---------- */
  watch(page.querySelector('.abt-story'), el => el.classList.add('is-in'), 0.12);
  watch(page.querySelector('.abt-printer'), el => el.classList.add('is-printing'), 0.35);

  /* ---------- 3. NUMBERS: liquid fill + count-up ---------- */
  const countTo = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const dur = 2400, t0 = performance.now();
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    };
    requestAnimationFrame(step);
  };
  page.querySelectorAll('.abt-orb').forEach((orb, i) => {
    watch(orb, (el) => {
      setTimeout(() => {
        el.classList.add('is-filled');
        const num = el.querySelector('.abt-orb-num');
        if (num) countTo(num);
      }, i * 170);
    }, 0.35);
  });

  /* ---------- 4. JOURNEY: path is built from real node positions, scooter follows scroll ---------- */
  const route = document.getElementById('abtRoute');
  let updateRoute = () => {}, rebuildRoute = () => {};
  if (route) {
    const svg = route.querySelector('.abt-route-svg');
    const base = svg.querySelector('.abt-route-base');
    const live = svg.querySelector('.abt-route-live');
    const rider = document.getElementById('abtRider');
    const riderIcon = rider.querySelector('i');
    const stops = Array.from(route.querySelectorAll('.abt-stop'));
    let pts = [], len = 0;

    rebuildRoute = () => {
      const rb = route.getBoundingClientRect();
      if (!rb.width || !stops.length) return;
      svg.setAttribute('width', rb.width); svg.setAttribute('height', rb.height);
      svg.setAttribute('viewBox', `0 0 ${rb.width} ${rb.height}`);
      pts = stops.map(s => {
        const n = s.querySelector('.abt-stop-node').getBoundingClientRect();
        return { x: n.left - rb.left + n.width / 2, y: n.top - rb.top + n.height / 2 };
      });
      const amp = innerWidth <= 760 ? 10 : Math.min(120, rb.width * 0.11);
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dy = b.y - a.y, dir = i % 2 === 0 ? 1 : -1;
        d += ` C ${a.x + dir * amp} ${a.y + dy * 0.3}, ${b.x - dir * amp} ${a.y + dy * 0.7}, ${b.x} ${b.y}`;
      }
      base.setAttribute('d', d); live.setAttribute('d', d);
      len = live.getTotalLength();
      live.style.strokeDasharray = len;
      updateRoute();
    };
    const pointAtY = (ty) => {          // path is monotonic in Y, so binary search is safe
      let lo = 0, hi = len;
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2;
        if (live.getPointAtLength(mid).y < ty) lo = mid; else hi = mid;
      }
      return { l: lo, p: live.getPointAtLength(lo) };
    };
    updateRoute = () => {
      if (!len || !pts.length) return;
      const rb = route.getBoundingClientRect();
      const raw = innerHeight * 0.58 - rb.top;
      const target = clamp(raw, pts[0].y, pts[pts.length - 1].y);
      const { l, p } = pointAtY(target);
      live.style.strokeDashoffset = len - l;
      rider.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      rider.style.opacity = raw >= pts[0].y - 80 ? 1 : 0;
      const q = live.getPointAtLength(Math.min(len, l + 6));
      riderIcon.style.transform = `scaleX(${q.x >= p.x ? 1 : -1})`;
      stops.forEach((s, i) => s.classList.toggle('is-on', raw >= pts[i].y - 4));
    };
    if ('ResizeObserver' in window) new ResizeObserver(rebuildRoute).observe(route);
    rebuildRoute();
  }

  /* ---------- 5. VALUES: stacked cards shrink + darken as the next one lands ---------- */
  const vcards = Array.from(page.querySelectorAll('.abt-vcard'));
  let stickyTops = [];
  const measureStack = () => { stickyTops = vcards.map(c => parseFloat(getComputedStyle(c).top) || 0); };
  const updateStack = () => {
    vcards.forEach((c, i) => {
      const nx = vcards[i + 1];
      if (!nx || !stickyTops.length) return;
      const h = c.offsetHeight;
      const start = stickyTops[i] + h;                       // next card just touches this one
      const end = stickyTops[i] + (stickyTops[i + 1] - stickyTops[i]);   // next card fully stacked
      const p = clamp((start - nx.getBoundingClientRect().top) / (start - end), 0, 1);
      c.style.transform = `scale(${(1 - p * 0.055).toFixed(4)})`;
      c.style.setProperty('--p', p.toFixed(3));
    });
  };
  measureStack();

  /* ---------- 6. TEAM: deal the cards, 3D tilt + shine ---------- */
  watch(document.getElementById('abtTeamGrid'), el => el.classList.add('is-dealt'), 0.2);
  if (fine && !reduce) {
    page.querySelectorAll('.abt-card-tilt').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        card.classList.add('is-hover');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
        card.classList.remove('is-hover');
      });
    });
  }

  /* ---------- 7. CTA: scroll-speed skew marquees, magnetic button, ingredient burst ---------- */
  const marquees = Array.from(page.querySelectorAll('.abt-marquee'));
  const actions = document.getElementById('abtActions');
  const burstBtn = document.getElementById('abtBurst');
  if (actions && burstBtn) {
    if (fine && !reduce) {
      actions.addEventListener('pointermove', (e) => {
        const r = burstBtn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 150) burstBtn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
        else burstBtn.style.transform = '';
      });
      actions.addEventListener('pointerleave', () => { burstBtn.style.transform = ''; });
    }
    const icons = ['fa-pizza-slice', 'fa-burger', 'fa-lemon', 'fa-carrot', 'fa-cheese', 'fa-bowl-food', 'fa-pepper-hot', 'fa-drumstick-bite', 'fa-cookie-bite', 'fa-ice-cream'];
    const burst = () => {
      const wr = actions.getBoundingClientRect(), br = burstBtn.getBoundingClientRect();
      const ox = br.left - wr.left + br.width / 2, oy = br.top - wr.top + br.height / 2;
      const n = innerWidth < 640 ? 14 : 20;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('i');
        p.className = 'abt-burst-p fa-solid ' + icons[i % icons.length];
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4, dist = 90 + Math.random() * 130;
        p.style.left = ox + 'px'; p.style.top = oy + 'px';
        p.style.fontSize = (16 + Math.random() * 16) + 'px';
        p.style.color = i % 3 === 0 ? 'var(--cream)' : 'var(--gold-2)';
        p.style.setProperty('--tx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--ty', (Math.sin(a) * dist - 40).toFixed(0) + 'px');
        p.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
        actions.appendChild(p);
        setTimeout(() => p.remove(), 1150);
      }
    };
    burstBtn.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      burst();
      const href = burstBtn.getAttribute('href');
      setTimeout(() => { window.location.href = href; }, 850);
    });
  }

  /* ---------- one shared, rAF-throttled scroll loop ---------- */
  let ticking = false, lastY = window.scrollY, skew = 0;
  const frame = () => {
    ticking = false;
    const y = window.scrollY, v = y - lastY; lastY = y;
    skew += (clamp(v * 0.22, -9, 9) - skew) * 0.2;
    if (!reduce) marquees.forEach(m => m.style.setProperty('--sk', skew.toFixed(2) + 'deg'));
    updateRoute();
    updateStack();
    if (Math.abs(skew) > 0.05) requestTick();
  };
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', () => { measureStack(); rebuildRoute(); requestTick(); });
  addEventListener('load', () => { measureStack(); rebuildRoute(); requestTick(); });
  requestTick();
});
/* ==========================================================================
   CONTACT PAGE (contact.html) — 7 sections, all-new animation language
   Guarded: does nothing on pages without <main class="cnt-page">.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('.cnt-page');
  if (!page) return;

  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. HERO: typewriter, starts once the preloader is gone ---------- */
  const typeEl = document.getElementById('cntType');
  if (typeEl) {
    const full = typeEl.textContent.trim();
    const runTyping = () => {
      if (reduce) { typeEl.textContent = full; return; }
      typeEl.textContent = '';
      let i = 0;
      const tick = () => {
        typeEl.textContent = full.slice(0, i);
        i++;
        if (i <= full.length) setTimeout(tick, 34 + Math.random() * 34);
      };
      tick();
    };
    const pre = document.getElementById('preloader');
    if (!pre || pre.classList.contains('is-hidden')) {
      setTimeout(runTyping, 200);
    } else {
      const mo = new MutationObserver(() => {
        if (pre.classList.contains('is-hidden')) { mo.disconnect(); setTimeout(runTyping, 250); }
      });
      mo.observe(pre, { attributes: true, attributeFilter: ['class'] });
      setTimeout(runTyping, 3000); // safety net
    }
  }

  /* ---------- 2. FORM: cursor spotlight + paper-plane submit ---------- */
  const cntForm = document.getElementById('cntForm');
  if (cntForm) {
    if (fine) {
      cntForm.addEventListener('pointermove', (e) => {
        const r = cntForm.getBoundingClientRect();
        cntForm.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        cntForm.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
        cntForm.classList.add('is-active');
      });
      cntForm.addEventListener('pointerleave', () => cntForm.classList.remove('is-active'));
    }
    const sendBtn = document.getElementById('cntSendBtn');
    const successMsg = document.getElementById('cntFormSuccess');
    cntForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cntForm.checkValidity()) { cntForm.reportValidity(); return; }
      sendBtn.classList.add('is-sending');
      setTimeout(() => {
        successMsg.classList.add('show');
        cntForm.reset();
      }, 550);
      setTimeout(() => {
        sendBtn.classList.remove('is-sending');
        successMsg.classList.remove('show');
      }, 3800);
    });
  }

  /* ---------- 3. CHANNELS: orbiting ring detail swap ---------- */
  const orbitItems = document.querySelectorAll('.cnt-orbit-item');
  const orbitTitle = document.getElementById('cntOrbitTitle');
  const orbitText = document.getElementById('cntOrbitText');
  if (orbitItems.length && orbitTitle) {
    orbitItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        orbitTitle.style.opacity = 0; orbitText.style.opacity = 0;
        setTimeout(() => {
          orbitTitle.textContent = item.dataset.title;
          orbitText.textContent = item.dataset.detail;
          orbitTitle.style.opacity = 1; orbitText.style.opacity = 1;
        }, 160);
      });
      item.addEventListener('click', (e) => { if (item.getAttribute('href') === '#') e.preventDefault(); });
    });
  }

  /* ---------- 4. VISIT US: city tabs + pin-drop map ---------- */
  const cityTabs = document.querySelectorAll('.cnt-city-tab');
  const mapPin = document.getElementById('cntMapPin');
  const mapAddr = document.getElementById('cntMapAddr');
  const mapMeta = document.getElementById('cntMapMeta');
  const cities = [
    { px: '42%', py: '40%', addr: '221 Harbor Lane', meta: 'Portside District · Open until 11pm' },
    { px: '68%', py: '58%', addr: '9 Overlook Terrace', meta: 'Harborview District · Open until 10pm' },
    { px: '30%', py: '68%', addr: '54 Eastgate Row', meta: 'Eastgate District · Open until 11pm' }
  ];
  if (cityTabs.length && mapPin) {
    cityTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        cityTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const c = cities[parseInt(tab.dataset.city, 10)];
        mapPin.style.setProperty('--px', c.px);
        mapPin.style.setProperty('--py', c.py);
        mapAddr.textContent = c.addr;
        mapMeta.textContent = c.meta;
        const icon = mapPin.querySelector('i');
        icon.style.animation = 'none';
        void icon.offsetWidth; /* force reflow so the drop animation replays */
        icon.style.animation = '';
      });
    });
  }

  /* ---------- 5. FAQ: sliding side-drawer answers ---------- */
  const faqQs = document.querySelectorAll('.cnt-faq-q');
  const faqPanels = document.querySelectorAll('.cnt-faq-panel');
  if (faqQs.length) {
    faqQs.forEach(q => {
      q.addEventListener('click', () => {
        faqQs.forEach(x => x.classList.remove('active'));
        q.classList.add('active');
        faqPanels.forEach(p => p.classList.toggle('active', p.dataset.faq === q.dataset.faq));
      });
    });
  }

  /* ---------- 6. SUPPORT HOURS: live world clocks ---------- */
  const clockCards = document.querySelectorAll('.cnt-clock-card');
  if (clockCards.length) {
    const updateClocks = () => {
      const nowUTC = Date.now();
      clockCards.forEach(card => {
        const tz = parseFloat(card.dataset.tz);
        const open = parseInt(card.dataset.open, 10);
        const close = parseInt(card.dataset.close, 10);
        const local = new Date(nowUTC + tz * 3600000);
        const h = local.getUTCHours(), m = local.getUTCMinutes();
        const hourDeg = (h % 12) * 30 + m * 0.5;
        const minDeg = m * 6;
        const hourHand = card.querySelector('.hand.hour');
        const minHand = card.querySelector('.hand.min');
        if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
        if (minHand) minHand.style.transform = `rotate(${minDeg}deg)`;
        const timeEl = card.querySelector('.cnt-clock-time');
        if (timeEl) timeEl.textContent = local.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        const statusEl = card.querySelector('.cnt-status');
        const isOpen = h >= open && h < close;
        statusEl.classList.toggle('is-online', isOpen);
        statusEl.querySelector('em').textContent = isOpen ? 'Online now' : 'Back at ' + (open % 12 || 12) + (open < 12 ? 'am' : 'pm');
      });
    };
    updateClocks();
    setInterval(updateClocks, 30000);
  }

  /* ---------- 7. CTA: plane flight + sealing envelope ---------- */
  const envBtn = document.getElementById('cntEnvelopeBtn');
  const ctaConfirm = document.getElementById('cntCtaConfirm');
  if (envBtn) {
    envBtn.addEventListener('click', () => {
      if (envBtn.classList.contains('is-sent')) return;
      envBtn.classList.add('is-sent');
      setTimeout(() => ctaConfirm.classList.add('show'), 500);
      setTimeout(() => {
        envBtn.classList.remove('is-sent');
        ctaConfirm.classList.remove('show');
      }, 4200);
    });
  }
});
/* ==========================================================================
   SERVICE PAGE (service.html) — 7 sections, all-new animation language
   Guarded: does nothing on pages without <main class="svc-page">.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('.svc-page');
  if (!page) return;
  document.body.classList.add('svc-js');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // safety net: whatever happens, reveal everything after a few seconds
  setTimeout(() => document.body.classList.add('svc-force'), 4500);

  const watch = (el, cb, threshold = 0.25) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting || en.boundingClientRect.bottom < 0) { cb(en.target); io.unobserve(en.target); }
      });
    }, { threshold });
    io.observe(el);
  };

  try {
    page.querySelectorAll('.svc-focus, .svc-fx').forEach(el => watch(el, t => t.classList.add('is-in'), 0.35));
  } catch (e) { console.error('[svc:fx-watch]', e); }

  /* ---------- 1. HERO: split-flap board + swing doors + service bell ---------- */
  try {
  const hero = document.getElementById('svcHero');
  if (hero) {
    hero.querySelectorAll('.svc-flap-row').forEach(row => {
      const text = row.dataset.text || row.textContent.trim();
      row.innerHTML = '';
      const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .';
      text.split('').forEach((ch, i) => {
        if (ch === ' ') { const g = document.createElement('span'); g.className = 'svc-flap-gap'; row.appendChild(g); return; }
        const cell = document.createElement('span');
        cell.className = 'svc-flap-cell';
        const inner = document.createElement('span');
        inner.className = 'svc-flap-ch';
        inner.textContent = ch;
        cell.appendChild(inner);
        row.appendChild(cell);
        if (!reduce) {
          let step = 0;
          const target = CH.indexOf(ch) === -1 ? 0 : CH.indexOf(ch);
          const total = 8 + (target % 10);
          const tick = () => {
            step++;
            const c = CH[(target - total + step + CH.length * 3) % CH.length] || ch;
            inner.textContent = c === ' ' ? '\u00A0' : c;
            inner.style.transform = 'rotateX(90deg)';
            requestAnimationFrame(() => {
              inner.style.transition = 'transform .09s linear';
              inner.style.transform = 'rotateX(0deg)';
            });
            if (step < total) setTimeout(tick, 55 + i * 4);
            else inner.textContent = ch;
          };
          setTimeout(tick, 900 + i * 55);
        }
      });
    });

    const openDoors = () => {
      requestAnimationFrame(() => {
        hero.classList.add('is-open');
        setTimeout(() => hero.classList.add('is-done'), 1900);
      });
    };
    window.addEventListener('load', () => setTimeout(openDoors, reduce ? 100 : 700));
    setTimeout(openDoors, 2600);

    const bell = document.getElementById('svcBell');
    if (bell) {
      bell.addEventListener('click', () => {
        if (reduce) return;
        bell.classList.remove('is-ring'); void bell.offsetWidth; bell.classList.add('is-ring');
        hero.querySelectorAll('.svc-flap-cell').forEach((cell, i) => {
          cell.style.transform = 'scale(.94)';
          setTimeout(() => { cell.style.transition = 'transform .3s cubic-bezier(.34,1.6,.64,1)'; cell.style.transform = 'scale(1)'; }, 40 + i * 12);
        });
      });
    }
  }

  } catch (e) { console.error('[svc:hero]', e); }

  /* ---------- 2. SERVICES: expanding curtain panels, auto-advance + click/hover/keyboard ---------- */
  try {
  const panelsWrap = document.getElementById('svcPanels');
  if (panelsWrap) {
    const panels = Array.from(panelsWrap.querySelectorAll('.svc-panel'));
    panels.forEach((p, i) => p.style.setProperty('--i', i));
    let active = panels.findIndex(p => p.classList.contains('is-active'));
    if (active < 0) active = 0;
    let timer = null;
    const DUR = 5200;

    const activate = (idx, manual) => {
      if (idx === active) return;
      panels[active].classList.remove('is-active');
      active = idx;
      panels[active].classList.add('is-active');
      panels[active].style.setProperty('--dur', DUR + 'ms');
      if (manual) restart();
    };
    const advance = () => activate((active + 1) % panels.length, false);
    const restart = () => { clearTimeout(timer); if (!reduce) timer = setTimeout(advance, DUR); };

    panels.forEach((p, i) => {
      const open = () => activate(i, true);
      if (fine) p.addEventListener('mouseenter', open);
      p.addEventListener('click', open);
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      p.addEventListener('focus', open);
    });
    panelsWrap.addEventListener('mouseleave', () => { if (fine) restart(); });

    watch(panelsWrap, () => { panelsWrap.classList.add('is-in'); restart(); }, 0.2);
  }

  } catch (e) { console.error('[svc:services]', e); }

  /* ---------- 3. HOW IT WORKS: step rail — each step lights up on its own
     when scrolled into view (simple IntersectionObserver, no scroll math) ---------- */
  try {
  const flowRail = document.getElementById('svcFlowRail');
  if (flowRail) {
    const flowSteps = Array.from(flowRail.querySelectorAll('.svc-flow-step'));
    const flowFill = document.getElementById('svcFlowFill');
    let reached = -1;

    const updateFill = () => {
      if (!flowFill || !flowSteps.length) return;
      const pct = reached < 0 ? 0 : ((reached + 1) / flowSteps.length) * 100;
      flowFill.style.height = pct + '%';
    };

    flowSteps.forEach((step, i) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            step.classList.add('is-on');
            if (i > reached) { reached = i; updateFill(); }
            io.unobserve(step);
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
      io.observe(step);
    });
  }

  } catch (e) { console.error('[svc:how]', e); }

  /* ---------- 4. LIVE TRACKING: radar sweep lights kitchens, phone countdown ---------- */
  try {
  const radar = document.getElementById('svcRadar');
  if (radar) {
    const sweep = radar.querySelector('.svc-sweep');
    const pings = Array.from(radar.querySelectorAll('.svc-ping'));
    let angle = 0, raf = null, lastHot = -1;
    const step = () => {
      angle = (angle + 0.55) % 360;
      if (sweep) sweep.style.transform = `rotate(${angle}deg)`;
      pings.forEach((p, i) => {
        const a = (parseFloat(p.dataset.x) - 50 === 0 && parseFloat(p.dataset.y) - 50 === 0) ? 0 :
          (Math.atan2(parseFloat(p.dataset.y) - 50, parseFloat(p.dataset.x) - 50) * 180 / Math.PI + 450) % 360;
        const diff = Math.abs(((angle - a + 540) % 360) - 180);
        const hot = diff > 178;
        p.classList.toggle('is-hot', hot);
        if (hot && lastHot !== i) { p.classList.remove('is-hit'); void p.offsetWidth; p.classList.add('is-hit'); lastHot = i; }
      });
      raf = requestAnimationFrame(step);
    };
    const startSweep = () => { if (!reduce && !raf) raf = requestAnimationFrame(step); };
    const stopSweep = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    watch(radar, startSweep, 0.15);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSweep(); else if (raf === null) startSweep(); });

    pings.forEach(p => {
      p.addEventListener('click', (e) => { e.preventDefault(); p.classList.remove('is-hit'); void p.offsetWidth; p.classList.add('is-hit'); });
    });
  }

  const railFill = document.getElementById('svcRailFill');
  const rider = document.getElementById('svcRider');
  const etaEl = document.getElementById('svcEta');
  const etaRing = document.querySelector('.svc-eta-live');
  const etaLabel = document.getElementById('svcEtaLabel');
  const distEl = document.getElementById('svcDist');
  if (railFill && etaEl) {
    const TOTAL = 720; // 12:00 countdown
    let t = 0, running = false, rafP = null;
    const CIRC = 213.63;
    const fmt = (s) => { const m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}`; };
    const tick = () => {
      t += reduce ? 6 : 0.35;
      if (t >= TOTAL) t = 0;
      const p = t / TOTAL;
      railFill.style.width = (p * 100) + '%';
      if (rider) rider.style.left = (p * 100) + '%';
      etaEl.textContent = fmt(Math.round(TOTAL - t));
      if (etaRing) etaRing.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(1);
      if (distEl) distEl.textContent = (0.8 + (1 - p) * 3.4).toFixed(1) + ' km away';
      if (etaLabel) etaLabel.textContent = p > 0.94 ? 'Arriving now' : 'Arriving in';
      rafP = requestAnimationFrame(tick);
    };
    const start = () => { if (!running) { running = true; tick(); } };
    watch(document.getElementById('svcTrack'), start, 0.2);
  }

  } catch (e) { console.error('[svc:tracking]', e); }

  /* ---------- 5. PLANS: sliding toggle + odometer price roll-up + tilt-in cards ---------- */
  try {
  const plansSec = document.getElementById('svcPlans');
  if (plansSec) {
    watch(plansSec, () => {
      plansSec.classList.add('is-in');
      setTimeout(() => plansSec.classList.add('is-settled'), 1500);
    }, 0.15);

    const toggle = document.getElementById('svcToggle');
    const pill = toggle ? toggle.querySelector('.svc-toggle-pill') : null;
    const btns = toggle ? Array.from(toggle.querySelectorAll('button')) : [];
    const odos = Array.from(plansSec.querySelectorAll('.svc-odo'));

    const buildOdo = (el) => {
      const digits = (el.dataset.m || '0').length >= (el.dataset.y || '0').length ? el.dataset.m.length : el.dataset.y.length;
      el.innerHTML = '';
      el._cols = [];
      for (let i = 0; i < digits; i++) {
        const col = document.createElement('span'); col.className = 'svc-odo-col';
        const strip = document.createElement('span'); strip.className = 'svc-odo-strip';
        for (let n = 0; n <= 9; n++) { const s = document.createElement('span'); s.textContent = n; strip.appendChild(s); }
        col.appendChild(strip); el.appendChild(col); el._cols.push(strip);
      }
    };
    const setOdo = (el, value) => {
      const str = String(value).padStart(el._cols.length, '0');
      str.split('').forEach((d, i) => {
        const strip = el._cols[i];
        if (strip) { strip.style.setProperty('--d', d); strip.style.setProperty('--c', i); }
      });
    };
    odos.forEach(buildOdo);

    const applyBill = (mode) => {
      plansSec.dataset.bill = mode;
      odos.forEach(el => setOdo(el, mode === 'y' ? el.dataset.y : el.dataset.m));
      plansSec.querySelectorAll('.svc-billed').forEach(p => { p.textContent = mode === 'y' ? p.dataset.y : p.dataset.m; });
      plansSec.querySelectorAll('.svc-per').forEach(p => { p.textContent = '/ mo'; });
    };
    watch(plansSec, () => applyBill('m'), 0.15);

    if (toggle) {
      btns.forEach((b, i) => {
        b.addEventListener('click', () => {
          btns.forEach(x => { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
          if (pill) { pill.style.setProperty('--w', (100 / btns.length) + '%'); pill.style.setProperty('--x', (i * (toggle.offsetWidth / btns.length) + 5) + 'px'); }
          applyBill(b.dataset.bill);
        });
      });
      const setPillWidth = () => { if (pill) pill.style.setProperty('--w', (toggle.querySelector('button').offsetWidth) + 'px'); };
      addEventListener('resize', setPillWidth); setTimeout(setPillWidth, 50);
    }
  }

  } catch (e) { console.error('[svc:plans]', e); }

  /* ---------- 6. CATERING: slider + menu chips build the table live ---------- */
  try {
  const guestRange = document.getElementById('svcGuestRange');
  const table = document.getElementById('svcTable');
  if (guestRange && table) {
    const guestOut = document.getElementById('svcGuestOut');
    const guestsBig = document.getElementById('svcGuestsBig');
    const tierLabel = document.getElementById('svcTierLabel');
    const totalEl = document.getElementById('svcTotal');
    const chips = Array.from(document.querySelectorAll('.svc-chip'));
    const seats = Array.from(table.querySelectorAll('.svc-seat'));
    let rate = 22, name = 'Signature';

    const money = (n) => '$' + n.toLocaleString('en-US');

    const render = () => {
      const guests = parseInt(guestRange.value, 10);
      const active = clamp(Math.round(guests / 10), 1, seats.length);
      guestOut && (guestOut.textContent = guests);
      guestsBig && (guestsBig.textContent = guests);
      tierLabel && (tierLabel.textContent = `guests · ${name}`);
      totalEl && (totalEl.textContent = money(guests * rate));
      guestRange.style.setProperty('--fill', ((guests - 10) / (120 - 10) * 100) + '%');
      seats.forEach((s, i) => {
        const on = i < active;
        s.style.setProperty('--dl', (Math.min(i, active - 1) * 0.06) + 's');
        s.classList.toggle('is-on', on);
      });
    };
    guestRange.addEventListener('input', render);
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('is-on'));
      c.classList.add('is-on');
      rate = parseFloat(c.dataset.rate); name = c.dataset.name;
      render();
    }));
    watch(document.getElementById('svcCater'), render, 0.15);
  }

  } catch (e) { console.error('[svc:catering]', e); }

  /* ---------- 7. FINALE: pizza box opens on scroll, then FAQ accordion ---------- */
  try {
  const boxStage = document.getElementById('svcBox');
  if (boxStage) {
    const onBoxScroll = () => {
      const r = boxStage.getBoundingClientRect();
      const p = clamp(1 - (r.top - innerHeight * 0.35) / (innerHeight * 0.5), 0, 1);
      boxStage.style.setProperty('--open', p.toFixed(3));
    };
    addEventListener('scroll', onBoxScroll, { passive: true });
    addEventListener('resize', onBoxScroll);
    onBoxScroll();
  }

  document.querySelectorAll('#svcFaq .svc-faq-item').forEach(item => {
    const q = item.querySelector('.svc-faq-q');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('#svcFaq .svc-faq-item').forEach(i => { i.classList.remove('is-open'); i.querySelector('.svc-faq-q').setAttribute('aria-expanded', 'false'); });
      if (!isOpen) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });
  } catch (e) { console.error('[svc:finale]', e); }
});