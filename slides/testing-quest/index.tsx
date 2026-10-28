import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import {
  type CSSProperties,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import cubicFont from './assets/Cubic_11.woff2';
import pressFont from './assets/PressStart2P.ttf';

// ─── Design tokens ──────────────────────────────────────────────────────────

export const design: DesignSystem = {
  palette: { bg: '#f3ead3', text: '#2a1f3d', accent: '#e4572e' },
  fonts: {
    display: '"PressStart2P", "Cubic11", monospace',
    body: '"Cubic11", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif',
  },
  typeScale: { hero: 120, body: 34 },
  radius: 0,
};

const C = {
  ink: '#2a1f3d',
  paper: '#fffaf0',
  sand: '#e6d8b5',
  muted: '#6e6480',
  red: '#e4572e',
  redDark: '#a8361a',
  yellow: '#f2b134',
  green: '#3a9d5d',
  greenDark: '#24693c',
  blue: '#3d6fd8',
  purple: '#7b5cd6',
  skin: '#f6c99a',
  hair: '#5a3a22',
  navy: '#3b3f8f',
  codeBg: '#231b33',
  codeText: '#efe6d2',
};

const PRESS = 'var(--osd-font-display)';
const PIXEL = 'var(--osd-font-body)';
const MONO = '"Cascadia Mono", Consolas, "Cubic11", monospace';

// ─── Fonts + keyframes (module-level, slide-keyed) ──────────────────────────

const css = `
@font-face { font-family: "Cubic11"; src: url("${cubicFont}") format("woff2"); font-display: swap; }
@font-face { font-family: "PressStart2P"; src: url("${pressFont}") format("truetype"); font-display: swap; }
.tq-bob { animation: tq-bob 1s steps(1, end) infinite; }
.tq-blink { animation: tq-blink 1.2s steps(1, end) infinite; }
.tq-twinkle { animation: tq-blink 2.4s steps(1, end) infinite; }
.tq-shake { animation: tq-shake 0.5s steps(1, end) infinite; }
@keyframes tq-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes tq-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
@keyframes tq-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.tq-in { animation: tq-pop 0.3s steps(3, end) both; }
.tq-hit { animation: tq-jolt 0.3s steps(1, end) both; }
.tq-hop { animation: tq-hop 0.3s steps(2, end) both; }
.tq-alarm { animation: tq-alarm 0.8s steps(1, end) infinite; }
.tq-flag { animation: tq-flag 0.8s steps(1, end) infinite; }
.tq-burst { animation: tq-burst 0.9s steps(5, end) both; }
[data-osd-step="revealed"] > .tq-pop { animation: tq-pop 0.3s steps(3, end) both; }
[data-osd-step="revealed"] > .tq-drop { animation: tq-drop 0.32s steps(4, end) both; }
[data-osd-step="revealed"] > .tq-jolt { animation: tq-jolt 0.4s steps(1, end) both; }
[data-osd-step="revealed"] .tq-drain rect[fill="#e6d8b5"] { animation: tq-drain 0.1s steps(1, end) both; animation-delay: var(--tq-d, 0s); }
@keyframes tq-pop { 0% { transform: scale(0.85); opacity: 0; } 50% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes tq-drop { 0% { transform: translateY(-40px); } 75% { transform: translateY(6px); } 100% { transform: translateY(0); } }
@keyframes tq-jolt { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
@keyframes tq-hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes tq-alarm { 0%, 100% { background: #f2b134; } 50% { background: #e4572e; } }
@keyframes tq-flag { 0%, 100% { background: rgba(228, 87, 46, 0.3); box-shadow: inset 0 0 0 3px #e4572e; } 50% { background: transparent; box-shadow: none; } }
@keyframes tq-burst { 0% { transform: scale(0.2); opacity: 1; } 70% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
@keyframes tq-drain { from { fill: #e4572e; } to { fill: #e6d8b5; } }
[data-still] .tq-a, [data-still] .tq-drain rect { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .tq-a, .tq-drain rect { animation: none !important; } }
.tq-input::placeholder { color: #a69cb3; }
.tq-input:focus { outline: none; }
`;
const STYLE_ID = 'osd-styles-testing-quest';
if (typeof document !== 'undefined') {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

// ─── Transitions ────────────────────────────────────────────────────────────

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const settle: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// ─── Pixel primitives ───────────────────────────────────────────────────────

const ring = (c: string, w = 6) =>
  `0 -${w}px 0 0 ${c}, 0 ${w}px 0 0 ${c}, -${w}px 0 0 0 ${c}, ${w}px 0 0 0 ${c}`;
const pxShadow = (c: string = C.ink, w = 6) =>
  `${ring(c, w)}, ${w + 8}px ${w + 8}px 0 0 rgba(42, 31, 61, 0.18)`;

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  backgroundImage: 'radial-gradient(rgba(42, 31, 61, 0.09) 2px, transparent 2px)',
  backgroundSize: '40px 40px',
  color: 'var(--osd-text)',
  fontFamily: PIXEL,
  WebkitFontSmoothing: 'none',
};

const Root = ({ children }: { children: ReactNode }) => {
  const active = useIsActivePage();
  return (
    <div style={fill} data-still={active ? undefined : ''}>
      {children}
    </div>
  );
};

const PixelBox = ({
  children,
  bg = C.paper,
  border = C.ink,
  w = 6,
  shadow = true,
  className,
  style,
}: {
  children?: ReactNode;
  bg?: string;
  border?: string;
  w?: number;
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    className={className}
    style={{ background: bg, color: '#4f4e50', boxShadow: shadow ? pxShadow(border, w) : ring(border, w), ...style }}
  >
    {children}
  </div>
);

const Chip = ({
  children,
  bg = C.ink,
  color = C.paper,
  size = 24,
  style,
}: {
  children: ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) => (
  <span
    style={{
      display: 'inline-block',
      padding: '8px 16px',
      background: bg,
      color,
      fontSize: size,
      lineHeight: 1.2,
      boxShadow: ring(C.ink, 4),
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

type Pal = Record<string, string>;
const PAL: Pal = {
  k: C.ink,
  s: C.skin,
  h: C.hair,
  r: C.red,
  e: C.redDark,
  b: C.navy,
  w: '#ffffff',
  y: C.yellow,
  g: C.green,
  B: C.blue,
};

const Sprite = ({
  art,
  pal = PAL,
  px = 8,
  className,
  style,
}: {
  art: string[];
  pal?: Pal;
  px?: number;
  className?: string;
  style?: CSSProperties;
}) => {
  const rects: ReactNode[] = [];
  for (let y = 0; y < art.length; y++) {
    for (let x = 0; x < art[y].length; x++) {
      const c = pal[art[y][x]];
      if (c) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />);
    }
  }
  return (
    <svg
      width={art[0].length * px}
      height={art.length * px}
      viewBox={`0 0 ${art[0].length} ${art.length}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: 'block', ...style }}
    >
      {rects}
    </svg>
  );
};

const HERO = [
  '..hhhhhh..',
  '.hhhhhhhh.',
  '.hssssssh.',
  '.skssssks.',
  '.ssssssss.',
  '..ssssss..',
  '...rrrr...',
  '.rrrrrrrr.',
  'srrrwwrrrs',
  's.rrrrrr.s',
  '..bbbbbb..',
  '..bb..bb..',
  '.kkk..kkk.',
];

const BUG = [
  '..k......k..',
  '...k....k...',
  '...kkkkkk...',
  '..krrrrrrk..',
  '.krwkrrwkrk.',
  '.krrrrrrrrk.',
  'kkrerrrrerkk',
  '.krreeeerrk.',
  'k.krrrrrrk.k',
  '...k.kk.k...',
];

const SHIELD = [
  'kkkkkkkkk',
  'kBBBBBBBk',
  'kBBBBBwBk',
  'kBBBBwBBk',
  'kBwBwBBBk',
  'kBBwBBBBk',
  '.kBBBBBk.',
  '..kBBBk..',
  '...kkk...',
];

const HEART = ['.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'];

const STAR = ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'];

const CHECK = ['......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....'];

const rolePal = (shirt: string): Pal => ({ ...PAL, r: shirt });
const LOST: Pal = { ...PAL, r: C.sand };

// ─── Page chrome ────────────────────────────────────────────────────────────

type Chapter = { no: string; name: string; bg: string; fg: string };
const CH1: Chapter = { no: '01', name: '困境', bg: C.red, fg: C.paper };
const CH2: Chapter = { no: '02', name: '難題', bg: C.yellow, fg: C.ink };
const CH3: Chapter = { no: '03', name: '轉捩點', bg: C.green, fg: C.paper };
const CH4: Chapter = { no: '04', name: '實戰', bg: C.blue, fg: C.paper };
const CH5: Chapter = { no: '05', name: 'AGENT 時代', bg: C.purple, fg: C.paper };
const CH6: Chapter = { no: '06', name: '成果', bg: C.ink, fg: C.yellow };

const ChapterTag = ({ ch }: { ch: Chapter }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <Chip bg={ch.bg} color={ch.fg}>
      <span style={{ fontFamily: PRESS, fontSize: 18, marginRight: 14 }}>CH.{ch.no}</span>
      {ch.name}
    </Chip>
  </div>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: PRESS,
        fontSize: 18,
        color: C.muted,
      }}
    >
      <span>TESTING QUEST</span>
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Shell = ({
  ch,
  title,
  sub,
  children,
}: {
  ch: Chapter;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
}) => (
  <Root>
    <div
      style={{
        position: 'absolute',
        top: 72,
        left: 120,
        right: 120,
        bottom: 110,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChapterTag ch={ch} />
      <h2 style={{ margin: '28px 0 0', fontSize: 64, lineHeight: 1.25, fontWeight: 400 }}>
        {title}
      </h2>
      {sub && (
        <p style={{ margin: '12px 0 0', fontSize: 30, lineHeight: 1.4, color: C.muted }}>{sub}</p>
      )}
      <div style={{ marginTop: 44, flex: 1, position: 'relative', minHeight: 0 }}>{children}</div>
    </div>
    <Footer />
  </Root>
);

const Square = ({ color, size = 14 }: { color: string; size?: number }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      background: color,
      flex: 'none',
    }}
  />
);

const Bullet = ({ children, color = C.ink, size = 32 }: { children: ReactNode; color?: string; size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, fontSize: size, lineHeight: 1.45 }}>
    <span style={{ transform: 'translateY(-4px)' }}>
      <Square color={color} />
    </span>
    <span>{children}</span>
  </div>
);

// ─── Motion + interaction helpers ───────────────────────────────────────────

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Counts 0 → count while the page is active; inactive pages (thumbnails, overview) show the end state.
const useSequence = (count: number, interval: number, delay = 0) => {
  const active = useIsActivePage();
  const [n, setN] = useState(count);
  useLayoutEffect(() => {
    if (!active || prefersReducedMotion()) {
      setN(count);
      return;
    }
    let v = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    setN(0);
    const start = setTimeout(() => {
      timer = setInterval(() => {
        v += 1;
        setN(v);
        if (v >= count && timer) clearInterval(timer);
      }, interval);
    }, delay);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [active, count, interval, delay]);
  return n;
};

// Cycles 0 → count-1 forever while the page is active; -1 otherwise.
const useLoopTick = (count: number, interval: number) => {
  const active = useIsActivePage();
  const [i, setI] = useState(-1);
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setI(-1);
      return;
    }
    setI(0);
    const t = setInterval(() => setI((v) => (v + 1) % count), interval);
    return () => clearInterval(t);
  }, [active, count, interval]);
  return i;
};

// Local state for in-slide toys; resets whenever the page is left.
const usePageState = <T,>(initial: T) => {
  const active = useIsActivePage();
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (!active) setV(initial);
  }, [active, initial]);
  return [v, setV] as const;
};

// Keep clicks on in-slide controls from reaching slide navigation.
const halt = (e: { stopPropagation: () => void }) => e.stopPropagation();

// Entrance wrapper for a <Step> child: animates when the step is revealed.
const Pop = ({
  children,
  kind = 'pop',
  style,
}: {
  children: ReactNode;
  kind?: 'pop' | 'jolt' | 'drop';
  style?: CSSProperties;
}) => (
  <div className={`tq-a tq-${kind}`} style={style}>
    {children}
  </div>
);

type Seg = { t: string; color?: string };

// Typewriter text; untyped characters stay in layout (hidden) so nothing shifts.
const Typed = ({ segs, interval = 60, delay = 0 }: { segs: Seg[]; interval?: number; delay?: number }) => {
  const total = segs.reduce((sum, s) => sum + s.t.length, 0);
  let left = useSequence(total, interval, delay);
  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {segs.map((s, i) => {
        const shown = Math.max(0, Math.min(s.t.length, left));
        left -= s.t.length;
        return (
          <span key={i} style={{ color: s.color }}>
            {s.t.slice(0, shown)}
            <span style={{ visibility: 'hidden' }}>{s.t.slice(shown)}</span>
          </span>
        );
      })}
    </span>
  );
};

// ─── Code block with a tiny highlighter ─────────────────────────────────────

const KW = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'await', 'async', 'return', 'new',
  'public', 'class', 'void', 'true', 'false', 'null', 'if', 'get', 'set', 'bool',
]);
const FN = new Set([
  'test', 'expect', 'describe', 'mount', 'Assert', 'vi', 'setupServer', 'http', 'HttpResponse',
  'flushPromises', 'loginAs',
]);
const TOKEN_RE =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+\b)|(\[(?:Fact|Theory|InlineData|Required)\b)|(\/\\\/403\$\/)|(\b[A-Za-z_]\w*\b)/g;

const TOK = {
  comment: '#9c90b3',
  string: '#f2c46d',
  number: '#7fd1a0',
  attr: '#c9a2ff',
  keyword: '#ff8a6b',
  fn: '#7fb4ff',
};

const highlight = (line: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(line.slice(last, idx));
    let color: string | undefined;
    if (m[1]) color = TOK.comment;
    else if (m[2] || m[5]) color = TOK.string;
    else if (m[3]) color = TOK.number;
    else if (m[4]) color = TOK.attr;
    else if (m[6] && KW.has(m[6])) color = TOK.keyword;
    else if (m[6] && FN.has(m[6])) color = TOK.fn;
    out.push(
      color ? (
        <span key={i++} style={{ color }}>
          {m[0]}
        </span>
      ) : (
        m[0]
      ),
    );
    last = idx + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
};

const CODE_LINE_MS = 70;

const CodeBlock = ({
  code,
  label,
  size = 24,
  typing,
  delay = 0,
  flag,
  style,
}: {
  code: string;
  label?: string;
  size?: number;
  typing?: boolean;
  delay?: number;
  flag?: number;
  style?: CSSProperties;
}) => {
  const lines = code.split('\n');
  const typed = useSequence(lines.length, CODE_LINE_MS, delay);
  const shown = typing ? typed : lines.length;
  return (
    <PixelBox bg={C.codeBg} style={{ padding: '20px 28px', ...style }}>
      {label && (
        <div style={{ marginBottom: 14 }}>
          <Chip bg={C.yellow} color={C.ink} size={22} style={{ boxShadow: 'none' }}>
            {label}
          </Chip>
        </div>
      )}
      <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.45, color: C.codeText }}>
        {lines.map((line, n) => (
          <div
            key={n}
            className={n === flag ? 'tq-a tq-flag' : undefined}
            style={{ whiteSpace: 'pre', visibility: n < shown ? 'visible' : 'hidden' }}
          >
            {line ? highlight(line) : ' '}
          </div>
        ))}
      </div>
    </PixelBox>
  );
};

const BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 14,
  alignSelf: 'flex-start',
  padding: '12px 18px',
  boxShadow: ring(C.ink, 4),
  fontFamily: PRESS,
  fontSize: 20,
};

// "RUNNING..." until the code has typed out, then a green pass badge.
const PassBadge = ({ count, delay }: { count: number; delay: number }) => {
  const done = useSequence(1, delay) === 1;
  return done ? (
    <div className="tq-a tq-in" style={{ ...BADGE, background: C.green, color: C.paper }}>
      <Sprite art={CHECK} px={4} pal={{ k: C.paper }} />
      {count} PASSED
    </div>
  ) : (
    <div className="tq-a tq-blink" style={{ ...BADGE, background: C.paper, color: C.muted }}>
      RUNNING...
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CH.01 困境
// ═══════════════════════════════════════════════════════════════════════════

const CoverStar = ({ left, top, delay }: { left: number; top: number; delay: number }) => (
  <Sprite
    art={STAR}
    px={7}
    className="tq-a tq-twinkle"
    style={{ position: 'absolute', left, top, animationDelay: `${delay}s` }}
  />
);

const Ground = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 84,
      background: C.green,
      borderTop: `12px solid ${C.greenDark}`,
      backgroundImage:
        'linear-gradient(90deg, rgba(0,0,0,0.10) 50%, transparent 50%), linear-gradient(rgba(0,0,0,0.10) 50%, transparent 50%)',
      backgroundSize: '48px 24px, 48px 48px',
    }}
  />
);

const BUG_HP = 3;

// Click the bug three times to defeat it; one more click respawns it.
const BugBoss = () => {
  const [hits, setHits] = usePageState(0);
  const down = hits >= BUG_HP;
  return (
    <button
      type="button"
      onPointerDown={halt}
      onClick={(e) => {
        halt(e);
        setHits((h) => (h >= BUG_HP ? 0 : h + 1));
      }}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        width: BUG[0].length * 18,
      }}
    >
      <div style={{ display: 'flex', gap: 8, visibility: down ? 'hidden' : 'visible' }}>
        <Sprite art={HEART} px={5} pal={hits < 3 ? PAL : LOST} />
        <Sprite art={HEART} px={5} pal={hits < 2 ? PAL : LOST} />
        <Sprite art={HEART} px={5} pal={hits < 1 ? PAL : LOST} />
      </div>
      {down ? (
        <div
          className="tq-a tq-in"
          style={{
            height: BUG.length * 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 20,
          }}
        >
          <span style={{ fontFamily: PRESS, fontSize: 22, color: C.redDark }}>+100 EXP</span>
          <Sprite art={STAR} px={14} />
        </div>
      ) : (
        <div key={hits} className={hits > 0 ? 'tq-a tq-hit' : undefined}>
          <Sprite art={BUG} px={18} className="tq-a tq-bob" style={{ animationDelay: '0.5s' }} />
        </div>
      )}
    </button>
  );
};

const Cover: Page = () => (
  <Root>
    <CoverStar left={1240} top={150} delay={0} />
    <CoverStar left={1560} top={230} delay={0.6} />
    <CoverStar left={1720} top={110} delay={1.2} />
    <CoverStar left={1100} top={330} delay={1.8} />
    <div style={{ position: 'absolute', left: 160, top: 190 }}>
      <div style={{ fontFamily: PRESS, fontSize: 24, color: C.red, letterSpacing: 2 }}>
        INTERNAL TRAINING
      </div>
      <h1
        style={{
          fontFamily: PRESS,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 1.2,
          fontWeight: 400,
          margin: '40px 0 0',
          textShadow: `8px 8px 0 ${C.yellow}`,
        }}
      >
        <Typed segs={[{ t: 'TESTING\nQUEST' }]} interval={110} delay={300} />
      </h1>
      <p style={{ fontSize: 64, margin: '56px 0 0', lineHeight: 1.2 }}>軟體測試觀念</p>
      <p style={{ fontSize: 36, margin: '20px 0 0', color: C.muted }}>從一套選課系統說起</p>
    </div>
    <div style={{ position: 'absolute', left: 1230, bottom: 84 }}>
      <Sprite art={HERO} px={22} className="tq-a tq-bob" />
    </div>
    <div style={{ position: 'absolute', left: 1540, bottom: 84 }}>
      <BugBoss />
    </div>
    <div
      className="tq-a tq-blink"
      style={{
        position: 'absolute',
        left: 160,
        bottom: 140,
        fontFamily: PRESS,
        fontSize: 28,
        color: C.ink,
      }}
    >
      PRESS START
    </div>
    <Ground />
  </Root>
);
Cover.transition = settle;

const RouteNode = ({
  no,
  name,
  desc,
  color,
  fg = C.paper,
  lit = true,
  here = false,
  onPick,
}: {
  no: string;
  name: string;
  desc: string;
  color: string;
  fg?: string;
  lit?: boolean;
  here?: boolean;
  onPick?: () => void;
}) => (
  <div
    data-osd-interactive
    onPointerDown={halt}
    onClick={(e) => {
      halt(e);
      onPick?.();
    }}
    style={{ width: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
  >
    <PixelBox
      key={lit ? 'on' : 'off'}
      bg={lit ? color : C.paper}
      className={lit ? 'tq-a tq-in' : undefined}
      style={{
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: PRESS,
        fontSize: 36,
        color: lit ? fg : C.ink,
        opacity: lit ? 1 : 0.5,
      }}
    >
      {no}
    </PixelBox>
    <div
      style={{
        marginTop: 40,
        padding: '2px 10px',
        fontSize: 40,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        background: here ? C.yellow : 'transparent',
      }}
    >
      {name}
    </div>
    <div style={{ marginTop: 14, fontSize: 26, lineHeight: 1.4, color: C.muted, textAlign: 'center' }}>
      {desc}
    </div>
  </div>
);

const ROUTE_STRIDE = 290; // node width 230 + gap across the 1680px row

// The hero walks the route on entry; clicking a node sends the hero there.
const Route: Page = () => {
  const walk = useSequence(5, 600, 400);
  const [picked, setPicked] = usePageState<number | null>(null);
  const at = picked ?? walk;
  return (
    <Shell ch={CH1} title="今天的故事大綱">
      <div style={{ position: 'absolute', top: 0, left: 55 + ROUTE_STRIDE * at }}>
        <div key={at} className="tq-a tq-hop">
          <Sprite art={HERO} px={7} className="tq-a tq-bob" />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 115,
          right: 115,
          height: 12,
          backgroundImage: `linear-gradient(90deg, ${C.ink} 50%, transparent 50%)`,
          backgroundSize: '36px 12px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 126,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <RouteNode no="01" name="困境" desc="現在是怎麼測的" color={C.red} lit={walk >= 0} here={at === 0} onPick={() => setPicked(0)} />
        <RouteNode no="02" name="難題" desc="四個真實場景" color={C.yellow} fg={C.ink} lit={walk >= 1} here={at === 1} onPick={() => setPicked(1)} />
        <RouteNode no="03" name="轉捩點" desc="認識三種測試" color={C.green} lit={walk >= 2} here={at === 2} onPick={() => setPicked(2)} />
        <RouteNode no="04" name="實戰" desc="前後端範例" color={C.blue} lit={walk >= 3} here={at === 3} onPick={() => setPicked(3)} />
        <RouteNode no="05" name="AGENT 時代" desc="測試變成重中之重" color={C.purple} lit={walk >= 4} here={at === 4} onPick={() => setPicked(4)} />
        <RouteNode no="06" name="成果" desc="循環工作流" color={C.ink} fg={C.yellow} lit={walk >= 5} here={at === 5} onPick={() => setPicked(5)} />
      </div>
      <PixelBox
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '28px 40px',
          fontSize: 32,
          lineHeight: 1.4,
        }}
      >
        <span style={{ color: C.red }}>{''}</span>
        請大家一起想想，選課系統有哪些狀況可以先用測試擋掉。
      </PixelBox>
    </Shell>
  );
};

const FlowBox = ({ children, bg = C.paper, className }: { children: ReactNode; bg?: string; className?: string }) => (
  <PixelBox
    bg={bg}
    className={className}
    style={{
      width: 340,
      height: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: 40,
      lineHeight: 1.25,
    }}
  >
    {children}
  </PixelBox>
);

const Arrow = () => (
  <span style={{ fontFamily: PRESS, fontSize: 44, color: C.muted, margin: '0 24px' }}>&gt;</span>
);

const FLOW_ITEM: CSSProperties = { display: 'flex', alignItems: 'center' };

const Today: Page = () => (
  <Shell ch={CH1} title="我們現在是怎麼測的？">
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
      <Steps>
        <FlowBox>改完 code</FlowBox>
        <Step>
          <Pop style={FLOW_ITEM}>
            <Arrow />
            <FlowBox>自己點一點</FlowBox>
          </Pop>
        </Step>
        <Step>
          <Pop style={FLOW_ITEM}>
            <Arrow />
            <FlowBox>
              PM 測
              <br />
              Happy Path
            </FlowBox>
          </Pop>
        </Step>
        <Step>
          <Pop style={FLOW_ITEM}>
            <Arrow />
            <FlowBox bg={C.yellow} className="tq-a tq-alarm">
              直接上線
            </FlowBox>
          </Pop>
        </Step>
      </Steps>
    </div>
    <Steps>
      <Step>
        <PixelBox
          bg={C.ink}
          className="tq-a tq-pop"
          style={{
            marginTop: 90,
            padding: '48px 56px',
            color: C.paper,
            fontSize: 52,
            lineHeight: 1.4,
          }}
        >
          重複一樣的錯誤、改 A 壞 B，
          <br />
          是在拿<span style={{ color: C.yellow }}>使用者的信任</span>玩火。
        </PixelBox>
      </Step>
      <Step>
        <p style={{ margin: '44px 0 0', fontSize: 34, color: C.muted }}>
          使用者不是我們的測試員，他們只會記得「這系統又出包了」。
        </p>
      </Step>
    </Steps>
  </Shell>
);

const CompareCol = ({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: ReactNode;
}) => (
  <PixelBox style={{ flex: 1, padding: '32px 40px' }}>
    <Chip bg={color} size={28}>
      {label}
    </Chip>
    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
  </PixelBox>
);

const HappyPath: Page = () => (
  <Shell ch={CH1} title="自己人測自己的 code，只會走 happy path">
      <div style={{ display: 'flex', gap: 56 }}>
        <CompareCol label="我們自己測的時候" color={C.green}>
          <Bullet color={C.green}>知道正確的操作順序</Bullet>
          <Bullet color={C.green}>只輸入合理的資料</Bullet>
          <Bullet color={C.green}>按一次，耐心等結果</Bullet>
          <Bullet color={C.green}>拿管理員帳號一路測到底</Bullet>
        </CompareCol>
        <CompareCol label="使用者實際上會" color={C.red}>
          <Steps>
            <Step>
              <Pop kind="jolt">
                <Bullet color={C.red}>照自己的習慣跳著操作</Bullet>
              </Pop>
            </Step>
            <Step>
              <Pop kind="jolt">
                <Bullet color={C.red}>從 Excel 貼上全形數字和空白</Bullet>
              </Pop>
            </Step>
            <Step>
              <Pop kind="jolt">
                <Bullet color={C.red}>網路一慢就再按一次</Bullet>
              </Pop>
            </Step>
            <Step>
              <Pop kind="jolt">
                <Bullet color={C.red}>學生、老師、管理員各看到不同畫面</Bullet>
              </Pop>
            </Step>
          </Steps>
        </CompareCol>
      </div>
    <Steps>
      <Step>
        <PixelBox
          bg={C.yellow}
          className="tq-a tq-pop"
          style={{ marginTop: 56, padding: '28px 40px', fontSize: 34, lineHeight: 1.5 }}
        >
          我們最熟這套系統，所以最不會用錯它。只測最佳路徑，
          <br />
          只代表了：「照我們想的方式用，它會動。」
        </PixelBox>
      </Step>
    </Steps>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════════════════
// CH.02 難題
// ═══════════════════════════════════════════════════════════════════════════

type CellState = 'ok' | 'unknown' | 'bug';

// Clicking a "?" cell "tests" it: it turns green, or reveals the hidden bug.
const FlipCtx = createContext<() => void>(() => {});

const Cell = ({ state: truth }: { state: CellState }) => {
  const onFlip = useContext(FlipCtx);
  const [open, setOpen] = usePageState(false);
  const state: CellState = truth === 'ok' ? 'ok' : !open ? 'unknown' : truth === 'bug' ? 'bug' : 'ok';
  const bg = state === 'ok' ? C.green : state === 'bug' ? C.red : C.paper;
  const flip = () => {
    if (truth === 'ok' || open) return;
    setOpen(true);
    onFlip();
  };
  return (
    <div
      data-osd-interactive
      onPointerDown={halt}
      onClick={(e) => {
        halt(e);
        flip();
      }}
      className={state === 'bug' ? 'tq-a tq-shake' : open ? 'tq-a tq-in' : undefined}
      style={{
        cursor: state === 'unknown' ? 'pointer' : 'default',
        width: 88,
        height: 60,
        background: bg,
        boxShadow: ring(C.ink, 3),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: state === 'ok' ? PIXEL : PRESS,
        fontSize: state === 'ok' ? 22 : 22,
        color: state === 'unknown' ? '#b3a8c2' : C.paper,
      }}
    >
      {state === 'ok' ? '測過' : state === 'bug' ? '!' : '?'}
    </div>
  );
};

const RowHead = ({ children, color }: { children: ReactNode; color: string }) => (
  <div style={{ width: 170, fontSize: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
    <Square color={color} size={16} />
    {children}
  </div>
);

const ColHead = ({ children }: { children: ReactNode }) => (
  <div style={{ width: 196, textAlign: 'center', fontSize: 28 }}>{children}</div>
);

const SubHead = ({ children }: { children: ReactNode }) => (
  <div style={{ width: 88, textAlign: 'center', fontSize: 22, color: C.muted }}>{children}</div>
);

const ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 20 };
const CELLS: CSSProperties = { display: 'flex', gap: 20 };

const Coverage: Page = () => {
  const [flips, setFlips] = usePageState(0);
  return (
    <FlipCtx.Provider value={() => setFlips((n) => n + 1)}>
      <Shell ch={CH2} title="難題 1：組合多到測不完">
        <div style={{ display: 'flex', gap: 56 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={ROW}>
              <div style={{ width: 170 }} />
              <div style={{ display: 'flex', gap: 20 }}>
                <ColHead>選課</ColHead>
                <ColHead>退選</ColHead>
                <ColHead>看成績</ColHead>
                <ColHead>改成績</ColHead>
              </div>
            </div>
            <div style={ROW}>
              <div style={{ width: 170 }} />
              <div style={CELLS}>
                <SubHead>開放中</SubHead>
                <SubHead>已截止</SubHead>
                <SubHead>開放中</SubHead>
                <SubHead>已截止</SubHead>
                <SubHead>開放中</SubHead>
                <SubHead>已截止</SubHead>
                <SubHead>開放中</SubHead>
                <SubHead>已截止</SubHead>
              </div>
            </div>
            <div style={ROW}>
              <RowHead color={C.blue}>學生</RowHead>
              <div style={CELLS}>
                <Cell state="ok" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
              </div>
            </div>
            <div style={ROW}>
              <RowHead color={C.green}>本科老師</RowHead>
              <div style={CELLS}>
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="ok" />
                <Cell state="unknown" />
              </div>
            </div>
            <div style={ROW}>
              <RowHead color={C.yellow}>他科老師</RowHead>
              <div style={CELLS}>
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="bug" />
                <Cell state="unknown" />
              </div>
            </div>
            <div style={ROW}>
              <RowHead color={C.purple}>管理員</RowHead>
              <div style={CELLS}>
                <Cell state="ok" />
                <Cell state="unknown" />
                <Cell state="ok" />
                <Cell state="unknown" />
                <Cell state="ok" />
                <Cell state="unknown" />
                <Cell state="unknown" />
                <Cell state="unknown" />
              </div>
            </div>
            <p style={{ margin: '30px 0 0', fontSize: 32, lineHeight: 1.5 }}>
              4 種身分 × 4 個動作 × 2 種狀態 = <span style={{ color: C.red }}>32 種組合</span>
              {flips === 0 ? '，手動測過的只有 5 種。' : `，現在測過 ${5 + flips} 種。`}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 28, lineHeight: 1.5, color: C.muted }}>
              每種手測約 3 分鐘：目前花了 <span style={{ color: C.ink }}>{(5 + flips) * 3} 分鐘</span>，全測一輪要{' '}
              <span style={{ color: C.red }}>96 分鐘</span>，每次上線都得重來。
            </p>
          </div>
          <PixelBox style={{ flex: 1, padding: '32px 36px', alignSelf: 'flex-start' }}>
            <Chip bg={C.yellow} color={C.ink}>小明改了一版</Chip>
            <p style={{ margin: '24px 0 0', fontSize: 30, lineHeight: 1.6 }}>
              加了「老師可以改自己課程的成績」。用本科老師的帳號測，一切正常。
            </p>
            <Steps>
              <Step>
                <Pop kind="jolt">
                  <p style={{ margin: '20px 0 0', fontSize: 30, lineHeight: 1.6, color: C.red }}>
                    結果他科老師也改得動。
                  </p>
                </Pop>
              </Step>
              <Step>
                <p style={{ margin: '20px 0 0', fontSize: 26, lineHeight: 1.6, color: C.muted }}>自己先抓到沒事；沒想到要測，就變成上線後的修復成本。</p>
              </Step>
            </Steps>
          </PixelBox>
        </div>
      </Shell>
    </FlipCtx.Provider>
  );
};

const SeatCounter = () => {
  const n = 36 + useSequence(5, 260);
  const over = n > 40;
  return (
    <span className={over ? 'tq-a tq-shake' : undefined} style={{ display: 'inline-block', color: over ? C.red : C.paper }}>
      {n}
      <span style={{ color: '#b3a8c2' }}> / 40</span>
    </span>
  );
};

const EdgeRow = ({ children }: { children: ReactNode }) => (
  <PixelBox w={4} style={{ padding: '18px 28px', fontSize: 30, lineHeight: 1.4 }}>
    {children}
  </PixelBox>
);

const Edge: Page = () => (
  <Shell ch={CH2} title="難題 2：極端狀況，總在最意想不到時出現">
    <div style={{ display: 'flex', gap: 64 }}>
      <PixelBox bg={C.ink} style={{ width: 760, padding: '40px 48px', color: C.paper }}>
        <div style={{ fontSize: 28, color: C.yellow }}>MATH101 微積分（一）· 名額</div>
        <div style={{ fontFamily: PRESS, fontSize: 104, margin: '48px 0 0', lineHeight: 1.2 }}>
          <SeatCounter />
        </div>
        <p style={{ margin: '56px 0 0', fontSize: 30, lineHeight: 1.6 }}>
          選課開放第一分鐘，KELLY 接到學校電話：
          <br />
          「這門課怎麼收了 41 個人？」
        </p>
        <p style={{ margin: '20px 0 0', fontSize: 26, lineHeight: 1.6, color: '#b3a8c2' }}>
          最後一個名額，兩個人同時按下選課。
        </p>
      </PixelBox>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={{ fontSize: 30, color: C.muted }}>其他常見的邊界：</div>
        <Steps>
          <Step>
            <Pop>
              <EdgeRow>剛好等於學分上限 25，能不能選？</EdgeRow>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <EdgeRow>23:59:59 截止，送出時已經 00:00:01</EdgeRow>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <EdgeRow>學號 0123456 被存成 123456</EdgeRow>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <EdgeRow>0 學分的班會課，算不算進上限？</EdgeRow>
            </Pop>
          </Step>
        </Steps>
      </div>
    </div>
  </Shell>
);

const IssueCard = ({
  tag,
  title,
  children,
  color,
  extra,
}: {
  tag: string;
  title: string;
  children: ReactNode;
  color: string;
  extra?: ReactNode;
}) => (
  <PixelBox style={{ padding: '30px 36px', height: 290, boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <Chip bg={color} size={24}>
        {tag}
      </Chip>
      <span style={{ fontSize: 38 }}>{title}</span>
      {extra}
    </div>
    <p style={{ margin: '24px 0 0', fontSize: 30, lineHeight: 1.6, color: C.ink }}>{children}</p>
  </PixelBox>
);

const SEATS = 40;

// A live double-submit: every click deducts another seat, like the buggy form did.
const DoubleSubmit = () => {
  const [n, setN] = usePageState(0);
  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        key={n}
        className={n > 1 ? 'tq-a tq-hit' : undefined}
        style={{ fontSize: 24, color: n > 1 ? C.red : C.muted, whiteSpace: 'nowrap' }}
      >
        已選 {n} 次 · 名額 {SEATS - n}
      </span>
      <button
        type="button"
        onPointerDown={halt}
        onClick={(e) => {
          halt(e);
          setN((v) => (v >= 5 ? 0 : v + 1));
        }}
        style={{
          border: 'none',
          cursor: 'pointer',
          fontFamily: PIXEL,
          fontSize: 24,
          padding: '8px 16px',
          background: C.ink,
          color: C.yellow,
          boxShadow: ring(C.ink, 3),
        }}
      >
        送出
      </button>
    </div>
  );
};

const HumanError: Page = () => (
  <Shell ch={CH2} title="難題 3：表單上的人為疏失">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
      <Steps>
        <Step>
          <Pop>
            <IssueCard tag="連點" title="按了兩次送出" color={C.red} extra={<DoubleSubmit />}>網路卡，學生又按了一次。同一門課選了兩次，名額也被扣了兩次。</IssueCard>
          </Pop>
        </Step>
        <Step>
          <Pop>
            <IssueCard tag="格式" title="全形的「８５」" color={C.blue}>
              老師從 Excel 貼上成績，全形數字加上空白，系統存成 0 分。
            </IssueCard>
          </Pop>
        </Step>
        <Step>
          <Pop>
            <IssueCard tag="殘留" title="切換學生，分數還在" color={C.purple}>從 A 同學切到 B 同學，表單沒有清空，一按儲存成績就登到錯的人身上。</IssueCard>
          </Pop>
        </Step>
        <Step>
          <Pop>
            <IssueCard tag="流程" title="清單漏一項、判斷寫反" color={C.green}>小明的手測清單漏了「管理員代為退選」；複製貼上之後，角色判斷也寫反了。</IssueCard>
          </Pop>
        </Step>
      </Steps>
    </div>
  </Shell>
);

const Callout = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 16, fontSize: 28, lineHeight: 1.5, color: C.redDark }}>
    <span style={{ fontFamily: PRESS, fontSize: 22, marginTop: 6 }}>!</span>
    <span>{children}</span>
  </div>
);

const Deploy: Page = () => (
  <Shell ch={CH2} title="難題 4：測試站好好的，正式站就壞了">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1 }}>
        <CodeBlock
          label="測試站 appsettings.Staging.json"
          size={26}
          code={String.raw`{
  "Enrollment": {
    "EnforceCreditLimit": false,
    "OpenAt": "2027-02-10T09:00:00"
  }
}`}
        />
        <p style={{ margin: '28px 0 0', fontSize: 28, lineHeight: 1.5, color: C.muted }}>
          為了方便測試，先把學分上限關掉；主機在台灣時區。
        </p>
      </div>
      <div style={{ flex: 1 }}>
        <CodeBlock
          label="正式站 appsettings.Production.json"
          size={26}
          flag={2}
          code={String.raw`{
  "Enrollment": {

    "OpenAt": "2027-02-10T09:00:00"
  }
}`}
        />
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Steps>
            <Step>
              <Pop kind="jolt">
                <Callout>少了 EnforceCreditLimit，讀到預設值 false，學分上限失效</Callout>
              </Pop>
            </Step>
            <Step>
              <Pop kind="jolt">
                <Callout>時間沒寫時區，主機是 UTC，晚了 8 小時才開放</Callout>
              </Pop>
            </Step>
          </Steps>
        </div>
      </div>
    </div>
    <PixelBox
      bg={C.yellow}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px 40px', fontSize: 32 }}
    >
      小明照著部署清單上線，程式一行都沒改，壞掉的是設定。
    </PixelBox>
  </Shell>
);

const ChainStep = ({ no, children, hot }: { no: string; children: ReactNode; hot?: boolean }) => (
  <PixelBox
    bg={hot ? C.red : C.paper}
    style={{
      width: 340,
      height: 220,
      padding: '28px 30px',
      boxSizing: 'border-box',
      color: hot ? C.paper : C.ink,
    }}
  >
    <div style={{ fontFamily: PRESS, fontSize: 22, color: hot ? C.yellow : C.muted }}>{no}</div>
    <div style={{ marginTop: 22, fontSize: 34, lineHeight: 1.45 }}>{children}</div>
  </PixelBox>
);

const ChainArrow = () => (
  <span style={{ fontFamily: PRESS, fontSize: 32, color: C.muted, alignSelf: 'center' }}>&gt;</span>
);

const CHAIN_ITEM: CSSProperties = { display: 'flex', gap: 28 };

const Cost: Page = () => (
  <Shell ch={CH2} title="結果：被客戶罵到臭頭，還得想辦法補救">
    <div style={{ display: 'flex', gap: 28 }}>
      <Steps>
        <ChainStep no="01">學生選錯課、成績登錯人</ChainStep>
        <Step>
          <Pop style={CHAIN_ITEM}>
            <ChainArrow />
            <ChainStep no="02">學生和家長找上學校承辦</ChainStep>
          </Pop>
        </Step>
        <Step>
          <Pop kind="jolt" style={CHAIN_ITEM}>
            <ChainArrow />
            <ChainStep no="03" hot>
              承辦打來，我們被罵到臭頭
            </ChainStep>
          </Pop>
        </Step>
        <Step>
          <Pop style={CHAIN_ITEM}>
            <ChainArrow />
            <ChainStep no="04">人工比對、補資料、談補償</ChainStep>
          </Pop>
        </Step>
      </Steps>
    </div>
    <Steps>
      <Step>
        <div style={{ marginTop: 80, display: 'flex', alignItems: 'center', gap: 40 }}>
          <Sprite art={HEART} px={12} />
          <Sprite art={HEART} px={12} pal={LOST} className="tq-drain" style={{ '--tq-d': '0.9s' } as CSSProperties} />
          <Sprite art={HEART} px={12} pal={LOST} className="tq-drain" style={{ '--tq-d': '0.4s' } as CSSProperties} />
          <p style={{ margin: 0, fontSize: 44, lineHeight: 1.4 }}>
            修 bug 只要一個下午，
            <br />
            掉了的信任要很久才補得回來。
          </p>
        </div>
      </Step>
    </Steps>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════════════════
// CH.03 轉捩點
// ═══════════════════════════════════════════════════════════════════════════

const ValueCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <PixelBox style={{ flex: 1, padding: '28px 32px' }}>
    <div style={{ fontSize: 36, color: C.greenDark }}>{title}</div>
    <div style={{ marginTop: 14, fontSize: 28, lineHeight: 1.5, color: C.muted }}>{children}</div>
  </PixelBox>
);

const Turning: Page = () => (
  <Shell ch={CH3} title="轉捩點：把記憶寫成程式，每次 push 自動跑">
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 56 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <Sprite art={HERO} px={16} pal={rolePal(C.green)} className="tq-a tq-bob" />
        <Chip bg={C.green}>順誠</Chip>
      </div>
      <PixelBox style={{ flex: 1, padding: '44px 52px', fontSize: 46, lineHeight: 1.5, marginBottom: 60 }}>
        <Typed
          segs={[
            { t: '「這些情境我們每次都靠記憶在測。\n不如把它們寫成程式，' },
            { t: '每次 push 都自動跑一遍', color: C.red },
            { t: '。」' },
          ]}
          interval={70}
          delay={300}
        />
      </PixelBox>
    </div>
    <Steps>
      <Step>
        <Pop style={{ display: 'flex', gap: 48, marginTop: 56 }}>
          <ValueCard title="不靠記憶">案例寫下來，就不會漏掉</ValueCard>
          <ValueCard title="每次都跑">改 A 的時候，B 也一起檢查</ValueCard>
          <ValueCard title="跑得比人快">幾百個案例，幾秒到幾分鐘</ValueCard>
        </Pop>
      </Step>
    </Steps>
  </Shell>
);

// ─── Brainstorm board (shared via localStorage) ─────────────────────────────

type CatKey = 'role' | 'bound' | 'time' | 'race' | 'input' | 'env';
const CATS: Record<CatKey, { label: string; color: string; fg: string; hint: string }> = {
  role: { label: '角色權限', color: C.purple, fg: C.paper, hint: '換個身分會怎樣？' },
  bound: { label: '數值邊界', color: C.red, fg: C.paper, hint: '剛好、超過、0' },
  time: { label: '時間', color: C.yellow, fg: C.ink, hint: '最後一秒、跨日' },
  race: { label: '併發', color: C.blue, fg: C.paper, hint: '同時做、重複做' },
  input: { label: '輸入格式', color: C.green, fg: C.paper, hint: '從別處貼上的資料' },
  env: { label: '環境設定', color: C.muted, fg: C.paper, hint: '正式站和測試站差在哪' },
};

type Idea = { id: string; cat: CatKey; text: string };
const IDEAS_KEY = 'testing-quest:ideas';
const IDEAS_EVENT = 'testing-quest:ideas-change';

const readIdeas = (): Idea[] => {
  try {
    const raw = localStorage.getItem(IDEAS_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const writeIdeas = (ideas: Idea[]) => {
  try {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  } catch {
    // storage unavailable: board still works for this render
  }
  window.dispatchEvent(new Event(IDEAS_EVENT));
};

const useIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  useEffect(() => {
    const sync = () => setIdeas(readIdeas());
    sync();
    window.addEventListener(IDEAS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(IDEAS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return ideas;
};

const IdeaNote = ({ idea, onRemove, lines = 2 }: { idea: Idea; onRemove?: () => void; lines?: number }) => (
  <div
    className="tq-a tq-in"
    style={{
      position: 'relative',
      background: C.paper,
      boxShadow: `${ring(C.ink, 3)}, inset 0 6px 0 0 ${CATS[idea.cat].color}`,
      padding: '16px 14px 10px',
      fontSize: 24,
      lineHeight: 1.35,
      wordBreak: 'break-all',
    }}
  >
    {/* Live audience text has unknown length; clamping keeps fixed-height columns inside the canvas. */}
    <div style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }}>
      {idea.text}
    </div>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          border: 'none',
          background: 'transparent',
          fontFamily: PRESS,
          fontSize: 12,
          color: C.muted,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        x
      </button>
    )}
  </div>
);

const MAX_PER_COL = 4;

const CatColumn = ({ cat, ideas, onRemove }: { cat: CatKey; ideas: Idea[]; onRemove: (id: string) => void }) => {
  const mine = ideas.filter((i) => i.cat === cat);
  const shown = mine.slice(-MAX_PER_COL);
  const meta = CATS[cat];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      <div
        style={{
          background: meta.color,
          color: meta.fg,
          boxShadow: ring(C.ink, 4),
          padding: '10px 14px',
          fontSize: 28,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{meta.label}</span>
        <span style={{ fontFamily: PRESS, fontSize: 18, alignSelf: 'center' }}>{mine.length}</span>
      </div>
      {shown.length === 0 && (
        <div
          style={{
            border: `3px dashed ${C.sand}`,
            padding: '14px 12px',
            fontSize: 24,
            lineHeight: 1.35,
            color: '#a69cb3',
          }}
        >
          例：{meta.hint}
        </div>
      )}
      {shown.map((idea) => (
        <IdeaNote key={idea.id} idea={idea} onRemove={() => onRemove(idea.id)} />
      ))}
      {mine.length > MAX_PER_COL && (
        <div style={{ fontSize: 22, color: C.muted }}>還有 {mine.length - MAX_PER_COL} 個</div>
      )}
    </div>
  );
};

const CatButton = ({ cat, selected, onPick }: { cat: CatKey; selected: boolean; onPick: (c: CatKey) => void }) => {
  const meta = CATS[cat];
  return (
    <button
      type="button"
      onClick={() => onPick(cat)}
      style={{
        border: 'none',
        cursor: 'pointer',
        fontFamily: PIXEL,
        fontSize: 24,
        padding: '10px 14px',
        background: selected ? meta.color : C.paper,
        color: selected ? meta.fg : C.ink,
        boxShadow: ring(C.ink, 3),
      }}
    >
      {meta.label}
    </button>
  );
};

const BOARD_BTN: CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  fontFamily: PIXEL,
  fontSize: 28,
  padding: '0 28px',
  height: 64,
  boxShadow: ring(C.ink, 4),
};

const Board = () => {
  const ideas = useIdeas();
  const [cat, setCat] = useState<CatKey>('role');
  const [text, setText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    writeIdeas([...readIdeas(), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, cat, text: t }]);
    setText('');
  };
  const remove = (id: string) => writeIdeas(readIdeas().filter((i) => i.id !== id));
  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    writeIdeas([]);
    setConfirmClear(false);
  };

  // data-osd-interactive keeps clicks on the board from turning the page; keys typed into
  // the input are already ignored by the player, so arrow keys work everywhere else.
  return (
    <div data-osd-interactive style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 22, height: 520 }}>
        <CatColumn cat="role" ideas={ideas} onRemove={remove} />
        <CatColumn cat="bound" ideas={ideas} onRemove={remove} />
        <CatColumn cat="time" ideas={ideas} onRemove={remove} />
        <CatColumn cat="race" ideas={ideas} onRemove={remove} />
        <CatColumn cat="input" ideas={ideas} onRemove={remove} />
        <CatColumn cat="env" ideas={ideas} onRemove={remove} />
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <CatButton cat="role" selected={cat === 'role'} onPick={setCat} />
        <CatButton cat="bound" selected={cat === 'bound'} onPick={setCat} />
        <CatButton cat="time" selected={cat === 'time'} onPick={setCat} />
        <CatButton cat="race" selected={cat === 'race'} onPick={setCat} />
        <CatButton cat="input" selected={cat === 'input'} onPick={setCat} />
        <CatButton cat="env" selected={cat === 'env'} onPick={setCat} />
        <input
          className="tq-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') add();
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          placeholder="輸入大家想到的狀況，按 Enter"
          style={{
            flex: 1,
            minWidth: 0,
            height: 64,
            border: 'none',
            boxShadow: ring(C.ink, 4),
            background: C.paper,
            fontFamily: PIXEL,
            fontSize: 28,
            padding: '0 20px',
            color: C.ink,
          }}
        />
        <button type="button" onClick={add} style={{ ...BOARD_BTN, background: C.ink, color: C.yellow }}>
          新增
        </button>
        <button
          type="button"
          onClick={clear}
          onBlur={() => setConfirmClear(false)}
          style={{ ...BOARD_BTN, background: confirmClear ? C.red : C.paper, color: confirmClear ? C.paper : C.muted }}
        >
          {confirmClear ? '確定？' : '清除'}
        </button>
      </div>
    </div>
  );
};

const Brainstorm: Page = () => (
  <Shell ch={CH2} title="除了剛剛那些，選課第一天還可能出什麼事？">
    <Board />
  </Shell>
);

// ─── Reference list to compare against the brainstorm ──────────────────────

// Presenter clicks a card when someone in the room already thought of it.
const HitCtx = createContext<{ hits: Set<string>; toggle: (id: string) => void }>({
  hits: new Set(),
  toggle: () => {},
});

const RefCase = ({ children }: { children: string }) => {
  const { hits, toggle } = useContext(HitCtx);
  const hit = hits.has(children);
  return (
    <button
      type="button"
      onPointerDown={halt}
      onClick={(e) => {
        halt(e);
        toggle(children);
      }}
      style={{
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: PIXEL,
        background: hit ? C.green : C.paper,
        color: hit ? C.paper : C.ink,
        boxShadow: ring(C.ink, 3),
        padding: '10px 14px',
        fontSize: 24,
        lineHeight: 1.35,
      }}
    >
      {children}
    </button>
  );
};

const RefColumn = ({ cat, children }: { cat: CatKey; children: ReactNode }) => {
  const live = useIdeas().filter((i) => i.cat === cat).length;
  const meta = CATS[cat];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div
        style={{
          background: meta.color,
          color: meta.fg,
          boxShadow: ring(C.ink, 4),
          padding: '10px 14px',
          fontSize: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{meta.label}</span>
        <span style={{ fontSize: 20 }}>現場 {live}</span>
      </div>
      {children}
    </div>
  );
};

const Compare: Page = () => {
  const [hits, setHits] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setHits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <HitCtx.Provider value={{ hits, toggle }}>
      <Shell ch={CH2} title="對照看看：這些極端情況，你們想到幾個？">
        <div style={{ display: 'flex', gap: 22 }}>
          <RefColumn cat="role">
            <RefCase>他科老師也改得動成績</RefCase>
            <RefCase>助教看得到全班成績</RefCase>
            <RefCase>學生改網址看別人資料</RefCase>
            <RefCase>帳號停權後，舊登入還能用</RefCase>
            <RefCase>老師同時是別門課的學生</RefCase>
          </RefColumn>
          <RefColumn cat="bound">
            <RefCase>剛好 25 學分能不能選</RefCase>
            <RefCase>0 學分課算不算上限</RefCase>
            <RefCase>名額設成 0 或負數</RefCase>
            <RefCase>成績剛好 59.5 要不要進位</RefCase>
            <RefCase>學號開頭的 0 被吃掉</RefCase>
          </RefColumn>
          <RefColumn cat="time">
            <RefCase>截止前最後一秒送出</RefCase>
            <RefCase>正式站 UTC，晚 8 小時開放</RefCase>
            <RefCase>23:59 跨到 00:00</RefCase>
            <RefCase>開放前先停在頁面上等</RefCase>
            <RefCase>頁面放太久，登入過期</RefCase>
          </RefColumn>
          <RefColumn cat="race">
            <RefCase>兩人搶最後一個名額</RefCase>
            <RefCase>網路慢，連點兩次送出</RefCase>
            <RefCase>開兩個分頁同時選、退</RefCase>
            <RefCase>老師和管理員同時改成績</RefCase>
            <RefCase>幾千人同一秒湧進來</RefCase>
          </RefColumn>
          <RefColumn cat="input">
            <RefCase>Excel 貼上全形數字</RefCase>
            <RefCase>前後空白、夾帶換行</RefCase>
            <RefCase>成績超過 100、負數</RefCase>
            <RefCase>空白直接送出</RefCase>
            <RefCase>切換學生，表單沒清空</RefCase>
          </RefColumn>
          <RefColumn cat="env">
            <RefCase>正式站少一個設定值</RefCase>
            <RefCase>測試站關掉的學分上限</RefCase>
            <RefCase>資料庫連線數用完</RefCase>
            <RefCase>第三方服務逾時</RefCase>
            <RefCase>瀏覽器快取到舊版前端</RefCase>
          </RefColumn>
        </div>
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'baseline', gap: 48, fontSize: 30, lineHeight: 1.4 }}>
          <span style={{ flex: 'none' }}>
            現場命中 <span style={{ fontFamily: PRESS, fontSize: 34, color: C.greenDark }}>{hits.size}</span> / 30
          </span>
          <Steps>
            <Step>
              <span>
                沒人能一次想完，更不可能<span style={{ color: C.red }}>每次上線都手動全測一遍</span>。
              </span>
            </Step>
          </Steps>
        </div>
      </Shell>
    </HitCtx.Provider>
  );
};

// ─── Three kinds of tests ───────────────────────────────────────────────────

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const filled = useSequence(value, 220, 300);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <span style={{ width: 170, fontSize: 28 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              width: 40,
              height: 28,
              background: i <= filled ? color : C.paper,
              boxShadow: ring(C.ink, 3),
            }}
          />
        ))}
      </div>
    </div>
  );
};

const TestIntro = ({
  lv,
  name,
  en,
  color,
  def,
  stats,
  uses,
  examples,
  extra,
}: {
  lv: string;
  name: string;
  en: string;
  color: string;
  def: ReactNode;
  stats: ReactNode;
  uses: ReactNode;
  examples: ReactNode;
  extra?: ReactNode;
}) => (
  <Shell ch={CH3} title={`認識測試 ${lv}：${name}`}>
    <div style={{ display: 'flex', gap: 64, height: '100%' }}>
      <div style={{ width: 740, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Chip bg={color} size={20} style={{ fontFamily: PRESS }}>
            {en}
          </Chip>
        </div>
        <PixelBox style={{ marginTop: 32, padding: '28px 36px', fontSize: 36, lineHeight: 1.5 }}>{def}</PixelBox>
        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 20 }}>{stats}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, color: C.muted }}>適合用在</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>{uses}</div>
        <div style={{ marginTop: 40, fontSize: 28, color: C.muted }}>在選課系統裡</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>{examples}</div>
        {extra}
      </div>
    </div>
  </Shell>
);

const UnitIntro: Page = () => (
  <TestIntro
    lv="LV.1"
    name="單元測試"
    en="UNIT TEST"
    color={C.green}
    def="只測一小段邏輯，像是一個函式。不碰資料庫，也不連網路。"
    stats={
      <>
        <StatBar label="執行速度" value={5} color={C.green} />
        <StatBar label="建議數量" value={5} color={C.green} />
        <StatBar label="撰寫成本" value={1} color={C.green} />
        <StatBar label="貼近使用者" value={1} color={C.green} />
      </>
    }
    uses={
      <>
        <Bullet color={C.green}>計算、判斷、格式轉換</Bullet>
        <Bullet color={C.green}>規則多、組合多的地方</Bullet>
      </>
    }
    examples={
      <>
        <Bullet color={C.green}>學分上限：剛好 25 能不能選</Bullet>
        <Bullet color={C.green}>「誰可以改成績」的權限判斷</Bullet>
        <Bullet color={C.green}>成績輸入：全形、空白、超過 100</Bullet>
      </>
    }
    extra={
      <PixelBox bg={C.ink} style={{ marginTop: 'auto', padding: '20px 28px', color: C.paper, fontSize: 28 }}>
        寫法 AAA：<span style={{ color: C.yellow }}>Arrange</span> 準備 &gt;{' '}
        <span style={{ color: C.yellow }}>Act</span> 執行 &gt; <span style={{ color: C.yellow }}>Assert</span> 驗證
      </PixelBox>
    }
  />
);

const IntegrationIntro: Page = () => (
  <TestIntro
    lv="LV.2"
    name="整合測試"
    en="INTEGRATION"
    color={C.blue}
    def="把幾個真的元件接起來測，看它們之間接不接得上。"
    stats={
      <>
        <StatBar label="執行速度" value={3} color={C.blue} />
        <StatBar label="建議數量" value={3} color={C.blue} />
        <StatBar label="撰寫成本" value={3} color={C.blue} />
        <StatBar label="貼近使用者" value={3} color={C.blue} />
      </>
    }
    uses={
      <>
        <Bullet color={C.blue}>API 加上權限檢查和資料庫</Bullet>
        <Bullet color={C.blue}>前端畫面加上 API 回應</Bullet>
        <Bullet color={C.blue}>多人同時操作、交易和鎖</Bullet>
      </>
    }
    examples={
      <>
        <Bullet color={C.blue}>學生的 token 呼叫改成績 API 回 403</Bullet>
        <Bullet color={C.blue}>選課有寫進資料庫、名額有扣</Bullet>
        <Bullet color={C.blue}>名額已滿時，畫面提示正確</Bullet>
      </>
    }
  />
);

const E2EIntro: Page = () => (
  <TestIntro
    lv="LV.3"
    name="E2E 測試"
    en="END TO END"
    color={C.red}
    def="打開真的瀏覽器，照使用者的方式從頭點到尾。"
    stats={
      <>
        <StatBar label="執行速度" value={1} color={C.red} />
        <StatBar label="建議數量" value={1} color={C.red} />
        <StatBar label="撰寫成本" value={5} color={C.red} />
        <StatBar label="貼近使用者" value={5} color={C.red} />
      </>
    }
    uses={
      <>
        <Bullet color={C.red}>最重要的幾條主流程</Bullet>
        <Bullet color={C.red}>跨角色的流程：老師改、學生看</Bullet>
        <Bullet color={C.red}>部署完的冒煙測試（Smoke test）</Bullet>
      </>
    }
    examples={
      <>
        <Bullet color={C.red}>學生登入、選課、看到課表</Bullet>
        <Bullet color={C.red}>老師登打成績，學生查得到</Bullet>
        <Bullet color={C.red}>部署後確認學分上限真的有開</Bullet>
      </>
    }
  />
);

const Layer = ({
  width,
  color,
  name,
  info,
}: {
  width: number;
  color: string;
  name: string;
  info: string;
}) => (
  <PixelBox
    bg={color}
    className="tq-a tq-drop"
    style={{
      width,
      height: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: C.paper,
      gap: 10,
    }}
  >
    <div style={{ fontSize: 40 }}>{name}</div>
    <div style={{ fontSize: 26, opacity: 0.9 }}>{info}</div>
  </PixelBox>
);

const Pyramid: Page = () => (
  <Shell ch={CH3} title="測試金字塔：底層多、上層少">
    <div style={{ display: 'flex', gap: 64, height: '100%' }}>
      <div
        style={{
          width: 1040,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 22,
          paddingBottom: 20,
        }}
      >
        <Steps>
          <Step>
            <Layer width={1000} color={C.green} name="單元測試" info="大量 · 毫秒級 · 最便宜" />
          </Step>
          <Step>
            <Layer width={700} color={C.blue} name="整合測試" info="適量 · 秒級" />
          </Step>
          <Step>
            <Layer width={520} color={C.red} name="E2E" info="少量 · 分鐘級" />
          </Step>
          <Step>
            <Layer width={340} color={C.purple} name="人為確認" info="最少 · 憑經驗探索" />
          </Step>
        </Steps>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
        <PixelBox style={{ padding: '24px 30px', fontSize: 30, lineHeight: 1.5 }}>
          <span style={{ color: C.red }}>越往上</span>
          <br />
          越慢、越貴，也越接近真實使用者
        </PixelBox>
        <PixelBox style={{ padding: '24px 30px', fontSize: 30, lineHeight: 1.5 }}>
          <span style={{ color: C.greenDark }}>越往下</span>
          <br />
          越快、越便宜，壞了也越好找原因
        </PixelBox>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.5, color: C.muted }}>
          大部分寫在底層，最重要的流程才寫 E2E，
          <br />
          機器測不到的手感與體驗，留給人為確認。
        </p>
      </div>
    </div>
  </Shell>
);

const MapRow = ({
  problem,
  fix,
  layer,
  color,
}: {
  problem: string;
  fix: string;
  layer: string;
  color: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
    <PixelBox w={4} style={{ width: 460, padding: '18px 24px', fontSize: 30, boxSizing: 'border-box' }}>
      {problem}
    </PixelBox>
    <span style={{ fontFamily: PRESS, fontSize: 24, color: C.muted }}>&gt;</span>
    <div style={{ flex: 1, fontSize: 32 }}>{fix}</div>
    <Chip bg={color} size={24} style={{ minWidth: 220, textAlign: 'center' }}>
      {layer}
    </Chip>
  </div>
);

const Insight: Page = () => (
  <Shell ch={CH3} title={<>INSIGHT：測試是<span style={{ color: C.red }}>可以執行的規格</span></>}>
    <Steps>
      <div style={{ display: 'flex', gap: 28, fontSize: 24, color: C.muted, marginBottom: 20 }}>
        <span style={{ width: 460 }}>難題</span>
        <span style={{ width: 24 }} />
        <span style={{ flex: 1 }}>換個做法</span>
        <span style={{ minWidth: 252, textAlign: 'center' }}>誰來負責</span>
      </div>
      <Step>
        <Pop>
          <MapRow problem="自己人只測 happy path" fix="把使用者會做的事寫成案例，只會累積不會忘記" layer="E2E · 整合" color={C.red} />
        </Pop>
      </Step>
      <Step>
        <Pop style={{ marginTop: 14 }}>
          <MapRow problem="組合多到測不完" fix="權限矩陣，一格一格寫成測試，規格=規則" layer="單元" color={C.green} />
        </Pop>
      </Step>
      <Step>
        <Pop style={{ marginTop: 14 }}>
          <MapRow problem="極端狀況" fix="邊界值和併發，事先列出來，最大程度減少意外" layer="單元 · 整合" color={C.blue} />
        </Pop>
      </Step>
      <Step>
        <Pop style={{ marginTop: 14 }}>
          <MapRow problem="表單上的人為疏失" fix="機器不會累，每次都完整跑一遍" layer="單元 · CI" color={C.purple} />
        </Pop>
      </Step>
      <Step>
        <Pop style={{ marginTop: 14 }}>
          <MapRow problem="部署設定" fix="設定也要被檢查，缺了就不准啟動" layer="啟動檢查 · Smoke" color={C.ink} />
        </Pop>
      </Step>
      <Step>
        <Pop style={{ marginTop: 14 }}>
          <MapRow problem="打錯、寫反、改 A 壞 B" fix="日常小疏失，大量單元測試每次 push 當場抓到" layer="單元" color={C.yellow} />
        </Pop>
      </Step>
      <Step>
        <PixelBox
          bg={C.ink}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 40px', color: C.paper, fontSize: 34 }}
        >
          測試不是為了避免犯錯，而是<span style={{ color: C.yellow }}>避免一直犯一樣的錯</span>。
        </PixelBox>
      </Step>
    </Steps>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════════════════
// CH.04 實戰
// ═══════════════════════════════════════════════════════════════════════════

const Scenario = ({ children }: { children: ReactNode }) => (
  <Bullet color={C.blue} size={28}>
    {children}
  </Bullet>
);

// Live demo: "someone breaks the code" flips the badge red and flags the failing line.
const BreakButton = ({ broken, onToggle }: { broken: boolean; onToggle: () => void }) => (
  <div style={{ marginTop: 20, display: 'flex' }}>
    <button
      type="button"
      onPointerDown={halt}
      onClick={(e) => {
        halt(e);
        onToggle();
      }}
      style={{
        alignSelf: 'flex-start',
        border: 'none',
        cursor: 'pointer',
        fontFamily: PIXEL,
        fontSize: 26,
        padding: '10px 18px',
        background: broken ? C.paper : C.yellow,
        color: C.ink,
        boxShadow: ring(C.ink, 4),
      }}
    >
      {broken ? '還原' : '模擬有人改壞'}
    </button>
  </div>
);

const CodeLayout = ({
  tool,
  scenarios,
  note,
  passed,
  code,
  breakLine,
  failure,
}: {
  tool: string;
  scenarios: ReactNode;
  note?: ReactNode;
  passed: number;
  code: string;
  breakLine?: number;
  failure?: string;
}) => {
  const [broken, setBroken] = usePageState(false);
  return (
  <div style={{ display: 'flex', gap: 44, height: '100%' }}>
    <div style={{ width: 436, display: 'flex', flexDirection: 'column' }}>
      <div>
        <Chip bg={C.blue} size={24}>
          {tool}
        </Chip>
      </div>
      <div style={{ marginTop: 32, fontSize: 26, color: C.muted }}>這頁測的情境</div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>{scenarios}</div>
      <div style={{ marginTop: 32, display: 'flex' }}>
        {broken ? (
          <div className="tq-a tq-shake" style={{ ...BADGE, background: C.red, color: C.paper }}>
            1 FAILED
          </div>
        ) : (
          <PassBadge count={passed} delay={code.split('\n').length * CODE_LINE_MS + 400} />
        )}
      </div>
      {failure && <BreakButton broken={broken} onToggle={() => setBroken((b) => !b)} />}
      {broken ? (
        <p style={{ marginTop: 'auto', marginBottom: 0, fontSize: 24, lineHeight: 1.5, color: C.redDark }}>{failure}</p>
      ) : (
        note && <p style={{ marginTop: 'auto', marginBottom: 0, fontSize: 24, lineHeight: 1.5, color: C.muted }}>{note}</p>
      )}
    </div>
    {/* Long listings drop to 22px so they stay inside the 1080 canvas. */}
    <CodeBlock
      code={code}
      size={code.split('\n').length > 17 ? 22 : 24}
      flag={broken ? breakLine : undefined}
      typing
      style={{ flex: 1, alignSelf: 'flex-start' }}
    />
  </div>
  );
};

const UnitVanilla: Page = () => (
  <Shell ch={CH4} title="單元 · Vanilla JS：把邊界值一次列完">
    <CodeLayout
      tool="Vitest"
      passed={9}
      scenarios={
        <>
          <Scenario>剛好 25 學分</Scenario>
          <Scenario>超過上限 1 學分</Scenario>
          <Scenario>0 學分的班會課</Scenario>
          <Scenario>全形、空白、超過 100</Scenario>
        </>
      }
      note="test.each 一張表就是一份規格：之後想到新的邊界，加一行就好。"
      breakLine={3}
      failure="有人把 <= 改成 <：剛好 25 學分，預期可以選，實際被擋。"
      code={String.raw`import { canEnroll, parseScore } from './enroll.js';

test.each([
  [22, 3, true],   // 剛好 25 學分，可以選
  [23, 3, false],  // 26 學分，超過上限
  [25, 0, true],   // 0 學分的班會課
])('已修 %i + 新課 %i 學分 → %s', (current, credits, ok) => {
  expect(canEnroll(current, { credits })).toBe(ok);
});

test.each([
  ['85', 85], ['８５', 85], [' 85 ', 85],
  ['', null], ['101', null], ['-1', null],
])('成績輸入 %j → %j', (input, expected) => {
  expect(parseScore(input)).toBe(expected);
});`}
    />
  </Shell>
);

const UnitVue: Page = () => (
  <Shell ch={CH4} title="單元 · Vue：切換學生與連點送出">
    <CodeLayout
      tool="Vitest + Vue Test Utils"
      passed={2}
      scenarios={
        <>
          <Scenario>切換學生，分數要清空</Scenario>
          <Scenario>送出中，按鈕要停用</Scenario>
          <Scenario>連按兩次，只存一次</Scenario>
        </>
      }
      note="save 故意不 resolve，模擬「網路很慢、還在儲存中」的狀態。"
      code={String.raw`import { mount } from '@vue/test-utils';
import GradeForm from './GradeForm.vue';

test('切換學生時，分數欄位要清空', async () => {
  const wrapper = mount(GradeForm, { props: { studentId: 'A001' } });
  await wrapper.find('input[name=score]').setValue('85');
  await wrapper.setProps({ studentId: 'B002' });
  expect(wrapper.find('input[name=score]').element.value).toBe('');
});

test('連按兩次送出，只會存一次', async () => {
  const save = vi.fn(() => new Promise(() => {})); // 一直停在儲存中
  const wrapper = mount(GradeForm, { props: { studentId: 'A001', save } });
  await wrapper.find('input[name=score]').setValue('85');
  await wrapper.find('form').trigger('submit');
  await wrapper.find('form').trigger('submit');
  expect(save).toHaveBeenCalledTimes(1);
  expect(wrapper.get('button').attributes('disabled')).toBeDefined();
});`}
    />
  </Shell>
);

const UnitDotnet: Page = () => (
  <Shell ch={CH4} title="單元 · ASP.NET Core：權限矩陣一格一格測">
    <CodeLayout
      tool="xUnit"
      passed={4}
      scenarios={
        <>
          <Scenario>本科老師：可以改</Scenario>
          <Scenario>他科老師：不行</Scenario>
          <Scenario>學生：不行</Scenario>
          <Scenario>管理員：可以改</Scenario>
        </>
      }
      note="小明那個 bug，就是少了第二行 InlineData。補上之後，它永遠不會再回來。"
      code={String.raw`public class GradePolicyTests
{
    [Theory]
    [InlineData(Role.Teacher, "MATH101", "MATH101", true)]  // 本科老師
    [InlineData(Role.Teacher, "ENG201",  "MATH101", false)] // 他科老師
    [InlineData(Role.Student, null,      "MATH101", false)] // 學生
    [InlineData(Role.Admin,   null,      "MATH101", true)]  // 管理員
    public void CanEditGrade(Role role, string? teaches,
                             string courseId, bool expected)
    {
        var user = new UserContext(role, teaches);          // Arrange

        var result = GradePolicy.CanEdit(user, courseId);   // Act

        Assert.Equal(expected, result);                     // Assert
    }
}`}
    />
  </Shell>
);

const IntegrationFront: Page = () => (
  <Shell ch={CH4} title="整合 · 前端：API 出錯時，畫面要講人話">
    <CodeBlock
      label="兩邊共用：用 MSW 攔截 fetch，假裝成後端"
      typing
      size={22}
      code={String.raw`const server = setupServer(
  http.post('/api/courses/:id/enroll', () =>
    HttpResponse.json({ message: '名額已滿' }, { status: 409 })),
  http.put('/api/grades/:studentId', () => new HttpResponse(null, { status: 403 })),
);`}
    />
    <div style={{ display: 'flex', gap: 40, marginTop: 34 }}>
      <CodeBlock
        label="Vanilla JS：選課按鈕"
        size={22}
        typing
        delay={450}
        style={{ flex: 1 }}
        code={String.raw`test('名額已滿時顯示提示', async () => {
  document.body.innerHTML =
    '<button id="enroll">選課</button><p id="msg"></p>';
  initEnrollButton('MATH101');
  document.querySelector('#enroll').click();
  const msg = document.querySelector('#msg');
  await vi.waitFor(() =>
    expect(msg.textContent).toBe('名額已滿'));
});`}
      />
      <CodeBlock
        label="Vue：成績表單"
        size={22}
        typing
        delay={1150}
        style={{ flex: 1 }}
        code={String.raw`test('沒有權限時顯示提示', async () => {
  const wrapper = mount(GradeForm, {
    props: { studentId: 'A001' },
  });
  await wrapper.find('input[name=score]').setValue('90');
  await wrapper.find('form').trigger('submit');
  await flushPromises();
  expect(wrapper.text()).toContain('沒有修改權限');
});`}
      />
    </div>
  </Shell>
);

const IntegrationDotnet: Page = () => (
  <Shell ch={CH4} title="整合 · ASP.NET Core：真的打一次 API">
    <CodeLayout
      tool="xUnit + WebApplicationFactory"
      passed={2}
      scenarios={
        <>
          <Scenario>學生的 token 改成績，要回 403</Scenario>
          <Scenario>41 人同時選 40 人的課</Scenario>
          <Scenario>只能有 40 人成功</Scenario>
        </>
      }
      note="併發測試要接真的資料庫（例如用 Testcontainers 起一個 SQL Server），記憶體假資料庫測不出鎖的問題。"
      code={String.raw`// TestApp：包好的 WebApplicationFactory，連測試用資料庫
[Fact]
public async Task 學生不能改成績()
{
    var client = app.CreateClientAs(Role.Student, "A001");
    var res = await client.PutAsJsonAsync(
        "/api/grades/A001", new { score = 100 });
    Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
}

[Fact]
public async Task 名額40人_41人同時選_只能成功40人()
{
    var requests = Enumerable.Range(1, 41).Select(i =>
        app.CreateClientAs(Role.Student, $"S{i:000}")
           .PostAsync("/api/courses/MATH101/enroll", null));
    var results = await Task.WhenAll(requests);
    Assert.Equal(40, results.Count(r => r.IsSuccessStatusCode));
}`}
    />
  </Shell>
);

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 30, lineHeight: 1.4 }}>
    <Chip bg={C.yellow} color={C.ink} size={22}>
      {label}
    </Chip>
    <span>{children}</span>
  </div>
);

const ConfigCheck: Page = () => (
  <Shell ch={CH4} title="部署設定也要測：缺了就不准啟動">
    <div style={{ display: 'flex', gap: 40 }}>
      <CodeBlock
        label="Program.cs：啟動時檢查"
        typing
        style={{ width: 900, boxSizing: 'border-box' }}
        code={String.raw`public class EnrollmentOptions
{
    [Required] public bool? EnforceCreditLimit { get; set; }
    [Required] public DateTimeOffset? OpenAt { get; set; }
}

builder.Services.AddOptions<EnrollmentOptions>()
    .BindConfiguration("Enrollment")
    .ValidateDataAnnotations()
    .ValidateOnStart();  // 少一項設定，直接啟動失敗`}
      />
      <CodeBlock
        label="測試：正式站的設定檔"
        typing
        delay={850}
        style={{ flex: 1 }}
        code={String.raw`[Fact]
public void 正式站必須開啟學分上限()
{
    var config = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile("appsettings.Production.json")
        .Build();
    Assert.True(config.GetValue<bool>(
        "Enrollment:EnforceCreditLimit"));
}`}
      />
    </div>
    <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <InfoRow label="時區">時間一律帶時區：2027-02-10T09:00:00+08:00</InfoRow>
      <InfoRow label="Smoke">部署完，用測試帳號選一門會超修的課，確認正式站真的擋下來</InfoRow>
    </div>
  </Shell>
);

const E2E: Page = () => (
  <Shell ch={CH4} title="E2E · Playwright：照使用者的方式點一遍">
    <CodeLayout
      tool="Playwright"
      passed={2}
      scenarios={
        <>
          <Scenario>老師改成績</Scenario>
          <Scenario>學生登入，查得到新成績</Scenario>
          <Scenario>學生直接開改成績頁，會被擋下</Scenario>
        </>
      }
      note="E2E 只看畫面，前端用 Vanilla 還是 Vue 寫的都一樣能測。"
      code={String.raw`test('老師改成績，學生查得到', async ({ browser }) => {
  const teacher = await loginAs(browser, 'teacher-math');
  await teacher.goto('/courses/MATH101/grades');
  await teacher.getByRole('row', { name: 'A001' })
    .getByLabel('成績').fill('88');
  await teacher.getByRole('button', { name: '儲存' }).click();
  await expect(teacher.getByText('已儲存')).toBeVisible();

  const student = await loginAs(browser, 'student-A001');
  await student.goto('/my/grades');
  await expect(student.getByRole('row', { name: 'MATH101' }))
    .toContainText('88');
});

test('學生打開改成績頁面會被擋下', async ({ browser }) => {
  const student = await loginAs(browser, 'student-A001');
  await student.goto('/courses/MATH101/grades');
  await expect(student).toHaveURL(/\/403$/);
});`}
    />
  </Shell>
);

// ─── Automation multiplies value ────────────────────────────────────────────

const RunBox = ({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: string;
  color: string;
  children: ReactNode;
}) => (
  <PixelBox style={{ flex: 1, padding: '28px 36px' }}>
    <div style={{ fontSize: 36, color }}>{title}</div>
    <div style={{ marginTop: 12, fontSize: 28, lineHeight: 1.5, color: C.muted }}>{children}</div>
    <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <span style={{ fontFamily: PRESS, fontSize: 56, color }}>{count}</span>
      <span style={{ fontSize: 28 }}>次 / 年</span>
    </div>
  </PixelBox>
);

const Trigger = ({ when, children, color }: { when: string; children: ReactNode; color: string }) => (
  <PixelBox w={4} style={{ height: '100%', boxSizing: 'border-box', padding: '20px 24px' }}>
    <Chip bg={color} size={24}>
      {when}
    </Chip>
    <div style={{ marginTop: 14, fontSize: 28, lineHeight: 1.4 }}>{children}</div>
  </PixelBox>
);

const Automate: Page = () => (
  <Shell ch={CH4} title="寫好的測試，要自動跑才有最大價值">
    <PixelBox bg={C.ink} style={{ padding: '22px 40px', color: C.paper, fontSize: 36 }}>
      測試的價值 = 擋下的 bug <span style={{ color: C.yellow }}>× 被執行的次數</span>
    </PixelBox>
    <div style={{ display: 'flex', gap: 44, marginTop: 40 }}>
      <RunBox title="靠人手動跑" count="≈24" color={C.redDark}>
        想到才跑、上線前跑一次；趕的時候就跳過，漏跑了沒人知道。
      </RunBox>
      <RunBox title="交給 CI 自動跑" count="≈2500" color={C.greenDark}>
        每天約 10 次 push × 250 個工作天，每一次都完整跑，不會累也不會忘。
      </RunBox>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, marginTop: 40 }}>
      <Steps>
        <Step>
          <Pop style={{ height: '100%' }}>
            <Trigger when="commit 前" color={C.green}>單元測試，幾秒內跑完</Trigger>
          </Pop>
        </Step>
        <Step>
          <Pop style={{ height: '100%' }}>
            <Trigger when="開 PR" color={C.blue}>全部跑，紅燈不能 merge</Trigger>
          </Pop>
        </Step>
        <Step>
          <Pop style={{ height: '100%' }}>
            <Trigger when="每天晚上" color={C.purple}>完整 E2E，慢的也跑</Trigger>
          </Pop>
        </Step>
        <Step>
          <Pop style={{ height: '100%' }}>
            <Trigger when="部署之後" color={C.red}>Smoke test 檢查正式站</Trigger>
          </Pop>
        </Step>
      </Steps>
    </div>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════════════════
// CH.05 AGENT 時代
// ═══════════════════════════════════════════════════════════════════════════

const RiskRow = ({ no, children }: { no: string; children: ReactNode }) => (
  <PixelBox w={4} style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
    <span style={{ fontFamily: PRESS, fontSize: 22, color: C.purple }}>{no}</span>
    <span style={{ fontSize: 32, lineHeight: 1.4 }}>{children}</span>
  </PixelBox>
);

// Counts up to 90 in steps of 3.
const AgentShare = () => <>{useSequence(30, 45, 200) * 3}</>;

const AgentEra: Page = () => (
  <Shell ch={CH5} title="九成以上的程式碼，已經不是我們親手打的">
    <div style={{ display: 'flex', gap: 64 }}>
      <PixelBox bg={C.purple} style={{ width: 600, padding: '48px 48px', color: C.paper }}>
        <div style={{ fontFamily: PRESS, fontSize: 112, lineHeight: 1.2 }}>
          <AgentShare />%
        </div>
        <p style={{ margin: '36px 0 0', fontSize: 34, lineHeight: 1.5 }}>
          的程式碼由 Agent 產生。
          <br />
          寫得很快，也錯得很有自信。
        </p>
      </PixelBox>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ fontSize: 28, color: C.muted }}>Agent 常見的三種走偏：</div>
        <Steps>
          <Step>
            <Pop kind="jolt">
              <RiskRow no="01">順手改了沒交代的地方</RiskRow>
            </Pop>
          </Step>
          <Step>
            <Pop kind="jolt" style={{ marginTop: 28 }}>
              <RiskRow no="02">測不到的路徑，直接略過</RiskRow>
            </Pop>
          </Step>
          <Step>
            <Pop kind="jolt" style={{ marginTop: 28 }}>
              <RiskRow no="03">做出來的東西跟規劃不一樣</RiskRow>
            </Pop>
          </Step>
        </Steps>
      </div>
    </div>
    <PixelBox
      bg={C.ink}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '28px 40px',
        color: C.paper,
        fontSize: 36,
        lineHeight: 1.4,
      }}
    >
      測試就是 Agent 必須遵守的規格：<span style={{ color: C.yellow }}>行為有沒有走偏，跑一次就知道。</span>
    </PixelBox>
  </Shell>
);

const TddBox = ({
  label,
  color,
  who,
  on,
  children,
}: {
  label: string;
  color: string;
  who: string;
  on: boolean;
  children: ReactNode;
}) => (
  <PixelBox
    key={on ? 'on' : 'off'}
    className={on ? 'tq-a tq-in' : undefined}
    style={{ flex: 1, padding: '30px 34px', opacity: on ? 1 : 0.45 }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: PRESS, fontSize: 30, color: on ? color : C.sand }}>{label}</span>
      <Chip bg={who === '人' ? C.ink : C.purple} size={24}>
        {who}
      </Chip>
    </div>
    <p style={{ margin: '24px 0 0', fontSize: 30, lineHeight: 1.5 }}>{children}</p>
  </PixelBox>
);

// RED → GREEN → REFACTOR light up in turn.
const Tdd: Page = () => {
  const lit = useSequence(3, 700, 300);
  return (
    <Shell ch={CH5} title="流程 1 · TDD × Agent：人寫測試，Agent 寫實作">
      <div style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
        <TddBox label="RED" color={C.red} who="人" on={lit >= 1}>
          先寫測試，跑一次，確認它真的會失敗。
        </TddBox>
        <ChainArrow />
        <TddBox label="GREEN" color={C.green} who="Agent" on={lit >= 2}>
          實作到測試全部通過為止。
        </TddBox>
        <ChainArrow />
        <TddBox label="REFACTOR" color={C.blue} who="Agent" on={lit >= 3}>
          整理程式碼，測試要一直保持綠燈。
        </TddBox>
      </div>
      <div style={{ marginTop: 56, fontSize: 28, color: C.muted }}>給 Agent 的指令範例</div>
      <PixelBox bg={C.codeBg} style={{ marginTop: 18, padding: '28px 36px', color: C.codeText, fontSize: 32, lineHeight: 1.6 }}>
        讓 GradePolicyTests 全部通過。<span style={{ color: C.yellow }}>不准修改測試檔</span>；
        <br />
        如果你覺得測試寫錯了，先停下來問我。
      </PixelBox>
    </Shell>
  );
};

const SddNode = ({ no, children, color, on }: { no: string; children: ReactNode; color: string; on: boolean }) => (
  <PixelBox
    bg={color}
    w={4}
    className={on ? 'tq-a tq-in' : undefined}
    style={{
      flex: 1,
      visibility: on ? 'visible' : 'hidden',
      padding: '18px 10px',
      textAlign: 'center',
      color: C.paper,
      fontSize: 30,
    }}
  >
    <span style={{ fontFamily: PRESS, fontSize: 18, marginRight: 12, opacity: 0.8 }}>{no}</span>
    {children}
  </PixelBox>
);

const SddArrow = ({ on }: { on: boolean }) => (
  <span style={{ fontFamily: PRESS, fontSize: 22, color: C.muted, visibility: on ? 'visible' : 'hidden' }}>&gt;</span>
);

const GwtRow = ({ k, children }: { k: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 20, fontSize: 30, lineHeight: 1.5 }}>
    <span style={{ color: C.purple, width: 80, flex: 'none' }}>{k}</span>
    <span>{children}</span>
  </div>
);

