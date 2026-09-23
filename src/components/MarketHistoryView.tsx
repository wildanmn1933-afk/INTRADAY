import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Layers,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Sliders,
  Scale,
  Save,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  CalendarDays,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  DailyMarketSnapshot,
  MarketMemoryInsight,
  HistoricalCurrencyComparison,
  MarketEvent,
  EconomicEvent,
} from '../types';

interface MarketHistoryViewProps {
  onOpenChart?: (symbol: string) => void;
}

export const MarketHistoryView: React.FC<MarketHistoryViewProps> = React.memo(({ onOpenChart }) => {
  const [snapshots, setSnapshots] = useState<DailyMarketSnapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-20');
  const [activeSnapshot, setActiveSnapshot] = useState<DailyMarketSnapshot | null>(null);
  const [currencyComparisons, setCurrencyComparisons] = useState<HistoricalCurrencyComparison[]>([]);
  const [memoryInsights, setMemoryInsights] = useState<MarketMemoryInsight[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<MarketEvent[]>([]);
  const [historicalMacro, setHistoricalMacro] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [compareDate, setCompareDate] = useState<string | null>('2026-09-19');
  const [compareSnapshot, setCompareSnapshot] = useState<DailyMarketSnapshot | null>(null);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'METALS_CRYPTO' | 'INDICES' | 'BONDS' | 'FOREX'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load snapshots list & comparisons
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [snapRes, compRes, insRes] = await Promise.allSettled([
        api.getDailySnapshots('ALL', undefined, 30),
        api.getHistoricalCurrencyComparison(),
        api.getMarketMemoryInsights(),
      ]);

      if (snapRes.status === 'fulfilled' && snapRes.value.snapshots) {
        setSnapshots(snapRes.value.snapshots);
        if (snapRes.value.snapshots.length > 0) {
          const first = snapRes.value.snapshots[0];
          setSelectedDate(first.date);
          setActiveSnapshot(first);

          if (snapRes.value.snapshots.length > 1) {
            setCompareDate(snapRes.value.snapshots[1].date);
            setCompareSnapshot(snapRes.value.snapshots[1]);
          }
        }
      }

      if (compRes.status === 'fulfilled' && compRes.value.comparisons) {
        setCurrencyComparisons(compRes.value.comparisons);
      }

      if (insRes.status === 'fulfilled' && insRes.value.insights) {
        setMemoryInsights(insRes.value.insights);
      }
    } catch (err) {
      console.error('[History] Failed loading history data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch full detail when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    let isMounted = true;

    api.getDailySnapshotDetail(selectedDate)
      .then(res => {
        if (!isMounted) return;
        if (res.snapshot) {
          setActiveSnapshot(res.snapshot);
          setHistoricalEvents(res.events || []);
          setHistoricalMacro(res.economic_events || []);
        }
      })
      .catch(err => console.error('[History] Error fetching date detail:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Fetch compare snapshot when compareDate changes
  useEffect(() => {
    if (!compareDate || !isCompareMode) return;
    api.getDailySnapshotDetail(compareDate)
      .then(res => {
        if (res.snapshot) {
          setCompareSnapshot(res.snapshot);
        }
      })
      .catch(err => console.error('[History] Error fetching compare detail:', err));
  }, [compareDate, isCompareMode]);

  const handleGenerateSnapshot = async () => {
    setIsGenerating(true);
    setStatusMessage('Compiling daily market snapshot from all real feeds...');
    try {
      const res = await api.generateDailySnapshot(selectedDate);
      if (res.success && res.snapshot) {
        setActiveSnapshot(res.snapshot);
        // Refresh snapshots list
        const updated = await api.getDailySnapshots('ALL', undefined, 30);
        setSnapshots(updated.snapshots);
        setStatusMessage(`Daily snapshot for ${selectedDate} saved permanently to database.`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      setStatusMessage(`Error saving snapshot: ${err?.message || 'Failed'}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // 14 Target assets
  const target14Keys = [
    'XAUUSD',
    'BTC',
    'US100',
    'US500',
    'US30',
    'US10Y',
    'AUD',
    'NZD',
    'CAD',
    'JPY',
    'GBP',
    'EUR',
    'CHF',
    'USD',
  ];

  const getAssetCategory = (sym: string): 'METALS_CRYPTO' | 'INDICES' | 'BONDS' | 'FOREX' => {
    if (sym === 'XAUUSD' || sym === 'BTC') return 'METALS_CRYPTO';
    if (sym === 'US10Y') return 'BONDS';
    if (sym.startsWith('US')) return 'INDICES';
    return 'FOREX';
  };

  const getAssetDisplayName = (sym: string): string => {
    switch (sym) {
      case 'XAUUSD': return 'Gold / Spot USD';
      case 'BTC': return 'Bitcoin (BTC)';
      case 'US100': return 'Nasdaq 100 Index';
      case 'US500': return 'S&P 500 Index';
      case 'US30': return 'Dow Jones 30 Index';
      case 'US10Y': return 'US 10-Yr Benchmark Yield';
      case 'USD': return 'US Dollar Index (DXY)';
      case 'EUR': return 'Euro (EUR/USD)';
      case 'GBP': return 'British Pound (GBP/USD)';
      case 'JPY': return 'Japanese Yen (USD/JPY)';
      case 'AUD': return 'Australian Dollar (AUD/USD)';
      case 'NZD': return 'New Zealand Dollar (NZD/USD)';
      case 'CAD': return 'Canadian Dollar (USD/CAD)';
      case 'CHF': return 'Swiss Franc (USD/CHF)';
      default: return sym;
    }
  };

  const formatAssetPriceStr = (sym: string, price: number): string => {
    if (sym === 'US10Y') return `${price.toFixed(3)}%`;
    if (price > 100) return `$${price.toLocaleString()}`;
    return `$${price.toFixed(4)}`;
  };

  const filteredAssets = useMemo(() => {
    if (!activeSnapshot?.market_biases) return [];
    return target14Keys.filter(key => {
      const cat = getAssetCategory(key);
      if (activeFilter !== 'ALL' && cat !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const item = activeSnapshot.market_biases[key];
        const matchKey = key.toLowerCase().includes(q);
        const matchName = getAssetDisplayName(key).toLowerCase().includes(q);
        const matchCat = item?.major_catalyst?.toLowerCase().includes(q) || false;
        return matchKey || matchName || matchCat;
      }
      return true;
    });
  }, [activeSnapshot, activeFilter, searchQuery]);

  const getBiasBadge = (bias: string) => {
    switch (bias) {
      case 'BULLISH':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      case 'BEARISH':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/80';
      case 'MIXED':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/80';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-800';
    }
  };

  const getMeterColor = (score: number) => {
    if (score >= 7.0) return 'from-emerald-600 to-emerald-400';
    if (score >= 5.5) return 'from-emerald-700 to-teal-500';
    if (score >= 4.5) return 'from-cyan-700 to-cyan-500';
    if (score >= 3.0) return 'from-amber-600 to-rose-500';
    return 'from-rose-700 to-rose-500';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. ARCHITECTURAL PIPELINE BANNER: NEWS → MACRO → CS → REACTION → AI → BIAS → HISTORY */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-mono font-bold text-slate-100 tracking-wide uppercase">
                MARKET INTELLIGENCE ARCHITECTURE & PERMANENT MEMORY
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Interconnected continuous workflow: Telemetry never overwritten &bull; Historical comparison &bull; Permanent multi-session dossier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSnapshot}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Capturing...' : 'Snapshot Current Day'}</span>
            </button>
            <button
              onClick={loadInitialData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Reload memory database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pipeline Step Visualizer */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center min-w-[760px] text-[11px] font-mono">
            {[
              { step: '1. NEWS', desc: 'Canonical Wire' },
              { step: '2. MACRO', desc: 'Economic Events' },
              { step: '3. CURRENCY STRENGTH', desc: 'G8 Real Flow' },
              { step: '4. REACTION', desc: 'Price Action' },
              { step: '5. AI ANALYSIS', desc: 'Grounded Synth' },
              { step: '6. BIAS', desc: '13 Assets' },
              { step: '7. HISTORY', desc: 'Permanent Memory', active: true },
            ].map((node, i, arr) => (
              <React.Fragment key={node.step}>
                <div
                  className={`px-2.5 py-1.5 rounded border ${
                    node.active
                      ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>{node.step}</div>
                  <div className="text-[9px] text-slate-500">{node.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-800/80 rounded-lg text-xs font-mono text-indigo-300 flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. DATE SELECTOR & COMPARISON CONTROLS */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              ARCHIVE DATE:
            </span>

            {snapshots.map(s => {
              const isSelected = selectedDate === s.date;
              return (
                <button
                  key={s.date}
                  onClick={() => setSelectedDate(s.date)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {s.date === '2026-09-20'
                    ? '20 Sep (Today)'
                    : s.date === '2026-09-19'
                    ? '19 Sep (Yesterday)'
                    : s.date}
                </button>
              );
            })}

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300">
              <span className="text-[10px] text-slate-500">CUSTOM:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-hidden font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* Compare Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                isCompareMode
                  ? 'bg-purple-950/70 border-purple-500 text-purple-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isCompareMode ? 'Exit Compare Mode' : 'Compare Two Dates'}</span>
            </button>

            {isCompareMode && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-purple-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-300">
                <span className="text-[10px] text-slate-400">VS:</span>
                <select
                  value={compareDate || ''}
                  onChange={e => setCompareDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-hidden font-mono cursor-pointer"
                >
                  {snapshots
                    .filter(s => s.date !== selectedDate)
                    .map(s => (
                      <option key={s.date} value={s.date}>
                        {s.date === '2026-09-19' ? '19 Sep (Yesterday)' : s.date}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. GROUNDED MARKET MEMORY INSIGHTS */}
      {memoryInsights.length > 0 && (
        <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                MARKET MEMORY INSIGHTS (DERIVED FROM STORED HISTORY)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Multi-Session Persistent Intelligence &bull; Zero Guesswork
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {memoryInsights.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-bold uppercase">
                    {item.type}
                  </span>
                  <span className="text-slate-400 font-bold">{item.metric}</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100 mb-1 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Confidence: {item.confidence}%</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CURRENCY STRENGTH HISTORICAL COMPARISON TABLE (Today vs Yesterday vs 3D vs 7D) */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                HISTORICAL CURRENCY STRENGTH COMPARISON (G8)
              </h2>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Today vs Yesterday vs 3 Days vs 7 Days &bull; Grounded in historical interval database
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span>Benchmark:</span>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-bold uppercase">
                <th className="py-2 px-3">Currency</th>
                <th className="py-2 px-3">Today Score</th>
                <th className="py-2 px-3">Yesterday</th>
                <th className="py-2 px-3">3-Day Ago</th>
                <th className="py-2 px-3">7-Day Ago</th>
                <th className="py-2 px-3">Net 7D Delta</th>
                <th className="py-2 px-3">Macro Flow Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {currencyComparisons.map(item => {
                const isStrengthening = item.trend === 'STRENGTHENING';
                const isWeakening = item.trend === 'WEAKENING';

                return (
                  <tr key={item.currency} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{item.currency}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm tabular-nums">
                          {item.today_score.toFixed(2)}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(item.today_score)}`}
                            style={{ width: `${Math.min(100, (item.today_score / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-slate-300">
                        {item.yesterday_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_yesterday >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({item.delta_yesterday >= 0 ? '+' : ''}{item.delta_yesterday.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-slate-400">
                        {item.three_day_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_3d >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({item.delta_3d >= 0 ? '+' : ''}{item.delta_3d.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-slate-400">
                        {item.seven_day_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_7d >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({item.delta_7d >= 0 ? '+' : ''}{item.delta_7d.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                          item.delta_7d >= 0
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        }`}
                      >
                        {item.delta_7d >= 0 ? '+' : ''}{item.delta_7d.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          isStrengthening
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : isWeakening
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {isStrengthening ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        ) : isWeakening ? (
                          <ArrowDownRight className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-500" />
                        )}
                        {item.trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SIDE-BY-SIDE COMPARISON (IF COMPARE MODE ACTIVE) */}
      {isCompareMode && activeSnapshot && compareSnapshot && (
        <div className="bg-slate-950 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider">
                SIDE-BY-SIDE HISTORICAL COMPARISON: {activeSnapshot.date} VS {compareSnapshot.date}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
              Delta Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day A */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">
                DAY A: {activeSnapshot.date}
              </div>
              <div className="text-xs text-slate-300 mb-3 leading-relaxed">
                {activeSnapshot.ai_summary}
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {target14Keys.slice(0, 7).map(sym => {
                  const a = activeSnapshot.market_biases[sym];
                  if (!a) return null;
                  return (
                    <div key={sym} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="font-bold text-slate-200">{sym}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getBiasBadge(a.bias)}`}>
                        {a.bias}
                      </span>
                      <span className="text-slate-300">{formatAssetPriceStr(sym, a.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day B */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="text-xs font-mono font-bold text-purple-400 mb-2">
                DAY B: {compareSnapshot.date}
              </div>
              <div className="text-xs text-slate-300 mb-3 leading-relaxed">
                {compareSnapshot.ai_summary}
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {target14Keys.slice(0, 7).map(sym => {
                  const b = compareSnapshot.market_biases[sym];
                  if (!b) return null;
                  return (
                    <div key={sym} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="font-bold text-slate-200">{sym}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getBiasBadge(b.bias)}`}>
                        {b.bias}
                      </span>
                      <span className="text-slate-300">{formatAssetPriceStr(sym, b.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DAILY MARKET SNAPSHOT DOSSIER (THE 13 CORE ASSETS) */}
      {activeSnapshot && (
        <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-mono font-bold text-slate-100 tracking-wide uppercase">
                  {activeSnapshot.title || `DAILY MARKET SNAPSHOT: ${activeSnapshot.date}`}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Archived dossier for all 14 core markets &bull; Saved permanently in relational database
              </p>
            </div>

            {/* Asset Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All 14 Assets' },
                { id: 'METALS_CRYPTO', label: 'XAUUSD & BTC' },
                { id: 'INDICES', label: 'US Equities (3)' },
                { id: 'BONDS', label: 'Bonds (US10Y)' },
                { id: 'FOREX', label: 'Currencies (8)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
                    activeFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Grounded Daily Summary Banner */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 mb-4">
            <div className="flex items-center gap-2 mb-1 text-xs font-mono font-bold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI MACRO SYNTHESIS FOR {activeSnapshot.date}:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2 font-mono">
              {activeSnapshot.ai_summary}
            </p>
            <div className="text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-800/60 pt-2">
              "{activeSnapshot.market_reaction_summary}"
            </div>
          </div>

          {/* 13 Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssets.map(sym => {
              const item = activeSnapshot.market_biases[sym];
              if (!item) return null;

              const isBull = item.bias === 'BULLISH';
              const isBear = item.bias === 'BEARISH';
              const chg = item.change_24h_pct;

              return (
                <div
                  key={sym}
                  className="p-3.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Symbol + Bias */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-mono font-bold text-slate-100">{sym}</span>
                        <div className="text-[10px] font-mono text-slate-400">{getAssetDisplayName(sym)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${getBiasBadge(item.bias)}`}>
                        {item.bias} ({item.score > 0 ? `+${item.score}` : item.score})
                      </span>
                    </div>

                    {/* Price & Change */}
                    <div className="flex items-baseline justify-between py-2 border-y border-slate-800/60 mb-2 font-mono">
                      <div>
                        <span className="text-xs text-slate-500 mr-1.5">Price:</span>
                        <span className="text-base font-bold text-slate-100 tabular-nums">
                          {formatAssetPriceStr(sym, item.price)}
                        </span>
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-0.5 ${chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {chg >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{chg >= 0 ? `+${chg.toFixed(2)}%` : `${chg.toFixed(2)}%`}</span>
                      </div>
                    </div>

                    {/* Strength & Major Catalyst */}
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500">Strength Rating:</span>
                        <span className="text-slate-200 font-semibold">{item.strength_label || 'Neutral'}</span>
                      </div>
                      <div className="text-slate-300 leading-snug">
                        <span className="text-slate-500 text-[10px] uppercase block">Major Catalyst:</span>
                        <p className="text-slate-300 text-xs mt-0.5 line-clamp-2">
                          {item.major_catalyst || 'Digestive consolidation and macro cross-flows.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Chart Link & Timestamp */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Updated: {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {onOpenChart && (
                      <button
                        onClick={() => onOpenChart(sym)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Chart</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currency Strength Ranking for this Day */}
          {activeSnapshot.currency_strength && activeSnapshot.currency_strength.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    CURRENCY STRENGTH RANKING ON {activeSnapshot.date}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Relative Capital Flow Hierarchy
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {activeSnapshot.currency_strength.map(c => (
                  <div
                    key={c.currency}
                    className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center font-mono"
                  >
                    <div className="text-[10px] text-slate-500 font-bold">#{c.rank}</div>
                    <div className="text-sm font-bold text-slate-100 my-0.5">{c.currency}</div>
                    <div className="text-xs text-cyan-400 font-bold">{c.score.toFixed(1)}/10</div>
                    <div className="mt-1.5 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(c.score)}`}
                        style={{ width: `${Math.min(100, (c.score / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded AI Breakdown: Why, Risks, Context */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Why Market Moved */}
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WHY THE MARKET MOVED (EVIDENCE)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                {activeSnapshot.ai_why?.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">&bull;</span>
                    <span className="leading-snug">{w}</span>
                  </li>
                )) || <li className="text-slate-500">Historical evidence recorded.</li>}
              </ul>
            </div>

            {/* Identified Risks */}
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-xs font-mono font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>IDENTIFIED RISKS & INVALIDATIONS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                {activeSnapshot.ai_risk?.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">&bull;</span>
                    <span className="leading-snug">{r}</span>
                  </li>
                )) || <li className="text-slate-500">Normal session volatility conditions.</li>}
              </ul>
            </div>

            {/* Historical Context */}
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-xs font-mono font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>HISTORICAL MEMORY & CONTINUITY</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                {activeSnapshot.historical_insights?.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">&bull;</span>
                    <span className="leading-snug">{h}</span>
                  </li>
                )) || <li className="text-slate-500">Persistent memory tracking active.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarketHistoryView.displayName = 'MarketHistoryView';
