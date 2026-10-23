# Hybrid pipeline: lemo-opuscar code segments + native generated media

Status: demo-verified once (films/lighthouse-demo/, 2026-10-23). Planning doc;
it does not replace DIRECTOR.md, TECHNIQUE.md, or styles/<style>/STYLE.md.

## Idea

Lemo-opuscar renders deterministically from code. Native image/video
generation does not: its output is fresh generation, never a frame-exact
animation of a storyboard. So the two never share one style pipeline.
They meet only at assembly: code-rendered segments first and last,
one generated motion segment in the middle.

## Stages

- Stage 0, Brief and style lock (agent + lemo-opuscar docs, no media).
  Input: topic + style name. Output: short brief + STYLE.md invariant list.
- Stage 1, Hero image (native image generation).
  Input: plain-language text prompt for one hero shot.
  Output: 1 image. It is the poster and the video seed.
- Stage 2, Motion clip (native video generation).
  Input: Stage 1 image + short motion text.
  Output: 1 clip, about 10 seconds (duration is not controllable),
  with synthesized sound. No audio input is accepted.
- Stage 3, Code cards (lemo-opuscar core/render/still.mjs).
  Input: STYLE.md + card text. Output: code-rendered title and closing
  frames at 1920x1080. The Stage 1 image is a visual reference for art
  direction only; the renderer never ingests it as a frame.
  Card pages must expose window.READY and window.render(t), use no
  external resources, and live in the film's project folder, never in
  styles/.
- Stage 4, Normalize + assemble (ffmpeg, see scripts below).
  Input: code card stills + generated clip.
  Output: one short film. Cards get a silent audio track; the clip is
  normalized first, so concat does not fail on mismatched params.
- Stage 5, Check (ffprobe + extracted frames, not playback).
  Input: raw clip + final film. Output: measured duration, resolution,
  fps, and audio values, plus a fix list. The agent cannot watch video
  playback, so frame inspection is the check.

## Scripts (hybrid/)

All scripts are POSIX sh, fail fast (set -eu), and use a 300 s timeout
per ffmpeg call. Target params are a demo choice, not a tool limit:
1920x1080, 24 fps, H.264 yuv420p, AAC 48 kHz stereo. All segments
must share these params before concat.

- `sh hybrid/normalize.sh <clip-in> <clip-normalized>`
  Scales/pads to 1920x1080, forces 24 fps, re-encodes video to H.264
  yuv420p and audio to AAC 48 kHz stereo. Assumes the input has an
  audio stream; generated clips do (synthesized sound).
- `sh hybrid/make_card.sh <still.jpg> <segment-out> [seconds=2]`
  Loops one still into a video segment of the given duration with a
  silent stereo AAC track at 48 kHz, at the same target params.
- `sh hybrid/assemble.sh <final-out> <segment1> [segment2 ...]`
  Concats already-normalized segments with `ffmpeg -f concat -c copy`.
  Segment paths must not contain single quotes (concat list quoting).

## Demo commands (lighthouse, from the repo root)

```sh
# 1-2. Generate hero image, then one clip from it (native tools, 1 + 1).
#    Outputs land in films/lighthouse-demo/ as lighthouse-hero.jpg
#    and lighthouse-clip.mp4 (exact clip name comes from the tool).

# 3. Render code cards (repo root is the static server root).
node core/render/still.mjs films/lighthouse-demo/title 0 \
  --size 1920x1080 --prefix title_ --out films/lighthouse-demo/cards
node core/render/still.mjs films/lighthouse-demo/closing 0 \
  --size 1920x1080 --prefix closing_ --out films/lighthouse-demo/cards

# 4. Normalize + card segments + assemble.
sh hybrid/normalize.sh films/lighthouse-demo/lighthouse-clip.mp4 \
  films/lighthouse-demo/clip-normalized.mp4
sh hybrid/make_card.sh films/lighthouse-demo/cards/title_0.jpg \
  films/lighthouse-demo/title.mp4 2
sh hybrid/make_card.sh films/lighthouse-demo/cards/closing_0.jpg \
  films/lighthouse-demo/closing.mp4 2
sh hybrid/assemble.sh films/lighthouse-demo/final.mp4 \
  films/lighthouse-demo/title.mp4 \
  films/lighthouse-demo/clip-normalized.mp4 \
  films/lighthouse-demo/closing.mp4

# 5. Report measured values, never assumptions.
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels \
  -show_entries format=duration -of default=noprint_wrappers=1 \
  films/lighthouse-demo/lighthouse-clip.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels \
  -show_entries format=duration -of default=noprint_wrappers=1 \
  films/lighthouse-demo/final.mp4
```

## Limits (honest)

- Video clips are about 10 seconds each, duration not controllable;
  at most 6 successful clips per user message; at most 4 images per
  chat request. A longer film needs more clips or more code segments.
- Generated footage is watercolor-like at best, never watercolor in
  lemo-opuscar's code sense. Do not label it as a lemo-opuscar frame.
- Media generation is rollout-gated with no preflight check; a failed
  generation is reported, never replaced with fake media.
- Lemo-opuscar styles are tuned for Claude Opus 5.5 (README warning);
  reproduction by another model may differ.
- The demo cards are minimal CSS watercolor-grammar frames, not the
  watercolor demo engine. The demo engine's story is unrelated to the
  demo topic, and reusing it would bend the topic toward the demo.
- Default output resolution and format of native generation are not
  stated in the docs read for this pipeline; that is why Stage 4
  normalizes instead of assuming.

## Repo rules observed

- Film work lives in films/<name>/, which is gitignored; hybrid/
  files are tracked-source candidates and stay untracked until
  someone explicitly approves a commit/push.
- Never build inside styles/. Never copy a demo's story, arc, shots,
  props, or timeline; write the film's own treatment first.
