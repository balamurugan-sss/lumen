// KHẢO SÁT MEA — a LiDAR Survey film about the user's Muse agent.
// The cloud is a simulation built from Mea's real system inventory
// (method in FACTS.md); the film says so on screen.
// render(t) is deterministic: every frame can be drawn alone.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { T, BEAT, CAM, PEEL_STEPS, CUT_FINAL } from './timeline.js';

const W = 1920, H = 1080, DUR = T.dur;
const Q = new URLSearchParams(location.search);
const SS = Q.get('ss') ? +Q.get('ss') : 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = h => new THREE.Vector3(...hex(h).map(c => Math.pow(c, 2.2)));
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ---------------- palette (STYLE.md §3) ----------------
const C = {
  bg: '#05080a', fog: '#0a1013',
  vLow: '#1f3f35', vMid: '#5c9a7a', vHigh: '#e2f3dc', gpt: '#c8b38c',
  clay: '#bdb5a6', shade: '#26303a', scan: '#d4fff0', amber: '#ffb347',
  ink: '#eef3f1', dim: '#a9b8b3', faint: '#7f908b',
  cls: ['#5c9a7a', '#83c495', '#c8b38c', '#6e8fa3', '#9aa7a3'], // memory, skills, goals, spoofx, system
};

const [facts, pbuf, gbuf] = await Promise.all([
  fetch('data/facts.json').then(r => r.json()),
  fetch('data/points.bin').then(r => r.arrayBuffer()),
  fetch('data/ground.bin').then(r => r.arrayBuffer()),
]);
const q = facts.quant;

// ---------------- renderer ----------------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(SS); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
renderer.setClearColor(new THREE.Color().setRGB(...hex(C.bg).map(c => Math.pow(c, 2.2))), 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 5000);
camera.rotation.order = 'YXZ';

const U = {
  uF1: { value: -1e4 }, uF2: { value: -1e4 }, uCut: { value: 99 }, uT: { value: 0 },
  uPx: { value: SS }, uProj: { value: 1 }, uGhost: { value: 0 }, uClass: { value: 0 }, uTrace: { value: 0 },
  uFog: { value: lin(C.fog) }, uBg: { value: lin(C.bg) }, uScan: { value: lin(C.scan) }, uAmber: { value: lin(C.amber) },
};

// ---------------- points ----------------
const N = new Uint32Array(pbuf, 0, 1)[0];
let o = 4;
const ppos = new Uint16Array(pbuf, o, N * 3); o += N * 6;
const phag = new Uint8Array(pbuf, o, N); o += N;
const pcls = new Uint8Array(pbuf, o, N); o += N;
const pint = new Uint8Array(pbuf, o, N); o += N;
const prnd = new Uint8Array(pbuf, o, N);
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.Uint16BufferAttribute(ppos, 3));
pg.setAttribute('hag', new THREE.Uint8BufferAttribute(phag, 1));
pg.setAttribute('cls', new THREE.Uint8BufferAttribute(pcls, 1));
pg.setAttribute('inten', new THREE.Uint8BufferAttribute(pint, 1, true));
pg.setAttribute('rnd', new THREE.Uint8BufferAttribute(prnd, 1, true));
const pointVS = (ghost) => /* glsl */`
  attribute float hag, cls, inten, rnd;
  uniform vec3 uOff, uSc, cLow, cMid, cHigh, uFog, uScan;
  uniform vec3 cCls0, cCls1, cCls2, cCls3, cCls4;
  uniform float uF1, uF2, uCut, uPx, uProj, uGhost, uClass, uT;
  varying vec3 vCol;
  void main(){
    vec3 L = position * uSc + uOff;                  // east, north, up
    float h = hag / 8.0;
    float k = 1.0, hot = 0.0, lift = 0.0;
    k *= step(0.0, uF1 - L.x);                        // points exist behind the scan line only
    hot += exp(-max(uF1 - L.x, 0.0) / 6.0) * step(0.0, uF1 - L.x) * step(uF1, 400.0);
    float above = h - uCut;                           // the cutting plane peels from the top
    ${ghost ? `
    k = uGhost * step(${'' + CUT_FINAL}, h) * step(0.0, uF1 - L.x);
    ` : `
    if (above > 0.0) {
      lift = above * 1.8 + above * above * 0.3;
      k *= 1.0 - smoothstep(0.0, 5.0, above);
      hot += exp(-abs(above) / 0.7) * step(uCut, 30.0) * 0.9;
    }
    if (uF2 > -9000.0) k *= 1.0 - smoothstep(-2.0, 10.0, uF2 - L.x);   // condensed points give way to the surface
    `}
    vec3 P = vec3(L.x, L.z + lift, -L.y);
    vec4 mv = modelViewMatrix * vec4(P, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = clamp(${'0.16'} * uProj / dist, 1.0 * uPx, 3.6 * uPx) * k * (1.0 + 0.8 * hot);
    if (k < .02) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    float u = clamp((h - 3.0) / 17.0, 0.0, 1.0);
    vec3 c = u < .45 ? mix(cLow, cMid, u / .45) : mix(cMid, cHigh, (u - .45) / .55);
    c *= mix(.55, 1.2, inten);
    vec3 cc = cls < 0.5 ? cCls0 : cls < 1.5 ? cCls1 : cls < 2.5 ? cCls2 : cls < 3.5 ? cCls3 : cCls4;
    cc *= mix(.6, 1.15, inten);
    c = mix(c, cc, uClass);
    c = mix(c, uScan * 1.8, clamp(hot, 0.0, 1.0));
    ${ghost ? 'c = uScan * (0.07 + 0.09 * inten);' : ''}
    float fog = 1.0 - exp(-dist / 1600.0);
    vCol = mix(c, uFog, fog * .7);
  }`;
