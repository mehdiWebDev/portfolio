/* ============================================================
   preloader.js — 00 → 100 count, then a curtain reveal.
   Resolves once the curtain is gone so the hero can play in.
   ============================================================ */

import { gsap } from 'gsap';

export function runPreloader() {
  return new Promise((resolve) => {
    const pre = document.getElementById('preloader');
    const countEl = document.getElementById('preCount');
    const bar = document.getElementById('preBar');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!pre) {
      resolve();
      return;
    }

    if (reduced) {
      gsap.set(pre, { display: 'none' });
      resolve();
      return;
    }

    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: resolve });

    tl.to(
      counter,
      {
        v: 100,
        duration: 1.9,
        ease: 'power2.inOut',
        onUpdate() {
          countEl.textContent = String(Math.round(counter.v)).padStart(2, '0');
        },
      },
      0
    )
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.9, ease: 'power2.inOut' }, 0)
      .to('[data-pre-word]', { yPercent: -120, duration: 0.55, ease: 'expo.in' }, '+=0.08')
      .to('.preloader__count', { yPercent: 120, opacity: 0, duration: 0.6, ease: 'expo.in' }, '<')
      .to(pre, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
      .set(pre, { display: 'none' });
  });
}
