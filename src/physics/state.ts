export interface SimParams {
  m1: number;
  m2: number;
  L1: number;
  L2: number;
  g: number;
  b: number;
}

export interface SimState {
  t1: number;
  t2: number;
  w1: number;
  w2: number;
}

export interface Deriv {
  dt1: number;
  dt2: number;
  dw1: number;
  dw2: number;
}

export const MAX_OMEGA = 100;
export const MIN_MASS = 0.01;
export const MAX_MASS = 10;
export const MIN_LENGTH = 0.1;
export const MAX_LENGTH = 2;
export const MIN_G = 0;
export const MAX_G = 20;
export const MIN_DAMPING = 0;
export const MAX_DAMPING = 2;

export const DEFAULT_PARAMS: SimParams = {
  m1: 1,
  m2: 1,
  L1: 1,
  L2: 1,
  g: 9.81,
  b: 0,
};

export const DEFAULT_STATE: SimState = {
  t1: Math.PI / 2,
  t2: Math.PI / 2,
  w1: 0,
  w2: 0,
};

export function clampParams(p: SimParams): SimParams {
  return {
    m1: clamp(p.m1, MIN_MASS, MAX_MASS),
    m2: clamp(p.m2, MIN_MASS, MAX_MASS),
    L1: clamp(p.L1, MIN_LENGTH, MAX_LENGTH),
    L2: clamp(p.L2, MIN_LENGTH, MAX_LENGTH),
    g: clamp(p.g, MIN_G, MAX_G),
    b: clamp(p.b, MIN_DAMPING, MAX_DAMPING),
  };
}

export function clampState(s: SimState): SimState {
  return {
    t1: s.t1,
    t2: s.t2,
    w1: clamp(s.w1, -MAX_OMEGA, MAX_OMEGA),
    w2: clamp(s.w2, -MAX_OMEGA, MAX_OMEGA),
  };
}

export function isDiverged(s: SimState): boolean {
  return Math.abs(s.w1) >= MAX_OMEGA || Math.abs(s.w2) >= MAX_OMEGA;
}

export function wrapAngle(a: number): number {
  let x = a % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
