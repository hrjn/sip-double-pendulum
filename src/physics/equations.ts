import { Deriv, SimParams, SimState } from "./state.ts";

export function derivatives(s: SimState, p: SimParams): Deriv {
  const { t1, t2, w1, w2 } = s;
  const { m1, m2, L1, L2, g, b } = p;

  const d = t1 - t2;
  const sd = Math.sin(d);
  const cd = Math.cos(d);
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2);
  const safeDen = den === 0 ? 1e-12 : den;

  const dw1 =
    (-g * (2 * m1 + m2) * Math.sin(t1) -
      m2 * g * Math.sin(t1 - 2 * t2) -
      2 * sd * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * cd)) /
      (L1 * safeDen) -
    b * w1;

  const dw2 =
    (2 *
      sd *
      (w1 * w1 * L1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(t1) +
        w2 * w2 * L2 * m2 * cd)) /
      (L2 * safeDen) -
    b * w2;

  return { dt1: w1, dt2: w2, dw1, dw2 };
}

export function bobPositions(s: SimState, p: SimParams) {
  const x1 = p.L1 * Math.sin(s.t1);
  const y1 = -p.L1 * Math.cos(s.t1);
  const x2 = x1 + p.L2 * Math.sin(s.t2);
  const y2 = y1 - p.L2 * Math.cos(s.t2);
  return { x1, y1, x2, y2 };
}

export function energy(s: SimState, p: SimParams): { ke: number; pe: number; total: number } {
  const { t1, t2, w1, w2 } = s;
  const { m1, m2, L1, L2, g } = p;

  const y1 = -L1 * Math.cos(t1);
  const y2 = y1 - L2 * Math.cos(t2);

  const v1sq = L1 * L1 * w1 * w1;
  const v2sq = L1 * L1 * w1 * w1 + L2 * L2 * w2 * w2 + 2 * L1 * L2 * w1 * w2 * Math.cos(t1 - t2);

  const ke = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;
  const pe = m1 * g * y1 + m2 * g * y2;
  return { ke, pe, total: ke + pe };
}
