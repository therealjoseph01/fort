// Facts and links sourced from fort.cx (Sept 2026). Change SITE to '' to use relative links in production.
export const SITE = 'https://fort.cx'

export const LINKS = {
  order: `${SITE}/order`,
  waitlist: `${SITE}/waitlist`,
  how: `${SITE}/how-it-works`,
  strength: `${SITE}/strength-training-wearable`,
  foundations: `${SITE}/foundations`,
  faq: `${SITE}/faq`,
  about: `${SITE}/about`,
  different: `${SITE}/why-fort-is-different`,
  terms: `${SITE}/terms`,
  privacy: `${SITE}/privacy`,
  cookies: `${SITE}/cookies`,
  refunds: `${SITE}/refund-policy`,
  shipping: `${SITE}/shipping-policy`,
  preorderTerms: `${SITE}/preorder-terms`,
  referralTerms: `${SITE}/referral-terms`,
  email: 'mailto:founders@fort.cx',
}

export const PRICE = { now: 309, was: 349 }

export const FINISHES = [
  { id: 'silver', label: 'Silver', swatch: '#cfcfcb' },
  { id: 'black', label: 'Black', swatch: '#232325' },
  { id: 'gold', label: 'Gold', swatch: '#d8bd8b' },
]

export const STRAPS = [
  { id: 'charcoal', label: 'Charcoal', swatch: '#2e2e30' },
  { id: 'cream', label: 'Cream', swatch: '#e6ded0' },
  { id: 'blue', label: 'Light Blue', swatch: '#b6c6d5' },
]

export const PRESS = [
  {
    outlet: 'WIRED',
    title: 'The Fort Strength Training Wearable Tracks Your Sets',
    date: 'Mar 11, 2026',
    href: 'https://www.wired.com/story/fort-strength-training-wearable-launch/',
  },
  {
    outlet: 'Glossy',
    title: 'Former Tesla engineers look to crack strength training tracking with Fort wearable',
    date: 'Jun 24, 2026',
    href: 'https://www.glossy.co/beauty/wellness/wellness-briefing-former-tesla-engineers-look-to-crack-strength-training-tracking-with-fort-wearable-plus-news/',
  },
  {
    outlet: 'Fitt Insider',
    title: 'Fort Launches Strength-Tracking Wearable',
    date: 'Feb 17, 2026',
    href: 'https://insider.fitt.co/fort-launches-strength-tracking-wearable/',
  },
  {
    outlet: 'Wellworthy',
    title: 'Three former Tesla engineers built a wearable to track strength training',
    date: 'Feb 16, 2026',
    href: 'https://wellworthy.com/fort-wearable/',
  },
]

export const BACKERS = ['Afore Capital', 'Carnegie Mellon University', 'Weekend Fund', 'Theory Forge', 'Banana Capital']

export const FAQ = [
  {
    q: 'How does automatic tracking work?',
    a: 'Fort uses an IMU (accelerometer + gyroscope) and a PPG heart rate sensor to recognize exercises in real time. Sensor data is combined with your own training history, plus inputs from Fort coaches and partner studios, so workout detection and class-specific insights keep getting sharper over time.',
  },
  {
    q: 'What metrics does Fort track?',
    a: 'For strength: session scores, per-muscle volume breakdowns, proximity to failure, time under tension, rep velocity, rest times, and rep cadence. Beyond strength: heart rate zones, VO₂ max estimation, sleep stages (deep, light, REM), recovery scoring, overnight HRV, all-day activity, and real-time stress detection.',
  },
  {
    q: 'Can I wear Fort all day?',
    a: 'Yes. Fort is a general-purpose tracker that is especially good at strength, and it puts your strength training in the context of your overall health. Only wearing it for workouts works too.',
  },
  {
    q: 'How long does the battery last?',
    a: '7 days with normal use. Fort connects over Bluetooth Low Energy, and the companion app is available on iOS and Android.',
  },
  {
    q: 'When does Fort ship?',
    a: 'Founders’ Edition has sold out. Signature Edition is available now and is expected to ship Q2 2027. Preorders are fully refundable.',
  },
]
