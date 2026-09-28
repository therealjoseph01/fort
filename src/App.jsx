import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { film } from './film/store'
import { SCROLL_TOTAL, warp } from './film/timeline'
import { Stage } from './three/Stage'
import { Backdrop } from './overlay/primitives'
import { Mystery, Reveal, Inside, Intelligence, Worn } from './overlay/Scenes'
import { Lift, LiftBackdrop } from './overlay/Lift'
import { Beyond, DayLine, Clock } from './overlay/Beyond'
import { Finale } from './overlay/Finale'
import { Chrome } from './overlay/Chrome'
import { Coda } from './Coda'

function useFilm() {
  const [vh, setVh] = useState(film.vh)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    film.reduced = reduced
    film.finePointer = window.matchMedia('(pointer: fine)').matches
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.075, smoothWheel: !reduced, wheelMultiplier: 0.85, touchMultiplier: 1.1 })
    film.lenis = lenis
    let raf
    const loop = (time) => {
      lenis.raf(time)
      const y = lenis.animatedScroll ?? window.scrollY
      // scroll → story time, through the PACE slow-motion zones
      film.t = warp(y / film.vh)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onMove = (e) => {
      if (!film.finePointer) return
      film.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      film.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    // Only re-measure on real resizes, not mobile toolbar show/hide.
    let lastW = window.innerWidth
    const onResize = () => {
      const h = window.innerHeight
      if (window.innerWidth !== lastW || Math.abs(h - film.vh) > 140) {
        lastW = window.innerWidth
        film.vw = window.innerWidth
        film.vh = h
        setVh(h)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return vh
}

export default function App() {
  const vh = useFilm()
  return (
    <>
      <Backdrop />
      <div className="back" aria-hidden="true">
        <LiftBackdrop />
        <DayLine />
      </div>
      <Stage />
      <div className="front">
        <Mystery />
        <Reveal />
        <Inside />
        <Lift />
        <Intelligence />
        <Beyond />
        <Clock />
        <Worn />
        <Finale />
      </div>
      <Chrome />
      <div className="film-spacer" style={{ height: (SCROLL_TOTAL + 1) * vh }} />
      <Coda />
    </>
  )
}
