import { SimParams, SimState } from "../physics/state.ts";

export interface Preset {
  id: string;
  name: string;
  description: string;
  params: SimParams;
  state: SimState;
  twins?: { delta: number };
}

export const PRESETS: Preset[] = [
  {
    id: "classic-chaos",
    name: "Classic chaos",
    description: "Equal masses and lengths, released slightly off vertical.",
    params: { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81, b: 0 },
    state: { t1: Math.PI / 2, t2: Math.PI / 2, w1: 0, w2: 0 },
  },
  {
    id: "identical-twins",
    name: "Identical twins",
    description: "Two pendulums with ICs differing by 0.0001 rad, side by side.",
    params: { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81, b: 0 },
    state: { t1: Math.PI / 2, t2: Math.PI / 2, w1: 0, w2: 0 },
    twins: { delta: 1e-4 },
  },
  {
    id: "heavy-bob",
    name: "Heavy bob",
    description: "The second bob is far heavier than the first.",
    params: { m1: 0.2, m2: 5, L1: 1, L2: 1, g: 9.81, b: 0 },
    state: { t1: Math.PI / 2, t2: Math.PI / 2, w1: 0, w2: 0 },
  },
  {
    id: "long-second-rod",
    name: "Long second rod",
    description: "The second rod is much longer than the first.",
    params: { m1: 1, m2: 1, L1: 0.4, L2: 1.6, g: 9.81, b: 0 },
    state: { t1: Math.PI / 2, t2: Math.PI / 2, w1: 0, w2: 0 },
  },
  {
    id: "zero-g-tumble",
    name: "Zero-G tumble",
    description: "No gravity, free spin from a nonzero angular velocity.",
    params: { m1: 1, m2: 1, L1: 1, L2: 1, g: 0, b: 0 },
    state: { t1: 0.3, t2: -0.3, w1: 2, w2: -3 },
  },
  {
    id: "damped-settle",
    name: "Damped settle",
    description: "Strong damping from a chaotic start; the system comes to rest.",
    params: { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81, b: 0.6 },
    state: { t1: (2 * Math.PI) / 3, t2: Math.PI / 2, w1: 0, w2: 0 },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
