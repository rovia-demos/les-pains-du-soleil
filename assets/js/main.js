/* Les Pains du Soleil : animations et interactions */
(() => {
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

  // ---------- Frise de l'histoire : le défilement vertical fait avancer la frise ----------
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const track = $('.timeline__track');
    const dist = () => track.scrollWidth - innerWidth;
    const cardsTl = $$('.milestone');
    // quand on s'arrête de défiler, la frise se cale sur la carte la plus proche
    const snapTo = (v) => {
      const pts = cardsTl.map((c) => Math.min(1, (c.offsetLeft - cardsTl[0].offsetLeft) / dist()));
      return pts.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    };
    const pan = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.timeline', start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        snap: { snapTo, duration: { min: 0.2, max: 0.6 }, delay: 0.08, ease: 'power1.inOut' },
      },
    });
    gsap.fromTo('.timeline__line span', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'center center', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    $$('.milestone').forEach((m) => {
      gsap.from(m, { opacity: 0.2, y: 50, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: pan, start: 'left 95%', end: 'left 55%', scrub: true } });
    });
  });

  // ---------- Fournil : de la farine au croissant, une vidéo lue au rythme du défilement ----------
  if (!reduce) {
    const canvas = $('.fournil__canvas');
    const ctx = canvas.getContext('2d');
    const steps = $$('.fstep');
    const list = $('.fsteps');
    const FRAMES = +canvas.dataset.frames;
    // image de début de chaque étape (farine, beurre, pâte, feuilletage, façonnage, cuisson) puis dernière image :
    // chaque étape occupe la même longueur de défilement, quelle que soit sa durée dans la vidéo
    const KEYS = canvas.dataset.steps.split(',').map(Number);
    const frames = new Array(FRAMES);
    const ready = (img) => img && img.complete && img.naturalWidth;
    ScrollTrigger.create({
      trigger: '.fournil', start: 'top 250%', once: true,
      onEnter: () => {
        // on charge d'abord une image sur huit, puis on complète : l'animation est utilisable très vite
        const order = [];
        for (const stride of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += stride) if (!order.includes(i)) order.push(i);
        order.forEach((i) => {
          const im = new Image();
          im.decoding = 'async';
          im.src = `assets/img/croissant/seq/f${String(i + 1).padStart(3, '0')}.webp`;
          im.onload = schedule; // redessine dès qu'une image plus proche de la bonne arrive
          frames[i] = im;
        });
      },
    });
    let prog = 0, cur = -1, drawn = null, queued = false;
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } };
    function render() {
      const x = Math.min(prog * steps.length, steps.length - 1e-6);
      const n = Math.floor(x);
      const k = Math.round(KEYS[n] + (KEYS[n + 1] - KEYS[n]) * (x - n));
      for (let d = 0; d < FRAMES; d++) {
        const img = ready(frames[k - d]) ? frames[k - d] : ready(frames[k + d]) ? frames[k + d] : null;
        if (img) {
          if (drawn !== img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawn = img;
          break;
        }
      }
      if (n !== cur) {
        steps.forEach((el, idx) => { el.classList.toggle('is-active', idx === n); el.classList.toggle('is-done', idx < n); });
        cur = n;
      }
      list.style.setProperty('--p', prog.toFixed(3));
    }
    // l'écran ne se bloque jamais : la scène remonte avec la page mais ralentit en douceur pendant que
    // le croissant se fait, puis repart ; elle glisse dans la marge prévue sous elle (.fournil__pin)
    gsap.fromTo('.fournil__title, .fsteps, .fournil__stage', { y: 0 }, {
      y: () => innerHeight, ease: 'sine.inOut',
      scrollTrigger: {
        trigger: '.fournil__stage', start: 'top 72%', end: () => '+=' + innerHeight * 2, scrub: true, invalidateOnRefresh: true,
        // le croissant se fait pendant la partie la plus lente, quand la scène est entièrement à l'écran
        onUpdate: (self) => { prog = gsap.utils.clamp(0, 1, (self.progress - 0.2) / 0.6); render(); },
      },
    });
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
  // flèches : une carte de plus ou de moins à chaque clic
  const arrows = $$('.tlo__btn');
  const stepW = () => strip.querySelector('.tlo__item').offsetWidth + 18;
  const updateArrows = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    arrows[0].disabled = strip.scrollLeft <= 2;
    arrows[1].disabled = strip.scrollLeft >= max;
  };
  arrows.forEach((b) => b.addEventListener('click', () => strip.scrollBy({ left: +b.dataset.dir * stepW(), behavior: 'smooth' })));
  strip.addEventListener('scroll', updateArrows, { passive: true });
  addEventListener('resize', updateArrows);
  updateArrows();
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
  const gallery = $('.gallery');
  const more = $('.gallery__more');
  let expanded = false, filter = 'all';
  function relayout(change) {
    const state = Flip.getState(cards);
    change();
    gallery.classList.toggle('is-collapsed', filter === 'all' && !expanded);
    more.hidden = !(filter === 'all' && !expanded);
    if (reduce) return ScrollTrigger.refresh();
    Flip.from(state, {
      duration: 0.9, ease: 'expo.inOut', absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }
  chips.forEach((chip) => chip.addEventListener('click', () => relayout(() => {
    filter = chip.dataset.filter;
    cards.forEach((c) => c.classList.toggle('is-hidden', filter !== 'all' && c.dataset.cat !== filter));
    chips.forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
  })));
  $('[data-more]').addEventListener('click', () => relayout(() => { expanded = true; }));

  // ---------- Vidéos qui se chargent à l'approche ----------
  const lazyIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      if (!reduce) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-lazy]').forEach((v) => lazyIO.observe(v));

  // ---------- Presse : bandeau de vidéos qui défile et se fait glisser ----------
  const reel = $('.reel');
  const reelTrack = $('.reel__track');
  [...reelTrack.children].forEach((c) => {
    const d = c.cloneNode(true);
    d.classList.add('is-dup');
    d.setAttribute('aria-hidden', 'true');
    d.tabIndex = -1;
    reelTrack.append(d);
  });
  let rx = 0, rv = 0, rDrag = null, rHover = false, rMoved = 0, reelInView = false;
  const AUTO = reduce ? 0 : 0.45; // pixels par image, à 60 images par seconde
  new IntersectionObserver(([en]) => { reelInView = en.isIntersecting; }).observe(reel);
  gsap.ticker.add((time, dt) => {
    if (!reelInView) return;
    const k = dt / 16.7;
    if (!rDrag) { rx += (rv - (rHover ? 0 : AUTO)) * k; rv *= 0.94; }
    const half = reelTrack.scrollWidth / 2;
    if (rx <= -half) rx += half; else if (rx > 0) rx -= half;
    reelTrack.style.transform = `translate3d(${rx.toFixed(1)}px, 0, 0)`;
  });
  reel.addEventListener('pointerdown', (e) => { rDrag = { last: e.clientX }; rMoved = 0; rv = 0; reel.classList.add('is-dragging'); });
  addEventListener('pointermove', (e) => {
    if (!rDrag) return;
    const dx = e.clientX - rDrag.last;
    rDrag.last = e.clientX; rx += dx; rv = dx; rMoved += Math.abs(dx);
  });
  const endDrag = () => { if (rDrag) { rDrag = null; reel.classList.remove('is-dragging'); } };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  // un glissement ne doit pas ouvrir la vidéo
  reel.addEventListener('click', (e) => { if (rMoved > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  reel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') rHover = true; });
  reel.addEventListener('pointerleave', () => { rHover = false; });
  $$('.clip').forEach((clip) => {
    const v = clip.querySelector('video');
    clip.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    });
    clip.addEventListener('pointerleave', () => v.pause());
  });
  if (!finePointer && !reduce) {
    // sur téléphone, l'aperçu de la carte au centre se lance tout seul
    let playing = null;
    setInterval(() => {
      let best = null;
      if (reelInView) {
        let bd = Infinity;
        $$('.clip', reelTrack).forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - innerWidth / 2);
          if (d < bd) { bd = d; best = c; }
        });
      }
      const v = best && best.querySelector('video');
      if (v === playing) return;
      if (playing) { playing.pause(); playing.closest('.clip').classList.remove('is-playing'); }
      if (v) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); best.classList.add('is-playing'); }
      playing = v;
    }, 400);
  }

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
    ScrollTrigger.refresh();
  });

  // les déclencheurs ont été créés hors de l'ordre de la page : on les trie avant de calculer les positions
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  addEventListener('load', () => ScrollTrigger.refresh());
})();
