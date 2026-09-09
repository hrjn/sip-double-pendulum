# Double Pendulum Simulator

A client-side web app that simulates the chaotic motion of a planar double pendulum in real time. See `SPEC.md` for the full specification.

## Features

- Real-time RK4 integration (240 Hz physics substep, decoupled from render rate)
- Adjustable masses, lengths, gravity, damping, initial angles and angular velocities
- Color-by-speed trails of the second bob
- "Identical twins" mode showing exponential divergence (Lyapunov-style estimate)
- Phase-space, Poincaré, divergence, and energy plots
- Six preset scenarios
- Drag-to-set initial conditions while paused
- Shareable URL state (base64-encoded) and PNG/CSV export
- Dark/light theme, keyboard shortcuts, reduced-motion support
- No runtime dependencies; works offline after first load

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
npm test         # run unit tests
```

## Keyboard shortcuts

- `Space` — play/pause
- `S` — single step (while paused)
- `R` — reset to initial conditions

## Architecture

```
src/
  physics/   equations, integrator (RK4), state types
  sim/       engine, trail ring buffer, presets
  view/      canvas renderers (scene, phase, divergence, energy), theme
  ui/        controls, drag, keyboard, share, export
  app.ts     wiring, layout, theme, render loop
  main.ts    entry point
```

The physics uses the standard Lagrangian equations of motion for a planar double
pendulum, integrated with 4th-order Runge-Kutta. Total energy drift over 60 s of
the "Classic chaos" preset stays well under 1% (see `src/physics/equations.test.ts`).
