// Characters for SNOW WHITE, drawn in code in the 80s cel manner:
// long egg face, almond eyes near the vertical middle of the head,
// layered oval iris with two highlights, hair in overlapping locks
// with a continuous angel-ring highlight. Local space: skull centre
// (0,0), radius ~80, chin +96, face turned right in the q view.
// Characters step at 12 fps in the scenes; this module only draws.
import { cel, path, poly, ribbon, flutter, line, TAU, rgba, mix, LWK } from './cel.js';

const LW = 1.5, LS = LW * .78, LH = LW * 1.05;
export const EXPR = {
  neutral:  { open: 1, lid: 0, brow: [0, 0, 2], mouth: 'closed' },
  gentle:   { open: .92, lid: .08, brow: [-2, -1, 3], mouth: 'smile' },
  smile:    { open: .74, lid: .1, brow: [-3, -1, 3], mouth: 'smile', smileEyes: true },
  joy:      { open: .76, lid: .06, brow: [-4, -2, 3.5], mouth: 'smileopen', smileEyes: true },
  sad:      { open: .8, lid: .22, brow: [-7, 3, 1], mouth: 'closed' },
  fear:     { open: 1.14, lid: -.2, brow: [-9, -6, 4], mouth: 'oh', iris: .8 },
  wonder:   { open: 1.08, lid: -.1, brow: [-7, -5, 4], mouth: 'oh' },
  resolve:  { open: .95, lid: .36, brow: [7, -3, 1], mouth: 'set' },
  proud:    { open: .82, lid: .34, brow: [2, -4, 2], mouth: 'set' },
  sleep:    { open: 0, lid: 0, brow: [-2, 0, 3], mouth: 'closed' },
  talk:     { open: 1, lid: .08, brow: [0, 0, 2], mouth: 'talk' },
};

