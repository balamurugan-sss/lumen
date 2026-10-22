// Scenes 7–12 for SNOW WHITE.
import { W, H, cel, path, poly, line, vgrad, airbrush, rgba, mix, TAU, hash } from './cel.js';
import { PAL } from './pal.js';
import { head, dwarf, manBust, mirrorFace } from './chars.js';
import { fall, flare, lamp, impact } from './fx.js';
import { q12, q8, clamp, seg, ease, chromeText, snowFigure, drawPlate } from './scenes.js';

// a cloaked pedlar figure (the queen in disguise): hood over the head
function pedlar(g, P, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, [[-52, 130], [-46, 10], [-30, -60], [0, -84], [30, -60], [46, 10], [52, 130], [20, 118], [-20, 118]], { f: P.cloak.f, s: P.cloak.s, so: [-10, -4], l: P.cloak.l, lw: 2.2 });
  g.save(); g.translate(0, -96); g.scale(.78, .78);
  head(g, { ...P, skin: P.skinQ }, { chara: 'queen', view: o.view || 'q', expr: o.expr || 'proud', bust: null, ph: 0 });
  g.restore();
  cel(g, [[-56, -120], [-30, -168], [0, -178], [32, -168], [56, -120], [44, -138], [0, -148], [-44, -138]], { f: P.cloak.f, s: P.cloak.s, l: P.cloak.l, lw: 2.2 });
  g.restore();
}
// Snow White fallen (doorstep): a horizontal figure, head at left
function fallen(g, P, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(.04);
  cel(g, [[-150, 10], [-40, -24], [90, -18], [170, 6], [172, 30], [-148, 32]], { f: P.skirt.f, s: P.skirt.s, l: P.skirt.l, lw: 2 });
  cel(g, [[-150, 8], [-120, -26], [-52, -22], [-46, 10]], { f: P.dress.f, s: P.dress.s, l: P.dress.l, lw: 2 });
  g.save(); g.translate(-168, -8); g.rotate(-1.25); g.scale(.5, .5);
  head(g, P, { chara: 'snow', view: 'front', expr: 'sleep', bust: null, blush: .26 });
  g.restore(); g.restore();
}
// the glass coffin with Snow White inside, on its stand
export function coffinDraw(g, P, x, y, s, openLid = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, poly([[-190, 60], [190, 60], [176, 96], [-176, 96]]), { f: P.woodDark.f, s: P.woodDark.s, l: P.woodDark.l, lw: 2 });
  cel(g, poly([[-150, 96], [-128, 150], [-104, 150], [-116, 96]]), { f: P.woodDark.f, l: P.woodDark.l, lw: 2 });
  cel(g, poly([[150, 96], [128, 150], [104, 150], [116, 96]]), { f: P.woodDark.f, l: P.woodDark.l, lw: 2 });
  // body under glass
  cel(g, [[-168, 50], [-60, 6], [80, 4], [168, 44], [168, 60], [-168, 62]], { f: P.skirt.f, s: P.skirt.s, l: P.skirt.l, lw: 1.6 });
  cel(g, [[-168, 46], [-120, 12], [-56, 8], [-50, 34], [-90, 48]], { f: P.dress.f, s: P.dress.s, l: P.dress.l, lw: 1.4 });
  g.fillStyle = '#fff6e2'; g.beginPath(); g.ellipse(-172, 30, 26, 13, -.2, 0, TAU); g.fill();
  g.save(); g.translate(-192, 22); g.rotate(-1.32); g.scale(.54, .54);
  head(g, P, { chara: 'snow', view: 'front', expr: 'sleep', bust: null, blush: .3 });
  g.restore();
  // flowers on the skirt
  for (const [fx, fy, fc] of [[-40, 44, '#f2b8c6'], [30, 40, '#fff'], [90, 46, '#f2b8c6'], [-100, 48, '#fff']]) {
    g.fillStyle = fc; g.beginPath(); g.arc(fx, fy, 6, 0, TAU); g.fill();
  }
  // glass: a translucent lid, hinged open by openLid
  g.save(); g.translate(0, 8); g.rotate(-openLid * .5); g.translate(0, -8);
  const lid = path([[-178, 8], [-120, -40], [120, -40], [178, 8], [178, 46], [-178, 46]], true);
  g.fillStyle = 'rgba(190,225,235,.20)'; g.fill(lid);
  g.strokeStyle = P.gold.l; g.lineWidth = 2.4; g.stroke(lid);
  line(g, [[-150, 2], [140, 2]], 'rgba(255,255,255,.5)', 3);
  g.restore();
  cel(g, poly([[-182, 46], [182, 46], [182, 60], [-182, 60]]), { f: P.gold.f, s: P.gold.s, l: P.gold.l, lw: 1.8 });
  g.restore();
}

