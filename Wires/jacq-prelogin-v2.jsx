import { useState } from "react";

// ─── Tokens ─────────────────────────────────────────────────────────────────
const G = {
  bg:    '#F5F2EC',
  surf:  '#FFFFFF',
  surf2: '#EDE8E1',
  surf3: '#E3DDD5',
  bord:  'rgba(0,0,0,0.08)',
  bord2: 'rgba(0,0,0,0.04)',
  t1:    '#1A1710',
  t2:    '#7A7268',
  t3:    '#AEA79E',
  gold:  '#B8935A',
  goldl: 'rgba(184,147,90,0.10)',
  goldb: 'rgba(184,147,90,0.22)',
  green: '#3A9468',
  greenl:'rgba(58,148,104,0.10)',
  amber: '#C07B28',
  red:   '#C0443A',
  blue:  '#3060B8',
  bluel: 'rgba(48,96,184,0.08)',
};

const SCREENS = [
  { id:'home',     cat:'Marketing', label:'Homepage',         desc:'Restructured around the core proposition: Jacq works for you, you don\'t work it. Hero leads with the relationship framing. Three differentiators section with Telegram proof-point examples. Competitive comparison table. Functional pillars lower down.' },
  { id:'pricing',  cat:'Marketing', label:'Pricing',          desc:'Feature lists now reference the three pillars directly. Free tier: no commitment tracker, no inferred personalisation, no patterns. Pro: all three pillars, unlimited. Partner: invite-only with monthly feedback.' },
  { id:'signup',   cat:'Marketing', label:'Sign Up',          desc:'Clean entry point. Plan selector, email, Google connect. Partner code callout for those with an invite.' },
  { id:'billing',  cat:'Marketing', label:'Billing · Pro',    desc:'Card details for Pro. Stripe-style. Clear £2 total, no hidden costs, cancel-any-time note.' },
  { id:'partner',  cat:'Marketing', label:'Billing · Partner',desc:'Partner invite code entry. Explains the feedback commitment, what Partner status means, and the accountability to the person who shared the invite.' },
  { id:'guidehub', cat:'Guide',     label:'Guide · Hub',      desc:'Docs home with three new pillar-specific sections: Personalisation, Commitment tracker, Proactive intelligence. Understanding replaces Memory throughout.' },
  { id:'guideart', cat:'Guide',     label:'Guide · Article',  desc:'Individual guide article. Left nav, breadcrumb, article content with sections and callouts. On-page nav rail. Helpful/not helpful feedback widget.' },
];

// ─── Shared ──────────────────────────────────────────────────────────────────

function Logo({ size = 22 }) {
  return (
    <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: size, fontWeight: 400, color: G.gold, letterSpacing: '-0.3px', lineHeight: 1 }}>
      Jacq
    </span>
  );
}

function Gilda({ children, size = 14, color, style = {} }) {
  return (
    <span style={{ fontFamily: '"Gilda Display", Georgia, serif', fontSize: size, color: color || G.t1, lineHeight: 1.4, ...style }}>
      {children}
    </span>
  );
}

