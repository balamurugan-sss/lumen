#!/usr/bin/env python3
"""Original score for SNOW WHITE — numpy synthesis in the 80s cel-anime
palette: FM electric piano, FM music-box bells, string pad, soft synth
brass, round bass. A storybook register: a singable D-major theme for
Snow White, a dark descending motif for the Queen. Section boundaries
and hit points come from data/timeline.json (the one timeline)."""
import json, os, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
TL = json.load(open(os.path.join(ROOT, 'data', 'timeline.json')))
DUR = TL['dur']
SH = {s['name']: (s['t0'], s['t1']) for s in TL['shots']}
LINES = {l['id']: l for l in TL['lines']}
N = int(DUR * SR) + SR
music = np.zeros((N, 2), dtype=np.float64)

def sec(t): return int(t * SR)
def add(buf, t, gain=1.0, pan=0.0):
    i = sec(t); n = min(len(buf), N - i)
    if n <= 0: return
    music[i:i + n, 0] += buf[:n, 0] * gain * (1 - max(0, pan)) if buf.ndim == 2 else buf[:n] * gain * (1 - max(0, pan))
    if buf.ndim == 2: music[i:i + n, 1] += buf[:n, 1] * gain * (1 + min(0, pan))
    else: music[i:i + n, 1] += buf[:n] * gain * (1 + min(0, pan))
def mono(buf, t, gain=1.0, pan=0.0):
    add(np.asarray(buf), t, gain, pan)
def env_ad(n, a, d=None, peak=1.0):
    e = np.ones(n) * peak
    na = min(n, int(a * SR)); e[:na] = np.linspace(0, peak, na)
    if d is not None:
        nd = min(n, int(d * SR)); e[-nd:] *= np.linspace(1, 0, nd) ** 1.4
    return e
def f2m(f): return 69 + 12 * np.log2(f / 440.0)
def m2f(m): return 440.0 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
def fm_ep(midi, dur, vel=1.0):
    """DX7-style electric piano: 1:1 FM with a bright attack transient."""
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) * 2.2 + np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 22) * .5
    y = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 1.15)
    y += np.sin(2 * np.pi * f * 2 * t) * .22 * np.exp(-t * 2.4)
    return y * vel * env_ad(n, .004)
def fm_bell(midi, dur=2.2, vel=1.0):
    """Music box: inharmonic partials, long shimmering decay."""
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 1.6), (2.76, .5, 3.4), (5.4, .26, 5.5), (8.9, .1, 8)]:
        y += np.sin(2 * np.pi * f * ratio * t) * amp * np.exp(-t * dec)
    return y * vel * .5
def pad(midi, dur, vel=1.0):
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-6, 0, 6):
        ph = 2 * np.pi * f * (1 + det / 120000) * t
        saw = 2 * (ph / (2 * np.pi) - np.floor(ph / (2 * np.pi) + .5))
        y += saw
    # cheap one-pole lowpass
    a = .12; out = np.zeros(n); acc = 0.0
    for i in range(n): acc += a * (y[i] - acc); out[i] = acc
    return out * vel * env_ad(n, min(1.2, dur * .3), min(1.6, dur * .4)) * .5
def brass(midi, dur, vel=1.0):
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 7):
        y += np.sin(2 * np.pi * f * h * t + .3 * np.sin(2 * np.pi * 5.4 * t) * np.exp(-t * 2)) * (1 / h ** 1.3)
    return y * vel * env_ad(n, .09, min(.5, dur * .5)) * .55
def bass(midi, dur, vel=1.0):
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2 * t) + .22 * np.sin(2 * np.pi * f * 3 * t)
    return y * vel * env_ad(n, .008, min(.18, dur * .6)) * .8
def pluck(midi, dur=.7, vel=1.0):
    f = m2f(midi); n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + .4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8)
    return y * vel * .7
def hat(dur=.05, vel=.3):
    n = int(dur * SR); rng = np.random.default_rng(7)
    y = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 90)
    return y * vel
