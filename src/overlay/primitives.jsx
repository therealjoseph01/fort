import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { updaters } from '../film/store'
import { range, smooth, envAt } from '../film/timeline'

// Register a per-frame DOM updater (runs inside the WebGL frame, after 3D transforms are applied).
export function useFrameDom(fn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const f = (...a) => ref.current(...a)
    updaters.add(f)
    return () => updaters.delete(f)
  }, [])
}

/*
  <Beat at={[inStart, inEnd, outStart, outEnd]}> — a piece of typography that exists only
  within its window of the film. CSS reads --p (arrival) and --q (departure).
*/
export function Beat({ at, className = '', style, children, as: Tag = 'div', onFrame, ...rest }) {
  const el = useRef()
  const last = useRef([-1, -1])
  useFrameDom((S, t, ctx) => {
    const p = smooth(range(t, at[0], at[1]))
    const q = smooth(range(t, at[2], at[3]))
    if (onFrame) onFrame(el.current, p * (1 - q), S, t, ctx)
    const L = last.current
    if (Math.abs(p - L[0]) < 0.0005 && Math.abs(q - L[1]) < 0.0005) return
    L[0] = p
    L[1] = q
    const e = el.current
    e.style.setProperty('--p', p.toFixed(4))
    e.style.setProperty('--q', q.toFixed(4))
    e.style.visibility = p * (1 - q) > 0.002 ? 'visible' : 'hidden'
  })
  return (
    <Tag ref={el} className={`beat ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  )
}

// A masked line that slides up into place; `i` staggers it within its beat.
export const Ln = ({ i = 0, children, className = '' }) => (
  <span className={`ln ${className}`} style={{ '--i': i }}>
    <span>{children}</span>
  </span>
)

/*
  <Tag> — a label pinned to a point in 3D space with a hairline leader.
  anchor(outVec3, S) writes the world position; dx/dy are [desktop, mobile] pixel offsets.
  col/row ([desktop, mobile] viewport fractions, or null) pin the label to a fixed column/row
  while the leader keeps pointing at the moving anchor.
*/
export function Tag({ at, anchor, dx = [110, 60], dy = [-30, -24], col, row, side = 'right', eyebrow, title, live, children, className = '', leader = true }) {
  const wrap = useRef()
  const lead = useRef()
  const dot = useRef()
  const val = useRef()
  const lastLive = useRef('')
  const vec = useMemo(() => new THREE.Vector3(), [])
  useFrameDom((S, t, ctx) => {
    const o = envAt(t, at)
    const e = wrap.current
    if (o < 0.002) {
      if (e.style.visibility !== 'hidden') {
        e.style.visibility = 'hidden'
        if (lead.current) lead.current.style.visibility = 'hidden'
        if (dot.current) dot.current.style.visibility = 'hidden'
      }
      return
    }
    if (anchor(vec, S) === false) return
    const [x, y, ok] = ctx.project(vec)
    const m = ctx.vw < 760 ? 1 : 0
    const cx = col ? col[m] : null
    const ry = row ? row[m] : null
    const lx = cx != null ? cx * ctx.vw : x + dx[m]
    const ly = ry != null ? ry * ctx.vh : y + dy[m]
    const sd = Array.isArray(side) ? side[m] : side
    const flip = sd === 'left'
    const showLead = Array.isArray(leader) ? leader[m] : leader
    if (e.dataset.side !== sd) {
      e.dataset.side = sd
      e.classList.toggle('left', flip)
      e.classList.toggle('right', !flip)
    }
    e.style.visibility = ok ? 'visible' : 'hidden'
    e.style.opacity = o.toFixed(3)
    e.style.transform = `translate3d(${lx.toFixed(1)}px, ${(ly + (1 - o) * 8).toFixed(1)}px, 0)${flip ? ' translateX(-100%)' : ''}`
    if (live && val.current) {
      const s = live(S, t)
      if (s !== lastLive.current) {
        lastLive.current = s
        val.current.textContent = s
      }
    }
    if (lead.current && !showLead) {
      lead.current.style.visibility = 'hidden'
      dot.current.style.visibility = 'hidden'
    }
    if (showLead && lead.current) {
      const ex = lx + (flip ? 8 : -8)
      const ey = ly + 12
      const len = Math.hypot(ex - x, ey - y) * Math.min(1, o * 1.25)
      const ang = Math.atan2(ey - y, ex - x)
      lead.current.style.visibility = ok ? 'visible' : 'hidden'
      lead.current.style.opacity = o.toFixed(3)
      lead.current.style.width = `${len.toFixed(1)}px`
      lead.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${ang.toFixed(4)}rad)`
      dot.current.style.visibility = ok ? 'visible' : 'hidden'
      dot.current.style.opacity = o.toFixed(3)
      dot.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
  })
  return (
    <>
      {leader && <div ref={lead} className="lead" />}
      {leader && <div ref={dot} className="lead-dot" />}
      <div ref={wrap} className={`tag ${Array.isArray(side) ? side[0] : side} ${className}`}>
        {eyebrow && <div className="tag-k">{eyebrow}</div>}
        {title && <div className="tag-t">{title}</div>}
        {live && <div className="tag-v" ref={val} />}
        {children && <div className="tag-d">{children}</div>}
      </div>
    </>
  )
}

// Writes the sky, glow, ink and accent colours into CSS variables.
const rgb = { r: 0, g: 0, b: 0 }
const toRGB = (c) => {
  c.getRGB(rgb, THREE.SRGBColorSpace)
  return `${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}`
}
export function Backdrop() {
  const glow = useRef()
  const cache = useRef({})
  useFrameDom((S) => {
    const root = document.documentElement
    const c = cache.current
    const vars = {
      '--bg-top': toRGB(S.bgTop),
      '--bg-bot': toRGB(S.bgBot),
      '--ink': toRGB(S.ink),
      '--accent': toRGB(S.accent),
    }
    for (const k in vars) {
      if (c[k] !== vars[k]) {
        c[k] = vars[k]
        root.style.setProperty(k, vars[k])
      }
    }
    const g = `radial-gradient(circle at ${(S.glowX * 100).toFixed(2)}% ${(S.glowY * 100).toFixed(2)}%, rgba(${toRGB(S.glowColor)}, ${S.glowA.toFixed(3)}) 0%, rgba(${toRGB(S.glowColor)}, 0) ${(S.glowR * 100).toFixed(1)}%)`
    if (c.glow !== g) {
      c.glow = g
      glow.current.style.background = g
    }
    const light = S.inkLight > 0.5 ? 'dark' : 'light'
    if (c.theme !== light) {
      c.theme = light
      root.dataset.scene = light
    }
  })
  return (
    <>
      <div className="sky" />
      <div className="glow" ref={glow} />
      <div className="grain" />
    </>
  )
}
