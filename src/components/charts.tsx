"use client";

/**
 * Small dependency-free SVG charts (bar, area, donut) with hover tooltips.
 * They measure their container so text stays crisp at any width.
 */
import { useEffect, useRef, useState } from "react";

export const CHART = {
  teal: "#0d9488",
  tealLight: "#99f6e4",
  coral: "#fb7b5b",
  slate: "#94a3b8",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  sky: "#0ea5e9",
  pink: "#ec4899",
  emerald: "#10b981",
};
export const SERIES = [CHART.teal, CHART.coral, CHART.violet, CHART.amber, CHART.sky, CHART.pink, CHART.emerald, CHART.slate];

/** Measures the container. The SVG is absolutely positioned so it never props the layout open. */
function useWidth(fallback = 320) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

type Row = Record<string, string | number>;

function Tip({ x, label, items, width }: { x: number; label: string; items: { name: string; value: string; colour: string }[]; width: number }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg" style={{ left }}>
      <div className="mb-1 font-medium">{label}</div>
      {items.map((p) => (
        <div key={p.name} className="flex items-center gap-2 whitespace-nowrap">
          <span className="size-2 rounded-full" style={{ background: p.colour }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const PAD = { top: 10, right: 6, bottom: 24, left: 48 };

function Axis({ max, w, h, format }: { max: number; w: number; h: number; format?: (n: number) => string }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const ih = h - PAD.top - PAD.bottom;
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + ih - (t / max) * ih;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
              {format ? format(t) : Math.round(t)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BarsChart<T extends Row>({
  data,
  x,
  bars,
  height = 240,
  format,
  stacked,
}: {
  data: T[];
  x: keyof T & string;
  bars: { key: keyof T & string; name: string; colour: string }[];
  height?: number;
  format?: (n: number) => string;
  stacked?: boolean;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map((d) => bars.map((b) => Number(d[b.key]) || 0));
  const max = niceMax(Math.max(1, ...vals.map((v) => (stacked ? v.reduce((a, b) => a + b, 0) : Math.max(...v)))));
  const iw = w - PAD.left - PAD.right;
  const ih = height - PAD.top - PAD.bottom;
  const band = iw / Math.max(1, data.length);
  const groupW = Math.min(band * 0.7, stacked ? 40 : 36 * bars.length);
  const barW = stacked ? groupW : groupW / bars.length - 3;
  const showEvery = Math.ceil(data.length / Math.max(1, Math.floor(iw / 48)));
  return (
    <div className="w-full min-w-0">
    <div ref={ref} className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={height} className="absolute inset-0 block overflow-visible">
        <Axis max={max} w={w} h={height} format={format} />
        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2;
          let acc = 0;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.left + band * i} y={PAD.top} width={band} height={ih} fill={hover === i ? "#f1f5f9" : "transparent"} />
              {bars.map((b, j) => {
                const v = vals[i][j];
                const bh = (v / max) * ih;
                const y = PAD.top + ih - bh - (stacked ? (acc / max) * ih : 0);
                const bx = stacked ? cx - groupW / 2 : cx - groupW / 2 + j * (barW + 3);
                if (stacked) acc += v;
                const top = !stacked || j === bars.length - 1;
                return <rect key={b.key} x={bx} y={y} width={Math.max(2, barW)} height={Math.max(0, bh)} rx={top ? 5 : 0} fill={b.colour} />;
              })}
              {i % showEvery === 0 && (
                <text x={cx} y={height - 6} textAnchor="middle" fontSize={11} fill="#64748b">
                  {String(d[x])}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <Tip
          x={PAD.left + band * hover + band / 2}
          width={w}
          label={String(data[hover][x])}
          items={bars.map((b, j) => ({ name: b.name, colour: b.colour, value: format ? format(vals[hover][j]) : String(vals[hover][j]) }))}
        />
      )}
    </div>
      {bars.length > 1 && (
        <div className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground">
          {bars.map((b) => (
            <span key={b.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: b.colour }} /> {b.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AreaTrend<T extends Row>({
  data,
  x,
  y,
  name,
  colour = CHART.teal,
  height = 220,
  format,
}: {
  data: T[];
  x: keyof T & string;
  y: keyof T & string;
  name: string;
  colour?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map((d) => Number(d[y]) || 0);
  const max = niceMax(Math.max(1, ...vals));
  const left = height < 160 ? 28 : PAD.left;
  const iw = w - left - PAD.right;
  const ih = height - PAD.top - PAD.bottom;
  const px = (i: number) => left + (data.length <= 1 ? iw / 2 : (iw * i) / (data.length - 1));
  const py = (v: number) => PAD.top + ih - (v / max) * ih;
  const pts = vals.map((v, i) => [px(i), py(v)] as const);
  const line = pts.map(([a, b], i) => `${i ? "L" : "M"}${a},${b}`).join(" ");
  const area = `${line} L${px(data.length - 1)},${PAD.top + ih} L${px(0)},${PAD.top + ih} Z`;
  const id = `area-${y}-${colour.replace("#", "")}`;
  const showEvery = Math.ceil(data.length / Math.max(1, Math.floor(iw / 56)));
  return (
    <div
      ref={ref}
      className="relative w-full min-w-0"
      style={{ height }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = e.clientX - r.left - left;
        setHover(Math.max(0, Math.min(data.length - 1, Math.round((rel / iw) * (data.length - 1)))));
      }}
    >
      <svg width={w} height={height} className="absolute inset-0 block overflow-visible">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity={0.28} />
            <stop offset="100%" stopColor={colour} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={left} x2={w - PAD.right} y1={py(f * max)} y2={py(f * max)} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={left - 6} y={py(f * max) + 4} textAnchor="end" fontSize={11} fill="#64748b">
              {format ? format(f * max) : Math.round(f * max)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={colour} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % showEvery === 0 ? (
            <text key={i} x={px(i)} y={height - 6} textAnchor="middle" fontSize={11} fill="#64748b">
              {String(d[x])}
            </text>
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="#cbd5e1" />
            <circle cx={px(hover)} cy={py(vals[hover])} r={4.5} fill="white" stroke={colour} strokeWidth={2.5} />
          </g>
        )}
      </svg>
      {hover !== null && <Tip x={px(hover)} width={w} label={String(data[hover][x])} items={[{ name, colour, value: format ? format(vals[hover]) : String(vals[hover]) }]} />}
    </div>
  );
}

export function Donut({ data, height = 200 }: { data: { name: string; value: number; colour: string }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = height / 2 - 6;
  const inner = r * 0.62;
  const c = height / 2;
  const starts = data.map((_, i) => data.slice(0, i).reduce((sum, d) => sum + d.value, 0));
  const arcs = data.map((d, i) => {
    const a0 = -Math.PI / 2 + (starts[i] / total) * Math.PI * 2;
    const a1 = a0 + (d.value / total) * Math.PI * 2;
    const gap = data.length > 1 ? 0.012 : 0;
    const s = a0 + gap;
    const e = a1 - gap;
    const large = e - s > Math.PI ? 1 : 0;
    const p = (rad: number, a: number) => `${c + rad * Math.cos(a)},${c + rad * Math.sin(a)}`;
    return `M${p(r, s)} A${r},${r} 0 ${large} 1 ${p(r, e)} L${p(inner, e)} A${inner},${inner} 0 ${large} 0 ${p(inner, s)} Z`;
  });
  const shown = hover !== null ? data[hover] : null;
  return (
    <div className="relative mx-auto" style={{ width: height, height }}>
      <svg width={height} height={height}>
        {arcs.map((d, i) => (
          <path key={i} d={d} fill={data[i].colour} opacity={hover === null || hover === i ? 1 : 0.35} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="transition-opacity" />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-2xl font-bold tabular">{shown ? shown.value : total}</div>
        <div className="max-w-24 truncate text-[11px] text-muted-foreground">{shown ? shown.name : "Total"}</div>
      </div>
    </div>
  );
}
