import { schedules } from "@trigger.dev/sdk/v3";
import { generatePortfolioCharts } from "../chart/generate-chart.js";
import { fetchPortfolioData } from "../data/fetch-portfolio-data.js";
import { generatePortfolioReport } from "../email/generate-report.js";
import { sendPortfolioReport } from "../email/send-report.js";

export const portfolioWeeklyReportTask = schedules.task({
  id: "portfolio-weekly-report",
  cron: "0 12 * * 7", // Every Sunday at 12:00 PM UTC
  maxDuration: 300,

  run: async (payload) => {
    const triggerDate = new Date(payload.timestamp);
    const referenceDate = triggerDate.toISOString().split("T")[0];

    console.log(
      `Portfolio weekly report started for reference date ${referenceDate} (trigger timestamp: ${triggerDate.toISOString()})`
    );

    const report = await fetchPortfolioData(referenceDate);
    console.log(
      `Computed report ${report.reportId} for ${report.periodStart} to ${report.periodEnd} with ${report.holdings.length} holdings`
    );

    const charts = await generatePortfolioCharts(report.holdings, report.reportCurrency);
    const html = await generatePortfolioReport(report);
    await sendPortfolioReport(report, html, {
      performance: charts.performance.buffer,
      diversification: charts.diversification.buffer,
    });

    console.log(`Portfolio report email sent for ${report.reportId}`);
    return {
      status: "success",
      reportId: report.reportId,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      holdings: report.holdings.length,
      dataIssues: report.dataIssues.length,
    };
  },
});
