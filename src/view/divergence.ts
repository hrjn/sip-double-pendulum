import { Theme } from "./theme.ts";

interface DivPt {
  t: number;
  delta: number;
}

export class DivergenceView {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: Theme;
  private points: DivPt[] = [];
  private maxPoints = 6000;
  growthRate: number | null = null;

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

  push(t: number, delta: number): void {
    if (delta <= 0) delta = 1e-12;
    this.points.push({ t, delta });
    if (this.points.length > this.maxPoints) this.points.shift();
    this.estimateGrowth();
  }

  clear(): void {
    this.points = [];
    this.growthRate = null;
  }

  private estimateGrowth(): void {
    if (this.points.length < 20) return;
    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    const dt = last.t - first.t;
    if (dt < 0.1) return;
    const ratio = last.delta / Math.max(first.delta, 1e-12);
    if (ratio <= 1) {
      this.growthRate = 0;
      return;
    }
    this.growthRate = Math.log(ratio) / dt;
  }

  render(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, width, height);

    const pad = 28;
    const w = width - 2 * pad;
    const h = height - 2 * pad;

    if (this.points.length < 2) {
      ctx.fillStyle = this.theme.subtext;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Enable “Identical twins” and play to see divergence", width / 2, height / 2);
      return;
    }

    const tMin = this.points[0].t;
    const tMax = this.points[this.points.length - 1].t;
    const dMin = Math.log10(Math.max(1e-12, Math.min(...this.points.map((p) => p.delta))));
    const dMax = Math.log10(Math.max(...this.points.map((p) => p.delta)));
    const dSpan = Math.max(1, dMax - dMin);

    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h * i) / 4;
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + w, y);
    }
    ctx.stroke();

    ctx.strokeStyle = this.theme.rod1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.points.forEach((p, i) => {
      const x = pad + ((p.t - tMin) / Math.max(1e-9, tMax - tMin)) * w;
      const ly = Math.log10(Math.max(1e-12, p.delta));
      const y = pad + h - ((ly - dMin) / dSpan) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = this.theme.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("log₁₀ Δθ₁", pad + 2, pad - 6);
    ctx.textAlign = "right";
    ctx.fillText("time (s)", pad + w, pad + h + 16);

    if (this.growthRate !== null) {
      ctx.textAlign = "left";
      ctx.fillStyle = this.theme.warning;
      ctx.fillText(`λ ≈ ${this.growthRate.toFixed(3)} /s`, pad + 4, pad + 18);
    }
  }
}