function eye(g, P, cx, cy, w, h, dir, fs, E) {
  const open = Math.max(0, E.open ?? 1), lid = E.lid || 0, W2 = w / 2, lash = '#160a18';
  const X = u => cx + dir * u * W2;
  const inY = cy + h * .1, outY = cy - h * .08 - (E.smileEyes ? h * .06 : 0);
  const topY = cy - h * .5 * open + lid * h * .3, botY = cy + h * .46 * Math.min(1, open + .25) - (E.smileEyes ? h * .28 : 0);
  if (open > .08) {
    const WP = path([[X(-1), inY, 1], [X(-.4), topY + h * .05], [X(.3), topY], [X(1), outY, 1], [X(.45), botY], [X(-.4), botY - h * .02]], true);
    g.save(); g.clip(WP);
    g.fillStyle = P.white_eye; g.fill(WP);
    g.fillStyle = mix(P.white_eye, P.skin.s, .5); g.fillRect(cx - w, topY - 6, w * 2, h * .2 + 6);
    const sc = E.iris || 1, iw = w * .24 * sc * (fs < 1 ? .92 : 1), ih = h * .44 * sc;
    const ix = cx + dir * W2 * .04 + (E.look?.[0] || 0) * w * .14, iy = cy + h * .08 + (E.look?.[1] || 0) * h * .13;
    const IR = new Path2D(); IR.ellipse(ix, iy, iw, ih, 0, 0, TAU);
    g.fillStyle = P.eye.f; g.fill(IR);
    g.save(); g.clip(IR);
    g.fillStyle = P.eye.s; g.fillRect(ix - iw, iy - ih, iw * 2, ih * .95);
    g.fillStyle = mix(P.eye.s, lash, .45); g.fillRect(ix - iw, iy - ih, iw * 2, ih * .36);
    g.fillStyle = mix(P.eye.l, lash, .3); g.beginPath(); g.ellipse(ix, iy, iw * .44, ih * .5, 0, 0, TAU); g.fill();
    g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + ih * .92, iw * 1.05, ih * .5, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - dir * iw * .34, iy - ih * .34, iw * .42, ih * .27, -.5 * dir, 0, TAU); g.fill();
    g.beginPath(); g.arc(ix + dir * iw * .4, iy + ih * .36, iw * .2, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = mix(P.eye.l, lash, .5); g.lineWidth = LW * .7 * LWK.k; g.stroke(IR);
    g.restore();
    line(g, [[X(.95), outY + h * .12], [X(.5), botY + 1], [X(.05), botY + 1.5]], mix(P.skin.l, P.skin.f, .35), LS * .8);
    const t = h * (E.plain ? .09 : .18);   // plain: men's eyes — a thin lid line, no lash flicks
    cel(g, [[X(-1.03), inY + 1, 1], [X(-.4), topY + h * .05 - t * .6], [X(.3), topY - t * .75], [X(.95), outY - t], [X(1.25), outY - t * 2.1, 1],
      [X(1.03), outY + t * .5], [X(.3), topY + t * .45], [X(-.4), topY + h * .05 + t * .35], [X(-.98), inY + t * .6, 1]], { f: lash });
    if (!E.plain) for (let k = 0; k < 3; k++) {
      const u = .55 + k * .2, bx = X(u), by = topY + (outY - topY) * ((u - .3) / .7) - t * .5;
      cel(g, [[bx - dir * 2, by, 1], [bx + dir * (4 + k * 3), by - h * (.15 + k * .05), 1], [bx + dir * 3, by + 1, 1]], { f: lash });
    }
  } else {
    const t = h * .18;
    cel(g, [[X(-1), inY, 1], [X(0), cy + h * .22], [X(1.05), outY + h * .04], [X(1.22), outY - t, 1], [X(1), outY + t * .8], [X(0), cy + h * .22 + t * .8], [X(-.98), inY + t * .5, 1]], { f: '#160a18' });
  }
}
function brow(g, P, ix, iy, ox, oy, B) {
  const a = [ix, iy + B[0]], c = [ox, oy + B[1]], m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - B[2]];
  cel(g, [[a[0], a[1] - 1.4, 1], [m[0], m[1] - 1.6], [c[0], c[1] - .2, 1], [m[0], m[1] + 1.2], [a[0], a[1] + 1.4, 1]], { f: '#160a18' });
}
function mouth(g, P, cx, cy, w, type, fs = 1) {
  const L = cx - w / 2, R = cx + w / 2 * fs, lc = P.skin.l;
  const lower = (y, ww) => line(g, [[cx - ww * .6, y], [cx + ww * .5, y]], mix(lc, P.skin.f, .5), LS * .75);
  if (type === 'closed' || type === 'set') {
    const dn = type === 'set' ? 1.6 : 0;
    line(g, [[L, cy + dn], [cx - w * .12, cy - .6], [cx + w * .06, cy + .2], [R, cy + dn]], P.lip || lc, LS * 1.1);
    lower(cy + 5.5, w * .2);
  } else if (type === 'smile') {
    line(g, [[L - 1, cy - 3], [cx - w * .15, cy + 1.6], [cx + w * .1, cy + 1.6], [R + 1, cy - 3]], P.lip || lc, LS * 1.1);
    lower(cy + 6.5, w * .16);
  } else {
    let pts, teeth = 0, tongue = 0, bot;
    if (type === 'smileopen') { pts = [[L - 1, cy - 3, 1], [cx, cy - 2], [R + 1, cy - 3, 1], [cx + w * .2, cy + 6], [cx, cy + 10], [cx - w * .22, cy + 6]]; teeth = 1; tongue = 1; bot = cy + 10; }
    else if (type === 'oh') { pts = [[cx - w * .24, cy + 3], [cx, cy - 4], [cx + w * .22, cy + 3], [cx + w * .16, cy + 13], [cx - w * .16, cy + 13]]; bot = cy + 13; }
    else { pts = [[L + 3, cy, 1], [cx, cy - 1], [R - 3, cy, 1], [cx + w * .08, cy + 7], [cx - w * .1, cy + 7]]; tongue = .8; bot = cy + 7; }
    const MP = path(pts, true);
    g.save(); g.clip(MP); g.fillStyle = '#5a1a2a'; g.fill(MP);
    if (tongue) { g.fillStyle = '#e0707a'; g.beginPath(); g.ellipse(cx, bot + 1, w * .28, 6, 0, 0, TAU); g.fill(); }
    if (teeth) { g.fillStyle = '#fff'; g.fillRect(cx - w, cy - 8, w * 2, 10.5); }
    g.restore(); g.strokeStyle = lc; g.lineWidth = LS * 1.05 * LWK.k; g.stroke(MP);
    lower(bot + 4.5, w * .14);
  }
}
function lock(x0, y0, x1, y1, tx, ty, bend = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = tx - mx, dy = ty - my, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return [[x0, y0], [x0 + dx * .55 + nx * bend, y0 + dy * .55 + ny * bend], [tx, ty, 1], [x1 + dx * .5 + nx * bend * .7, y1 + dy * .5 + ny * bend * .7], [x1, y1]];
}
function halo(g, Hc, cx, cy, rx, ry, a0, a1, th, teeth) {
  const up = [], dn = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const u = i / (teeth * 2), a = a0 + (a1 - a0) * u, env = Math.sin(u * Math.PI) * .7 + .3;
    up.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    const depth = th * env * (i % 2 ? 1.9 : .55);
    dn.push([cx + Math.cos(a) * (rx - depth * .15), cy + Math.sin(a) * ry + depth]);
  }
  g.fillStyle = mix(Hc, '#ffffff', .32);
  g.beginPath(); up.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = dn.length - 1; i >= 0; i--) g.lineTo(dn[i][0], dn[i][1]); g.closePath(); g.fill();
}

