/* ============================================================
   scroll.js — Lenis smooth scroll wired into GSAP ScrollTrigger,
   plus a scroll-velocity CSS variable the marquees feed off.
   ============================================================ */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// shared, cheap-to-read scroll velocity (marquees read this every frame
// instead of round-tripping through getComputedStyle on a CSS variable)
let scrollVelocity = 0;
export const getScrollVelocity = () => scrollVelocity;

export function initSmoothScroll() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduced,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });

  // drive Lenis from GSAP's ticker for perfectly synced animation
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // cache a normalized scroll velocity for the marquees (read via getScrollVelocity)
  lenis.on('scroll', ({ velocity }) => {
    scrollVelocity = Math.max(-40, Math.min(40, velocity || 0));
  });

  // anchor links route through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });

  return lenis;
}
