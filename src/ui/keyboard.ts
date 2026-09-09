import { SimEngine } from "../sim/engine.ts";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

export function wireKeyboard(engine: SimEngine, onPlay: () => void): void {
  window.addEventListener("keydown", (e) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable)) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        engine.toggle();
        onPlay();
        break;
      case "r":
      case "R":
        engine.reset();
        break;
      case "s":
      case "S":
        if (!engine.playing) engine.stepOnce();
        break;
      default:
        break;
    }
  });
}

export function wireToolbar(engine: SimEngine, onPlay: () => void): void {
  $("playBtn").addEventListener("click", () => {
    engine.toggle();
    onPlay();
  });
  $("stepBtn").addEventListener("click", () => {
    if (!engine.playing) engine.stepOnce();
  });
  $("resetBtn").addEventListener("click", () => {
    engine.reset();
    onPlay();
  });
}
