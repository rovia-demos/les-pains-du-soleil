/* Les Pains du Soleil : animations et interactions */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = matchMedia('(min-width: 768px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
  window.LPDS_READY = true;

  // ---------- Langue ----------
  const i18n = window.LPDS_I18N;
  const lang0 = i18n.initial();
  if (lang0 !== 'fr') i18n.apply(lang0);
  let langV = 0; // change à chaque changement de langue (évite de restaurer un ancien texte découpé)

  // ---------- Défilement fluide ----------
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else if (target === 0) scrollTo(0, 0);
    else target.scrollIntoView();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
    if (target === false || target === null) return;
    e.preventDefault();
    closeMenu();
    goTo(target);
  });

  // ---------- Vidéos du hero ----------
  const heroVideos = desktop ? $$('.triptych video') : [$('.hero__mobile')];
  const soundVideo = heroVideos.find((v) => v.classList.contains('hero__sound-source'));
  heroVideos.forEach((v) => { v.src = v.dataset.src; v.preload = 'auto'; });
  // shortcut: le choix ordinateur/mobile se fait au chargement ; un redimensionnement ne recharge pas l'autre version
  const playHero = () => heroVideos.forEach((v) => v.play().catch(() => {}));
  if (!reduce) playHero();
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { if (!reduce || !soundVideo.muted) playHero(); }
    else heroVideos.forEach((v) => v.pause());
  }, { threshold: 0.05 }).observe($('.hero'));

  const soundBtn = $('.sound');
  function setSound(on) {
    soundVideo.muted = !on;
    soundBtn.setAttribute('aria-pressed', String(on));
    if (on) { soundVideo.currentTime = 0; playHero(); }
  }
  soundBtn.addEventListener('click', () => setSound(soundVideo.muted));

  // ---------- Écran d'ouverture puis entrée du hero ----------
  const loader = $('.loader');
  function heroIn() {
    gsap.set('.hero__content > *', { opacity: 1 });
    if (reduce) return;
    const v = langV;
    const split = new SplitText('.hero__title', { type: 'lines,words', mask: 'lines' });
    const tl = gsap.timeline({ onComplete: () => { if (v === langV) split.revert(); } });
    tl.fromTo('.triptych__panel', { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', stagger: 0.12 })
      .from('.hero__mobile', { scale: 1.25, opacity: 0, duration: 1.6, ease: 'expo.out' }, 0)
      .from('.hero .eyebrow', { y: 24, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.55)
      .from(split.words, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.07 }, 0.6)
      .from('.hero__sub', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, 0.95)
      .from('.hero__ctas .btn', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 1.05)
      .from('.sound', { scale: 0, opacity: 0, duration: 0.9, ease: 'back.out(2)' }, 1.2)
      .from('.nav', { yPercent: -100, duration: 1, ease: 'expo.out', clearProps: 'all' }, 0.8);
  }
  if (reduce) {
    loader.remove();
    heroIn();
  } else {
    lenis && lenis.stop();
    gsap.timeline()
      .to('.loader__ring circle', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
      .from('.loader__sun', { scale: 0.3, rotate: -120, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0)
      .from('.loader__word span', { yPercent: 120, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out' }, 0.25)
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.1')
      .add(heroIn, '-=0.6')
      .add(() => { loader.remove(); lenis && lenis.start(); });
  }

  // ---------- Hero au défilement ----------
  if (!reduce) {
    const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__media', { yPercent: 16, scale: 1.06, ease: 'none', scrollTrigger: st });
    gsap.to('.triptych__panel:nth-child(odd) video', { yPercent: 8, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__content', { y: -90, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '65% top' } });
  }

  // ---------- Navigation ----------
  const nav = $('#nav');
  const menu = $('#menu');
  const burger = $('.burger');
  let menuOpen = false;
  const navUpdate = (self) => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', !menuOpen && self.direction === 1 && y > innerHeight * 0.9);
  };
  // onRefresh aussi : un recalcul de ScrollTrigger peut passer par le haut de page sans nouvel onUpdate
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: navUpdate, onRefresh: navUpdate });
  function openMenu() {
    menuOpen = true; menu.hidden = false; burger.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    if (!reduce) gsap.fromTo('.menu__links a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; menu.hidden = true; burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', (e) => { if (e.target.closest('#menu [data-lang]')) closeMenu(); });

  // ---------- Apparitions ----------
  function revealSplit(el) {
    const v = langV;
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: () => { if (v === langV) s.revert(); },
    });
  }
  if (!reduce) {
    document.fonts.ready.then(() => {
      $$('[data-reveal="split"]').forEach(revealSplit);
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    ScrollTrigger.batch('[data-reveal="up"]', {
      start: 'top 90%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 }),
    });
    $$('[data-reveal="img"]').forEach((el) => {
      const media = el.querySelector('img, video');
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        .fromTo(el, { clipPath: 'inset(18% 8% 18% 8% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.5, ease: 'expo.out' })
        .fromTo(media, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
    });
    $$('[data-speed]').forEach((el) => {
      const s = parseFloat(el.dataset.speed);
      gsap.fromTo(el, { y: () => -s * innerHeight * 0.5 }, {
        y: () => s * innerHeight * 0.5, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });
    // chiffres qui défilent
    $$('[data-count]').forEach((el) => {
      const n = +el.dataset.count, o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: n, duration: 2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = Math.round(o.v); },
      });
    });
  }

  // ---------- Manifeste + soleil 3D ----------
  const words = $('.manifesto__words');
  let wordsTween = null;
  let sun = null;
  function buildWords() {
    const text = words.textContent.trim();
    words.textContent = '';
    text.split(/\s+/).forEach((w, i) => {
      if (i) words.append(' ');
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      words.append(s);
    });
    if (wordsTween) wordsTween.kill();
    wordsTween = gsap.fromTo(words.children, { opacity: 0.12 }, {
      opacity: 1, stagger: 0.12, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=140%', scrub: true },
    });
  }
  if (!reduce) {
    buildWords();
    ScrollTrigger.create({
      trigger: '.manifesto', start: 'top top', end: '+=160%', pin: '.manifesto__stage', pinSpacing: true,
      onUpdate: (self) => sun && sun.setProgress(self.progress),
    });
    const canvas = $('.sun3d');
    const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
    if (webgl) {
      ScrollTrigger.create({
        trigger: '.manifesto', start: 'top 250%', once: true,
        onEnter: () => import(new URL('assets/js/sun3d.js', document.baseURI).href).then((mod) => {
          sun = mod.createSun(canvas, { faceUrl: 'assets/img/soleil-visage.webp', small: !desktop });
          html.classList.add('has-webgl');
          new IntersectionObserver(([en]) => (en.isIntersecting ? sun.start() : sun.stop())).observe($('.manifesto__stage'));
          if (finePointer) addEventListener('pointermove', (e) => sun.setPointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1));
        }).catch(() => {}),
      });
    }
  }

  // ---------- Frise de l'histoire (défilement horizontal sur ordinateur) ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('.timeline__track');
    const dist = () => track.scrollWidth - innerWidth;
    const pan = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    gsap.fromTo('.timeline__line span', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'center center', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    $$('.milestone').forEach((m) => {
      gsap.from(m, { opacity: 0.2, y: 50, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: pan, start: 'left 95%', end: 'left 55%', scrub: true } });
    });
  });

  // ---------- Fournil : séquence d'images pilotée par le défilement ----------
  if (!reduce) {
    const FRAMES = 108;
    const canvas = $('.fournil__canvas');
    const ctx = canvas.getContext('2d');
    const imgs = [];
    let drawn = -1;
    const draw = (i) => {
      // image la plus proche déjà chargée
      for (let d = 0; d < FRAMES; d++) {
        const img = imgs[i - d] || imgs[i + d];
        if (img && img.complete && img.naturalWidth) {
          if (drawn !== i) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawn = i;
          return;
        }
      }
    };
    ScrollTrigger.create({
      trigger: '.fournil', start: 'top 250%', once: true,
      onEnter: () => {
        for (let i = 1; i <= FRAMES; i++) {
          const img = new Image();
          img.decoding = 'async';
          img.src = `assets/img/fournil-seq/f${String(i).padStart(3, '0')}.webp`;
          if (i === 1) img.onload = () => draw(0);
          imgs.push(img);
        }
      },
    });
    const steps = $$('.fournil .step');
    let cur = -1;
    const setStep = (n) => {
      if (n === cur) return;
      if (cur >= 0) gsap.to(steps[cur], { autoAlpha: 0, y: -30, duration: 0.5, ease: 'power2.in', overwrite: true });
      gsap.fromTo(steps[n], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: cur >= 0 ? 0.25 : 0, overwrite: true });
      cur = n;
    };
    setStep(0);
    ScrollTrigger.create({
      trigger: '.fournil__pin', start: 'top top', end: '+=320%', pin: true, scrub: true,
      onUpdate: (self) => {
        draw(Math.round(self.progress * (FRAMES - 1)));
        setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999)));
      },
    });
    gsap.from('.fournil__screen', { scale: 0.85, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.fournil', start: 'top 70%', once: true } });
  }

  // ---------- Créations : glisser les trompe-l'œil, filtrer la galerie ----------
  const strip = $('.tlo__strip');
  let drag = null;
  strip.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, s: strip.scrollLeft };
    strip.classList.add('is-dragging');
  });
  addEventListener('pointermove', (e) => { if (drag) strip.scrollLeft = drag.s - (e.clientX - drag.x); });
  addEventListener('pointerup', () => { drag = null; strip.classList.remove('is-dragging'); });
  if (!reduce) {
    gsap.from('.tlo__item', { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: strip, start: 'top 85%', once: true } });
  }

  const cards = $$('.card');
  const chips = $$('.chip');
  if (!reduce) {
    gsap.set(cards, { opacity: 0, y: 60 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }),
    });
  }
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    const state = Flip.getState(cards);
    cards.forEach((c) => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
    chips.forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    if (reduce) return ScrollTrigger.refresh();
    Flip.from(state, {
      duration: 0.9, ease: 'expo.inOut', absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }));

  // ---------- Vidéos qui se chargent à l'approche ----------
  const lazyIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-lazy]').forEach((v) => lazyIO.observe(v));

  // ---------- Presse : bandeau de vidéos ----------
  const reelTrack = $('.reel__track');
  [...reelTrack.children].forEach((c) => {
    const d = c.cloneNode(true);
    d.classList.add('is-dup');
    d.setAttribute('aria-hidden', 'true');
    d.tabIndex = -1;
    reelTrack.append(d);
  });
  $$('.clip').forEach((clip) => {
    const v = clip.querySelector('video');
    clip.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    });
    clip.addEventListener('pointerleave', () => v.pause());
  });

  // ---------- Fenêtres : lecteur vidéo et appel ----------
  const player = $('#player');
  const pv = player.querySelector('video');
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-video]');
    if (!t) return;
    if (!soundVideo.muted) setSound(false);
    pv.poster = t.dataset.poster || '';
    pv.src = t.dataset.video;
    player.showModal();
    lenis && lenis.stop();
    pv.play().catch(() => {});
  });
  player.addEventListener('close', () => { pv.pause(); pv.removeAttribute('src'); pv.load(); lenis && lenis.start(); });
  const call = $('#call');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open="call"]')) { call.showModal(); lenis && lenis.stop(); }
  });
  call.addEventListener('close', () => lenis && lenis.start());
  [player, call].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  // ---------- Boulangeries : carte et fiches liées ----------
  const pins = $$('.pin');
  const shops = $$('.shop');
  const setActive = (id) => {
    pins.forEach((p) => p.classList.toggle('is-active', p.dataset.shop === id));
    shops.forEach((s) => s.classList.toggle('is-active', s.dataset.shop === id));
  };
  shops.forEach((s) => {
    s.addEventListener('pointerenter', () => setActive(s.dataset.shop));
    s.addEventListener('focusin', () => setActive(s.dataset.shop));
    ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && setActive(s.dataset.shop) });
  });
  pins.forEach((p) => p.addEventListener('click', () => {
    setActive(p.dataset.shop);
    goTo($(`.shop[data-shop="${p.dataset.shop}"]`));
  }));
  if (!reduce) {
    gsap.from('.shop', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.shops__list', start: 'top 80%', once: true } });
    gsap.from('.map__coast', { strokeDashoffset: 400, duration: 2.4, ease: 'power2.out', scrollTrigger: { trigger: '.map', start: 'top 80%', once: true } });
    gsap.from('.pin', { scale: 0, transformOrigin: 'center', duration: 0.9, ease: 'back.out(2.2)', stagger: 0.15, scrollTrigger: { trigger: '.map', start: 'top 75%', once: true } });
  }

  // ---------- Pied de page ----------
  if (!reduce) {
    gsap.from('.footer__word', { yPercent: 60, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });
  }

  // ---------- Boutons aimantés et halo du curseur ----------
  if (finePointer && !reduce) {
    $$('.magnetic').forEach((b) => {
      const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'expo.out' });
      const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'expo.out' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
    const cur = $('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'expo.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'expo.out' });
    addEventListener('pointermove', (e) => { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => cur.classList.toggle('is-hover', !!e.target.closest('a, button, .card, .tlo__strip, .pin')));
  }

  // ---------- Changement de langue ----------
  document.addEventListener('langchange', () => {
    langV++;
    if (!reduce) buildWords();
    ScrollTrigger.refresh();
  });

  // les déclencheurs ont été créés hors de l'ordre de la page : on les trie avant de calculer les positions
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  addEventListener('load', () => ScrollTrigger.refresh());
})();
