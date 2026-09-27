import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  Layers,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Globe2,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from './shared/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import {
  AIAnalysis,
  MarketTheme,
  CentralBankSpeech,
  CurrencyMacroContext,
  UnifiedMarketContext,
  CentralBankTone,
  MacroConditionStatus,
  User,
} from '../types';

interface AIIntelligenceViewProps {
  initialOverview?: AIAnalysis | null;
  user?: User | null;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = React.memo(({ initialOverview, user }) => {
  const { t, isId } = useLanguage();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CENTRAL_BANK' | 'MACRO_CONTEXT' | 'UNIFIED_CONTEXT'>('OVERVIEW');
  const [overview, setOverview] = useState<AIAnalysis | null>(initialOverview || null);
  const [themes, setThemes] = useState<MarketTheme[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [speeches, setSpeeches] = useState<CentralBankSpeech[]>([]);
  const [macroContexts, setMacroContexts] = useState<CurrencyMacroContext[]>([]);
  const [unifiedContext, setUnifiedContext] = useState<UnifiedMarketContext | null>(null);

  const [loading, setLoading] = useState(!initialOverview);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aiRes, themeRes, relRes, speechRes, contextRes, uniRes] = await Promise.allSettled([
        api.getAIOverview(),
        api.getMarketThemes(),
        api.getRelationshipMatrix(),
        api.getCentralBankSpeeches(),
        api.getMacroContext(),
        api.getUnifiedMarketContext(),
      ]);

      if (aiRes.status === 'fulfilled') setOverview(aiRes.value.market_overview);
      if (themeRes.status === 'fulfilled') setThemes(themeRes.value.themes);
      if (relRes.status === 'fulfilled') setRelationships(relRes.value.relationship_matrix);
      if (speechRes.status === 'fulfilled') setSpeeches(speechRes.value.speeches);
      if (contextRes.status === 'fulfilled') setMacroContexts(contextRes.value.contexts);
      if (uniRes.status === 'fulfilled') setUnifiedContext(uniRes.value.context);
    } catch (err: any) {
      console.warn('AI Intelligence fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setNotification(null);
      const res = await api.refreshAIOverview();
      if (res.market_overview) {
        setOverview(res.market_overview);
        setNotification({ type: 'success', message: 'Macro market regime re-synthesized successfully.' });
        setTimeout(() => setNotification(null), 4000);
      }
      // Re-fetch speeches and contexts
      const [speechRes, contextRes, uniRes] = await Promise.allSettled([
        api.getCentralBankSpeeches(),
        api.getMacroContext(),
        api.getUnifiedMarketContext(),
      ]);
      if (speechRes.status === 'fulfilled') setSpeeches(speechRes.value.speeches);
      if (contextRes.status === 'fulfilled') setMacroContexts(contextRes.value.contexts);
      if (uniRes.status === 'fulfilled') setUnifiedContext(uniRes.value.context);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Synthesis refresh: ${err.message || 'Temporary service capacity limit. Grounded fallback active.'}` });
    } finally {
      setRefreshing(false);
    }
  };

  const getToneBadge = (tone: CentralBankTone) => {
    switch (tone) {
      case 'HAWKISH':
        return 'badge-bearish';
      case 'DOVISH':
        return 'badge-bullish';
      case 'NEUTRAL':
        return 'badge-neutral';
      case 'MIXED':
        return 'badge-warning';
    }
  };

  const getConditionBadge = (cond: MacroConditionStatus) => {
    switch (cond) {
      case 'STRONG':
        return 'badge-bullish';
      case 'WEAK':
        return 'badge-bearish';
      case 'MIXED':
        return 'badge-warning';
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <PageHeader
        eyebrow={t('UTAMA · ANALISIS AI', 'MAIN · AI ANALYSIS')}
        title={t('Analisis Intelijen AI', 'AI Analysis')}
        description={t(
          'Pembacaan rezim pasar berbasis model, bahasa bank sentral, kondisi makro G8, dan konteks terpadu lintas aset.',
          'Model-driven reads of the market regime, central-bank language, G8 macro conditions, and the unified cross-asset context.'
        )}
      />

      {/* Sub-Navigation Tabs for Intelligence Layer */}
      <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>{t('REZIM PASAR & TEMA', 'MARKET REGIME & THEMES')}</span>
        </button>

        <button
          onClick={() => setActiveTab('CENTRAL_BANK')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'CENTRAL_BANK'
              ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{t('PIDATO BANK SENTRAL', 'CENTRAL BANK SPEECHES')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-section-alt)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {speeches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MACRO_CONTEXT')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'MACRO_CONTEXT'
              ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>{t('KONDISI MAKRO G8', 'G8 MACRO CONDITIONS')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-section-alt)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            8 FX
          </span>
        </button>

        <button
          onClick={() => setActiveTab('UNIFIED_CONTEXT')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'UNIFIED_CONTEXT'
              ? 'bg-[var(--active-bg)] text-[var(--active-text)] border border-[var(--active-border)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{t('KONTEKS PASAR TERPADU', 'UNIFIED MARKET CONTEXT')}</span>
        </button>
      </div>

      {notification && (
        <div className={`px-3.5 py-2.5 rounded border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          notification.type === 'error'
            ? 'badge-bearish'
            : 'badge-bullish'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-inherit hover:opacity-75 text-xs cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & MACRO REGIME */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="w-full space-y-4"
        >
          {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Overview Card */}
          <div className="terminal-panel p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-xs bg-[var(--accent)]" />
                <div>
                  <h2 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
                    {t('SINTESIS REZIM PASAR MAKRO EKSEKUTIF', 'EXECUTIVE MACRO MARKET REGIME SYNTHESIS')}
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    {t('Intelijen Multimodal Terverifikasi (Berita + Harga + Kekuatan Valuta + Makro)', 'Ground-Truth Multimodal Intelligence (News + Prices + Currency Strength + Macro)')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono">
                {overview && (
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {t('KEYAKINAN:', 'CONFIDENCE:')} <strong className="text-[var(--text-primary)]">{((overview.confidence || 0.9) * 100).toFixed(0)}%</strong>
                  </span>
                )}
                {/* The synthesis is cached server-side until RE-SYNTHESIZE runs, so
                    the read can be hours old while live prices move on. */}
                {overview?.created_at && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {t('PER', 'AS OF')} <strong className="text-[var(--text-secondary)]">{new Date(overview.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</strong>
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--accent)] text-white hover:opacity-90 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? t('MENYINTESIS...', 'SYNTHESIZING...') : t('SINTESIS ULANG', 'RE-SYNTHESIZE')}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <RefreshCw className="w-4 h-4 text-[var(--accent)] animate-spin" />
                <span>{t('Menganalisis feed pasar terkonsolidasi dengan AI...', 'Analyzing consolidated market feeds with Gemini...')}</span>
              </div>
            ) : overview ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-section-alt)] p-4 rounded border border-[var(--border-subtle)] font-sans">
                  {overview.summary}
                </p>

                {/* Key Macro Implications */}
                <div>
                  <h3 className="metadata-label text-[10px] text-[var(--text-muted)] mb-2.5">
                    {t('POIN STRATEGIS UTAMA:', 'KEY STRATEGIC TAKEAWAYS:')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {overview.key_implications.map((imp, idx) => (
                      <div key={idx} className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                        <span className="text-[var(--accent)] font-bold block mb-1 font-mono">0{idx + 1}.</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Sensitivity Matrix */}
                <div>
                  <h3 className="metadata-label text-[10px] text-[var(--text-muted)] mb-2.5">
                    {t('OUTLOOK ARAH ASET:', 'ASSET DIRECTIONAL OUTLOOK:')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {overview.affected_assets_outlook.map((out, idx) => {
                      const isBull = out.bias === 'BULLISH';
                      const isBear = out.bias === 'BEARISH';
                      return (
                        <div key={idx} className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)]">
                          <div className="flex items-center justify-between mb-1.5 font-mono">
                            <span className="font-bold text-[var(--text-primary)] text-xs">{out.asset}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isBull ? 'badge-bullish' : isBear ? 'badge-bearish' : 'badge-neutral'
                            }`}>
                              {out.bias}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{out.rationale}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Active Macro Themes & Transmission Mechanisms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Themes */}
            <div className="terminal-panel p-4">
              <div className="flex items-center gap-2 pb-2.5 border-b mb-3 font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="section-title text-xs text-[var(--text-primary)]">
                  {t('TEMA INSTITUSIONAL AKTIF', 'ACTIVE INSTITUTIONAL THEMES')} ({themes.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {themes.map(theme => (
                  <div key={theme.id} className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between font-mono">
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">{theme.title}</h4>
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        theme.sentiment === 'BULLISH' ? 'badge-bullish' : 'badge-neutral'
                      }`}>
                        {theme.sentiment}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">{theme.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                      <span>{t('PENDORONG:', 'DRIVER:')} {theme.driver || t('Katalis Makro', 'Macro Catalyst')}</span>
                      <span>•</span>
                      <span>{t('ASET:', 'ASSETS:')} {(theme.affected_assets || theme.primary_assets || []).join(', ') || 'Global'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission Mechanism & Sensitivity Matrix */}
            <div className="terminal-panel p-4">
              <div className="flex items-center gap-2 pb-2.5 border-b mb-3 font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="section-title text-xs text-[var(--text-primary)]">
                  {t('MATRIKS MEKANISME TRANSMISI MAKRO', 'MACRO TRANSMISSION MECHANISM MATRIX')}
                </h3>
              </div>

              <div className="space-y-2.5">
                {relationships.map((rel, idx) => (
                  <div key={idx} className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[var(--text-primary)]">{rel.driver}</span>
                      <span className="text-[var(--accent)] text-[10px]">
                        FX: {(rel.sensitive_currencies || []).join(', ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                      {rel.transmission_mechanism}
                    </p>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                      {t('Aset Utama:', 'Primary Assets:')} {(rel.primary_assets || []).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRAL BANK SPEECHES */}
      {activeTab === 'CENTRAL_BANK' && (
        <div className="space-y-4">
          <div className="terminal-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-xs bg-[var(--accent)]" />
                <div>
                  <h2 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
                    {t('INTELIJEN PIDATO & PERNYATAAN BANK SENTRAL', 'CENTRAL BANK SPEECH & STATEMENT INTELLIGENCE')}
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    {t(
                      'Analisis Pernyataan Terverifikasi: Hawkish / Dovish / Netral / Campuran • Selisih Panduan • Transmisi 5 Langkah',
                      'Grounded Statement Analysis: Hawkish / Dovish / Neutral / Mixed • Prior Statement Delta • 5-Step Transmission'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--bullish)]" />
                <span>{t('Feed Terverifikasi (FOMC, ECB, BoE, BoJ, RBA, SNB)', 'Verified Feeds (FOMC, ECB, BoE, BoJ, RBA, SNB)')}</span>
              </div>
            </div>

            <div className="space-y-4">
              {speeches.map(sp => (
                <div key={sp.id} className="p-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-3">
                  {/* Speech Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                        {sp.central_bank} ({sp.currency})
                      </span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{sp.speaker}</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">({sp.title})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${getToneBadge(sp.tone)}`}>
                        {sp.tone} {t('SIKAP', 'STANCE')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
                      <span>{new Date(sp.timestamp || sp.date_time_utc).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-[var(--text-secondary)]">{sp.source}</span>
                      <span>•</span>
                      <span className="text-[var(--bullish)] font-bold">{t('Keyakinan:', 'Conf:')} {sp.confidence}%</span>
                    </div>
                  </div>

                  {/* Prior Guidance Comparison */}
                  <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs">
                    <div className="metadata-label text-[10px] text-[var(--text-muted)] mb-1">
                      {t('KOMPARASI PANDUAN SEBELUMNYA:', 'PRIOR STATEMENT COMPARISON:')}
                    </div>
                    <p className="text-[var(--text-secondary)] leading-snug font-sans text-xs">{sp.previous_stance}</p>
                  </div>

                  {/* 5-Step Causal Framework */}
                  <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                      <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>{t('Alur Kausalitas Transmisi', 'Causal pipeline')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <div className="metadata-label text-[9px] text-[var(--accent)] mb-1">
                          {t('1. APA YANG DIKATAKAN', '1. WHAT WAS SAID')}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{sp.what_was_said}</p>
                      </div>

                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <div className="metadata-label text-[9px] text-[var(--text-primary)] mb-1">
                          {t('2. APA YANG BERUBAH', '2. WHAT CHANGED')}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{sp.what_changed}</p>
                      </div>

                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <div className="metadata-label text-[9px] text-[var(--text-secondary)] mb-1">
                          {t('3. MENGAPA PENTING', '3. WHY IT MATTERS')}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{sp.why_it_matters}</p>
                      </div>

                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <div className="metadata-label text-[9px] text-[var(--bullish)] mb-1">
                          {t('4. DAMPAK VALUTA', '4. CURRENCY IMPACT')}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{sp.currency_impact}</p>
                      </div>

                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <div className="metadata-label text-[9px] text-[var(--text-primary)] mb-1">
                          {t('5. RELEVANSI ASET', '5. ASSET RELEVANCE')}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-sans">{sp.asset_relevance}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation Provenance */}
                  <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="metadata-label text-[10px] text-[var(--text-muted)]">{t('SUMBER:', 'SOURCE:')}</span>
                      <span className="text-[var(--text-primary)] font-bold">{sp.source}</span>
                      <span>•</span>
                      <span className="metadata-label text-[10px] text-[var(--text-muted)]">{t('WAKTU:', 'TIMESTAMP:')}</span>
                      <span className="text-[var(--text-primary)]">{new Date(sp.timestamp || sp.date_time_utc).toISOString()}</span>
                      <span>•</span>
                      <span className="metadata-label text-[10px] text-[var(--text-muted)]">{t('KEYAKINAN:', 'CONFIDENCE:')}</span>
                      <span className="text-[var(--bullish)] font-bold">{sp.confidence}%</span>
                    </div>
                    <div className="text-[var(--text-muted)]">
                      <span className="metadata-label text-[10px] mr-1">{t('STATUS:', 'STATUS:')}</span>
                      <span className="text-[var(--bullish)] font-bold">{t('Ketat Terverifikasi', 'Strictly Grounded')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: G8 MACRO CURRENCY CONDITIONS */}
      {activeTab === 'MACRO_CONTEXT' && (
        <div className="space-y-4">
          <div className="terminal-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-xs bg-[var(--accent)]" />
                <div>
                  <h2 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
                    {t('KONTEKS MAKROEKONOMI MATA UANG G8', 'G8 CURRENCY MACRO ECONOMIC CONTEXT')}
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    {t(
                      'Status Langsung: KUAT / LEMAH / CAMPURAN • Terverifikasi oleh Inflasi + Tenaga Kerja + Pertumbuhan + PMI + Sikap Bank Sentral',
                      'Live Status: STRONG / WEAK / MIXED • Grounded by Inflation + Employment + Growth + PMI + Central Bank Tone'
                    )}
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-[var(--text-secondary)]">
                {t('VERIFIKASI:', 'VERIFICATION:')} <strong className="text-[var(--bullish)]">{t('Mesin Makro Terverifikasi', 'Grounded Macro Engine')}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {macroContexts.map(c => (
                <div key={c.currency} className="p-3.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-sm font-bold font-mono text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      {c.currency}
                    </span>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${getConditionBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Quantitative Economic Indicators */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('INFLASI (CPI):', 'INFLATION (CPI):')}</span>
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">{c.inflation.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('TENAGA KERJA:', 'EMPLOYMENT:')}</span>
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">{c.employment.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('PERTUMBUHAN PDB:', 'GDP GROWTH:')}</span>
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">{c.growth.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('AKTIVITAS / PMI:', 'PMI / ACTIVITY:')}</span>
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">{c.pmi.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('SUKU BUNGA KEBIJAKAN:', 'POLICY RATE:')}</span>
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">{c.interest_rate.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span>{t('SIKAP BANK SENTRAL:', 'CB TONE:')}</span>
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${getToneBadge(c.central_bank_tone.value)}`}>
                        {c.central_bank_tone.value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-muted)] pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                      <span>{t('SKOR KEKUATAN:', 'STRENGTH SCORE:')}</span>
                      <span className="text-[var(--text-primary)] font-bold tabular-nums">{c.score.toFixed(1)} / 10</span>
                    </div>
                  </div>

                  {/* Grounded Evidence Summary */}
                  <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <div className="metadata-label text-[9px] text-[var(--text-muted)] mb-1">{t('BUKTI EMPIRIS:', 'EMPIRICAL EVIDENCE:')}</div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">{c.evidence_summary}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1">
                    <span>{t('Sumber:', 'Source:')} {c.source}</span>
                    <span className="text-[var(--bullish)]">{t('Keyakinan:', 'Conf:')} {c.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNIFIED MARKET CONTEXT */}
      {activeTab === 'UNIFIED_CONTEXT' && (
        <div className="space-y-4">
          <div className="terminal-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-xs bg-[var(--accent)]" />
                <div>
                  <h2 className="section-title text-xs sm:text-sm text-[var(--text-primary)]">
                    {t('KONTEKS PASAR TERPADU MULTIMODAL', 'UNIFIED MULTIMODAL MARKET CONTEXT')}
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    {t(
                      'Sintesis Harmonis: Kawat Berita + Kalender Makro + Pidato Bank Sentral + Dispersi Valuta + Harga Langsung',
                      'Harmonized Synthesis: News Wire + Macro Calendar + Central Bank Speeches + Currency Dispersion + Live Prices'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--bullish)]" />
                <span>{t('KEYAKINAN:', 'CONFIDENCE:')} <strong className="text-[var(--text-primary)]">{unifiedContext?.confidence || 93}%</strong></span>
              </div>
            </div>

            {unifiedContext ? (
              <div className="space-y-4">
                {/* Executive Synthesis */}
                <div className="p-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs font-bold uppercase">
                    <span className="flex items-center gap-2 text-[var(--text-primary)]">
                      <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                      <span>{unifiedContext.regime}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[10px]">
                      {t('SENTIMEN:', 'SENTIMENT:')} {unifiedContext.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                    {unifiedContext.summary}
                  </p>
                </div>

                {/* 5 Pillars Summary */}
                <div>
                  <h3 className="metadata-label text-[10px] text-[var(--text-muted)] mb-2.5">
                    {t('INPUT INTELIJEN LIMA PILAR:', 'FIVE-PILLAR INTELLIGENCE INPUTS:')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans">
                      <span className="text-[var(--text-primary)] font-bold block mb-1 font-mono metadata-label">
                        {t('1. FEED KAWAT BERITA', '1. NEWS WIRE FEED')}
                      </span>
                      <span>{unifiedContext.pillars.news_wire_summary}</span>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans">
                      <span className="text-[var(--text-primary)] font-bold block mb-1 font-mono metadata-label">
                        {t('2. RILIS DATA MAKRO', '2. MACRO DATA RELEASE')}
                      </span>
                      <span>{unifiedContext.pillars.macro_data_summary}</span>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans">
                      <span className="text-[var(--text-primary)] font-bold block mb-1 font-mono metadata-label">
                        {t('3. PIDATO BANK SENTRAL', '3. CENTRAL BANK SPEECHES')}
                      </span>
                      <span>{unifiedContext.pillars.central_bank_summary}</span>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans">
                      <span className="text-[var(--text-primary)] font-bold block mb-1 font-mono metadata-label">
                        {t('4. KEKUATAN MATA UANG', '4. CURRENCY STRENGTH')}
                      </span>
                      <span>{unifiedContext.pillars.currency_strength_summary}</span>
                    </div>
                    <div className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-sans">
                      <span className="text-[var(--text-primary)] font-bold block mb-1 font-mono metadata-label">
                        {t('5. EKSEKUSI PASAR LANGSUNG', '5. LIVE MARKET EXECUTION')}
                      </span>
                      <span>{unifiedContext.pillars.market_data_summary}</span>
                    </div>
                  </div>
                </div>

                {/* Cross-Asset Directional Matrix */}
                <div>
                  <h3 className="metadata-label text-[10px] text-[var(--text-muted)] mb-2.5">
                    {t('OUTLOOK ARAH ASET & IMPLIKASI VS REAKSI:', 'ASSET DIRECTIONAL OUTLOOK & IMPLICATION VS REACTION:')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono">
                    {unifiedContext.asset_outlook.map((ca, idx) => {
                      const isBull = ca.bias === 'BULLISH';
                      const isBear = ca.bias === 'BEARISH';
                      return (
                        <div key={idx} className="p-3 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)] text-xs">{ca.asset}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isBull ? 'badge-bullish' : isBear ? 'badge-bearish' : 'badge-neutral'
                            }`}>
                              {ca.bias}
                            </span>
                          </div>
                          <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                            <strong className="metadata-label text-[9.5px] block text-[var(--accent)]">
                              {t('FUNDAMENTAL:', 'FUNDAMENTAL:')}
                            </strong>
                            {ca.fundamental_implication}
                          </div>
                          <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                            <strong className="metadata-label text-[9.5px] block text-[var(--text-primary)]">
                              {t('REAKSI AKTUAL:', 'ACTUAL REACTION:')}
                            </strong>
                            {ca.actual_market_reaction}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Explanation Provenance Box */}
                <div className="p-3 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[var(--text-secondary)] border-b pb-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {t('Penjelasan dan asal-usul intelijen', 'Explanation and provenance')}
                    </span>
                    <span className="text-[var(--bullish)] font-semibold tabular-nums">
                      {unifiedContext.confidence}% {t('keyakinan', 'confidence')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                        {t('WAKTU:', 'TIMESTAMP:')}
                      </span>
                      <span className="text-[var(--text-primary)]">{new Date(unifiedContext.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                        {t('STANDAR INTELIJEN:', 'INTELLIGENCE STANDARD:')}
                      </span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        {t('Verifikasi Ketat (Kuantitatif)', 'Strict Grounding (Quantitative Verification)')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-sans">
                    <strong className="font-mono metadata-label text-[10px] text-[var(--accent)] mr-1">
                      {t('RINGKASAN BUKTI:', 'EVIDENCE SUMMARY:')}
                    </strong>
                    {t(
                      'Data diverifikasi silang antara kalender makro, kawat berita, pidato bank sentral, dan kutipan harga pasar langsung. Sinyal yang bertentangan diklasifikasikan sebagai CAMPURAN (MIXED).',
                      'Data cross-verified across macro calendars, news wires, central bank speeches, and live market quotes. Conflicting signals are classified as MIXED.'
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-[var(--text-secondary)]">
                <RefreshCw className="w-4 h-4 text-[var(--accent)] animate-spin mx-auto mb-2" />
                <span>
                  {t(
                    'Mengumpulkan Berita, Makro, Pidato, Kekuatan Mata Uang, dan Feed Harga...',
                    'Aggregating News, Macro, Speeches, Currency Strength, and Price Feeds...'
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

AIIntelligenceView.displayName = 'AIIntelligenceView';
