"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const ROW_HEIGHT = 56; // h-14 = 3.5rem
const MIN_ROWS = 5;
const DEFAULT_ROWS = 10;
/**
 * Extra space to reserve below the table (pagination bar + app shell padding).
 * pagination (~40px) + space-y-5 gap (20px) + app shell pb-6 (24px) = 84px
 */
const FOOTER_RESERVE = 84;

/**
 * Calculates the optimal number of table rows to fill the remaining
 * viewport space below a given element. Uses a two-pass strategy:
 *
 * Pass 1 (pre-render): estimates from the ref element's top position.
 * Pass 2 (post-render): measures the actual table body inside the ref
 *   to find the real first-row position and adjusts precisely.
 *
 * Recalculates on window resize.
 */
export function useAutoPageSize(
  containerRef: React.RefObject<HTMLElement | null>,
  fallback = DEFAULT_ROWS
): number {
  const [pageSize, setPageSize] = useState(fallback);
  const rafId = useRef(0);

  const calculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Try to find the actual <tbody> inside the container for precise measurement
    const tbody = el.querySelector("tbody");
    let rowsTop: number;

    if (tbody) {
      // Precise: measure from where rows actually start
      rowsTop = tbody.getBoundingClientRect().top;
    } else {
      // Fallback: estimate from container top + assumed table header
      rowsTop = el.getBoundingClientRect().top + 48;
    }

    const available = window.innerHeight - rowsTop - FOOTER_RESERVE;
    const rows = Math.floor(available / ROW_HEIGHT);
    setPageSize(Math.max(MIN_ROWS, rows));
  }, [containerRef]);

  useEffect(() => {
    // Run after paint so DOM has rendered at least fallback rows
    rafId.current = requestAnimationFrame(() => {
      calculate();
      // Second pass after data renders (rows may shift layout)
      rafId.current = requestAnimationFrame(calculate);
    });

    const onResize = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(calculate);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("resize", onResize);
    };
  }, [calculate]);

  return pageSize;
}
