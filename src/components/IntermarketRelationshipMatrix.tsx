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
import { PageHeader } from './shared/PageHeader';

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
  | 'BTC'
  | 'USDJPY'
  | 'EURUSD';

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
  explanationId?: string; // Penjelasan bahasa Indonesia yang mudah dipahami
  simpleChain?: string[]; // Alur sebab-akibat sederhana
}

// Canonical Intermarket Relationships (berdasarkan prinsip klasik John J. Murphy & hedge fund macro)
const CANONICAL_RELATIONSHIPS: IntermarketRelationship[] = [
  {
    source: 'US10Y',
    target: 'XAUUSD',
    sourceLabel: 'Yield US 10-Tahun (US10Y)',
    targetLabel: 'Emas (XAU/USD)',
    sourceCategory: 'YIELD',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.82,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Biaya Oportunitas & Yield Riil (TIPS)',
    transmissionMechanism:
      'Emas tidak menghasilkan dividen atau bunga tunai (zero coupon). Saat imbal hasil obligasi AS (US10Y) melemah, biaya oportunitas memegang emas berkurang drastis sehingga investor mengalihkan modal ke emas. Sebaliknya, lonjakan yield menekan emas.',
    explanationId:
      'Yield US10Y TURUN ➔ Beban oportunitas emas berkurang ➔ Permintaan emas naik (BULLISH). Yield US10Y NAIK ➔ Investor beralih ke obligasi berbunga ➔ Emas tertekan (BEARISH).',
    simpleChain: [
      'Pergerakan Yield US10Y',
      'Perubahan Real Yield TIPS',
      'Biaya Oportunitas Emas',
      'Harga Spot Gold (XAUUSD)',
    ],
    divergenceAlertRule:
      'ANOMALI DIVERGENSI: Emas tetap menguat padahal yield US10Y melonjak tajam (> +0.4%). Menandakan pembelian fisik agresif oleh Bank Sentral global atau premi risiko geopolitik ekstrim yang mengesampingkan yield.',
  },
  {
    source: 'DXY',
    target: 'XAUUSD',
    sourceLabel: 'Indeks Dolar (DXY)',
    targetLabel: 'Emas (XAU/USD)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.78,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Denominasi Valuta & Likuiditas Global',
    transmissionMechanism:
      'Emas dihargai secara internasional dalam Dollar AS ($/oz). Pelemahan Dollar AS secara mekanis membuat emas jauh lebih murah dan terjangkau bagi pembeli dengan mata uang selain USD, sehingga memicu dorongan beli spot.',
    explanationId:
      'Dolar Melemah ➔ Emas menjadi lebih murah bagi pembeli global ➔ Permintaan emas meningkat (BULLISH). Dolar Menguat ➔ Emas menjadi mahal ➔ Emas tertekan (BEARISH).',
    simpleChain: [
      'Indeks Dolar AS (DXY)',
      'Daya Beli Mata Uang Non-USD',
      'Permintaan Fisik & Spot Global',
      'Harga Emas (XAUUSD)',
    ],
    divergenceAlertRule:
      'ANOMALI: DXY dan Emas menguat bersamaan (> +0.3%). Indikasi pelarian modal darurat ke safe haven akibat krisis likuiditas atau eskalasi konflik.',
  },
  {
    source: 'US10Y',
    target: 'US100',
    sourceLabel: 'Yield US 10-Tahun (US10Y)',
    targetLabel: 'Nasdaq 100 (US100 Tech)',
    sourceCategory: 'YIELD',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.68,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Tingkat Diskonto (Discount Rate) Valuasi Saham Growth',
    transmissionMechanism:
      'Perusahaan teknologi dan AI (growth stocks) memiliki arus kas masa depan yang diproyeksikan bertahun-tahun ke depan. Saat yield US10Y turun, discount rate menurun sehingga kelipatan P/E saham teknologi mengembang. Sebaliknya jika yield naik, valuasi saham teknologi tertekan.',
    explanationId:
      'Yield US10Y TURUN ➔ Discount rate turun ➔ Kelipatan valuasi P/E saham teknologi mengembang ➔ Nasdaq menguat (BULLISH). Yield NAIK ➔ Valuasi tertekan (BEARISH).',
    simpleChain: [
      'Yield US10Y',
      'Discount Rate Arus Kas Masa Depan',
      'Kelipatan P/E Saham Mega-Cap Tech',
      'Pergerakan Indeks Nasdaq (US100)',
    ],
    divergenceAlertRule:
      'Tech menguat kuat saat yield naik: Menandakan narasi laba korporasi (AI capex) mengalahkan pengaruh kenaikan suku bunga diskonto.',
  },
  {
    source: 'US10Y',
    target: 'DXY',
    sourceLabel: 'Yield US 10-Tahun (US10Y)',
    targetLabel: 'Indeks Dolar (DXY)',
    sourceCategory: 'YIELD',
    targetCategory: 'CURRENCY',
    historicalCorrelation: 0.65,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Diferensial Suku Bunga & Aliran Modal Global',
    transmissionMechanism:
      'Kenaikan imbal hasil obligasi AS membuat aset berpenghasilan tetap di AS menawarkan return yang lebih tinggi dibanding obligasi Eropa atau Jepang. Hal ini menarik arus modal asing masuk ke aset berdenominasi Dollar, memperkuat DXY.',
    explanationId:
      'Yield US10Y NAIK ➔ Daya tarik aset bunga AS meningkat ➔ Modal asing masuk ke USD ➔ Dolar Menguat (DXY Naik). Yield TURUN ➔ Dolar melemah.',
    simpleChain: [
      'Yield US10Y',
      'Selisih Suku Bunga Global (Rate Spread)',
      'Arus Modal Portofolio ke AS',
      'Indeks Dolar AS (DXY)',
    ],
  },
  {
    source: 'US10Y',
    target: 'USDJPY',
    sourceLabel: 'Yield US 10-Tahun (US10Y)',
    targetLabel: 'USD/JPY (Carry Engine)',
    sourceCategory: 'YIELD',
    targetCategory: 'CURRENCY',
    historicalCorrelation: 0.78,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'US-Japan Bond Yield Spread & Carry Trade',
    transmissionMechanism:
      'Selisih yield antara obligasi AS (US10Y) dan obligasi Jepang (JGB10Y) adalah motor penggerak terbesar pasangan USD/JPY. Penurunan yield US10Y menyempitkan spread, memicu aksi likuidasi carry trade dan penguatan tajam mata uang Yen (USD/JPY anjlok).',
    explanationId:
      'Yield US10Y NAIK ➔ Spread bunga US-Jepang melebar ➔ Trader pinjam Yen beli Dolar ➔ USD/JPY Naik. Yield US10Y TURUN ➔ Carry trade ditutup ➔ USD/JPY Anjlok (Yen Menguat).',
    simpleChain: [
      'Yield US10Y',
      'Spread Yield US-Japan',
      'Arus Carry Trade Global',
      'Nilai Tukar USD/JPY',
    ],
    divergenceAlertRule:
      'YEN SURGE: Jika US10Y drop dan USD/JPY amblas cepat, perhatikan potensi penularan volatilitas ke pasar saham global (carry unwind).',
  },
  {
    source: 'DXY',
    target: 'US500',
    sourceLabel: 'Indeks Dolar (DXY)',
    targetLabel: 'S&P 500 (US500)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.55,
    correlationNature: 'MODERATE_INVERSE',
    primaryDriver: 'Kondisi Finansial Global & Laba Multinasional',
    transmissionMechanism:
      'Penguatan Dollar yang cepat memperketat kondisi likuiditas kredit global serta mengurangi nilai konversi laba luar negeri bagi korporasi multinasional S&P 500 saat dikonversi kembali ke USD.',
    explanationId:
      'Dolar Menguat Tajam ➔ Kondisi likuiditas kredit global mengetat ➔ Laba luar negeri emiten multinasional tergerus ➔ S&P 500 tertahan.',
    simpleChain: [
      'Indeks Dolar (DXY)',
      'Likuiditas Finansial Global',
      'Konversi Laba Asing Emiten S&P',
      'Indeks S&P 500 (US500)',
    ],
  },
  {
    source: 'EUR',
    target: 'DXY',
    sourceLabel: 'Euro (EUR)',
    targetLabel: 'Indeks Dolar (DXY)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'CURRENCY',
    historicalCorrelation: -0.96,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Bobot Keranjang Valuta (EUR = 57.6% DXY)',
    transmissionMechanism:
      'Karena mata uang Euro menyumbang 57.6% dari total bobot keranjang DXY, pergerakan Euro terhadap Dollar AS memiliki korelasi terbalik yang hampir sempurna dengan DXY.',
    explanationId:
      'Euro Menguat ➔ DXY otomatis terseret turun. Euro Melemah ➔ DXY otomatis terdorong naik.',
    simpleChain: [
      'Kondisi Makro Zona Euro / ECB',
      'Nilai Tukar EUR/USD',
      'Perhitungan Bobot Keranjang DXY (57.6%)',
      'Indeks Dolar AS (DXY)',
    ],
  },
  {
    source: 'AUD',
    target: 'US500',
    sourceLabel: 'Dollar Australia (AUD)',
    targetLabel: 'S&P 500 (Risk Appetite)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.74,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Proksi Siklus Pertumbuhan Global & Risk-On',
    transmissionMechanism:
      'AUD adalah proksi mata uang untuk ekspansi perdagangan global dan permintaan komoditas industri. Sentimen pasar yang positif (Risk-On) menguntungkan saham S&P 500 sekaligus mendongkrak AUD.',
    explanationId:
      'Sentimen Risk-On ➔ Investor optimis terhadap pertumbuhan global ➔ Saham dan mata uang komoditas (AUD) menguat bersama.',
    simpleChain: [
      'Selera Risiko Pasar (Risk Stance)',
      'Aktivitas Industri & Komoditas',
      'Permintaan AUD',
      'Ekuitas S&P 500 (US500)',
    ],
  },
  {
    source: 'JPY',
    target: 'US500',
    sourceLabel: 'Yen Jepang (JPY)',
    targetLabel: 'S&P 500 (Ekuitas Global)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.65,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Mata Uang Pendanaan (Funding) & Likuidasi Carry Trade',
    transmissionMechanism:
      'Yen Jepang sering digunakan sebagai mata uang pinjaman berbunga rendah untuk membeli aset berisiko. Ketika terjadi panik atau koreksi saham, investor menutup pinjaman tersebut dengan membeli kembali Yen (Yen menguat tajam saat saham anjlok).',
    explanationId:
      'Pasar Panik / Risk-Off ➔ Saham dijual ➔ Posisi carry ditutup dengan membeli Yen ➔ Yen melonjak tajam (USD/JPY anjlok).',
    simpleChain: [
      'Sentimen Panik / Volatilitas',
      'Likuidasi Posisi Berisiko Saham',
      'Repatriasi Modal ke Yen Jepang',
      'Korelasi Terbalik Saham vs JPY',
    ],
  },
  {
    source: 'CAD',
    target: 'XAUUSD',
    sourceLabel: 'Dollar Kanada (CAD)',
    targetLabel: 'Emas & Minyak Bumi',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: 0.62,
    correlationNature: 'MODERATE_POSITIVE',
    primaryDriver: 'Ekspor Komoditas & Terms of Trade',
    transmissionMechanism:
      'Kanada adalah eksportir energi dan mineral tambang utama. Reli harga komoditas global mendukung neraca perdagangan Kanada dan memperkuat CAD.',
    explanationId:
      'Kenaikan harga komoditas tambang & energi ➔ Pendapatan ekspor Kanada meningkat ➔ CAD terdorong menguat.',
    simpleChain: [
      'Siklus Komoditas Dunia',
      'Pendapatan Ekspor Kanada',
      'Kekuatan Nilai Tukar CAD',
      'Sentimen Komoditas & Emas',
    ],
  },
  {
    source: 'BTC',
    target: 'US100',
    sourceLabel: 'Bitcoin (BTC)',
    targetLabel: 'Nasdaq 100 (US100 Tech)',
    sourceCategory: 'CRYPTO',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.71,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Likuiditas M2 Global & Selera Risiko Teknologi Tinggi',
    transmissionMechanism:
      'Bitcoin berperan sebagai barometer likuiditas spekulatif tingkat tinggi. Peningkatan likuiditas bank sentral dan reli saham teknologi Nasdaq menular langsung ke arus dana masuk aset kripto.',
    explanationId:
      'Likuiditas melimpah & Tech menguat ➔ Selera spekulasi meningkat ➔ Arus modal masuk ke Bitcoin (BTC).',
    simpleChain: [
      'Likuiditas Global (M2)',
      'Selera Risiko Sektor Teknologi',
      'Arus Dana Spekulatif',
      'Harga Bitcoin (BTC)',
    ],
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
  const us10yPrice = getPrice('US10Y');
  const dxyPrice = getPrice('USD');
  const goldPrice = getPrice('XAUUSD');
  const sp500Price = getPrice('US500');
  const nasdaqPrice = getPrice('US100');
  const btcPrice = getPrice('BTC');
  const usdjpyPrice = getPrice('JPY') || getPrice('USDJPY');
  const eurusdPrice = getPrice('EUR') || getPrice('EURUSD');

  const usdStrength = getStrength('USD');
  const jpyStrength = getStrength('JPY');
  const audStrength = getStrength('AUD');
  const cadStrength = getStrength('CAD');
  const eurStrength = getStrength('EUR');

  // Real or Implied 10Y Yield benchmark (using actual US10Y price stream first)
  const actualYieldChangePct = useMemo(() => {
    if (us10yPrice && typeof us10yPrice.change_24h_pct === 'number' && !isNaN(us10yPrice.change_24h_pct)) {
      return us10yPrice.change_24h_pct;
    }
    // Fallback if US10Y live stream is unavailable
    const dxyChg = dxyPrice?.change_24h_pct ?? 0;
    const usdSc = (usdStrength?.strength_score ?? 50) - 50;
    return Number(((dxyChg * 0.75) + (usdSc * 0.02)).toFixed(2));
  }, [us10yPrice, dxyPrice, usdStrength]);

  // Calculate live alignment status for each canonical relationship
  const relationshipTelemetry = useMemo(() => {
    return CANONICAL_RELATIONSHIPS.map((rel) => {
      let sourceChangePct = 0;
      let targetChangePct = 0;

      // Extract source change
      if (rel.source === 'DXY') {
        sourceChangePct = dxyPrice?.change_24h_pct ?? ((usdStrength?.strength_score ?? 50) - 50) * 0.05;
      } else if (rel.source === 'US10Y') {
        sourceChangePct = actualYieldChangePct;
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
      } else if (rel.target === 'USDJPY') {
        targetChangePct = usdjpyPrice?.change_24h_pct ?? (((usdStrength?.strength_score ?? 50) - (jpyStrength?.strength_score ?? 50)) * 0.04);
      } else if (rel.target === 'EURUSD') {
        targetChangePct = eurusdPrice?.change_24h_pct ?? (-(dxyPrice?.change_24h_pct ?? 0));
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
  }, [dxyPrice, goldPrice, sp500Price, nasdaqPrice, btcPrice, usdjpyPrice, eurusdPrice, usdStrength, jpyStrength, audStrength, cadStrength, eurStrength, actualYieldChangePct]);

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
        badgeColor: 'bg-[var(--bullish-bg)] text-[var(--bullish)] border-[var(--bullish-border)]',
        sentiment: 'RISK_ON',
      };
    } else if (goldChg > 0.3 && dxyChg > 0.2) {
      return {
        regime: 'SOVEREIGN SAFE-HAVEN ACCUMULATION',
        description: 'Gold & US Dollar surging together; indicates acute geopolitical tension or systemic liquidity caution.',
        badgeColor: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
        sentiment: 'DEFENSIVE_FLIGHT',
      };
    } else if (riskBeta < -0.3 || (jpyScore > 65 && spxChg < -0.2)) {
      return {
        regime: 'DEFENSIVE RISK-OFF & DELEVERAGING',
        description: 'Capital fleeing to JPY and treasuries; risk assets and carry currencies under pressure.',
        badgeColor: 'bg-[var(--bearish-bg)] text-[var(--bearish)] border-[var(--bearish-border)]',
        sentiment: 'RISK_OFF',
      };
    } else if (dxyChg > 0.35 && goldChg < -0.3) {
      return {
        regime: 'DOLLAR SUPREMACY TIGHTENING',
        description: 'Higher yield and dollar demand suppressing global asset prices and emerging flows.',
        badgeColor: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]',
        sentiment: 'USD_DOMINANCE',
      };
    } else {
      return {
        regime: 'CONSOLIDATION / BALANCED FLOWS',
        description: 'Intermarket cross-currents neutral; awaiting catalyst from central bank speeches or upcoming macro tier-1 data.',
        badgeColor: 'bg-[var(--bg-section-alt)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
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
    <div className="space-y-4 font-sans">
      {/* 1. HEADER & INTERMARKET REGIME BANNER */}
      <PageHeader
        eyebrow="RESEARCH · INTERMARKET FLOWS"
        accentNote={
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${macroRegime.sentiment === 'RISK_ON' ? 'bg-[var(--bullish)]' : macroRegime.sentiment === 'RISK_OFF' ? 'bg-[var(--bearish)]' : 'bg-[var(--accent)]'}`} />
            {macroRegime.regime} regime
          </span>
        }
        title="Intermarket relationship matrix"
        titleAdornment={
          <span className="badge-neutral text-[9.5px]">MURPHY MACRO MODEL</span>
        }
        description="Cross-asset transmission channels: currencies (DXY, G8), commodities (gold), benchmark yields (US10Y), and equities (S&P 500, Nasdaq)."
        actions={
          onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 h-8 rounded-md border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-section-alt)] hover:border-[var(--border-strong)] transition cursor-pointer flex items-center gap-1.5"
              title="Refresh intermarket live feeds"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span>Sync cross-asset</span>
            </button>
          )
        }
      />

      {/* Quick Cross-Asset Anchor Tickers */}
      <div className="terminal-panel p-4 space-y-3">
        <div className="section-head flex-wrap gap-y-2">
          <span className="metadata-label text-[10px] text-[var(--text-muted)]">
            Cross-asset anchors
          </span>
          <span className="metadata-label text-[9.5px] text-[var(--text-muted)]">
            {macroRegime.regime}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* US Dollar (DXY) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>USD (DXY)</span>
              <span className={`font-bold tabular-nums ${(dxyPrice?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(dxyPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(dxyPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              {dxyPrice?.price ? dxyPrice.price.toFixed(2) : (usdStrength?.strength_score ? `${usdStrength.strength_score} pts` : '103.80')}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>Liquidity Unit</span>
              <span className="text-[var(--text-primary)] font-semibold">DXY</span>
            </div>
          </div>

          {/* Gold (XAUUSD) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>Gold (XAU)</span>
              <span className={`font-bold tabular-nums ${(goldPrice?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(goldPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(goldPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              ${goldPrice?.price ? goldPrice.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '2,685.4'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>Safe-Haven Store</span>
              <span className="text-[var(--text-primary)] font-semibold">XAU</span>
            </div>
          </div>

          {/* S&P 500 (US500) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>S&P 500</span>
              <span className={`font-bold tabular-nums ${(sp500Price?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(sp500Price?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(sp500Price?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              {sp500Price?.price ? sp500Price.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '5,780'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>Broad Risk</span>
              <span className="text-[var(--text-primary)] font-semibold">SPX</span>
            </div>
          </div>

          {/* Nasdaq 100 (US100) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>Nasdaq 100</span>
              <span className={`font-bold tabular-nums ${(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(nasdaqPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(nasdaqPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              {nasdaqPrice?.price ? nasdaqPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '20,410'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>High Duration Beta</span>
              <span className="text-[var(--text-primary)] font-semibold">NDX</span>
            </div>
          </div>

          {/* 10Y Yield Benchmark Proxy */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>US 10Y Yield</span>
              <span className={`font-bold tabular-nums ${actualYieldChangePct >= 0 ? 'text-[var(--bearish)]' : 'text-[var(--bullish)]'}`}>
                {actualYieldChangePct >= 0 ? '+' : ''}
                {actualYieldChangePct.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              {us10yPrice?.price ? `${us10yPrice.price.toFixed(3)}%` : '4.085%'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span className={actualYieldChangePct <= -0.05 ? 'text-[var(--bullish)] font-semibold' : actualYieldChangePct >= 0.05 ? 'text-[var(--bearish)] font-semibold' : 'text-[var(--text-muted)]'}>
                {actualYieldChangePct <= -0.05 ? '▼ EASING (MELEMAH)' : actualYieldChangePct >= 0.05 ? '▲ TIGHTENING (MENGUAT)' : '● KONSOLIDASI'}
              </span>
              <span className="text-[var(--text-primary)] font-semibold">US10Y</span>
            </div>
          </div>

          {/* Bitcoin (BTC) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>Bitcoin (BTC)</span>
              <span className={`font-bold tabular-nums ${(btcPrice?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(btcPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(btcPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              ${btcPrice?.price ? btcPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '68,400'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>Risk Liquidity</span>
              <span className="text-[var(--text-primary)] font-semibold">BTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: MATRIX GRID & DETAILED TRANSMISSION INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: INTERDEPENDENCY MATRIX (7 COLS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="terminal-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-y-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <h2 className="section-title text-xs text-[var(--text-primary)]">
                  CANONICAL TRANSMISSION MATRIX
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-0.5 p-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[10.5px] font-mono">
                {(['ALL', 'CURRENCIES', 'COMMODITIES', 'YIELDS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-xs transition cursor-pointer font-semibold ${
                      filterCategory === cat
                        ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                    className={`p-3 rounded border cursor-pointer transition ${
                      isSelected
                        ? 'bg-[var(--active-bg)] border-[var(--active-border)] font-medium text-[var(--active-text)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                            {item.source}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                            {item.target}
                          </span>
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline font-mono">
                          ({item.sourceLabel} vs {item.targetLabel})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Alignment Badge */}
                        {item.alignment === 'ALIGNED' ? (
                          <span className="badge-bullish text-[9px] flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            ALIGNED
                          </span>
                        ) : item.alignment === 'DIVERGENT' ? (
                          <span className="badge-bearish text-[9px] flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            DIVERGENT
                          </span>
                        ) : (
                          <span className="badge-neutral text-[9px]">
                            QUIET
                          </span>
                        )}

                        {/* Benchmark Correlation Tag */}
                        <span className="badge-neutral text-[10px] font-mono tabular-nums">
                          r = {item.historicalCorrelation.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Intraday Realized Flow Comparison */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
                      <div className="flex items-center justify-between bg-[var(--bg-section-alt)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)]">{item.source}:</span>
                        <span className={`font-bold tabular-nums ${item.sourceChangePct >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                          {item.sourceChangePct >= 0 ? '+' : ''}
                          {item.sourceChangePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[var(--bg-section-alt)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)]">{item.target}:</span>
                        <span className={`font-bold tabular-nums ${item.targetChangePct >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                          {item.targetChangePct >= 0 ? '+' : ''}
                          {item.targetChangePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Divergence warning banner if triggered */}
                    {item.isDivergenceRisk && item.divergenceAlertRule && (
                      <div className="mt-2 p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--warning)] text-[10px] text-[var(--warning)] flex items-start gap-1.5 font-mono">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
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
          <div className="terminal-panel p-4 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                <h3 className="section-title text-xs text-[var(--text-primary)]">
                  MACRO TRANSMISSION MECHANICS
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">
                PAIR: {activeRel.source} / {activeRel.target}
              </span>
            </div>

            {/* Selected Relationship Overview */}
            <div className="mt-3 p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="metadata-label text-[9.5px] text-[var(--text-muted)]">
                  PENGGERAK EKONOMI MAKRO
                </span>
                <span className="text-[10px] font-bold text-[var(--accent)] font-mono">
                  {activeRel.correlationNature.replace('_', ' ')} (r = {activeRel.historicalCorrelation > 0 ? '+' : ''}{activeRel.historicalCorrelation.toFixed(2)})
                </span>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {activeRel.primaryDriver}
              </div>
              
              {/* Easy-to-read Indonesian Translation Box */}
              {activeRel.explanationId && (
                <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed space-y-1 font-sans">
                  <div className="text-[10px] font-mono font-bold text-[var(--accent)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>CARA MEMBACA HUBUNGAN INI:</span>
                  </div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {activeRel.explanationId}
                  </p>
                </div>
              )}

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                {activeRel.transmissionMechanism}
              </p>
            </div>

            {/* Causal Step-by-Step Flow */}
            <div className="mt-3 space-y-2">
              <div className="metadata-label text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>ALUR TRANSMISI SEBAB-AKIBAT</span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">STEP-BY-STEP</span>
              </div>

              {activeRel.simpleChain && activeRel.simpleChain.length > 0 ? (
                <div className="space-y-1 text-xs font-mono">
                  {activeRel.simpleChain.map((step, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)]">Langkah {sIdx + 1}:</span>
                        <span className={`font-semibold ${sIdx === activeRel.simpleChain!.length - 1 ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-primary)]'}`}>
                          {step}
                        </span>
                      </div>
                      {sIdx < activeRel.simpleChain!.length - 1 && (
                        <div className="flex justify-center -my-0.5">
                          <ArrowDownRight className="w-3 h-3 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">1. Pemicu:</span>
                    <span className="font-bold text-[var(--text-primary)]">{activeRel.sourceLabel}</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">2. Saluran:</span>
                    <span className="font-bold text-[var(--text-primary)]">{activeRel.primaryDriver}</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">3. Dampak:</span>
                    <span className="font-bold text-[var(--accent)]">{activeRel.targetLabel}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trader Actionable Takeaway */}
            <div className="mt-4 p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-1.5">
              <div className="flex items-center gap-1.5 metadata-label text-[10px] text-[var(--accent)] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>PANDUAN TAKTIS TRADER</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {activeRel.historicalCorrelation < 0
                  ? `Korelasi terbalik kuat (r = ${activeRel.historicalCorrelation.toFixed(2)}): Jika ${activeRel.source} mengalami momentum penguatan, antisipasi tekanan jual atau area resisten pada ${activeRel.target}. Sebaliknya jika ${activeRel.source} melemah tajam, buka peluang buy pada ${activeRel.target}.`
                  : `Korelasi positif searah (r = +${activeRel.historicalCorrelation.toFixed(2)}): Konfirmasi pergerakan pada ${activeRel.source} memvalidasi kelanjutan tren pada ${activeRel.target}.`}
              </p>
            </div>

            {/* TradingView Chart Button */}
            {onOpenChart && (
              <button
                onClick={() => {
                  const sym = activeRel.target === 'XAUUSD' ? 'XAUUSD' : activeRel.source === 'DXY' ? 'USD' : activeRel.target;
                  onOpenChart(sym);
                }}
                className="w-full mt-3 py-2 px-3 rounded bg-[var(--accent)] text-white hover:opacity-90 text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>OPEN CHART FOR {activeRel.target}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

IntermarketRelationshipMatrix.displayName = 'IntermarketRelationshipMatrix';
