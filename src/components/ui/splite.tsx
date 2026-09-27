'use client'

import React, { Suspense, lazy, useState, useEffect, useRef, Component, type ReactNode } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SplineErrorBoundaryState {
  hasError: boolean;
}

class SplineErrorBoundary extends Component<SplineErrorBoundaryProps, SplineErrorBoundaryState> {
  constructor(props: SplineErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.warn('Spline 3D Scene encountered an error, displaying fallback:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-neutral-400 p-4">
            <span className="loader"></span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasValidDimensions, setHasValidDimensions] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check current dimensions immediately
    const rect = el.getBoundingClientRect();
    if (rect.width > 30 && rect.height > 30) {
      setHasValidDimensions(true);
    }

    if (typeof ResizeObserver === 'undefined') {
      setHasValidDimensions(true);
      return;
    }

    // Monitor resize to ensure container has valid non-zero extent for WebGPU/WebGL
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 30 && height > 30) {
          setHasValidDimensions(true);
        } else {
          setHasValidDimensions(false);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden ${className || ''}`}
      style={{ minWidth: '80px', minHeight: '80px' }}
    >
      {hasValidDimensions ? (
        <SplineErrorBoundary
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="loader"></span>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="loader"></span>
              </div>
            }
          >
            <Spline scene={scene} className="w-full h-full" />
          </Suspense>
        </SplineErrorBoundary>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      )}
    </div>
  );
}
