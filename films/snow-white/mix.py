#!/usr/bin/env python3
"""Mix for SNOW WHITE: voice (compressed, balanced by RMS ~10 dB over
the ducked music), the synthesized score, and procedural foley driven
by the page's events. Two-pass loudnorm to -14 LUFS happens in mux."""
import json, os
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TL = json.load(open(os.path.join(HERE, 'data', 'timeline.json')))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DUR = TL['dur']
N = int(DUR * SR) + SR
mix = np.zeros((N, 2))
rng = np.random.default_rng(11)

def sec(t): return int(t * SR)
def add(buf, t, gain=1.0, pan=0.0):
    i = sec(t); buf = np.asarray(buf, dtype=float)
    if buf.ndim == 1: buf = np.stack([buf, buf], 1)
    n = min(len(buf), N - i)
    if n <= 0: return
    mix[i:i + n, 0] += buf[:n, 0] * gain * (1 - max(0, pan))
    mix[i:i + n, 1] += buf[:n, 1] * gain * (1 + min(0, pan))
def bp_noise(dur, f0, f1, gain=1.0, seed=3):
    """band-passed noise via a swept one-pole pair (cheap and cheerful)."""
    n = int(dur * SR); r = np.random.default_rng(seed)
    x = r.standard_normal(n); y = np.zeros(n); lp = 0.0; hp = 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * i / max(1, n)
        a = 1 - np.exp(-2 * np.pi * f / SR)
        lp += a * (x[i] - lp); hp += .02 * (lp - hp) if i else 0
        y[i] = lp - hp
    return y * gain * np.hanning(n) ** .5
def tone(freq, dur, gain=1.0, slide=0.0, kind='sine'):
    n = int(dur * SR); t = np.arange(n) / SR
    fr = freq * (1 + slide * t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    y = np.sin(ph) if kind == 'sine' else np.tanh(2.2 * np.sin(ph))
    return y * gain * np.exp(-t * 2.2)

# ---------- voice: compress, then balance by RMS ----------
voice = np.zeros((N, 2))
spans = []
for l in TL['lines']:
    path = os.path.join(HERE, 'voice', l['id'] + '.wav')
    a, sr = sf.read(path)
    if sr != SR:  # kokoro writes 24 kHz: simple 2x upsample
        a = np.repeat(a, SR // sr)
    a = a[:, None] if a.ndim == 1 else a
    a = np.tanh(a * 1.6) / 1.35          # gentle compression
    rms = np.sqrt(np.mean(a ** 2)) or 1
    a *= (10 ** (-16 / 20)) / rms * .12   # park every line at the same loudness
    i = sec(l['t']); n = min(len(a), N - i)
    voice[i:i + n] += a[:n]
    spans.append((l['t'] - .15, l['t'] + l['dur'] + .35))
# ---------- music under a ducking envelope ----------
mus, sr = sf.read(os.path.join(HERE, 'out', 'music.wav'))
mus = mus[:, :2] if mus.ndim == 2 else np.stack([mus, mus], 1)
duck = np.ones(N)
for a, b in spans:
    i0, i1 = sec(a), sec(b)
    duck[i0:i1] *= .3                     # ~ -9.5 dB under speech
sm = int(.09 * SR)
ker = np.hanning(sm * 2 + 1); ker /= ker.sum()
duck = np.convolve(duck, ker, 'same')
n = min(len(mus), N); mix[:n] += mus[:n] * duck[:n, None] * .85
mix += voice
# ---------- foley ----------
def ev(type_):
    return [e for e in EV if e['type'] == type_]
for e in ev('crton'):
    add(tone(120, .3, .5, slide=-.4, kind='tanh'), e['t']); add(bp_noise(.5, 3000, 500, .12), e['t'])
for e in ev('crtoff'):
    add(tone(90, .4, .5, slide=-.5, kind='tanh'), e['t']); add(bp_noise(.3, 2000, 300, .1), e['t'])
for e in ev('glint'):
    add(tone(3200, .5, .1), e['t']); add(tone(4750, .35, .06), e['t'] + .02)
for e in ev('needle'):
    add(bp_noise(.06, 4000, 4000, .3), e['t'])
for e in ev('mirror'):
    add(tone(196, 1.6, .12, kind='tanh'), e['t']); add(tone(1244, 1.2, .04), e['t'])
for e in ev('knife'):
    add(bp_noise(.22, 600, 5200, .4), e['t'])
for e in ev('run'):
    add(bp_noise(e.get('d', 3), 400, 900, .16), e['t'])
for e in ev('door'):
    add(tone(70, .35, .4, slide=.3, kind='tanh'), e['t']); add(bp_noise(.4, 300, 700, .1), e['t'])
for e in ev('knock'):
    for k in range(2): add(tone(180, .09, .5, kind='tanh'), e['t'] + k * .16)
for e in ev('snip'):
    add(bp_noise(.05, 5000, 6000, .4), e['t']); add(bp_noise(.05, 4200, 5000, .3), e['t'] + .09)
for e in ev('comb'):
    add(bp_noise(.12, 2500, 3500, .15), e['t'])
for e in ev('bite'):
    add(bp_noise(.16, 900, 300, .55), e['t'])
for e in ev('thud'):
    add(tone(64, .5, .7, slide=-.3, kind='tanh'), e['t'])
for e in ev('stumble'):
    add(tone(140, .12, .5, kind='tanh'), e['t']); add(bp_noise(.2, 500, 900, .2), e['t'])
for e in ev('wake'):
    add(tone(1568, 1.2, .08), e['t']); add(tone(2093, 1.4, .06), e['t'] + .12)
for e in ev('crack'):
    add(bp_noise(.3, 1800, 500, .5), e['t'])
    for k in range(5): add(tone(2400 - k * 260, .4, .07), e['t'] + .1 + k * .13)
for e in ev('bells'):
    for k, f in enumerate((1318, 1568, 1975, 1568, 1318)):
        add(tone(f, 1.1, .11), e['t'] + k * .42)
    add(tone(659, 2.0, .08), e['t'] + .2)
# one beat of true silence before the bite's aftermath: cut music+foley tails
b = [e for e in ev('thud')]
if b:
    i0, i1 = sec(b[0]['t'] + .45), sec(b[0]['t'] + 1.3)
    ramp = np.linspace(1, .12, i1 - i0); mix[i0:i1] *= ramp[:, None]
    j0, j1 = sec(b[0]['t'] + 2.2), sec(b[0]['t'] + 2.9)
    mix[j0:j1] *= np.linspace(.12, 1, j1 - j0)[:, None]

mix = np.tanh(mix * 1.05)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print(f'mix: {DUR:.1f}s peak {np.abs(mix).max():.3f}')
