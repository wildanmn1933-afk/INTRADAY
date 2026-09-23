import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Clock,
  Activity,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { MarketPrice } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface TradingViewChartModalProps {
  initialSymbol?: string;
  prices: MarketPrice[];
  onClose: () => void;
}

interface TVSymbolMeta {
  symbolKey: string;
  tvSymbol: string;
  label: string;
  description: string;
  snapshotUrl?: string;
  category?: 'POPULAR' | 'FOREX' | 'INDICES' | 'CRYPTO_COMMODITY';
}

const PRIMARY_INSTRUMENTS: TVSymbolMeta[] = [
  // Forex Majors & Crosses
  {
    symbolKey: 'AUDCAD',
    tvSymbol: 'FX:AUDCAD',
    label: 'AUD/CAD',
    description: 'Australian Dollar / Canadian Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'EURUSD',
    tvSymbol: 'FX:EURUSD',
    label: 'EUR/USD',
    description: 'Euro / US Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'GBPUSD',
    tvSymbol: 'FX:GBPUSD',
    label: 'GBP/USD',
    description: 'British Pound / USD FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'USDJPY',
    tvSymbol: 'FX:USDJPY',
    label: 'USD/JPY',
    description: 'USD / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'AUDUSD',
    tvSymbol: 'FX:AUDUSD',
    label: 'AUD/USD',
    description: 'Australian Dollar / US Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'USDCAD',
    tvSymbol: 'FX:USDCAD',
    label: 'USD/CAD',
    description: 'US Dollar / Canadian Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'USDCHF',
    tvSymbol: 'FX:USDCHF',
    label: 'USD/CHF',
    description: 'US Dollar / Swiss Franc FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'NZDUSD',
    tvSymbol: 'FX:NZDUSD',
    label: 'NZD/USD',
    description: 'New Zealand Dollar / USD FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'GBPJPY',
    tvSymbol: 'FX:GBPJPY',
    label: 'GBP/JPY',
    description: 'British Pound / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'EURJPY',
    tvSymbol: 'FX:EURJPY',
    label: 'EUR/JPY',
    description: 'Euro / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'AUDJPY',
    tvSymbol: 'FX:AUDJPY',
    label: 'AUD/JPY',
    description: 'Australian Dollar / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'CADJPY',
    tvSymbol: 'FX:CADJPY',
    label: 'CAD/JPY',
    description: 'Canadian Dollar / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'CHFJPY',
    tvSymbol: 'FX:CHFJPY',
    label: 'CHF/JPY',
    description: 'Swiss Franc / Japanese Yen FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'EURGBP',
    tvSymbol: 'FX:EURGBP',
    label: 'EUR/GBP',
    description: 'Euro / British Pound FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'NZDCAD',
    tvSymbol: 'FX:NZDCAD',
    label: 'NZD/CAD',
    description: 'New Zealand Dollar / Canadian Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'EURAUD',
    tvSymbol: 'FX:EURAUD',
    label: 'EUR/AUD',
    description: 'Euro / Australian Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'GBPAUD',
    tvSymbol: 'FX:GBPAUD',
    label: 'GBP/AUD',
    description: 'British Pound / Australian Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'AUDNZD',
    tvSymbol: 'FX:AUDNZD',
    label: 'AUD/NZD',
    description: 'Australian Dollar / New Zealand Dollar FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'AUDCHF',
    tvSymbol: 'FX:AUDCHF',
    label: 'AUD/CHF',
    description: 'Australian Dollar / Swiss Franc FX Live Stream',
    category: 'FOREX',
  },
  {
    symbolKey: 'CADCHF',
    tvSymbol: 'FX:CADCHF',
    label: 'CAD/CHF',
    description: 'Canadian Dollar / Swiss Franc FX Live Stream',
    category: 'FOREX',
  },
  // Major Indices & Non-Delayed CFDs
  {
    symbolKey: 'US30',
    tvSymbol: 'FOREXCOM:US30',
    label: 'US30 (Dow 30)',
    description: 'Wall St 30 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/McUWwa6F/',
    category: 'INDICES',
  },
  {
    symbolKey: 'US500',
    tvSymbol: 'CAPITALCOM:SPX500',
    label: 'SPX500 (S&P 500)',
    description: 'US 500 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/mMOtpRJZ/',
    category: 'INDICES',
  },
  {
    symbolKey: 'US100',
    tvSymbol: 'SKILLING:US100',
    label: 'US100 (Nasdaq 100)',
    description: 'US Tech 100 Non-Delayed CFD',
    snapshotUrl: 'https://www.tradingview.com/x/pWHPW2sk/',
    category: 'INDICES',
  },
  {
    symbolKey: 'US10Y',
    tvSymbol: 'TVC:US10Y',
    label: 'US10Y (10-Yr Yield)',
    description: 'US 10-Year Treasury Benchmark Yield',
    snapshotUrl: 'https://www.tradingview.com/symbols/TVC-US10Y/',
    category: 'INDICES',
  },
  {
    symbolKey: 'USD',
    tvSymbol: 'TVC:DXY',
    label: 'DXY (Dollar Index)',
    description: 'TradingView Real-Time Dollar Index',
    snapshotUrl: 'https://www.tradingview.com/x/mxhFtDj9/',
    category: 'INDICES',
  },
  // Commodities & Crypto
  {
    symbolKey: 'XAUUSD',
    tvSymbol: 'TVC:GOLD',
    label: 'XAUUSD (Gold)',
    description: 'Spot Gold / US Dollar Real-Time',
    category: 'CRYPTO_COMMODITY',
  },
  {
    symbolKey: 'BTC',
    tvSymbol: 'BITSTAMP:BTCUSD',
    label: 'BTCUSD (Bitcoin)',
    description: 'Bitcoin / USD 24/7 Live Stream',
    snapshotUrl: 'https://www.tradingview.com/x/zRklu6Fj/',
    category: 'CRYPTO_COMMODITY',
  },
];

