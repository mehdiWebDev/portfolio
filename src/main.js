/* ============================================================
   main.js — entry point. Boots the experience in order:
   prime hidden states → preloader → hero reveal → scroll life.
   ============================================================ */

import './styles/base.css';
import './styles/sections.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initHeroWebGL } from './modules/heroWebGL.js';
import { initCursor } from './modules/cursor.js';
import { initSmoothScroll } from './modules/scroll.js';
import { runPreloader } from './modules/preloader.js';
import { primeStates, revealHero, initAnimations } from './modules/animations.js';

gsap.registerPlugin(ScrollTrigger);

// progressive enhancement flag — CSS hides [data-reveal] only when JS runs
document.documentElement.classList.add('js');

function boot() {
  // 1 — hide what should animate in, before anything paints
  primeStates();

  // 2 — atmosphere + background that can run during the preloader
  initCursor();
  const hero = initHeroWebGL(document.getElementById('hero-canvas'));

  // 3 — smooth scroll, locked until the curtain lifts
  const lenis = initSmoothScroll();
  lenis.stop();

  // 4 — preloader, then play the page in
  runPreloader().then(() => {
    lenis.start();
    revealHero();
    initAnimations(lenis);
  });

  // tidy up on real teardown — but NOT when the page is frozen into the
  // bfcache (it will be restored intact, WebGL context and all)
  window.addEventListener('pagehide', (e) => {
    if (!e.persisted) hero?.destroy();
  });

  // during dev, dispose cleanly so HMR doesn't stack duplicate loops/triggers
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      hero?.destroy();
      lenis?.destroy?.();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
