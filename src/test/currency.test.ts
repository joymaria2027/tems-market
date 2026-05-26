import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { formatGMD } from "../lib/utils/currency";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCurrency } from "../hooks/useCurrency";

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

describe("useCurrency hook", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully fetch rates from Frankfurter API and format prices", async () => {
    const mockFrankfurterRates = [
      { date: "2026-05-26", base: "GMD", quote: "USD", rate: 0.01388 },
      { date: "2026-05-26", base: "GMD", quote: "EUR", rate: 0.01192 },
      { date: "2026-05-26", base: "GMD", quote: "GBP", rate: 0.0103 },
      { date: "2026-05-26", base: "GMD", quote: "XOF", rate: 7.8171 },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("api.frankfurter.dev")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFrankfurterRates),
        });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    }) as any;

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rates.USD).toBe(0.01388);
    expect(result.current.rates.EUR).toBe(0.01192);
    expect(result.current.rates.GBP).toBe(0.0103);
    expect(result.current.rates.XOF).toBe(7.8171);

    // Test formatting when GMD is selected
    expect(result.current.formatPrice(100)).toBe("GMD 100.00");

    // Test formatting when USD is selected
    act(() => {
      result.current.setCurrency("USD");
    });
    
    expect(result.current.currency).toBe("USD");
    expect(result.current.formatPrice(100)).toBe("$1.39");
  });

  it("should fall back to ExchangeRate-API when Frankfurter API fails", async () => {
    const mockExchangeRates = {
      rates: {
        GMD: 1,
        USD: 0.015,
        EUR: 0.014,
        GBP: 0.012,
        XOF: 8.0,
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("api.frankfurter.dev")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
      }
      if (url.includes("open.exchangerate-api.com")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExchangeRates),
        });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    }) as any;

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rates.USD).toBe(0.015);
    expect(result.current.rates.EUR).toBe(0.014);
    expect(result.current.rates.GBP).toBe(0.012);
    expect(result.current.rates.XOF).toBe(8.0);
  });
});