const VIEWS = {
  front: {
    face: [[-64, -42], [-66, 2], [-62, 34], [-54, 62], [-40, 86], [-20, 102], [0, 112], [20, 102], [40, 86], [54, 62], [62, 34], [66, 2], [64, -42], [34, -64], [-34, -64]],
    neck: [[-24, 74], [24, 74], [27, 130], [-27, 130]],
    chin: [[-38, 72], [38, 72], [38, 90], [20, 103], [0, 113], [-20, 103], [-38, 90]],
    shade: [[88, 24], [88, 118], [24, 106], [42, 90], [52, 68], [58, 44], [62, 24]],
    eyes: [{ x: -36, y: 18, w: 38, h: 34, dir: -1, fs: 1 }, { x: 36, y: 18, w: 38, h: 34, dir: 1, fs: 1 }],
    brows: [[-14, -10, -54, -8], [14, -10, 54, -8]],
    mouth: { x: 0, y: 70, w: 23, fs: 1 },
    blush: [[-40, 44, 12, 4.2], [40, 44, 12, 4.2]],
  },
  q: {
    face: [[-62, -44], [-66, -4], [-64, 28], [-58, 58], [-44, 84], [-22, 102], [4, 112], [24, 106], [38, 92], [46, 76], [48, 62], [53, 44], [55, 28], [50, 14], [53, -2], [54, -42], [16, -64], [-34, -64]],
    neck: [[-34, 64], [12, 88], [15, 130], [-38, 130]],
    chin: [[-44, 62], [20, 62], [20, 94], [4, 113], [-22, 102], [-44, 84]],
    shade: [[88, 28], [88, 118], [16, 110], [32, 96], [40, 80], [44, 66], [47, 52], [51, 40], [55, 28]],
    eyes: [{ x: -20, y: 18, w: 42, h: 36, dir: -1, fs: 1 }, { x: 34, y: 16, w: 25, h: 33, dir: 1, fs: .6 }],
    brows: [[2, -8, -40, -6], [24, -10, 47, -5]],
    mouth: { x: 23, y: 71, w: 21, fs: .7 },
    blush: [[-28, 44, 13, 4.2], [43, 42, 6, 3.2]],
  },
};
// hair geometry per character & view
const HAIR = {
  snow: {
    front: {
      back: [[-78, -24], [-82, 26], [-72, 76], [-38, 92], [38, 92], [72, 76], [82, 26], [78, -24], [0, -58]],
      cap: [[-82, 4], [-88, -38], [-66, -82], [-24, -100], [24, -100], [66, -82], [88, -38], [82, 4], [64, -28], [0, -56], [-64, -28]],
      locks: [[-50, -80, -18, -88, -36, -8, 0], [18, -88, 50, -80, 38, -6, 0], [-88, -50, -50, -70, -74, 8, -5], [-68, -72, -24, -84, -50, 0, -3], [-42, -84, 0, -90, -22, -10, 3], [-14, -90, 18, -88, 2, 16, 0], [6, -88, 42, -84, 24, -12, -3], [28, -80, 68, -68, 50, 0, 3], [50, -68, 88, -50, 76, 8, 5]],
      side: [[-74, -38, -56, -52, -66, 118, -8], [74, -38, 56, -52, 66, 118, 8]],
      halo: [0, -10, 72, 56, Math.PI * 1.12, Math.PI * 1.88, 7, 9],
    },
    q: {
      back: [[-76, -28], [-88, 18], [-80, 68], [-50, 86], [-14, 78], [36, 60], [54, 16], [54, -22], [-8, -58]],
      cap: [[-86, 2], [-92, -42], [-68, -86], [-22, -102], [24, -98], [56, -76], [64, -44], [58, -6], [44, -28], [0, -52], [-56, -32]],
      locks: [[-54, -84, -22, -92, -38, -6, 0], [2, -94, 28, -88, 18, -8, 0], [-94, -48, -58, -70, -82, 12, -6], [-74, -74, -32, -86, -56, -2, -4], [-48, -86, -4, -92, -26, -12, 2], [-18, -92, 18, -92, 8, 14, 2], [6, -92, 40, -84, 26, -10, 4], [26, -84, 60, -68, 46, 0, 5], [44, -70, 68, -50, 58, 6, 5]],
      side: [[-76, -42, -56, -56, -72, 120, -10], [54, -38, 60, -28, 54, 66, 8]],
      halo: [-12, -12, 70, 56, Math.PI * 1.14, Math.PI * 1.84, 7, 8],
    },
  },
  queen: {   // slicked back under a crown; long fall behind
    front: {
      back: [[-76, -20], [-84, 40], [-78, 130], [-40, 150], [40, 150], [78, 130], [84, 40], [76, -20], [0, -56]],
      cap: [[-80, 0], [-84, -40], [-60, -80], [-20, -94], [20, -94], [60, -80], [84, -40], [80, 0], [58, -34], [0, -58], [-58, -34]],
      locks: [[-56, -76, -20, -84, -48, -34, 0], [20, -84, 56, -76, 48, -34, 0], [-80, -44, -52, -64, -66, -20, -3], [52, -64, 80, -44, 66, -20, 3], [-30, -88, 30, -88, 0, -52, 0]],
      side: [[-72, -30, -58, -44, -72, 138, -6], [72, -30, 58, -44, 72, 138, 6]],
      halo: [0, -16, 66, 48, Math.PI * 1.18, Math.PI * 1.82, 6, 7],
    },
    q: {
      back: [[-74, -24], [-86, 30], [-82, 120], [-46, 140], [0, 128], [44, 96], [56, 30], [54, -20], [-6, -56]],
      cap: [[-84, 0], [-90, -42], [-64, -84], [-20, -100], [24, -94], [56, -72], [62, -40], [56, -4], [42, -30], [0, -54], [-54, -30]],
      locks: [[-52, -82, -18, -88, -44, -32, 0], [4, -90, 30, -84, 24, -30, 0], [-88, -46, -54, -66, -72, -16, -4], [44, -66, 68, -46, 56, -18, 4], [-26, -90, 26, -90, 0, -54, 0]],
      side: [[-74, -34, -58, -48, -74, 140, -8], [52, -32, 58, -22, 50, 90, 6]],
      halo: [-10, -16, 64, 48, Math.PI * 1.18, Math.PI * 1.8, 6, 7],
    },
  },
};

