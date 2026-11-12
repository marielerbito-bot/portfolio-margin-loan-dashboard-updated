import { useMemo, useState } from "react";
import { PriceChart, SeriesChart } from "@/components/charts";
import { fmtDate, fmtFx, fmtMonth, fmtNum, fmtPct, fmtQty, fmtUsd, Signed, tone } from "@/components/format";
import { CHART_MAX, CHART_MIN, POSITIONS, POSITION_COLOR, REALIZED, REPORT_MAX, REPORT_MIN, SHAREHOLDER, UNDERLYINGS, type CarryIndicator, type ChartPoint, type MovePeriod, type Report } from "@/lib/finance";

const PERIODS: { id: MovePeriod; label: string }[] = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
];

const PRESETS = [
  { id: "1W", days: 7 },
  { id: "1M", days: 31 },
  { id: "3M", days: 92 },
  { id: "YTD", days: 0 },
  { id: "All", days: 0 },
] as const;

function periodWord(period: MovePeriod) {
  if (period === "day") return "day";
  if (period === "week") return "week";
  return "month";
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function mondayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const back = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}

function span(pts: ChartPoint[] | undefined, key: "price" | "usd" | "fx") {
  if (!pts?.length) return null;
  const usable = pts.filter((p) => p[key] != null && Number(p[key]) !== 0);
  if (usable.length < 2) {
    if (key === "price" && pts.length >= 1 && pts.every((p) => p.price == null)) return 0;
    return null;
  }
  const a = usable[0][key] as number;
  const b = usable[usable.length - 1][key] as number;
  return b / a - 1;
}

function rebase(pts: ChartPoint[] | undefined, key: "price" | "usd" | "fx") {
  if (!pts?.length) return [] as { date: string; value: number | null }[];
  const base = pts.find((p) => p[key] != null && Number(p[key]) !== 0)?.[key] as number | undefined;
  if (base == null) return [];
  return pts.map((p) => ({ date: p.date, value: p[key] == null ? null : (p[key] as number) / base - 1 }));
}

function windowTrend(pct: number | null) {
  if (pct == null || !Number.isFinite(pct)) return "—";
  if (pct > 0.005) return "Rising";
  if (pct < -0.005) return "Falling";
  return "Flat";
}

function isWeekend(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 || day === 6;
}

function prosePct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "unchanged";
  const body = `${(Math.abs(value) * 100).toFixed(2)}%`;
  if (value < -1e-8) return `down ${body}`;
  if (value > 1e-8) return `up ${body}`;
  return "unchanged";
}

function weekBounce(pts: ChartPoint[] | undefined) {
  const priced = (pts || []).filter((p) => p.price != null);
  if (priced.length < 2) return null;
  const last = priced[priced.length - 1];
  const mon = mondayOf(last.date);
  let prev = [...priced].reverse().find((p) => p.date < mon);
  if (!prev || prev.price == null || last.price == null) return null;
  let cursor: ChartPoint = prev;
  let fromPx = prev.price;
  const toPx = last.price;
  while (isWeekend(cursor.date)) {
    const earlier = [...priced].reverse().find((p) => p.date < cursor.date);
    if (!earlier || earlier.price == null || earlier.price !== fromPx) break;
    cursor = earlier;
    fromPx = earlier.price;
  }
  return { pct: toPx / fromPx - 1, from: cursor.date, fromPx, to: last.date, toPx };
}

