import { describe, it, expect } from "vitest";
import { decodeState, encodeState, fromPreset } from "./share.ts";
import { PRESETS } from "../sim/presets.ts";

describe("share encode/decode round-trip", () => {
  it("round-trips every preset exactly", () => {
    for (const preset of PRESETS) {
      const state = fromPreset(preset);
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.p).toEqual(state.p);
      expect(decoded!.s).toEqual(state.s);
      expect(decoded!.twins).toBe(state.twins);
      expect(decoded!.delta).toBeCloseTo(state.delta, 9);
      expect(decoded!.showTrail).toBe(state.showTrail);
      expect(decoded!.trailLen).toBe(state.trailLen);
      expect(decoded!.preset).toBe(preset.id);
    }
  });

  it("returns null on garbage input", () => {
    expect(decodeState("!!!not-base64!!!")).toBeNull();
  });

  it("encodes using URL-safe base64 (no +/ or padding)", () => {
    const state = fromPreset(PRESETS[0]);
    const encoded = encodeState(state);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
