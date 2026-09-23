import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarketDataGrid } from '../../components/MarketDataGrid';
import { MarketPrice } from '../../types';

const mockPrices: MarketPrice[] = [
  {
    symbol: 'EURUSD',
    display_name: 'EUR / USD',
    asset_type: 'FOREX',
    price: 1.0850,
    change_24h: 0.0027,
    change_24h_pct: 0.25,
    high_24h: 1.0890,
    low_24h: 1.0820,
    volume_24h: 100000,
    status: 'LIVE',
    source: 'TradingView',
    timestamp: '2026-09-23T08:00:00Z',
    last_updated: '2026-09-23T08:00:00Z',
    sparkline_1h: [1.084, 1.085],
  },
  {
    symbol: 'BTCUSDT',
    display_name: 'Bitcoin',
    asset_type: 'CRYPTO',
    price: 65000,
    change_24h: -980,
    change_24h_pct: -1.5,
    high_24h: 66500,
    low_24h: 64200,
    volume_24h: 500000,
    status: 'LIVE',
    source: 'Binance',
    timestamp: '2026-09-23T08:00:00Z',
    last_updated: '2026-09-23T08:00:00Z',
    sparkline_1h: [65500, 65000],
  },
];

describe('MarketDataGrid component', () => {
  it('renders market instruments correctly', () => {
    const handleSelectSymbol = vi.fn();
    const handleToggleWatchlist = vi.fn();
    const handleRefresh = vi.fn();

    render(
      <MarketDataGrid
        prices={mockPrices}
        watchlistSymbols={[]}
        onToggleWatchlist={handleToggleWatchlist}
        onRefresh={handleRefresh}
        isRefreshing={false}
        onSelectSymbol={handleSelectSymbol}
      />
    );

    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
  });

  it('filters by category when button is clicked', () => {
    render(
      <MarketDataGrid
        prices={mockPrices}
        watchlistSymbols={[]}
        onToggleWatchlist={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing={false}
        onSelectSymbol={vi.fn()}
      />
    );

    // Filter to FOREX only
    const forexBtn = screen.getByRole('button', { name: /^FOREX$/i });
    fireEvent.click(forexBtn);

    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const handleRefresh = vi.fn();
    render(
      <MarketDataGrid
        prices={mockPrices}
        watchlistSymbols={[]}
        onToggleWatchlist={vi.fn()}
        onRefresh={handleRefresh}
        isRefreshing={false}
        onSelectSymbol={vi.fn()}
      />
    );

    const refreshBtn = document.getElementById('refresh-surveillance-btn');
    expect(refreshBtn).toBeInTheDocument();
    if (refreshBtn) {
      fireEvent.click(refreshBtn);
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    }
  });
});
