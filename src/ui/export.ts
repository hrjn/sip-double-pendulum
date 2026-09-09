import { SimEngine } from "../sim/engine.ts";
import { buildShareURL, ShareableState } from "./share.ts";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

export function wireExport(engine: SimEngine): void {
  $("exportPng").addEventListener("click", () => {
    const canvas = document.getElementById("scene") as HTMLCanvasElement;
    const url = canvas.toDataURL("image/png");
    download(url, "double-pendulum-trail.png");
  });

  $("exportCsv").addEventListener("click", () => {
    const csv = buildCsv(engine);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    download(url, "double-pendulum-series.csv");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $("copyLink").addEventListener("click", async () => {
    const state: ShareableState = {
      p: engine.params,
      s: engine.initialState,
      twins: engine.twins,
      delta: engine.twinDelta,
      showTrail: engine.showTrail,
      trailLen: engine.trail.capacity,
    };
    const url = buildShareURL(state);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  });
}

function download(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildCsv(engine: SimEngine): string {
  const pts = engine.trail.toArray();
  let rows = "index,x2,y2,speed\n";
  pts.forEach((p, i) => {
    rows += `${i},${p.x.toFixed(6)},${p.y.toFixed(6)},${p.speed.toFixed(6)}\n`;
  });
  if (pts.length === engine.trail.capacity) {
    rows = `# truncated to last ${pts.length} points\n` + rows;
  }
  return rows;
}
