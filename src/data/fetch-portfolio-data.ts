import { readFile } from "node:fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import { z } from "zod";
import type { PortfolioWeekData } from "../types.js";

const PORTFOLIO_CSV_PATH = process.env.PORTFOLIO_CSV_PATH ?? "./portfolio.csv";
const BENCHMARK_TICKER = (process.env.BENCHMARK_TICKER ?? "SPY").toUpperCase();
const BENCHMARK_NAME = process.env.BENCHMARK_NAME ?? "SPDR S&P 500 ETF Trust";
const REPORT_CURRENCY = (process.env.REPORT_CURRENCY ?? "GBP").trim().toUpperCase();
const YFIN_CONTACT = process.env.YFIN_CONTACT?.trim();
const YFIN_SYMBOL_ALIASES = new Map<string, string[]>([
  ["VUSA", ["VUSA.L"]],
  ["VUKE", ["VUKE.L"]],
]);
const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.app";

const HEADER_ALIASES = new Map<string, "stock_name" | "ticker" | "shares">([
  ["stock name", "stock_name"],
  ["name", "stock_name"],
  ["company", "stock_name"],
  ["ticker", "ticker"],
  ["symbol", "ticker"],
  ["shares", "shares"],
  ["share count", "shares"],
  ["number of shares", "shares"],
]);

const yfinHistorySuccessSchema = z.object({
  meta: z.object({
    route: z.string(),
  }),
  data: z.object({
    chart: z.object({
      result: z.array(
        z.object({
          meta: z
            .object({
              currency: z.string().optional(),
              exchangeTimezoneName: z.string().optional(),
            })
            .passthrough(),
          timestamp: z.array(z.number()).optional(),
          indicators: z
            .object({
              quote: z
                .array(
                  z.object({
                    close: z.array(z.number().nullable()).optional(),
                  })
                )
                .optional(),
              adjclose: z
                .array(
                  z.object({
                    adjclose: z.array(z.number().nullable()).optional(),
                  })
                )
                .optional(),
            })
            .optional(),
        })
      ),
      error: z
        .object({
          code: z.string().optional(),
          description: z.string().optional(),
        })
        .nullable()
        .optional(),
    }),
  }),
});

const yfinHistoryErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const yfinHistoryResponseSchema = z.union([yfinHistorySuccessSchema, yfinHistoryErrorSchema]);

const frankfurterRangeResponseSchema = z.object({
  amount: z.number(),
  base: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
});

interface PortfolioHoldingInput {
  stockName: string;
  ticker: string;
  shares: number;
}

interface PricePoint {
  date: string;
  adjustedClose: number;
}

interface TickerHistory {
  currency: string;
  prices: PricePoint[];
}

interface FxRatePoint {
  date: string;
  rate: number;
}

interface NormalizedQuoteCurrency {
  majorCurrency: string;
  unitScale: number;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]/g, " ");
}

function parseDateOnly(value: string): Date {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return parsed;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMarketDate(timestampSeconds: number, timeZone?: string): string {
  const date = new Date(timestampSeconds * 1000);
  if (!timeZone) {
    return formatDateOnly(date);
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format market date for timezone ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

function shiftDate(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

function lastValueOnOrBefore(series: PricePoint[], targetDate: string): PricePoint | undefined {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index].date <= targetDate) {
      return series[index];
    }
  }
  return undefined;
}

function exactValueOn(series: PricePoint[], targetDate: string): number | undefined {
  return series.find((point) => point.date === targetDate)?.adjustedClose;
}

function normalizeSourceCurrency(currency: string): string {
  return normalizeQuoteCurrency(currency).majorCurrency;
}

function normalizeQuoteCurrency(currency: string): NormalizedQuoteCurrency {
  const trimmed = currency.trim();
  const upper = trimmed.toUpperCase();

  if (trimmed === "GBp" || upper === "GBX") {
    return {
      majorCurrency: "GBP",
      unitScale: 0.01,
    };
  }

  return {
    majorCurrency: upper,
    unitScale: 1,
  };
}

function lastFxRateOnOrBefore(series: FxRatePoint[], targetDate: string): number | undefined {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index].date <= targetDate) {
      return series[index].rate;
    }
  }

  return undefined;
}

