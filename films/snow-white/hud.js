// Subtitle layer: Vietnamese captions composited inside the CRT pass
// (they live on the tape): Barlow Semi Condensed 600, cream-yellow,
// thick dark outline, ~96 px above the bottom. Lines wrap to two
// rows when long; each is held for the narration plus 0.6 s.
import { W, H, rgba } from './cel.js';
export function subSpans(lines) {
  const S = lines.map(l => ({ ...l, a: l.t - .05, b: l.t + Math.max(l.dur + .6, 1.9) }));
  S.forEach((s, i) => { if (S[i + 1]) s.b = Math.min(s.b, S[i + 1].a); });
  return S;
}
function wrap(c, text, maxW) {
  const words = text.split(' '), rows = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur) { rows.push(cur); cur = w; } else cur = t;
  }
  if (cur) rows.push(cur);
  return rows.slice(0, 2);
}
export function hud(c, t, spans, durTotal) {
  c.clearRect(0, 0, W, H);
  if (t > durTotal - 0.7) return;
  const v = spans.find(s => t >= s.a && t < s.b); if (!v) return;
  c.save(); c.font = '600 54px "Barlow SC"'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const rows = wrap(c, v.vi, 1560);
  const lh = 62, y0 = H - 96 - (rows.length - 1) * lh / 2 - 10;
  c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
  rows.forEach((r, i) => {
    const x = (W - c.measureText(r).width) / 2, y = y0 + i * lh;
    c.strokeStyle = '#120a1e'; c.lineWidth = 9; c.strokeText(r, x, y);
    c.fillStyle = '#fff0a0'; c.fillText(r, x, y);
  });
  c.restore();
}