// head + optional bust. o: {chara, view, expr, E, ph, hairPal, crown, collar,
// bust: 'snow'|'queen'|'q1'|'none', look, open, mouth, light}
export function head(g, P, o = {}) {
  const chara = o.chara || 'snow', view = o.view || 'q', V = VIEWS[view], Hh = HAIR[chara][view];
  const E = { ...EXPR[o.expr || 'neutral'], ...(o.E || {}) };
  if (o.look) E.look = o.look; if (o.open != null) E.open = o.open; if (o.mouth) E.mouth = o.mouth;
  const HP = o.hairPal || (chara === 'snow' ? P.hairSnow : P.hairQueen);
  const hairSt = { f: HP.f, s: HP.s, h: HP.h, l: HP.l, lw: LH, rim: o.rim };
  const lx = o.light?.[0] ?? -1, ly = o.light?.[1] ?? -.8, SO = k => [lx * k, ly * k];
  cel(g, Hh.back, { ...hairSt, f: HP.s, so: SO(10), s: mix(HP.s, '#000', .25) });
  if (o.collar) {   // the queen's high fan collar, behind the head
    const pts = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.08 + i / 8 * 0.84); pts.push([Math.cos(a) * 128 * (view === 'q' ? .8 : 1) - (view === 'q' ? 18 : 0), 118 - Math.sin(a) * 168]); }
    cel(g, pts.concat([[60, 130], [-60, 130]]), { f: P.blouse.f, s: P.blouse.s, so: SO(8), l: P.gold.l, lw: LS });
  }
  if (o.bust) bust(g, P, o.bust, view);
  cel(g, poly(V.neck), { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, sh: [V.chin] });
  cel(g, V.face, { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, h: P.skin.h, sh: [V.shade], so: SO(0),
    clipFn: gg => { gg.fillStyle = mix(P.skin.f, P.skin.s, .65); for (const L of Hh.locks) gg.fill(path(lock(L[0] - 4, L[1] + 9, L[2] + 6, L[3] + 9, L[4] + 3, L[5] + 10, L[6]))); gg.fillRect(-120, -120, 240, 60); } });
  for (const [x, y, rx, ry] of V.blush) { g.fillStyle = rgba(P.blush, o.blush ?? .22); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
  // nose: a shadow plane + one stroke
  if (view === 'front') { g.fillStyle = P.skin.s; g.beginPath(); g.moveTo(3, 38); g.lineTo(7, 51); g.lineTo(1, 53); g.closePath(); g.fill(); line(g, [[-3, 53], [3, 53.5]], P.skin.l, LS); }
  else { g.fillStyle = P.skin.s; g.beginPath(); g.moveTo(41, 40); g.lineTo(44, 49); g.lineTo(38, 53); g.lineTo(38, 47); g.closePath(); g.fill(); line(g, [[37, 53.5], [43, 51]], P.skin.l, LS); }
  mouth(g, { ...P, lip: P.lip }, V.mouth.x, V.mouth.y, V.mouth.w, E.mouth, V.mouth.fs);
  for (const ey of V.eyes) eye(g, { ...P, eye: o.eyePal || P.eyeSnow }, ey.x, ey.y, ey.w, ey.h, ey.dir, ey.fs, E);
  cel(g, Hh.cap, { ...hairSt, so: SO(10) });
  for (const L of Hh.side) { const sw = Math.sin((o.ph || 0) * TAU) * 3; cel(g, lock(L[0], L[1], L[2], L[3], L[4] + sw, L[5], L[6]), { ...hairSt, so: SO(7) }); }
  g.save(); g.fillStyle = HP.s; for (const L of Hh.locks) g.fill(path(lock(L[0] - 9, L[1], L[2] + 9, L[3], L[4], L[5] + 3, L[6]))); g.restore();
  const lockSt = { ...hairSt, l: mix(HP.l, HP.s, .45), lw: LH * .6 };
  for (const L of Hh.locks) cel(g, lock(L[0], L[1], L[2], L[3], L[4], L[5], L[6]), { ...lockSt, so: SO(6) });
  const hz = Hh.halo;
  g.save(); const HC = new Path2D(); HC.addPath(path(Hh.cap)); for (const L of Hh.locks) HC.addPath(path(lock(...L)));
  g.clip(HC); halo(g, HP.h, hz[0], hz[1], hz[2], hz[3], hz[4], hz[5], hz[6], hz[7]); g.restore();
  for (const b of V.brows) brow(g, P, b[0], b[1], b[2], b[3], E.brow || [0, 0, 2]);
  if (o.crown) {
    const cx = view === 'q' ? -4 : 0;
    cel(g, poly([[cx - 44, -78], [cx - 40, -108], [cx - 22, -86], [cx - 12, -116], [cx, -90], [cx + 12, -116], [cx + 22, -86], [cx + 40, -108], [cx + 44, -78], [cx + 40, -66], [cx - 40, -66]]),
      { f: P.gold.f, s: P.gold.s, h: P.gold.h, ho: [-3, 3], l: P.gold.l, lw: LS });
    g.fillStyle = P.sash.f; g.beginPath(); g.arc(cx, -76, 5.5, 0, TAU); g.fill();
  }
}

