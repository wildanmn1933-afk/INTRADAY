import React, { useMemo } from 'react';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  BarChart2,
  Compass,
  Flame,
  RefreshCw,
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
import { useLanguage } from '../lib/LanguageContext';

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
  onSelectEvent,
  onSyncWire,
  isSyncingWire = false,
}) => {
  const { t } = useLanguage();

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

    let overallRegime = t('ROTASI SEIMBANG', 'BALANCED / ROTATIONAL');
    let regimeStatus = 'NEUTRAL';
    if (bullishCount >= 7) {
      overallRegime = t('RISK-ON DOMINAN', 'RISK-ON DOMINANT');
      regimeStatus = 'BULLISH';
    } else if (bearishCount >= 7) {
      overallRegime = t('DEFENSIF / RISK-OFF', 'DEFENSIVE / RISK-OFF');
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
  }, [strengths, intradayMap, calendar, prices, t]);

  const activeRegime = globalRegime?.title || kpiStats.overallRegime;
  const riskScore = globalRegime?.riskScore ?? (kpiStats.bullishCount > kpiStats.bearishCount ? 20 : -10);
  const dxyBiasVsOpen = globalRegime?.dxyBiasVsOpen || 'AT_OPEN';

  return (
    <div className="space-y-4" id="terminal-overview-dashboard">
      {/* ======================================================== */}
      {/* 1. INSTITUTIONAL PAGE HEADER                             */}
      {/* ======================================================== */}
      <PageHeader
        eyebrow={t('overview.eyebrow')}
        accentNote={
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('overview.liveBadge')}</span>
          </span>
        }
        title={t('overview.title')}
        description={t('overview.desc')}
        actions={
          <div className="flex items-center gap-2">
            {onSyncWire && (
              <button
                onClick={onSyncWire}
                disabled={isSyncingWire}
                className="h-8 px-3 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50 font-mono"
                title={t('overview.syncTooltip')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWire ? 'animate-spin text-[var(--accent)]' : ''}`} />
                <span>{t('overview.syncBtn')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* ======================================================== */}
      {/* 2. MACRO REGIME & CONFLUENCE DOSSIER                     */}
      {/* ======================================================== */}
      <div className="terminal-panel p-4 sm:p-5 space-y-3 font-sans border" id="macro-regime-dossier-bar">
        {/* Header & Regime Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
              {t('overview.macroRegimeTitle')}
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[11px] text-[var(--text-muted)]">{t('overview.globalStance')}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                kpiStats.regimeStatus === 'BULLISH' || riskScore > 15
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : kpiStats.regimeStatus === 'BEARISH' || riskScore < -15
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  : 'bg-[var(--bg-section-alt)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              {activeRegime}
            </span>
          </div>
        </div>

        {/* Narrative Summary & Risk Appetite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          <div className="lg:col-span-8 space-y-2">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              {globalRegime?.summaryNarrative || t('overview.fallbackNarrative')}
            </p>
            {globalRegime?.topCatalystHeadline && (
              <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[11.5px] text-[var(--text-primary)] flex items-start gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                <span className="font-medium">{globalRegime.topCatalystHeadline}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 p-3 rounded-lg bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider">{t('overview.riskAppetite')}</span>
              <span className={`font-bold ${riskScore > 0 ? 'text-[var(--bullish)]' : riskScore < 0 ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}`}>
                {riskScore > 0 ? `+${riskScore}` : riskScore} / 100
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
              <div
                className={`h-full ${riskScore >= 0 ? 'bg-[var(--bullish)]' : 'bg-[var(--bearish)]'}`}
                style={{ width: `${Math.min(100, Math.max(10, Math.abs(riskScore)))}%` }}
              />
            </div>
            <div className="pt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              <span>{t('overview.dxyVsOpen')}</span>
              <span className={`font-bold ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'text-[var(--bearish)]' : dxyBiasVsOpen === 'BELOW_OPEN' ? 'text-[var(--bullish)]' : 'text-[var(--text-muted)]'}`}>
                {dxyBiasVsOpen === 'ABOVE_OPEN' ? t('overview.dxyAbove') : dxyBiasVsOpen === 'BELOW_OPEN' ? t('overview.dxyBelow') : t('overview.dxyBalanced')}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Core Asset Telemetry Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t text-xs font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
          {/* Item 1: DXY Quote */}
          <div className="p-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[9.5px] text-[var(--text-muted)] block tracking-wider uppercase">{t('overview.cardDxy')}</span>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[var(--text-primary)]">{kpiStats.dxy?.price.toFixed(2) || '101.24'}</span>
              <span className={`text-[10px] font-semibold ${((kpiStats.dxy?.change_24h_pct ?? 0) >= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {((kpiStats.dxy?.change_24h_pct ?? 0) >= 0) ? '+' : ''}{(kpiStats.dxy?.change_24h_pct ?? 0.18).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Item 2: Gold Spot */}
          <div className="p-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[9.5px] text-[var(--text-muted)] block tracking-wider uppercase">{t('overview.cardGold')}</span>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[var(--text-primary)]">${kpiStats.gold?.price.toFixed(1) || '2,654.8'}</span>
              <span className={`text-[10px] font-semibold ${((kpiStats.gold?.change_24h_pct ?? 0) >= 0) ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {((kpiStats.gold?.change_24h_pct ?? 0) >= 0) ? '+' : ''}{(kpiStats.gold?.change_24h_pct ?? 0.73).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Item 3: US10Y Benchmark */}
          <div className="p-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[9.5px] text-[var(--text-muted)] block tracking-wider uppercase">{t('overview.cardYield')}</span>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[var(--text-primary)]">{kpiStats.us10y?.price.toFixed(3) || '4.085'}%</span>
              <span className={`text-[10px] font-semibold ${
                (kpiStats.us10y?.change_24h_pct ?? 0) <= -0.05
                  ? 'text-[var(--bullish)]'
                  : (kpiStats.us10y?.change_24h_pct ?? 0) >= 0.05
                  ? 'text-[var(--bearish)]'
                  : 'text-[var(--text-muted)]'
              }`}>
                {(kpiStats.us10y?.change_24h_pct ?? 0) <= -0.05 ? '▼ EASING' : (kpiStats.us10y?.change_24h_pct ?? 0) >= 0.05 ? '▲ TIGHTENING' : '● FLAT'}
              </span>
            </div>
          </div>

          {/* Item 4: Next High Impact */}
          <div className="p-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[9.5px] text-[var(--text-muted)] block tracking-wider uppercase">{t('overview.cardCatalyst')}</span>
            <div className="font-bold text-[var(--text-primary)] truncate" title={kpiStats.upcomingHigh?.event_name}>
              {kpiStats.upcomingHigh?.event_name || t('overview.noUpcomingEvent')}
            </div>
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
            label: t('overview.cardMarketsTitle'),
            hint: t('overview.cardMarketsHint'),
          },
          {
            id: 'currency' as const,
            icon: TrendingUp,
            label: t('overview.cardCurrencyTitle'),
            hint: t('overview.cardCurrencyHint'),
          },
          {
            id: 'intermarket' as const,
            icon: Zap,
            label: t('overview.cardIntermarketTitle'),
            hint: t('overview.cardIntermarketHint'),
          },
          {
            id: 'history' as const,
            icon: Clock,
            label: t('overview.cardHistoryTitle'),
            hint: t('overview.cardHistoryHint'),
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