function buildTickerCandidates(ticker: string): string[] {
  const normalized = ticker.toUpperCase();
  const candidates: string[] = [...(YFIN_SYMBOL_ALIASES.get(normalized) ?? [])];

  if (normalized.includes(".")) {
    candidates.push(normalized.replace(/\./g, "-"));
  }

  candidates.push(normalized);

  if (normalized.includes("-")) {
    candidates.push(normalized.replace(/-/g, "."));
  }

  return [...new Set(candidates)];
}

async function readPortfolioCsv(path: string): Promise<PortfolioHoldingInput[]> {
  let content: string;

  try {
    content = await readFile(path, "utf-8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Portfolio CSV not found at ${path}`);
    }

    throw error;
  }

  const headerRows = parseCsv(content, {
    skip_empty_lines: true,
    to_line: 1,
    trim: true,
  }) as string[][];

  const [headers] = headerRows;
  if (!headers || headers.length === 0) {
    throw new Error("Portfolio CSV must include a header row");
  }

  const canonicalHeaders = new Map<string, "stock_name" | "ticker" | "shares">();
  for (const header of headers) {
    const canonical = HEADER_ALIASES.get(normalizeHeader(header));
    if (canonical) {
      canonicalHeaders.set(header, canonical);
    }
  }

  const missing = ["stock_name", "ticker", "shares"].filter(
    (column) => ![...canonicalHeaders.values()].includes(column as "stock_name" | "ticker" | "shares")
  );
  if (missing.length > 0) {
    throw new Error("Portfolio CSV must include columns for stock name, ticker, and shares");
  }

  const rows = parseCsv(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const aggregated = new Map<string, PortfolioHoldingInput>();

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const mapped: Partial<Record<"stock_name" | "ticker" | "shares", string>> = {};

    for (const [header, canonical] of canonicalHeaders) {
      const value = row[header];
      if (typeof value === "string") {
        mapped[canonical] = value.trim();
      }
    }

    const stockName = mapped.stock_name;
    const ticker = mapped.ticker;
    const sharesRaw = mapped.shares;

    if (!stockName || !ticker || !sharesRaw) {
      throw new Error(`Row ${rowNumber} is missing stock name, ticker, or shares`);
    }

    const shares = Number(sharesRaw);
    if (!Number.isFinite(shares)) {
      throw new Error(`Row ${rowNumber} has an invalid share count: ${sharesRaw}`);
    }

    if (shares <= 0) {
      throw new Error(`Row ${rowNumber} must have a positive share count`);
    }

    const normalizedTicker = ticker.toUpperCase();
    const existing = aggregated.get(normalizedTicker);

    if (existing) {
      existing.shares += shares;
      continue;
    }

    aggregated.set(normalizedTicker, {
      stockName,
      ticker: normalizedTicker,
      shares,
    });
  }

  const holdings = [...aggregated.values()];
  if (holdings.length === 0) {
    throw new Error("Portfolio CSV does not contain any holdings");
  }

  return holdings;
}

