import { Agent, run, webSearchTool } from "@openai/agents";
import type {
  PortfolioDataIssue,
  PortfolioHoldingPerformance,
  PortfolioWeekData,
} from "../types.js";
import { htmlReportTemplate } from "./report-template.js";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrency(value: number, currency: string): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(value), currency)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${(Math.abs(value) * 100).toFixed(2)}%`;
}

function formatShares(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildHoldingsRows(report: PortfolioWeekData): string {
  return [...report.holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((holding, index) => {
      const bg = index % 2 === 0 ? "#1f2937" : "#111827";
      const tdStyle = `style="padding:10px 12px;border-bottom:1px solid #233041;color:#ffffff;background-color:${bg};"`;

      return (
        "<tr>" +
        `<td ${tdStyle}><strong>${esc(holding.ticker)}</strong><br /><span style="color:#9ca3af;font-size:12px;">${esc(holding.stockName)}</span></td>` +
        `<td ${tdStyle} align="right">${formatShares(holding.shares)}</td>` +
        `<td ${tdStyle} align="right">${formatPercent(holding.percentChange)}</td>` +
        `<td ${tdStyle} align="right">${formatPercent(holding.contribution)}</td>` +
        `<td ${tdStyle} align="right">${formatCurrency(holding.currentValue, report.reportCurrency)}</td>` +
        "</tr>"
      );
    })
    .join("\n");
}

function buildDataIssuesSection(issues: PortfolioDataIssue[]): string {
  if (issues.length === 0) {
    return "";
  }

  const items = issues
    .map((issue) => {
      const label = [issue.ticker, issue.stockName].filter(Boolean).join(" - ");
      return `<li style="margin:0 0 8px;color:#d1d5db;">${label ? `<strong>${esc(label)}:</strong> ` : ""}${esc(issue.message)}</li>`;
    })
    .join("");

  return `
    <tr><td style="height:20px;"></td></tr>
    <tr>
      <td style="background:#111114;border-radius:10px;padding:0;overflow:hidden;border:1px solid rgba(245,158,11,0.25);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(90deg,rgba(245,158,11,0.12),transparent);padding:18px 24px 14px;border-bottom:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#fbbf24;font-weight:600;">Data issues</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px 20px;">
              <ul style="margin:0;padding-left:18px;">${items}</ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sortByAbsoluteChangeDesc(
  holdings: PortfolioHoldingPerformance[]
): PortfolioHoldingPerformance[] {
  return [...holdings].sort((a, b) => b.absoluteChange - a.absoluteChange);
}

function sortByAbsoluteChangeAsc(
  holdings: PortfolioHoldingPerformance[]
): PortfolioHoldingPerformance[] {
  return [...holdings].sort((a, b) => a.absoluteChange - b.absoluteChange);
}

