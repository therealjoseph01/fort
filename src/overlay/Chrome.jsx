import { useRef, useState } from 'react'
import { useFrameDom } from './primitives'
import { SCENES, TOTAL, sceneIndexAt, range } from '../film/timeline'
import { film } from '../film/store'
import { LINKS, PRICE, SITE } from '../config'

export function jumpTo(t) {
  const y = t * film.vh
  const lenis = film.lenis
  if (lenis) {
    const dist = Math.abs(y - lenis.scroll) / film.vh
    lenis.scrollTo(y, { duration: Math.min(3.2, 0.9 + dist * 0.12), easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) })
  } else window.scrollTo({ top: y, behavior: 'smooth' })
}

// Film chrome: wordmark, scene index, chapter rail, runtime, progress.
export function Chrome() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const bar = useRef()
  const tc = useRef()
  const rail = useRef()
  const lastTc = useRef('')
  const nav = useRef()
  const codaRef = useRef(false)

  useFrameDom((S, t) => {
    const i = sceneIndexAt(t)
    if (i !== activeRef.current) {
      activeRef.current = i
      setActive(i)
    }
    bar.current.style.transform = `scaleX(${(t / TOTAL).toFixed(4)})`
    const secs = Math.floor(t * 6.4)
    const s = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
    if (s !== lastTc.current) {
      lastTc.current = s
      tc.current.textContent = s
    }
    const past = range(window.scrollY / film.vh, TOTAL + 0.05, TOTAL + 0.5)
    rail.current.style.opacity = (1 - past).toFixed(3)
    rail.current.style.pointerEvents = past > 0.5 ? 'none' : ''
    const inCoda = past > 0.5
    if (inCoda !== codaRef.current) {
      codaRef.current = inCoda
      nav.current.classList.toggle('over-coda', inCoda)
    }
  })

  const sc = SCENES[active]
  return (
    <>
      <header className="nav" ref={nav}>
        <a className="wordmark" href={SITE || '/'} aria-label="Fort home">
          FORT
        </a>
        <div className="nav-scene mono" aria-live="polite">
          <span>{sc.n}</span>
          <span className="sep" />
          <span>{sc.name}</span>
        </div>
        <a className={`nav-cta ${active === SCENES.length - 1 ? 'solid' : ''}`} href={LINKS.order}>
          Pre-order · ${PRICE.now}
        </a>
      </header>

      <div className={`hud-chrome ${active === SCENES.length - 1 ? 'is-last' : ''}`} ref={rail}>
        <nav className="rail" aria-label="Scenes">
          {SCENES.map((s, i) => (
            <button key={s.id} className={i === active ? 'on' : ''} onClick={() => jumpTo(s.jump)} aria-label={`Scene ${s.n}: ${s.name}`}>
              <span className="rail-name">{s.name}</span>
              <span className="rail-n">{s.n}</span>
            </button>
          ))}
        </nav>
        <div className="runtime mono">
          <span>SC {sc.n}/08</span>
          <span ref={tc}>00:00</span>
        </div>
        <button className="skip mono" onClick={() => jumpTo(SCENES[SCENES.length - 1].jump)}>
          Skip to pre-order ↓
        </button>
        <div className="progress">
          <i ref={bar} />
        </div>
      </div>
    </>
  )
}
