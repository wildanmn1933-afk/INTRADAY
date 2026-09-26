import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Menu,
  Search,
  Globe2,
  RefreshCw,
  Clock,
  X,
  Zap,
  Sun,
  Moon,
  Radio,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  Sparkles,
  Compass,
  CornerDownLeft,
  Flame,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { SSEConnectionState } from '../lib/useSSE';
import { NavTabId } from './Sidebar';
import { Tooltip, MetricTooltip } from './Tooltip';
import { Button } from './ui/button';
import { User, MarketPrice, MarketEvent, EconomicEvent } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  sseStatus: SSEConnectionState;
  sessions: any[];
  onTriggerGlobalSync: () => void;
  isSyncing: boolean;
  onToggleMobileMenu: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAutoTriggerModal?: () => void;
  isAutoTriggerActive?: boolean;
  autoTriggerSecondsRemaining?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  user?: User | null;
  onOpenAuth?: () => void;
  prices?: MarketPrice[];
  events?: MarketEvent[];
  calendar?: EconomicEvent[];
  onSelectSymbol?: (symbol: string) => void;
  onOpenChart?: (symbol: string) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  setActiveTab,
  sseStatus,
  sessions,
  onTriggerGlobalSync,
  isSyncing,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
  onOpenAutoTriggerModal,
  isAutoTriggerActive = false,
  autoTriggerSecondsRemaining = 0,
  theme = 'dark',
  onToggleTheme,
  user,
  onOpenAuth,
  prices = [],
  events = [],
  calendar = [],
  onSelectSymbol,
  onOpenChart,
}) => {
  const [timeState, setTimeState] = useState<{
    wibTime: string;
    utcTime: string;
    dateStr: string;
  }>({
    wibTime: '',
    utcTime: '',
    dateStr: '',
  });

  // Autocomplete & Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem('autocomplete_recent_header');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('autocomplete_recent_header', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(s => s !== term);
      setRecentSearches(updated);
      localStorage.setItem('autocomplete_recent_header', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System Views for Navigation Autocomplete
  const systemViews = useMemo(() => [
    { id: 'terminal' as NavTabId, label: 'Overview & Wire', desc: 'Canonical wire and real-time news stream', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'daily_report' as NavTabId, label: 'Daily Market Report', desc: 'Executive daily intelligence briefing & tactical playbook', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'arah_market' as NavTabId, label: 'Market Bias & Catalysts', desc: 'High-impact directional bias and drivers', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'markets' as NavTabId, label: 'Intraday Market Surveillance', desc: 'Asset heatmap and intraday session map', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'intermarket' as NavTabId, label: 'Intermarket Matrix', desc: 'Cross-asset flows & macro correlations', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'currency' as NavTabId, label: 'Currency Strength G8', desc: 'G8 currency relative strength ranking', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'macro' as NavTabId, label: 'Macro Economic Calendar', desc: 'Central bank releases, GDP, and CPI data', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'intelligence' as NavTabId, label: 'AI Market Intelligence', desc: 'Synthesis, macro regime, and scenario modeling', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'watchlist' as NavTabId, label: 'Watchlist & Pinned Assets', desc: 'Personalized asset tracking and alerts', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'admin' as NavTabId, label: 'System & Feeds Admin', desc: 'Data sources, deduplication, and feeds', icon: <Globe2 className="w-3.5 h-3.5" /> },
  ], []);

  // Filtered Autocomplete Suggestions
  const suggestions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    
    // 1. Instruments
    const matchedInstruments = (prices && prices.length > 0 ? prices : [
      { symbol: 'EUR/USD', display_name: 'Euro / US Dollar', price: 1.0842, change_24h_pct: 0.15, asset_type: 'FOREX' },
      { symbol: 'GBP/USD', display_name: 'British Pound / US Dollar', price: 1.2915, change_24h_pct: -0.22, asset_type: 'FOREX' },
      { symbol: 'USD/JPY', display_name: 'US Dollar / Japanese Yen', price: 154.20, change_24h_pct: 0.45, asset_type: 'FOREX' },
      { symbol: 'XAU/USD', display_name: 'Gold Spot / US Dollar', price: 2715.50, change_24h_pct: 0.68, asset_type: 'COMMODITY' },
      { symbol: 'BTC/USD', display_name: 'Bitcoin / US Dollar', price: 91400.0, change_24h_pct: 2.1, asset_type: 'CRYPTO' },
      { symbol: 'US10Y', display_name: 'US 10-Year Treasury Yield', price: 4.42, change_24h_pct: 0.05, asset_type: 'BOND' },
    ] as MarketPrice[])
      .filter(p => !q || p.symbol.toLowerCase().includes(q) || (p.display_name && p.display_name.toLowerCase().includes(q)))
      .slice(0, 5);

    // 2. Navigation Views
    const matchedViews = systemViews
      .filter(v => !q || v.label.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q) || v.id.toLowerCase().includes(q))
      .slice(0, 4);

    // 3. Macro Indicators & Catalysts
    const defaultMajorCatalysts = [
      { name: 'Fed Interest Rate Decision (FOMC)', currency: 'USD', impact: 'CRITICAL' },
      { name: 'US CPI (Consumer Price Index YoY)', currency: 'USD', impact: 'CRITICAL' },
      { name: 'US Non-Farm Payrolls (NFP)', currency: 'USD', impact: 'HIGH' },
      { name: 'ECB Monetary Policy Decision', currency: 'EUR', impact: 'HIGH' },
      { name: 'BoJ Policy Rate & Yield Curve', currency: 'JPY', impact: 'HIGH' },
      { name: 'US Core PCE Price Index', currency: 'USD', impact: 'HIGH' },
      { name: 'Crude Oil Inventories (EIA)', currency: 'USD', impact: 'MEDIUM' },
    ];

    const calendarPool = calendar && calendar.length > 0 
      ? calendar.map(c => ({ name: c.event_name, currency: c.currency, impact: c.impact }))
      : defaultMajorCatalysts;

    const uniqueCatalysts = Array.from(new Map(calendarPool.map(c => [c.name, c])).values());
    const matchedCatalysts = uniqueCatalysts
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q))
      .slice(0, 4);

    // 4. News Headlines (when typing)
    const matchedNews = q && events && events.length > 0
      ? events.filter(e => e.title.toLowerCase().includes(q) || (e.affected_assets || []).some(a => a.toLowerCase().includes(q))).slice(0, 3)
      : [];

    return {
      instruments: matchedInstruments,
      views: matchedViews,
      catalysts: matchedCatalysts,
      news: matchedNews,
    };
  }, [searchQuery, prices, systemViews, calendar, events]);

  // Flattened for keyboard navigation
  const flattenedItems = useMemo(() => {
    const list: { type: string; id: string; action: () => void }[] = [];
    
    suggestions.instruments.forEach(inst => {
      list.push({
        type: 'instrument',
        id: `inst-${inst.symbol}`,
        action: () => {
          onSelectSymbol?.(inst.symbol);
          onSearchChange?.(inst.symbol);
          setActiveTab('terminal');
          saveRecentSearch(inst.symbol);
          setIsSearchOpen(false);
        }
      });
    });

    suggestions.views.forEach(v => {
      list.push({
        type: 'view',
        id: `view-${v.id}`,
        action: () => {
          setActiveTab(v.id);
          saveRecentSearch(v.label);
          setIsSearchOpen(false);
        }
      });
    });

    suggestions.catalysts.forEach(cat => {
      list.push({
        type: 'catalyst',
        id: `cat-${cat.name}`,
        action: () => {
          onSearchChange?.(cat.name);
          setActiveTab('macro');
          saveRecentSearch(cat.name);
          setIsSearchOpen(false);
        }
      });
    });

    suggestions.news.forEach(n => {
      list.push({
        type: 'news',
        id: `news-${n.id}`,
        action: () => {
          onSearchChange?.(n.title.slice(0, 30));
          setActiveTab('terminal');
          saveRecentSearch(n.title.slice(0, 30));
          setIsSearchOpen(false);
        }
      });
    });

    return list;
  }, [suggestions, onSelectSymbol, onSearchChange, setActiveTab]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsSearchOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < flattenedItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : flattenedItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < flattenedItems.length) {
        flattenedItems[highlightedIndex].action();
      } else if (searchQuery?.trim()) {
        saveRecentSearch(searchQuery);
        setIsSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const renderHighlighted = (text: string, q?: string) => {
    if (!q || !q.trim()) return text;
    const query = q.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span className="font-bold underline text-[var(--accent)] decoration-[var(--accent)]">
          {text.substring(idx, idx + query.length)}
        </span>
        {text.substring(idx + query.length)}
      </>
    );
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();

      const wibTime = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const utcTime = now.toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      setTimeState({ dateStr, wibTime: `${wibTime} WIB`, utcTime: `${utcTime} UTC` });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatViewLabel = (tab: NavTabId): string => {
    switch (tab) {
      case 'terminal':
        return 'Overview';
      case 'arah_market':
        return 'Market bias';
      case 'intermarket':
        return 'Intermarket flows';
      case 'markets':
        return 'Market surveillance';
      case 'currency':
        return 'Currency strength G8';
      case 'history':
        return 'Historical memory';
      case 'macro':
        return 'Economic calendar';
      case 'events':
        return 'Canonical news wire';
      case 'intelligence':
        return 'AI market intelligence';
      case 'watchlist':
        return 'Active watchlist';
      case 'admin':
        return 'System & feeds';
      default:
        return String(tab)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  // Only display currently active / open sessions
  const activeSessions = useMemo(() => {
    return (sessions || []).filter(s => s.current_status === 'OPEN');
  }, [sessions]);

  const activeSessionName = activeSessions.length > 0
    ? activeSessions.map(s => s.session_name.toUpperCase()).join(' + ')
    : 'ASIA SESSION';

  return (
    <header
      className="border-b sticky top-0 z-30 shrink-0 transition-colors terminal-header"
      style={{
        background: 'var(--bg-header)',
        borderColor: 'var(--border-hairline)',
      }}
      id="arah-market-header"
    >
      <div className="h-14 px-4 sm:px-5 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu + View Title + Live Status */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)] lg:hidden cursor-pointer transition"
            title="Open Navigation"
            id="mobile-menu-toggle-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
              {formatViewLabel(activeTab)}
            </span>

            {/* Connection Live Indicator */}
            <Tooltip
              title="SSE Streaming Feed"
              badge={sseStatus === 'CONNECTED' ? 'LIVE' : 'RECONNECTING'}
              badgeColor={
                sseStatus === 'CONNECTED'
                  ? 'badge-bullish text-[9px] px-1 py-0'
                  : 'badge-warning text-[9px] px-1 py-0'
              }
              content={
                sseStatus === 'CONNECTED'
                  ? 'Live Server-Sent Events stream connected. Institutional price ticks and canonical wires streaming with zero delay.'
                  : 'Re-establishing high-frequency institutional feed connection.'
              }
              whyItMatters="Guarantees actionable real-time signals without manual browser reloads."
              position="bottom"
            >
              <div className="flex items-center gap-1.5 cursor-help">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sseStatus === 'CONNECTED' ? 'bg-[var(--bullish)]' : 'bg-[var(--warning)] animate-ping'
                  }`}
                />
                <span className="metadata-label text-[9px] text-[var(--text-muted)]">
                  {sseStatus === 'CONNECTED' ? 'Live' : 'Syncing'}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Center Section: Smart Autocomplete Search Bar */}
        {onSearchChange && (
          <div ref={searchContainerRef} className="hidden md:flex items-center relative w-64 lg:w-80 shrink-0">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${isSearchOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                setIsSearchOpen(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search ticker, news, catalyst, view..."
              className="h-8 w-full bg-[var(--bg-section-alt)] border border-transparent focus:border-[var(--border-strong)] rounded-md pl-8 pr-12 text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] transition outline-none shadow-xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchOpen(true);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-1 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[9px] font-mono text-[var(--text-muted)]">
                ⌘K
              </span>
            )}

            {/* Dropdown Autocomplete Panel */}
            {isSearchOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-2xl overflow-hidden max-h-[460px] flex flex-col backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                style={{ width: '100%', minWidth: '320px' }}
              >
                <div className="overflow-y-auto flex-1 divide-y divide-[var(--border-hairline)] scrollbar-thin">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="p-2">
                      <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Recent Searches
                        </span>
                        <button
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem('autocomplete_recent_header');
                          }}
                          className="hover:text-[var(--text-primary)] hover:underline cursor-pointer text-[10px]"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 px-1">
                        {recentSearches.map((term, i) => (
                          <span
                            key={i}
                            onClick={() => {
                              onSearchChange(term);
                              saveRecentSearch(term);
                              setIsSearchOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition border border-[var(--border-subtle)]"
                          >
                            <span>{term}</span>
                            <button
                              onClick={e => removeRecentSearch(e, term)}
                              className="opacity-50 hover:opacity-100 hover:text-[var(--bearish)] cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1. Instruments / Tickers Section */}
                  {suggestions.instruments.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-[var(--accent)]" /> Instruments & Pairs
                        </span>
                        <span className="text-[9px] lowercase opacity-70">press enter to select</span>
                      </div>
                      <div className="space-y-0.5 px-1">
                        {suggestions.instruments.map(inst => {
                          const itemIndex = flattenedItems.findIndex(f => f.id === `inst-${inst.symbol}`);
                          const isHigh = itemIndex === highlightedIndex;
                          const isUp = (inst.change_24h_pct || 0) >= 0;

                          return (
                            <div
                              key={inst.symbol}
                              onMouseEnter={() => setHighlightedIndex(itemIndex)}
                              onClick={() => {
                                onSelectSymbol?.(inst.symbol);
                                onSearchChange(inst.symbol);
                                setActiveTab('terminal');
                                saveRecentSearch(inst.symbol);
                                setIsSearchOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                                isHigh
                                  ? 'bg-[var(--active-bg)] text-[var(--active-text)] font-medium'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-mono px-1 py-0.2 rounded border ${
                                  inst.asset_type === 'CRYPTO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  inst.asset_type === 'COMMODITY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  inst.asset_type === 'BOND' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {inst.asset_type || 'FX'}
                                </span>
                                <div className="truncate">
                                  <span className="font-mono font-semibold">
                                    {renderHighlighted(inst.symbol, searchQuery)}
                                  </span>
                                  {inst.display_name && (
                                    <span className="ml-2 text-[11px] text-[var(--text-muted)] truncate font-sans">
                                      {inst.display_name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {inst.price !== undefined && (
                                  <span className="font-mono text-xs tabular-nums text-[var(--text-primary)]">
                                    {typeof inst.price === 'number' ? inst.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : inst.price}
                                  </span>
                                )}
                                {inst.change_24h_pct !== undefined && (
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                                    isUp ? 'text-[var(--bullish)] bg-[var(--bullish-subtle)]' : 'text-[var(--bearish)] bg-[var(--bearish-subtle)]'
                                  }`}>
                                    {isUp ? '+' : ''}{Number(inst.change_24h_pct).toFixed(2)}%
                                  </span>
                                )}
                                {onOpenChart && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      onOpenChart(inst.symbol);
                                      setIsSearchOpen(false);
                                    }}
                                    className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-canvas)] rounded cursor-pointer"
                                    title="Open interactive chart"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {isHigh && <CornerDownLeft className="w-3 h-3 text-[var(--text-muted)]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Navigation Views Section */}
                  {suggestions.views.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                        <Compass className="w-3 h-3 text-[var(--accent)]" /> Quick Jump Navigation
                      </div>
                      <div className="space-y-0.5 px-1">
                        {suggestions.views.map(v => {
                          const itemIndex = flattenedItems.findIndex(f => f.id === `view-${v.id}`);
                          const isHigh = itemIndex === highlightedIndex;

                          return (
                            <div
                              key={v.id}
                              onMouseEnter={() => setHighlightedIndex(itemIndex)}
                              onClick={() => {
                                setActiveTab(v.id);
                                saveRecentSearch(v.label);
                                setIsSearchOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                                isHigh
                                  ? 'bg-[var(--active-bg)] text-[var(--active-text)] font-medium'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[var(--text-muted)]">{v.icon}</span>
                                <div className="truncate">
                                  <span className="font-medium">
                                    {renderHighlighted(v.label, searchQuery)}
                                  </span>
                                  <span className="ml-2 text-[11px] text-[var(--text-muted)] truncate">
                                    {v.desc}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                                <span>Switch</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Macro Catalysts & Indicators Section */}
                  {suggestions.catalysts.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[var(--accent)]" /> Macro Indicators & Catalysts
                      </div>
                      <div className="space-y-0.5 px-1">
                        {suggestions.catalysts.map(cat => {
                          const itemIndex = flattenedItems.findIndex(f => f.id === `cat-${cat.name}`);
                          const isHigh = itemIndex === highlightedIndex;

                          return (
                            <div
                              key={cat.name}
                              onMouseEnter={() => setHighlightedIndex(itemIndex)}
                              onClick={() => {
                                onSearchChange(cat.name);
                                setActiveTab('macro');
                                saveRecentSearch(cat.name);
                                setIsSearchOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                                isHigh
                                  ? 'bg-[var(--active-bg)] text-[var(--active-text)] font-medium'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                  {cat.currency || 'MACRO'}
                                </span>
                                <div className="truncate font-sans">
                                  {renderHighlighted(cat.name, searchQuery)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {cat.impact && (
                                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                                    cat.impact === 'CRITICAL' ? 'badge-bearish' :
                                    cat.impact === 'HIGH' ? 'badge-warning' : 'badge-neutral'
                                  }`}>
                                    {cat.impact}
                                  </span>
                                )}
                                {isHigh && <CornerDownLeft className="w-3 h-3 text-[var(--text-muted)]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Live News Headlines Matching Query */}
                  {suggestions.news.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-[var(--warning)]" /> News Wire Matches
                      </div>
                      <div className="space-y-0.5 px-1">
                        {suggestions.news.map(n => {
                          const itemIndex = flattenedItems.findIndex(f => f.id === `news-${n.id}`);
                          const isHigh = itemIndex === highlightedIndex;

                          return (
                            <div
                              key={n.id}
                              onMouseEnter={() => setHighlightedIndex(itemIndex)}
                              onClick={() => {
                                onSearchChange(n.title.slice(0, 30));
                                setActiveTab('terminal');
                                saveRecentSearch(n.title.slice(0, 30));
                                setIsSearchOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                                isHigh
                                  ? 'bg-[var(--active-bg)] text-[var(--active-text)] font-medium'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="truncate font-medium">
                                  {renderHighlighted(n.title, searchQuery)}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                                  <span>{n.source_names?.[0] || 'Wire'}</span>
                                  {n.affected_assets && n.affected_assets.length > 0 && (
                                    <span>· {n.affected_assets.slice(0, 2).join(', ')}</span>
                                  )}
                                </div>
                              </div>
                              {isHigh && <CornerDownLeft className="w-3 h-3 text-[var(--text-muted)] shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty Result */}
                  {searchQuery && 
                   suggestions.instruments.length === 0 && 
                   suggestions.views.length === 0 && 
                   suggestions.catalysts.length === 0 && 
                   suggestions.news.length === 0 && (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      No exact ticker or view matches for &ldquo;<span className="text-[var(--text-primary)] font-medium">{searchQuery}</span>&rdquo;
                      <div className="mt-1 text-[11px] opacity-75">Press Enter to filter news feed wire anyway</div>
                    </div>
                  )}
                </div>

                {/* Footer Controls & Shortcut Legend */}
                <div className="px-3 py-1.5 bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <div className="flex items-center gap-3">
                    <span>↑↓ Navigate</span>
                    <span>↵ Jump</span>
                    <span>ESC Close</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--accent)] font-medium">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Section: Market Status, Exact Time, Theme Toggle, Actions */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          {/* Active Session & Market Open Status */}
          <div className="hidden xl:flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bullish)]" />
            <span className="font-semibold text-[var(--text-primary)]">Market open</span>
            <span className="text-[var(--border-strong)]">/</span>
            <span className="text-[var(--text-muted)]">{activeSessionName}</span>
          </div>

          {/* Current Date & Time (Tabular Numerals) */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] tabular-nums">
            <span className="text-[var(--text-muted)] font-mono">{timeState.dateStr}</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="font-semibold text-[var(--text-primary)] font-mono">
              {timeState.wibTime || 'LIVE'}
            </span>
          </div>

          <span className="hidden xl:block w-px h-5 bg-[var(--border-hairline)]" />

          {/* Theme Toggle */}
          {onToggleTheme && (
            <ThemeToggle
              theme={theme}
              onToggle={onToggleTheme}
              variant="pill"
            />
          )}

          {/* Auto-Trigger News Button */}
          {onOpenAutoTriggerModal && (
            <button
              onClick={onOpenAutoTriggerModal}
              className={`h-8 px-2.5 rounded-md text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                isAutoTriggerActive
                  ? 'badge-warning'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)]'
              }`}
              title="News Auto-Trigger Settings"
              id="open-auto-trigger-modal-btn"
            >
              <Zap className={`w-3 h-3 ${isAutoTriggerActive ? 'text-[var(--warning)] animate-pulse' : ''}`} />
              <span className="hidden md:inline">
                {isAutoTriggerActive ? `Trigger (${autoTriggerSecondsRemaining}s)` : 'Trigger'}
              </span>
            </button>
          )}

          {/* Global Ingestion Sync Trigger */}
          <button
            onClick={onTriggerGlobalSync}
            disabled={isSyncing}
            className="h-8 px-2.5 rounded-md text-[var(--text-primary)] text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 hover:bg-[var(--bg-section-alt)]"
            title="Synchronize all real-time market feeds"
            id="global-sync-btn"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[var(--accent)]' : ''}`} />
            <span className="hidden sm:inline font-semibold">{isSyncing ? 'Syncing' : 'Sync'}</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
