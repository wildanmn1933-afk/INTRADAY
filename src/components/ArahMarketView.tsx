import React, { useState, useMemo } from 'react';
import {
  ArahMarketTodayData,
  IntradayPairConfluence,
  TripleConfluenceStatus,
  IntermarketSpreadItem,
} from '../types';
import {
  Target,
  RefreshCw,
  Clock,
  Compass,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  GitMerge,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { getCurrencyFlagUrl } from '../lib/assets';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EmptyState } from './shared/EmptyState';
import { LoadingState } from './shared/LoadingState';

interface ArahMarketViewProps {
  data: ArahMarketTodayData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onOpenChart: (symbol: string) => void;
}

export const ArahMarketView: React.FC<ArahMarketViewProps> = React.memo(({
  data,
  isLoading,
  onRefresh,
  isRefreshing,
  onOpenChart,
}) => {
  const [selectedPairFilter, setSelectedPairFilter] = useState<'ALL' | 'HIGH_CONVICTION' | 'MODERATE' | 'CAUTION'>('ALL');
  const [activeSpreadTab, setActiveSpreadTab] = useState<string>('all');
  const [selectedPairDetail, setSelectedPairDetail] = useState<IntradayPairConfluence | null>(null);

  // Filter pairs based on selector
  const filteredPairs = useMemo(() => {
    if (!data?.pairs) return [];
    if (selectedPairFilter === 'HIGH_CONVICTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'HIGH_CONVICTION');
    }
    if (selectedPairFilter === 'MODERATE') {
      return data.pairs.filter(p => p.confluenceStatus === 'MODERATE');
    }
    if (selectedPairFilter === 'CAUTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'CAUTION_TRAP' || p.confluenceStatus === 'NEUTRAL_CHOP');
    }
    return data.pairs;
  }, [data, selectedPairFilter]);

  if (isLoading && !data) {
    return (
      <div className="py-12">
        <LoadingState
          variant="cards"
          count={3}
          message="Memuat Sintesis Arah Market Hari Ini..."
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
          title="Data Arah Market Belum Tersedia"
          description="Sistem sedang menyelaraskan pilar data fundamental, intermarket, dan harga sesi."
          action={{
            label: 'Muat Ulang',
            onClick: onRefresh,
          }}
        />
      </div>
    );
  }

  const { activeSession, sessionStatusText, globalRegime, intermarketSpreads, anomalyAlerts, pairs } = data;

  const getConfluenceBadge = (status: TripleConfluenceStatus) => {
    switch (status) {
      case 'HIGH_CONVICTION':
        return {
          label: '3/3 HIGH CONVICTION',
          bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
          dot: 'bg-emerald-400',
        };
      case 'MODERATE':
        return {
          label: '2/3 MODERATE CONFLUENCE',
          bg: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
          dot: 'bg-cyan-400',
        };
      case 'CAUTION_TRAP':
        return {
          label: '1/3 CAUTION / POTENTIAL TRAP',
          bg: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'NEUTRAL_CHOP':
      default:
        return {
          label: 'CHOPPY / MIXED FLOWS',
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. TOP HEADER & SESSION BAROMETER */}
      <div className="bg-[#0b0d14] border border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span>INTRADAY TRIPLE-CONFLUENCE</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.06] text-slate-300 text-[10px] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-bold text-white">{activeSession} SESSION</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>ARAH MARKET HARI INI</span>
              <Target className="w-5 h-5 text-cyan-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
              {sessionStatusText} — Mengintegrasikan arah fundamental, transmisi intermarket (yields & DXY), serta struktur pergerakan harga sesi berjalan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-xs font-mono font-semibold text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>Sinkronkan Sesi</span>
            </button>
          </div>
        </div>

        {/* Global Regime Banner */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                  GLOBAL INTRADAY REGIME
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${globalRegime.badgeColor}`}>
                  {globalRegime.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {globalRegime.summaryNarrative}
              </p>
            </div>

            {globalRegime.topCatalystHeadline && (
              <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-slate-400">
                <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-200">Katalis Penggerak:</strong> {globalRegime.topCatalystHeadline}
                </span>
              </div>
            )}
          </div>

          {/* DXY Session Open Position & Risk Gauge */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                <span className="uppercase font-bold">DXY vs Session Open:</span>
                <span className={`font-black px-1.5 py-0.2 rounded ${
                  globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                }`}>
                  {globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN' ? '▲ DI ATAS OPEN (DOLLAR BULLISH)' : '▼ DI BAWAH OPEN (DOLLAR BEARISH)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug font-sans">
                Posisi DXY relatif terhadap harga pembukaan sesi menentukan arah tarikan gravitasi seluruh pasangan valuta mayor.
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Risk Appetite Score:</span>
              <span className={`font-bold ${globalRegime.riskScore > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {globalRegime.riskScore > 0 ? `+${globalRegime.riskScore}` : globalRegime.riskScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERMARKET SPREAD ENGINE & ANOMALY ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Anomaly Alerts Strip (1 col on large) */}
        <div className="lg:col-span-1 bg-[#0b0d14] border border-white/[0.08] rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>RADAR ANOMALI SESI</span>
            </div>
            {anomalyAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                  alert.severity === 'WARNING'
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                }`}
              >
                <div className="font-bold text-[11px] leading-tight flex items-center gap-1">
                  <span>{alert.title}</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90 font-sans">
                  {alert.description}
                </p>
                <div className="pt-1 border-t border-white/[0.06] text-[10px] font-mono text-slate-300">
                  <strong className="text-white">Panduan:</strong> {alert.actionAdvice}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1">
            *Deteksi anomali memfilter jebakan likuiditas (*fakeouts*).
          </div>
        </div>

        {/* 4 Intermarket Spreads Cards (3 cols on large) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {intermarketSpreads.map(spread => (
            <div
              key={spread.id}
              className="p-3 rounded-xl bg-[#0b0d14] border border-white/[0.08] hover:border-white/[0.16] transition flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider">{spread.formulaLabel}</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-cyan-300 border border-white/[0.08] font-bold">
                    {spread.targetPair}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate mb-1.5 font-mono" title={spread.name}>
                  {spread.name}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-mono font-black text-white">
                    {spread.currentValue > 0 ? `+${spread.currentValue}` : spread.currentValue}{spread.unit}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${spread.changeSessionBps >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {spread.changeSessionBps >= 0 ? `+${spread.changeSessionBps} bps` : `${spread.changeSessionBps} bps`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 leading-snug font-sans">
                {spread.interpretation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PRIMARY CONFLUENCE PAIRS BOARD */}
      <div className="bg-[#0b0d14] border border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-xs">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Papan Konfluensi Pasangan Intraday</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredPairs.length} instrumen aktif)
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Setiap aset dianalisis melalui 3 saringan: Fundamental, Intermarket, dan Struktur Price Action.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedPairFilter === 'ALL' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPairFilter('ALL')}
              className={`h-7 px-2.5 text-xs font-mono font-semibold ${
                selectedPairFilter === 'ALL'
                  ? 'bg-white/[0.12] text-cyan-300 font-bold border border-cyan-400/40'
                  : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Semua ({pairs.length})
            </Button>
            <Button
              variant={selectedPairFilter === 'HIGH_CONVICTION' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPairFilter('HIGH_CONVICTION')}
              className={`h-7 px-2.5 text-xs font-mono font-semibold ${
                selectedPairFilter === 'HIGH_CONVICTION'
                  ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/50'
                  : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              3/3 High Conviction
            </Button>
            <Button
              variant={selectedPairFilter === 'MODERATE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPairFilter('MODERATE')}
              className={`h-7 px-2.5 text-xs font-mono font-semibold ${
                selectedPairFilter === 'MODERATE'
                  ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              2/3 Moderate
            </Button>
            <Button
              variant={selectedPairFilter === 'CAUTION' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPairFilter('CAUTION')}
              className={`h-7 px-2.5 text-xs font-mono font-semibold ${
                selectedPairFilter === 'CAUTION'
                  ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-500/50'
                  : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              Waspada / Trap
            </Button>
          </div>
        </div>

        {/* Pair Grid */}
        {filteredPairs.length === 0 ? (
          <EmptyState
            icon={<Target className="w-6 h-6 text-neutral-400" />}
            title="Tidak Ada Pasangan Sesuai Filter"
            description="Coba ubah kriteria filter konfluensi untuk menampilkan instrumen lain."
            action={{
              label: 'Tampilkan Semua Instrumen',
              onClick: () => setSelectedPairFilter('ALL'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {filteredPairs.map(p => {
            const badge = getConfluenceBadge(p.confluenceStatus);
            const isBullish = p.directionalBias.includes('BULLISH');
            const isBearish = p.directionalBias.includes('BEARISH');

            // Flag URLs for dual currencies
            const c1 = p.pair.length === 6 ? p.pair.slice(0, 3) : null;
            const c2 = p.pair.length === 6 ? p.pair.slice(3, 6) : null;

            return (
              <div
                key={p.pair}
                className="rounded-xl border border-white/[0.08] bg-[#07090e] hover:border-cyan-400/40 transition-all duration-200 p-3.5 flex flex-col justify-between group shadow-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]"
              >
                <div>
                  {/* Top Bar: Flags, Pair, & Bias Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {c1 && c2 ? (
                        <div className="flex items-center -space-x-1 shrink-0">
                          <img
                            src={getCurrencyFlagUrl(c1)}
                            alt={c1}
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-2.5 object-cover rounded-xs border border-white/[0.1] shadow-xs"
                          />
                          <img
                            src={getCurrencyFlagUrl(c2)}
                            alt={c2}
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-2.5 object-cover rounded-xs border border-white/[0.1] shadow-xs"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[9px] font-mono font-bold text-cyan-400 shrink-0">
                          {p.pair === 'BTC' ? '₿' : p.pair === 'US100' ? 'NQ' : p.pair === 'US30' ? 'YM' : p.pair === 'US500' ? 'ES' : '●'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-black font-mono text-white group-hover:text-cyan-300 transition">
                          {p.pair}
                        </h3>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {p.displayName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {p.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                      </div>
                      <div className={`text-[10px] font-mono font-bold ${p.change24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.change24hPct >= 0 ? `+${p.change24hPct.toFixed(2)}%` : `${p.change24hPct.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>

                  {/* Confluence Status Banner */}
                  <div className={`mb-3 px-2 py-1 rounded-md border text-[10px] font-mono font-bold flex items-center justify-between ${badge.bg}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>
                    <span className="font-extrabold">{p.convictionScore}%</span>
                  </div>

                  {/* Currency Strength Confluence (Khusus Forex Pairs) */}
                  {p.currencyStrength ? (
                    <div className="mb-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] font-mono">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          CURRENCY STRENGTH:
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-extrabold text-[9px] ${
                          p.currencyStrength.alignment === 'CONFIRMED'
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80'
                            : p.currencyStrength.alignment === 'DIVERGENCE'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-800/80 animate-pulse'
                            : 'bg-white/[0.06] text-slate-300 border border-white/[0.1]'
                        }`}>
                          {p.currencyStrength.alignment === 'CONFIRMED' ? '✓ CS CONFIRMED' : p.currencyStrength.alignment === 'DIVERGENCE' ? '⚠ CS DIVERGENCE' : 'CS NEUTRAL'}
                        </span>
                      </div>

                      {/* Base vs Quote Meters */}
                      <div className="flex items-center justify-between gap-1 text-[10px] py-1 px-1.5 rounded bg-black/40 border border-white/[0.04]">
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-white">{p.currencyStrength.baseCurrency}</span>
                          <span className="text-slate-500 text-[9px]">#{p.currencyStrength.baseRank}</span>
                          <span className={`font-bold ${p.currencyStrength.baseScore >= 5.5 ? 'text-emerald-400' : p.currencyStrength.baseScore <= 3.5 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {p.currencyStrength.baseScore.toFixed(1)}
                          </span>
                        </div>

                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold ${
                          p.currencyStrength.netDifferential > 0.3
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                            : p.currencyStrength.netDifferential < -0.3
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                            : 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'
                        }`}>
                          Δ {p.currencyStrength.netDifferential > 0 ? `+${p.currencyStrength.netDifferential.toFixed(1)}` : p.currencyStrength.netDifferential.toFixed(1)}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${p.currencyStrength.quoteScore >= 5.5 ? 'text-emerald-400' : p.currencyStrength.quoteScore <= 3.5 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {p.currencyStrength.quoteScore.toFixed(1)}
                          </span>
                          <span className="text-slate-500 text-[9px]">#{p.currencyStrength.quoteRank}</span>
                          <span className="font-extrabold text-white">{p.currencyStrength.quoteCurrency}</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 mt-1 truncate">
                        {p.currencyStrength.advantageLabel}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2.5 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.06] text-[9px] font-mono text-slate-400 flex items-center justify-between">
                      <span className="text-slate-500 uppercase">DRIVER BENCHMARK:</span>
                      <span className="font-bold text-cyan-400">
                        {p.pair === 'XAUUSD' ? 'Real Yields & DXY' : p.pair === 'BTC' ? 'M2 & Risk Appetite' : 'Yields & Earnings Rotation'}
                      </span>
                    </div>
                  )}

                  {/* 3 Pillars Breakdown */}
                  <div className="space-y-1.5 mb-3 text-[11px] font-mono bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.06]">
                    {/* Fundamental */}
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-slate-400 text-[10px] shrink-0">1. FUNDAMENTAL:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.fundamental.bias === 'BULLISH' ? 'text-emerald-300' : p.fundamental.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.fundamental.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight mb-1">
                      {p.fundamental.keyDriver}
                    </div>

                    {/* Intermarket */}
                    <div className="flex items-start justify-between gap-1 pt-1 border-t border-white/[0.06]">
                      <span className="text-slate-400 text-[10px] shrink-0">2. INTERMARKET:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.intermarket.bias === 'BULLISH' ? 'text-emerald-300' : p.intermarket.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.intermarket.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight mb-1">
                      {p.intermarket.primarySymptom}
                    </div>

                    {/* Price Action */}
                    <div className="flex items-start justify-between gap-1 pt-1 border-t border-white/[0.06]">
                      <span className="text-slate-400 text-[10px] shrink-0">3. PRICE ACTION:</span>
                      <span className={`text-[10px] font-bold text-right truncate ${
                        p.priceAction.bias === 'BULLISH' ? 'text-emerald-300' : p.priceAction.bias === 'BEARISH' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {p.priceAction.bias}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                      {p.priceAction.actionableZone}
                    </div>
                  </div>
                </div>

                {/* Bottom Gameplan & Actions */}
                <div className="pt-2 border-t border-white/[0.06]">
                  {p.intradayPlan.warningNote && (
                    <div className="mb-2 p-1.5 rounded bg-amber-950/50 border border-amber-800/60 text-[9px] font-mono text-amber-300 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{p.intradayPlan.warningNote}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Intraday Plan:</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      p.intradayPlan.recommendedAction === 'LOOK_FOR_BUY'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                        : p.intradayPlan.recommendedAction === 'LOOK_FOR_SELL'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                        : 'bg-white/[0.06] text-slate-300 border border-white/[0.08]'
                    }`}>
                      {p.intradayPlan.recommendedAction.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChart(p.tvSymbol || p.pair)}
                      className="flex-1 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-400/50 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Buka Chart</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
});

ArahMarketView.displayName = 'ArahMarketView';
