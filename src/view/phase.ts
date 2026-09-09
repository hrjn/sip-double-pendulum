import { SimState, wrapAngle } from "../physics/state.ts";
import { Theme } from "./theme.ts";

export type PhaseMode = "2d-t1" | "2d-t2" | "poincare" | "3d";

interface Pt {
  x: number;
  y: number;
  z: number;
  w2: number;
}

export class PhaseView {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: Theme;
  mode: PhaseMode = "2d-t1";
  private points: Pt[] = [];
  private poincare: Pt[] = [];
  private lastT1: number | null = null;
  private maxPoints = 4000;

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

  push(s: SimState): void {
    const pt: Pt = { x: wrapAngle(s.t1), y: s.w1, z: wrapAngle(s.t2), w2: s.w2 };
    this.points.push(pt);
    if (this.points.length > this.maxPoints) this.points.shift();

    if (this.mode === "poincare") {
      if (this.lastT1 !== null) {
        const crossing =
          (this.lastT1 < 0 && pt.x >= 0) || (this.lastT1 > 0 && pt.x <= 0);
        if (crossing) {
          this.poincare.push({ x: wrapAngle(s.t2), y: s.w2, z: 0, w2: s.w2 });
          if (this.poincare.length > this.maxPoints) this.poincare.shift();
        }
      }
      this.lastT1 = pt.x;
    }
  }

  clear(): void {
    this.points = [];
    this.poincare = [];
    this.lastT1 = null;
  }

  setMode(m: PhaseMode): void {
    this.mode = m;
    this.poincare = [];
    this.lastT1 = null;
  }

  render(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, width, height);

    const pad = 24;
    const w = width - 2 * pad;
    const h = height - 2 * pad;

    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + h / 2);
    ctx.lineTo(pad + w, pad + h / 2);
    ctx.moveTo(pad + w / 2, pad);
    ctx.lineTo(pad + w / 2, pad + h);
    ctx.stroke();

    ctx.fillStyle = this.theme.subtext;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    const label = this.axisLabel();
    ctx.fillText(label.x, pad + 4, pad + 12);
    ctx.textAlign = "right";
    ctx.fillText(label.y, pad + w - 4, pad + h / 2 - 4);

    const pts = this.mode === "poincare" ? this.poincare : this.points;
    if (pts.length < 2) {
      ctx.fillStyle = this.theme.subtext;
      ctx.textAlign = "center";
      ctx.fillText("Collecting trajectory…", width / 2, height / 2);
      return;
    }

    const range = this.range();
    ctx.lineWidth = 1;
    const draw = (project: (p: Pt) => { x: number; y: number }, color: string) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const pr = project(p);
        const x = pad + ((pr.x - range.xMin) / (range.xMax - range.xMin)) * w;
        const y = pad + h - ((pr.y - range.yMin) / (range.yMax - range.yMin)) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    if (this.mode === "3d") {
      const proj = (p: Pt) => {
        const cx = Math.cos(0.6);
        const sx = Math.sin(0.6);
        return {
          x: p.x * cx - p.z * sx,
          y: p.y,
        };
      };
      draw(proj, this.theme.rod1);
    } else if (this.mode === "2d-t2") {
      draw((p) => ({ x: p.z, y: p.w2 }), this.theme.rod2);
    } else {
      draw((p) => ({ x: p.x, y: p.y }), this.theme.rod1);
    }
  }

  private axisLabel(): { x: string; y: string } {
    switch (this.mode) {
      case "2d-t1":
        return { x: "θ₁", y: "ω₁" };
      case "2d-t2":
        return { x: "θ₂", y: "ω₂" };
      case "poincare":
        return { x: "θ₂ (Poincaré)", y: "ω₂" };
      case "3d":
        return { x: "θ₁/θ₂", y: "ω₁" };
    }
  }

  private range() {
    return { xMin: -Math.PI - 0.2, xMax: Math.PI + 0.2, yMin: -12, yMax: 12 };
  }
}
