import { computeScale, scaleTokens } from "./scale";

describe("computeScale", () => {
  test("is 1 on the 390pt baseline phone", () => {
    expect(computeScale(390, 844)).toBe(1);
  });

  test("uses the shorter side, so rotation does not change it", () => {
    expect(computeScale(844, 390)).toBe(computeScale(390, 844));
  });

  test("clamps small phones to 0.85 and tablets to 1.25", () => {
    expect(computeScale(320, 568)).toBe(0.85);
    expect(computeScale(1024, 1366)).toBe(1.25);
  });
});

describe("scaleTokens", () => {
  test("scales spacing, radius, heights and text but not the full radius", () => {
    const t = scaleTokens(1.2, { radiusBase: 10 });
    expect(t.spacing[4]).toBeCloseTo(19.2, 0);
    expect(t.radius.lg).toBeCloseTo(12, 0);
    expect(t.radius.full).toBe(9999);
    expect(t.controlHeight.md).toBeCloseTo(52.8, 0);
    expect(t.type.body.fontSize).toBeCloseTo(19.2, 0);
    expect(t.type.body.fontFamily).toBe("Inter-Regular");
  });

  test("picks the font face by weight, never fontWeight", () => {
    const t = scaleTokens(1, { radiusBase: 10 });
    expect(t.type.h2.fontFamily).toBe("Inter-SemiBold");
    expect(t.type.h2).not.toHaveProperty("fontWeight");
  });
});
