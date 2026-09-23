import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Globe2,
  RefreshCw,
  Clock,
  X,
  Zap,
} from 'lucide-react';
import { SSEConnectionState } from '../lib/useSSE';
import { NavTabId } from './Sidebar';
import { Tooltip, MetricTooltip } from './Tooltip';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface HeaderProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  sseStatus: SSEConnectionState;
  sessions: any[];
  onTriggerGlobalSync: () => void;
  isSyncing: boolean;
  onToggleMobileMenu: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAutoTriggerModal?: () => void;
  isAutoTriggerActive?: boolean;
  autoTriggerSecondsRemaining?: number;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  setActiveTab,
  sseStatus,
  sessions,
  onTriggerGlobalSync,
  isSyncing,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange,
  onOpenAutoTriggerModal,
  isAutoTriggerActive = false,
  autoTriggerSecondsRemaining = 0,
}) => {
  const [wibTime, setWibTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as Jakarta / WIB time: HH:mm:ss WIB
      const timeStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setWibTime(`${timeStr} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatViewLabel = (tab: NavTabId): string => {
    switch (tab) {
      case 'terminal':
        return 'Overview Dashboard';
      case 'arah_market':
        return 'Arah Market Matrix';
      case 'intraday_map':
        return 'Intraday Market Map';
      case 'today_catalysts':
        return "Today's Catalysts";
      case 'intermarket':
        return 'Arah Intermarket';
      case 'markets':
        return 'Market Surveillance';
      case 'currency':
        return 'Currency Strength (G8)';
      case 'history':
        return 'Historical Memory';
      case 'macro':
        return 'Macro Calendar';
      case 'events':
        return 'Canonical News Wire';
      case 'intelligence':
        return 'AI Intelligence';
      case 'watchlist':
        return 'Watchlist';
      case 'admin':
        return 'System & Feeds';
      default:
        return String(tab)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Only display currently active / open sessions to eliminate clutter
  const activeSessions = useMemo(() => {
    return (sessions || []).filter(s => s.current_status === 'OPEN');
  }, [sessions]);

  return (
    <header className="border-b border-white/[0.08] bg-[#0b0d14]/95 backdrop-blur-md sticky top-0 z-30 shrink-0" id="arah-market-header">
      <div className="h-13 px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu + Clean View Title + Live Dot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] lg:hidden cursor-pointer transition"
            title="Open Menu"
            id="mobile-menu-toggle-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-sans font-bold text-white tracking-tight">
              {formatViewLabel(activeTab)}
            </h1>

            {/* Minimal Live Stream Dot with Tooltip */}
            <Tooltip
              title="Koneksi Streaming Data (SSE)"
              badge={sseStatus === 'CONNECTED' ? 'LIVE STREAM' : 'RECONNECTING'}
              badgeColor={sseStatus === 'CONNECTED' ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800' : 'text-amber-400 bg-amber-950/80 border-amber-800'}
              content={
                sseStatus === 'CONNECTED'
                  ? 'Koneksi Server-Sent Events (SSE) aktif secara langsung. Pembaruan harga, spread, dan berita terkirim seketika tanpa perlu reload.'
                  : 'Sistem sedang mencoba menyambung ulang ke pipeline streaming data institusional.'
              }
              whyItMatters="Memastikan data pasar yang Anda amati bersifat real-time tanpa penundaan (zero latency)."
              position="bottom"
            >
              <span className="relative flex h-2 w-2 cursor-help">
                {sseStatus === 'CONNECTED' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                )}
              </span>
            </Tooltip>
          </div>
        </div>

        {/* Center Section: Compact Sleek Search Bar */}
        {onSearchChange && (
          <div className="hidden md:flex items-center relative w-64 lg:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search instruments, news, catalysts..."
              className="h-8 w-full bg-white/[0.04] border-white/[0.08] focus:border-cyan-500/60 focus:bg-white/[0.06] rounded-lg pl-9 pr-12 text-xs text-neutral-100 placeholder-neutral-500 transition font-sans"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono font-medium text-neutral-400">
                ⌘K
              </span>
            )}
          </div>
        )}

        {/* Right Section: Active Open Sessions + Clean UTC Time + Sync Button */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          {/* Active Trading Session (Only show OPEN sessions, no CLOSED clutter) */}
          {activeSessions.length > 0 && (
            <Tooltip
              title="Sesi Pasar Interbank Aktif"
              badge="LIQUIDITY"
              content="Sesi perdagangan perbankan internasional yang sedang aktif beroperasi saat ini dengan volume likuiditas tertinggi."
              formula="London: 14:00 - 23:00 WIB | New York: 19:00 - 04:00 WIB | Tokyo: 07:00 - 15:00 WIB"
              whyItMatters="Overlap sesi (misal: London + New York) memberikan likuiditas terdalam dan spread tertipis."
              position="bottom"
            >
              <div className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] cursor-help hover:border-white/[0.14] transition">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 font-sans text-[11px]">Sesi:</span>
                <div className="flex items-center gap-1">
                  {activeSessions.map(s => (
                    <Badge
                      key={s.session_name}
                      variant="emerald"
                      className="px-1.5 py-0 text-[9px] font-bold"
                    >
                      {s.session_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Tooltip>
          )}

          {/* Clean WIB Live Time with Tooltip */}
          <MetricTooltip term="WIB" underline={false} position="bottom">
            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 tabular-nums cursor-help hover:border-white/[0.14] transition font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-100">{wibTime || 'WIB'}</span>
            </div>
          </MetricTooltip>

          {/* Auto-Trigger News Button & Live Status */}
          {onOpenAutoTriggerModal && (
            <Button
              onClick={onOpenAutoTriggerModal}
              variant={isAutoTriggerActive ? 'destructive' : 'outline'}
              size="sm"
              className={isAutoTriggerActive ? 'h-8 bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-950/60' : 'h-8 bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.14]'}
              title="Pengaturan Popup & Trigger Berita Otomatis"
              id="open-auto-trigger-modal-btn"
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoTriggerActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px]">
                {isAutoTriggerActive ? `Auto (${autoTriggerSecondsRemaining}s)` : 'Trigger Berita'}
              </span>
            </Button>
          )}

          {/* Global Ingestion Sync Trigger */}
          <Button
            onClick={onTriggerGlobalSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="h-8 bg-white/[0.04] border-white/[0.08] text-slate-200 hover:text-white hover:border-white/[0.14]"
            title="Sync all live market data and news"
            id="global-sync-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-sans font-medium">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
