// Scenes 1–6 for SNOW WHITE. Each shot is a pure function of time:
// {t, lt, u, g, e, A, L} → optional CRT overrides. Characters step on
// twos/threes; camera and weather move on ones.
import { W, H, cel, path, poly, line, vgrad, airbrush, rgba, mix, TAU, LWK, hash } from './cel.js';
import { PAL } from './pal.js';
import { head, dwarf, manBust, mirrorFace } from './chars.js';
import { fall, flare, shimmer, lamp } from './fx.js';

export const q12 = t => Math.floor(t * 12 + 1e-6) / 12;
export const q8 = t => Math.floor(t * 8 + 1e-6) / 8;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (lt, a, b) => clamp((lt - a) / (b - a));
export const ease = u => u * u * (3 - 2 * u);

// chrome title letters (heavy italic, gradient sky→white→violet→pink→gold)
export function chromeText(g, e, text, cx, cy, size, flick = 1) {
  g.save(); g.font = `italic 900 ${size}px Kanit`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const grad = g.createLinearGradient(0, cy - size * .55, 0, cy + size * .55);
  grad.addColorStop(0, '#7ab2e8'); grad.addColorStop(.38, '#eaf6ff'); grad.addColorStop(.5, '#fdfdff');
  grad.addColorStop(.56, '#8a6ad8'); grad.addColorStop(.78, '#e87ab2'); grad.addColorStop(1, '#e8b24e');
  g.lineJoin = 'round'; g.strokeStyle = '#160a2e'; g.lineWidth = size * .14; g.strokeText(text, cx, cy);
  g.fillStyle = grad; g.fillText(text, cx, cy);
  g.restore();
  if (e) { e.save(); e.font = `italic 900 ${size}px Kanit`; e.textAlign = 'center'; e.textBaseline = 'middle';
    e.fillStyle = 'rgba(190,140,255,.5)'; e.fillText(text, cx, cy); e.restore(); }
}
// a small full figure of Snow White (dress triangle + head), for wide shots
export function snowFigure(g, P, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const run = o.run ? Math.sin(q12(o.ph || 0) * TAU * 2) : 0;
  cel(g, [[-30, -60], [30, -60], [52, 66 + (o.run ? Math.abs(run) * 6 : 0)], [16, 66], [0, 30], [-16, 66], [-52, 66 + (o.run ? Math.abs(run) * 6 : 0)]], { f: P.skirt.f, s: P.skirt.s, l: P.skirt.l, lw: 2 });
  cel(g, [[-30, -108], [30, -108], [34, -56], [-34, -56]], { f: P.dress.f, s: P.dress.s, l: P.dress.l, lw: 2 });
  cel(g, poly([[-34, -64], [34, -64], [34, -52], [-34, -52]]), { f: P.sash.f, s: P.sash.s, l: P.sash.l, lw: 1.4 });
  g.save(); g.translate(0, -128); g.scale(.62, .62);
  head(g, P, { chara: 'snow', view: o.view || 'q', expr: o.expr || 'gentle', ph: o.ph || 0, bust: null, E: { shoulders: 0 } });
  g.restore(); g.restore();
}
export function drawPlate(g, e, P_, x = 0, y = 0) { g.drawImage(P_.c, x, y); if (e && P_.e) e.drawImage(P_.e, x, y); }

// ——— 1 · title ———
export function title(S) {
  const { g, e, lt, A } = S;
  drawPlate(g, e, A.dark);
  airbrush(g, 960, 470, 700, 300, '#241a4e', .8);
  const P = PAL.star;
  // a small snowfall behind the letters
  fall(g, S.t, 70, { col: '#dfe8ff', rMax: 2.6, speed: 26, alpha: .5, seed: 8 });
  g.save(); g.font = '400 44px "Dela Gothic One"'; g.textAlign = 'center'; g.fillStyle = '#c8b8f0';
  g.globalAlpha = seg(lt, .9, 1.6); g.fillText('シラユキヒメ', 960, 316); g.restore();
  const on = q12(lt) > .55 ? 1 : 0;   // letters flicker on at 12 fps
  if (lt > .55) { g.save(); g.globalAlpha = on * seg(lt, .55, 1.1); chromeText(g, e, 'SNOW WHITE', 960, 500, 208); g.restore(); }
  const sweep = seg(lt, 1.15, 2.1);
  if (sweep > 0 && sweep < 1) { g.save(); g.globalAlpha = .5 * (1 - sweep); g.fillStyle = '#fff'; g.fillRect(300 + sweep * 1320, 380, 26, 250); g.restore(); }
  if (lt > 1.9 && lt < 2.15) flare(e, 1330, 408, 1.1, '#ffe9b0');
  g.save(); g.font = '600 40px "Barlow SC"'; g.textAlign = 'center'; g.fillStyle = '#f4e8c8';
  g.globalAlpha = seg(lt, 2.2, 3); g.fillText('A N D   T H E   S E V E N   D W A R F S', 960, 640); g.restore();
  return {};
}

