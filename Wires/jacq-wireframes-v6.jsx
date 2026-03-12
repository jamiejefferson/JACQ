import { useState } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const LT = {
  bg:'#F5F2EC', surf:'#FFFFFF', surf2:'#EDE8E1', surf3:'#E3DDD5',
  bord:'rgba(0,0,0,0.08)', bord2:'rgba(0,0,0,0.04)',
  t1:'#1A1710', t2:'#7A7268', t3:'#AEA79E',
  navBg:'#EDE8E1', shadow:'0 24px 80px rgba(0,0,0,0.10)',
};
const DK = {
  bg:'#131108', surf:'#1C1A12', surf2:'#242218', surf3:'#2C2A20',
  bord:'rgba(255,255,255,0.07)', bord2:'rgba(255,255,255,0.03)',
  t1:'#EDE8DF', t2:'#787060', t3:'#48443C',
  navBg:'#0D0C06', shadow:'0 24px 80px rgba(0,0,0,0.5)',
};
const C = {
  gold:'#B8935A', goldl:'rgba(184,147,90,0.10)', goldb:'rgba(184,147,90,0.22)',
  green:'#3A9468', greenl:'rgba(58,148,104,0.10)',
  amber:'#C07B28', amberl:'rgba(192,123,40,0.10)',
  red:'#C0443A', redl:'rgba(192,68,58,0.08)',
  blue:'#3060B8', bluel:'rgba(48,96,184,0.08)',
};

const tok = (dm) => dm ? DK : LT;

// ─── Screen registry ──────────────────────────────────────────────────────────
const SCREENS = [
  { id:'signin',    cat:'Onboarding',    label:'Sign In',               desc:'Entry point. Warm and minimal. Google OAuth only. The calm tone is set from the very first screen.' },
  { id:'cutscene',  cat:'Onboarding',    label:'Intro · Welcome',       desc:'A confident, unhurried welcome. Jacq introduces itself as a colleague, not a tool. Same warm palette throughout.' },
  { id:'introc',    cat:'Onboarding',    label:'Intro · Conversation',  desc:'Jacq interviews the user. Questions one at a time. Everything saved shown inline. Closes by setting the week-1 expectation: "I\'ll check in over the next few days as I get to know you better."' },
  { id:'connectg',  cat:'Onboarding',    label:'Connect Google',        desc:'One screen, one button, one approval. Jacq explains what it needs (Gmail, Calendar, Contacts) and guides the user to the standard Google OAuth flow.' },
  { id:'memory',    cat:'Control Panel', label:'Understanding',         desc:'Renamed from Memory. Jacq\'s living understanding of the user. Richness indicator shows told vs. inferred entries. Weekly learning card when a review is ready. "Teach Jacq something new" CTA. Inferred entries styled in amber with a Confirm? affordance.' },
  { id:'tasks',     cat:'Control Panel', label:'Tasks · Kanban',        desc:'Jacq\'s work surface. Columns reflect action state. JBubble on every card and section footer.' },
  { id:'taskdetail',cat:'Control Panel', label:'Task · Detail',         desc:'Full context for one task. Sub-tasks, people, Jacq\'s working notes. JBubble throughout.' },
  { id:'activity',  cat:'Control Panel', label:'Activity',              desc:'Split into three sections: Commitments (Jacq\'s tracked promises with due dates and completion rate), Actions taken (timestamped log), and Patterns observed (behavioural observations surfaced for confirmation).' },
  { id:'rels',      cat:'Relationships', label:'Relationships',         desc:'Everyone Jacq knows about. Burger nav. No footer. JBubble throughout.' },
  { id:'reldetail', cat:'Relationships', label:'Relationship · Detail', desc:'Full picture on one person. Relationship signals strip (response rate, meeting frequency, last contact). Communication preferences, context, open items. JBubble throughout.' },
  { id:'settings',  cat:'Settings',      label:'Settings',              desc:'All config. Weekly learning review timing and pattern learning preferences added to Performance & feedback group.' },
  { id:'desktop',   cat:'Desktop',       label:'Desktop · Menu Bar',    desc:'Silent engine. Status, local model, browser toggle, current task. macOS menu bar.' },
  { id:'desktopexp',cat:'Desktop',       label:'Desktop · Expanded',    desc:'Expanded panel. Model selector, browser stats, token split, system resources.' },
  { id:'burgernav', cat:'Overlays',      label:'Burger Nav',            desc:'Full-screen overlay. Section links, dark/light toggle, Message Jacq shortcut.' },
  { id:'chatpanel', cat:'Overlays',      label:'In-App Chat Panel',     desc:'Slides up from any screen. Context pre-loaded. Jacq messages in Gilda Display unbubbled. User messages in surf2 boxes.' },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Shell({ children, dm }) {
  const T = tok(dm);
  return (
    <div style={{ width:375, height:780, background:T.bg, borderRadius:44, border:`1.5px solid ${dm?'rgba(255,255,255,0.09)':'rgba(0,0,0,0.11)'}`, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:T.shadow, position:'relative', flexShrink:0 }}>
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:112, height:30, background:dm?'#0A0904':'#0A0904', borderRadius:'0 0 18px 18px', zIndex:20 }}/>
      {children}
    </div>
  );
}

