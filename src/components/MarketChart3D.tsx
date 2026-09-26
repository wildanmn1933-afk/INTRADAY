import React, { useState, useRef } from 'react';
import { Compass, Activity, ShieldCheck, Zap, TrendingUp, BarChart3, Target, ArrowUpRight } from 'lucide-react';

export interface MarketChart3DProps {
  symbol?: string;
  variant?: 'hero' | 'auth' | 'compact';
  showControls?: boolean;
  className?: string;
}

export const MarketChart3D: React.FC<MarketChart3DProps> = ({
  variant = 'hero',
  showControls = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'flow' | 'profile'>('profile');
  const [isHovered, setIsHovered] = useState(false);

  // Parallax tilt on pointer move for deep 3D immersion
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: ny * 14,
      y: -nx * 18,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Base isometric angle: deep 3D tilt with open-air floating effect
  const baseScale = variant === 'compact' ? 0.65 : variant === 'auth' ? 0.8 : 0.94;
  const rotX = 50 + tilt.x * 0.45;
  const rotZ = -30 + tilt.y * 0.45;
  const rotY = tilt.y * 0.2;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full select-none flex items-center justify-center overflow-visible ${className}`}
      style={{
        minHeight: variant === 'compact' ? '320px' : variant === 'auth' ? '400px' : '500px',
      }}
    >
      {/* Perspective 3D Stage (Completely open canvas, floating freely in space) */}
      <div
        className="relative transition-transform duration-300 ease-out preserve-3d cursor-grab active:cursor-grabbing"
        style={{
          transform: `perspective(1800px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${baseScale})`,
          transformStyle: 'preserve-3d',
          width: '660px',
          height: '430px',
        }}
      >
        {/* Soft Ambient Ground Radial Floor Shadow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[80px] opacity-40 blur-3xl transform translate-y-16 scale-110"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 55%, transparent 80%)',
            transform: 'translateZ(-45px) translateY(50px)',
          }}
        />

        {/* ========================================================
            CARD 1 (TOP SATELLITE): CURRENCY STRENGTH & CAPITAL FLOW (Z: 105px)
            Distinctive ARAH feature: Currency Matrix with dynamic bars
            ======================================================== */}
        <div
          className="absolute rounded-2xl p-4 bg-[#0a0c12]/96 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.88),0_5px_20px_rgba(0,0,0,0.6)] font-mono text-white transition-all duration-300 hover:border-amber-500/40"
          style={{
            top: '-55px',
            left: '40px',
            width: '280px',
            transform: 'translateZ(105px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-2 border-b border-white/5">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>ARAH FLOW MATRIX</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
              DISPARITY: HIGH
            </span>
          </div>

          {/* Currency Flow Bars */}
          <div className="space-y-1.5 my-2.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 w-9">XAU</span>
              <div className="flex-1 mx-2 bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full w-[94%]" />
              </div>
              <span className="text-zinc-300 font-mono text-[9px]">+94% (Dominant)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 w-9">USD</span>
              <div className="flex-1 mx-2 bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-sky-300 h-full rounded-full w-[68%]" />
              </div>
              <span className="text-zinc-400 font-mono text-[9px]">+68% (Strong)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-400 w-9">EUR</span>
              <div className="flex-1 mx-2 bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                <div className="bg-zinc-600 h-full rounded-full w-[36%]" />
              </div>
              <span className="text-zinc-500 font-mono text-[9px]">-36% (Weak)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-1.5 border-t border-white/5 font-mono">
            <span>Net Inflow:</span>
            <span className="text-emerald-400 font-bold">+$842.6M / 4H</span>
          </div>
        </div>

        {/* ========================================================
            CARD 2 (RIGHT SATELLITE): INSTITUTIONAL DELTA & VOLUME IMBALANCE (Z: 90px)
            ======================================================== */}
        <div
          className="absolute rounded-2xl p-3.5 bg-[#090b11]/96 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] font-mono text-white transition-all duration-300 hover:border-sky-500/40"
          style={{
            top: '-35px',
            left: '355px',
            width: '260px',
            transform: 'translateZ(90px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1.5 border-b border-white/5">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span>ORDER FLOW DELTA</span>
            </span>
            <span className="text-sky-400 text-[9px] font-bold">CVD +2.4K</span>
          </div>

          <div className="my-2 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Aggressive Buyers</span>
              <span className="text-sm font-black text-emerald-400">68.4%</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Passive Sellers</span>
              <span className="text-sm font-black text-zinc-400">31.6%</span>
            </div>
          </div>

          <div className="text-[9px] text-zinc-400 flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-zinc-500">Absorption Zone:</span>
            <span className="font-semibold text-amber-300">4,478.2 – 4,481.5</span>
          </div>
        </div>

        {/* ========================================================
            CARD 3 (CENTER-FRONT HERO): ARAH QUANT SURVEILLANCE DESK (Z: 65px)
            Includes Candlesticks + Lateral Institutional Volume Profile
            ======================================================== */}
        <div
          className="absolute rounded-3xl p-5 bg-[#08090e]/98 border border-white/12 shadow-[0_35px_85px_rgba(0,0,0,0.96),0_10px_35px_rgba(0,0,0,0.7)] font-mono text-white transition-all duration-300"
          style={{
            top: '80px',
            left: '15px',
            width: '530px',
            transform: 'translateZ(65px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Desk Header */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
              <span className="font-bold text-white tracking-wide">
                ARAH SURVEILLANCE · XAUUSD
              </span>
              <span className="text-zinc-500 text-[9px]">M15 / H1 ALIGNMENT</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px]">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                NY VOLATILITY
              </span>
              <span className="text-emerald-400 font-bold">14ms SSE</span>
            </div>
          </div>

          {/* Status Bar & Setup Insights */}
          <div className="my-2.5 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-400">
                <ShieldCheck className="w-3 h-3" />
                <span>STRUCTURE BREAK & EXPANSION CONFIRMED</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-sans mt-1">
                Sell-side liquidity terserap penuh di <strong className="text-white font-mono">4,458.1</strong>. Target ekspansi ke <strong className="text-amber-400 font-mono">4,528.0</strong>.
              </div>
            </div>
            <div className="text-right pl-3 border-l border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Model Risk/Reward</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">1 : 3.4 R</span>
            </div>
          </div>

          {/* Chart Arena: Candlestick + Lateral Volume Profile */}
          <div className="relative h-32 my-2 bg-black/60 rounded-2xl p-3 border border-white/5 flex items-center justify-between overflow-hidden">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            {/* Fair Value Gap Zone */}
            <div className="absolute left-[140px] top-6 w-[140px] h-[55px] bg-amber-500/15 border border-amber-500/40 rounded-lg flex items-center justify-center backdrop-blur-xs">
              <span className="text-[9px] font-bold text-amber-300 tracking-wider font-mono">
                FVG POOL (+14.2M)
              </span>
            </div>

            {/* Target Projection Vector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 120">
              <path
                d="M 230 75 L 280 62 L 340 45 L 400 30 L 440 22"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                opacity="0.9"
              />
              <circle cx="440" cy="22" r="3.5" fill="#f59e0b" className="animate-pulse" />
            </svg>

            {/* Candlestick sequence */}
            <div className="relative w-[78%] h-full flex items-end justify-between px-2 z-10">
              {[
                { o: 24, c: 28, h: 32, l: 20, up: true },
                { o: 28, c: 25, h: 30, l: 22, up: false },
                { o: 25, c: 32, h: 35, l: 24, up: true },
                { o: 32, c: 38, h: 42, l: 30, up: true },
                { o: 38, c: 31, h: 40, l: 28, up: false },
                { o: 31, c: 26, h: 34, l: 15, up: false }, // Sweep low
                { o: 26, c: 36, h: 38, l: 25, up: true },
                { o: 36, c: 48, h: 52, l: 34, up: true, sweep: true }, // Big confirmation
                { o: 48, c: 58, h: 62, l: 45, up: true },
                { o: 58, c: 68, h: 72, l: 54, up: true },
                { o: 68, c: 80, h: 84, l: 65, up: true },
              ].map((c, i) => {
                const candleH = Math.max(6, Math.abs(c.c - c.o) * 1.25);
                const wickH = Math.max(candleH + 4, (c.h - c.l) * 1.25);

                return (
                  <div key={i} className="relative flex flex-col items-center justify-end h-full">
                    {c.sweep && (
                      <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[0_0_8px_#f59e0b] animate-bounce" />
                    )}
                    {/* Wick */}
                    <div
                      className={`w-[1.2px] absolute ${c.sweep ? 'bg-amber-400' : 'bg-zinc-500'}`}
                      style={{ height: `${wickH}px`, bottom: `${c.l * 0.72}px` }}
                    />
                    {/* Body */}
                    <div
                      className={`w-3 rounded-[1.5px] z-10 ${
                        c.sweep
                          ? 'bg-amber-400 border border-amber-300 shadow-[0_0_12px_#f59e0b]'
                          : c.up
                          ? 'bg-white border border-zinc-200'
                          : 'bg-zinc-800 border border-zinc-600'
                      }`}
                      style={{
                        height: `${candleH}px`,
                        marginBottom: `${Math.min(c.o, c.c) * 0.72}px`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* LATERAL VOLUME PROFILE (Right Side Histogram - High Institutional Touch) */}
            <div className="w-[20%] h-full pl-2 border-l border-white/10 flex flex-col justify-between py-1 z-10">
              <div className="text-[7px] text-zinc-500 uppercase tracking-wider font-bold">Vol Profile</div>
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-1">
                  <div className="h-1.5 bg-amber-500/80 rounded-xs w-[75%]" />
                  <span className="text-[7px] text-zinc-400 font-mono">4.5k</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className="h-1.5 bg-amber-400 rounded-xs w-[100%] shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-[7px] text-amber-300 font-mono font-bold">POC</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className="h-1.5 bg-sky-500/60 rounded-xs w-[55%]" />
                  <span className="text-[7px] text-zinc-400 font-mono">3.2k</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className="h-1.5 bg-zinc-600 rounded-xs w-[35%]" />
                  <span className="text-[7px] text-zinc-500 font-mono">1.8k</span>
                </div>
              </div>
              <div className="text-[8px] text-right font-mono text-amber-400 font-bold">4,480.6</div>
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[9px] font-mono text-zinc-400">
            <div>
              <span className="text-zinc-600 block text-[8px]">SWEEP REF</span>
              <span className="text-zinc-300 font-semibold">4,458.1</span>
            </div>
            <div>
              <span className="text-zinc-600 block text-[8px]">ENTRY POI</span>
              <span className="text-amber-400 font-semibold">4,480.6</span>
            </div>
            <div>
              <span className="text-zinc-600 block text-[8px]">TARGET 1</span>
              <span className="text-emerald-400 font-semibold">4,528.0</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-600 block text-[8px]">BIAS STATUS</span>
              <span className="text-emerald-400 font-bold">HIGH PROB</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            CAPSULE 1 (FLOATING HUD): CONVICTION LOCK PILL (Top-Center, Z: 120px)
            ======================================================== */}
        <div
          className="absolute rounded-full px-4 py-2 bg-black/95 border border-amber-500/30 shadow-[0_25px_50px_rgba(0,0,0,0.95),0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2.5 font-mono text-[11px] text-white transition-all duration-300 hover:scale-105"
          style={{
            top: '30px',
            left: '260px',
            transform: 'translateZ(120px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-zinc-200 text-[10px]">CONVICTION:</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
            A+ SETUP
          </span>
          <span className="text-zinc-500 text-[10px]">·</span>
          <span className="text-emerald-400 font-bold text-[10px]">+47.4 Pips</span>
        </div>

        {/* ========================================================
            CAPSULE 2 (FLOATING HUD): RISK ALLOCATION ENGINE (Bottom-Right, Z: 110px)
            ======================================================== */}
        <div
          className="absolute rounded-2xl px-4 py-2.5 bg-[#0d0f18]/95 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9)] flex items-center gap-3 font-mono text-white transition-all duration-300 hover:border-emerald-500/40"
          style={{
            top: '290px',
            left: '420px',
            transform: 'translateZ(110px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold">
              Risk Architecture
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>0.5% Risk</span>
              <span className="text-zinc-600">|</span>
              <span className="text-emerald-400">Target Hit 88%</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            TILE 3 (SIGNATURE ARAH EMBLEM): OBSIDIAN & GOLD PRISM COMPASS (Far Right, Z: 80px)
            ======================================================== */}
        <div
          className="absolute rounded-3xl p-3 bg-gradient-to-br from-[#1c1e28] to-[#0a0b10] border border-amber-500/25 shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            top: '140px',
            left: '565px',
            width: '95px',
            height: '95px',
            transform: 'translateZ(80px)',
            transformStyle: 'preserve-3d',
            backgroundImage:
              'radial-gradient(circle at 35% 35%, rgba(245,158,11,0.25), transparent 70%), repeating-linear-gradient(45deg, #1f212d 0, #1f212d 2px, #0e1017 2px, #0e1017 6px)',
          }}
        >
          {/* Distinctive ARAH Rhombus Compass Logo */}
          <svg viewBox="0 0 44 44" className="w-12 h-12 drop-shadow-[0_6px_16px_rgba(245,158,11,0.65)]">
            {/* Outer Diamond */}
            <polygon
              points="22,3 41,22 22,41 3,22"
              fill="#08090d"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Golden Upper Arrow */}
            <polygon
              points="22,7 31,22 22,17"
              fill="url(#arahGold1)"
            />
            <polygon
              points="22,7 13,22 22,17"
              fill="url(#arahGold2)"
            />
            {/* Obsidian Lower Arrow */}
            <polygon
              points="22,37 31,22 22,27"
              fill="#27272a"
            />
            <polygon
              points="22,37 13,22 22,27"
              fill="#18181b"
            />
            {/* Core Node */}
            <circle cx="22" cy="22" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            <defs>
              <linearGradient id="arahGold1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="arahGold2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[9px] font-mono font-black tracking-widest text-amber-400 mt-1">
            ARAH
          </span>
        </div>
      </div>
    </div>
  );
};
