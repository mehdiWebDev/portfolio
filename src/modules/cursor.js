/* ============================================================
   cursor.js — bespoke trailing cursor with hover + label states.
   Disabled on touch / coarse pointers.
   ============================================================ */

export function initCursor() {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) return;

  const cursor = document.getElementById('cursor');
  const label = document.getElementById('cursorLabel');
  if (!cursor) return;

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  window.addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      // the inner dot tracks instantly
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    },
    { passive: true }
  );

  let raf = 0;
  function loop() {
    const dx = mx - rx;
    const dy = my - ry;
    // skip transform writes once the ring has settled on the target
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      rx += dx * 0.18;
      ry += dy * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      if (label) label.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  start();

  // hover + label behaviour, delegated
  const interactive = 'a, button, [data-cursor], [data-magnetic], .work__item';

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest(interactive);
    if (!el) return;
    document.body.classList.add('cursor-hover');
    const text = el.getAttribute('data-cursor');
    if (text) {
      label.textContent = text;
      document.body.classList.add('cursor-label');
    }
  });

  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest(interactive);
    if (!el) return;
    const to = e.relatedTarget && e.relatedTarget.closest(interactive);
    if (to) return;
    document.body.classList.remove('cursor-hover', 'cursor-label');
    label.textContent = '';
  });

  // hide near the edges / on leave
  document.addEventListener('mouseleave', () => (cursor.style.opacity = '0'));
  document.addEventListener('mouseenter', () => (cursor.style.opacity = '1'));
}
