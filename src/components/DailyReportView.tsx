import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Download,
  TrendingUp,
  Clock,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  BarChart3,
  Calendar,
  Compass,
  HelpCircle,
  Eye,
  Filter,
  BookOpen,
  CheckCircle2,
  XCircle,
  History,
  Archive,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  DailyMarketReportData,
  WeeklyMarketReportData,
  ExpectedVsActualItem,
  HistoricalMemoryAnalysis,
  ReportArchiveItem,
  EpistemicTag,
  MarketImpactLevel,
  User,
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from './shared/PageHeader';
import { LoadingState } from './shared/LoadingState';
import { EmptyState } from './shared/EmptyState';
import { NavTabId } from './Sidebar';

interface DailyReportViewProps {
  user?: User | null;
  onNavigateTab?: (tab: NavTabId) => void;
  onSelectSymbol?: (symbol: string) => void;
}

type IntelligenceTab = 'daily' | 'weekly' | 'expected_vs_actual' | 'memory' | 'archive';

export const DailyReportView: React.FC<DailyReportViewProps> = React.memo(({
  user,
  onNavigateTab,
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('daily');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [epistemicFilter, setEpistemicFilter] = useState<'ALL' | EpistemicTag>('ALL');

  // Daily report state
  const [dailyReport, setDailyReport] = useState<DailyMarketReportData | null>(null);
  const [dailyLoading, setDailyLoading] = useState<boolean>(true);
  const [dailyRefreshing, setDailyRefreshing] = useState<boolean>(false);

  // Weekly report state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyMarketReportData | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState<boolean>(false);
  const [weeklyRefreshing, setWeeklyRefreshing] = useState<boolean>(false);

  // Expected vs actual state
  const [evaItems, setEvaItems] = useState<ExpectedVsActualItem[]>([]);
  const [evaLoading, setEvaLoading] = useState<boolean>(false);
  const [evaCategoryFilter, setEvaCategoryFilter] = useState<string>('ALL');
  const [evaImpactFilter, setEvaImpactFilter] = useState<string>('ALL');

  // Historical memory state
  const [memoryData, setMemoryData] = useState<HistoricalMemoryAnalysis | null>(null);
  const [memoryLoading, setMemoryLoading] = useState<boolean>(false);

  // Archive state
  const [archiveList, setArchiveList] = useState<ReportArchiveItem[]>([]);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  // Feedback
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Daily Report
  const fetchDailyReport = useCallback(async (lang: 'id' | 'en', force = false) => {
    try {
      if (force) setDailyRefreshing(true);
      else setDailyLoading(true);

      const res = force
        ? await api.generateDailyReport(lang)
        : await api.getDailyReport(lang);

      if (res && res.report) {
        setDailyReport(res.report);
      }
    } catch (err: any) {
      console.error('Failed to load daily report:', err);
    } finally {
      setDailyLoading(false);
      setDailyRefreshing(false);
    }
  }, []);

  // Fetch Weekly Report
  const fetchWeeklyReport = useCallback(async (lang: 'id' | 'en', force = false) => {
    try {
      if (force) setWeeklyRefreshing(true);
      else setWeeklyLoading(true);

      const res = force
        ? await api.generateWeeklyReport(lang)
        : await api.getWeeklyReport(lang);

      if (res && res.report) {
        setWeeklyReport(res.report);
      }
    } catch (err: any) {
      console.error('Failed to load weekly report:', err);
    } finally {
      setWeeklyLoading(false);
      setWeeklyRefreshing(false);
    }
  }, []);

  // Fetch Expected vs Actual Matrix
  const fetchExpectedVsActual = useCallback(async () => {
    try {
      setEvaLoading(true);
      const res = await api.getExpectedVsActual(
        evaCategoryFilter === 'ALL' ? undefined : evaCategoryFilter,
        evaImpactFilter === 'ALL' ? undefined : evaImpactFilter
      );
      if (res && res.items) {
        setEvaItems(res.items);
      }
    } catch (err: any) {
      console.error('Failed to load expected vs actual:', err);
    } finally {
      setEvaLoading(false);
    }
  }, [evaCategoryFilter, evaImpactFilter]);

  // Fetch Historical Memory
  const fetchHistoricalMemory = useCallback(async () => {
    try {
      setMemoryLoading(true);
      const res = await api.getHistoricalMemory();
      if (res && res.analysis) {
        setMemoryData(res.analysis);
      }
    } catch (err: any) {
      console.error('Failed to load historical memory:', err);
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  // Fetch Archive
  const fetchArchive = useCallback(async () => {
    try {
      setArchiveLoading(true);
      const res = await api.getReportsArchive();
      if (res && res.archive) {
        setArchiveList(res.archive);
      }
    } catch (err: any) {
      console.error('Failed to load archive:', err);
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  // Load based on active tab
  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport(language);
    } else if (activeTab === 'weekly') {
      fetchWeeklyReport(language);
    } else if (activeTab === 'expected_vs_actual') {
      fetchExpectedVsActual();
    } else if (activeTab === 'memory') {
      fetchHistoricalMemory();
    } else if (activeTab === 'archive') {
      fetchArchive();
    }
  }, [activeTab, language, fetchDailyReport, fetchWeeklyReport, fetchExpectedVsActual, fetchHistoricalMemory, fetchArchive]);

  // Handle Tab Change
  const handleTabChange = (tab: IntelligenceTab) => {
    setActiveTab(tab);
  };

  // Toggle Language
  const handleToggleLang = (lang: 'id' | 'en') => {
    if (lang === language) return;
    setLanguage(lang);
  };

  // Refresh current view
  const handleRefresh = () => {
    if (activeTab === 'daily') {
      fetchDailyReport(language, true);
      setToastMessage(language === 'id' ? 'Menyintesis Laporan Harian terbaru dari telemetri pasar...' : 'Synthesizing latest Daily Report from live telemetry...');
    } else if (activeTab === 'weekly') {
      fetchWeeklyReport(language, true);
      setToastMessage(language === 'id' ? 'Menyintesis Laporan Mingguan dari agregasi database...' : 'Synthesizing Weekly Report from database aggregation...');
    } else if (activeTab === 'expected_vs_actual') {
      fetchExpectedVsActual();
      setToastMessage(language === 'id' ? 'Memperbarui database pembelajaran Ekspektasi vs Realita...' : 'Refreshing Expected vs Actual learning database...');
    } else if (activeTab === 'memory') {
      fetchHistoricalMemory();
      setToastMessage(language === 'id' ? 'Memperbarui analisis memori historis dan korelasi...' : 'Refreshing historical memory and correlations...');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy report summary to clipboard
  const handleCopyClipboard = () => {
    const isId = language === 'id';
    let text = '';

    if (activeTab === 'daily' && dailyReport) {
      text += `📊 *${dailyReport.title}*\n`;
      text += `📅 ${dailyReport.reportDate} | ⏱️ ${dailyReport.session}\n`;
      text += `🌐 Market Regime: ${dailyReport.overallMarketEnvironment.regime} (Risk Score: ${dailyReport.overallMarketEnvironment.riskScore}/100)\n\n`;
      text += `*--- ${isId ? 'RINGKASAN EKSEKUTIF' : 'EXECUTIVE SUMMARY'} ---*\n`;
      dailyReport.executiveSummary.forEach(s => {
        text += `[${s.tag}] ${s.text}\n\n`;
      });
      text += `*--- ${isId ? 'KATALIS PENGGERAK HARGA' : 'CATALYSTS THAT MOVED PRICE'} ---*\n`;
      dailyReport.catalystsThatActuallyMovedPrice.forEach(c => {
        text += `• ${c.headline} (${c.price_reaction_magnitude})\n  ${c.why_it_mattered_or_ignored}\n\n`;
      });
      text += `*--- ${isId ? 'BERITA TANPA DAMPAK SIGNIFIKAN' : 'NEWS WITH LITTLE OR NO IMPACT'} ---*\n`;
      dailyReport.importantNewsWithLittleOrNoImpact.forEach(n => {
        text += `• ${n.headline}\n  Alasan diabaikan: ${n.whyMarketIgnoredIt}\n\n`;
      });
      text += `\n_${isId ? 'Disintesis oleh Desk Market Intelligence • Bukan Sinyal Trading' : 'Synthesized by Market Intelligence Desk • Not Trading Signals'}_`;
    } else if (activeTab === 'weekly' && weeklyReport) {
      text += `📊 *${weeklyReport.title}*\n`;
      text += `📅 Minggu: ${weeklyReport.weekRange}\n`;
      text += `🌐 Rezim Pasar: ${weeklyReport.marketRegime.currentRegime}\n\n`;
      text += `*--- ${isId ? 'RINGKASAN MINGGUAN' : 'WEEKLY SUMMARY'} ---*\n`;
      weeklyReport.weeklyExecutiveSummary.forEach(s => {
        text += `[${s.tag}] ${s.text}\n\n`;
      });
      text += `*--- ${isId ? 'PELAJARAN PENTING MINGGU INI' : 'KEY LESSONS FROM THE WEEK'} ---*\n`;
      weeklyReport.keyLessonsFromWeek.forEach(l => {
        text += `• ${l}\n`;
      });
      text += `\n_${isId ? 'Disintesis oleh Desk Market Intelligence • Bukan Sinyal Trading' : 'Synthesized by Market Intelligence Desk • Not Trading Signals'}_`;
    }

    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        setToastMessage(isId ? 'Laporan intelijen berhasil disalin!' : 'Intelligence report copied to clipboard!');
        setTimeout(() => setToastMessage(null), 3000);
      });
    }
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!dailyReport && !weeklyReport) return;
    let md = '';

    if (activeTab === 'daily' && dailyReport) {
      md += `# ${dailyReport.title}\n\n`;
      md += `**Date:** ${dailyReport.reportDate}  \n`;
      md += `**Session:** ${dailyReport.session}  \n`;
      md += `**Market Regime:** ${dailyReport.overallMarketEnvironment.regime} (Risk Score: ${dailyReport.overallMarketEnvironment.riskScore}/100)  \n\n`;
      md += `> **Important Principle:** This report is NOT a trading signal generator. It provides objective causal market intelligence explaining what happened, why it happened, and which catalysts mattered.\n\n`;

      md += `## 1. Executive Summary\n\n`;
      dailyReport.executiveSummary.forEach(s => {
        md += `* **[${s.tag}]** ${s.text} *(Source: ${s.citation || 'Desk'})*\n\n`;
      });

      md += `## 2. Major Macro Catalysts\n\n`;
      dailyReport.majorMacroCatalysts.forEach(c => {
        md += `### ${c.catalyst} [${c.impact_level}]\n`;
        md += `- **Driver:** ${c.driver}\n`;
        md += `- **Transmission Channel:** ${c.transmission_channel}\n\n`;
      });

      md += `## 3. Catalysts That Actually Moved Price vs Noise Filter\n\n`;
      md += `### Catalysts That Actually Moved Price:\n`;
      dailyReport.catalystsThatActuallyMovedPrice.forEach(c => {
        md += `- **${c.headline}**: ${c.price_reaction_magnitude}. ${c.why_it_mattered_or_ignored}\n`;
      });
      md += `\n### Important News That Had Little or No Market Impact (Noise Filter):\n`;
      dailyReport.importantNewsWithLittleOrNoImpact.forEach(n => {
        md += `- **${n.headline}**: Retail expected impact, but market ignored it because: ${n.whyMarketIgnoredIt}\n`;
      });
      md += `\n## 4. Key Takeaways\n\n`;
      dailyReport.keyTakeaways.forEach(k => {
        md += `- ${k}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `market-intelligence-report-${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for epistemic badge
  const renderEpistemicBadge = (tag: EpistemicTag) => {
    switch (tag) {
      case 'FACT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/25">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {language === 'id' ? 'FAKTA' : 'FACT'}
          </span>
        );
      case 'REACTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/25">
            <Activity className="w-2.5 h-2.5" />
            {language === 'id' ? 'REAKSI PASAR' : 'REACTION'}
          </span>
        );
      case 'AI_INTERPRETATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)]">
            <Sparkles className="w-2.5 h-2.5" />
            {language === 'id' ? 'INTERPRETASI AI' : 'AI INTERPRETATION'}
          </span>
        );
      case 'UNCERTAINTY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]">
            <HelpCircle className="w-2.5 h-2.5" />
            {language === 'id' ? 'KETIDAKPASTIAN' : 'UNCERTAINTY'}
          </span>
        );
    }
  };

  // Helper for impact level badge
  const renderImpactBadge = (level: MarketImpactLevel) => {
    switch (level) {
      case 'HIGH_IMPACT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--bearish)] bg-[var(--bearish-bg)] border border-[var(--bearish-border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bearish)] animate-pulse"></span>
            HIGH IMPACT
          </span>
        );
      case 'MODERATE_IMPACT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]">
            MODERATE IMPACT
          </span>
        );
      case 'LOW_IMPACT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)]">
            LOW IMPACT
          </span>
        );
      case 'NO_SIGNIFICANT_REACTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[var(--text-muted)] bg-[var(--bg-section-alt)] border border-[var(--border-subtle)]">
            NO REACTION / NOISE
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="market-report-dossier-view">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-6 z-50 px-4 py-2.5 rounded-md shadow-lg text-xs font-medium flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
          >
            <Sparkles className="w-4 h-4 text-[var(--warning)]" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. UNIFIED PAGE HEADER & SUITE CONTROLS */}
      <section className="terminal-panel p-4 sm:p-5 border transition-colors">
        <PageHeader
          eyebrow="SURVEILLANCE · MARKET INTELLIGENCE"
          accentNote="CAUSAL TRANSMISSION DESK"
          title="Market Intelligence Reporting System"
          description={
            language === 'id'
              ? 'Transmisi makro kausal dan analisis epistemik multi-sesi. Mengisolasi katalis berdampak nyata dari kebisingan berita, membandingkan ekspektasi vs realita, dan menyimpan memori pola historis.'
              : 'Multi-session causal macro transmission and epistemic market intelligence. Separates real market-moving catalysts from media noise, compares expectation vs actual price reaction, and stores historical memory patterns.'
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Language Selector */}
              <div className="inline-flex rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] p-0.5">
                <button
                  onClick={() => handleToggleLang('id')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                    language === 'id'
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => handleToggleLang('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={dailyRefreshing || weeklyRefreshing}
                className="h-8 px-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Resynthesize latest data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dailyRefreshing || weeklyRefreshing ? 'animate-spin text-[var(--warning)]' : ''}`} />
                <span className="hidden sm:inline">{language === 'id' ? 'Perbarui' : 'Refresh'}</span>
              </button>

              {/* Copy Clipboard */}
              <button
                onClick={handleCopyClipboard}
                className="h-8 px-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Copy formatted summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--bullish)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
              </button>

              {/* Export Markdown */}
              <button
                onClick={handleExportMarkdown}
                className="h-8 px-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Download Markdown Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">.MD</span>
              </button>

              {/* Print */}
              <button
                onClick={() => window.print()}
                className="h-8 px-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Print / Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          }
        >
          {/* Subnavigation Segmented Bar */}
          <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleTabChange('daily')}
                className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'daily'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Laporan Harian (Daily)' : 'Daily Report'}</span>
              </button>

              <button
                onClick={() => handleTabChange('weekly')}
                className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Laporan Mingguan (Weekly)' : 'Weekly Report'}</span>
              </button>

              <button
                onClick={() => handleTabChange('expected_vs_actual')}
                className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'expected_vs_actual'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Ekspektasi vs Realita' : 'Expected vs Actual'}</span>
              </button>

              <button
                onClick={() => handleTabChange('memory')}
                className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'memory'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Memori Historis' : 'Historical Memory'}</span>
              </button>

              <button
                onClick={() => handleTabChange('archive')}
                className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'archive'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Arsip Laporan' : 'Reports Archive'}</span>
              </button>
            </div>

            {/* Epistemic Tag Filter */}
            {(activeTab === 'daily' || activeTab === 'weekly') && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="metadata-label text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  {language === 'id' ? 'EPISTEMIK:' : 'FILTER:'}
                </span>
                {(['ALL', 'FACT', 'REACTION', 'AI_INTERPRETATION', 'UNCERTAINTY'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setEpistemicFilter(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono transition cursor-pointer ${
                      epistemicFilter === t
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-section-alt)]'
                    }`}
                  >
                    {t === 'ALL' ? (language === 'id' ? 'SEMUA' : 'ALL') : t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PageHeader>
      </section>

      {/* 2. INSTITUTIONAL INTEGRITY PRINCIPLE BANNER */}
      <section className="terminal-panel-alt p-3.5 border-l-2 border-l-[var(--warning)] transition-colors">
        <div className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
          <ShieldAlert className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-[var(--text-primary)]">
              {language === 'id' ? 'Prinsip Integritas Desk:' : 'Desk Integrity Principle:'}
            </strong>{' '}
            {language === 'id'
              ? 'Laporan ini BUKAN generator sinyal trading (tidak ada perintah "BUY GOLD"). Sistem ini menyediakan intelijen kausal objektif untuk memahami apa yang terjadi, mengapa terjadi, dan katalis apa yang berpengaruh. Keputusan akhir sepenuhnya di tangan trader.'
              : 'This report is NOT a trading signal generator (no "BUY GOLD" orders). The system provides objective causal intelligence explaining what happened, why it happened, and which catalysts mattered. The trader makes the final decision.'}
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* TAB 1: DAILY REPORT */}
      {/* ============================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {dailyLoading && !dailyReport ? (
            <div className="py-12">
              <LoadingState
                variant="cards"
                count={3}
                message={language === 'id' ? 'Menyintesis laporan pasar harian...' : 'Synthesizing daily market intelligence report...'}
              />
            </div>
          ) : !dailyReport ? (
            <div className="py-8">
              <EmptyState
                icon={<FileText className="w-8 h-8 text-[var(--warning)]" />}
                title={language === 'id' ? 'Laporan Harian Belum Tersedia' : 'Daily Report Unavailable'}
                description={language === 'id' ? 'Tekan tombol Perbarui untuk membuat analisis intelijen hari ini.' : 'Press Refresh to synthesize today\'s intelligence analysis.'}
                action={{
                  label: language === 'id' ? 'Sintesis Sekarang' : 'Synthesize Now',
                  onClick: handleRefresh,
                }}
              />
            </div>
          ) : (
            <>
              {/* Daily Environment Barometer */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="metadata-label text-[10px] text-[var(--accent)]">
                        {dailyReport.session}
                      </span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {dailyReport.reportDate}
                      </span>
                    </div>
                    <h2 className="section-title text-lg sm:text-xl text-[var(--text-primary)] mt-1">
                      {dailyReport.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 self-start md:self-auto">
                    <div className="text-right">
                      <span className="metadata-label text-[9px] text-[var(--text-muted)] block">
                        {language === 'id' ? 'Skor Selera Risiko' : 'Risk Appetite Score'}
                      </span>
                      <div className="text-lg font-mono font-bold flex items-center justify-end gap-1 tabular-nums">
                        <span
                          className={
                            dailyReport.overallMarketEnvironment.riskScore > 0
                              ? 'text-[var(--bullish)]'
                              : dailyReport.overallMarketEnvironment.riskScore < 0
                              ? 'text-[var(--bearish)]'
                              : 'text-[var(--text-primary)]'
                          }
                        >
                          {dailyReport.overallMarketEnvironment.riskScore > 0 ? '+' : ''}
                          {dailyReport.overallMarketEnvironment.riskScore}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">/ 100</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[var(--border-subtle)]"></div>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider inline-block ${
                          dailyReport.overallMarketEnvironment.stance === 'RISK_ON'
                            ? 'text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)]'
                            : dailyReport.overallMarketEnvironment.stance === 'RISK_OFF'
                            ? 'text-[var(--bearish)] bg-[var(--bearish-bg)] border border-[var(--bearish-border)]'
                            : 'text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]'
                        }`}
                      >
                        {dailyReport.overallMarketEnvironment.regime}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  {dailyReport.overallMarketEnvironment.summary}
                </p>
              </div>

              {/* 1. Executive Summary with Epistemic Grounding */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? '1. Ringkasan Eksekutif (Epistemic Breakdown)' : '1. Executive Summary (Epistemic Breakdown)'}</span>
                  </h3>
                  <span className="metadata-label text-[10px] text-[var(--text-muted)]">
                    {language === 'id' ? 'Fakta · Reaksi · Interpretasi · Ketidakpastian' : 'Epistemic Classification'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dailyReport.executiveSummary
                    .filter(s => epistemicFilter === 'ALL' || s.tag === epistemicFilter)
                    .map((statement, idx) => (
                      <div
                        key={idx}
                        className="terminal-panel-alt p-3 sm:p-3.5 border space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          {renderEpistemicBadge(statement.tag)}
                          {statement.citation && (
                            <span className="text-[10px] text-[var(--text-muted)] italic font-mono">
                              {statement.citation}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-[var(--text-primary)] leading-relaxed font-normal">
                          {statement.text}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* 2. Catalysts That Actually Moved Price vs Noise Filter */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Catalysts that actually moved price */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[var(--bearish)]" />
                      <span>{language === 'id' ? 'Katalis Penggerak Harga Nyata' : 'Catalysts That Actually Moved Price'}</span>
                    </h3>
                    <span className="metadata-label text-[9px] text-[var(--bearish)]">
                      HIGH RELEVANCE
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {dailyReport.catalystsThatActuallyMovedPrice.map((cat, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">
                            {cat.headline}
                          </span>
                          {renderImpactBadge(cat.impact_level)}
                        </div>
                        <div className="text-[11px] font-mono font-medium text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)] px-2 py-0.5 rounded inline-block">
                          📊 {cat.price_reaction_magnitude}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {cat.why_it_mattered_or_ignored}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Noise filter - Important News with Little or No Impact */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[var(--text-muted)]" />
                      <span>{language === 'id' ? 'Berita Diabaikan Pasar (Noise Filter)' : 'Important News With Little/No Impact'}</span>
                    </h3>
                    <span className="metadata-label text-[9px] text-[var(--text-muted)]">
                      NOISE FILTER
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {dailyReport.importantNewsWithLittleOrNoImpact.map((item, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-secondary)]">
                            {item.headline}
                          </span>
                          <span className="metadata-label text-[9px] text-[var(--text-muted)] bg-[var(--bg-section-alt)] px-2 py-0.5 rounded border border-[var(--border-subtle)] whitespace-nowrap">
                            IGNORED BY DESK
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--warning)] bg-[var(--warning-bg)] p-2 rounded border border-[var(--warning-border)]">
                          <strong>{language === 'id' ? 'Ekspektasi Ritel:' : 'Retail Expectation:'}</strong> {item.expectedImpactByRetail}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          <strong className="text-[var(--text-primary)] font-semibold">{language === 'id' ? 'Mengapa Pasar Mengabaikannya:' : 'Why Market Ignored It:'}</strong> {item.whyMarketIgnoredIt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Asset Reactions Detail (XAUUSD, Indices, FX, Crypto) */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? '3. Reaksi Aset Utama (Asset Reaction Matrix)' : '3. Asset Reaction Matrix'}</span>
                  </h3>
                  <span className="metadata-label text-[10px] text-[var(--text-muted)] font-mono">
                    XAUUSD · US500 · DXY · BTC
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Gold Card */}
                  <div className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--warning)]"></span>
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">XAUUSD (Gold Spot)</span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)]">${dailyReport.assetReactions.xauusd.price.toLocaleString()}</span>
                        <span className={`ml-2 text-xs font-mono font-bold ${dailyReport.assetReactions.xauusd.change24hPct >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                          {dailyReport.assetReactions.xauusd.change24hPct >= 0 ? '+' : ''}{dailyReport.assetReactions.xauusd.change24hPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1.5 border-t border-[var(--border-hairline)] pt-2">
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Katalis Utama:' : 'Primary Catalyst:'}</strong> {dailyReport.assetReactions.xauusd.primaryCatalyst}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Transmisi Intermarket:' : 'Intermarket Linkage:'}</strong> {dailyReport.assetReactions.xauusd.intermarketLinkage}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Struktur Teknikal:' : 'Technical Structure:'}</strong> {dailyReport.assetReactions.xauusd.technicalStructure}</p>
                    </div>
                  </div>

                  {/* Major Indices Card */}
                  <div className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">S&P 500 & Nasdaq 100</span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)]">{dailyReport.assetReactions.majorIndices.sp500.price.toLocaleString()}</span>
                        <span className="ml-2 text-xs font-mono font-bold text-[var(--bullish)]">
                          +{dailyReport.assetReactions.majorIndices.sp500.change24hPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1.5 border-t border-[var(--border-hairline)] pt-2">
                      <p><strong className="text-[var(--text-primary)]">S&P 500:</strong> {dailyReport.assetReactions.majorIndices.sp500.analysis}</p>
                      <p><strong className="text-[var(--text-primary)]">Nasdaq:</strong> {dailyReport.assetReactions.majorIndices.nasdaq.analysis}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Partisipasi Pasar:' : 'Breadth:'}</strong> {dailyReport.assetReactions.majorIndices.breadthAndLeadership}</p>
                    </div>
                  </div>

                  {/* FX & DXY Card */}
                  <div className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">FX / Currency Strength (DXY)</span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)]">{dailyReport.assetReactions.fxCurrencyStrength.dxyIndex.price.toFixed(2)}</span>
                        <span className="ml-2 text-xs font-mono font-bold text-[var(--bearish)]">
                          {dailyReport.assetReactions.fxCurrencyStrength.dxyIndex.change24hPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1.5 border-t border-[var(--border-hairline)] pt-2">
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Mata Uang Terkuat:' : 'Top Gainer:'}</strong> {dailyReport.assetReactions.fxCurrencyStrength.topStrongest}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Mata Uang Terlemah:' : 'Top Laggard:'}</strong> {dailyReport.assetReactions.fxCurrencyStrength.topWeakest}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Divergensi Imbal Hasil:' : 'Yield Spread Divergence:'}</strong> {dailyReport.assetReactions.fxCurrencyStrength.relativeYieldDifferentials}</p>
                    </div>
                  </div>

                  {/* Crypto Card */}
                  <div className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">Crypto (BTC & Liquidity)</span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)]">${dailyReport.assetReactions.cryptoAnalysis.btcPrice.toLocaleString()}</span>
                        <span className="ml-2 text-xs font-mono font-bold text-[var(--bullish)]">
                          +{dailyReport.assetReactions.cryptoAnalysis.btcChange24hPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] space-y-1.5 border-t border-[var(--border-hairline)] pt-2">
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Arus ETF Institusional:' : 'Institutional ETF Flows:'}</strong> {dailyReport.assetReactions.cryptoAnalysis.etfInstitutionalFlow}</p>
                      <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Korelasi Likuiditas:' : 'Liquidity Correlation:'}</strong> {dailyReport.assetReactions.cryptoAnalysis.liquidityCorrelation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Session Recaps (Asia, London, New York) */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? '4. Rekap Sesi Perdagangan (Session Handover)' : '4. Trading Session Recaps'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Asia Session */}
                  <div className="terminal-panel-alt p-3.5 border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase">Asia / Tokyo Session</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">00:00 - 08:00 UTC</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {dailyReport.sessionRecaps.asia.sessionRangeSummary}
                    </p>
                    <div className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border-hairline)] pt-2">
                      <strong className="text-[var(--text-primary)]">Handover:</strong> {dailyReport.sessionRecaps.asia.handoverToLondon}
                    </div>
                  </div>

                  {/* London Session */}
                  <div className="terminal-panel-alt p-3.5 border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase">London / European Session</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">08:00 - 16:00 UTC</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {dailyReport.sessionRecaps.london.sessionRangeSummary}
                    </p>
                    <div className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border-hairline)] pt-2">
                      <strong className="text-[var(--text-primary)]">Handover:</strong> {dailyReport.sessionRecaps.london.handoverToNewYork}
                    </div>
                  </div>

                  {/* New York Session */}
                  <div className="terminal-panel-alt p-3.5 border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase">New York / Wall Street</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">13:30 - 21:00 UTC</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {dailyReport.sessionRecaps.newYork.sessionRangeSummary}
                    </p>
                    <div className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border-hairline)] pt-2">
                      <strong className="text-[var(--text-primary)]">Settlement:</strong> {dailyReport.sessionRecaps.newYork.dayEndSettlement}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Fundamental vs Price Action Relationship & What Changed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Fundamental vs Price Action */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Fundamental vs Aksi Harga' : 'Fundamental vs Price Action Relationship'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {dailyReport.fundamentalVsPriceActionRelationship.map((rel, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{rel.asset}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            rel.alignmentStatus === 'ALIGNED'
                              ? 'text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)]'
                              : 'text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]'
                          }`}>
                            {rel.alignmentStatus}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] space-y-1">
                          <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Narasi Makro:' : 'Macro Narrative:'}</strong> {rel.fundamentalNarrative}</p>
                          <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Aksi Harga Aktual:' : 'Actual Price:'}</strong> {rel.actualPriceBehavior}</p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] italic pt-1 border-t border-[var(--border-hairline)]">
                          {rel.inDepthExplanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What Changed During The Day */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Perubahan Selama Hari Ini (What Changed)' : 'What Changed During The Day'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {dailyReport.whatChangedDuringTheDay.map((shift, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-[var(--accent)]">{shift.timeframe}</span>
                          <span className="metadata-label text-[9px] text-[var(--text-muted)] bg-[var(--bg-section-alt)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            TRIGGER: {shift.catalystTrigger}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-hairline)]">
                            <span className="metadata-label text-[9px] text-[var(--bearish)] block">{language === 'id' ? 'Kondisi Sebelumnya' : 'Previous State'}</span>
                            <span className="text-[var(--text-secondary)]">{shift.previousState}</span>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-hairline)]">
                            <span className="metadata-label text-[9px] text-[var(--bullish)] block">{language === 'id' ? 'Kondisi Baru' : 'New State'}</span>
                            <span className="text-[var(--text-secondary)]">{shift.newState}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] pt-1">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Arti Bagi Trader:' : 'Trader Significance:'}</strong> {shift.traderSignificance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Key Support, Resistance & Liquidity Areas */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? '6. Area Support, Resistance & Likuiditas Kunci' : '6. Key Support, Resistance & Liquidity Areas'}</span>
                </h3>

                <div className="overflow-x-auto rounded border border-[var(--border-subtle)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-section-alt)] text-[var(--text-muted)] uppercase font-semibold border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="p-2.5 font-mono text-[10px]">{language === 'id' ? 'Aset' : 'Asset'}</th>
                        <th className="p-2.5 font-mono text-[10px]">{language === 'id' ? 'Harga Live' : 'Current'}</th>
                        <th className="p-2.5 font-mono text-[10px]">{language === 'id' ? 'Support Terdekat' : 'Immediate Support'}</th>
                        <th className="p-2.5 font-mono text-[10px]">{language === 'id' ? 'Resistensi Terdekat' : 'Immediate Resistance'}</th>
                        <th className="p-2.5 font-mono text-[10px]">{language === 'id' ? 'Area Pool Likuiditas' : 'Liquidity Pool Zones'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-primary)] font-mono tabular-nums">
                      {dailyReport.keySupportResistanceLiquidity.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-section-alt)] transition">
                          <td className="p-2.5 font-sans font-bold text-[var(--text-primary)]">
                            {item.asset}
                          </td>
                          <td className="p-2.5 font-bold text-[var(--accent)]">{item.currentPrice.toLocaleString()}</td>
                          <td className="p-2.5 text-[var(--bullish)]">{item.immediateSupport}</td>
                          <td className="p-2.5 text-[var(--bearish)]">{item.immediateResistance}</td>
                          <td className="p-2.5 font-sans text-[var(--text-secondary)]">{item.liquidityPoolZones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. Key Takeaways */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--warning)]" />
                  <span>{language === 'id' ? '7. Poin Penting Untuk Trader Intraday (Key Takeaways)' : '7. Key Takeaways for Intraday Traders'}</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-[13px] text-[var(--text-secondary)]">
                  {dailyReport.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[var(--bullish)] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WEEKLY REPORT */}
      {/* ============================================================== */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {weeklyLoading && !weeklyReport ? (
            <div className="py-12">
              <LoadingState
                variant="cards"
                count={3}
                message={language === 'id' ? 'Menyintesis laporan sintesis mingguan...' : 'Synthesizing weekly synthesis report...'}
              />
            </div>
          ) : !weeklyReport ? (
            <div className="py-8">
              <EmptyState
                icon={<Calendar className="w-8 h-8 text-[var(--warning)]" />}
                title={language === 'id' ? 'Laporan Mingguan Belum Tersedia' : 'Weekly Report Unavailable'}
                description={language === 'id' ? 'Tekan tombol Perbarui untuk membuat analisis intelijen mingguan.' : 'Press Refresh to synthesize this week\'s intelligence analysis.'}
                action={{
                  label: language === 'id' ? 'Sintesis Sekarang' : 'Synthesize Now',
                  onClick: handleRefresh,
                }}
              />
            </div>
          ) : (
            <>
              {/* Meta Header */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="metadata-label text-[10px] text-[var(--warning)]">
                        WEEK #{weeklyReport.weekNumber}
                      </span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {weeklyReport.weekRange}
                      </span>
                    </div>
                    <h2 className="section-title text-lg sm:text-xl text-[var(--text-primary)] mt-1">
                      {weeklyReport.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)]">
                      {weeklyReport.marketRegime.currentRegime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                  <div className="terminal-panel-alt p-3 border">
                    <span className="metadata-label text-[9px] text-[var(--text-muted)] block">{language === 'id' ? 'Laporan Diagregasi' : 'Reports Aggregated'}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{weeklyReport.aggregatedDailyCount} Sesi</span>
                  </div>
                  <div className="terminal-panel-alt p-3 border">
                    <span className="metadata-label text-[9px] text-[var(--text-muted)] block">{language === 'id' ? 'Return Emas Mingguan' : 'Gold Weekly Return'}</span>
                    <span className="text-sm font-bold text-[var(--bullish)] font-mono">+{weeklyReport.assetPerformance.xauusd.changePct}%</span>
                  </div>
                  <div className="terminal-panel-alt p-3 border">
                    <span className="metadata-label text-[9px] text-[var(--text-muted)] block">{language === 'id' ? 'Volatilitas VIX' : 'VIX Index'}</span>
                    <span className="text-sm font-bold text-[var(--accent)] font-mono">{weeklyReport.volatilityEnvironment.vixCurrent} ({weeklyReport.volatilityEnvironment.volatilityRegime})</span>
                  </div>
                  <div className="terminal-panel-alt p-3 border">
                    <span className="metadata-label text-[9px] text-[var(--text-muted)] block">{language === 'id' ? 'Stabilitas Rezim' : 'Regime Stability'}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{weeklyReport.marketRegime.regimeStability} ({weeklyReport.marketRegime.daysInCurrentRegime} Hari)</span>
                  </div>
                </div>
              </div>

              {/* 1. Weekly Executive Summary */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? '1. Ringkasan Eksekutif Mingguan' : '1. Weekly Executive Summary'}</span>
                </h3>

                <div className="space-y-2.5">
                  {weeklyReport.weeklyExecutiveSummary.map((s, idx) => (
                    <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-1.5">
                      <div className="flex items-center justify-between">
                        {renderEpistemicBadge(s.tag)}
                        {s.citation && <span className="text-[10px] text-[var(--text-muted)] italic font-mono">{s.citation}</span>}
                      </div>
                      <p className="text-xs sm:text-[13px] text-[var(--text-primary)] leading-relaxed">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Major Macro Themes & Biggest Catalysts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Themes */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Tema Makro Dominan Pekan Ini' : 'Major Macro Themes'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.majorMacroThemes.map((theme, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{theme.theme}</span>
                          <span className="metadata-label text-[9px] text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                            {theme.persistence}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {theme.narrative}
                        </p>
                        <div className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-hairline)]">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Dampak Lintas Aset:' : 'Cross-Asset Impact:'}</strong> {theme.crossAssetImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Catalysts with Strong Impact */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[var(--bearish)]" />
                    <span>{language === 'id' ? 'Katalis Berdampak Kuat Pekan Ini' : 'Catalysts With Strong Market Impact'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.catalystsWithStrongMarketImpact.map((cat, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{cat.catalyst}</span>
                          <span className="text-xs font-mono font-bold text-[var(--bullish)]">{cat.observedMagnitude}</span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] space-y-1">
                          <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Aset Terdampak:' : 'Impacted:'}</strong> {cat.assetImpacted}</p>
                          <p><strong className="text-[var(--text-primary)]">{language === 'id' ? 'Transmisi Kausal:' : 'Transmission:'}</strong> {cat.transmissionChannel}</p>
                        </div>
                        <div className="text-[11px] text-[var(--warning)] bg-[var(--warning-bg)] p-2 rounded border border-[var(--warning-border)]">
                          <strong>Takeaway:</strong> {cat.takeaway}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Currency Strength Changes & Asset Performance */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? 'Perubahan Kekuatan Mata Uang G8 (FX Strength Trajectory)' : 'FX / Currency Strength Changes'}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 tabular-nums">
                  {weeklyReport.assetPerformance.fxCurrencyStrengthChanges.map((curr, idx) => (
                    <div key={idx} className="terminal-panel-alt p-2.5 border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{curr.currency}</span>
                        <span className={`text-[11px] font-mono font-bold ${curr.weeklyDelta >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}>
                          {curr.weeklyDelta >= 0 ? '+' : ''}{curr.weeklyDelta.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Score: <span className="font-mono text-[var(--text-primary)] font-bold">{curr.endOfWeekScore.toFixed(1)}</span>
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate" title={curr.primaryMacroDriver}>
                        {curr.primaryMacroDriver}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recurring Market Patterns & Cross-Asset Relationships */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recurring Patterns */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Pola Pasar Berulang (Recurring Patterns)' : 'Recurring Market Patterns'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.recurringMarketPatterns.map((pat, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{pat.patternName}</span>
                          <span className="text-xs font-mono font-bold text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)] px-2 py-0.5 rounded">
                            Konfirmasi {pat.historicalConfirmationRate}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Konteks:' : 'Context:'}</strong> {pat.occurrenceContext}
                        </p>
                        <p className="text-xs text-[var(--accent)]">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Bukti Pekan Ini:' : 'This Week Evidence:'}</strong> {pat.thisWeekEvidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cross-Asset Relationships */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Hubungan Lintas Aset (Cross-Asset Relationships)' : 'Cross-Asset Relationships'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.crossAssetRelationships.map((rel, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{rel.pairOrRatio}</span>
                          <span className="metadata-label text-[9px] text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                            {rel.divergenceOrConfirmation}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] tabular-nums">
                          <div>Norm: <span className="font-mono text-[var(--text-muted)]">{rel.historicalCorrelation}</span></div>
                          <div>Observasi: <span className="font-mono text-[var(--text-primary)] font-bold">{rel.currentObservedBehavior}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Key Lessons From The Week */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--warning)]" />
                  <span>{language === 'id' ? 'Pelajaran Kunci Dari Pasar Pekan Ini (Key Lessons)' : 'Key Lessons From The Week'}</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-[13px] text-[var(--text-secondary)]">
                  {weeklyReport.keyLessonsFromWeek.map((lesson, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[var(--bullish)] shrink-0 mt-0.5" />
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 6. Next Week Watchlist & Upcoming Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Watchlist */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Watchlist Pekan Depan' : 'Next Week Watchlist'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.nextWeekWatchlist.map((item, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{item.asset}</span>
                          <span className="metadata-label text-[9px] text-[var(--warning)] bg-[var(--warning-bg)] px-2 py-0.5 rounded border border-[var(--warning-border)]">
                            {item.keyCatalystToWatch}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Tesis Makro:' : 'Thesis:'}</strong> {item.thesis}
                        </p>
                        <p className="text-[11px] text-[var(--bearish)]">
                          <strong>{language === 'id' ? 'Pemicu Invalidation:' : 'Invalidation:'}</strong> {item.invalidationTrigger}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming High Impact Events */}
                <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                  <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                    <span>{language === 'id' ? 'Peristiwa Mendatang Yang Perlu Dipantau' : 'Important Upcoming Events'}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {weeklyReport.importantUpcomingEvents.map((evt, idx) => (
                      <div key={idx} className="terminal-panel-alt p-3 sm:p-3.5 border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{evt.event_name}</span>
                          <span className="metadata-label text-[9px] text-[var(--bearish)] bg-[var(--bearish-bg)] px-2 py-0.5 rounded border border-[var(--bearish-border)]">
                            {evt.expectedImpact}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                          <span>{evt.date} · {evt.timeUtc}</span>
                          <span className="font-bold text-[var(--accent)]">{evt.currency}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Catatan Konsensus:' : 'What To Watch:'}</strong> {evt.consensusNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: EXPECTED VS ACTUAL */}
      {/* ============================================================== */}
      {activeTab === 'expected_vs_actual' && (
        <div className="space-y-4">
          <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="section-title text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? 'Basis Data Pembelajaran: Ekspektasi vs Realita' : 'Expected vs Actual Learning Database'}</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {language === 'id'
                    ? 'Melacak rantai kausal objektif: Ekspektasi → Peristiwa Aktual → Reaksi Pasar → Hasil Akhir.'
                    : 'Tracking the objective causal chain: Expectation → Actual Event → Market Reaction → Outcome.'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={evaCategoryFilter}
                  onChange={(e) => setEvaCategoryFilter(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-xs text-[var(--text-primary)] font-mono cursor-pointer"
                >
                  <option value="ALL">{language === 'id' ? 'Semua Kategori' : 'All Categories'}</option>
                  <option value="INFLATION">Inflation (CPI/PCE)</option>
                  <option value="CENTRAL_BANK">Central Bank (Fed/ECB/BoJ)</option>
                  <option value="EMPLOYMENT">Employment (NFP/Jobless)</option>
                  <option value="GROWTH">Growth & PMI</option>
                  <option value="GEOPOLITICS">Geopolitics</option>
                </select>

                <select
                  value={evaImpactFilter}
                  onChange={(e) => setEvaImpactFilter(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-xs text-[var(--text-primary)] font-mono cursor-pointer"
                >
                  <option value="ALL">{language === 'id' ? 'Semua Dampak' : 'All Impact Levels'}</option>
                  <option value="HIGH_IMPACT">High Impact</option>
                  <option value="MODERATE_IMPACT">Moderate Impact</option>
                  <option value="LOW_IMPACT">Low Impact</option>
                  <option value="NO_SIGNIFICANT_REACTION">No Reaction / Noise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matrix Cards */}
          <div className="space-y-3.5">
            {evaLoading ? (
              <div className="py-12">
                <LoadingState variant="cards" count={3} message={language === 'id' ? 'Memuat database pembelajaran...' : 'Loading matrix...'} />
              </div>
            ) : evaItems.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Compass className="w-8 h-8 text-[var(--text-muted)]" />}
                  title={language === 'id' ? 'Tidak Ada Catatan Skenario' : 'No Scenarios Found'}
                  description={language === 'id' ? 'Tidak ada catatan yang cocok dengan filter yang dipilih.' : 'No recorded scenarios match the current filters.'}
                />
              </div>
            ) : (
              evaItems.map((item) => (
                <div
                  key={item.id}
                  className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <span className="metadata-label text-[10px] text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                        {item.category}
                      </span>
                      <h3 className="section-title text-sm sm:text-base text-[var(--text-primary)]">
                        {item.event_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderImpactBadge(item.impact_level)}
                      <span className="text-xs text-[var(--text-muted)] font-mono">{item.date}</span>
                    </div>
                  </div>

                  {/* Step Flow: Expectation -> Event -> Market Reaction -> Outcome */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* 1. Expectation */}
                    <div className="terminal-panel-alt p-3 border space-y-1">
                      <div className="metadata-label text-[9px] text-[var(--warning)] block">
                        1. {language === 'id' ? 'Ekspektasi Pasar' : 'Market Expectation'}
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {item.expected_scenario}
                      </p>
                    </div>

                    {/* 2. Actual Event */}
                    <div className="terminal-panel-alt p-3 border space-y-1">
                      <div className="metadata-label text-[9px] text-sky-500 block">
                        2. {language === 'id' ? 'Peristiwa Aktual' : 'Actual Event'}
                      </div>
                      <p className="text-[var(--text-primary)] leading-relaxed font-semibold">
                        {item.actual_event}
                      </p>
                    </div>

                    {/* 3. Market Reaction */}
                    <div className="terminal-panel-alt p-3 border space-y-1">
                      <div className="metadata-label text-[9px] text-purple-400 block">
                        3. {language === 'id' ? 'Reaksi Harga & Yield' : 'Price & Yield Reaction'}
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {item.market_reaction}
                      </p>
                    </div>

                    {/* 4. Observed Outcome */}
                    <div className="terminal-panel-alt p-3 border space-y-1">
                      <div className="metadata-label text-[9px] text-[var(--bullish)] block">
                        4. {language === 'id' ? 'Hasil Akhir' : 'Observed Outcome'}
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {item.observed_outcome}
                      </p>
                    </div>
                  </div>

                  {/* Footer Lesson & Affected Assets */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-hairline)] text-xs">
                    <div className="text-[var(--text-secondary)] flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Pelajaran Historis:' : 'Historical Lesson:'}</strong> {item.historical_lesson}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <span className="metadata-label text-[9px] text-[var(--text-muted)]">{language === 'id' ? 'ASET:' : 'ASSETS:'}</span>
                      {item.assets_impacted.map((asset, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-section-alt)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: HISTORICAL MEMORY & RECURRING PATTERNS */}
      {/* ============================================================== */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-2">
            <h2 className="section-title text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--accent)]" />
              <span>{language === 'id' ? 'Memori Historis & Pola Pasar Berulang' : 'Historical Memory & Recurring Patterns'}</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {language === 'id'
                ? 'Mengidentifikasi katalis berulang, reaksi pasar serupa di masa lalu, dan transisi rezim makro dari waktu ke waktu.'
                : 'Identifying repeated catalysts, historical reactions to similar events, and macro regime transitions over time.'}
            </p>
          </div>

          {memoryLoading && !memoryData ? (
            <div className="py-12">
              <LoadingState variant="cards" count={3} message={language === 'id' ? 'Memuat memori historis...' : 'Loading historical memory...'} />
            </div>
          ) : !memoryData ? (
            <div className="py-8">
              <EmptyState
                icon={<History className="w-8 h-8 text-[var(--text-muted)]" />}
                title={language === 'id' ? 'Data Memori Historis Kosong' : 'No Historical Memory Records'}
                description={language === 'id' ? 'Tekan perbarui untuk memuat data intelijen historis.' : 'Press refresh to populate historical intelligence patterns.'}
                action={{
                  label: language === 'id' ? 'Perbarui Sekarang' : 'Refresh Now',
                  onClick: handleRefresh,
                }}
              />
            </div>
          ) : (
            <>
              {/* 1. Repeated Catalysts & Average Reaction */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--warning)]" />
                  <span>{language === 'id' ? 'Katalis Berulang & Rata-rata Reaksi Pasar' : 'Repeated Catalysts & Typical Reactions'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {memoryData.repeatedCatalysts.map((cat, idx) => (
                    <div key={idx} className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{cat.catalystName}</span>
                        <span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] px-2 py-0.5 rounded">
                          {cat.frequencyCount}x Teramati
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">{language === 'id' ? 'Rata-rata Reaksi:' : 'Average Reaction:'}</strong> {cat.averageMarketReaction}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--text-secondary)]">{language === 'id' ? 'Hasil Tipikal:' : 'Typical Outcome:'}</strong> {cat.typicalOutcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Repeated Market Reactions & Predictability */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? 'Reaksi Pasar Berulang & Skor Prediktabilitas' : 'Repeated Market Reactions'}</span>
                </h3>

                <div className="space-y-2.5">
                  {memoryData.repeatedMarketReactions.map((rec, idx) => (
                    <div key={idx} className="terminal-panel-alt p-3.5 sm:p-4 border space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)]">{rec.scenario}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)] px-2 py-0.5 rounded">
                            Prediktabilitas: {rec.predictabilityScore}%
                          </span>
                          <span className="text-xs font-mono text-[var(--text-muted)]">Freq: {rec.frequencyScore}</span>
                        </div>
                      </div>

                      <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        {rec.historicalReactions.map((r, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="text-[11px] text-[var(--warning)] italic pt-1 border-t border-[var(--border-hairline)]">
                        <strong>Disclaimer Risiko:</strong> {rec.riskDisclaimer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Market Regime Transitions Timeline */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? 'Linimasa Perubahan Rezim Pasar' : 'Market Regime Transitions Timeline'}</span>
                </h3>

                <div className="relative border-l border-[var(--border-subtle)] pl-4 sm:pl-6 space-y-5">
                  {memoryData.marketRegimeTransitions.map((trans, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <span className="absolute -left-[21px] sm:-left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-canvas)]"></span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--accent)]">{trans.date}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">({trans.durationDays} hari dalam rezim baru)</span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {trans.fromRegime} <span className="text-[var(--text-muted)]">→</span> <span className="text-[var(--bullish)]">{trans.toRegime}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Katalis Pemicu:</strong> {trans.triggeringCatalyst}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recurring Correlations Table */}
              <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-3.5">
                <h3 className="section-title text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                  <span>{language === 'id' ? 'Korelasi Lintas Aset Bergulir (30D vs Norm Historis)' : 'Recurring Cross-Asset Correlations'}</span>
                </h3>

                <div className="overflow-x-auto rounded border border-[var(--border-subtle)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-section-alt)] text-[var(--text-muted)] uppercase font-semibold border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="p-2.5 font-mono text-[10px]">Aset Pasangan</th>
                        <th className="p-2.5 font-mono text-[10px]">Korelasi 30D</th>
                        <th className="p-2.5 font-mono text-[10px]">Norm Historis</th>
                        <th className="p-2.5 font-mono text-[10px]">Status</th>
                        <th className="p-2.5 font-mono text-[10px]">Penjelasan Transmisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-primary)] font-mono tabular-nums">
                      {memoryData.recurringCorrelations.map((cor, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-section-alt)] transition">
                          <td className="p-2.5 font-sans font-bold text-[var(--text-primary)]">
                            {cor.assetA} <span className="text-[var(--text-muted)]">vs</span> {cor.assetB}
                          </td>
                          <td className="p-2.5 font-bold text-[var(--accent)]">{cor.rollingCorrelation30d}</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{cor.historicalNorm}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              cor.status === 'ALIGNED'
                                ? 'text-[var(--bullish)] bg-[var(--bullish-bg)] border border-[var(--bullish-border)]'
                                : 'text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]'
                            }`}>
                              {cor.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-[var(--text-secondary)] max-w-xs">{cor.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: ARCHIVE */}
      {/* ============================================================== */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="terminal-panel p-4 sm:p-5 border transition-colors space-y-2">
            <h2 className="section-title text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
              <Archive className="w-4 h-4 text-[var(--accent)]" />
              <span>{language === 'id' ? 'Arsip Laporan Pasar Historis' : 'Historical Reports Archive'}</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {language === 'id'
                ? 'Setiap Laporan Harian dan Laporan Mingguan disimpan otomatis ke dalam database platform untuk analisis jangka panjang.'
                : 'Every Daily and Weekly Report is automatically persisted to the institutional database for longitudinal analysis.'}
            </p>
          </div>

          {archiveLoading ? (
            <div className="py-12">
              <LoadingState variant="cards" count={3} message={language === 'id' ? 'Memuat arsip laporan...' : 'Loading archive...'} />
            </div>
          ) : archiveList.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Archive className="w-8 h-8 text-[var(--text-muted)]" />}
                title={language === 'id' ? 'Belum Ada Arsip Laporan' : 'No Archived Reports Found'}
                description={language === 'id' ? 'Laporan harian dan mingguan yang digenerate akan otomatis terdaftar di sini.' : 'Generated daily and weekly reports will automatically appear here.'}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {archiveList.map((item) => (
                <div
                  key={item.id}
                  className="terminal-panel p-4 border hover:border-[var(--border-strong)] transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      item.type === 'DAILY'
                        ? 'text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)]'
                        : 'text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)]'
                    }`}>
                      {item.type} REPORT
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {new Date(item.generatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="section-title text-sm text-[var(--text-primary)]">{item.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.dateOrWeek}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)] text-xs text-[var(--text-muted)]">
                    <span>Regime: <strong className="text-[var(--text-primary)]">{item.regime}</strong></span>
                    <button
                      onClick={() => {
                        if (item.type === 'DAILY') {
                          setActiveTab('daily');
                          fetchDailyReport(language, false);
                        } else {
                          setActiveTab('weekly');
                          fetchWeeklyReport(language, false);
                        }
                      }}
                      className="text-[var(--accent)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'id' ? 'Buka Laporan' : 'View Report'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
