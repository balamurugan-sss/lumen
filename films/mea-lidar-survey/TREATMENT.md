# TREATMENT — KHẢO SÁT MEA (LiDAR Survey, 40 s)

Subject: Mea — the user's Muse agent. One-line brief (approved defaults, 2026-10-21):
no narration; Vietnamese in-frame text only; no project names on screen; simulated
scan built from Mea's real system inventory, labelled as such on screen; no
storyboard review.

## 1. Three candidate structures

**A. One flight (corridor).** The camera flies one route across five districts
(Memory → Skills → Goals → Projects → System); one reading lands per district.
Clear, but list-like; the medium's best moves (peel, condense) go unused.

**B. Peel, classify, condense (CHOSEN).** A raw point cloud fills the dark —
unidentified terrain. A cutting plane steps down by height and lifts the
surface-noise layer away; the remaining points are recoloured by class
(district); a front then condenses the cloud into a solid relief map of the
agent; three readings land on what was found; the camera pulls back to the
whole survey tile and the peeled layer returns as a ghost. Uses three native
moves (canopy peel, points condense, regrowth) in one arc, and the turn —
from raw points to a measured map — *is* the story: an invisible agent becomes
surveyable.

**C. One section.** A single cutting plane crosses the Memory district; a
dimensioned profile of memory growth over days hangs beside it. Precise, but
in 40 s it portraits one organ, not the agent.

**Choice: B**, with A's district order governing the order readings light up
inside the condense phase (Memory → Skills → Goals).

## 2. Logline and arc

Logline: *Một đám mây điểm chưa rõ là gì được quét, lột lớp và đo đạc — cho tới
khi nó hiện nguyên hình là bản đồ của Mea, agent Muse của Boss.*
Setup (0–11 s): black; a scan line paints points in; the terrain is unknown.
Turn (11–27 s): the peel removes noise; classification names the districts;
a front condenses points into solid ground — the terrain has structure, it is
a mind's map, not a landscape. Ending (27–40 s): three readings quantify the
found features; pull-back shows the whole surveyed agent; the peeled layer
returns as a ghost and the final reading — the total — holds as the points
fade to the instruments. Bookend: the film ends on the same near-black and
instruments it began with, now labelled.

## 3. Benchmark

- Survey/archaeology lidar reveal films (the grammar STYLE.md itself cites:
  colour as height, canopy removed, one held reading per screen). *Learn:*
  pacing of a peel, restraint of the palette, readings held long enough to
  read. *Don't take:* jungle/ruin subject, presenter, layouts, ramps, music.
- Architectural section drawings. *Learn:* hairline dimensioning, one reading
  attached to what it measures. *Don't take:* paper look, drafting typefaces.

## 4. Data and honesty (style §9)

There is no airborne lidar of an agent. The cloud is generated deterministically
from Mea's real inventory (measured 2026-10-21; method + counts in FACTS.md):
each surveyed file contributes points; district = file territory
(memory / skills / goals / spoofx project / system), horizontal position =
deterministic hash of the file's path inside its district sector, height =
log of file size + depth. Points are never placed by hand into a shape.
Instruments on screen state plainly: "QUÉT MÔ PHỎNG TỪ DỮ LIỆU HỆ THỐNG —
KHÔNG PHẢI LiDAR HÀNG KHÔNG". Numbers in readings are the measured counts.

## 5. Shot list (one continuous camera move; phases, no cuts)

| # | Time | Framing / move | Why |
|---|---|---|---|
| S1 | 0–5 s | Locked nadir, slow push; scan line paints the cloud line by line | "this is what a photo shows" inverted: nothing is a photo; the subject arrives as data (native move: opening black frame the scan paints in) |
| S2 | 5–11 s | Crane down, tilt to low oblique (10–20° pitch); instruments + title fade in | entering the data; the terrain has height; subject identified |
| S3 | 11–19 s | Slow orbit; cutting plane steps down by height in eased steps, top layer lifts and fades; edge ruler tracks the plane; at 17 s points recolour by class | the peel: noise removed, districts named — classification is the lever |
| S4 | 19–27 s | Lateral track following the front; behind it points condense into the solid surface (warm neutral, raking light) | the turn: raw returns become a measured map |
| S5 | 27–35 s | Push toward the Memory high ground; traced features light in order; readings R1–R3 land with leaders, right third | what was found, quantified one at a time |
| S6 | 35–40 s | Rising pull-back to the whole tile; ghost layer returns; final reading R4 (total) holds; points fade, instruments remain | scale reveal + regrowth ending; bookend with S1 |

