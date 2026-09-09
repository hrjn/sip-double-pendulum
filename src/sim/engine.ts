import { energy } from "../physics/equations.ts";
import { rk4Step, stepClamped } from "../physics/integrator.ts";
import { SimParams, SimState } from "../physics/state.ts";
import { Trail } from "./trail.ts";

export const DT_PHYSICS = 1 / 240;
export const MAX_FRAME_BUDGET = 1 / 30;

export interface EngineSnapshot {
  state: SimState;
  twinState: SimState | null;
  time: number;
  ke: number;
  pe: number;
  total: number;
  initialTotal: number;
  drift: number;
  diverged: boolean;
  twins: boolean;
  delta: number;
  thetaDelta: number;
}

export class SimEngine {
  params: SimParams;
  state: SimState;
  initialState: SimState;

  playing = false;
  speed = 1;
  diverged = false;

  twins = false;
  twinDelta = 1e-4;
  twinState: SimState | null = null;

  trail: Trail;
  showTrail = true;

  private time = 0;
  private accumulator = 0;
  private initialTotal: number;

  constructor(params: SimParams, state: SimState, trailCapacity = 5000) {
    this.params = params;
    this.state = { ...state };
    this.initialState = { ...state };
    this.trail = new Trail(trailCapacity);
    this.initialTotal = energy(state, params).total;
  }

  setParams(p: SimParams): void {
    this.params = p;
    this.initialTotal = energy(this.state, p).total;
  }

  setInitialState(s: SimState): void {
    this.initialState = { ...s };
    this.reset();
  }

  reset(): void {
    this.state = { ...this.initialState };
    this.twinState = this.twins
      ? { ...this.initialState, t1: this.initialState.t1 + this.twinDelta }
      : null;
    this.time = 0;
    this.accumulator = 0;
    this.diverged = false;
    this.trail.clear();
    this.initialTotal = energy(this.state, this.params).total;
  }

  play(): void {
    if (this.diverged) this.reset();
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  stepOnce(): void {
    const r = stepClamped(this.state, this.params, DT_PHYSICS);
    this.state = r.state;
    if (r.diverged) this.diverged = true;
    if (this.twins && this.twinState) {
      this.twinState = rk4Step(this.twinState, this.params, DT_PHYSICS);
    }
    this.time += DT_PHYSICS;
    this.trail.push(this.state, this.params);
  }

  advance(realDt: number): void {
    if (!this.playing || this.diverged) return;
    const dt = Math.min(realDt * this.speed, MAX_FRAME_BUDGET);
    this.accumulator += dt;
    while (this.accumulator >= DT_PHYSICS) {
      const r = stepClamped(this.state, this.params, DT_PHYSICS);
      this.state = r.state;
      if (r.diverged) {
        this.diverged = true;
        this.pause();
        return;
      }
      if (this.twins && this.twinState) {
        this.twinState = rk4Step(this.twinState, this.params, DT_PHYSICS);
      }
      this.trail.push(this.state, this.params);
      this.accumulator -= DT_PHYSICS;
      this.time += DT_PHYSICS;
    }
  }

  setTwins(enabled: boolean, delta = this.twinDelta): void {
    this.twins = enabled;
    this.twinDelta = delta;
    if (enabled) {
      this.twinState = { ...this.initialState, t1: this.initialState.t1 + delta };
    } else {
      this.twinState = null;
    }
  }

  snapshot(): EngineSnapshot {
    const { ke, pe, total } = energy(this.state, this.params);
    const scale = Math.max(
      Math.abs(this.initialTotal),
      Math.abs(total),
      Math.abs(ke),
      Math.abs(pe),
      1e-9,
    );
    const drift = ((total - this.initialTotal) / scale) * 100;
    const thetaDelta =
      this.twins && this.twinState
        ? Math.abs(this.state.t1 - this.twinState.t1)
        : 0;
    return {
      state: this.state,
      twinState: this.twinState,
      time: this.time,
      ke,
      pe,
      total,
      initialTotal: this.initialTotal,
      drift,
      diverged: this.diverged,
      twins: this.twins,
      delta: this.twinDelta,
      thetaDelta,
    };
  }

  get timeValue(): number {
    return this.time;
  }
}