// ——— 7 · the three visits ———
export function visits(S) {
  const { g, e, lt, A, L } = S, P = PAL.cottage, dur = S.t1 - S.t0;
  drawPlate(g, e, A.cottageInt);
  // daylight in the open door
  const doorGlow = .75 + Math.sin(S.t * .7) * .03;
  g.save(); g.globalAlpha = doorGlow; g.fillStyle = '#ffe9bb'; g.fillRect(566, 336, 138, 324); g.restore();
  airbrush(e, 635, 500, 90, 180, '#c8a24e', .35);
  const visit = L.lineAt(S.t, 'n16') >= 0 ? 1 : L.lineAt(S.t, 'n17') >= 0 ? 2 : 0;
  const phase = visit === 0 ? L.lineAt(S.t, 'n15') : visit === 1 ? L.lineAt(S.t, 'n16') : L.lineAt(S.t, 'n17');
  if (visit === 0) {   // the approach: the pedlar at the door, Snow White wary
    pedlar(g, P, 635, 700, 1.5, { expr: 'gentle' });
    g.save(); g.translate(1080, 660); g.scale(1.3, 1.3);
    head(g, P, { chara: 'snow', view: 'q', expr: 'wonder', bust: 'snow', look: [-.4, 0], ph: q12(lt) });
    g.restore();
    return {};
  }
  // visits 1 & 2 play the same rhythm: gift → fall → rescue
  const gift = visit === 1 ? 'laces' : 'comb';
  if (phase < .42) {   // the gift is offered
    pedlar(g, P, 700, 700, 1.55, { expr: 'gentle' });
    g.save(); g.translate(1150, 690); g.scale(1.32, 1.32);
    head(g, P, { chara: 'snow', view: 'q', expr: 'gentle', bust: 'snow', look: [-.4, .1], ph: q12(lt) });
    g.restore();
    g.save(); g.translate(905, 690);
    if (gift === 'laces') { for (let i = 0; i < 3; i++) { g.strokeStyle = ['#c8262e', '#2e6da0', '#c8922a'][i]; g.lineWidth = 5; g.beginPath(); g.moveTo(-8 + i * 9, -30); g.quadraticCurveTo(6 + i * 9, 10, -4 + i * 9, 52); g.stroke(); } }
    else { cel(g, [[-26, -34], [26, -34], [30, -20], [-22, -20]], { f: P.gold.f, s: P.gold.s, l: P.gold.l, lw: 2 }); for (let i = 0; i < 6; i++) line(g, [[-20 + i * 8, -20], [-20 + i * 8, 4]], P.gold.l, 2.6); }
    g.restore();
    flare(e, 905, 660, .4, '#ffe9b0');
  } else if (phase < .68) {   // she falls
    fallen(g, P, 960, 800, 1.32);
    pedlar(g, PAL.sil, 620, 690, 1.5, {});
    g.save(); g.globalAlpha = .0; g.restore();
  } else {   // the dwarfs burst in and undo it
    fallen(g, P, 900, 810, 1.32);
    for (let i = 0; i < 3; i++) {
      g.save(); g.translate(1330 + i * 150 - seg(phase, .68, 1) * 130, 760 + (i % 2) * 46); g.scale(1.1, 1.1);
      dwarf(g, P, i * 2, { march: phase < .9, ph: lt * 2 + i, bow: phase >= .9 ? .4 : 0 });
      g.restore();
    }
    if (phase > .9) flare(e, 830, 760, .45, '#eaf4ff');   // the snip / the comb lifted out
  }
  return {};
}

