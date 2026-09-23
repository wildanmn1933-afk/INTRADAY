import React, { useState, useMemo } from 'react';
import {
  CurrencyStrength,
  IntradayAssetBias,
  TodayCatalyst,
  MarketPrice,
  EconomicEvent,
} from '../types';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Compass,
  Zap,
  Target,
  ShieldAlert,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Minus,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';
import { Tooltip, MetricTooltip, MetricInfoIcon } from './Tooltip';
import { getCurrencyFlagUrl, ASSET_VISUAL_MAP } from '../lib/assets';

interface ExecutiveMarketBriefProps {
  strengths: CurrencyStrength[];
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  prices: MarketPrice[];
  calendar: EconomicEvent[];
  onOpenChart: (symbol: string) => void;
  onSelectSymbol: (symbol: string | null) => void;
}

interface TradeSuggestion {
  id: string;
  symbol: string;
  name: string;
  category: 'FX_CROSS' | 'FX_MAJOR' | 'COMMODITY' | 'INDEX' | 'BOND';
  action: 'STRONG_BUY' | 'BUY' | 'STRONG_SELL' | 'SELL' | 'AVOID_CHOP';
  actionLabel: string;
  biasConfidence: number; // 0-100
  deltaOrScore?: string;
  tradeStyle: string;
  entryZone: string;
  invalidationLevel: string;
  targetProjection: string;
  fundamentalDriver: string;
  riskNote: string;
  tier: 'PRIME_A' | 'HIGH' | 'SPECULATIVE' | 'AVOID';
}

