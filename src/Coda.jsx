import { PRESS, BACKERS, FAQ, LINKS, PRICE } from './config'

// After the film: the evidence, the team, the questions, the footer. Typographic, not cards.
export function Coda() {
  return (
    <main className="coda" id="after">
      <section className="coda-sec press">
        <div className="coda-k eyebrow">In the press</div>
        <ul className="press-list">
          {PRESS.map((p) => (
            <li key={p.outlet}>
              <a href={p.href} target="_blank" rel="noreferrer">
                <span className="outlet">{p.outlet}</span>
                <span className="title">{p.title}</span>
                <span className="date mono">{p.date}</span>
                <span className="arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="coda-sec team">
        <div className="coda-k eyebrow">Who builds Fort</div>
        <div>
          <p className="statement">Built by a team of former Tesla engineers who love strength training.</p>
          <p className="backers">
            Backed by {BACKERS.slice(0, -1).join(', ')}, and {BACKERS[BACKERS.length - 1]} — plus angels from OpenAI, Tesla, and more.
          </p>
        </div>
      </section>

      <section className="coda-sec faq">
        <div className="coda-k eyebrow">Questions</div>
        <div className="faq-list">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <i aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
          <a className="more" href={LINKS.faq}>
            All questions →
          </a>
        </div>
      </section>

      <section className="coda-sec last">
        <p className="statement big">Get stronger. Stay active. Understand your body — without becoming obsessive about metrics.</p>
        <div className="ctas">
          <a className="btn primary" href={LINKS.order}>
            Reserve Fort — ${PRICE.now}
          </a>
          <a className="btn ghost" href={LINKS.waitlist}>
            Join the waitlist
          </a>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-mark">FORT</div>
        <div className="foot-col">
          <div className="eyebrow">Explore</div>
          <a href={LINKS.how}>How it Works</a>
          <a href={LINKS.strength}>Strength Wearable</a>
          <a href={LINKS.foundations}>Foundations</a>
          <a href={LINKS.faq}>FAQ</a>
          <a href={LINKS.waitlist}>Join Waitlist</a>
        </div>
        <div className="foot-col">
          <div className="eyebrow">Legal</div>
          <a href={LINKS.terms}>Terms</a>
          <a href={LINKS.privacy}>Privacy</a>
          <a href={LINKS.cookies}>Cookies</a>
          <a href={LINKS.refunds}>Refunds</a>
          <a href={LINKS.shipping}>Shipping</a>
          <a href={LINKS.preorderTerms}>Preorder Terms</a>
          <a href={LINKS.referralTerms}>Referral Terms</a>
        </div>
        <div className="foot-col">
          <div className="eyebrow">Contact</div>
          <a href={LINKS.email}>founders@fort.cx</a>
        </div>
        <div className="foot-legal mono">© 2026 Fort. All rights reserved.</div>
      </footer>
    </main>
  )
}
