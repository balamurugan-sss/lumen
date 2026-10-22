// Project-local frame renderer for SNOW WHITE.
//
// Why not core/render/video.mjs: on this VM (SwiftShader, shared
// with the owner's other work) a frame occasionally exceeds
// video.mjs's fixed 30 s screenshot timeout and the render dies.
// This driver keeps the same page contract and output, but
// screenshots with a 240 s timeout, retries a frame up to 3
// times, and writes every frame to out/frames/ so a killed
// render resumes where it stopped.
//
// usage: node tools/render.mjs <projectDir> [--fps 24] [--q 'ss=1']
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process';
import { openDemo, closeServer, requireDemo } from '../../../core/render/page.mjs';

const args = process.argv.slice(2);
const dir = args[0]; requireDemo(dir);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('--fps', 24), Q = opt('--q', 'ss=1');
const framesDir = path.join(dir, 'out', 'frames'); fs.mkdirSync(framesDir, { recursive: true });
const out = path.join(dir, 'out', 'video.mp4');

const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: Q });
const DUR = await page.evaluate(() => window.DUR);
const TOTAL = Math.round(DUR * FPS);
console.log('frames', TOTAL);
const t0 = Date.now();
for (let f = 0; f < TOTAL; f++) {
  const fp = path.join(framesDir, String(f).padStart(4, '0') + '.jpg');
  if (fs.existsSync(fp) && fs.statSync(fp).size > 10000) continue;
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      await page.evaluate(t => window.render(t), f / FPS);
      await page.screenshot({ path: fp, type: 'jpeg', quality: 95, timeout: 240000 });
      ok = true;
    } catch (e) {
      console.log(`frame ${f} attempt ${attempt} failed: ${String(e.message || e).split('\n')[0]}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  if (!ok) { console.error('frame', f, 'failed 3 times'); process.exit(1); }
  if (f % 60 === 0) console.log(`f ${f}/${TOTAL}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close(); closeServer();
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, '%04d.jpg'),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out], { stdio: 'inherit' });
if (r.status !== 0) { console.error('ffmpeg assembly failed'); process.exit(1); }
console.log('done', out, TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
