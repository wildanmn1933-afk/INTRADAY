import React, { useState, useMemo } from 'react';
import { MarketPrice, IntradayAssetBias } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Star,
  LineChart,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from './shared/PageHeader';
import { D3Sparkline } from './ui/D3Sparkline';
import { useLanguage } from '../lib/LanguageContext';

interface MarketDataGridProps {
  prices: MarketPrice[];
  watchlistSymbols: string[];
  intradayMap?: IntradayAssetBias[];
  onToggleWatchlist: (symbol: string, assetType: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
  /** 'page' owns the view title; 'embedded' renders a section header instead. */
  variant?: 'page' | 'embedded';
}

export const MarketDataGrid: React.FC<MarketDataGridProps> = React.memo(({
  prices,
  watchlistSymbols,
  intradayMap = [],
  onToggleWatchlist,
  onRefresh,
  isRefreshing,
  onSelectSymbol,
  onOpenChart,
  variant = 'page',
}) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const intradayLookup = useMemo(() => {
    const map = new Map<string, IntradayAssetBias>();
    intradayMap.forEach(item => map.set(item.symbol, item));
    return map;
  }, [intradayMap]);

  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      // Category filter
      let matchesCategory = true;
      if (filterType === 'FOREX') matchesCategory = p.asset_type === 'FOREX' || p.symbol === 'USD';
      else if (filterType === 'INDICES') matchesCategory = p.asset_type === 'INDEX';
      else if (filterType === 'COMMODITIES') matchesCategory = p.symbol === 'XAUUSD' || p.asset_type === 'COMMODITY';
      else if (filterType === 'CRYPTO') matchesCategory = p.symbol === 'BTC' || p.asset_type === 'CRYPTO';
      else if (filterType === 'BONDS') matchesCategory = p.symbol === 'US10Y' || p.asset_type === 'BOND';

      if (!matchesCategory) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.symbol.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q) ||
        p.asset_type.toLowerCase().includes(q)
      );
    });
  }, [prices, filterType, searchQuery]);

  const getBiasBadgeClass = (bias?: string) => {
    switch (bias) {
      case 'BULLISH':
        return 'badge-bullish';
      case 'BEARISH':
        return 'badge-bearish';
      case 'MIXED':
      case 'NEUTRAL':
      default:
        return 'badge-neutral';
    }
  };

  const chartAndRefresh = (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      title={t('Sinkronisasi harga pasar real-time', 'Synchronize real-time market prices')}
      className="h-8 px-3 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 font-mono"
      id="refresh-surveillance-btn"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
      <span>{t('Sinkronisasi', 'Sync')}</span>
    </button>
  );

  const assetClassCategories = useMemo(() => [
    { id: 'ALL', label: t('Semua', 'All') },
    { id: 'COMMODITIES', label: t('Komoditas', 'Commodities') },
    { id: 'CRYPTO', label: t('Kripto', 'Crypto') },
    { id: 'INDICES', label: t('Indeks', 'Indices') },
    { id: 'FOREX', label: t('Forex', 'Forex') },
    { id: 'BONDS', label: t('Obligasi', 'Bonds') },
  ], [t]);

  const assetClassFilter = (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] overflow-x-auto">
      {assetClassCategories.map(f => (
        <button
          key={f.id}
          onClick={() => setFilterType(f.id)}
          className={`h-7 px-2.5 rounded text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === f.id
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="space-y-4 font-sans" id="market-data-grid-root">
      {variant === 'page' ? (
        <PageHeader
          eyebrow={t('PASAR · SURVEILANS REAL-TIME', 'MARKET · REAL-TIME SURVEILLANCE')}
          title={t('Surveilans Pasar & Kuotasi Lintas Aset', 'Market Surveillance & Cross-Asset Quotations')}
          description={t(
            'Pemantauan harga real-time lintas kelas aset (FX, komoditas, indeks global, aset digital, serta imbal hasil obligasi) dipadukan dengan bias arah intraday institusional.',
            'Real-time price monitoring across asset classes (FX, commodities, global indices, digital assets, and bond yields) coupled with institutional intraday directional bias.'
          )}
          actions={chartAndRefresh}
        />
      ) : (
        <div className="section-head flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title text-base text-[var(--text-primary)]">
              {t('Surveilans Pasar', 'Market Surveillance')}
            </h2>
            <span className="num text-[11px] text-[var(--text-muted)]">
              {filteredPrices.length} {t('dari', 'of')} {prices.length}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bullish)]" />
            <span className="metadata-label text-[9px] text-[var(--text-muted)]">
              {t('Live Stream', 'Live Stream')}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {chartAndRefresh}
            {assetClassFilter}
          </div>
        </div>
      )}

      {/* Control Strip: Search & Filter Tabs */}
      {variant === 'page' && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          {/* Left: Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari simbol atau aset...', 'Search symbol or asset...')}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--active-border)] font-mono transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title={t('Hapus pencarian', 'Clear search')}
              >
                ×
              </button>
            )}
          </div>

          {/* Right: Counter & Filter Tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{filteredPrices.length} {t('dari', 'of')} {prices.length} {t('instrumen', 'instruments')}</span>
            </div>
            {assetClassFilter}
          </div>
        </div>
      )}

      {/* Empty State when no items match search/filter */}
      {filteredPrices.length === 0 && (
        <div className="py-12 text-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
          <p className="text-xs font-medium text-[var(--text-primary)]">
            {searchQuery
              ? `${t('Tidak ada instrumen yang cocok dengan kata kunci', 'No instruments matched keyword')} "${searchQuery}".`
              : t('Tidak ada instrumen yang cocok dengan kategori filter yang dipilih.', 'No instruments matched the selected category filter.')}
          </p>
          <button
            onClick={() => {
              setFilterType('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-[var(--accent)] hover:underline font-mono cursor-pointer"
          >
            {t('Reset filter dan pencarian', 'Reset filter and search')}
          </button>
        </div>
      )}

      {/* Grid of Market Instrument Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {filteredPrices.map(item => {
          const isUnavailable = item.status === 'UNAVAILABLE';
          const isPos = item.change_24h_pct > 0;
          const isNeg = item.change_24h_pct < 0;
          const isBookmarked = watchlistSymbols.includes(item.symbol);
          const biasData = intradayLookup.get(item.symbol);

          // Sparkline points
          const sparkPoints = item.sparkline_1h && item.sparkline_1h.length > 1
            ? item.sparkline_1h
            : [item.price * 0.998, item.price];

          const formattedPrice = isUnavailable ? (
            t('TIDAK TERSEDIA', 'UNAVAILABLE')
          ) : item.symbol === 'US10Y' ? (
            `${item.price.toFixed(3)}%`
          ) : (
            item.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: item.symbol === 'JPY' || item.asset_type === 'FOREX' ? 4 : 2,
            })
          );

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 hover:border-[var(--active-border)] hover:shadow-[var(--shadow-raised)] transition cursor-pointer flex flex-col justify-between gap-2.5 select-none"
            >
              <div>
                {/* Header: Symbol + Name + Controls */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{item.symbol}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono tracking-wide">
                      {item.asset_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {onOpenChart && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChart(item.tv_symbol || item.symbol);
                        }}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition cursor-pointer"
                        title={t(`Buka Grafik TradingView (${item.tv_symbol || item.symbol})`, `Open TradingView Chart (${item.tv_symbol || item.symbol})`)}
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(item.symbol, item.asset_type);
                      }}
                      title={isBookmarked ? t(`Hapus ${item.symbol} dari watchlist`, `Remove ${item.symbol} from watchlist`) : t(`Simpan ${item.symbol} ke watchlist`, `Add ${item.symbol} to watchlist`)}
                      aria-label={isBookmarked ? t(`Hapus ${item.symbol} dari watchlist`, `Remove ${item.symbol} from watchlist`) : t(`Simpan ${item.symbol} ke watchlist`, `Add ${item.symbol} to watchlist`)}
                      aria-pressed={isBookmarked}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        isBookmarked ? 'text-[var(--warning)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] truncate mb-2" title={item.display_name}>
                  {item.display_name}
                </div>

                {/* Price + 24h Change + Sparkline */}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums leading-tight font-mono">
                      {formattedPrice}
                    </div>
                    {!isUnavailable && (
                      <div
                        className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums mt-0.5 font-mono ${
                          isPos ? 'text-[var(--bullish)]' : isNeg ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span>{isPos ? '+' : ''}{item.change_24h_pct.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>

                  {/* D3 Sparkline curve */}
                  {!isUnavailable && (
                    <D3Sparkline
                      data={sparkPoints}
                      width={68}
                      height={24}
                      isPositive={isPos}
                      showArea={true}
                      showEndDot={true}
                      className="opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              </div>

              {/* Intraday Bias Strip */}
              {biasData && (
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{t('Bias', 'Bias')}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getBiasBadgeClass(biasData.overall_bias)}`}>
                      {biasData.overall_bias}
                    </span>
                  </div>

                  <div className="text-[var(--text-muted)] tabular-nums text-[10px]">
                    {t('Keyakinan:', 'Confidence:')} <strong className="text-[var(--text-primary)] font-bold">{biasData.confidence}%</strong>
                  </div>
                </div>
              )}

              {/* Card Footer: Provenance & Status */}
              <div className="pt-2 border-t text-[10px] flex items-center justify-between text-[var(--text-muted)] font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="truncate max-w-[120px]">{item.source}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[9px] tracking-wide uppercase">{item.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

MarketDataGrid.displayName = 'MarketDataGrid';
