import React, { useState, useMemo } from 'react';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Radio,
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  LineChart,
  Newspaper,
  Target,
} from 'lucide-react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  IntradayAssetBias,
  TodayCatalyst,
} from '../types';
import { CurrencyStrengthWidget } from './CurrencyStrengthWidget';
import { MarketDataGrid } from './MarketDataGrid';
import { ExecutiveMarketBrief } from './ExecutiveMarketBrief';
import { NavTabId } from './Sidebar';
import { getCurrencyFlagUrl } from '../lib/assets';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { EmptyState } from './shared/EmptyState';

interface OverviewDashboardProps {
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  events: MarketEvent[];
  calendar: EconomicEvent[];
  overview: AIAnalysis | null;
  watchlistSymbols: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onToggleWatchlist: (symbol: string, assetType: string) => void;
  onOpenChart: (symbol: string) => void;
  onSelectEvent: (eventId: string) => void;
  onRefreshPrices: () => Promise<void>;
  isRefreshingPrices: boolean;
  onRefreshCS: () => Promise<void>;
  isRefreshingCS: boolean;
  onSyncWire: () => Promise<void>;
  isSyncingWire: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = React.memo(({
  intradayMap,
  todayCatalysts,
  prices,
  strengths,
  events,
  calendar,
  overview,
  watchlistSymbols,
  selectedSymbol,
  onSelectSymbol,
  onNavigateTab,
  onToggleWatchlist,
  onOpenChart,
  onSelectEvent,
  onRefreshPrices,
  isRefreshingPrices,
  onRefreshCS,
  isRefreshingCS,
  onSyncWire,
  isSyncingWire,
}) => {
  // Top News wire toggle: News wire vs Economic calendar
  const [newsFeedTab, setNewsFeedTab] = useState<'news' | 'calendar'>('news');
  // News impact filter: default to HIGH impact so traders see accurate pair impacts
  const [wireImpactFilter, setWireImpactFilter] = useState<'HIGH' | 'ALL'>('HIGH');

  // High impact filtered events (CRITICAL + HIGH)
  const highImpactEvents = useMemo(() => {
    return events.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH');
  }, [events]);

  const wireDisplayEvents = useMemo(() => {
    if (wireImpactFilter === 'HIGH') {
      return highImpactEvents;
    }
    return events;
  }, [wireImpactFilter, highImpactEvents, events]);

  // Executive KPI calculations
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
    let regimeColor = 'text-amber-300';
    let regimeBadge = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    if (bullishCount >= 7) {
      overallRegime = 'RISK-ON DOMINANT';
      regimeColor = 'text-emerald-400';
      regimeBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    } else if (bearishCount >= 7) {
      overallRegime = 'DEFENSIVE / RISK-OFF';
      regimeColor = 'text-rose-400';
      regimeBadge = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    }

    const upcomingHigh = calendar.find(
      c => c.status === 'UPCOMING' && (c.impact === 'CRITICAL' || c.impact === 'HIGH')
    );

    return {
      strongest,
      weakest,
      bullishCount,
      bearishCount,
      overallRegime,
      regimeColor,
      regimeBadge,
      upcomingHigh,
    };
  }, [strengths, intradayMap, calendar]);

