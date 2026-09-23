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
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface MacroCalendarViewProps {
  events: EconomicEvent[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta UTC+7) [Waktu Default]' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'LOCAL', label: 'Local (Waktu Perangkat Anda)' },
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
  // Default to UPCOMING so upcoming events are immediately visible on screen!
  const [timingFilter, setTimingFilter] = useState<'UPCOMING' | 'TODAY' | 'TOMORROW' | 'RELEASED' | 'ALL'>('UPCOMING');
  const [impactFilter, setImpactFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Jakarta');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

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
    return new Date(currentTimeMs).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [currentTimeMs]);

  const currentWibDate = useMemo(() => {
    return new Date(currentTimeMs).toLocaleDateString('id-ID', {
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

  // Find next upcoming event
  const nextEvent = useMemo(() => {
    const upEvents = events
      .filter(e => {
        const t = new Date(e.date_time_utc).getTime();
        return t >= currentTimeMs || e.status === 'UPCOMING';
      })
      .sort((a, b) => new Date(a.date_time_utc).getTime() - new Date(b.date_time_utc).getTime());

    return upEvents[0] || null;
  }, [events, currentTimeMs]);

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
    return new Date(Math.max(...dates)).toLocaleTimeString('id-ID', {
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
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
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
      const dayName = d.toLocaleDateString(isWib ? 'id-ID' : 'en-US', {
        weekday: 'short',
        timeZone: tzOption,
      });
      const dateStr = d.toLocaleDateString(isWib ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: tzOption,
      });
      const timeStr = d.toLocaleTimeString('id-ID', {
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

      if (diff <= 0) return { text: 'Sudah Rilis', isUrgent: false, isNear: false };

      const sec = Math.floor(diff / 1000);
      const min = Math.floor(sec / 60);
      const hours = Math.floor(min / 60);
      const days = Math.floor(hours / 24);

      if (min < 60) {
        return {
          text: `dalam ${min}m ${sec % 60}s`,
          isUrgent: min < 15,
          isNear: true,
        };
      } else if (hours < 24) {
        return {
          text: `dalam ${hours}j ${min % 60}m`,
          isUrgent: false,
          isNear: true,
        };
      } else {
        return {
          text: `dalam ${days}h ${hours % 24}j`,
          isUrgent: false,
          isNear: false,
        };
      }
    } catch {
      return { text: '—', isUrgent: false, isNear: false };
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-full" id="macro-calendar-root">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              KALENDER MAKROEKONOMI GLOBAL
            </h2>
            <MetricInfoIcon term="MACRO_CALENDAR" position="bottom" />
            <div className="flex items-center gap-1.5 ml-1">
              <span className={`w-2 h-2 rounded-full ${
                liveStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' :
                liveStatus === 'DELAYED' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              <MetricTooltip term="SSE_STATUS" underline={false}>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border cursor-help ${
                  liveStatus === 'LIVE' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' :
                  liveStatus === 'DELAYED' ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' :
                  'bg-rose-950/80 text-rose-300 border-rose-800/60'
                }`}>
                  {liveStatus}
                </span>
              </MetricTooltip>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/50">
                {upcomingCount} Rilis Terjadwal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1 flex-wrap">
            <span>Sumber: TradingView Real Institutional Feed</span>
            <span>•</span>
            <span>Sinkronisasi Terakhir: {latestUpdated ? `${latestUpdated} WIB` : 'Live'}</span>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent Live WIB Reference Clock */}
          <MetricTooltip term="WIB" underline={false}>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-cyan-800/60 text-xs font-mono cursor-help hover:border-cyan-600 transition" title="Waktu Acuan Sistem Saat Ini (Waktu Indonesia Barat UTC+7)">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-400 text-[11px] hidden sm:inline">Waktu WIB:</span>
              <span className="text-cyan-300 font-bold tabular-nums">{currentWibTime} WIB</span>
            </div>
          </MetricTooltip>

          {/* Timezone Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1" title="Pilih zona waktu tampilan jadwal rilis">
            <Globe className="w-3 h-3 text-cyan-400" />
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono outline-none cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-slate-900 text-slate-200">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded px-2 py-1 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Mata Uang</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
            <option value="CHF">CHF</option>
          </select>

          {/* Impact Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[11px] font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
              <Button
                key={f}
                variant={impactFilter === f ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setImpactFilter(f)}
                className={`h-6 px-2 text-[11px] font-mono transition ${
                  impactFilter === f
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {f}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sinkronisasi kalender ekonomi sekarang"
            className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 border-slate-800 text-neutral-400 hover:text-neutral-200 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Next Upcoming Event Spotlight Banner */}
      {nextEvent && (
        <div className="mb-3.5 p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950 border border-cyan-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
          <div className="flex items-start md:items-center gap-2.5">
            <div className="p-2 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  RILIS BERIKUTNYA / NEXT UPCOMING
                </span>
                <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                  {nextEvent.currency}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(nextEvent.impact)}`}>
                  {nextEvent.impact}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {nextEvent.event_name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>
                  Waktu: <strong className="text-slate-200">{formatEventDateTime(nextEvent.date_time_utc).dayName}, {formatEventDateTime(nextEvent.date_time_utc).date}</strong> • <strong className="text-cyan-400 font-mono">{formatEventDateTime(nextEvent.date_time_utc).time} {formatEventDateTime(nextEvent.date_time_utc).zoneLabel}</strong>
                </span>
                {nextEvent.forecast && <span>• Konsensus: <strong className="text-slate-200">{nextEvent.forecast}</strong></span>}
                {nextEvent.previous && <span>• Sebelumnya: <span className="text-slate-400">{nextEvent.previous}</span></span>}
              </div>
            </div>
          </div>

          {/* Countdown Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-900/90 border border-cyan-800/60 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Hitung Mundur</div>
              <div className="text-xs font-bold text-cyan-300 tabular-nums">
                {formatRelativeCountdown(nextEvent.date_time_utc).text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timing Navigation Tabs & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTimingFilter('UPCOMING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              timingFilter === 'UPCOMING'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>AKAN DATANG (UPCOMING)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              timingFilter === 'UPCOMING' ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setTimingFilter('TODAY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              timingFilter === 'TODAY'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
            }`}
          >
            <span>HARI INI (TODAY - WIB)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              timingFilter === 'TODAY' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {todayCount}
            </span>
          </button>

          <button
            onClick={() => setTimingFilter('TOMORROW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              timingFilter === 'TOMORROW'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
            }`}
          >
            <span>BESOK (TOMORROW)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              timingFilter === 'TOMORROW' ? 'bg-indigo-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {tomorrowCount}
            </span>
          </button>

          <button
            onClick={() => setTimingFilter('RELEASED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              timingFilter === 'RELEASED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
            }`}
          >
            <span>SUDAH RILIS (RELEASED)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              timingFilter === 'RELEASED' ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {releasedCount}
            </span>
          </button>

          <button
            onClick={() => setTimingFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              timingFilter === 'ALL'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800/40'
            }`}
          >
            SEMUA ({events.length})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari event (CPI, NFP, Fed, PMI)..."
            className="pl-8 h-8 text-xs font-mono bg-slate-900 border-slate-800 text-neutral-200 placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Calendar Data Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
              <th className="py-2.5 px-2.5">
                <MetricTooltip term={selectedTimezone === 'Asia/Jakarta' ? 'WIB' : 'UTC'} underline={false}>
                  <span>Waktu Rilis ({selectedTimezone === 'Asia/Jakarta' ? 'WIB UTC+7' : selectedTimezone})</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5">
                <MetricTooltip term="COUNTDOWN" underline={false}>
                  <span>Status / Hitung Mundur</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5">
                <MetricTooltip term="CCY" underline={false}>
                  <span>CCY</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5">
                <MetricTooltip term="IMPACT" underline={false}>
                  <span>Impact</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5">Indikator Acara / Event</th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="ACTUAL" underline={false}>
                  <span>Actual</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="FORECAST" underline={false}>
                  <span>Forecast</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="PREVIOUS" underline={false}>
                  <span>Previous</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="SURPRISE" underline={false}>
                  <span>Surprise</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="CHANGE" underline={false}>
                  <span>Change</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-center">
                <MetricTooltip term="REACTION" underline={false}>
                  <span>Reaction</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-right">
                <MetricTooltip term="SOURCE" underline={false}>
                  <span>Sumber</span>
                </MetricTooltip>
              </th>
              <th className="py-2.5 px-2.5 text-center">
                <Tooltip
                  title="Macro & Fundamental Intel"
                  content="Buka drawer detail untuk melihat skenario pasar, implikasi suku bunga, dan korelasi antar-aset."
                  position="top"
                >
                  <span className="cursor-help">Intel</span>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400 font-mono text-xs">
                  {timingFilter === 'TODAY' ? (
                    <div className="space-y-3 py-4 max-w-md mx-auto">
                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 font-medium">
                        Tidak ada rilis makro berdampak signifikan pada sesi hari ini (Pasar tutup / Akhir Pekan).
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Rilis terjadwal berikutnya dimulai pada sesi kerja aktif berikutnya (Waktu Indonesia Barat).
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => setTimingFilter('UPCOMING')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold hover:bg-cyan-900 transition cursor-pointer"
                        >
                          Lihat Rilis Akan Datang ({upcomingCount})
                        </button>
                        <button
                          onClick={() => setTimingFilter('ALL')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                        >
                          Semua Jadwal ({events.length})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">
                      Tidak ada event yang cocok dengan filter saat ini. Coba ubah pencarian atau filter mata uang.
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
                      className={`hover:bg-slate-900/60 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-900/80 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      {/* Date / Time with explicit WIB badge */}
                      <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium text-[11px]">{dayName}, {date}</span>
                          <span className="text-cyan-400 font-mono font-bold">{time}</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold">
                            {zoneLabel}
                          </span>
                        </div>
                      </td>

                      {/* Countdown / Freshness */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {isUpcoming ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums ${
                            countdown.isUrgent
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                              : countdown.isNear
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {countdown.text}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {item.freshness || 'Rilis'}
                          </span>
                        )}
                      </td>

                      {/* Currency */}
                      <td className="py-2 px-2.5 font-bold text-cyan-300 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          {item.currency}
                        </span>
                      </td>

                      {/* Impact Badge */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(item.impact)}`}>
                          {item.impact}
                        </span>
                      </td>

                      {/* Event Name */}
                      <td className="py-2 px-2.5 font-medium text-slate-200 max-w-[260px]">
                        <div className="truncate font-semibold text-slate-100" title={item.event_name}>
                          {item.event_name}
                        </div>
                      </td>

                      {/* Actual */}
                      <td className="py-2 px-2.5 text-right font-bold whitespace-nowrap">
                        {hasActual ? (
                          <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-bold">
                            {item.actual}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Forecast */}
                      <td className="py-2 px-2.5 text-right text-slate-300 font-semibold whitespace-nowrap">
                        {item.forecast || <span className="text-slate-600 font-normal">—</span>}
                      </td>

                      {/* Previous */}
                      <td className="py-2 px-2.5 text-right text-slate-400 whitespace-nowrap">
                        {item.previous || <span className="text-slate-600">—</span>}
                      </td>

                      {/* Surprise */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        {item.surprise && item.surprise !== 'N/A (Pending Release)' ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                            isBeat
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : isMiss
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}>
                            {item.surprise}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">Pending</span>
                        )}
                      </td>

                      {/* Change */}
                      <td className="py-2 px-2.5 text-right whitespace-nowrap text-slate-300 font-medium">
                        {item.change ? (
                          <span className={item.change.startsWith('+') ? 'text-emerald-400' : item.change.startsWith('-') ? 'text-rose-400' : 'text-slate-400'}>
                            {item.change}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Market Reaction Indicator */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        {item.market_reaction ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold">
                            {item.market_reaction.primary_asset} {item.market_reaction.r5m}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Standby</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-2 px-2.5 text-right text-[10px] text-slate-500 whitespace-nowrap truncate max-w-[120px]" title={`${item.source} • Last updated: ${new Date(item.last_updated).toLocaleString()}`}>
                        {item.source}
                      </td>

                      {/* Intel Action */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          className={`p-1 rounded transition cursor-pointer ${
                            isExpanded ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Tampilkan intelligence terukur"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Measurable Intelligence Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/95 border-b border-cyan-900/40">
                        <td colSpan={13} className="p-4">
                          <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3.5 shadow-inner">
                            {/* Intelligence Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                                  MEASURABLE MACRO INTELLIGENCE
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                  {item.currency}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${getImpactBadge(item.impact)}`}>
                                  {item.impact} IMPACT
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  Confidence: <strong className="text-emerald-400 font-bold">{item.confidence || 95}%</strong>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Freshness: <strong className="text-slate-200">{item.freshness || 'Verified Live'}</strong>
                                </span>
                              </div>

                              <div className="text-[10px] font-mono text-slate-400">
                                Sumber: <span className="text-slate-200">{item.source}</span> • Jadwal Rilis: <span className="text-cyan-400 font-bold">{dayName}, {date} — {time} {zoneLabel}</span>
                              </div>
                            </div>

                            {/* Quantitative Metrics Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Actual vs Forecast</div>
                                <div className="text-xs font-bold text-slate-100 mt-0.5">
                                  {item.actual || 'Pending'} <span className="text-slate-500 font-normal">vs</span> {item.forecast || '—'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Macro Surprise</div>
                                <div className={`text-xs font-bold mt-0.5 ${isBeat ? 'text-emerald-400' : isMiss ? 'text-rose-400' : 'text-slate-300'}`}>
                                  {item.surprise || 'N/A (Pending)'}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Change (vs Previous)</div>
                                <div className="text-xs font-bold text-slate-200 mt-0.5">
                                  {item.change || '—'} <span className="text-slate-500 font-normal">from {item.previous || '—'}</span>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Data Status & Evidence</div>
                                <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>{item.data_status} Verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Actual Market Reaction Grid (1m, 5m, 15m, 1h, 4h) */}
                            {item.market_reaction && (
                              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/90">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" />
                                    Actual Market Reaction Across Horizons ({item.market_reaction.primary_asset})
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">Real Execution Data</span>
                                </div>
                                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">1 MINUTE</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r1m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r1m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r1m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">5 MINUTES</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r5m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r5m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r5m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">15 MINUTES</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r15m || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r15m || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r15m || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">1 HOUR</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r1h || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r1h || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r1h || '—'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[9px] text-slate-400">4 HOURS</div>
                                    <div className={`text-xs font-bold mt-0.5 ${(item.market_reaction.r4h || '').startsWith('+') ? 'text-emerald-400' : (item.market_reaction.r4h || '').startsWith('-') ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {item.market_reaction.r4h || '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fundamental Implication vs Actual Market Reaction Separation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {/* 1. Fundamental Implication */}
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                                  <span>1. FUNDAMENTAL IMPLICATION</span>
                                  <span className="text-[9px] text-slate-500 font-normal">(Macro Thesis & Central Bank Path)</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {item.fundamental_implication ||
                                    (hasActual
                                      ? `Rilis aktual ${item.actual} mengindikasikan pergeseran baseline fundamental terhadap ekspektasi konsensus (${item.forecast || 'N/A'}).`
                                      : 'Menunggu rilis data resmi sebelum menetapkan implikasi transmisi kebijakan moneter.')}
                                </p>
                              </div>

                              {/* 2. Actual Market Reaction */}
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                                  <span>2. ACTUAL MARKET REACTION</span>
                                  <span className="text-[9px] text-slate-500 font-normal">(Observed Liquidity & Order Flow)</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {item.actual_market_reaction ||
                                    (hasActual
                                      ? `Volatilitas tercatat pada pasangan ${item.currency} segera setelah rilis dengan pergeseran bid-ask spread dan eksekusi algoritmik.`
                                      : 'Likuiditas pasar berada dalam status pre-event positioning.')}
                                </p>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/50">
                              <span>Perbedaan: Fundamental Implication adalah analisis teoritis jangka menengah, sedangkan Actual Market Reaction merefleksikan likuiditas riil saat ini.</span>
                              <span className="text-cyan-400">Strict Data Grounding</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Menampilkan <strong className="text-cyan-400">{(calendarPage - 1) * CALENDAR_PAGE_SIZE + 1}</strong> -{' '}
              <strong className="text-cyan-400">{Math.min(calendarPage * CALENDAR_PAGE_SIZE, filteredEvents.length)}</strong> dari{' '}
              <strong className="text-slate-200">{filteredEvents.length}</strong> event kalender
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCalendarPage(prev => Math.max(1, prev - 1))}
              disabled={calendarPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-cyan-300 font-bold">{calendarPage}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalCalendarPages}</span>
            </div>

            <button
              onClick={() => setCalendarPage(prev => Math.min(totalCalendarPages, prev + 1))}
              disabled={calendarPage >= totalCalendarPages}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border border-slate-700"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MacroCalendarView.displayName = 'MacroCalendarView';