const MapLine = ({ cond, layer, color }: { cond: string; layer: string; color: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 28,
      padding: '12px 0',
      borderBottom: `3px dashed ${C.sand}`,
    }}
  >
    <span>{cond}</span>
    <Chip bg={color} size={22}>
      {layer}
    </Chip>
  </div>
);

// The five stages appear one after another on entry.
const Sdd: Page = () => {
  const n = useSequence(5, 380, 300);
  return (
    <Shell ch={CH5} title="流程 2 · SDD：從規格一路推到測試">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <SddNode no="1" color={C.purple} on={n >= 1}>規格</SddNode>
        <SddArrow on={n >= 2} />
        <SddNode no="2" color={C.purple} on={n >= 2}>驗收條件</SddNode>
        <SddArrow on={n >= 3} />
        <SddNode no="3" color={C.ink} on={n >= 3}>測試</SddNode>
        <SddArrow on={n >= 4} />
        <SddNode no="4" color={C.blue} on={n >= 4}>實作</SddNode>
        <SddArrow on={n >= 5} />
        <SddNode no="5" color={C.green} on={n >= 5}>驗證</SddNode>
      </div>
      <div style={{ display: 'flex', gap: 48, marginTop: 52 }}>
        <PixelBox style={{ flex: 1, padding: '28px 36px' }}>
          <Chip bg={C.purple} size={24}>
            specs/grade-edit.md
          </Chip>
          <div style={{ marginTop: 22, fontSize: 32 }}>老師只能修改自己授課課程的成績</div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <GwtRow k="假設">王老師只教 MATH101</GwtRow>
            <GwtRow k="當">他修改 ENG201 學生的成績</GwtRow>
            <GwtRow k="那麼">系統回 403，成績不變</GwtRow>
          </div>
        </PixelBox>
        <PixelBox style={{ flex: 1, padding: '28px 36px' }}>
          <div style={{ fontSize: 28, color: C.muted }}>每一條驗收條件，對應一個測試</div>
          <div style={{ marginTop: 10 }}>
            <MapLine cond="本科老師可以改" layer="單元" color={C.green} />
            <MapLine cond="他科老師打 API 回 403" layer="整合" color={C.blue} />
            <MapLine cond="學生查得到新成績" layer="E2E" color={C.red} />
          </div>
          <p style={{ margin: '20px 0 0', fontSize: 24, lineHeight: 1.5, color: C.muted }}>
            規格放在 repo 裡，Agent 每次動工都從這份讀起。
          </p>
        </PixelBox>
      </div>
    </Shell>
  );
};

