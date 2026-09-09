# Double Pendulum Simulator — Specification

## 1. Overview

A client-side web application that simulates the motion of a planar double pendulum in real time, visualizes its chaotic trajectory, and lets users explore how initial conditions and physical parameters affect behavior.

The app runs entirely in the browser. No server, no account, no data persistence beyond optional URL-shareable state.

**Primary audience:** students, educators, physics enthusiasts.

**Platform:** modern evergreen browsers (Chrome, Firefox, Safari, Edge). Desktop-first, with a responsive layout that degrades gracefully on tablets. Phones are supported in a read-mostly mode.

---

## 2. Goals & Non-Goals

### Goals
- Accurately simulate the equations of motion of a planar double pendulum.
- Render the pendulum at a stable, configurable frame rate using a `<canvas>`.
- Let users change masses, lengths, initial angles, gravity, damping, and simulation speed.
- Make the system's sensitivity to initial conditions visible (trails, phase plots, divergence comparison).
- Be approachable: sensible defaults, inline tooltips, preset scenarios.

### Non-Goals
- 3D simulation or multi-link (n > 2) pendulums.
- Collision with obstacles or wall boundaries.
- Sound, audio cues, or haptics.
- Account system, cloud sync, or leaderboard.
- Mobile-first design (mobile is a tolerated, not optimized, target).

---

## 3. Physics Model

### 3.1 Coordinates
Two point masses (bobs) connected by massless rigid rods, moving in a vertical plane under gravity and optional linear damping.

- `θ₁`: angle of the first rod from the downward vertical (rad)
- `θ₂`: angle of the second rod from the first rod (rad)
- `ω₁ = θ̇₁`, `ω₂ = θ̇₂`: angular velocities (rad/s)
- `L₁, L₂`: rod lengths (m)
- `m₁, m₂`: bob masses (kg)
- `g`: gravitational acceleration (m/s²)
- `b`: damping coefficient applied to each angular velocity (1/s)

### 3.2 Equations of Motion (Lagrangian form)

The standard double-pendulum equations of motion, derived from the Lagrangian, are:

```
θ̈₁ = [ -g(2m₁+m₂)sinθ₁ − m₂ g sin(θ₁−2θ₂)
        − 2 sin(θ₁−θ₂) m₂ (ω₂²L₂ + ω₁²L₁ cos(θ₁−θ₂)) ]
      / [ L₁(2m₁+m₂ − m₂ cos(2θ₁−2θ₂)) ]

θ̈₂ = [ 2 sin(θ₁−θ₂) ( ω₁²L₁(m₁+m₂)
        + g(m₁+m₂)cosθ₁
        + ω₂²L₂ m₂ cos(θ₁−θ₂)) ]
      / [ L₂(2m₁+m₂ − m₂ cos(2θ₁−2θ₂)) ]

θ̈₁ -= b·ω₁   (damping, optional)
θ̈₂ -= b·ω₂   (damping, optional)
```

### 3.3 Integration
- Integrator: 4th-order Runge-Kutta (RK4).
- Fixed physics substep `dt_physics` (default `1/240 s`) decoupled from render frame rate, with accumulator pattern for stable stepping regardless of display refresh.
- State vector: `[θ₁, θ₂, ω₁, ω₂]`.
- Energy (kinetic + potential) computed each step for an optional energy-drift readout, used to warn the user when numerical drift becomes large.

### 3.4 Numerical Sanity
- Hard clamp on `|ω|` (default `100 rad/s`) to guard against blow-up; if exceeded, simulation pauses and surfaces a "diverged" indicator.
- Angle wrapping into `(-π, π]` for display only; integration uses raw accumulated angles to preserve continuity.

---

## 4. Functional Requirements

### F1. Simulation controls
- **Play / Pause** toggle (spacebar shortcut).
- **Step** button: advance exactly one `dt_physics` while paused.
- **Reset** button: restore current initial conditions.
- **Simulation speed** slider: 0.1× to 5×, applied as a multiplier to wall-clock stepping.

### F2. Parameter panel
All parameters update live; the simulation continues running unless paused.
- `m₁`, `m₂`: 0.01–10 kg
- `L₁`, `L₂`: 0.1–2 m
- `g`: 0–20 m/s² (preset buttons: Earth 9.81, Moon 1.62, Jupiter 24.79, Zero-G 0)
- Damping `b`: 0–2 /s
- Initial `θ₁`, `θ₂`: −π to π rad (also settable by dragging bobs when paused)
- Initial `ω₁`, `ω₂`: −10 to 10 rad/s

