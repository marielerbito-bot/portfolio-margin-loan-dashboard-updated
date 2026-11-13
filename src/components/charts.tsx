import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDate, fmtPct, fmtUsd } from "@/components/format";

const AXIS = "var(--color-muted)";
const GRID = "var(--color-line)";
const INK = "var(--color-ink)";

function useMounted() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return on;
}

function tipStyle() {
  return {
    background: "var(--color-card)",
    border: "1px solid var(--color-line)",
    borderRadius: 2,
    fontSize: 12,
    color: "var(--color-ink)",
  };
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1]}`;
}

export function SeriesChart({
  data,
  lines,
  height = 280,
  format = "usd",
}: {
  data: Record<string, string | number | null>[];
  lines: { key: string; name: string; color: string }[];
  height?: number;
  format?: "usd" | "index" | "pct";
}) {
  const mounted = useMounted();
  if (!data.length) {
    return <p className="px-4 py-8 text-sm text-muted">No prints in this chart window.</p>;
  }
  const tick = (v: number) => (format === "pct" ? `${(v * 100).toFixed(1)}%` : format === "index" ? Number(v).toFixed(0) : fmtUsd(v));
  const tip = (v: number) => (format === "pct" ? `${(v * 100).toFixed(2)}%` : format === "index" ? Number(v).toFixed(2) : fmtUsd(v));
  const nums = data.flatMap((row) => lines.map((l) => row[l.key])).filter((n): n is number => typeof n === "number");
  const lo = nums.length ? Math.min(0, ...nums) : 0;
  const hi = nums.length ? Math.max(0, ...nums) : 0;
  const pad = Math.max((hi - lo) * 0.15, 0.002);
  if (!mounted) return <div style={{ height }} />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis
            tickFormatter={tick}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={format === "usd" ? 72 : 52}
            domain={format === "pct" ? [lo - pad, hi + pad] : format === "index" ? ["dataMin - 2", "dataMax + 2"] : ["auto", "auto"]}
          />
          <Tooltip
            contentStyle={tipStyle()}
            labelFormatter={(l) => fmtDate(String(l))}
            formatter={(v, name) => [tip(Number(v)), name]}
          />
          {format === "pct" ? <ReferenceLine y={0} stroke={INK} strokeOpacity={0.35} /> : null}
          {lines.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={1.75} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SplitChart({
  data,
}: {
  data: { date: string; priceEffect: number | null; fxEffect: number | null }[];
}) {
  const mounted = useMounted();
  const rows = data.filter((d) => d.priceEffect != null || d.fxEffect != null);
  if (!rows.length) return <p className="px-4 py-8 text-sm text-muted">Not enough points to split the daily move.</p>;
  if (!mounted) return <div style={{ height: 240 }} />;
  return (
    <div style={{ height: 240 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tickFormatter={(v: number) => fmtUsd(v)} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
          <Tooltip contentStyle={tipStyle()} labelFormatter={(l) => fmtDate(String(l))} formatter={(v, name) => [fmtUsd(Number(v)), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke={INK} strokeOpacity={0.35} />
          <Bar dataKey="priceEffect" name="Price" fill="var(--color-s1)" maxBarSize={14} />
          <Bar dataKey="fxEffect" name="FX" fill="var(--color-s2)" maxBarSize={14} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LevelChart({
  data,
  name,
  digits = 4,
}: {
  data: { date: string; value: number | null }[];
  name: string;
  digits?: number;
}) {
  const mounted = useMounted();
  const rows = data.filter((d) => d.value != null);
  if (!rows.length) return <p className="px-4 py-8 text-sm text-muted">No prints in this chart window.</p>;
  if (!mounted) return <div style={{ height: 280 }} />;
  const values = rows.map((d) => d.value as number);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.01;
  const fmt = (v: number) => v.toFixed(digits);
  return (
    <div style={{ height: 280 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={[lo - pad, hi + pad]} tickFormatter={fmt} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={64} />
          <Tooltip contentStyle={tipStyle()} labelFormatter={(l) => fmtDate(String(l))} formatter={(v) => [fmt(Number(v)), name]} />
          <Area type="monotone" dataKey="value" name={name} stroke="var(--color-forest)" fill="var(--color-forest)" fillOpacity={0.12} strokeWidth={1.75} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MoveLevelChart({
  data,
  name,
  reference,
  referenceLabel,
  digits = 2,
  height = 300,
}: {
  data: { date: string; value: number | null }[];
  name: string;
  reference?: number | null;
  referenceLabel: string;
  digits?: number;
  height?: number;
}) {
  const mounted = useMounted();
  const rows = data.filter((d) => d.value != null);
  if (!rows.length) return <p className="px-4 py-8 text-sm text-muted">No prints in this chart window.</p>;
  if (!mounted) return <div style={{ height }} />;
  const nums = rows.map((d) => d.value as number);
  if (reference != null && Number.isFinite(reference)) nums.push(reference);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.04 || 1;
  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis domain={[lo - pad, hi + pad]} tickFormatter={fmt} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={digits > 2 ? 64 : 52} />
          <Tooltip contentStyle={tipStyle()} labelFormatter={(l) => fmtDate(String(l))} formatter={(v, label) => [fmt(Number(v)), label]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="value" name={name} stroke="var(--color-s1)" strokeWidth={1.75} dot={false} />
          {reference != null && Number.isFinite(reference) ? (
            <ReferenceLine y={reference} stroke="var(--color-oxblood)" strokeDasharray="4 3" label={{ value: referenceLabel, fill: "var(--color-oxblood)", fontSize: 11 }} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceChart({
  data,
  strike,
  purchase,
}: {
  data: { date: string; price: number | null }[];
  strike?: number;
  purchase?: number;
}) {
  const mounted = useMounted();
  if (!data.length) return <p className="px-4 py-8 text-sm text-muted">No prints in this chart window.</p>;
  if (!mounted) return <div style={{ height: 260 }} />;
  return (
    <div style={{ height: 260 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tipStyle()} labelFormatter={(l) => fmtDate(String(l))} formatter={(v, name) => [Number(v).toFixed(2), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="price" name="Price" stroke="var(--color-s1)" strokeWidth={1.75} dot={false} />
          {strike != null ? <ReferenceLine y={strike} stroke="var(--color-s4)" strokeDasharray="4 3" label={{ value: "Strike", fill: "var(--color-s4)", fontSize: 11 }} /> : null}
          {purchase != null ? <ReferenceLine y={purchase} stroke="var(--color-muted)" strokeDasharray="2 3" label={{ value: "Entry", fill: AXIS, fontSize: 11 }} /> : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function pctTick(v: number) {
  const digits = Math.abs(v) > 0 && Math.abs(v) < 0.02 ? 2 : 1;
  const body = (v * 100).toFixed(digits);
  return `${body}%`;
}

export function PctChart({
  data,
  lines,
  height = 280,
}: {
  data: Record<string, string | number | null>[];
  lines: { key: string; name: string; color: string }[];
  height?: number;
}) {
  const mounted = useMounted();
  if (!data.length) return <p className="px-4 py-8 text-sm text-muted">No prints in this chart window.</p>;
  if (!mounted) return <div style={{ height }} />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tickFormatter={pctTick} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            contentStyle={tipStyle()}
            labelFormatter={(l) => fmtDate(String(l))}
            formatter={(v, name) => [fmtPct(Number(v), 2), name]}
          />
          <ReferenceLine y={0} stroke={INK} strokeOpacity={0.35} />
          {lines.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={1.75} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PctBarChart({
  data,
}: {
  data: { name: string; pct: number }[];
}) {
  const mounted = useMounted();
  const height = Math.max(160, data.length * 36 + 24);
  if (!data.length) return <p className="px-4 py-8 text-sm text-muted">No movement for this period.</p>;
  if (!mounted) return <div style={{ height }} />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tickFormatter={pctTick} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={124} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tipStyle()} formatter={(v) => [fmtPct(Number(v), 2), "Change"]} />
          <ReferenceLine x={0} stroke={INK} strokeOpacity={0.35} />
          <Bar dataKey="pct" maxBarSize={16}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.pct >= 0 ? "var(--color-forest)" : "var(--color-oxblood)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
