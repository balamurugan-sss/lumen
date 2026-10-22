#!/usr/bin/env python3
"""Build data/timeline.json from the script + measured voice durations.
One layout drives the page, the score, the mix and the subtitles."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(HERE, 'script.json'), encoding='utf-8'))
dur = json.load(open(os.path.join(HERE, '..', 'voice', 'dur.json'), encoding='utf-8'))

TITLE_END = 7.0
GAP = 0.5            # between narration lines inside a scene
# per-scene: lead-in before its first line, tail after its last line
SCENES = [
    ('wish',     1.2, 1.2),
    ('mirror',   1.6, 1.2),
    ('huntsman', 1.0, 1.0),
    ('cottage',  1.2, 1.2),
    ('dwarfs',   1.0, 5.0),    # tail: the march to the mine
    ('visits',   1.8, 1.0),    # lead-in includes the tracking-noise beat
    ('apple',    1.8, 2.4),    # tail: the fall, held in near silence
    ('coffin',   1.4, 8.5),    # tail: seasons pass over the coffin, music only
    ('prince',   1.4, 1.2),
    ('wedding',  1.0, 1.4),
    ('ending',   0.8, 7.0),    # tail: crane to the stars, THE END, power-off
]
by_scene = {}
for l in script:
    by_scene.setdefault(l['scene'], []).append(l)

shots, lines, cues = [], [], []
shots.append({'name': 'title', 't0': 0.0, 't1': TITLE_END})
t = TITLE_END
for name, lead, tail in SCENES:
    t0 = t
    t += lead
    for l in by_scene.get(name, []):
        d = dur[l['id']]
        lines.append({'id': l['id'], 't': round(t, 3), 'dur': d, 'scene': name})
        t += d + GAP
    t -= GAP
    t += tail
    shots.append({'name': name, 't0': round(t0, 3), 't1': round(t, 3)})

layout = {'dur': round(t, 3), 'shots': shots, 'lines': lines}
json.dump(layout, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
print('DUR', layout['dur'], '=', f"{int(layout['dur']//60)}:{layout['dur']%60:04.1f}")
for s in shots: print(f"  {s['name']:9s} {s['t0']:7.2f} -> {s['t1']:7.2f}")
