export const APP_HTML = `
<header class="topbar">
  <h1>Double Pendulum Simulator</h1>
  <div class="toolbar">
    <button id="playBtn" class="btn" aria-pressed="false">▶ Play</button>
    <button id="stepBtn" class="btn">Step</button>
    <button id="resetBtn" class="btn">Reset</button>
    <label class="speed-label">Speed
      <input id="speed" type="range" min="0.1" max="5" step="0.1" value="1" aria-label="Simulation speed" />
    </label>
    <button id="themeToggle" class="btn btn-ghost">Theme</button>
  </div>
  <div id="liveRegion" class="sr-only" aria-live="polite"></div>
</header>

<main class="layout">
  <aside class="rail rail-left">
    <section class="panel">
      <h2>Presets</h2>
      <div id="presets" class="presets"></div>
    </section>
    <section class="panel">
      <h2>Parameters</h2>
      <div id="params"></div>
      <div class="g-row">
        <button class="chip" data-g="9.81">Earth</button>
        <button class="chip" data-g="1.62">Moon</button>
        <button class="chip" data-g="24.79">Jupiter</button>
        <button class="chip" data-g="0">Zero-G</button>
      </div>
    </section>
    <section class="panel">
      <h2>Initial conditions</h2>
      <div id="ic"></div>
      <p class="hint">Tip: drag a bob while paused to set its angle.</p>
    </section>
    <section class="panel">
      <h2>View</h2>
      <label class="check">
        <input id="trailToggle" type="checkbox" checked /> Show trail
      </label>
      <label class="check">
        <input id="twinsToggle" type="checkbox" /> Identical twins
      </label>
      <label class="ctrl-head">Twin Δ (rad)
        <input id="twinDelta" type="number" min="0.00001" max="0.1" step="0.00001" value="0.0001" />
      </label>
      <label class="ctrl-head">Trail length
        <input id="trailLen" type="range" min="50" max="10000" step="50" value="5000" aria-label="Trail length" />
      </label>
    </section>
  </aside>

  <section class="center">
    <canvas id="scene" aria-label="Double pendulum simulation"></canvas>
    <div class="readout">
      <span><b>Time</b> <span id="timeVal">0.00 s</span></span>
      <span><b>KE</b> <span id="keVal">0</span></span>
      <span><b>PE</b> <span id="peVal">0</span></span>
      <span><b>E</b> <span id="totalVal">0</span></span>
      <span><b>Drift</b> <span id="driftVal">0 %</span></span>
      <span><b>Δθ₁</b> <span id="deltaVal">—</span></span>
    </div>
  </section>

  <aside class="rail rail-right">
    <nav class="tabs" role="tablist">
      <button class="tab active" data-tab="phase" role="tab">Phase</button>
      <button class="tab" data-tab="divergence" role="tab">Divergence</button>
      <button class="tab" data-tab="energy" role="tab">Energy</button>
      <button class="tab" data-tab="export" role="tab">Export</button>
    </nav>
    <div id="panel-phase" class="tab-panel">
      <div class="phase-modes">
        <button class="chip active" data-phase="2d-t1">θ₁–ω₁</button>
        <button class="chip" data-phase="2d-t2">θ₂–ω₂</button>
        <button class="chip" data-phase="poincare">Poincaré</button>
        <button class="chip" data-phase="3d">3D</button>
      </div>
      <canvas id="phase" aria-label="Phase space plot"></canvas>
    </div>
    <div id="panel-divergence" class="tab-panel hidden">
      <canvas id="divergence" aria-label="Divergence plot"></canvas>
      <p class="hint">Exponential growth of Δθ₁ reveals the system's positive Lyapunov exponent.</p>
    </div>
    <div id="panel-energy" class="tab-panel hidden">
      <canvas id="energy" aria-label="Total energy plot"></canvas>
      <p class="hint">With zero damping, total energy should stay nearly constant (drift &lt; 1% over 60 s).</p>
    </div>
    <div id="panel-export" class="tab-panel hidden">
      <button id="exportPng" class="btn">Export trail PNG</button>
      <button id="exportCsv" class="btn">Export series CSV</button>
      <button id="copyLink" class="btn">Copy share link</button>
    </div>
  </aside>
</main>
`;
