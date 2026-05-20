import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration } from "chart.js";
import type { PortfolioHoldingPerformance } from "../types.js";

const PERFORMANCE_CHART_WIDTH = 900;
const PERFORMANCE_CHART_HEIGHT = 500;
const DIVERSIFICATION_CHART_WIDTH = 560;
const DIVERSIFICATION_CHART_HEIGHT = 520;
const DIVERSIFICATION_VISIBLE_SLICES = 8;
const DIVERSIFICATION_COLORS = [
  "#22c55e",
  "#60a5fa",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
  "#14b8a6",
  "#f472b6",
  "#facc15",
  "#94a3b8",
];

function formatCompactCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function createRenderer(width: number, height: number): ChartJSNodeCanvas {
  return new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "#1a1a1a",
  });
}

function buildDiversificationDataset(
  holdings: PortfolioHoldingPerformance[],
  reportCurrency: string
): {
  labels: string[];
  values: number[];
  colors: string[];
} {
  const positiveHoldings = holdings
    .filter((holding) => holding.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue);

  const visibleHoldings = positiveHoldings.slice(0, DIVERSIFICATION_VISIBLE_SLICES);
  const otherValue = positiveHoldings
    .slice(DIVERSIFICATION_VISIBLE_SLICES)
    .reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalValue = positiveHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);

  const segments = visibleHoldings.map((holding) => ({
    label: holding.ticker,
    value: holding.currentValue,
  }));

  if (otherValue > 0) {
    segments.push({ label: "Other", value: otherValue });
  }

  return {
    labels: segments.map((segment) => {
      const weightPct = totalValue > 0 ? (segment.value / totalValue) * 100 : 0;
      return `${segment.label} ${weightPct.toFixed(1)}% (${formatCompactCurrency(segment.value, reportCurrency)})`;
    }),
    values: segments.map((segment) => segment.value),
    colors: segments.map((_, index) => DIVERSIFICATION_COLORS[index % DIVERSIFICATION_COLORS.length]),
  };
}

async function renderPerformanceChart(
  holdings: PortfolioHoldingPerformance[],
  reportCurrency: string
): Promise<{ buffer: Buffer; base64: string }> {
  const renderer = createRenderer(PERFORMANCE_CHART_WIDTH, PERFORMANCE_CHART_HEIGHT);

  const sortedHoldings = [...holdings].sort((a, b) => a.absoluteChange - b.absoluteChange);
  const labels = sortedHoldings.map((holding) => `${holding.ticker} (${holding.stockName})`);
  const values = sortedHoldings.map((holding) => holding.absoluteChange);
  const barColors = sortedHoldings.map((holding) =>
    holding.absoluteChange >= 0 ? "rgba(46, 204, 113, 0.85)" : "rgba(231, 76, 60, 0.85)"
  );

  const config: ChartConfiguration<"bar", number[], string> = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Weekly P/L",
          data: values,
          backgroundColor: barColors,
          borderColor: barColors,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      indexAxis: "y",
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Weekly contribution by holding",
          color: "#4ade80",
          font: { size: 16, weight: "bold" },
          padding: { bottom: 12 },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: `Contribution (${reportCurrency})`,
            color: "#cccccc",
          },
          ticks: {
            color: "#cccccc",
            callback: (value) => formatCompactCurrency(Number(value), reportCurrency),
          },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
        y: {
          title: {
            display: false,
          },
          ticks: { color: "#cccccc", font: { size: 11 } },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
      },
    },
  };

  const buffer = await renderer.renderToBuffer(config);
  return { buffer, base64: buffer.toString("base64") };
}

async function renderDiversificationChart(
  holdings: PortfolioHoldingPerformance[],
  reportCurrency: string
): Promise<{ buffer: Buffer; base64: string }> {
  const renderer = createRenderer(DIVERSIFICATION_CHART_WIDTH, DIVERSIFICATION_CHART_HEIGHT);
  const { labels, values, colors } = buildDiversificationDataset(holdings, reportCurrency);

  const config: ChartConfiguration<"doughnut", number[], string> = {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Portfolio diversification",
          data: values,
          backgroundColor: colors,
          borderColor: "#1a1a1a",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      cutout: "52%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            boxWidth: 12,
            boxHeight: 12,
            padding: 12,
            font: { size: 10 },
          },
        },
        title: {
          display: true,
          text: "Portfolio diversification by ending value",
          color: "#4ade80",
          font: { size: 16, weight: "bold" },
          padding: { bottom: 18 },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw ?? 0);
              return `${context.label}: ${formatCompactCurrency(value, reportCurrency)}`;
            },
          },
        },
      },
    },
  };

  const buffer = await renderer.renderToBuffer(config);
  return { buffer, base64: buffer.toString("base64") };
}

export async function generatePortfolioCharts(
  holdings: PortfolioHoldingPerformance[],
  reportCurrency: string
): Promise<{
  performance: { buffer: Buffer; base64: string };
  diversification: { buffer: Buffer; base64: string };
}> {
  const [performance, diversification] = await Promise.all([
    renderPerformanceChart(holdings, reportCurrency),
    renderDiversificationChart(holdings, reportCurrency),
  ]);

  return { performance, diversification };
}