  return (
    <div className="space-y-3.5" id="terminal-overview-dashboard">
      {/* ======================================================== */}
      {/* 0. PROFESSIONAL WELCOME & MACRO SURVEILLANCE HERO BANNER */}
      {/* ======================================================== */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0b0d14] shadow-xs relative overflow-hidden">
        {/* Subtle Linear Pro Ambient Grid Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.03] via-transparent to-blue-500/[0.03] pointer-events-none" />

        {/* Banner Content Container */}
        <div className="relative z-10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Content Column */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-cyan-300 text-[10.5px] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                SURVEILLANCE & MACRO TELEMETRY
              </span>
              <span className="text-[10px] font-mono text-slate-500">LIVE FEED</span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              Portal Intelijen & Analisis Makro Pasar Finansial
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-400 font-sans leading-relaxed">
              Pantau disparitas mata uang G8, arah bias 13 instrumen utama hari ini, dan transmisi intermarket obligasi, emas, saham, serta minyak secara real-time.
            </p>

            {/* Quick Navigation Action Pills - Standardized shadcn Buttons */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
              <Button
                onClick={() => onNavigateTab('arah_market')}
                size="sm"
                className="h-7.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-sans flex items-center gap-2"
              >
                <Target className="w-3.5 h-3.5 text-slate-950" />
                <span>Arah Market Hari Ini</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[9px] bg-slate-950 text-cyan-300 font-mono font-bold">
                  INTRADAY
                </Badge>
              </Button>
              <Button
                onClick={() => onNavigateTab('terminal')}
                variant="outline"
                size="sm"
                className="h-7.5 px-3 bg-white/[0.03] hover:bg-white/[0.06] text-neutral-200 border-white/[0.08]"
              >
                <span>Market Map 13 Aset</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </Button>
              <Button
                onClick={() => onNavigateTab('currency')}
                variant="outline"
                size="sm"
                className="h-7.5 px-3 bg-white/[0.03] hover:bg-white/[0.06] text-neutral-200 border-white/[0.08]"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kekuatan G8</span>
              </Button>
              <Button
                onClick={() => onNavigateTab('intermarket')}
                variant="outline"
                size="sm"
                className="h-7.5 px-3 bg-white/[0.03] hover:bg-white/[0.06] text-neutral-200 border-white/[0.08]"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Intermarket Flow</span>
              </Button>
            </div>
          </div>

          {/* Right Highlight Box: Top Currency Winner & Loser at a Glance */}
          <div className="shrink-0 bg-[#07090e] border border-white/[0.08] rounded-lg p-3 space-y-2 min-w-[250px]">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.06]">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5 text-xs font-sans">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Disparitas Sesi Ini
              </span>
              <Badge variant="emerald" className="text-[9.5px] font-mono font-bold px-1.5 py-0">
                LIVE
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {kpiStats.strongest && (
                    <img
                      src={getCurrencyFlagUrl(kpiStats.strongest.currency)}
                      alt={kpiStats.strongest.currency}
                      referrerPolicy="no-referrer"
                      className="w-5 h-3.5 object-cover rounded-xs"
                    />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white font-mono">{kpiStats.strongest?.currency || 'USD'}</span>
                    <span className="text-[9.5px] text-neutral-400 block font-sans">Terkuat (Lead)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                  {kpiStats.strongest?.strength_score.toFixed(1) || '0.0'} pts
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {kpiStats.weakest && (
                    <img
                      src={getCurrencyFlagUrl(kpiStats.weakest.currency)}
                      alt={kpiStats.weakest.currency}
                      referrerPolicy="no-referrer"
                      className="w-5 h-3.5 object-cover rounded-xs"
                    />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white font-mono">{kpiStats.weakest?.currency || 'JPY'}</span>
                    <span className="text-[9.5px] text-neutral-400 block font-sans">Terlemah (Lag)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400 font-mono tabular-nums">
                  {kpiStats.weakest?.strength_score.toFixed(1) || '0.0'} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP EXECUTIVE KPI TELEMETRY STRIP (SHADCN CARD SYSTEM) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Macro Market Regime */}
        <Card className="bg-[#0b0d14] border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 shadow-xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 font-semibold">
                <Flame className="w-3 h-3 text-cyan-400" />
                <span>MARKET REGIME</span>
              </span>
              <div className={`text-xs font-mono font-bold ${kpiStats.regimeColor}`}>
                {kpiStats.overallRegime}
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <span className={`px-2 py-0.5 rounded font-bold border ${kpiStats.regimeBadge}`}>
                {kpiStats.bullishCount}B / {kpiStats.bearishCount}S
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: G8 Divergence Lead */}
        <Card className="bg-[#0b0d14] border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 shadow-xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 font-semibold">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>G8 LEAD VS LAG</span>
              </span>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400">
                  {kpiStats.strongest?.currency || '—'}{' '}
                  <span className="text-[11px]">({kpiStats.strongest?.strength_score.toFixed(0)}pt)</span>
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-rose-400">
                  {kpiStats.weakest?.currency || '—'}{' '}
                  <span className="text-[11px]">({kpiStats.weakest?.strength_score.toFixed(0)}pt)</span>
                </span>
              </div>
            </div>
            <Button
              onClick={() => onNavigateTab('currency')}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-white/[0.04] border-white/[0.08]"
            >
              Matrix →
            </Button>
          </CardContent>
        </Card>

        {/* KPI 3: Next Key Catalyst */}
        <Card className="bg-[#0b0d14] border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 shadow-xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5 truncate pr-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 font-semibold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>IMMINENT CATALYST</span>
              </span>
              <div className="text-xs font-mono font-bold text-neutral-200 truncate">
                {kpiStats.upcomingHigh ? (
                  <span className="flex items-center gap-1.5 truncate">
                    <Badge variant="secondary" className="px-1 py-0 text-[10px] text-cyan-300">
                      {kpiStats.upcomingHigh.currency}
                    </Badge>
                    <span className="truncate">{kpiStats.upcomingHigh.event_name}</span>
                  </span>
                ) : (
                  <span className="text-neutral-400">No imminent release</span>
                )}
              </div>
            </div>
            {kpiStats.upcomingHigh && (
              <Badge variant="amber" className="text-[10px] font-mono shrink-0 font-semibold px-2 py-0.5">
                {new Date(kpiStats.upcomingHigh.date_time_utc).toLocaleTimeString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* KPI 4: Active Intermarket Flow */}
        <Card className="bg-[#0b0d14] border-white/[0.08] hover:border-white/[0.16] transition-all duration-150 shadow-xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 font-semibold">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span>CROSS-ASSET TRANSMISSION</span>
              </span>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span className="text-indigo-400 font-mono">DXY • XAU • US10Y • SPX</span>
              </div>
            </div>
            <Button
              onClick={() => onNavigateTab('intermarket')}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] font-mono font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800/80"
            >
              Intermarket →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 2. EXECUTIVE MARKET SYNTHESIS & TRADE ENTRY SIGNALS       */}
      {/*    (KESIMPULAN PASAR HARI INI & SARAN ENTRY PAIR)        */}
      {/* ======================================================== */}
      <ExecutiveMarketBrief
        strengths={strengths}
        intradayMap={intradayMap}
        todayCatalysts={todayCatalysts}
        prices={prices}
        calendar={calendar}
        onOpenChart={onOpenChart}
        onSelectSymbol={onSelectSymbol}
      />

      {/* ======================================================== */}
      {/* 3. TOP SECTION: BREAKING NEWS WIRE & MACRO RADAR         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: LIVE FLASH NEWS WIRE (8 COLS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-[#0b0d14] border border-white/[0.08] rounded-xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
              {/* Wire Mode Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tabs value={newsFeedTab} onValueChange={(v) => setNewsFeedTab(v as any)}>
                  <TabsList className="h-8 bg-white/[0.02] border-white/[0.06]">
                    <TabsTrigger value="news" className="h-7 px-2.5 text-xs font-mono flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>BREAKING NEWS WIRE</span>
                      <Badge variant="cyan" className="text-[9px] px-1 py-0 font-bold ml-1">
                        {events.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="h-7 px-2.5 text-xs font-mono flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>ECONOMIC CALENDAR</span>
                      <Badge variant="amber" className="text-[9px] px-1 py-0 font-bold ml-1">
                        {calendar.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* News Impact Filter: High Impact Focus vs All */}
                {newsFeedTab === 'news' && (
                  <div className="flex items-center gap-1 bg-white/[0.02] p-0.5 rounded-lg border border-white/[0.06] text-[10px] font-mono">
                    <Button
                      onClick={() => setWireImpactFilter('HIGH')}
                      variant={wireImpactFilter === 'HIGH' ? 'destructive' : 'ghost'}
                      size="sm"
                      className={`h-7 px-2 text-[10px] font-mono flex items-center gap-1 ${
                        wireImpactFilter === 'HIGH'
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-800/80 shadow-xs'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Saring hanya berita berdampak tinggi (High & Critical) agar korelasi pair akurat"
                    >
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>HIGH IMPACT ONLY</span>
                      <Badge variant="secondary" className="text-[8.5px] px-1 py-0 bg-rose-900/60 text-rose-200 font-extrabold ml-0.5">
                        {highImpactEvents.length}
                      </Badge>
                    </Button>

                    <Button
                      onClick={() => setWireImpactFilter('ALL')}
                      variant={wireImpactFilter === 'ALL' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-7 px-2 text-[10px] font-mono ${
                        wireImpactFilter === 'ALL'
                          ? 'bg-white/[0.08] text-white font-bold border border-white/[0.1]'
                          : 'text-neutral-400 hover:text-neutral-300'
                      }`}
                      title="Tampilkan semua berita tanpa filter dampak"
                    >
                      <span>SEMUA ({events.length})</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {newsFeedTab === 'news' ? (
                  <>
                    <Button
                      onClick={onSyncWire}
                      disabled={isSyncingWire}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] font-mono text-neutral-300 hover:text-cyan-300 bg-white/[0.04] border-white/[0.08]"
                      title="Sync Wire Feeds"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingWire ? 'animate-spin text-cyan-400' : ''}`} />
                      <span className="hidden sm:inline">Sync</span>
                    </Button>
                    <Button
                      onClick={() => onNavigateTab('events')}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold bg-white/[0.04] border-white/[0.08]"
                    >
                      <span>Full News Wire</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => onNavigateTab('macro')}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold bg-white/[0.04] border-white/[0.08]"
                  >
                    <span>Full Calendar</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* HIGH-DENSITY BLOOMBERG WIRE STREAM (5 Rows Max, Instant Scan) */}
            {newsFeedTab === 'news' ? (
               wireDisplayEvents.length === 0 ? (
                 <EmptyState
                   icon={<Flame className="w-5 h-5 text-rose-400" />}
                   title={`Tidak ada berita ${wireImpactFilter === 'HIGH' ? 'High Impact' : ''} saat ini`}
                   description="Feed wire institutional diperbarui real-time saat ada breaking market headline."
                   action={wireImpactFilter === 'HIGH' ? {
                     label: `Lihat semua berita (${events.length})`,
                     onClick: () => setWireImpactFilter('ALL'),
                   } : undefined}
                 />
               ) : (
                 <div className="divide-y divide-white/[0.06] font-mono text-xs">
                   {wireDisplayEvents.slice(0, 5).map(event => {
                     const eventDate = new Date(event.last_updated_at || event.first_detected_at);
                     const eventTime = isNaN(eventDate.getTime())
                       ? 'LIVE'
                       : eventDate.toLocaleTimeString('id-ID', {
                           timeZone: 'Asia/Jakarta',
                           hour12: false,
                           hour: '2-digit',
                           minute: '2-digit',
                         });

                     const isCritical = event.impact_level === 'CRITICAL';
                     const isHigh = event.impact_level === 'HIGH';

                     // Sort pair impacts so that high-confidence directional impacts appear first
                     const sortedPairs = (event.pair_impacts || []).slice().sort((a, b) => {
                       if (a.bias !== 'NEUTRAL' && b.bias === 'NEUTRAL') return -1;
                       if (a.bias === 'NEUTRAL' && b.bias !== 'NEUTRAL') return 1;
                       return 0;
                     });

                     return (
                       <div
                         key={event.id}
                         onClick={() => onSelectEvent(event.id)}
                         className={`py-2 px-2 hover:bg-white/[0.04] rounded transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                           isCritical ? 'bg-rose-950/20' : isHigh ? 'bg-amber-950/15' : ''
                         }`}
                       >
                         <div className="flex items-center gap-2 min-w-0">
                           <span className="text-[10px] text-neutral-400 font-bold shrink-0">
                             {eventTime}
                           </span>
                           <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-bold text-cyan-300 shrink-0">
                             {event.source_names?.[0] || 'WIRE'}
                           </Badge>
                           <p className="text-neutral-200 font-sans text-xs font-medium truncate" title={event.title}>
                             {event.title}
                           </p>
                         </div>

                         <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                           {/* Correlated Pair Impacts & Directional Bias Badges */}
                           {sortedPairs.slice(0, 2).map(pi => (
                             <Badge
                               key={pi.pair}
                               variant={pi.bias === 'BULLISH' ? 'emerald' : pi.bias === 'BEARISH' ? 'destructive' : 'secondary'}
                               className="text-[8.5px] px-1.5 py-0 font-bold font-mono flex items-center gap-1"
                               title={`${pi.displayName || pi.pair}: ${pi.bias} - ${pi.mechanism || pi.rationale}`}
                             >
                               <span>{pi.pair}</span>
                               <span className="font-extrabold">
                                 {pi.bias === 'BULLISH' ? '▲' : pi.bias === 'BEARISH' ? '▼' : '●'}
                               </span>
                             </Badge>
                           ))}

                           {/* Category */}
                           <Badge variant="outline" className="text-[8.5px] px-1.5 py-0 font-bold text-neutral-300">
                             {event.primary_category}
                           </Badge>

                           {/* Impact Level Badge */}
                           <Badge
                             variant={isCritical ? 'destructive' : isHigh ? 'amber' : 'outline'}
                             className="text-[8.5px] px-1.5 py-0 font-bold flex items-center gap-1"
                           >
                             {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                             {isCritical ? '⚡ CRITICAL' : isHigh ? '🔥 HIGH' : event.impact_level}
                           </Badge>

                           <Button
                             variant="link"
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               onSelectEvent(event.id);
                             }}
                             className="h-auto p-0 text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1"
                           >
                             Inspect
                           </Button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )
            ) : (
              /* High-density Calendar rows */
              <div className="divide-y divide-white/[0.06] font-mono text-xs">
                {calendar.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="py-2 px-2 hover:bg-white/[0.04] rounded transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Badge variant="secondary" className="px-1.5 py-0 text-cyan-300 font-bold text-[10px] shrink-0">
                        {item.currency}
                      </Badge>
                      <span className="text-neutral-200 truncate font-sans text-xs">{item.event_name}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="text-cyan-400 font-bold">
                        {new Date(item.date_time_utc).toLocaleTimeString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                      <Badge
                        variant={item.impact === 'CRITICAL' || item.impact === 'HIGH' ? 'destructive' : 'outline'}
                        className="text-[8.5px] px-1.5 py-0 font-bold"
                      >
                        {item.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TODAY'S MACRO RADAR & AI SYNTHESIS (4 COLS) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Today's Key Catalysts (Compact 3 items) */}
          <Card className="bg-[#0b0d14] border-white/[0.08] shadow-xs">
            <CardContent className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    TODAY'S MACRO RADAR
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => onNavigateTab('today_catalysts')}
                  className="h-auto p-0 text-[10px] font-mono text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {todayCatalysts.slice(0, 3).map(cat => (
                  <div
                    key={cat.id}
                    className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1 font-mono hover:border-white/[0.12] transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-bold text-[9px] text-cyan-300 px-1 py-0">
                          {cat.currency}
                        </Badge>
                        <span className="text-[10px] font-bold text-neutral-200 truncate max-w-[140px]">
                          {cat.event_name}
                        </span>
                      </div>
                      <Badge
                        variant={cat.status === 'RELEASED' ? 'emerald' : 'amber'}
                        className="text-[8px] px-1 py-0 font-bold"
                      >
                        {cat.status}
                      </Badge>
                    </div>

                    <div className="text-[10px] text-neutral-400 font-sans line-clamp-1">
                      <span className="text-cyan-400 font-mono font-semibold text-[9px] mr-1">HASIL:</span>
                      {cat.actual_market_reaction}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Macro Synthesis Digest */}
          {overview && (
            <Card className="bg-[#0b0d14] border-white/[0.08] shadow-xs">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI MACRO SYNTHESIS</span>
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    type="button"
                    onClick={() => onNavigateTab('intelligence')}
                    className="h-auto p-0 text-[10px] font-mono text-neutral-400 hover:text-cyan-300"
                  >
                    Deep Analysis →
                  </Button>
                </div>
                <p className="text-[11px] text-neutral-300 font-sans leading-relaxed line-clamp-2">
                  {overview.summary}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LOWER SECTION: MARKET SURVEILLANCE & G8 CURRENCY FLOW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: LIVE MARKET SURVEILLANCE (8 COLS) */}
        <div className="lg:col-span-8">
          <MarketDataGrid
            prices={prices}
            watchlistSymbols={watchlistSymbols}
            intradayMap={intradayMap}
            onToggleWatchlist={onToggleWatchlist}
            onRefresh={onRefreshPrices}
            isRefreshing={isRefreshingPrices}
            onSelectSymbol={onSelectSymbol}
            onOpenChart={onOpenChart}
          />
        </div>

        {/* RIGHT COLUMN: G8 CURRENCY STRENGTH WITH AUTHENTIC TREND GRAPH (4 COLS) */}
        <div className="lg:col-span-4">
          <CurrencyStrengthWidget
            strengths={strengths}
            onRefresh={onRefreshCS}
            isRefreshing={isRefreshingCS}
            onSelectCurrency={(cur) => onSelectSymbol(cur === selectedSymbol ? null : cur)}
            initialTab="CHART"
          />
        </div>
      </div>
    </div>
  );
});

OverviewDashboard.displayName = 'OverviewDashboard';
