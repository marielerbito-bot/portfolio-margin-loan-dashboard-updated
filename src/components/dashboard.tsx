import { useEffect, useMemo, useState } from "react";
import { LevelChart } from "@/components/charts";
import { fmtDate, fmtFx, fmtNum, fmtPct, fmtQty, fmtUsd, Signed, tone } from "@/components/format";
import { Income, LoanFxExposure, Loans, Movement, ShareholdersRoi } from "@/components/sheets";
import {
  buildReport,
  CHART_MAX,
  MONTH_ENDS,
  priceNote,
  REPORT_MAX,
  REPORT_MIN,
  type RateMode,
  type Report,
} from "@/lib/finance";

const SECTIONS = [
  ["summary", "Summary"],
  ["movement", "Daily movement"],
  ["income", "Investment income"],
  ["loans", "Loan expense"],
  ["analysis", "Analysis"],
] as const;

const fieldClass = "h-11 border border-line bg-card px-3 text-sm tracking-normal text-ink normal-case";

export function Dashboard() {
  const [reportingDate, setReportingDate] = useState(REPORT_MAX);
  const [chartFrom, setChartFrom] = useState("2026-09-30");
  const [chartTo, setChartTo] = useState(CHART_MAX);
  const [mode, setMode] = useState<RateMode>("spot");
  const [monthEnd, setMonthEnd] = useState<string>(MONTH_ENDS[MONTH_ENDS.length - 1]);
  const report = useMemo(
    () => buildReport({ reportingDate, chartFrom, chartTo, source: "xe", mode, monthEnd }),
    [reportingDate, chartFrom, chartTo, mode, monthEnd],
  );
  const net = report.totals.usd - report.loanTotals.owedUsd;
  const notes = priceNote(report.positions);
  const [tab, setTab] = useState<(typeof SECTIONS)[number][0]>("summary");

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id === "fx") {
        setTab("summary");
        return;
      }
      if (SECTIONS.some(([key]) => key === id)) setTab(id as (typeof SECTIONS)[number][0]);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function openTab(id: (typeof SECTIONS)[number][0]) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs tracking-widest text-muted uppercase">Portfolio</p>
              <h1 className="font-serif text-3xl font-medium tracking-tight">Book</h1>
            </div>
            <Controls
              reportingDate={reportingDate}
              onReporting={setReportingDate}
              mode={mode}
              onMode={setMode}
              monthEnd={monthEnd}
              onMonthEnd={setMonthEnd}
            />
          </div>
        </div>
      </header>
      <nav className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-3 text-sm sm:px-6">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => openTab(id)}
              className={`shrink-0 border-b-2 bg-transparent pb-1 font-sans ${tab === id ? "border-ink text-ink" : "border-transparent text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto flex min-w-0 max-w-6xl flex-col gap-14 px-4 py-10 sm:px-6">
        {report.warnings.length > 0 && (
          <ul className="border border-line bg-sand px-4 py-3 text-sm text-ink">
            {report.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        {tab === "summary" ? (
          <section id="summary" className="flex flex-col gap-8">
            <SectionTitle kicker="01" title="Summary" text="Open positions at the reporting date, in US dollars at the XE rate. Shareholders ROI is the workbook account, not a restatement of today’s book." />
            <ShareholdersRoi />
            <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
              <Kpi label="Fair value" value={fmtUsd(report.totals.usd)} note="Open positions, XE" />
              <Kpi label="Loans owed" value={fmtUsd(report.loanTotals.owedUsd)} note="Same XE book, for net assets" />
              <Kpi label="Net assets" value={fmtUsd(net)} note="Fair value less loans owed" toneValue={net} />
              <Kpi label="Unrealized result" value={fmtUsd(report.totals.totalGl)} note="Price and FX since entry" toneValue={report.totals.totalGl} />
            </div>
            <FxDesk report={report} />
              <h3 className="font-serif text-xl">Open positions</h3>
              <div className="overflow-x-auto border border-line bg-card">
                <table className="w-full min-w-[880px] border-collapse text-sm">
                  <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
                    <tr>
                      {["Position", "Ccy", "Cost", "Price", "Local value", "FX", "Fair value", "Price move", "FX move", "Price G/L", "FX G/L", "Total"].map((h, i) => (
                        <th key={h} className={`px-3 py-2 font-medium ${i > 1 ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.positions.map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className="px-3 py-2">
                          <div className="font-medium">{p.short}</div>
                          <div className="text-xs text-muted">{p.product}</div>
                        </td>
                        <td className="px-3 py-2">{p.ccy}</td>
                        <td className="num px-3 py-2 text-right">{fmtQty(p.cost)}</td>
                        <td className="num px-3 py-2 text-right">{p.price == null ? "—" : fmtNum(p.price, 4)}</td>
                        <td className="num px-3 py-2 text-right">{fmtQty(p.local)}</td>
                        <td className="num px-3 py-2 text-right">{fmtFx(p.fx)}</td>
                        <td className="num px-3 py-2 text-right">{fmtUsd(p.usd)}</td>
                        <td className={`num px-3 py-2 text-right ${tone(p.priceMove)}`}>{fmtPct(p.priceMove)}</td>
                        <td className={`num px-3 py-2 text-right ${tone(p.fxMove)}`}>{fmtPct(p.fxMove)}</td>
                        <td className="num px-3 py-2 text-right"><Signed value={p.priceGl} /></td>
                        <td className="num px-3 py-2 text-right"><Signed value={p.fxGl} /></td>
                        <td className="num px-3 py-2 text-right"><Signed value={p.totalGl} /></td>
                      </tr>
                    ))}
                    <tr className="border-t border-ink bg-sand font-medium">
                      <td className="px-3 py-2" colSpan={6}>Total</td>
                      <td className="num px-3 py-2 text-right">{fmtUsd(report.totals.usd)}</td>
                      <td />
                      <td />
                      <td className="num px-3 py-2 text-right"><Signed value={report.totals.priceGl} /></td>
                      <td className="num px-3 py-2 text-right"><Signed value={report.totals.fxGl} /></td>
                      <td className="num px-3 py-2 text-right"><Signed value={report.totals.totalGl} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {notes.length > 0 ? (
                <ul className="text-sm text-muted">
                  {notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
              <LoanFxExposure report={report} />
              <LoanToValue report={report} />
            </section>
        ) : null}
        {tab === "movement" ? <Movement report={report} onReporting={setReportingDate} onFrom={setChartFrom} onTo={setChartTo} /> : null}
        {tab === "income" ? <Income report={report} /> : null}
        {tab === "loans" ? <Loans report={report} /> : null}
        {tab === "analysis" ? <Analysis report={report} /> : null}
      </main>
    </div>
  );
}

