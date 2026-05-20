export interface PortfolioHoldingPerformance {
  stockName: string;
  ticker: string;
  shares: number;
  previousClose: number;
  currentClose: number;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  percentChange: number;
  weightStart: number;
  weightEnd: number;
  contribution: number;
  relativeToBenchmark: number;
}

export interface BenchmarkSnapshot {
  ticker: string;
  name: string;
  previousClose: number;
  currentClose: number;
  returnPct: number;
}

export interface PortfolioDataIssue {
  ticker?: string;
  stockName?: string;
  message: string;
}

export interface PortfolioWeekData {
  reportId: string;
  generatedAt: string;
  reportCurrency: string;
  periodStart: string;
  periodEnd: string;
  totalValueStart: number;
  totalValueEnd: number;
  totalChange: number;
  totalReturnPct: number;
  benchmark: BenchmarkSnapshot;
  holdings: PortfolioHoldingPerformance[];
  dataIssues: PortfolioDataIssue[];
}
