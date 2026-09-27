import React, { useState, useMemo } from 'react';
import {
  ArahMarketTodayData,
  IntradayPairConfluence,
  TripleConfluenceStatus,
} from '../types';
import {
  Target,
  RefreshCw,
  Clock,
  Zap,
  AlertTriangle,
  ExternalLink,
  Flame,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { NavTabId } from './Sidebar';
import { getCurrencyFlagUrl } from '../lib/assets';
import { EmptyState } from './shared/EmptyState';
import { LoadingState } from './shared/LoadingState';
import { PageHeader } from './shared/PageHeader';
import { useLanguage } from '../lib/LanguageContext';

interface ArahMarketViewProps {
  data: ArahMarketTodayData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onOpenChart: (symbol: string) => void;
  onNavigateTab?: (tab: NavTabId) => void;
}

export const ArahMarketView: React.FC<ArahMarketViewProps> = React.memo(({
  data,
  isLoading,
  onRefresh,
  isRefreshing,
  onOpenChart,
  onNavigateTab,
}) => {
  const { t, isId } = useLanguage();
  const [selectedPairFilter, setSelectedPairFilter] = useState<'ALL' | 'HIGH_CONVICTION' | 'MODERATE' | 'CAUTION'>('ALL');

  const filteredPairs = useMemo(() => {
    if (!data?.pairs) return [];
    if (selectedPairFilter === 'HIGH_CONVICTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'HIGH_CONVICTION');
    }
    if (selectedPairFilter === 'MODERATE') {
      return data.pairs.filter(p => p.confluenceStatus === 'MODERATE');
    }
    if (selectedPairFilter === 'CAUTION') {
      return data.pairs.filter(p => p.confluenceStatus === 'CAUTION_TRAP' || p.confluenceStatus === 'NEUTRAL_CHOP');
    }
    return data.pairs;
  }, [data, selectedPairFilter]);

  if (isLoading && !data) {
    return (
      <div className="py-12">
        <LoadingState
          variant="cards"
          count={3}
          message={t('Menyusun Dossier Triple-Confluence Intraday...', 'Compiling Intraday Triple-Confluence Dossier...')}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-[var(--warning)]" />}
          title={t('Dossier Bias Pasar Tidak Tersedia', 'Market Bias Dossier Unavailable')}
          description={t('Menyinkronkan pilar fundamental, spread antar-pasar, dan profil volume sesi.', 'Synchronizing fundamental pillars, intermarket spreads, and session volume profile.')}
          action={{
            label: t('Refresh Dossier', 'Refresh Dossier'),
            onClick: onRefresh,
          }}
        />
      </div>
    );
  }

  const { activeSession, sessionStatusText, globalRegime, intermarketSpreads, anomalyAlerts, pairs } = data;

  // Deduplicate anomaly alerts by primary affected pair or key condition
  const dedupedAnomalies = useMemo(() => {
    if (!anomalyAlerts || anomalyAlerts.length === 0) return [];
    const seen = new Set<string>();
    const result = [];
    for (const a of anomalyAlerts) {
      const primaryKey = a.affectedPairs?.[0] || a.id;
      if (!seen.has(primaryKey)) {
        seen.add(primaryKey);
        result.push(a);
      }
    }
    return result;
  }, [anomalyAlerts]);

  const getConfluenceBadge = (status: TripleConfluenceStatus, bias?: string) => {
    const isBearish = bias?.includes('BEARISH');
    const isBullish = bias?.includes('BULLISH');

    switch (status) {
      case 'HIGH_CONVICTION':
        return {
          label: isBearish
            ? t('3/3 SELARAS · BEARISH ▼', '3/3 ALIGNED · BEARISH ▼')
            : t('3/3 SELARAS · BULLISH ▲', '3/3 ALIGNED · BULLISH ▲'),
          badgeClass: isBearish ? 'badge-bearish' : 'badge-bullish',
        };
      case 'MODERATE':
        return {
          label: isBearish
            ? t('2/3 PARSIAL · BEARISH ▼', '2/3 PARTIAL · BEARISH ▼')
            : isBullish
            ? t('2/3 PARSIAL · BULLISH ▲', '2/3 PARTIAL · BULLISH ▲')
            : t('2/3 PARSIAL', '2/3 PARTIAL'),
          badgeClass: isBearish ? 'badge-bearish' : isBullish ? 'badge-bullish' : 'badge-neutral',
        };
      case 'CAUTION_TRAP':
        return {
          label: t('1/3 DIVERGEN · WASPADA TRAP ⚠', '1/3 DIVERGENT · TRAP CAUTION ⚠'),
          badgeClass: 'badge-bearish bg-amber-500/10 text-amber-500 border border-amber-500/30',
        };
      case 'NEUTRAL_CHOP':
      default:
        return {
          label: t('CAMPURAN / TANPA EDGE', 'MIXED / NO EDGE'),
          badgeClass: 'badge-neutral',
        };
    }
  };

  const formatRecommendedAction = (action: string) => {
    switch (action) {
      case 'BUY_ON_PULLBACK':
      case 'LOOK_FOR_BUY':
        return t('Beli Saat Pullback (Look for Buy)', 'Buy on Pullback (Look for Buy)');
      case 'FADE_RESISTANCE':
      case 'LOOK_FOR_SELL':
        return t('Jual di Resisten (Look for Sell)', 'Fade Resistance (Look for Sell)');
      case 'WAIT_FOR_BREAKOUT':
        return t('Tunggu Breakout Terkonfirmasi', 'Wait for Breakout');
      case 'SELL_RALLIES':
        return t('Jual Saat Reli (Sell Rallies)', 'Sell Rallies');
      case 'RANGE_BOUND_TRADE':
        return t('Trading Rentang (Range-Bound)', 'Range-Bound Trade');
      case 'DEFENSIVE_STANDBY':
        return t('Standby Defensif', 'Defensive Standby');
      case 'WAIT_ON_SUPPORT':
        return t('Tunggu di Support (Wait on Support)', 'Wait on Support');
      case 'CAUTION_NO_TRADE':
        return t('Waspada Fakeout (No Trade)', 'Caution / No Trade');
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const formatInvalidation = (text: string) => {
    if (!isId || !text) return text;
    return text
      .replace(/If DXY breaks strongly above the session high/g, 'Jika DXY menembus kuat di atas level tertinggi sesi')
      .replace(/If US10Y yields drop below intraday support/g, 'Jika yield US10Y jatuh di bawah support intraday')
      .replace(/If US10Y yields spike above session resistance/g, 'Jika yield US10Y melonjak di atas resistensi sesi')
      .replace(/If DXY drops below the session open/g, 'Jika DXY jatuh di bawah open sesi')
      .replace(/Awaiting session breakout confirmation/g, 'Menunggu konfirmasi breakout sesi')
      .replace(/Opposing DXY breakout through the session open/g, 'Breakout DXY berlawanan menembus level buka sesi')
      .replace(/Rejection at the GBPUSD daily pivot/g, 'Penolakan kuat pada pivot harian GBP/USD')
      .replace(/Signals of verbal intervention by MoF\/BoJ officials or a sharp DXY reversal/g, 'Sinyal intervensi verbal pejabat MoF/BoJ atau pembalikan tajam DXY')
      .replace(/Wait for the macro data release or the Wall Street session open/g, 'Tunggu rilis data makro atau pembukaan sesi Wall Street')
      .replace(/Firm rejection at the daily support\/resistance level/g, 'Penolakan tegas pada level support/resisten harian')
      .replace(/Sharp reversal breaking through daily session support/g, 'Pembalikan tajam menembus support sesi harian')
      .replace(/False breakout at the London session open level/g, 'Breakout palsu pada level buka sesi London')
      .replace(/A sharp crude oil spike that suddenly strengthens the Canadian dollar/g, 'Lonjakan tajam minyak mentah yang menguatkan Dolar Kanada')
      .replace(/Break of Bitcoin's daily liquidity support level/g, 'Penembusan level support likuiditas harian Bitcoin')
      .replace(/Price reversal through the session open level/g, 'Pembalikan harga menembus level buka sesi')
      .replace(/An H1 close outside the reference level/g, 'Penutupan candle H1 di luar level referensi');
  };

  const formatWarningNote = (text?: string) => {
    if (!text) return null;
    if (!isId) return text;
    if (text.includes('CS divergence alert')) {
      return text.replace('CS divergence alert: price action is not backed by the currency strength spread', 'Peringatan divergensi CS: pergerakan harga tidak didukung oleh spread kekuatan mata uang')
                 .replace('Possible fakeout.', 'Waspada potensi fakeout.');
    }
    if (text.includes('Watch for a liquidity trap')) {
      return 'Waspada jebakan likuiditas; pergerakan harga tidak didukung oleh pilar makro atau intermarket.';
    }
    if (text.includes('3/3 alignment')) {
      return 'Konfluensi 3/3 selaras. Seluruh pilar fundamental, antar-pasar, dan price action bergerak searah sesi ini.';
    }
    return text;
  };

  const formatIntermarketSymptom = (text: string) => {
    if (!isId || !text) return text;
    return text
      .replace(/High 10Y real yield \((.*?)\) adds weight on gold/g, 'Yield riil 10Y tinggi ($1) memberi beban mekanis bagi emas')
      .replace(/Real yield at (.*?) provides safe-haven cushion/g, 'Yield riil di $1 memberi bantalan bagi safe-haven emas')
      .replace(/Easing real yield \((.*?)\) opens a safe-haven bid/g, 'Pelemahan yield riil ($1) membuka dorongan beli safe-haven')
      .replace(/US-DE spread at (.*?) supports dollar dominance/g, 'Spread US-DE sebesar $1 mendukung dominasi dolar')
      .replace(/US-DE spread at (.*?) is supportive for the euro/g, 'Spread US-DE sebesar $1 membuka ruang penguatan Euro')
      .replace(/Inverse correlation with DXY \(a softer DXY supports Cable\)/g, 'Korelasi terbalik dengan DXY (DXY melunak menopang Poundsterling)')
      .replace(/Inverse correlation with DXY \(a firmer DXY weighs on Cable\)/g, 'Korelasi terbalik dengan DXY (DXY menguat menekan Poundsterling)')
      .replace(/US-Japan yield spread \((.*?)\) and a firmer DXY drive the carry incentive/g, 'Spread US-Jepang ($1) & DXY kokoh memicu insentif carry trade')
      .replace(/US-Japan yield spread \((.*?)\) and a softer DXY drive the carry incentive/g, 'Spread US-Jepang ($1) & DXY melunak melonggarkan carry trade')
      .replace(/10Y real yield at (.*?) compresses technology P\/E multiples/g, 'Yield riil 10Y di $1 menekan valuasi P/E saham teknologi')
      .replace(/10Y real yield at (.*?) is supportive for growth-stock valuations/g, 'Yield riil 10Y di $1 mendukung valuasi saham pertumbuhan')
      .replace(/US-DE spread at (.*?) guides rate expectations for the Dow financial sector/g, 'Spread US-DE di $1 memandu ekspektasi suku bunga sektor finansial Dow')
      .replace(/Inverse correlation with DXY and transmission of commodity risk-on\/risk-off sentiment/g, 'Korelasi terbalik dengan DXY & transmisi sentimen risk-on komoditas')
      .replace(/Direct correlation with DXY \(USD base\) and petro-currency CAD transmission/g, 'Korelasi searah dengan DXY (USD base) & transmisi CAD petro-currency')
      .replace(/High-beta liquidity asset \(inverse to DXY, aligned with US100 sentiment\)/g, 'Aset likuiditas beta tinggi (terbalik terhadap DXY, searah US100)')
      .replace(/DXY softer, supporting equities and 10Y yield at (.*?)%/g, 'DXY melunak (menopang ekuitas) & yield 10Y di $1%')
      .replace(/DXY firmer, weighing on multinational earnings and 10Y yield at (.*?)%/g, 'DXY menguat (menekan laba korporasi) & yield 10Y di $1%')
      .replace(/DXY trades moderately around the session open/g, 'DXY bergerak moderat di sekitar open sesi')
      .replace(/DXY is above the session open/g, 'DXY berada di atas level open sesi')
      .replace(/DXY is below the session open/g, 'DXY berada di bawah level open sesi');
  };

  const formatRegimeTitle = (title: string) => {
    if (!isId) return title;
    switch (title) {
      case 'RISK-ON EXPANSION':
        return 'EKSPANSI RISK-ON';
      case 'HAWKISH YIELD PRESSURE':
        return 'TEKANAN YIELD HAWKISH';
      case 'GLOBAL FLIGHT TO SAFETY':
        return 'FLIGHT TO SAFETY GLOBAL';
      case 'DOVISH LIQUIDITY EASING':
        return 'PELONGGARAN LIKUIDITAS DOVISH';
      case 'BALANCED ROTATIONAL REGIME':
        return 'REZIM ROTASI SEIMBANG';
      default:
        return title;
    }
  };

  const formatRegimeNarrative = (text: string) => {
    if (!isId || !text) return text;
    if (text.includes('Global risk appetite is expanding')) {
      return 'Selera risiko global sedang berekspansi. Dolar melunak seiring likuiditas institusional beralih ke indeks saham Wall Street dan mata uang komoditas beta tinggi (AUD, CAD, NZD).';
    }
    if (text.includes('Rising US10Y yields and a firmer US Dollar Index')) {
      return 'Kenaikan imbal hasil US10Y dan indeks DXY yang kokoh di atas open sesi mendominasi arah pasar. Aset non-USD dan aset tanpa imbal hasil menghadapi tekanan biaya peluang.';
    }
    if (text.includes('Geopolitical anxieties or global growth concerns')) {
      return 'Kekhawatiran geopolitik atau pertumbuhan memicu likuidasi ekuitas dan arus beli agresif ke aset safe-haven berdaulat (Emas Fisik dan Obligasi Pemerintah AS).';
    }
    if (text.includes('Easing US Treasury yields relieve the global discount rate')) {
      return 'Pelemahan yield obligasi AS meringankan suku bunga diskonto global, memberikan katalis positif bagi Emas (XAU/USD) dan saham teknologi pertumbuhan (US100).';
    }
    if (text.includes('Capital flows are rotating orderly across asset classes')) {
      return 'Aliran modal berotasi tertib lintas kelas aset. Baik kepanikan akut maupun euforia spekulatif tidak mendominasi jelang rilis data sesi utama.';
    }
    return text;
  };

  const formatAnomalyAction = (text: string) => {
    if (!isId || !text) return text;
    return text
      .replace(/Focus on buying dips upon retests of intraday structural support; do not short blindly solely based on rising yields\./g, 'Fokus beli saat pullback di support struktural intraday; jangan short membabi-buta hanya karena yield naik.')
      .replace(/Batasi eksposur long; pertahankan stop loss ketat mengingat risiko ayunan intervensi tiba-tiba\./g, 'Batasi eksposur long; pertahankan stop loss ketat mengingat risiko ayunan intervensi tiba-tiba.')
      .replace(/Watch for a sudden reversal when the Wall Street cash session opens fully\./g, 'Waspadai pembalikan mendadak saat sesi reguler Wall Street dibuka penuh.')
      .replace(/Focus on trend-following in the direction of the current session open\./g, 'Fokus mengikuti tren sesuai arah pembukaan sesi saat ini.')
      .replace(/Non-USD majors \(e\.g\., EUR\/USD or GBP\/USD\) offer cleaner short opportunities than fading XAU\/USD\./g, 'Pasangan non-USD mayor (EUR/USD, GBP/USD) menawarkan peluang short lebih bersih dibanding melawan XAU/USD.')
      .replace(/Favor market leaders \(AI hyperscalers\/semiconductors\) over debt-heavy, rate-sensitive small\/mid-caps\./g, 'Prioritaskan saham pemimpin (semikonduktor/AI) dibanding saham berutang tinggi yang sensitif suku bunga.')
      .replace(/Enforce tight trailing stops on long USD\/JPY; respect session support thresholds\./g, 'Terapkan trailing stop ketat pada posisi long USD/JPY; hormati ambang batas support sesi.')
      .replace(/Waspadai bull trap pada emas\. Jangan terburu-buru beli sebelum menembus resistensi utama sesi\./g, 'Waspadai bull trap pada emas. Jangan terburu-buru beli sebelum menembus resistensi utama sesi.')
      .replace(/Implikasi: Gold demonstrates deep institutional bid absorption \(decoupling from real yields\)\. Selling into resistance carries heightened short-squeeze risk\./g, 'Implikasi: Emas menunjukkan serapan beli institusional yang tangguh (decoupling dari yield riil). Short di resisten membawa risiko squeeze tinggi.')
      .replace(/Implikasi: Selling pressure concentrates on secondary currencies \(EUR, GBP, JPY\) which weaken against USD and XAU simultaneously\./g, 'Implikasi: Tekanan jual terkonsentrasi pada valuta sekunder (EUR, GBP, JPY) yang melemah terhadap USD dan Emas secara simultan.')
      .replace(/Implikasi: Equity markets treat mega-cap hyperscalers as quality secular compounders insulated from moderate rate fluctuations\./g, 'Implikasi: Pasar ekuitas memperlakukan hyperscaler mega-cap sebagai aset berkualitas yang terlindung dari fluktuasi suku bunga moderat.')
      .replace(/Implikasi: Long USD\/JPY exposures are vulnerable to cascade liquidations if volatility spikes\./g, 'Implikasi: Posisi long USD/JPY rentan likuidasi berantai jika volatilitas melonjak.');
  };

  const formatHeadline = (headline?: string) => {
    if (!headline || !isId) return headline || '';
    return headline
      .replace(/Federal Reserve/g, 'Bank Sentral AS (The Fed)')
      .replace(/Interest Rate Decision/g, 'Keputusan Suku Bunga')
      .replace(/Consumer Price Index/g, 'Indeks Harga Konsumen (CPI)')
      .replace(/Non-Farm Payrolls/g, 'Non-Farm Payrolls (NFP)')
      .replace(/Gross Domestic Product/g, 'Produk Domestik Bruto (PDB)')
      .replace(/Retail Sales/g, 'Penjualan Ritel')
      .replace(/Unemployment Rate/g, 'Tingkat Pengangguran')
      .replace(/Core PCE Price Index/g, 'Indeks Harga PCE Inti')
      .replace(/FOMC Minutes/g, 'Risalah Pertemuan FOMC');
  };

  const formatBias = (bias?: string) => {
    if (!bias) return '';
    if (bias === 'BULLISH' || bias === 'STRONG_BULLISH') return t('BULLISH ▲', 'BULLISH ▲');
    if (bias === 'BEARISH' || bias === 'STRONG_BEARISH') return t('BEARISH ▼', 'BEARISH ▼');
    if (bias === 'NEUTRAL') return t('NETRAL', 'NEUTRAL');
    return bias;
  };

  const formatAlignment = (align?: string) => {
    if (!align) return '';
    if (align === 'CONFIRMED') return t('TERKONFIRMASI', 'CONFIRMED');
    if (align === 'DIVERGENCE') return t('DIVERGENSI', 'DIVERGENT');
    if (align === 'NEUTRAL') return t('NETRAL', 'NEUTRAL');
    return align;
  };

  const formatSessionName = (session: string) => {
    switch (session?.toLowerCase()) {
      case 'london': return t('Sesi London', 'London Session');
      case 'new_york': return t('Sesi New York', 'New York Session');
      case 'asia': case 'tokyo': return t('Sesi Asia/Tokyo', 'Asia/Tokyo Session');
      case 'pacific': case 'sydney': return t('Sesi Pasifik/Sydney', 'Pacific/Sydney Session');
      case 'overlap': return t('Sesi Overlap London-NY', 'London-NY Overlap Session');
      default: return t(`Sesi ${session}`, `${session} Session`);
    }
  };

  const formatSpreadName = (name: string) => {
    if (!isId) return name;
    switch (name) {
      case 'Transatlantic Rate Differential':
        return 'Diferensial Imbal Hasil Transatlantik';
      case 'Carry Trade Yield Engine':
        return 'Mesin Imbal Hasil Carry Trade';
      case 'US 10Y Real Yield Benchmark':
        return 'Benchmark Imbal Hasil Riil AS 10Y';
      case 'Wall Street Growth vs Value Ratio':
        return 'Rasio Pertumbuhan vs Nilai Wall Street';
      default:
        return name;
    }
  };

  const formatSpreadInterpretation = (text?: string) => {
    if (!text) return '';
    if (!isId) {
      return text
        .replace(/Spread melebar mendukung penguatan USD \(EUR\/USD cenderung tertahan\)\./g, 'Widening spread supports USD strength (EUR/USD upside capped).')
        .replace(/Spread menyempit membuka peluang pemulihan Euro\./g, 'Narrowing spread opens room for Euro recovery.')
        .replace(/Diferensial suku bunga lebar menjadi bahan bakar utama carry trade USD\/JPY\./g, 'Wide rate differential serves as primary fuel for USD/JPY carry trades.')
        .replace(/Diferensial menyempit memicu unwinding posisi carry Yen\./g, 'Narrowing differential triggers Yen carry unwinding.')
        .replace(/Yield riil tinggi menaikkan opportunity cost emas \(rentan tertahan\)\./g, 'High real yields elevate gold opportunity cost (upside capped).')
        .replace(/Yield riil melunak mendukung reli aset safe-haven emas\./g, 'Easing real yields support physical gold safe-haven bid.')
        .replace(/Sektor teknologi & AI memimpin reli penguatan indeks saham Wall Street\./g, 'Tech & AI sector leads Wall Street benchmark equity advance.')
        .replace(/Rotasi defensif mengalir ke saham industri dan perbankan Dow Jones\./g, 'Defensive rotation flows into Dow Jones industrials and banks.');
    }
    return text;
  };

  const formatSessionStatus = (statusText: string) => {
    if (!isId || !statusText) return statusText;
    return statusText
      .replace(/London session active \(European FX and commodity liquidity\)/g, 'Sesi London aktif (Likuiditas valas dan komoditas Eropa)')
      .replace(/London - New York overlap \(Peak global market liquidity & volatility\)/g, 'Overlap London - New York (Puncak likuiditas & volatilitas pasar global)')
      .replace(/New York session active \(US economic data, Wall Street equities, and Treasury yields\)/g, 'Sesi New York aktif (Data ekonomi AS, ekuitas Wall Street, dan yield Treasury)')
      .replace(/Pacific \/ Sydney session active \(Early Pacific liquidity & commodity currencies\)/g, 'Sesi Pasifik / Sydney aktif (Likuiditas awal Pasifik & mata uang komoditas)')
      .replace(/Asia \/ Tokyo session active \(Bank of Japan, JPY crosses, and regional Asian risk tone\)/g, 'Sesi Asia / Tokyo aktif (Bank of Japan, pasangan silang JPY, dan sentimen regional Asia)');
  };

  const formatAnomalyTitle = (title: string) => {
    if (!isId || !title) return title;
    return title
      .replace(/Intermarket Transmission In Step/g, 'Transmisi Antar-Pasar Bergerak Selaras')
      .replace(/Intermarket Divergence: Gold Rallies Alongside Rising US10Y Yield/g, 'Divergensi Antar-Pasar: Emas Reli Bersamaan dengan Kenaikan Yield US10Y')
      .replace(/Monetary Divergence: Gold & US Dollar Rallying Concurrently/g, 'Divergensi Moneter: Emas & Indeks DXY Menguat Bersamaan')
      .replace(/Growth Equity vs Discount Rate Divergence/g, 'Divergensi Saham Pertumbuhan vs Suku Bunga Diskonto')
      .replace(/Carry Divergence: USD\/JPY Pulls Back Despite Wide Yield Spread/g, 'Divergensi Carry: USD/JPY Terkoreksi Meski Spread Yield Lebar')
      .replace(/Valuation Divergence: Nasdaq Rallies Against Rising Yields/g, 'Divergensi Valuasi: Nasdaq Menguat Melawan Kenaikan Yield')
      .replace(/USD\/JPY Overextended vs Spread \(Zona Sensitivitas Intervensi\)/g, 'USD/JPY Overextended vs Spread (Zona Sensitivitas Intervensi)')
      .replace(/Anomali XAU\/USD: Emas Gagal Menguat Saat DXY Melunak/g, 'Anomali XAU/USD: Emas Gagal Menguat Saat DXY Melunak');
  };

  const formatAnomalyDesc = (desc: string) => {
    if (!isId || !desc) return desc;
    return desc
      .replace(/The transmission between the dollar, US Treasury yields, the majors, and equity indices is currently in step, with no structural anomaly\./g, 'Transmisi antara indeks dolar, yield Treasury AS, valuta mayor, dan indeks saham saat ini bergerak selaras tanpa anomali struktural.')
      .replace(/Technology indices are up sharply even as US10Y yields jump\. A yield spike normally compresses P\/E multiples\./g, 'Indeks teknologi menguat tajam meski yield US10Y melonjak. Lonjakan yield normalnya menekan rasio valuasi P/E.')
      .replace(/Sebab struktural:/g, 'Penyebab struktural:')
      .replace(/Implikasi:/g, 'Implikasi:')
      .replace(/Sovereign reserve diversification \(de-dollarization\) and geopolitical safe-haven accumulation override the nominal bond yield opportunity cost\./g, 'Diversifikasi cadangan devisa berdaulat (de-dolarisasi) dan akumulasi safe-haven geopolitik mengungguli biaya peluang yield obligasi nominal.')
      .replace(/Global liquidity stress prompts dual allocation: investors hoard USD cash liquidity while acquiring bullion as a fiat debasement hedge\./g, 'Tekanan likuiditas global memicu alokasi ganda: investor memegang likuiditas tunai USD sekaligus mengakumulasi emas batangan sebagai lindung nilai pelemahan fiat.')
      .replace(/Substantial AI capex spending commitments and mega-cap tech earnings revisions offset standard P\/E multiple compression from interest rates\./g, 'Komitmen belanja modal AI yang masif dan revisi laba teknologi mega-cap mengimbangi kompresi rasio P/E standar akibat suku bunga.')
      .replace(/Verbal intervention warnings from Japan \(MoF\/BoJ\) or broader de-risking sentiment trigger speculative yen carry unwinding\./g, 'Peringatan intervensi verbal dari otoritas Jepang (MoF/BoJ) atau sentimen de-risking global memicu unwinding spekulatif posisi carry Yen.')
      .replace(/US10Y yield climbed \(\+(.*?) bps \/ (.*?)\%\) yet Gold remains resilient \(\+(.*?)\% at \$(.*?)\)\./g, 'Yield US10Y naik (+$1 bps / $2%) namun Emas tetap tangguh (+$3% di $$4).')
      .replace(/DXY is firm \(\+(.*?)\%\) while XAUUSD also gains \(\+(.*?)\%\)\./g, 'DXY kokoh (+$1%) sementara XAU/USD juga menguat (+$2%).')
      .replace(/US10Y yield gained \(\+(.*?) bps\) yet Nasdaq 100 rallied \(\+(.*?)\%\)\./g, 'Yield US10Y naik (+$1 bps) namun Nasdaq 100 reli (+$2%).')
      .replace(/US10Y vs JGB yield spread remains wide \((.*?)\%\), yet USD\/JPY is retracing lower \((.*?)\%\)\./g, 'Spread yield US10Y vs JGB tetap lebar ($1%), namun USD/JPY terkoreksi melemah ($2%).')
      .replace(/Gold demonstrates deep institutional bid absorption \(decoupling from real yields\)\. Selling into resistance carries heightened short-squeeze risk\./g, 'Emas menunjukkan penyerapan beli institusional yang kuat (decoupling dari yield riil). Posisi sell di resistensi membawa risiko short-squeeze tinggi.')
      .replace(/Selling pressure concentrates on secondary currencies \(EUR, GBP, JPY\) which weaken against USD and XAU simultaneously\./g, 'Tekanan jual terkonsentrasi pada valuta sekunder (EUR, GBP, JPY) yang melemah terhadap USD dan XAU secara simultan.')
      .replace(/Equity markets treat mega-cap hyperscalers as quality secular compounders insulated from moderate rate fluctuations\./g, 'Pasar ekuitas memperlakukan saham hyperscaler mega-cap sebagai aset berkualitas yang terlindungi dari fluktuasi suku bunga moderat.')
      .replace(/Long USD\/JPY exposures are vulnerable to cascade liquidations if volatility spikes\./g, 'Eksposur long USD/JPY rentan terhadap likuidasi berantai jika volatilitas melonjak.');
  };

  const formatCsSummary = (text?: string) => {
    if (!text) return '';
    if (!isId) return text;
    return text
      .replace(/Capital flow strongly favors (.*?) over (.*?) \(Net CS: (.*?)\)\. Supports bullish setups\./g, 'Arus modal sangat memfavoritkan $1 atas $2 (Net CS: $3). Mendukung bias bullish.')
      .replace(/Quote currency \((.*?)\) dominates over (.*?) \(Net CS: (.*?)\)\. Supports bearish setups\./g, 'Mata uang kuotasi ($1) mendominasi atas $2 (Net CS: $3). Mendukung bias bearish.')
      .replace(/Relative currency strength between (.*?) and (.*?) is balanced\./g, 'Kekuatan valuta relatif antara $1 dan $2 terpantau berimbang.')
      .replace(/(.*?) \(#(.*?), (.*?)\) leads (.*?) \(#(.*?), (.*?)\) by \+(.*?)/g, '$1 (#$2, $3) memimpin atas $4 (#$5, $6) sebesar +$7')
      .replace(/(.*?) \(#(.*?), (.*?)\) vs (.*?) \(#(.*?), (.*?)\) relatively balanced/g, '$1 (#$2, $3) vs $4 (#$5, $6) relatif berimbang');
  };

  const formatKeyDriver = (text?: string) => {
    if (!text) return '';
    if (!isId) return text;
    return text
      .replace(/Fed policy rate expectations and geopolitical hedging premium against US Dollar liquidity\./g, 'Ekspektasi suku bunga The Fed & premi lindung nilai geopolitik terhadap likuiditas USD.')
      .replace(/Fed policy rate expectations and geopolitical hedging premium, read from the dollar versus the currency basket/g, 'Ekspektasi suku bunga Fed & premi lindung nilai geopolitik, terbaca dari dolar vs keranjang valuta.')
      .replace(/ECB versus Fed monetary policy outlook divergence/g, 'Divergensi prospek kebijakan moneter ECB versus The Fed.')
      .replace(/Bank of England \(BoE\) versus Fed rate path and sticky UK services inflation/g, 'Jalur suku bunga BoE vs Fed serta inflasi sektor jasa Inggris yang persisten.')
      .replace(/Extreme rate gap between the Fed \(~5%\) and the Bank of Japan's low rate \(~0.25%\)/g, 'Kesenjangan suku bunga ekstrem antara The Fed (~5%) dan suku bunga rendah Bank of Japan (~0,25%).')
      .replace(/Sensitivity of tech and AI valuations to the US 10-year Treasury discount yield/g, 'Sensitivitas valuasi saham teknologi & AI terhadap yield diskonto Treasury AS 10Y.')
      .replace(/Industrial activity health, bank earnings, and Dow 30 multinational earnings against the dollar backdrop/g, 'Aktivitas industri, kinerja laba bank, & pendapatan multinasional Dow 30 terhadap dinamika dolar.')
      .replace(/Aggregate earnings barometer of 500 US companies and macro monetary liquidity expectations/g, 'Barometer laba agregat 500 korporasi AS & ekspektasi likuiditas moneter makro.')
      .replace(/RBA versus Fed rate divergence and Australia's export commodity demand outlook/g, 'Divergensi suku bunga RBA vs Fed & prospek permintaan komoditas ekspor Australia.')
      .replace(/Bank of Canada \(BoC\) versus Fed rate divergence and Canada's energy sector transmission/g, 'Divergensi suku bunga BoC vs Fed & transmisi sektor energi Kanada.')
      .replace(/Global monetary liquidity \(M2\), institutional spot ETF flows, and crypto risk appetite/g, 'Likuiditas moneter global (M2), arus masuk ETF spot institusional, & selera risiko kripto.')
      .replace(/US economic data guides Fed rate expectations/g, 'Rilis data ekonomi AS memandu ekspektasi suku bunga The Fed.')
      .replace(/Global liquidity sentiment and the daily risk appetite/g, 'Sentimen likuiditas global dan selera risiko harian.');
  };

  const formatActionableZone = (text?: string) => {
    if (!text) return '';
    if (!isId) return text;
    return text
      .replace(/Pullback to the nearest session demand/g, 'Pullback ke area demand sesi terdekat')
      .replace(/Test of the lower session support area/g, 'Pengujian area support bawah sesi')
      .replace(/Sell on a rally into nearby resistance/g, 'Jual saat reli menuju resistensi terdekat')
      .replace(/Buy the dip at session support/g, 'Beli saat harga terkoreksi di support sesi (buy the dip)')
      .replace(/London session demand zone/g, 'Zona demand sesi London')
      .replace(/Supply zone at the upper Asia-London session boundary/g, 'Zona supply pada batas atas sesi Asia-London')
      .replace(/Watch the price reaction near the round-number psychological level/g, 'Amati reaksi harga di dekat level psikologis angka bulat')
      .replace(/Breakout demand area at the New York session open/g, 'Area demand breakout saat pembukaan sesi New York')
      .replace(/Key intraday Nasdaq support/g, 'Support kunci intraday Nasdaq')
      .replace(/Dow 30 round-number psychological area and the London-NY session boundary/g, 'Area psikologis angka bulat Dow 30 & batas sesi London-NY')
      .replace(/Wall Street open demand zone/g, 'Zona demand pembukaan Wall Street')
      .replace(/S&P 500 support retest/g, 'Retest level support S&P 500')
      .replace(/Upper\/lower boundary of the Asia-Pacific session range/g, 'Batas atas/bawah rentang sesi Asia-Pasifik')
      .replace(/Reaction zone around joint US-Canada macro releases \(New York session\)/g, 'Zona reaksi rilis data makro bersama AS-Kanada (sesi New York)')
      .replace(/Round-number psychological levels in thousands of dollars and derivatives leverage liquidity/g, 'Level psikologis angka bulat ribuan dolar & likuiditas derivatif')
      .replace(/Pullback demand area/g, 'Area demand saat pullback')
      .replace(/Retracement supply area/g, 'Area supply saat retracement')
      .replace(/Watch the session support\/resistance boundary/g, 'Amati batas support/resisten sesi');
  };

  const formatDisplayName = (name: string) => {
    if (!isId || !name) return name;
    return name
      .replace(/Gold \/ US Dollar/g, 'Emas / Dolar AS')
      .replace(/British Pound \/ USD/g, 'Poundsterling / Dolar AS')
      .replace(/Euro \/ US Dollar/g, 'Euro / Dolar AS')
      .replace(/US Dollar \/ Japanese Yen/g, 'Dolar AS / Yen Jepang')
      .replace(/Australian Dollar \/ USD/g, 'Dolar Australia / Dolar AS')
      .replace(/US Dollar \/ Canadian Dollar/g, 'Dolar AS / Dolar Kanada')
      .replace(/Nasdaq 100 Index/g, 'Indeks Nasdaq 100')
      .replace(/Dow Jones 30 Index/g, 'Indeks Dow Jones 30')
      .replace(/S&P 500 CFD Index/g, 'Indeks S&P 500 CFD')
      .replace(/Bitcoin \/ US Dollar/g, 'Bitcoin / Dolar AS');
  };

  return (
    <div className="space-y-4" id="arah-market-dossier-view">
      {/* 1. TOP HEADER & SESSION BAROMETER */}
      <section className="space-y-4">
        <PageHeader
          eyebrow={t('RISET · BIAS PASAR & CONFLUENCE', 'RESEARCH · MARKET BIAS & CONFLUENCE')}
          accentNote={
            <span className="flex items-center gap-1.5 font-mono text-[10px]">
              <Clock className="w-3 h-3 text-[var(--accent)]" />
              <span>{t(`${formatSessionName(activeSession)} Aktif`, `${formatSessionName(activeSession)} Active`)}</span>
            </span>
          }
          title={t('Bias Pasar & Confluence Intraday', 'Market Bias & Intraday Confluence')}
          description={`${formatSessionStatus(sessionStatusText)} — ${t('integrasi komprehensif katalis fundamental, transmisi intermarket obligasi US10Y & DXY, dan Market Structure intraday.', 'comprehensive alignment of fundamental catalysts, US10Y & DXY intermarket transmission, and intraday Market Structure.')}`}
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-section)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('Stream Reaktif Live', 'Live Reactive Stream')}</span>
              </span>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 px-3 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50 font-mono"
                title={t('Sinkronisasi bias sesi terkini', 'Synchronize current session bias')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
                <span>{t('Sinkronisasi', 'Sync')}</span>
              </button>
            </div>
          }
        />

        {/* Global Regime & DXY Position Bar */}
        <div className="pt-2 border-t grid grid-cols-1 md:grid-cols-3 gap-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <div className="md:col-span-2 rounded-lg p-3.5 flex flex-col justify-between gap-2.5 border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
                {t('Rezim Intraday Global', 'Global Intraday Regime')}
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                {formatRegimeTitle(globalRegime.title)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans">
              {formatRegimeNarrative(globalRegime.summaryNarrative)}
            </p>
            {globalRegime.topCatalystHeadline && (
              <div className="pt-2 border-t text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
                <Flame className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="truncate">{formatHeadline(globalRegime.topCatalystHeadline)}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg p-3.5 flex flex-col justify-between gap-2.5 border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                {t('DXY vs Open Sesi', 'DXY vs Session Open')}
              </span>
              <span className={`text-[9.5px] px-2 py-0.5 rounded font-semibold ${
                globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              }`}>
                {globalRegime.dxyBiasVsOpen === 'ABOVE_OPEN' ? t('Di Atas Open', 'Above Open') : t('Di Bawah Open', 'Below Open')}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-snug">
              {t('Arah indeks dolar relatif terhadap open sesi menentukan gaya gravitasi valas global.', 'Dollar index direction relative to session open drives global FX gravitational momentum.')}
            </p>
            <div className="pt-2 border-t flex items-center justify-between text-[10px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
              <span>{t('SELERA RISIKO (RISK APPETITE):', 'RISK APPETITE:')}</span>
              <span className="font-bold text-[var(--text-primary)]">
                {globalRegime.riskScore > 0 ? `+${globalRegime.riskScore}` : globalRegime.riskScore} / 100
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERMARKET SPREAD ENGINE & ANOMALY RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Pulsus Intermarket (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  {t('Pulsus Transmisi Intermarket', 'Intermarket Transmission Pulse')}
                </h3>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('intermarket')}
                  className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{t('Lihat Transmisi Lengkap', 'View Full Transmission')}</span>
                  <span className="font-sans">→</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {intermarketSpreads.map(spread => (
                <div
                  key={spread.id}
                  className="p-2.5 rounded-md bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex flex-col justify-between gap-2 hover:border-[var(--border-strong)] transition font-mono"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[var(--text-primary)] truncate font-sans" title={formatSpreadName(spread.name)}>
                        {formatSpreadName(spread.name)}
                      </div>
                      <div className="text-[9.5px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                        <span className="px-1 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-bold text-[var(--text-primary)]">
                          {spread.targetPair}
                        </span>
                        <span className="truncate">{spread.formulaLabel}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                        {spread.currentValue > 0 ? `+${spread.currentValue}` : spread.currentValue}{spread.unit}
                      </div>
                      <div className={`text-[10px] font-semibold tabular-nums ${
                        spread.changeSessionBps >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                      }`}>
                        {spread.changeSessionBps >= 0 ? '+' : ''}{spread.changeSessionBps} bps
                      </div>
                    </div>
                  </div>

                  {spread.interpretation && (
                    <div className="text-[10.5px] text-[var(--text-secondary)] font-sans line-clamp-2 leading-relaxed pt-1.5 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                      {formatSpreadInterpretation(spread.interpretation)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]" style={{ borderColor: 'var(--border-hairline)' }}>
            <span>{t('MODEL TRANSMISI: SPREAD YIELD & VALUASI', 'TRANSMISSION MODEL: YIELD SPREAD & VALUATION')}</span>
            <span>{t('BENCHMARK SESI AKTIF', 'ACTIVE SESSION BENCHMARK')}</span>
          </div>
        </div>

        {/* Radar Anomali Sesi (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  {t('Radar Anomali Sesi', 'Session Anomaly Radar')}
                </h3>
              </div>
              <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
                dedupedAnomalies.length > 0
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              }`}>
                {dedupedAnomalies.length > 0 ? `${dedupedAnomalies.length} ${t('DIVERGENSI', 'DIVERGENCES')}` : t('KONDISI SELARAS', 'ALIGNED')}
              </span>
            </div>

            {dedupedAnomalies.length === 0 ? (
              <div className="p-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-mono text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('Tidak Ada Anomali Kritis Terdeteksi', 'No Critical Anomalies Detected')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                  {t('Seluruh saluran transmisi yield, valuta, dan komoditas bergerak selaras dengan arah fundamental sesi ini.', 'All yield, currency, and commodity transmission channels are moving aligned with fundamental direction.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dedupedAnomalies.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-md border border-amber-500/30 bg-amber-500/5 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[11.5px] text-amber-500 font-mono leading-tight">
                        {formatAnomalyTitle(alert.title)}
                      </div>
                      {alert.affectedPairs && alert.affectedPairs.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {alert.affectedPairs.map(p => (
                            <span key={p} className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-amber-500/30 font-mono text-[var(--text-primary)] font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] font-sans">
                      {formatAnomalyDesc(alert.description)}
                    </p>

                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10.5px] font-mono text-[var(--text-primary)]">
                      <strong className="text-amber-500 mr-1.5 font-bold">{t('AKSI DESK:', 'DESK ACTION:')}</strong>
                      <span className="font-sans text-[var(--text-secondary)] leading-relaxed">{formatAnomalyAction(alert.actionAdvice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <span className="text-[9.5px] font-mono text-[var(--text-muted)] pt-2 mt-2 border-t block" style={{ borderColor: 'var(--border-hairline)' }}>
            {t('*Filter anomali mendeteksi divergensi harga vs spread imbal hasil untuk mencegah falseout.', '*Anomaly filter detects price vs yield spread divergences to prevent falseouts.')}
          </span>
        </div>
      </div>

      {/* 3. PRIMARY CONFLUENCE PAIRS BOARD */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <h2 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
              <span>{t('Papan Konfluensi Pasangan Aset Intraday', 'Intraday Asset Confluence Board')}</span>
              <span className="text-xs font-mono font-normal text-[var(--text-muted)]">
                ({filteredPairs.length} {t('ASET AKTIF', 'ACTIVE ASSETS')})
              </span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              {t('Triangulasi 3 pilar: Katalis Fundamental, Intermarket Yield Spread & DXY, dan Price Action Teknikal.', '3-Pillar Triangulation: Fundamental Catalysts, Intermarket Yield Spread & DXY, and Technical Price Action.')}
            </p>
          </div>

          <div className="flex items-center gap-1 border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] p-0.5 rounded text-xs font-mono shrink-0 overflow-x-auto">
            {(['ALL', 'HIGH_CONVICTION', 'MODERATE', 'CAUTION'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedPairFilter(filter)}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-[10.5px] font-semibold whitespace-nowrap ${
                  selectedPairFilter === filter
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {filter === 'ALL'
                  ? `${t('SEMUA', 'ALL')} (${pairs.length})`
                  : filter === 'HIGH_CONVICTION'
                  ? t('3/3 TERKONFIRMASI', '3/3 CONFIRMED')
                  : filter === 'MODERATE'
                  ? t('2/3 PARSIAL', '2/3 PARTIAL')
                  : t('DIVERGEN / HATI-HATI', 'DIVERGENT / CAUTION')}
              </button>
            ))}
          </div>
        </div>

        {/* Pairs Grid */}
        {filteredPairs.length === 0 ? (
          <EmptyState
            icon={<Target className="w-6 h-6 text-[var(--text-muted)]" />}
            title={t('Tidak ada aset yang cocok dengan filter', 'No pairs matched selected filter')}
            description={t('Sesuaikan kriteria filter konfluensi untuk menampilkan instrumen lain.', 'Adjust your confluence filter criteria to display other instruments.')}
            action={{
              label: t('Tampilkan Semua Instrumen', 'Show All Instruments'),
              onClick: () => setSelectedPairFilter('ALL'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filteredPairs.map(p => {
              const badge = getConfluenceBadge(p.confluenceStatus, p.directionalBias);
              const c1 = p.pair.length === 6 ? p.pair.slice(0, 3) : null;
              const c2 = p.pair.length === 6 ? p.pair.slice(3, 6) : null;

              return (
                <div
                  key={p.pair}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 flex flex-col justify-between gap-3 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-raised)] transition"
                >
                  <div>
                    {/* Top Row: Symbol, Price, & 24h Change */}
                    <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        {c1 && c2 ? (
                          <div className="flex items-center -space-x-1 shrink-0">
                            <img
                              src={getCurrencyFlagUrl(c1)}
                              alt={c1}
                              referrerPolicy="no-referrer"
                              className="w-3.5 h-2.5 object-cover rounded-xs border border-[var(--border-subtle)]"
                            />
                            <img
                              src={getCurrencyFlagUrl(c2)}
                              alt={c2}
                              referrerPolicy="no-referrer"
                              className="w-3.5 h-2.5 object-cover rounded-xs border border-[var(--border-subtle)]"
                            />
                          </div>
                        ) : (
                          <span className="w-5 h-5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] shrink-0">
                            {p.pair.slice(0, 2)}
                          </span>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            {p.pair}
                          </h3>
                          <div className="text-[10px] text-[var(--text-muted)] font-sans truncate max-w-[120px]" title={formatDisplayName(p.displayName)}>
                            {formatDisplayName(p.displayName)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right tabular-nums">
                        <div className="text-xs font-bold text-[var(--text-primary)]">
                          {p.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          p.change24hPct >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                        }`}>
                          {p.change24hPct >= 0 ? `+${p.change24hPct.toFixed(2)}%` : `${p.change24hPct.toFixed(2)}%`}
                        </div>
                      </div>
                    </div>

                    {/* Confluence Status Banner */}
                    <div className={`mb-2.5 px-2 py-1 rounded border text-[10px] font-mono font-bold flex items-center justify-between ${badge.badgeClass}`}>
                      <span>{badge.label}</span>
                      <span className="tabular-nums">{p.convictionScore}%</span>
                    </div>

                    {/* Currency Strength Confluence Pillar (Forex Pairs) */}
                    {p.currencyStrength ? (
                      <div className="mb-2.5 p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[10px] font-mono">
                        <div className="flex items-center justify-between mb-1.5 text-[9.5px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">{t('Pilar CS', 'CS Pillar')}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                              p.currencyStrength.bias === 'BULLISH'
                                ? 'bg-[var(--bullish)]/15 text-[var(--bullish)] border border-[var(--bullish)]/30'
                                : p.currencyStrength.bias === 'BEARISH'
                                ? 'bg-[var(--bearish)]/15 text-[var(--bearish)] border border-[var(--bearish)]/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                            }`}>
                              {formatBias(p.currencyStrength.bias)}
                            </span>
                          </div>
                          <span className={`text-[9px] font-semibold px-1 rounded ${
                            p.currencyStrength.alignment === 'CONFIRMED'
                              ? 'text-[var(--bullish)]'
                              : p.currencyStrength.alignment === 'DIVERGENCE'
                              ? 'text-[var(--bearish)] bg-[var(--bearish)]/10'
                              : 'text-[var(--text-muted)]'
                          }`}>
                            {formatAlignment(p.currencyStrength.alignment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between tabular-nums">
                          <span className="font-bold text-[var(--text-primary)]">
                            {p.currencyStrength.baseCurrency} ({p.currencyStrength.baseScore.toFixed(1)})
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            p.currencyStrength.netDifferential > 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'
                          }`}>
                            Δ {p.currencyStrength.netDifferential > 0 ? `+${p.currencyStrength.netDifferential.toFixed(1)}` : p.currencyStrength.netDifferential.toFixed(1)}
                          </span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {p.currencyStrength.quoteCurrency} ({p.currencyStrength.quoteScore.toFixed(1)})
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Confluence Pillars Breakdown */}
                    <div className="space-y-1.5 text-[10.5px] font-mono p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                      <div>
                        <div className="flex items-center justify-between text-[9.5px] text-[var(--text-muted)]">
                          <span>{p.currencyStrength ? t('Arus CS / Pendorong Makro', 'CS Flow / Macro Driver') : t('Fundamental', 'Fundamental')}</span>
                          <span className={`font-bold ${(p.currencyStrength ? p.currencyStrength.bias : p.fundamental.bias) === 'BULLISH' ? 'text-[var(--bullish)]' : (p.currencyStrength ? p.currencyStrength.bias : p.fundamental.bias) === 'BEARISH' ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}`}>
                            {formatBias(p.currencyStrength ? p.currencyStrength.bias : p.fundamental.bias)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-sans line-clamp-1" title={p.currencyStrength ? formatCsSummary(p.currencyStrength.summary) : formatKeyDriver(p.fundamental.keyDriver)}>
                          {p.currencyStrength ? formatCsSummary(p.currencyStrength.summary) : formatKeyDriver(p.fundamental.keyDriver)}
                        </p>
                      </div>

                      <div className="pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                        <div className="flex items-center justify-between text-[9.5px] text-[var(--text-muted)]">
                          <span>{t('Antar-Pasar (Intermarket)', 'Intermarket')}</span>
                          <span className={`font-bold ${p.intermarket.bias === 'BULLISH' ? 'text-[var(--bullish)]' : p.intermarket.bias === 'BEARISH' ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}`}>
                            {formatBias(p.intermarket.bias)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-sans line-clamp-1" title={formatIntermarketSymptom(p.intermarket.primarySymptom)}>
                          {formatIntermarketSymptom(p.intermarket.primarySymptom)}
                        </p>
                      </div>

                      <div className="pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                        <div className="flex items-center justify-between text-[9.5px] text-[var(--text-muted)]">
                          <span>{t('Price Action (Aksi Harga)', 'Price Action')}</span>
                          <span className={`font-bold ${p.priceAction.bias === 'BULLISH' ? 'text-[var(--bullish)]' : p.priceAction.bias === 'BEARISH' ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'}`}>
                            {formatBias(p.priceAction.bias)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-sans line-clamp-1" title={formatActionableZone(p.priceAction.actionableZone)}>
                          {formatActionableZone(p.priceAction.actionableZone)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t font-mono" style={{ borderColor: 'var(--border-hairline)' }}>
                    <div className="flex items-center justify-between mb-2 text-[10px]">
                      <span className="text-[var(--text-muted)]">{t('Rencana Aksi:', 'Trade Plan:')}</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatRecommendedAction(p.intradayPlan.recommendedAction)}
                      </span>
                    </div>

                    <div className="mb-2 p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                      <span className="text-[9px] text-[var(--text-muted)] block tracking-wider uppercase">{t('Batas Batal (Invalidasi)', 'Invalidation Trigger')}</span>
                      <span className="text-[10.5px] text-[var(--text-secondary)] font-sans leading-snug block">
                        {formatInvalidation(p.intradayPlan.invalidationTrigger)}
                      </span>
                    </div>

                    {p.intradayPlan.warningNote && (
                      <div className="mb-2 p-2 rounded border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[10px] text-[var(--warning-strong)] font-sans leading-snug">
                        {formatWarningNote(p.intradayPlan.warningNote)}
                      </div>
                    )}

                    <button
                      onClick={() => onOpenChart(p.tvSymbol || p.pair)}
                      className="w-full py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-[10.5px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      <ExternalLink className="w-3 h-3 text-[var(--accent)]" />
                      <span>{t('BUKA CHART', 'OPEN CHART')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
});

ArahMarketView.displayName = 'ArahMarketView';