const PracticeCard = ({ no, title, children }: { no: string; title: string; children: ReactNode }) => (
  <PixelBox style={{ height: '100%', boxSizing: 'border-box', padding: '32px 34px' }}>
    <div style={{ fontFamily: PRESS, fontSize: 22, color: C.purple }}>{no}</div>
    <div style={{ marginTop: 20, fontSize: 36, lineHeight: 1.35 }}>{title}</div>
    <p style={{ margin: '20px 0 0', fontSize: 28, lineHeight: 1.6, color: C.muted }}>{children}</p>
  </PixelBox>
);

const AgentPractices: Page = () => (
  <Shell ch={CH5} title="讓 Agent 被測試管住的三個做法">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 44 }}>
      <Steps>
        <Step>
          <Pop style={{ height: '100%' }}>
            <PracticeCard no="01" title="先上保護網，再讓 Agent 動舊 code">
              重構前先寫特性測試（characterization test），把現在的行為記錄下來。
            </PracticeCard>
          </Pop>
        </Step>
        <Step>
          <Pop style={{ height: '100%' }}>
            <PracticeCard no="02" title="讓 Agent 自己跑測試">
              在 CLAUDE.md 或 AGENTS.md 寫清楚：改完一定要跑 npm test 和 dotnet test，全綠才算完成。
            </PracticeCard>
          </Pop>
        </Step>
        <Step>
          <Pop style={{ height: '100%' }}>
            <PracticeCard no="03" title="CI 是最後一道關卡">
              每次 push 都跑，沒有綠燈就不能 merge，人寫的、Agent 寫的都一樣。
            </PracticeCard>
          </Pop>
        </Step>
      </Steps>
    </div>
    <PixelBox
      bg={C.purple}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 40px', color: C.paper, fontSize: 34 }}
    >
      Agent 可以寫實作，但「什麼才是對的」由測試決定，測試由人把關。
    </PixelBox>
  </Shell>
);

