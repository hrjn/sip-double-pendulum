import { Theme } from "./theme.ts";

interface EPt {
  t: number;
  total: number;
}

export class EnergyView {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: Theme;
  private points: EPt[] = [];
  private maxPoints = 3600;

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

  push(t: number, total: number): void {
    this.points.push({ t, total });
    if (this.points.length > this.maxPoints) this.points.shift();
  }

  clear(): void {
    this.points = [];
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
      ctx.fillText("Press play to collect energy data", width / 2, height / 2);
      return;
    }

    const tMin = this.points[0].t;
    const tMax = this.points[this.points.length - 1].t;
    const vals = this.points.map((p) => p.total);
    let vMin = Math.min(...vals);
    let vMax = Math.max(...vals);
    if (vMax - vMin < 1e-9) {
      vMin -= 1;
      vMax += 1;
    }

    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h * i) / 4;
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + w, y);
    }
    ctx.stroke();

    ctx.strokeStyle = this.theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.points.forEach((p, i) => {
      const x = pad + ((p.t - tMin) / Math.max(1e-9, tMax - tMin)) * w;
      const y = pad + h - ((p.total - vMin) / (vMax - vMin)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = this.theme.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Total energy", pad + 2, pad - 6);
    ctx.textAlign = "right";
    ctx.fillText("time (s)", pad + w, pad + h + 16);
  }
}
