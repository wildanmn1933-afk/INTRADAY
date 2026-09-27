import React from 'react';
import { MarketPrice } from '../types';
import { TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface TickerBarProps {
  prices: MarketPrice[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
  onClose?: () => void;
}

export const TickerBar: React.FC<TickerBarProps> = React.memo(({
  prices,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
  onClose,
}) => {
  const { t } = useLanguage();

  return (
    <div
      className="border-b overflow-x-auto no-scrollbar scroll-hint-x h-7 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 select-none text-[11px] font-mono transition-colors"
      style={{
        backgroundColor: 'var(--bg-section-alt)',
        borderColor: 'var(--border-hairline)',
      }}
      id="market-ticker-strip"
    >
      <div className="flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar">
        {/* Pulse Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--bullish)] animate-pulse" />
          <span>{t('ticker.stream')}</span>
        </div>

        {/* Realtime Asset Items - Seamless Flow without bulky borders */}
        <div className="flex items-center gap-4 shrink-0">
          {prices.map(item => {
            const isSelected = selectedSymbol === item.symbol;
            const isPositive = item.change_24h_pct > 0;
            const isNegative = item.change_24h_pct < 0;

            const formattedPrice = item.symbol === 'US10Y'
              ? `${item.price.toFixed(3)}%`
              : item.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: item.symbol === 'JPY' || item.asset_type === 'FOREX' ? 4 : 2,
                });

            return (
              <button
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`flex items-center gap-1.5 transition cursor-pointer shrink-0 py-0.5 px-1.5 rounded text-[11px] font-mono tabular-nums ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
                title={`${t('ticker.filterBy')} ${item.symbol}`}
              >
                <span className="font-bold text-[var(--text-primary)]">{item.symbol}</span>
                <span className="font-medium text-[var(--text-secondary)]">{formattedPrice}</span>
                <span
                  className={`flex items-center text-[10px] font-semibold ${
                    isPositive
                      ? 'text-[var(--bullish)]'
                      : isNegative
                      ? 'text-[var(--bearish)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {item.change_24h_pct.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dismiss / Close Action */}
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer shrink-0 ml-auto"
          title={t('ticker.hideBar')}
          aria-label={t('ticker.hideBar')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

TickerBar.displayName = 'TickerBar';