// ——— 8 · the apple ———
export function apple(S) {
  const { g, e, lt, A, L } = S, P = PAL.day, dur = S.t1 - S.t0;
  const bite = L.lineAt(S.t, 'n19');
  if (bite > .78 && bite < .78 + 2 / 24 / Math.max(bite, .001) && lt < dur) { /* handled below by frame check */ }
  const fr = Math.round(S.t * 24), biteT = L.absTime('n19', .8);
  if (fr === Math.round(biteT * 24) || fr === Math.round(biteT * 24) + 1) {   // impact frames on the bite
    impact(g, 1180, 520, gg => { gg.save(); gg.translate(1180, 430); gg.scale(2.6, 2.6); head(gg, { ...PAL.sil, skin: { f: '#0c0a18', s: '#0c0a18', h: '#0c0a18', l: '#f4f0ff' }, hairSnow: { f: '#0c0a18', s: '#0c0a18', h: '#0c0a18', l: '#f4f0ff' } }, { chara: 'snow', view: 'front', expr: 'fear', bust: null }); gg.restore(); });
    return { bloom: .2 };
  }
  if (bite < 0) {   // insert: the apple, half white, half red
    g.fillStyle = '#101018'; g.fillRect(0, 0, W, H);
    const R = 30;
    for (let i = 0; i < 14; i++) { g.save(); g.globalAlpha = .1 + hash(i * 3) * .12; g.fillStyle = '#8ab8e2'; g.beginPath(); g.arc(hash(i * 7) * W, hash(i * 13) * H, 30 + hash(i) * 90, 0, TAU); g.fill(); g.restore(); }
    g.save(); g.translate(960, 560);
    cel(g, [[0, -150], [26, -108], [96, -92], [138, -20], [104, 84], [40, 128], [0, 108], [-40, 128], [-104, 84], [-138, -20], [-96, -92], [-26, -108]], { f: P.appleW.f, s: P.appleW.s, l: P.appleW.l, lw: 3,
      clipFn: gg => { gg.fillStyle = P.apple.f; gg.fillRect(0, -170, 200, 340); gg.fillStyle = P.apple.s; gg.fillRect(96, -170, 104, 340); } });
    cel(g, [[2, -148], [16, -188], [44, -206]], { f: 'none', l: P.woodDark.l, lw: 7 });
    cel(g, [[16, -190], [66, -206], [84, -176], [44, -162], [18, -172]], { f: '#3f7a3a', s: '#2c5626', l: '#1c3a16', lw: 2.4 });
    g.restore();
    // a highlight slides across it
    const sx = 700 + seg(L.lineAt(S.t, 'n18'), 0, 1) * 520;
    g.save(); g.globalAlpha = .16; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sx, 480, 44, 190, .3, 0, TAU); g.fill(); g.restore();
    flare(e, 830, 420, .5, '#fff');
    return {};
  }
  // the doorstep: she buys, she bites, she falls
  drawPlate(g, e, A.cottageInt);
  g.save(); g.globalAlpha = .8; g.fillStyle = '#ffe9bb'; g.fillRect(566, 336, 138, 324); g.restore();
  if (bite < .8) {
    pedlar(g, PAL.cottage, 660, 700, 1.55, { expr: 'gentle' });
    g.save(); g.translate(906, 596);
    cel(g, [[0, -34], [20, -12], [14, 22], [-14, 22], [-20, -12]], { f: P.appleW.f, s: P.appleW.s, l: P.appleW.l, lw: 2, clipFn: gg => { gg.fillStyle = P.apple.f; gg.fillRect(0, -40, 30, 70); } });
    g.restore();
    g.save(); g.translate(1170, 690); g.scale(1.32, 1.32);
    head(g, PAL.cottage, { chara: 'snow', view: 'q', expr: 'gentle', bust: 'snow', look: [-.4, .1], ph: q12(lt) });
    g.restore();
  } else {
    fallen(g, PAL.cottage, 980, 810, 1.32);
    pedlar(g, PAL.sil, 600, 690, 1.5, {});
    g.save(); g.translate(1150, 846); cel(g, [[0, -16], [12, -6], [8, 12], [-8, 12], [-12, -6]], { f: P.apple.f, s: P.apple.s, l: P.apple.l, lw: 1.6 }); g.restore();
    // the dwarfs return at dusk, too late
    for (let i = 0; i < 3; i++) { g.save(); g.translate(1560 + i * 130, 730 + i * 30); g.scale(1.05, 1.05); dwarf(g, PAL.dusk, i + 2, { bow: .55 }); g.restore(); }
  }
  return {};
}