### F3. Initial-condition drag
When paused, the user can click-drag either bob in the main canvas to set initial angles. The rods pivot about the fixed anchor. Release sets the IC and the state holds until Play.

### F4. Presets
A row of preset scenarios, each a complete `(params, IC)` snapshot:
- "Classic chaos" — equal masses/lengths, slightly off-vertical.
- "Identical twins" — two pendulums with IC differing by 0.0001 rad, side by side (F8).
- "Heavy bob" — `m₂ ≫ m₁`.
- "Long second rod" — `L₂ ≫ L₁`.
- "Zero-G tumble" — `g = 0`, nonzero initial spin.
- "Damped settle" — high damping from a chaotic start.

### F5. Trails
- Toggle to draw the path of the second bob (and optionally the first).
- Trail length adjustable: 50 to 10,000 points, or "infinite".
- Trail fades by alpha with age; color encodes speed (HSL hue by `|ω₂|`).

### F6. Divergence / sensitivity (F8 "Identical twins")
- Runs two integrations in parallel from ICs differing by a user-set delta (default `1e-4 rad`).
- Plots `Δθ(t)` on log scale to show exponential divergence; reports the estimated Lyapunov-like growth rate.
- Overlay the two pendulums on the same canvas in distinct colors.

### F7. Phase-space plot
- Secondary canvas plotting `(θ₁, ω₁)` and `(θ₂, ω₂)` as 2D trajectories, or a Poincaré section at θ₁ crossing.
- Toggle between 2D projections and 3D-like projection (`θ₁, ω₁, θ₂`) using simple isometric projection.

### F8. Energy readout
- Live numeric display of KE, PE, total E, and drift (%) relative to initial total energy.
- Optional graph of total energy vs. time.

### F9. State snapshot & share
- "Copy link" button encodes the full current `(params, IC, view settings)` into URL query params (compressed via base64 of a compact JSON).
- Loading the app with such a link restores that exact state on startup.

### F10. Export
- Export the second-bob trail as PNG.
- Export the time series `(t, θ₁, θ₂, ω₁, ω₂)` as CSV (capped at in-memory buffer length; user warned if truncated).

---

## 5. Non-Functional Requirements

### N1. Performance
- 60 FPS rendering on a mid-range laptop with one pendulum and a 5,000-point trail.
- Physics cost budget: < 4 ms per render frame at default settings (RK4 @ 240 Hz substep ≈ 4 substeps/frame).
- F8 dual integration allowed to drop physics to 120 Hz substep to stay within budget; UI surfaces the trade-off.

### N2. Accuracy
- With damping `b = 0` and `dt_physics = 1/240`, total energy drift must stay below 1% over 60 s of simulated time for the "Classic chaos" preset (acceptance test in §9).

### N3. Accessibility
- All controls operable via keyboard; visible focus rings.
- Parameters show numeric value and unit; sliders also have a numeric input field.
- Color is never the sole indicator (trail speed also labeled in a legend; presets have text names).
- Respects `prefers-reduced-motion`: when set, animations still run (the point of the app) but decorative transitions are disabled and trails default to shorter length.
- Canvas content accompanied by a live text region announcing current angles every 1 s when focus is in the canvas.

### N4. Localization
- UI strings externalized; initial release ships English with a structure ready for additional locales (metric units only for v1).

### N5. Offline / installability
- Works fully offline after first load (static assets only).
- Valid manifest + service worker for "Add to home screen"; no background sync, no push.

### N6. Privacy
- No analytics, no third-party scripts, no cookies. Share links contain only simulation state.

---

## 6. UI / UX

### 6.1 Layout
Three-region layout on desktop:
1. **Left rail:** parameter panel + presets (collapsible).
2. **Center:** main canvas (the pendulum), with overlay toolbar (play/pause, step, reset, speed, trails toggle, drag hint).
3. **Right rail:** tabs for [Phase | Divergence | Energy | Export].

Tablet: right rail collapses to a bottom sheet. Phone: single column, main canvas first; panels behind a hamburger; phase/divergence plots hidden behind a "Plots" button due to size.

### 6.2 Main canvas conventions
- Origin (anchor) centered horizontally, placed ~20% from top.
- Auto-fit scale so the pendulum fits with margin at the most extreme config; a manual zoom is available.
- Pendulum drawn as: fixed anchor mark, two rods (lines), two bobs (circles sized proportional to √mass).
- Optional faint ground line and gravity-direction arrow (scales with `g`).

