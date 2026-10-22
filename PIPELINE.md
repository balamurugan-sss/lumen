# FILM PIPELINE — how a film gets made here, end to end, without the known errors

Read this before making a film in this repo. It is the procedure distilled
from two completed productions (a 40 s data film and a 3:35 narrated
fairy-tale short). `DIRECTOR.md` and `TECHNIQUE.md` govern taste and house
rules; this file governs *process and failure modes*. Every pitfall below
was hit in production and cost real time — the fix is written next to it.

## Invariants (house rules, non-negotiable)

- TREATMENT before DEMO: write `films/<slug>/TREATMENT.md` (concept,
  structure, style choice and why) before opening any style demo.
- Never build inside `styles/`; never edit `core/` or `styles/`.
  A film lives entirely in `films/<slug>/`.
- Films outside `styles/` are the user's: no library credit or watermark
  in the picture. A `CREDITS` file in the project folder carries sources
  and licences instead.
- Never kill a process you did not start.
- Every film must be rebuildable: `films/<slug>/build.sh` documents the
  whole build, and all inputs (script, data, fonts, voice) live in the
  project folder.

## The pipeline

### 1. Facts or script first — as data

- Data film: measure the real thing, write `FACTS.md` + `data/facts.json`.
  Every number on screen must trace to a measurement, and the method
  (including what was excluded and why) is disclosed in FACTS.md.
- Story film: write the script into `data/script.json` — one entry per
  narration line: `{id, en, vi, scene}` (narration language + subtitle
  language). Respect source rights: prefer public-domain sources, and
  keep adaptations distinguishable from any copyrighted version
  (e.g. Grimm's Snow White, not Disney's: no dwarf names or designs).

### 2. Voice before pictures; the timeline is *measured*, never guessed

- Generate narration per line with the voice tier
  (`core/tts/tts.py data/lines.json voice/`), producing `voice/*.wav` +
  `voice/dur.json`.
- Build the timeline from the measured durations
  (`data/build_timeline.py` → `data/timeline.json`): scene boundaries,
  subtitle spans and the score all key off this one file.
- Re-takes: **generate fixes into a side folder** (`voice_fix/`) and merge
  its `dur.json` into `voice/dur.json` by hand. `tts.py` rewrites
  `dur.json` with only the lines it just generated — generating a fix
  straight into `voice/` silently drops every other line's duration.
- ASR check (`core/tts/asr_check.py data/lines.json voice/`):
  - On this network the Hugging Face *xet* endpoint fails
    ("Server disconnected"): run with `HF_HUB_DISABLE_XET=1`.
  - whisper `base.en` flags homophones (through/threw, root/route,
    red/read) and dropped punctuation. Judge each DIFF: real wording
    errors → re-take the line slower (speed 0.88–0.94 usually fixes
    articulation); homophones/punctuation → record what the model heard
    in the line's `asr` field, as the tool's docstring prescribes.
  - A `small.en` cross-check is the tie-breaker for doubtful lines;
    the model is ~480 MB, download it before you need it.

### 3. Build the page

- Copy the style demo's pure engine files (cel shading, post/CRT)
  **unmodified**; write the film's own modules around them: palettes
  (`pal.js`), characters (`chars.js`), painted plates (`bg.js`),
  scenes, subtitle HUD, `main.js` wiring.
- The page contract the render tools rely on: `window.render(t)`
  (deterministic — same t, same frame), `window.DUR`, `window.EVENTS`,
  `window.TEXTS`, `window.READY = true` when plates/fonts are baked.
- Subtitle spans: each line is held for its speech duration **+ 0.6 s**
  (see `hud.js`). The `.srt` deliverable is generated from the *same*
  spans (`data/cues.json` → `core/render/srt.py`) so the file and the
  burned-in subtitles can never drift apart.

### 4. Visual review on stills — before any full render

- `node core/render/still.mjs films/<slug> <seconds…> --out <dir>`, tile
  with `core/render/sheet.py`, and *look* at the sheets. Two passes
  minimum: a model sheet (characters) and a full scene pass.
- Traps this step exists to catch (all happened):
  - **Foreground plates swallow figures.** A tiered pine is ≈ 0.3 × its
    height *wide*; a "frame" cluster of them overflows its nominal zone
    by ~300 px. Never draw a full near-layer over figures: build a
    dedicated frame plate with trees only at the extreme edges, and
    draw figures between the mid layer and the frame.
  - **Emissive plates wash out what is inside them.** A glowing magic
    mirror made its face invisible. Fix: darken the glass with a
    translucent overlay and raise the face's stroke/fill opacity
    until it reads at delivery size.
  - **Palette multipliers lie about skin.** Multiplying a base skin
    colour by a dusk tint turns it pink. Hand-tune `skin` overrides
    per lighting set (the styles already do this for night/chamber).
  - **Small props read as other objects** (seven beds read as
    bookshelves). Draw props oversized, with unmistakable silhouettes
    (headboard + pillow + folded blanket), and check at final size,
    not zoomed in.

### 5. Score and mix

- Score: synthesize to the timeline's scene boundaries (a simple
  thematic score in numpy is proven: `music/score.py`). Keep one
  recognisable theme + one antagonist motif.
