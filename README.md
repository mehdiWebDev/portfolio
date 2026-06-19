# Mahdi Ouatah — Portfolio

A cinematic, award-style single-page portfolio. Dark editorial aesthetic drawn
from the **Couleva** brand (red `#FF3B3B` on near-black, Oswald display type,
film grain), with a real-time **Three.js** WebGL hero and **GSAP + ScrollTrigger
+ Lenis** scroll choreography.

## Stack

- **Vite** (vanilla JS, ES modules) — fast dev, static build
- **Three.js** — the flowing red point-field "horizon" in the hero
- **GSAP + ScrollTrigger** — entrance reveals, split lines, counters, magnetic buttons
- **Lenis** — smooth scroll, velocity-reactive marquees
- Google Fonts: Oswald · Fraunces · Hanken Grotesk · JetBrains Mono

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs static site to dist/
npm run preview  # preview the production build
```

## Deploy

It's a static site — deploy `dist/` anywhere. For Vercel: framework preset
**Vite**, build `npm run build`, output `dist`.

## Customize

A few spots are wired for you to personalize (search `index.html`):

- **LinkedIn link** — replace `href="#"` on the link marked `data-linkedin`
  with your profile URL, then remove the `data-linkedin` attribute (it disables
  the link until set).
- **Email** — `ouatahmahdi06@gmail.com` appears in the contact section and OG card.
- **Project links** — Couleva points to `couleva.ca`; the others point to your
  GitHub profile (`github.com/mehdiWebDev`). Swap in repo or live URLs as desired.
- **Social share image** — `public/og.png` (1200×630). Set absolute `og:image`
  / `twitter:image` URLs in `index.html` once you have a domain.

## Accessibility & performance notes

- Respects `prefers-reduced-motion` (preloader, hero, reveals, marquees all
  fall back to static).
- Content is visible without JS (reveal-hiding is gated on `html.js`).
- WebGL + marquees + cursor pause when off-screen or the tab is hidden.
- Skip-to-content link, AA-contrast text, semantic headings, focus styles.

Designed & built by Mahdi Ouatah.
