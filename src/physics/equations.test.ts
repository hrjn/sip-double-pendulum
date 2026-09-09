import { describe, it, expect } from "vitest";
import { derivatives, energy } from "./equations.ts";
import { rk4Step, stepClamped } from "./integrator.ts";
import { DEFAULT_PARAMS, SimParams, SimState, wrapAngle } from "./state.ts";

describe("equations", () => {
  it("a hanging pendulum at rest has zero acceleration", () => {
    const p: SimParams = { ...DEFAULT_PARAMS };
    const s: SimState = { t1: 0, t2: 0, w1: 0, w2: 0 };
    const d = derivatives(s, p);
    expect(Math.abs(d.dw1)).toBeLessThan(1e-9);
    expect(Math.abs(d.dw2)).toBeLessThan(1e-9);
  });

  it("a hanging pendulum at rest has the expected potential energy", () => {
    const p: SimParams = { m1: 1, m2: 2, L1: 0.5, L2: 0.7, g: 9.81, b: 0 };
    const s: SimState = { t1: 0, t2: 0, w1: 0, w2: 0 };
    const { pe } = energy(s, p);
    const expected = -p.g * (p.m1 * p.L1 + p.m2 * (p.L1 + p.L2));
    expect(pe).toBeCloseTo(expected, 6);
  });

  it("with g=0 and no damping, the free-spin energy is purely kinetic", () => {
    const p: SimParams = { ...DEFAULT_PARAMS, g: 0, b: 0 };
    const s: SimState = { t1: 0.3, t2: -0.4, w1: 2, w2: 1 };
    const { pe, ke, total } = energy(s, p);
    expect(Math.abs(pe)).toBeLessThan(1e-12);
    expect(total).toBeCloseTo(ke, 9);
  });
});

describe("rk4 integration", () => {
  it("conserves total energy within 1% over 60 s for classic chaos (b=0)", () => {
    const p: SimParams = { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81, b: 0 };
    const s0: SimState = { t1: Math.PI / 2, t2: Math.PI / 2, w1: 0, w2: 0 };
    const dt = 1 / 240;
    let s = s0;
    const steps = Math.round(60 / dt);
    let eMin = Infinity;
    let eMax = -Infinity;
    let keMax = 0;
    for (let i = 0; i <= steps; i++) {
      const e = energy(s, p);
      eMin = Math.min(eMin, e.total);
      eMax = Math.max(eMax, e.total);
      keMax = Math.max(keMax, Math.abs(e.ke), Math.abs(e.pe));
      if (i < steps) s = rk4Step(s, p, dt);
    }
    // Conservation: the spread of total energy over the run, relative to the
    // energy scale of the motion, must stay under 1%.
    const scale = Math.max(keMax, Math.abs(eMin), Math.abs(eMax), 1e-9);
    const driftPct = ((eMax - eMin) / scale) * 100;
    expect(driftPct).toBeLessThan(1);
  });

  it("stepClamped flags divergence on a NaN-producing trajectory", () => {
    const p: SimParams = { ...DEFAULT_PARAMS };
    const s: SimState = { t1: NaN, t2: 0, w1: 0, w2: 0 };
    const r = stepClamped(s, p, 1 / 240);
    expect(r.diverged).toBe(true);
  });
});

describe("wrapAngle", () => {
  it("wraps angles into (-π, π]", () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(Math.PI)).toBeCloseTo(Math.PI, 9);
    expect(wrapAngle(-Math.PI)).toBeCloseTo(Math.PI, 9);
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 6);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI, 6);
    expect(wrapAngle(2 * Math.PI + 0.5)).toBeCloseTo(0.5, 9);
  });
});
