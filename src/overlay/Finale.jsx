import { useRef, useState } from 'react'
import { useFrameDom } from './primitives'
import { envAt } from '../film/timeline'
import { film } from '../film/store'
import { FINISHES, STRAPS, LINKS, PRICE } from '../config'

// Scene 08 hold — the device waits on the left while you choose its finish.
export function Finale() {
  const el = useRef()
  const [finish, setFinish] = useState(film.finish)
  const [strap, setStrap] = useState(film.strap)
  const live = useRef(false)

  useFrameDom((S, t) => {
    const o = envAt(t, [27.45, 27.85, 999, 1000])
    const e = el.current
    e.style.setProperty('--p', o.toFixed(4))
    e.style.visibility = o > 0.002 ? 'visible' : 'hidden'
    const on = o > 0.6
    if (on !== live.current) {
      live.current = on
      e.style.pointerEvents = on ? 'auto' : 'none'
      e.setAttribute('aria-hidden', on ? 'false' : 'true')
    }
  })

  const pickFinish = (id) => {
    film.finish = id
    setFinish(id)
  }
  const pickStrap = (id) => {
    film.strap = id
    setStrap(id)
  }
  const fLabel = FINISHES.find((f) => f.id === finish)?.label
  const sLabel = STRAPS.find((s) => s.id === strap)?.label

  return (
    <section className="finale" ref={el} aria-label="Reserve Fort" aria-hidden="true">
      <div className="finale-in">
        <div className="eyebrow">Signature Edition · Ships Q2 2027</div>
        <h2 className="headline">Reserve your Fort.</h2>
        <div className="price">
          <span className="now">${PRICE.now}</span>
          <s>${PRICE.was}</s>
          <span className="sold">Founders’ Edition sold out</span>
        </div>

        <div className="opt">
          <div className="opt-k">
            Finish <span>{fLabel}</span>
          </div>
          <div className="swatches" role="radiogroup" aria-label="Device finish">
            {FINISHES.map((f) => (
              <button key={f.id} role="radio" aria-checked={finish === f.id} className={`sw ${finish === f.id ? 'on' : ''}`} onClick={() => pickFinish(f.id)}>
                <i style={{ background: f.swatch }} />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="opt">
          <div className="opt-k">
            Silicone strap <span>{sLabel} · included</span>
          </div>
          <div className="swatches" role="radiogroup" aria-label="Strap colour">
            {STRAPS.map((s) => (
              <button key={s.id} role="radio" aria-checked={strap === s.id} className={`sw ${strap === s.id ? 'on' : ''}`} onClick={() => pickStrap(s.id)}>
                <i style={{ background: s.swatch }} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <p className="fine">Swap to nylon (+$10) or leather (+$50) at checkout.</p>
        </div>

        <p className="includes">Includes the Fort device, a silicone strap, the charging dock, and one free year of premium software. Fully refundable — cancel anytime before shipment.</p>

        <div className="ctas">
          <a className="btn primary" href={LINKS.order}>
            Reserve Fort — ${PRICE.now}
          </a>
          <a className="btn ghost" href={LINKS.waitlist}>
            Join the waitlist
          </a>
        </div>
        <p className="fine">Waitlist members unlock a free nylon strap upgrade on a qualifying preorder. Refer 3 friends to upgrade to leather.</p>
      </div>
    </section>
  )
}
