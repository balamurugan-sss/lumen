// HYBRID TEST — one shot, 10 s: an AI-generated painted backdrop
// (bg.webp) under the film's own code-drawn figures (dwarfs + glass
// coffin from ../chars.js and ../scenes2.js), same CRT post as the
// film. Question it answers: do the two image kinds sit together?
import { canvas, W, H } from '../cel.js';
import { makePost } from '../post.js';
import { PAL } from '../pal.js';
import { dwarf } from '../chars.js';
import { coffinDraw } from '../scenes2.js';

const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
const [ovc, ov] = canvas(W, H);

await document.fonts.load('600 54px "Barlow SC"');
const img = new Image();
await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'bg.webp'; });

const DUR = 10;
const SUB = 'Lần này, không gì có thể đánh thức nàng. Các chú lùn đặt nàng vào quan tài pha lê, để mọi người đều thấy vẻ đẹp của nàng, và thay phiên canh gác trên đồi.';
const ease = x => x * x * (3 - 2 * x);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function sub() {
  ov.clearRect(0, 0, W, H);
  ov.font = '600 54px "Barlow SC"'; ov.textAlign = 'center'; ov.textBaseline = 'middle';
  const words = SUB.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ov.measureText(t).width > 1560 && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  lines.slice(0, 3).forEach((ln, i) => {
    const y = 1080 - 150 + i * 62 - (lines.length - 1) * 31;
    ov.lineWidth = 9; ov.strokeStyle = '#120a1e'; ov.strokeText(ln, 960, y);
    ov.fillStyle = '#fff0a0'; ov.fillText(ln, 960, y);
  });
}

function render(t) {
  const u = ease(clamp(t / DUR));
  // — the generated backdrop, slow push-in —
  const s0 = Math.max(W / img.width, H / img.height), z = 1 + .07 * u, s = s0 * z;
  const dw = img.width * s, dh = img.height * s;
  g.save();
  g.filter = 'saturate(.93) brightness(1.01)';
  g.drawImage(img, (W - dw) / 2 - 34 * u, (H - dh) / 2 - 8 * u, dw, dh);
  g.restore();
  e.clearRect(0, 0, W, H);
  const P = PAL.day;
  // — a soft ground shadow so the figures sit IN the painting —
  g.save(); g.fillStyle = 'rgba(24,38,22,.30)';
  g.beginPath(); g.ellipse(960, 752, 520, 38, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(24,38,22,.22)';
  g.beginPath(); g.ellipse(960, 748, 660, 50, 0, 0, Math.PI * 2); g.fill(); g.restore();
  // — the film's own figures: two carriers at the coffin's ends,
  // the rest standing watch clear of its span —
  const watch = [[300, 0], [408, 1], [1512, 4], [1620, 5]];
  for (const [x, i] of watch) {
    g.save(); g.translate(x, 742 + Math.sin(t * 1.2 + i * 1.7) * 2); g.scale(.88, .88);
    dwarf(g, P, i, { bow: .3 }); g.restore();
  }
  for (const [x, i] of [[618, 2], [1302, 3]]) {
    g.save(); g.translate(x, 748 + Math.sin(t * 1.2 + i) * 2); g.scale(.92, .92);
    dwarf(g, P, i, { bow: .15 }); g.restore();
  }
  coffinDraw(g, P, 960, 640, 1.28, 0);
  g.save(); g.translate(516, 756); g.scale(.9, .9); dwarf(g, P, 6, { bow: .4 }); g.restore();
  // — drifting blossom petals over everything —
  g.save(); g.fillStyle = 'rgba(250,205,225,.85)';
  for (let i = 0; i < 22; i++) {
    const px = ((i * 173 + t * (13 + (i % 5) * 4)) % 2020) - 50;
    const py = ((i * 131 + t * (24 + (i % 3) * 9)) % 1140) - 30;
    g.save(); g.translate(px, py); g.rotate(t * .7 + i);
    g.beginPath(); g.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.restore();
  sub();
  const fr = Math.round(t * 24);
  post.render(sc, gc, fr, ovc, { power: Math.min(1, t / .5), track: 0 });
}
window.render = render; window.DUR = DUR; window.EVENTS = []; window.TEXTS = [];
window.READY = true;
