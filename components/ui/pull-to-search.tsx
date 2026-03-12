"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SEARCH_HEIGHT = 48;
const SNAP_THRESHOLD = SEARCH_HEIGHT * 0.4;

/**
 * iOS-style scroll-to-reveal search bar for mobile.
 *
 * Continuously tracks touch position. The moment scrollY hits 0 mid-gesture
 * with the finger still moving down, the search begins revealing — no need
 * to lift and start a new gesture. Scrolling back down collapses it
 * scroll-driven (no transition, moves with content).
 */
export function PullToSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: PullToSearchProps) {
  const [revealed, setRevealed] = React.useState(false);
  const [pullHeight, setPullHeight] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isSnappingBack, setIsSnappingBack] = React.useState(false);

  // We track every touch to detect the exact moment scrollY=0 is reached mid-swipe
  const touchY = React.useRef(0);
  const anchorY = React.useRef(0); // Y position when scrollY first hit 0
  const isInOverscroll = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;

  // Pull-to-reveal: track touches continuously
  React.useEffect(() => {
    if (revealed) return;

    function onTouchStart(e: TouchEvent) {
      touchY.current = e.touches[0].clientY;
      // If already at top, set anchor immediately
      if (window.scrollY <= 0) {
        anchorY.current = touchY.current;
        isInOverscroll.current = true;
      } else {
        isInOverscroll.current = false;
      }
    }

    function onTouchMove(e: TouchEvent) {
      const currentY = e.touches[0].clientY;
      touchY.current = currentY;

      // Detect the moment we hit scrollY=0 mid-gesture
      if (!isInOverscroll.current && window.scrollY <= 0) {
        // Just arrived at the top — anchor from this point
        anchorY.current = currentY;
        isInOverscroll.current = true;
      }

      if (!isInOverscroll.current) return;

      // If browser scrolled back down (e.g. bounce), stop tracking
      if (window.scrollY > 0) {
        isInOverscroll.current = false;
        setIsPulling(false);
        setPullHeight(0);
        return;
      }

      const delta = currentY - anchorY.current;

      if (delta > 2) {
        setIsPulling(true);
        setIsSnappingBack(false);
        // 1:1 up to SEARCH_HEIGHT, then rubber-band
        const h = delta <= SEARCH_HEIGHT
          ? delta
          : SEARCH_HEIGHT + (delta - SEARCH_HEIGHT) * 0.25;
        setPullHeight(Math.min(h, SEARCH_HEIGHT * 1.2));
      } else {
        setIsPulling(false);
        setPullHeight(0);
      }
    }

    function onTouchEnd() {
      if (!isInOverscroll.current && pullHeight === 0) return;
      isInOverscroll.current = false;

      if (pullHeight >= SNAP_THRESHOLD) {
        // Snap open
        setRevealed(true);
        setPullHeight(0);
        setIsPulling(false);

        requestAnimationFrame(() => {
          setTimeout(() => inputRef.current?.focus(), 250);
        });
      } else {
        // Snap closed
        setIsPulling(false);
        setIsSnappingBack(true);
        setPullHeight(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [revealed, pullHeight]);

  // Dismiss on small scroll down when revealed
  React.useEffect(() => {
    if (!revealed) return;

    const DISMISS_THRESHOLD = 12;

    function onScroll() {
      const y = window.scrollY;

      if (y >= DISMISS_THRESHOLD) {
        // Small scroll down — animate closed
        setRevealed(false);
        setIsSnappingBack(true);

      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealed]);

  // Compute visible height
  let height: number;
  let useTransition: boolean;

  if (revealed) {
    height = SEARCH_HEIGHT;
    useTransition = false;
  } else if (isPulling) {
    height = Math.min(pullHeight, SEARCH_HEIGHT);
    useTransition = false;
  } else if (isSnappingBack) {
    height = 0;
    useTransition = true;
  } else {
    height = 0;
    useTransition = false;
  }

  const progress = Math.min(height / SEARCH_HEIGHT, 1);

  return (
    <div
      className={cn("sm:hidden overflow-hidden", className)}
      style={{
        height,
        opacity: progress,
        transition: useTransition
          ? "height 250ms cubic-bezier(0.2, 0, 0, 1), opacity 250ms cubic-bezier(0.2, 0, 0, 1)"
          : "none",
      }}
      onTransitionEnd={() => setIsSnappingBack(false)}
    >
      <div className="flex items-center gap-2 px-0.5 py-1.5" style={{ height: SEARCH_HEIGHT }}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-9 w-full rounded-[var(--radius-sm)] border border-border-default bg-bg-subtle",
              "pl-8 pr-8 text-sm text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400",
              "transition-colors"
            )}
          />
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