const CURRENCY_FULL_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
};

/**
 * Deterministically resolves ANY input symbol to a valid TradingView ticker.
 * Handles forex pairs (e.g. AUDCAD -> FX:AUDCAD), slashes (AUD/CAD),
 * single currencies, crypto, indices, and custom symbols.
 */
function resolveSymbolToTVMeta(rawSymbol: string | undefined, prices: MarketPrice[]): TVSymbolMeta {
  if (!rawSymbol || !rawSymbol.trim()) {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'AUDCAD') || PRIMARY_INSTRUMENTS[0];
  }

  const raw = rawSymbol.trim();
  const clean = raw.toUpperCase().replace(/[\s/_\-:]/g, '');

  // 1. Direct match in PRIMARY_INSTRUMENTS
  const exact = PRIMARY_INSTRUMENTS.find(
    i =>
      i.symbolKey.toUpperCase() === clean ||
      i.symbolKey.toUpperCase() === raw.toUpperCase() ||
      i.tvSymbol.toUpperCase() === raw.toUpperCase() ||
      i.tvSymbol.toUpperCase().replace(/[\s/_\-:]/g, '') === clean
  );
  if (exact) return exact;

  // 2. Check if a price object in the system defines tv_symbol
  const matchedPrice = prices.find(
    p =>
      p.symbol.toUpperCase() === clean ||
      p.symbol.toUpperCase() === raw.toUpperCase() ||
      p.display_name.toUpperCase().includes(clean)
  );
  if (matchedPrice?.tv_symbol) {
    return {
      symbolKey: matchedPrice.symbol,
      tvSymbol: matchedPrice.tv_symbol,
      label: matchedPrice.symbol,
      description: matchedPrice.display_name,
      category: matchedPrice.asset_type === 'FOREX' ? 'FOREX' : 'INDICES',
    };
  }

  // 3. Already has exchange prefix (e.g., FX:AUDCAD, OANDA:AUDCAD, TVC:GOLD, BITSTAMP:BTCUSD)
  if (raw.includes(':')) {
    const parts = raw.split(':');
    const ticker = parts[1].toUpperCase();
    return {
      symbolKey: ticker,
      tvSymbol: raw.toUpperCase(),
      label: ticker.length === 6 ? `${ticker.slice(0, 3)}/${ticker.slice(3)}` : ticker,
      description: `${raw.toUpperCase()} Live Stream`,
      category: 'FOREX',
    };
  }

  // 4. Standard 6-character forex currency pairs (e.g. AUDCAD, EURUSD, GBPJPY)
  if (clean.length === 6) {
    const base = clean.slice(0, 3);
    const quote = clean.slice(3, 6);
    const baseName = CURRENCY_FULL_NAMES[base] || base;
    const quoteName = CURRENCY_FULL_NAMES[quote] || quote;
    return {
      symbolKey: clean,
      tvSymbol: `FX:${clean}`,
      label: `${base}/${quote}`,
      description: `${baseName} / ${quoteName} FX Live Stream`,
      category: 'FOREX',
    };
  }

  // 5. Common currency shorthands
  const singleCurrencyPairs: Record<string, string> = {
    EUR: 'EURUSD',
    GBP: 'GBPUSD',
    JPY: 'USDJPY',
    AUD: 'AUDUSD',
    CAD: 'USDCAD',
    NZD: 'NZDUSD',
    CHF: 'USDCHF',
  };
  if (singleCurrencyPairs[clean]) {
    const targetPair = singleCurrencyPairs[clean];
    const found = PRIMARY_INSTRUMENTS.find(i => i.symbolKey === targetPair);
    if (found) return found;
  }

  // 6. Common index / commodity aliases
  if (clean === 'DXY' || clean === 'DOLLAR') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'USD')!;
  }
  if (clean === 'GOLD' || clean === 'XAU') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'XAUUSD')!;
  }
  if (clean === 'BTCUSD' || clean === 'BITCOIN') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'BTC')!;
  }
  if (clean === 'DJI' || clean === 'DOW' || clean === 'US30') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'US30')!;
  }
  if (clean === 'SPX' || clean === 'SP500' || clean === 'US500') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'US500')!;
  }
  if (clean === 'NDX' || clean === 'NASDAQ' || clean === 'NAS100' || clean === 'US100') {
    return PRIMARY_INSTRUMENTS.find(i => i.symbolKey === 'US100')!;
  }

  // 7. Generic ticker fallback (e.g., custom stock or crypto)
  return {
    symbolKey: clean,
    tvSymbol: clean.length <= 5 ? `NASDAQ:${clean}` : `FX:${clean}`,
    label: clean,
    description: `${clean} Real-Time Chart`,
  };
}

