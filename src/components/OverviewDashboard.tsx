import React, { useMemo } from 'react';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  BarChart2,
} from 'lucide-react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  IntradayAssetBias,
  TodayCatalyst,
  ArahMarketTodayData,
} from '../types';
import { ExecutiveMarketBrief } from './ExecutiveMarketBrief';
import { NavTabId } from './Sidebar';
import { PageHeader } from './shared/PageHeader';

interface OverviewDashboardProps {
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  events: MarketEvent[];
  calendar: EconomicEvent[];
  overview: AIAnalysis | null;
  onNavigateTab: (tab: NavTabId) => void;
  globalRegime: ArahMarketTodayData['globalRegime'] | null;
  arahMarketData?: ArahMarketTodayData | null;
  onOpenChart: (symbol: string) => void;
  onSelectEvent?: (eventId: string) => void;
  onSyncWire?: () => Promise<void>;
  isSyncingWire?: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = React.memo(({
  intradayMap,
  todayCatalysts,
  prices,
  strengths,
  events,
  calendar,
  overview,
  onNavigateTab,
  globalRegime,
  arahMarketData,
  onOpenChart,
}) => {
  // Executive KPI telemetry calculations
  const kpiStats = useMemo(() => {
    let strongest: CurrencyStrength | null = null;
    let weakest: CurrencyStrength | null = null;
    if (strengths && strengths.length > 0) {
      const sorted = [...strengths].sort((a, b) => b.strength_score - a.strength_score);
      strongest = sorted[0];
      weakest = sorted[sorted.length - 1];
    }

    const bullishCount = intradayMap.filter(a => a.overall_bias === 'BULLISH').length;
    const bearishCount = intradayMap.filter(a => a.overall_bias === 'BEARISH').length;

    let overallRegime = 'BALANCED / ROTATIONAL';
    let regimeStatus = 'NEUTRAL';
    if (bullishCount >= 7) {
      overallRegime = 'RISK-ON DOMINANT';
      regimeStatus = 'BULLISH';
    } else if (bearishCount >= 7) {
      overallRegime = 'DEFENSIVE / RISK-OFF';
      regimeStatus = 'BEARISH';
    }

    const upcomingHigh = calendar.find(
      c => c.status === 'UPCOMING' && (c.impact === 'CRITICAL' || c.impact === 'HIGH')
    );

    // Fast asset snapshots
    const gold = prices.find(p => p.symbol === 'XAUUSD');
    const dxy = prices.find(p => p.symbol === 'USD');
    const us100 = prices.find(p => p.symbol === 'US100');
    const us10y = prices.find(p => p.symbol === 'US10Y');

    return {
      strongest,
      weakest,
      bullishCount,
      bearishCount,
      overallRegime,
      regimeStatus,
      upcomingHigh,
      gold,
      dxy,
      us100,
      us10y,
    };
  }, [strengths, intradayMap, calendar, prices]);

  return (
    <div className="space-y-4" id="terminal-overview-dashboard">
      {/* ======================================================== */}
      {/* 1. SWISS EDITORIAL MARKET OVERVIEW HERO                 */}
      {/* ======================================================== */}
      <section
        className="terminal-panel p-4 sm:p-5 border transition-colors"
        id="editorial-market-overview"
      >
        <PageHeader
          eyebrow="MAIN · OVERVIEW"
          accentNote="INTRADAY REGIME"
          title={`Today's market regime: ${kpiStats.overallRegime}`}
          description="Cross-asset analysis across G8 currencies, US benchmark yields, technology equities, and gold. High-conviction setups prioritized based on intermarket yield differentials and liquidity flows."
          actions={
            <div
              className="w-full lg:w-80 shrink-0 rounded-lg p-3.5 space-y-3"
              style={{ backgroundColor: 'var(--bg-section-alt)' }}
            >
              <div className="flex items-center justify-between">
                <span className="metadata-label text-[9px] text-[var(--text-muted)]">
                  At a glance
                </span>
                <span className="text-[10px] font-semibold text-[var(--bullish)] tabular-nums">
                  {kpiStats.bullishCount} bull / {kpiStats.bearishCount} bear
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11px] tabular-nums">
                <div className="space-y-0.5">
                  <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                    US dollar · DXY
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {kpiStats.dxy?.price.toFixed(2) || '101.24'}
                    <span className={`ml-1 text-[10px] ${((kpiStats.dxy?.change_24h_pct ?? 0) >= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                      {((kpiStats.dxy?.change_24h_pct ?? 0) >= 0) ? '+' : ''}
                      {(kpiStats.dxy?.change_24h_pct ?? 0.18).toFixed(2)}%
                    </span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                    Gold · XAUUSD
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    ${kpiStats.gold?.price.toFixed(1) || '2,654.8'}
                    <span className={`ml-1 text-[10px] ${((kpiStats.gold?.change_24h_pct ?? 0) >= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                      {((kpiStats.gold?.change_24h_pct ?? 0) >= 0) ? '+' : ''}
                      {(kpiStats.gold?.change_24h_pct ?? 0.73).toFixed(2)}%
                    </span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                    Nasdaq · US100
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {kpiStats.us100?.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '23,421'}
                    <span className={`ml-1 text-[10px] ${((kpiStats.us100?.change_24h_pct ?? 0) >= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                      {((kpiStats.us100?.change_24h_pct ?? 0) >= 0) ? '+' : ''}
                      {(kpiStats.us100?.change_24h_pct ?? 0.41).toFixed(2)}%
                    </span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                    10Y yield · US10Y
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {kpiStats.us10y?.price.toFixed(3) || '4.085'}%
                    <span className={`ml-1 text-[10px] ${((kpiStats.us10y?.change_24h_pct ?? 0) <= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                      {((kpiStats.us10y?.change_24h_pct ?? 0) >= 0) ? '+' : ''}
                      {(kpiStats.us10y?.change_24h_pct ?? -0.32).toFixed(2)}%
                    </span>
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                <span>LEAD: <strong className="text-[var(--bullish)]">{kpiStats.strongest?.currency || 'USD'} ({kpiStats.strongest?.strength_score.toFixed(1) || '7.8'})</strong></span>
                <span>LAG: <strong className="text-[var(--bearish)]">{kpiStats.weakest?.currency || 'JPY'} ({kpiStats.weakest?.strength_score.toFixed(1) || '2.1'})</strong></span>
              </div>
            </div>
          }
        />
      </section>

      {/* ======================================================== */}
      {/* 2. 4-COLUMN STRUCTURAL KPI TELEMETRY GRID               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Market Regime */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)]">
              Regime
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                kpiStats.regimeStatus === 'BULLISH'
                  ? 'badge-bullish'
                  : kpiStats.regimeStatus === 'BEARISH'
                  ? 'badge-bearish'
                  : 'badge-neutral'
              }`}
            >
              {kpiStats.regimeStatus}
            </span>
          </div>
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">
            {kpiStats.overallRegime}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Distribution across 13 core tracking assets
          </div>
        </div>

        {/* KPI 2: Currency Divergence */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)]">
              G8 divergence
            </span>
            <button
              onClick={() => onNavigateTab('currency')}
              className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
            >
              Matrix →
            </button>
          </div>
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span className="text-[var(--bullish)]">{kpiStats.strongest?.currency || 'USD'}</span>
            <span className="text-[var(--text-muted)]">vs</span>
            <span className="text-[var(--bearish)]">{kpiStats.weakest?.currency || 'JPY'}</span>
            <span className="text-[10px] font-normal text-[var(--text-muted)] ml-auto">
              Δ {((kpiStats.strongest?.strength_score ?? 6) - (kpiStats.weakest?.strength_score ?? 2)).toFixed(1)}pt
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Maximum directional divergence basket
          </div>
        </div>

        {/* KPI 3: Key Imminent Catalyst */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)]">
              NEXT HIGH IMPACT
            </span>
            {kpiStats.upcomingHigh && (
              <span className="text-[9px] font-mono font-semibold px-1 py-0 rounded badge-warning">
                {kpiStats.upcomingHigh.currency}
              </span>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] truncate" title={kpiStats.upcomingHigh?.event_name}>
            {kpiStats.upcomingHigh?.event_name || 'No imminent high-impact data'}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {kpiStats.upcomingHigh ? (
              `${new Date(kpiStats.upcomingHigh.date_time_utc).toLocaleTimeString('en-GB', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })} WIB`
            ) : 'Calendar clear for next session'}
          </div>
        </div>

        {/* KPI 4: Intermarket Flow Transmissions */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)]">
              TRANSMISI YIELD US10Y
            </span>
            <button
              onClick={() => onNavigateTab('intermarket')}
              className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
            >
              Matriks →
            </button>
          </div>
          <div className="text-[14px] font-bold font-mono text-[var(--text-primary)] flex items-center justify-between">
            <span>{kpiStats.us10y?.price.toFixed(3) || '4.085'}%</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              (kpiStats.us10y?.change_24h_pct ?? 0) <= -0.05
                ? 'badge-bullish'
                : (kpiStats.us10y?.change_24h_pct ?? 0) >= 0.05
                ? 'badge-bearish'
                : 'badge-neutral'
            }`}>
              {(kpiStats.us10y?.change_24h_pct ?? 0) <= -0.05
                ? '▼ EASING'
                : (kpiStats.us10y?.change_24h_pct ?? 0) >= 0.05
                ? '▲ TIGHTENING'
                : '● KONSOLIDASI'}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {(kpiStats.us10y?.change_24h_pct ?? 0) <= -0.05
              ? 'Pelemahan yield: Dorongan beli ke Emas & Tech'
              : (kpiStats.us10y?.change_24h_pct ?? 0) >= 0.05
              ? 'Kenaikan yield: Tekanan beban oportunitas ke Emas'
              : 'Discount rate stabil di batas sesi'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. EXECUTIVE MARKET BRIEF (MACRO CONCLUSION)             */}
      {/* ======================================================== */}
      <ExecutiveMarketBrief
        strengths={strengths}
        prices={prices}
        globalRegime={globalRegime}
        arahMarketData={arahMarketData}
        todayCatalysts={todayCatalysts}
        calendar={calendar}
        events={events}
        overview={overview}
        onOpenChart={onOpenChart}
        onNavigateMarketBias={() => onNavigateTab('arah_market')}
        onNavigateDailyReport={() => onNavigateTab('daily_report')}
        onNavigateTab={onNavigateTab}
      />

      {/* ======================================================== */}
      {/* 4. DEPTH MAP — Overview stays a summary; the grids live   */}
      {/*    on their own tabs so this surface is not a second copy  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            id: 'markets' as const,
            icon: BarChart2,
            label: 'Market surveillance',
            hint: 'Full quote grid · 14 instruments',
          },
          {
            id: 'currency' as const,
            icon: TrendingUp,
            label: 'Currency G8 matrix',
            hint: 'Strength chart · pair opportunity matrix',
          },
          {
            id: 'intermarket' as const,
            icon: Zap,
            label: 'Intermarket flows',
            hint: 'Cross-asset correlations & divergences',
          },
          {
            id: 'history' as const,
            icon: Clock,
            label: 'Historical memory',
            hint: 'Session archive · multi-day deltas',
          },
        ].map(({ id, icon: Icon, label, hint }) => (
          <button
            key={id}
            onClick={() => onNavigateTab(id)}
            className="press text-left rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex items-start gap-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-section-alt)] cursor-pointer"
          >
            <Icon className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
            <span className="min-w-0 space-y-0.5">
              <span className="block text-[13px] font-semibold text-[var(--text-primary)]">
                {label}
              </span>
              <span className="block text-[11px] text-[var(--text-muted)] leading-snug">
                {hint}
              </span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] ml-auto mt-0.5 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
});

OverviewDashboard.displayName = 'OverviewDashboard';
