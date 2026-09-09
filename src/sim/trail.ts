import { bobPositions } from "../physics/equations.ts";
import { SimParams, SimState } from "../physics/state.ts";

export interface TrailPoint {
  x: number;
  y: number;
  speed: number;
}

export class Trail {
  private xs: Float32Array;
  private ys: Float32Array;
  private sp: Float32Array;
  private head = 0;
  private count = 0;
  capacity: number;

  constructor(capacity: number) {
    this.capacity = Math.max(2, Math.floor(capacity));
    this.xs = new Float32Array(this.capacity);
    this.ys = new Float32Array(this.capacity);
    this.sp = new Float32Array(this.capacity);
  }

  get length(): number {
    return this.count;
  }

  push(s: SimState, p: SimParams): void {
    const { x2, y2 } = bobPositions(s, p);
    const speed = Math.hypot(s.w1, s.w2);
    this.xs[this.head] = x2;
    this.ys[this.head] = y2;
    this.sp[this.head] = speed;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
  }

  resize(capacity: number): void {
    const cap = Math.max(2, Math.floor(capacity));
    if (cap === this.capacity) return;
    const old = this.toArray();
    this.capacity = cap;
    this.xs = new Float32Array(cap);
    this.ys = new Float32Array(cap);
    this.sp = new Float32Array(cap);
    this.head = 0;
    this.count = 0;
    const start = Math.max(0, old.length - cap);
    for (let i = start; i < old.length; i++) {
      this.pushPoint(old[i]);
    }
  }

  private pushPoint(pt: TrailPoint): void {
    this.xs[this.head] = pt.x;
    this.ys[this.head] = pt.y;
    this.sp[this.head] = pt.speed;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  toArray(): TrailPoint[] {
    const out: TrailPoint[] = [];
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      out.push({ x: this.xs[idx], y: this.ys[idx], speed: this.sp[idx] });
    }
    return out;
  }

  forEach(cb: (pt: TrailPoint, age01: number) => void): void {
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      const age01 = this.count > 1 ? i / (this.count - 1) : 1;
      cb({ x: this.xs[idx], y: this.ys[idx], speed: this.sp[idx] }, age01);
    }
  }
}