// ——— 9 · the glass coffin ———
export function coffin(S) {
  const { g, e, lt, A, L } = S, dur = S.t1 - S.t0;
  const seasons = lt > L.endOf('n20');
  const panX = -ease(S.u) * 46;
  if (!seasons) {
    drawPlate(g, e, A.hillBlossom, panX, 0);
    coffinDraw(g, PAL.day, 960 + panX, 700, 1.5);
    for (let i = 0; i < 7; i++) {
      const side = i < 3 ? -1 : 1, k = i < 3 ? i : i - 3;
      g.save(); g.translate(960 + panX + side * (330 + k * 128), 716); g.scale(1.02, 1.02);
      dwarf(g, PAL.day, i, { bow: .5 + Math.sin(i) * .06, sleep: i === 5 });
      g.restore();
    }
    fall(g, S.t, 40, { col: '#f6cdd8', petal: true, speed: 30, rMax: 3.4, alpha: .8, seed: 11 });
    return { expo: 1.03 };
  }
  // seasons pass over the same composition (tail of the scene)
  const su = seg(lt, L.endOf('n20'), S.t1);
  const plates = [A.hillSnow, A.hillBlossom, A.hillGold, A.hillBlossom];
  const idx = Math.min(3, Math.floor(su * 4)), nxt = plates[Math.min(3, idx + 1)], loc = su * 4 - idx;
  drawPlate(g, e, plates[idx], panX, 0);
  if (loc > .7 && nxt !== plates[idx]) { g.save(); g.globalAlpha = (loc - .7) / .3; g.drawImage(nxt.c, panX, 0); g.restore(); }
  const P = [PAL.winter, PAL.day, PAL.gold, PAL.day][idx];
  coffinDraw(g, P, 960 + panX, 700, 1.5);
  if (idx === 0) fall(g, S.t, 150, { col: '#fff', speed: 55, alpha: .9, seed: 4 });
  if (idx === 1 || idx === 3) fall(g, S.t, 36, { col: '#f6cdd8', petal: true, speed: 28, rMax: 3.2, alpha: .8, seed: 12 });
  if (idx === 2) fall(g, S.t, 30, { col: '#e8a65e', petal: true, speed: 34, rMax: 3, alpha: .75, seed: 13 });
  return {};
}

// ——— 10 · the prince ———
export function prince(S) {
  const { g, e, lt, A, L } = S, P = PAL.gold;
  drawPlate(g, e, A.hillGold, 0, 0);
  const stumble = L.absTime('n23', .34), wake = L.absTime('n24', 0);
  const jolt = S.t >= stumble && S.t < stumble + .3 ? Math.sin((S.t - stumble) / .3 * Math.PI) * 10 : 0;
  g.save(); g.translate(0, jolt);
  if (S.t < wake - 1.6) {
    coffinDraw(g, P, 880, 700, 1.5, S.t > stumble ? .3 : 0);
    // the prince kneels by the coffin; two servants at its foot
    g.save(); g.translate(1420, 660); g.scale(1.5, 1.5);
    manBust(g, P, { garment: P.tunic, circlet: true, expr: 'sad', view: 'q' });
    g.restore();
    if (S.t > stumble - 4) for (let i = 0; i < 2; i++) { g.save(); g.translate(430 + i * 90, 760); g.scale(1.2, 1.2); dwarf(g, P, i + 4, { carry: true }); g.restore(); }
    if (S.t >= stumble && S.t < stumble + 1.4) {   // insert beat: the apple piece falls
      g.save(); g.translate(700 + (S.t - stumble) * 26, 668 + (S.t - stumble) * 60);
      cel(g, [[0, -10], [12, -4], [6, 9], [-7, 7]], { f: P.apple.f, s: P.apple.s, l: P.apple.l, lw: 1.6 });
      g.restore();
    }
  } else if (S.t < wake) {   // ECU: her eyes open in three drawings
    g.fillStyle = '#181126'; g.fillRect(0, -20, W, H + 40);
    const st = q8(S.t - (wake - 1.6));
    const openA = st < .18 ? 0 : st < .36 ? .45 : 1;
    g.save(); g.translate(960, 470); g.scale(3.1, 3.1);
    head(g, PAL.day, { chara: 'snow', view: 'front', expr: 'sleep', bust: null, open: openA, blush: .34 });
    g.restore();
  } else {
    coffinDraw(g, P, 880, 700, 1.5, 1);
    g.save(); g.translate(760, 560); g.scale(1.06, 1.06);
    head(g, PAL.day, { chara: 'snow', view: 'q', expr: 'wonder', bust: 'snow' });
    g.restore();
    g.save(); g.translate(1400, 640); g.scale(1.55, 1.55);
    manBust(g, P, { garment: P.tunic, circlet: true, expr: 'joy', view: 'q', cape: true });
    g.restore();
    for (let i = 0; i < 4; i++) { g.save(); g.translate(300 + i * 130, 780); g.scale(1.05, 1.05); dwarf(g, P, i, { bow: .2 }); g.restore(); }
  }
  g.restore();
  return { expo: 1.04 };
}

