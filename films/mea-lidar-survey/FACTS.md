# FACTS — KHẢO SÁT MEA

Measured on the machine, 2026-10-21 (America/New_York), by inventory scripts
kept in the project (`data/inventory.json` is the raw record).

## Subject

- Mea is the user's personal agent, powered by Muse Spark (Meta's Muse model
  family). Source: system identity + `~/IDENTITY.md` (name: Mea) + `~/USER.md`
  (the user is addressed as "Boss").

## Survey method (also stated on screen, shortened)

The point cloud is a **simulation built from real measurements**, labelled on
screen "QUÉT MÔ PHỎNG TỪ DỮ LIỆU HỆ THỐNG — KHÔNG PHẢI LiDAR HÀNG KHÔNG".
It is not airborne lidar and is not presented as physical evidence.

- Districts (territories) and their sources:
  - `memory` — `~/MEMORY.md` + `~/memory/**` (filesystem walk)
  - `skills` — `~/workspace/custom-skills/**` (filesystem walk, `.git` excluded)
  - `goals` — `~/workspace/goals/**` (filesystem walk)
  - `spoofx` — the SpoofX repo, measured by **git index**
    (`git ls-files -co --exclude-standard`: tracked + unignored untracked)
  - `system` — `~/workspace/harness/**` + `~/docs/**` (filesystem walk)
- Why SpoofX uses the git index: a raw filesystem walk of SpoofX returns
  140,981 files / 9,522,265,702 bytes, of which 139,899 files / ~9.52 GB sit in
  `lsmodule/` build intermediates (generated output, not the project). The
  git-index count is the project's actual source. Both numbers are recorded
  here; the film uses the git-index count.
- Walk exclusions everywhere: `.git`, `node_modules`, `build`, `.gradle`,
  `__pycache__`.

## Numbers used on screen

| Reading | Value | Source |
|---|---|---|
| Surveyed files, total | 1,727 | sum of districts below |
| Surveyed bytes, total | 35,815,944 B (34,2 MiB) | sum of districts below |
| Memory district | 14 files · 2,841,380 B | walk (incl. `MEMORY.md`, dated logs 2026-10-15…21, `memory/bank/*`) |
| Skills district | 102 files · 782,045 B | walk of custom-skills |
| Skills count (R2) | 84 SKILL.md = 30 custom + 54 system (`/opt/muse/skills`) | glob `*/SKILL.md` in both roots |
| Goals district | 23 files · 19,244,304 B | walk of `~/workspace/goals` |
| Goal workspaces (R3) | 17 | dirs containing `GOAL.md` |
| SpoofX district | 1,554 files · 12,764,116 B | git index (see above) |
| System district | 34 files · 184,099 B | walk |
| Days on record (R4) | 7 — logs 2026-10-15 → 2026-10-21 | filenames in `~/memory/` |

## Point mapping (deterministic; no hand-placed points)

Sampling scale: **1 point ≈ 256 bytes of surveyed data**. Each surveyed
file contributes `clamp(round(size_bytes / 256), 3, 600)` points. A point's
district sector is fixed, sized by point mass (layout in
`data/build_data.py`; the east strip stays unmeasured — the survey window's
edge); its anchor inside the sector is a deterministic hash (FNV-1a of the
file's path); its points scatter around the anchor with a Rayleigh falloff
(radius grows with log size, no hard edge). A file's height is
`2.2 * log10(size_bytes + 1) + depth` in survey metres, domed across its
scatter (centre higher) with per-point jitter from the same hash. The surface is a
heightfield binned from the same points (max height per 2 m cell, holes
filled, smoothed). The film's point count (instruments corner) is the exact
number of generated points, printed by the generator into `data/facts.json`.