// ─── Dev flow with tests + Agent ────────────────────────────────────────────

const OWNER_COLOR: Record<string, string> = { 人: C.ink, Agent: C.purple, CI: C.green };

const FlowNode = ({ no, who, children }: { no: string; who: string; children: ReactNode }) => (
  <PixelBox w={4} style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: PRESS, fontSize: 22, color: C.muted }}>{no}</span>
      <Chip bg={OWNER_COLOR[who]} size={22}>
        {who}
      </Chip>
    </div>
    <div style={{ marginTop: 14, fontSize: 30, lineHeight: 1.4 }}>{children}</div>
  </PixelBox>
);

const FlowArrow = () => (
  <span style={{ fontFamily: PRESS, fontSize: 22, color: C.muted, alignSelf: 'center' }}>&gt;</span>
);

const FLOW_ROW: CSSProperties = { display: 'flex', gap: 16 };

// One row per step: build (人 + Agent), then ship (CI + 人).
const Workflow: Page = () => (
  <Shell ch={CH5} title="有測試之後：一個需求從開工到上線">
    <Steps>
      <Step>
        <Pop style={FLOW_ROW}>
          <FlowNode no="01" who="人">寫規格和驗收條件</FlowNode>
          <FlowArrow />
          <FlowNode no="02" who="人">寫測試，確認是紅燈</FlowNode>
          <FlowArrow />
          <FlowNode no="03" who="Agent">實作到測試全綠</FlowNode>
          <FlowArrow />
          <FlowNode no="04" who="Agent">本機跑完所有測試</FlowNode>
        </Pop>
      </Step>
      <Step>
        <Pop style={{ ...FLOW_ROW, marginTop: 44 }}>
          <FlowNode no="05" who="CI">開 PR，自動跑三層測試</FlowNode>
          <FlowArrow />
          <FlowNode no="06" who="人">Review 規格和測試</FlowNode>
          <FlowArrow />
          <FlowNode no="07" who="CI">部署，跑 Smoke test</FlowNode>
        </Pop>
      </Step>
    </Steps>
    <PixelBox
      bg={C.purple}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 40px', color: C.paper, fontSize: 34 }}
    >
      人決定什麼是對的，Agent 負責做到，CI 負責每一次都檢查。
    </PixelBox>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════════════════
// CH.06 成果
// ═══════════════════════════════════════════════════════════════════════════

const LoopNode = ({
  no,
  x,
  y,
  children,
  color,
  on = false,
}: {
  no: string;
  x: number;
  y: number;
  children: ReactNode;
  color: string;
  on?: boolean;
}) => (
  <PixelBox
    w={4}
    key={on ? 'on' : 'off'}
    bg={on ? C.sand : C.paper}
    border={on ? C.red : C.ink}
    className={on ? 'tq-a tq-in' : undefined}
    style={{
      position: 'absolute',
      left: x - 160,
      top: y - 50,
      width: 320,
      height: 100,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 20px',
      fontSize: 28,
      lineHeight: 1.3,
    }}
  >
    <span
      style={{
        flex: 'none',
        width: 40,
        height: 40,
        background: color,
        color: C.paper,
        fontFamily: PRESS,
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {no}
    </span>
    <span>{children}</span>
  </PixelBox>
);

const IdeasPanel = () => {
  const ideas = useIdeas();
  const recent = ideas.slice(-4);
  return (
    <PixelBox style={{ width: 520, padding: '28px 32px', alignSelf: 'stretch', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 28, color: C.muted }}>剛剛大家想到的</div>
      <div style={{ marginTop: 10, fontSize: 40 }}>
        <span style={{ fontFamily: PRESS, fontSize: 40, color: C.red }}>{ideas.length}</span> 個情境
      </div>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {recent.length === 0 ? (
          <p style={{ margin: 0, fontSize: 26, lineHeight: 1.5, color: '#a69cb3' }}>
            （互動頁還沒有輸入。這份清單會一直長大。）
          </p>
        ) : (
          recent.map((idea) => <IdeaNote key={idea.id} idea={idea} lines={1} />)
        )}
      </div>
      <p style={{ margin: '22px 0 0', fontSize: 24, lineHeight: 1.5, color: C.muted }}>每一個都是待寫的測試。</p>
    </PixelBox>
  );
};

const ORBIT_STOPS = 24; // 4 hops between each of the 6 nodes

// A star hopping around the loop ellipse (cx 550, cy 340, rx 380, ry 250), starting at the top node.
const OrbitStar = ({ k }: { k: number }) => {
  const t = (2 * Math.PI * k) / ORBIT_STOPS;
  const x = 550 + 380 * Math.sin(t);
  const y = 340 - 250 * Math.cos(t);
  return <Sprite art={STAR} px={8} style={{ position: 'absolute', left: x - 20, top: y - 20 }} />;
};

const Loop: Page = () => {
  const k = useLoopTick(ORBIT_STOPS, 160);
  const node = k < 0 ? -1 : Math.floor(k / (ORBIT_STOPS / 6));
  return (
    <Shell ch={CH6} title="邊界情況一定會漏，所以要讓它變成循環">
      <div style={{ display: 'flex', gap: 56, height: '100%' }}>
        <div style={{ position: 'relative', width: 1100, height: '100%' }}>
          <svg
            width={1100}
            height={700}
            viewBox="0 0 1100 700"
            style={{ position: 'absolute', left: 0, top: 0 }}
            shapeRendering="crispEdges"
          >
            <ellipse cx={550} cy={340} rx={380} ry={250} fill="none" stroke={C.ink} strokeWidth={6} strokeDasharray="18 14" />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 550 - 170,
              top: 340 - 70,
              width: 340,
              textAlign: 'center',
            }}
          >
            <Sprite art={SHIELD} px={9} style={{ margin: '0 auto' }} />
            <div style={{ marginTop: 14, fontSize: 30 }}>測試只會越來越多</div>
          </div>
          {k >= 0 && <OrbitStar k={k} />}
          <LoopNode no="1" x={550} y={90} color={C.purple} on={node === 0}>發想案例</LoopNode>
          <LoopNode no="2" x={880} y={215} color={C.ink} on={node === 1}>寫成測試</LoopNode>
          <LoopNode no="3" x={880} y={465} color={C.blue} on={node === 2}>實作（人或 Agent）</LoopNode>
          <LoopNode no="4" x={550} y={590} color={C.green} on={node === 3}>上線</LoopNode>
          <LoopNode no="5" x={220} y={465} color={C.red} on={node === 4}>發現漏掉的情況</LoopNode>
          <LoopNode no="6" x={220} y={215} color={C.yellow} on={node === 5}>先寫重現測試，再修</LoopNode>
        </div>
        <IdeasPanel />
      </div>
    </Shell>
  );
};

const BaRow = ({
  scene,
  before,
  after,
  head,
}: {
  scene: ReactNode;
  before: ReactNode;
  after: ReactNode;
  head?: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '560px 1fr 1fr',
      gap: 32,
      alignItems: 'center',
      padding: head ? '0 32px 14px' : '20px 32px',
      fontSize: head ? 26 : 30,
      color: head ? C.muted : C.ink,
      background: head ? 'transparent' : C.paper,
      boxShadow: head ? 'none' : ring(C.ink, 4),
      marginBottom: head ? 6 : 18,
    }}
  >
    <span>{scene}</span>
    <span style={{ color: head ? C.muted : C.redDark }}>{before}</span>
    <span style={{ color: head ? C.muted : C.greenDark }}>{after}</span>
  </div>
);