function SiteNav({ active }) {
  const links = ['Features', 'Guide', 'Pricing'];
  return (
    <nav style={{ height: 56, background: G.surf, borderBottom: `1px solid ${G.bord}`, display: 'flex', alignItems: 'center', padding: '0 40px', gap: 0, flexShrink: 0 }}>
      <div style={{ marginRight: 40 }}><Logo size={24} /></div>
      <div style={{ display: 'flex', gap: 28, flex: 1 }}>
        {links.map(l => (
          <span key={l} style={{ fontSize: 13, color: active === l ? G.t1 : G.t2, fontWeight: active === l ? 600 : 400, cursor: 'pointer', letterSpacing: '-0.1px' }}>{l}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: G.t2, cursor: 'pointer' }}>Sign in</span>
        <div style={{ height: 34, padding: '0 16px', borderRadius: 10, background: G.t1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white', letterSpacing: '-0.1px' }}>Get started</span>
        </div>
      </div>
    </nav>
  );
}

function Tick({ color = G.green }) {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill={color}><path d="M6 10.78 2.72 7.5 1.78 8.44 6 12.67l8.22-8.22-.94-.95z"/></svg>;
}

function Cross() {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill={G.t3}><path d="M12.45 4.45 11.5 3.5 8 7 4.5 3.5l-.95.95L7.05 8l-3.5 3.55.95.95L8 8.95l3.5 3.55.95-.95L8.95 8z"/></svg>;
}

// ─── HOMEPAGE ────────────────────────────────────────────────────────────────

function Homepage() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto' }}>
      <SiteNav />

      {/* Hero */}
      <div style={{ padding: '80px 40px 72px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 99, background: G.goldl, border: `1px solid ${G.goldb}`, marginBottom: 28 }}>
          <span style={{ fontSize: 12, color: G.gold, fontWeight: 600, letterSpacing: '0.04em' }}>NOW IN ALPHA</span>
        </div>
        <Gilda size={56} style={{ display: 'block', lineHeight: 1.1, letterSpacing: '-1.2px', marginBottom: 20, color: G.t1 }}>
          Jacq works for you.<br/>You don't work it.
        </Gilda>
        <p style={{ fontSize: 16, color: G.t2, lineHeight: 1.8, maxWidth: 500, margin: '0 auto 12px', fontFamily: '"DM Sans", sans-serif' }}>
          Most AI assistants wait to be asked. Jacq doesn't.
        </p>
        <p style={{ fontSize: 15, color: G.t2, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 36px', fontFamily: '"DM Sans", sans-serif' }}>
          It monitors your email and calendar, tracks every commitment it makes, and reaches out to you via Telegram — without being asked. You wake up and it's already been working.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ height: 48, padding: '0 28px', borderRadius: 12, background: G.t1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif' }}>Try Jacq free →</span>
          </div>
          <div style={{ height: 48, padding: '0 24px', borderRadius: 12, background: G.surf, border: `1px solid ${G.bord}`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>See how it works</span>
          </div>
        </div>
        {/* Telegram proof point */}
        <div style={{ marginTop: 36, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: G.surf, borderRadius: 12, border: `1px solid ${G.bord}` }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill={G.blue}><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
          <span style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>Your live interface is Telegram. Jacq comes to you — you don't open an app.</span>
        </div>
      </div>

      {/* Three differentiators */}
      <div style={{ background: G.surf, padding: '64px 40px', borderTop: `1px solid ${G.bord}`, borderBottom: `1px solid ${G.bord}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Gilda size={13} color={G.t3} style={{ display: 'block', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>What makes Jacq different</Gilda>
          <Gilda size={32} style={{ display: 'block', marginBottom: 40, lineHeight: 1.25, letterSpacing: '-0.5px' }}>Three things no other<br/>AI assistant does.</Gilda>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {[
              {
                n: '01', col: G.blue,
                title: 'Learns you, not just your data.',
                body: 'Most AI starts fresh every time. Jacq pays attention — to your patterns, your rhythms, your relationships. After a month, it knows how you work better than most colleagues do.',
                proof: '"I\'ve noticed you reschedule Friday afternoons. Want me to auto-block Fridays after 1pm?"',
              },
              {
                n: '02', col: G.green,
                title: 'Never drops the ball.',
                body: 'When Jacq says it\'ll send a shortlist by end of day, it does. Every commitment tracked, dated, and followed through. You can see Jacq\'s own to-do list — and its completion rate.',
                proof: '"I committed to sending you the venue shortlist this morning. It\'s ready — [view shortlist]"',
              },
              {
                n: '03', col: G.gold,
                title: 'Acts before you ask.',
                body: 'Jacq spots the double-booking before you notice. It sees the email that went unanswered. It notices you\'re travelling next week and checks if any contacts are nearby.',
                proof: '"You\'re in Edinburgh on Thursday. Want me to check if any contacts are nearby for coffee?"',
              },
            ].map(p => (
              <div key={p.n} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, color: p.col, fontWeight: 700, fontFamily: '"DM Mono", monospace', marginBottom: 12, letterSpacing: '0.08em' }}>{p.n}</div>
                <Gilda size={20} style={{ display: 'block', marginBottom: 10, lineHeight: 1.3 }}>{p.title}</Gilda>
                <p style={{ fontSize: 13, color: G.t2, lineHeight: 1.7, fontFamily: '"DM Sans", sans-serif', margin: '0 0 14px' }}>{p.body}</p>
                <div style={{ marginTop: 'auto', padding: '10px 14px', background: G.bg, borderRadius: 10, border: `1px solid ${G.bord}`, borderLeft: `3px solid ${p.col}` }}>
                  <span style={{ fontSize: 12, color: G.t2, fontStyle: 'italic', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.55 }}>{p.proof}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitive comparison */}
      <div style={{ padding: '64px 40px', maxWidth: 900, margin: '0 auto' }}>
        <Gilda size={13} color={G.t3} style={{ display: 'block', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>Jacq vs. everything else</Gilda>
        <Gilda size={28} style={{ display: 'block', marginBottom: 32, lineHeight: 1.3, letterSpacing: '-0.4px' }}>The difference is structural, not cosmetic.</Gilda>
        <div style={{ background: G.surf, borderRadius: 16, border: `1px solid ${G.bord}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: `1px solid ${G.bord}`, background: G.bg }}>
            <span style={{ fontSize: 11, color: G.t3, fontFamily: '"DM Mono", monospace' }}> </span>
            {['ChatGPT / Claude', 'Siri / Alexa', 'Google Asst.', 'Jacq'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: h === 'Jacq' ? G.gold : G.t2, fontFamily: '"DM Sans", sans-serif', textAlign: 'center' }}>{h}</span>
            ))}
          </div>
          {[
            ['Comes to you (push, not pull)', false, false, false, true],
            ['Learns your patterns over time', false, false, 'Partial', true],
            ['Remembers its own commitments', false, false, false, true],
            ['Transparent, editable memory', false, false, false, true],
            ['Deep proactive suggestions', false, 'Basic', 'Basic', true],
            ['Writes in your voice and style', false, false, false, true],
            ['Data stays local by default', false, false, false, true],
            ['Acts as your proxy', false, false, false, true],
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '11px 20px', borderBottom: i < 7 ? `1px solid ${G.bord2}` : 'none', background: i % 2 === 0 ? 'transparent' : G.bg }}>
              <span style={{ fontSize: 13, color: G.t1, fontFamily: '"DM Sans", sans-serif' }}>{row[0]}</span>
              {[row[1], row[2], row[3], row[4]].map((val, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val === true ? <Tick color={j === 3 ? G.gold : G.green} /> :
                   val === false ? <Cross /> :
                   <span style={{ fontSize: 11, color: G.amber, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>{val}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Four functional pillars — what Jacq actually does */}
      <div style={{ background: G.surf, padding: '56px 40px', borderTop: `1px solid ${G.bord}`, borderBottom: `1px solid ${G.bord}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Gilda size={13} color={G.t3} style={{ display: 'block', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>What Jacq handles</Gilda>
          <Gilda size={28} style={{ display: 'block', marginBottom: 32, lineHeight: 1.3, letterSpacing: '-0.4px' }}>Four things. Done properly.</Gilda>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: 'Email and communications', body: 'Triages your inbox, summarises threads, drafts replies in your voice, and makes sure nothing goes cold without you knowing.', col: G.blue },
              { title: 'Calendar and time', body: 'Conflicts spotted before they land. Travel time blocked automatically. Overloaded weeks flagged before it\'s too late to fix them.', col: G.green },
              { title: 'Tasks and projects', body: 'Action items extracted from emails and conversations. A kanban board Jacq updates and works from — not a to-do list you maintain.', col: G.amber },
              { title: 'Relationships and context', body: 'Jacq remembers who people are, what you\'ve discussed, and what\'s outstanding. Every interaction is informed by everything that came before.', col: G.gold },
            ].map(p => (
              <div key={p.title} style={{ borderRadius: 14, padding: '22px 24px', border: `1px solid ${G.bord}` }}>
                <div style={{ width: 24, height: 3, borderRadius: 2, background: p.col, marginBottom: 14 }} />
                <Gilda size={17} style={{ display: 'block', marginBottom: 8, lineHeight: 1.35 }}>{p.title}</Gilda>
                <p style={{ fontSize: 13, color: G.t2, lineHeight: 1.7, fontFamily: '"DM Sans", sans-serif', margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quote — commitment engine */}
      <div style={{ background: G.t1, padding: '64px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <Gilda size={28} color="rgba(237,232,223,0.9)" style={{ display: 'block', lineHeight: 1.5, marginBottom: 20, letterSpacing: '-0.3px' }}>
            "I gave Jacq three things to follow up on. Two days later it had done all three without me asking again. That's never happened with any AI tool I've used."
          </Gilda>
          <p style={{ fontSize: 12, color: 'rgba(237,232,223,0.38)', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>Alpha tester · Founder, London</p>
        </div>
      </div>

      {/* Pricing teaser */}
      <div style={{ padding: '64px 40px', textAlign: 'center' }}>
        <Gilda size={36} style={{ display: 'block', marginBottom: 10, letterSpacing: '-0.8px' }}>£2 a month.</Gilda>
        <p style={{ fontSize: 15, color: G.t2, marginBottom: 28, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 28px' }}>
          Less than a coffee. The full experience — learning, commitment tracking, proactive intelligence — for less than a coffee a month.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <div style={{ height: 44, padding: '0 24px', borderRadius: 11, background: G.t1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif' }}>See pricing →</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${G.bord}`, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={18} />
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Guide', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 12, color: G.t3, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: G.t3, fontFamily: '"DM Mono", monospace' }}>Alpha 0.4.1</span>
      </div>
    </div>
  );
}

// ─── PRICING ─────────────────────────────────────────────────────────────────

function Pricing() {
  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '£0',
      freq: 'forever',
      desc: 'A genuine taste of Jacq — enough to feel the difference. Limited personalisation and no commitment tracking.',
      cta: 'Start free',
      ctaStyle: 'outline',
      features: [
        { text: 'Morning briefing via Telegram', yes: true },
        { text: 'Calendar conflict alerts', yes: true },
        { text: 'Email triage and summaries', yes: true },
        { text: 'Understanding (up to 20 items)', yes: true },
        { text: 'Inferred personalisation', yes: false },
        { text: 'Commitment tracker', yes: false },
        { text: 'Patterns observed', yes: false },
        { text: 'Autonomous actions', yes: false },
        { text: 'Relationship context', yes: false },
        { text: 'Weekly learning review', yes: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '£2',
      freq: '/month',
      desc: 'The full Jacq experience — all three pillars, unlimited, with the desktop engine and local LLM.',
      cta: 'Get Pro',
      ctaStyle: 'filled',
      highlight: true,
      features: [
        { text: 'Everything in Free', yes: true },
        { text: 'Full Understanding (unlimited)', yes: true },
        { text: 'Inferred personalisation', yes: true },
        { text: 'Weekly learning review', yes: true },
        { text: 'Commitment tracker', yes: true },
        { text: 'Patterns observed', yes: true },
        { text: 'Autonomous actions (Balanced mode)', yes: true },
        { text: 'Relationship context', yes: true },
        { text: 'Local LLM (desktop app)', yes: true },
        { text: 'Browser automation', yes: true },
      ],
    },
    {
      id: 'partner',
      name: 'Partner',
      price: '£0',
      freq: '+ monthly feedback',
      desc: 'For colleagues and early supporters. Free access in exchange for structured feedback that helps Jacq improve.',
      cta: 'Apply for Partner',
      ctaStyle: 'gold',
      features: [
        { text: 'Everything in Pro', yes: true },
        { text: 'Invite code required', yes: true },
        { text: 'Monthly feedback session', yes: true },
        { text: 'Direct input on product direction', yes: true },
        { text: 'Early access to new features', yes: true },
        { text: 'Partner badge in-app', yes: true },
        { text: 'No payment required', yes: true },
        { text: 'Can be revoked if feedback lapses', yes: true, warn: true },
      ],
    },
  ];

  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto' }}>
      <SiteNav active="Pricing" />
      <div style={{ padding: '56px 40px 24px', textAlign: 'center' }}>
        <Gilda size={42} style={{ display: 'block', letterSpacing: '-0.8px', marginBottom: 12 }}>Simple, honest pricing.</Gilda>
        <p style={{ fontSize: 15, color: G.t2, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.65, maxWidth: 440, margin: '0 auto 48px' }}>
          No tiers designed to confuse. One proper product, one fair price — or free, if you're willing to help us make it better.
        </p>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto', textAlign: 'left' }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ background: G.surf, borderRadius: 18, border: `1.5px solid ${tier.highlight ? G.t1 : G.bord}`, padding: '28px 26px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: tier.highlight ? '0 8px 40px rgba(0,0,0,0.10)' : 'none' }}>
              {tier.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: G.t1, borderRadius: 99, padding: '4px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.04em' }}>RECOMMENDED</span>
                </div>
              )}
              {tier.id === 'partner' && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: G.gold, borderRadius: 99, padding: '4px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.04em' }}>INVITE ONLY</span>
                </div>
              )}
              <Gilda size={15} style={{ display: 'block', marginBottom: 8, color: G.t2 }}>{tier.name}</Gilda>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <Gilda size={36} style={{ letterSpacing: '-1px' }}>{tier.price}</Gilda>
                <span style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>{tier.freq}</span>
              </div>
              <p style={{ fontSize: 12.5, color: G.t2, lineHeight: 1.65, fontFamily: '"DM Sans", sans-serif', marginBottom: 22, minHeight: 52 }}>{tier.desc}</p>

              {/* Features */}
              <div style={{ flex: 1, marginBottom: 24 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 10 }}>
                    {f.yes ? <Tick color={f.warn ? G.amber : G.green} /> : <Cross />}
                    <span style={{ fontSize: 12.5, color: f.yes ? G.t1 : G.t3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.4 }}>{f.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: tier.ctaStyle === 'filled' ? G.t1 : tier.ctaStyle === 'gold' ? G.goldl : 'transparent', border: tier.ctaStyle === 'outline' ? `1.5px solid ${G.bord}` : tier.ctaStyle === 'gold' ? `1.5px solid ${G.goldb}` : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: tier.ctaStyle === 'filled' ? 'white' : tier.ctaStyle === 'gold' ? G.gold : G.t1, fontFamily: '"DM Sans", sans-serif' }}>{tier.cta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ maxWidth: 600, margin: '48px auto 56px', textAlign: 'left' }}>
          <Gilda size={20} style={{ display: 'block', marginBottom: 20 }}>Common questions</Gilda>
          {[
            { q: 'What\'s the catch with the free tier?', a: 'No catch. It\'s intentionally limited — no autonomy, capped memory — so you can see what Jacq can do before deciding to upgrade. There\'s no time limit on the free tier.' },
            { q: 'How does Partner status work?', a: 'Partner accounts are free in exchange for structured monthly feedback — a short written response to a few questions about your experience. You\'ll receive an invite code from someone already in the product. If feedback lapses for two months, access reverts to the free tier.' },
            { q: 'Can I cancel at any time?', a: 'Yes. No notice period, no cancellation fee. Your account stays active until the end of the billing period you\'ve paid for.' },
            { q: 'Where does the £2 go?', a: 'Server costs, LLM API usage, and keeping the product running. We\'re priced to be sustainable, not profitable. That will change over time as the product matures.' },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${G.bord}`, padding: '16px 0' }}>
              <Gilda size={14} style={{ display: 'block', marginBottom: 6 }}>{faq.q}</Gilda>
              <p style={{ fontSize: 13, color: G.t2, lineHeight: 1.7, fontFamily: '"DM Sans", sans-serif', margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${G.bord}`, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={16} />
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Guide', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 12, color: G.t3, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP ─────────────────────────────────────────────────────────────────

function Signup() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto' }}>
      <SiteNav />
      <div style={{ display: 'flex', minHeight: 'calc(100% - 56px)' }}>
        {/* Left — form */}
        <div style={{ flex: 1, padding: '60px 56px', maxWidth: 480 }}>
          <Logo size={20} />
          <Gilda size={30} style={{ display: 'block', marginTop: 24, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.25 }}>Create your account</Gilda>
          <p style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 32, lineHeight: 1.65 }}>You selected the <strong style={{ color: G.t1 }}>Pro plan</strong>. You can change this any time.</p>

          {/* Plan selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[
              { id: 'free', label: 'Free', sub: '£0' },
              { id: 'pro', label: 'Pro', sub: '£2/mo', active: true },
              { id: 'partner', label: 'Partner', sub: 'Invite only' },
            ].map(p => (
              <div key={p.id} style={{ flex: 1, padding: '10px 12px', borderRadius: 11, border: `1.5px solid ${p.active ? G.t1 : G.bord}`, background: p.active ? G.t1 : G.surf, cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.active ? 'white' : G.t1, fontFamily: '"DM Sans", sans-serif' }}>{p.label}</div>
                <div style={{ fontSize: 11, color: p.active ? 'rgba(255,255,255,0.55)' : G.t3, fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>{p.sub}</div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: G.t2, display: 'block', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>Email address</label>
            <div style={{ height: 42, background: G.surf, border: `1px solid ${G.bord}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
              <span style={{ fontSize: 13, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>you@example.com</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: G.bord }} />
            <span style={{ fontSize: 12, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>or</span>
            <div style={{ flex: 1, height: 1, background: G.bord }} />
          </div>

          {/* Google sign up */}
          <div style={{ height: 44, background: G.surf, border: `1px solid ${G.bord}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: G.t1, fontFamily: '"DM Sans", sans-serif' }}>Continue with Google</span>
          </div>

          <div style={{ height: 44, background: G.t1, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif' }}>Continue →</span>
          </div>

          <p style={{ fontSize: 11, color: G.t3, marginTop: 14, lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
            By continuing you agree to our <span style={{ color: G.t2, textDecoration: 'underline', cursor: 'pointer' }}>Terms</span> and <span style={{ color: G.t2, textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>

        {/* Right — context */}
        <div style={{ flex: 1, background: G.surf, borderLeft: `1px solid ${G.bord}`, padding: '60px 48px' }}>
          <Gilda size={18} style={{ display: 'block', marginBottom: 28, color: G.t2 }}>What you're getting</Gilda>
          {[
            'Morning briefing via Telegram every day',
            'Email triage, summaries and draft replies',
            'Calendar conflict detection and time protection',
            'Tasks kanban — extracted from your emails automatically',
            'Autonomous actions with your approval',
            'Relationship context for everyone you work with',
            'Local LLM via desktop app — fewer cloud tokens',
            'Cancel any time, no questions asked',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
              <Tick />
              <span style={{ fontSize: 13, color: G.t1, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
          <div style={{ marginTop: 32, padding: '16px 18px', background: G.goldl, borderRadius: 12, border: `1px solid ${G.goldb}` }}>
            <Gilda size={13} style={{ display: 'block', marginBottom: 6 }}>Have a Partner code?</Gilda>
            <p style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.55, margin: 0 }}>
              Select the Partner plan above and you'll be asked for your invite code at the next step. Partner accounts are free in exchange for monthly feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING · PRO ───────────────────────────────────────────────────────────

function BillingPro() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto' }}>
      <SiteNav />
      <div style={{ display: 'flex', minHeight: 'calc(100% - 56px)' }}>
        <div style={{ flex: 1, padding: '60px 56px', maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill={G.t3}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span style={{ fontSize: 12, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>Back</span>
          </div>
          <Logo size={20} />
          <Gilda size={28} style={{ display: 'block', marginTop: 20, marginBottom: 6, letterSpacing: '-0.4px' }}>Payment details</Gilda>
          <p style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 28, lineHeight: 1.5 }}>Pro plan · £2.00/month · cancel any time</p>

          {['Card number', 'Name on card'].map(label => (
            <div key={label} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: G.t2, display: 'block', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>{label}</label>
              <div style={{ height: 42, background: G.surf, border: `1px solid ${G.bord}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                <span style={{ fontSize: 13, color: G.t3, fontFamily: '"DM Mono", monospace' }}>{label === 'Card number' ? '•••• •••• •••• ••••' : ''}</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {['Expiry (MM / YY)', 'CVC'].map(label => (
              <div key={label} style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: G.t2, display: 'block', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>{label}</label>
                <div style={{ height: 42, background: G.surf, border: `1px solid ${G.bord}`, borderRadius: 10 }} />
              </div>
            ))}
          </div>

          <div style={{ height: 44, background: G.t1, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', fontFamily: '"DM Sans", sans-serif' }}>Pay £2.00 and start →</span>
          </div>
          <p style={{ fontSize: 11, color: G.t3, lineHeight: 1.65, fontFamily: '"DM Sans", sans-serif', textAlign: 'center' }}>
            Payments processed by Stripe. We never store card details.
          </p>
        </div>

        {/* Right summary */}
        <div style={{ flex: 1, background: G.surf, borderLeft: `1px solid ${G.bord}`, padding: '60px 48px' }}>
          <Gilda size={18} style={{ display: 'block', marginBottom: 24, color: G.t2 }}>Order summary</Gilda>
          <div style={{ background: G.bg, borderRadius: 14, padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Gilda size={14}>Jacq Pro</Gilda>
              <Gilda size={14}>£2.00/mo</Gilda>
            </div>
            <p style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif', margin: 0, lineHeight: 1.55 }}>Full access. Billed monthly. Cancel any time — your account stays active until the end of the current billing period.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: `1px solid ${G.bord}` }}>
            <span style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>Total today</span>
            <Gilda size={20}>£2.00</Gilda>
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['No setup fee', 'Cancel any time', 'Renews monthly until cancelled', 'Downgrade to Free at any time'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <Tick />
                <span style={{ fontSize: 12.5, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING · PARTNER ───────────────────────────────────────────────────────

function BillingPartner() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto' }}>
      <SiteNav />
      <div style={{ display: 'flex', minHeight: 'calc(100% - 56px)' }}>
        <div style={{ flex: 1, padding: '60px 56px', maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill={G.t3}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span style={{ fontSize: 12, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>Back</span>
          </div>
          <Logo size={20} />

          {/* Partner badge */}
          <div style={{ marginTop: 20, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: G.goldl, borderRadius: 99, border: `1px solid ${G.goldb}` }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill={G.gold}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: G.gold, fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.04em' }}>PARTNER ACCESS</span>
          </div>

          <Gilda size={28} style={{ display: 'block', marginBottom: 8, letterSpacing: '-0.4px', lineHeight: 1.25 }}>Enter your invite code</Gilda>
          <p style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 28, lineHeight: 1.65 }}>
            Partner accounts are invitation-only. Your code was shared by someone already using Jacq. If you don't have one, you can <span style={{ color: G.t1, textDecoration: 'underline', cursor: 'pointer' }}>start with the free plan</span> instead.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: G.t2, display: 'block', marginBottom: 6, fontFamily: '"DM Sans", sans-serif' }}>Invite code</label>
            <div style={{ height: 46, background: G.surf, border: `1.5px solid ${G.bord}`, borderRadius: 11, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
              <span style={{ fontSize: 15, color: G.t3, fontFamily: '"DM Mono", monospace', letterSpacing: '0.15em', flex: 1 }}>JACQ – – – – –</span>
            </div>
            <p style={{ fontSize: 11, color: G.t3, marginTop: 6, fontFamily: '"DM Sans", sans-serif' }}>Codes are case-insensitive. Spaces are ignored.</p>
          </div>

          <div style={{ height: 44, background: G.goldl, border: `1.5px solid ${G.goldb}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G.gold, fontFamily: '"DM Sans", sans-serif' }}>Activate Partner access →</span>
          </div>
        </div>

        {/* Right — what Partner means */}
        <div style={{ flex: 1, background: G.surf, borderLeft: `1px solid ${G.bord}`, padding: '60px 48px' }}>
          <Gilda size={18} style={{ display: 'block', marginBottom: 6 }}>What Partner status means</Gilda>
          <p style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 24, lineHeight: 1.65 }}>
            Partners get full Pro access — everything, unlimited — in exchange for helping us make Jacq better.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {[
              { title: 'Monthly feedback', body: 'A short structured questionnaire each month. Takes about 5 minutes. Your answers directly shape what gets built next.' },
              { title: 'Direct access', body: 'Partners can raise issues, suggest features, and flag problems directly. We read everything.' },
              { title: 'No payment required', body: 'As long as feedback continues, access remains free. If feedback lapses for two consecutive months, the account reverts to the free tier.' },
            ].map(item => (
              <div key={item.title} style={{ padding: '14px 16px', background: G.bg, borderRadius: 12, border: `1px solid ${G.bord}` }}>
                <Gilda size={13} style={{ display: 'block', marginBottom: 5 }}>{item.title}</Gilda>
                <p style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', background: `${G.amber}10`, borderRadius: 10, border: `1px solid ${G.amber}25` }}>
            <p style={{ fontSize: 12, color: G.amber, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6, margin: 0 }}>
              Partner invites are issued personally. If you received one, the person who shared it is accountable for your participation. Please take the feedback commitment seriously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GUIDE HUB ───────────────────────────────────────────────────────────────

const GUIDE_SECTIONS = [
  { id: 'getting-started', label: 'Getting started', items: ['Welcome to Jacq', 'Setting up your account', 'Connecting Google', 'Your first morning briefing', 'The week-1 learning process'] },
  { id: 'telegram', label: 'Telegram', items: ['Connecting Telegram', 'How briefings work', 'Responding to Jacq', 'Notification settings'] },
  { id: 'personalisation', label: 'Personalisation', items: ['How Jacq learns you', 'Told vs. inferred entries', 'Weekly learning review', 'Teaching Jacq something new', 'Communication style'] },
  { id: 'commitments', label: 'Commitment tracker', items: ['How commitments work', 'Viewing active commitments', 'The weekly accountability digest', 'What happens if Jacq misses one'] },
  { id: 'proactive', label: 'Proactive intelligence', items: ['Morning briefing explained', 'Smart notifications', 'Patterns observed', 'Evening wrap-up', 'Quiet hours'] },
  { id: 'features', label: 'Features', items: ['Email triage', 'Calendar management', 'Tasks and kanban', 'Relationship context', 'Autonomous actions'] },
  { id: 'understanding', label: 'Understanding screen', items: ['What Understanding contains', 'Updating entries', 'Confirmed vs. inferred', 'Richness indicator'] },
  { id: 'desktop', label: 'Desktop app', items: ['Installing the app', 'Local LLM setup', 'Browser control', 'Token usage'] },
  { id: 'account', label: 'Account and billing', items: ['Managing your plan', 'Partner status explained', 'Cancelling', 'Data export and deletion'] },
  { id: 'troubleshooting', label: 'Troubleshooting', items: ['Jacq stopped messaging me', 'Google connection issues', 'Telegram not receiving', 'Resetting Jacq\'s understanding'] },
];

function GuideSidebar({ active }) {
  return (
    <div style={{ width: 220, borderRight: `1px solid ${G.bord}`, padding: '24px 0', overflowY: 'auto', flexShrink: 0, background: G.surf }}>
      <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${G.bord}`, marginBottom: 8 }}>
        <div style={{ height: 34, background: G.bg, border: `1px solid ${G.bord}`, borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 7 }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill={G.t3}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span style={{ fontSize: 12, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>Search docs…</span>
        </div>
      </div>
      {GUIDE_SECTIONS.map(sec => (
        <div key={sec.id} style={{ marginBottom: 4 }}>
          <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: G.t3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace' }}>
            {sec.label}
          </div>
          {sec.items.map(item => (
            <div key={item} style={{ padding: '5px 16px 5px 20px', fontSize: 12.5, color: active === item ? G.t1 : G.t2, fontWeight: active === item ? 600 : 400, cursor: 'pointer', background: active === item ? G.goldl : 'transparent', borderLeft: active === item ? `2px solid ${G.gold}` : '2px solid transparent', fontFamily: '"DM Sans", sans-serif' }}>
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GuideHub() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <SiteNav active="Guide" />
      {/* Guide top bar */}
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.bord}`, padding: '32px 40px 28px' }}>
        <Gilda size={32} style={{ display: 'block', letterSpacing: '-0.5px', marginBottom: 8 }}>Jacq Guide</Gilda>
        <p style={{ fontSize: 14, color: G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 20, lineHeight: 1.6 }}>
          Everything you need to set up Jacq, get the most out of it, and fix anything that goes wrong.
        </p>
        <div style={{ maxWidth: 440, height: 42, background: G.bg, border: `1px solid ${G.bord}`, borderRadius: 11, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 9 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill={G.t3}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span style={{ fontSize: 13, color: G.t3, fontFamily: '"DM Sans", sans-serif' }}>Search the guide…</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <GuideSidebar />
        {/* Main content */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720 }}>
            {GUIDE_SECTIONS.map(sec => (
              <div key={sec.id} style={{ background: G.surf, borderRadius: 14, border: `1px solid ${G.bord}`, padding: '20px 22px', cursor: 'pointer' }}>
                <Gilda size={16} style={{ display: 'block', marginBottom: 8 }}>{sec.label}</Gilda>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {sec.items.slice(0, 3).map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill={G.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      <span style={{ fontSize: 12, color: G.t2, fontFamily: '"DM Sans", sans-serif' }}>{item}</span>
                    </div>
                  ))}
                  {sec.items.length > 3 && (
                    <span style={{ fontSize: 11, color: G.t3, fontFamily: '"DM Sans", sans-serif', marginTop: 2 }}>+{sec.items.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Popular articles */}
          <div style={{ maxWidth: 720, marginTop: 32 }}>
            <Gilda size={14} color={G.t3} style={{ display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Frequently read</Gilda>
            {['How Memory works', 'Connecting Telegram', 'Understanding autonomous actions', 'Partner status explained', 'Jacq stopped messaging me'].map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${G.bord2}`, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: G.t1, fontFamily: '"DM Sans", sans-serif' }}>{a}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill={G.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GUIDE ARTICLE ───────────────────────────────────────────────────────────

function GuideArticle() {
  return (
    <div style={{ flex: 1, background: G.bg, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <SiteNav active="Guide" />
      <div style={{ display: 'flex', flex: 1 }}>
        <GuideSidebar active="How Memory works" />

        {/* Article */}
        <div style={{ flex: 1, padding: '32px 40px 56px', overflowY: 'auto', maxWidth: 680 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {['Guide', 'Memory and preferences', 'How Memory works'].map((b, i, arr) => (
              <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: i === arr.length - 1 ? G.t2 : G.t3, fontFamily: '"DM Sans", sans-serif', cursor: i < arr.length - 1 ? 'pointer' : 'default' }}>{b}</span>
                {i < arr.length - 1 && <svg viewBox="0 0 24 24" width="12" height="12" fill={G.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>}
              </span>
            ))}
          </div>

          <Gilda size={30} style={{ display: 'block', letterSpacing: '-0.5px', marginBottom: 14, lineHeight: 1.25 }}>How Memory works</Gilda>
          <p style={{ fontSize: 13, color: G.t3, fontFamily: '"DM Mono", monospace', marginBottom: 24 }}>Last updated 9 March 2026</p>

          {/* Intro */}
          <p style={{ fontSize: 14, color: G.t1, lineHeight: 1.75, fontFamily: '"DM Sans", sans-serif', marginBottom: 20 }}>
            Memory is the foundation of everything Jacq does. It's not a settings page — it's a living record of what Jacq has learned about you, written in plain language. The more it contains, the more useful Jacq becomes.
          </p>

          {/* Callout */}
          <div style={{ padding: '14px 18px', background: G.goldl, borderRadius: 12, border: `1px solid ${G.goldb}`, marginBottom: 24 }}>
            <Gilda size={13} style={{ display: 'block', marginBottom: 5 }}>The key idea</Gilda>
            <p style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6, margin: 0 }}>
              Jacq doesn't have a preferences screen with toggles. Your preferences <em>are</em> Memory entries. If you want Jacq to behave differently, you update Memory — either through the app or by telling Jacq in Telegram.
            </p>
          </div>

          <Gilda size={20} style={{ display: 'block', marginBottom: 10, letterSpacing: '-0.2px' }}>What gets stored in Memory</Gilda>
          <p style={{ fontSize: 14, color: G.t1, lineHeight: 1.75, fontFamily: '"DM Sans", sans-serif', marginBottom: 14 }}>
            Memory is organised into sections. During onboarding, Jacq fills these in through conversation. You can add, edit, or remove anything at any time.
          </p>
          <div style={{ marginBottom: 20 }}>
            {[
              ['About me', 'Your name, role, organisation, and working hours.'],
              ['Communication', 'Quiet hours, preferred channels, sign-off format, language, and tone.'],
              ['Calendar and time', 'Protected times, meeting length preferences, and travel buffer rules.'],
              ['Working style', 'How you prefer to work, what stresses you out, and how Jacq should respond.'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: `1px solid ${G.bord2}` }}>
                <span style={{ width: 130, fontSize: 12, color: G.t3, fontFamily: '"DM Mono", monospace', flexShrink: 0, paddingTop: 1 }}>{k}</span>
                <span style={{ fontSize: 13, color: G.t1, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.55 }}>{v}</span>
              </div>
            ))}
          </div>

          <Gilda size={20} style={{ display: 'block', marginBottom: 10, letterSpacing: '-0.2px' }}>Updating Memory</Gilda>
          <p style={{ fontSize: 14, color: G.t1, lineHeight: 1.75, fontFamily: '"DM Sans", sans-serif', marginBottom: 14 }}>
            There are three ways to update what Jacq knows:
          </p>
          {[
            ['In the app', 'Open Memory, find the relevant section, and tap the Jacq bubble icon next to any row. A chat panel opens with that item in context.'],
            ['Via Telegram', 'Just tell Jacq. "I\'ve moved to Edinburgh" or "Actually I prefer calls over video" — Jacq will update Memory and confirm what it stored.'],
            ['During onboarding', 'Everything Jacq learned in the intro conversation is stored here. You\'ll see it all the first time you open the Memory tab.'],
          ].map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: G.goldl, border: `1px solid ${G.goldb}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: G.gold, fontFamily: '"DM Mono", monospace' }}>{i + 1}</span>
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.t1, fontFamily: '"DM Sans", sans-serif', display: 'block', marginBottom: 3 }}>{k}</span>
                <span style={{ fontSize: 13, color: G.t2, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.65 }}>{v}</span>
              </div>
            </div>
          ))}

          {/* Info callout */}
          <div style={{ padding: '14px 18px', background: G.bluel, borderRadius: 12, border: `1px solid ${G.blue}22`, marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: G.blue, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.6, margin: 0 }}>
              <strong>Jacq never acts on Memory changes immediately.</strong> If you update your quiet hours at 11pm, Jacq won't start messaging you that night. Changes take effect at the start of the next natural period.
            </p>
          </div>

          {/* Next article */}
          <div style={{ marginTop: 32, padding: '16px 20px', background: G.surf, borderRadius: 14, border: `1px solid ${G.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <span style={{ fontSize: 11, color: G.t3, fontFamily: '"DM Sans", sans-serif', display: 'block', marginBottom: 4 }}>Next article</span>
              <Gilda size={14}>Updating preferences</Gilda>
            </div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill={G.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
        </div>

        {/* Right rail — on-page nav */}
        <div style={{ width: 180, padding: '32px 20px', borderLeft: `1px solid ${G.bord}`, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: G.t3, fontFamily: '"DM Mono", monospace', display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>On this page</span>
          {['What gets stored in Memory', 'Updating Memory', 'Useful to know'].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: i === 0 ? G.gold : G.t2, fontFamily: '"DM Sans", sans-serif', marginBottom: 10, cursor: 'pointer', lineHeight: 1.4, borderLeft: i === 0 ? `2px solid ${G.gold}` : '2px solid transparent', paddingLeft: 8 }}>
              {item}
            </div>
          ))}
          <div style={{ marginTop: 28, padding: '12px 14px', background: G.bg, borderRadius: 10, border: `1px solid ${G.bord}` }}>
            <Gilda size={12} style={{ display: 'block', marginBottom: 5 }}>Was this helpful?</Gilda>
            <div style={{ display: 'flex', gap: 8 }}>
              {['👍', '👎'].map(e => (
                <div key={e} style={{ width: 32, height: 32, borderRadius: 8, background: G.surf, border: `1px solid ${G.bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>{e}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen map ──────────────────────────────────────────────────────────────
const SM = {
  home: Homepage,
  pricing: Pricing,
  signup: Signup,
  billing: BillingPro,
  partner: BillingPartner,
  guidehub: GuideHub,
  guideart: GuideArticle,
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('home');
  const cats = [...new Set(SCREENS.map(s => s.cat))];
  const meta = SCREENS.find(s => s.id === active);
  const idx = SCREENS.findIndex(s => s.id === active);
  const Comp = SM[active];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#E9E5DF', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&family=Gilda+Display&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:2px}
        button:focus{outline:none}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 188, background: '#EAE6DF', borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 16px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <Logo size={22} />
          <div style={{ fontSize: 9.5, color: '#AEA79E', marginTop: 5, fontFamily: '"DM Mono", monospace', letterSpacing: '0.08em' }}>PRE-LOGIN · V2</div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0 16px' }}>
          {cats.map(cat => (
            <div key={cat}>
              <div style={{ padding: '12px 16px 4px', fontSize: 9.5, letterSpacing: '0.1em', color: '#AEA79E', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace' }}>{cat}</div>
              {SCREENS.filter(s => s.cat === cat).map(s => (
                <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 16px', background: active === s.id ? G.goldl : 'transparent', border: 'none', borderLeft: `2px solid ${active === s.id ? G.gold : 'transparent'}`, color: active === s.id ? G.gold : '#7A7268', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: active === s.id ? 600 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 10, color: '#AEA79E', fontFamily: '"DM Mono", monospace' }}>7 screens</div>
        </div>
      </aside>

      {/* Canvas */}
      <main style={{ flex: 1, display: 'flex', gap: 40, padding: '24px', overflow: 'hidden', alignItems: 'flex-start' }}>

        {/* Desktop browser mockup */}
        <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 64px rgba(0,0,0,0.12)', maxHeight: 'calc(100vh - 48px)', minWidth: 0 }}>
          {/* Browser chrome */}
          <div style={{ height: 38, background: '#F0EDE7', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}
            </div>
            <div style={{ flex: 1, height: 22, background: 'white', borderRadius: 6, border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <span style={{ fontSize: 11, color: '#AEA79E', fontFamily: '"DM Mono", monospace' }}>jacq.app/{active === 'home' ? '' : active === 'guidehub' ? 'guide' : active === 'guideart' ? 'guide/how-memory-works' : active}</span>
            </div>
          </div>
          {/* Page content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Comp />
          </div>
        </div>

        {/* Annotation */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '2px 8px', borderRadius: 99, background: G.bluel, color: G.blue, fontSize: 10.5, fontWeight: 600 }}>{meta?.cat}</span>
            <span style={{ fontSize: 11, color: '#AEA79E', fontFamily: '"DM Mono", monospace' }}>{String(idx + 1).padStart(2, '0')}/{SCREENS.length}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1710', letterSpacing: '-0.3px', marginBottom: 8, lineHeight: 1.25, fontFamily: '"Gilda Display", Georgia, serif' }}>{meta?.label}</div>
          <div style={{ fontSize: 13, color: '#7A7268', lineHeight: 1.75, marginBottom: 22 }}>{meta?.desc}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {[[-1, '← Prev'], [1, 'Next →']].map(([dir, label]) => {
              const target = SCREENS[idx + dir];
              return <button key={dir} onClick={() => target && setActive(target.id)} disabled={!target} style={{ flex: 1, padding: '8px', borderRadius: 9, background: target ? 'white' : 'transparent', border: `1px solid ${target ? 'rgba(0,0,0,0.08)' : 'transparent'}`, color: target ? '#7A7268' : '#AEA79E', fontSize: 12, cursor: target ? 'pointer' : 'default', fontFamily: 'inherit' }}>{label}</button>;
            })}
          </div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: '#AEA79E', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>All screens</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {SCREENS.map((s, i) => (
                <button key={s.id} onClick={() => setActive(s.id)} title={s.label} style={{ width: 30, height: 30, borderRadius: 8, background: active === s.id ? G.goldl : 'white', border: `1px solid ${active === s.id ? G.goldb : 'rgba(0,0,0,0.08)'}`, color: active === s.id ? G.gold : '#AEA79E', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