function bust(g, P, kind, view) {
  const dx = view === 'front' ? 0 : -12;
  if (kind === 'snow') {
    cel(g, [[-168 + dx, 330], [-156 + dx, 210], [-118 + dx, 152], [-52 + dx, 128], [56 + dx, 128], [122 + dx, 150], [158 + dx, 208], [170 + dx, 330]],
      { f: P.dress.f, s: P.dress.s, so: [-26, -8], l: P.dress.l, lw: LW * 1.1,
        clipFn: gg => { gg.fillStyle = P.blouse.f; gg.fill(poly([[-160 + dx, 216], [-140 + dx, 176], [-128 + dx, 330], [-152 + dx, 330]])); gg.fill(poly([[146 + dx, 178], [162 + dx, 218], [150 + dx, 330], [128 + dx, 330]])); } });
    cel(g, [[-58 + dx, 130], [-30 + dx, 112], [30 + dx, 112], [56 + dx, 130], [34 + dx, 148], [-34 + dx, 148]], { f: P.blouse.f, s: P.blouse.s, l: P.blouse.l, lw: LW });
    // the red sash, a diagonal band across the bodice
    cel(g, poly([[-96 + dx, 330], [-30 + dx, 168], [-2 + dx, 168], [-58 + dx, 330]]), { f: P.sash.f, s: P.sash.s, so: [-6, -4], l: P.sash.l, lw: LW * .8 });
  } else {   // queen / first queen gown
    const G = kind === 'q1' ? P.gownQ1 : P.gown;
    cel(g, [[-176 + dx, 330], [-164 + dx, 204], [-124 + dx, 150], [-54 + dx, 128], [58 + dx, 128], [126 + dx, 148], [166 + dx, 202], [178 + dx, 330]],
      { f: G.f, s: G.s, so: [-26, -8], l: G.l, lw: LW * 1.1 });
    cel(g, [[-58 + dx, 130], [-30 + dx, 112], [30 + dx, 112], [56 + dx, 130], [34 + dx, 150], [-34 + dx, 150]], { f: P.gold.f, s: P.gold.s, l: P.gold.l, lw: LW });
    line(g, [[2 + dx, 150], [2 + dx, 330]], G.l, LW * .8);
  }
}

