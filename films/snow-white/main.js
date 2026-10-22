// SNOW WHITE — 80s Cel Anime. One timeline (data/timeline.json, built
// from the measured voice durations) drives picture, score and subs.
import { canvas, W, H } from './cel.js';
import { makePost } from './post.js';
import { PAL } from './pal.js';
import { head, dwarf, manBust } from './chars.js';
import * as BG from './bg.js';
import * as S1 from './scenes.js';
import * as S2 from './scenes2.js';
import { hud, subSpans } from './hud.js';

const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
const [ovc, ov] = canvas(W, H);

await document.fonts.load('italic 900 100px Kanit'); await document.fonts.load('italic 800 100px Kanit');
await document.fonts.load('400 44px "Dela Gothic One"');
await document.fonts.load('600 54px "Barlow SC"'); await document.fonts.load('700 40px "Barlow SC"');

const LAYOUT = await (await fetch('data/timeline.json')).json();
const SCRIPT = await (await fetch('data/script.json')).json();
const vi = Object.fromEntries(SCRIPT.map(l => [l.id, l.vi]));
const DUR = LAYOUT.dur;
const lineMap = Object.fromEntries(LAYOUT.lines.map(l => [l.id, l]));
const L = {
  lineAt(t, id) { const l = lineMap[id]; if (!l) return -1; if (t < l.t) return -1; if (t > l.t + l.dur) return 2; return (t - l.t) / l.dur; },
  absTime(id, f = 0) { const l = lineMap[id]; return l ? l.t + l.dur * f : 0; },
  endOf(id) { const l = lineMap[id]; return l ? l.t + l.dur : 0; },
};
const SPANS = subSpans(LAYOUT.lines.map(l => ({ ...l, vi: vi[l.id] })));

// —— plates, painted once ——
const A = {};
{
  A.dark = BG.gradientPlate([[0, '#0d0b26'], [.6, '#171238'], [1, '#0a0820']]);
  A.winter = BG.winterWindow();
  A.chamber = BG.chamber();
  A.forestSkyDusk = { c: BG.forestSky('dusk') };
  A.forestSkyDay = { c: BG.forestSky('day') };
  A.fFar = BG.forestLayer(3200, 880, '#4a3a52', 61, 260, 520, .2);
  A.fMid = BG.forestLayer(3200, 940, '#33222e', 71, 340, 700, .1);
  A.fNear = BG.forestLayer(3200, 1020, '#1a1016', 83, 460, 900, 0);
  A.fFrame = BG.forestFrame();
  A.cottageExt = BG.cottageExt('dusk');
  A.cottageGold = BG.cottageExt('gold');
  A.cottageInt = BG.cottageInt();
  A.hillSnow = BG.coffinHill('snow');
  A.hillBlossom = BG.coffinHill('blossom');
  A.hillGold = BG.coffinHill('gold');
  A.hillStar = BG.coffinHill('star');
  A.hall = BG.hall();
}
const SHOT_FN = { title: S1.title, wish: S1.wish, mirror: S1.mirror, huntsman: S1.huntsman, cottage: S1.cottage, dwarfs: S1.dwarfs,
  visits: S2.visits, apple: S2.apple, coffin: S2.coffin, prince: S2.prince, wedding: S2.wedding, ending: S2.ending };
const shotAt = t => LAYOUT.shots.find(s => t >= s.t0 && t < s.t1) || LAYOUT.shots[LAYOUT.shots.length - 1];

// tracking-noise beats: at the visits scene head and before visits 2 and 3
const TRACK_AT = [LAYOUT.shots.find(s => s.name === 'visits').t0, L.absTime('n16', 0) - .35, L.absTime('n17', 0) - .35];
function trackAt(t) {
  for (const t0 of TRACK_AT) if (t >= t0 && t < t0 + 8 / 24) return 1 - .5 * ((t - t0) * 24 / 8);
  return 0;
}

