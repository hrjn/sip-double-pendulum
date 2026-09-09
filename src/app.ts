import { buildControls } from "./ui/controls.ts";
import { DragController } from "./ui/drag.ts";
import { wireExport } from "./ui/export.ts";
import { wireKeyboard, wireToolbar } from "./ui/keyboard.ts";
import { fromPreset, readShareURL, ShareableState } from "./ui/share.ts";
import { DEFAULT_PARAMS, DEFAULT_STATE } from "./physics/state.ts";
import { PRESETS } from "./sim/presets.ts";
import { SimEngine } from "./sim/engine.ts";
import { DivergenceView } from "./view/divergence.ts";
import { EnergyView } from "./view/energy.ts";
import { PhaseView, PhaseMode } from "./view/phase.ts";
import { SceneView } from "./view/scene.ts";
import { DARK, LIGHT, Theme } from "./view/theme.ts";

const THEME_KEY = "dp-theme";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function canvas(id: string): HTMLCanvasElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLCanvasElement)) throw new Error(`missing canvas #${id}`);
  return el;
}

export class App {
  private engine: SimEngine;
  private scene: SceneView;
  private phase: PhaseView;
  private divergence: DivergenceView;
  private energy: EnergyView;
  private theme: Theme;
  private reducedMotion = false;
  private lastFrame = 0;
  private liveAnnounceLast = 0;

  constructor() {
    this.theme = this.loadTheme();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const shared = readShareURL();
    const initial: ShareableState =
      shared ??
      fromPreset(PRESETS[0], {
        trailLen: this.reducedMotion ? 1000 : 5000,
      });

    this.engine = new SimEngine(
      { ...DEFAULT_PARAMS, ...initial.p },
      { ...DEFAULT_STATE, ...initial.s },
      initial.trailLen,
    );
    this.engine.showTrail = initial.showTrail;
    this.engine.setTwins(initial.twins, initial.delta);
    if (this.reducedMotion) this.engine.trail.resize(1000);

    this.scene = new SceneView(canvas("scene"), this.theme);
    this.phase = new PhaseView(canvas("phase"), this.theme);
    this.phase.setMode(this.reducedMotion ? "2d-t1" : "2d-t1");
    this.divergence = new DivergenceView(canvas("divergence"), this.theme);
    this.energy = new EnergyView(canvas("energy"), this.theme);

    this.renderPresets();
    this.syncPresetActive(initial.preset);
  }

  start(): void {
    this.resize();
    window.addEventListener("resize", () => this.resize());
    document.getElementById("themeToggle")?.addEventListener("click", () => this.toggleTheme());

    buildControls(this.engine, () => this.onControlChange());
    new DragController(canvas("scene"), this.engine, this.scene, () => this.onControlChange());
    wireToolbar(this.engine, () => this.updatePlayLabel());
    wireKeyboard(this.engine, () => this.updatePlayLabel());
    wireExport(this.engine);

    this.wireTabs();
    this.wirePhaseModes();

    this.applyThemeToDom();
    this.updatePlayLabel();
    this.loop(0);
  }

  private resize(): void {
    this.scene.resize();
    this.phase.resize();
    this.divergence.resize();
    this.energy.resize();
    const snap = this.engine.snapshot();
    this.scene.render(this.engine, snap);
    this.renderActivePlot();
  }

  private onControlChange(): void {
    const snap = this.engine.snapshot();
    this.scene.render(this.engine, snap);
  }

  private activeTab: "phase" | "divergence" | "energy" | "export" = "phase";

