#!/usr/bin/env python3
"""Build points.bin + ground.bin + facts.json for KHẢO SÁT MEA.

Deterministic point generation from data/inventory.json (see FACTS.md):
  1 point ~ 256 bytes; per file clamp(round(size/256), 3, 600) points.
  Anchor = FNV-1a(path) inside the file's district sector; scatter disc
  radius grows with log size; height = 2.2*log10(size+1) + depth, +-15%.
Binary layouts match the lidar-survey demo engine:
  points.bin: u32 N; u16 xyz (quantised); u8 hag(x8), cls, inten, rnd
  ground.bin: u32 GW,GH; f32 GX0,GY0,RES,OZ,SZ; u16 z; i8 normals x3;
              u8 lt x4 = [ao, borderProximity, districtOrder, relief]
"""
import json, math, os, struct, sys
import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
inv = json.load(open(os.path.join(HERE, 'inventory.json')))
files = inv['files']

# survey tile: east x in [-200, 200], north y in [-150, 150]
SECTORS = {  # district -> (x0, x1, y0, y1, order); sized by point mass,
    # the east strip (x > 166) stays unmeasured — the survey window's edge
    'spoofx': (-200, -44, -150, 150, 3),
    'memory': (-40, 50, 62, 150, 0),
    'goals': (-40, 88, -150, 30, 2),
    'skills': (92, 162, 70, 150, 1),
    'system': (92, 162, -60, 40, 4),
}
CLS = {'memory': 0, 'skills': 1, 'goals': 2, 'spoofx': 3, 'system': 4}

def fnv(s):
    h = 2166136261
    for ch in s.encode('utf-8', 'replace'):
        h ^= ch; h = (h * 16777619) & 0xFFFFFFFF
    return h

rng_pts = []   # (x, y_north, z, cls, inten)
for f in files:
    d = f['district']; x0, x1, y0, y1, _ = SECTORS[d]
    h1 = fnv(f['path']); h2 = fnv(f['path'] + '#2')
    ax = x0 + (h1 % 100000) / 100000 * (x1 - x0)
    ay = y0 + (h2 % 100000) / 100000 * (y1 - y0)
    size = f['size']
    k = int(min(600, max(3, round(size / 256))))
    base_h = 2.2 * math.log10(size + 1) + f['depth']
    rad = 1.5 + 1.1 * math.log10(size + 1)
    inten = 90 + (h1 >> 8) % 120
    for i in range(k):
        hh = fnv(f"{f['path']}#{i}")
        u1 = ((hh >> 3) % 10000) / 10000; u2 = ((hh >> 13) % 10000) / 10000
        u3 = ((hh >> 23) % 10000) / 10000
        # Rayleigh scatter: density falls off, no hard disc edge
        r = rad * math.sqrt(-2 * math.log(1 - u1 * 0.995)) / 1.6
        th = u2 * 2 * math.pi
        x = min(200, max(-200, ax + r * math.cos(th)))
        y = min(150, max(-150, ay + r * math.sin(th)))
        # domed crown: centre higher, edge lower, plus per-point jitter
        dome = max(0.25, 1 - 0.55 * (min(r, rad * 1.8) / (rad * 1.8)) ** 2)
        z = max(0.4, base_h * dome * (0.8 + 0.4 * u3))
        rng_pts.append((x, y, z, CLS[d], inten, hh & 0xFF))

P = np.array(rng_pts, dtype=np.float64)
N = len(P)
print('points:', N)

# ---- points.bin (demo quantisation: OX,OY,OZ, SXY, SZ) ----
OX, OY, OZ = -32768, -32768, 0.0     # in quantised units, see SXY/SZ
SXY, SZ = 0.05, 0.05                  # 5 cm steps
qx = np.clip(np.round((P[:, 0] - OX * SXY) / SXY), 0, 65535).astype(np.uint16)
# simpler: store (x - (-250)) / SXY with OX chosen so q.OX*SXY = -250
OX = -250 / SXY; OY = -250 / SXY
qx = np.clip(np.round((P[:, 0] + 250) / SXY), 0, 65535).astype(np.uint16)
qy = np.clip(np.round((P[:, 1] + 250) / SXY), 0, 65535).astype(np.uint16)
qz = np.clip(np.round(P[:, 2] / SZ), 0, 65535).astype(np.uint16)
pos = np.stack([qx, qy, qz], 1).astype('<u2')
hag = np.clip(np.round(P[:, 2] * 8), 0, 255).astype(np.uint8)
cls = P[:, 3].astype(np.uint8)
inten = (P[:, 4] / 255.0).astype(np.uint8)  # demo stores normalised inten as u8 (converted by attribute normalisation)
inten = np.clip(np.round(P[:, 4] / 255 * 255), 0, 255).astype(np.uint8)
rndb = P[:, 5].astype(np.uint8)
with open(os.path.join(HERE, 'points.bin'), 'wb') as fh:
    fh.write(struct.pack('<I', N))
    fh.write(pos.tobytes()); fh.write(hag.tobytes()); fh.write(cls.tobytes())
    fh.write(inten.tobytes()); fh.write(rndb.tobytes())

