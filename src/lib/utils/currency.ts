/**
 * Formats a numeric value into Gambian Dalasi currency string (GMD X,XXX.XX).
 * Handles null, undefined, strings, and large numbers gracefully.
 */
export function formatGMD(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "GMD 0.00";
  }
  const numericAmount = Number(amount);
  
  // Format to two decimal places with thousands separators
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
  
  return `GMD ${formatted}`;
}
