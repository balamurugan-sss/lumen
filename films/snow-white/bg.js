// Painted background plates for SNOW WHITE: airbrushed gradients and
// soft shapes on the colour canvas, light sources again on the
// emissive canvas so the CRT pass blooms them. Painted once at load.
import { canvas, vgrad, airbrush, poly, path, cel, rng, TAU, rgba, mix, line } from './cel.js';

export function plate(w, h, fn) { const [c, g] = canvas(w, h); fn(g, w, h); return c; }
function trees(g, x0, x1, base, hMin, hMax, col, seed, sparse = 0) {
  const R = rng(seed);
  g.fillStyle = col;
  for (let x = x0; x < x1; x += 26 + R() * 60) {
    if (R() < sparse) continue;
    const th = hMin + R() * (hMax - hMin), tw = th * .3;
    // a pine in three tiers over a short trunk (a single triangle
    // reads as a mountain range, not a tree)
    g.fillRect(x + tw / 2 - 3, base - th * .12, 6, th * .12);
    for (let k = 0; k < 3; k++) {
      const w2 = tw * (1 - k * .24), yb = base - th * (0.06 + k * .3), yt = base - th * (0.42 + k * .3);
      g.beginPath(); g.moveTo(x + tw / 2 - w2 / 2, yb); g.lineTo(x + tw / 2, yt); g.lineTo(x + tw / 2 + w2 / 2, yb); g.closePath(); g.fill();
    }
  }
}
function hills(g, w, base, amp, col, seed) {
  const R = rng(seed), pts = [[0, base]];
  for (let x = 0; x <= w; x += 160) pts.push([x, base - Math.sin(x * .004 + seed) * amp - R() * amp * .4]);
  pts.push([w, base + 400], [0, base + 400]);
  g.fillStyle = col; g.fill(path(pts.map(p => [p[0], p[1]]), true));
}

// ——— winter window (the wish): a wall, a tall ebony-framed window,
// snow country outside ———
export function winterWindow() {
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, [[0, '#3d4450'], [.7, '#2c313c'], [1, '#23262e']]);
    // outside the window
    const wx = 700, wy = 90, ww = 560, wh = 760;
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    vgrad(g, wx, wy, ww, wh, [[0, '#aebfd4'], [.55, '#cfd9e6'], [1, '#eef2f7']]);
    hills(g, w, wy + 560, 60, '#b9c8da', 4); hills(g, w, wy + 660, 50, '#dde6ef', 9);
    trees(g, wx + 20, wx + ww - 20, wy + 640, 60, 130, '#7d92ac', 21);
    g.restore();
    // ebony frame + cross bars
    g.fillStyle = '#17110c'; g.fillRect(wx - 26, wy - 26, ww + 52, 26); g.fillRect(wx - 26, wy + wh, ww + 52, 26);
    g.fillRect(wx - 26, wy, 26, wh); g.fillRect(wx + ww, wy, 26, wh);
    g.fillRect(wx + ww / 2 - 9, wy, 18, wh); g.fillRect(wx, wy + wh * .42, ww, 16);
    g.fillStyle = 'rgba(255,255,255,.13)'; g.fillRect(wx, wy, ww, 10);
    // wall shading + a hanging tapestry edge at left
    airbrush(g, 300, 900, 420, 300, '#101319', .5);
    g.fillStyle = '#4c2430'; g.fillRect(90, 130, 260, 560);
    g.fillStyle = '#5f2f3d'; g.fillRect(104, 144, 232, 532);
    g.fillStyle = '#c8a24e'; g.fillRect(104, 640, 232, 8);
    // window seat cushion
    g.fillStyle = '#5f2f3d'; g.fillRect(wx - 60, wy + wh + 20, ww + 120, 54);
    g.fillStyle = '#71404f'; g.fillRect(wx - 60, wy + wh + 20, ww + 120, 14);
  });
  const e = plate(1920, 1080, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); airbrush(g, 980, 470, 330, 420, '#5a708c', .55); });
  return { c, e };
}

