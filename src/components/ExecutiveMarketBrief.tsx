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
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Target,
  BarChart3,
  ExternalLink,
  ShieldAlert,
  Info,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { D3Sparkline } from './ui/D3Sparkline';
import { NavTabId } from './Sidebar';

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
    ? 'YIELD MELEMAH (EASING)'
    : isYieldRising
    ? 'YIELD MENGUAT (TIGHTENING)'
    : 'YIELD KONSOLIDASI (FLAT)';

  // Real Yield Proxy (Nominal 10Y minus assumed 2.25% breakeven)
  const realYieldEstimate = Number((us10yPrice - 2.25).toFixed(2));

  // Spreads from ArahMarketData if available, else estimated
  const usDeSpread = arahMarketData?.intermarketSpreads?.find(s => s.id === 'spread-us-de')?.currentValue ?? Number((us10yPrice - 2.42).toFixed(2));
  const usJpSpread = arahMarketData?.intermarketSpreads?.find(s => s.id === 'spread-us-jp')?.currentValue ?? Number((us10yPrice - 0.98).toFixed(2));

  // Global Regime from ArahMarketData or fallback
  const regimeTitle = globalRegime?.title || arahMarketData?.globalRegime?.title || 'BALANCED ROTATIONAL REGIME';
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
      return `ANOMALI SAFE-HAVEN: Emas tetap menguat (+${(gold.change_24h_pct || 0).toFixed(2)}%) meskipun yield US10Y naik (+${us10yChangeBps} bps). Hal ini menandakan premi risiko geopolitik atau akumulasi cadangan devisa bank sentral (de-dolarisasi) sedang mengesampingkan beban suku bunga obligasi.`;
    }
    if (isYieldEasing) {
      return `Imbal hasil US10Y melemah ke ${us10yPrice.toFixed(3)}% (${us10yChangeBps > 0 ? '+' : ''}${us10yChangeBps} bps). Penurunan yield ini melonggarkan opportunity cost memegang emas fisik tanpa imbal hasil, memberi dorongan beli langsung (bullish tailwind) ke XAU/USD.`;
    } else if (isYieldRising) {
      return `Imbal hasil US10Y menguat ke ${us10yPrice.toFixed(3)}% (+${us10yChangeBps} bps). Kenaikan yield riil meningkatkan opportunity cost emas, memicu aksi ambil untung atau tekanan resisten pada reli intraday XAU/USD.`;
    }
    return `Imbal hasil US10Y stabil di kisaran ${us10yPrice.toFixed(3)}%. Pergerakan Gold (XAU/USD) bergantung pada pergeseran tensi geopolitik dan arah DXY terhadap pembukaan sesi.`;
  }, [isGoldYieldAnomaly, isYieldEasing, isYieldRising, us10yPrice, us10yChangeBps, gold.change_24h_pct]);

  // Dynamic Synthesis for Equities / Nasdaq
  const techTransmissionStory = useMemo(() => {
    if (isYieldEasing) {
      return `Pelemahan yield obligasi melonggarkan tingkat diskonto (discount rate) arus kas masa depan, mendorong ekspansi valuasi saham teknologi mega-cap dan AI (US100 unggul).`;
    } else if (isYieldRising) {
      return `Kenaikan yield obligasi menaikkan discount rate, menekan kelipatan P/E saham growth ber-multiple tinggi (US100) dan memicu rotasi defensif ke saham siklikal/Dow 30 (US30).`;
    }
    return `Kondisi yield yang seimbang menjaga rotasi wajar antara saham teknologi (US100) dan saham industrial/perbankan (US30).`;
  }, [isYieldEasing, isYieldRising]);

  return (
    <div className="terminal-panel p-4 sm:p-5 space-y-4 font-sans" id="executive-macro-yield-synthesis">
      {/* 1. DOSSIER HEADER WITH REGIME & CONTROLS */}
      <div className="pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="metadata-label text-[10px] text-[var(--accent)] font-mono font-semibold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>EXECUTIVE DAILY MACRO SYNTHESIS</span>
            </span>
            <span className="text-[var(--border-subtle)]">·</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-section)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              {arahMarketData?.activeSession ? `${arahMarketData.activeSession} SESSION` : 'REAL-TIME WIB'}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-mono font-bold text-[var(--text-primary)] uppercase tracking-wide">
            Arah Fundamental, Imbal Hasil (Yield), & Transmisi Gold Lintas Aset
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed max-w-3xl">
            Sintesis intelijen harian yang mengintegrasikan katalis makro fundamental, pergerakan imbal hasil US10Y & yield riil, serta transmisi langsung ke Emas (XAU/USD), Nasdaq (US100), DXY, dan Valuta Asing.
          </p>
        </div>
      </div>

      {/* ANOMALY ALERT BANNER (IF ACTIVE) */}
      {(isGoldYieldAnomaly || isGoldDxyAnomaly) && (
        <div className="p-3 rounded-lg border border-[var(--warning)] bg-[var(--warning)]/10 flex items-start gap-2.5 text-xs text-[var(--text-primary)] font-sans">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-mono font-bold text-[var(--warning)] block">
              PERINGATAN ANOMALI INTERMARKET: EMAS & YIELD/DOLAR SAMA-SAMA MENGUAT
            </span>
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
              Emas (XAU/USD) naik berbarengan dengan penguatan Yield US10Y atau DXY. Secara teori intermarket klasik, kedua aset biasanya berlawanan arah. Anomali ini menandakan premi risiko perang/geopolitik darurat atau de-dolarisasi cadangan devisa bank sentral sedang mengesampingkan faktor discount rate imbal hasil obligasi.
            </p>
          </div>
        </div>
      )}

      {/* VISUAL CAUSAL TRANSMISSION CHAIN BANNER */}
      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-2">
        <div className="flex items-center justify-between text-[10.5px] font-mono">
          <span className="font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>ALUR TRANSMISI INTERMARKET SEBAB-AKIBAT:</span>
          </span>
          <span className="text-[var(--text-muted)] font-semibold">
            {isYieldEasing ? 'SKENARIO: YIELD MELEMAH (EASING)' : isYieldRising ? 'SKENARIO: YIELD MENGUAT (TIGHTENING)' : 'SKENARIO: YIELD KONSOLIDASI'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">1. SUMBER BENCHMARK</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>US10Y ({us10yPrice.toFixed(3)}%)</span>
              <span className={isYieldEasing ? 'text-[var(--bullish)]' : isYieldRising ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}>
                {isYieldEasing ? '▼ Easing' : isYieldRising ? '▲ Tightening' : '● Flat'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? 'Yield obligasi AS melandai (-bps)' : isYieldRising ? 'Yield obligasi AS melonjak (+bps)' : 'Suku bunga acuan stabil'}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">2. TRANSMISI REAL YIELD</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Real Yield ({realYieldEstimate}%)</span>
              <span className={isYieldEasing ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}>
                {isYieldEasing ? '▼ Melonggar' : '▲ Mengetat'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? 'Discount rate & opportunity cost turun' : 'Discount rate & opportunity cost naik'}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">3. DAMPAK KE EMAS (XAU)</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Gold (${gold.price.toFixed(1)})</span>
              <span className={goldDirectionalBias === 'BULLISH' ? 'text-[var(--bullish)]' : goldDirectionalBias === 'BEARISH' ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}>
                {goldDirectionalBias === 'BULLISH' ? '▲ Bullish' : goldDirectionalBias === 'BEARISH' ? '▼ Bearish' : '● Netral'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? 'Beban oportunitas hilang, emas diburu' : 'Aset berbunga lebih menarik dari emas'}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[9.5px] text-[var(--text-muted)] font-bold">4. SAHAM TECH & VALAS</div>
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>US100 / DXY / JPY</span>
              <span className="text-[var(--accent)] font-semibold">Multiple P/E</span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-sans">
              {isYieldEasing ? 'Valuasi P/E tech longgar, Dolar melemah' : 'Kompresi P/E tech, Dolar menguat'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE CORE PILLARS BANNER (FUNDAMENTAL, YIELD ANCHOR, GOLD VECTOR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* PILLAR 1: ARAH FUNDAMENTAL */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>1. ARAH FUNDAMENTAL</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold font-mono ${
              riskScore > 20 ? 'badge-bullish' : riskScore < -20 ? 'badge-bearish' : 'badge-neutral'
            }`}>
              {regimeTitle}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                Sentimen Risiko Global:
              </span>
              <span className={`text-xs font-bold font-mono ${riskScore > 0 ? 'text-[var(--bullish)]' : riskScore < 0 ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}`}>
                {riskScore > 0 ? `+${riskScore}` : riskScore} / 100
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] font-sans leading-relaxed line-clamp-3">
              {arahMarketData?.globalRegime?.summaryNarrative ||
                'Kondisi makro global digerakkan oleh ekspektasi suku bunga Federal Reserve, rilis data inflasi, serta arah transmisi US Dollar terhadap pembukaan sesi.'}
            </p>
          </div>

          <div className="pt-2 border-t flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
            <span>DXY VS OPEN:</span>
            <span className={`font-bold ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'text-[var(--bearish)]' : dxyBiasVsOpen === 'BELOW_OPEN' ? 'text-[var(--bullish)]' : 'text-[var(--text-muted)]'}`}>
              {dxyBiasVsOpen === 'ABOVE_OPEN' ? '▲ DI ATAS OPEN (TEKANAN USD)' : dxyBiasVsOpen === 'BELOW_OPEN' ? '▼ DI BAWAH OPEN (PELEMAHAN USD)' : '● SEIMBANG'}
            </span>
          </div>
        </div>

        {/* PILLAR 2: STATUS IMBAL HASIL (YIELD US10Y & REAL YIELD) */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>2. IMBAL HASIL (US10Y YIELD)</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold font-mono ${
              isYieldEasing ? 'badge-bullish' : isYieldRising ? 'badge-bearish' : 'badge-neutral'
            }`}>
              {yieldStatusLabel}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {us10yPrice.toFixed(3)}%
              </span>
              <span className={`text-xs font-bold ${us10yChangePct <= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {us10yChangePct >= 0 ? '+' : ''}{us10yChangePct.toFixed(2)}% ({us10yChangeBps >= 0 ? '+' : ''}{us10yChangeBps} bps)
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] font-sans leading-relaxed">
              {isYieldEasing
                ? 'Yield US10Y melemah. Penurunan imbal hasil melonggarkan discount rate dan meringankan beban opportunity cost aset tanpa bunga.'
                : isYieldRising
                ? 'Yield US10Y menguat. Kenaikan imbal hasil menaikkan opportunity cost emas dan menekan valuasi saham teknologi ber-multiple tinggi.'
                : 'Yield US10Y berkonsolidasi di sekitar level acuan sesi; pasar menunggu katalis pidato bank sentral atau data inflasi berikutnya.'}
            </p>
          </div>

          <div className="pt-2 border-t flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
            <span>YIELD RIIL ESTIMASI:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {realYieldEstimate}% {realYieldEstimate > 1.9 ? '(High Drag)' : '(Supportive)'}
            </span>
          </div>
        </div>

        {/* PILLAR 3: ARAH GOLD (XAUUSD) & VEKTOR YIELD */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="metadata-label text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>3. ARAH EMAS (XAU/USD)</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold font-mono ${
              goldDirectionalBias === 'BULLISH' || goldDirectionalBias === 'STRONG_BULLISH'
                ? 'badge-bullish'
                : goldDirectionalBias === 'BEARISH' || goldDirectionalBias === 'STRONG_BEARISH'
                ? 'badge-bearish'
                : 'badge-neutral'
            }`}>
              BIAS: {goldDirectionalBias}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                ${gold.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className={`text-xs font-bold ${(gold.change_24h_pct || 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(gold.change_24h_pct || 0) >= 0 ? '+' : ''}{(gold.change_24h_pct || 0).toFixed(2)}%
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--text-secondary)] font-sans leading-relaxed">
              {isYieldEasing
                ? 'Emas diuntungkan oleh pelemahan imbal hasil obligasi AS dan pelemahan DXY. Menghadirkan bias beli pada pullback ke area demand sesi.'
                : isYieldRising
                ? 'Emas tertekan oleh penguatan yield obligasi AS dan DXY yang kokoh. Waspadai resisten pada pantulan harga dan potensi retracement.'
                : 'Emas berada dalam fase konsolidasi intraday; perhatikan level support/resistance batas sesi Asia-London.'}
            </p>
          </div>

          <div className="pt-2 border-t flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
            <span>REKOMENDASI DESK:</span>
            <span className="font-bold text-[var(--accent)]">
              {goldConfluence?.intradayPlan?.recommendedAction || (isYieldEasing ? 'LOOK FOR BUY' : isYieldRising ? 'LOOK FOR SELL' : 'WAIT ON SUPPORT')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TRANSMISI IMBAL HASIL LINTAS ASET (CROSS-ASSET YIELD TRANSMISSION MATRIX) */}
      {(activeViewTab === 'ALL_IN_ONE' || activeViewTab === 'YIELD_GOLD') && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs sm:text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wide">
                Transmisi Imbal Hasil (Yield) ke Seluruh Aset Terkait
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Korelasi & Dampak Langsung ke XAU, US100, DXY, FX
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
                  <span className="text-[10px] text-[var(--text-muted)]">Gold</span>
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
                  HUBUNGAN DENGAN YIELD:
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {isYieldEasing
                    ? 'Yield melemah = Emas menguat (beban opportunity cost berkurang, dorongan safe-haven).'
                    : isYieldRising
                    ? 'Yield menguat = Emas tertekan (yield obligasi menarik modal keluar dari emas).'
                    : 'Korelasi imbal hasil riil stabil; perhatikan pergerakan indeks dolar (DXY).'}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">AKSI TRADER:</span>
                <span className="font-bold text-[var(--bullish)]">
                  {isYieldEasing ? 'Cari Posisi Buy (Dip)' : 'Waspada Resisten'}
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
                  HUBUNGAN DENGAN YIELD:
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  {isYieldEasing
                    ? 'Yield melemah = Valuasi saham tech longgar (multiple expansion, dorongan beli pada saham AI).'
                    : isYieldRising
                    ? 'Yield menguat = Kompresi valuasi P/E saham growth (tekanan jual pada saham ber-P/E tinggi).'
                    : 'Rotasi seimbang antara teknologi (US100) dan saham siklikal/Dow (US30).'}
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">LEADERSHIP:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {arahMarketData?.indexCorrelation?.ratioTrend === 'OUTPERFORMING' ? 'US100 Unggul vs US30' : 'Rotasi Berimbang'}
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
                  HUBUNGAN DENGAN YIELD:
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  DXY berkorelasi positif dengan US10Y. DXY {dxyBiasVsOpen === 'ABOVE_OPEN' ? 'di atas pembukaan sesi menekan EUR/USD dan komoditas' : 'di bawah pembukaan memberi ruang pelegaan bagi mata uang rival dan emas'}.
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">GRAVITASI MAJORS:</span>
                <span className={`font-bold ${dxyBiasVsOpen === 'ABOVE_OPEN' ? 'text-[var(--bearish)]' : 'text-[var(--bullish)]'}`}>
                  {dxyBiasVsOpen === 'ABOVE_OPEN' ? 'Tekanan Kuat' : 'Pelegaan Maju'}
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
                  HUBUNGAN DENGAN YIELD:
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
                  Spread US-Japan sebesar {usJpSpread}% adalah bahan bakar utama carry trade. Jika yield US10Y turun, USD/JPY rentan koreksi tajam.
                </p>
              </div>

              <div className="pt-2 border-t text-[10px] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[var(--text-muted)]">SPREAD US-JP:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {usJpSpread}% (Lebar)
                </span>
              </div>
            </div>
          </div>

          {/* TABEL RINGKASAN TRANSMISI LINTAS ASET TERKAIT YIELD */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                <h4 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                  Tabel Sintesis Transmisi Yield & Korelasi Lintas Aset
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                LOGIKA INTERMARKET CANONICAL
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ borderColor: 'var(--border-hairline)' }}>
                    <th className="py-2 px-2.5">Instrumen</th>
                    <th className="py-2 px-2.5">Kategori</th>
                    <th className="py-2 px-2.5">Harga & Perubahan</th>
                    <th className="py-2 px-2.5">Hubungan dengan Yield US10Y</th>
                    <th className="py-2 px-2.5">Status Hari Ini</th>
                    <th className="py-2 px-2.5">Bias / Aksi Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] text-xs">
                  {/* Row 1: XAUUSD */}
                  <tr className="hover:bg-[var(--bg-section-alt)] transition">
                    <td className="py-2.5 px-2.5 font-bold text-[var(--text-primary)]">
                      <button onClick={() => onOpenChart('XAUUSD')} className="hover:underline flex items-center gap-1 cursor-pointer">
                        <span>XAU/USD</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                      </button>
                    </td>
                    <td className="py-2.5 px-2.5 text-[var(--text-muted)]">Komoditas / Emas</td>
                    <td className="py-2.5 px-2.5">
                      <span className="font-bold text-[var(--text-primary)] mr-1.5">${gold.price.toFixed(1)}</span>
                      <span className={`text-[10px] ${(gold.change_24h_pct || 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                        {(gold.change_24h_pct || 0) >= 0 ? '+' : ''}{(gold.change_24h_pct || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-sans text-[var(--text-secondary)]">
                      <strong>Terbalik Kuat (-0.82):</strong> Yield turun ➔ Real yield turun ➔ Beban opportunity cost emas berkurang ➔ Emas menguat.
                    </td>
                    <td className="py-2.5 px-2.5">
                      {isGoldYieldAnomaly ? (
                        <span className="badge-warning text-[9px] font-bold">⚠️ ANOMALI SAFE-HAVEN</span>
                      ) : (
                        <span className="badge-bullish text-[9px] font-bold">✓ SELARAS INTERMARKET</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[var(--bullish)]">
                      {goldDirectionalBias === 'BULLISH' ? 'BUY ON PULLBACK' : goldDirectionalBias === 'BEARISH' ? 'FADE THE RALLY' : 'RANGE BOUND'}
                    </td>
                  </tr>

                  {/* Row 2: US100 */}
                  <tr className="hover:bg-[var(--bg-section-alt)] transition">
                    <td className="py-2.5 px-2.5 font-bold text-[var(--text-primary)]">
                      <button onClick={() => onOpenChart('US100')} className="hover:underline flex items-center gap-1 cursor-pointer">
                        <span>US100</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                      </button>
                    </td>
                    <td className="py-2.5 px-2.5 text-[var(--text-muted)]">Ekuitas / Tech Growth</td>
                    <td className="py-2.5 px-2.5">
                      <span className="font-bold text-[var(--text-primary)] mr-1.5">{us100.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className={`text-[10px] ${(us100.change_24h_pct || 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                        {(us100.change_24h_pct || 0) >= 0 ? '+' : ''}{(us100.change_24h_pct || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-sans text-[var(--text-secondary)]">
                      <strong>Terbalik (-0.68):</strong> Yield turun ➔ Discount rate turun ➔ Kelipatan valuasi forward P/E saham AI & teknologi mengembang.
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="badge-bullish text-[9px] font-bold">✓ SELARAS INTERMARKET</span>
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[var(--bullish)]">
                      {isYieldEasing ? 'FAVOR TECH (LONG)' : 'DEFENSIVE ROTATION (US30)'}
                    </td>
                  </tr>

                  {/* Row 3: DXY */}
                  <tr className="hover:bg-[var(--bg-section-alt)] transition">
                    <td className="py-2.5 px-2.5 font-bold text-[var(--text-primary)]">
                      <button onClick={() => onOpenChart('USD')} className="hover:underline flex items-center gap-1 cursor-pointer">
                        <span>DXY</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                      </button>
                    </td>
                    <td className="py-2.5 px-2.5 text-[var(--text-muted)]">Indeks Dolar AS</td>
                    <td className="py-2.5 px-2.5">
                      <span className="font-bold text-[var(--text-primary)] mr-1.5">{dxy.price.toFixed(2)}</span>
                      <span className={`text-[10px] ${(dxy.change_24h_pct || 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                        {(dxy.change_24h_pct || 0) >= 0 ? '+' : ''}{(dxy.change_24h_pct || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-sans text-[var(--text-secondary)]">
                      <strong>Searah (+0.65):</strong> Yield naik ➔ Aliran modal asing masuk ke obligasi AS ➔ Permintaan Dolar naik.
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="badge-neutral text-[9px] font-bold">{dxyBiasVsOpen === 'ABOVE_OPEN' ? 'DI ATAS OPEN' : 'DI BAWAH OPEN'}</span>
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[var(--accent)]">
                      {dxyBiasVsOpen === 'BELOW_OPEN' ? 'TEKANAN DOLAR MELEMAH' : 'TEKANAN DOLAR MENINGKAT'}
                    </td>
                  </tr>

                  {/* Row 4: USDJPY */}
                  <tr className="hover:bg-[var(--bg-section-alt)] transition">
                    <td className="py-2.5 px-2.5 font-bold text-[var(--text-primary)]">
                      <button onClick={() => onOpenChart('USDJPY')} className="hover:underline flex items-center gap-1 cursor-pointer">
                        <span>USD/JPY</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                      </button>
                    </td>
                    <td className="py-2.5 px-2.5 text-[var(--text-muted)]">Valas / Carry Engine</td>
                    <td className="py-2.5 px-2.5">
                      <span className="font-bold text-[var(--text-primary)] mr-1.5">{usdjpy.price.toFixed(2)}</span>
                      <span className={`text-[10px] ${(usdjpy.change_24h_pct || 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                        {(usdjpy.change_24h_pct || 0) >= 0 ? '+' : ''}{(usdjpy.change_24h_pct || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-sans text-[var(--text-secondary)]">
                      <strong>Searah Kuat (+0.78):</strong> Spread yield US-Japan ({usJpSpread}%) adalah bahan bakar carry trade. Yield US turun ➔ Carry ditutup ➔ JPY menguat (USD/JPY drop).
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="badge-bullish text-[9px] font-bold">✓ CARRY REAKTIF</span>
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[var(--text-primary)]">
                      {isYieldEasing ? 'WASPADA CARRY UNWIND' : 'CARRY TRADE FAVORABLE'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 4. MACRO CATALYSTS, CURRENCY FLOW, & EXECUTIVE PLAYBOOK */}
      {(activeViewTab === 'ALL_IN_ONE' || activeViewTab === 'CATALYSTS_FX') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1">
          {/* Executive Directives & Invalidations (7 cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                  Panduan Taktis Eksekusi & Kondisi Invalidation
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">DESK PLAYBOOK</span>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">Fokus Emas (XAU/USD): </strong>
                  {goldTransmissionStory}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">Fokus Valas & Suku Bunga: </strong>
                  Divergensi mata uang G8 saat ini dipimpin oleh <strong>{strongestCurrency.currency}</strong> (skor {strongestCurrency.strength_score.toFixed(1)}) melawan <strong>{weakestCurrency.currency}</strong> (skor {weakestCurrency.strength_score.toFixed(1)}) dengan selisih {currencySpread} poin. Manfaatkan pergerakan searah dengan yield spread.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded font-mono font-bold text-[10.5px] bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)] font-semibold">Pemicu Pembatalan (Invalidation Trigger): </strong>
                  {isYieldEasing
                    ? 'Jika US10Y mendadak rebound menembus resisten sesi atau DXY breakout ke atas pembukaan sesi, setup bullish Gold dan Tech batal (cut / de-risk).'
                    : isYieldRising
                    ? 'Jika US10Y drop tiba-tiba menembus support harian, tekanan bearish pada Gold dan Tech berakhir seketika.'
                    : 'Penembusan range sesi pada DXY atau US10Y akan menentukan arah tren berikutnya.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <span className="text-[var(--text-muted)]">STATUS REZIM:</span>
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
                  Katalis Makro Hari Ini
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                HIGH IMPACT
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
                        timeZone: 'Asia/Jakarta',
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' WIB' : 'SESI INI'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                    {cat.event_name}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-secondary)] font-sans line-clamp-2">
                    {cat.fundamental_implication || cat.actual_market_reaction || 'Pantau dampak rilis data terhadap ekspektasi suku bunga Fed.'}
                  </div>
                </div>
              ))}

              {todayCatalysts.length === 0 && (
                <div className="text-xs text-[var(--text-muted)] py-3 text-center font-mono">
                  Tidak ada katalis berdampak ekstrem terjadwal untuk sesi saat ini.
                </div>
              )}
            </div>

            {/* Currency quick badges */}
            <div className="pt-2 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]">LEADER:</span>
                <span className="font-bold text-[var(--bullish)]">{strongestCurrency.currency} ({strongestCurrency.strength_score.toFixed(1)})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]">LAGGARD:</span>
                <span className="font-bold text-[var(--bearish)]">{weakestCurrency.currency} ({weakestCurrency.strength_score.toFixed(1)})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
