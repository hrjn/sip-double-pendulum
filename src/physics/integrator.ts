import { derivatives } from "./equations.ts";
import { Deriv, SimParams, SimState } from "./state.ts";

function addScaled(s: SimState, d: Deriv, h: number): SimState {
  return {
    t1: s.t1 + h * d.dt1,
    t2: s.t2 + h * d.dt2,
    w1: s.w1 + h * d.dw1,
    w2: s.w2 + h * d.dw2,
  };
}

function addDerivs(a: Deriv, b: Deriv): Deriv {
  return {
    dt1: a.dt1 + b.dt1,
    dt2: a.dt2 + b.dt2,
    dw1: a.dw1 + b.dw1,
    dw2: a.dw2 + b.dw2,
  };
}

function scaleDeriv(d: Deriv, s: number): Deriv {
  return {
    dt1: d.dt1 * s,
    dt2: d.dt2 * s,
    dw1: d.dw1 * s,
    dw2: d.dw2 * s,
  };
}

export function rk4Step(s: SimState, p: SimParams, h: number): SimState {
  const k1 = derivatives(s, p);
  const k2 = derivatives(addScaled(s, k1, h / 2), p);
  const k3 = derivatives(addScaled(s, k2, h / 2), p);
  const k4 = derivatives(addScaled(s, k3, h), p);

  const sum = addDerivs(
    addDerivs(k1, scaleDeriv(k2, 2)),
    addDerivs(scaleDeriv(k3, 2), k4),
  );
  const dh = (h / 6) * 1;

  return {
    t1: s.t1 + dh * sum.dt1,
    t2: s.t2 + dh * sum.dt2,
    w1: s.w1 + dh * sum.dw1,
    w2: s.w2 + dh * sum.dw2,
  };
}

export interface StepResult {
  state: SimState;
  diverged: boolean;
}

export function stepClamped(s: SimState, p: SimParams, h: number): StepResult {
  const next = rk4Step(s, p, h);
  if (
    Math.abs(next.w1) > 1e6 ||
    Math.abs(next.w2) > 1e6 ||
    !Number.isFinite(next.t1) ||
    !Number.isFinite(next.t2) ||
    !Number.isFinite(next.w1) ||
    !Number.isFinite(next.w2)
  ) {
    return { state: s, diverged: true };
  }
  return { state: next, diverged: false };
}
