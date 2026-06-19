/* ============================================================
   heroWebGL.js — Three.js flowing point-field "horizon".
   A receding grid of points displaced by layered waves, lit
   dark-to-red. Reacts to the pointer, drifts on its own,
   and degrades gracefully on mobile / reduced-motion.
   ============================================================ */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Color,
  AdditiveBlending,
  Vector2,
} from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vElevation;

  void main() {
    vec3 pos = position;

    // layered travelling waves -> a living topography
    float e = 0.0;
    e += sin(pos.x * 0.55 + uTime * 0.65) * 0.34;
    e += sin(pos.y * 0.48 - uTime * 0.50) * 0.34;
    e += sin((pos.x + pos.y) * 0.30 + uTime * 0.40) * 0.24;

    // a soft ripple that follows the cursor
    vec2 p = uPointer * vec2(13.0, 8.5);
    float d = distance(pos.xy, p);
    e += sin(d * 1.1 - uTime * 2.2) * 0.20 * smoothstep(8.5, 0.0, d);

    pos.z += e;
    vElevation = e;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // perspective-correct point size
    gl_PointSize = uSize * uPixelRatio * (1.0 / -mvPosition.z) * 26.0;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  varying float vElevation;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float soft = smoothstep(0.5, 0.08, dist);

    float h = smoothstep(-0.35, 0.75, vElevation);
    vec3 col = mix(uColorLow, uColorHigh, h);

    gl_FragColor = vec4(col, soft * (0.30 + h * 0.70));
  }
`;

export function initHeroWebGL(canvas) {
  if (!canvas) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    // No WebGL — the CSS glow alone still carries the hero.
    console.warn('[hero] WebGL unavailable, falling back to CSS only.', err);
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.6, 6.2);
  camera.lookAt(0, -0.4, -2);

  // ---- build the point grid ----
  const COLS = isMobile ? 78 : 132;
  const ROWS = isMobile ? 44 : 78;
  const W = 30;
  const D = 20;

  const count = COLS * ROWS;
  const positions = new Float32Array(count * 3);
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      positions[i++] = (c / (COLS - 1) - 0.5) * W; // x
      positions[i++] = (r / (ROWS - 1) - 0.5) * D; // y (depth, pre-tilt)
      positions[i++] = 0; // z
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new Vector2(0, 0) },
    uSize: { value: isMobile ? 2.0 : 2.4 },
    uPixelRatio: { value: dpr },
    uColorLow: { value: new Color('#15131a') },
    uColorHigh: { value: new Color('#ff2f2f') },
  };

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.rotation.x = -1.18; // lay the grid down like a floor receding to a horizon
  points.position.y = -1.1;
  scene.add(points);

  // ---- pointer + state ----
  const pointerTarget = new Vector2(0, 0);
  const pointer = new Vector2(0, 0);

  function onPointerMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    pointerTarget.set(x, y);
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // ---- sizing ----
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- loop ----
  let raf = 0;
  let running = true;
  const clockStart = performance.now();

  function render(now) {
    if (!running) return;
    const t = (now - clockStart) / 1000;
    uniforms.uTime.value = t;

    pointer.lerp(pointerTarget, 0.05);
    uniforms.uPointer.value.copy(pointer);

    // gentle parallax of the whole field
    points.rotation.z = pointer.x * 0.04;
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (1.6 + pointer.y * 0.35 - camera.position.y) * 0.04;
    camera.lookAt(0, -0.4, -2);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  }

  function start() {
    if (raf) return;
    running = true;
    raf = requestAnimationFrame(render);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  if (reduced) {
    // one static, pleasant frame — no animation loop
    uniforms.uTime.value = 1.2;
    renderer.render(scene, camera);
  } else {
    start();
  }

  // pause when the tab is hidden (battery + perf) — but only resume if the
  // hero is actually on screen
  let inView = true;
  function onVisibility() {
    if (document.hidden) stop();
    else if (!reduced && inView) start();
  }
  document.addEventListener('visibilitychange', onVisibility);

  // pause when hero scrolls out of view
  let observer;
  if ('IntersectionObserver' in window && !reduced) {
    observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
  }

  return {
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