const BeforeAfter: Page = () => (
  <Shell ch={CH6} title="成果：同樣的場景，現在在哪裡被擋下">
    <BaRow head scene="場景" before="以前：誰先發現" after="現在：在哪一步被擋下" />
    <Steps>
      <Step>
        <Pop>
          <BaRow scene="他科老師改得動成績" before="學校承辦打電話來" after="單元測試：權限矩陣" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="選課超收 41 / 40" before="KELLY 接到學校電話" after="整合測試：併發選課" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="全形「８５」存成 0 分" before="學生查成績才發現" after="單元測試：成績格式" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="切換學生，成績登錯人" before="老師期末對帳" after="單元測試：表單重設" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="正式站學分上限失效" before="教務處審核時才發現" after="啟動檢查 + Smoke test" />
        </Pop>
      </Step>
    </Steps>
  </Shell>
);

const DevBeforeAfter: Page = () => (
  <Shell ch={CH6} title="開發日常：有測試前 vs 有測試後">
    <BaRow head scene="情境" before="沒有測試" after="有測試 + 自動化" />
    <Steps>
      <Step>
        <Pop>
          <BaRow scene="改一行舊程式" before="怕改 A 壞 B，乾脆不敢動" after="跑一次測試就知道" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="上線前" before="大家手動點一輪，靠記憶" after="CI 綠燈，人只做人為確認" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="交給 Agent 寫" before="幾百行 diff 只能用眼睛看" after="走偏了，測試馬上變紅燈" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="新人接手" before="規則都在資深同事腦袋裡" after="測試就是看得懂的規格" />
        </Pop>
      </Step>
      <Step>
        <Pop>
          <BaRow scene="修完一個 bug" before="不知道哪天又會回來" after="有重現測試，不會再犯" />
        </Pop>
      </Step>
    </Steps>
  </Shell>
);

