// Colour models for SNOW WHITE — each character defined once, then
// re-specified per lighting set by multiplying lit / shadow / line
// separately (the 80s "time-band colour specification"), with skin
// overridden by hand where a multiplier would turn faces pink.
import { hex } from './cel.js';

const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };

export const BASE = {
  skin:  { f: '#ffd9c0', s: '#e0a08e', h: '#fff2e6', l: '#5f3030' },
  skinQ: { f: '#f6cdb2', s: '#d59a86', h: '#ffeee0', l: '#55262e' },   // the queens: a touch cooler
  blush: '#ff9d94',
  lip:   '#c03a44',
  hairSnow:  { f: '#241c30', s: '#100b1a', h: '#5d5480', l: '#0a0612' },
  hairQueen: { f: '#2c1e3e', s: '#170e26', h: '#6a4f96', l: '#0e0819' },
  hairBrown: { f: '#5a3a26', s: '#38220f', h: '#96684a', l: '#241205' },
  hairGrey:  { f: '#c9c4bb', s: '#8f887c', h: '#ffffff', l: '#4c463d' },
  eyeSnow:  { f: '#5a3a26', s: '#2e1a0c', h: '#c89a68', l: '#1c0e04' },  // brown eyes
  eyeQueen: { f: '#3a5f8a', s: '#1c2e4c', h: '#9cc2e8', l: '#0c1626' },  // cold blue
  white_eye: '#fdf9ff',
  mouth: '#9a3b4a',
  // Snow White's dress — teal bodice, cream blouse, russet skirt, red sash (her accent)
  dress:  { f: '#1f6a5e', s: '#11443d', h: '#5aa892', l: '#081f1c' },
  blouse: { f: '#f6ead2', s: '#d8c09a', h: '#fffaf0', l: '#7a6238' },
  skirt:  { f: '#a34a32', s: '#6e2c1c', h: '#cf7a58', l: '#3c140a' },
  sash:   { f: '#c8262e', s: '#8c141c', h: '#ff8a7a', l: '#4c060a' },
  // the Queen
  gown:   { f: '#5b2a86', s: '#341452', h: '#9668c8', l: '#180a2c' },
  gownQ1: { f: '#5d748c', s: '#364a5e', h: '#9ab2c8', l: '#1c2a3a' },
  gold:   { f: '#e2b24e', s: '#9a6c28', h: '#fff0b0', l: '#4d3210' },
  cloak:  { f: '#5a4232', s: '#38281a', h: '#8a6a4e', l: '#20140a' },   // pedlar disguise
  // men
  jerkin: { f: '#4a5a34', s: '#2c381c', h: '#7a8c58', l: '#141c0a' },   // huntsman
  tunic:  { f: '#e8e2d2', s: '#b8b09a', h: '#ffffff', l: '#5c5644' },   // prince
  cape:   { f: '#a01e28', s: '#64101a', h: '#d85a62', l: '#38060c' },
  // dwarfs — one model, seven hats / tunics
  hat: ['#b03a2e', '#2e6da0', '#3f8a4e', '#c8922a', '#7a4a9e', '#2a8a8a', '#a05a78'],
  dwarfTunic: ['#7a4a2c', '#4a6741', '#5d5a8a', '#8a6a2c', '#6e3a4e', '#3a6e6a', '#74584a'],
  beard: ['#c9c4bb', '#8a6a4a', '#e8e2d2', '#5a3a26', '#a89a86', '#3a3230', '#b09a7a'],
  wood:  { f: '#7a5636', s: '#4c3016', h: '#a87e52', l: '#2a1808' },
  woodDark: { f: '#4c3418', s: '#2c1c0c', h: '#6e4c26', l: '#160c04' },
  stone: { f: '#8a8d96', s: '#55565e', h: '#c2c4cc', l: '#2c2d33' },
  apple: { f: '#c8262e', s: '#7c1218', h: '#ff9a8a', l: '#4c060a' },
  appleW: { f: '#f2e3c2', s: '#cbb489', h: '#fffaf0', l: '#7a6238' },
  glass: { f: '#bfe0e8', s: '#7aa7b4', h: '#ffffff', l: '#3c5f6a' },
};

// lighting sets: f/h multiplied by lit, s by shade, l by line
export const LIGHTS = {
  day:     { lit: [1, 1, 1],          shade: [1, 1, 1],          line: [1, 1, 1] },
  winter:  { lit: [.92, .97, 1.08],   shade: [.8, .86, 1.05],   line: [.9, .92, 1.05] },
  chamber: { lit: [.72, .68, .98],    shade: [.5, .44, .9],     line: [.72, .62, 1.05] },
  dusk:    { lit: [.88, .76, .92],    shade: [.68, .54, .8],    line: [.85, .72, .95] },
  cottage: { lit: [1.06, .94, .78],   shade: [.9, .74, .6],     line: [1, .9, .78] },
  gold:    { lit: [1.07, .94, .8],    shade: [.88, .7, .66],    line: [1, .88, .8] },
  star:    { lit: [.55, .6, .95],     shade: [.38, .4, .82],    line: [.55, .55, .95] },
  sil:     { lit: [.16, .13, .28],    shade: [.1, .08, .2],     line: [.24, .16, .42] },
};
export function palette(name) {
  const L = LIGHTS[name], out = {};
  for (const [k, v] of Object.entries(BASE)) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    if (Array.isArray(v)) { out[k] = v.map(c => mul(c, L.lit)); continue; }
    out[k] = {};
    for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  return out;
}
export const PAL = {};
for (const n of Object.keys(LIGHTS)) PAL[n] = palette(n);
// night-chamber skin by hand (multipliers alone turn it pink)
Object.assign(PAL.chamber.skin,  { f: '#e6c4c6', s: '#8d7cb0', h: '#fdf0f2' });
Object.assign(PAL.chamber.skinQ, { f: '#dec0c8', s: '#8470a8', h: '#f8ecee' });
Object.assign(PAL.star.skin,     { f: '#cdb6c4', s: '#6e639a', h: '#eee4f2' });
// dusk by hand too: the multiplier alone pushes skin pink
Object.assign(PAL.dusk.skin,     { f: '#f0c2a4', s: '#b0826e', h: '#fde8da' });
