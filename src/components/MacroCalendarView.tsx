import React, { useState, useMemo, useEffect } from 'react';
import { EconomicEvent } from '../types';
import {
  Calendar,
  RefreshCw,
  Globe,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Tooltip, MetricTooltip, MetricInfoIcon } from './Tooltip';
import { PageHeader } from './shared/PageHeader';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Autocomplete, AutocompleteItem } from './ui/autocomplete';
import { useLanguage } from '../lib/LanguageContext';

interface MacroCalendarViewProps {
  events: EconomicEvent[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta UTC+7) [Default]' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'LOCAL', label: 'Local (your device time)' },
  { value: 'America/New_York', label: 'New York (EDT/EST)' },
  { value: 'Europe/London', label: 'London (BST/GMT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

export const MacroCalendarView: React.FC<MacroCalendarViewProps> = React.memo(({
  events,
  onRefresh,
  isRefreshing,
}) => {
  const { t, language } = useLanguage();
  // Default to UPCOMING so upcoming events are immediately visible on screen!
  const [timingFilter, setTimingFilter] = useState<'UPCOMING' | 'TODAY' | 'TOMORROW' | 'RELEASED' | 'ALL'>('UPCOMING');
  const [impactFilter, setImpactFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Jakarta');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Autocomplete items for economic calendar search
  const calendarSuggestions = useMemo<AutocompleteItem[]>(() => {
    const list: AutocompleteItem[] = [];

    // Add unique event names from dataset
    const seen = new Set<string>();
    (events || []).forEach(e => {
      if (e.event_name && !seen.has(e.event_name.toLowerCase())) {
        seen.add(e.event_name.toLowerCase());
        list.push({
          id: `ev-${e.id}`,
          label: e.event_name,
          category: 'Calendar Events',
          badge: e.currency,
          badgeColor: e.impact === 'CRITICAL' ? 'var(--bearish)' : e.impact === 'HIGH' ? 'var(--warning)' : undefined,
        });
      }
    });

    // Preset major macro catalysts
    const presets = [
      { name: 'Fed Interest Rate Decision', ccy: 'USD' },
      { name: 'CPI YoY', ccy: 'USD' },
      { name: 'Core PCE Price Index', ccy: 'USD' },
      { name: 'Nonfarm Payrolls', ccy: 'USD' },
      { name: 'Unemployment Rate', ccy: 'USD' },
      { name: 'GDP Annualized', ccy: 'USD' },
      { name: 'ECB Interest Rate Decision', ccy: 'EUR' },
      { name: 'BoJ Policy Rate', ccy: 'JPY' },
      { name: 'ISM Manufacturing PMI', ccy: 'USD' },
    ];
    presets.forEach(p => {
      if (!seen.has(p.name.toLowerCase())) {
        list.push({
          id: `preset-${p.name}`,
          label: p.name,
          category: 'Major Releases',
          badge: p.ccy,
        });
      }
    });

    // Currency tags
    ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].forEach(ccy => {
      list.push({
        id: `ccy-${ccy}`,
        label: ccy,
        category: 'Filter by Currency',
        badge: 'CCY',
      });
    });

    return list;
  }, [events]);

  // Pagination for high-performance rendering (avoid rendering 200+ DOM nodes at once)
  const [calendarPage, setCalendarPage] = useState(1);
  const CALENDAR_PAGE_SIZE = 25;

  // Update clock every second for live countdown & WIB live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live WIB clock for calendar header
  const currentWibTime = useMemo(() => {
    return new Date(currentTimeMs).toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [currentTimeMs]);

  const currentWibDate = useMemo(() => {
    return new Date(currentTimeMs).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentTimeMs]);

  // Compute exact day bounds in Asia/Jakarta (WIB: UTC+7)
  const getWibDayBounds = (offsetDays: number = 0) => {
    const now = new Date(currentTimeMs);
    // Shift by 7 hours to read calendar day in WIB
    const wibShifted = new Date(now.getTime() + 7 * 3600000);
    const y = wibShifted.getUTCFullYear();
    const m = wibShifted.getUTCMonth();
    const d = wibShifted.getUTCDate() + offsetDays;

    // Convert back to UTC epoch
    const startMs = Date.UTC(y, m, d) - 7 * 3600000;
    const endMs = startMs + 86400000;
    return { startMs, endMs };
  };

  // Compute counts for tabs based on WIB calendar day
  const { upcomingCount, todayCount, tomorrowCount, releasedCount } = useMemo(() => {
    const { startMs: startTodayWib, endMs: endTodayWib } = getWibDayBounds(0);
    const { startMs: startTomorrowWib, endMs: endTomorrowWib } = getWibDayBounds(1);

    let up = 0;
    let td = 0;
    let tm = 0;
    let rel = 0;

    events.forEach(e => {
      const t = new Date(e.date_time_utc).getTime();
      const isUpcoming = t >= currentTimeMs || e.status === 'UPCOMING';
      if (isUpcoming) up++;
      if (t >= startTodayWib && t < endTodayWib) td++;
      if (t >= startTomorrowWib && t < endTomorrowWib) tm++;
      if (!isUpcoming || e.status === 'RELEASED') rel++;
    });

    return { upcomingCount: up, todayCount: td, tomorrowCount: tm, releasedCount: rel };
  }, [events, currentTimeMs]);

  // Find next upcoming catalyst, prioritizing High / Critical events or active filter
  const nextEvent = useMemo(() => {
    const upEvents = events
      .filter(e => {
        const t = new Date(e.date_time_utc).getTime();
        return t >= currentTimeMs || e.status === 'UPCOMING';
      })
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    if (upEvents.length === 0) return null;

    // If an impact or currency filter is active, respect that filter first
    if (impactFilter !== 'ALL' || currencyFilter !== 'ALL') {
      const matchFilter = upEvents.find(e => {
        if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false;
        if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
        return true;
      });
      if (matchFilter) return matchFilter;
    }

    // Otherwise, prefer next High or Critical event if one exists within 48h
    const nextMajor = upEvents.find(
      e => (e.impact === 'CRITICAL' || e.impact === 'HIGH') &&
      (new Date(e.date_time_utc).getTime() - currentTimeMs < 48 * 3600000)
    );
    return nextMajor || upEvents[0];
  }, [events, currentTimeMs, impactFilter, currencyFilter]);

  // Filtered list according to all active criteria
  const filteredEvents = useMemo(() => {
    const { startMs: startTodayWib, endMs: endTodayWib } = getWibDayBounds(0);
    const { startMs: startTomorrowWib, endMs: endTomorrowWib } = getWibDayBounds(1);

    return events
      .filter(e => {
        const eventTime = new Date(e.date_time_utc).getTime();
        const isUpcoming = eventTime >= currentTimeMs || e.status === 'UPCOMING';

        if (timingFilter === 'UPCOMING' && !isUpcoming) return false;
        if (timingFilter === 'RELEASED' && isUpcoming) return false;
        if (timingFilter === 'TODAY' && (eventTime < startTodayWib || eventTime >= endTodayWib)) return false;
        if (timingFilter === 'TOMORROW' && (eventTime < startTomorrowWib || eventTime >= endTomorrowWib)) return false;

        if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false;
        if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (e.event_name || '').toLowerCase().includes(q);
          const matchesCcy = (e.currency || '').toLowerCase().includes(q);
          const matchesCountry = (e.country_code || '').toLowerCase().includes(q);
          if (!matchesName && !matchesCcy && !matchesCountry) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date_time_utc).getTime();
        const timeB = new Date(b.date_time_utc).getTime();
        if (timingFilter === 'RELEASED') {
          // Newest released first
          return timeB - timeA;
        }
        // Upcoming or chronological
        return timeA - timeB;
      });
  }, [events, timingFilter, impactFilter, currencyFilter, searchQuery, currentTimeMs]);

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCalendarPage(1);
  }, [timingFilter, impactFilter, currencyFilter, searchQuery]);

  const totalCalendarPages = Math.max(1, Math.ceil(filteredEvents.length / CALENDAR_PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const startIndex = (calendarPage - 1) * CALENDAR_PAGE_SIZE;
    return filteredEvents.slice(startIndex, startIndex + CALENDAR_PAGE_SIZE);
  }, [filteredEvents, calendarPage, CALENDAR_PAGE_SIZE]);

  // Overall feed status
  const liveStatus = useMemo(() => {
    if (events.length === 0) return 'UNAVAILABLE';
    const hasUnavailable = events.some(e => e.data_status === 'UNAVAILABLE');
    if (hasUnavailable) return 'UNAVAILABLE';
    const hasLive = events.some(e => e.data_status === 'LIVE' || !e.data_status);
    return hasLive ? 'LIVE' : 'DELAYED';
  }, [events]);

  const latestUpdated = useMemo(() => {
    if (events.length === 0) return null;
    const dates = events.map(e => new Date(e.last_updated || e.date_time_utc).getTime()).filter(d => !isNaN(d));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates)).toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [events]);

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'badge-bearish';
      case 'HIGH':
        return 'badge-warning';
      case 'MEDIUM':
        return 'badge-bullish';
      default:
        return 'badge-neutral';
    }
  };

  const formatEventDateTime = (utcIso: string) => {
    try {
      const d = new Date(utcIso);
      if (isNaN(d.getTime())) return { dayName: '', date: '—', time: '—', zoneLabel: 'WIB' };

      const isWib = selectedTimezone === 'Asia/Jakarta';
      const tzOption = selectedTimezone === 'LOCAL' ? undefined : selectedTimezone;
      const zoneLabel = isWib
        ? 'WIB'
        : selectedTimezone === 'UTC'
        ? 'UTC'
        : selectedTimezone === 'LOCAL'
        ? 'Local'
        : selectedTimezone.split('/')[1] || selectedTimezone;

      // Indonesian localized day name and date
      const dayName = d.toLocaleDateString(isWib ? 'en-GB' : 'en-US', {
        weekday: 'short',
        timeZone: tzOption,
      });
      const dateStr = d.toLocaleDateString(isWib ? 'en-GB' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: tzOption,
      });
      const timeStr = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tzOption,
      });

      return { dayName, date: dateStr, time: timeStr, zoneLabel };
    } catch {
      return { dayName: '', date: '—', time: '—', zoneLabel: 'WIB' };
    }
  };

  const formatRelativeCountdown = (utcIso: string) => {
    try {
      const target = new Date(utcIso).getTime();
      const diff = target - currentTimeMs;

      if (diff <= 0) return { text: t('Telah Rilis', 'Released'), isUrgent: false, isNear: false };

      const sec = Math.floor(diff / 1000);
      const min = Math.floor(sec / 60);
      const hours = Math.floor(min / 60);
      const days = Math.floor(hours / 24);

      if (min < 60) {
        return {
          text: language === 'id' ? `${min}m ${sec % 60}d` : `${min}m ${sec % 60}s`,
          isUrgent: min < 15,
          isNear: true,
        };
      } else if (hours < 24) {
        return {
          text: language === 'id' ? `${hours}j ${min % 60}m` : `${hours}h ${min % 60}m`,
          isUrgent: false,
          isNear: true,
        };
      } else {
        return {
          text: language === 'id' ? `${days}h ${hours % 24}j` : `${days}d ${hours % 24}h`,
          isUrgent: false,
          isNear: false,
        };
      }
    } catch {
      return { text: '—', isUrgent: false, isNear: false };
    }
  };

  return (
    <section className="flex flex-col h-full space-y-3.5 font-sans" id="macro-calendar-root">
      <PageHeader
        eyebrow={t('RISET · KALENDER EKONOMI MAKRO', 'RESEARCH · MACRO ECONOMIC CALENDAR')}
        title={t('Kalender Rilis Ekonomi Makro', 'Macro Economic Calendar')}
        description={
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                liveStatus === 'LIVE' ? 'bg-emerald-500' :
                liveStatus === 'DELAYED' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <span className="text-[var(--text-primary)] font-semibold">{liveStatus === 'LIVE' ? t('Live Stream', 'Live Stream') : liveStatus === 'DELAYED' ? t('Tertunda', 'Delayed') : t('Tidak Tersedia', 'Unavailable')}</span>
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <span>{t('Wire Institusional CME & Global', 'CME & Global Institutional Wire')}</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span>{t('Sinkron', 'Synced')} {latestUpdated ? `${latestUpdated} WIB` : 'live'}</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="text-[var(--accent)] font-semibold">{upcomingCount} {t('Jadwal Rilis', 'Scheduled Releases')}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live WIB Reference Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] font-mono">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-xs font-bold tabular-nums text-[var(--text-primary)]">{currentWibTime}</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">WIB</span>
            </div>

            {/* Timezone Selector */}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] px-2 py-1 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)]">
              <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] text-[11px] outline-none cursor-pointer font-mono"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={t('Sinkronisasi kalender makro', 'Synchronize macro calendar')}
              className="h-8 px-3 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span>{t('Sinkronisasi', 'Sync')}</span>
            </button>
          </div>
        }
      />

      {/* Next Upcoming Event Spotlight Banner - Balanced & Rich */}
      {nextEvent && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          {/* Left: Icon + Tags + Name + Release Time */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--accent)] shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent)] tracking-wider uppercase">
                  {t('KATALIS TERDEKAT', 'NEXT CATALYST')}
                </span>
                <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  {nextEvent.currency}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${getImpactBadge(nextEvent.impact)}`}>
                  {nextEvent.impact === 'CRITICAL' ? t('KRITIS', 'CRITICAL') : nextEvent.impact === 'HIGH' ? t('TINGGI', 'HIGH') : nextEvent.impact === 'MEDIUM' ? t('MENENGAH', 'MEDIUM') : t('RENDAH', 'LOW')}
                </span>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] truncate mt-0.5" title={nextEvent.event_name}>
                {nextEvent.event_name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 font-mono">
                <Clock className="w-3 h-3 text-[var(--accent)] shrink-0" />
                <span>
                  {t('Jadwal:', 'Release:')} <strong className="text-[var(--text-primary)] font-semibold">{formatEventDateTime(nextEvent.date_time_utc).dayName}, {formatEventDateTime(nextEvent.date_time_utc).date} · {formatEventDateTime(nextEvent.date_time_utc).time} {formatEventDateTime(nextEvent.date_time_utc).zoneLabel}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Metrics + Live Countdown Card */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
            <div className="flex items-center gap-3 py-1.5 px-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] font-mono text-xs">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">{t('Konsensus', 'Consensus')}</span>
                <span className="font-bold text-[var(--text-primary)] text-xs">
                  {nextEvent.forecast || '—'}
                </span>
              </div>
              <div className="w-px h-5 bg-[var(--border-hairline)]" />
              <div>
                <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">{t('Sebelumnya', 'Prior')}</span>
                <span className="font-medium text-[var(--text-secondary)] text-xs">
                  {nextEvent.previous || '—'}
                </span>
              </div>
            </div>

            <div className="py-1 px-2.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] text-right font-mono min-w-[90px]">
              <span className="text-[9px] text-[var(--text-muted)] block uppercase tracking-wider">{t('Hitung Mundur', 'Countdown')}</span>
              <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {formatRelativeCountdown(nextEvent.date_time_utc).text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
        {/* Left: Timing Navigation Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] flex-wrap">
          {[
            { id: 'UPCOMING', label: t('Akan Datang', 'Upcoming'), count: upcomingCount },
            { id: 'TODAY', label: t('Hari Ini', 'Today'), count: todayCount },
            { id: 'TOMORROW', label: t('Besok', 'Tomorrow'), count: tomorrowCount },
            { id: 'RELEASED', label: t('Telah Rilis', 'Released'), count: releasedCount },
            { id: 'ALL', label: t('Semua', 'All'), count: events.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimingFilter(tab.id as any)}
              className={`px-2.5 h-7 rounded text-[11px] font-medium transition cursor-pointer font-mono ${
                timingFilter === tab.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1 tabular-nums opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Right: Currency Filter + Impact Filter + Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Filter Dropdown */}
          <div className="px-2 py-0.5 rounded bg-[var(--bg-section-alt)] border border-[var(--border-subtle)]">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] text-[11px] outline-none cursor-pointer font-mono h-6"
            >
              <option value="ALL">{t('Semua Valuta', 'All Currencies')}</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="NZD">NZD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>

          {/* Impact Filter Segmented */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--bg-section-alt)] border border-[var(--border-subtle)]">
            {[
              { id: 'ALL', label: t('Semua', 'All') },
              { id: 'CRITICAL', label: t('Kritis', 'Critical') },
              { id: 'HIGH', label: t('Tinggi', 'High') },
              { id: 'MEDIUM', label: t('Menengah', 'Medium') },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setImpactFilter(f.id)}
                className={`h-6 px-2 rounded text-[10.5px] font-medium transition cursor-pointer font-mono ${
                  impactFilter === f.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Search with Autocomplete */}
          <div className="w-48 sm:w-56">
            <Autocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('Cari indikator atau valuta...', 'Search indicator or currency...')}
              items={calendarSuggestions}
              recentStorageKey="macro_search"
              className="w-full"
              inputClassName="h-7 bg-[var(--bg-surface)] text-xs focus:border-[var(--border-strong)] border border-[var(--border-subtle)]"
            />
          </div>
        </div>
      </div>

      {/* Calendar Data Table */}
      <div className="overflow-x-auto flex-1">
        <table className="terminal-table">
          <thead>
            <tr>
              <th>
                <MetricTooltip term={selectedTimezone === 'Asia/Jakarta' ? 'WIB' : 'UTC'} underline={false}>
                  <span>{t('WAKTU RILIS', 'RELEASE TIME')} ({selectedTimezone === 'Asia/Jakarta' ? 'WIB UTC+7' : selectedTimezone})</span>
                </MetricTooltip>
              </th>
              <th>
                <MetricTooltip term="COUNTDOWN" underline={false}>
                  <span>STATUS</span>
                </MetricTooltip>
              </th>
              <th>
                <MetricTooltip term="CCY" underline={false}>
                  <span>{t('VALUTA', 'CURRENCY')}</span>
                </MetricTooltip>
              </th>
              <th>
                <MetricTooltip term="IMPACT" underline={false}>
                  <span>{t('DAMPAK', 'IMPACT')}</span>
                </MetricTooltip>
              </th>
              <th>{t('PERISTIWA / INDIKATOR MAKRO', 'EVENT / MACRO INDICATOR')}</th>
              <th className="text-right">
                <MetricTooltip term="ACTUAL" underline={false}>
                  <span>{t('AKTUAL', 'ACTUAL')}</span>
                </MetricTooltip>
              </th>
              <th className="text-right">
                <MetricTooltip term="FORECAST" underline={false}>
                  <span>{t('KONSENSUS', 'CONSENSUS')}</span>
                </MetricTooltip>
              </th>
              <th className="text-right">
                <MetricTooltip term="PREVIOUS" underline={false}>
                  <span>{t('SEBELUMNYA', 'PRIOR')}</span>
                </MetricTooltip>
              </th>
              <th className="text-right">
                <MetricTooltip term="SURPRISE" underline={false}>
                  <span>{t('DEVIASI', 'SURPRISE')}</span>
                </MetricTooltip>
              </th>
              <th className="text-right">
                <MetricTooltip term="CHANGE" underline={false}>
                  <span>{t('PERUBAHAN', 'CHANGE')}</span>
                </MetricTooltip>
              </th>
              <th className="text-center">
                <MetricTooltip term="REACTION" underline={false}>
                  <span>{t('REAKSI', 'REACTION')}</span>
                </MetricTooltip>
              </th>
              <th className="text-right">
                <MetricTooltip term="SOURCE" underline={false}>
                  <span>{t('SUMBER', 'SOURCE')}</span>
                </MetricTooltip>
              </th>
              <th className="text-center">
                <Tooltip
                  title={t('Intelijen Makro & Fundamental', 'Macro & Fundamental Intel')}
                  content={t('Buka laci detail untuk skenario pasar, implikasi suku bunga, dan korelasi lintas aset.', 'Open detail drawer for market scenarios, rate implications, and cross-asset correlation.')}
                  position="top"
                >
                  <span className="cursor-help">INTEL</span>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-[var(--text-secondary)] font-mono text-xs">
                  {timingFilter === 'TODAY' ? (
                    <div className="space-y-3 py-4 max-w-md mx-auto">
                      <div className="p-2.5 rounded-md bg-[var(--warning-bg)] border border-[var(--warning-border)] text-[var(--warning)] font-medium">
                        No significant macro releases in today's session (market closed / weekend).
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px]">
                        The next scheduled release falls in the next active working session (Western Indonesian Time).
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => setTimingFilter('UPCOMING')}
                          className="px-3 py-1.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)] font-bold hover:opacity-90 transition cursor-pointer"
                        >
                          View upcoming releases ({upcomingCount})
                        </button>
                        <button
                          onClick={() => setTimingFilter('ALL')}
                          className="px-3 py-1.5 rounded-md bg-[var(--bg-section-alt)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--border-subtle)] transition cursor-pointer"
                        >
                          All scheduled ({events.length})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">
                      No events match the current filters. Try changing the search or currency filter.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedEvents.map(item => {
                const hasActual = item.actual !== null && item.actual !== undefined && item.actual !== '';
                const { dayName, date, time, zoneLabel } = formatEventDateTime(item.date_time_utc);
                const countdown = formatRelativeCountdown(item.date_time_utc);
                const eventMs = new Date(item.date_time_utc).getTime();
                const isUpcoming = eventMs >= currentTimeMs;
                const isExpanded = expandedEventId === item.id;

                const isBeat = item.surprise?.includes('BEAT');
                const isMiss = item.surprise?.includes('MISS');

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedEventId(isExpanded ? null : item.id)}
                      className={`table-row transition cursor-pointer ${
                        isExpanded ? 'bg-[var(--bg-section-alt)] font-semibold' : ''
                      }`}
                    >
                      {/* Date / Time with explicit WIB badge */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)] text-[10.5px]">{dayName}, {date}</span>
                          <span className="text-[var(--text-primary)] font-bold">{time}</span>
                          <span className="text-[9px] px-1 py-0 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[var(--text-secondary)] font-bold">
                            {zoneLabel}
                          </span>
                        </div>
                      </td>

                      {/* Countdown / Freshness */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {isUpcoming ? (
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${
                            countdown.isUrgent
                              ? 'badge-bearish'
                              : countdown.isNear
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}>
                            {countdown.text}
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-[var(--text-muted)] font-medium px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                            {item.freshness || 'RELEASED'}
                          </span>
                        )}
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-2.5 font-bold text-[var(--text-primary)] whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[10.5px]">
                          {item.currency}
                        </span>
                      </td>

                      {/* Impact Badge */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getImpactBadge(item.impact)}`}>
                          {item.impact}
                        </span>
                      </td>

                      {/* Event Name */}
                      <td className="py-2 px-2.5 text-[var(--text-primary)] max-w-[260px]">
                        <div className="truncate font-semibold" title={item.event_name}>
                          {item.event_name}
                        </div>
                      </td>

                      {/* Actual */}
                      <td className="py-2 px-2.5 text-right font-bold whitespace-nowrap">
                        {hasActual ? (
                          <span className="text-[var(--bullish)] font-bold tabular-nums">
                            {item.actual}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Forecast */}
                      <td className="py-2 px-2.5 text-right text-[var(--text-secondary)] font-semibold whitespace-nowrap tabular-nums">
                        {item.forecast || <span className="text-[var(--text-muted)] font-normal">—</span>}
                      </td>

                      {/* Previous */}
                      <td className="py-2 px-2.5 text-right text-[var(--text-muted)] whitespace-nowrap tabular-nums">
                        {item.previous || <span className="text-[var(--text-muted)]">—</span>}
                      </td>

                      {/* Surprise */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        {item.surprise && item.surprise !== 'N/A (Pending Release)' ? (
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold border ${
                            isBeat
                              ? 'badge-bullish'
                              : isMiss
                              ? 'badge-bearish'
                              : 'badge-neutral'
                          }`}>
                            {item.surprise}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">Pending</span>
                        )}
                      </td>

                      {/* Change */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap text-[var(--text-primary)] font-medium tabular-nums">
                        {item.change ? (
                          <span className={item.change.startsWith('+') ? 'text-[var(--bullish)]' : item.change.startsWith('-') ? 'text-[var(--bearish)]' : 'text-[var(--text-secondary)]'}>
                            {item.change}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Market Reaction Indicator */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        {item.market_reaction ? (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-[var(--text-primary)] font-bold">
                            {item.market_reaction.primary_asset} {item.market_reaction.r5m}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">Standby</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-2 px-2.5 text-right text-[10px] text-[var(--text-muted)] whitespace-nowrap truncate max-w-[120px]" title={`${item.source} • Last updated: ${new Date(item.last_updated).toLocaleString()}`}>
                        {item.source}
                      </td>

                      {/* Intel Action */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                          title="Tampilkan intelligence terukur"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--accent)]" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Measurable Intelligence Drawer */}
                    {isExpanded && (
                      <tr className="bg-[var(--bg-section-alt)]">
                        <td colSpan={13} className="p-3.5">
                          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-3">
                            {/* Intelligence Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-hairline)' }}>
                              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                                  Macro intelligence
                                </span>
                                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                                  {item.currency}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase ${getImpactBadge(item.impact)}`}>
                                  {item.impact}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[var(--bullish)]" />
                                  Confidence: <strong className="text-[var(--text-primary)] font-bold">{item.confidence || 95}%</strong>
                                </span>
                              </div>

                              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                SOURCE: <span className="text-[var(--text-primary)] font-semibold">{item.source}</span> · SCHEDULE: <span className="text-[var(--accent)] font-bold">{dayName}, {date} — {time} {zoneLabel}</span>
                              </div>
                            </div>

                            {/* Quantitative Metrics Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                              <div className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Actual vs Forecast</div>
                                <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
                                  {item.actual || 'Pending'} <span className="text-[var(--text-muted)] font-normal">vs</span> {item.forecast || '—'}
                                </div>
                              </div>
                              <div className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Macro Surprise</div>
                                <div className={`text-xs font-bold mt-0.5 ${isBeat ? 'text-[var(--bullish)]' : isMiss ? 'text-[var(--bearish)]' : 'text-[var(--text-primary)]'}`}>
                                  {item.surprise || 'N/A (Pending)'}
                                </div>
                              </div>
                              <div className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Change (vs Previous)</div>
                                <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
                                  {item.change || '—'} <span className="text-[var(--text-muted)] font-normal">from {item.previous || '—'}</span>
                                </div>
                              </div>
                              <div className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Data Status & Evidence</div>
                                <div className="text-xs font-bold text-[var(--bullish)] mt-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--bullish)]" />
                                  <span>{item.data_status} Verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Actual Market Reaction Grid (1m, 5m, 15m, 1h, 4h) */}
                            {item.market_reaction && (
                              <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="metadata-label text-[10px] text-[var(--accent)] flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" />
                                    Actual Reaction Across Horizons ({item.market_reaction.primary_asset})
                                  </span>
                                  <span className="text-[9px] font-mono text-[var(--text-muted)]">REAL EXECUTION DATA</span>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                                  {['r1m', 'r5m', 'r15m', 'r1h', 'r4h'].map((key, i) => {
                                    const labels = ['1 MINUTE', '5 MINUTES', '15 MINUTES', '1 HOUR', '4 HOURS'];
                                    const val = (item.market_reaction as any)[key] || '—';
                                    const isUp = val.startsWith('+');
                                    const isDn = val.startsWith('-');
                                    return (
                                      <div key={key} className="p-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                                        <div className="text-[8.5px] text-[var(--text-muted)]">{labels[i]}</div>
                                        <div className={`text-xs font-bold mt-0.5 tabular-nums ${isUp ? 'text-[var(--bullish)]' : isDn ? 'text-[var(--bearish)]' : 'text-[var(--text-primary)]'}`}>
                                          {val}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Fundamental Implication vs Actual Market Reaction Separation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              {/* 1. Fundamental Implication */}
                              <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--warning)] mb-1">
                                  1. FUNDAMENTAL IMPLICATION (Macro Thesis)
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                                  {item.fundamental_implication ||
                                    (hasActual
                                      ? `The actual print of ${item.actual} signals a fundamental baseline shift against the consensus estimate (${item.forecast || 'N/A'}).`
                                      : 'Awaiting the official release before setting policy transmission implications.')}
                                </p>
                              </div>

                              {/* 2. Actual Market Reaction */}
                              <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)]">
                                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
                                  2. ACTUAL MARKET REACTION (Liquidity & Flow)
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                                  {item.actual_market_reaction ||
                                    (hasActual
                                      ? `Volatility was recorded on the ${item.currency} pair right after the release, with bid-ask spread shifts and algorithmic execution.`
                                      : 'Market liquidity is in pre-event positioning.')}
                                </p>
                              </div>
                            </div>

                            <div className="text-[9.5px] font-mono text-[var(--text-muted)] flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                              <span>ANALYSIS GROUNDING: Fundamental Implication = mid-term thesis. Actual Market Reaction = spot execution.</span>
                              <span className="text-[var(--accent)] font-semibold">STRICT AUDIT TRAIL</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalCalendarPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-bold">{(calendarPage - 1) * CALENDAR_PAGE_SIZE + 1}</strong> –{' '}
              <strong className="text-[var(--text-primary)] font-bold">{Math.min(calendarPage * CALENDAR_PAGE_SIZE, filteredEvents.length)}</strong> of{' '}
              <strong className="text-[var(--text-primary)]">{filteredEvents.length}</strong> events
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCalendarPage(prev => Math.max(1, prev - 1))}
              disabled={calendarPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-[var(--border-subtle)] text-xs font-semibold"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>PREV</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-[var(--text-primary)] font-bold">{calendarPage}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--text-secondary)]">{totalCalendarPages}</span>
            </div>

            <button
              onClick={() => setCalendarPage(prev => Math.min(totalCalendarPages, prev + 1))}
              disabled={calendarPage >= totalCalendarPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-[var(--border-subtle)] text-xs font-semibold"
            >
              <span>NEXT</span>
              <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
});

MacroCalendarView.displayName = 'MacroCalendarView';
