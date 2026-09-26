import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  IntradayAssetBias,
  TodayCatalyst,
  ArahMarketTodayData,
  AIAnalysis,
  CentralMarketContext,
} from '../types';
import { api } from '../lib/api';
import { useSSE } from '../lib/useSSE';
import { AutoTriggerConfig } from '../components/AutoTriggerNewsModal';
import { TriggeredNewsAlert } from '../components/BreakingNewsAlertPopup';
import { soundManager } from '../lib/sound';

export function useMarketDataStream(options: {
  autoTriggerConfig: AutoTriggerConfig;
  onNewAlert: (alert: TriggeredNewsAlert) => void;
  markAlertAsSeen: (key: string) => boolean;
  backgroundSyncIntervalMs?: number;
}) {
  const { autoTriggerConfig, onNewAlert, markAlertAsSeen, backgroundSyncIntervalMs = 60000 } = options;

  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [strengths, setStrengths] = useState<CurrencyStrength[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [calendar, setCalendar] = useState<EconomicEvent[]>([]);
  const [overview, setOverview] = useState<AIAnalysis | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [intradayMap, setIntradayMap] = useState<IntradayAssetBias[]>([]);
  const [todayCatalysts, setTodayCatalysts] = useState<TodayCatalyst[]>([]);
  const [arahMarketData, setArahMarketData] = useState<ArahMarketTodayData | null>(null);
  const [centralContext, setCentralContext] = useState<CentralMarketContext | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [lastBackgroundSync, setLastBackgroundSync] = useState<Date>(new Date());
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isRefreshingCS, setIsRefreshingCS] = useState(false);
  const [isRefreshingMacro, setIsRefreshingMacro] = useState(false);
  const [isRefreshingIntraday, setIsRefreshingIntraday] = useState(false);
  const [isRefreshingCatalysts, setIsRefreshingCatalysts] = useState(false);
  const [isRefreshingArah, setIsRefreshingArah] = useState(false);

  // Debounced map recalculation ref to avoid burst calls on SSE ticks
  const intradayDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerDebouncedIntradayRefresh = useCallback(() => {
    if (intradayDebounceTimerRef.current) return;
    intradayDebounceTimerRef.current = setTimeout(() => {
      intradayDebounceTimerRef.current = null;
      api.getIntradayMarketMap()
        .then(res => setIntradayMap(res.market_map))
        .catch(() => {});
    }, 1200); // 1.2s batching
  }, []);

  // Debounced Arah Market recalculation to immediately reflect bullish/bearish price shifts
  const arahDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerDebouncedArahMarketRefresh = useCallback(() => {
    if (arahDebounceTimerRef.current) return;
    arahDebounceTimerRef.current = setTimeout(() => {
      arahDebounceTimerRef.current = null;
      api.getArahMarketToday()
        .then(res => {
          if (res?.data) setArahMarketData(res.data);
        })
        .catch(() => {});
    }, 1200); // 1.2s batching
  }, []);

  // Real-time SSE listener
  const { status: sseStatus } = useSSE({
    enabled: true,
    onMarketPrices: (updatedPrices: MarketPrice[]) => {
      setPrices(updatedPrices);
      triggerDebouncedIntradayRefresh();
      triggerDebouncedArahMarketRefresh();
    },
    onCurrencyStrength: (updatedStrengths: CurrencyStrength[]) => {
      setStrengths(updatedStrengths);
      triggerDebouncedIntradayRefresh();
      triggerDebouncedArahMarketRefresh();
    },
    onArahMarket: (data: ArahMarketTodayData) => {
      if (data) setArahMarketData(data);
    },
    onNewsIngested: (data: any) => {
      if (data?.eventId) {
        const alertKey = String(data.news?.id || data.eventId || '');
        api.getEventDetail(data.eventId).then(res => {
          if (res.event) {
            setEvents(prev => {
              if (prev.some(e => e.id === res.event.id)) return prev;
              return [res.event, ...prev];
            });

            if (!markAlertAsSeen(alertKey)) return;

            if (
              autoTriggerConfig.minImpact === 'ALL' ||
              res.event.impact_level === 'CRITICAL' ||
              res.event.impact_level === 'HIGH' ||
              (autoTriggerConfig.minImpact !== 'CRITICAL' && res.event.impact_level === 'MEDIUM')
            ) {
              if (autoTriggerConfig.soundEnabled) {
                soundManager.playBreakingNewsChime();
              }
              const newAlert: TriggeredNewsAlert = {
                id: `alert_sse_${res.event.id}_${Date.now()}`,
                event: res.event,
                newsTitle: data.news?.title || res.event.title,
                newsContent: data.news?.content || res.event.summary,
                sourceName: data.news?.source_name || res.event.source_names?.[0],
                sourceUrl: data.news?.source_url,
                triggeredAt: new Date(),
              };
              onNewAlert(newAlert);
            }
          }
        }).catch(() => {});
      }
    },
    onEventUpdated: (updatedEvent: MarketEvent) => {
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === updatedEvent.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEvent;
          return next;
        }
        return [updatedEvent, ...prev];
      });
    },
    onEconomicCalendar: (updatedCalendar: EconomicEvent[]) => {
      setCalendar(updatedCalendar);
      api.getTodayCatalysts().then(res => setTodayCatalysts(res.catalysts)).catch(() => {});
    },
  });

  // Initial Full Load
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [mktRes, curRes, evtRes, calRes, sesRes, mapRes, catRes, arahRes, ctxRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getMarketSessions(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
        api.getArahMarketToday(),
        api.getCentralMarketContext(),
      ]);

      if (mktRes.status === 'fulfilled') setPrices(mktRes.value.prices);
      if (curRes.status === 'fulfilled') setStrengths(curRes.value.currency_strength);
      if (evtRes.status === 'fulfilled') setEvents(evtRes.value.events);
      if (calRes.status === 'fulfilled') setCalendar(calRes.value.calendar);
      if (sesRes.status === 'fulfilled') setSessions(sesRes.value.sessions);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
      if (arahRes.status === 'fulfilled' && arahRes.value?.data) setArahMarketData(arahRes.value.data);
      if (ctxRes.status === 'fulfilled' && ctxRes.value?.context) setCentralContext(ctxRes.value.context);
    } catch (err) {
      console.warn('Initialization notice:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Global Ingestion Trigger
  const triggerGlobalSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      await api.runGlobalIngest();
      const [eRes, cRes, mRes, mapRes, catRes, arahRes, ctxRes] = await Promise.allSettled([
        api.getEvents(40),
        api.getCurrencyStrength(),
        api.getMarkets(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
        api.getArahMarketToday(),
        api.getCentralMarketContext(true),
      ]);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.events);
      if (cRes.status === 'fulfilled') setStrengths(cRes.value.currency_strength);
      if (mRes.status === 'fulfilled') setPrices(mRes.value.prices);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
      if (arahRes.status === 'fulfilled' && arahRes.value?.data) setArahMarketData(arahRes.value.data);
      if (ctxRes.status === 'fulfilled' && ctxRes.value?.context) setCentralContext(ctxRes.value.context);
    } catch (err) {
      console.error('Manual sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Background sync function for silent, non-blocking polling across all market feeds
  const triggerBackgroundSync = useCallback(async () => {
    try {
      setIsBackgroundSyncing(true);
      const [mktRes, curRes, evtRes, calRes, mapRes, catRes, arahRes, ctxRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
        api.getArahMarketToday(),
        api.getCentralMarketContext(),
      ]);

      if (mktRes.status === 'fulfilled' && mktRes.value?.prices) setPrices(mktRes.value.prices);
      if (curRes.status === 'fulfilled' && curRes.value?.currency_strength) setStrengths(curRes.value.currency_strength);
      if (evtRes.status === 'fulfilled' && evtRes.value?.events) setEvents(evtRes.value.events);
      if (calRes.status === 'fulfilled' && calRes.value?.calendar) setCalendar(calRes.value.calendar);
      if (mapRes.status === 'fulfilled' && mapRes.value?.market_map) setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled' && catRes.value?.catalysts) setTodayCatalysts(catRes.value.catalysts);
      if (arahRes.status === 'fulfilled' && arahRes.value?.data) setArahMarketData(arahRes.value.data);
      if (ctxRes.status === 'fulfilled' && ctxRes.value?.context) setCentralContext(ctxRes.value.context);

      setLastBackgroundSync(new Date());
    } catch (err) {
      console.warn('[DataStream] Background sync notice:', err);
    } finally {
      setIsBackgroundSyncing(false);
    }
  }, []);

  // Automated 60-second background sync polling and window focus reactivity
  useEffect(() => {
    // 1. High-frequency Arah Market heartbeat (every 15s) for instant session reactivity
    const arahHeartbeatInterval = setInterval(() => {
      api.getArahMarketToday()
        .then(res => {
          if (res?.data) setArahMarketData(res.data);
        })
        .catch(() => {});
    }, 15000);

    // 2. Comprehensive 60-second background sync for all market data streams
    const periodicSyncInterval = setInterval(() => {
      triggerBackgroundSync();
    }, backgroundSyncIntervalMs);

    // 3. Tab visibility and focus listener: if tab becomes visible after 60s idle, sync immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerBackgroundSync();
      }
    };

    const handleWindowFocus = () => {
      triggerBackgroundSync();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(arahHeartbeatInterval);
      clearInterval(periodicSyncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (intradayDebounceTimerRef.current) clearTimeout(intradayDebounceTimerRef.current);
      if (arahDebounceTimerRef.current) clearTimeout(arahDebounceTimerRef.current);
    };
  }, [backgroundSyncIntervalMs, triggerBackgroundSync]);

  // Individual refreshed actions
  const refreshPrices = useCallback(async () => {
    setIsRefreshingPrices(true);
    try {
      await api.refreshMarkets();
      const res = await api.getMarkets();
      setPrices(res.prices);
    } finally {
      setIsRefreshingPrices(false);
    }
  }, []);

  const refreshCurrencyStrength = useCallback(async () => {
    setIsRefreshingCS(true);
    try {
      const res = await api.refreshCurrencyStrength();
      setStrengths(res.currency_strength);
    } finally {
      setIsRefreshingCS(false);
    }
  }, []);

  const refreshIntradayMap = useCallback(async () => {
    setIsRefreshingIntraday(true);
    try {
      const res = await api.getIntradayMarketMap();
      setIntradayMap(res.market_map);
    } finally {
      setIsRefreshingIntraday(false);
    }
  }, []);

  const refreshCatalysts = useCallback(async () => {
    setIsRefreshingCatalysts(true);
    try {
      const res = await api.getTodayCatalysts();
      setTodayCatalysts(res.catalysts);
    } finally {
      setIsRefreshingCatalysts(false);
    }
  }, []);

  const refreshArahMarket = useCallback(async () => {
    setIsRefreshingArah(true);
    try {
      const res = await api.getArahMarketToday();
      if (res.data) setArahMarketData(res.data);
    } catch (e) {
      console.error('Failed to refresh Arah Market:', e);
    } finally {
      setIsRefreshingArah(false);
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await api.getEvents(40);
      setEvents(res.events);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const refreshMacroCalendar = useCallback(async () => {
    setIsRefreshingMacro(true);
    try {
      await api.refreshEconomicCalendar();
      const res = await api.getEconomicCalendar();
      setCalendar(res.calendar);
    } finally {
      setIsRefreshingMacro(false);
    }
  }, []);

  return {
    // Data
    prices,
    setPrices,
    strengths,
    setStrengths,
    events,
    setEvents,
    calendar,
    setCalendar,
    overview,
    setOverview,
    sessions,
    intradayMap,
    setIntradayMap,
    todayCatalysts,
    setTodayCatalysts,
    arahMarketData,
    setArahMarketData,
    centralContext,
    setCentralContext,

    // Status
    sseStatus,
    initialLoading,
    isSyncing,
    isBackgroundSyncing,
    lastBackgroundSync,
    isRefreshingPrices,
    isRefreshingCS,
    isRefreshingMacro,
    isRefreshingIntraday,
    isRefreshingCatalysts,
    isRefreshingArah,

    // Actions
    loadInitialData,
    triggerGlobalSync,
    triggerBackgroundSync,
    refreshPrices,
    refreshCurrencyStrength,
    refreshIntradayMap,
    refreshCatalysts,
    refreshArahMarket,
    refreshEvents,
    refreshMacroCalendar,
  };
}
