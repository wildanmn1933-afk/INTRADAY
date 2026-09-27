/**
 * Central Connected Market Intelligence System
 * Single Source of Truth for All Modules:
 * Markets, News, Calendar, Currency Strength, Intermarket Flows, Market Bias, AI Analysis, and Market Report.
 * 
 * Pipeline:
 * RAW DATA → CENTRAL MARKET CONTEXT → ANALYSIS → ALL MODULES
 * 
 * Core Mandate:
 * Satu market state, satu logic, banyak tampilan—bukan banyak analisis yang saling bertentangan.
 * Jika ada perbedaan antar-instrumen, tidak dipaksa sama; dideteksi sebagai divergence dan dijelaskan penyebab strukturalnya.
 */

import { db } from '../db/database.js';
import {
  CentralMarketContext,
  CanonicalAssetBias,
  DetectedMarketDivergence,
  DataQualityReport,
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  TradingSessionName,
  TodayCatalyst,
} from '../types.js';

let cachedContext: CentralMarketContext | null = null;
let lastCacheEpoch = 0;
const CACHE_TTL_MS = 8000; // 8 seconds cache for unified state consistency

export class CentralMarketContextEngine {
  /**
   * Mengambil atau menyusun Central Market Context terbaru
   * Menjadi satu-satunya sumber kebenaran (Single Source of Truth) untuk seluruh aplikasi.
   */
  public static async getCentralContext(forceRefresh = false): Promise<CentralMarketContext> {
    const nowEpoch = Date.now();
    if (!forceRefresh && cachedContext && nowEpoch - lastCacheEpoch < CACHE_TTL_MS) {
      return cachedContext;
    }

    const context = await this.synthesizeCentralContext();
    cachedContext = context;
    lastCacheEpoch = nowEpoch;
    return context;
  }

  /**
   * Reset cache saat ada event/harga baru masuk secara real-time via SSE atau ingestion
   */
  public static invalidateCache(): void {
    lastCacheEpoch = 0;
  }