const RoadStep = ({ no, children }: { no: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
    <PixelBox
      bg={C.yellow}
      w={4}
      style={{
        width: 72,
        height: 72,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: PRESS,
        fontSize: 26,
      }}
    >
      {no}
    </PixelBox>
    <span style={{ fontSize: 34, lineHeight: 1.4 }}>{children}</span>
  </div>
);

const BurstStar = ({ left, top, delay }: { left: number; top: number; delay: number }) => (
  <Sprite
    art={STAR}
    px={10}
    className="tq-a tq-burst"
    style={{ position: 'absolute', left, top, animationDelay: `${delay}s` }}
  />
);

// Clicking "CONTINUE? > YES" sets off a burst of stars over the GAME CLEAR panel.
const Continue = () => {
  const [bursts, setBursts] = usePageState(0);
  return (
    <>
      <button
        type="button"
        onPointerDown={halt}
        onClick={(e) => {
          halt(e);
          setBursts((n) => n + 1);
        }}
        className="tq-a tq-blink"
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          fontFamily: PRESS,
          fontSize: 22,
          color: C.sand,
        }}
      >
        CONTINUE? &gt; YES
      </button>
      {bursts > 0 && (
        <span key={bursts} style={{ display: 'contents' }}>
          <BurstStar left={70} top={80} delay={0} />
          <BurstStar left={470} top={110} delay={0.15} />
          <BurstStar left={260} top={40} delay={0.3} />
          <BurstStar left={120} top={330} delay={0.2} />
          <BurstStar left={480} top={360} delay={0.05} />
          <BurstStar left={60} top={560} delay={0.35} />
          <BurstStar left={430} top={590} delay={0.1} />
          <BurstStar left={280} top={630} delay={0.25} />
        </span>
      )}
    </>
  );
};

