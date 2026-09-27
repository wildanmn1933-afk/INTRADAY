'use client'

import React from 'react';
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";

export interface SplineSceneBasicProps {
  className?: string;
  scene?: string;
  title?: string;
  description?: string;
  badge?: string;
  layout?: 'split' | 'immersive' | 'unified' | 'borderless';
  spotlightFill?: string;
  showText?: boolean;
  children?: React.ReactNode;
}

export function SplineSceneBasic({
  className,
  scene = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  title = "Interactive 3D",
  description = "Bring your UI to life with beautiful 3D scenes. Create immersive experiences that capture attention and enhance your design.",
  badge,
  layout = 'split',
  spotlightFill = "white",
  showText = true,
  children,
}: SplineSceneBasicProps = {}) {
  // Borderless mode (Completely open canvas with no box, no border, seamless with page)
  if (layout === 'borderless') {
    return (
      <div
        className={cn(
          "w-full h-full min-h-[500px] relative overflow-hidden flex flex-col justify-between bg-transparent",
          className
        )}
      >
        <Spotlight
          className="-top-40 left-0 md:left-40 md:-top-20"
          fill={spotlightFill}
          size={360}
        />

        {/* 3D Scene full viewport without any border or box */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          <SplineScene
            scene={scene}
            className="w-full h-full"
          />
        </div>

        {/* Optional top badge */}
        {badge && (
          <div className="relative z-10 p-4 pointer-events-none flex justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)]/80 backdrop-blur-md border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{badge}</span>
            </div>
          </div>
        )}

        {/* Optional bottom text */}
        {(showText || children) && (
          <div className="relative z-10 p-4 pointer-events-none">
            {children || (showText && title ? (
              <div className="inline-block max-w-sm font-mono text-xs text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">{title}</span>
                {description && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-sans">{description}</p>}
              </div>
            ) : null)}
          </div>
        )}
      </div>
    );
  }

  // Immersive / Unified mode (Full-bleed 3D canvas with spotlight and sleek HUD overlay)
  if (layout === 'immersive' || layout === 'unified') {
    return (
      <Card
        className={cn(
          "w-full h-full min-h-[520px] bg-neutral-950/95 border border-[var(--border-subtle)] relative overflow-hidden rounded-2xl flex flex-col justify-between shadow-2xl",
          className
        )}
      >
        <Spotlight
          className="-top-40 left-0 md:left-40 md:-top-20"
          fill={spotlightFill}
          size={320}
        />

        {/* 3D Scene full viewport */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          <SplineScene
            scene={scene}
            className="w-full h-full"
          />
        </div>

        {/* Vignette edge blending gradient */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-neutral-950/50" />

        {/* Top HUD Strip */}
        <div className="relative z-10 p-5 flex items-center justify-between pointer-events-none">
          {badge ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-900/80 backdrop-blur-md border border-white/10 text-[11px] font-mono font-semibold text-neutral-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{badge}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-900/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="tracking-wider uppercase">Interactive 3D Stage</span>
            </div>
          )}

          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/5">
            MOVE CURSOR TO ROTATE
          </div>
        </div>

        {/* Bottom Editorial Content Overlay */}
        {(showText || children) && (
          <div className="relative z-10 p-6 pointer-events-none">
            {children ? (
              children
            ) : showText ? (
              <div className="max-w-md bg-neutral-900/70 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-lg">
                <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-300 tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed font-sans">
                  {description}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </Card>
    );
  }

  // Split layout (Default requested structure, with robust responsive behavior)
  return (
    <Card className={cn("w-full min-h-[500px] h-[500px] bg-black/[0.96] relative overflow-hidden rounded-xl border border-[var(--border-subtle)]", className)}>
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill={spotlightFill}
      />
      
      <div className="flex h-full flex-col md:flex-row">
        {/* Left content */}
        <div className="flex-1 p-6 md:p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            {title}
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg text-sm md:text-base leading-relaxed">
            {description}
          </p>
          {children}
        </div>

        {/* Right content */}
        <div className="flex-1 relative min-h-[260px] md:min-h-full">
          <SplineScene 
            scene={scene}
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  );
}
