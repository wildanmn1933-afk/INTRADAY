import React, { useState, useEffect } from 'react';
import { CurrencyStrength, HistoricalCurrencyComparison } from '../types';
import {
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Calendar,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  LineChart,
  BarChart3,
} from 'lucide-react';
import { Tooltip, MetricTooltip, MetricInfoIcon } from './Tooltip';
import { api } from '../lib/api';
import { CurrencyStrengthChart } from './CurrencyStrengthChart';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CurrencyStrengthWidgetProps {
  strengths: CurrencyStrength[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectCurrency?: (currency: string) => void;
  initialTab?: 'CHART' | 'LIVE' | 'COMPARISON' | 'ARCHIVE';
}

export const CurrencyStrengthWidget: React.FC<CurrencyStrengthWidgetProps> = React.memo(({
  strengths,
  onRefresh,
  isRefreshing,
  onSelectCurrency,
  initialTab = 'CHART',
}) => {
  const [subTab, setSubTab] = useState<'CHART' | 'LIVE' | 'COMPARISON' | 'ARCHIVE'>(initialTab);
  const [comparisons, setComparisons] = useState<HistoricalCurrencyComparison[]>([]);
  const [archiveDate, setArchiveDate] = useState<string>('2026-09-19');
  const [archiveStrengths, setArchiveStrengths] = useState<any[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState<boolean>(false);

  // Load historical comparisons when tab switches
  useEffect(() => {
    if (subTab === 'COMPARISON' && comparisons.length === 0) {
      api.getHistoricalCurrencyComparison()
        .then(res => {
          if (res.comparisons) setComparisons(res.comparisons);
        })
        .catch(err => console.error('[CurrencyStrength] Comparison load error:', err));
    }
  }, [subTab, comparisons.length]);

  // Load archive date strengths when archiveDate changes
  useEffect(() => {
    if (subTab === 'ARCHIVE') {
      setIsLoadingArchive(true);
      api.getDailySnapshotDetail(archiveDate)
        .then(res => {
          if (res.snapshot?.currency_strength) {
            setArchiveStrengths(res.snapshot.currency_strength);
          }
        })
        .catch(err => console.error('[CurrencyStrength] Archive date load error:', err))
        .finally(() => setIsLoadingArchive(false));
    }
  }, [subTab, archiveDate]);

  const getMeterColor = (score: number) => {
    if (score >= 7.0) return 'from-emerald-600 to-emerald-400';
    if (score >= 5.5) return 'from-emerald-700 to-teal-500';
    if (score >= 4.5) return 'from-cyan-700 to-cyan-500';
    if (score >= 3.0) return 'from-amber-600 to-rose-500';
    return 'from-rose-700 to-rose-500';
  };

  const getDirectionBadge = (dir: string) => {
    switch (dir) {
      case 'STRONG_BUY':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'BUY':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60';
      case 'NEUTRAL':
        return 'bg-slate-900 text-slate-400 border-slate-800';
      case 'SELL':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/60';
      case 'STRONG_SELL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-xs">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              CURRENCY STRENGTH MATRIX (G8)
            </h2>
            <MetricInfoIcon term="CURRENCY_STRENGTH" position="bottom" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500">
            <span>Source:</span>
            <a
              href="https://currency-strength.com/en/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              <span>currency-strength.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh currency strength scores"
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-neutral-950 hover:bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </Button>
      </div>

      {/* Mode Sub-Tabs via shadcn Tabs */}
      <Tabs value={subTab} onValueChange={(val) => setSubTab(val as any)} className="w-full mb-3">
        <TabsList className="grid w-full grid-cols-4 bg-neutral-950 border-neutral-800 h-8 p-0.5 text-[10px]">
          <TabsTrigger value="CHART" className="flex items-center gap-1 text-[10px] py-1">
            <LineChart className="w-3 h-3" />
            <span>Grafik</span>
          </TabsTrigger>
          <TabsTrigger value="LIVE" className="flex items-center gap-1 text-[10px] py-1">
            <BarChart3 className="w-3 h-3" />
            <span>Meter</span>
          </TabsTrigger>
          <TabsTrigger value="COMPARISON" className="text-[10px] py-1">
            7D Delta
          </TabsTrigger>
          <TabsTrigger value="ARCHIVE" className="text-[10px] py-1">
            Archive
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* VIEW 0: AUTHENTIC G8 MULTI-LINE TREND CHART (CURRENCY-STRENGTH.COM) */}
      {subTab === 'CHART' && (
        <div className="flex-1 flex flex-col min-h-[300px]">
          <CurrencyStrengthChart
            strengths={strengths}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onSelectCurrency={onSelectCurrency}
          />
        </div>
      )}

      {/* VIEW 1: LIVE FLOW METER */}
      {subTab === 'LIVE' && (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {strengths.map(item => {
            const pct = Math.min(100, Math.max(5, (item.strength_score / 10) * 100));

            return (
              <div
                key={item.currency}
                onClick={() => onSelectCurrency?.(item.currency)}
                className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <div className="flex items-center gap-2">
                    <Tooltip
                      title={`Peringkat #${item.rank} dari 8 Mata Uang Utama`}
                      content={`Mata uang ${item.currency} saat ini menempati peringkat ke-${item.rank} dalam kekuatan modal global.`}
                      position="top"
                    >
                      <span className="w-4 text-[10px] font-bold text-slate-500 text-center cursor-help">
                        #{item.rank}
                      </span>
                    </Tooltip>

                    <MetricTooltip term="CCY" underline={false}>
                      <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition cursor-help">
                        {item.currency}
                      </span>
                    </MetricTooltip>

                    <Tooltip
                      title="Arah Aliran Modal (Directional Flow)"
                      content={`Sentimen pasar saat ini untuk ${item.currency} berkategori ${item.change_direction.replace('_', ' ')}.`}
                      position="top"
                    >
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase tracking-wider cursor-help ${getDirectionBadge(item.change_direction)}`}>
                        {item.change_direction.replace('_', ' ')}
                      </span>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.raw_delta !== undefined && (
                      <span
                        className={`text-[10px] font-bold tabular-nums px-1 rounded ${
                          item.raw_delta >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                        title="Delta relatif basket mata uang dari 04:00 WIB open"
                      >
                        {item.raw_delta >= 0 ? `+${item.raw_delta.toFixed(2)}` : item.raw_delta.toFixed(2)}
                      </span>
                    )}
                    <MetricTooltip term="CURRENCY_STRENGTH" underline={false}>
                      <span className="font-bold text-slate-200 tabular-nums text-sm cursor-help hover:text-cyan-300 transition">
                        {item.strength_score.toFixed(1)}
                      </span>
                    </MetricTooltip>
                    <span className="text-[10px] text-slate-500">/ 10</span>
                  </div>
                </div>

                {/* Strength Visual Meter */}
                <Tooltip
                  title={`Kekuatan ${item.currency}: ${item.strength_score.toFixed(1)} / 10`}
                  content="Meter visual menunjukkan saturasi kekuatan mata uang. >7.0 menunjukkan dominasi bullish kuat; <3.0 menunjukkan pelemahan signifikan."
                  position="top"
                >
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60 cursor-help">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(item.strength_score)} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Tooltip>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 pt-1 border-t border-slate-900/80">
                  <MetricTooltip term="SSE_STATUS" underline={false}>
                    <span className="flex items-center gap-1 cursor-help hover:text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'LIVE' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                      {item.status}
                    </span>
                  </MetricTooltip>
                  <span>Updated: {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TODAY VS YESTERDAY VS 3D VS 7D TABLE */}
      {subTab === 'COMPARISON' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs font-mono">
          <div className="text-[10px] text-slate-400 p-2 rounded bg-slate-900/50 border border-slate-800/60">
            Historical delta tracking from persistent intervals:
          </div>

          {comparisons.map(c => {
            const isStrengthening = c.trend === 'STRENGTHENING';
            const isWeakening = c.trend === 'WEAKENING';

            return (
              <div
                key={c.currency}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100 text-sm">{c.currency}</span>
                  <Badge
                    variant={isStrengthening ? 'emerald' : isWeakening ? 'rose' : 'secondary'}
                    className="inline-flex items-center gap-1 text-[9px] uppercase font-bold"
                  >
                    {isStrengthening ? <ArrowUpRight className="w-2.5 h-2.5" /> : isWeakening ? <ArrowDownRight className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {c.trend}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] tabular-nums text-slate-300 bg-slate-950/60 p-1.5 rounded border border-slate-850 mb-1">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Today</span>
                    <span className="font-bold text-cyan-300">{c.today_score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Y-Day</span>
                    <span>{c.yesterday_score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">3-Day</span>
                    <span>{c.three_day_score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">7-Day</span>
                    <span>{c.seven_day_score.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>vs Yesterday: <strong className={c.delta_yesterday >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{c.delta_yesterday >= 0 ? '+' : ''}{c.delta_yesterday.toFixed(2)}</strong></span>
                  <span>7D Delta: <strong className={c.delta_7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{c.delta_7d >= 0 ? '+' : ''}{c.delta_7d.toFixed(2)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: BY DATE ARCHIVE */}
      {subTab === 'ARCHIVE' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs font-mono">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
              <Calendar className="w-3 h-3 text-cyan-400" />
              DATE:
            </span>
            <input
              type="date"
              value={archiveDate}
              onChange={e => e.target.value && setArchiveDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-hidden font-mono cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setArchiveDate('2026-09-20')}
              className={`px-2 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                archiveDate === '2026-09-20' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              20 Sep (Today)
            </button>
            <button
              onClick={() => setArchiveDate('2026-09-19')}
              className={`px-2 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                archiveDate === '2026-09-19' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              19 Sep (Yesterday)
            </button>
          </div>

          {isLoadingArchive ? (
            <div className="p-4 text-center text-slate-500 text-xs animate-pulse">
              Loading historical archive for {archiveDate}...
            </div>
          ) : (
            <div className="space-y-1.5 mt-2">
              {archiveStrengths.length > 0 ? (
                archiveStrengths.map((item: any) => (
                  <div
                    key={item.currency}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold text-[10px]">#{item.rank}</span>
                      <span className="font-bold text-slate-100">{item.currency}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getDirectionBadge(item.direction || 'NEUTRAL')}`}>
                        {(item.direction || 'NEUTRAL').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="font-bold text-cyan-300 tabular-nums">
                      {Number(item.score).toFixed(1)} / 10
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-slate-500 text-[11px]">
                  No archived currency snapshot found for {archiveDate}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Relative Currency Pairing Quick Insight */}
      {strengths.length >= 2 && subTab === 'LIVE' && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <MetricTooltip term="DIVERGENCE_DELTA" underline={false}>
              <span className="cursor-help hover:text-cyan-300">DISPERSION SPREAD:</span>
            </MetricTooltip>
            <span className="text-cyan-400 font-bold">
              {strengths[0]?.currency} / {strengths[strengths.length - 1]?.currency}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Strongest ({strengths[0]?.currency} @ {strengths[0]?.strength_score}) vs Weakest ({strengths[strengths.length - 1]?.currency} @ {strengths[strengths.length - 1]?.strength_score}) creates highest probability directional divergence.
          </p>
        </div>
      )}
    </div>
  );
});

CurrencyStrengthWidget.displayName = 'CurrencyStrengthWidget';