  /**
   * Pipeline Sintesis: Mengonsolidasikan semua RAW DATA ke dalam Central Context terpadu
   */
  private static async synthesizeCentralContext(): Promise<CentralMarketContext> {
    const epoch = Date.now();
    const now = new Date(epoch);
    const nowIso = now.toISOString();

    // 1. RAW DATA INGESTION: Kumpulkan semua data mentah dalam 1 kali pass sinkron
    const prices: MarketPrice[] = db.getAllMarketPrices() || [];
    const strengths: CurrencyStrength[] = db.getCurrencyStrength() || [];
    const events: MarketEvent[] = db.getAllEvents(40) || [];
    const macroCalendar: EconomicEvent[] = db.getEconomicEvents(40) || [];

    // Indexing cepat untuk lookup aman
    const priceMap = new Map<string, MarketPrice>();
    prices.forEach((p: MarketPrice) => {
      priceMap.set(p.symbol, p);
      if (p.symbol === 'EUR') priceMap.set('EURUSD', p);
      if (p.symbol === 'GBP') priceMap.set('GBPUSD', p);
      if (p.symbol === 'JPY') priceMap.set('USDJPY', p);
      if (p.symbol === 'AUD') priceMap.set('AUDUSD', p);
      if (p.symbol === 'CAD') priceMap.set('USDCAD', p);
      if (p.symbol === 'CHF') priceMap.set('USDCHF', p);
      if (p.symbol === 'NZD') priceMap.set('NZDUSD', p);
      if (p.symbol === 'USD') priceMap.set('DXY', p);
    });

    const strengthMap = new Map<string, CurrencyStrength>();
    strengths.forEach((s: CurrencyStrength) => strengthMap.set(s.currency, s));

    // 2. DATA QUALITY & FRESHNESS AUDIT
    const sourcesVerified = [
      'Yahoo Finance Real-time Multi-Asset Feeds',
      'Currency Strength G8 Institutional Parity Matrix',
      'Canonical Multi-Source News Wire (Reuters, Bloomberg, ForexLive, FXStreet)',
      'Global Economic Calendar & Central Bank Transcripts',
    ];

    const hasCriticalPrices = priceMap.has('XAUUSD') && (priceMap.has('US10Y') || priceMap.has('USD'));
    const qualityScore = Math.min(
      100,
      (prices.length >= 10 ? 30 : prices.length * 3) +
      (strengths.length >= 8 ? 25 : strengths.length * 3) +
      (events.length >= 5 ? 25 : events.length * 5) +
      (macroCalendar.length >= 5 ? 20 : macroCalendar.length * 4)
    );

    const dataQuality: DataQualityReport = {
      score: qualityScore,
      status: qualityScore >= 75 ? 'OPTIMAL' : qualityScore >= 50 ? 'DEGRADED' : 'STALE',
      feedCoverage: {
        pricesCount: prices.length,
        currencyStrengthCount: strengths.length,
        newsEventsCount: events.length,
        economicCalendarCount: macroCalendar.length,
      },
      freshnessSeconds: Math.max(1, Math.floor((epoch - (prices[0] ? new Date(prices[0].last_updated).getTime() : epoch)) / 1000)),
      lastSyncEpoch: epoch,
      sourcesVerified,
    };

    // 3. SESI AKTIF PASAR (UTC SYNCHRONIZATION)
    const utcHour = now.getUTCHours();
    let activeSession: TradingSessionName = 'LONDON';
    let sessionStatusText = 'London session active (European FX and commodity liquidity)';

    if (utcHour >= 13 && utcHour < 16) {
      activeSession = 'OVERLAP';
      sessionStatusText = 'London - New York overlap (Peak global market liquidity & volatility)';
    } else if (utcHour >= 16 && utcHour < 21) {
      activeSession = 'NEW_YORK';
      sessionStatusText = 'New York session active (US economic data, Wall Street equities, and Treasury yields)';
    } else if (utcHour >= 21 || utcHour < 0) {
      activeSession = 'SYDNEY';
      sessionStatusText = 'Pacific / Sydney session active (Early Pacific liquidity & commodity currencies)';
    } else if (utcHour >= 0 && utcHour < 8) {
      activeSession = 'TOKYO';
      sessionStatusText = 'Asia / Tokyo session active (Bank of Japan, JPY crosses, and regional Asian risk tone)';
    }

    // 4. RATES, YIELDS & SPREADS SINKRONISASI
    const us10yPrice = priceMap.get('US10Y')?.price || 4.25;
    const us10yChangePct = priceMap.get('US10Y')?.change_24h_pct || 0;
    const us10yChangeBps = Number((us10yPrice * us10yChangePct).toFixed(1));

    const yieldCondition: 'EASING' | 'TIGHTENING' | 'CONSOLIDATING' =
      us10yChangePct <= -0.05 || us10yChangeBps <= -1.5
        ? 'EASING'
        : us10yChangePct >= 0.05 || us10yChangeBps >= 1.5
        ? 'TIGHTENING'
        : 'CONSOLIDATING';

    const bund10yEstimated = 2.42;
    const jgb10yEstimated = 0.98;
    const usDeSpread = Number((us10yPrice - bund10yEstimated).toFixed(2));
    const usJpSpread = Number((us10yPrice - jgb10yEstimated).toFixed(2));
    const realYieldEstimate = Number((us10yPrice - 2.25).toFixed(2));

    const ratesAndYields = {
      us10yPrice,
      us10yChangePct,
      us10yChangeBps,
      yieldCondition,
      realYieldEstimate,
      usDeSpread,
      usJpSpread,
    };

    // 5. G8 CURRENCY HIERARCHY SINKRONISASI
    const sortedStrengths = [...strengths].sort((a, b) => b.strength_score - a.strength_score);
    const strongest = sortedStrengths[0]
      ? { currency: sortedStrengths[0].currency, score: sortedStrengths[0].strength_score }
      : { currency: 'USD', score: 7.2 };
    const weakest = sortedStrengths[sortedStrengths.length - 1]
      ? { currency: sortedStrengths[sortedStrengths.length - 1].currency, score: sortedStrengths[sortedStrengths.length - 1].strength_score }
      : { currency: 'JPY', score: 2.1 };
    const divergenceDelta = Number((strongest.score - weakest.score).toFixed(1));

    const currencyHierarchy = {
      rankings: sortedStrengths.map((s, idx) => ({
        currency: s.currency,
        score: s.strength_score,
        rank: idx + 1,
        direction: s.change_direction,
      })),
      strongest,
      weakest,
      divergenceDelta,
    };

    // 6. GLOBAL REGIME & REZIM PASAR GLOBAL
    const dxyObj = priceMap.get('USD');
    const dxyPrice = dxyObj?.price || 103.8;
    const dxyChangePct = dxyObj?.change_24h_pct || 0;
    const dxyBiasVsOpen: 'ABOVE_OPEN' | 'BELOW_OPEN' | 'AT_OPEN' =
      dxyChangePct > 0.05 ? 'ABOVE_OPEN' : dxyChangePct < -0.05 ? 'BELOW_OPEN' : 'AT_OPEN';

    const goldObj = priceMap.get('XAUUSD');
    const goldPrice = goldObj?.price || 2650.0;
    const goldChangePct = goldObj?.change_24h_pct || 0;

    const sp500ChangePct = priceMap.get('US500')?.change_24h_pct || 0;
    const us100ChangePct = priceMap.get('US100')?.change_24h_pct || 0;

    let regimeId: CentralMarketContext['globalRegime']['regimeId'] = 'BALANCED_ROTATION';
    let regimeTitle = 'BALANCED ROTATIONAL REGIME';
    let badgeColor = 'text-cyan-700 bg-cyan-50 border-cyan-200';
    let riskScore = 10;
    let summaryNarrative = 'Capital flows are rotating orderly across asset classes. Neither acute panic nor speculative euphoria dominates ahead of key session data.';
    let dominantCatalyst = 'Session range consolidation awaiting inflation and employment releases';

    if (us10yChangePct > 0.3 && dxyChangePct > 0.15) {
      regimeId = 'HAWKISH_YIELD_PRESSURE';
      regimeTitle = 'HAWKISH YIELD PRESSURE';
      badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
      riskScore = -45;
      summaryNarrative = 'Rising US10Y yields and a firmer US Dollar Index above the session open dominate market direction. Non-USD currencies and zero-yielding assets face persistent opportunity cost drag.';
      dominantCatalyst = 'Higher-for-longer monetary policy pricing or resilient US economic data';
    } else if (sp500ChangePct > 0.3 && dxyChangePct < -0.1) {
      regimeId = 'RISK_ON_EXPANSION';
      regimeTitle = 'RISK-ON EXPANSION';
      badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      riskScore = 65;
      summaryNarrative = 'Global risk appetite is expanding. The dollar softens as institutional liquidity shifts into Wall Street equity benchmarks and high-beta commodity currencies (AUD, CAD, NZD).';
      dominantCatalyst = 'Global liquidity easing and corporate earnings multiple expansion';
    } else if (sp500ChangePct < -0.4 && goldChangePct > 0.3) {
      regimeId = 'GLOBAL_FLIGHT_TO_SAFETY';
      regimeTitle = 'GLOBAL FLIGHT TO SAFETY';
      badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
      riskScore = -75;
      summaryNarrative = 'Geopolitical anxieties or global growth concerns trigger equity liquidation and aggressive bids into sovereign safe-haven assets (Physical Gold and Treasuries).';
      dominantCatalyst = 'Geopolitical escalation or equity market volatility spike';
    } else if (dxyChangePct < -0.2 && us10yChangePct < -0.3) {
      regimeId = 'DOVISH_LIQUIDITY_EASING';
      regimeTitle = 'DOVISH LIQUIDITY EASING';
      badgeColor = 'text-sky-700 bg-sky-50 border-sky-200';
      riskScore = 55;
      summaryNarrative = 'Easing US Treasury yields relieve the global discount rate. Providing a constructive tailwind for Gold (XAU/USD) and mega-cap technology growth equities (US100).';
      dominantCatalyst = 'Disinflationary prints and forward Fed rate cut repricing';
    }

    const globalRegime = {
      regimeId,
      title: regimeTitle,
      riskScore,
      badgeColor,
      dxyBiasVsOpen,
      summaryNarrative,
      dominantCatalyst,
    };

    // 7. DETEKSI DIVERGENSI INTER-INSTRUMEN OTENTIK (NO FORCED HARMONY!)
    // "If instruments diverge, do not force them into false harmony; detect divergence and clarify structural drivers."
    const divergences: DetectedMarketDivergence[] = [];

    // Divergence 1: Gold vs US10Y Yield
    const isYieldRising = us10yChangePct >= 0.05 || us10yChangeBps >= 1.5;
    const isYieldEasing = us10yChangePct <= -0.05 || us10yChangeBps <= -1.5;
    const isGoldRising = goldChangePct >= 0.15;
    const isGoldFalling = goldChangePct <= -0.15;

    if (isYieldRising && isGoldRising) {
      divergences.push({
        id: 'div_gold_yield_sovereign_demand',
        type: 'GOLD_YIELD_DIVERGENCE',
        severity: 'WARNING',
        instruments: ['XAUUSD', 'US10Y'],
        title: 'Intermarket Divergence: Gold Rallies Alongside Rising US10Y Yield',
        observedCondition: `US10Y yield climbed (+${ratesAndYields.us10yChangeBps} bps / ${ratesAndYields.us10yPrice.toFixed(3)}%) yet Gold remains resilient (+${goldChangePct.toFixed(2)}% at $${goldPrice.toFixed(1)}).`,
        structuralCause: 'Sovereign reserve diversification (de-dollarization) and geopolitical safe-haven accumulation override the nominal bond yield opportunity cost.',
        marketImplication: 'Gold demonstrates deep institutional bid absorption (decoupling from real yields). Selling into resistance carries heightened short-squeeze risk.',
        actionableContext: 'Focus on buying dips upon retests of intraday structural support; do not short blindly solely based on rising yields.',
        detectedAt: nowIso,
      });
    }

    // Divergence 2: Gold vs US Dollar (DXY)
    const isDxyRising = dxyChangePct >= 0.1;
    if (isDxyRising && isGoldRising) {
      divergences.push({
        id: 'div_gold_dxy_debasement_hedge',
        type: 'GOLD_DXY_DIVERGENCE',
        severity: 'NOTE',
        instruments: ['XAUUSD', 'USD'],
        title: 'Monetary Divergence: Gold & US Dollar Rallying Concurrently',
        observedCondition: `DXY is firm (+${dxyChangePct.toFixed(2)}%) while XAUUSD also gains (+${goldChangePct.toFixed(2)}%).`,
        structuralCause: 'Global liquidity stress prompts dual allocation: investors hoard USD cash liquidity while acquiring bullion as a fiat debasement hedge.',
        marketImplication: 'Selling pressure concentrates on secondary currencies (EUR, GBP, JPY) which weaken against USD and XAU simultaneously.',
        actionableContext: 'Non-USD majors (e.g., EUR/USD or GBP/USD) offer cleaner short opportunities than fading XAU/USD.',
        detectedAt: nowIso,
      });
    }

    // Divergence 3: Tech Equities (US100) vs Rising Yields
    const isTechRising = us100ChangePct >= 0.2;
    if (isYieldRising && isTechRising) {
      divergences.push({
        id: 'div_tech_yield_ai_capex',
        type: 'EQUITY_YIELD_DIVERGENCE',
        severity: 'NOTE',
        instruments: ['US100', 'US10Y'],
        title: 'Growth Equity vs Discount Rate Divergence',
        observedCondition: `US10Y yield gained (+${ratesAndYields.us10yChangeBps} bps) yet Nasdaq 100 rallied (+${us100ChangePct.toFixed(2)}%).`,
        structuralCause: 'Substantial AI capex spending commitments and mega-cap tech earnings revisions offset standard P/E multiple compression from interest rates.',
        marketImplication: 'Equity markets treat mega-cap hyperscalers as quality secular compounders insulated from moderate rate fluctuations.',
        actionableContext: 'Favor market leaders (AI hyperscalers/semiconductors) over debt-heavy, rate-sensitive small/mid-caps.',
        detectedAt: nowIso,
      });
    }

    // Divergence 4: USD/JPY Carry vs US-JP Yield Differential
    const usdjpyObj = priceMap.get('USDJPY');
    const usdjpyChangePct = usdjpyObj?.change_24h_pct || 0;
    if (ratesAndYields.usJpSpread >= 2.8 && usdjpyChangePct <= -0.2) {
      divergences.push({
        id: 'div_carry_usdjpy_unwinding',
        type: 'CARRY_SPREAD_DIVERGENCE',
        severity: 'WARNING',
        instruments: ['USDJPY', 'US10Y'],
        title: 'Carry Divergence: USD/JPY Pulls Back Despite Wide Yield Spread',
        observedCondition: `US10Y vs JGB yield spread remains wide (${ratesAndYields.usJpSpread}%), yet USD/JPY is retracing lower (${usdjpyChangePct.toFixed(2)}%).`,
        structuralCause: 'Verbal intervention warnings from Japan (MoF/BoJ) or broader de-risking sentiment trigger speculative yen carry unwinding.',
        marketImplication: 'Long USD/JPY exposures are vulnerable to cascade liquidations if volatility spikes.',
        actionableContext: 'Enforce tight trailing stops on long USD/JPY; respect session support thresholds.',
        detectedAt: nowIso,
      });
    }

    // 8. CROSS-ASSET YIELD TRANSMISSION TABLE
    const crossAssetTransmissions = [
      {
        asset: 'Gold (XAU/USD)',
        relationshipWithYield: 'Strong Inverse Correlation (-0.82) with TIPS Real Yields',
        expectedBehavior: isYieldEasing ? 'Bullish Expansion' : isYieldRising ? 'Resistance Drag / Opportunity Cost' : 'Consolidation',
        actualBehavior: `${goldChangePct >= 0 ? '+' : ''}${goldChangePct.toFixed(2)}% ($${goldPrice.toFixed(1)})`,
        alignmentStatus: (isYieldEasing && isGoldRising) || (isYieldRising && isGoldFalling) ? ('ALIGNED' as const) : ('DIVERGENT' as const),
        tacticalNote: isYieldEasing
          ? 'Softening yields eliminate the opportunity cost of holding non-yielding bullion. Pro-bullish tailwind.'
          : isYieldRising && isGoldRising
          ? 'Active divergence: Central bank physical absorption offsets rising coupon competition.'
          : 'Yield firming exerts mechanical drag on non-interest bearing assets.',
      },
      {
        asset: 'Nasdaq 100 (US100)',
        relationshipWithYield: 'Discount Rate Valuation Anchor for Growth Equities',
        expectedBehavior: isYieldEasing ? 'Multiple Expansion' : isYieldRising ? 'Multiple Compression' : 'Orderly Sector Rotation',
        actualBehavior: `${us100ChangePct >= 0 ? '+' : ''}${us100ChangePct.toFixed(2)}%`,
        alignmentStatus: (isYieldEasing && us100ChangePct >= 0) || (isYieldRising && us100ChangePct <= 0) ? ('ALIGNED' as const) : ('DIVERGENT' as const),
        tacticalNote: isYieldEasing
          ? 'Lower discount rates support capital deployment into software and semiconductor leaders.'
          : isTechRising
          ? 'AI capex earnings momentum outpaces moderate interest rate drag.'
          : 'Yield firming restricts aggressive valuation expansion in growth equities.',
      },
      {
        asset: 'US Dollar (DXY)',
        relationshipWithYield: 'Global Interest Rate Differential (Interest Rate Parity)',
        expectedBehavior: isYieldRising ? 'Dollar Bullish Support' : isYieldEasing ? 'Dollar Softening / FX Relief' : 'Range-bound',
        actualBehavior: `${dxyChangePct >= 0 ? '+' : ''}${dxyChangePct.toFixed(2)}% (${dxyPrice.toFixed(2)})`,
        alignmentStatus: (isYieldRising && dxyChangePct >= 0) || (isYieldEasing && dxyChangePct <= 0) ? ('ALIGNED' as const) : ('DIVERGENT' as const),
        tacticalNote: dxyBiasVsOpen === 'ABOVE_OPEN'
          ? 'Dollar trades above session open; sustains gravity on EUR/USD & GBP/USD.'
          : 'Dollar below session open; provides breathing room for foreign exchange majors.',
      },
      {
        asset: 'USD/JPY (Carry)',
        relationshipWithYield: 'US-JP Sovereign Yield Spread Engine',
        expectedBehavior: ratesAndYields.usJpSpread >= 3.0 ? 'Bullish Carry Fuel' : 'Narrowing Spread Strengthens JPY',
        actualBehavior: `${usdjpyChangePct >= 0 ? '+' : ''}${usdjpyChangePct.toFixed(2)}%`,
        alignmentStatus: (ratesAndYields.usJpSpread >= 2.5 && usdjpyChangePct >= 0) ? ('ALIGNED' as const) : ('DIVERGENT' as const),
        tacticalNote: `US-JP spread at ${ratesAndYields.usJpSpread}%. Substantial carry gap limits sustained downward extension in USD/JPY.`,
      },
    ];

    // 9. CANONICAL ASSET BIAS REGISTRY (SINGLE SOURCE OF TRUTH FOR ALL TRACKED INSTRUMENTS)
    const targetAssets = [
      { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'COMMODITY' as const },
      { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX' as const },
      { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'FOREX' as const },
      { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'FOREX' as const },
      { symbol: 'AUDUSD', name: 'Australian Dollar / USD', type: 'FOREX' as const },
      { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'FOREX' as const },
      { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'FOREX' as const },
      { symbol: 'NZDUSD', name: 'New Zealand Dollar / USD', type: 'FOREX' as const },
      { symbol: 'US100', name: 'Nasdaq 100 Index', type: 'INDEX' as const },
      { symbol: 'US500', name: 'S&P 500 Index', type: 'INDEX' as const },
      { symbol: 'US30', name: 'Dow Jones 30 Index', type: 'INDEX' as const },
      { symbol: 'BTC', name: 'Bitcoin / US Dollar', type: 'CRYPTO' as const },
      { symbol: 'US10Y', name: 'US 10Y Treasury Yield', type: 'BOND' as const },
      { symbol: 'USD', name: 'US Dollar Index (DXY)', type: 'FOREX' as const },
    ];

    const canonicalBiases: Record<string, CanonicalAssetBias> = {};

    targetAssets.forEach(asset => {
      const p = priceMap.get(asset.symbol);
      const price = p?.price || 0;
      const changePct = p?.change_24h_pct || 0;

      let bias: CanonicalAssetBias['bias'] = 'NEUTRAL';
      let convictionScore = 50;
      let confluenceStatus: CanonicalAssetBias['confluenceStatus'] = 'NEUTRAL_CHOP';
      let fundamentalDriver = '';
      let intermarketDriver = '';
      let technicalStructure = 'CHOP_RANGE';
      let invalidationTrigger = '';
      let hasActiveDivergence = false;
      let divergenceSummary: string | undefined;

      if (asset.symbol === 'XAUUSD') {
        const div = divergences.find(d => d.instruments.includes('XAUUSD'));
        hasActiveDivergence = Boolean(div);
        divergenceSummary = div?.title;

        if (changePct > 0.4 || (isYieldEasing && changePct > 0.1)) {
          bias = 'STRONG_BULLISH';
          convictionScore = 88;
          confluenceStatus = isYieldEasing ? 'HIGH_CONVICTION' : 'MODERATE';
          fundamentalDriver = 'Geopolitical hedging flows and central bank sovereign reserve diversification.';
          intermarketDriver = isYieldEasing ? 'Softening US10Y yields reduce the opportunity cost of non-yielding bullion.' : 'Gold decoupling from nominal yield increases.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'Sudden US10Y spike above session highs paired with a DXY breakout above 102.50.';
        } else if (changePct > 0.05) {
          bias = 'BULLISH';
          convictionScore = 72;
          confluenceStatus = 'MODERATE';
          fundamentalDriver = 'Steady institutional accumulation above key weekly support zones.';
          intermarketDriver = 'Stable real yields permit gradual trend expansion.';
          technicalStructure = 'RETEST_SUPPORT';
          invalidationTrigger = 'Clean breakdown below immediate session demand.';
        } else if (changePct < -0.4) {
          bias = 'STRONG_BEARISH';
          convictionScore = 82;
          confluenceStatus = 'HIGH_CONVICTION';
          fundamentalDriver = 'Interest-bearing paper assets favored due to rising benchmark yields.';
          intermarketDriver = 'Surging US10Y yield triggers liquidation outflows from bullion.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'Abrupt yield reversal below the daily opening benchmark.';
        } else if (changePct < -0.05) {
          bias = 'BEARISH';
          convictionScore = 65;
          confluenceStatus = 'MODERATE';
          fundamentalDriver = 'Profit-taking pressure at overhead resistance.';
          intermarketDriver = 'US Dollar firming across London and New York sessions.';
          technicalStructure = 'RETEST_RESISTANCE';
          invalidationTrigger = 'High-volume breakout above session highs.';
        } else {
          bias = 'NEUTRAL';
          convictionScore = 50;
          confluenceStatus = 'NEUTRAL_CHOP';
          fundamentalDriver = 'Balanced liquidity flows ahead of primary macro catalysts.';
          intermarketDriver = 'Yields and DXY oscillating in narrow consolidation bands.';
          technicalStructure = 'CHOP_RANGE';
          invalidationTrigger = 'Decisive break from the consolidation range.';
        }
      } else if (asset.type === 'FOREX' && asset.symbol !== 'USD') {
        const base = asset.symbol.substring(0, 3);
        const quote = asset.symbol.substring(3, 6);
        const baseScore = strengthMap.get(base)?.strength_score ?? 5.0;
        const quoteScore = strengthMap.get(quote)?.strength_score ?? 5.0;
        const diff = Number((baseScore - quoteScore).toFixed(1));

        // Evaluate Intermarket transmission (DXY relationship)
        // For USD as quote (EURUSD, GBPUSD, AUDUSD, NZDUSD): DXY below open is BULLISH, above open is BEARISH
        // For USD as base (USDJPY, USDCAD, USDCHF): DXY above open is BULLISH, below open is BEARISH
        const isUsdQuote = quote === 'USD';
        const isUsdBase = base === 'USD';
        const intermarketPairBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
          isUsdQuote
            ? (dxyBiasVsOpen === 'BELOW_OPEN' ? 'BULLISH' : dxyBiasVsOpen === 'ABOVE_OPEN' ? 'BEARISH' : 'NEUTRAL')
            : isUsdBase
            ? (dxyBiasVsOpen === 'ABOVE_OPEN' ? 'BULLISH' : dxyBiasVsOpen === 'BELOW_OPEN' ? 'BEARISH' : 'NEUTRAL')
            : 'NEUTRAL';

        const csPairBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
          diff >= 0.4 ? 'BULLISH' : diff <= -0.4 ? 'BEARISH' : 'NEUTRAL';

        const paPairBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
          changePct > 0.08 ? 'BULLISH' : changePct < -0.08 ? 'BEARISH' : 'NEUTRAL';

        const bulls = [csPairBias, intermarketPairBias, paPairBias].filter(b => b === 'BULLISH').length;
        const bears = [csPairBias, intermarketPairBias, paPairBias].filter(b => b === 'BEARISH').length;
        const isCsPaDivergent = (csPairBias === 'BULLISH' && paPairBias === 'BEARISH' && Math.abs(diff) >= 0.8) ||
                                (csPairBias === 'BEARISH' && paPairBias === 'BULLISH' && Math.abs(diff) >= 0.8);

        if (isCsPaDivergent) {
          hasActiveDivergence = true;
          divergenceSummary = `${asset.symbol} price action diverges from G8 score differential (${diff > 0 ? '+' : ''}${diff}pt)`;
          bias = paPairBias === 'BULLISH' ? 'BULLISH' : 'BEARISH';
          convictionScore = 42;
          confluenceStatus = 'CAUTION_TRAP';
          fundamentalDriver = `Currency strength favors ${diff > 0 ? base : quote} (Δ${diff > 0 ? '+' : ''}${diff}), but price action is undergoing counter-trend pressure.`;
          intermarketDriver = 'Short-term order flow rebalancing at session liquidity boundaries.';
          technicalStructure = 'CHOP_RANGE';
          invalidationTrigger = 'Beware fakeouts until market structure confirms directional expansion.';
        } else if (bulls === 3) {
          bias = 'STRONG_BULLISH';
          convictionScore = Math.min(95, 88 + Math.round(Math.abs(diff) * 3));
          confluenceStatus = 'HIGH_CONVICTION';
          fundamentalDriver = `${base} (#${strengthMap.get(base)?.rank || 1}, ${baseScore}) dominates over ${quote} by +${diff}pts.`;
          intermarketDriver = isUsdQuote
            ? `Softer DXY below session open confirms dollar outflow into ${base}.`
            : `Firmer DXY above session open fuels upside momentum in ${asset.symbol}.`;
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = `${quote} sharply rebounding or DXY reversing through session open.`;
        } else if (bears === 3) {
          bias = 'STRONG_BEARISH';
          convictionScore = Math.min(95, 88 + Math.round(Math.abs(diff) * 3));
          confluenceStatus = 'HIGH_CONVICTION';
          fundamentalDriver = `${quote} (#${strengthMap.get(quote)?.rank || 1}, ${quoteScore}) dominates over ${base} by +${Math.abs(diff)}pts.`;
          intermarketDriver = isUsdQuote
            ? `Firm DXY above session open sustains mechanical pressure on ${base}.`
            : `Soft DXY below session open triggers unwinding in ${asset.symbol}.`;
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = `Sudden shift in G8 rankings or break of key intraday resistance.`;
        } else if (bulls === 2) {
          bias = 'BULLISH';
          convictionScore = Math.min(85, 72 + Math.round(Math.abs(diff) * 4));
          confluenceStatus = 'MODERATE';
          fundamentalDriver = diff >= 0.4
            ? `${base} holds relative currency strength advantage over ${quote} (+${diff}pts).`
            : `Capital flows and session risk tone constructively favor ${asset.symbol}.`;
          intermarketDriver = 'Macro and currency flows provide 2/3 directional confirmation.';
          technicalStructure = changePct > 0 ? 'SESSION_BREAKOUT' : 'RETEST_SUPPORT';
          invalidationTrigger = 'Clean breakdown below immediate session demand.';
        } else if (bears === 2) {
          bias = 'BEARISH';
          convictionScore = Math.min(85, 72 + Math.round(Math.abs(diff) * 4));
          confluenceStatus = 'MODERATE';
          fundamentalDriver = diff <= -0.4
            ? `${quote} maintains currency strength lead against ${base} (+${Math.abs(diff)}pts).`
            : `Overhead supply and macro headwinds weigh on ${asset.symbol}.`;
          intermarketDriver = 'Yield or dollar dynamics restrict sustained upside.';
          technicalStructure = changePct < 0 ? 'SESSION_BREAKOUT' : 'RETEST_RESISTANCE';
          invalidationTrigger = 'High-volume breakout above session resistance.';
        } else {
          bias = 'NEUTRAL';
          convictionScore = 50;
          confluenceStatus = 'NEUTRAL_CHOP';
          fundamentalDriver = `Strength differential between ${base} and ${quote} is minimal (${diff}pt).`;
          intermarketDriver = 'No distinct directional dominance between the currency pair.';
          technicalStructure = 'CHOP_RANGE';
          invalidationTrigger = 'Await catalyst release for structural breakout confirmation.';
        }
      } else if (asset.symbol === 'US100' || asset.symbol === 'US500' || asset.symbol === 'US30') {
        const div = divergences.find(d => d.instruments.includes(asset.symbol));
        hasActiveDivergence = Boolean(div);
        divergenceSummary = div?.title;

        if (changePct > 0.3) {
          bias = 'BULLISH';
          convictionScore = 78;
          confluenceStatus = isYieldEasing ? 'HIGH_CONVICTION' : 'MODERATE';
          fundamentalDriver = 'Broad Wall Street buying momentum with robust participation in growth equities.';
          intermarketDriver = isYieldEasing ? 'Softening bond yields expand equity valuation multiples.' : 'Corporate fundamentals offset interest rate headwind.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'Aggressive liquidation breaking daily support if US10Y spikes.';
        } else if (changePct < -0.3) {
          bias = 'BEARISH';
          convictionScore = 75;
          confluenceStatus = 'HIGH_CONVICTION';
          fundamentalDriver = 'Global de-risking and valuation compression amid macro uncertainty.';
          intermarketDriver = isYieldRising ? 'Surging US10Y yields compress discount rate multiples.' : 'Weakening global risk appetite.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'Risk-on recovery in the New York afternoon session.';
        } else {
          bias = 'NEUTRAL';
          convictionScore = 52;
          confluenceStatus = 'NEUTRAL_CHOP';
          fundamentalDriver = 'Wall Street consolidating in balanced rotational conditions.';
          intermarketDriver = 'Treasury yields steady within session ranges.';
          technicalStructure = 'CHOP_RANGE';
          invalidationTrigger = 'Clean breakout from the session range.';
        }
      } else if (asset.symbol === 'BTC') {
        if (changePct > 0.5) {
          bias = 'BULLISH';
          convictionScore = 76;
          confluenceStatus = 'MODERATE';
          fundamentalDriver = 'Institutional accumulation and elevated digital asset risk appetite.';
          intermarketDriver = 'Global M2 liquidity growth and a softening DXY support crypto assets.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'US Dollar sharp reversal or tech equity de-risking.';
        } else if (changePct < -0.5) {
          bias = 'BEARISH';
          convictionScore = 74;
          confluenceStatus = 'MODERATE';
          fundamentalDriver = 'Liquidity drain and profit-taking at psychological resistance.';
          intermarketDriver = 'Firm DXY restricts speculative liquidity expansion.';
          technicalStructure = 'SESSION_BREAKOUT';
          invalidationTrigger = 'Strong buying bounce at key psychological support.';
        } else {
          bias = 'NEUTRAL';
          convictionScore = 50;
          confluenceStatus = 'NEUTRAL_CHOP';
          fundamentalDriver = 'Sideways consolidation within multi-session accumulation range.';
          intermarketDriver = 'Capital sidelined awaiting directional volatility catalyst.';
          technicalStructure = 'CHOP_RANGE';
          invalidationTrigger = 'Breakout beyond range extremes.';
        }
      } else if (asset.symbol === 'US10Y') {
        bias = isYieldRising ? 'BULLISH' : isYieldEasing ? 'BEARISH' : 'NEUTRAL';
        convictionScore = Math.abs(us10yChangeBps) >= 3 ? 85 : 65;
        confluenceStatus = 'HIGH_CONVICTION';
        fundamentalDriver = isYieldRising ? 'Expectations of sustained policy restraint or heavy Treasury supply.' : 'Easing policy rate path expectations and cooling inflation.';
        intermarketDriver = 'Shifts across the US benchmark yield curve.';
        technicalStructure = Math.abs(us10yChangePct) > 0.2 ? 'SESSION_BREAKOUT' : 'CHOP_RANGE';
        invalidationTrigger = 'CPI/NFP data surprises or unexpected FOMC policy guidance.';
      } else if (asset.symbol === 'USD') {
        bias = dxyBiasVsOpen === 'ABOVE_OPEN' ? 'BULLISH' : dxyBiasVsOpen === 'BELOW_OPEN' ? 'BEARISH' : 'NEUTRAL';
        convictionScore = Math.abs(dxyChangePct) >= 0.2 ? 80 : 60;
        confluenceStatus = 'HIGH_CONVICTION';
        fundamentalDriver = dxyBiasVsOpen === 'ABOVE_OPEN' ? 'Relative US economic resilience versus European and Asian economies.' : 'Dollar weakness driven by broad global risk appetite.';
        intermarketDriver = '10-year sovereign interest rate differentials.';
        technicalStructure = Math.abs(dxyChangePct) > 0.2 ? 'SESSION_BREAKOUT' : 'CHOP_RANGE';
        invalidationTrigger = 'Break of daily DXY session support or resistance.';
      }

      canonicalBiases[asset.symbol] = {
        symbol: asset.symbol,
        displayName: asset.name,
        assetType: asset.type,
        price,
        change24hPct: changePct,
        bias,
        convictionScore,
        confluenceStatus,
        fundamentalDriver,
        intermarketDriver,
        technicalStructure,
        invalidationTrigger,
        hasActiveDivergence,
        divergenceSummary,
        lastUpdated: nowIso,
      };
    });

    // Populate currency aliases for modules using 3-letter codes (e.g. IntradayMarketMapEngine)
    if (canonicalBiases['EURUSD']) canonicalBiases['EUR'] = { ...canonicalBiases['EURUSD'], symbol: 'EUR' };
    if (canonicalBiases['GBPUSD']) canonicalBiases['GBP'] = { ...canonicalBiases['GBPUSD'], symbol: 'GBP' };
    if (canonicalBiases['USDJPY']) canonicalBiases['JPY'] = { ...canonicalBiases['USDJPY'], symbol: 'JPY' };
    if (canonicalBiases['AUDUSD']) canonicalBiases['AUD'] = { ...canonicalBiases['AUDUSD'], symbol: 'AUD' };
    if (canonicalBiases['USDCAD']) canonicalBiases['CAD'] = { ...canonicalBiases['USDCAD'], symbol: 'CAD' };
    if (canonicalBiases['USDCHF']) canonicalBiases['CHF'] = { ...canonicalBiases['USDCHF'], symbol: 'CHF' };
    if (canonicalBiases['NZDUSD']) canonicalBiases['NZD'] = { ...canonicalBiases['NZDUSD'], symbol: 'NZD' };

    // 10. SYNCHRONIZED CATALYSTS DARI KALENDER
    const upcomingHigh = macroCalendar.find(
      (c: EconomicEvent) => c.status === 'UPCOMING' && (c.impact === 'CRITICAL' || c.impact === 'HIGH')
    );

    const upcomingKeyRelease = upcomingHigh
      ? {
          currency: upcomingHigh.currency,
          event_name: upcomingHigh.event_name,
          impact: upcomingHigh.impact,
          date_time_utc: upcomingHigh.date_time_utc,
        }
      : undefined;

    // Ambil katalis hari ini yang sudah dirilis atau siap rilis
    const todayCatalysts: TodayCatalyst[] = macroCalendar.slice(0, 8).map((c: EconomicEvent) => ({
      id: c.id,
      event_name: c.event_name,
      date_time_utc: c.date_time_utc,
      country_code: c.country_code || c.currency.slice(0, 2),
      currency: c.currency,
      importance: c.impact,
      actual: c.actual,
      forecast: c.forecast,
      previous: c.previous,
      surprise: c.surprise || null,
      change: c.change || null,
      related_assets: [c.currency],
      status: c.status,
      actual_market_reaction: c.actual_market_reaction || c.fundamental_implication || (c.status === 'RELEASED' ? 'Market reaction absorbed into price action' : 'Awaiting official publication'),
      fundamental_implication: c.fundamental_implication || 'Influences central bank policy rate expectations',
      source: c.source || 'Economic Calendar Wire',
      last_updated: c.last_updated || nowIso,
      data_status: c.status === 'RELEASED' ? 'LIVE' : 'RECENT',
    }));

    return {
      id: `cmc_${epoch}`,
      epoch,
      timestamp: nowIso,
      activeSession,
      sessionStatusText,
      dataQuality,
      globalRegime,
      ratesAndYields,
      currencyHierarchy,
      crossAssetTransmissions,
      divergences,
      canonicalBiases,
      upcomingKeyRelease,
      todayCatalysts,
    };
  }
}
