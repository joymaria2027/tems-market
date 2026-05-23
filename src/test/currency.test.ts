import { describe, expect, it } from "vitest";
import { formatGMD } from "../lib/utils/currency";

describe("formatGMD", () => {
  it("should format valid numbers correctly", () => {
    expect(formatGMD(0)).toBe("GMD 0.00");
    expect(formatGMD(100)).toBe("GMD 100.00");
    expect(formatGMD(1250.5)).toBe("GMD 1,250.50");
    expect(formatGMD(999999.99)).toBe("GMD 999,999.99");
  });

  it("should format numeric strings correctly", () => {
    expect(formatGMD("100")).toBe("GMD 100.00");
    expect(formatGMD("1250.5")).toBe("GMD 1,250.50");
    expect(formatGMD(" 1500 ")).toBe("GMD 1,500.00");
  });

  it("should handle null and undefined gracefully", () => {
    expect(formatGMD(null)).toBe("GMD 0.00");
    expect(formatGMD(undefined)).toBe("GMD 0.00");
  });

  it("should handle invalid strings and NaNs gracefully", () => {
    expect(formatGMD("not-a-number")).toBe("GMD 0.00");
    expect(formatGMD(NaN)).toBe("GMD 0.00");
  });

  it("should handle negative values correctly", () => {
    expect(formatGMD(-100.5)).toBe("GMD -100.50");
  });
});