def note(inst, midi, t, dur, vel=1.0, pan=0.0):
    mono(inst(midi, dur, vel) if inst is not pad else pad(midi, dur, vel), t, 1.0, pan)

# ---------- themes ----------
# Snow White theme (D major), 8 bars of 3/4, beat = .52 s
THEME = [74, 78, 81, 78, 76, 74, 73, 74, 76, 0, 0, 0,
         74, 78, 81, 83, 81, 78, 76, 78, 74, 0, 0, 0,
         76, 79, 82, 79, 78, 76, 74, 76, 78, 0, 0, 0,
         81, 78, 76, 74, 73, 71, 74, 0, 0, 0, 0, 0]
WALTZ_CHORDS = [  # (bass midi, [pad midis]) per bar, D major
    (50, [62, 66, 69]), (45, [61, 64, 69]), (47, [62, 66, 71]), (43, [62, 66, 71]),
    (50, [62, 66, 69]), (45, [61, 64, 69]), (52, [64, 67, 71]), (50, [62, 66, 69]),
]
def waltz(t0, bars=8, theme=True, bells=True, ep=True, pad_on=True, gain=1.0, beat=.52):
    for b in range(bars):
        bt = t0 + b * 3 * beat
        root, ch = WALTZ_CHORDS[b % len(WALTZ_CHORDS)]
        if pad_on: 
            for m in ch: mono(pad(m, 3 * beat + .3, .5), bt, gain)
        mono(bass(root, beat * .9, .6), bt, gain)
        if bells and theme:
            for k in range(3):
                m = THEME[(b * 3 + k) % len(THEME)]
                if m: mono(fm_bell(m, 1.6, .8), bt + k * beat, gain)
                if ep: mono(fm_ep(ch[k % 3] + 12, beat * .8, .22), bt + k * beat + beat * .5, gain)
        elif ep:
            for k in range(3): mono(fm_ep(ch[k % 3] + 12, beat * .8, .2), bt + k * beat, gain)
QUEEN = [69, 68, 64, 63, 61, 63, 64, 0]   # descending semitone figure, A minor
def queen_motif(t0, gain=1.0, beat=.62):
    for i, m in enumerate(QUEEN):
        if m: mono(fm_ep(m - 12, beat * 1.4, .5), t0 + i * beat, gain)
    for m in (45, 44, 40):
        mono(pad(m, 4.6, .55), t0, gain)

# ---------- title: brass hit + bell motif ----------
t0, _ = SH['title']
for m in (62, 66, 69, 74): mono(brass(m, 2.6, .8), t0 + 1.15)
for i, m in enumerate((74, 78, 81)): mono(fm_bell(m, 2.4, .9), t0 + 1.2 + i * .24)
mono(pad(57, 5.5, .5), t0 + .4); mono(pad(62, 5.5, .4), t0 + .4)
# ---------- wish: music-box waltz, quiet ----------
t0, t1 = SH['wish']; waltz(t0 + .6, bars=8, gain=.5)
mono(fm_bell(86, 3, .5), LINES['n02']['t'] + LINES['n02']['dur'] * .3)   # the wish sparkles
# ---------- mirror: the queen's motif, dark pads ----------
t0, t1 = SH['mirror']; queen_motif(t0 + .8, .9)
queen_motif(LINES['n07']['t'] - 1.2, 1.0)
for m in (41, 45): mono(pad(m, t1 - t0 - 1, .4), t0 + .4)
# ---------- huntsman: tension strings -> open air ----------
t0, t1 = SH['huntsman']
for i, m in enumerate((62, 61, 59, 57)): mono(pad(m, 3.4, .5), t0 + .6 + i * 1.4)
mono(brass(50, 1.2, .5), LINES['n09']['t'] + LINES['n09']['dur'] * .1)   # the knife moment, held back
for i, m in enumerate((74, 76, 78)): mono(fm_bell(m, 1.8, .5), LINES['n10']['t'] + i * .5)
# ---------- cottage: the theme, warm ----------
t0, t1 = SH['cottage']; waltz(t0 + .5, bars=8, gain=.62)
# ---------- dwarfs: a march (2/4, beat .48) + the pact in waltz ----------
t0, t1 = SH['dwarfs']
waltz(t0 + .4, bars=4, gain=.45, theme=False)
march_t0 = t1 - 5.2
MARCH_BASS = [43, 50, 43, 50, 45, 52, 45, 52, 43, 50, 47, 50]
for i, m in enumerate(MARCH_BASS):
    mono(bass(m, .4, .8), march_t0 + i * .48)
    mono(hat(.05, .16 if i % 2 else .26), march_t0 + i * .48)
    if i % 2 == 0: mono(fm_ep(m + 24, .3, .3), march_t0 + i * .48)
