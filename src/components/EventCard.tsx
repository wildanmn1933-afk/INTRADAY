import React from 'react';
import { MarketEvent } from '../types';
import { Layers, Clock, ArrowRight, Flame, Zap, Newspaper } from 'lucide-react';
import { getCurrencyFlagUrl } from '../lib/assets';

interface EventCardProps {
  event: MarketEvent;
  onClick: () => void;
  isSelected?: boolean;
}

export const EventCard: React.FC<EventCardProps> = React.memo(({ event, onClick, isSelected }) => {
  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs shadow-rose-950/50';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-700 shadow-xs';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const timeAgo = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return 'recently';
    const diff = Math.floor((Date.now() - time) / 1000);
    if (diff <= 15) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className={`linear-card p-4 transition-all duration-150 cursor-pointer overflow-hidden ${
        isSelected
          ? 'linear-border-glow-cyan bg-[#111420]'
          : 'hover:bg-[#121622] hover:border-white/[0.14]'
      }`}
    >
      <div className="w-full">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded linear-card-subtle text-slate-300 uppercase font-medium flex items-center gap-1">
              <Newspaper className="w-2.5 h-2.5 text-cyan-400" />
              <span>{event.primary_category}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wider flex items-center gap-1 ${getImpactBadge(event.impact_level)}`}>
              {event.impact_level === 'CRITICAL' ? (
                <>
                  <Zap className="w-3 h-3 text-red-400" />
                  <span>CRITICAL</span>
                </>
              ) : event.impact_level === 'HIGH' ? (
                <>
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>HIGH IMPACT</span>
                </>
              ) : (
                <span>{event.impact_level}</span>
              )}
            </span>
            {event.source_count > 1 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono font-medium">
                <Layers className="w-2.5 h-2.5 text-indigo-400" />
                <span>{event.source_count} SOURCES</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{timeAgo(event.first_detected_at)}</span>
          </div>
        </div>

        {/* Event Title */}
        <h3 className="text-sm font-semibold text-slate-100 hover:text-cyan-300 transition leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* Event Summary */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {event.summary}
        </p>

        {/* Correlated Pair Impacts & Directional Bias with Flags */}
        {(event.pair_impacts || []).length > 0 && (
          <div className="mb-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/70">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                PAIR CORRELATION & BIAS:
              </span>
              <span className="text-[9px] text-cyan-400 font-medium">Directional Impact</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.pair_impacts!.slice(0, 4).map((pi) => {
                const isBull = pi.bias === 'BULLISH';
                const isBear = pi.bias === 'BEARISH';
                const c1 = pi.pair.slice(0, 3);
                const c2 = pi.pair.slice(3, 6);

                return (
                  <div
                    key={pi.pair}
                    title={`${pi.displayName || pi.pair}: ${pi.bias} (${pi.mechanism || pi.rationale})`}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                      isBull
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/60'
                        : isBear
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900/60'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {/* Dual Country Flags */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      <img
                        src={getCurrencyFlagUrl(c1)}
                        alt={c1}
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-900 shadow-xs"
                      />
                      <img
                        src={getCurrencyFlagUrl(c2)}
                        alt={c2}
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-900 shadow-xs"
                      />
                    </div>
                    <span className="font-extrabold">{pi.pair}</span>
                    <span className={`text-[9px] px-1 py-0.1 rounded font-black ${
                      isBull ? 'bg-emerald-900/80 text-emerald-200' : isBear ? 'bg-rose-900/80 text-rose-200' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {isBull ? '▲ BULLISH' : isBear ? '▼ BEARISH' : '● NEUTRAL'}
                    </span>
                  </div>
                );
              })}
              {event.pair_impacts!.length > 4 && (
                <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5 font-semibold">
                  +{event.pair_impacts!.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom Asset & Currency Impact Tags */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-850 text-[11px] font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            {(event.affected_currencies || []).length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[10px]">FX:</span>
                {event.affected_currencies.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 text-cyan-300 font-semibold text-[10px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                    <img
                      src={getCurrencyFlagUrl(c)}
                      alt={c}
                      referrerPolicy="no-referrer"
                      className="w-3 h-2 object-cover rounded-xs"
                    />
                    {c}
                  </span>
                ))}
              </div>
            )}
            {(event.affected_assets || []).length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">ASSETS:</span>
                {event.affected_assets.slice(0, 3).map(a => (
                  <span key={a} className="text-amber-400 font-semibold text-[10px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">{a}</span>
                ))}
                {event.affected_assets.length > 3 && (
                  <span className="text-slate-500 text-[10px]">+{event.affected_assets.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <span className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans font-medium shrink-0 flex items-center gap-1">
            <span>Detail</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';
