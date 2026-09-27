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
import { useLanguage } from '../lib/LanguageContext';

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
  explanationId?: string; // Concise, intuitive cause-and-effect rule
  simpleChain?: string[]; // Step-by-step causal chain
}

// Canonical Intermarket Relationships (grounded in John J. Murphy principles & macro hedge fund frameworks)
const REL_TRANSLATIONS_ID: Record<string, {
  sourceLabel?: string;
  targetLabel?: string;
  primaryDriver: string;
  transmissionMechanism: string;
  explanationId?: string;
  simpleChain?: string[];
  divergenceAlertRule?: string;
}> = {
  'US10Y-XAUUSD': {
    sourceLabel: 'Imbal Hasil US 10-Tahun (US10Y)',
    targetLabel: 'Emas Spot (XAU/USD)',
    primaryDriver: 'Biaya Peluang & Imbal Hasil Riil TIPS',
    transmissionMechanism:
      'Emas tidak menghasilkan bunga atau dividen tunai. Ketika imbal hasil acuan AS (US10Y) melandai, biaya peluang memegang emas fisik merosot tajam, memicu rotasi modal ke emas. Sebaliknya, lonjakan yield memberikan tekanan mekanis yang berat pada harga emas.',
    explanationId:
      'Yield US10Y TURUN ➔ Biaya peluang emas merosot ➔ Permintaan emas naik (BULLISH). Yield US10Y NAIK ➔ Modal berotasi ke instrumen berbunga ➔ Emas tertekan (BEARISH).',
    simpleChain: [
      'Aksi Yield Acuan US10Y',
      'Penetapan Ulang Yield Riil TIPS',
      'Biaya Peluang Emas',
      'Harga Spot Emas (XAUUSD)',
    ],
    divergenceAlertRule:
      'ANOMALI DIVERGENSI: Emas tetap tangguh saat yield US10Y melonjak (> +0.4%). Menandakan akumulasi fisik agresif bank sentral atau premi risiko geopolitik akut yang melampaui faktor fundamental suku bunga diskonto.',
  },
  'DXY-XAUUSD': {
    sourceLabel: 'Indeks Dolar AS (DXY)',
    targetLabel: 'Emas Spot (XAU/USD)',
    primaryDriver: 'Denominasi Valuta & Likuiditas Global',
    transmissionMechanism:
      'Emas dihargai secara internasional dalam Dolar AS ($/oz). Pelemahan dolar secara mekanis membuat emas lebih murah bagi pembeli non-USD di pasar global, merangsang permintaan spot fisik. Sebaliknya, dolar perkasa menekan keterjangkauan pembeli internasional.',
    explanationId:
      'Dolar Melemah ➔ Emas lebih murah secara global ➔ Permintaan emas mengembang (BULLISH). Dolar Menguat ➔ Emas terasa mahal ➔ Permintaan emas tertekan (BEARISH).',
    simpleChain: [
      'Indeks Dolar AS (DXY)',
      'Daya Beli Pembeli Non-USD',
      'Permintaan Fisik & Spot Global',
      'Harga Emas Spot (XAUUSD)',
    ],
    divergenceAlertRule:
      'ANOMALI: DXY dan Emas menguat beriringan (> +0.3%). Sinyal penimbunan likuiditas perlindungan (flight-to-safety) ekstrem atau eskalasi geopolitik akut yang melampaui mekanika valuta biasa.',
  },
  'US10Y-US100': {
    sourceLabel: 'Imbal Hasil US 10-Tahun (US10Y)',
    targetLabel: 'Nasdaq 100 (Teknologi US100)',
    primaryDriver: 'Tingkat Diskonto Arus Kas Masa Depan Saham Pertumbuhan',
    transmissionMechanism:
      'Emiten teknologi dan AI memproyeksikan arus kas substansial jauh di masa depan. Ketika yield US10Y turun, tingkat diskonto merosot sehingga valuasi forward P/E dapat berekspansi. Saat yield melonjak tajam, valuasi ber-multiple tinggi mengalami kompresi tajam.',
    explanationId:
      'Yield US10Y TURUN ➔ Tingkat diskonto jatuh ➔ Kelipatan forward P/E melebar ➔ Nasdaq menguat (BULLISH). Yield NAIK ➔ Valuasi terkompresi (BEARISH).',
    simpleChain: [
      'Yield Acuan US10Y',
      'Tingkat Diskonto Arus Kas Masa Depan',
      'Kelipatan Valuasi Saham Mega-Cap Tech',
      'Aksi Acuan Nasdaq 100 (US100)',
    ],
    divergenceAlertRule:
      'Saham teknologi reli meski yield melonjak: Menandakan revisi laba struktural (capex AI) melampaui hambatan valuasi suku bunga.',
  },
  'US10Y-DXY': {
    sourceLabel: 'Imbal Hasil US 10-Tahun (US10Y)',
    targetLabel: 'Indeks Dolar (DXY)',
    primaryDriver: 'Diferensial Suku Bunga & Arus Modal Berdaulat',
    transmissionMechanism:
      'Peningkatan yield US Treasury menawarkan imbal hasil tetap dengan penyesuaian risiko yang lebih tinggi dibandingkan Bund Jerman atau JGB Jepang. Hal ini menarik arus modal lintas negara ke aset berdenominasi Dolar dan memperkuat DXY.',
    explanationId:
      'Yield US10Y NAIK ➔ Daya tarik imbal hasil surat utang AS meningkat ➔ Modal asing masuk ke USD ➔ Dolar menguat (DXY Naik). Yield TURUN ➔ Dolar melemah.',
    simpleChain: [
      'Yield Acuan US10Y',
      'Spread Suku Bunga Berdaulat Global',
      'Arus Masuk Portofolio Lintas Negara',
      'Indeks Dolar AS (DXY)',
    ],
  },
  'US10Y-USDJPY': {
    sourceLabel: 'Imbal Hasil US 10-Tahun (US10Y)',
    targetLabel: 'USD/JPY (Mesin Carry)',
    primaryDriver: 'Spread Imbal Hasil Berdaulat US-Jepang & Arus Carry',
    transmissionMechanism:
      'Selisih imbal hasil antara US Treasuries (US10Y) dan Obligasi Pemerintah Jepang (JGB10Y) adalah pendorong dominan USD/JPY. Penurunan yield AS mempersempit spread, memicu likuidasi carry trade spekulatif dan apresiasi tajam Yen (USD/JPY merosot drastis).',
    explanationId:
      'Yield US10Y NAIK ➔ Spread US-JP melebar ➔ Trader meminjam Yen untuk beli USD ➔ USD/JPY Menguat. Yield US10Y TURUN ➔ Carry trade terurai ➔ USD/JPY anjlok (Yen Menguat).',
    simpleChain: [
      'Yield Acuan US10Y',
      'Diferensial Suku Bunga AS-Jepang',
      'Arus Carry Trade Global',
      'Nilai Tukar USD/JPY',
    ],
    divergenceAlertRule:
      'LONJAKAN YEN: Jika US10Y merosot dan USD/JPY kolaps cepat, pantau potensi limpahan volatilitas ke indeks ekuitas global (penularan pelepasan carry trade).',
  },
  'DXY-US500': {
    sourceLabel: 'Indeks Dolar (DXY)',
    targetLabel: 'S&P 500 (US500)',
    primaryDriver: 'Kondisi Finansial Global & Konversi Laba Multinasional',
    transmissionMechanism:
      'Apresiasi cepat dolar mengetatkan kondisi kredit lintas negara dan menggerus konversi pendapatan luar negeri bagi emiten multinasional S&P 500 saat dikonversi kembali ke USD.',
    explanationId:
      'Dolar Melonjak Tajam ➔ Kondisi finansial global mengetat ➔ Laba luar negeri korporasi tertekan ➔ S&P 500 menghadapi hambatan.',
    simpleChain: [
      'Indeks Dolar (DXY)',
      'Kondisi Finansial Global',
      'Konversi Laba Multinasional',
      'Indeks Ekuitas S&P 500 (US500)',
    ],
  },
  'EUR-DXY': {
    sourceLabel: 'Euro (EUR)',
    targetLabel: 'Indeks Dolar (DXY)',
    primaryDriver: 'Bobot Keranjang Valuta (EUR = 57.6% dari DXY)',
    transmissionMechanism:
      'Karena Euro mencakup 57.6% pembobotan dalam indeks DXY, pergerakan harga EUR/USD memiliki korelasi terbalik mekanis yang nyaris sempurna dengan Indeks Dolar.',
    explanationId:
      'Euro Menguat ➔ DXY terseret turun secara mekanis. Euro Melemah ➔ DXY terdorong naik secara mekanis.',
    simpleChain: [
      'Makro Zona Euro & Kebijakan ECB',
      'Nilai Tukar EUR/USD',
      'Kalkulasi Bobot 57.6% Keranjang DXY',
      'Indeks Dolar AS (DXY)',
    ],
  },
  'AUD-US500': {
    sourceLabel: 'Dolar Australia (AUD)',
    targetLabel: 'S&P 500 (Selera Risiko)',
    primaryDriver: 'Siklus Pertumbuhan Global & Proksi Risiko Pro-Siklikal',
    transmissionMechanism:
      'Dolar Australia adalah proksi valuta langsung bagi ekspansi perdagangan global dan permintaan komoditas industri. Sentimen risiko konstruktif (Risk-On) menguntungkan saham S&P 500 dan mengangkat AUD secara serentak.',
    explanationId:
      'Sikap Risk-On ➔ Optimisme pertumbuhan global ➔ Ekuitas dan valuta komoditas high-beta (AUD) melaju bersama.',
    simpleChain: [
      'Sikap Risiko Pasar',
      'Aktivitas Industri & Permintaan Komoditas',
      'Arus Modal Masuk AUD',
      'Ekuitas S&P 500 (US500)',
    ],
  },
  'JPY-US500': {
    sourceLabel: 'Yen Jepang (JPY)',
    targetLabel: 'S&P 500 (Ekuitas Global)',
    primaryDriver: 'Valuta Pendanaan & Dinamika Likuidasi Carry',
    transmissionMechanism:
      'Yen Jepang banyak dimanfaatkan sebagai mata uang pendanaan berbiaya bunga rendah untuk membeli aset berisiko high-beta. Saat terjadi kepanikan pasar atau koreksi tajam ekuitas, investor segera melunasi pinjaman ini dengan membeli kembali Yen (Yen melonjak saat saham turun).',
    explanationId:
      'Kepanikan Pasar / Risk-Off ➔ Ekuitas dilikuidasi ➔ Pinjaman carry dilunasi dengan membeli Yen ➔ JPY melonjak (USD/JPY anjlok).',
    simpleChain: [
      'Kepanikan Pasar & Lonjakan Volatilitas',
      'Likuidasi Aset Berisiko',
      'Repatriasi Modal ke JPY',
      'Korelasi Terbalik Ekuitas vs Yen',
    ],
  },
  'CAD-XAUUSD': {
    sourceLabel: 'Dolar Kanada (CAD)',
    targetLabel: 'Emas & Komoditas',
    primaryDriver: 'Terms of Trade Komoditas & Ekspor Pertambangan',
    transmissionMechanism:
      'Kanada adalah eksportir utama energi dan mineral tambang. Reli komoditas global meningkatkan terms of trade Kanada dan memberikan dorongan alami bagi Dolar Kanada.',
    explanationId:
      'Harga Komoditas & Energi Menguat ➔ Pendapatan ekspor Kanada meningkat ➔ CAD terdukung.',
    simpleChain: [
      'Siklus Komoditas Global',
      'Pendapatan Ekspor Kanada',
      'Sentimen Nilai Tukar CAD',
      'Sentimen Komoditas Luas',
    ],
  },
  'BTC-US100': {
    sourceLabel: 'Bitcoin (BTC)',
    targetLabel: 'Nasdaq 100 (Teknologi US100)',
    primaryDriver: 'Likuiditas M2 Global & Selera Risiko Saham Teknologi High-Beta',
    transmissionMechanism:
      'Bitcoin berfungsi sebagai barometer high-beta bagi likuiditas moneter spekulatif. Ekspansi neraca bank sentral dan reli saham teknologi mengalir langsung ke aliran modal aset digital.',
    explanationId:
      'Likuiditas Luas Berekspansi & Saham Tech Menguat ➔ Selera risiko spekulatif meningkat ➔ Modal mengalir ke Bitcoin (BTC).',
    simpleChain: [
      'Likuiditas M2 Global',
      'Selera Risiko Sektor Teknologi',
      'Alokasi Modal Spekulatif',
      'Harga Bitcoin (BTC)',
    ],
  },
};