- `node core/render/events.mjs films/<slug>` exports the page's sound
  events to `events.json`; the mixer consumes it plus the voice spans:
  compress and RMS-park the voice, duck music ×~0.3 under speech
  (smoothed), add procedural foley per event type, and keep one
  deliberate near-silence beat after the story's biggest impact.

### 6. Render — use the resumable driver, not stock video.mjs

- On a CPU/SwiftShader VM, frames occasionally exceed
  `core/render/video.mjs`'s fixed 30 s screenshot timeout and the whole
  render dies. Use `tools/render-driver.mjs` (copy it into
  `films/<slug>/tools/`): same page contract, 240 s timeout, 3 retries,
  one JPEG per frame in `out/frames/`, resumes by skipping frames
  already on disk (> 10 KB).
- Budget: ≈ 2 s per 1080p frame on SwiftShader → a 3:35 film at 24 fps
  (5,161 frames) takes ≈ 2.5 h. Supersampling `ss=2` is infeasible here;
  ship `ss=1` and disclose it.
- The driver assembles `out/video.mp4` (CRF 14) from the frames at the
  end; if that step is interrupted, the frames are the product —
  re-assemble with one ffmpeg call instead of re-rendering.

### 7. Mux and delivery encode

- `core/render/mux.sh video.mp4 mix.wav master.mp4 24 0` — the 5th
  argument is **grain strength (a number)**, 0 for cel/vector styles;
  it is not a subtitle flag.
- One long mux call can be killed mid-write by a VM restart, leaving a
  truncated mp4 ("moov atom not found"). The equivalent short steps are
  safer and each takes seconds: (1) loudnorm-measure `mix.wav`,
  (2) apply loudnorm with the measured values → `mix_norm.wav`,
  (3) stream-copy mux (`-c:v copy -c:a aac`). Verify the intermediate
  with `ebur128` before muxing.
- Delivery encode: CRF 23, `-tune grain` for CRT-textured styles,
  `+faststart`, audio copied from the master.

### 8. Verify on the delivered file — not on intermediates

- Loudness re-measured on the final mp4: **−14.0 LUFS** (ebur128).
- Full decode with no errors; `blackdetect` shows only the intentional
  CRT power-on/off darkness.
- Extract ~10 frames spread across *all* scenes from the delivered file
  and look at them (subtitles correct and legible in every scene).
- `core/render/readcheck.mjs` is the automated subtitle check, but on a
  slow VM a 3.5 min film can exceed a 15 min timeout — give it ≥ 30 min
  or treat the visual frame pass as the evidence and say so.
- DIRECTOR §11: compare against the style's demo and list ≥ 5 aspects
  that differ; a film that could be mistaken for the demo fails.
- Deliver: the mp4, the `.srt`, the poster (a frame from the delivered
  file), and a note disclosing every deviation (supersampling, unverified
  checks, softened source details). Update `CREDITS` and `build.sh`.

## Fonts — where they actually come from

- The gwfh helper API returns a 9-byte "Not found" file for some
  families (dela-gothic-one, kanit). What works: Dela Gothic One TTF
  from the google/fonts repo via jsDelivr; Kanit/Barlow woff2 subsets
  from fonts.gstatic.com (see the family's CSS). Self-host everything
  in `films/<slug>/fonts/` with the OFL licence texts.

## Hybrid direction (endorsed 2026-10-22): generated backdrops, code figures

The proven upgrade path for prettier films with these same tools:

- Generate painted **background plates** with the built-in image tool
  (`media.generate_image`): prompt for a *background plate in the film's
  style era*, name the scenery, forbid characters/people, and —
  critically — require the centre and lower-middle of the frame to stay
  open for compositing. One call ≈ 1 min, 2048×1152.
- Keep characters, animation, subtitles and the CRT pass exactly as in
  the code pipeline. Cel figures over a painted backdrop is the
  authentic 80s anime construction, and the CRT grain unifies the two
  image kinds. Add a soft painted ground shadow under figures so they
  sit *in* the scene, and iterate on the generated image from its
  snapshot instead of re-rolling from zero.
- Worked example: `films/snow-white/hybrid-test/` (kept locally) — a
  10 s coffin-on-the-hill shot, generated hill + the film's own dwarfs.
- Generated *characters* — TESTED 2026-10-22: one character sheet per
  character from a **single generation** works. One call produced a
  1920×1280 sheet (5 full-body poses + 4 expression close-ups) with
  face, hairstyle and costume identical across all 9 depictions;
  cut out the poses and puppet-animate them by code. Known minor
  flaws: a pose labelled "three-quarter" came out near-frontal, and
  layered garments can blend in a sitting pose — inspect each pose
  before cutting it out. Per-scene stills still drift; don't use them
  for a recurring character.

## Muse video generation — NOT AVAILABLE on this account

- Tested 2026-10-22: `media.generate_video` returns a hard 403 —
  video generation is unavailable for this account in its country or
  region, and the restriction is lasting (retrying does not help).
  Do not plan any film around generated video clips here.
- All motion therefore comes from code, as in the base pipeline:
  push-ins, pans and parallax over generated stills, puppet animation
  of cut-out poses, and the CRT pass. (The 10 s hybrid test above was
  made exactly this way, from a generated still.)