export const TradingViewChartModal: React.FC<TradingViewChartModalProps> = ({
  initialSymbol,
  prices,
  onClose,
}) => {
  const [selectedMeta, setSelectedMeta] = useState<TVSymbolMeta>(() =>
    resolveSymbolToTVMeta(initialSymbol, prices)
  );
  const [interval, setInterval] = useState<string>('15');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Sync whenever initialSymbol changes (e.g. user clicked AUDCAD or another card)
  useEffect(() => {
    if (initialSymbol) {
      const resolved = resolveSymbolToTVMeta(initialSymbol, prices);
      setSelectedMeta(resolved);
    }
  }, [initialSymbol, prices]);

  const handleCustomSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const resolved = resolveSymbolToTVMeta(searchQuery.trim(), prices);
    setSelectedMeta(resolved);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Match live price from system
  const currentPrice = prices.find(
    p =>
      p.symbol.toUpperCase() === selectedMeta.symbolKey.toUpperCase() ||
      p.tv_symbol?.toUpperCase() === selectedMeta.tvSymbol.toUpperCase() ||
      p.display_name.toUpperCase().includes(selectedMeta.symbolKey.toUpperCase())
  );

  // Build iframe embed URL for real-time non-delayed TradingView chart
  const tvWidgetUrl = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    selectedMeta.tvSymbol
  )}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id&hide_side_toolbar=0&allow_symbol_change=1&saveimage=1&details=1&calendar=1&hotlist=0`;

  // Selected instrument list with active item guaranteed to appear first if not in standard list
  const quickInstruments = React.useMemo(() => {
    const list = [...PRIMARY_INSTRUMENTS];
    const exists = list.some(i => i.tvSymbol === selectedMeta.tvSymbol || i.symbolKey === selectedMeta.symbolKey);
    if (!exists) {
      list.unshift(selectedMeta);
    }
    return list;
  }, [selectedMeta]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0d14] border border-white/[0.12] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3 sm:p-4 border-b border-white/[0.08] bg-[#0b0d14] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <h2 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
                <span>{selectedMeta.tvSymbol}</span>
                <Badge variant="emerald" className="text-[10px] font-mono font-bold">
                  NON-DELAYED • STREAMING
                </Badge>
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline font-mono">
              {selectedMeta.description}
            </span>
          </div>

          {/* Current Live Price Metric */}
          {currentPrice && (
            <div className="flex items-center gap-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 mr-1.5">Last Price:</span>
                <span className="text-white font-bold text-sm">
                  {currentPrice.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: currentPrice.symbol === 'JPY' ? 4 : 2,
                  })}
                </span>
              </div>
              <Badge
                variant={currentPrice.change_24h_pct >= 0 ? 'emerald' : 'rose'}
                className="text-[11px] font-mono font-semibold"
              >
                {currentPrice.change_24h_pct >= 0 ? '+' : ''}
                {currentPrice.change_24h_pct.toFixed(2)}%
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Direct TradingView Link for the EXACT selected instrument (e.g. FX:AUDCAD) */}
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedMeta.tvSymbol)}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-md text-xs font-mono bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title={`Open ${selectedMeta.label} (${selectedMeta.tvSymbol}) chart on TradingView`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium">TradingView ↗</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instrument Switcher Tabs, Custom Search, & Timeframe Bar */}
        <div className="px-3 py-2 bg-[#090b12] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {/* Quick Instrument Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 hidden sm:inline">
              Pairs:
            </span>
            {quickInstruments.map((inst) => {
              const isSelected = selectedMeta.tvSymbol === inst.tvSymbol || selectedMeta.symbolKey === inst.symbolKey;
              return (
                <button
                  key={inst.symbolKey}
                  onClick={() => {
                    setSelectedMeta(inst);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white/[0.1] text-cyan-300 font-bold border border-cyan-400/60 shadow-xs'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.08]'
                  }`}
                >
                  <span>{inst.label}</span>
                </button>
              );
            })}

            {/* Custom Symbol Search Button */}
            {isSearchOpen ? (
              <form onSubmit={handleCustomSymbolSubmit} className="flex items-center gap-1">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. AUDCAD, XAUUSD"
                  className="h-7 w-36 text-xs bg-neutral-900 border-neutral-700 text-neutral-100 px-2 py-0"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono"
                >
                  Go
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                  className="h-7 w-7 text-neutral-400 hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="h-7 px-2 py-1 text-xs font-mono bg-neutral-900/60 text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800 border-neutral-800 flex items-center gap-1"
                title="Search any ticker symbol"
              >
                <Search className="w-3 h-3" />
                <span>Search</span>
              </Button>
            )}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase text-slate-500 mr-1 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> TF:
            </span>
            {[
              { label: '1m', val: '1' },
              { label: '5m', val: '5' },
              { label: '15m', val: '15' },
              { label: '1h', val: '60' },
              { label: '4h', val: '240' },
              { label: '1D', val: 'D' },
            ].map((tf) => (
              <button
                key={tf.val}
                onClick={() => setInterval(tf.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  interval === tf.val
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Interactive Real-time Chart Stage */}
        <div className="flex-1 w-full bg-[#07090e] relative overflow-hidden">
          <iframe
            key={`${selectedMeta.tvSymbol}-${interval}`}
            src={tvWidgetUrl}
            title={`TradingView Chart - ${selectedMeta.tvSymbol}`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-white/[0.08] bg-[#0b0d14] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feed Source: TradingView Real-Time Non-Delayed WebSocket ({selectedMeta.tvSymbol})</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedMeta.tvSymbol)}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              <span>Buka di TradingView</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-white/[0.1]">•</span>
            <span className="text-slate-500">Continuous 24/5 CFD / 24/7 Crypto Live Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};
