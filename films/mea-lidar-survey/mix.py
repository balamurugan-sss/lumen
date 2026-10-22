"""Score, sound design and mix for KHẢO SÁT MEA -> out/mix.wav (48 kHz stereo).

No voice (approved brief). Everything is synthesized here — no sample
libraries. Events come from the page itself (events.json, exported by
core/render/events.mjs); the score grid is 72 BPM to match timeline.js.

Palette (STYLE.md §7): thin air bed; FM telemetry pings; ticks that divide
(8ths -> 16ths -> 32nds into the peel); a pitched blip per peeled layer;
two near-silences before the turn (10.83 s and 18.33 s); one synthesized
impact at the turn; pulse bass with audible harmonics under the condense;
a bowed, vibraphone-like timbre once the surface exists; ratchet counters
under the rolling readings; the air returns alone under the end card.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
SR = 48000
DUR = 40.0
BEAT = 60 / 72
N = int((DUR + 1.0) * SR)
rng = np.random.default_rng(31)
MUS, PUL, HIT, FX, BED = (np.zeros((N, 2)) for _ in range(5))
ev = {}
for e in EV: ev.setdefault(e['type'], []).append(e)

def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lpf(x, f, o=2): return sosfilt(sos('low', min(f, SR * .45), o), x, axis=0)
def hpf(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0)
def bpf(x, a, b, o=2): return sosfilt(sos('band', [a, min(b, SR * .45)], o), x, axis=0)
def tv(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def mi(n): return 12 * (int(n[-1]) + 1) + NOTE[n[:-1]]
def put(buf, x, at, g=1.0, pan=0.0):
    x = np.asarray(x, np.float64)
    s = int(at * SR)
    if x.ndim == 1:
        st = np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)], 1)
    else:
        st = x
    if s >= len(buf): return
    if s < 0: st = st[-s:]; s = 0
    e = min(len(buf), s + len(st)); buf[s:e] += st[:e - s] * g
def adsr(d, a=.005, r=.1):
    n = int(d * SR); e = np.ones(n)
    na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    nr = min(n, int(r * SR)); e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e
def saw(f, d, det=0.0, nh=30):
    t = tv(d); x = np.zeros_like(t)
    for k in range(1, nh):
        if f * k > 14000: break
        x += np.sin(2 * np.pi * f * (1 + det) * k * t) / k
    return x * .55
def fm(fc, ratio, index, d, tau_i=.15):
    t = tv(d); I = index * np.exp(-t / tau_i)
    return np.sin(2 * np.pi * fc * t + I * np.sin(2 * np.pi * fc * ratio * t))
def stereo(x, w=.0006):
    d = int(w * SR); return np.stack([x, np.concatenate([np.zeros(d), x[:-d]]) if d else x], 1)
def ping(m, vel=.6, d=1.4):
    t = tv(d); f = hz(m)
    return (fm(f, 3.5, 2.6, d, .05) * np.exp(-t / .5) + .3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / .3)) * vel
def blip(m, vel=.5, d=.18):
    return fm(hz(m), 2.0, 1.6, d, .03) * np.exp(-tv(d) / .05) * vel
def tick(vel=.3, f=3000):
    n = int(.012 * SR); x = rng.standard_normal(n) * np.exp(-tv(.012) / .004)
    return sosfilt(sos('band', [f * .7, f * 1.4]), x) * vel * 3
def bass(m, d, vel=.8, cut=420):
    f = hz(m); x = saw(f, d, nh=16) * .8 + np.sin(2 * np.pi * f * tv(d)) * .9
    x = lpf(x, cut) + .12 * np.tanh(3 * lpf(x, 900))
    return x * adsr(d, .01, min(.2, d * .4)) * vel * .8
def pad(ms, d, vel=.25, cut=1400, a=.6, r=1.0):
    x = np.zeros(int(d * SR))
    for m in ms:
        for det in (-.0035, 0.0, .0041): x += saw(hz(m), d, det, nh=22)
    return (lpf(x, cut) * .7 + lpf(x, cut * .5) * .3) * adsr(d, a, r) * vel / max(1, len(ms))
def bowed(m, d, vel=.3):
    """vibraphone-like bowed tone: slow attack, tremolo, long release."""
    t = tv(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2 * t) + .15 * np.sin(2 * np.pi * f * 3.01 * t)
    env = np.clip(t / 1.2, 0, 1) ** 2 * np.exp(-np.clip(t - d * .55, 0, None) / 1.4)
    return x * env * (1 + .12 * np.sin(2 * np.pi * 5.5 * t)) * vel
def sweep(d, f0, f1, vel=.5):
    n = rng.standard_normal(int(d * SR)); out = np.zeros_like(n); blk = 256
    for i in range(0, len(n), blk):
        u = i / max(1, len(n)); f = f0 * (f1 / f0) ** u
        lo, hi = f * .65, min(f * 1.35, SR * .45)
        s = max(0, i - 3000); y = sosfilt(sos('band', [lo, hi]), n[s:i + blk]); out[i:i + blk] = y[-(min(blk, len(n) - i)):]
    return out * np.sin(np.pi * np.clip(tv(d) / d, 0, 1)) ** 1.2 * vel

T = {  # seconds, mirroring timeline.js (72 BPM); events above are the authority
    'scan1': 0.8333, 'scan1End': 5.0, 'peelArrive': 10.8333, 'peel': 11.6667,
    'peelEnd': 18.3333, 'turn': 19.1667, 'turnEnd': 27.5, 'r4': 36.6667, 'end': 38.3333,
}
silences = [(e['t'], e['to']) for e in ev.get('silence', [])]

def duck(n, depth=.06):
    """gain envelope: near-silence windows dip everything but the air."""
    g = np.ones(n)
    tt = np.arange(n) / SR
    for a, b in silences:
        m = (tt > a - .25) & (tt < b + .15)
        prof = np.ones(n)
        prof[m] = depth
        # smooth the edges
        k = int(.12 * SR)
        prof = np.convolve(prof, np.ones(k) / k, 'same')
        g = np.minimum(g, prof)
    return g

# ---------------------------------------------------------------- beds
def beds():
    n = N
    air = bpf(rng.standard_normal(n), 200, 1500) * .16
    BED[:, 0] += air; BED[:, 1] += np.roll(air, 1200)
    gust = np.convolve(rng.standard_normal(n), np.ones(int(1.3 * SR)) / int(1.3 * SR), 'same')
    gust = .5 + .5 * gust / (np.abs(gust).max() + 1e-9)
    BED[:] = BED * (.75 + .25 * gust)[:, None]

# ---------------------------------------------------------------- score
def score():
    b = lambda n: n * BEAT
    # pad: D minor for the cloud, stays under everything until the turn
    put(MUS, stereo(pad([mi('D3'), mi('A3'), mi('F4')], T['turn'] - .3, .26, 900, 1.5, 1.2)), 0.0)
    put(MUS, stereo(pad([mi('D4'), mi('A4')], b(14), .14, 2200, 2.0, 1.0)), T['scan1'])
    # telemetry pings on 8ths while the scan paints points in
    pat = ['D5', 'A5', 'F5', 'A5', 'D5', 'A5', 'E5', 'A5']
    k = 0
    while T['scan1'] + k * BEAT / 2 < T['scan1End']:
        put(FX, ping(mi(pat[k % 8]), .16, .8), T['scan1'] + k * BEAT / 2, 1, (k % 3 - 1) * .2)
        k += 1
    put(FX, ping(mi('D6'), .4, 1.6), T['scan1'])                       # the scan line enters
    # crackle tied to point arrivals during the scan
    for i in range(90):
        at = T['scan1'] + rng.uniform(0, T['scan1End'] - T['scan1'])
        put(FX, tick(.05 + .1 * rng.random(), rng.uniform(2400, 4200)), at, 1, rng.uniform(-.7, .7))
    # ticks divide during the peel: 8ths, then 16ths, then a 32nd acceleration
    t0 = T['peelArrive']
    for k2 in range(int((13.3 - t0) / (BEAT / 2))):
        put(FX, tick(.16, 2600), t0 + k2 * BEAT / 2)
    for k2 in range(int((16.6 - 13.3) / (BEAT / 4))):
        put(FX, tick(.13, 2900), 13.3 + k2 * BEAT / 4)
    tt = 16.6
    while tt < T['peelEnd'] - .05:
        put(FX, tick(.11, 3200), tt); tt += BEAT / 8
    # one descending blip per peeled layer (events from the page)
    base = mi('A5')
    for e in ev.get('layer', []):
        put(FX, blip(base - 3 * e['i'], .5), e['t'], 1, -.15)
    # impact: reversed swell into a synthesized gran-cassa hit at the turn
    imp = ev['impact'][0]['t']
    sw = sweep(1.1, 300, 3800, .5)
    put(HIT, sw[::-1].copy(), imp - 1.1)
    t_ = tv(1.8); drop = np.sin(2 * np.pi * (42 + 90 * np.exp(-t_ / .12)) * t_) * np.exp(-t_ / .5)
    put(HIT, stereo(drop * 1.1 + lpf(rng.standard_normal(len(t_)) * np.exp(-t_ / .08), 900) * .5), imp)
    # condense: noise sweep follows the front west -> east (J-cut: starts 0.3 s early)
    put(FX, stereo(sweep(T['turnEnd'] - T['turn'], 500, 2400, .34)), T['turn'] - .3)
    # pulse bass under the condense, on beats
    roots = ['D2', 'D2', 'Bb1', 'C2', 'D2', 'D2', 'F2', 'C2', 'D2', 'D2']
    for i, r in enumerate(roots):
        put(PUL, bass(mi(r), BEAT * .92, .7), T['turn'] + i * BEAT)
    # bowed timbre once the surface exists; notes enter with the readings
    for m, at in (('D4', T['turnEnd']), ('F4', 30.0), ('A4', 32.5), ('D5', 35.0)):
        put(MUS, stereo(bowed(mi(m), 6.5, .30)), at)
    # trace: a soft ping as each district border lights (order in timeline)
    for i in range(5):
        put(FX, ping(mi('F5') + 2 * i, .18, 1.0), T['turnEnd'] + i * 1.05, 1, .2)
    # ratchets under the rolling readings + a ping on each landing
    for e in ev.get('roll', []):
        n = int((e['to'] - e['t']) / .045)
        for i in range(n):
            put(FX, tick(.14, 3400), e['t'] + i * .045, 1, .25)
    for e in ev.get('land', []):
        put(FX, ping(mi('A5'), .34, 1.2), e['t'], 1, .15)
    # ghost: the pad returns, resolved; final ping under the end card
    put(MUS, stereo(pad([mi('D3'), mi('A3'), mi('F4'), mi('D5')], 5.2, .24, 1200, 1.2, 1.6)), 35.0)
    put(FX, ping(mi('D6'), .36, 2.2), ev['end'][0]['t'])

beds(); score()
# duck music + foley (not the air) into the two near-silences
g = duck(N)
for buf in (MUS, PUL, HIT, FX): buf *= g[:, None]
mix = MUS + PUL + HIT + FX + BED
# gentle bus compression + limiter
mix = np.tanh(mix * 1.15) * .82
peak = np.abs(mix).max()
if peak > .98: mix *= .98 / peak
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix[:int(DUR * SR)], SR)
print('mix.wav written; peak', round(float(np.abs(mix).max()), 3),
      '; silences at', silences, '; events used:', {k: len(v) for k, v in ev.items()})