// ——— the mirror chamber, night ———
export function chamber() {
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, [[0, '#141126'], [.6, '#1a1633'], [1, '#0d0b1c']]);
    // floor boards converging
    g.fillStyle = '#241a33'; g.fillRect(0, 830, w, 250);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(960 + i * 90, 830); g.lineTo(960 + i * 260, 1080); g.stroke(); }
    // wall panels
    g.strokeStyle = 'rgba(120,90,180,.16)'; g.lineWidth = 4; g.strokeRect(90, 90, 560, 640); g.strokeRect(1270, 90, 560, 640);
    // candles on stands at both sides
    for (const x of [240, 1680]) {
      g.fillStyle = '#2c2140'; g.fillRect(x - 8, 560, 16, 300);
      g.fillStyle = '#e8e2d2'; g.fillRect(x - 7, 500, 14, 62);
    }
    // the mirror: tall oval in a gold frame, centre-right
    const mx = 1150, my = 430;
    const grd = g.createRadialGradient(mx, my, 60, mx, my, 330);
    grd.addColorStop(0, '#9fd4e8'); grd.addColorStop(.55, '#4a7a9e'); grd.addColorStop(1, '#1c2e4c');
    g.fillStyle = grd; g.beginPath(); g.ellipse(mx, my, 218, 322, 0, 0, TAU); g.fill();
    g.strokeStyle = '#e2b24e'; g.lineWidth = 26; g.beginPath(); g.ellipse(mx, my, 234, 338, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#9a6c28'; g.lineWidth = 6; g.beginPath(); g.ellipse(mx, my, 252, 356, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .34; g.fillStyle = '#e2b24e'; g.beginPath(); g.arc(mx + Math.cos(a) * 246, my - 336 + Math.sin(a) * 30 + 336 - 336, 9, 0, TAU); g.fill(); }
    g.fillStyle = '#e2b24e'; g.beginPath(); g.arc(mx, my - 352, 13, 0, TAU); g.fill();
  });
  const e = plate(1920, 1080, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    airbrush(g, 1150, 430, 215, 300, '#3f88b0', .5);
    airbrush(g, 1150, 430, 120, 180, '#9fd8f2', .42);
    for (const x of [240, 1680]) { airbrush(g, x, 486, 26, 40, '#ffb347', 1); g.fillStyle = '#ffd9a0'; g.beginPath(); g.ellipse(x, 488, 7, 13, 0, 0, TAU); g.fill(); }
  });
  return { c, e };
}

// ——— forest plates for the tracking run (3 parallax layers) ———
export function forestLayer(wd, base, col, seed, hMin, hMax, sparse = 0) {
  return plate(wd, 1080, (g) => {
    g.clearRect(0, 0, wd, 1080);
    trees(g, -40, wd + 40, base, hMin, hMax, col, seed, sparse);
    // trunks + undergrowth strokes
    const R = rng(seed + 7);
    g.strokeStyle = col; g.lineWidth = 5;
    for (let i = 0; i < 40; i++) { const x = R() * wd, y = base - R() * 60; g.beginPath(); g.moveTo(x, base + 30); g.quadraticCurveTo(x + 20 - R() * 40, y, x + 44 - R() * 88, y - 26); g.stroke(); }
  });
}
export function forestSky(pal) {
  return plate(1920, 1080, (g, w, h) => {
    if (pal === 'dusk') vgrad(g, 0, 0, w, h, [[0, '#2c2a55'], [.5, '#6a4460'], [.78, '#c87a4e'], [1, '#3a2c33']]);
    else if (pal === 'day') vgrad(g, 0, 0, w, h, [[0, '#3a7ac2'], [.6, '#8ab8e2'], [1, '#cfe4f4']]);
    else vgrad(g, 0, 0, w, h, [[0, '#101a2e'], [.7, '#1c2c47'], [1, '#24344e']]);
    if (pal === 'dusk') airbrush(g, 420, 800, 300, 90, '#ffab5e', .8);
    if (pal === 'day') { airbrush(g, 1580, 150, 190, 190, '#fff3c2', .95); airbrush(g, 1580, 150, 90, 90, '#fffbe8', 1); }
  });
}

// ——— a foreground frame plate: big near-black pines clustered at
// the two edges only, the middle left open for the figures ———
export function forestFrame() {
  return plate(3200, 1080, (g) => {
    g.clearRect(0, 0, 3200, 1080);
    trees(g, -60, 240, 1080, 640, 1020, '#120a12', 91);
    trees(g, 2960, 3260, 1080, 640, 1020, '#120a12', 97);
  });
}

