import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * CivicTrace motion primitives.
 * Professional, subtle, citizen-friendly — small distances, fast durations,
 * expo-out easing. All CSS lives in index.css; this file only toggles classes.
 */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return reduced;
}

// ─── PageTransition: fade + rise on every route change, scroll to top ────
export function PageTransition({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pageKey]);

  return (
    <div key={pageKey} className="page-enter">
      {children}
    </div>
  );
}

// ─── Reveal: fade-up once when scrolled into view ─────────────────────────
interface RevealProps {
  children: ReactNode;
  delay?: number; // ms, keep ≤ 300 for snappy feel
  y?: number; // px rise distance, 12–20 recommended
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "span" | "li";
}

export function Reveal({ children, delay = 0, y = 16, className = "", style, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ ...style, ["--reveal-y" as string]: `${y}px`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

// ─── Stagger: wraps children with incremental reveal delays ───────────────
export function Stagger({
  children,
  gap = 70,
  max = 5,
  className = "",
}: {
  children: ReactNode;
  gap?: number;
  max?: number;
  className?: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className} style={{ display: "contents" }}>
      {items.map((child, i) => (
        <Reveal key={i} delay={Math.min(i, max) * gap} className="stagger-item">
          {child}
        </Reveal>
      ))}
    </div>
  );
}

// ─── AnimatedNumber: eased count-up when visible ──────────────────────────
export function AnimatedNumber({
  value,
  duration = 900,
  format,
  className = "",
  style,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic — calm, professional
          setDisplay(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} style={style}>
      {format ? format(display) : display.toLocaleString("en-IN")}
    </span>
  );
}