Camera: target/distance/heading/pitch as a C1 spline; never stops; 24 fps on ones.

## 6. Beat sheet

- 0.0 Black. A single ping. The scan line enters.
- 0–5 Cloud paints in behind the line; crackle rises with point arrivals.
- 5 Instruments corner resolves: subject MEA · MUSE; source line; point count rolling.
- 5–11 Crane down to oblique; title KHẢO SÁT MEA resolves over the cloud, then yields.
- 11 Plane appears at top height; ruler wakes on the frame edge.
- 11–17 Plane steps down in 4 eased steps; the layer above lifts, fades.
- 17–19 Recolour by class: five district tints settle; near-silence begins 18.0.
- 19 Impact. The front starts; points ahead brighten, seam glows.
- 19–27 Surface condenses behind the front; contours and crests emerge.
- 27 Reading R1 lands (Bộ nhớ) with leader + pop.
- 30 Reading R2 lands (Kỹ năng).
- 32.5 Reading R3 lands (Mục tiêu đang theo).
- 35 Pull-back begins; ghost of the peeled layer returns faint.
- 37 Reading R4 (Toàn bộ hệ thống: files + dung lượng) holds centre-right.
- 39–40 Points fade to instruments; end card line: MEA — ĐÃ KHẢO SÁT.

## 7. Readings (numbers = measured inventory, see FACTS.md)

- R1 BỘ NHỚ DÀI HẠN — memory files + bytes (khu Bộ nhớ).
- R2 KỸ NĂNG — SKILL.md count (custom + system).
- R3 MỤC TIÊU ĐANG THEO — goal workspaces count.
- R4 TOÀN HỆ — total surveyed files + total bytes, and days on record
  (earliest → latest dated memory log).

## 8. Cue map (72 BPM, 4/4; one bar ≈ 3.33 s)

- Bars 1–2 (0–6.7 s): air bed; ticks 8ths as points arrive; FM ping on the scan line.
- Bars 2–4 (to 13.3 s): low-passed detuned-saw pad enters; ticks divide to 16ths.
- Bars 4–6 (to 20 s): steps of the plane on beats, descending blip per step;
  ticks to 32nds accelerating 17–18 s; near-silence 18.0–19.0 (air only).
- Bar 6 beat 1 (19.0 s): impact (timpani/gran cassa synth + reversed swell into it).
- Bars 6–9 (19–30 s): pulse bass (2nd/3rd harmonics) under the condense; noise
  sweeps tied to the front; bowed-vibraphone-like timbre joins as surface exists.
- Bars 9–11 (30–36.7 s): ratchet under each rolling counter; ping as each reading lands.
- Bars 11–12 (36.7–40 s): pad resolves; ghost layer returns on a soft swell;
  final ping 39 s; air bed alone to black.

## 9. Sound design

| Section | Bed | Main events | Music state |
|---|---|---|---|
| S1 | thin air | crackle tied to point arrivals, scan ping | ticks only |
| S2 | air | soft sweep on crane | pad fades in |
| S3 | air | descending blip per peeled step, ruler ticks | ticks subdivide, then silence |
| S4 | air | noise sweep on the front, impact 19 s | pulse bass |
| S5 | air | ratchet counters, reading pings | bowed timbre + bass |
| S6 | air | ghost swell, final ping | pad resolves, air alone |

No voice (approved default). Mix −14 LUFS, true peak ≤ −1.2 dBTP.

## 10. Type and text design (style §4)

- Readings: Barlow Condensed 300 numerals (110–130 px at 1080p); labels Noto Sans 500 (24–36 px).
- Instruments: monospace (IBM Plex Mono 19–22 px), one corner, fixed positions:
  subject, coordinates (district frame), point count, data source + simulation note.
- Title: KHẢO SÁT MEA (Noto Sans 500, letterspaced) at S2.
- No subtitle strip (no speech); all text is in-frame instruments/readings.
- Vietnamese number format: dot thousands separator (e.g. 12.483).
