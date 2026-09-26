import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CentralMarketContext,
  CanonicalAssetBias,
  DetectedMarketDivergence,
  DataQualityReport,
} from '../types';
import { api } from './api';

export interface CentralMarketContextValue {
  centralContext: CentralMarketContext | null;
  dataQuality: DataQualityReport | null;
  divergences: DetectedMarketDivergence[];
  canonicalBiases: Record<string, CanonicalAssetBias>;
  globalRegime: CentralMarketContext['globalRegime'] | null;
  ratesAndYields: CentralMarketContext['ratesAndYields'] | null;
  currencyHierarchy: CentralMarketContext['currencyHierarchy'] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastSyncTime: Date | null;
  refreshCentralContext: () => Promise<void>;
  getBiasForAsset: (symbol: string) => CanonicalAssetBias | undefined;
  getDivergenceForAsset: (symbol: string) => DetectedMarketDivergence | undefined;
}

const CentralMarketContextReact = createContext<CentralMarketContextValue | null>(null);

export const CentralMarketProvider: React.FC<{
  children: React.ReactNode;
  initialContext?: CentralMarketContext | null;
}> = ({ children, initialContext }) => {
  const [context, setContext] = useState<CentralMarketContext | null>(initialContext || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialContext);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(initialContext ? new Date() : null);

  const fetchContext = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      const res = await api.getCentralMarketContext(isManualRefresh);
      if (res?.success && res.context) {
        setContext(res.context);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('[CentralMarketContext] Fetch notice:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();

    // 15-second heartbeat poll to ensure all tabs stay synchronized to single market state
    const interval = setInterval(() => {
      fetchContext(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchContext]);

  const refreshCentralContext = useCallback(async () => {
    await fetchContext(true);
  }, [fetchContext]);

  const dataQuality = useMemo(() => context?.dataQuality || null, [context]);
  const divergences = useMemo(() => context?.divergences || [], [context]);
  const canonicalBiases = useMemo(() => context?.canonicalBiases || {}, [context]);
  const globalRegime = useMemo(() => context?.globalRegime || null, [context]);
  const ratesAndYields = useMemo(() => context?.ratesAndYields || null, [context]);
  const currencyHierarchy = useMemo(() => context?.currencyHierarchy || null, [context]);

  const getBiasForAsset = useCallback((symbol: string): CanonicalAssetBias | undefined => {
    if (!context?.canonicalBiases) return undefined;
    return context.canonicalBiases[symbol];
  }, [context]);

  const getDivergenceForAsset = useCallback((symbol: string): DetectedMarketDivergence | undefined => {
    if (!context?.divergences) return undefined;
    return context.divergences.find(d => d.instruments.includes(symbol));
  }, [context]);

  const value = useMemo<CentralMarketContextValue>(() => ({
    centralContext: context,
    dataQuality,
    divergences,
    canonicalBiases,
    globalRegime,
    ratesAndYields,
    currencyHierarchy,
    isLoading,
    isRefreshing,
    lastSyncTime,
    refreshCentralContext,
    getBiasForAsset,
    getDivergenceForAsset,
  }), [
    context,
    dataQuality,
    divergences,
    canonicalBiases,
    globalRegime,
    ratesAndYields,
    currencyHierarchy,
    isLoading,
    isRefreshing,
    lastSyncTime,
    refreshCentralContext,
    getBiasForAsset,
    getDivergenceForAsset,
  ]);

  return (
    <CentralMarketContextReact.Provider value={value}>
      {children}
    </CentralMarketContextReact.Provider>
  );
};

export function useCentralMarketContext(): CentralMarketContextValue {
  const ctx = useContext(CentralMarketContextReact);
  if (!ctx) {
    throw new Error('useCentralMarketContext must be used within a CentralMarketProvider');
  }
  return ctx;
}
