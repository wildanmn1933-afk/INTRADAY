import React, { useState, useMemo } from 'react';
import {
  ArahMarketTodayData,
  CurrencyStrength,
  MarketPrice,
  TodayCatalyst,
  EconomicEvent,
  MarketEvent,
  AIAnalysis,
} from '../types';
import {
  Compass,
  Zap,
  Flame,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { D3Sparkline } from './ui/D3Sparkline';
import { NavTabId } from './Sidebar';
import { useLanguage } from '../lib/LanguageContext';

interface ExecutiveMarketBriefProps {
  strengths: CurrencyStrength[];
  prices: MarketPrice[];
  globalRegime: ArahMarketTodayData['globalRegime'] | null;
  arahMarketData?: ArahMarketTodayData | null;
  todayCatalysts?: TodayCatalyst[];
  calendar?: EconomicEvent[];
  events?: MarketEvent[];
  overview?: AIAnalysis | null;
  onOpenChart: (symbol: string) => void;
  onNavigateMarketBias: () => void;
  onNavigateDailyReport?: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
}

export const ExecutiveMarketBrief: React.FC<ExecutiveMarketBriefProps> = ({
  strengths,
  prices,
  globalRegime,
  arahMarketData,
  todayCatalysts = [],
  calendar = [],
  events = [],
  overview,
  onOpenChart,
  onNavigateMarketBias,
  onNavigateDailyReport,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  const activeViewTab = 'ALL_IN_ONE';

  // Price lookup map
  const priceMap = useMemo(() => {
    const map = new Map<string, MarketPrice>();
    prices.forEach(p => map.set(p.symbol.toUpperCase(), p));
    return map;
  }, [prices]);

  // Currency lookup map
  const strengthMap = useMemo(() => {
    const map = new Map<string, CurrencyStrength>();
    strengths.forEach(s => map.set(s.currency.toUpperCase(), s));
    return map;
  }, [strengths]);

  // Core Asset Price Snapshots
  const us10y = priceMap.get('US10Y') || { price: 4.085, change_24h_pct: -0.32, symbol: 'US10Y' } as MarketPrice;
  const gold = priceMap.get('XAUUSD') || { price: 2654.8, change_24h_pct: 0.73, symbol: 'XAUUSD' } as MarketPrice;
  const dxy = priceMap.get('USD') || { price: 101.24, change_24h_pct: 0.18, symbol: 'USD' } as MarketPrice;
  const us100 = priceMap.get('US100') || { price: 23421, change_24h_pct: 0.41, symbol: 'US100' } as MarketPrice;
  const us30 = priceMap.get('US30') || { price: 42100, change_24h_pct: 0.05, symbol: 'US30' } as MarketPrice;
  const eurusd = priceMap.get('EUR') || priceMap.get('EURUSD') || { price: 1.0825, change_24h_pct: -0.15, symbol: 'EURUSD' } as MarketPrice;
  const usdjpy = priceMap.get('JPY') || priceMap.get('USDJPY') || { price: 152.4, change_24h_pct: 0.28, symbol: 'USDJPY' } as MarketPrice;
  const btc = priceMap.get('BTC') || { price: 91400, change_24h_pct: 1.85, symbol: 'BTC' } as MarketPrice;

  // Currency Leaders and Laggards
  const sortedStrengths = useMemo(() => {
    return [...strengths].sort((a, b) => b.strength_score - a.strength_score);
  }, [strengths]);
  const strongestCurrency = sortedStrengths[0] || { currency: 'USD', strength_score: 7.8 };
  const weakestCurrency = sortedStrengths[sortedStrengths.length - 1] || { currency: 'JPY', strength_score: 2.1 };
  const currencySpread = Number((strongestCurrency.strength_score - weakestCurrency.strength_score).toFixed(1));

  // Yield Transmission Metrics
  const us10yPrice = us10y.price || 4.085;
  const us10yChangePct = us10y.change_24h_pct || 0;
  const us10yChangeBps = Number((us10yPrice * us10yChangePct).toFixed(1));
  const isYieldEasing = us10yChangePct < -0.05;
  const isYieldRising = us10yChangePct > 0.05;
  const yieldStatusLabel = isYieldEasing
    ? t('YIELD MELUNAK', 'YIELD EASING')
    : isYieldRising
    ? t('YIELD MENGETAT', 'YIELD TIGHTENING')
    : t('YIELD KONSOLIDASI (FLAT)', 'YIELD CONSOLIDATING (FLAT)');

  // Real Yield Proxy (Nominal 10Y minus assumed 2.25% breakeven)
  const realYieldEstimate = Number((us10yPrice - 2.25).toFixed(2));

  // Spreads from ArahMarketData if available, else estimated
  const usDeSpread = arahMarketData?.intermarketSpreads?.find(s => s.id === 'spread-us-de')?.currentValue ?? Number((us10yPrice - 2.42).toFixed(2));
  const usJpSpread = arahMarketData?.intermarketSpreads?.find(s => s.id === 'spread-us-jp')?.currentValue ?? Number((us10yPrice - 0.98).toFixed(2));

  // Global Regime from ArahMarketData or fallback
  const regimeTitle = globalRegime?.title || arahMarketData?.globalRegime?.title || t('ROTASI SEIMBANG', 'BALANCED ROTATIONAL REGIME');
  const riskScore = globalRegime?.riskScore ?? arahMarketData?.globalRegime?.riskScore ?? 15;
  const dxyBiasVsOpen = globalRegime?.dxyBiasVsOpen || arahMarketData?.globalRegime?.dxyBiasVsOpen || 'AT_OPEN';

  // Pair Confluences from ArahMarketData
  const goldConfluence = arahMarketData?.pairs?.find(p => p.pair === 'XAUUSD');
  const us100Confluence = arahMarketData?.pairs?.find(p => p.pair === 'US100');
  const eurusdConfluence = arahMarketData?.pairs?.find(p => p.pair === 'EURUSD');
  const usdjpyConfluence = arahMarketData?.pairs?.find(p => p.pair === 'USDJPY');
  const btcConfluence = arahMarketData?.pairs?.find(p => p.pair === 'BTC');

  // Intermarket Anomaly Checks
  const isGoldYieldAnomaly = (gold.change_24h_pct || 0) > 0.25 && us10yChangePct > 0.2;
  const isGoldDxyAnomaly = (gold.change_24h_pct || 0) > 0.25 && (dxy.change_24h_pct || 0) > 0.2;

  // Dynamic Synthesis Calculation for Gold & Yield
  const goldDirectionalBias = goldConfluence?.directionalBias || (isYieldEasing && dxyBiasVsOpen === 'BELOW_OPEN' ? 'BULLISH' : isYieldRising ? 'BEARISH' : 'NEUTRAL');
  const goldTransmissionStory = useMemo(() => {
    if (isGoldYieldAnomaly) {
      return t(
        `SAFE-HAVEN DIVERGENCE: Emas tetap kokoh (+${(gold.change_24h_pct || 0).toFixed(2)}%) meski yield US10Y naik (+${us10yChangeBps} bps). Ini nunjukin premi risiko geopolitik atau akumulasi cadangan emas bank sentral (dedolarisasi) lagi lebih dominan ngalahin beban opportunity cost obligasi.`,
        `SAFE-HAVEN DIVERGENCE: Gold remains firm (+${(gold.change_24h_pct || 0).toFixed(2)}%) despite rising US10Y yields (+${us10yChangeBps} bps). This indicates that geopolitical risk premiums or central bank sovereign reserve accumulation (de-dollarization) are overriding bond yield opportunity costs.`
      );
    }
    if (isYieldEasing) {
      return t(
        `Yield US10Y melunak ke ${us10yPrice.toFixed(3)}% (${us10yChangeBps > 0 ? '+' : ''}${us10yChangeBps} bps). Yield yang turun ngeringanin beban opportunity cost megang emas fisik, ngasih dorongan bullish langsung buat XAU/USD.`,
        `US10Y yields softening to ${us10yPrice.toFixed(3)}% (${us10yChangeBps > 0 ? '+' : ''}${us10yChangeBps} bps). Yield easing lowers the opportunity cost of holding non-yielding physical bullion, providing a direct bullish tailwind to XAU/USD.`
      );
    } else if (isYieldRising) {
      return t(
        `Yield US10Y menguat ke ${us10yPrice.toFixed(3)}% (+${us10yChangeBps} bps). Real yield yang naik bikin opportunity cost emas tambah berat, memicu aksi ambil untung (profit-taking) atau resisten pas XAU/USD reli intraday.`,
        `US10Y yields firming to ${us10yPrice.toFixed(3)}% (+${us10yChangeBps} bps). Rising real yields increase gold's opportunity cost, triggering profit-taking or resistance on intraday XAU/USD rallies.`
      );
    }
    return t(
      `Yield US10Y terpantau stabil dekat ${us10yPrice.toFixed(3)}%. Pergerakan emas (XAU/USD) bergantung pada headline geopolitik dan momentum DXY relatif terhadap open sesi.`,
      `US10Y yields steady near ${us10yPrice.toFixed(3)}%. Gold (XAU/USD) action depends on geopolitical headlines and DXY momentum relative to the session open.`
    );
  }, [isGoldYieldAnomaly, isYieldEasing, isYieldRising, us10yPrice, us10yChangeBps, gold.change_24h_pct, t]);

  // Dynamic Synthesis for Equities / Nasdaq
  const techTransmissionStory = useMemo(() => {
    if (isYieldEasing) {
      return t(
        'Yield obligasi yang melunak ngeringanin discount rate arus kas masa depan, ngedukung kenaikan valuasi saham-saham raksasa tech & AI (US100 unggul).',
        'Softening bond yields relieve the discount rate on future cash flows, supporting multiple expansion across mega-cap tech and AI leaders (US100 outperforming).'
      );
    } else if (isYieldRising) {
      return t(
        'Yield obligasi yang naik ngangkat discount rate, nekan valuasi saham sektor pertumbuhan tinggi (US100) dan dorong rotasi dana ke saham defensif / siklikal (US30).',
        'Rising bond yields elevate discount rates, pressuring high-multiple growth equities (US100) and prompting rotational flows into value/cyclicals (US30).'
      );
    }
    return t(
      'Kondisi yield yang seimbang ngejaga rotasi sektor tetap rapi antara teknologi (US100) dan saham perbankan / industrial (US30).',
      'Balanced yield conditions maintain orderly sector rotation between technology (US100) and industrial/banking equities (US30).'
    );
  }, [isYieldEasing, isYieldRising, t]);

  return (
    <div className="terminal-panel p-4 sm:p-5 space-y-4 font-sans" id="executive-macro-yield-synthesis">
      {/* 1. DOSSIER HEADER WITH REGIME & CONTROLS */}
      <div className="pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="metadata-label text-[10px] text-[var(--accent)] font-mono font-semibold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{t('brief.badgeDossier')}</span>
            </span>
            <span className="text-[var(--border-subtle)]">·</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-section)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              {arahMarketData?.activeSession ? `${arahMarketData.activeSession} SESSION` : t('common.live', 'REAL-TIME')}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-mono font-bold text-[var(--text-primary)] uppercase tracking-wide">
            {t('brief.title')}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed max-w-3xl">
            {t('brief.desc')}
          </p>
        </div>
      </div>

      {/* ANOMALY ALERT BANNER (IF ACTIVE) */}
      {(isGoldYieldAnomaly || isGoldDxyAnomaly) && (
        <div className="p-3 rounded-lg border border-[var(--warning)] bg-[var(--warning)]/10 flex items-start gap-2.5 text-xs text-[var(--text-primary)] font-sans">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-mono font-bold text-[var(--warning)] block">
              {t('brief.anomalyHeading')}
            </span>
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
              {t('brief.anomalyBody')}
            </p>
          </div>
        </div>
      )}

      {/* VISUAL CAUSAL TRANSMISSION CHAIN BANNER */}
      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-2">
        <div className="flex items-center justify-between text-[10.5px] font-mono">
          <span className="font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>{t('brief.causalChainTitle')}</span>
          </span>
          <span className="text-[var(--text-muted)] font-semibold">
            {isYieldEasing ? t('brief.scenarioEasing') : isYieldRising ? t('brief.scenarioTightening') : t('brief.scenarioConsolidation')}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">{t('brief.step1Anchor')}</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>US10Y ({us10yPrice.toFixed(3)}%)</span>
              <span className={isYieldEasing ? 'text-[var(--bullish)]' : isYieldRising ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}>
                {isYieldEasing ? '▼ Easing' : isYieldRising ? '▲ Tightening' : '● Flat'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? t('brief.step1Easing') : isYieldRising ? t('brief.step1Tightening') : t('brief.step1Flat')}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">{t('brief.step2RealYield')}</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Real Yield ({realYieldEstimate}%)</span>
              <span className={isYieldEasing ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}>
                {isYieldEasing ? '▼ Softening' : '▲ Tightening'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? t('brief.step2Easing') : t('brief.step2Tightening')}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">{t('brief.step3Bullion')}</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Gold (${gold.price.toFixed(1)})</span>
              <span className={goldDirectionalBias === 'BULLISH' ? 'text-[var(--bullish)]' : goldDirectionalBias === 'BEARISH' ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}>
                {goldDirectionalBias === 'BULLISH' ? '▲ Bullish' : goldDirectionalBias === 'BEARISH' ? '▼ Bearish' : '● Neutral'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? t('brief.step3Easing') : t('brief.step3Tightening')}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">{t('brief.step4Tech')}</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>US100 / DXY / JPY</span>
              <span className="text-[var(--accent)] font-semibold">Multiple P/E</span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? t('brief.step4Easing') : t('brief.step4Tightening')}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CROSS-ASSET YIELD TRANSMISSION MATRIX */}
      {(activeViewTab === 'ALL_IN_ONE' || activeViewTab === 'YIELD_GOLD') && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs sm:text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wide">
                {t('brief.matrixTitle')}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {t('brief.matrixSubtitle')}
            </span>
          </div>

          {/* Grid of Yield-Linked Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: GOLD / XAUUSD */}
            <div
              onClick={() => onOpenChart('XAUUSD')}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 hover:border-[var(--border-strong)] transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-xs text-[var(--text-primary)]">XAU/USD</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{t('Emas', 'Gold')}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  (gold.change_24h_pct || 0) >= 0 ? 'badge-bullish' : 'badge-bearish'
                }`}>
                  {(gold.change_24h_pct || 0) >= 0 ? '+' : ''}{(gold.change_24h_pct || 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  ${gold.price.toFixed(1)}
                </span>
                {gold.sparkline_1h && (
                  <D3Sparkline
                    data={gold.sparkline_1h}
                    width={48}
                    height={16}
                    isPositive={(gold.change_24h_pct || 0) >= 0}
                    showArea={true}
                    showEndDot={false}
                    className="opacity-80 shrink-0"
                  />
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                  {t('brief.yieldMechanismLabel')}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {isYieldEasing
                    ? t('Yield melunak = Emas diminati (beban opportunity cost turun, angin segar safe-haven).', 'Yields softening = Gold bid (opportunity cost lifts, safe-haven tailwind).')
                    : isYieldRising
                    ? t('Yield naik = Emas tertekan (yield Treasury narik dana keluar dari emas batangan).', 'Yields firming = Gold pressured (Treasury yields draw capital away from bullion).')
                    : t('Korelasi real yield stabil; pantau momentum DXY.', 'Real yield correlation steady; monitor US Dollar Index (DXY) momentum.')}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">{t('brief.deskActionLabel')}</span>
                <span className="font-bold text-[var(--bullish)]">
                  {isYieldEasing ? t('brief.buyOnPullback') : t('brief.fadeResistance')}
                </span>
              </div>
            </div>

            {/* CARD 2: NASDAQ / US100 */}
            <div
              onClick={() => onOpenChart('US100')}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 hover:border-[var(--border-strong)] transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-xs text-[var(--text-primary)]">US100</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Nasdaq Tech</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  (us100.change_24h_pct || 0) >= 0 ? 'badge-bullish' : 'badge-bearish'
                }`}>
                  {(us100.change_24h_pct || 0) >= 0 ? '+' : ''}{(us100.change_24h_pct || 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {us100.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                {us100.sparkline_1h && (
                  <D3Sparkline
                    data={us100.sparkline_1h}
                    width={48}
                    height={16}
                    isPositive={(us100.change_24h_pct || 0) >= 0}
                    showArea={true}
                    showEndDot={false}
                    className="opacity-80 shrink-0"
                  />
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                  {t('brief.yieldMechanismLabel')}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {isYieldEasing
                    ? t('Yield melunak = Valuasi tech naik pesat (aliran dana masuk ke saham AI & software).', 'Yields softening = Tech valuation multiple expansion (bids into AI & software leaders).')
                    : isYieldRising
                    ? t('Yield naik = Valuasi saham tech terkompresi (aksi jual di saham bernilai valuasi tinggi).', 'Yields firming = Valuation compression on growth equities (selling in high-multiple tech).')
                    : t('Rotasi sektor teratur antara tech (US100) dan value (US30).', 'Orderly sector rotation between tech (US100) and cyclical/value (US30).')}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">{t('brief.leadershipLabel')}</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {arahMarketData?.indexCorrelation?.ratioTrend === 'OUTPERFORMING' ? t('brief.techOutperforming') : t('brief.balancedRotation')}
                </span>
              </div>
            </div>

            {/* CARD 3: US DOLLAR / DXY */}
            <div
              onClick={() => onOpenChart('USD')}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 hover:border-[var(--border-strong)] transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-xs text-[var(--text-primary)]">DXY / USD</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Dollar Index</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  (dxy.change_24h_pct || 0) >= 0 ? 'badge-bullish' : 'badge-bearish'
                }`}>
                  {(dxy.change_24h_pct || 0) >= 0 ? '+' : ''}{(dxy.change_24h_pct || 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {dxy.price.toFixed(2)}
                </span>
                {dxy.sparkline_1h && (
                  <D3Sparkline
                    data={dxy.sparkline_1h}
                    width={48}
                    height={16}
                    isPositive={(dxy.change_24h_pct || 0) >= 0}
                    showArea={true}
                    showEndDot={false}
                    className="opacity-80 shrink-0"
                  />
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                  {t('brief.yieldMechanismLabel')}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {dxyBiasVsOpen === 'ABOVE_OPEN'
                    ? t('DXY di atas open sesi ngasih tekanan jual ke EUR/USD & komoditas.', 'DXY above session open exerts selling pressure on EUR/USD & commodities.')
                    : t('DXY di bawah open sesi ngasih napas lega buat mata uang rival & emas.', 'DXY below session open provides relief rallies for rival currencies & bullion.')}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">{t('brief.fxGravityLabel')}</span>
                <span className={`font-bold ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'text-[var(--bearish)]' : 'text-[var(--bullish)]'}`}>
                  {dxyBiasVsOpen === 'ABOVE_OPEN' ? t('brief.heavyPressure') : t('brief.constructiveRelief')}
                </span>
              </div>
            </div>

            {/* CARD 4: USD/JPY & CARRY ENGINE */}
            <div
              onClick={() => onOpenChart('USDJPY')}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 hover:border-[var(--border-strong)] transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-xs text-[var(--text-primary)]">USD/JPY</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Carry Engine</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  (usdjpy.change_24h_pct || 0) >= 0 ? 'badge-bullish' : 'badge-bearish'
                }`}>
                  {(usdjpy.change_24h_pct || 0) >= 0 ? '+' : ''}{(usdjpy.change_24h_pct || 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {usdjpy.price.toFixed(2)}
                </span>
                {usdjpy.sparkline_1h && (
                  <D3Sparkline
                    data={usdjpy.sparkline_1h}
                    width={48}
                    height={16}
                    isPositive={(usdjpy.change_24h_pct || 0) >= 0}
                    showArea={true}
                    showEndDot={false}
                    className="opacity-80 shrink-0"
                  />
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                  {t('brief.yieldMechanismLabel')}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {t(
                    `Selisih yield US-Jepang di ${usJpSpread}% jadi mesin utama carry trade. Kalau yield US10Y turun, USD/JPY rawan likuidasi tajam.`,
                    `US-Japan yield spread at ${usJpSpread}% is the primary engine for carry trades. If US10Y yields soften, USD/JPY is prone to sharp liquidation pullbacks.`
                  )}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">{t('brief.spreadUsJpLabel')}</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {usJpSpread}% ({t('brief.wideGap')})
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MACRO CATALYSTS, CURRENCY FLOW, & EXECUTIVE PLAYBOOK */}
      {(activeViewTab === 'ALL_IN_ONE' || activeViewTab === 'CATALYSTS_FX') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1">
          {/* Executive Directives & Invalidations (7 cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                  {t('brief.directivesHeading')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{t('brief.deskPlaybook')}</span>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">{t('brief.goldFocus')} </strong>
                  {goldTransmissionStory}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">{t('brief.fxYieldFocus')} </strong>
                  {t(
                    `Dispersi valuta G8 dipimpin oleh ${strongestCurrency.currency} (skor ${strongestCurrency.strength_score.toFixed(1)}) melawan ${weakestCurrency.currency} (skor ${weakestCurrency.strength_score.toFixed(1)}) dengan selisih ${currencySpread} poin. Manfaatkan peluang yang searah dengan perbedaan yield suku bunga obligasi.`,
                    `G8 currency dispersion is led by ${strongestCurrency.currency} (score ${strongestCurrency.strength_score.toFixed(1)}) versus ${weakestCurrency.currency} (score ${weakestCurrency.strength_score.toFixed(1)}) with a spread of ${currencySpread} points. Exploit moves aligned with sovereign yield differentials.`
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">{t('brief.invalidationFocus')} </strong>
                  {isYieldEasing
                    ? t(
                        'Kalau US10Y mendadak rebound nembus resisten sesi atau DXY tembus tegas ke atas open sesi, setup bullish di Emas dan Tech langsung batal / invalid (wajib cut / de-risk).',
                        'If US10Y abruptly rebounds breaking above session resistance or DXY breaks decisively above the session open, bullish setups on Gold and Tech are invalidated (cut / de-risk).'
                      )
                    : isYieldRising
                    ? t(
                        'Kalau US10Y mendadak jebol ke bawah support harian, tekanan bearish ke Emas dan Tech langsung berhenti seketika.',
                        'If US10Y suddenly breaks below daily support, bearish pressure on Gold and Tech halts immediately.'
                      )
                    : t(
                        'Breakout bersih dari DXY atau US10Y bakal jadi penentu tren arah berikutnya.',
                        'A clean session breakout on DXY or US10Y will establish the next directional trend.'
                      )}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <span className="text-[var(--text-muted)]">{t('brief.regimeStatus')}</span>
              <span className="font-bold text-[var(--text-primary)]">
                {regimeTitle} ({riskScore > 0 ? `+${riskScore}` : riskScore})
              </span>
            </div>
          </div>

          {/* Today's Key Catalysts & G8 Dispersion (5 cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                  {t('brief.todayCatalysts')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {t('brief.highImpact')}
              </span>
            </div>

            {/* List of top catalysts */}
            <div className="space-y-2">
              {todayCatalysts.slice(0, 3).map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section)] space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[var(--accent)]">{cat.currency || 'USD'}</span>
                    <span className="text-[var(--text-muted)]">
                      {cat.date_time_utc ? new Date(cat.date_time_utc).toLocaleTimeString('en-GB', {
                        timeZone: 'UTC',
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' UTC' : t('brief.thisSession')}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                    {cat.event_name}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-secondary)] font-sans line-clamp-2">
                    {cat.fundamental_implication || cat.actual_market_reaction || t('Pantau dampak data terhadap ekspektasi suku bunga bank sentral.', 'Monitor data impact on central bank policy expectations.')}
                  </div>
                </div>
              ))}

              {todayCatalysts.length === 0 && (
                <div className="text-xs text-[var(--text-muted)] py-3 text-center font-mono">
                  {t('brief.noCatalystsSession')}
                </div>
              )}
            </div>

            {/* Currency quick badges */}
            <div className="pt-2 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]">{t('brief.leaderLabel')}</span>
                <span className="font-bold text-[var(--bullish)]">{strongestCurrency.currency} ({strongestCurrency.strength_score.toFixed(1)})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]">{t('brief.laggardLabel')}</span>
                <span className="font-bold text-[var(--bearish)]">{weakestCurrency.currency} ({weakestCurrency.strength_score.toFixed(1)})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