const Clear: Page = () => (
  <Shell ch={CH6} title="從零開始，先做這三件事">
    <div style={{ display: 'flex', gap: 64, height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <Steps>
          <Step>
            <Pop>
              <RoadStep no="1">新的 bug，先補一個重現測試再修</RoadStep>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <RoadStep no="2">先從權限和設定下手：最痛，也最好測</RoadStep>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <RoadStep no="3">接上 CI，每次 push 自動跑</RoadStep>
            </Pop>
          </Step>
          <Step>
            <Pop>
              <RoadStep no="GO">這週每人認領 3 張便利貼，兩週後分享第一個測試</RoadStep>
            </Pop>
          </Step>
        </Steps>
        <PixelBox style={{ marginTop: 'auto', padding: '24px 32px', fontSize: 30, lineHeight: 1.5 }}>
          覆蓋率不是 KPI，<span style={{ color: C.red }}>擋下真正會痛的 bug</span> 才是。
        </PixelBox>
      </div>
      <PixelBox
        bg={C.ink}
        style={{
          position: 'relative',
          width: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.paper,
          gap: 36,
        }}
      >
        <div style={{ fontFamily: PRESS, fontSize: 48, color: C.yellow, lineHeight: 1.4, textAlign: 'center' }}>
          GAME
          <br />
          CLEAR
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
          <Sprite art={HERO} px={10} className="tq-a tq-bob" />
          <Sprite art={HEART} px={8} />
          <Sprite art={HEART} px={8} />
          <Sprite art={HEART} px={8} />
        </div>
        <div style={{ fontSize: 40 }}>Q &amp; A</div>
        <Continue />
      </PixelBox>
    </div>
  </Shell>
);

// ─── Export ────────────────────────────────────────────────────────────────

export const meta: SlideMeta = {
  title: 'TESTING QUEST：軟體測試觀念入門',
  createdAt: '2026-10-25T10:25:09.019Z',
};

export default [
  Cover,
  Route,
  Today,
  HappyPath,
  Coverage,
  Edge,
  HumanError,
  Deploy,
  Cost,
  Brainstorm,
  Compare,
  Turning,
  UnitIntro,
  IntegrationIntro,
  E2EIntro,
  Pyramid,
  Insight,
  Automate,
  UnitVanilla,
  UnitVue,
  UnitDotnet,
  IntegrationFront,
  IntegrationDotnet,
  ConfigCheck,
  E2E,
  AgentEra,
  Tdd,
  Sdd,
  AgentPractices,
  Workflow,
  Loop,
  BeforeAfter,
  DevBeforeAfter,
  Clear,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  // 01 Cover
  `大家好，今天要聊的是測試。
先講清楚，今天不是要大家明天就把覆蓋率衝到八成，而是想讓大家知道：為什麼要測、測什麼、怎麼開始。
例子全部用選課系統來講，學生、老師、管理員三種身分，大家應該都很有感。
（彩蛋：右邊那隻 bug 可以點，點三下會被打倒，可以當開場暖場。）`,
  // 02 Route
  `先看一下今天的故事大綱，一共六段。（勇者會自己走完六站；講到哪一段，點那個節點，勇者就會走過去。）
先看我們現在怎麼測，再看四個真實會遇到的難題，然後講轉捩點、認識三種測試，接著看前後端的實際寫法。
後面會講 Agent 時代為什麼測試變得更重要，最後收在一個可以一直循環的工作流。
聽的時候請大家先在心裡想一個問題，就是下面這句：選課系統有哪些狀況，可以先用測試擋掉？中間有一段互動，到時候會請大家把想到的講出來。`,
  // 03 Today
  `先請大家舉個手：上一次上線之後，被客戶或承辦回報 bug 的請舉手。（停一下，看看現場。）
老實說，我們現在的流程大概就是這樣：改完 code，（按下一步）自己點一點，（按下一步）再請 PM 走一遍 happy path，（按下一步）沒問題就直接上線。
（按下一步）這句話可能有點重，但事實就是這樣：同樣的錯誤一犯再犯、改了 A 又壞了 B，等於是在拿使用者的信任玩火。
（按下一步）使用者不是我們的測試員，他們不會幫我們回報 bug，只會記得這系統又出包了。`,
  // 04 HappyPath
  `再來一個很常見的狀況：自己人測自己的 code，只會走 happy path。
左邊是我們測的樣子：知道正確的操作順序、只輸入合理的資料、按一次就耐心等，而且常常拿管理員帳號一路測到底。
（逐條按，右邊四條）右邊是使用者實際的樣子：照自己的習慣跳著操作、從 Excel 貼上全形數字和空白、網路一慢就再按一次；學生、老師、管理員看到的畫面也都不一樣。
（按下一步）我們是最熟這套系統的人，所以反而最不會用錯它。只測最佳路徑，只代表了：照我們想的方式用，它會動。`,
  // 05 Coverage
  `第一個難題：組合太多。
光是選課系統，就有學生、本科老師、他科老師、管理員四種身分，乘上選課、退選、看成績、改成績四個動作，再乘上開放中跟已截止兩種狀態，一共 32 種組合。表上綠色的是手動測過的，只有 5 格。
（互動：問現場「下一格要測哪個？」，點問號格子就會變成測過，下面的數字和手測分鐘數會跟著加：一格大約三分鐘，全部 32 格要 96 分鐘，而且每次上線都要重來一輪。最後點「他科老師 × 改成績 × 開放中」那格，會翻出紅色的 bug。）
小明這次的改版，他用本科老師的帳號測過，完全沒問題。（按下一步）但他科老師那一格根本沒人想到要測，結果別科的老師也改得動成績。
（按下一步）自己先抓到就沒事；怕的是根本沒想到要測，等錯誤在正式站出現，就變成上線後的修復成本。
這不是誰不認真，是人腦本來就記不住 32 格。`,
  // 06 Edge
  `第二個難題：極端狀況。
選課開放第一分鐘，最後一個名額，兩個人同時按下去，兩個人都成功了。KELLY 那天就接到學校的電話，問這門課怎麼收了 41 個人。
（逐條按，右邊四條）右邊這幾個也都很常見：剛好等於學分上限能不能選、截止前最後一秒才送出、學號開頭的 0 被吃掉、0 學分的課算不算進上限。
這些狀況平常手動測幾乎不會碰到，可是一上線，幾千個學生同時在用，一定會有人碰到。`,
  // 07 HumanError
  `第三個難題：表單上的人為疏失。這裡講的都是正常使用者的正常行為，不是什麼駭客手法。
（按下一步）連點兩次送出，網路一慢大家都會這樣做。（互動：連按卡片上的「送出」，名額會一直被扣下去。）
（按下一步）老師從 Excel 貼上成績，全形數字加空白，被存成 0 分。
（按下一步）切換學生的時候表單沒清空，一按儲存就登錯人，這個最可怕，因為畫面看起來完全正常。
（按下一步）還有我們自己的疏失：小明的手測清單漏了一項，複製貼上之後角色判斷也寫反。這些都很正常，人本來就會漏、會累、會趕。`,
  // 08 Deploy
  `第四個難題跟部署有關，而且最難抓，因為程式碼一行都沒改。
測試站為了方便，把學分上限關掉了。正式站的設定檔沒寫這個值（右邊閃紅框的那一行），（按下一步）程式就讀到預設值 false，學分上限直接失效，學生可以超修。
（按下一步）另一個是時間：測試站主機在台灣時區，正式站主機是 UTC，開放時間沒寫時區，結果晚了 8 小時才開放。學生九點準時來搶課，看到的全部是尚未開放。
小明完全照著部署清單做，問題出在設定。`,
  // 09 Cost
  `這些問題最後的代價是什麼？
不是半夜被叫起來修 bug，而是學生選錯課、成績登錯人，（按下一步）學生跟家長去找學校承辦，（按下一步）承辦再打來找我們，我們被罵到臭頭。
（按下一步）接著還要人工比對資料、一筆一筆補正，再跟客戶談補償。
（按下一步）修 bug 也許一個下午就好，但客戶的信任要很久才補得回來。（愛心會一顆一顆掉。）`,
  // 10 Brainstorm
  `互動時間。剛剛看了四個難題，現在換大家想：除了剛剛那些，選課開放第一天還可能出什麼事？
六個方向給大家參考：角色權限、數值邊界、時間、併發、輸入格式、環境設定。
大家直接喊出來，我打上去。先選分類，再輸入內容按 Enter。點便利貼右上角的 x 可以刪除。
建議花 5 到 8 分鐘。空白欄位會顯示一個提示方向；想不到的話，可以從自己最近修過的 bug 開始想，或故意往最刁鑽的方向想。
（打字時方向鍵不會翻頁；打完按 Esc 離開輸入框，再按下一步。）
（這些便利貼會存在這台電腦的瀏覽器裡，最後循環那一頁會再用到。換場次之前記得按清除，要按兩次確認。）`,
  // 11 Compare
  `來對照一下。這是我事先列的 30 種極端情況，一樣分成六類，每一欄上面是剛剛現場貼了幾張。
（互動：一張一張問「這個剛剛有人想到嗎？」，有的話點那張卡，它會變綠，左下角的「現場命中」會加一。）
大家看看命中數：我們一整群人一起想，還是漏了一大半。而且注意這些狀況是怎麼來的：多半是有人真的踩過坑，或是刻意站在最刁鑽的角度去想，照著規格、照著正常流程測，幾乎碰不到。
反過來，我這份清單一定也漏了你們剛剛想到的。每個人的經驗不一樣，沒有人能一次想完。
（按下一步）就算想到了，每次上線都要手動把這幾十種全部再測一遍嗎？不可能。這就是下一頁的轉捩點。`,
  // 12 Turning
  `轉捩點是順誠講的一句話：這些情境我們每次都靠記憶在測，不如把它們寫成程式，每次 push 都自動跑一遍。
（按下一步）這就是自動化測試的價值，就這三點：不靠記憶，所以不會漏；每次都跑，改 A 的時候 B 也一起檢查；而且跑得比人快，幾百個案例幾秒到幾分鐘就跑完。`,
  // 13 UnitIntro
  `我們正式來認識三種測試。第一種是單元測試。
它只測一小段邏輯，像是一個函式，不碰資料庫，也不連網路，所以跑得非常快，一次跑幾千個也沒問題。
選課系統裡最適合寫單元測試的，就是學分上限計算、誰可以改成績的權限判斷，還有成績格式轉換。剛剛那個 32 格的矩陣，就應該在這一層一格一格寫完。
寫法記住 AAA 三個字：Arrange 準備資料、Act 執行、Assert 驗證結果。`,
  // 14 IntegrationIntro
  `第二種是整合測試。單元測試每個零件各自都沒問題，但接起來不一定會動。
整合測試就是把幾個真的元件接起來，看接縫有沒有問題。例如 API 加上權限 middleware 再加上資料庫。
學生拿自己的 token 去呼叫改成績 API，一定要回 403，這個就是整合測試要測的。前端也一樣，API 回 409 名額已滿的時候，畫面有沒有好好提示。
剛剛 41 / 40 超收的問題，也只有整合測試接上真的資料庫才測得出來。`,
  // 15 E2EIntro
  `第三種是 E2E，端對端測試，就是打開真的瀏覽器，照使用者的方式從頭點到尾。
它最接近真實使用情境，但也最慢、最容易因為畫面小改就壞掉，所以只拿來守最重要的幾條主流程。
像是老師改成績、學生查得到這種跨角色的流程，就很適合用 E2E。
還有一個很實用的用法：部署完跑一支冒煙測試，確認正式站的關鍵設定真的有生效。剛剛小明遇到的狀況，就是靠這個抓。`,
  // 16 Pyramid
  `把三種測試疊起來，就是測試金字塔。
（按下一步）最底層是單元測試，數量最多、最快、最便宜。（按下一步）中間是整合測試。（按下一步）再上面是 E2E。（按下一步）最頂端是人為確認，由人實際操作、憑經驗探索，數量最少、成本最高，專門找機器測不到的手感和體驗問題。
越往上越貴、越慢，但越接近真實的使用者；越往下越快，壞了也越容易找到原因。
所以大部分的測試都寫在底層，最重要的流程才寫 E2E。`,
  // 17 Insight
  `這裡是今天最重要的一個觀念：測試是可以執行的規格。
（逐條按）回頭看剛剛那幾個難題：只測 happy path，就把使用者會做的事寫成案例，案例只會累積、不會忘記；組合太多，就把權限矩陣一格一格寫成單元測試，規格就是規則；極端狀況，就事先把邊界值和併發列出來，最大程度減少意外；人為疏失，就交給機器，機器不會累，每次都完整跑一遍；部署設定，就讓設定缺漏的時候程式直接啟動失敗，再加上 smoke test。
（按下一步）最後一條是日常的小疏失：打錯字、null 沒處理、少一多一、條件寫反、改 A 壞 B。這些最常見，用大量的單元測試覆蓋，每次 push 當場抓到。
最右邊那欄是誰來負責：每一個難題，都有負責處理它的那一層。簡單講，基本的大量寫，進階的挑關鍵寫。
（按下一步）最後這句請大家記住：測試不是為了避免犯錯，人一定會犯錯；測試是為了避免一直犯一樣的錯。錯一次，寫成測試，同一個錯就再也不會溜到正式站。`,
  // 18 Automate
  `進到程式碼之前，先講最關鍵的一點：測試要自動跑，價值才會放大。
測試的價值，等於它擋下的 bug，乘上它被執行的次數。寫了不跑，就跟沒寫一樣。
左邊是靠人手動跑：想到才跑、上線前跑一次，一年大概二十幾次；趕的時候就跳過，漏跑了也沒人知道。
右邊是交給 CI：每天十次 push，一年兩百五十個工作天，就是兩千五百次，每一次都完整跑，不會累也不會忘。同一份測試，價值差了一百倍。
（逐張按）實際上分四個時間點跑：commit 前跑單元測試，幾秒就好；開 PR 全部跑，紅燈不能 merge；每天晚上跑完整的 E2E，比較慢的也放這裡；部署之後跑 smoke test，確認正式站設定真的生效。`,
  // 19 UnitVanilla
  `接下來是實戰，先從 Vanilla JS 開始。工具用 Vitest，設定 globals 之後，test 和 expect 不用另外 import。
test.each 這個寫法很適合邊界值：一行就是一個案例，整張表看起來就是一份規格。
第二組是成績輸入的轉換：半形、全形、前後空白都要轉成 85；空字串、超過 100、負數都要回 null。
之後想到新的邊界，加一行就好，不用重寫整個測試。
（互動：點左邊的「模擬有人改壞」。假設有人把學分判斷的小於等於改成小於，綠色徽章馬上變成 1 FAILED，程式碼裡失敗的那一行也會閃紅框。這就是改 A 壞 B 被當場擋下的樣子。再點「還原」恢復。）`,
  // 20 UnitVue
  `Vue 的部分用 Vue Test Utils。
第一個測試處理切換學生的殘留問題：先輸入 85，換成 B 同學，欄位必須是空的。
第二個測試處理連點：把 save 做成一個永遠不 resolve 的 Promise，模擬網路很慢的狀態，連送兩次，只能呼叫一次，而且按鈕要是停用的。
剛剛表單那頁的兩個問題，在這裡就被擋下了。`,
  // 21 UnitDotnet
  `後端用 xUnit。Theory 加上 InlineData，就是 C# 版本的 test.each。
四行 InlineData 就是權限矩陣的四格：本科老師可以改、他科老師不行、學生不行、管理員可以。
小明那個 bug，就是少了第二行。補上之後，以後誰改到權限邏輯，這一格都會一直盯著。
右邊註解標了 Arrange、Act、Assert，就是剛剛講的 AAA。`,
  // 22 IntegrationFront
  `前端的整合測試，重點在 API 出錯的時候，畫面有沒有講人話。
上面是共用的 MSW 設定，它會攔截 fetch，假裝後端回 409 名額已滿，或 403 沒有權限。
左邊是 Vanilla JS 的選課按鈕，按下去之後，訊息區要顯示名額已滿。右邊是 Vue 的成績表單，送出之後要提示沒有權限。
重點是使用者看到的是一句聽得懂的話，而不是一片空白或 undefined。`,
  // 23 IntegrationDotnet
  `後端的整合測試用 WebApplicationFactory，它會在測試裡把整個 ASP.NET Core 應用程式跑起來，真的打 API。
CreateClientAs 是我們自己包的小工具，用假的身分驗證，產生指定身分的 client。
第一個測試：學生改成績要回 403。第二個是併發：41 個學生同時選一門 40 人的課，只能有 40 個成功。
提醒一下，併發測試一定要接真的資料庫，例如用 Testcontainers 起一個 SQL Server。記憶體裡的假資料庫沒有鎖，測了也是白測。`,
  // 24 ConfigCheck
  `部署設定也可以測，有兩招。
第一招在 Program.cs：把設定綁成強型別的 Options，標上 Required，再加 ValidateOnStart。只要少設定一項，應用程式就直接啟動失敗，不會帶著錯的設定默默上線。
第二招是直接寫一個測試，讀正式站的設定檔，確認學分上限是開著的。這個測試放進 CI，有人改設定檔就會被擋下。
時間設定一律帶時區。部署完再跑一支 smoke test 確認，這樣小明那個狀況就不會再發生。`,
  // 25 E2E
  `最後是 E2E，用 Playwright。
第一個測試是跨角色的流程：老師登入、改成績、看到已儲存，再換學生登入，查得到 88 分。
第二個測試：學生直接打開改成績的網址，要被導到 403。
loginAs 是我們包的小工具。E2E 只看畫面，所以前端用 Vanilla 還是 Vue 寫的都一樣能測。
選器盡量用 getByRole、getByLabel 這種使用者看得到的東西，畫面改版的時候比較不容易壞。`,
  // 26 AgentEra
  `接下來講今天的另一個重點。現在九成以上的程式碼都是 Agent 產生的。
Agent 寫得很快，但它錯的時候也很有自信。
（逐條按）它可能順手改了你沒交代的地方、測不到的路徑直接略過，或是做出來的東西跟規劃不一樣，而且講得頭頭是道。
code review 看幾百行 diff 很容易漏，但測試不會。測試就是 Agent 必須遵守的規格，行為有沒有走偏，跑一次就知道。`,
  // 27 Tdd
  `第一種跟 Agent 合作的流程是 TDD。
分工很清楚：人負責寫測試，先跑一次確認它真的會失敗；Agent 負責實作，做到全部通過；接著 Agent 可以重構，但測試要一直維持綠燈。
下面這段指令很重要：不准修改測試檔。不然 Agent 有時候會為了讓測試通過，直接去改測試。
測試是人訂的規格，Agent 只負責去達成它。`,
  // 28 Sdd
  `第二種是 SDD，規格驅動開發。
先寫規格，再從規格整理出驗收條件，每一條驗收條件變成一個測試，然後才讓 Agent 實作，最後跑測試驗證。
左邊是一份規格的例子，用「假設、當、那麼」的格式寫，主管和 PM 也看得懂。
右邊是驗收條件跟測試的對應：本科老師可以改，寫單元測試；他科老師打 API 回 403，寫整合測試；學生查得到新成績，寫 E2E。
規格放在 repo 裡，Agent 每次動工都從這份讀起，就不會偏離規劃。`,
  // 29 AgentPractices
  `還有三個實用的做法。
（按下一步）第一，要讓 Agent 動舊 code 之前，先寫特性測試，把現在的行為記錄下來。這樣它改壞了，馬上就知道。
（按下一步）第二，讓 Agent 自己跑測試。在 CLAUDE.md 或 AGENTS.md 寫清楚，改完一定要跑測試，全綠才算完成。
（按下一步）第三，CI 是最後一道關卡，沒有綠燈就不能 merge，人寫的跟 Agent 寫的都一樣。
總結一句：Agent 可以寫實作，但什麼才是對的，由測試決定，而測試由人把關。`,
  // 30 Workflow
  `把前面講的串起來，有測試之後，一個需求從開工到上線會長這樣。
（按下一步）第一排是開發：人先寫規格和驗收條件，再把驗收條件寫成測試，跑一次確認是紅燈。接著交給 Agent 實作到全綠，Agent 自己在本機把所有測試跑完才算完成。
（按下一步）第二排是上線：開 PR，CI 自動跑單元、整合、E2E 三層測試。人做 review 的時候，重點不是逐行看 Agent 的 diff，而是看規格和測試有沒有寫對。合併之後部署，自動跑 Smoke test。
上線後還是出錯怎麼辦？下一頁會講。
分工就是底下這句：人決定什麼是對的，Agent 負責做到，CI 負責每一次都檢查。`,
  // 31 Loop
  `再厲害的發想，邊界情況還是一定會漏。所以重點不是一次想完，而是讓它變成一個循環。
發想案例、寫成測試、實作、上線。上線後發現漏掉的情況，第一件事不是馬上修，而是先寫一個能重現問題的測試，看它變紅燈，再修到綠燈。
這樣同一個 bug 就永遠不會回來，而且新想到的情況也會補回發想清單。
右邊就是剛剛大家想到的情境，每一個都是待寫的測試。這份清單會一直長大，測試也會越來越多。`,
  // 32 BeforeAfter
  `最後看成果。回到一開始那五個場景：
（逐條按）他科老師改成績，以前是學校承辦打電話來我們才知道，現在單元測試的權限矩陣會擋下來。
超收，以前是 KELLY 接到學校電話才知道，現在有併發的整合測試。
全形分數，以前是學生查成績才發現，現在有成績格式的單元測試。
登錯人，以前要等老師期末對帳，現在有表單重設的單元測試。
設定缺漏，以前是教務處審核才發現，現在應用程式一啟動就會報錯，部署完還有 smoke test。
差別就在：問題是被客戶發現，還是被我們自己先擋下來。`,
  // 33 DevBeforeAfter
  `除了 bug 被擋下，開發的日常也不一樣了。
（逐條按）改一行舊程式：以前怕改 A 壞 B，乾脆不敢動；現在跑一次測試就知道。
上線前：以前大家手動點一輪，靠記憶；現在 CI 綠燈就能上，人只要花時間做機器做不到的人為確認。
交給 Agent 寫：以前幾百行 diff 只能用眼睛看；現在 Agent 一走偏，測試馬上變紅燈。
新人接手：以前規則都在資深同事的腦袋裡；現在測試就是一份看得懂、跑得動的規格。
修完一個 bug：以前不知道哪天又會回來；現在有重現測試，同一個 bug 不會再犯。`,
  // 34 Clear
  `我們現在完全沒有測試，所以不用一次到位。先做這三件事就好：
（按下一步）第一，以後遇到新的 bug，先補一個重現測試再修。
（按下一步）第二，先從權限和設定下手，這兩塊出事最痛，也最好寫測試。
（按下一步）第三，接上 CI，每次 push 都自動跑。
（按下一步）最後是具體的下一步：這週每個人從剛剛的便利貼認領 3 張，寫成測試，兩週後的會議上分享第一個測試。
最後提醒一下，覆蓋率不是 KPI，能擋下真正會痛的 bug 才是重點。
以上，謝謝大家，接下來開放提問。（點右下的「CONTINUE? > YES」會放星星煙火。）`,
];
