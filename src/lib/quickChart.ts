/**
 * QuickChart.io — free chart image generation via URL.
 * No API key needed. Renders Chart.js config as PNG/WebP/SVG.
 * Docs: https://quickchart.io/documentation/
 */

const QUICKCHART_BASE = "https://quickchart.io/chart";

export interface QuickChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  type?: string;
}

export interface QuickChartConfig {
  type: "bar" | "line" | "doughnut" | "pie" | "polarArea" | "radar";
  data: {
    labels: string[];
    datasets: QuickChartDataset[];
  };
  options?: Record<string, unknown>;
}

/**
 * Build a QuickChart image URL from a Chart.js config object.
 * @param config - Chart.js chart configuration
 * @param width - Image width in pixels (default 600)
 * @param height - Image height in pixels (default 300)
 * @param bgColor - Background color (default "transparent")
 * @param format - Output format (default "png")
 * @param version - Chart.js version (default 4)
 */
export function quickChartUrl(
  config: QuickChartConfig,
  width = 600,
  height = 300,
  bgColor = "transparent",
  format: "png" | "webp" | "svg" = "png",
  version = 4,
): string {
  const params = new URLSearchParams({
    c: JSON.stringify(config),
    width: String(width),
    height: String(height),
    backgroundColor: bgColor,
    format,
    version: String(version),
    devicePixelRatio: "2",
  });

  return `${QUICKCHART_BASE}?${params.toString()}`;
}

/**
 * Pre-built revenue bar chart for the admin dashboard.
 * Shows monthly revenue in GMD with a clean style.
 */
export function revenueChartUrl(
  months: string[],
  revenues: number[],
): string {
  const config: QuickChartConfig = {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Revenue (GMD)",
          data: revenues,
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "#3b82f6",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: number }) =>
              `GMD ${(ctx.raw as number).toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v: number) => `D${(v / 1000).toFixed(0)}k`,
          },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  };

  return quickChartUrl(config, 700, 300);
}

/**
 * Pre-built line chart for revenue trends with a gradient fill.
 */
export function revenueTrendChartUrl(
  months: string[],
  revenues: number[],
): string {
  const config: QuickChartConfig = {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Trend",
          data: revenues,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          borderColor: "#3b82f6",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: number }) =>
              `GMD ${(ctx.raw as number).toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v: number) => `D${(v / 1000).toFixed(0)}k`,
          },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  };

  return quickChartUrl(config, 700, 300);
}

/**
 * Tiny sparkline chart for use in stat cards or tables.
 */
export function sparklineUrl(data: number[], color = "#3b82f6"): string {
  const config: QuickChartConfig = {
    type: "line",
    data: {
      labels: data.map(() => ""),
      datasets: [
        {
          label: "",
          data,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderColor: color,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  };

  return quickChartUrl(config, 120, 40, "transparent", "png", 4);
}
