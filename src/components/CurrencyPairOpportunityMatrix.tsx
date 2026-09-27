import React, { useState, useMemo } from 'react';
import { CurrencyStrength } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  BarChart2,
  CheckCircle2,
  XCircle,
  LineChart,
} from 'lucide-react';
import { Tooltip, MetricTooltip, MetricInfoIcon } from './Tooltip';
import { useLanguage } from '../lib/LanguageContext';

interface PairOpportunity {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseScore: number;
  quoteScore: number;
  delta: number; // base - quote
  absDelta: number;
  action: 'STRONG_BUY' | 'BUY' | 'NEUTRAL_CHOP' | 'SELL' | 'STRONG_SELL';
  tier: 'PRIME' | 'MODERATE' | 'CHOP_AVOID';
  tradeStyle: string;
  catalyst: string;
  sessionSuitability: string;
}

interface CurrencyPairOpportunityMatrixProps {
  strengths: CurrencyStrength[];
  onOpenChart?: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

const PAIR_CATALYSTS_ID: Record<string, { catalyst: string; session: string }> = {
  AUDCAD: {
    catalyst: 'Sikap hawkish RBA & ekspor bijih besi/logam vs siklus pemangkasan BoC & dinamika minyak mentah',
    session: 'Sesi Asia / New York Overlap',
  },
  GBPJPY: {
    catalyst: 'Ketahanan suku bunga terminal BoE vs supresi yield ultra-dovish BoJ',
    session: 'Sesi London / Tokyo Overlap',
  },
  AUDJPY: {
    catalyst: 'Beta carry komoditas/risk-on vs likuidasi pendanaan Yen',
    session: 'Sesi Asia / Awal London',
  },
  GBPUSD: {
    catalyst: 'Persistensi inflasi jasa UK vs melandainya yield US Treasury & ekspektasi rate cut The Fed',
    session: 'Sesi London / New York Overlap',
  },
  EURJPY: {
    catalyst: 'Plateau yield ECB vs selisih suku bunga riil negatif di Jepang',
    session: 'Sesi London',
  },
  EURUSD: {
    catalyst: 'Stabilisasi industri Zona Euro vs konsolidasi indeks dolar DXY',
    session: 'Sesi London / New York Overlap',
  },
  AUDUSD: {
    catalyst: 'Penahanan suku bunga hawkish RBA & permintaan komoditas vs pendinginan pasar tenaga kerja AS',
    session: 'Sesi Asia / New York',
  },
  NZDUSD: {
    catalyst: 'Terms-of-trade produk susu vs lintasan pelonggaran moneter The Fed',
    session: 'Sesi Asia',
  },
  USDCAD: {
    catalyst: 'Korelasi minyak mentah vs siklus pelonggaran suku bunga BoC',
    session: 'Sesi New York',
  },
  USDCHF: {
    catalyst: 'Bias intervensi negatif SNB vs yield safe-haven dolar AS',
    session: 'Sesi Eropa / AS',
  },
  EURGBP: {
    catalyst: 'Spread gilt UK vs Zona Euro dan diferensial momentum ekonomi',
    session: 'Sesi London',
  },
  CADJPY: {
    catalyst: 'Ketentuan ekspor energi vs arus defisit perdagangan Jepang',
    session: 'Sesi Tokyo / NY',
  },
  CHFJPY: {
    catalyst: 'Apresiasi defensif Franc Swiss vs arus carry Yen yang lemah',
    session: 'Sesi Eropa',
  },
  NZDCAD: {
    catalyst: 'Paritas lintas-komoditas dengan divergensi makro minimal',
    session: 'Sesi Pasifik',
  },
  EURAUD: {
    catalyst: 'Hambatan manufaktur Zona Euro vs ketentuan ekspor sumber daya Australia',
    session: 'Sesi London / Asia',
  },
  GBPAUD: {
    catalyst: 'Momentum CPI jasa BoE vs beta risiko pertambangan Australia',
    session: 'Sesi London',
  },
  AUDNZD: {
    catalyst: 'Divergensi moneter Trans-Tasman (jeda suku bunga RBA vs pelonggaran RBNZ)',
    session: 'Sesi Asia',
  },
  AUDCHF: {
    catalyst: 'Apresiasi carry komoditas vs posisi safe haven Franc Swiss',
    session: 'Sesi Asia / Eropa',
  },
  CADCHF: {
    catalyst: 'Terms-of-trade pendapatan minyak vs sensitivitas suku bunga negatif Franc Swiss',
    session: 'Sesi NY / Eropa',
  },
};

const TRADABLE_PAIRS: Array<{
  symbol: string;
  base: string;
  quote: string;
  catalyst: string;
  session: string;
}> = [
  { symbol: 'AUDCAD', base: 'AUD', quote: 'CAD', catalyst: 'RBA hawkish rate stance & iron ore/metals exports vs BoC easing cycle & crude price dynamics', session: 'Asian / New York Overlap' },
  { symbol: 'GBPJPY', base: 'GBP', quote: 'JPY', catalyst: 'BoE terminal rate resilience vs BoJ ultra-dovish yield suppression', session: 'London / Tokyo Overlap' },
  { symbol: 'AUDJPY', base: 'AUD', quote: 'JPY', catalyst: 'Commodity/Risk-on carry beta vs Yen funding liquidation', session: 'Asian / Early London' },
  { symbol: 'GBPUSD', base: 'GBP', quote: 'USD', catalyst: 'UK services inflation persistence vs softening US Treasury yields & Fed rate cut expectations', session: 'London / New York Overlap' },
  { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', catalyst: 'ECB yield plateau vs negative real rate differential in Japan', session: 'London Session' },
  { symbol: 'EURUSD', base: 'EUR', quote: 'USD', catalyst: 'Eurozone industrial stabilization vs DXY dollar index consolidation', session: 'London / New York Overlap' },
  { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', catalyst: 'RBA hawkish hold & commodities demand vs cooling US labor market', session: 'Asian / New York' },
  { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', catalyst: 'Dairy terms-of-trade vs Fed monetary easing trajectory', session: 'Asian Session' },
  { symbol: 'USDCAD', base: 'USD', quote: 'CAD', catalyst: 'Crude oil correlation vs BoC interest rate easing cycle', session: 'New York Session' },
  { symbol: 'USDCHF', base: 'USD', quote: 'CHF', catalyst: 'SNB negative intervention bias vs US dollar safe-haven yields', session: 'European / US Session' },
  { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', catalyst: 'UK vs Eurozone gilt spread and economic momentum differential', session: 'London Session' },
  { symbol: 'CADJPY', base: 'CAD', quote: 'JPY', catalyst: 'Energy export terms vs Japanese trade deficit flow', session: 'Tokyo / NY Session' },
  { symbol: 'CHFJPY', base: 'CHF', quote: 'JPY', catalyst: 'Swiss Franc defensive appreciation vs weak Yen carry flows', session: 'European Session' },
  { symbol: 'NZDCAD', base: 'NZD', quote: 'CAD', catalyst: 'Cross-commodity parity with minimal macro divergence', session: 'Pacific Session' },
  { symbol: 'EURAUD', base: 'EUR', quote: 'AUD', catalyst: 'Eurozone manufacturing drag vs Australian resource export terms', session: 'London / Asian' },
  { symbol: 'GBPAUD', base: 'GBP', quote: 'AUD', catalyst: 'BoE services CPI momentum vs Australian mining risk beta', session: 'London Session' },
  { symbol: 'AUDNZD', base: 'AUD', quote: 'NZD', catalyst: 'Trans-Tasman monetary divergence (RBA rate pause vs RBNZ easing)', session: 'Asian Session' },
  { symbol: 'AUDCHF', base: 'AUD', quote: 'CHF', catalyst: 'Commodity carry appreciation vs Swiss Franc safe haven positioning', session: 'Asian / European' },
  { symbol: 'CADCHF', base: 'CAD', quote: 'CHF', catalyst: 'Oil revenue terms-of-trade vs Swiss Franc negative interest rate sensitivity', session: 'NY / European' },
];

export const CurrencyPairOpportunityMatrix: React.FC<CurrencyPairOpportunityMatrixProps> = React.memo(({
  strengths,
  onOpenChart,
  onSelectSymbol,
}) => {
  const { t, isId } = useLanguage();
  const [filter, setFilter] = useState<'ALL' | 'PRIME_LONGS' | 'PRIME_SHORTS' | 'AVOID'>('ALL');

  // Compute map of currency scores
  const scoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of strengths) {
      map[s.currency] = s.strength_score;
    }
    return map;
  }, [strengths]);

  // Compute live pair rankings with divergence deltas
  const pairOpportunities = useMemo<PairOpportunity[]>(() => {
    return TRADABLE_PAIRS.map(p => {
      const baseScore = scoreMap[p.base] ?? 5.0;
      const quoteScore = scoreMap[p.quote] ?? 5.0;
      const delta = parseFloat((baseScore - quoteScore).toFixed(1));
      const absDelta = Math.abs(delta);

      let action: PairOpportunity['action'] = 'NEUTRAL_CHOP';
      let tier: PairOpportunity['tier'] = 'CHOP_AVOID';
      let tradeStyle = t('Rentang Terbatas / Scalp Saja', 'Rangebound / Scalp Only');

      if (delta >= 4.0) {
        action = 'STRONG_BUY';
        tier = 'PRIME';
        tradeStyle = t('Ikuti Tren / Beli Saat Koreksi', 'Trend Follow / Buy Dips');
      } else if (delta >= 2.0) {
        action = 'BUY';
        tier = 'MODERATE';
        tradeStyle = t('Kelanjutan Bullish', 'Bullish Continuation');
      } else if (delta <= -4.0) {
        action = 'STRONG_SELL';
        tier = 'PRIME';
        tradeStyle = t('Ikuti Tren / Jual Saat Reli', 'Trend Follow / Sell Rallies');
      } else if (delta <= -2.0) {
        action = 'SELL';
        tier = 'MODERATE';
        tradeStyle = t('Kelanjutan Bearish', 'Bearish Continuation');
      } else {
        action = 'NEUTRAL_CHOP';
        tier = 'CHOP_AVOID';
        tradeStyle = t('Whipsaw Tinggi / Hindari Breakout', 'High Whipsaw / Avoid Breakouts');
      }

      const idData = isId ? PAIR_CATALYSTS_ID[p.symbol] : undefined;
      const catalyst = idData?.catalyst || p.catalyst;
      const sessionSuitability = idData?.session || p.session;

      return {
        symbol: p.symbol,
        baseCurrency: p.base,
        quoteCurrency: p.quote,
        baseScore,
        quoteScore,
        delta,
        absDelta,
        action,
        tier,
        tradeStyle,
        catalyst,
        sessionSuitability,
      };
    }).sort((a, b) => b.absDelta - a.absDelta);
  }, [scoreMap, isId, t]);

  const formatAction = (act: PairOpportunity['action']) => {
    switch (act) {
      case 'STRONG_BUY':
        return t('BELI KUAT', 'STRONG BUY');
      case 'BUY':
        return t('BELI', 'BUY');
      case 'STRONG_SELL':
        return t('JUAL KUAT', 'STRONG SELL');
      case 'SELL':
        return t('JUAL', 'SELL');
      case 'NEUTRAL_CHOP':
      default:
        return t('CHOP NETRAL', 'NEUTRAL CHOP');
    }
  };

  // Filter pairs according to user view
  const filteredPairs = useMemo(() => {
    if (filter === 'PRIME_LONGS') {
      return pairOpportunities.filter(p => p.delta >= 2.5);
    }
    if (filter === 'PRIME_SHORTS') {
      return pairOpportunities.filter(p => p.delta <= -2.5);
    }
    if (filter === 'AVOID') {
      return pairOpportunities.filter(p => p.absDelta < 1.8);
    }
    return pairOpportunities;
  }, [pairOpportunities, filter]);

  // Top prime opportunities
  const topLong = pairOpportunities.find(p => p.delta > 3.0);
  const topShort = pairOpportunities.find(p => p.delta < -3.0);
  const topAvoid = pairOpportunities.find(p => p.absDelta < 1.2);

  return (
    <div className="terminal-panel p-4 sm:p-5 space-y-4 font-sans" id="currency-pair-opportunities">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--accent)] rounded-xs" />
            <h3 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
              {t('MATRIKS PELUANG PASANGAN MATA UANG', 'CURRENCY PAIR OPPORTUNITY MATRIX')}
            </h3>
            <MetricInfoIcon term="PRIME_PAIR" position="bottom" />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
            {t(
              'Pasangan mata uang probabilitas tinggi diperingkat berdasarkan divergensi skor bank sentral dan delta makro.',
              'High-probability currency pairs ranked by central bank score divergence and macro delta.'
            )}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1 p-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-xs font-mono shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer text-[11px] font-semibold ${
              filter === 'ALL'
                ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('SEMUA PAIR', 'ALL PAIRS')}
          </button>
          <button
            onClick={() => setFilter('PRIME_LONGS')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              filter === 'PRIME_LONGS'
                ? 'bg-[var(--bullish)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--bullish)]'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>{t('TOP BUY / LONG', 'TOP BUY / LONG')}</span>
          </button>
          <button
            onClick={() => setFilter('PRIME_SHORTS')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              filter === 'PRIME_SHORTS'
                ? 'bg-[var(--bearish)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--bearish)]'
            }`}
          >
            <ArrowDownRight className="w-3 h-3" />
            <span>{t('TOP SELL / SHORT', 'TOP SELL / SHORT')}</span>
          </button>
          <MetricTooltip term="CHOP_AVOID" underline={false}>
            <button
              onClick={() => setFilter('AVOID')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
                filter === 'AVOID'
                  ? 'bg-[var(--warning)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--warning)]'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{t('HINDARI / CHOP', 'AVOID / CHOP')}</span>
            </button>
          </MetricTooltip>
        </div>
      </div>

      {/* Top 3 Executive Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Prime Long */}
        {topLong && (
          <div className="p-3.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] font-mono border-l-2" style={{ borderLeftColor: 'var(--bullish)' }}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="metadata-label text-[var(--bullish)] flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('BIAS UTAMA BUY (LONG)', 'PRIMARY BUY BIAS (LONG)')}
              </span>
              <span className="badge-bullish text-xs tabular-nums font-bold">+{topLong.delta} DELTA</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-1.5 flex items-baseline gap-2">
              <span className="font-mono tracking-tight">{topLong.symbol}</span>
              <span className="text-xs font-normal text-[var(--text-muted)]">
                ({topLong.baseCurrency} {topLong.baseScore} vs {topLong.quoteCurrency} {topLong.quoteScore})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-2 leading-relaxed">
              {topLong.catalyst}
            </p>
            <div className="mt-2.5 pt-2 border-t text-[10.5px] text-[var(--bullish)] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
              <span>{t('STRATEGI:', 'STRATEGY:')} {t('Buy on Dips / Trend', 'Buy on Dips / Trend')}</span>
              <span className="text-[var(--text-muted)]">{topLong.sessionSuitability}</span>
            </div>
          </div>
        )}

        {/* Second Prime Opportunity (Next High Divergence) */}
        {pairOpportunities[1] && pairOpportunities[1] !== topLong && (
          <div className="p-3.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] font-mono border-l-2" style={{ borderLeftColor: 'var(--accent)' }}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="metadata-label text-[var(--accent)] flex items-center gap-1 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('DIVERGENSI TINGGI #2', 'HIGH DIVERGENCE #2')}
              </span>
              <span className="badge-neutral text-xs tabular-nums font-bold">
                {pairOpportunities[1].delta > 0 ? `+${pairOpportunities[1].delta}` : pairOpportunities[1].delta} DELTA
              </span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-1.5 flex items-baseline gap-2">
              <span className="font-mono tracking-tight">{pairOpportunities[1].symbol}</span>
              <span className="text-xs font-normal text-[var(--text-muted)]">
                ({pairOpportunities[1].baseCurrency} {pairOpportunities[1].baseScore} vs {pairOpportunities[1].quoteCurrency} {pairOpportunities[1].quoteScore})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-2 leading-relaxed">
              {pairOpportunities[1].catalyst}
            </p>
            <div className="mt-2.5 pt-2 border-t text-[10.5px] text-[var(--text-primary)] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
              <span>{t('STRATEGI:', 'STRATEGY:')} {pairOpportunities[1].tradeStyle}</span>
              <span className="text-[var(--text-muted)]">{pairOpportunities[1].sessionSuitability}</span>
            </div>
          </div>
        )}

        {/* Avoid Chop Warning */}
        {topAvoid && (
          <div className="p-3.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] font-mono border-l-2" style={{ borderLeftColor: 'var(--warning)' }}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="metadata-label text-[var(--warning)] flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('CHOP / HINDARI', 'CHOP / AVOID')}
              </span>
              <span className="badge-warning text-xs tabular-nums font-bold">{topAvoid.delta} DELTA</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-1.5 flex items-baseline gap-2">
              <span className="font-mono tracking-tight">{topAvoid.symbol}</span>
              <span className="text-xs font-normal text-[var(--text-muted)]">
                ({topAvoid.baseCurrency} {topAvoid.baseScore} vs {topAvoid.quoteCurrency} {topAvoid.quoteScore})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-2 leading-relaxed">
              {t(
                'Paritas antara skor mata uang dasar dan pembanding menandakan konsolidasi ketat, risiko whipsaw tinggi, dan kelanjutan arah rendah.',
                'Parity between base and quote scores indicates tight consolidation, heightened whipsaw risk, and low directional follow-through.'
              )}
            </p>
            <div className="mt-2.5 pt-2 border-t text-[10.5px] text-[var(--warning)] font-mono flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
              <span>{t('AKSI:', 'ACTION:')} {t('Hindari Breakout', 'Avoid Breakouts')}</span>
              <span className="text-[var(--text-muted)]">{t('Hanya Mean Revert', 'Mean Revert Only')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ranked Pair Opportunity Table */}
      <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="table-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="py-2.5 px-3">
                  <MetricTooltip term="CCY" underline={false}>
                    <span>{t('PAIR', 'PAIR')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3">
                  <MetricTooltip term="OVERALL_BIAS" underline={false}>
                    <span>{t('STATUS / BIAS', 'STATUS / BIAS')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3">
                  <MetricTooltip term="DIVERGENCE_DELTA" underline={false}>
                    <span>{t('DELTA DIVERGENSI', 'DIVERGENCE DELTA')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3 hidden md:table-cell">
                  <MetricTooltip term="CURRENCY_STRENGTH" underline={false}>
                    <span>{t('BASE VS QUOTE', 'BASE VS QUOTE')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3 hidden lg:table-cell">
                  <MetricTooltip term="FUNDAMENTAL_IMPLICATION" underline={false}>
                    <span>{t('KATALIS FUNDAMENTAL / MAKRO', 'FUNDAMENTAL / MACRO CATALYST')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3 hidden sm:table-cell">
                  <MetricTooltip term="PRIME_PAIR" underline={false}>
                    <span>{t('GAYA TRADING', 'TRADING STYLE')}</span>
                  </MetricTooltip>
                </th>
                <th className="py-2.5 px-3 text-right">{t('AKSI', 'ACTION')}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {filteredPairs.map((p) => {
                const isLong = p.delta >= 2.0;
                const isShort = p.delta <= -2.0;

                return (
                  <tr
                    key={p.symbol}
                    className="table-row transition cursor-pointer group"
                    onClick={() => onSelectSymbol?.(p.symbol)}
                  >
                    <td className="py-2 px-3 font-bold text-[var(--text-primary)]">
                      <span className="group-hover:text-[var(--accent)] transition text-sm">
                        {p.symbol}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider inline-flex items-center gap-1 ${
                          p.action === 'STRONG_BUY'
                            ? 'badge-bullish'
                            : p.action === 'BUY'
                            ? 'badge-bullish'
                            : p.action === 'STRONG_SELL'
                            ? 'badge-bearish'
                            : p.action === 'SELL'
                            ? 'badge-bearish'
                            : 'badge-warning'
                        }`}
                      >
                        {p.action === 'STRONG_BUY' && <ArrowUpRight className="w-2.5 h-2.5" />}
                        {p.action === 'STRONG_SELL' && <ArrowDownRight className="w-2.5 h-2.5" />}
                        {p.action === 'NEUTRAL_CHOP' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {formatAction(p.action)}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold tabular-nums text-sm ${
                            isLong ? 'text-[var(--bullish)]' : isShort ? 'text-[var(--bearish)]' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {p.delta > 0 ? `+${p.delta}` : p.delta}
                        </span>
                        {/* Visual divergence bar */}
                        <div className="w-16 h-1.5 bg-[var(--bg-section-alt)] rounded-xs overflow-hidden border border-[var(--border-subtle)] hidden sm:block">
                          <div
                            className={`h-full ${
                              isLong ? 'bg-[var(--bullish)]' : isShort ? 'bg-[var(--bearish)]' : 'bg-[var(--warning)]'
                            }`}
                            style={{
                              width: `${Math.min(100, (p.absDelta / 8.0) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3 hidden md:table-cell text-[var(--text-secondary)] text-[11px] tabular-nums">
                      <span className="font-semibold text-[var(--text-primary)]">{p.baseCurrency}</span> ({p.baseScore}) vs{' '}
                      <span className="font-semibold text-[var(--text-primary)]">{p.quoteCurrency}</span> ({p.quoteScore})
                    </td>

                    <td className="py-2 px-3 hidden lg:table-cell text-[var(--text-secondary)] font-sans text-xs max-w-xs truncate">
                      {p.catalyst}
                    </td>

                    <td className="py-2 px-3 hidden sm:table-cell text-[11px] text-[var(--text-muted)]">
                      {p.tradeStyle}
                    </td>

                    <td className="py-2 px-3 text-right">
                      {onOpenChart && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChart(p.symbol);
                          }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-section-alt)] transition cursor-pointer"
                          title={`${t('Buka Grafik', 'Open Chart')} ${p.symbol}`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trader Discipline Guide */}
      <div className="p-2.5 bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-secondary)] font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span>
            <strong className="text-[var(--text-primary)] font-mono">{t('ATURAN DIVERGENSI:', 'DIVERGENCE RULE:')}</strong>{' '}
            {t(
              'Pasangkan skor tertinggi (> 7.0) dengan skor terendah (< 3.0) untuk momentum tren maksimal dan batas pembatalan stop-loss terketat.',
              'Pair highest score (> 7.0) with lowest score (< 3.0) for maximum trend momentum and tightest stop-loss invalidation.'
            )}
          </span>
        </div>
        <span className="metadata-label text-[10px] text-[var(--accent)] shrink-0">
          {t('MESIN DISPERSI AKTIF', 'DISPERSION ENGINE ACTIVE')}
        </span>
      </div>
    </div>
  );
});

CurrencyPairOpportunityMatrix.displayName = 'CurrencyPairOpportunityMatrix';
