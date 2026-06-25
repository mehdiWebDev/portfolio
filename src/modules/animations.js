/* ============================================================
   animations.js — GSAP choreography:
   hero reveal, scroll reveals, split lines, velocity marquees,
   counters, magnetic buttons, tilt, nav auto-hide, clock, copy.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getScrollVelocity } from './scroll.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ---- set hidden states immediately (before preloader ends) ---- */
export function primeStates() {
  gsap.set('.hero__title .reveal', { yPercent: 110 });
  if (reduced) return;
  gsap.set('[data-reveal="up"]', { y: 44, opacity: 0 });
  gsap.set('[data-reveal="fade"]', { opacity: 0 });
  document.querySelectorAll('[data-split]').forEach((t) => {
    gsap.set(t.querySelectorAll('.ln > span'), { yPercent: 100 });
  });
}

/* ---- hero entrance (called right after the curtain lifts) ---- */
export function revealHero() {
  if (reduced) {
    // no entrance motion — just show everything
    gsap.set('.hero__title .reveal', { yPercent: 0 });
    gsap.set(['.hero__intro', '.hero__coords', '.hero__roles', '.hero__scroll'], {
      opacity: 1,
      y: 0,
    });
    return;
  }

  gsap.set(['.hero__intro', '.hero__coords', '.hero__roles', '.hero__scroll'], {
    opacity: 0,
    y: 18,
  });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.hero__title .reveal', { yPercent: 0, duration: 1.15, stagger: 0.12 }, 0)
    .to('.hero__intro', { opacity: 1, y: 0, duration: 0.9 }, 0.5)
    .to('.hero__coords', { opacity: 1, y: 0, duration: 0.9 }, 0.6)
    .to('.hero__roles', { opacity: 1, y: 0, duration: 0.9 }, 0.7)
    .to('.hero__scroll', { opacity: 1, y: 0, duration: 0.9 }, 0.85);
  return tl;
}

/* ---- everything else ---- */
export function initAnimations(lenis) {
  reveals();
  splitLines();
  counters();
  marquees();
  navAutoHide(lenis);
  clock();
  copyEmail();
  if (!isTouch && !reduced) {
    magnetic();
    tilt();
  }
  // make sure positions are correct after fonts/layout settle
  ScrollTrigger.refresh();
  // fonts can swap in after first refresh and shift trigger offsets
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

function reveals() {
  if (reduced) {
    gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch('[data-reveal="up"]', {
    start: 'top 88%',
    onEnter: (els) =>
      gsap.to(els, {
        y: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.09,
        ease: 'expo.out',
        overwrite: true,
      }),
  });
  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: 'top 92%',
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, duration: 1.1, stagger: 0.08, ease: 'power2.out', overwrite: true }),
  });
}

function splitLines() {
  document.querySelectorAll('[data-split]').forEach((t) => {
    const spans = t.querySelectorAll('.ln > span');
    if (reduced) {
      gsap.set(spans, { yPercent: 0 });
      return;
    }
    ScrollTrigger.create({
      trigger: t,
      start: 'top 82%',
      once: true,
      onEnter: () =>
        gsap.to(spans, { yPercent: 0, duration: 1, stagger: 0.09, ease: 'expo.out' }),
    });
  });
}

function counters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    if (Number.isNaN(end)) return;
    if (reduced) {
      el.textContent = String(end).padStart(2, '0');
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: end,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = String(Math.round(obj.v)).padStart(2, '0');
          },
        }),
    });
  });
}

/* velocity-reactive infinite marquees */
function marquees() {
  const tracks = document.querySelectorAll('[data-marquee]');
  tracks.forEach((track) => {
    const dir = parseFloat(track.dataset.marquee) || 1;
    let half = track.scrollWidth / 2 || 1;
    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2 || 1;
    });
    ro.observe(track);

    // seed so each track starts offset, not all at 0
    let x = -half * (dir > 0 ? 0.5 : 0.25);

    // reduced-motion users get stationary text — no perpetual scroll
    if (reduced) {
      track.style.transform = `translate3d(${x}px,0,0)`;
      return;
    }

    const base = 0.035; // px per ms
    let raf = 0;
    let visible = true;
    let last = performance.now();

    function tick(now) {
      const dt = Math.min(48, now - last);
      last = now;
      const speed = base + Math.abs(getScrollVelocity()) * 0.014;
      x -= dir * speed * dt;
      if (x <= -half) x += half;
      if (x >= 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    }
    function play() {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // pause when scrolled off-screen or the tab is hidden
    const container = track.closest('.marquee') || track;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          visible ? play() : pause();
        },
        { threshold: 0 }
      ).observe(container);
    }
    document.addEventListener('visibilitychange', () => {
      document.hidden ? pause() : play();
    });

    play();
  });
}

function navAutoHide(lenis) {
  const nav = document.getElementById('nav');
  if (!nav || !lenis) return;
  lenis.on('scroll', ({ scroll, direction }) => {
    if (scroll < 90) nav.classList.remove('is-hidden');
    else if (direction === 1) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
  });
}

function clock() {
  const el = document.getElementById('localTime');
  if (!el) return;
  const upd = () => {
    el.textContent = new Date().toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  upd();
  setInterval(upd, 15000);
}

function copyEmail() {
  const btn = document.getElementById('emailBtn');
  const txt = document.getElementById('emailText');
  if (!btn || !txt) return;
  const email = 'ouatahmahdi06@gmail.com';
  const original = txt.textContent;
  // announce the copy action + result to assistive tech
  btn.setAttribute('aria-label', 'Copy email address ' + email);
  txt.setAttribute('role', 'status');
  txt.setAttribute('aria-live', 'polite');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).catch(() => {});
    }
    txt.textContent = 'Copied to clipboard ✓';
    btn.style.borderColor = 'var(--red)';
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      txt.textContent = original;
      btn.style.borderColor = '';
    }, 1600);
  });
}

function magnetic() {
  document.querySelectorAll('[data-magnetic], .btn, .contact__email').forEach((el) => {
    // the giant contact headline link gets a gentler pull than small buttons
    const strength = el.closest('.contact__big') ? 0.16 : 0.32;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * strength, y: my * strength * 1.1, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

function tilt() {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: px * 7,
        rotateX: -py * 7,
        y: -6, // lift composes with the tilt instead of fighting the CSS hover
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 900,
        transformOrigin: 'center',
      });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    });
  });
}