for i, m in enumerate((79, 81, 83, 81, 79, 76, 74, 76)):
    mono(fm_bell(m, 1, .5), march_t0 + .5 + i * .48)
# ---------- visits: minor plucks over a drone ----------
t0, t1 = SH['visits']
for m in (45, 41): mono(pad(m, t1 - t0 - 1, .42), t0 + .5)
for lid in ('n15', 'n16', 'n17'):
    lt = LINES[lid]['t']
    for i, m in enumerate((69, 68, 64)):
        mono(pluck(m, .6, .5), lt + .3 + i * .3)
# ---------- apple: sparse bells, a low drone, then almost nothing ----------
t0, t1 = SH['apple']
mono(pad(38, t1 - t0, .5), t0 + .3)
for i, m in enumerate((81, 79, 76)): mono(fm_bell(m, 2.6, .55), LINES['n18']['t'] + 1 + i * 1.1)
mono(brass(45, 2.2, .65), LINES['n19']['t'] + LINES['n19']['dur'] * .8)   # the bite swell
# ---------- coffin: solo music box, then reharmonised seasons ----------
t0, t1 = SH['coffin']
for b in range(6):
    bt = t0 + .8 + b * 3 * .62
    root, ch = WALTZ_CHORDS[b % len(WALTZ_CHORDS)]
    for k in range(3):
        m = THEME[(b * 3 + k) % len(THEME)]
        if m: mono(fm_bell(m, 2.2, .66), bt + k * .62)
    mono(bass(root, .5, .3), bt)
seas = LINES['n20']['t'] + LINES['n20']['dur'] + .5
for i, m in enumerate((57, 61, 64, 66)): mono(pad(m, 4.2, .4), seas + i * 2.1)
# ---------- prince: theme returns with pad and bells ----------
t0, t1 = SH['prince']; waltz(t0 + .8, bars=8, gain=.6)
mono(brass(62, 2.4, .7), LINES['n24']['t'] + .1)   # she wakes
for i, m in enumerate((86, 83, 81, 78)): mono(fm_bell(m, 2.4, .7), LINES['n24']['t'] + .3 + i * .3)
# ---------- wedding: the theme, bright and full ----------
t0, t1 = SH['wedding']
waltz(t0 + .3, bars=6, gain=.8)
for m in (74, 78, 81, 86): mono(brass(m, 1.8, .6), t0 + .4)
# ---------- ending: a fragment, then air ----------
t0, t1 = SH['ending']
for i, m in enumerate((74, 78, 81, 78, 74)):
    mono(fm_bell(m, 3, .6), t0 + .8 + i * .8)
for m in (62, 66, 69): mono(pad(m, 7, .4), t0 + 3)

# gentle master: soft clip + fade the last second
music *= .9
music = np.tanh(music * 1.1) / 1.1
fade = int(.8 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None]
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
sf.write(os.path.join(ROOT, 'out', 'music.wav'), music.astype(np.float32), SR)
peak = np.abs(music).max()
print(f'score: {DUR:.1f}s peak {peak:.3f}')