// ——— 2 · the wish ———
export function wish(S) {
  const { g, e, lt, A, L } = S, P = PAL.winter;
  drawPlate(g, e, A.winter);
  // snowfall outside the window only
  g.save(); g.beginPath(); g.rect(700, 90, 560, 760); g.clip();
  fall(g, S.t, 130, { col: '#ffffff', speed: 60, alpha: .9, seed: 5 });
  g.restore();
  // the first queen seated left, sewing; bust + head turned to the window light
  g.save(); g.translate(472, 588); g.scale(1.72, 1.72);
  head(g, { ...P, skin: P.skinQ }, { chara: 'queen', view: 'q', expr: 'gentle', bust: 'q1', hairPal: P.hairBrown, look: [.2, .35], ph: q12(lt) });
  g.restore();
  // her hands + needle at the sill (simple cel shapes)
  const prick = L.lineAt(S.t, 'n02');
  g.save(); g.translate(430 + 150, 560 + 330);
  cel(g, [[-70, 0], [10, -16], [58, 6], [20, 26], [-50, 22]], { f: P.blouse.f, s: P.blouse.s, l: P.blouse.l, lw: 2 });
  cel(g, [[-30, 8], [44, -6], [52, 2], [-22, 18]], { f: P.skinQ.f, s: P.skinQ.s, l: P.skinQ.l, lw: 1.8 });
  line(g, [[44, -6], [86, -26]], '#c8ccd4', 2.4);
  g.restore();
  if (prick > .25) flare(e, 430 + 150 + 86, 560 + 330 - 26, .55, '#eaf4ff');
  // three drops of blood on the snow below the window (the wish made visible)
  const d = seg(prick, .3, .9);
  if (d > 0) {
    g.save(); g.fillStyle = PAL.day.sash.f;
    for (let i = 0; i < 3; i++) { g.globalAlpha = clamp(d * 3 - i); g.beginPath(); g.ellipse(880 + i * 52, 976 - (i % 2) * 16, 9, 12, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  return { expo: 1.02 };
}

// ——— 3 · the mirror ———
export function mirror(S) {
  const { g, e, lt, A, L } = S, P = PAL.chamber;
  drawPlate(g, e, A.chamber);
  // darken the glass so the face inside it can read against the glow
  g.save(); g.fillStyle = 'rgba(6,12,30,.42)'; g.beginPath(); g.ellipse(1150, 430, 208, 312, 0, 0, TAU); g.fill(); g.restore();
  shimmer(g, 932, 108, 436, 644, S.t);
  // the mirror speaks during the second halves of n06 / n07
  const speaking = (L.lineAt(S.t, 'n06') > .45 && L.lineAt(S.t, 'n06') < 1) || L.lineAt(S.t, 'n07') > .5;
  mirrorFace(g, 1150, 430, 3.1, speaking ? .8 + Math.sin(S.t * 9) * .15 : 0);
  if (speaking) airbrush(e, 1150, 430, 210, 300, '#6ac2e8', .5);
  // the queen, large in the left foreground, turned to the mirror
  g.save(); g.translate(430, 640); g.scale(1.9, 1.9);
  head(g, { ...P, skin: P.skinQ }, { chara: 'queen', view: 'q', expr: L.lineAt(S.t, 'n07') > .5 ? 'resolve' : 'proud', crown: true, collar: true, bust: 'queen', ph: q12(lt) });
  g.restore();
  lamp(g, e, 240, 486, 60, '#ffb347', .8); lamp(g, e, 1680, 486, 60, '#ffb347', .8);
  return {};
}

// ——— 4 · the huntsman ———
export function huntsman(S) {
  const { g, e, lt, A, L } = S, P = PAL.dusk;
  const dur = S.t1 - S.t0;
  if (lt > dur - 2.6) {   // insert: the boar's heart in its box
    g.fillStyle = '#0e0c14'; g.fillRect(0, 0, W, H);
    airbrush(g, 960, 520, 520, 330, '#3a2430', .8);
    g.save(); g.translate(960, 560);
    cel(g, [[-190, -60], [190, -60], [220, 130], [-220, 130]], { f: P.woodDark.f, s: P.woodDark.s, l: P.woodDark.l, lw: 3 });
    cel(g, [[-190, -60], [0, -130], [190, -60], [170, -34], [0, -92], [-170, -34]], { f: P.wood.f, s: P.wood.s, l: P.woodDark.l, lw: 3 });
    const beat = 1 + Math.sin(S.t * 5.2) * .04;
    g.save(); g.scale(beat, beat);
    cel(g, [[0, 66], [-58, 6], [-52, -38], [-18, -52], [0, -30], [18, -52], [52, -38], [58, 6]], { f: '#8c1f28', s: '#5c1218', h: '#c85a5e', ho: [6, 6], l: '#38060c', lw: 3 });
    g.restore(); g.restore();
    flare(e, 1150, 420, .6, '#ffd9c8');
    return { expo: .96 };
  }
  g.drawImage(A.forestSkyDusk.c, 0, 0);
  const run = clamp(lt / 3.2);   // she runs once spared
  const sp = ease(run) * 150;
  g.drawImage(A.fFar, -sp * .3, 0); g.drawImage(A.fMid, -sp * .65, 0);
  // the huntsman, left, knife half-raised then lowered
  const raise = L.lineAt(S.t, 'n09');
  g.save(); g.translate(400, 600); g.scale(1.7, 1.7);
  manBust(g, P, { garment: P.jerkin, cap: P.jerkin, expr: raise > .1 && raise < .55 ? 'resolve' : 'sad', view: 'q' });
  g.save(); g.translate(104, 96); g.rotate(raise > .1 && raise < .55 ? -.9 : -.55);
  cel(g, poly([[0, 0], [64, -10], [66, -2], [2, 8]]), { f: '#c8ccd4', s: '#8a8f9a', l: '#3c4048', lw: 2 });
  cel(g, poly([[-16, -2], [2, -2], [2, 10], [-16, 10]]), { f: P.woodDark.f, l: P.woodDark.l, lw: 2 });
  g.restore(); g.restore();
  // Snow White small at right, kneeling → running
  if (run <= 0) { g.save(); g.translate(1290, 800); snowFigure(g, P, 0, 0, 1.5, { expr: 'fear', view: 'front' }); g.restore(); }
  else snowFigure(g, P, 1150 + ease(run) * 620, 800 + Math.abs(Math.sin(q12(lt) * TAU * 2)) * -8, 1.5, { run: true, ph: lt * 2, expr: 'fear' });
  // a foreground frame of big pines at the two edges only — a full
  // near layer would swallow the figures whole
  g.drawImage(A.fFrame, 0, 0, 760, 1080, -40 - sp * .2, 60, 760, 1080);
  g.drawImage(A.fFrame, 2440, 0, 760, 1080, 1200 - sp * .2, 60, 760, 1080);
  return {};
}

// ——— 5 · the cottage ———
export function cottage(S) {
  const { g, e, lt, A, L } = S, dur = S.t1 - S.t0;
  if (lt < dur * .38) {   // exterior at dusk: she finds the house
    const P = PAL.dusk;
    drawPlate(g, e, A.cottageExt);
    snowFigure(g, PAL.dusk, 830, 838, .92, { expr: 'wonder' });
    const open = seg(lt, dur * .3, dur * .38);
    if (open > 0) { g.save(); g.globalAlpha = open; g.fillStyle = '#ffca7a'; g.fillRect(938, 656, 64, 144); g.restore(); airbrush(e, 970, 730, 60, 90, '#ff9a3c', open * .8); }
    return {};
  }
  const P = PAL.cottage;
  drawPlate(g, e, A.cottageInt);
  const lt2 = lt - dur * .38;
  if (L.lineAt(S.t, 'n12') < 0) {   // the table of seven settings
    g.save(); g.translate(560, 800);
    cel(g, [[-420, 60], [420, 60], [500, 210], [-500, 210]], { f: P.wood.f, s: P.wood.s, l: P.woodDark.l, lw: 3 });
    for (let i = 0; i < 7; i++) {
      const x = -330 + i * 110, y = 96 + (i % 2) * 16;
      g.fillStyle = '#f2ecd8'; g.beginPath(); g.ellipse(x, y, 34, 13, 0, 0, TAU); g.fill();
      g.strokeStyle = '#9a8a68'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#d8cfb2'; g.fillRect(x + 44, y - 14, 15, 26);
      cel(g, poly([[x - 52, y - 8], [x - 46, y - 8], [x - 49, y + 14]]), { f: '#c8ccd4', l: '#6a6f7a', lw: 1.4 });
    }
    g.restore();
    g.save(); g.translate(1330, 660); g.scale(1.15, 1.15);
    head(g, P, { chara: 'snow', view: 'q', expr: 'wonder', bust: 'snow', look: [-.2, .3], ph: q12(lt2) });
    g.restore();
    return {};
  }
  // asleep across the seventh bed (right end of the row)
  g.save(); g.translate(1722, 596);
  cel(g, [[-104, 26], [104, 26], [110, 66], [-110, 66]], { f: '#a03a30', s: '#701f18', l: '#4c100a', lw: 2.4 });
  g.save(); g.translate(-58, 8); g.rotate(-.32); g.scale(.64, .64);
  head(g, P, { chara: 'snow', view: 'front', expr: 'sleep', bust: null, blush: .3 });
  g.restore(); g.restore();
  lamp(g, e, 240, 720, 130, '#ff8a3c', .55 + Math.sin(S.t * 7.3) * .06);
  return {};
}

// ——— 6 · the dwarfs ———
export function dwarfs(S) {
  const { g, e, lt, A, L } = S, dur = S.t1 - S.t0;
  if (lt > dur - 5.2) {   // the march to the mine at dawn
    const P = PAL.day;
    g.drawImage(A.forestSkyDay.c, 0, 0);
    const sp = (lt - (dur - 5.2)) * 130;
    g.drawImage(A.fFar, -sp * .3 % 3200, 0); g.drawImage(A.fMid, -sp * .65 % 3200, 0);
    g.fillStyle = '#5d4a33'; g.fillRect(0, 900, W, 180);
    for (let i = 0; i < 7; i++) {
      g.save(); g.translate(300 + i * 205 - (sp % 205), 800); g.scale(1.06, 1.06);
      dwarf(g, P, i, { march: true, ph: lt * 1.6 + i * .13, lantern: i === 0 });
      g.restore();
    }
    if (S.t * 1.6 % 1 < .5) lamp(g, e, 300 - (sp % 205) + 66, 800 - 88, 44, '#ffc27a', .8);
    g.drawImage(A.fFrame, 0, 0, 700, 1080, -60, 80, 700, 1080);
    g.drawImage(A.fFrame, 2500, 0, 700, 1080, 1280, 80, 700, 1080);
    return {};
  }
  const P = PAL.cottage;
  drawPlate(g, e, A.cottageInt);
  if (L.lineAt(S.t, 'n14') < 0) {   // they come home: seven silhouettes, then lamplight
    const inT = seg(lt, .6, 2.6);
    for (let i = 0; i < 7; i++) {
      const x = 635 + (i - 3) * 86 * inT + (i - 3) * 30, sc = .92 + Math.abs(i - 3) * .02;
      g.save(); g.translate(x, 640); g.scale(sc, sc);
      dwarf(g, inT < .5 ? PAL.sil : P, i, { lantern: i === 3, bow: 0 });
      g.restore();
    }
    lamp(g, e, 635, 560, 60, '#ffc27a', .5 + inT * .5);
    // the sleeper, small at the beds
    g.save(); g.translate(1722, 596); g.scale(.9, .9);
    cel(g, [[-104, 26], [104, 26], [110, 66], [-110, 66]], { f: '#a03a30', s: '#701f18', l: '#4c100a', lw: 2.4 });
    g.restore();
    return {};
  }
  // morning: the pact — Snow White bust left, the eldest dwarf close right
  g.save(); g.translate(560, 620); g.scale(1.55, 1.55);
  head(g, P, { chara: 'snow', view: 'q', expr: 'gentle', bust: 'snow', ph: q12(lt) });
  g.restore();
  g.save(); g.translate(1420, 700); g.scale(1.7, 1.7);
  dwarf(g, P, 0, { bow: .1 });
  g.restore();
  return {};
}