### 6.3 Visual design
- Dark theme by default with a light theme toggle; theme persists via `localStorage`.
- Limited palette: background, two accent rod/bob colors, trail gradient, and a neutral text color. Color-blind safe.

---

## 7. Architecture

### 7.1 Tech choices
- Vanilla TypeScript + a small bundler (Vite). No heavy framework required; a minimal component helper suffices for the panels.
- Rendering: Canvas 2D for the main scene and phase plots (simpler than WebGL for this polygon/line workload; revisit if perf target misses).
- State + history buffers held in plain typed objects; no state-management library.

### 7.2 Module structure
```
src/
  physics/
    equations.ts      # ODE RHS, energy, derivatives
    integrator.ts     # RK4 step, accumulator loop, divergence pair
    state.ts          # SimState type, defaults, clamp
  sim/
    engine.ts         # owns SimState, substep loop, RAF driver
    trail.ts          # ring buffer of bob positions
    presets.ts        # preset snapshots
  view/
    scene.ts          # main canvas renderer
    phase.ts          # phase / Poincaré renderer
    divergence.ts     # Δθ log plot renderer
    energy.ts         # energy graph renderer
  ui/
    controls.ts       # parameter panel, sliders, presets
    keyboard.ts       # shortcuts
    share.ts          # encode/decode URL state
    export.ts         # PNG + CSV
  app.ts              # wiring, layout, theme
```

### 7.3 Render loop
- Single `requestAnimationFrame` driver.
- Accumulator advances physics by `dt_physics * speedMultiplier` up to a max frame budget (default `1/30 s`) to avoid spiral-of-death after tab switches.
- Scene, trail, and active plot are redrawn each frame; inactive plot tabs skip rendering.

### 7.4 Data buffers
- Trail: ring buffer of `Float32` positions + per-point speed; length = user setting.
- Time series for CSV/export and energy graph: ring buffer of `Float64` rows, default 60 s at 60 Hz ≈ 3,600 rows.

---

## 8. Dependencies
- `vite` (dev/build).
- `typescript` (dev).
- No runtime dependencies. All math hand-written; no physics library.

---

## 9. Testing & Acceptance

### 9.1 Unit tests (Vitest)
- `equations.ts`: energy of a stationary hanging pendulum equals `-g(m₁(L₁) + m₂(L₁+L₂))`; free-fall special case (`g=0`, no damping) conserves linear momentum analog.
- `integrator.ts`: one RK4 step matches a hand-computed value on a known linear test; angle wrapping is display-only.
- `share.ts`: encode → decode round-trips every preset exactly.

### 9.2 Acceptance test (headless)
- Load "Classic chaos" preset, run 60 s simulated time with `b=0`, assert total-energy drift < 1%.
- Load "Identical twins", run 30 s, assert `Δθ` grew monotonically (monotonic on a smoothed envelope) and estimate Lyapunov rate > 0.

### 9.3 Visual smoke
- Puppeteer screenshot of main canvas for each preset, diffed against a committed baseline with a tolerance threshold.

### 9.4 Manual checklist
- Keyboard-only operation across all controls.
- Drag-to-set-IC produces the expected angles.
- Copy-link restores state on a fresh tab.
- Reduced-motion preference disables decorative transitions.

---

## 10. Risks & Mitigations
- **Energy drift at long runs:** RK4 @ 240 Hz is the baseline mitigation; if drift exceeds the 1% gate, expose a substep selector and default higher.
- **Performance with long trails:** cap trail length, use typed arrays, skip per-point allocations.
- **Diverged simulation blow-up:** hard clamp + auto-pause + visible indicator, not silent.
- **URL length on share:** if encoded state exceeds ~1500 chars, switch to a hash-fragment store and warn.

---

## 11. Milestones
1. **M1 — Physics core:** equations, RK4, headless energy-conservation test passes. No UI.
2. **M2 — Main scene + controls:** single pendulum rendering, parameter panel, play/pause/reset, trails. Acceptance: user can drive the sim and see chaos.
3. **M3 — Plots & presets:** phase, divergence, energy graphs; all presets wired.
4. **M4 — Polish:** share links, export, keyboard a11y, themes, reduced-motion, offline/install.
5. **M5 — Acceptance gate:** all §9 tests green; perf budget met on reference laptop.