function Controls(props: {
  reportingDate: string;
  onReporting: (v: string) => void;
  mode: RateMode;
  onMode: (v: RateMode) => void;
  monthEnd: string;
  onMonthEnd: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
        Reporting date
        <input type="date" min={REPORT_MIN} max={REPORT_MAX} value={props.reportingDate} onChange={(e) => e.target.value && props.onReporting(e.target.value)} className={fieldClass} />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-xs tracking-widest text-muted uppercase">Valuation FX</span>
        <div className="flex">
          <Seg on={props.mode === "spot"} onClick={() => props.onMode("spot")}>Spot XE</Seg>
          <Seg on={props.mode === "monthend"} onClick={() => props.onMode("monthend")}>Month-end XE</Seg>
        </div>
      </div>
      {props.mode === "monthend" ? (
        <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
          Month-end
          <select value={props.monthEnd} onChange={(e) => props.onMonthEnd(e.target.value)} className={fieldClass}>
            {MONTH_ENDS.map((d) => (
              <option key={d} value={d}>{fmtDate(d)}</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 flex-1 border border-line px-3 text-sm ${on ? "bg-ink text-paper" : "bg-card text-ink"}`}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, note, toneValue }: { label: string; value: string; note: string; toneValue?: number }) {
  const accent = toneValue == null || Math.abs(toneValue) < 0.5 ? "border-l-ink" : toneValue > 0 ? "border-l-forest" : "border-l-oxblood";
  return (
    <div className={`border-l-2 bg-card px-4 py-5 ${accent}`}>
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className={`num mt-2 font-serif text-3xl tracking-tight ${toneValue == null ? "" : tone(toneValue)}`}>{value}</p>
      <p className="mt-2 text-xs text-muted">{note}</p>
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

const DESK = ["AUD", "SGD", "CHF", "EUR", "HKD"] as const;

function deskFx(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(value < 0.2 ? 5 : 4);
}

function fxRead(vol: number | null) {
  if (vol == null) return "—";
  if (vol < 0.04) return "Relatively low FX fluctuation";
  if (vol < 0.06) return "Moderate FX fluctuation";
  return "Higher FX fluctuation";
}

function FxDesk({ report }: { report: Report }) {
  const rows = DESK.map((ccy) => report.rates.find((r) => r.ccy === ccy)).filter((r): r is Report["rates"][number] => !!r);
  const [ccy, setCcy] = useState<(typeof DESK)[number]>("AUD");
  const selected = rows.find((r) => r.ccy === ccy) || rows[0];
  const series = report.fxChart.map((p) => ({ date: p.date, value: selected ? p[selected.ccy as (typeof DESK)[number]] : null }));
  return (
    <div id="fx" className="flex flex-col gap-4">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Currencies</p>
        <h3 className="mt-1 font-serif text-3xl font-medium tracking-tight">FX desk</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {rows.map((r) => {
          const on = r.ccy === selected?.ccy;
          return (
            <button
              key={r.ccy}
              type="button"
              onClick={() => setCcy(r.ccy as (typeof DESK)[number])}
              className={`border bg-card px-4 py-4 text-left ${on ? "border-2 border-forest" : "border-line"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs tracking-widest uppercase">{r.ccy}</span>
                <span className={`num text-sm ${tone(r.daily)}`}>{fmtPct(r.daily, 2)}</span>
              </div>
              <p className="num mt-2 font-serif text-3xl tracking-tight">{deskFx(r.xe?.rate)}</p>
              <p className="mt-2 text-xs text-muted">8-mo {deskFx(r.low)} – {deskFx(r.high)}</p>
            </button>
          );
        })}
      </div>
      <div className="border border-line bg-card px-2 py-3">
        <LevelChart data={series} name={`${selected?.ccy || ""} per USD`} digits={(selected?.xe?.rate || 1) < 0.2 ? 5 : 4} />
      </div>
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Ccy", "Prev", "Current rate", "Day", "From peak", "Ann. vol", "Read"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 0 && i < 6 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ccy} className={`border-t border-line ${r.ccy === selected?.ccy ? "bg-forest-soft" : ""}`}>
                <td className="px-3 py-2 font-medium">{r.ccy}</td>
                <td className="num px-3 py-2 text-right">{deskFx(r.prev)}</td>
                <td className="num px-3 py-2 text-right">{deskFx(r.xe?.rate)}</td>
                <td className={`num px-3 py-2 text-right ${tone(r.daily)}`}>{fmtPct(r.daily, 2)}</td>
                <td className={`num px-3 py-2 text-right ${tone(r.fromPeak)}`}>{fmtPct(r.fromPeak, 2)}</td>
                <td className="num px-3 py-2 text-right">{fmtPct(r.vol, 1)}</td>
                <td className="px-3 py-2 text-muted">{fxRead(r.vol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Live is the XE rate on the reporting date. Previous is the prior XE print. Book is the cost-weighted entry rate of the open positions in that currency, or of the open loans where there is no asset. The chart follows the movement dates.
      </p>
    </div>
  );
}

function bandTone(band: string) {
  if (band === "Critical" || band === "High") return "text-oxblood";
  if (band === "Elevated") return "text-oxblood";
  if (band === "Moderate") return "text-[#8a6a3b]";
  return "text-forest";
}

function drawLabel(draws: string) {
  const nums = draws.split(", ").map((d) => d.replace(/^Draw\s+/, ""));
  return `Draw ${nums.join(", ")}`;
}

function LoanToValue({ report }: { report: Report }) {
  const short: Record<string, string> = { "sgd-book": "PIMCO SGD", "usd-fund": "PIMCO USD", "fcn-book": "FCN USD" };
  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-serif text-xl">Loan to value</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {report.ltv.map((g) => (
          <div key={g.id} className="border border-line bg-card px-4 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs tracking-widest uppercase">{short[g.id] || g.name}</p>
              <p className={`text-xs tracking-widest uppercase ${bandTone(g.band)}`}>{g.band}</p>
            </div>
            <p className="num mt-3 font-serif text-4xl tracking-tight">{g.ltv == null ? "—" : fmtPct(g.ltv, 1)}</p>
            <p className="mt-3 text-sm text-muted">
              {fmtUsd(g.loanUsd)} loans on {fmtUsd(g.fmvUsd)} · {drawLabel(g.draws)}
            </p>
            <p className="mt-1 text-sm">{g.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Analysis({ report }: { report: Report }) {
  const currentLabel =
    report.source === "citi" && report.mode === "monthend"
      ? report.sensitivity[2]?.label
      : report.source === "xe" && report.mode === "monthend"
        ? report.sensitivity[1]?.label
        : report.source === "xe"
          ? report.sensitivity[0]?.label
          : null;
  return (
    <section id="analysis" className="flex flex-col gap-6 pb-16">
      <SectionTitle
        kicker="05"
        title="Analysis"
        text="Written from the figures on this screen. The summary stays on XE. The Citi column below is the loan-sheet rate, shown for comparison only."
      />
      <div className="flex flex-col gap-4 border border-line bg-card px-5 py-5">
        {report.analysis.map((p) => (
          <p key={p} className="text-sm leading-relaxed">{p}</p>
        ))}
      </div>
      <h3 className="font-serif text-xl">Rate-book sensitivity</h3>
      <p className="text-sm text-muted">Same reporting date and same prices. Only the translation rate changes. Citi month-end falls back to XE wherever the loan book has no print.</p>
      <div className="overflow-x-auto border border-line bg-card">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Book", "Fair value", "Loans owed", "Net assets", "Unrealized"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.sensitivity.map((s) => (
              <tr key={s.label} className={`border-t border-line ${currentLabel === s.label ? "bg-forest-soft" : ""}`}>
                <td className="px-3 py-2 font-medium">{s.label}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(s.fmv)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(s.loans)}</td>
                <td className="num px-3 py-2 text-right">{fmtUsd(s.net)}</td>
                <td className="num px-3 py-2 text-right"><Signed value={s.gl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