  private wireTabs(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.activeTab = (tab.dataset.tab as typeof this.activeTab) ?? "phase";
        document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
        document.querySelectorAll(".tab-panel").forEach((p) => {
          p.classList.toggle("hidden", p.id !== `panel-${this.activeTab}`);
        });
        this.renderActivePlot();
      });
    });
  }

  private wirePhaseModes(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-phase]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.phase as PhaseMode;
        this.phase.setMode(mode);
        document.querySelectorAll("[data-phase]").forEach((b) => b.classList.toggle("active", b === btn));
        this.renderActivePlot();
      });
    });
  }

  private renderActivePlot(): void {
    if (this.activeTab === "phase") this.phase.render();
    else if (this.activeTab === "divergence") this.divergence.render();
    else if (this.activeTab === "energy") this.energy.render();
  }

  private renderPresets(): void {
    const container = $("presets");
    container.innerHTML = "";
    PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = preset.name;
      btn.title = preset.description;
      btn.dataset.preset = preset.id;
      btn.addEventListener("click", () => {
        const shared = fromPreset(preset, {
          trailLen: this.reducedMotion ? 1000 : this.engine.trail.capacity,
        });
        this.engine.setParams({ ...DEFAULT_PARAMS, ...shared.p });
        this.engine.setInitialState({ ...DEFAULT_STATE, ...shared.s });
        this.engine.setTwins(shared.twins, shared.delta);
        this.engine.showTrail = shared.showTrail;
        this.engine.reset();
        this.phase.clear();
        this.divergence.clear();
        this.energy.clear();
        this.syncPresetActive(preset.id);
        this.rebuildControls();
        this.updatePlayLabel();
        const snap = this.engine.snapshot();
        this.scene.render(this.engine, snap);
      });
      container.appendChild(btn);
    });
  }

  private syncPresetActive(id?: string): void {
    document.querySelectorAll<HTMLButtonElement>(".preset-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.preset === id);
    });
  }

  private rebuildControls(): void {
    buildControls(this.engine, () => this.onControlChange());
  }

  private updatePlayLabel(): void {
    const btn = $("playBtn") as HTMLButtonElement;
    btn.textContent = this.engine.playing ? "⏸ Pause" : "▶ Play";
    btn.setAttribute("aria-pressed", String(this.engine.playing));
  }

  private loop = (now: number): void => {
    const dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 0;
    this.lastFrame = now;

    if (this.engine.playing) this.engine.advance(dt);
    this.phase.push(this.engine.state);

    const snap = this.engine.snapshot();
    if (this.engine.twins && snap.twinState) {
      this.divergence.push(snap.time, snap.thetaDelta);
    }
    this.energy.push(snap.time, snap.total);

    this.scene.render(this.engine, snap);
    this.renderActivePlot();
    this.updateReadouts(snap);

    if (now - this.liveAnnounceLast > 1000) {
      this.liveAnnounceLast = now;
      this.announce(snap);
    }

    requestAnimationFrame(this.loop);
  };

  private updateReadouts(snap: ReturnType<SimEngine["snapshot"]>): void {
    $("timeVal").textContent = snap.time.toFixed(2) + " s";
    $("keVal").textContent = snap.ke.toFixed(3);
    $("peVal").textContent = snap.pe.toFixed(3);
    $("totalVal").textContent = snap.total.toFixed(3);
    $("driftVal").textContent = snap.drift.toFixed(3) + " %";
    if (snap.twins) {
      $("deltaVal").textContent = snap.thetaDelta.toExponential(2);
    } else {
      $("deltaVal").textContent = "—";
    }
  }

  private announce(snap: ReturnType<SimEngine["snapshot"]>): void {
    const live = $("liveRegion");
    if (!live) return;
    const t1 = (snap.state.t1 * (180 / Math.PI)).toFixed(0);
    const t2 = (snap.state.t2 * (180 / Math.PI)).toFixed(0);
    live.textContent = `θ₁ ${t1} degrees, θ₂ ${t2} degrees`;
  }

  private loadTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light") return LIGHT;
    return DARK;
  }

  private applyThemeToDom(): void {
    document.documentElement.dataset.theme = this.theme === LIGHT ? "light" : "dark";
  }

  private toggleTheme(): void {
    this.theme = this.theme === DARK ? LIGHT : DARK;
    localStorage.setItem(THEME_KEY, this.theme === LIGHT ? "light" : "dark");
    this.scene.setTheme(this.theme);
    this.phase.setTheme(this.theme);
    this.divergence.setTheme(this.theme);
    this.energy.setTheme(this.theme);
    this.applyThemeToDom();
  }
}
