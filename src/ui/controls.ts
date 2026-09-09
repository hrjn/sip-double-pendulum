import { SimEngine } from "../sim/engine.ts";

interface Row {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  get: () => number;
  set: (v: number) => void;
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function makeSlider(row: Row, container: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.className = "ctrl-row";

  const head = document.createElement("div");
  head.className = "ctrl-head";
  const label = document.createElement("label");
  label.textContent = row.label;
  const value = document.createElement("span");
  value.className = "ctrl-value";
  head.appendChild(label);
  head.appendChild(value);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(row.min);
  slider.max = String(row.max);
  slider.step = String(row.step);
  slider.value = String(row.get());
  slider.setAttribute("aria-label", `${row.label} (${row.unit})`);

  const numInput = document.createElement("input");
  numInput.type = "number";
  numInput.min = String(row.min);
  numInput.max = String(row.max);
  numInput.step = String(row.step);
  numInput.value = String(row.get());
  numInput.className = "ctrl-num";

  const update = (v: number, source: "slider" | "num") => {
    const clamped = Math.min(row.max, Math.max(row.min, v));
    row.set(clamped);
    value.textContent = `${clamped.toFixed(row.step < 0.01 ? 4 : row.step < 1 ? 3 : 2)} ${row.unit}`;
    if (source === "slider") numInput.value = String(clamped);
    else slider.value = String(clamped);
  };

  slider.addEventListener("input", () => update(parseFloat(slider.value), "slider"));
  numInput.addEventListener("change", () => update(parseFloat(numInput.value), "num"));

  value.textContent = `${row.get().toFixed(row.step < 0.01 ? 4 : row.step < 1 ? 3 : 2)} ${row.unit}`;

  wrap.appendChild(head);
  wrap.appendChild(slider);
  wrap.appendChild(numInput);
  container.appendChild(wrap);
}

export interface ControlsHandles {
  presetButtons: HTMLButtonElement[];
}

export function buildControls(
  engine: SimEngine,
  onChange: () => void,
): ControlsHandles {
  const paramContainer = $("params");
  const icContainer = $("ic");
  paramContainer.innerHTML = "";
  icContainer.innerHTML = "";

  const p = engine.params;
  const ic = engine.initialState;

  const paramRows: Row[] = [
    rowOf("m1", "Mass m₁", 0.01, 10, 0.01, "kg", () => p.m1, (v) => { p.m1 = v; engine.setParams({ ...p }); onChange(); }),
    rowOf("m2", "Mass m₂", 0.01, 10, 0.01, "kg", () => p.m2, (v) => { p.m2 = v; engine.setParams({ ...p }); onChange(); }),
    rowOf("L1", "Length L₁", 0.1, 2, 0.01, "m", () => p.L1, (v) => { p.L1 = v; engine.setParams({ ...p }); onChange(); }),
    rowOf("L2", "Length L₂", 0.1, 2, 0.01, "m", () => p.L2, (v) => { p.L2 = v; engine.setParams({ ...p }); onChange(); }),
    rowOf("g", "Gravity g", 0, 20, 0.01, "m/s²", () => p.g, (v) => { p.g = v; engine.setParams({ ...p }); onChange(); }),
    rowOf("b", "Damping b", 0, 2, 0.01, "/s", () => p.b, (v) => { p.b = v; engine.setParams({ ...p }); onChange(); }),
  ];

  const icRows: Row[] = [
    rowOf("t1", "Initial θ₁", -Math.PI, Math.PI, 0.001, "rad", () => ic.t1, (v) => { ic.t1 = v; engine.setInitialState({ ...ic }); onChange(); }),
    rowOf("t2", "Initial θ₂", -Math.PI, Math.PI, 0.001, "rad", () => ic.t2, (v) => { ic.t2 = v; engine.setInitialState({ ...ic }); onChange(); }),
    rowOf("w1", "Initial ω₁", -10, 10, 0.01, "rad/s", () => ic.w1, (v) => { ic.w1 = v; engine.setInitialState({ ...ic }); onChange(); }),
    rowOf("w2", "Initial ω₂", -10, 10, 0.01, "rad/s", () => ic.w2, (v) => { ic.w2 = v; engine.setInitialState({ ...ic }); onChange(); }),
  ];

  paramRows.forEach((r) => makeSlider(r, paramContainer));
  icRows.forEach((r) => makeSlider(r, icContainer));

  const speedSlider = $("speed") as HTMLInputElement;
  speedSlider.addEventListener("input", () => {
    engine.speed = parseFloat(speedSlider.value);
    onChange();
  });

  const trailLen = $("trailLen") as HTMLInputElement;
  trailLen.addEventListener("input", () => {
    const len = parseInt(trailLen.value, 10);
    engine.trail.resize(len);
    onChange();
  });

  const trailToggle = $("trailToggle") as HTMLInputElement;
  trailToggle.addEventListener("change", () => {
    engine.showTrail = trailToggle.checked;
    onChange();
  });

  const twinsToggle = $("twinsToggle") as HTMLInputElement;
  twinsToggle.addEventListener("change", () => {
    engine.setTwins(twinsToggle.checked);
    onChange();
  });

  const deltaInput = $("twinDelta") as HTMLInputElement;
  deltaInput.addEventListener("change", () => {
    const d = parseFloat(deltaInput.value);
    if (Number.isFinite(d) && d > 0) {
      engine.setTwins(engine.twins, d);
      onChange();
    }
  });

  const gButtons = document.querySelectorAll<HTMLButtonElement>("[data-g]");
  gButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      p.g = parseFloat(btn.dataset.g || "0");
      engine.setParams({ ...p });
      onChange();
    });
  });

  return { presetButtons: [] };
}

function rowOf(
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  unit: string,
  get: () => number,
  set: (v: number) => void,
): Row {
  return { key, label, min, max, step, unit, get, set };
}

export function syncControls(engine: SimEngine): void {
  void engine;
  // Light re-sync of displayed values after preset loads handled by rebuild.
}