// ——— dwarfs: one round-headed model, seven palettes ———
export function dwarf(g, P, i, o = {}) {
  const hat = P.hat[i % 7], tun = { f: P.dwarfTunic[i % 7], s: mix(P.dwarfTunic[i % 7], '#000', .3), l: mix(P.dwarfTunic[i % 7], '#000', .55) };
  const brd = { f: P.beard[i % 7], s: mix(P.beard[i % 7], '#000', .28), l: mix(P.beard[i % 7], '#000', .5) };
  const ph = o.ph || 0, step = o.march ? Math.sin(ph * TAU) : 0;
  const bow = o.bow || 0;   // head bow (mourning / greeting)
  // legs
  if (o.legs !== false) {
    const l1 = o.march ? step * 16 : 0, l2 = o.march ? -step * 16 : 0;
    cel(g, poly([[-26, 96], [-6, 96], [-4 + l1, 148], [-16 + l1, 148]]), { f: P.woodDark.f, s: P.woodDark.s, l: P.woodDark.l, lw: LW });
    cel(g, poly([[8, 96], [28, 96], [30 + l2, 148], [18 + l2, 148]]), { f: P.woodDark.f, s: P.woodDark.s, l: P.woodDark.l, lw: LW });
    cel(g, poly([[-22 + l1, 148], [2 + l1, 148], [4 + l1, 160], [-24 + l1, 160]]), { f: '#2c2018', l: '#120c06', lw: LW });
    cel(g, poly([[14 + l2, 148], [38 + l2, 148], [40 + l2, 160], [12 + l2, 160]]), { f: '#2c2018', l: '#120c06', lw: LW });
  }
  // body: tunic + belt
  cel(g, [[-44, 6], [-38, -34], [-16, -48], [18, -48], [40, -34], [46, 6], [40, 100], [-38, 100]], { f: tun.f, s: tun.s, so: [-12, -4], l: tun.l, lw: LW * 1.1 });
  cel(g, poly([[-42, 58], [42, 58], [42, 76], [-42, 76]]), { f: P.woodDark.f, s: P.woodDark.s, l: P.woodDark.l, lw: LW });
  cel(g, poly([[-9, 60], [11, 60], [11, 74], [-9, 74]]), { f: P.gold.f, s: P.gold.s, l: P.gold.l, lw: LW * .7 });
  // arms
  const armSt = { f: tun.f, s: tun.s, l: tun.l, lw: LW };
  if (o.carry) {
    cel(g, ribbon(flutter(-38, -20, 2.6, 62, 6, 2, 1, 0, 4), u => 17 - u * 5), armSt);
    cel(g, ribbon(flutter(40, -20, .5, 62, 6, 2, 1, 0, 4), u => 17 - u * 5), armSt);
  } else if (o.lantern) {
    cel(g, ribbon(flutter(-38, -20, 2.9, 56, 6, 2, 1, 0, 6), u => 17 - u * 5), armSt);
    cel(g, ribbon(flutter(40, -20, .9, 66, 6, 2, 1, 0, 2), u => 17 - u * 5), armSt);
  } else {
    const sw = o.march ? step * 8 : 0;
    cel(g, ribbon(flutter(-38, -20, 2.7 + sw * .01, 60, 6, 2, 1, 0, 8), u => 17 - u * 5), armSt);
    cel(g, ribbon(flutter(40, -20, .45 - sw * .01, 60, 6, 2, 1, 0, 8), u => 17 - u * 5), armSt);
  }
  // head, bowed as one piece
  g.save(); g.translate(0, -52); g.rotate(bow * .3); g.translate(0, 52);
  cel(g, [[-46, -96], [46, -96], [50, -52], [40, -16], [16, -2], [-16, -2], [-40, -16], [-50, -52]], { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS });
  // beard mass under the face
  cel(g, [[-44, -44], [44, -44], [46, -6], [30, 34], [8, 52], [-10, 34], [-30, 10], [-44, -10]], { f: brd.f, s: brd.s, so: [-8, -3], l: brd.l, lw: LW });
  // nose over the beard
  const nose = new Path2D(); nose.ellipse(0, -44, 13, 10.5, 0, 0, TAU);
  cel(g, nose, { f: P.skin.f, s: P.skin.s, h: P.skin.h, ho: [3, 3], l: P.skin.l, lw: LS });
  // eyes: small almonds; sleep = closed
  for (const sgn of [-1, 1]) {
    if (o.sleep) line(g, [[sgn * 26 - 9, -62], [sgn * 26, -58], [sgn * 26 + 9, -62]], '#160a18', LS * 1.1);
    else {
      const eg = new Path2D(); eg.ellipse(sgn * 26, -62, 9.5, (o.wonder ? 7.5 : 5.5), 0, 0, TAU);
      g.fillStyle = P.white_eye; g.fill(eg);
      g.fillStyle = '#1c0e04'; g.beginPath(); g.arc(sgn * 26 + (o.look || 0) * 3, -62, 3.4, 0, TAU); g.fill();
      line(g, [[sgn * 26 - 11, -69], [sgn * 26, -71], [sgn * 26 + 11, -69]], '#160a18', LS * 1.2);
    }
    cel(g, [[sgn * 26 - 11, -84, 1], [sgn * 26, -87], [sgn * 26 + 11, -84, 1], [sgn * 26, -81.5]], { f: brd.l });
  }
  for (const [x, y] of [[-32, -50], [32, -50]]) { g.fillStyle = rgba(P.blush, .3); g.beginPath(); g.ellipse(x, y, 8, 3, 0, 0, TAU); g.fill(); }
  // hat: a soft cone, flopped to one side
  const flop = (i % 3 - 1) * 14;
  cel(g, [[-48, -92], [-44, -118], [-16, -134], [18, -132], [42, -116], [48, -92], [24, -100], [-24, -100]],
    { f: hat, s: mix(hat, '#000', .3), so: [-8, -4], l: mix(hat, '#000', .55), lw: LW });
  cel(g, [[18, -132], [34, -152 + Math.abs(flop) * .2], [46 + flop, -138], [42, -116]], { f: hat, s: mix(hat, '#000', .3), l: mix(hat, '#000', .55), lw: LW });
  g.restore();
}