function SB({ dm, light: lm }) {
  const T = tok(dm);
  const tc = lm ? 'rgba(255,255,255,0.85)' : T.t1;
  const ic = lm ? 'rgba(255,255,255,0.7)' : T.t2;
  return (
    <div style={{ height:46, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', flexShrink:0 }}>
      <span style={{ fontSize:13, fontWeight:600, color:tc, letterSpacing:'-0.2px' }}>9:41</span>
      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
        <svg viewBox="0 0 16 11" width="16" height="11">{[0,1,2,3].map(i=><rect key={i} x={i*4.5} y={10-(i+1)*2.4} width="3" height={(i+1)*2.4} rx=".7" fill={ic} opacity={i<3?1:0.3}/>)}</svg>
        <svg viewBox="0 0 25 12" width="25" height="11"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke={ic} strokeOpacity=".45" fill="none"/><rect x="2" y="2" width="16" height="8" rx="2" fill={ic}/><path d="M23 4v4a2 2 0 0 0 0-4z" fill={ic} opacity=".3"/></svg>
      </div>
    </div>
  );
}

// Logo — 'Jacq' in Instrument Serif italic, weight 400
function JacqLogo({ size=26, color, dm }) {
  return (
    <span style={{ fontFamily:'"Instrument Serif",Georgia,serif', fontStyle:'italic', fontSize:size, fontWeight:400, color:color||C.gold, letterSpacing:'-0.3px', lineHeight:1 }}>
      Jacq
    </span>
  );
}

// Avatar
function JAvatar({ size=26 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, background:`linear-gradient(145deg, ${C.gold} 0%, #7A5020 100%)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontFamily:'"Instrument Serif",Georgia,serif', fontSize:size*0.44, fontWeight:400, color:'rgba(255,255,255,0.92)', lineHeight:1 }}>J</span>
    </div>
  );
}

// Section label — Gilda Display (Jacq's voice)
function SL({ children, dm }) {
  const T = tok(dm);
  return (
    <div style={{ padding:'14px 18px 6px', fontSize:13, fontWeight:400, color:T.t1, fontFamily:'"Gilda Display",Georgia,serif', letterSpacing:'-0.1px' }}>
      {children}
    </div>
  );
}

function Hr({ dm, mx=14 }) {
  return <div style={{ height:1, background:tok(dm).bord2, margin:`0 ${mx}px` }}/>;
}

function Tag({ children, color }) {
  const c = color || '#888';
  return <span style={{ display:'inline-flex', padding:'2px 7px', borderRadius:99, background:`${c}16`, color:c, fontSize:10.5, fontWeight:600, fontFamily:'inherit' }}>{children}</span>;
}

// Inline Jacq chat bubble icon — appears next to rows and section footers
function JBubble({ dm, size=20, add=false }) {
  const T = tok(dm);
  // Speech bubble path: rounded rect with a small tail at bottom-left
  return (
    <div title={add ? 'Add via Jacq' : 'Chat about this'} style={{ width:size, height:size, flexShrink:0, cursor:'pointer', opacity:0.45, display:'flex', alignItems:'center', justifyContent:'center' }}
      onMouseEnter={e=>e.currentTarget.style.opacity='1'}
      onMouseLeave={e=>e.currentTarget.style.opacity='0.45'}
    >
      <svg viewBox="0 0 20 20" width={size} height={size} fill="none">
        {/* Bubble body */}
        <rect x="1" y="1" width="14" height="12" rx="3.5" fill={C.gold}/>
        {/* Tail */}
        <path d="M3 13 L2 17 L7 14" fill={C.gold}/>
        {/* J letterform */}
        <text x="8" y="10.5" textAnchor="middle" fontFamily="'Instrument Serif',Georgia,serif" fontSize="7.5" fontWeight="400" fill="white">J</text>
        {/* Plus badge if add mode */}
        {add && <>
          <circle cx="15.5" cy="14.5" r="4" fill={C.gold}/>
          <path d="M13.5 14.5h4M15.5 12.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </>}
      </svg>
    </div>
  );
}

// Top nav — with optional burger
function TNav({ title, sub, back, action, burger, onBurger, dm }) {
  const T = tok(dm);
  return (
    <div style={{ padding:'4px 18px 10px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
      {back && (
        <div style={{ width:32, height:32, borderRadius:10, background:T.surf2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill={T.t2}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </div>
      )}
      <div style={{ flex:1 }}>
        {/* Title — Gilda Display (Jacq's voice) */}
        <div style={{ fontSize:17, fontWeight:400, color:T.t1, fontFamily:'"Gilda Display",Georgia,serif', letterSpacing:'-0.2px', lineHeight:1.2 }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.t2, marginTop:2 }}>{sub}</div>}
      </div>
      {action && <div style={{ fontSize:13, color:C.gold, fontWeight:600, cursor:'pointer' }}>{action}</div>}
      {burger && (
        <div onClick={onBurger} style={{ width:34, height:34, borderRadius:10, background:T.surf2, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          <svg viewBox="0 0 18 14" width="16" height="13" fill={T.t2}>
            <rect y="0" width="18" height="2" rx="1"/>
            <rect y="6" width="12" height="2" rx="1"/>
            <rect y="12" width="18" height="2" rx="1"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// Bottom nav (control panel only)
function BNav({ active, onNav, dm }) {
  const T = tok(dm);
  const tabs = [
    { id:'memory',  label:'Understanding', d:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
    { id:'tasks',   label:'Tasks',    d:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
    { id:'activity',label:'Activity', d:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
    { id:'settings',label:'Settings', d:'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z' },
  ];
  return (
    <div style={{ height:68, background:T.surf, borderTop:`1px solid ${T.bord}`, display:'flex', flexShrink:0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>onNav&&onNav(t.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', cursor:'pointer', color:active===t.id?C.gold:T.t3, paddingBottom:4 }}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d={t.d}/></svg>
          <span style={{ fontSize:9, fontFamily:'inherit', fontWeight:active===t.id?600:400, letterSpacing:'0.01em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// Chat message components
// Jacq message — no bubble, no avatar, Gilda Display
function JMsg({ children, time, follow, dm }) {
  const T = tok(dm);
  return (
    <div style={{ padding:`${follow?4:18}px 22px 18px` }}>
      <div style={{ fontFamily:'"Gilda Display",Georgia,serif', fontStyle:'normal', fontWeight:400, fontSize:20, color:'#4A4540', lineHeight:1.35, letterSpacing:'-0.02em', maxWidth:'82%' }}>
        {children}
      </div>
      {time && <div style={{ fontSize:10, color:T.t3, marginTop:5, fontFamily:'"DM Sans",sans-serif' }}>{time}</div>}
    </div>
  );
}

function UMsg({ children, dm }) {
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', padding:'0 22px', marginBottom:4 }}>
      <div style={{ background:'#EDE8E1', borderRadius:18, padding:'11px 16px', maxWidth:'78%' }}>
        <span style={{ fontSize:14, color:'#1A1710', lineHeight:1.5, fontFamily:'"DM Sans",sans-serif' }}>{children}</span>
      </div>
    </div>
  );
}

function MT({ children }) {
  return <span style={{ fontFamily:'"Gilda Display",Georgia,serif', fontSize:20, lineHeight:1.35, letterSpacing:'-0.02em' }}>{children}</span>;
}

function Saved({ children, dm }) {
  const T = tok(dm);
  return (
    <div style={{ marginTop:10, padding:'9px 11px', background:C.goldl, borderRadius:10, border:`1px solid ${C.goldb}` }}>
      <div style={{ fontSize:10.5, fontWeight:600, color:C.gold, marginBottom:3, letterSpacing:'0.02em', fontFamily:'"DM Sans",sans-serif' }}>Saved to memory</div>
      <div style={{ fontSize:12, color:T.t2, lineHeight:1.55, fontFamily:'"DM Sans",sans-serif' }}>{children}</div>
    </div>
  );
}

// ─── ONBOARDING SCREENS ───────────────────────────────────────────────────────

function SignIn({ dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column' }}>
      <SB dm={dm}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 36px' }}>
        {/* Mark */}
        <div style={{ marginBottom:6 }}>
          <JacqLogo size={62} dm={dm}/>
        </div>
        <div style={{ width:32, height:1, background:C.gold, opacity:0.5, marginBottom:20 }}/>
        <div style={{ fontSize:13, color:T.t2, textAlign:'center', marginBottom:52, lineHeight:1.75, maxWidth:200 }}>
          Your proactive personal assistant
        </div>
        <button style={{ width:'100%', height:52, borderRadius:16, background:T.surf, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 2px 16px ${dm?'rgba(0,0,0,0.35)':'rgba(0,0,0,0.07)'}` }}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize:15, fontWeight:600, color:T.t1, fontFamily:'inherit' }}>Continue with Google</span>
        </button>
        <div style={{ fontSize:11, color:T.t3, textAlign:'center', marginTop:20, lineHeight:1.75, padding:'0 12px' }}>
          Jacq only accesses what you explicitly grant. Revoke at any time.
        </div>
      </div>
      <div style={{ padding:'0 0 28px', textAlign:'center' }}>
        <span style={{ fontSize:10, letterSpacing:'0.1em', color:T.t3, fontFamily:'"DM Mono",monospace' }}>ALPHA</span>
      </div>
    </div>
  );
}

function Cutscene({ dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column' }}>
      <SB dm={dm}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 32px 0 36px' }}>
        {/* Large quiet logo */}
        <div style={{ marginBottom:40 }}>
          <JacqLogo size={72} dm={dm}/>
        </div>
        {/* Staggered intro lines */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:22, fontWeight:400, color:T.t1, lineHeight:1.45, fontFamily:'"Gilda Display",Georgia,serif', marginBottom:6 }}>
            Nice to meet you.
          </div>
          <div style={{ fontSize:22, fontWeight:400, color:T.t1, lineHeight:1.45, fontFamily:'"Gilda Display",Georgia,serif', marginBottom:24 }}>
            I'm your personal assistant.
          </div>
          <div style={{ fontSize:14, color:T.t2, lineHeight:1.8, maxWidth:280 }}>
            I monitor your calendar and email, handle the follow-ups, and proactively reach out when something needs your attention.
          </div>
        </div>
        {/* Thin rule */}
        <div style={{ width:40, height:1, background:C.gold, opacity:0.5, marginTop:24, marginBottom:24 }}/>
        <div style={{ fontSize:13, color:T.t2, lineHeight:1.75 }}>
          Before we get started, I have a few questions so I can actually be useful rather than generic.
        </div>
      </div>
      <div style={{ padding:'16px 24px 32px' }}>
        <button style={{ width:'100%', height:50, borderRadius:14, background:T.t1, border:'none', color:dm?T.t1:'white', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'-0.1px' }}>
          <span style={{ color:dm?DK.t1:'white' }}>Let's begin →</span>
        </button>
      </div>
    </div>
  );
}

