import { Resend } from "resend";
import type { PortfolioWeekData } from "../types.js";

export async function sendPortfolioReport(
  report: PortfolioWeekData,
  htmlContent: string,
  charts: {
    performance: Buffer;
    diversification: Buffer;
  }
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const recipient = process.env.RECIPIENT_EMAIL;
  if (!recipient) {
    throw new Error("RECIPIENT_EMAIL environment variable is not set");
  }

  const fromEmail = process.env.FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("FROM_EMAIL environment variable is not set");
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [recipient],
    subject: `Portfolio report: week ending ${report.periodEnd}`,
    html: htmlContent,
    attachments: [
      {
        filename: "weekly-holding-performance.png",
        content: charts.performance,
        content_type: "image/png",
        content_id: "portfolio-chart",
      } as { filename: string; content: Buffer; content_type: string },
      {
        filename: "portfolio-diversification.png",
        content: charts.diversification,
        content_type: "image/png",
        content_id: "portfolio-diversification-chart",
      } as { filename: string; content: Buffer; content_type: string },
    ],
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
