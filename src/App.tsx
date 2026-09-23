import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  User,
  UserWatchlist,
  IntradayAssetBias,
  TodayCatalyst,
  ArahMarketTodayData,
} from './types';
import { api, setAuthToken, getAuthToken, getStoredUser, setStoredUser } from './lib/api';

import { Sidebar, NavTabId } from './components/Sidebar';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { CurrencyStrengthWidget } from './components/CurrencyStrengthWidget';
import { MarketDataGrid } from './components/MarketDataGrid';
import { MacroCalendarView } from './components/MacroCalendarView';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { AdminPanel } from './components/AdminPanel';
import { WatchlistView } from './components/WatchlistView';
import { TradingViewChartModal } from './components/TradingViewChartModal';
import { IntradayMarketMapView } from './components/IntradayMarketMapView';
import { TodayCatalystsView } from './components/TodayCatalystsView';
import { ArahMarketView } from './components/ArahMarketView';
import { CurrencyPairOpportunityMatrix } from './components/CurrencyPairOpportunityMatrix';
import { IntermarketRelationshipMatrix } from './components/IntermarketRelationshipMatrix';
import { MarketHistoryView } from './components/MarketHistoryView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PublicLandingPage } from './components/PublicLandingPage';
import { AuthPage } from './components/AuthPage';
import { AutoTriggerNewsModal } from './components/AutoTriggerNewsModal';
import { BreakingNewsAlertPopup } from './components/BreakingNewsAlertPopup';
import { Toaster } from './components/ui/sonner';
import { useMarketDataStream } from './hooks/useMarketDataStream';
import { useNewsAlertManager } from './hooks/useNewsAlertManager';
import {
  useLocation,
  isPublicRoute,
  isPrivateRoute,
  routeToTab,
  tabToRoute,
} from './lib/router';
import { motion, AnimatePresence } from 'motion/react';

import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  Compass,
  Zap,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart2,
  Flame,
  Filter,
} from 'lucide-react';