function IntroConv({ dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column' }}>
      <SB dm={dm}/>
      {/* Slim logo strip */}
      <div style={{ padding:'4px 18px 10px', borderBottom:`1px solid ${T.bord}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <JacqLogo size={26} dm={dm}/>
        <div style={{ marginLeft:'auto', fontSize:11, color:T.t3 }}>Getting to know you</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', paddingTop:4 }}>
        <JMsg dm={dm}>
          Before I get started, I'd like to ask you a few things. It'll only take a couple of minutes — and everything you tell me, I'll remember.
        </JMsg>
        <JMsg dm={dm} follow>
          What's your name, and what do you do? Don't overthink it — just tell me how you'd describe yourself at a dinner.
        </JMsg>
        <UMsg dm={dm}>I'm JJ. I run a digital consultancy — about 200 people. Lots of client work, lots of internal things to keep on top of.</UMsg>
        <JMsg dm={dm}>
          Got it. And what's the thing that most often slips through the cracks — the admin you wish someone else was handling?
        </JMsg>
        <UMsg dm={dm}>Follow-ups, honestly. Good meeting, then I just... don't chase it.</UMsg>
        <JMsg dm={dm}>
          That's one of the things I'm best at. I'll track commitments and flag anything that's gone quiet.
          <Saved dm={dm}>Follow-up tracking is a priority. Flag stale threads after 48h.</Saved>
        </JMsg>
        <JMsg dm={dm} follow>
          What time do you usually start work, and is there any time that's off-limits for me to reach out?
        </JMsg>
        <UMsg dm={dm}>Start around 8:30. No messages before 8 or after 8pm. Weekends off unless urgent.</UMsg>
        <JMsg dm={dm}>
          <Saved dm={dm}>Work hours: 08:30–20:00 weekdays. Quiet hours: before 08:00, after 20:00, weekends (emergencies only).</Saved>
        </JMsg>
        <JMsg dm={dm} follow>
          One more — how should I sign off messages I send on your behalf?
        </JMsg>
        <UMsg dm={dm}>'Jacq, PA to JJ' for now</UMsg>
        <JMsg dm={dm} time="Now">
          Perfect. One last step — I need to connect to your Google account. I'll open a browser, you tap Allow, and we're done. Then I'll check in again over the next few days as I get to know you better.
          <Saved dm={dm}>Sign-off (acting as PA): "Jacq, PA to JJ"</Saved>
        </JMsg>
        <div style={{ height:12 }}/>
      </div>
      <div style={{ padding:'10px 18px 28px', borderTop:`1px solid ${T.bord}`, flexShrink:0 }}>
        <button style={{ width:'100%', height:50, borderRadius:14, background:T.t1, border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          <span style={{ color:'white' }}>Connect my accounts →</span>
        </button>
      </div>
    </div>
  );
}

function ConnectGoogle({ dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column' }}>
      <SB dm={dm}/>
      <div style={{ padding:'4px 18px 10px', borderBottom:`1px solid ${T.bord}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <JacqLogo size={26} dm={dm}/>
        <div style={{ marginLeft:'auto', fontSize:11, color:T.t3 }}>Almost there</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', paddingTop:4 }}>
        <JMsg dm={dm}>
          Last step. I need access to your Google account — email, calendar, and contacts. It's one approval that covers everything.
        </JMsg>
        <JMsg dm={dm} follow>
          I'll open a browser. Just sign in and tap Allow on the Google screen, then come straight back here.
        </JMsg>

        {/* What Jacq will access */}
        <div style={{ margin:'4px 16px 14px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[
            { icon:'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z', color:'#EA4335', label:'Gmail', detail:'Inbox triage, drafting, follow-up tracking' },
            { icon:'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z', color:'#4285F4', label:'Calendar', detail:'Scheduling, conflict detection, travel blocks' },
            { icon:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', color:'#34A853', label:'Contacts', detail:'Who people are, relationship context' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div style={{ padding:'11px 14px', display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${item.color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill={item.color}><path d={item.icon}/></svg>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.t1 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:T.t2, marginTop:2 }}>{item.detail}</div>
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ height:1, background:T.bord2, margin:'0 14px' }}/>}
            </div>
          ))}
        </div>

        <JMsg dm={dm}>
          <div style={{ fontSize:13, color:T.t1, lineHeight:1.6, marginBottom:6 }}>
            <span style={{ color:C.gold, fontWeight:600 }}>One thing worth considering:</span> setting up a dedicated address like <span style={{ fontFamily:'"DM Mono",monospace', fontSize:12, color:C.gold }}>jacq@yourdomain.com</span> keeps everything clearly attributed. Useful if you want a clean separation between what I send and what you send directly.
          </div>
          <div style={{ fontSize:12, color:T.t3, lineHeight:1.55 }}>Entirely optional — easy to add later.</div>
        </JMsg>

        {/* Guardrail note */}
        <div style={{ margin:'0 16px 14px', padding:'10px 14px', background:C.greenl, borderRadius:12, border:`1px solid ${C.green}25`, display:'flex', gap:10 }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill={C.green} style={{ flexShrink:0, marginTop:1 }}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          <span style={{ fontSize:12, color:T.t1, lineHeight:1.55 }}>I will never send, delete, or book anything without your approval first.</span>
        </div>

        <div style={{ height:12 }}/>
      </div>
      <div style={{ padding:'10px 18px 28px', borderTop:`1px solid ${T.bord}`, display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
        <button style={{ width:'100%', height:52, borderRadius:14, background:T.surf, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 1px 8px ${dm?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.06)'}` }}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize:14, fontWeight:600, color:T.t1, fontFamily:'inherit' }}>Connect Google</span>
        </button>
        <button style={{ width:'100%', height:40, borderRadius:14, background:'transparent', border:'none', color:T.t3, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Skip for now</button>
      </div>
    </div>
  );
}

// ─── CONTROL PANEL SCREENS ────────────────────────────────────────────────────

function Memory({ onNav, onBurger, dm }) {
  const T = tok(dm);
  // Sections: some items marked inferred (amber treatment, Confirm? affordance)
  const sections = [
    { label:'About me', items:[
      {k:'Name',v:'JJ', inferred:false},
      {k:'Role',v:'CCO & co-founder, EQTR', inferred:false},
      {k:'Work hours',v:'08:30 – 20:00, Mon–Fri', inferred:false},
      {k:'Morning person',v:'Most productive 8–11am', inferred:true},
      {k:'Priority',v:'Follow-up tracking — flag stale threads after 48h', inferred:false},
    ]},
    { label:'Communication', items:[
      {k:'Quiet hours',v:'Before 08:00, after 20:00. Weekends off.', inferred:false},
      {k:'Channel',v:'Telegram for proactive messages', inferred:false},
      {k:'Sign-off (PA)',v:'"Jacq, PA to JJ"', inferred:false},
      {k:'Sign-off (as JJ)',v:'"JJ"', inferred:false},
      {k:'Tone',v:'Direct, warm, no filler', inferred:false},
      {k:'Reply to VIPs',v:'Usually within the hour', inferred:true},
    ]},
    { label:'Calendar & time', items:[
      {k:'No meetings before',v:'09:00', inferred:false},
      {k:'Meeting length',v:'Prefers 45 min — most sessions end on the 45', inferred:true},
      {k:'Protected time',v:'Friday afternoons — nothing after 13:00', inferred:false},
      {k:'Travel buffer',v:'30 min auto-blocked before off-sites', inferred:false},
    ]},
    { label:'Working style', items:[
      {k:'Prefers',v:'Video > phone. Async where possible.', inferred:false},
      {k:'Lunch',v:'Around 12:30. Don\'t book over it.', inferred:false},
      {k:'When stressed',v:'Give space, don\'t pile on.', inferred:false},
    ]},
  ];
  const inferredCount = sections.flatMap(s=>s.items).filter(i=>i.inferred).length;
  const totalCount = sections.flatMap(s=>s.items).length;
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Understanding" sub="Jacq's picture of you" burger onBurger={onBurger} dm={dm}/>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Weekly learning card */}
        <div style={{ margin:'4px 16px 0', padding:'12px 14px', background:C.goldl, borderRadius:14, border:`1px solid ${C.goldb}`, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.gold, marginBottom:3, fontFamily:'"DM Sans",sans-serif', letterSpacing:'0.02em' }}>Weekly learning · ready to review</div>
            <div style={{ fontSize:12, color:T.t2, lineHeight:1.5, fontFamily:'"DM Sans",sans-serif' }}>This week I picked up three things about how you work. Want to review them?</div>
          </div>
          <div style={{ padding:'6px 12px', borderRadius:8, background:C.gold, cursor:'pointer', flexShrink:0 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'white', fontFamily:'"DM Sans",sans-serif' }}>Review</span>
          </div>
        </div>

        {/* Richness indicator */}
        <div style={{ padding:'10px 18px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:T.t2, fontFamily:'"DM Sans",sans-serif' }}>
            Jacq understands <strong style={{ color:T.t1 }}>{totalCount} things</strong> about you. <span style={{ color:C.amber }}>{inferredCount} were inferred from how you work.</span>
          </span>
        </div>

        {/* Teach Jacq CTA */}
        <div style={{ margin:'6px 16px 8px', padding:'10px 14px', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <JBubble dm={dm} add size={22}/>
          <span style={{ fontSize:13, color:T.t1, fontFamily:'"DM Sans",sans-serif' }}>Teach Jacq something new</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3} style={{ marginLeft:'auto' }}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </div>

        {/* Search */}
        <div style={{ padding:'0 16px 8px' }}>
          <div style={{ height:36, background:T.surf, border:`1px solid ${T.bord}`, borderRadius:10, display:'flex', alignItems:'center', padding:'0 12px', gap:8 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span style={{ fontSize:13, color:T.t3 }}>Search understanding…</span>
          </div>
        </div>

        {sections.map(sec=>(
          <div key={sec.label}>
            <SL dm={dm}>{sec.label}</SL>
            <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden', marginBottom:6 }}>
              {sec.items.map((item,i)=>(
                <div key={item.k}>
                  <div style={{ padding:'10px 14px', display:'flex', gap:10, alignItems:'center', borderLeft:`2px solid ${item.inferred?C.amber:'transparent'}` }}>
                    <div style={{ width:112, fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace', paddingTop:1, flexShrink:0 }}>{item.k}</div>
                    <div style={{ flex:1, fontSize:13, color:item.inferred?T.t2:T.t1, lineHeight:1.5 }}>{item.v}</div>
                    {item.inferred && <span style={{ fontSize:11, color:C.amber, fontFamily:'"DM Sans",sans-serif', fontWeight:600, flexShrink:0, marginRight:4, cursor:'pointer' }}>Confirm?</span>}
                    <JBubble dm={dm}/>
                  </div>
                  {i<sec.items.length-1&&<Hr dm={dm}/>}
                </div>
              ))}
              <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
                <JBubble dm={dm} add size={22}/>
                <span style={{ fontSize:12, color:T.t3 }}>Add to {sec.label.toLowerCase()} via Jacq</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
      <BNav active="memory" onNav={onNav} dm={dm}/>
    </div>
  );
}

function Tasks({ onNav, onBurger, dm }) {
  const T = tok(dm);
  const cols = [
    { id:'todo', label:'To Do', color:T.t3, cards:[
      { title:'Organise team offsite', tags:['Events','Q2'], note:'Jacq researching venues in Perthshire', src:'From: Sarah\'s email' },
      { title:'Brief new brand agency', tags:['Brand'], note:'Awaiting brief doc from JJ', src:'Added manually' },
    ]},
    { id:'jacq', label:'Jacq Acting', color:C.gold, cards:[
      { title:'Follow up: Acme proposal', tags:['Client','Urgent'], note:'48h no reply — chase draft ready for approval', src:'From: inbox' },
      { title:'Book lunch · 12 March', tags:['Personal'], note:'Jacq checking availability near WeWork', src:'From: Telegram' },
    ]},
    { id:'waiting', label:'Waiting', color:C.amber, cards:[
      { title:'Q3 budget sign-off', tags:['Finance'], note:'Waiting on Sarah. Draft sent 2 days ago.', src:'From: inbox' },
    ]},
    { id:'done', label:'Done', color:C.green, cards:[] },
  ];
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Tasks" sub="Jacq's work surface" action="+ Add" burger onBurger={onBurger} dm={dm}/>
      <div style={{ padding:'0 16px 10px', display:'flex', gap:7, flexShrink:0, overflowX:'auto' }}>
        {cols.map(col=>(
          <div key={col.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, background:col.id==='jacq'?C.goldl:T.surf, border:`1px solid ${col.id==='jacq'?C.goldb:T.bord}`, flexShrink:0 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:col.color }}/>
            <span style={{ fontSize:11.5, fontWeight:600, color:col.id==='jacq'?C.gold:T.t2, whiteSpace:'nowrap' }}>{col.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        {cols.filter(c=>c.cards.length>0).map(col=>(
          <div key={col.id}>
            <SL dm={dm}>{col.label}</SL>
            {col.cards.map((card,i)=>(
              <div key={i} style={{ margin:'0 16px 8px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                  <div style={{ flex:1, fontSize:13, fontWeight:600, color:T.t1 }}>{card.title}</div>
                  <JBubble dm={dm}/>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:7 }}>{card.tags.map(t=><Tag key={t} color={T.t2}>{t}</Tag>)}</div>
                <div style={{ fontSize:12, color:T.t2, lineHeight:1.55, marginBottom:5 }}>{card.note}</div>
                <div style={{ fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace' }}>{card.src}</div>
              </div>
            ))}
            {/* Add card to column */}
            <div style={{ margin:'0 16px 8px', border:`1.5px dashed ${T.bord}`, borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <JBubble dm={dm} add size={22}/>
              <span style={{ fontSize:12, color:T.t3 }}>Add task via Jacq</span>
            </div>
          </div>
        ))}
        <SL dm={dm}>Done this week</SL>
        {['Archived 4 cold outreach emails','Drafted reply to Tom re Thursday dinner','Prepped Acme Corp one-pager','Blocked focus time Mon–Wed 10–11am'].map((item,i)=>(
          <div key={i} style={{ margin:'0 16px 6px', background:T.surf, borderRadius:10, border:`1px solid ${T.bord}`, padding:'9px 14px', display:'flex', gap:10, alignItems:'center' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill={C.green}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span style={{ fontSize:12, color:T.t2 }}>{item}</span>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
      <BNav active="tasks" onNav={onNav} dm={dm}/>
    </div>
  );
}

function TaskDetail({ onNav, onBurger, dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Team offsite" back sub="To Do · Events · Q2" burger onBurger={onBurger} dm={dm}/>
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ margin:'4px 16px 0', padding:'10px 14px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, display:'flex', gap:16 }}>
          {[['Status','To Do'],['Added','6 Mar'],['Source','Email']].map(([l,v])=>(
            <div key={l} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.t1 }}>{v}</div>
            </div>
          ))}
        </div>
        <SL dm={dm}>Jacq's working notes</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, padding:'12px 14px' }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <div style={{ flex:1, fontSize:13, color:T.t1, lineHeight:1.65 }}>Sarah's email (4 Mar) mentioned "somewhere in Scotland, not Edinburgh — outdoor space for an evening dinner". Budget not specified. Circa 20 people.</div>
            <JBubble dm={dm}/>
          </div>
          <div style={{ marginTop:10, padding:'8px 10px', background:C.goldl, borderRadius:10, border:`1px solid ${C.goldb}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.gold, marginBottom:3 }}>Jacq is working on this</div>
            <div style={{ fontSize:12, color:T.t2, lineHeight:1.55 }}>Researching venues in Perthshire and the Trossachs. Shortlist by end of day with availability and cost per head.</div>
          </div>
        </div>
        <SL dm={dm}>Sub-tasks</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[{text:'Get budget sign-off from JJ',done:false,own:'JJ'},{text:'Research venue options',done:false,own:'Jacq'},{text:'Confirm rough dates with Sarah',done:false,own:'JJ'},{text:'Get dietary requirements',done:true,own:'Jacq'}].map((t,i,arr)=>(
            <div key={i}>
              <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:16, height:16, borderRadius:5, border:`1.5px solid ${t.done?C.green:T.bord}`, background:t.done?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {t.done&&<svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                <span style={{ flex:1, fontSize:13, color:t.done?T.t3:T.t1, textDecoration:t.done?'line-through':'none' }}>{t.text}</span>
                <Tag color={t.own==='Jacq'?C.gold:C.blue}>{t.own}</Tag>
                <JBubble dm={dm}/>
              </div>
              {i<arr.length-1&&<Hr dm={dm}/>}
            </div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add sub-task via Jacq</span>
          </div>
        </div>
        <SL dm={dm}>People involved</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[['Sarah Mitchell','Requested — direct report','SM','#5B4FCF'],['Marcus Webb','Approver — budget','MW','#3A7D8C']].map(([n,r,ini,col],i)=>(
            <div key={n}>
              <div style={{ padding:'10px 14px', display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:28, height:28, borderRadius:14, background:col, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ fontSize:11, fontWeight:700, color:'white' }}>{ini}</span></div>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.t1 }}>{n}</div><div style={{ fontSize:11, color:T.t2, marginTop:1 }}>{r}</div></div>
                <JBubble dm={dm}/>
              </div>
              {i===0&&<Hr dm={dm}/>}
            </div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add person via Jacq</span>
          </div>
        </div>
        <div style={{ height:20 }}/>
      </div>
      <BNav active="tasks" onNav={onNav} dm={dm}/>
    </div>
  );
}

function Activity({ onNav, onBurger, dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Activity" sub="Commitments, actions and patterns" burger onBurger={onBurger} dm={dm}/>
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* ── SECTION 1: COMMITMENTS ── */}
        <SL dm={dm}>Commitments</SL>
        {/* Completion rate */}
        <div style={{ margin:'0 16px 8px', padding:'10px 14px', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:T.t2, fontFamily:'"DM Sans",sans-serif' }}>This week's completion rate</span>
          <span style={{ fontSize:15, fontWeight:700, color:C.green, fontFamily:'"DM Mono",monospace' }}>100%</span>
        </div>
        {/* Active commitments */}
        {[
          {title:'Send venue shortlist for team offsite', due:'Today, 18:00', src:'From Telegram, 10 Mar 09:14', status:'pending'},
          {title:'Chase Acme invoice if no reply by Wed', due:'Wed 12 Mar', src:'From inbox, 5 Mar', status:'pending'},
          {title:'Book anniversary restaurant', due:'Mon 17 Mar', src:'From Telegram, 9 Mar', status:'pending'},
        ].map((item,i)=>(
          <div key={i} style={{ margin:'0 16px 6px', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, padding:'11px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:600, color:T.t1, flex:1, paddingRight:8 }}>{item.title}</span>
              <JBubble dm={dm}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace' }}>{item.src}</span>
              <span style={{ fontSize:11, color:i===0?C.amber:T.t3, fontFamily:'"DM Mono",monospace', fontWeight:i===0?600:400 }}>Due: {item.due}</span>
            </div>
          </div>
        ))}
        {/* Completed this week */}
        <div style={{ margin:'0 16px 6px', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          <div style={{ padding:'9px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill={C.green}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span style={{ flex:1, fontSize:12, color:T.t2, fontFamily:'"DM Sans",sans-serif' }}>Completed this week · 7</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
        </div>

        {/* ── SECTION 2: ACTIONS TAKEN ── */}
        <SL dm={dm}>Actions taken today</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden', marginBottom:6 }}>
          {[
            {text:'Triaged inbox — 3 items flagged, 4 archived',type:'Email',time:'08:32'},
            {text:'Extracted 2 tasks from Sarah\'s email thread',type:'Task',time:'08:33'},
            {text:'Drafted Acme Corp one-pager',type:'Research',time:'09:15'},
            {text:'Blocked focus time Mon–Wed 10:00–11:00',type:'Calendar',time:'09:20'},
            {text:'Sent morning briefing via Telegram',type:'Message',time:'07:30'},
          ].map((item,i,arr)=>(
            <div key={i}>
              <div style={{ padding:'9px 14px', display:'flex', gap:10, alignItems:'center' }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill={C.green}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span style={{ flex:1, fontSize:12, color:T.t1 }}>{item.text}</span>
                <Tag color={T.t3}>{item.type}</Tag>
                <span style={{ fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace', flexShrink:0 }}>{item.time}</span>
                <JBubble dm={dm}/>
              </div>
              {i<arr.length-1&&<Hr dm={dm}/>}
            </div>
          ))}
        </div>

        {/* ── SECTION 3: PATTERNS OBSERVED ── */}
        <SL dm={dm}>Patterns observed</SL>
        {[
          {obs:'You reschedule Friday afternoon meetings almost every week. Want me to auto-block Fridays after 1pm?', type:'Calendar'},
          {obs:'You reply to Sarah within the hour, but supplier emails tend to sit for 2–3 days. Want me to prioritise VIPs and batch the rest?', type:'Email'},
        ].map((item,i)=>(
          <div key={i} style={{ margin:'0 16px 8px', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, borderLeft:`3px solid ${C.gold}`, padding:'11px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <span style={{ fontSize:12, color:T.t1, lineHeight:1.55, flex:1, paddingRight:8, fontFamily:'"DM Sans",sans-serif' }}>{item.obs}</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Tag color={C.gold}>{item.type}</Tag>
              <span style={{ fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace', marginLeft:'auto' }}>Observed this week</span>
              <JBubble dm={dm}/>
            </div>
          </div>
        ))}

        {/* Autonomy */}
        <SL dm={dm}>Autonomy level</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, padding:'12px 14px', marginBottom:8 }}>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {['Cautious','Balanced','Autonomous'].map((l,i)=>(
              <div key={l} style={{ flex:1, padding:'7px 4px', borderRadius:9, background:i===1?C.goldl:T.surf2, border:`1px solid ${i===1?C.goldb:'transparent'}`, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:600, color:i===1?C.gold:T.t3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, fontSize:12, color:T.t2, lineHeight:1.55 }}>Jacq drafts before acting. Change here or message Jacq on Telegram.</div>
            <JBubble dm={dm}/>
          </div>
        </div>
        <div style={{ margin:'4px 16px 20px' }}>
          <button style={{ width:'100%', padding:'11px', borderRadius:12, background:C.redl, border:`1px solid ${C.red}25`, color:C.red, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Pause all autonomous actions</button>
        </div>
        <div style={{ height:20 }}/>
      </div>
      <BNav active="activity" onNav={onNav} dm={dm}/>
    </div>
  );
}

// ─── RELATIONSHIPS ────────────────────────────────────────────────────────────

function Rels({ onBurger, dm }) {
  const T = tok(dm);
  const contacts = [
    { name:'Sarah Mitchell', role:'Direct report · EQTR', open:3, last:'Today', vip:true, alert:'🎂 3 days', ini:'SM', col:'#5B4FCF' },
    { name:'Tom Keller', role:'Client · Acme Corp', open:2, last:'2d ago', vip:true, ini:'TK', col:'#C07B28' },
    { name:'Marcus Webb', role:'Colleague · EQTR', open:1, last:'Yesterday', vip:false, ini:'MW', col:'#3A7D8C' },
    { name:'Ben Harrison', role:'New · referred by Tom', open:1, last:'3d ago', vip:false, ini:'BH', col:'#7A52C0' },
  ];
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Relationships" sub="People Jacq knows about" burger onBurger={onBurger} dm={dm}/>
      <div style={{ padding:'0 16px 10px', flexShrink:0 }}>
        <div style={{ height:36, background:T.surf, border:`1px solid ${T.bord}`, borderRadius:10, display:'flex', alignItems:'center', padding:'0 12px', gap:8 }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span style={{ fontSize:13, color:T.t3 }}>Search relationships…</span>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <SL dm={dm}>VIPs</SL>
        {contacts.filter(c=>c.vip).map((c)=>(
          <div key={c.name} style={{ margin:'0 16px 8px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, padding:'12px 14px' }}>
            <div style={{ display:'flex', gap:10, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:18, background:c.col, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'white' }}>{c.ini}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.t1 }}>{c.name}</div>
                <div style={{ fontSize:12, color:T.t2, marginTop:1 }}>{c.role}</div>
              </div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill={C.gold}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <JBubble dm={dm}/>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {c.open>0&&<Tag color={C.amber}>{c.open} open items</Tag>}
              {c.alert&&<Tag color={C.green}>{c.alert}</Tag>}
              <Tag color={T.t3}>Last: {c.last}</Tag>
            </div>
          </div>
        ))}
        <SL dm={dm}>Others</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {contacts.filter(c=>!c.vip).map((c,i,arr)=>(
            <div key={c.name}>
              <div style={{ padding:'11px 14px', display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:30, height:30, borderRadius:15, background:c.col, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ fontSize:11, fontWeight:700, color:'white' }}>{c.ini}</span></div>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.t1 }}>{c.name}</div><div style={{ fontSize:11, color:T.t2, marginTop:1 }}>{c.role}</div></div>
                {c.open>0&&<Tag color={C.amber}>{c.open}</Tag>}
                <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                <JBubble dm={dm}/>
              </div>
              {i<arr.length-1&&<Hr dm={dm}/>}
            </div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add relationship via Jacq</span>
          </div>
        </div>
        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}

function RelDetail({ onBurger, dm }) {
  const T = tok(dm);
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Sarah Mitchell" back sub="Direct report · EQTR" burger onBurger={onBurger} dm={dm}/>
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ margin:'4px 16px 0', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, padding:'14px' }}>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <div style={{ width:44, height:44, borderRadius:22, background:'#5B4FCF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ fontSize:15, fontWeight:700, color:'white' }}>SM</span></div>
            <div><div style={{ fontSize:16, fontWeight:400, color:T.t1, fontFamily:'"Gilda Display",Georgia,serif' }}>Sarah Mitchell</div><div style={{ fontSize:12, color:T.t2, marginTop:2 }}>Design lead · reports to JJ · EQTR</div></div>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}><Tag color={C.gold}>VIP</Tag><Tag color={C.green}>🎂 Birthday 12 Mar</Tag><Tag color={C.amber}>3 open items</Tag></div>
        </div>
        {/* Relationship signals — inferred from observed behaviour, read-only */}
        <div style={{ margin:'6px 16px 0', background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, padding:'9px 0', display:'flex' }}>
          {[{k:'Response rate',v:'Fast (< 1hr)'},{k:'Meets',v:'Weekly'},{k:'Last contact',v:'Today'}].map((s,i,arr)=>(
            <div key={s.k} style={{ flex:1, textAlign:'center', borderRight:i<arr.length-1?`1px solid ${T.bord2}`:'none', padding:'0 8px' }}>
              <div style={{ fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace', marginBottom:3 }}>{s.k}</div>
              <div style={{ fontSize:12, fontWeight:600, color:T.t1, fontFamily:'"DM Sans",sans-serif' }}>{s.v}</div>
            </div>
          ))}
        </div>
        <SL dm={dm}>Jacq's context</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[['Role','Design lead. Manages 4 designers. Reports directly to JJ.'],['Introduced by','Marcus Webb · March 2023'],['Last contact','Email re: Q3 budget (today)'],['Working style','Prefers written briefs. Responds quickly.'],['Note','Stressed about headcount (last 1:1, Feb 28)']].map(([k,v],i,arr)=>(
            <div key={k}><div style={{ padding:'10px 14px', display:'flex', gap:10, alignItems:'center' }}><div style={{ width:96, fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace', flexShrink:0, paddingTop:1 }}>{k}</div><div style={{ flex:1, fontSize:12, color:T.t1, lineHeight:1.55 }}>{v}</div><JBubble dm={dm}/></div>{i<arr.length-1&&<Hr dm={dm}/>}</div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add context via Jacq</span>
          </div>
        </div>
        <SL dm={dm}>Communication preferences</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[['Channel','Email first, Teams for quick things'],['Tone','Collaborative, not directive'],['Sign-off','"Jacq, PA to JJ"'],['SLA','Same-day on work items'],['Avoid','Calling unannounced']].map(([k,v],i,arr)=>(
            <div key={k}><div style={{ padding:'10px 14px', display:'flex', gap:10, alignItems:'center' }}><div style={{ width:96, fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace', flexShrink:0, paddingTop:1 }}>{k}</div><div style={{ flex:1, fontSize:12, color:T.t1, lineHeight:1.55 }}>{v}</div><JBubble dm={dm}/></div>{i<arr.length-1&&<Hr dm={dm}/>}</div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add preference via Jacq</span>
          </div>
        </div>
        <SL dm={dm}>Open items</SL>
        <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden' }}>
          {[{text:'Q3 budget decision',status:'Waiting'},{text:'Team offsite — venue shortlist',status:'Jacq acting'},{text:'Headcount brief',status:'To do'}].map((item,i,arr)=>(
            <div key={i}><div style={{ padding:'9px 14px', display:'flex', gap:10, alignItems:'center' }}><span style={{ flex:1, fontSize:12, color:T.t1 }}>{item.text}</span><Tag color={item.status==='Jacq acting'?C.gold:item.status==='Waiting'?C.amber:T.t3}>{item.status}</Tag><JBubble dm={dm}/></div>{i<arr.length-1&&<Hr dm={dm}/>}</div>
          ))}
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.bord2}`, display:'flex', alignItems:'center', gap:8 }}>
            <JBubble dm={dm} add size={22}/>
            <span style={{ fontSize:12, color:T.t3 }}>Add open item via Jacq</span>
          </div>
        </div>
        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function Settings({ onNav, onBurger, dm }) {
  const T = tok(dm);
  const groups = [
    { label:'Integrations', rows:[{k:'Gmail',v:'Connected',c:C.green},{k:'Google Calendar',v:'Connected',c:C.green},{k:'Google Drive',v:'Not connected',c:T.t3,action:'Connect'},{k:'Telegram',v:'Connected',c:C.green}]},
    { label:'AI & Desktop', rows:[{k:'Cloud LLM',v:'Anthropic Claude',arrow:true},{k:'Local LLM',v:'Llama 3 8B (desktop)',arrow:true},{k:'Desktop app',v:'Running v0.3.1',c:C.green},{k:'Browser control',v:'Enabled',c:C.green},{k:'Own API key',v:'Not set',c:T.t3,action:'Add'}]},
    { label:'Communication style', rows:[{k:'Tone',v:'Direct, warm, no filler',arrow:true},{k:'Response length',v:'Concise',arrow:true},{k:'Sign-off (as PA)',v:'"Jacq, PA to JJ"',arrow:true},{k:'Sign-off (as JJ)',v:'"JJ"',arrow:true},{k:'Language',v:'British English',arrow:true}]},
    { label:'Quiet hours', rows:[{k:'Start',v:'08:00',arrow:true},{k:'End',v:'20:00',arrow:true},{k:'Weekends',v:'Off (emergencies only)',arrow:true}]},
    { label:'Performance & feedback', rows:[{k:'Weekly review',v:'Every Friday, 17:00',arrow:true},{k:'Learning review',v:'Every Sunday, 19:00',arrow:true},{k:'Pattern learning',v:'All categories',arrow:true},{k:'Feedback channel',v:'Via Telegram',c:T.t2},{k:'Version',v:'Alpha 0.4.1',c:T.t3,mono:true}]},
    { label:'Privacy & data', rows:[{k:'Local-only mode',v:'Off',toggle:true},{k:'Data export',v:'',action:'Export'},{k:'Audit log',v:'',arrow:true},{k:'Delete all data',v:'',action:'Delete',danger:true}]},
  ];
  return (
    <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
      <SB dm={dm}/>
      <TNav title="Settings" burger onBurger={onBurger} dm={dm}/>
      <div style={{ flex:1, overflowY:'auto' }}>
        {groups.map(grp=>(
          <div key={grp.label}>
            <SL dm={dm}>{grp.label}</SL>
            <div style={{ margin:'0 16px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, overflow:'hidden', marginBottom:4 }}>
              {grp.rows.map((row,i,arr)=>(
                <div key={row.k}>
                  <div style={{ padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:row.danger?C.red:T.t1 }}>{row.k}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {row.v&&<span style={{ fontSize:12, color:row.c||T.t2, fontFamily:row.mono?'"DM Mono",monospace':'inherit' }}>{row.v}</span>}
                      {row.action&&<span style={{ fontSize:12, color:row.danger?C.red:C.gold, fontWeight:600, cursor:'pointer' }}>{row.action}</span>}
                      {row.toggle&&<div style={{ width:40, height:24, borderRadius:12, background:T.surf2, border:`1px solid ${T.bord}`, position:'relative' }}><div style={{ width:18, height:18, borderRadius:9, background:T.t3, position:'absolute', top:3, left:3 }}/></div>}
                      {row.arrow&&<svg viewBox="0 0 24 24" width="14" height="14" fill={T.t3}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>}
                      {!row.danger&&<JBubble dm={dm}/>}
                    </div>
                  </div>
                  {i<arr.length-1&&<Hr dm={dm}/>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
      <BNav active="settings" onNav={onNav} dm={dm}/>
    </div>
  );
}

// ─── DESKTOP ──────────────────────────────────────────────────────────────────

function DesktopBar() {
  return (
    <div style={{ width:264, background:'rgba(18,16,8,0.97)', borderRadius:14, border:'1px solid rgba(255,255,255,0.09)', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.55)' }}>
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <JAvatar size={28}/>
        <div><JacqLogo size={16} color="rgba(237,232,223,0.9)"/><div style={{ fontSize:10, color:C.green, display:'flex', alignItems:'center', gap:4, marginTop:2 }}><div style={{ width:5, height:5, borderRadius:3, background:C.green }}/>Active</div></div>
        <div style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.22)', fontFamily:'"DM Mono",monospace' }}>v0.3.1</div>
      </div>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.08em', marginBottom:7 }}>LOCAL MODEL</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}><span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>Llama 3 8B (Q4)</span><span style={{ fontSize:10, color:C.green, fontFamily:'"DM Mono",monospace' }}>● Running</span></div>
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
          <div style={{ height:'100%', width:'68%', background:`linear-gradient(90deg, ${C.green}, ${C.gold})`, borderRadius:2 }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:10, color:C.green }}>Local 68%</span><span style={{ fontSize:10, color:C.gold }}>Cloud 32%</span></div>
      </div>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div><div style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>Browser control</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>Research & automation</div></div>
          <div style={{ width:36, height:20, borderRadius:10, background:`${C.green}55`, position:'relative' }}><div style={{ width:14, height:14, borderRadius:7, background:C.green, position:'absolute', top:3, right:3 }}/></div>
        </div>
      </div>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.08em', marginBottom:5 }}>CURRENT TASK</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.55 }}>Researching offsite venues in Perthshire…</div>
      </div>
      <div style={{ padding:'8px 14px 12px' }}>
        {['Open Jacq dashboard','Pause Jacq','Model settings','Quit'].map((item,i)=>(
          <div key={item} style={{ padding:'7px 8px', borderRadius:7, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:i===3?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.58)' }}>{item}</span>
            {i===0&&<svg viewBox="0 0 24 24" width="11" height="11" fill="rgba(255,255,255,0.2)"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopExp() {
  return (
    <div style={{ width:344, background:'rgba(14,12,6,0.98)', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.65)' }}>
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <JAvatar size={32}/>
        <div><JacqLogo size={17} color="rgba(237,232,223,0.9)"/><div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', marginTop:2 }}>v0.3.1 · macOS</div></div>
        <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>{['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{ width:10, height:10, borderRadius:5, background:c }}/>)}</div>
      </div>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.1em', marginBottom:10 }}>LOCAL LLM</div>
        {[{name:'Llama 3 8B (Q4)',size:'4.7 GB',status:'Running',active:true},{name:'Phi-3 Mini (Q4)',size:'2.3 GB',status:'Loaded',active:false},{name:'Mistral 7B (Q4)',size:'4.1 GB',status:'Idle',active:false}].map(m=>(
          <div key={m.name} style={{ padding:'8px 10px', borderRadius:9, background:m.active?C.goldl:'rgba(255,255,255,0.03)', border:`1px solid ${m.active?C.goldb:'transparent'}`, marginBottom:5, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:m.status==='Running'?C.green:m.status==='Loaded'?C.amber:'rgba(255,255,255,0.15)', flexShrink:0 }}/>
            <div style={{ flex:1 }}><div style={{ fontSize:12, color:m.active?C.gold:'rgba(255,255,255,0.45)', fontWeight:m.active?600:400 }}>{m.name}</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'"DM Mono",monospace', marginTop:1 }}>{m.size} · {m.status}</div></div>
            {m.active&&<span style={{ fontSize:10, color:C.gold, fontWeight:600 }}>Active</span>}
          </div>
        ))}
      </div>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.1em', marginBottom:10 }}>BROWSER AUTOMATION</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div><div style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>Browser control</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:2 }}>Research and page interaction</div></div>
          <div style={{ width:40, height:24, borderRadius:12, background:`${C.green}45`, position:'relative', flexShrink:0 }}><div style={{ width:18, height:18, borderRadius:9, background:C.green, position:'absolute', top:3, right:3 }}/></div>
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', lineHeight:1.55 }}>Active since 08:32 · Sessions: 4 · Pages: 23</div>
      </div>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.1em', marginBottom:10 }}>TOKEN USAGE TODAY</div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {[['Local','68%',C.green,'12,400 tk'],['Cloud','32%',C.gold,'5,800 tk']].map(([l,p,c,tk])=>(
            <div key={l} style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:c, fontWeight:600, marginBottom:3 }}>{l} · {p}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)', fontFamily:'"DM Mono",monospace' }}>{tk}</div>
            </div>
          ))}
        </div>
        <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:'68%', background:`linear-gradient(90deg, ${C.green}, ${C.gold})`, borderRadius:2 }}/>
        </div>
      </div>
      <div style={{ padding:'12px 16px 14px' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'"DM Mono",monospace', letterSpacing:'0.1em', marginBottom:10 }}>SYSTEM</div>
        {[['RAM','3.2 GB / 16 GB'],['Storage','8.4 GB used'],['CPU','M2 · 12% avg today']].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>{k}</span><span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontFamily:'"DM Mono",monospace' }}>{v}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── OVERLAYS ─────────────────────────────────────────────────────────────────

function BurgerOverlay({ onClose, dm, onToggleDm, onNav }) {
  const T = tok(dm);
  const navItems = [
    { label:'Understanding',   sub:'Jacq\'s picture of you',    id:'memory',   d:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
    { label:'Tasks',         sub:'Jacq\'s work surface',          id:'tasks',    d:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
    { label:'Activity',      sub:'Log of everything Jacq has done',id:'activity', d:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
    { label:'Relationships', sub:'People Jacq knows about',       id:'rels',     d:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { label:'Settings',      sub:'Integrations, LLM, preferences', id:'settings', d:'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z' },
  ];
  return (
    <div style={{ position:'absolute', inset:0, background:T.bg, zIndex:60, display:'flex', flexDirection:'column', borderRadius:44, overflow:'hidden' }}>
      <SB dm={dm}/>
      {/* Header */}
      <div style={{ padding:'4px 18px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${T.bord}` }}>
        <JacqLogo size={28} dm={dm}/>
        <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, background:T.surf2, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill={T.t2}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 18px 0' }}>
        {navItems.map((item)=>(
          <button key={item.id} onClick={()=>{ onNav(item.id); onClose(); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'13px 0', background:'none', border:'none', cursor:'pointer', borderBottom:`1px solid ${T.bord2}`, fontFamily:'inherit', textAlign:'left' }}>
            <div style={{ width:38, height:38, borderRadius:11, background:T.surf2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill={T.t2}><path d={item.d}/></svg>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:400, color:T.t1, fontFamily:'"Gilda Display",Georgia,serif' }}>{item.label}</div>
              <div style={{ fontSize:12, color:T.t2, marginTop:2 }}>{item.sub}</div>
            </div>
          </button>
        ))}

        {/* Dark/light toggle */}
        <div style={{ marginTop:18, padding:'13px 14px', background:T.surf, borderRadius:14, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:400, color:T.t1, fontFamily:'"Gilda Display",Georgia,serif' }}>{dm?'Dark mode':'Light mode'}</div>
            <div style={{ fontSize:11, color:T.t2, marginTop:2 }}>Currently {dm?'dark':'light'}</div>
          </div>
          <div onClick={onToggleDm} style={{ width:44, height:26, borderRadius:13, background:dm?C.goldl:T.surf2, border:`1px solid ${dm?C.goldb:T.bord}`, position:'relative', cursor:'pointer', flexShrink:0 }}>
            <div style={{ width:20, height:20, borderRadius:10, background:dm?C.gold:T.t3, position:'absolute', top:3, left:dm?21:3, transition:'left 0.18s' }}/>
          </div>
        </div>

        {/* Message Jacq */}
        <button style={{ width:'100%', marginTop:10, height:50, borderRadius:14, background:T.t1, border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', fontFamily:'inherit' }}>
          <JAvatar size={22}/>
          <span style={{ fontSize:14, fontWeight:400, color:'white', fontFamily:'"Gilda Display",Georgia,serif' }}>Message Jacq</span>
        </button>
        <div style={{ marginTop:20, textAlign:'center', fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace', letterSpacing:'0.06em', paddingBottom:24 }}>JACQ ALPHA 0.4.1</div>
      </div>
    </div>
  );
}

function ChatPanel({ dm }) {
  const T = tok(dm);
  return (
    <div style={{ position:'absolute', inset:0, zIndex:40, display:'flex', flexDirection:'column', justifyContent:'flex-end', borderRadius:44, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:dm?'rgba(0,0,0,0.6)':'rgba(24,20,12,0.3)', borderRadius:44 }}/>
      <div style={{ position:'relative', background:T.bg, borderRadius:'22px 22px 0 0', border:`1px solid ${T.bord}`, borderBottom:'none', boxShadow:`0 -6px 32px ${dm?'rgba(0,0,0,0.45)':'rgba(0,0,0,0.09)'}`, display:'flex', flexDirection:'column', height:'72%' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px', flexShrink:0 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:T.bord }}/>
        </div>
        <div style={{ padding:'4px 16px 12px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${T.bord}`, flexShrink:0 }}>
          <JAvatar size={28}/>
          <div style={{ flex:1 }}>
            <JacqLogo size={16} dm={dm}/>
            <div style={{ fontSize:11, color:T.t3, marginTop:2 }}>
              <span style={{ color:C.gold, fontFamily:'"DM Mono",monospace', fontSize:10 }}>Context: </span>
              Memory · Communication preferences
            </div>
          </div>
          <div style={{ width:28, height:28, borderRadius:8, background:T.surf2, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill={T.t2}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', paddingTop:14 }}>
          <JMsg dm={dm}>I can see you're looking at communication preferences. What would you like to change?</JMsg>
          <UMsg dm={dm}>I want two different sign-offs — one for when you're acting as my PA, and one for when you're drafting as me directly.</UMsg>
          <JMsg dm={dm}>That makes sense. So: "Jacq, PA to JJ" when I'm acting on your behalf, and just "JJ" when I'm drafting as you?</JMsg>
          <UMsg dm={dm}>Exactly.</UMsg>
          <JMsg dm={dm} time="Now">
            Done.
            <Saved dm={dm}>Sign-off (as PA): "Jacq, PA to JJ"{'\n'}Sign-off (as JJ): "JJ"</Saved>
          </JMsg>
          <div style={{ height:12 }}/>
        </div>
        <div style={{ padding:'10px 14px 16px', borderTop:`1px solid ${T.bord}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ flex:1, height:40, background:T.surf2, borderRadius:20, border:`1px solid ${T.bord}`, display:'flex', alignItems:'center', padding:'0 14px' }}>
            <span style={{ fontSize:13, color:T.t3 }}>Reply to Jacq…</span>
          </div>
          <div style={{ width:36, height:36, borderRadius:18, background:C.goldl, border:`1px solid ${C.goldb}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill={C.gold}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen map ────────────────────────────────────────────────────────────────
const SM = {
  signin: SignIn, cutscene: Cutscene, introc: IntroConv, connectg: ConnectGoogle,
  memory: Memory, tasks: Tasks, taskdetail: TaskDetail, activity: Activity,
  rels: Rels, reldetail: RelDetail, settings: Settings,
  desktop: DesktopBar, desktopexp: DesktopExp,
  burgernav: ({ dm, onToggleDm, onNav }) => {
    const T = tok(dm);
    return (
      <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative' }}>
        <SB dm={dm}/>
        <BurgerOverlay onClose={()=>{}} dm={dm} onToggleDm={onToggleDm} onNav={onNav||(() => {})}/>
      </div>
    );
  },
  chatpanel: ({ dm }) => {
    const T = tok(dm);
    return (
      <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
        <SB dm={dm}/>
        <TNav title="Understanding" sub="Jacq's picture of you" dm={dm}/>
        <div style={{ flex:1, padding:'0 16px', opacity:0.25, pointerEvents:'none' }}>
          {['Communication','Calendar & time'].map(s=>(
            <div key={s} style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, color:T.t3, padding:'8px 0 4px', fontFamily:'"Gilda Display",Georgia,serif', fontWeight:400 }}>{s}</div>
              <div style={{ background:T.surf, borderRadius:12, border:`1px solid ${T.bord}`, padding:'10px 14px', fontSize:12, color:T.t2 }}>…</div>
            </div>
          ))}
        </div>
        <ChatPanel dm={dm}/>
      </div>
    );
  },
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('signin');
  const [dm, setDm] = useState(false);
  const [showBurger, setShowBurger] = useState(false);

  const isDesktop = active === 'desktop' || active === 'desktopexp';
  const meta = SCREENS.find(s => s.id === active);
  const idx = SCREENS.findIndex(s => s.id === active);
  const cats = [...new Set(SCREENS.map(s => s.cat))];
  const Comp = SM[active];
  const T = tok(dm);

  const handleNav = (id) => { setActive(id); setShowBurger(false); };

  return (
    <div style={{ display:'flex', height:'100vh', background:dm?'#1A1810':'#E8E3DB', fontFamily:'"DM Sans",-apple-system,sans-serif', color:T.t1, overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&family=Gilda+Display&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(128,120,100,0.18);border-radius:2px}
        button:focus{outline:none}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width:190, background:dm?DK.navBg:LT.navBg, borderRight:`1px solid ${T.bord}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'22px 16px 14px', borderBottom:`1px solid ${T.bord}` }}>
          <JacqLogo size={24} dm={dm}/>
          <div style={{ fontSize:9.5, color:T.t3, marginTop:5, fontFamily:'"DM Mono",monospace', letterSpacing:'0.08em' }}>WIREFRAMES · V6</div>
        </div>
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0 16px' }}>
          {cats.map(cat=>(
            <div key={cat}>
              <div style={{ padding:'12px 16px 4px', fontSize:9.5, letterSpacing:'0.1em', color:T.t3, textTransform:'uppercase', fontFamily:'"DM Mono",monospace' }}>{cat}</div>
              {SCREENS.filter(s=>s.cat===cat).map(s=>(
                <button key={s.id} onClick={()=>setActive(s.id)} style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 16px', background:active===s.id?C.goldl:'transparent', border:'none', borderLeft:`2px solid ${active===s.id?C.gold:'transparent'}`, color:active===s.id?C.gold:T.t2, fontSize:12.5, cursor:'pointer', fontFamily:'inherit', fontWeight:active===s.id?600:400 }}>
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {/* Sidebar DM toggle */}
        <div style={{ padding:'10px 16px', borderTop:`1px solid ${T.bord}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace' }}>{dm?'Dark':'Light'}</span>
          <div onClick={()=>setDm(!dm)} style={{ width:36, height:20, borderRadius:10, background:dm?C.goldl:T.surf3, border:`1px solid ${dm?C.goldb:T.bord}`, position:'relative', cursor:'pointer' }}>
            <div style={{ width:14, height:14, borderRadius:7, background:dm?C.gold:T.t3, position:'absolute', top:3, left:dm?19:3, transition:'left 0.18s' }}/>
          </div>
        </div>
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ fontSize:10, color:T.t3, fontFamily:'"DM Mono",monospace' }}>15 screens · full E2E</div>
        </div>
      </aside>

      {/* Canvas */}
      <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:48, padding:'32px', overflow:'hidden' }}>
        {isDesktop ? (
          <div style={{ flexShrink:0, position:'relative' }}>
            <div style={{ position:'absolute', top:-34, left:0, right:0, height:26, background:'rgba(14,12,6,0.95)', borderRadius:'8px 8px 0 0', display:'flex', alignItems:'center', padding:'0 12px', gap:5 }}>
              {['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{ width:8, height:8, borderRadius:4, background:c }}/>)}
              <div style={{ flex:1 }}/>
              <JAvatar size={20}/>
            </div>
            <Comp dm={dm}/>
          </div>
        ) : (
          <Shell dm={dm}>
            {showBurger && (
              <BurgerOverlay onClose={()=>setShowBurger(false)} dm={dm} onToggleDm={()=>setDm(!dm)} onNav={handleNav}/>
            )}
            <Comp
              dm={dm}
              onNav={handleNav}
              onBurger={()=>setShowBurger(true)}
              onToggleDm={()=>setDm(!dm)}
            />
          </Shell>
        )}

        {/* Annotation */}
        <div style={{ width:248, flexShrink:0 }}>
          <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ padding:'2px 8px', borderRadius:99, background:C.bluel, color:C.blue, fontSize:10.5, fontWeight:600 }}>{meta?.cat}</span>
            <span style={{ fontSize:11, color:T.t3, fontFamily:'"DM Mono",monospace' }}>{String(idx+1).padStart(2,'0')}/{SCREENS.length}</span>
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:T.t1, letterSpacing:'-0.3px', marginBottom:8, lineHeight:1.25, fontFamily:'"Instrument Serif",Georgia,serif' }}>{meta?.label}</div>
          <div style={{ fontSize:13, color:T.t2, lineHeight:1.75, marginBottom:22 }}>{meta?.desc}</div>
          <div style={{ display:'flex', gap:8, marginBottom:22 }}>
            {[[-1,'← Prev'],[1,'Next →']].map(([dir,label])=>{
              const target = SCREENS[idx+dir];
              return <button key={dir} onClick={()=>target&&setActive(target.id)} disabled={!target} style={{ flex:1, padding:'9px', borderRadius:10, background:target?T.surf:'transparent', border:`1px solid ${target?T.bord:'transparent'}`, color:target?T.t2:T.t3, fontSize:12, cursor:target?'pointer':'default', fontFamily:'inherit', fontWeight:500 }}>{label}</button>;
            })}
          </div>
          <div style={{ borderTop:`1px solid ${T.bord}`, paddingTop:16 }}>
            <div style={{ fontSize:10, color:T.t3, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'"DM Mono",monospace', marginBottom:10 }}>All screens</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {SCREENS.map((s,i)=>(
                <button key={s.id} onClick={()=>setActive(s.id)} title={s.label} style={{ width:30, height:30, borderRadius:8, background:active===s.id?C.goldl:T.surf, border:`1px solid ${active===s.id?C.goldb:T.bord}`, color:active===s.id?C.gold:T.t3, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:'"DM Mono",monospace' }}>
                  {String(i+1).padStart(2,'0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