// ——— the cottage, exterior (dusk, or repainted at golden hour) ———
export function cottageExt(mode = 'dusk') {
  const skies = { dusk: [[0, '#2c2a55'], [.55, '#5d3c58'], [.8, '#a86a4e'], [1, '#4a3430']],
                  gold: [[0, '#4a3a6e'], [.5, '#b85a44'], [.78, '#f2a65e'], [1, '#6e4530']] };
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, skies[mode]);
    hills(g, w, 760, 90, '#33262e', 3); hills(g, w, 880, 70, '#241a20', 6);
    trees(g, 0, 700, 800, 200, 420, '#1d1420', 31); trees(g, 1300, 1920, 820, 240, 460, '#1d1420', 47);
    // the house
    const hx = 760, hy = 560;
    g.fillStyle = '#4c3826'; g.fillRect(hx, hy, 420, 240);
    g.fillStyle = '#5d4630'; for (let i = 0; i < 5; i++) g.fillRect(hx, hy + 20 + i * 46, 420, 7);
    g.fillStyle = '#33241a'; g.fill(path([[hx - 50, hy + 10], [hx + 210, hy - 130], [hx + 470, hy + 10], [hx + 400, hy + 26], [hx + 20, hy + 26]], true));
    g.fillStyle = '#241a12'; g.fillRect(hx + 330, hy - 96, 40, 80);
    // door + windows (lit)
    g.fillStyle = '#2c1c10'; g.fillRect(hx + 178, hy + 96, 64, 144);
    g.fillStyle = '#ffca7a'; g.fillRect(hx + 52, hy + 70, 74, 74); g.fillRect(hx + 292, hy + 70, 74, 74);
    g.fillStyle = '#4c3826'; g.fillRect(hx + 86, hy + 70, 6, 74); g.fillRect(hx + 52, hy + 103, 74, 6); g.fillRect(hx + 326, hy + 70, 6, 74); g.fillRect(hx + 292, hy + 103, 74, 6);
    // path + fence
    g.fillStyle = '#57453a'; g.fill(path([[880, 1080], [950, 800], [1010, 800], [1130, 1080]], true));
    g.strokeStyle = '#2c1e14'; g.lineWidth = 9;
    for (const [x, y] of [[560, 860], [640, 880], [1180, 880], [1260, 860]]) { g.beginPath(); g.moveTo(x, y - 60); g.lineTo(x, y + 30); g.stroke(); }
    g.beginPath(); g.moveTo(520, 830); g.lineTo(700, 856); g.moveTo(1140, 856); g.lineTo(1310, 830); g.stroke();
  });
  const e = plate(1920, 1080, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    airbrush(g, 849, 667, 66, 66, '#ff9a3c', .95); airbrush(g, 1089, 667, 66, 66, '#ff9a3c', .95);
    airbrush(g, 960, 700, 420, 260, '#7a4a26', .35);
  });
  return { c, e };
}

// ——— cottage interior, warm lamplight ———
export function cottageInt() {
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, [[0, '#4a3420'], [.7, '#3a2817'], [1, '#2a1c10']]);
    g.fillStyle = '#241708'; g.fillRect(0, 800, w, 280);
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(960 + i * 80, 800); g.lineTo(960 + i * 240, 1080); g.stroke(); }
    // beams
    g.fillStyle = '#2c1c0c'; g.fillRect(0, 96, w, 34); g.fillRect(300, 0, 34, 130); g.fillRect(1580, 0, 34, 130);
    // fireplace left with mantel
    g.fillStyle = '#5d4630'; g.fillRect(90, 470, 300, 330); g.fillStyle = '#17100a'; g.fillRect(140, 560, 200, 240);
    g.fillStyle = '#33241a'; g.fillRect(70, 440, 340, 34);
    // the row of seven little beds, right background: headboard,
    // mattress, pillow, folded blanket — drawn large enough to read
    for (let i = 0; i < 7; i++) {
      const bx = 896 + i * 140, by = 636;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx + 60, by + 96, 74, 10, 0, 0, TAU); g.fill();
      g.fillStyle = '#4c3826'; g.fillRect(bx, by - 44, 12, 96); g.fillRect(bx + 108, by - 30, 12, 82);
      g.fillStyle = '#5d4630'; g.fillRect(bx, by, 120, 52);
      g.fillStyle = '#e8dfc8'; g.fillRect(bx + 4, by + 4, 112, 44);
      g.fillStyle = '#fff6e2'; g.beginPath(); g.ellipse(bx + 22, by + 16, 17, 10, 0, 0, TAU); g.fill();
      g.fillStyle = ['#b03a2e', '#2e6da0', '#3f8a4e', '#c8922a', '#7a4a9e', '#2a8a8a', '#a05a78'][i];
      g.fillRect(bx + 34, by + 6, 82, 40);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx + 34, by + 6, 82, 6);
    }
    // door, back centre
    g.fillStyle = '#33241a'; g.fillRect(560, 330, 150, 330); g.strokeStyle = '#17100a'; g.lineWidth = 5; g.strokeRect(560, 330, 150, 330);
    g.fillStyle = '#c8a24e'; g.beginPath(); g.arc(688, 510, 7, 0, TAU); g.fill();
    // window with night blue, right of door
    g.fillStyle = '#1c2c47'; g.fillRect(760, 320, 120, 150); g.strokeStyle = '#33241a'; g.lineWidth = 8; g.strokeRect(760, 320, 120, 150);
    // long table (foreground prop zone is drawn by scenes)
    airbrush(g, 240, 700, 200, 130, '#8a4a1e', .35);
  });
  const e = plate(1920, 1080, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    airbrush(g, 240, 720, 120, 110, '#ff8a3c', .9); airbrush(g, 240, 720, 60, 55, '#ffc27a', .95);
    airbrush(g, 820, 395, 70, 90, '#2c4a7a', .5);
  });
  return { c, e };
}

