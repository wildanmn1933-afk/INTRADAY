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
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  CalendarDays,
} from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from './shared/PageHeader';
import { useLanguage } from '../lib/LanguageContext';
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
  const { t } = useLanguage();
  const [snapshots, setSnapshots] = useState<DailyMarketSnapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-20');
  const [activeSnapshot, setActiveSnapshot] = useState<DailyMarketSnapshot | null>(null);
  const [currencyComparisons, setCurrencyComparisons] = useState<HistoricalCurrencyComparison[]>([]);
  const [memoryInsights, setMemoryInsights] = useState<MarketMemoryInsight[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<MarketEvent[]>([]);
  const [historicalMacro, setHistoricalMacro] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
        return 'badge-bullish';
      case 'BEARISH':
        return 'badge-bearish';
      case 'MIXED':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const getMeterColor = (score: number) => {
    if (score >= 7.0) return 'var(--bullish)';
    if (score >= 5.5) return 'var(--bullish)';
    if (score >= 4.5) return 'var(--accent)';
    if (score >= 3.0) return 'var(--warning)';
    return 'var(--bearish)';
  };

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* 1. ARCHITECTURAL PIPELINE BANNER: NEWS → MACRO → CS → REACTION → AI → BIAS → HISTORY */}
      <PageHeader
        eyebrow={t('RISET · DATA HISTORIS', 'RESEARCH · HISTORICAL DATA')}
        title={t('Arsitektur Intelijen Pasar', 'Market intelligence architecture')}
        description={t(
          'Arsip multi-sesi berkelanjutan · Tanpa simulasi buatan · Berkas persistensi institusional.',
          'Continuous multi-session archive · Zero simulated loss · Institutional persistence dossier.'
        )}
        actions={
          <>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--bullish)] animate-pulse" />
              <span className="font-semibold text-[var(--text-primary)]">{t('ARSIP OTOMATIS AKTIF', 'AUTO-ARCHIVE ACTIVE')}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-muted)]">{t('BUKA → TUTUP (04:00 WIB)', 'OPEN → CLOSE (04:00 WIB)')}</span>
            </div>
            <button
              onClick={loadInitialData}
              disabled={isLoading}
              className="h-8 w-8 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              title={t('Muat ulang database memori', 'Reload memory database')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>
          </>
        }
      />

      <div className="terminal-panel p-4 space-y-3">
        {/* Pipeline Step Visualizer */}
        <div className="section-head flex-wrap gap-y-2">
          <span className="metadata-label text-[10px] text-[var(--text-muted)]">
            {t('Alur memori', 'Memory pipeline')}
          </span>
          <span className="metadata-label text-[9.5px] text-[var(--text-muted)]">
            {t('Langkah 7 · memori permanen', 'Step 7 · permanent memory')}
          </span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center min-w-[760px] text-[11px] font-mono">
            {[
              { step: t('1. BERITA', '1. NEWS'), desc: t('Kawat Kanonikal', 'Canonical Wire') },
              { step: t('2. MAKRO', '2. MACRO'), desc: t('Kalender Ekonomi', 'Economic Events') },
              { step: t('3. KEKUATAN VALUTA', '3. CURRENCY STRENGTH'), desc: t('Arus Riil G8', 'G8 Real Flow') },
              { step: t('4. REAKSI', '4. REACTION'), desc: t('Price Action', 'Price Action') },
              { step: t('5. ANALISIS AI', '5. AI ANALYSIS'), desc: t('Sintesis Terverifikasi', 'Grounded Synth') },
              { step: t('6. BIAS', '6. BIAS'), desc: t('14 Aset Inti', '14 Core Assets') },
              { step: t('7. HISTORI', '7. HISTORY'), desc: t('Memori Permanen', 'Permanent Memory'), active: true },
            ].map((node, i, arr) => (
              <React.Fragment key={node.step}>
                <div
                  className={`px-2.5 py-1.5 rounded border ${
                    node.active
                      ? 'bg-[var(--active-bg)] text-[var(--active-text)] border-[var(--active-border)] font-bold shadow-xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div>{node.step}</div>
                  <div className={`text-[9px] ${node.active ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>{node.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] mx-1 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] rounded text-xs font-mono text-[var(--text-primary)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. DATE SELECTOR & COMPARISON CONTROLS */}
      <div className="terminal-panel p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="metadata-label text-xs text-[var(--text-muted)] flex items-center gap-1.5 mr-1">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
              {t('TANGGAL ARSIP:', 'ARCHIVE DATE:')}
            </span>

            {snapshots.map(s => {
              const isSelected = selectedDate === s.date;
              return (
                <button
                  key={s.date}
                  onClick={() => setSelectedDate(s.date)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--active-bg)] text-[var(--active-text)] border-[var(--active-border)] font-bold shadow-xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {s.date === '2026-09-20'
                    ? t('20 Sep (Hari Ini)', '20 Sep (Today)')
                    : s.date === '2026-09-19'
                    ? t('19 Sep (Kemarin)', '19 Sep (Yesterday)')
                    : s.date}
                </button>
              );
            })}

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2.5 py-1 text-xs font-mono text-[var(--text-primary)]">
              <span className="metadata-label text-[10px] text-[var(--text-muted)]">{t('KUSTOM:', 'CUSTOM:')}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-hidden font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* Compare Toggle */}
          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                isCompareMode
                  ? 'bg-[var(--active-bg)] text-[var(--active-text)] border-[var(--active-border)] font-bold shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isCompareMode ? t('TUTUP KOMPARASI', 'EXIT COMPARE') : t('KOMPARASI TANGGAL', 'COMPARE DATES')}</span>
            </button>

            {isCompareMode && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2.5 py-1 text-xs font-mono text-[var(--text-primary)]">
                <span className="metadata-label text-[10px] text-[var(--text-muted)]">VS:</span>
                <select
                  value={compareDate || ''}
                  onChange={e => setCompareDate(e.target.value)}
                  className="bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] focus:outline-hidden font-mono cursor-pointer"
                >
                  {snapshots
                    .filter(s => s.date !== selectedDate)
                    .map(s => (
                      <option key={s.date} value={s.date}>
                        {s.date === '2026-09-19' ? t('19 Sep (Kemarin)', '19 Sep (Yesterday)') : s.date}
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
        <div className="terminal-panel p-4">
          <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="section-title text-xs text-[var(--text-primary)]">
                {t('INSIGHT MEMORI PASAR (BERDASARKAN DATA HISTORIS)', 'MARKET MEMORY INSIGHTS (DERIVED FROM STORED HISTORY)')}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {t('Intelijen Persisten Multi-Sesi • Tanpa Tebak-tebakan', 'Multi-Session Persistent Intelligence • Zero Guesswork')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {memoryInsights.map(item => (
              <div
                key={item.id}
                className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="badge-neutral text-[9px] font-bold uppercase">
                    {item.type}
                  </span>
                  <span className="text-[var(--text-secondary)] font-bold">{item.metric}</span>
                </div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3 font-sans">
                  {item.description}
                </p>
                <div className="pt-2 border-t text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                  <span>{t('Keyakinan:', 'Confidence:')} {item.confidence}%</span>
                  <span className="text-[var(--bullish)] flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {t('Terverifikasi', 'Verified')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CURRENCY STRENGTH HISTORICAL COMPARISON TABLE (Today vs Yesterday vs 3D vs 7D) */}
      <div className="terminal-panel p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b mb-3.5 gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="section-title text-xs text-[var(--text-primary)]">
                {t('KOMPARASI HISTORIS KEKUATAN MATA UANG (G8)', 'HISTORICAL CURRENCY STRENGTH COMPARISON (G8)')}
              </h2>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
              {t(
                'Hari Ini vs Kemarin vs 3 Hari vs 7 Hari • Berbasis database interval historis',
                'Today vs Yesterday vs 3 Days vs 7 Days • Grounded in historical interval database'
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <span>{t('Tolok Ukur:', 'Benchmark:')}</span>
            <a
              href="https://currency-strength.com/en/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline flex items-center gap-0.5"
            >
              <span>currency-strength.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b text-[10px] text-[var(--text-muted)] font-bold uppercase" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="py-2 px-3">{t('Mata Uang', 'Currency')}</th>
                <th className="py-2 px-3">{t('Skor Hari Ini', 'Today Score')}</th>
                <th className="py-2 px-3">{t('Kemarin', 'Yesterday')}</th>
                <th className="py-2 px-3">{t('3 Hari Lalu', '3-Day Ago')}</th>
                <th className="py-2 px-3">{t('7 Hari Lalu', '7-Day Ago')}</th>
                <th className="py-2 px-3">{t('Delta Bersih 7H', 'Net 7D Delta')}</th>
                <th className="py-2 px-3">{t('Tren Aliran Makro', 'Macro Flow Trend')}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {currencyComparisons.map(item => {
                const isStrengthening = item.trend === 'STRENGTHENING';
                const isWeakening = item.trend === 'WEAKENING';

                return (
                  <tr key={item.currency} className="hover:bg-[var(--bg-section-alt)] transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] text-sm">{item.currency}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] text-sm tabular-nums">
                          {item.today_score.toFixed(2)}
                        </span>
                        <div className="w-16 h-1.5 bg-[var(--bg-surface)] rounded-xs overflow-hidden border border-[var(--border-hairline)]">
                          <div
                            className="h-full rounded-xs transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (item.today_score / 10) * 100)}%`,
                              backgroundColor: getMeterColor(item.today_score)
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-[var(--text-secondary)]">
                        {item.yesterday_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_yesterday >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                          }`}
                        >
                          ({item.delta_yesterday >= 0 ? '+' : ''}{item.delta_yesterday.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-[var(--text-secondary)]">
                        {item.three_day_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_3d >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                          }`}
                        >
                          ({item.delta_3d >= 0 ? '+' : ''}{item.delta_3d.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <div className="text-[var(--text-secondary)]">
                        {item.seven_day_score.toFixed(2)}
                        <span
                          className={`ml-1.5 text-[10px] ${
                            item.delta_7d >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                          }`}
                        >
                          ({item.delta_7d >= 0 ? '+' : ''}{item.delta_7d.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          item.delta_7d >= 0 ? 'badge-bullish' : 'badge-bearish'
                        }`}
                      >
                        {item.delta_7d >= 0 ? '+' : ''}{item.delta_7d.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isStrengthening
                            ? 'badge-bullish'
                            : isWeakening
                            ? 'badge-bearish'
                            : 'badge-neutral'
                        }`}
                      >
                        {isStrengthening ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : isWeakening ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3 text-[var(--text-muted)]" />
                        )}
                        {isStrengthening ? t('MENGUAT', 'STRENGTHENING') : isWeakening ? t('MELEMAH', 'WEAKENING') : t('NETRAL', 'NEUTRAL')}
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
        <div className="terminal-panel p-4">
          <div className="flex items-center justify-between pb-3 border-b mb-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="section-title text-xs text-[var(--text-primary)]">
                {t('KOMPARASI HISTORIS BERDAMPINGAN:', 'SIDE-BY-SIDE HISTORICAL COMPARISON:')} {activeSnapshot.date} VS {compareSnapshot.date}
              </h2>
            </div>
            <span className="badge-neutral text-[10px] font-mono">
              {t('Analisis Selisih / Delta', 'Delta Analysis')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day A */}
            <div className="p-3 bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] rounded space-y-2">
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                {t('HARI A:', 'DAY A:')} {activeSnapshot.date}
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {activeSnapshot.ai_summary}
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {target14Keys.slice(0, 7).map(sym => {
                  const a = activeSnapshot.market_biases[sym];
                  if (!a) return null;
                  return (
                    <div key={sym} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                      <span className="font-bold text-[var(--text-primary)]">{sym}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${getBiasBadge(a.bias)}`}>
                        {a.bias}
                      </span>
                      <span className="text-[var(--text-secondary)] tabular-nums">{formatAssetPriceStr(sym, a.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day B */}
            <div className="p-3 bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] rounded space-y-2">
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                {t('HARI B:', 'DAY B:')} {compareSnapshot.date}
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {compareSnapshot.ai_summary}
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {target14Keys.slice(0, 7).map(sym => {
                  const b = compareSnapshot.market_biases[sym];
                  if (!b) return null;
                  return (
                    <div key={sym} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                      <span className="font-bold text-[var(--text-primary)]">{sym}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${getBiasBadge(b.bias)}`}>
                        {b.bias}
                      </span>
                      <span className="text-[var(--text-secondary)] tabular-nums">{formatAssetPriceStr(sym, b.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DAILY MARKET SNAPSHOT DOSSIER (THE 14 CORE ASSETS) */}
      {activeSnapshot && (
        <div className="terminal-panel p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b mb-4 gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
                  {activeSnapshot.title || `${t('SNAPSHOT PASAR HARIAN:', 'DAILY MARKET SNAPSHOT:')} ${activeSnapshot.date}`}
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                {t('Berkas arsip untuk seluruh 14 pasar inti • Disimpan permanen di database relasional', 'Archived dossier for all 14 core markets • Saved permanently in relational database')}
              </p>
            </div>

            {/* Asset Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono">
              {[
                { id: 'ALL', label: t('Semua 14 Aset', 'All 14 Assets') },
                { id: 'METALS_CRYPTO', label: t('XAUUSD & BTC', 'XAUUSD & BTC') },
                { id: 'INDICES', label: t('Ekuitas AS (3)', 'US Equities (3)') },
                { id: 'BONDS', label: t('Obligasi (US10Y)', 'Bonds (US10Y)') },
                { id: 'FOREX', label: t('Valuta Forex (8)', 'Currencies (8)') },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer border ${
                    activeFilter === f.id
                      ? 'bg-[var(--active-bg)] text-[var(--active-text)] border-[var(--active-border)] font-bold shadow-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Grounded Daily Summary Banner */}
          <div className="p-3.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] mb-4">
            <div className="flex items-center gap-2 mb-1 text-xs font-mono font-bold text-[var(--text-primary)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{t('SINTESIS MAKRO AI UNTUK', 'AI MACRO SYNTHESIS FOR')} {activeSnapshot.date}:</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2 font-mono">
              {activeSnapshot.ai_summary}
            </p>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed italic border-t pt-2" style={{ borderColor: 'var(--border-hairline)' }}>
              "{activeSnapshot.market_reaction_summary}"
            </div>
          </div>

          {/* 14 Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssets.map(sym => {
              const item = activeSnapshot.market_biases[sym];
              if (!item) return null;

              const chg = item.change_24h_pct;

              return (
                <div
                  key={sym}
                  className="p-3.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Symbol + Bias */}
                    <div className="flex items-center justify-between mb-2 font-mono">
                      <div>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{sym}</span>
                        <div className="text-[10px] text-[var(--text-muted)]">{getAssetDisplayName(sym)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getBiasBadge(item.bias)}`}>
                        {item.bias} ({item.score > 0 ? `+${item.score}` : item.score})
                      </span>
                    </div>

                    {/* Price & Change */}
                    <div className="flex items-baseline justify-between py-2 border-y mb-2 font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
                      <div>
                        <span className="text-xs text-[var(--text-muted)] mr-1.5">{t('Harga:', 'Price:')}</span>
                        <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                          {formatAssetPriceStr(sym, item.price)}
                        </span>
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-0.5 tabular-nums ${chg >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                        {chg >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{chg >= 0 ? `+${chg.toFixed(2)}%` : `${chg.toFixed(2)}%`}</span>
                      </div>
                    </div>

                    {/* Strength & Major Catalyst */}
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="text-[var(--text-muted)]">{t('Peringkat Kekuatan:', 'Strength Rating:')}</span>
                        <span className="text-[var(--text-primary)] font-semibold">{item.strength_label || t('Netral', 'Neutral')}</span>
                      </div>
                      <div>
                        <span className="metadata-label text-[10px] text-[var(--text-muted)] block">{t('Katalis Utama:', 'Major Catalyst:')}</span>
                        <p className="text-[var(--text-secondary)] text-xs mt-0.5 line-clamp-2 font-sans">
                          {item.major_catalyst || t('Konsolidasi digestif dan arus silang makro.', 'Digestive consolidation and macro cross-flows.')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Chart Link & Timestamp */}
                  <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
                    <span>{t('Diperbarui:', 'Updated:')} {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {onOpenChart && (
                      <button
                        onClick={() => onOpenChart(sym)}
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{t('Grafik', 'Chart')}</span>
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
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="section-title text-xs text-[var(--text-primary)]">
                    {t('PERINGKAT KEKUATAN MATA UANG PADA', 'CURRENCY STRENGTH RANKING ON')} {activeSnapshot.date}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {t('Hierarki Aliran Modal Relatif', 'Relative Capital Flow Hierarchy')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {activeSnapshot.currency_strength.map(c => (
                  <div
                    key={c.currency}
                    className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center font-mono"
                  >
                    <div className="text-[10px] text-[var(--text-muted)] font-bold">#{c.rank}</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] my-0.5">{c.currency}</div>
                    <div className="text-xs text-[var(--accent)] font-bold tabular-nums">{c.score.toFixed(1)}/10</div>
                    <div className="mt-1.5 h-1.5 w-full bg-[var(--bg-section-alt)] rounded-xs overflow-hidden border border-[var(--border-hairline)]">
                      <div
                        className="h-full rounded-xs transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (c.score / 10) * 100)}%`,
                          backgroundColor: getMeterColor(c.score)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded AI Breakdown: Why, Risks, Context */}
          <div className="mt-5 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
            {/* Why Market Moved */}
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded space-y-2">
              <div className="font-bold text-[var(--bullish)] flex items-center gap-1.5 metadata-label text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('PENYEBAB PERGERAKAN PASAR (BUKTI)', 'WHY THE MARKET MOVED (EVIDENCE)')}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {activeSnapshot.ai_why?.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--bullish)] mt-0.5">&bull;</span>
                    <span className="leading-snug">{w}</span>
                  </li>
                )) || <li className="text-[var(--text-muted)]">{t('Bukti historis terekam.', 'Historical evidence recorded.')}</li>}
              </ul>
            </div>

            {/* Identified Risks */}
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded space-y-2">
              <div className="font-bold text-[var(--warning)] flex items-center gap-1.5 metadata-label text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('RISIKO TERIDENTIFIKASI & AMBANG BATAL', 'IDENTIFIED RISKS & INVALIDATIONS')}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {activeSnapshot.ai_risk?.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--warning)] mt-0.5">&bull;</span>
                    <span className="leading-snug">{r}</span>
                  </li>
                )) || <li className="text-[var(--text-muted)]">{t('Kondisi volatilitas sesi reguler.', 'Normal session volatility conditions.')}</li>}
              </ul>
            </div>

            {/* Historical Context */}
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded space-y-2">
              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 metadata-label text-xs">
                <History className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{t('MEMORI HISTORIS & KONTINUITAS', 'HISTORICAL MEMORY & CONTINUITY')}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {activeSnapshot.historical_insights?.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--accent)] mt-0.5">&bull;</span>
                    <span className="leading-snug">{h}</span>
                  </li>
                )) || <li className="text-[var(--text-muted)]">{t('Pelacakan memori persisten aktif.', 'Persistent memory tracking active.')}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarketHistoryView.displayName = 'MarketHistoryView';
