// Mutable, render-free shared state. React never re-renders from scroll — everything is read per frame.
export const film = {
  t: 0, // timeline position in screens
  vw: typeof window !== 'undefined' ? window.innerWidth : 1440,
  vh: typeof window !== 'undefined' ? window.innerHeight : 900,
  finish: 'silver',
  strap: 'charcoal',
  pointer: { x: 0, y: 0 },
  finePointer: true,
  reduced: false,
  lenis: null,
}

// QA hook, only with ?debug in the URL: __fortFilm.lenis.scrollTo(9.5 * __fortFilm.vh, { immediate: true })
if (typeof window !== 'undefined' && /[?&]debug\b/.test(window.location.search)) window.__fortFilm = film

// Per-frame DOM updaters (overlay typography, anchored labels, sky).
export const updaters = new Set()