export default function App() {
  // Router Location
  const { path, navigate } = useLocation();
  // If an auth token is stored in localStorage or memory, set isAuthChecking true so route enforcement waits for validation
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => Boolean(getAuthToken()));

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTabId>(() => routeToTab(path));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop compact
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);

  // User State
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  // News impact filter: default to HIGH so traders see high-impact news with accurate pair impacts
  const [impactFilter, setImpactFilter] = useState<'HIGH' | 'CRITICAL' | 'ALL'>('HIGH');

  // Pagination for Canonical Event Wire (optimized rendering for large event lists)
  const [wirePage, setWirePage] = useState(1);
  const WIRE_PAGE_SIZE = 18;

  // Modular Hook 1: News & Breaking News Alert Manager
  const {
    autoTriggerConfig,
    isAutoTriggerModalOpen,
    setIsAutoTriggerModalOpen,
    autoTriggerSecondsRemaining,
    totalTriggeredCount,
    newsAlerts,
    isTriggeringNews,
    markAlertAsSeen,
    handleUpdateAutoTriggerConfig,
    handleTriggerNewsNow,
    handleDismissAlert,
    handleDismissAllAlerts,
    addAlert,
  } = useNewsAlertManager({
    onEventReceived: (newEvent) => {
      setEvents(prev => [newEvent, ...prev.filter(e => e.id !== newEvent.id)]);
    },
  });

  // Modular Hook 2: Core Data Collections & SSE Stream Manager
  const {
    prices,
    setPrices,
    strengths,
    setStrengths,
    events,
    setEvents,
    calendar,
    setCalendar,
    overview,
    sessions,
    intradayMap,
    setIntradayMap,
    todayCatalysts,
    setTodayCatalysts,
    arahMarketData,
    setArahMarketData,

    sseStatus,
    initialLoading,
    isSyncing,
    isRefreshingPrices,
    isRefreshingCS,
    isRefreshingMacro,
    isRefreshingIntraday,
    isRefreshingCatalysts,
    isRefreshingArah,

    loadInitialData,
    triggerGlobalSync,
    refreshPrices,
    refreshCurrencyStrength,
    refreshIntradayMap,
    refreshCatalysts,
    refreshArahMarket,
    refreshEvents,
    refreshMacroCalendar,
  } = useMarketDataStream({
    autoTriggerConfig,
    onNewAlert: addAlert,
    markAlertAsSeen,
  });

  // Tab change handler that updates route
  const handleTabChange = useCallback((newTab: NavTabId) => {
    setActiveTab(newTab);
    const targetRoute = tabToRoute(newTab);
    if (targetRoute !== path) {
      navigate(targetRoute);
    }
  }, [navigate, path]);

  // Check current user session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        const cachedUser = getStoredUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
        }

        if (token) {
          try {
            const meRes = await api.getMe();
            if (isMounted) {
              setUser(meRes.user);
              setStoredUser(meRes.user);
              setWatchlist(meRes.watchlist || []);
            }
          } catch (apiErr: any) {
            // Only clear token if server explicitly responds with 401 or 403 (invalid/expired credentials)
            if (apiErr.status === 401 || apiErr.status === 403 || apiErr.code === 'INVALID_TOKEN') {
              console.warn('[Auth] Session token expired or invalid, signing out.');
              setAuthToken(null);
              setStoredUser(null);
              if (isMounted) setUser(null);
            } else {
              // Network disconnect, timeout or server restart: retain cached session!
              console.warn('[Auth] Network or transient notice during session check:', apiErr?.message);
            }
          }
        } else {
          setStoredUser(null);
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
          loadInitialData();
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [loadInitialData]);

  // Route enforcement & sync
  useEffect(() => {
    if (isAuthChecking) return;

    if (!user) {
      // Unauthenticated user attempting to access private route -> redirect to /login
      if (isPrivateRoute(path)) {
        navigate('/login', true);
      }
    } else {
      // Authenticated user
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/dashboard', true);
      } else if (isPrivateRoute(path)) {
        const expectedTab = routeToTab(path);
        if (expectedTab !== activeTab) {
          setActiveTab(expectedTab);
        }
      }
    }
  }, [user, path, isAuthChecking, navigate, activeTab]);

  // Watchlist Toggle
  const handleToggleWatchlist = useCallback(async (symbol: string, assetType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const exists = watchlist.some(w => w.symbol === symbol);
    if (exists) {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } else {
      const res = await api.addToWatchlist(symbol, assetType);
      if (res.item) setWatchlist(prev => [...prev, res.item]);
    }
  }, [user, watchlist, navigate]);

  // Logout Handler
  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setWatchlist([]);
    navigate('/login');
  }, [navigate]);

  const handleAuthSuccess = useCallback(async (u: User, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    setUser(u);
    setStoredUser(u);
    try {
      const me = await api.getMe();
      setUser(me.user);
      setStoredUser(me.user);
      setWatchlist(me.watchlist || []);
    } catch (err) {
      console.warn('Profile hydration notice:', err);
    }
    loadInitialData();
    navigate('/dashboard', true);
  }, [loadInitialData, navigate]);

  const handleSelectSymbol = useCallback((sym: string | null) => {
    setSelectedSymbol(prev => (prev === sym ? null : sym));
  }, []);

  const handleOpenChart = useCallback((sym: string) => {
    setChartModalSymbol(sym);
  }, []);

  const handleSelectEvent = useCallback((id: string | null) => {
    setSelectedEventId(id);
  }, []);

  // Filtered Events for Wire - strictly newest first
  const filteredEvents = useMemo(() => {
    return events
      .filter(e => {
        if (impactFilter === 'HIGH' && e.impact_level !== 'CRITICAL' && e.impact_level !== 'HIGH') {
          return false;
        }
        if (impactFilter === 'CRITICAL' && e.impact_level !== 'CRITICAL') {
          return false;
        }
        if (categoryFilter !== 'ALL' && e.primary_category !== categoryFilter) return false;
        if (selectedSymbol && !e.affected_assets.includes(selectedSymbol) && !e.affected_currencies.includes(selectedSymbol)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchSummary = e.summary.toLowerCase().includes(q);
          const matchSources = e.source_names.some(s => s.toLowerCase().includes(q));
          const matchAssets = e.affected_assets.some(a => a.toLowerCase().includes(q));
          const matchCurrs = e.affected_currencies.some(c => c.toLowerCase().includes(q));
          return matchTitle || matchSummary || matchSources || matchAssets || matchCurrs;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.first_detected_at).getTime() || 0;
        const timeB = new Date(b.first_detected_at).getTime() || 0;
        return timeB - timeA;
      });
  }, [events, impactFilter, categoryFilter, selectedSymbol, searchQuery]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setWirePage(1);
  }, [impactFilter, categoryFilter, selectedSymbol, searchQuery]);

  const totalWirePages = Math.max(1, Math.ceil(filteredEvents.length / WIRE_PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const startIndex = (wirePage - 1) * WIRE_PAGE_SIZE;
    return filteredEvents.slice(startIndex, startIndex + WIRE_PAGE_SIZE);
  }, [filteredEvents, wirePage, WIRE_PAGE_SIZE]);

  const watchlistSymbols = useMemo(() => watchlist.map(w => w.symbol), [watchlist]);

  // Screen 1: Session Verification
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20 animate-pulse">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-wider text-slate-100">
            ARAH <span className="text-cyan-400">MARKET</span>
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Verifying encrypted terminal session...</span>
        </div>
      </div>
    );
  }

  // Screen 2: Unauthenticated Visitor Flow (Auth Pages & Optional Public Landing)
  if (!user) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasToken = searchParams ? searchParams.has('token') : false;

    if (hasToken && path !== '/reset-password') {
      return (
        <AuthPage
          mode="verify-email"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/login') {
      return (
        <AuthPage
          mode="login"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/register') {
      return (
        <AuthPage
          mode="register"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/verify-email') {
      return (
        <AuthPage
          mode="verify-email"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/forgot-password') {
      return (
        <AuthPage
          mode="forgot-password"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/reset-password') {
      return (
        <AuthPage
          mode="reset-password"
          onNavigate={navigate}
          onSuccess={(u, tok) => handleAuthSuccess(u, tok)}
        />
      );
    }

    if (path === '/magic-link') {
      navigate('/login');
      return null;
    }

    if (path === '/landing' || path === '/features') {
      return (
        <PublicLandingPage
          currentPath={path}
          onNavigate={navigate}
          user={user}
        />
      );
    }

    // Default flow: direct access to the Linear Pro Terminal workspace for all visitors & traders
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        marketMapCount={intradayMap.length || 13}
        catalystsCount={todayCatalysts.length}
        user={user}
        onOpenAuth={() => navigate('/login')}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          sseStatus={sseStatus}
          sessions={sessions}
          onTriggerGlobalSync={triggerGlobalSync}
          isSyncing={isSyncing}
          onToggleMobileMenu={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAutoTriggerModal={() => setIsAutoTriggerModalOpen(true)}
          isAutoTriggerActive={autoTriggerConfig.enabled}
          autoTriggerSecondsRemaining={autoTriggerSecondsRemaining}
        />

        {/* Real-time Ticker Bar */}
        <TickerBar
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => {
            handleSelectSymbol(sym);
            if (activeTab !== 'terminal') handleTabChange('terminal');
          }}
          onOpenChart={handleOpenChart}
        />

        {/* Active Instrument Filter Strip */}
        {selectedSymbol && (
          <div className="bg-cyan-950/70 border-b border-cyan-800/60 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <span>FILTERED BY INSTRUMENT:</span>
              <strong className="text-white font-bold bg-cyan-900 px-2 py-0.5 rounded">{selectedSymbol}</strong>
              <span className="text-slate-400 hidden sm:inline">Highlighting events and macro correlations</span>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-cyan-400 hover:text-white underline cursor-pointer"
            >
              Clear Filter ×
            </button>
          </div>
        )}

        {/* 3. Primary Views Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-[1720px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-4"
            >
          {/* VIEW 1: TERMINAL / OVERVIEW DASHBOARD */}
          {activeTab === 'terminal' && (
            <OverviewDashboard
              intradayMap={intradayMap}
              todayCatalysts={todayCatalysts}
              prices={prices}
              strengths={strengths}
              events={filteredEvents}
              calendar={calendar}
              overview={overview}
              watchlistSymbols={watchlistSymbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={handleSelectSymbol}
              onNavigateTab={handleTabChange}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenChart={handleOpenChart}
              onSelectEvent={handleSelectEvent}
              onRefreshPrices={refreshPrices}
              isRefreshingPrices={isRefreshingPrices}
              onRefreshCS={refreshCurrencyStrength}
              isRefreshingCS={isRefreshingCS}
              onSyncWire={refreshEvents}
              isSyncingWire={isSyncing}
            />
          )}

          {/* VIEW 1.5: ARAH MARKET HARI INI (TRIPLE-CONFLUENCE INTRADAY) */}
          {activeTab === 'arah_market' && (
            <ArahMarketView
              data={arahMarketData}
              isLoading={initialLoading}
              onRefresh={refreshArahMarket}
              isRefreshing={isRefreshingArah}
              onOpenChart={handleOpenChart}
            />
          )}

          {/* VIEW 2: DEDICATED INTRADAY MARKET MAP (13 ASSETS) */}
          {activeTab === 'intraday_map' && (
            <IntradayMarketMapView
              data={intradayMap}
              prices={prices}
              onRefresh={refreshIntradayMap}
              isRefreshing={isRefreshingIntraday}
              onOpenChart={handleOpenChart}
            />
          )}

          {/* VIEW 3: TODAY'S KEY CATALYSTS */}
          {activeTab === 'today_catalysts' && (
            <TodayCatalystsView
              catalysts={todayCatalysts}
              onRefresh={refreshCatalysts}
              isRefreshing={isRefreshingCatalysts}
              onSelectAsset={handleSelectSymbol}
              onOpenChart={handleOpenChart}
            />
          )}

          {/* VIEW 4: LIVE MARKET SURVEILLANCE GRID */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              <MarketDataGrid
                prices={prices}
                watchlistSymbols={watchlistSymbols}
                intradayMap={intradayMap}
                onToggleWatchlist={handleToggleWatchlist}
                onRefresh={refreshPrices}
                isRefreshing={isRefreshingPrices}
                onSelectSymbol={handleSelectSymbol}
                onOpenChart={handleOpenChart}
              />
            </div>
          )}

          {/* VIEW: INTERMARKET RELATIONSHIP MATRIX */}
          {activeTab === 'intermarket' && (
            <IntermarketRelationshipMatrix
              prices={prices}
              strengths={strengths}
              onOpenChart={handleOpenChart}
              onSelectSymbol={handleSelectSymbol}
              onRefresh={async () => {
                await Promise.all([refreshPrices(), refreshCurrencyStrength()]);
              }}
              isRefreshing={isRefreshingPrices || isRefreshingCS}
            />
          )}

          {/* VIEW 5: CURRENCY MATRIX */}
          {activeTab === 'currency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <CurrencyStrengthWidget
                  strengths={strengths}
                  onRefresh={refreshCurrencyStrength}
                  isRefreshing={isRefreshingCS}
                />
              </div>

              <div className="lg:col-span-7">
                <CurrencyPairOpportunityMatrix
                  strengths={strengths}
                  onOpenChart={handleOpenChart}
                  onSelectSymbol={handleSelectSymbol}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: MACRO CALENDAR */}
          {activeTab === 'macro' && (
            <MacroCalendarView
              events={calendar}
              onRefresh={refreshMacroCalendar}
              isRefreshing={isRefreshingMacro}
            />
          )}

          {/* VIEW 7: CANONICAL EVENT WIRE */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>DEDUPLICATED EVENT ENGINE WIRE</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ONE EVENT → ONE EVENT ID → MULTIPLE SOURCES → MULTIPLE ASSETS → ONE ANALYSIS
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshEvents}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                      title="Sync wire with latest source releases"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>Sync Wire</span>
                    </button>

                    <input
                      type="text"
                      placeholder="Cari berita, pair, aset..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono text-slate-200 outline-none w-48 sm:w-60 focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Filter Controls: Impact Level & Category */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
                  {/* Impact Filter Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3 text-cyan-400" />
                      <span>Dampak:</span>
                    </span>

                    <button
                      onClick={() => setImpactFilter('HIGH')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        impactFilter === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-sm shadow-rose-950/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Tampilkan hanya berita High & Critical impact agar korelasi pair akurat"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>🔥 High Impact (Default)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/60 text-rose-200">
                        {events.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setImpactFilter('CRITICAL')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        impactFilter === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border-red-700 shadow-sm shadow-red-950/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Tampilkan hanya berita dampak kritis tertinggi (Fed rate, perang, krisis likuiditas)"
                    >
                      <Zap className="w-3.5 h-3.5 text-red-400" />
                      <span>⚡ Critical Only</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-900/60 text-red-200">
                        {events.filter(e => e.impact_level === 'CRITICAL').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setImpactFilter('ALL')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium border transition cursor-pointer ${
                        impactFilter === 'ALL'
                          ? 'bg-slate-800 text-slate-100 border-slate-700'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span>Semua Level ({events.length})</span>
                    </button>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                    {['ALL', 'MACRO', 'CENTRAL_BANK', 'COMMODITIES', 'GEOPOLITICS', 'CRYPTO'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition cursor-pointer border ${
                          categoryFilter === cat
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Impact Mode Explanatory Banner */}
                {impactFilter !== 'ALL' && (
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 flex items-center justify-between text-xs font-mono text-rose-200">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong className="text-rose-300">Penyaringan High Impact Aktif:</strong> Menampilkan hanya berita katalis penggerak pasar utama (Kebijakan Suku Bunga, Inflasi, Geopolitik, Komoditas) untuk memastikan presisi efek transmisi terhadap pair (XAUUSD, Forex, Indeks).
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline ml-2">
                      {filteredEvents.length} dari {events.length} berita
                    </span>
                  </div>
                )}
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Flame className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">Tidak ada berita yang cocok dengan filter</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tidak ditemukan berita {impactFilter !== 'ALL' ? `dengan dampak ${impactFilter}` : ''} pada kategori yang dipilih.
                  </p>
                  <button
                    onClick={() => {
                      setImpactFilter('ALL');
                      setCategoryFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono transition cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEventId(event.id)}
                      />
                    ))}
                  </div>

                  {/* High-Performance Pagination Bar */}
                  {totalWirePages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                          Menampilkan <strong className="text-cyan-400">{(wirePage - 1) * WIRE_PAGE_SIZE + 1}</strong> -{' '}
                          <strong className="text-cyan-400">{Math.min(wirePage * WIRE_PAGE_SIZE, filteredEvents.length)}</strong> dari{' '}
                          <strong className="text-slate-200">{filteredEvents.length}</strong> peristiwa
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setWirePage(prev => Math.max(1, prev - 1))}
                          disabled={wirePage === 1}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-slate-700"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Prev</span>
                        </button>

                        <div className="flex items-center gap-1 px-2">
                          <span className="text-cyan-300 font-bold">{wirePage}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{totalWirePages}</span>
                        </div>

                        <button
                          onClick={() => setWirePage(prev => Math.min(totalWirePages, prev + 1))}
                          disabled={wirePage >= totalWirePages}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-slate-700"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 8: AI INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <AIIntelligenceView
              initialOverview={overview}
              user={user}
            />
          )}

          {/* VIEW 8.5: MARKET HISTORY & PERMANENT MEMORY */}
          {activeTab === 'history' && (
            <MarketHistoryView
              onOpenChart={handleOpenChart}
            />
          )}

          {/* VIEW 9: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              prices={prices}
              user={user}
              onOpenAuth={() => navigate('/login')}
              onRemove={async (symbol) => {
                await api.removeFromWatchlist(symbol);
                setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
              }}
              onAdd={async (symbol, assetType) => {
                try {
                  const res = await api.addToWatchlist(symbol, assetType);
                  if (res.item) setWatchlist(prev => [...prev, res.item]);
                } catch (err: any) {
                  console.warn('[Watchlist] Add item notice:', err?.message);
                }
              }}
              onSelectSymbol={(sym) => {
                handleSelectSymbol(sym);
                handleTabChange('terminal');
              }}
            />
          )}

          {/* VIEW 10: ADMIN PANEL */}
          {activeTab === 'admin' && (
            user?.role === 'ADMIN' ? (
              <AdminPanel currentUser={user} />
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Access Restricted</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Administrative Telemetry & Feed Orchestration is restricted to system administrators with verified authority.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => handleTabChange('terminal')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition cursor-pointer"
                  >
                    Return to Terminal
                  </button>
                </div>
              </div>
            )
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* 5. TradingView Interactive Candlestick Chart Modal */}
      {chartModalSymbol && (
        <TradingViewChartModal
          initialSymbol={chartModalSymbol}
          prices={prices}
          onClose={() => setChartModalSymbol(null)}
        />
      )}

      {/* 6. Real-time Breaking News Alert Popup (Floating Toast / Banner Alert) */}
      <BreakingNewsAlertPopup
        alerts={newsAlerts}
        onDismiss={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
        onOpenEventDetail={(event) => setSelectedEventId(event.id)}
        onOpenChart={(sym) => setChartModalSymbol(sym)}
        onOpenTriggerModal={() => setIsAutoTriggerModalOpen(true)}
      />

      {/* 7. Auto-Trigger News Configuration & Action Modal */}
      <AutoTriggerNewsModal
        isOpen={isAutoTriggerModalOpen}
        onClose={() => setIsAutoTriggerModalOpen(false)}
        config={autoTriggerConfig}
        onUpdateConfig={handleUpdateAutoTriggerConfig}
        onTriggerNow={handleTriggerNewsNow}
        isTriggering={isTriggeringNews}
        secondsRemaining={autoTriggerSecondsRemaining}
        totalTriggeredCount={totalTriggeredCount}
      />

      {/* shadcn Sonner Toast Provider */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