export const ExecutiveMarketBrief: React.FC<ExecutiveMarketBriefProps> = ({
  strengths,
  intradayMap,
  todayCatalysts,
  prices,
  calendar,
  onOpenChart,
  onSelectSymbol,
}) => {
  const [filterCategory, setFilterCategory] = useState<
    'ALL' | 'PRIME' | 'INDICES' | 'COMMODITIES' | 'BONDS' | 'CROSSES' | 'MAJORS' | 'AVOID'
  >('ALL');

  // Currency score lookup
  const curScoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    strengths.forEach(s => {
      map[s.currency] = s.strength_score;
    });
    return map;
  }, [strengths]);

  // Price lookup
  const priceMap = useMemo(() => {
    const map = new Map<string, MarketPrice>();
    prices.forEach(p => map.set(p.symbol.toUpperCase(), p));
    return map;
  }, [prices]);

  // Intraday bias lookup
  const biasMap = useMemo(() => {
    const map = new Map<string, IntradayAssetBias>();
    intradayMap.forEach(item => map.set(item.symbol.toUpperCase(), item));
    return map;
  }, [intradayMap]);

  // 1. DYNAMIC MARKET SYNTHESIS CALCULATION (KESIMPULAN PASAR HARI INI)
  const marketSynthesis = useMemo(() => {
    // Sort strengths to find leader & lagger
    const sortedStrengths = [...strengths].sort((a, b) => b.strength_score - a.strength_score);
    const strongest = sortedStrengths[0] || { currency: 'CHF', strength_score: 6.5 };
    const weakest = sortedStrengths[sortedStrengths.length - 1] || { currency: 'JPY', strength_score: 3.0 };

    // Key asset status
    const gold = priceMap.get('XAUUSD');
    const dxy = priceMap.get('USD');
    const us100 = priceMap.get('US100');
    const us10y = priceMap.get('US10Y');
    const spx = priceMap.get('SPX') || priceMap.get('US500');
    const btc = priceMap.get('BTC');
    const crude = priceMap.get('WTI');

    const goldBias = biasMap.get('XAUUSD');
    const usdBias = biasMap.get('USD');
    const us100Bias = biasMap.get('US100');
    const us10yBias = biasMap.get('US10Y');

    // Determine current regime
    let regimeTitle = 'Defensive & Rotation (Selektif)';
    let regimeBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    let summaryText = '';

    const isUs100Bullish = (us100 && us100.change_24h_pct >= 0) || (us100Bias && us100Bias.overall_bias === 'BULLISH');

    if (isUs100Bullish && (gold && gold.change_24h_pct > 0.2)) {
      regimeTitle = 'Tech Bullish & Defensive Barbell';
      regimeBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      summaryText = `Kondisi pasar saat ini sangat dipengaruhi oleh kekuatan sektor teknologi: US100 (Nasdaq 100) menjadi aset paling bullish (${us100 ? us100.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '20,185'} poin) berkat belanja modal masif AI dan kinerja solid emiten semikonduktor. Pada saat yang sama, Emas (XAU/USD ${gold ? `$${gold.price.toFixed(1)}` : 'menguat'}) dan mata uang safe-haven ${strongest.currency} (${strongest.strength_score.toFixed(1)}pt) tetap kokoh, sementara mata uang pendanaan berimbal hasil rendah seperti ${weakest.currency} (${weakest.strength_score.toFixed(1)}pt) mengalami tekanan jual.`;
    } else if (strongest.currency === 'CHF' || strongest.currency === 'JPY' || (gold && gold.change_24h_pct > 0.3)) {
      regimeTitle = 'Defensive / Safe-Haven Flight';
      regimeBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      summaryText = `Sentimen pasar saat ini dipimpin oleh rotasi defensif dan komoditas lindung nilai (XAU/USD). Di sektor ekuitas, US100 (Nasdaq 100) mempertahankan kekuatan tren bullish yang sangat tangguh (${us100 ? us100.price.toLocaleString() : '20,000+'} poin). Dolar AS berkonsolidasi, sementara disparitas G8 didominasi keunggulan ${strongest.currency} atas ${weakest.currency}.`;
    } else if (strongest.currency === 'AUD' || strongest.currency === 'NZD' || (spx && spx.change_24h_pct > 0.4)) {
      regimeTitle = 'Risk-On Expansion';
      regimeBadgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
      summaryText = `Pasar berada dalam mode Risk-On dengan kepemimpinan bullish terkuat pada US100 (Nasdaq 100) serta apresiasi mata uang komoditas (${strongest.currency} memimpin di skor ${strongest.strength_score.toFixed(1)}pt). Investor aktif memburu imbal hasil dan saham pertumbuhan teknologi.`;
    } else {
      regimeTitle = 'Macro Consolidation & Tech Resilience';
      regimeBadgeColor = 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      summaryText = `Kondisi pasar makro bergerak selektif dengan divergensi yang jelas: US100 (Nasdaq 100) memimpin sentimen bullish di sektor ekuitas, sementara pasar valas terfokus pada disparitas ${strongest.currency} vs ${weakest.currency}.`;
    }

    // Top 3 Core Catalysts/Drivers today
    const topCatalysts = todayCatalysts.slice(0, 3);

    return {
      regimeTitle,
      regimeBadgeColor,
      strongest,
      weakest,
      summaryText,
      topCatalysts,
      goldPrice: gold?.price ?? 2724.5,
      goldChange: gold?.change_24h_pct ?? 0.65,
      dxyPrice: dxy?.price ?? 101.42,
      dxyChange: dxy?.change_24h_pct ?? -0.15,
      us100Price: us100?.price ?? 20185.0,
      us100Change: us100?.change_24h_pct ?? 1.22,
      us10yPrice: us10y?.price ?? 4.085,
      us10yChange: us10y?.change_24h_pct ?? -0.85,
    };
  }, [strengths, priceMap, biasMap, todayCatalysts]);

  // 2. DYNAMIC ACTIONABLE ENTRY SUGGESTIONS (SARAN ENTRY PAIR HARI INI)
  const tradeSuggestions = useMemo<TradeSuggestion[]>(() => {
    const list: TradeSuggestion[] = [];

    // Base pair templates with fundamental & technical setup context
    const CANDIDATE_PAIRS = [
      {
        symbol: 'CHFJPY',
        name: 'Swiss Franc vs Japanese Yen',
        category: 'FX_CROSS' as const,
        base: 'CHF',
        quote: 'JPY',
        catalyst: 'Safe-haven defensive premium & Swiss balance sheet strength vs BoJ negative real rate suppression.',
        entryLogic: 'Pullback ke EMA20 intraday / retest swing support sesi London',
        invalidation: 'Break di bawah swing low harian (terjadi pembalikan yield spread)',
        target: 'Kelanjutan ekspansi tren +60 hingga +120 pips',
      },
      {
        symbol: 'GBPJPY',
        name: 'British Pound vs Japanese Yen',
        category: 'FX_CROSS' as const,
        base: 'GBP',
        quote: 'JPY',
        catalyst: 'BoE persistensi suku bunga ketat vs pelemahan yield obligasi Jepang JGB.',
        entryLogic: 'Buy on dip saat harga menguji area discount 50%-61.8% Fibonacci intraday',
        invalidation: 'Penutupan H1 di bawah support struktur sebelumnya',
        target: 'Target resistensi mayor berikutnya (RR 1:2.5)',
      },
      {
        symbol: 'AUDJPY',
        name: 'Australian Dollar vs Japanese Yen',
        category: 'FX_CROSS' as const,
        base: 'AUD',
        quote: 'JPY',
        catalyst: 'RBA hawkish stance & commodity flow vs pelemahan carry currency Yen.',
        entryLogic: 'Breakout konfirmasi di atas high sesi Asia dengan retest',
        invalidation: 'Breakdown di bawah base akumulasi sesi Tokyo',
        target: 'Retest zona supply mingguan (RR 1:2)',
      },
      {
        symbol: 'EURUSD',
        name: 'Euro vs US Dollar',
        category: 'FX_MAJOR' as const,
        base: 'EUR',
        quote: 'USD',
        catalyst: 'Konsolidasi DXY di bawah resistensi 101.80 & stabilisasi data PMI manufaktur kawasan Eropa.',
        entryLogic: 'Entry limit buy pada area demand sesi London 1.0820 - 1.0840',
        invalidation: 'Penetrasi valid di bawah level support psikologis kunci',
        target: 'High sesi New York / Resistensi 1.0910',
      },
      {
        symbol: 'GBPUSD',
        name: 'British Pound vs US Dollar',
        category: 'FX_MAJOR' as const,
        base: 'GBP',
        quote: 'USD',
        catalyst: 'Surplus perdagangan jasa Inggris vs perlambatan laju penciptaan lapangan kerja AS.',
        entryLogic: 'Trend following: Buy saat terjadi breakout retest neckline intraday',
        invalidation: 'Break di bawah moving average 50 H1',
        target: 'Area target likuiditas atas 1.3050+',
      },
      {
        symbol: 'USDJPY',
        name: 'US Dollar vs Japanese Yen',
        category: 'FX_MAJOR' as const,
        base: 'USD',
        quote: 'JPY',
        catalyst: 'Divergensi suku bunga US-Japan dengan pantauan intervensi verbal Kementerian Keuangan Jepang.',
        entryLogic: 'Scalp long pada retest level support Fibonacci intraday',
        invalidation: 'Break di bawah support kunci 153.20 jika tensi intervensi menguat',
        target: 'Test resistensi atas 155.00',
      },
      {
        symbol: 'USDCAD',
        name: 'US Dollar vs Canadian Dollar',
        category: 'FX_MAJOR' as const,
        base: 'USD',
        quote: 'CAD',
        catalyst: 'Dinamika pergerakan harga minyak mentah WTI terhadap kebijakan pemangkasan bunga BoC.',
        entryLogic: 'Reversal / Range trade di batas atas Bollinger Band H1',
        invalidation: 'Penerobosan momentum di luar batas band atas',
        target: 'Median range harian (Mean Reversion)',
      },
      {
        symbol: 'EURGBP',
        name: 'Euro vs British Pound',
        category: 'FX_CROSS' as const,
        base: 'EUR',
        quote: 'GBP',
        catalyst: 'Spread yield obligasi Bund vs Gilt dengan momentum ekonomi yang relatif berimbang.',
        entryLogic: 'Sideways / Konsolidasi ketat — Tidak disarankan trend follow',
        invalidation: 'N/A',
        target: 'Rangebound scalping saja',
      },
    ];

    // Compute opportunities for FX Pairs
    for (const p of CANDIDATE_PAIRS) {
      const baseScore = curScoreMap[p.base] ?? 5.0;
      const quoteScore = curScoreMap[p.quote] ?? 5.0;
      const delta = parseFloat((baseScore - quoteScore).toFixed(1));
      const absDelta = Math.abs(delta);

      let action: TradeSuggestion['action'] = 'AVOID_CHOP';
      let actionLabel = 'HINDARI (CHOP / SIDEWAYS)';
      let tier: TradeSuggestion['tier'] = 'AVOID';
      let tradeStyle = 'Chop / No Flow';

      if (delta >= 3.0) {
        action = 'STRONG_BUY';
        actionLabel = 'STRONG BUY (LONG)';
        tier = 'PRIME_A';
        tradeStyle = 'Strong Trend Continuation';
      } else if (delta >= 1.6) {
        action = 'BUY';
        actionLabel = 'BUY ON PULLBACK';
        tier = 'HIGH';
        tradeStyle = 'Dip Buying';
      } else if (delta <= -3.0) {
        action = 'STRONG_SELL';
        actionLabel = 'STRONG SELL (SHORT)';
        tier = 'PRIME_A';
        tradeStyle = 'Strong Downtrend Flow';
      } else if (delta <= -1.6) {
        action = 'SELL';
        actionLabel = 'SELL ON RALLY';
        tier = 'HIGH';
        tradeStyle = 'Rally Shorting';
      } else {
        action = 'AVOID_CHOP';
        actionLabel = 'HINDARI (FLAT BASKET)';
        tier = 'AVOID';
        tradeStyle = 'Sideways / Low Momentum';
      }

      const confidence = Math.min(94, Math.max(50, Math.round(55 + absDelta * 11)));

      list.push({
        id: p.symbol,
        symbol: p.symbol,
        name: p.name,
        category: p.category,
        action,
        actionLabel,
        biasConfidence: confidence,
        deltaOrScore: `Divergensi: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}pt`,
        tradeStyle,
        entryZone: p.entryLogic,
        invalidationLevel: p.invalidation,
        targetProjection: p.target,
        fundamentalDriver: p.catalyst,
        riskNote: tier === 'PRIME_A' ? 'Probabilitas tertinggi dengan flow dua arah searah' : 'Waspadai rilis data berimpak tinggi hari ini',
        tier,
      });
    }

    // Add Commodity Setup: XAUUSD (Gold)
    const goldBias = biasMap.get('XAUUSD');
    const goldPrice = priceMap.get('XAUUSD');
    if (goldPrice) {
      const isBull = (goldBias?.overall_bias ?? 'BULLISH') === 'BULLISH';
      list.push({
        id: 'XAUUSD',
        symbol: 'XAUUSD',
        name: 'Gold / US Dollar',
        category: 'COMMODITY',
        action: isBull ? 'STRONG_BUY' : 'SELL',
        actionLabel: isBull ? 'STRONG BUY (BUY THE DIP)' : 'SELL ON RALLY',
        biasConfidence: goldBias?.confidence ?? 78,
        deltaOrScore: `Bias: ${goldBias?.overall_bias ?? 'BULLISH'} (${goldPrice.change_24h_pct >= 0 ? '+' : ''}${goldPrice.change_24h_pct.toFixed(2)}%)`,
        tradeStyle: 'Safe-Haven Momentum / Dip Buying',
        entryZone: `Area demand intraday $${(goldPrice.price - 8.5).toFixed(1)} - $${(goldPrice.price - 3.0).toFixed(1)}`,
        invalidationLevel: goldBias?.conditions_to_change_bias || `Break di bawah $${(goldPrice.price - 22.0).toFixed(1)}`,
        targetProjection: `$${(goldPrice.price + 25.0).toFixed(1)} / Resistensi ATH`,
        fundamentalDriver: goldBias?.top_drivers?.[0] || goldBias?.today_key_catalyst || 'Permintaan defensif geopolitik & penurunan yield obligasi riil AS.',
        riskNote: 'Volatilitas tinggi saat jam pembukaan sesi New York (19:30 WIB)',
        tier: 'PRIME_A',
      });
    }

    // Add Index Setup: US100 (Nasdaq 100) - Super Bullish Tech Leader
    const us100Bias = biasMap.get('US100');
    const us100Price = priceMap.get('US100');
    if (us100Price) {
      const isUs100Bull = (us100Bias?.overall_bias ?? 'BULLISH') === 'BULLISH' || us100Price.change_24h_pct >= 0;
      list.push({
        id: 'US100',
        symbol: 'US100',
        name: 'Nasdaq 100 Tech Index',
        category: 'INDEX',
        action: isUs100Bull ? 'STRONG_BUY' : 'BUY',
        actionLabel: isUs100Bull ? 'STRONG BUY (MOMENTUM LONG)' : 'BUY ON PULLBACK',
        biasConfidence: Math.max(86, us100Bias?.confidence ?? 88),
        deltaOrScore: `Tech Bias: ${us100Bias?.overall_bias ?? 'BULLISH'} (${us100Price.change_24h_pct >= 0 ? '+' : ''}${us100Price.change_24h_pct.toFixed(2)}%)`,
        tradeStyle: 'Tech Super-Trend & Pullback Dip',
        entryZone: `Area demand/discount H1 ${Math.round(us100Price.price - 85)} - ${Math.round(us100Price.price - 25)}`,
        invalidationLevel: us100Bias?.conditions_to_change_bias || `Breakdown valid di bawah support ${Math.round(us100Price.price - 190)}`,
        targetProjection: `Ekspansi resistensi All-Time High ${Math.round(us100Price.price + 260)}+ (RR 1:2.8)`,
        fundamentalDriver: us100Bias?.top_drivers?.[0] || us100Bias?.today_key_catalyst || 'Aset paling bullish di pasar global: Belanja modal AI hyperscalers & pendapatan emiten semikonduktor solid, imbal hasil obligasi stabil menopang valuasi ekuitas growth.',
        riskNote: 'Volatilitas tinggi saat lonjakan volume pembukaan bursa Wall Street (20:30 WIB)',
        tier: 'PRIME_A',
      });
    }

    // Add Index Setup: US500 (S&P 500)
    const us500Bias = biasMap.get('US500');
    const us500Price = priceMap.get('US500');
    if (us500Price) {
      const isUs500Bull = (us500Bias?.overall_bias ?? 'BULLISH') === 'BULLISH' || us500Price.change_24h_pct >= 0;
      list.push({
        id: 'US500',
        symbol: 'US500',
        name: 'S&P 500 Composite Index',
        category: 'INDEX',
        action: isUs500Bull ? 'BUY' : 'SELL',
        actionLabel: isUs500Bull ? 'BUY ON PULLBACK' : 'SELL ON RALLY',
        biasConfidence: Math.max(78, us500Bias?.confidence ?? 80),
        deltaOrScore: `Bias: ${us500Bias?.overall_bias ?? 'BULLISH'} (${us500Price.change_24h_pct >= 0 ? '+' : ''}${us500Price.change_24h_pct.toFixed(2)}%)`,
        tradeStyle: 'Broad Market Trend Following',
        entryZone: `Pullback ke area EMA21 H1 ${Math.round(us500Price.price - 28)} - ${Math.round(us500Price.price - 12)}`,
        invalidationLevel: `Penutupan H1 di bawah support ${Math.round(us500Price.price - 55)}`,
        targetProjection: `Target ekspansi swing high ${Math.round(us500Price.price + 65)}`,
        fundamentalDriver: 'Ketahanan makro ekonomi AS & partisipasi institusional pada broad market equities.',
        riskNote: 'Korelasi tinggi dengan data rilis inflasi dan yield Treasury AS',
        tier: 'HIGH',
      });
    }

    // Add Benchmark Engine: US10Y (US 10-Year Treasury Yield)
    const us10yBias = biasMap.get('US10Y');
    const us10yPrice = priceMap.get('US10Y');
    if (us10yPrice) {
      const isYieldEasing = us10yPrice.change_24h_pct <= 0;
      list.push({
        id: 'US10Y',
        symbol: 'US10Y',
        name: 'US 10-Year Benchmark Yield',
        category: 'BOND',
        action: isYieldEasing ? 'BUY' : 'SELL',
        actionLabel: isYieldEasing ? 'YIELD EASING (RISK-ON ANCHOR)' : 'YIELD SPIKE (RISK WATCH)',
        biasConfidence: 84,
        deltaOrScore: `Yield: ${us10yPrice.price.toFixed(3)}% (${us10yPrice.change_24h_pct >= 0 ? '+' : ''}${us10yPrice.change_24h_pct.toFixed(2)}%)`,
        tradeStyle: 'Macro Discount Curve & Valuation Engine',
        entryZone: `Pivot level 4.050% - 4.120%`,
        invalidationLevel: `Penetrasi yield > 4.220% memicu koreksi risk assets`,
        targetProjection: `Zona stabilisasi 3.980% - 4.060%`,
        fundamentalDriver: 'Ekspektasi pelonggaran Fed menjaga imbal hasil obligasi AS bertenor 10 tahun terkendali, menopang valuasi ekuitas teknologi (US100) dan akumulasi Emas (XAU/USD).',
        riskNote: 'Sensitif terhadap rilis data lelang Treasury, lelang obligasi, dan komentar pejabat The Fed',
        tier: 'HIGH',
      });
    }

    // Sort: PRIME_A first, then HIGH, then AVOID
    return list.sort((a, b) => {
      const order = { PRIME_A: 1, HIGH: 2, SPECULATIVE: 3, AVOID: 4 };
      return order[a.tier] - order[b.tier];
    });
  }, [curScoreMap, biasMap, priceMap]);

  // Filtered trade list
  const filteredSuggestions = useMemo(() => {
    if (filterCategory === 'PRIME') {
      return tradeSuggestions.filter(t => t.tier === 'PRIME_A');
    }
    if (filterCategory === 'INDICES') {
      return tradeSuggestions.filter(t => t.category === 'INDEX');
    }
    if (filterCategory === 'COMMODITIES') {
      return tradeSuggestions.filter(t => t.category === 'COMMODITY');
    }
    if (filterCategory === 'BONDS') {
      return tradeSuggestions.filter(t => t.category === 'BOND');
    }
    if (filterCategory === 'MAJORS') {
      return tradeSuggestions.filter(t => t.category === 'FX_MAJOR' && t.tier !== 'AVOID');
    }
    if (filterCategory === 'CROSSES') {
      return tradeSuggestions.filter(t => t.category === 'FX_CROSS' && t.tier !== 'AVOID');
    }
    if (filterCategory === 'AVOID') {
      return tradeSuggestions.filter(t => t.tier === 'AVOID');
    }
    // Default ALL: show tradable first
    return tradeSuggestions;
  }, [tradeSuggestions, filterCategory]);

  const topPick = tradeSuggestions.find(t => t.tier === 'PRIME_A');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4.5 space-y-4 shadow-sm font-sans" id="market-summary-and-entry-brief">
      {/* ======================================================== */}
      {/* HEADER: KESIMPULAN & SARAN ENTRY                        */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              KESIMPULAN PASAR & SARAN ENTRY HARI INI
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              LIVE SYNTHESIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ringkasan konsensus makro hari ini serta rekomendasi entry pair dengan probabilitas tertinggi berdasarkan disparitas mata uang & sentimen aset.
          </p>
        </div>

        {/* Global Regime Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 hidden md:inline">Rezim Pasar:</span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 ${marketSynthesis.regimeBadgeColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{marketSynthesis.regimeTitle}</span>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BAGIAN 1: KESIMPULAN KONDISI PASAR HARI INI (SUMMARY)    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Narasi Ringkasan Utama (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ringkasan Eksekutif Hari Ini</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              WIB / Live Feed
            </span>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans">
            {marketSynthesis.summaryText}
          </p>

          {/* Key Macro Snapshot Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Mata Uang Terkuat</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {marketSynthesis.strongest.currency} ({marketSynthesis.strongest.strength_score.toFixed(1)}/10)
              </span>
            </div>

            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Mata Uang Terlemah</span>
              <span className="font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                <ArrowDownRight className="w-3 h-3" />
                {marketSynthesis.weakest.currency} ({marketSynthesis.weakest.strength_score.toFixed(1)}/10)
              </span>
            </div>

            <div
              onClick={() => onOpenChart('US100')}
              className="bg-slate-900/90 p-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 hover:border-emerald-700 transition cursor-pointer"
              title="Klik untuk membuka Chart Interaktif TradingView US100"
            >
              <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                <span>Nasdaq (US100)</span>
                <span className="text-[9px] font-bold text-emerald-400 font-mono px-1 rounded bg-emerald-900/60">BULLISH</span>
              </span>
              <span className={`font-bold mt-0.5 flex items-center gap-1 ${marketSynthesis.us100Change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <ArrowUpRight className="w-3 h-3" />
                {marketSynthesis.us100Price.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({marketSynthesis.us100Change >= 0 ? '+' : ''}{marketSynthesis.us100Change.toFixed(2)}%)
              </span>
            </div>

            <div
              onClick={() => onOpenChart('US10Y')}
              className="bg-slate-900/90 p-2 rounded-lg border border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-700 transition cursor-pointer"
              title="Klik untuk membuka Chart Interaktif TradingView US10Y Benchmark"
            >
              <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                <span>Yield 10Y (US10Y)</span>
                <span className="text-[9px] font-bold text-cyan-400 font-mono px-1 rounded bg-cyan-900/60">MACRO</span>
              </span>
              <span className={`font-bold mt-0.5 flex items-center gap-1 ${marketSynthesis.us10yChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Activity className="w-3 h-3" />
                {marketSynthesis.us10yPrice.toFixed(3)}% ({marketSynthesis.us10yChange >= 0 ? '+' : ''}{marketSynthesis.us10yChange.toFixed(2)}%)
              </span>
            </div>

            <div
              onClick={() => onOpenChart('XAUUSD')}
              className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              title="Klik untuk membuka Chart Interaktif TradingView XAUUSD"
            >
              <span className="text-[10px] text-slate-400 block">Emas (XAU/USD)</span>
              <span className={`font-bold mt-0.5 block ${marketSynthesis.goldChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${marketSynthesis.goldPrice.toFixed(1)} ({marketSynthesis.goldChange >= 0 ? '+' : ''}{marketSynthesis.goldChange.toFixed(2)}%)
              </span>
            </div>

            <div
              onClick={() => onOpenChart('USD')}
              className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              title="Klik untuk membuka Chart Interaktif TradingView DXY"
            >
              <span className="text-[10px] text-slate-400 block">DXY (US Dollar)</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {marketSynthesis.dxyPrice.toFixed(2)} ({marketSynthesis.dxyChange >= 0 ? '+' : ''}{marketSynthesis.dxyChange.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 3 Driver / Katalis Penggerak Kunci (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>3 Katalis Penggerak Hari Ini</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Divergensi Utama</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-slate-300 leading-snug">
                <strong className="text-slate-100">US100 Bullish Tech Leadership:</strong> Nasdaq 100 menunjukkan momentum bullish terkuat di pasar global berkat ketahanan belanja modal AI & pendapatan semikonduktor solid.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-slate-300 leading-snug">
                <strong className="text-slate-100">Disparitas G8 Terbuka:</strong> {marketSynthesis.strongest.currency} mengungguli {marketSynthesis.weakest.currency} dengan selisih ${(marketSynthesis.strongest.strength_score - marketSynthesis.weakest.strength_score).toFixed(1)} poin, membuka peluang trending carry trade yang bersih.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-950 border border-amber-800 text-amber-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-slate-300 leading-snug">
                <strong className="text-slate-100">Safe-Haven & Gold Bid:</strong> Emas (XAU/USD) dan Swiss Franc mempertahankan arus akumulasi institusional sebagai lindung nilai makro.
              </p>
            </div>
          </div>

          {/* Quick takeaway footnote */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Saran Sikap:</span>
            <span className="font-mono text-cyan-300 font-semibold">Fokus Long US100 & Pair Divergensi G8</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BAGIAN 2: SARAN ENTRY DI PAIR APA DENGAN KEADAAN INI     */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              SARAN ENTRY PAIR TERBAIK (TRADE OPPORTUNITIES)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              ({filteredSuggestions.length} Setup)
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterCategory('PRIME')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                filterCategory === 'PRIME'
                  ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Prime (A+)</span>
            </button>
            <button
              onClick={() => setFilterCategory('INDICES')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'INDICES'
                  ? 'bg-slate-800 text-purple-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Indeks (US100)
            </button>
            <button
              onClick={() => setFilterCategory('COMMODITIES')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'COMMODITIES'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Emas (XAU)
            </button>
            <button
              onClick={() => setFilterCategory('BONDS')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'BONDS'
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yield 10Y (US10Y)
            </button>
            <button
              onClick={() => setFilterCategory('CROSSES')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'CROSSES'
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FX Crosses
            </button>
            <button
              onClick={() => setFilterCategory('MAJORS')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterCategory === 'MAJORS'
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FX Majors
            </button>
            <button
              onClick={() => setFilterCategory('AVOID')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                filterCategory === 'AVOID'
                  ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-800/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Hindari</span>
            </button>
          </div>
        </div>

        {/* Actionable Trade Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSuggestions.map(item => {
            const isPrime = item.tier === 'PRIME_A';
            const isBuy = item.action.includes('BUY');
            const isSell = item.action.includes('SELL');
            const isAvoid = item.action === 'AVOID_CHOP';

            return (
              <div
                key={item.id}
                className={`rounded-xl p-3.5 border transition flex flex-col justify-between space-y-3 ${
                  isPrime
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
                    : isAvoid
                    ? 'bg-slate-950/60 border-slate-800/70 opacity-80'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top: Symbol, Badge, & Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {/* Flag / Emblem visuals */}
                      {item.symbol.length === 6 && !item.symbol.startsWith('US') && !item.symbol.startsWith('XA') && !item.symbol.startsWith('BT') ? (
                        <div className="flex items-center -space-x-1 shrink-0">
                          <img
                            src={getCurrencyFlagUrl(item.symbol.slice(0, 3))}
                            alt={item.symbol.slice(0, 3)}
                            referrerPolicy="no-referrer"
                            className="w-4 h-3 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                          <img
                            src={getCurrencyFlagUrl(item.symbol.slice(3, 6))}
                            alt={item.symbol.slice(3, 6)}
                            referrerPolicy="no-referrer"
                            className="w-4 h-3 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                        </div>
                      ) : item.symbol === 'XAUUSD' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="w-5 h-4 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold flex items-center justify-center">Au</span>
                          <img
                            src={getCurrencyFlagUrl('USD')}
                            alt="USD"
                            referrerPolicy="no-referrer"
                            className="w-4 h-3 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center shrink-0">
                          <img
                            src={getCurrencyFlagUrl('USD')}
                            alt="USD"
                            referrerPolicy="no-referrer"
                            className="w-4 h-3 object-cover rounded-xs border border-slate-900 shadow-xs"
                          />
                        </div>
                      )}

                      <span className="font-mono font-bold text-base text-slate-100">
                        {item.symbol}
                      </span>
                      {isPrime && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          PRIME A+
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        item.category === 'INDEX'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                          : item.category === 'COMMODITY'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : item.category === 'FX_MAJOR'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                          : 'text-slate-400 bg-slate-900 border border-slate-800'
                      }`}>
                        {item.category === 'INDEX' ? 'INDEX' : item.category === 'COMMODITY' ? 'COMMODITY' : item.category === 'FX_MAJOR' ? 'MAJOR' : 'CROSS'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Konveksi
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {item.biasConfidence}%
                      </span>
                    </div>
                  </div>

                  {/* Full Name & Delta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans pb-2 border-b border-slate-800/70">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="font-mono text-[10px] text-slate-300 shrink-0">
                      {item.deltaOrScore}
                    </span>
                  </div>

                  {/* ACTION BADGE */}
                  <div className="mt-2.5 mb-2.5">
                    <div
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between border ${
                        isBuy
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70'
                          : isSell
                          ? 'bg-rose-950/90 text-rose-300 border-rose-600/70'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isBuy ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        ) : isSell ? (
                          <ArrowDownRight className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{item.actionLabel}</span>
                      </span>
                      <span className="text-[10px] font-normal opacity-80">
                        {item.tradeStyle}
                      </span>
                    </div>
                  </div>

                  {/* Fundamental Reason */}
                  <div className="text-xs text-slate-300 font-sans bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Alasan Setup & Flow:
                    </span>
                    <p className="leading-snug text-[11px] text-slate-200">
                      {item.fundamentalDriver}
                    </p>
                  </div>
                </div>

                {/* Plan Execution Guidance: Entry Zone, Invalidation, Target */}
                <div className="space-y-2 pt-1">
                  {!isAvoid ? (
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block">Area Entry Ideal</span>
                        <span className="text-slate-200 font-semibold block truncate" title={item.entryZone}>
                          {item.entryZone}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Batas Risiko (SL)</span>
                        <span className="text-rose-400 font-semibold block truncate" title={item.invalidationLevel}>
                          {item.invalidationLevel}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 font-sans">
                      Divergensi mendekati 0. Disarankan hindari breakout, potensi whipsaw tinggi.
                    </div>
                  )}

                  {/* Actions: Open Chart & Select */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onOpenChart(item.symbol)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-cyan-300 border border-slate-700/80 text-[11px] font-mono font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Grafik TradingView</span>
                    </button>
                    <button
                      onClick={() => onSelectSymbol(item.symbol)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-mono transition cursor-pointer"
                      title="Sorot pair ini di Surveillance"
                    >
                      Surveillance →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
