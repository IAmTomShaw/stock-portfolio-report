export const htmlReportTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Portfolio Report</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0f;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">
          <tr>
            <td style="background:linear-gradient(135deg,#0d0d0f 0%,#10281a 100%);border-radius:12px;padding:0;overflow:hidden;border:1px solid rgba(34,197,94,0.28);box-shadow:0 0 60px rgba(34,197,94,0.12);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a);height:4px;"></td>
                </tr>
                <tr>
                  <td style="padding:32px 36px 28px;">
                    <p style="margin:0 0 12px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:600;">Stock Portfolio Tracker</p>
                    <h1 style="margin:0 0 6px;font-size:34px;font-weight:900;color:#ffffff;line-height:1.1;letter-spacing:-0.5px;">Weekly Portfolio Report</h1>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.72);">{{PERIOD_START}} to {{PERIOD_END}}</p>
                    <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">Generated {{GENERATED_AT}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td style="background:#111114;border-radius:12px;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;">Weekly performance by holding</p>
                        </td>
                        <td align="right">
                          <span style="display:inline-block;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:3px 10px;font-size:10px;color:#4ade80;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Adjusted close</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 4px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent);margin:0 24px 16px;"></div>
                    <div style="padding:0 24px 24px;text-align:center;">
                      {{CHART_IMAGE}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td style="background:#111114;border-radius:12px;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;">Portfolio diversification</p>
                        </td>
                        <td align="right">
                          <span style="display:inline-block;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.3);border-radius:20px;padding:3px 10px;font-size:10px;color:#93c5fd;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Ending weights</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 4px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent);margin:0 24px 16px;"></div>
                    <div style="padding:0 24px 24px;text-align:center;">
                      {{DIVERSIFICATION_CHART_IMAGE}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td>
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;">Weekly summary</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr valign="bottom">
                  <td width="33%" style="padding:0 4px 0 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(180deg,#1f2937 0%,#111827 100%);border-radius:10px 10px 0 0;padding:22px 12px 18px;text-align:center;color:#ffffff;border-top:3px solid #60a5fa;">
                          <p style="margin:0 0 10px;font-size:22px;">💼</p>
                          <p style="margin:0 0 2px;font-size:9px;font-weight:800;letter-spacing:2px;opacity:0.6;">ENDING VALUE</p>
                          <p style="margin:0 0 6px;font-size:20px;font-weight:900;line-height:1.2;letter-spacing:-0.3px;">{{TOTAL_VALUE_END}}</p>
                          <p style="margin:0 0 8px;font-size:10px;opacity:0.6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Started at {{TOTAL_VALUE_START}}</p>
                          <p style="margin:0;font-size:11px;font-weight:700;background:rgba(255,255,255,0.08);border-radius:4px;padding:4px 8px;display:inline-block;">{{TOTAL_CHANGE}}</p>
                        </td>
                      </tr>
                      <tr><td style="background:#111827;height:20px;"></td></tr>
                    </table>
                  </td>
                  <td width="34%" style="padding:0 4px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(180deg,#22c55e 0%,#15803d 100%);border-radius:10px 10px 0 0;padding:28px 12px 18px;text-align:center;color:#031407;border-top:3px solid #86efac;box-shadow:0 -8px 32px rgba(34,197,94,0.35);">
                          <p style="margin:0 0 10px;font-size:24px;">📈</p>
                          <p style="margin:0 0 2px;font-size:9px;font-weight:800;letter-spacing:2px;opacity:0.55;">PORTFOLIO RETURN</p>
                          <p style="margin:0 0 6px;font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-0.3px;">{{TOTAL_RETURN}}</p>
                          <p style="margin:0 0 8px;font-size:10px;opacity:0.6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">vs {{BENCHMARK_NAME}}</p>
                          <p style="margin:0;font-size:11px;font-weight:700;background:rgba(0,0,0,0.12);border-radius:4px;padding:4px 8px;display:inline-block;">{{ACTIVE_RETURN}}</p>
                        </td>
                      </tr>
                      <tr><td style="background:#15803d;height:32px;"></td></tr>
                    </table>
                  </td>
                  <td width="33%" style="padding:0 0 0 4px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(180deg,#f59e0b 0%,#b45309 100%);border-radius:10px 10px 0 0;padding:22px 12px 18px;text-align:center;color:#fff7ed;border-top:3px solid #fcd34d;">
                          <p style="margin:0 0 10px;font-size:22px;">📊</p>
                          <p style="margin:0 0 2px;font-size:9px;font-weight:800;letter-spacing:2px;opacity:0.6;">BENCHMARK</p>
                          <p style="margin:0 0 6px;font-size:16px;font-weight:900;line-height:1.2;letter-spacing:-0.3px;">{{BENCHMARK_TICKER}}</p>
                          <p style="margin:0 0 8px;font-size:10px;opacity:0.6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">{{BENCHMARK_NAME}}</p>
                          <p style="margin:0;font-size:11px;font-weight:700;background:rgba(0,0,0,0.2);border-radius:4px;padding:4px 8px;display:inline-block;">{{BENCHMARK_RETURN}}</p>
                        </td>
                      </tr>
                      <tr><td style="background:#b45309;height:10px;"></td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="background:#1a1a1e;height:6px;border-radius:0 0 10px 10px;border:1px solid rgba(255,255,255,0.06);border-top:none;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td style="background:#111114;border-radius:10px;padding:0;overflow:hidden;border:1px solid rgba(96,165,250,0.25);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,rgba(96,165,250,0.2),transparent);padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr valign="middle">
                        <td width="50%" style="padding-right:10px;">
                          <p style="margin:0 0 2px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#60a5fa;font-weight:700;">Top contributor</p>
                          <p style="margin:0;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;">{{TOP_CONTRIBUTOR_TICKER}} <span style="font-weight:400;color:rgba(255,255,255,0.45);font-size:13px;">{{TOP_CONTRIBUTOR_NAME}}</span></p>
                          <p style="margin:6px 0 0;font-size:18px;font-weight:900;color:#60a5fa;letter-spacing:-0.5px;font-variant-numeric:tabular-nums;">{{TOP_CONTRIBUTOR_CHANGE}}</p>
                        </td>
                        <td width="50%" style="padding-left:10px;border-left:1px solid rgba(255,255,255,0.08);">
                          <p style="margin:0 0 2px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#f87171;font-weight:700;">Top detractor</p>
                          <p style="margin:0;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;">{{TOP_DETRACTOR_TICKER}} <span style="font-weight:400;color:rgba(255,255,255,0.45);font-size:13px;">{{TOP_DETRACTOR_NAME}}</span></p>
                          <p style="margin:6px 0 0;font-size:18px;font-weight:900;color:#f87171;letter-spacing:-0.5px;font-variant-numeric:tabular-nums;">{{TOP_DETRACTOR_CHANGE}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td style="background:#111114;border-radius:10px;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:18px 20px 14px;">
                    <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;">Holdings breakdown</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                      <tr>
                        <th style="background:#16a34a;color:#ffffff;text-align:left;padding:9px 12px;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Holding</th>
                        <th style="background:#16a34a;color:#ffffff;text-align:right;padding:9px 12px;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Shares</th>
                        <th style="background:#16a34a;color:#ffffff;text-align:right;padding:9px 12px;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Week return</th>
                        <th style="background:#16a34a;color:#ffffff;text-align:right;padding:9px 12px;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Contribution</th>
                        <th style="background:#16a34a;color:#ffffff;text-align:right;padding:9px 12px;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Ending value</th>
                      </tr>
                      {{HOLDINGS_ROWS}}
                    </table>
                  </td>
                </tr>
                <tr><td style="height:4px;"></td></tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:20px;"></td></tr>

          <tr>
            <td style="background:#111114;border-radius:10px;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,rgba(34,197,94,0.08),transparent);padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35);font-weight:600;">What moved the portfolio</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 24px;">
                    {{NARRATIVE}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{DATA_ISSUES_SECTION}}

          <tr><td style="height:24px;"></td></tr>

          <tr>
            <td style="text-align:center;padding:20px 0;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 6px;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:0.5px;">Generated with adjusted market data, benchmark comparison, and OpenAI research</p>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.5px;">For informational purposes only. Not investment advice.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
