// KHẢO SÁT MEA — the one timeline. 72 BPM, 4/4: one beat = 0.8333 s.
// Picture and score both read these numbers.
export const BPM = 72;
export const BEAT = 60 / BPM;
export const b = n => +(n * BEAT).toFixed(4);

export const T = {
  scan1: b(1),        // 0.83   scan line enters, paints the cloud
  scan1End: b(6),     // 5.00   cloud complete; crane begins
  title: b(7),        // 5.83   title resolves
  titleOff: b(13),    // 10.83
  peelArrive: b(13),  // 10.83  cutting plane arrives (silence A just before)
  peel: b(14),        // 11.67  first step down
  peelEnd: b(22),     // 18.33  cut reaches 10.5 m; silence B
  sil: b(22),         // 18.33
  turn: b(23),        // 19.17  impact: the front starts, points condense
  turnEnd: b(33),     // 27.50  surface complete
  trace: b(33),       // 27.50  district borders light in order
  traceEnd: b(38),    // 31.67
  r1: b(33),          // 27.50  reading: memory
  r1Land: b(35),      // 29.17
  r1Off: b(39),       // 32.50
  r2: b(36),          // 30.00  reading: skills
  r2Land: b(37.5),    // 31.25
  r2Off: b(41),       // 34.17
  r3: b(39),          // 32.50  reading: goals
  r3Land: b(40.5),    // 33.75
  r3Off: b(44),       // 36.67
  ghost: b(42),       // 35.00  peeled layer returns as ghost; pull-back
  r4: b(43),          // 35.83  final reading: the whole system
  end: b(44),         // 36.67  end card (left) while r4 holds (right)
  dur: 40.0,
};
// cut height at each peel step (m); steps land on beats 14, 16, 18, 20
export const PEEL_STEPS = [18, 15.5, 13, 10.5];
export const CUT_FINAL = 10.5;

// camera keys: t, target (x east, y up, z = -north; metres), distance,
// heading (deg, 0 = north, 90 = east), pitch (deg down), fov
export const CAM = [
  [0.0,    0, 6,   0, 620,   0, 90, 34],
  [5.0,  -10, 6,   0, 350,   6, 82, 34],
  [8.0,  -40, 8, -20, 240,  18, 48, 34],
  [11.0, -60, 9, -30, 165,  32, 18, 34],
  [15.0, -20, 9, -40, 155,  58, 15, 34],
  [19.2, -120, 8,  60, 150,  35, 25, 34],
  [23.0,  -20, 8,  50, 130,  40, 27, 34],
  [25.5,   60, 8,  20, 130,  55, 28, 34],
  [26.5,   30, 8, -40, 150,  90, 29, 34],
  [27.5,    5, 7, -106, 170, 128, 30, 34],
  [32.5,    5, 7, -106, 150, 155, 32, 34],
  [35.0,   0, 5, -20, 330, 175, 46, 34],
  [40.0,   0, 4,   0, 560, 190, 58, 34],
];