// ——— a man's bust (huntsman / prince), simple and mostly seen far or backlit ———
export function manBust(g, P, o = {}) {
  const view = o.view || 'q', dx = view === 'front' ? 0 : -10;
  const G = o.garment;
  cel(g, [[-160 + dx, 330], [-148 + dx, 206], [-112 + dx, 152], [-48 + dx, 128], [54 + dx, 128], [116 + dx, 150], [150 + dx, 204], [162 + dx, 330]],
    { f: G.f, s: G.s, so: [-24, -8], l: G.l, lw: LW * 1.1 });
  if (o.cape) cel(g, [[-150 + dx, 330], [-142 + dx, 200], [-104 + dx, 152], [-70 + dx, 138], [-84 + dx, 330]], { f: P.cape.f, s: P.cape.s, l: P.cape.l, lw: LW });
  cel(g, poly([[-22, 74], [22, 74], [25, 128], [-25, 128]]), { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS });
  const V = VIEWS[view];
  cel(g, V.face, { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, sh: [V.shade] });
  // short hair / cap
  if (o.cap) {
    cel(g, [[-68, 26], [-70, -20], [-58, -34], [-44, -18], [-46, 30]], { f: P.hairBrown.f, s: P.hairBrown.s, l: P.hairBrown.l, lw: LH });
    cel(g, [[-66, -30], [-70, -58], [-40, -84], [10, -90], [52, -76], [66, -44], [40, -52], [0, -62], [-44, -50]], { f: o.cap.f, s: o.cap.s, l: o.cap.l, lw: LH });
    if (view === 'q') cel(g, poly([[30, -56], [66, -46], [68, -39], [34, -43]]), { f: o.cap.f, s: o.cap.s, l: o.cap.l, lw: LH });
  } else {
    cel(g, [[-66, -34], [-68, -64], [-36, -88], [16, -90], [54, -72], [64, -40], [36, -54], [-6, -60], [-48, -50]], { f: P.hairBrown.f, s: P.hairBrown.s, l: P.hairBrown.l, lw: LH });
  }
  const E = { ...EXPR[o.expr || 'neutral'], ...(o.E || {}), plain: true };
  for (const ey of V.eyes) eye(g, { ...P, eye: P.hairBrown }, ey.x, ey.y, ey.w * .92, ey.h * .92, ey.dir, ey.fs, E);
  for (const b of V.brows) brow(g, P, b[0], b[1], b[2], b[3], E.brow || [0, 0, 2]);
  if (view === 'q') { g.fillStyle = P.skin.s; g.beginPath(); g.moveTo(41, 40); g.lineTo(44, 49); g.lineTo(38, 53); g.closePath(); g.fill(); }
  mouth(g, { ...P, lip: mix(P.lip, '#000', .25) }, V.mouth.x, V.mouth.y, V.mouth.w * .9, E.mouth === 'smileopen' ? 'smile' : E.mouth, V.mouth.fs);
  if (o.circlet) cel(g, poly([[view === 'q' ? -58 : -56, -56], [view === 'q' ? 50 : 56, -56], [view === 'q' ? 50 : 56, -46], [view === 'q' ? -58 : -56, -46]]), { f: P.gold.f, s: P.gold.s, l: P.gold.l, lw: LS * .8 });
}