const CANONICAL_RELATIONSHIPS: IntermarketRelationship[] = [
  {
    source: 'US10Y',
    target: 'XAUUSD',
    sourceLabel: 'US 10-Year Yield (US10Y)',
    targetLabel: 'Gold (XAU/USD)',
    sourceCategory: 'YIELD',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.82,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Opportunity Cost & TIPS Real Yields',
    transmissionMechanism:
      'Gold yields no coupon or cash dividend. When US benchmark yields (US10Y) ease, the opportunity cost of holding physical bullion falls dramatically, prompting capital rotation into gold. Conversely, surging yields exert heavy mechanical drag on gold.',
    explanationId:
      'US10Y Yield FALLS ➔ Gold opportunity cost declines ➔ Bullion demand rises (BULLISH). US10Y Yield RISES ➔ Capital rotates to interest-bearing paper ➔ Gold pressured (BEARISH).',
    simpleChain: [
      'US10Y Benchmark Yield Action',
      'TIPS Real Yield Repricing',
      'Gold Opportunity Cost',
      'Spot Gold Price (XAUUSD)',
    ],
    divergenceAlertRule:
      'DIVERGENCE ANOMALY: Gold remains resilient while US10Y yields jump (> +0.4%). Indicates aggressive central bank physical accumulation or acute geopolitical risk premiums overriding discount rate fundamentals.',
  },
  {
    source: 'DXY',
    target: 'XAUUSD',
    sourceLabel: 'US Dollar Index (DXY)',
    targetLabel: 'Gold (XAU/USD)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: -0.78,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Currency Denomination & Global Liquidity',
    transmissionMechanism:
      'Gold is internationally priced in US Dollars ($/oz). A weakening dollar mechanically makes gold cheaper and more accessible for non-USD global buyers, stimulating spot demand.',
    explanationId:
      'Dollar Softens ➔ Gold becomes cheaper globally ➔ Bullion demand expands (BULLISH). Dollar Firms ➔ Gold becomes expensive ➔ Bullion pressured (BEARISH).',
    simpleChain: [
      'US Dollar Index (DXY)',
      'Non-USD Purchasing Power',
      'Global Physical & Spot Demand',
      'Gold Price (XAUUSD)',
    ],
    divergenceAlertRule:
      'ANOMALY: DXY and Gold firming simultaneously (> +0.3%). Signals acute flight-to-safety liquidity hoarding or geopolitical escalation overriding currency mechanics.',
  },
  {
    source: 'US10Y',
    target: 'US100',
    sourceLabel: 'US 10-Year Yield (US10Y)',
    targetLabel: 'Nasdaq 100 (US100 Tech)',
    sourceCategory: 'YIELD',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.68,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Future Cash Flow Discount Rate on Growth Equities',
    transmissionMechanism:
      'Technology and AI growth companies project substantial cash flows far into the future. When US10Y yields decline, discount rates fall, allowing forward P/E valuation multiples to expand. When yields spike, high-multiple valuations compress.',
    explanationId:
      'US10Y Yield FALLS ➔ Discount rate drops ➔ Forward P/E multiples expand ➔ Nasdaq gains (BULLISH). Yield RISES ➔ Valuations compress (BEARISH).',
    simpleChain: [
      'US10Y Benchmark Yield',
      'Future Cash Flow Discount Rate',
      'Mega-Cap Tech Valuation Multiples',
      'Nasdaq 100 Benchmark Action (US100)',
    ],
    divergenceAlertRule:
      'Tech rallying despite surging yields: Indicates secular earnings revisions (AI capex) outpacing interest rate valuation drag.',
  },
  {
    source: 'US10Y',
    target: 'DXY',
    sourceLabel: 'US 10-Year Yield (US10Y)',
    targetLabel: 'Dollar Index (DXY)',
    sourceCategory: 'YIELD',
    targetCategory: 'CURRENCY',
    historicalCorrelation: 0.65,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Interest Rate Differentials & Sovereign Capital Flows',
    transmissionMechanism:
      'Rising US Treasury yields offer higher risk-adjusted fixed income returns relative to European Bunds or Japanese JGBs. This attracts cross-border capital inflows into Dollar-denominated paper, strengthening the DXY.',
    explanationId:
      'US10Y Yield RISES ➔ US fixed income yield appeal increases ➔ Foreign capital enters USD ➔ Dollar strengthens (DXY Gains). Yield FALLS ➔ Dollar softens.',
    simpleChain: [
      'US10Y Benchmark Yield',
      'Global Sovereign Rate Spreads',
      'Cross-Border Portfolio Inflows',
      'US Dollar Index (DXY)',
    ],
  },
  {
    source: 'US10Y',
    target: 'USDJPY',
    sourceLabel: 'US 10-Year Yield (US10Y)',
    targetLabel: 'USD/JPY (Carry Engine)',
    sourceCategory: 'YIELD',
    targetCategory: 'CURRENCY',
    historicalCorrelation: 0.78,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'US-Japan Sovereign Yield Differential & Carry Flows',
    transmissionMechanism:
      'The interest rate spread between US Treasuries (US10Y) and Japanese Government Bonds (JGB10Y) is the primary driver of USD/JPY. A contraction in US yields narrows the spread, triggering speculative carry trade liquidations and sharp Yen appreciation (USD/JPY dropping).',
    explanationId:
      'US10Y Yield RISES ➔ US-JP spread widens ➔ Traders borrow Yen to buy USD ➔ USD/JPY Gains. US10Y Yield FALLS ➔ Carry trades unwind ➔ USD/JPY drops (JPY Strengthens).',
    simpleChain: [
      'US10Y Benchmark Yield',
      'US-Japan Rate Differential',
      'Global Carry Trade Flows',
      'USD/JPY Exchange Rate',
    ],
    divergenceAlertRule:
      'YEN SURGE: If US10Y drops and USD/JPY collapses rapidly, monitor potential volatility spillover into global equity benchmarks (carry trade unwind contagion).',
  },
  {
    source: 'DXY',
    target: 'US500',
    sourceLabel: 'Dollar Index (DXY)',
    targetLabel: 'S&P 500 (US500)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.55,
    correlationNature: 'MODERATE_INVERSE',
    primaryDriver: 'Global Financial Conditions & Multinational Earnings Translation',
    transmissionMechanism:
      'Rapid dollar appreciation tightens cross-border credit conditions and erodes foreign revenue translation for multinational S&P 500 corporations when converted back to USD.',
    explanationId:
      'Dollar Spikes Sharply ➔ Global financial conditions tighten ➔ Foreign corporate earnings compressed ➔ S&P 500 faces headwinds.',
    simpleChain: [
      'Dollar Index (DXY)',
      'Global Financial Conditions',
      'Multinational Earnings Conversion',
      'S&P 500 Equity Index (US500)',
    ],
  },
  {
    source: 'EUR',
    target: 'DXY',
    sourceLabel: 'Euro (EUR)',
    targetLabel: 'Dollar Index (DXY)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'CURRENCY',
    historicalCorrelation: -0.96,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Currency Basket Weighting (EUR = 57.6% of DXY)',
    transmissionMechanism:
      'Because the Euro accounts for 57.6% of the DXY basket weighting, EUR/USD price action has a near-perfect mechanical inverse correlation with the Dollar Index.',
    explanationId:
      'Euro Strengthens ➔ DXY mechanically dragged lower. Euro Weakens ➔ DXY mechanically pushed higher.',
    simpleChain: [
      'Eurozone Macro & ECB Policy Tone',
      'EUR/USD Exchange Rate',
      'DXY 57.6% Basket Weight Calculation',
      'US Dollar Index (DXY)',
    ],
  },
  {
    source: 'AUD',
    target: 'US500',
    sourceLabel: 'Australian Dollar (AUD)',
    targetLabel: 'S&P 500 (Risk Appetite)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: 0.74,
    correlationNature: 'STRONG_POSITIVE',
    primaryDriver: 'Global Growth Cycle & Pro-Cyclical Risk Proxy',
    transmissionMechanism:
      'The Australian Dollar is a direct currency proxy for global trade expansion and industrial commodity demand. Constructive risk sentiment (Risk-On) benefits S&P 500 equities and boosts AUD simultaneously.',
    explanationId:
      'Risk-On Stance ➔ Optimism regarding global growth ➔ Equities and high-beta commodity currencies (AUD) advance together.',
    simpleChain: [
      'Market Risk Stance',
      'Industrial Activity & Commodity Demand',
      'AUD Capital Inflows',
      'S&P 500 Equities (US500)',
    ],
  },
  {
    source: 'JPY',
    target: 'US500',
    sourceLabel: 'Japanese Yen (JPY)',
    targetLabel: 'S&P 500 (Global Equities)',
    sourceCategory: 'CURRENCY',
    targetCategory: 'EQUITY',
    historicalCorrelation: -0.65,
    correlationNature: 'STRONG_INVERSE',
    primaryDriver: 'Funding Currency & Carry Liquidation Dynamics',
    transmissionMechanism:
      'The Japanese Yen is widely utilized as a low-interest funding currency to acquire high-beta risk assets. During market panic or sharp equity drawdowns, investors rapidly cover these loans by repurchasing Yen (Yen spikes as equities drop).',
    explanationId:
      'Market Panic / Risk-Off ➔ Equities liquidated ➔ Carry loans repaid by buying Yen ➔ JPY spikes (USD/JPY drops).',
    simpleChain: [
      'Market Panic & Volatility Spike',
      'Risk Asset Liquidation',
      'Capital Repatriation into JPY',
      'Inverse Equity vs Yen Correlation',
    ],
  },
  {
    source: 'CAD',
    target: 'XAUUSD',
    sourceLabel: 'Canadian Dollar (CAD)',
    targetLabel: 'Gold & Commodities',
    sourceCategory: 'CURRENCY',
    targetCategory: 'COMMODITY',
    historicalCorrelation: 0.62,
    correlationNature: 'MODERATE_POSITIVE',
    primaryDriver: 'Commodity Terms of Trade & Mining Exports',
    transmissionMechanism:
      'Canada is a major exporter of energy and mining minerals. Global commodity rallies improve Canada\'s terms of trade and provide natural support to the Canadian Dollar.',
    explanationId:
      'Commodity & Energy Prices Advance ➔ Canadian export receipts rise ➔ CAD supported.',
    simpleChain: [
      'Global Commodity Cycle',
      'Canadian Export Revenue',
      'CAD Exchange Rate Tone',
      'Broad Commodity Sentiment',
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
    primaryDriver: 'Global M2 Liquidity & High-Beta Tech Risk Appetite',
    transmissionMechanism:
      'Bitcoin serves as a high-beta barometer for speculative monetary liquidity. Expansion in central bank balance sheets and rallies in tech equities directly spill into digital asset inflows.',
    explanationId:
      'Broad Liquidity Expands & Tech Firms ➔ Speculative risk appetite increases ➔ Capital flows into Bitcoin (BTC).',
    simpleChain: [
      'Global M2 Liquidity',
      'Tech Sector Risk Appetite',
      'Speculative Capital Allocation',
      'Bitcoin Price (BTC)',
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
  const { t, isId } = useLanguage();
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

      const idTrans = isId ? REL_TRANSLATIONS_ID[`${rel.source}-${rel.target}`] : undefined;

      return {
        ...rel,
        sourceLabel: idTrans?.sourceLabel || rel.sourceLabel,
        targetLabel: idTrans?.targetLabel || rel.targetLabel,
        primaryDriver: idTrans?.primaryDriver || rel.primaryDriver,
        transmissionMechanism: idTrans?.transmissionMechanism || rel.transmissionMechanism,
        explanationId: idTrans?.explanationId || rel.explanationId,
        simpleChain: idTrans?.simpleChain || rel.simpleChain,
        divergenceAlertRule: idTrans?.divergenceAlertRule || rel.divergenceAlertRule,
        sourceChangePct,
        targetChangePct,
        alignment,
        isDivergenceRisk: alignment === 'DIVERGENT' && (Math.abs(sourceChangePct) > 0.25 || Math.abs(targetChangePct) > 0.25),
      };
    });
  }, [dxyPrice, goldPrice, sp500Price, nasdaqPrice, btcPrice, usdjpyPrice, eurusdPrice, usdStrength, jpyStrength, audStrength, cadStrength, eurStrength, actualYieldChangePct, isId]);

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
        regime: t('RISK-ON PRO-SIKLIKAL', 'PRO-CYCLICAL RISK-ON'),
        description: t(
          'Ekspansi ekuitas & permintaan carry komoditas mendominasi; aset safe-haven tertekan.',
          'Equity expansion & commodity carry demand dominating; safe-havens subdued.'
        ),
        badgeColor: 'bg-[var(--bullish-bg)] text-[var(--bullish)] border-[var(--bullish-border)]',
        sentiment: 'RISK_ON',
      };
    } else if (goldChg > 0.3 && dxyChg > 0.2) {
      return {
        regime: t('AKUMULASI SAFE-HAVEN BERDAULAT', 'SOVEREIGN SAFE-HAVEN ACCUMULATION'),
        description: t(
          'Emas & Dolar AS menguat beriringan; menandakan tensi geopolitik akut atau kehati-hatian likuiditas sistemik.',
          'Gold & US Dollar surging together; indicates acute geopolitical tension or systemic liquidity caution.'
        ),
        badgeColor: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
        sentiment: 'DEFENSIVE_FLIGHT',
      };
    } else if (riskBeta < -0.3 || (jpyScore > 65 && spxChg < -0.2)) {
      return {
        regime: t('RISK-OFF DEFENSIF & DELEVERAGING', 'DEFENSIVE RISK-OFF & DELEVERAGING'),
        description: t(
          'Modal beralih ke JPY dan obligasi berdaulat; aset berisiko dan valuta carry di bawah tekanan.',
          'Capital fleeing to JPY and treasuries; risk assets and carry currencies under pressure.'
        ),
        badgeColor: 'bg-[var(--bearish-bg)] text-[var(--bearish)] border-[var(--bearish-border)]',
        sentiment: 'RISK_OFF',
      };
    } else if (dxyChg > 0.35 && goldChg < -0.3) {
      return {
        regime: t('PENGETATAN SUPREMASI DOLAR', 'DOLLAR SUPREMACY TIGHTENING'),
        description: t(
          'Yield yang tinggi dan apresiasi dolar menekan valuasi aset global serta arus dana ke negara berkembang.',
          'Higher yield and dollar demand suppressing global asset prices and emerging flows.'
        ),
        badgeColor: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]',
        sentiment: 'USD_DOMINANCE',
      };
    } else {
      return {
        regime: t('KONSOLIDASI / ARUS SEIMBANG', 'CONSOLIDATION / BALANCED FLOWS'),
        description: t(
          'Arus silang antar-pasar netral; menanti katalis pidato bank sentral atau rilis data makro tier-1 mendatang.',
          'Intermarket cross-currents neutral; awaiting catalyst from central bank speeches or upcoming macro tier-1 data.'
        ),
        badgeColor: 'bg-[var(--bg-section-alt)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
        sentiment: 'BALANCED',
      };
    }
  }, [dxyPrice, goldPrice, sp500Price, jpyStrength, audStrength, t]);

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
        eyebrow={t('RISET · ALIRAN ANTAR-PASAR (INTERMARKET)', 'RESEARCH · INTERMARKET FLOWS')}
        accentNote={
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${macroRegime.sentiment === 'RISK_ON' ? 'bg-emerald-500' : macroRegime.sentiment === 'RISK_OFF' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            <span>{t('Rezim', 'Regime')} {macroRegime.regime}</span>
          </span>
        }
        title={t('Matriks Hubungan & Aliran Antar-Pasar', 'Intermarket Relationships & Flow Matrix')}
        titleAdornment={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
            {t('MODEL MAKRO MURPHY', 'MURPHY MACRO MODEL')}
          </span>
        }
        description={t(
          'Saluran transmisi makro lintas aset: valuta asing (DXY & G8), komoditas (emas), imbal hasil obligasi acuan (US10Y), serta ekuitas (S&P 500, Nasdaq).',
          'Cross-asset macro transmission channels: foreign exchange (DXY & G8), commodities (gold), benchmark yields (US10Y), and equities (S&P 500, Nasdaq).'
        )}
        actions={
          onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 h-8 rounded-md border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-section-alt)] hover:border-[var(--border-strong)] transition cursor-pointer flex items-center gap-1.5 font-mono"
              title={t('Sinkronisasi feed data intermarket', 'Synchronize intermarket data feed')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span>{t('Sinkronisasi', 'Sync')}</span>
            </button>
          )
        }
      />

      {/* Quick Cross-Asset Anchor Tickers */}
      <div className="terminal-panel p-4 space-y-3">
        <div className="section-head flex-wrap gap-y-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            {t('Jangkar Lintas Aset (Cross-Asset Anchors)', 'Cross-Asset Anchors')}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {t('Status:', 'Status:')} <strong className="text-[var(--text-primary)]">{macroRegime.regime}</strong>
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
              <span>{t('Unit Likuiditas', 'Liquidity Unit')}</span>
              <span className="text-[var(--text-primary)] font-semibold">DXY</span>
            </div>
          </div>

          {/* Gold (XAUUSD) */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>{t('Emas (XAU)', 'Gold (XAU)')}</span>
              <span className={`font-bold tabular-nums ${(goldPrice?.change_24h_pct ?? 0) >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                {(goldPrice?.change_24h_pct ?? 0) >= 0 ? '+' : ''}
                {(goldPrice?.change_24h_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
              ${goldPrice?.price ? goldPrice.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '2,685.4'}
            </div>
            <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 flex items-center justify-between font-mono">
              <span>{t('Safe-Haven Fisik', 'Safe-Haven Store')}</span>
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
              <span>{t('Risiko Luas', 'Broad Risk')}</span>
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
              <span>{t('Beta Durasi Tinggi', 'High Duration Beta')}</span>
              <span className="text-[var(--text-primary)] font-semibold">NDX</span>
            </div>
          </div>

          {/* 10Y Yield Benchmark Proxy */}
          <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)]">
              <span>{t('Yield US 10Y', 'US 10Y Yield')}</span>
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
                {actualYieldChangePct <= -0.05 ? t('▼ MEREDA', '▼ EASING') : actualYieldChangePct >= 0.05 ? t('▲ MENGETAT', '▲ TIGHTENING') : t('● KONSOLIDASI', '● CONSOLIDATING')}
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
              <span>{t('Likuiditas Risiko', 'Risk Liquidity')}</span>
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
                  {t('MATRIKS TRANSMISI KANONIKAL', 'CANONICAL TRANSMISSION MATRIX')}
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-0.5 p-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[10.5px] font-mono">
                {[
                  { id: 'ALL', label: t('SEMUA', 'ALL') },
                  { id: 'CURRENCIES', label: t('VALUTA', 'CURRENCIES') },
                  { id: 'COMMODITIES', label: t('KOMODITAS', 'COMMODITIES') },
                  { id: 'YIELDS', label: t('IMBAL HASIL', 'YIELDS') },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id as any)}
                    className={`px-2 py-0.5 rounded-xs transition cursor-pointer font-semibold ${
                      filterCategory === cat.id
                        ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2 mt-3">
              {filteredRelationships.map((item, idx) => {
                const isSelected = selectedRelIndex === idx;

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
                            {t('TERSELARAS', 'ALIGNED')}
                          </span>
                        ) : item.alignment === 'DIVERGENT' ? (
                          <span className="badge-bearish text-[9px] flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {t('DIVERGENSI', 'DIVERGENT')}
                          </span>
                        ) : (
                          <span className="badge-neutral text-[9px]">
                            {t('TENANG', 'QUIET')}
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
                  {t('MEKANISME TRANSMISI MAKRO', 'MACRO TRANSMISSION MECHANICS')}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">
                {t('PASANGAN:', 'PAIR:')} {activeRel.source} / {activeRel.target}
              </span>
            </div>

            {/* Selected Relationship Overview */}
            <div className="mt-3 p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="metadata-label text-[9.5px] text-[var(--text-muted)]">
                  {t('PENDORONG MAKROEKONOMI', 'MACROECONOMIC DRIVER')}
                </span>
                <span className="text-[10px] font-bold text-[var(--accent)] font-mono">
                  {activeRel.correlationNature === 'STRONG_INVERSE' ? t('KORELASI TERBALIK KUAT', 'STRONG INVERSE') :
                   activeRel.correlationNature === 'MODERATE_INVERSE' ? t('KORELASI TERBALIK MODERAT', 'MODERATE INVERSE') :
                   activeRel.correlationNature === 'STRONG_POSITIVE' ? t('KORELASI POSITIF KUAT', 'STRONG POSITIVE') :
                   activeRel.correlationNature === 'MODERATE_POSITIVE' ? t('KORELASI POSITIF MODERAT', 'MODERATE POSITIVE') :
                   t('NETRAL', 'NEUTRAL')} (r = {activeRel.historicalCorrelation > 0 ? '+' : ''}{activeRel.historicalCorrelation.toFixed(2)})
                </span>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {activeRel.primaryDriver}
              </div>
              
              {/* Intuitive Cause-and-Effect Rule Box */}
              {activeRel.explanationId && (
                <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed space-y-1 font-sans">
                  <div className="text-[10px] font-mono font-bold text-[var(--accent)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{t('CARA MENGINTERPRETASI HUBUNGAN INI:', 'HOW TO INTERPRET THIS RELATIONSHIP:')}</span>
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
                <span>{t('ALUR TRANSMISI KAUSAL', 'CAUSAL TRANSMISSION FLOW')}</span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">{t('LANGKAH-DEMI-LANGKAH', 'STEP-BY-STEP')}</span>
              </div>

              {activeRel.simpleChain && activeRel.simpleChain.length > 0 ? (
                <div className="space-y-1 text-xs font-mono">
                  {activeRel.simpleChain.map((step, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)]">{t('Langkah', 'Step')} {sIdx + 1}:</span>
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
                    <span className="text-[var(--text-muted)]">{t('1. Katalis / Pemicu:', '1. Catalyst / Trigger:')}</span>
                    <span className="font-bold text-[var(--text-primary)]">{activeRel.sourceLabel}</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">{t('2. Saluran Transmisi:', '2. Transmission Channel:')}</span>
                    <span className="font-bold text-[var(--text-primary)]">{activeRel.primaryDriver}</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">{t('3. Dampak Pasar Langsung:', '3. Direct Market Impact:')}</span>
                    <span className="font-bold text-[var(--accent)]">{activeRel.targetLabel}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trader Actionable Takeaway */}
            <div className="mt-4 p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-1.5">
              <div className="flex items-center gap-1.5 metadata-label text-[10px] text-[var(--accent)] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>{t('PANDUAN TAKTIS TRADER', 'TRADER TACTICAL PLAYBOOK')}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {activeRel.historicalCorrelation < 0
                  ? t(
                      `Korelasi terbalik kuat (r = ${activeRel.historicalCorrelation.toFixed(2)}): Ketika ${activeRel.source} mengalami akselerasi bullish, antisipasi tekanan jual atau resistensi teknikal pada ${activeRel.target}. Sebaliknya, jika ${activeRel.source} terkoreksi tajam, carilah setup ekspansi long pada ${activeRel.target}.`,
                      `Strong inverse correlation (r = ${activeRel.historicalCorrelation.toFixed(2)}): When ${activeRel.source} gains bullish acceleration, anticipate selling pressure or technical resistance at ${activeRel.target}. Conversely, if ${activeRel.source} pulls back sharply, look for long expansion setups on ${activeRel.target}.`
                    )
                  : t(
                      `Korelasi positif kuat (r = +${activeRel.historicalCorrelation.toFixed(2)}): Kelanjutan arah pada ${activeRel.source} mengonfirmasi dan memvalidasi kelanjutan tren yang sedang berlangsung pada ${activeRel.target}.`,
                      `Strong positive correlation (r = +${activeRel.historicalCorrelation.toFixed(2)}): Directional follow-through in ${activeRel.source} confirms and validates ongoing trend continuation in ${activeRel.target}.`
                    )}
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
                <span>{t(`BUKA GRAFIK UNTUK ${activeRel.target}`, `OPEN CHART FOR ${activeRel.target}`)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

IntermarketRelationshipMatrix.displayName = 'IntermarketRelationshipMatrix';
