// Effects for SNOW WHITE: snowfall, blossom fall, flares, the
// mirror's shimmer, impact frames. Deterministic in t.
import { TAU, rng, rgba, hash } from './cel.js';

// falling particles (snow or blossom): n flakes on looping paths
export function fall(g, t, n, o = {}) {
  const { w = 1920, h = 1080, col = '#ffffff', rMin = 1.6, rMax = 3.6, speed = 46, sway = 26, alpha = .85, seed = 3, petal = false } = o;
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const fx = R(), fy = R(), fr = R(), fs = R();
    const fallSpan = h + 80;
    let y = ((fy * fallSpan + t * speed * (0.6 + fs * 0.8)) % fallSpan) - 40;
    const x = fx * w + Math.sin(t * (0.5 + fs) + fr * TAU) * sway + t * (o.wind || 0) % w;
    const r = rMin + fr * (rMax - rMin);
    g.save(); g.globalAlpha = alpha * (0.5 + fr * 0.5); g.fillStyle = col;
    if (petal) {
      g.translate(x, y); g.rotate(fr * TAU + t * (0.6 + fs));
      g.beginPath(); g.ellipse(0, 0, r * 1.7, r, 0, 0, TAU); g.fill();
    } else { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.restore();
  }
}

// a star-burst flare on the emissive canvas
export function flare(e, x, y, s = 1, col = '#cfe8ff') {
  e.save(); e.translate(x, y); e.scale(s, s);
  e.fillStyle = col;
  e.beginPath(); e.ellipse(0, 0, 10, 10, 0, 0, TAU); e.fill();
  e.globalAlpha = .8;
  e.fillRect(-90, -2.5, 180, 5); e.fillRect(-2.5, -90, 5, 180);
  e.globalAlpha = .4;
  e.save(); e.rotate(Math.PI / 4); e.fillRect(-56, -1.8, 112, 3.6); e.fillRect(-1.8, -56, 3.6, 112); e.restore();
  e.restore();
}

// a soft lamp glow pair (colour halo + emissive core)
export function lamp(g, e, x, y, r, col, a = 1) {
  g.save(); g.globalAlpha = .16 * a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
  e.save(); e.globalAlpha = a; e.fillStyle = col; e.beginPath(); e.arc(x, y, r * .34, 0, TAU); e.fill(); e.restore();
}

// mirror shimmer: slow vertical light bands travelling across a region
export function shimmer(g, x, y, w, h, t, col = '#bfe6ff') {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let i = 0; i < 3; i++) {
    const bx = x + ((t * 30 + i * w * .45) % (w * 1.6)) - w * .3;
    const grd = g.createLinearGradient(bx - 60, 0, bx + 60, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(.5, 'rgba(255,255,255,.13)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(bx - 60, y, 120, h);
  }
  g.restore();
}

// impact frame: monochrome silhouette flash over radial lines.
// The scene draws this INSTEAD of the normal frame for 2 frames.
export function impact(g, cx, cy, drawSilhouette, col = '#f4f0ff') {
  g.fillStyle = '#0c0a18'; g.fillRect(0, 0, 1920, 1080);
  g.save(); g.strokeStyle = col; g.globalAlpha = .5;
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * TAU + hash(i) * .1, r0 = 130 + hash(i * 3) * 90, r1 = 1000;
    g.lineWidth = 2 + hash(i * 7) * 4;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
  }
  g.restore();
  drawSilhouette(g);
}
