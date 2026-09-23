import React from 'react';
import { MarketPrice } from '../types';
import { TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';

interface TickerBarProps {
  prices: MarketPrice[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = React.memo(({
  prices,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
}) => {
  return (
    <div className="bg-[#080a10] border-b border-white/[0.08] overflow-x-auto no-scrollbar py-1.5 px-3 sm:px-4 flex items-center gap-2.5">
      {/* Feed Label */}
      <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-white/[0.08] text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        </span>
        <span className="hidden sm:inline">TERMINAL FEED</span>
      </div>

      {/* Non-Delayed Charts Action */}
      {onOpenChart && (
        <button
          onClick={() => onOpenChart('US30')}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/50 hover:border-cyan-400/50 text-cyan-300 text-[11px] font-mono font-medium shrink-0 transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
          title="Buka Non-Delayed TradingView Charts (US30, SPX500, BTCUSD, DXY, US100)"
        >
          <LineChart className="w-3.5 h-3.5 text-cyan-400" />
          <span>Non-Delayed Charts</span>
        </button>
      )}

      {/* Realtime Asset Pills */}
      <div className="flex items-center gap-2 shrink-0">
        {prices.map(item => {
          const isSelected = selectedSymbol === item.symbol;
          const isPositive = item.change_24h_pct > 0;
          const isNegative = item.change_24h_pct < 0;

          // Decimal precision based on asset class
          let formattedPrice = item.symbol === 'US10Y'
            ? `${item.price.toFixed(3)}%`
            : item.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: item.symbol === 'JPY' || item.asset_type === 'FOREX' ? 4 : 2,
              });

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`flex items-center gap-2.5 h-7 px-2.5 rounded-lg border text-xs font-mono transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400/80 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300 hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 tracking-tight">{item.symbol}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.status === 'LIVE'
                      ? 'bg-emerald-400'
                      : item.status === 'DELAYED'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  title={`${item.status} • ${item.source}`}
                />
              </div>

              <span className="font-semibold text-slate-100 tabular-nums">{formattedPrice}</span>

              <div
                className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
                  isPositive
                    ? 'text-emerald-400'
                    : isNegative
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                ) : isNegative ? (
                  <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {item.change_24h_pct.toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

TickerBar.displayName = 'TickerBar';