// ——— 11 · the wedding + the mirror cracks ———
export function wedding(S) {
  const { g, e, lt, A, L } = S, P = PAL.day, dur = S.t1 - S.t0;
  const crackT = L.absTime('n25', .62);
  if (S.t > crackT && S.t < crackT + 3.4) {   // far away: the mirror cracks
    drawPlate(g, e, A.chamber);
    g.save(); g.translate(1150, 430); g.scale(1.35, 1.35); g.translate(-1150, -430);
    g.drawImage(A.chamber.c, 0, 0);
    g.restore();
    g.save(); g.fillStyle = 'rgba(6,12,30,.42)'; g.beginPath(); g.ellipse(1150, 430, 208, 312, 0, 0, TAU); g.fill(); g.restore();
    mirrorFace(g, 1150, 430, 3.1, 0);
    const ct = (S.t - crackT) / .5;
    if (ct > 0) {
      g.save(); g.strokeStyle = 'rgba(230,246,255,.9)'; g.lineWidth = 3;
      const R = 60 + Math.min(1, ct) * 240;
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU + hash(i * 5) * .4;
        g.beginPath(); g.moveTo(1150, 430);
        g.lineTo(1150 + Math.cos(a) * R * (0.6 + hash(i) * .5), 430 + Math.sin(a) * R * (0.6 + hash(i) * .5)); g.stroke();
      }
      g.restore();
    }
    // the queen flees into the night — a silhouette crossing the door of light
    const flee = seg(S.t, crackT + .8, crackT + 3.2);
    if (flee > 0) { g.save(); g.translate(300 + flee * 500, 700); g.scale(1.5, 1.5); head(g, PAL.sil, { chara: 'queen', view: 'q', expr: 'fear', crown: true, bust: 'queen' }); g.restore(); }
    return { expo: .94 };
  }
  drawPlate(g, e, A.hall);
  g.save(); g.translate(830, 560); g.scale(1.25, 1.25);
  head(g, P, { chara: 'snow', view: 'q', expr: 'joy', bust: 'snow', ph: q12(lt) });
  g.restore();
  g.save(); g.translate(1150, 545); g.scale(1.32, 1.32);
  manBust(g, P, { garment: P.tunic, circlet: true, expr: 'joy', view: 'front', cape: true });
  g.restore();
  for (let i = 0; i < 7; i++) {
    const bx = 200 + i * 250, by = 830 + Math.abs(Math.sin(q12(lt) * TAU + i * 1.3)) * -16;
    g.save(); g.translate(bx, by); g.scale(1.02, 1.02);
    dwarf(g, P, i, { ph: lt + i * .2 });
    g.restore();
  }
  fall(g, S.t, 46, { col: '#f6cdd8', petal: true, speed: 36, rMax: 3.2, alpha: .85, seed: 21 });
  return { expo: 1.05 };
}

// ——— 12 · ending: the cottage repainted at golden hour ———
export function ending(S) {
  const { g, e, lt, A, L } = S, dur = S.t1 - S.t0;
  const rise = ease(seg(lt, dur - 6.4, dur - 1));
  drawPlate(g, e, A.cottageGold, 0, rise * 130);
  g.save(); g.globalAlpha = rise; g.drawImage(A.hillStar.c, 0, -1080 + rise * 1080 + rise * 130); g.restore();
  // everyone at the cottage door
  const gy = 838 + rise * 130;
  snowFigure(g, PAL.gold, 880, gy, .95, { expr: 'joy' });
  g.save(); g.translate(1010, gy - 96); g.scale(.62, .62);
  manBust(g, PAL.gold, { garment: PAL.gold.tunic, circlet: true, expr: 'joy', view: 'q', cape: true });
  g.restore();
  for (let i = 0; i < 7; i++) { g.save(); g.translate(660 + i * 96 - (i > 3 ? 380 : 0), gy + (i > 3 ? 6 : 0)); g.scale(.78, .78); dwarf(g, PAL.gold, i, {}); g.restore(); }
  // THE END in chrome, flickering on over the stars
  const endT = seg(lt, dur - 4.6, dur - 4);
  if (endT > 0) {
    g.save(); g.globalAlpha = endT * (q12(lt) > dur - 4.4 ? 1 : .6);
    chromeText(g, e, 'THE END', 960, 330, 150);
    g.restore();
    if (lt > dur - 3.4 && lt < dur - 3.15) flare(e, 1240, 268, .9, '#ffe9b0');
  }
  return {};
}
