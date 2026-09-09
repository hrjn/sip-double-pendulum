import { bobPositions } from "../physics/equations.ts";
import { SimEngine } from "../sim/engine.ts";
import { SceneView } from "../view/scene.ts";

type DragTarget = "bob1" | "bob2" | null;

export class DragController {
  private target: DragTarget = null;
  private ax = 0;
  private ay = 0;
  private scale = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private engine: SimEngine,
    private scene: SceneView,
    private onSet: () => void,
  ) {
    canvas.addEventListener("pointerdown", (e) => this.down(e));
    canvas.addEventListener("pointermove", (e) => this.move(e));
    window.addEventListener("pointerup", () => this.up());
  }

  private layout(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.ax = width / 2;
    this.ay = height * 0.2;
    const maxReach = this.engine.params.L1 + this.engine.params.L2;
    const baseScale = (Math.min(width, (height - this.ay) * 1.4) * 0.42) / maxReach;
    this.scale = baseScale * this.scene.opts.zoom;
  }

  private down(e: PointerEvent): void {
    if (this.engine.playing) return;
    this.layout();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.target = this.scene.bobHit(
      this.engine.initialState,
      this.engine.params,
      mx,
      my,
      this.ax,
      this.ay,
      this.scale,
    );
    if (this.target) {
      this.canvas.setPointerCapture(e.pointerId);
    }
  }

  private move(e: PointerEvent): void {
    if (!this.target || this.engine.playing) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = (mx - this.ax) / this.scale;
    const dy = (this.ay - my) / this.scale;
    const ic = { ...this.engine.initialState };
    if (this.target === "bob1") {
      ic.t1 = Math.atan2(dx, dy);
      const newBob1 = { x: this.engine.params.L1 * Math.sin(ic.t1), y: -this.engine.params.L1 * Math.cos(ic.t1) };
      const bob2x = newBob1.x + this.engine.params.L2 * Math.sin(ic.t2);
      const bob2y = newBob1.y - this.engine.params.L2 * Math.cos(ic.t2);
      ic.t2 = Math.atan2(bob2x - newBob1.x, -(bob2y - newBob1.y));
    } else {
      const { x1, y1 } = bobPositions({ ...ic, t1: ic.t1, t2: 0 }, this.engine.params);
      ic.t2 = Math.atan2(dx - x1, -(dy - y1));
    }
    this.engine.setInitialState(ic);
    this.onSet();
  }

  private up(): void {
    this.target = null;
  }
}