export function Movement({
  report,
  onReporting,
  onFrom,
  onTo,
}: {
  report: Report;
  onReporting: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const [period, setPeriod] = useState<MovePeriod>("week");
  const [asset, setAsset] = useState("all");
  const [fxPair, setFxPair] = useState<"SGD" | "CHF" | "HKD" | "AUD" | "EUR">("AUD");
  const pack = report.moves[period];
  const choices = [{ id: "all", name: "All positions" }, ...POSITIONS.map((p) => ({ id: p.id, name: p.short }))];
  const selected = POSITIONS.find((p) => p.id === asset);

  const rows = POSITIONS.filter((p) => p.acquired <= report.reportingDate).map((p) => {
    const pts = report.charts[p.id];
    return {
      id: p.id,
      name: p.short,
      ccy: p.ccy,
      pricePct: span(pts, "price"),
      fxPct: p.ccy === "USD" ? 0 : span(pts, "fx"),
      usdPct: span(pts, "usd"),
    };
  });

  const focus = selected ? rows.find((r) => r.id === selected.id) : null;
  const ranked = rows.filter((r) => r.pricePct != null).sort((a, b) => (b.pricePct || 0) - (a.pricePct || 0));
  const leadUp = focus ? { name: focus.name, pct: focus.pricePct, note: "Price over the window" } : ranked[0] ? { name: ranked[0].name, pct: ranked[0].pricePct, note: "Strongest price in the window" } : null;
  const leadDown = focus
    ? { name: `${focus.ccy} rate`, pct: focus.fxPct, note: "FX rate over the same window" }
    : ranked.length
      ? { name: ranked[ranked.length - 1].name, pct: ranked[ranked.length - 1].pricePct, note: "Weakest price in the window" }
      : null;

  const priceLines = (selected ? [selected] : POSITIONS.filter((p) => p.acquired <= report.reportingDate))
    .filter((p) => (report.charts[p.id] || []).some((pt) => pt.price != null))
    .map((p) => ({ key: p.id, name: p.short, color: POSITION_COLOR[p.id] }));
  const fxLines = (selected ? [selected] : POSITIONS.filter((p) => p.acquired <= report.reportingDate && p.ccy !== "USD"))
    .filter((p) => (report.charts[p.id] || []).some((pt) => pt.fx != null))
    .filter((p, i, arr) => arr.findIndex((q) => q.ccy === p.ccy) === i)
    .map((p) => ({ key: p.ccy, name: p.ccy, color: POSITION_COLOR[p.id] }));

  const priceData = useMemo(() => {
    const ids = priceLines.map((l) => l.key);
    const map = new Map<string, Record<string, string | number | null>>();
    for (const id of ids) {
      for (const pt of rebase(report.charts[id], "price")) {
        const row = map.get(pt.date) || { date: pt.date };
        row[id] = pt.value;
        map.set(pt.date, row);
      }
    }
    return [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [report, priceLines]);

  const fxMoveData = useMemo(() => {
    const held = selected ? [selected] : POSITIONS.filter((p) => p.acquired <= report.reportingDate && p.ccy !== "USD");
    const byCcy = new Map<string, string>();
    for (const p of held) if (!byCcy.has(p.ccy) && (report.charts[p.id] || []).some((pt) => pt.fx != null)) byCcy.set(p.ccy, p.id);
    const map = new Map<string, Record<string, string | number | null>>();
    for (const [ccy, id] of byCcy) {
      for (const pt of rebase(report.charts[id], "fx")) {
        const row = map.get(pt.date) || { date: pt.date };
        row[ccy] = pt.value;
        map.set(pt.date, row);
      }
    }
    return [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [report, selected]);

  const fxLevel = report.fxChart.map((p) => ({ date: p.date, value: p[fxPair] }));
  const fxBase = fxLevel.find((p) => p.value != null)?.value;
  const fxData = fxBase ? fxLevel.map((p) => ({ date: p.date, xe: p.value == null ? null : (p.value / fxBase) * 100 })) : [];

  const [share, setShare] = useState("AVGO");
  const underlying = report.underlyings.find((u) => u.id === share) || report.underlyings[0];
  const meta = UNDERLYINGS.find((u) => u.id === underlying?.id);
  const sharePts = underlying ? report.charts[underlying.id] : undefined;
  const shareWindow = span(sharePts, "price");
  const bounce = weekBounce(sharePts);
  const shareSeries = (sharePts || []).filter((p) => p.price != null).map((p) => ({ date: p.date, price: p.price }));

  function applyPreset(id: (typeof PRESETS)[number]["id"]) {
    const to = report.chartTo;
    let from = CHART_MIN;
    if (id === "1W") from = addDays(to, -7);
    else if (id === "1M") from = addDays(to, -31);
    else if (id === "3M") from = addDays(to, -92);
    else if (id === "YTD") from = `${to.slice(0, 4)}-01-01`;
    if (from < CHART_MIN) from = CHART_MIN;
    onFrom(from);
    onTo(to);
  }

  return (
    <section id="movement" className="flex flex-col gap-8">
      <SectionTitle
        kicker="02"
        title="What the price did, and what the currency did."
        text={`Each line is the percent change from the first print between ${fmtDate(report.chartFrom)} and ${fmtDate(report.chartTo)}. It is that whole window, not the bounce off last week’s low.`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
          Reporting date
          <input type="date" value={report.reportingDate} min={REPORT_MIN} max={REPORT_MAX} onChange={(e) => e.target.value && onReporting(e.target.value)} className="h-11 border border-line bg-card px-3 text-sm tracking-normal text-ink normal-case" />
        </label>
        <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
          From
          <input type="date" value={report.chartFrom} min={CHART_MIN} max={report.chartTo} onChange={(e) => e.target.value && onFrom(e.target.value)} className="h-11 border border-line bg-card px-3 text-sm tracking-normal text-ink normal-case" />
        </label>
        <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
          Through
          <input type="date" value={report.chartTo} min={report.chartFrom} max={CHART_MAX} onChange={(e) => e.target.value && onTo(e.target.value)} className="h-11 border border-line bg-card px-3 text-sm tracking-normal text-ink normal-case" />
        </label>
      </div>
        <div className="flex">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p.id)} className="h-11 border border-line bg-card px-3 text-sm text-ink hover:bg-sand">
              {p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
        <MoveKpi label={leadUp?.name || "Price"} value={leadUp?.pct ?? null} note={leadUp?.note || "No price history in this window"} />
        <MoveKpi label={leadDown?.name || "FX"} value={leadDown?.pct ?? null} note={leadDown?.note || "No FX history in this window"} />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setAsset(c.id);
              const held = POSITIONS.find((p) => p.id === c.id);
              if (held && (["SGD", "CHF", "HKD", "AUD", "EUR"] as const).includes(held.ccy as "SGD")) setFxPair(held.ccy as "SGD");
            }}
            className={`h-11 shrink-0 border px-3 text-sm ${asset === c.id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 border border-line bg-card">
          <div className="border-b border-line px-4 py-3">
            <h3 className="font-serif text-lg">Price movement</h3>
            <p className="text-xs text-muted">Change in the local price since the first print in the window. Concord is carried at cost, so it is omitted.</p>
          </div>
          <SeriesChart data={priceData} lines={priceLines} format="pct" height={300} />
        </div>
        <div className="min-w-0 border border-line bg-card">
          <div className="border-b border-line px-4 py-3">
            <h3 className="font-serif text-lg">FX movement</h3>
            <p className="text-xs text-muted">Change in the XE rate since the first print in the window. A US dollar holding has no currency move, so it is left off unless you select it.</p>
          </div>
          <SeriesChart data={fxMoveData} lines={fxLines} format="pct" height={300} />
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Position", "Price", "Trend", "FX rate", "Trend", "USD value"].map((h, i) => (
                <th key={`${h}-${i}`} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className={`border-t border-line ${asset === t.id ? "bg-sand" : ""}`}>
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <PctCell value={t.pricePct} />
                <Trend value={windowTrend(t.pricePct)} />
                <PctCell value={t.fxPct} />
                <Trend value={t.fxPct === 0 ? "Flat" : windowTrend(t.fxPct)} />
                <PctCell value={t.usdPct} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="fx-index" className="min-w-0 border border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h3 className="font-serif text-lg">USD per {fxPair}, rebased</h3>
            <p className="text-xs text-muted">XE close. 100 is the first print in the window. This does not use the Citi loan rate.</p>
          </div>
          <div className="flex">
            {(["AUD", "SGD", "CHF", "HKD", "EUR"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setFxPair(c)} className={`h-11 border border-line px-3 text-sm ${fxPair === c ? "bg-ink text-paper" : "bg-card text-ink"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <SeriesChart data={fxData as Record<string, string | number | null>[]} lines={[{ key: "xe", name: "XE", color: "var(--color-s1)" }]} format="index" height={260} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-xl">Latest close versus the previous {periodWord(period)}</h3>
            <p className="max-w-2xl text-sm text-muted">This is the Excel period print. A large week can be a rebound off a low and still leave the window down.</p>
          </div>
          <div className="flex">
            {PERIODS.map((p) => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`h-11 border border-line px-4 text-sm ${period === p.id ? "bg-ink text-paper" : "bg-card text-ink"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto border border-line bg-card">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                {["Position", "Price", "Trend", "FX rate", "Trend"].map((h, i) => (
                  <th key={`${h}-p-${i}`} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pack.rows.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <PctCell value={t.pricePct} />
                  <Trend value={t.direction} />
                  <PctCell value={t.fxPct} />
                  <Trend value={t.fxDirection} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-serif text-3xl font-medium tracking-tight">The underlyings, on their own</h3>
        <p className="max-w-2xl text-sm text-muted">Share prices behind the coupon notes. They are not positions. The window percent uses the same dates as the charts above.</p>
        <div className="flex gap-2 overflow-x-auto">
          {report.underlyings.map((u) => (
            <button key={u.id} type="button" onClick={() => setShare(u.id)} className={`h-11 shrink-0 border px-3 text-sm ${share === u.id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"}`}>
              {u.name}
            </button>
          ))}
        </div>
        {underlying && meta ? (
          <>
            <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-6">
              <Stat label="Price" value={underlying.price == null ? "—" : underlying.price.toFixed(2)} note={fmtDate(underlying.asOf)} />
              <Stat label="Vs purchase" value={fmtPct(underlying.fromPurchase, 2)} note={`Entry ${meta.purchase.toFixed(2)}`} toneValue={underlying.fromPurchase} />
              <Stat label="Target" value={meta.target.toFixed(0)} note="Workbook target" />
              <Stat label="Strike" value={underlying.strike.toFixed(2)} note={`${(meta.strikePct * 100).toFixed(2)}% of entry`} />
              <Stat label="Cushion" value={fmtPct(underlying.cushion, 2)} note="Price over strike" toneValue={underlying.cushion} />
              <Stat label="This window" value={fmtPct(shareWindow, 2)} note={`${fmtDate(report.chartFrom)} – ${fmtDate(report.chartTo)}`} toneValue={shareWindow} />
            </div>
            {bounce && Math.abs(bounce.pct) >= 0.08 ? (
              <p className="border border-line bg-sand px-4 py-3 text-sm leading-relaxed">
                {underlying.name} is {prosePct(shareWindow)} over this window, and {prosePct(underlying.fromPurchase)} from the purchase price of {meta.purchase.toFixed(2)}. The latest week is {prosePct(bounce.pct)} only because it is measured from the prior close of {bounce.fromPx.toFixed(2)} on {fmtDate(bounce.from)} to {bounce.toPx.toFixed(2)}. That rebound is not the result on the note.
              </p>
            ) : null}
            <div className="min-w-0 border border-line bg-card">
              <PriceChart data={shareSeries} strike={underlying.strike} purchase={meta.purchase} />
            </div>
          </>
        ) : null}
        <div className="overflow-x-auto border border-line bg-card">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                {["Share", "Note", "Price", "Vs purchase", "Strike", "Cushion", "Window", "Latest week", "Trend"].map((h, i) => (
                  <th key={h} className={`px-3 py-2 font-medium ${i > 1 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.underlyings.map((u) => {
                const move = span(report.charts[u.id], "price");
                const week = report.moves.week.underlyings.find((x) => x.id === u.id);
                return (
                  <tr key={u.id} className={`border-t border-line ${share === u.id ? "bg-sand" : ""}`}>
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2">{u.note}</td>
                    <td className="num px-3 py-2 text-right">{u.price == null ? "—" : u.price.toFixed(2)}</td>
                    <td className="num px-3 py-2 text-right"><Signed value={u.fromPurchase} kind="pct" digits={2} /></td>
                    <td className="num px-3 py-2 text-right">{u.strike.toFixed(2)}</td>
                    <td className="num px-3 py-2 text-right"><Signed value={u.cushion} kind="pct" digits={2} /></td>
                    <PctCell value={move} />
                    <PctCell value={week?.pct ?? null} />
                    <Trend value={windowTrend(move)} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Income({ report }: { report: Report }) {
  const rows = report.carry;
  const [asset, setAsset] = useState("pimco-sgd");
  const current = rows.find((r) => r.id === asset) || rows[0];
  const totals = rows.reduce(
    (s, r) => ({
      gross: s.gross + r.grossUsd,
      fee: s.fee + (r.feeUsd || 0),
      carry: s.carry + r.netCarryUsd,
      interest: s.interest + (r.interestUsd || 0),
      ret: s.ret + r.netReturnUsd,
    }),
    { gross: 0, fee: 0, carry: 0, interest: 0, ret: 0 },
  );
  const incomeHead = current ? (current.ccy === "USD" && current.investment === "FCN" ? "Coupon" : current.investment === "TD" ? "Interest" : current.investment === "BYD" ? "Settlement" : current.investment === "FCN" ? "Coupon" : "Dividend") : "Income";

  return (
    <section id="income" className="flex flex-col gap-6">
      <SectionTitle
        kicker="03"
        title="Investment income"
        text="Coverage of interest, in US dollars. Gross income, fees and net carry are the booked dollars. Interest is the Citi accrual on the loan sheet. The reporting date cuts both off. Net carry is gross income less the fee."
      />
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Investment", "Status", "Gross income", "Fee", "Net carry", "Interest", "Net return", "Coverage", "Indicator", "Guidance"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 1 && i < 8 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-line ${current?.id === r.id ? "bg-sand" : ""}`}>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.investment} · {r.ccy}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium ${r.status === "Active" ? "bg-forest-soft text-forest" : "bg-oxblood-soft text-oxblood"}`}>{r.status}</span>
                </td>
                <td className="num px-3 py-2 text-right">{fmtUsd(r.grossUsd)}</td>
                <td className="num px-3 py-2 text-right">{r.feeUsd == null ? "—" : fmtUsd(r.feeUsd)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(r.netCarryUsd)}</td>
                <td className="num px-3 py-2 text-right">{r.interestUsd == null ? "—" : fmtUsd(r.interestUsd)}</td>
                <td className="num px-3 py-2 text-right"><Signed value={r.netReturnUsd} /></td>
                <td className="num px-3 py-2 text-right font-medium">{r.ratio == null ? "—" : `${r.ratio.toFixed(2)}×`}</td>
                <td className="px-3 py-2"><Indicator name={r.indicator} /></td>
                <td className="px-3 py-2 text-xs text-muted">{r.guidance}</td>
              </tr>
            ))}
            <tr className="border-t border-ink bg-sand font-medium">
              <td className="px-3 py-2" colSpan={2}>Total, USD</td>
              <td className="num px-3 py-2 text-right">{fmtUsd(totals.gross)}</td>
              <td className="num px-3 py-2 text-right">{fmtUsd(totals.fee)}</td>
              <td className="num px-3 py-2 text-right">{fmtUsd(totals.carry)}</td>
              <td className="num px-3 py-2 text-right">{fmtUsd(totals.interest)}</td>
              <td className="num px-3 py-2 text-right"><Signed value={totals.ret} /></td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 border border-line sm:grid-cols-4">
        <div className="bg-forest-soft px-3 py-3 text-sm"><span className="font-medium">Strong</span> · above 2.00×. Income comfortably covers interest.</div>
        <div className="bg-sand px-3 py-3 text-sm"><span className="font-medium">Adequate</span> · 1.50× to 2.00×. Sufficient coverage.</div>
        <div className="bg-card px-3 py-3 text-sm"><span className="font-medium">Tight</span> · 1.00× to 1.50×. Limited buffer.</div>
        <div className="bg-oxblood-soft px-3 py-3 text-sm"><span className="font-medium">Weak</span> · below 1.00×. Income does not cover interest.</div>
      </div>

      {current ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setAsset(r.id)}
                className={`h-11 shrink-0 border px-3 text-sm ${current.id === r.id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"}`}
              >
                {r.investment} {r.ccy}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto border border-line bg-card">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-sand px-3 py-2 text-left font-medium" rowSpan={2}>Date</th>
                  <th className="bg-forest px-3 py-2 text-center font-medium text-paper" colSpan={5}>{current.incomeTitle}</th>
                  <th className="bg-ink px-3 py-2 text-center font-medium text-paper" colSpan={2}>Loan interest expense</th>
                </tr>
                <tr className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
                  {[
                    "Cost",
                    "Shares held",
                    "Dist. / share",
                    `${incomeHead} (${current.ccy})`,
                    "USD value",
                    current.interestCcy ? `Accrued interest (${current.interestCcy})` : "Accrued interest",
                    "Accrued interest (USD)",
                  ].map((h, i) => (
                    <th key={`${h}-${i}`} className="px-3 py-2 text-right font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.months.map((m) => (
                  <tr key={m.ym} className="border-t border-line">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{m.tag}</td>
                    <td className="num px-3 py-2 text-right">{m.cost == null ? "" : fmtNum(m.cost)}</td>
                    <td className="num px-3 py-2 text-right">{m.shares == null ? "" : fmtNum(m.shares)}</td>
                    <td className="num px-3 py-2 text-right">{m.dist == null ? "" : m.dist.toFixed(6)}</td>
                    <td className="num px-3 py-2 text-right">{m.incomeNominal ? fmtNum(m.incomeNominal) : ""}</td>
                    <td className="num px-3 py-2 text-right">{m.incomeUsd ? fmtNum(m.incomeUsd) : ""}</td>
                    <td className="num px-3 py-2 text-right">{m.interestNominal ? fmtNum(m.interestNominal) : ""}</td>
                    <td className="num px-3 py-2 text-right">{m.interestUsd ? fmtNum(m.interestUsd) : ""}</td>
                  </tr>
                ))}
                <tr className="border-t border-ink bg-sand font-medium">
                  <td className="px-3 py-2" colSpan={4}>Total</td>
                  <td className="num px-3 py-2 text-right">{fmtNum(current.months.reduce((s, m) => s + m.incomeNominal, 0))}</td>
                  <td className="num px-3 py-2 text-right">{fmtNum(current.months.reduce((s, m) => s + m.incomeUsd, 0))}</td>
                  <td className="num px-3 py-2 text-right">{current.interestCcy ? fmtNum(current.months.reduce((s, m) => s + m.interestNominal, 0)) : ""}</td>
                  <td className="num px-3 py-2 text-right">{fmtNum(current.months.reduce((s, m) => s + m.interestUsd, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            One row per month. A stub of interest before the first distribution is included on that first row. Fees stay in the summary above. The USD column is the amount booked. USD interest is nominal times the Citi rate on that loan row.
          </p>
        </>
      ) : null}
    </section>
  );
}

export function ShareholdersRoi() {
  const cards = [
    { label: "Cumulative ROI", row: SHAREHOLDER.full, note: "Jan 25 – Oct 26" },
    { label: "Year to date", row: SHAREHOLDER.ytd, note: "2026" },
    { label: "Excluding TPC and CB", row: SHAREHOLDER.exTpc, note: "Cumulative" },
    { label: "YTD, excl. TPC and CB", row: SHAREHOLDER.ytdEx, note: "2026" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border-l-2 border-l-forest bg-card px-4 py-5">
            <p className="text-xs tracking-widest text-muted uppercase">{card.label}</p>
            <p className="num mt-2 font-serif text-3xl tracking-tight text-forest">{fmtPct(card.row.roi)}</p>
            <p className="mt-2 text-xs text-muted">
              {card.note} · {fmtPct(card.row.ann)} annualised
            </p>
            <p className="text-xs text-muted">
              Net {fmtUsd(card.row.net)} on {fmtUsd(card.row.capital)} TWA
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">
        Capital (TWA) is the time-weighted average. The exclusion cards take out TPC and Concord Blue. These figures do not move with the reporting date.
      </p>
    </div>
  );
}

function Indicator({ name }: { name: CarryIndicator }) {
  if (!name) return null;
  const cls =
    name === "Strong" ? "bg-forest-soft text-forest" : name === "Weak" ? "bg-oxblood-soft text-oxblood" : name === "Adequate" ? "bg-sand text-ink" : "bg-card text-ink";
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium ${cls}`}>{name}</span>;
}

function Trend({ value }: { value: string }) {
  const cls = value === "Falling" ? "text-oxblood" : value === "Rising" ? "text-forest" : "text-muted";
  return <td className={`px-3 py-2 text-right ${cls}`}>{value}</td>;
}

export function Loans({ report }: { report: Report }) {
  const [draw, setDraw] = useState("all");
  const [book, setBook] = useState<"citi" | "xe">("citi");
  const draws = ["all", ...Array.from(new Set(report.loanSchedule.map((r) => r.draw)))];
  const rows = report.loanSchedule.filter((r) => draw === "all" || r.draw === draw);
  const groups = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = map.get(row.month) || [];
      list.push(row);
      map.set(row.month, list);
    }
    return [...map.entries()];
  }, [rows]);
  const sum = (xs: (number | null)[]) => xs.reduce<number>((s, n) => s + (n || 0), 0);
  const bookRows = book === "citi" ? report.loanCiti : report.draws;
  const open = bookRows.filter((d) => d.open);
  const owed = open.reduce((s, d) => s + (d.owedUsd || 0), 0);

  return (
    <section id="loans" className="flex flex-col gap-6">
      <SectionTitle
        kicker="04"
        title="Loan expense"
        text="Each row is a month on the loan expense sheet. Accrued interest, interest settled and principal repaid are shown in nominal and in USD. USD on this schedule is nominal times the Citi rate on that row — columns T and W."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm text-muted">Citi is the month-end rate for the loan. It restates the open balances in this section only. The summary stays on XE.</p>
        <div className="flex">
          <button type="button" onClick={() => setBook("citi")} className={`h-11 border border-line px-4 text-sm ${book === "citi" ? "bg-ink text-paper" : "bg-card text-ink"}`}>Citi</button>
          <button type="button" onClick={() => setBook("xe")} className={`h-11 border border-line px-4 text-sm ${book === "xe" ? "bg-ink text-paper" : "bg-card text-ink"}`}>XE</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        <Kpi label="Owed" value={fmtUsd(owed)} note={book === "citi" ? "Open draws at each draw’s Citi rate" : "Open draws at the summary XE rate"} />
        <Kpi label="Accrued, Citi USD" value={fmtUsd(sum(rows.map((r) => r.accruedUsd)))} note={draw === "all" ? "All draws through the date" : draw} />
        <Kpi label="Interest settled" value={fmtUsd(sum(rows.map((r) => r.settledUsd)))} note="Cash paid or capitalised, at Citi" />
        <Kpi label="Principal repaid" value={fmtUsd(sum(rows.map((r) => r.repaidUsd)))} note="At the row’s Citi rate" />
      </div>

      <h3 className="font-serif text-xl">Open draws</h3>
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Draw", "Ccy", "Type", "Principal", "Unpaid", "Rate", book === "citi" ? "Citi FX" : "XE", "Owed USD", "Interest USD"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 2 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {open.map((d) => (
              <tr key={d.name} className="border-t border-line">
                <td className="px-3 py-2">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted">{d.ref}</div>
                </td>
                <td className="px-3 py-2">{d.ccy}</td>
                <td className="px-3 py-2">{d.type} · {d.pay}</td>
                <td className="num px-3 py-2 text-right">{fmtQty(d.principal)}</td>
                <td className="num px-3 py-2 text-right">{fmtQty(d.unpaid)}</td>
                <td className="num px-3 py-2 text-right">{d.rate == null ? "—" : fmtPct(d.rate, 2)}</td>
                <td className="num px-3 py-2 text-right">
                  {fmtFx(d.fx)}
                  {d.fxFallback ? <div className="text-xs text-oxblood">XE</div> : null}
                </td>
                <td className="num px-3 py-2 text-right">{fmtUsd(d.owedUsd)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(d.interestUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-serif text-xl">Realised FX on repayments</h3>
      <p className="text-sm text-muted">Locked at the historical payment rate. Positive is a gain. This block does not move with the FX toggle.</p>
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Draw", "Status", "Ccy", "Nominal paid", "USD at entry", "USD paid", "Gain / (loss)"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 2 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REALIZED.map((r) => (
              <tr key={`${r.draw}-${r.status}`} className="border-t border-line">
                <td className="px-3 py-2 font-medium">{r.draw}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.ccy}</td>
                <td className="num px-3 py-2 text-right">{fmtQty(r.paid)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(r.usdEntry)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(r.usdPaid)}</td>
                <td className="num px-3 py-2 text-right"><Signed value={r.gain} /></td>
              </tr>
            ))}
            <tr className="border-t border-ink bg-sand font-medium">
              <td className="px-3 py-2" colSpan={6}>Total realised</td>
              <td className="num px-3 py-2 text-right"><Signed value={REALIZED.reduce((s, r) => s + r.gain, 0)} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-serif text-xl">Monthly loan expense</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {draws.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setDraw(id)}
            className={`h-11 shrink-0 border px-3 text-sm ${draw === id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink"}`}
          >
            {id === "all" ? "All draws" : id}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-3 py-2 font-medium" rowSpan={2}>Date</th>
              <th className="px-3 py-2 font-medium" rowSpan={2}>Draw</th>
              <th className="px-3 py-2 font-medium" rowSpan={2}>Ccy</th>
              <th className="px-3 py-2 text-right font-medium" rowSpan={2}>Rate</th>
              <th className="px-3 py-2 text-right font-medium" rowSpan={2}>Principal</th>
              <th className="px-3 py-2 text-center font-medium" colSpan={2}>Accrued interest</th>
              <th className="px-3 py-2 text-center font-medium" colSpan={2}>Interest paid</th>
              <th className="px-3 py-2 text-center font-medium" colSpan={2}>Principal repaid</th>
              <th className="px-3 py-2 text-right font-medium" rowSpan={2}>Owed</th>
              <th className="px-3 py-2 text-right font-medium" rowSpan={2}>Citi rate</th>
            </tr>
            <tr>
              {["Nominal", "USD", "Nominal", "USD", "Nominal", "USD"].map((h, i) => (
                <th key={`${h}-${i}`} className="px-3 py-2 text-right font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([ym, list]) => (
              <MonthBlock key={ym} ym={ym} list={list} single={draw !== "all"} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Interest paid is the amount settled that month: cash on a paying loan, capitalised on a PIK loan. The USD columns on this schedule always use the Citi rate on the same row.
        {book === "xe" ? " The open-draw balances above are on XE, so they will not match those USD columns." : " The open-draw balances above use the same Citi print."}
      </p>
    </section>
  );
}

function fmtRate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 6 });
}

export function LoanFxExposure({ report }: { report: Report }) {
  const rows = report.draws.filter((d) => d.open);
  const asOf = report.mode === "monthend" ? report.monthEnd : report.reportingDate;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-serif text-xl">Margin loan FX exposure and all-in gain / (loss)</h3>
        <p className="text-sm text-muted">
          + gain / − loss. Current FX is the XE rate on {fmtDate(asOf)}, so it follows the reporting date. A higher USD rate makes the loan more expensive. Interest added is capitalised PIK as a percent of the original principal. All-in is the FX result less that interest.
        </p>
      </div>
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-ink text-left text-xs tracking-wide text-paper uppercase">
            <tr>
              {["Active draws", "Loan reference", "Currency", "Interest type", "Initial spot FX", "Current FX", "FX gain / (loss)", "Interest added to principal", "USD all-in gain / (loss)"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 3 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const fx = d.fx == null || !d.entryFx ? null : 1 - d.fx / d.entryFx;
              const added = d.pay === "PIK" && d.original ? (d.principal - d.original) / d.original : null;
              const allIn = fx == null ? null : fx - (added || 0);
              const ref = d.ref.replace(/^D\d+-/, "");
              return (
                <tr key={d.name} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{d.name}</td>
                  <td className="num px-3 py-2">{ref}</td>
                  <td className="px-3 py-2">{d.ccy}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium ${d.type === "Floating" ? "bg-oxblood-soft text-oxblood" : "bg-forest-soft text-forest"}`}>{d.type}</span>
                  </td>
                  <td className="num px-3 py-2 text-right">{fmtRate(d.entryFx)}</td>
                  <td className="num px-3 py-2 text-right">{fmtRate(d.fx)}</td>
                  <td className="num px-3 py-2 text-right"><Signed value={fx} kind="pct" digits={2} /></td>
                  <td className="num px-3 py-2 text-right">{added == null ? "" : fmtPct(added, 2)}</td>
                  <td className="num px-3 py-2 text-right"><Signed value={allIn} kind="pct" digits={2} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthBlock({
  ym,
  list,
  single,
}: {
  ym: string;
  list: Report["loanSchedule"];
  single: boolean;
}) {
  const usd = (pick: (r: Report["loanSchedule"][number]) => number | null) => list.reduce((s, r) => s + (pick(r) || 0), 0);
  const nom = (pick: (r: Report["loanSchedule"][number]) => number) => list.reduce((s, r) => s + pick(r), 0);
  return (
    <>
      <tr className="border-t border-ink bg-sand">
        <td className="px-3 py-2 font-medium" colSpan={5}>{fmtMonth(ym)}</td>
        <td className="num px-3 py-2 text-right">{single ? fmtQty(nom((r) => r.accrued)) : ""}</td>
        <td className="num px-3 py-2 text-right">{fmtUsd(usd((r) => r.accruedUsd))}</td>
        <td className="num px-3 py-2 text-right">{single ? fmtQty(nom((r) => r.settled)) : ""}</td>
        <td className="num px-3 py-2 text-right">{fmtUsd(usd((r) => r.settledUsd))}</td>
        <td className="num px-3 py-2 text-right">{single ? fmtQty(nom((r) => r.repaid)) : ""}</td>
        <td className="num px-3 py-2 text-right">{fmtUsd(usd((r) => r.repaidUsd))}</td>
        <td colSpan={2} />
      </tr>
      {list.map((r, i) => (
        <tr key={`${r.draw}-${r.date}-${i}`} className="border-t border-line">
          <td className="num px-3 py-2">{fmtDate(r.date)}</td>
          <td className="px-3 py-2">
            <div className="font-medium">{r.draw}</div>
            <div className="text-xs text-muted">{r.pay === "PIK" ? "PIK" : "Cash"}</div>
          </td>
          <td className="px-3 py-2">{r.ccy}</td>
          <td className="num px-3 py-2 text-right">{r.interestRate == null ? "—" : fmtPct(r.interestRate, 2)}</td>
          <td className="num px-3 py-2 text-right">{fmtQty(r.principal)}</td>
          <td className="num px-3 py-2 text-right">{fmtQty(r.accrued)}</td>
          <td className="num px-3 py-2 text-right">{fmtUsd(r.accruedUsd)}</td>
          <td className="num px-3 py-2 text-right">{r.settled ? fmtQty(r.settled) : "—"}</td>
          <td className="num px-3 py-2 text-right">{r.settled ? fmtUsd(r.settledUsd) : "—"}</td>
          <td className="num px-3 py-2 text-right">{r.repaid ? fmtQty(r.repaid) : "—"}</td>
          <td className="num px-3 py-2 text-right">{r.repaid ? fmtUsd(r.repaidUsd) : "—"}</td>
          <td className="num px-3 py-2 text-right">{fmtQty(r.owed)}</td>
          <td className="num px-3 py-2 text-right">{fmtFx(r.citi)}</td>
        </tr>
      ))}
    </>
  );
}

function MoneyCell({ nominal, usd, strong }: { nominal?: number; usd?: number; strong?: boolean }) {
  if (nominal == null || (Math.abs(nominal) < 0.005 && Math.abs(usd || 0) < 0.005)) {
    return <td className="num px-3 py-2 text-right text-muted">—</td>;
  }
  return (
    <td className={`num px-3 py-2 text-right ${strong ? "font-medium" : ""}`}>
      <div>{fmtQty(nominal)}</div>
      <div className={`text-xs ${tone(usd)}`}>{fmtUsd(usd)}</div>
    </td>
  );
}

function PctCell({ value }: { value: number | null }) {
  const hot = value != null && Math.abs(value) >= 0.00005;
  const bg = !hot || value == null ? "" : value > 0 ? "bg-forest-soft" : "bg-oxblood-soft";
  return (
    <td className={`num px-3 py-2 text-right ${bg}`}>
      <Signed value={value} kind="pct" digits={2} />
    </td>
  );
}

function MoveKpi({ label, value, note }: { label: string; value: number | null; note: string }) {
  const accent = value == null || Math.abs(value) < 0.0005 ? "border-l-ink" : value > 0 ? "border-l-forest" : "border-l-oxblood";
  return (
    <div className={`border-l-2 bg-card px-4 py-5 ${accent}`}>
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className={`num mt-2 font-serif text-4xl tracking-tight ${tone(value)}`}>{fmtPct(value, 2)}</p>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}

function Stat({ label, value, note, toneValue }: { label: string; value: string; note: string; toneValue?: number | null }) {
  return (
    <div className="bg-card px-4 py-4">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className={`num mt-1 font-serif text-2xl ${toneValue == null ? "" : tone(toneValue)}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}

function SectionTitle({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs tracking-widest text-muted uppercase">{kicker}</p>
      <h2 className="mt-1 font-serif text-4xl font-medium tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">{text}</p>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-card px-4 py-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="num mt-1 font-serif text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
