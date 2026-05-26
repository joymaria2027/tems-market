import { useState, useEffect, useCallback } from "react";
import { formatGMD } from "@/lib/utils/currency";

const CURRENCIES = ["GMD", "USD", "GBP", "EUR", "XOF"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<Currency, string> = {
  GMD: "GMD",
  USD: "$",
  GBP: "£",
  EUR: "€",
  XOF: "CFA",
};

const CACHE_KEY = "temsmarket_exchange_rates";
const PREF_KEY = "temsmarket_currency";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CachedRates {
  rates: Record<string, number>;
  ts: number;
}

interface FrankfurterRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export const useCurrency = () => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem(PREF_KEY);
    return (saved && CURRENCIES.includes(saved as Currency) ? saved : "GMD") as Currency;
  });

  const [rates, setRates] = useState<Record<string, number>>({ GMD: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedRates = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setRates(parsed.rates);
          return;
        }
      } catch { /* ignore */ }
    }

    setLoading(true);
    
    // Fetch from Frankfurter API (v2) with fallback to ExchangeRate-API
    fetch("https://api.frankfurter.dev/v2/rates?base=GMD")
      .then((r) => {
        if (!r.ok) throw new Error("Frankfurter API returned non-OK status");
        return r.json();
      })
      .then((data: FrankfurterRate[]) => {
        if (Array.isArray(data)) {
          const mappedRates: Record<string, number> = { GMD: 1 };
          data.forEach((item) => {
            mappedRates[item.quote] = item.rate;
          });
          setRates(mappedRates);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: mappedRates, ts: Date.now() }));
          setLoading(false);
        } else {
          throw new Error("Frankfurter API did not return an array of rates");
        }
      })
      .catch((err) => {
        console.warn("Frankfurter API failed, attempting fallback to ExchangeRate-API:", err);
        fetch("https://open.exchangerate-api.com/v6/latest/GMD")
          .then((r) => r.json())
          .then((data) => {
            if (data?.rates) {
              setRates(data.rates);
              localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: data.rates, ts: Date.now() }));
            }
          })
          .catch((fallbackErr) => {
            console.error("All exchange rate API calls failed:", fallbackErr);
          })
          .finally(() => setLoading(false));
      });
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(PREF_KEY, c);
  }, []);

  const formatPrice = useCallback(
    (amountInGMD: number) => {
      const rate = rates[currency] || 1;
      const converted = amountInGMD * rate;
      if (currency === "GMD") {
        return formatGMD(converted);
      }
      const symbol = SYMBOLS[currency];
      return `${symbol}${converted.toFixed(2)}`;
    },
    [currency, rates]
  );

  return { currency, setCurrency, currencies: CURRENCIES, symbols: SYMBOLS, rates, formatPrice, loading };
};

