import { describe, it, expect } from "vitest";
import {
  normalizeColumnColor,
  normalizeTabGroup,
  isAllowedRefreshInterval,
  TAB_GROUP_MAX,
  REFRESH_INTERVAL_OPTIONS,
} from "@/lib/deck-rules";

// These normalizers are the server-authoritative gate for every persisted
// color / tab-group / refresh value, and the client store mirrors them for
// optimistic writes. If the two ever drift, an optimistic value diverges from
// what the DB stores. Pinning the exact behaviour here keeps them honest.

describe("normalizeColumnColor", () => {
  it("lowercases a valid 6-hex color", () => {
    expect(normalizeColumnColor("#F97316")).toBe("#f97316");
  });
  it("passes an already-lowercase color through unchanged", () => {
    expect(normalizeColumnColor("#3b82f6")).toBe("#3b82f6");
  });
  it("trims surrounding whitespace before validating", () => {
    expect(normalizeColumnColor("  #22c55e  ")).toBe("#22c55e");
  });
  it("drops 3-hex shorthand (canonical form is 6-hex only)", () => {
    expect(normalizeColumnColor("#fff")).toBeNull();
  });
  it("drops named CSS colors", () => {
    expect(normalizeColumnColor("blue")).toBeNull();
  });
  it("drops non-color garbage", () => {
    expect(normalizeColumnColor("not-a-color")).toBeNull();
  });
  it("maps empty / null / undefined to null", () => {
    expect(normalizeColumnColor("")).toBeNull();
    expect(normalizeColumnColor("   ")).toBeNull();
    expect(normalizeColumnColor(null)).toBeNull();
    expect(normalizeColumnColor(undefined)).toBeNull();
  });
});

describe("normalizeTabGroup", () => {
  it("collapses internal whitespace and trims so variants bucket together", () => {
    expect(normalizeTabGroup("AI")).toBe("AI");
    expect(normalizeTabGroup("  AI  ")).toBe("AI");
    expect(normalizeTabGroup("Machine   Learning")).toBe("Machine Learning");
  });
  it("caps to TAB_GROUP_MAX characters", () => {
    const out = normalizeTabGroup("x".repeat(TAB_GROUP_MAX + 20));
    expect(out.length).toBe(TAB_GROUP_MAX);
  });
  it("returns empty string for whitespace-only input", () => {
    expect(normalizeTabGroup("    ")).toBe("");
  });
});

describe("isAllowedRefreshInterval", () => {
  it("accepts every allowlisted cadence", () => {
    for (const v of REFRESH_INTERVAL_OPTIONS) {
      expect(isAllowedRefreshInterval(v)).toBe(true);
    }
  });
  it("rejects sub-minute and non-allowlisted numbers", () => {
    for (const v of [0, 1, 30, 45, 120, 600, 7200]) {
      expect(isAllowedRefreshInterval(v)).toBe(false);
    }
  });
  it("rejects non-number types", () => {
    expect(isAllowedRefreshInterval("60")).toBe(false);
    expect(isAllowedRefreshInterval(null)).toBe(false);
    expect(isAllowedRefreshInterval(undefined)).toBe(false);
    expect(isAllowedRefreshInterval(NaN)).toBe(false);
  });
});