async function fetchYfinHistory(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<TickerHistory | null> {
  const url = new URL("https://api.yfin.dev/v1/history");
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("start", startDate);
  url.searchParams.set("end", shiftDate(endDate, 1));
  url.searchParams.set("interval", "1d");

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (YFIN_CONTACT) {
    headers["X-Yfin-Contact"] = YFIN_CONTACT;
  }

  const response = await fetch(url, {
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status === 502 && response.headers.get("x-yfin-origin-status") === "404") {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("yfin.dev rejected the request identity. Check YFIN_CONTACT or authorization settings.");
  }

  if (response.status === 429) {
    throw new Error("yfin.dev rate limit exceeded while fetching market data.");
  }

  if (!response.ok) {
    const providerMessage = response.headers.get("x-yfin-error-message");
    throw new Error(
      `yfin.dev request failed for ${ticker}: ${providerMessage ?? `${response.status} ${response.statusText}`}`
    );
  }

  const parsed = yfinHistoryResponseSchema.parse(await response.json());
  if ("ok" in parsed) {
    throw new Error(`yfin.dev request failed for ${ticker}: ${parsed.error.message}`);
  }

  const chart = parsed.data.chart;
  if (chart.error || chart.result.length === 0) {
    return null;
  }

  const [series] = chart.result;
  if (!series?.timestamp || series.timestamp.length === 0) {
    return null;
  }

  const currency = series.meta.currency;
  if (!currency) {
    throw new Error(`yfin.dev response for ${ticker} did not include a quote currency.`);
  }

  const timeZone = series.meta.exchangeTimezoneName;
  const adjustedCloses = series.indicators?.adjclose?.[0]?.adjclose ?? [];
  const closes = series.indicators?.quote?.[0]?.close ?? [];

  return {
    currency,
    prices: series.timestamp
      .map((timestamp: number, index: number): PricePoint => {
        const adjustedClose = adjustedCloses[index] ?? closes[index] ?? Number.NaN;
        return {
          date: formatMarketDate(timestamp, timeZone),
          adjustedClose,
        };
      })
      .filter((price: PricePoint) => Number.isFinite(price.adjustedClose))
      .sort((left: PricePoint, right: PricePoint) => left.date.localeCompare(right.date)),
  };
}

async function fetchTickerHistory(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<TickerHistory | null> {
  for (const candidate of buildTickerCandidates(ticker)) {
    const history = await fetchYfinHistory(candidate, startDate, endDate);
    if (!history) {
      continue;
    }

    return history;
  }

  return null;
}

async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<U>
): Promise<U[]> {
  const results: U[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

async function fetchHistoryForTickers(
  tickers: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, TickerHistory | null>> {
  const histories = await mapWithConcurrency(tickers, 4, async (ticker) => ({
    ticker,
    history: await fetchTickerHistory(ticker, startDate, endDate),
  }));

  return new Map(histories.map(({ ticker, history }) => [ticker, history]));
}

async function fetchHistoricalRates(
  sourceCurrency: string,
  startDate: string,
  endDate: string
): Promise<FxRatePoint[]> {
  const url = new URL(`${FRANKFURTER_API_BASE_URL}/${shiftDate(startDate, -7)}..${endDate}`);
  url.searchParams.set("from", sourceCurrency);
  url.searchParams.set("to", REPORT_CURRENCY);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Frankfurter request failed for ${sourceCurrency}/${REPORT_CURRENCY}: ${response.status} ${response.statusText}`
    );
  }

  const parsed = frankfurterRangeResponseSchema.parse(await response.json());
  const rates = Object.entries(parsed.rates)
    .map(([date, values]): FxRatePoint => {
      const rate = values[REPORT_CURRENCY];
      if (!Number.isFinite(rate)) {
        throw new Error(`Frankfurter response omitted ${REPORT_CURRENCY} rate for ${sourceCurrency} on ${date}`);
      }

      return { date, rate };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  if (rates.length === 0) {
    throw new Error(`Frankfurter returned no historical rates for ${sourceCurrency}/${REPORT_CURRENCY}`);
  }

  return rates;
}

async function buildFxRateLookup(
  histories: Map<string, TickerHistory | null>,
  startDate: string,
  endDate: string
): Promise<Map<string, FxRatePoint[]>> {
  const currencies = [
    ...new Set(
      [...histories.values()]
        .filter((history): history is TickerHistory => history !== null)
        .map((history) => normalizeQuoteCurrency(history.currency).majorCurrency)
        .filter((currency) => currency !== REPORT_CURRENCY)
    ),
  ];

  const fxSeries = await mapWithConcurrency(currencies, 4, async (currency) => ({
    currency,
    rates: await fetchHistoricalRates(currency, startDate, endDate),
  }));

  return new Map(fxSeries.map(({ currency, rates }) => [currency, rates]));
}

function convertPricesToReportCurrency(
  ticker: string,
  history: TickerHistory,
  fxRatesByCurrency: Map<string, FxRatePoint[]>
): PricePoint[] {
  const { majorCurrency, unitScale } = normalizeQuoteCurrency(history.currency);

  if (majorCurrency === REPORT_CURRENCY) {
    return history.prices.map((price) => ({
      ...price,
      adjustedClose: price.adjustedClose * unitScale,
    }));
  }

  const fxRates = fxRatesByCurrency.get(majorCurrency);
  if (!fxRates) {
    throw new Error(`Missing ${majorCurrency}/${REPORT_CURRENCY} conversion rates for ${ticker}.`);
  }

  return history.prices.map((price) => {
    const rate = lastFxRateOnOrBefore(fxRates, price.date);
    if (rate === undefined) {
      throw new Error(`No ${majorCurrency}/${REPORT_CURRENCY} rate was available on or before ${price.date}.`);
    }

    return {
      ...price,
      adjustedClose: price.adjustedClose * unitScale * rate,
    };
  });
}

export async function fetchPortfolioData(referenceDate: string): Promise<PortfolioWeekData> {
  parseDateOnly(referenceDate);

  const holdings = await readPortfolioCsv(PORTFOLIO_CSV_PATH);
  const allTickers = [...new Set([BENCHMARK_TICKER, ...holdings.map((holding) => holding.ticker)])];

  const historyStart = shiftDate(referenceDate, -21);
  const historyEnd = referenceDate;
  const rawHistories = await fetchHistoryForTickers(allTickers, historyStart, historyEnd);
  const fxRatesByCurrency = await buildFxRateLookup(rawHistories, historyStart, historyEnd);
  const histories = new Map(
    [...rawHistories.entries()].map(([ticker, history]) => [
      ticker,
      history ? convertPricesToReportCurrency(ticker, history, fxRatesByCurrency) : null,
    ])
  );

  const benchmarkSeries = histories.get(BENCHMARK_TICKER) ?? [];
  if (!benchmarkSeries || benchmarkSeries.length === 0) {
    throw new Error(`No price history found for benchmark ticker ${BENCHMARK_TICKER}`);
  }

  const periodEndPoint = lastValueOnOrBefore(benchmarkSeries, shiftDate(referenceDate, -1));
  if (!periodEndPoint) {
    throw new Error("Unable to determine the latest completed trading day for the benchmark");
  }

  const periodStartPoint = lastValueOnOrBefore(benchmarkSeries, shiftDate(periodEndPoint.date, -7));
  if (!periodStartPoint) {
    throw new Error("Unable to determine the prior-week trading day for the benchmark");
  }

  const benchmarkReturn = periodEndPoint.adjustedClose / periodStartPoint.adjustedClose - 1;
  const holdingsPerformance: PortfolioWeekData["holdings"] = [];
  const dataIssues: PortfolioWeekData["dataIssues"] = [];

  for (const holding of holdings) {
    const series = histories.get(holding.ticker) ?? [];
    if (!series || series.length === 0) {
      dataIssues.push({
        ticker: holding.ticker,
        stockName: holding.stockName,
        message: "No market price history was returned for this ticker.",
      });
      continue;
    }

    const previousClose = exactValueOn(series, periodStartPoint.date);
    const currentClose = exactValueOn(series, periodEndPoint.date);

    if (previousClose === undefined || currentClose === undefined) {
      dataIssues.push({
        ticker: holding.ticker,
        stockName: holding.stockName,
        message: `Missing price data for the weekly window (${periodStartPoint.date} to ${periodEndPoint.date}).`,
      });
      continue;
    }

    const previousValue = holding.shares * previousClose;
    const currentValue = holding.shares * currentClose;
    const percentChange = currentClose / previousClose - 1;
    const absoluteChange = currentValue - previousValue;

    holdingsPerformance.push({
      stockName: holding.stockName,
      ticker: holding.ticker,
      shares: holding.shares,
      previousClose,
      currentClose,
      previousValue,
      currentValue,
      absoluteChange,
      percentChange,
      weightStart: 0,
      weightEnd: 0,
      contribution: 0,
      relativeToBenchmark: 0,
    });
  }

  if (holdingsPerformance.length === 0) {
    throw new Error("No holdings had sufficient market data to build a report");
  }

  const totalValueStart = holdingsPerformance.reduce((sum, row) => sum + row.previousValue, 0);
  const totalValueEnd = holdingsPerformance.reduce((sum, row) => sum + row.currentValue, 0);
  const totalChange = totalValueEnd - totalValueStart;
  const totalReturnPct = totalValueEnd / totalValueStart - 1;

  for (const holding of holdingsPerformance) {
    holding.weightStart = holding.previousValue / totalValueStart;
    holding.weightEnd = holding.currentValue / totalValueEnd;
    holding.contribution = holding.weightStart * holding.percentChange;
    holding.relativeToBenchmark = holding.percentChange - benchmarkReturn;
  }

  return {
    reportId: `portfolio-week-${periodEndPoint.date}`,
    generatedAt: new Date().toISOString(),
    reportCurrency: REPORT_CURRENCY,
    periodStart: periodStartPoint.date,
    periodEnd: periodEndPoint.date,
    totalValueStart,
    totalValueEnd,
    totalChange,
    totalReturnPct,
    benchmark: {
      ticker: BENCHMARK_TICKER,
      name: BENCHMARK_NAME,
      previousClose: periodStartPoint.adjustedClose,
      currentClose: periodEndPoint.adjustedClose,
      returnPct: benchmarkReturn,
    },
    holdings: holdingsPerformance,
    dataIssues,
  };
}
