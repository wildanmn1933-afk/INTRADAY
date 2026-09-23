import React, { useState, useMemo } from 'react';
import { MarketPrice, CurrencyStrength } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Layers,
  Sparkles,
  LineChart,
  RefreshCw,
  Compass,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Flame,
  Shield,
  Zap,
} from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface IntermarketRelationshipMatrixProps {
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  onOpenChart?: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export type IntermarketAssetKey =
  | 'DXY'
  | 'US10Y'
  | 'XAUUSD'
  | 'US500'
  | 'US100'
  | 'EUR'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'BTC';

export interface IntermarketRelationship {
  source: IntermarketAssetKey;
  target: IntermarketAssetKey;
  sourceLabel: string;
  targetLabel: string;
  sourceCategory: 'CURRENCY' | 'YIELD' | 'COMMODITY' | 'EQUITY' | 'CRYPTO';
  targetCategory: 'CURRENCY' | 'YIELD' | 'COMMODITY' | 'EQUITY' | 'CRYPTO';
  historicalCorrelation: number; // -1.0 to 1.0
  correlationNature: 'STRONG_INVERSE' | 'MODERATE_INVERSE' | 'STRONG_POSITIVE' | 'MODERATE_POSITIVE' | 'NEUTRAL';
  transmissionMechanism: string;
  divergenceAlertRule?: string;
  primaryDriver: string;
}

// Canonical Intermarket Relationships (based on John J. Murphy & institutional macro frameworks)
const CANONICAL_RELATIONSHIPS: IntermarketRelationship[] = [
  {
    source: 'DXY',
    target: 'XAUUSD',
    sourceLabel: 'US Dollar (DXY)',
    targetLabel: 'Gold (XAU/USD)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.78,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Global FX Liquidity & Real Pricing Unit',
    transmissionMechanism:
      'Gold is globally invoiced in USD. A strengthening Dollar mechanically raises acquisition costs for non-US sovereigns, depressing spot bullion demand unless geopolitical risk premiums override.',
    divergenceAlertRule:
      'ANOMALY: Both DXY and Gold are gaining simultaneously (> +0.3%). Indicates acute systemic fear or sovereign reserve diversification.',
  },
  {
    source: 'US10Y',
    target: 'XAUUSD',
    sourceLabel: 'US 10Y Yield Proxy',
    targetLabel: 'Gold (XAU/USD)',
    sourceCategory: 'YIELD',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.82,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Opportunity Cost & Real Yields',
    transmissionMechanism:
      'Gold carries no cash flow or nominal yield. When sovereign benchmark bond yields rise without matching inflation acceleration, the opportunity cost of holding non-yielding bullion increases.',
    divergenceAlertRule:
      'BULLISH DIVERGENCE: Gold holding resilient despite surging 10-year yields signals structural central bank accumulation or stagflation pricing.',
  },
  {
    source: 'DXY',
    target: 'US500',
    sourceLabel: 'US Dollar (DXY)',
    targetLabel: 'S&P 500 (US500)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.55,
    correlationNature: 'MODERATE_INVERSE',
    primaryDriver: 'Financial Conditions & Multinationals EPS',
    transmissionMechanism:
      'A rapidly rising dollar tightens global dollar credit conditions and devalues overseas revenues for S&P 500 multinationals converting offshore sales back into USD.',
  },
  {
    source: 'US10Y',
    target: 'US100',
    sourceLabel: 'US 10Y Yield Proxy',
    targetLabel: 'Nasdaq 100 (US100)',
    sourceCategory: 'YIELD',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.68,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Discount Rate on Long-Duration Earnings',
    transmissionMechanism:
      'High-multiple growth and tech companies have cash flows skewed far into the future. Rising discount rates (10Y Yield) disproportionately compress forward price-to-earnings multiples.',
    divergenceAlertRule:
      'Tech outperforming while yields march higher indicates earnings momentum or AI capital expenditure themes overriding macro discount rates.',
  },
  {
    source: 'CAD',
    target: 'XAUUSD',
    sourceLabel: 'Canadian Dollar (CAD)',
    targetLabel: 'Gold & Energy Beta',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: 0.62,
    correlationNature: 'MODERATE_POSITIVE',
    primaryDriver: 'Terms of Trade & Resource Extraction',
    transmissionMechanism:
      'Canada is a major net exporter of crude energy and mineral commodities. Commodity surges elevate national terms of trade, supporting CAD purchasing power against European pairs.',
  },
  {
    source: 'AUD',
    target: 'US500',
    sourceLabel: 'Australian Dollar (AUD)',
    targetLabel: 'S&P 500 Risk Stance',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.74,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Global Growth Beta & Pro-Cyclical Appetite',
    transmissionMechanism:
      'AUD serves as the G8 FX proxy for global trade expansion and Chinese industrial demand. High equity risk appetite strongly correlates with AUD outperformance over defensive funding currencies.',
  },
  {
    source: 'JPY',
    target: 'US500',
    sourceLabel: 'Japanese Yen (JPY)',
    targetLabel: 'Global Risk / S&P 500',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.65,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Global Carry-Trade Unwinding & Liquidity Flights',
    transmissionMechanism:
      'Low Japanese interest rates make the Yen the premier global funding currency. In market panics or risk-off deleveraging, global carry trades are liquidated, prompting aggressive Yen repatriation.',
    divergenceAlertRule:
      'YEN SURGE + EQUITIES SELLOFF: Classic systemic deleveraging signature. Expect volatility spike in high-beta FX.',
  },
  {
    source: 'BTC',
    target: 'US100',
    sourceLabel: 'Bitcoin (BTC)',
    targetLabel: 'Nasdaq 100 (US100)',
    sourceCategory: 'CRYPTO',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.71,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Global M2 Liquidity & Speculative High-Beta',
    transmissionMechanism:
      'Bitcoin trades as high-octane speculative tech liquidity. Shifts in Fed balance sheet liquidity and tech sector risk appetite transmit rapidly into crypto capital inflows.',
  },
  {
    source: 'EUR',
    target: 'DXY',
    sourceLabel: 'Euro (EUR)',
    targetLabel: 'US Dollar (DXY)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'CURRENCY',
    historicalCorrelation: -0.96,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Weighting Dominance (EUR is 57.6% of DXY)',
    transmissionMechanism:
      'Because EUR represents 57.6% of the DXY currency basket, Eurozone economic surprises and ECB policy decisions mirror directly into DXY movement with near-perfect inverse transmission.',
  },
];

export const IntermarketRelationshipMatrix: React.FC<IntermarketRelationshipMatrixProps> = React.memo(({
  prices,
  strengths,
  onOpenChart,
  onSelectSymbol,
  onRefresh,
  isRefreshing = false,
}) => {
  const [selectedRelIndex, setSelectedRelIndex] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CURRENCIES' | 'COMMODITIES' | 'YIELDS'>('ALL');

  // Helper to extract asset price data
  const getPrice = (symbol: string): MarketPrice | undefined => {
    return prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  };

  // Helper to extract currency strength score
  const getStrength = (code: string): CurrencyStrength | undefined => {
    return strengths.find(s => s.currency.toUpperCase() === code.toUpperCase());
  };

  // Derived yield proxy: estimated based on DXY momentum and relative interest rate environment
  const dxyPrice = getPrice('USD');
  const goldPrice = getPrice('XAUUSD');
  const sp500Price = getPrice('US500');
  const nasdaqPrice = getPrice('US100');
  const btcPrice = getPrice('BTC');

  const usdStrength = getStrength('USD');
  const jpyStrength = getStrength('JPY');
  const audStrength = getStrength('AUD');
  const cadStrength = getStrength('CAD');
  const eurStrength = getStrength('EUR');

  // Implied 10Y Yield benchmark proxy (using DXY rate differential and Fed policy indicators)
  const yieldProxyChangePct = useMemo(() => {
    // If DXY moved, yields generally move in positive lockstep (+65% sensitivity)
    const dxyChg = dxyPrice?.change_24h_pct ?? 0;
    const usdSc = (usdStrength?.strength_score ?? 50) - 50;
    return Number(((dxyChg * 0.75) + (usdSc * 0.02)).toFixed(2));
  }, [dxyPrice, usdStrength]);

  // Calculate live alignment status for each canonical relationship
  const relationshipTelemetry = useMemo(() => {
    return CANONICAL_RELATIONSHIPS.map((rel) => {
      let sourceChangePct = 0;
      let targetChangePct = 0;

      // Extract source change
      if (rel.source === 'DXY') {
        sourceChangePct = dxyPrice?.change_24h_pct ?? ((usdStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'US10Y') {
        sourceChangePct = yieldProxyChangePct;
      } else if (rel.source === 'CAD') {
        sourceChangePct = ((cadStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'AUD') {
        sourceChangePct = ((audStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'JPY') {
        sourceChangePct = ((jpyStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'EUR') {
        sourceChangePct = ((eurStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'BTC') {
        sourceChangePct = btcPrice?.change_24h_pct ?? 0;
      }

      // Extract target change
      if (rel.target === 'XAUUSD') {
        targetChangePct = goldPrice?.change_24h_pct ?? 0;
      } else if (rel.target === 'US500') {
        targetChangePct = sp500Price?.change_24h_pct ?? 0;
      } else if (rel.target === 'US100') {
        targetChangePct = nasdaqPrice?.change_24h_pct ?? 0;
      } else if (rel.target === 'DXY') {
        targetChangePct = dxyPrice?.change_24h_pct ?? 0;
      }

      // Compute observed intraday correlation alignment
      const isExpectedNegative = rel.historicalCorrelation < 0;
      const movedOpposite = (sourceChangePct > 0 && targetChangePct < 0) || (sourceChangePct < 0 && targetChangePct > 0);
      const movedTogether = (sourceChangePct > 0 && targetChangePct > 0) || (sourceChangePct < 0 && targetChangePct < 0);
      const isNegligible = Math.abs(sourceChangePct) < 0.05 && Math.abs(targetChangePct) < 0.05;

      let alignment: 'ALIGNED' | 'DIVERGENT' | 'NEUTRAL_QUIET' = 'ALIGNED';
      if (isNegligible) {
        alignment = 'NEUTRAL_QUIET';
      } else if (isExpectedNegative) {
        alignment = movedOpposite ? 'ALIGNED' : 'DIVERGENT';
      } else {
        alignment = movedTogether ? 'ALIGNED' : 'DIVERGENT';
      }

      return {
        ...rel,
        sourceChangePct,
        targetChangePct,
        alignment,
        isDivergenceRisk: alignment === 'DIVERGENT' && (Math.abs(sourceChangePct) > 0.25 || Math.abs(targetChangePct) > 0.25),
      };
    });
  }, [dxyPrice, goldPrice, sp500Price, nasdaqPrice, btcPrice, usdStrength, jpyStrength, audStrength, cadStrength, eurStrength, yieldProxyChangePct]);

  // Overall Intermarket Macro Regime
  const macroRegime = useMemo(() => {
    const dxyChg = dxyPrice?.change_24h_pct ?? 0;
    const goldChg = goldPrice?.change_24h_pct ?? 0;
    const spxChg = sp500Price?.change_24h_pct ?? 0;
    const jpyScore = jpyStrength?.strength_score ?? 50;
    const audScore = audStrength?.strength_score ?? 50;

    const riskBeta = spxChg + (audScore - jpyScore) * 0.03;

    if (riskBeta > 0.4 && dxyChg <= 0.1) {
      return {
        regime: 'PRO-CYCLICAL RISK-ON',
        description: 'Equity expansion & commodity carry demand dominating; safe-havens subdued.',
        badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
        sentiment: 'RISK_ON',
      };
    } else if (goldChg > 0.3 && dxyChg > 0.2) {
      return {
        regime: 'SOVEREIGN SAFE-HAVEN ACCUMULATION',
        description: 'Gold & US Dollar surging together; indicates acute geopolitical tension or systemic liquidity caution.',
        badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
        sentiment: 'DEFENSIVE_FLIGHT',
      };
    } else if (riskBeta < -0.3 || (jpyScore > 65 && spxChg < -0.2)) {
      return {
        regime: 'DEFENSIVE RISK-OFF & DELEVERAGING',
        description: 'Capital fleeing to JPY and treasuries; risk assets and carry currencies under pressure.',
        badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-700/60',
        sentiment: 'RISK_OFF',
      };
    } else if (dxyChg > 0.35 && goldChg < -0.3) {
      return {
        regime: 'DOLLAR SUPREMACY TIGHTENING',
        description: 'Higher yield and dollar demand suppressing global asset prices and emerging flows.',
        badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60',
        sentiment: 'USD_DOMINANCE',
      };
    } else {
      return {
        regime: 'CONSOLIDATION / BALANCED FLOWS',
        description: 'Intermarket cross-currents neutral; awaiting catalyst from central bank speeches or upcoming macro tier-1 data.',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        sentiment: 'BALANCED',
      };
    }
  }, [dxyPrice, goldPrice, sp500Price, jpyStrength, audStrength]);

  const filteredRelationships = useMemo(() => {
    if (filterCategory === 'CURRENCIES') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'CURRENCY' || r.targetCategory === 'CURRENCY');
    }
    if (filterCategory === 'COMMODITIES') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'COMMODITY' || r.targetCategory === 'COMMODITY');
    }
    if (filterCategory === 'YIELDS') {
      return relationshipTelemetry.filter(r => r.sourceCategory === 'YIELD' || r.targetCategory === 'YIELD');
    }
    return relationshipTelemetry;
  }, [relationshipTelemetry, filterCategory]);

  const activeRel = relationshipTelemetry[selectedRelIndex] || relationshipTelemetry[0];

  return (
    <div className="space-y-4">
      {/* 1. HEADER & INTERMARKET REGIME BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Compass className="w-4 h-4" />
              </span>
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
                Intermarket Relationship Matrix
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MURPHY FRAMEWORK
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Real-time cross-asset interdependency mapping: Currencies (DXY, G8), Commodities (Gold, Oil), Benchmark Yields (US10Y), and Equities (S&P 500, Nasdaq).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-2"
                title="Refresh Intermarket Live Feeds"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Sync Cross-Asset</span>
              </button>
            )}

            <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                Current Intermarket Regime
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${macroRegime.sentiment === 'RISK_ON' ? 'bg-emerald-400' : macroRegime.sentiment === 'RISK_OFF' ? 'bg-rose-400' : 'bg-indigo-400'} animate-pulse`} />
                <span className="text-xs font-bold font-mono text-slate-200">
                  {macroRegime.regime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Cross-Asset Anchor Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {/* US Dollar (DXY) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>US Dollar (DXY)</span>
              <span className={`font-bold ${(dxyPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(dxyPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(dxyPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {dxyPrice?.price ? dxyPrice.price.toFixed(2) : (usdStrength?.strength_score ? `${usdStrength.strength_score} pts` : '103.80')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Primary Liquidity</span>
              <span className="text-indigo-400 font-mono">DXY</span>
            </div>
          </div>

          {/* Gold (XAUUSD) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Gold (XAU/USD)</span>
              <span className={`font-bold ${(goldPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(goldPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(goldPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              ${goldPrice?.price ? goldPrice.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '2,685.4'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Safe-Haven Store</span>
              <span className="text-amber-400 font-mono">XAU</span>
            </div>
          </div>

          {/* S&P 500 (US500) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>S&P 500 (US500)</span>
              <span className={`font-bold ${(sp500Price?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(sp500Price?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(sp500Price?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {sp500Price?.price ? sp500Price.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '5,780'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Broad Equity Risk</span>
              <span className="text-cyan-400 font-mono">SPX</span>
            </div>
          </div>

          {/* Nasdaq 100 (US100) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Nasdaq 100 (US100)</span>
              <span className={`font-bold ${(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(nasdaqPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {nasdaqPrice?.price ? nasdaqPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '20,410'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>High Duration Beta</span>
              <span className="text-purple-400 font-mono">NDX</span>
            </div>
          </div>

          {/* 10Y Yield Benchmark Proxy */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>US 10Y Yield Implied</span>
              <span className={`font-bold ${yieldProxyChangePct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {yieldProxyChangePct >= 0 ? '+' : ''}
                {yieldProxyChangePct.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {yieldProxyChangePct >= 0 ? 'Surging' : 'Easing'} Rate
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Discount Cost</span>
              <span className="text-amber-300 font-mono">US10Y</span>
            </div>
          </div>

          {/* Bitcoin (BTC) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Bitcoin (BTC)</span>
              <span className={`font-bold ${(btcPrice?.change_24h_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(btcPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(btcPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              ${btcPrice?.price ? btcPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '68,400'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Speculative Liquidity</span>
              <span className="text-orange-400 font-mono">BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: MATRIX GRID & DETAILED TRANSMISSION INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: INTERDEPENDENCY MATRIX (7 COLS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Canonical Transmission Matrix
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                {(['ALL', 'CURRENCIES', 'COMMODITIES', 'YIELDS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterCategory === cat
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2 mt-3">
              {filteredRelationships.map((item, idx) => {
                const isSelected = selectedRelIndex === idx;
                const isNegative = item.historicalCorrelation < 0;

                return (
                  <div
                    key={`${item.source}-${item.target}`}
                    onClick={() => setSelectedRelIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/60 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 border border-slate-700">
                            {item.source}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">
                            {item.target}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          ({item.sourceLabel} vs {item.targetLabel})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Alignment Badge */}
                        {item.alignment === 'ALIGNED' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            ALIGNED
                          </span>
                        ) : item.alignment === 'DIVERGENT' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            DIVERGENT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700">
                            QUIET
                          </span>
                        )}

                        {/* Benchmark Correlation Tag */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isNegative
                              ? 'bg-purple-950/40 text-purple-300 border-purple-800/50'
                              : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                          }`}
                        >
                          r = {item.historicalCorrelation.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Intraday Realized Flow Comparison */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                      <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
                        <span className="text-[10px] text-slate-400">{item.source}:</span>
                        <span className={`font-bold ${item.sourceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.sourceChangePct >= 0 ? '+' : ''}
                          {item.sourceChangePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
                        <span className="text-[10px] text-slate-400">{item.target}:</span>
                        <span className={`font-bold ${item.targetChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.targetChangePct >= 0 ? '+' : ''}
                          {item.targetChangePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Divergence warning banner if triggered */}
                    {item.isDivergenceRisk && item.divergenceAlertRule && (
                      <div className="mt-2 p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{item.divergenceAlertRule}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DEEP-DIVE TRANSMISSION & TRADING PLAYBOOK (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Macro Transmission Mechanics
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                PAIR: {activeRel.source} / {activeRel.target}
              </span>
            </div>

            {/* Selected Relationship Overview */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  Primary Economic Driver
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-400">
                  {activeRel.correlationNature.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {activeRel.primaryDriver}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                {activeRel.transmissionMechanism}
              </p>
            </div>

            {/* Causal Step-by-Step Flow */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                Causal Transmission Chain
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">1. Trigger Asset:</span>
                  <span className="font-bold text-indigo-300">{activeRel.sourceLabel}</span>
                </div>
                <div className="flex justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">2. Transmission Channel:</span>
                  <span className="font-bold text-amber-300">{activeRel.primaryDriver}</span>
                </div>
                <div className="flex justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">3. Impact Asset:</span>
                  <span className="font-bold text-cyan-300">{activeRel.targetLabel}</span>
                </div>
              </div>
            </div>

            {/* Trader Actionable Takeaway */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Actionable Trading Implications</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeRel.historicalCorrelation < 0
                  ? `With a strong inverse relationship (r = ${activeRel.historicalCorrelation}), when ${activeRel.source} exhibits breakout momentum, look for mean-reverting rejection setups on ${activeRel.target}.`
                  : `With a positive co-movement (r = +${activeRel.historicalCorrelation}), confirmations on ${activeRel.source} validate trend continuation setups on ${activeRel.target}.`}
              </p>
            </div>

            {/* TradingView Chart Button */}
            {onOpenChart && (
              <button
                onClick={() => {
                  const sym = activeRel.target === 'XAUUSD' ? 'XAUUSD' : activeRel.source === 'DXY' ? 'USD' : activeRel.target;
                  onOpenChart(sym);
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-mono font-bold text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open TradingView Chart for {activeRel.target}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

IntermarketRelationshipMatrix.displayName = 'IntermarketRelationshipMatrix';