const pointFS = /* glsl */`
  varying vec3 vCol;
  void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r2 = dot(p, p); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * (1.0 - .3 * r2), 1.0); }`;
const pUni = () => ({ ...U, uOff: { value: new THREE.Vector3(q.OX * q.SXY, q.OY * q.SXY, q.OZ) }, uSc: { value: new THREE.Vector3(q.SXY, q.SXY, q.SZ) },
  cLow: { value: lin(C.vLow) }, cMid: { value: lin(C.vMid) }, cHigh: { value: lin(C.vHigh) },
  cCls0: { value: lin(C.cls[0]) }, cCls1: { value: lin(C.cls[1]) }, cCls2: { value: lin(C.cls[2]) }, cCls3: { value: lin(C.cls[3]) }, cCls4: { value: lin(C.cls[4]) } });
const pmat = new THREE.ShaderMaterial({ uniforms: pUni(), vertexShader: pointVS(false), fragmentShader: pointFS });
const gmat = new THREE.ShaderMaterial({ uniforms: pUni(), vertexShader: pointVS(true), fragmentShader: pointFS,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(pg, pmat); points.frustumCulled = false; scene.add(points);
const ghost = new THREE.Points(pg, gmat); ghost.frustumCulled = false; ghost.renderOrder = 5; scene.add(ghost);

// ---------------- surface (heightfield from the surviving points) ----------------
const [GW, GH] = new Uint32Array(gbuf, 0, 2);
const [GX0, GY0, RES, GOZ, GSZ] = new Float32Array(gbuf, 8, 5);
o = 28;
const zc = new Uint16Array(gbuf.slice(o, o + GW * GH * 2)); o += GW * GH * 2;
const nq = new Int8Array(gbuf, o, GW * GH * 3); o += GW * GH * 3;
const lt = new Uint8Array(gbuf, o, GW * GH * 4);
const gridMesh = (gw, gh, x0, y0, res, zarr, oz, sz) => {
  const pos = new Float32Array(gw * gh * 3);
  for (let j = 0, v = 0; j < gh; j++) for (let i = 0; i < gw; i++, v++) {
    pos[v * 3] = x0 + i * res; pos[v * 3 + 1] = oz + zarr[v] * sz; pos[v * 3 + 2] = -(y0 + j * res);
  }
  const idx = new Uint32Array((gw - 1) * (gh - 1) * 6);
  for (let j = 0, k = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
    const a = j * gw + i, b2 = a + 1, c2 = a + gw, d = c2 + 1;
    idx[k++] = a; idx[k++] = b2; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = c2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
};
const zAt = (x, y) => {
  const i = clamp((x - GX0) / RES, 0, GW - 1.001), j = clamp((y - GY0) / RES, 0, GH - 1.001);
  const i0 = Math.floor(i), j0 = Math.floor(j), fx = i - i0, fy = j - j0;
  const g = (a, b2) => GOZ + zc[b2 * GW + a] * GSZ;
  return lerp(lerp(g(i0, j0), g(i0 + 1, j0), fx), lerp(g(i0, j0 + 1), g(i0 + 1, j0 + 1), fx), fy);
};
const gg = gridMesh(GW, GH, GX0, GY0, RES, zc, GOZ, GSZ);
gg.setAttribute('nrm', new THREE.Int8BufferAttribute(nq, 3, true));
gg.setAttribute('lt', new THREE.Uint8BufferAttribute(lt, 4, true));
const SUN = new THREE.Vector3(Math.sin(-45 * Math.PI / 180) * Math.cos(26 * Math.PI / 180), Math.sin(26 * Math.PI / 180), -Math.cos(-45 * Math.PI / 180) * Math.cos(26 * Math.PI / 180)).normalize();
const gmesh = new THREE.Mesh(gg, new THREE.ShaderMaterial({
  uniforms: { ...U, uSun: { value: SUN }, cClay: { value: lin(C.clay) }, cShade: { value: lin(C.shade) } },
  vertexShader: /* glsl */`
    attribute vec3 nrm; attribute vec4 lt;
    varying vec3 vN, vW; varying vec4 vL; varying float vDist;
    void main(){ vN = nrm; vL = lt; vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: /* glsl */`
    uniform vec3 uSun, cClay, cShade, uFog, uBg, uScan, uAmber;
    uniform float uF2, uTrace, uT;
    varying vec3 vN, vW; varying vec4 vL; varying float vDist;
    void main(){
      vec2 en = vec2(vW.x, -vW.z);
      float behind = uF2 - en.x;
      if (behind < 0.0) discard;
      vec3 n = normalize(vN);
      float ao = vL.x, bord = vL.y, ord = vL.z, lr = (vL.w - .5) * 2.0;
      float ndl = max(dot(n, uSun), 0.0);
      vec3 col = cClay * (1.25 * ndl + .22 * (.4 + .6 * ao)) + cShade * .25 * (1.0 - ndl);
      col *= .78 + .8 * lr;
      col *= .5 + .5 * ao;
      float cy = vW.y / 2.0, cw = fwidth(cy);
      float ct = 1.0 - smoothstep(cw * .6, cw * 1.6, min(fract(cy), 1.0 - fract(cy)));
      float c10 = 1.0 - smoothstep(cw * .2, cw * 1.0, min(fract(vW.y / 10.0), 1.0 - fract(vW.y / 10.0)) * 5.0);
      col = mix(col, col * .68, ct * .5 * smoothstep(900.0, 250.0, vDist));
      col = mix(col, col * .58, c10 * .65);
      float fill = smoothstep(2.0, 60.0, behind);
      col = mix(uScan * .12, col, fill);
      col += uScan * 1.6 * exp(-behind / 0.9);
      // district borders: traced features, lit in order (ord = 0, .25, .5, .75, 1)
      float on = step(ord, uTrace) * step(0.001, uTrace);
      float head = exp(-abs(uTrace - ord) / .05) * step(0.001, uTrace) * (1.0 - step(1.1, uTrace));
      float line = pow(bord, 3.0);
      col = mix(col, uAmber * 1.05, clamp(line, 0.0, 1.0) * on * .85);
      col *= .78;
      col += uAmber * bord * head * 1.4;
      float fog = 1.0 - exp(-vDist / 1500.0);
      col = mix(col, uFog, fog * .85);
      gl_FragColor = vec4(col, 1.0);
    }`,
}));
gmesh.frustumCulled = false; scene.add(gmesh);

// ---------------- post ----------------
const composer = new EffectComposer(renderer);
composer.setPixelRatio(SS); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .38, .45, .96));
composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uV: { value: .34 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uV; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 p = vUv - .5; p.x *= 1.5; c.rgb *= 1.0 - uV * smoothstep(.3, .95, length(p)); gl_FragColor = c; }`,
}));

// ---------------- camera ----------------
function camAt(t) {
  const K = CAM; let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const k0 = K[Math.max(0, i - 1)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(K.length - 1, i + 2)];
  const u = clamp((t - k1[0]) / (k2[0] - k1[0]), 0, 1);
  const out = [];
  for (let c = 1; c < 8; c++) {
    const p0 = k0[c], p1 = k1[c], p2 = k2[c], p3 = k3[c];
    const d1 = k2[0] - k1[0];
    const m1 = (p2 - p0) / Math.max(1e-6, k2[0] - k0[0]) * d1, m2 = (p3 - p1) / Math.max(1e-6, k3[0] - k1[0]) * d1;
    const u2 = u * u, u3 = u2 * u;
    out.push((2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2);
  }
  return { tx: out[0], ty: out[1], tz: out[2], dist: out[3], head: out[4], pitch: out[5], fov: out[6] };
}
function placeCamera(t) {
  const c = camAt(t);
  const h = c.head * Math.PI / 180, p = c.pitch * Math.PI / 180;
  const f = new THREE.Vector3(Math.sin(h) * Math.cos(p), -Math.sin(p), -Math.cos(h) * Math.cos(p));
  camera.position.set(c.tx, c.ty, c.tz).addScaledVector(f, -c.dist);
  camera.rotation.set(-p, -h, 0, 'YXZ');
  camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return c;
}

// ---------------- state of the medium over time ----------------
const F1 = t => t < T.scan1 ? -1e4 : t >= T.scan1End ? 1e4 : lerp(-215, 215, eio(seg(t, T.scan1, T.scan1End)));
const F2 = t => t < T.turn ? -1e4 : t >= T.turnEnd + 1.2 ? 1e4 : lerp(-215, 220, ss(seg(t, T.turn, T.turnEnd + .3)));
function cutAt(t) {
  if (t < T.peelArrive) return 99;
  if (t < T.peel) return lerp(24, PEEL_STEPS[0], eo(seg(t, T.peelArrive, T.peel)));
  const steps = [...PEEL_STEPS, CUT_FINAL];
  const k = Math.min(PEEL_STEPS.length - 1, Math.floor((t - T.peel) / (2 * BEAT)));
  const u = eo(seg(t - T.peel - k * 2 * BEAT, 0, 2 * BEAT * .55));
  return lerp(steps[k], steps[k + 1], u);
}

// ---------------- overlay ----------------
const ov = document.getElementById('ov'), g2 = ov.getContext('2d');
const SANS = '"Noto Sans"', MONO = '"Plex Mono"', COND = '"Barlow Condensed"';
await Promise.all([`500 30px ${SANS}`, `700 70px ${SANS}`, `300 120px ${COND}`, `400 30px ${COND}`, `500 30px ${COND}`, `400 20px ${MONO}`, `500 20px ${MONO}`]
  .map(f => document.fonts.load(f, 'KHẢO SÁT MEA điểm tệp 0123')));
const TXT = [];
const proj = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return { x: (p.x * .5 + .5) * W, y: (-p.y * .5 + .5) * H, ok: p.z < 1 }; };
const projEN = (e, n, up = 0) => proj(e, zAt(e, n) + up, -n);
function text(id, s, x, y, font, col, a = 1, align = 'left', reg = true, shadow = true) {
  if (a <= 0.002) return 0;
  g2.save(); g2.globalAlpha = a; g2.font = font; g2.fillStyle = col; g2.textAlign = align; g2.textBaseline = 'alphabetic';
  if (shadow) { g2.shadowColor = 'rgba(0,0,0,.7)'; g2.shadowBlur = 8; }
  g2.fillText(s, x, y); const m = g2.measureText(s); g2.restore();
  const w = m.width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  if (reg && a > .35) TXT.push({ id, text: s, x0, y0: y - m.actualBoundingBoxAscent, x1: x0 + w, y1: y + m.actualBoundingBoxDescent });
  return w;
}
function line(pts, col, w, a = 1, halo = true) {
  if (a <= 0) return;
  g2.save(); g2.lineCap = 'round'; g2.lineJoin = 'round';
  if (halo) { g2.globalAlpha = a * .55; g2.strokeStyle = '#000'; g2.lineWidth = w + 3; g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.stroke(); }
  g2.globalAlpha = a; g2.strokeStyle = col; g2.lineWidth = w; g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p.x, p.y) : g2.moveTo(p.x, p.y)); g2.stroke(); g2.restore();
}
function plate(x, y, r, a) {
  if (a <= 0) return;
  const gr = g2.createRadialGradient(x, y, 10, x, y, r);
  gr.addColorStop(0, `rgba(3,6,7,${.72 * a})`); gr.addColorStop(1, 'rgba(3,6,7,0)');
  g2.fillStyle = gr; g2.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function reading(id, t, t0, t1, x, y, label, value, unit, src, roll, anchorEN) {
  const a = seg(t, t0, t0 + .35) * (1 - seg(t, t1 - .35, t1));
  if (a <= 0) return;
  plate(x + 170, y - 30, 400, a);
  if (anchorEN) {
    const p = projEN(anchorEN[0], anchorEN[1], 3);
    if (p.ok) line([{ x: x - 24, y: y - 34 }, { x: p.x, y: p.y }], C.amber, 1.5, a * .8);
  }
  text(id + 'L', label, x, y - 112, `500 30px ${SANS}`, C.ink, a);
  let shown = value;
  if (roll) { const u = eo(seg(t, roll[0], roll[1])); shown = roll[2](u); }
  const pop = 1 + .05 * Math.sin(Math.PI * seg(t, roll ? roll[1] : t0 + .2, (roll ? roll[1] : t0 + .2) + .3));
  g2.save(); g2.translate(x, y); g2.scale(pop, pop);
  const w = text(id + 'V', shown, 0, 0, `300 124px ${COND}`, C.amber, a, 'left', false);
  text(id + 'U', unit, w + 12, 0, `400 44px ${COND}`, C.amber, a, 'left', false);
  g2.restore();
  g2.font = `300 124px ${COND}`; const wv = g2.measureText(value).width;
  if (a > .35) TXT.push({ id: id + 'V', text: value + ' ' + unit, x0: x, y0: y - 95, x1: x + wv + 70, y1: y + 4 });
  if (src) text(id + 'S', src, x, y + 46, `500 21px ${SANS}`, C.dim, a);
}
const xPrefix = []; { let s = 0; for (const c of facts.x_cum) { s += c; xPrefix.push(s); } }
const pointsAtX = x => { const bIdx = clamp(Math.floor((x + 200) / 10), 0, 39); return xPrefix[bIdx] || 0; };

function drawOverlay(t, cut) {
  g2.clearRect(0, 0, W, H); TXT.length = 0;
  // ---- instruments, top left ----
  const ia = seg(t, .2, .8) * (1 - .8 * seg(t, T.end - .2, T.end + .4));
  plate(270, 70, 430, ia * .8);
  text('i1', 'MEA · MUSE — AGENT CÁ NHÂN CỦA BOSS', 72, 82, `500 26px ${SANS}`, C.ink, ia);
  text('i2', 'KHUNG 400 × 300 M (MÔ PHỎNG) · 21.10.2026', 72, 116, `400 20px ${MONO}`, C.dim, ia);
  if (t < T.scan1End) {
    const n = t < T.scan1 ? 0 : pointsAtX(F1(t));
    // a running counter is not registered for readcheck; the settled
    // totals register as i3b once the scan completes
    text('i3a', `ĐANG QUÉT… ${fmt(n)} ĐIỂM`, 72, 146, `400 20px ${MONO}`, C.dim, ia, 'left', false);
  } else {
    text('i3b', `${fmt(facts.points)} ĐIỂM · ${fmt(facts.files)} TỆP · ${fmt(facts.bytes)} BYTE`, 72, 146, `400 20px ${MONO}`, C.dim, ia);
  }
  if (t > T.turn + .8) text('i4', 'CAO ĐỘ ĐIỂM = log DUNG LƯỢNG TỆP + ĐỘ SÂU THƯ MỤC', 72, 176, `400 19px ${MONO}`, C.faint, ia * seg(t, T.turn + .8, T.turn + 1.2));
  // ---- honesty line, bottom left, whole film ----
  text('disc', 'QUÉT MÔ PHỎNG TỪ DỮ LIỆU HỆ THỐNG CỦA MEA — KHÔNG PHẢI LiDAR HÀNG KHÔNG · 1 ĐIỂM ≈ 256 BYTE',
    72, 1032, `500 20px ${SANS}`, C.faint, seg(t, .8, 1.6));
  // ---- title ----
  {
    const a = seg(t, T.title, T.title + .4) * (1 - seg(t, T.titleOff - .4, T.titleOff));
    if (a > 0) {
      const p = projEN(0, 10, 30);
      text('title', 'KHẢO SÁT MEA', p.x, p.y, `700 84px ${SANS}`, C.ink, a, 'center');
      text('titlesub', 'ĐÁM MÂY ĐIỂM CỦA MỘT AGENT', p.x, p.y + 52, `400 34px ${COND}`, C.dim, a, 'center');
    }
  }
  // ---- scan line label ----
  if (t > T.scan1 && t < T.scan1End + .2) {
    const a = seg(t, T.scan1, T.scan1 + .3) * (1 - seg(t, T.scan1End - .2, T.scan1End + .1));
    const p = projEN(F1(t), -60, 26);
    if (p.ok) text('scanlbl', 'ĐANG QUÉT ▸', p.x + 14, p.y, `500 24px ${SANS}`, C.scan, a, 'left', false);
  }
  // ---- height ruler during the peel ----
  {
    const a = seg(t, T.peelArrive, T.peelArrive + .3) * (1 - seg(t, T.peelEnd + .3, T.peelEnd + .7));
    if (a > 0) {
      const x = 1780, y0 = 780, y1 = 300, hm = 20;
      line([{ x, y: y0 }, { x, y: y1 }], C.ink, 1.5, a * .8);
      for (let m = 0; m <= hm; m += 2) {
        const y = lerp(y0, y1, m / hm), big = m % 10 === 0;
        line([{ x: x - (big ? 14 : 7), y }, { x, y }], C.ink, 1.2, a * (big ? .9 : .5), false);
        if (big) text('rul' + m, `${m} m`, x - 22, y + 7, `400 20px ${MONO}`, C.dim, a, 'right');
      }
      const cv = clamp(cut, 0, hm), yc = lerp(y0, y1, cv / hm);
      line([{ x: x - 40, y: yc }, { x: x + 26, y: yc }], C.scan, 2.5, a);
      const hist = facts.hag_hist, mx = Math.max(...hist);
      g2.save(); g2.globalAlpha = a * .85;
      for (let i = 0; i < hist.length; i++) {
        const y = lerp(y0, y1, (i + .5) / hm), wv = hist[i] / mx * 64;
        g2.fillStyle = i > cv ? 'rgba(212,255,240,.20)' : 'rgba(131,196,149,.85)';
        g2.fillRect(x + 6, y - 2, wv, 2.5);
      }
      g2.restore();
      text('rulL', 'CHIỀU CAO ĐIỂM', x + 4, y1 - 28, `500 24px ${SANS}`, C.ink, a, 'center');
    }
  }
  // ---- readings ----
  const cen = facts.centroids;
  reading('r1', t, T.r1, T.r1Off, 1150, 430, 'BỘ NHỚ DÀI HẠN', fmt(facts.memory_files), 'tệp',
    `${fmt(facts.memory_bytes)} byte — nhật ký, ngân hàng ký ức`, [T.r1, T.r1Land, u => fmt(u * facts.memory_files)], cen.memory);
  reading('r2', t, T.r2, T.r2Off, 1150, 650, 'KỸ NĂNG ĐÃ NẠP', fmt(facts.skills_total), 'skill',
    `${facts.skills_custom} tự xây · ${facts.skills_system} hệ thống`, [T.r2, T.r2Land, u => fmt(u * facts.skills_total)], cen.skills);
  reading('r3', t, T.r3, T.r3Off, 1150, 430, 'MỤC TIÊU ĐANG THEO', fmt(facts.goals), 'mục tiêu',
    'mỗi mục tiêu một không gian làm việc riêng', [T.r3, T.r3Land, u => fmt(u * facts.goals)], cen.goals);
  reading('r4', t, T.r4, T.dur + 1, 1060, 560, 'TOÀN BỘ HỆ THỐNG', fmt(facts.files), 'tệp',
    `${fmt(facts.points)} điểm · ${facts.days} ngày ghi chép`, null, null);
  // ---- end card ----
  {
    const a = seg(t, T.end, T.end + .6);
    if (a > 0) {
      const x = 150, y = 470;
      g2.save(); const lg = g2.createLinearGradient(0, 0, 1100, 0); lg.addColorStop(0, `rgba(3,6,7,${.7 * a})`); lg.addColorStop(1, 'rgba(3,6,7,0)');
      g2.fillStyle = lg; g2.fillRect(0, 0, 1100, H); g2.restore();
      text('e1', 'MEA — ĐÃ KHẢO SÁT', x, y, `700 64px ${SANS}`, C.ink, a);
      text('e2', 'KHẢO SÁT ĐÁM MÂY ĐIỂM', x, y + 54, `400 36px ${COND}`, C.dim, a);
      g2.save(); g2.globalAlpha = a; g2.fillStyle = C.amber; g2.fillRect(x, y + 84, 64 * eo(seg(t, T.end + .2, T.end + .9)) + 1, 2); g2.restore();
      text('e3', 'LIDAR SURVEY', x, y + 126, `400 22px ${MONO}`, C.dim, a);
    }
  }
}

// ---------------- events for the mixer ----------------
const EV = [];
EV.push({ t: T.scan1, type: 'scan', to: T.scan1End });
EV.push({ t: T.peelArrive, type: 'silence', to: T.peel });
PEEL_STEPS.forEach((h, i) => EV.push({ t: T.peel + i * 2 * BEAT, type: 'layer', i, h }));
EV.push({ t: T.sil, type: 'silence', to: T.turn });
EV.push({ t: T.turn, type: 'impact', to: T.turnEnd });
EV.push({ t: T.trace, type: 'trace', to: T.traceEnd });
EV.push({ t: T.r1, type: 'roll', to: T.r1Land }); EV.push({ t: T.r1Land, type: 'land' });
EV.push({ t: T.r2, type: 'roll', to: T.r2Land }); EV.push({ t: T.r2Land, type: 'land' });
EV.push({ t: T.r3, type: 'roll', to: T.r3Land }); EV.push({ t: T.r3Land, type: 'land' });
EV.push({ t: T.ghost, type: 'canopy', to: T.dur });
EV.push({ t: T.r4, type: 'land' });
EV.push({ t: T.end, type: 'end' });
window.EV = EV;

// ---------------- render ----------------
window.DUR = DUR;
window.camAt = camAt;
let lastT = 0;
window.render = t => {
  lastT = t;
  placeCamera(t);
  U.uF1.value = F1(t); U.uF2.value = F2(t); U.uCut.value = cutAt(t); U.uT.value = t;
  U.uProj.value = (H * SS / 2) / Math.tan(camera.fov * Math.PI / 360);
  U.uClass.value = ss(seg(t, T.peelEnd - .4, T.peelEnd + .4));
  U.uTrace.value = t < T.trace ? 0 : ss(seg(t, T.trace, T.traceEnd)) * 1.1;
  U.uGhost.value = ss(seg(t, T.ghost, T.ghost + .8));
  ghost.visible = t > T.ghost;
  composer.render();
  drawOverlay(t, cutAt(t));
};
window.TEXTS = t => { if (Math.abs(t - lastT) > 1e-6) window.render(t); return TXT.slice(); };
await document.fonts.ready;
window.render(0);
window.READY = true;