export async function generatePortfolioReport(report: PortfolioWeekData): Promise<string> {
  const topContributor = sortByAbsoluteChangeDesc(report.holdings)[0];
  const topDetractor = sortByAbsoluteChangeAsc(report.holdings)[0];
  const activeReturn = report.totalReturnPct - report.benchmark.returnPct;

  let html = htmlReportTemplate
    .replace(/\{\{PERIOD_START\}\}/g, esc(report.periodStart))
    .replace(/\{\{PERIOD_END\}\}/g, esc(report.periodEnd))
    .replace(/\{\{GENERATED_AT\}\}/g, esc(report.generatedAt.slice(0, 10)))
    .replace(/\{\{TOTAL_VALUE_START\}\}/g, formatCurrency(report.totalValueStart, report.reportCurrency))
    .replace(/\{\{TOTAL_VALUE_END\}\}/g, formatCurrency(report.totalValueEnd, report.reportCurrency))
    .replace(/\{\{TOTAL_CHANGE\}\}/g, formatSignedCurrency(report.totalChange, report.reportCurrency))
    .replace(/\{\{TOTAL_RETURN\}\}/g, formatPercent(report.totalReturnPct))
    .replace(/\{\{BENCHMARK_NAME\}\}/g, esc(report.benchmark.name))
    .replace(/\{\{BENCHMARK_TICKER\}\}/g, esc(report.benchmark.ticker))
    .replace(/\{\{BENCHMARK_RETURN\}\}/g, formatPercent(report.benchmark.returnPct))
    .replace(/\{\{ACTIVE_RETURN\}\}/g, `${formatPercent(activeReturn)} vs benchmark`)
    .replace(/\{\{TOP_CONTRIBUTOR_TICKER\}\}/g, topContributor ? esc(topContributor.ticker) : "N/A")
    .replace(/\{\{TOP_CONTRIBUTOR_NAME\}\}/g, topContributor ? esc(topContributor.stockName) : "")
    .replace(
      /\{\{TOP_CONTRIBUTOR_CHANGE\}\}/g,
      topContributor
        ? formatSignedCurrency(topContributor.absoluteChange, report.reportCurrency)
        : "N/A"
    )
    .replace(/\{\{TOP_DETRACTOR_TICKER\}\}/g, topDetractor ? esc(topDetractor.ticker) : "N/A")
    .replace(/\{\{TOP_DETRACTOR_NAME\}\}/g, topDetractor ? esc(topDetractor.stockName) : "")
    .replace(
      /\{\{TOP_DETRACTOR_CHANGE\}\}/g,
      topDetractor
        ? formatSignedCurrency(topDetractor.absoluteChange, report.reportCurrency)
        : "N/A"
    )
    .replace("{{HOLDINGS_ROWS}}", buildHoldingsRows(report))
    .replace(
      "{{CHART_IMAGE}}",
      '<img src="cid:portfolio-chart" alt="Weekly holding contribution chart" style="max-width:100%;display:block;margin:0 auto;" />'
    )
    .replace(
      "{{DIVERSIFICATION_CHART_IMAGE}}",
      '<img src="cid:portfolio-diversification-chart" alt="Portfolio diversification chart" width="520" style="width:100%;max-width:520px;height:auto;display:block;margin:0 auto;" />'
    )
    .replace("{{DATA_ISSUES_SECTION}}", buildDataIssuesSection(report.dataIssues));

  const facts = {
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    portfolioReturnPct: Number((report.totalReturnPct * 100).toFixed(2)),
    benchmarkTicker: report.benchmark.ticker,
    benchmarkName: report.benchmark.name,
    benchmarkReturnPct: Number((report.benchmark.returnPct * 100).toFixed(2)),
    activeReturnPct: Number((activeReturn * 100).toFixed(2)),
    topContributors: sortByAbsoluteChangeDesc(report.holdings)
      .slice(0, 3)
      .map((holding) => ({
        ticker: holding.ticker,
        stockName: holding.stockName,
        absoluteChange: Number(holding.absoluteChange.toFixed(2)),
        percentChangePct: Number((holding.percentChange * 100).toFixed(2)),
        contributionPct: Number((holding.contribution * 100).toFixed(2)),
      })),
    topDetractors: sortByAbsoluteChangeAsc(report.holdings)
      .slice(0, 3)
      .map((holding) => ({
        ticker: holding.ticker,
        stockName: holding.stockName,
        absoluteChange: Number(holding.absoluteChange.toFixed(2)),
        percentChangePct: Number((holding.percentChange * 100).toFixed(2)),
        contributionPct: Number((holding.contribution * 100).toFixed(2)),
      })),
    largestPositions: [...report.holdings]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map((holding) => ({
        ticker: holding.ticker,
        stockName: holding.stockName,
        endingValue: Number(holding.currentValue.toFixed(2)),
        endingWeightPct: Number((holding.weightEnd * 100).toFixed(2)),
      })),
    dataIssues: report.dataIssues,
  };

  const agent = new Agent({
    name: "Portfolio Weekly Narrator",
    tools: [webSearchTool({ searchContextSize: "medium" })],
    instructions: `You write a concise weekly stock portfolio summary.

Use the supplied computed facts as the only numeric source of truth.
Use web search to research the external factors which have contributed to the changes in the positive or negative performance of the portfolio and the stocks within it over the past week.
If context is weak, say the move appears driven by broad market action rather than speculating.

Return ONLY 2-3 HTML paragraph tags (<p> elements), with no wrapper tags.
Each paragraph must use inline styles:
style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#cccccc;"
The final paragraph must use margin:0 instead.
Do not include investment advice or generic disclaimers in the narrative.`,
    model: "gpt-4o-mini",
    modelSettings: { temperature: 0.5, maxTokens: 1200 },
  });

  const result = await run(
    agent,
    `Write the weekly portfolio narrative for ${report.periodStart} to ${report.periodEnd}.
Facts:
${JSON.stringify(facts, null, 2)}`
  );

  const narrative = (result.finalOutput as string | undefined)?.trim() ?? "";
  if (!narrative) {
    throw new Error("Agent returned an empty narrative");
  }

  html = html.replace("{{NARRATIVE}}", narrative);
  return html;
}
