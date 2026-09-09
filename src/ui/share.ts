import { DEFAULT_PARAMS, DEFAULT_STATE, SimParams, SimState } from "../physics/state.ts";
import { Preset } from "../sim/presets.ts";

export interface ShareableState {
  p: SimParams;
  s: SimState;
  twins: boolean;
  delta: number;
  showTrail: boolean;
  trailLen: number;
  preset?: string;
}

export function encodeState(state: ShareableState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(encoded: string): ShareableState | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json);
    return normalize(obj);
  } catch {
    return null;
  }
}

function normalize(obj: any): ShareableState {
  return {
    p: { ...DEFAULT_PARAMS, ...(obj.p ?? {}) },
    s: { ...DEFAULT_STATE, ...(obj.s ?? {}) },
    twins: Boolean(obj.twins),
    delta: typeof obj.delta === "number" ? obj.delta : 1e-4,
    showTrail: obj.showTrail !== false,
    trailLen: typeof obj.trailLen === "number" ? obj.trailLen : 5000,
    preset: typeof obj.preset === "string" ? obj.preset : undefined,
  };
}

export function buildShareURL(state: ShareableState): string {
  const encoded = encodeState(state);
  const url = new URL(location.href);
  url.search = "";
  url.hash = `s=${encoded}`;
  return url.toString();
}

export function readShareURL(): ShareableState | null {
  const hash = location.hash;
  const match = hash.match(/s=([^&]+)/);
  if (match) return decodeState(match[1]);
  const params = new URLSearchParams(location.search);
  const s = params.get("s");
  if (s) return decodeState(s);
  return null;
}

export function fromPreset(p: Preset, opts: Partial<ShareableState> = {}): ShareableState {
  return {
    p: p.params,
    s: p.state,
    twins: Boolean(p.twins),
    delta: p.twins?.delta ?? 1e-4,
    showTrail: true,
    trailLen: 5000,
    preset: p.id,
    ...opts,
  };
}
