import { bobPositions } from "../physics/equations.ts";
import { SimParams, SimState, wrapAngle } from "../physics/state.ts";
import { EngineSnapshot, SimEngine } from "../sim/engine.ts";
import { Theme } from "./theme.ts";

export interface SceneViewOptions {
  showGround: boolean;
  showGravity: boolean;
  zoom: number;
}

export class SceneView {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: Theme;
  opts: SceneViewOptions = { showGround: true, showGravity: true, zoom: 1 };

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    this.ctx = ctx;
    this.theme = theme;
  }

  setTheme(t: Theme): void {
    this.theme = t;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(engine: SimEngine, snap: EngineSnapshot): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, width, height);

    const anchorX = width / 2;
    const anchorY = height * 0.2;
    const maxReach = engine.params.L1 + engine.params.L2;
    const baseScale = (Math.min(width, (height - anchorY) * 1.4) * 0.42) / maxReach;
    const scale = baseScale * this.opts.zoom;

    if (this.opts.showGround) this.drawGround(anchorY + maxReach * scale, width);
    if (this.opts.showGravity) this.drawGravity(width);

    if (engine.showTrail) this.drawTrail(engine, anchorX, anchorY, scale);

    this.drawPendulum(snap.state, engine.params, anchorX, anchorY, scale, this.theme.rod1, this.theme.bob1, this.theme.bob2);
    if (snap.twins && snap.twinState) {
      this.drawPendulum(snap.twinState, engine.params, anchorX, anchorY, scale, this.theme.twin1, this.theme.twin1, this.theme.twin2);
    }

    this.drawAnchor(anchorX, anchorY);

    if (snap.diverged) {
      ctx.fillStyle = this.theme.warning;
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Simulation diverged — reset", width / 2, 28);
    }
  }

  private drawGround(y: number, width: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.grid;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGravity(width: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.subtext;
    ctx.fillStyle = this.theme.subtext;
    ctx.lineWidth = 1.5;
    const x = width - 24;
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x, 36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x - 4, 34);
    ctx.lineTo(x + 4, 34);
    ctx.closePath();
    ctx.fill();
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("g", x, 52);
  }

  private drawTrail(engine: SimEngine, ax: number, ay: number, scale: number): void {
    const ctx = this.ctx;
    ctx.lineWidth = 1.25;
    ctx.lineCap = "round";
    const trail = engine.trail;
    const maxSpeed = 8;
    const pts = trail.toArray();
    if (pts.length < 2) return;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const age = i / (pts.length - 1);
      const hue = 200 + 120 * Math.min(1, b.speed / maxSpeed);
      ctx.strokeStyle = `hsla(${hue.toFixed(0)}, 85%, 60%, ${(0.05 + 0.6 * age).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(ax + a.x * scale, ay - a.y * scale);
      ctx.lineTo(ax + b.x * scale, ay - b.y * scale);
      ctx.stroke();
    }
  }

  private drawPendulum(
    s: SimState,
    p: SimParams,
    ax: number,
    ay: number,
    scale: number,
    rodColor: string,
    bob1Color: string,
    bob2Color: string,
  ): void {
    const ctx = this.ctx;
    const { x1, y1, x2, y2 } = bobPositions(s, p);
    const px1 = ax + x1 * scale;
    const py1 = ay - y1 * scale;
    const px2 = ax + x2 * scale;
    const py2 = ay - y2 * scale;

    ctx.strokeStyle = rodColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();

    const r1 = Math.max(4, 3 + 5 * Math.sqrt(p.m1));
    const r2 = Math.max(4, 3 + 5 * Math.sqrt(p.m2));
    ctx.fillStyle = bob1Color;
    ctx.beginPath();
    ctx.arc(px1, py1, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bob2Color;
    ctx.beginPath();
    ctx.arc(px2, py2, r2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.theme.text;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`θ₁=${deg(s.t1)}°`, px1, py1 - r1 - 4);
    ctx.fillText(`θ₂=${deg(s.t2)}°`, px2, py2 - r2 - 4);
  }

  private drawAnchor(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme.anchor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 4);
    ctx.lineTo(x + 18, y - 4);
    ctx.stroke();
  }

  bobHit(s: SimState, p: SimParams, mx: number, my: number, ax: number, ay: number, scale: number): "bob1" | "bob2" | null {
    const { x1, y1, x2, y2 } = bobPositions(s, p);
    const px1 = ax + x1 * scale;
    const py1 = ay - y1 * scale;
    const px2 = ax + x2 * scale;
    const py2 = ay - y2 * scale;
    const r1 = Math.max(4, 3 + 5 * Math.sqrt(p.m1)) + 6;
    const r2 = Math.max(4, 3 + 5 * Math.sqrt(p.m2)) + 6;
    if (Math.hypot(mx - px1, my - py1) <= r1) return "bob1";
    if (Math.hypot(mx - px2, my - py2) <= r2) return "bob2";
    return null;
  }

  getLayout(): { ax: number; ay: number; scale: number } {
    const { width, height } = this.canvas.getBoundingClientRect();
    const ax = width / 2;
    const ay = height * 0.2;
    return { ax, ay, scale: ax };
  }
}

function deg(rad: number): string {
  return (wrapAngle(rad) * (180 / Math.PI)).toFixed(1);
}