// ——— the coffin hill: one composition, several seasons ———
export function coffinHill(season) {
  const skies = {
    snow: [[0, '#8ea6c2'], [.6, '#c3d2e2'], [1, '#e8eef4']],
    blossom: [[0, '#3a7ac2'], [.6, '#8ab8e2'], [1, '#d8ecf8']],
    gold: [[0, '#4a3a6e'], [.55, '#c86a4e'], [.8, '#f2a65e'], [1, '#7a4a3a']],
    star: [[0, '#0a1030'], [.7, '#16224a'], [1, '#232f57']],
  };
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, skies[season]);
    if (season === 'star') { const R = rng(99); g.fillStyle = '#fff'; for (let i = 0; i < 240; i++) { g.globalAlpha = .35 + R() * .65; g.fillRect(R() * w, R() * 560, 2.4, 2.4); } g.globalAlpha = 1; airbrush(g, 1560, 150, 60, 60, '#f4f0dc', .95); }
    if (season === 'blossom') airbrush(g, 300, 130, 150, 150, '#fff3c2', .8);
    hills(g, w, 830, 70, season === 'snow' ? '#c9d6e4' : season === 'star' ? '#141c38' : '#4a6741', 12);
    hills(g, w, 950, 60, season === 'snow' ? '#e8eef4' : season === 'star' ? '#0d142c' : '#3a5636', 15);
    // the blossom tree, left
    g.strokeStyle = season === 'star' ? '#0a0f22' : '#3c2a1c'; g.lineWidth = 26;
    g.beginPath(); g.moveTo(330, 900); g.quadraticCurveTo(350, 700, 300, 560); g.stroke();
    g.lineWidth = 13; g.beginPath(); g.moveTo(310, 620); g.quadraticCurveTo(220, 520, 130, 520); g.moveTo(315, 600); g.quadraticCurveTo(430, 500, 520, 510); g.stroke();
    if (season !== 'snow' && season !== 'star') { const R = rng(7); for (let i = 0; i < 46; i++) { airbrush(g, 120 + R() * 460, 400 + R() * 190, 34 + R() * 40, 26 + R() * 26, '#f2b8c6', .5); } }
    if (season === 'snow') { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(315, 520, 300, 90, 0, 0, TAU); g.fill(); }
    trees(g, 1300, 1920, 900, 120, 260, season === 'star' ? '#0d142c' : season === 'snow' ? '#8ea2ba' : '#2c4429', 55);
  });
  const e = plate(1920, 1080, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    if (season === 'gold') airbrush(g, 960, 830, 800, 130, '#f28a4e', .5);
    if (season === 'star') airbrush(g, 1560, 150, 80, 80, '#e8e4c8', .8);
  });
  return { c, e };
}

// ——— wedding hall, bright ———
export function hall() {
  const c = plate(1920, 1080, (g, w, h) => {
    vgrad(g, 0, 0, w, h, [[0, '#7a94b8'], [.5, '#a8bcd4'], [1, '#6e5636']]);
    // tall windows
    for (let i = 0; i < 5; i++) {
      const x = 130 + i * 360;
      const grd = g.createLinearGradient(0, 120, 0, 700); grd.addColorStop(0, '#eaf4ff'); grd.addColorStop(1, '#b8d2ec');
      g.fillStyle = grd; g.fillRect(x, 120, 220, 580);
      g.strokeStyle = '#4c3a22'; g.lineWidth = 10; g.strokeRect(x, 120, 220, 580);
      g.beginPath(); g.moveTo(x + 110, 120); g.lineTo(x + 110, 700); g.moveTo(x, 410); g.lineTo(x + 220, 410); g.stroke();
    }
    // banners between windows
    for (let i = 0; i < 4; i++) { const x = 330 + i * 360; g.fillStyle = i % 2 ? '#a01e28' : '#1f6a5e'; g.fill(path([[x, 130], [x + 90, 130], [x + 90, 330], [x + 45, 292], [x, 330]], true)); }
    // floor
    g.fillStyle = '#8a6c42'; g.fillRect(0, 760, w, 320);
    g.strokeStyle = 'rgba(60,40,16,.4)'; g.lineWidth = 3;
    for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(960 + i * 70, 760); g.lineTo(960 + i * 220, 1080); g.stroke(); }
  });
  const e = plate(1920, 1080, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); for (let i = 0; i < 5; i++) airbrush(g, 240 + i * 360, 400, 130, 300, '#7a9ec2', .4); });
  return { c, e };
}

// ——— plain gradient plates (title, transitions) ———
export function gradientPlate(stops) {
  const c = plate(1920, 1080, (g, w, h) => vgrad(g, 0, 0, w, h, stops));
  const e = plate(1920, 1080, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); });
  return { c, e };
}