function modelSheet() {
  g.fillStyle = '#2a2438'; g.fillRect(0, 0, W, H);
  const P = PAL.day, label = (x, y, s) => { g.font = '700 30px "Barlow SC"'; g.fillStyle = '#ffe9a0'; g.textAlign = 'center'; g.fillText(s, x, y); };
  g.save(); g.translate(300, 330); g.scale(1.5, 1.5); head(g, P, { chara: 'snow', view: 'front', expr: 'gentle', bust: 'snow' }); g.restore(); label(300, 660, 'SNOW · FRONT');
  g.save(); g.translate(760, 330); g.scale(1.5, 1.5); head(g, P, { chara: 'snow', view: 'q', expr: 'smile', bust: 'snow' }); g.restore(); label(760, 660, 'SNOW · 3/4');
  g.save(); g.translate(1240, 330); g.scale(1.5, 1.5); head(g, { ...PAL.chamber, skin: PAL.chamber.skinQ }, { chara: 'queen', view: 'q', expr: 'proud', crown: true, collar: true, bust: 'queen' }); g.restore(); label(1240, 660, 'QUEEN · 3/4');
  g.save(); g.translate(1700, 330); g.scale(1.5, 1.5); head(g, P, { chara: 'snow', view: 'front', expr: 'sleep', bust: null }); g.restore(); label(1700, 660, 'SNOW · SLEEP');
  for (let i = 0; i < 3; i++) { g.save(); g.translate(300 + i * 240, 880); g.scale(1.25, 1.25); dwarf(g, P, i * 2, {}); g.restore(); }
  label(540, 1050, 'DWARFS');
  g.save(); g.translate(1150, 830); g.scale(1.35, 1.35); manBust(g, P, { garment: P.jerkin, cap: P.jerkin, expr: 'sad', view: 'q' }); g.restore(); label(1150, 1050, 'HUNTSMAN');
  g.save(); g.translate(1620, 830); g.scale(1.35, 1.35); manBust(g, P, { garment: P.tunic, circlet: true, expr: 'joy', view: 'q', cape: true }); g.restore(); label(1620, 1050, 'PRINCE');
}

function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const fr = Math.round(t * 24);
  let over = {};
  if (qs.get('test') === 'model') modelSheet();
  else {
    const st = shotAt(t);
    const fn = SHOT_FN[qs.get('shot') || st.name];
    if (fn) over = fn({ t, lt: t - st.t0, u: (t - st.t0) / (st.t1 - st.t0), t0: st.t0, t1: st.t1, g, e, A, L }) || {};
  }
  if (qs.get('nosub') || qs.get('test')) ov.clearRect(0, 0, W, H); else hud(ov, t, SPANS, DUR);
  const power = t < .7 ? Math.min(1, t / .6) : t > DUR - .9 ? Math.max(0, (DUR - t) / .9) : 1;
  post.render(sc, gc, fr, ovc, qs.get('raw') ? { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 }
    : { power, track: trackAt(t), ...over, ...(qs.get('test') ? { power: 1, track: 0 } : {}) });
}
// sound events for the mixer
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('crton', .02); add('brass', 1.15, { v: 1 }); add('glint', 1.95);
  add('needle', L.absTime('n02', .3));
  add('mirror', L.absTime('n06', .45)); add('mirror', L.absTime('n07', .5));
  add('knife', L.absTime('n09', .12)); add('run', L.absTime('n10', .1), { d: 3.4 });
  add('door', L.absTime('n11', .05)); add('knock', L.absTime('n15', .8)); add('knock', L.absTime('n16', 0)); add('knock', L.absTime('n17', 0));
  add('snip', L.absTime('n16', .93)); add('comb', L.absTime('n17', .9));
  add('bite', L.absTime('n19', .8)); add('thud', L.absTime('n19', .84));
  add('stumble', L.absTime('n23', .34)); add('wake', L.absTime('n24', .05));
  add('crack', L.absTime('n25', .62)); add('bells', L.absTime('n25', .1), { d: 2.2 });
  add('crtoff', DUR - .85);
  return ev.sort((a, b) => a.t - b.t);
}
window.EV = events();
window.render = render; window.DUR = DUR;
// every text on screen, for the read checker: subtitles (speech-timed)
// plus the two chrome cards
window.TEXTS = t => {
  const out = [];
  const v = SPANS.find(s => t >= s.a && t < s.b);
  if (v) out.push({ id: 'sub_' + v.id, text: v.vi, x0: 180, y0: H - 190, x1: W - 180, y1: H - 40, speech: [v.t, v.t + v.dur] });
  const st = shotAt(t);
  if (st.name === 'title' && t - st.t0 > .55) out.push({ id: 'titlecard', text: 'SNOW WHITE — AND THE SEVEN DWARFS', x0: 300, y0: 300, x1: 1620, y1: 680 });
  if (st.name === 'ending' && t > DUR - 4.6) out.push({ id: 'theend', text: 'THE END', x0: 500, y0: 220, x1: 1420, y1: 440 });
  return out;
};
render(parseFloat(qs.get('t') ?? '30'));
window.READY = true;