// ——— the mirror's face: drawn on the glow canvas by the scene; here the
// colour-canvas half (a faint serene oval with closed eyes) ———
export function mirrorFace(g, cx, cy, s, open = 0) {
  g.save(); g.translate(cx, cy); g.scale(s, s * 1.28);
  const F = new Path2D(); F.ellipse(0, 0, 52, 62, 0, 0, TAU);
  g.fillStyle = 'rgba(190,240,255,.24)'; g.fill(F);
  g.strokeStyle = 'rgba(170,230,255,.75)'; g.lineWidth = 2.4; g.stroke(F);
  for (const sgn of [-1, 1]) {
    if (open > .1) { g.fillStyle = 'rgba(230,252,255,.95)'; g.beginPath(); g.ellipse(sgn * 20, -6, 6.5, 4 + open * 3, 0, 0, TAU); g.fill(); }
    else { g.strokeStyle = 'rgba(230,252,255,.92)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(sgn * 20 - 8, -6); g.quadraticCurveTo(sgn * 20, -2, sgn * 20 + 8, -6); g.stroke(); }
  }
  g.strokeStyle = 'rgba(230,252,255,.88)'; g.lineWidth = 2.6; g.beginPath();
  g.moveTo(-7, 26); g.quadraticCurveTo(0, 29, 7, 26); g.stroke();
  g.restore();
}