# ---- ground heightfield: from the points that survive the peel (h <= 10.5) ----
RES = 2.0
GW, GH = int(400 / RES) + 1, int(300 / RES) + 1
GX0, GY0 = -200.0, -150.0
grid = np.zeros((GH, GW), dtype=np.float64)
Ps = P[P[:, 2] <= 10.5]
gi = np.clip(((Ps[:, 0] - GX0) / RES).astype(int), 0, GW - 1)
gj = np.clip(((Ps[:, 1] - GY0) / RES).astype(int), 0, GH - 1)
np.maximum.at(grid, (gj, gi), Ps[:, 2])
mask = grid > 0
# fill holes by iterative dilation of known values, then smooth
filled = grid.copy()
for _ in range(60):
    if mask.all(): break
    acc = np.zeros_like(filled); cnt = np.zeros_like(filled)
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        sh = np.roll(np.roll(filled, dy, 0), dx, 1); sm = np.roll(np.roll(mask, dy, 0), dx, 1)
        acc += np.where(sm, sh, 0); cnt += sm
    newm = (~mask) & (cnt > 0)
    filled[newm] = acc[newm] / cnt[newm]; mask |= newm
sm = ndimage.gaussian_filter(filled, 1.2)
sm = np.minimum(sm, ndimage.maximum_filter(sm, 3))  # keep crests tame
# normals from gradient
gz, gx = np.gradient(sm, RES, RES)
nlen = np.sqrt(gx**2 + gz**2 + 1)
nrm = np.stack([-gx / nlen, np.ones_like(sm) / nlen, -gz / nlen], -1)  # (nx, up, nz-ish)
# ao: concavity (mean of neighbours - centre)
mean3 = ndimage.uniform_filter(sm, 3)
ao = np.clip(0.75 + (sm - mean3) * 0.35, 0.35, 1.0)
relief = np.clip((sm - ndimage.gaussian_filter(sm, 8)) * 0.3 + 0.5, 0, 1)
# border proximity + district order per vertex
xs = GX0 + np.arange(GW) * RES; ys = GY0 + np.arange(GH) * RES
border = np.zeros((GH, GW)); order = np.zeros((GH, GW))
for j, y in enumerate(ys):
    for i, x in enumerate(xs):
        for d, (a, b, c, dd, od) in SECTORS.items():
            if a - 2 <= x <= b + 2 and c - 2 <= y <= dd + 2:
                dist = min(abs(x - a), abs(x - b), abs(y - c), abs(y - dd))
                border[j, i] = max(border[j, i], np.clip(1 - dist / 1.5, 0, 1))
                order[j, i] = od / 4.0
GSZ = 0.01
zc = np.clip(np.round(sm / GSZ), 0, 65535).astype('<u2')
nq = np.clip(np.round(nrm * 127), -128, 127).astype(np.int8)
lt = np.stack([np.clip(ao * 255, 0, 255), np.clip(border * 255, 0, 255),
               np.clip(order * 255, 0, 255), np.clip(relief * 255, 0, 255)], -1).astype(np.uint8)
with open(os.path.join(HERE, 'ground.bin'), 'wb') as fh:
    fh.write(struct.pack('<II', GW, GH))
    fh.write(struct.pack('<fffff', GX0, GY0, RES, 0.0, GSZ))
    fh.write(zc.tobytes()); fh.write(nq.tobytes()); fh.write(lt.tobytes())

facts = {
    'points': int(N), 'files': inv['summary']['total_files'],
    'bytes': inv['summary']['total_bytes'],
    'memory_files': inv['summary']['memory_files'], 'memory_bytes': inv['summary']['memory_bytes'],
    'skills_total': 84, 'skills_custom': 30, 'skills_system': 54,
    'goals': inv['summary']['goal_workspaces'],
    'spoofx_files': inv['summary']['districts']['spoofx']['files'],
    'days': 7, 'date_from': '2026-10-15', 'date_to': '2026-10-21',
    'quant': {'OX': OX, 'OY': OY, 'OZ': 0.0, 'SXY': SXY, 'SZ': SZ},
    'sectors': {k: v for k, v in SECTORS.items()},
    'hag_hist': np.histogram(P[:, 2], bins=np.arange(0, 22, 1.0))[0].tolist(),
    'x_cum': np.histogram(P[:, 0], bins=np.arange(-200, 201, 10.0))[0].tolist(),
    'centroids': {d: [ (SECTORS[d][0]+SECTORS[d][1])/2, (SECTORS[d][2]+SECTORS[d][3])/2 ] for d in SECTORS},
    'surface_max': float(sm.max()),
}
json.dump(facts, open(os.path.join(HERE, 'facts.json'), 'w'), ensure_ascii=False, indent=1)
print('facts:', json.dumps(facts, ensure_ascii=False))
print('ground grid:', GW, GH, 'max h:', float(sm.max()))
