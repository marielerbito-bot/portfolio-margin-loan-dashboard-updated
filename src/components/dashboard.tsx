import { useEffect, useMemo, useState } from "react";
import { Analysis } from "@/components/analysis";
import { LevelChart } from "@/components/charts";
import { fmtDate, fmtFx, fmtNum, fmtPct, fmtQty, fmtUsd, tone } from "@/components/format";
import { Income, InvestmentPositions, Loans, Movement, ShareholdersRoi } from "@/components/sheets";
import {
  buildReport,
  CHART_MAX,
  MONTH_ENDS,
  priceNote,
  REPORT_MAX,
  REPORT_MIN,
  type FxSource,
  type RateMode,
  type Report,
} from "@/lib/finance";

const SECTIONS = [
  ["summary", "Summary"],
  ["positions", "Positions"],
  ["movement", "Daily movement"],
  ["income", "Investment income"],
  ["loans", "Margin loan"],
  ["analysis", "Analysis"],
] as const;

const fieldClass = "h-11 border border-line bg-card px-3 text-sm tracking-normal text-ink normal-case";

export function Dashboard() {
  const [reportingDate, setReportingDate] = useState(REPORT_MAX);
  const [chartFrom, setChartFrom] = useState("2026-09-30");
  const [chartTo, setChartTo] = useState(CHART_MAX);
  const [mode, setMode] = useState<RateMode>("spot");
  const [monthSource, setMonthSource] = useState<FxSource>("citi");
  const [monthEnd, setMonthEnd] = useState<string>(MONTH_ENDS[MONTH_ENDS.length - 1]);
  const report = useMemo(
    () => buildReport({ reportingDate, chartFrom, chartTo, source: mode === "monthend" ? monthSource : "xe", mode, monthEnd }),
    [reportingDate, chartFrom, chartTo, mode, monthEnd, monthSource],
  );
  const net = report.totals.usd - report.loanTotals.owedUsd;
  const worst = report.ltv.filter((g) => g.ltv != null).sort((a, b) => (b.ltv as number) - (a.ltv as number)).map((g) => ({ name: g.name, ltv: g.ltv as number, band: g.band }))[0];
  const atRisk = worst != null && worst.ltv > 0.85;
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

  function openMonthEnd() {
    setMode("monthend");
    setReportingDate(monthEnd);
  }

  function chooseMonthEnd(date: string) {
    setMonthEnd(date);
    setReportingDate(date);
  }

  function openTab(id: (typeof SECTIONS)[number][0]) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-[90rem] px-4 pt-6 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center bg-ink font-serif text-2xl text-paper">
                B
              </div>
              <div>
                <p className="text-xs tracking-widest text-muted uppercase">Portfolio and margin loans</p>
                <h1 className="font-serif text-3xl font-medium tracking-tight">Book</h1>
              </div>
            </div>
            <Controls
              reportingDate={reportingDate}
              onReporting={setReportingDate}
              mode={mode}
              onMode={setMode}
              onMonthMode={openMonthEnd}
              monthEnd={monthEnd}
              onMonthEnd={chooseMonthEnd}
              monthSource={monthSource}
              onMonthSource={setMonthSource}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            As of <span className="font-medium text-ink">{fmtDate(report.reportingDate)}</span>
            <span aria-hidden="true"> · </span>
            {mode === "spot"
              ? "valued at spot XE rates"
              : monthSource === "citi"
                ? `valued at ${fmtDate(monthEnd)} month-end Citi rates`
                : `valued at ${fmtDate(monthEnd)} month-end XE rates`}
            <span aria-hidden="true"> · </span>
            prices and rates in US dollars
          </p>
          <div className="mt-4 grid grid-cols-2 gap-px border border-b-0 border-line bg-line md:grid-cols-5">
            <Stat label="Net assets" value={fmtUsd(net)} big toneValue={net} />
            <Stat label="Fair value" value={fmtUsd(report.totals.usd)} />
            <Stat label="Loans owed" value={fmtUsd(report.loanTotals.owedUsd)} />
            <Stat label="Unrealized result" value={fmtUsd(report.totals.totalGl)} toneValue={report.totals.totalGl} />
            <div className="bg-paper px-4 py-3">
              <p className="text-[11px] tracking-widest text-muted uppercase">Highest loan to value</p>
              {worst ? (
                <p className="num mt-1 flex items-baseline gap-2 font-serif text-xl">
                  {fmtPct(worst.ltv)}
                  <span className={`font-sans text-xs ${bandTone(worst.band)}`}>{worst.band}</span>
                </p>
              ) : (
                <p className="mt-1 font-serif text-xl">—</p>
              )}
              <p className="truncate text-xs text-muted">{worst ? worst.name : "No open loans"}</p>
            </div>
          </div>
        </div>
      </header>
      <nav className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur" data-print-hide>
        <div className="mx-auto flex max-w-[90rem] gap-1 overflow-x-auto px-4 text-sm sm:px-6">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => openTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`relative shrink-0 border-b-2 bg-transparent px-3 py-3.5 font-sans ${tab === id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {label}
              {id === "analysis" && atRisk ? <span className="ml-1.5 inline-block size-1.5 rounded-full bg-oxblood align-middle" title="A collateral pool is above 85% loan to value" /> : null}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto flex min-w-0 max-w-[90rem] flex-col gap-14 px-4 py-10 sm:px-6">
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
              <div>
                <p className="text-xs tracking-widest text-muted uppercase">Portfolio holdings</p>
                <h3 className="mt-1 font-serif text-2xl tracking-tight">Open positions</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted">Cost, latest price and US dollar value at the reporting date. Price, FX and income detail are on the Positions tab.</p>
              </div>
              <div className="overflow-x-auto border border-line bg-card">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
                    <tr>
                      {[
                        ["Position", "min-w-[11rem]"],
                        ["Currency", "min-w-[6rem]"],
                        ["Cost", "min-w-[8rem] text-right"],
                        ["Shares", "min-w-[8rem] text-right"],
                        ["Latest price", "min-w-[7rem] text-right"],
                        ["Local value", "min-w-[8.5rem] text-right"],
                        ["FX rate", "min-w-[7rem] text-right"],
                        ["USD value", "min-w-[8.5rem] text-right"],
                      ].map(([h, cls]) => (
                        <th key={h} className={`px-4 py-2.5 font-medium whitespace-nowrap ${cls}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.positions.map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium">{p.short}</div>
                          <div className="text-xs text-muted">{p.product}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.ccy}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{fmtQty(p.cost)}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{p.units == null ? "—" : p.units.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{p.id === "fcn-nvda" || p.id === "fcn-amzn" || p.price == null ? "—" : fmtNum(p.price, 2)}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{fmtQty(p.local)}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{p.fx == null ? "—" : p.fx.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5, useGrouping: false })}</td>
                        <td className="num px-4 py-3 text-right whitespace-nowrap">{fmtUsd(p.usd)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-ink bg-sand font-medium">
                      <td className="px-4 py-3" colSpan={7}>Portfolio total</td>
                      <td className="num px-4 py-3 text-right whitespace-nowrap">{fmtUsd(report.totals.usd)}</td>
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
              <LoanToValue report={report} />
              <MarginLoans report={report} />
            </section>
        ) : null}
        {tab === "positions" ? <InvestmentPositions report={report} /> : null}
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
  onMonthMode: () => void;
  monthEnd: string;
  onMonthEnd: (v: string) => void;
  monthSource: FxSource;
  onMonthSource: (v: FxSource) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
        Reporting date
        <input type="date" min={REPORT_MIN} max={REPORT_MAX} value={props.reportingDate} disabled={props.mode === "monthend"} onChange={(e) => e.target.value && props.onReporting(e.target.value)} className={fieldClass} />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-xs tracking-widest text-muted uppercase">Valuation FX</span>
        <div className="flex">
          <Seg on={props.mode === "spot"} onClick={() => props.onMode("spot")}>Spot XE</Seg>
          <Seg on={props.mode === "monthend"} onClick={props.onMonthMode}>Month-end</Seg>
        </div>
      </div>
      {props.mode === "monthend" ? (
        <>
          <label className="flex flex-col gap-1 text-xs tracking-widest text-muted uppercase">
            Month-end
            <select value={props.monthEnd} onChange={(e) => props.onMonthEnd(e.target.value)} className={fieldClass}>
              {MONTH_ENDS.map((d) => (
                <option key={d} value={d}>{fmtDate(d)}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-widest text-muted uppercase">Month-end rate</span>
            <div className="flex">
              <Seg on={props.monthSource === "citi"} onClick={() => props.onMonthSource("citi")}>Citi</Seg>
              <Seg on={props.monthSource === "xe"} onClick={() => props.onMonthSource("xe")}>XE</Seg>
            </div>
          </div>
        </>
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

function Stat({ label, value, big, toneValue }: { label: string; value: string; big?: boolean; toneValue?: number }) {
  return (
    <div className={`px-4 py-3 ${big ? "bg-ink text-paper" : "bg-paper"}`}>
      <p className={`text-[11px] tracking-widest uppercase ${big ? "text-paper/70" : "text-muted"}`}>{label}</p>
      <p className={`num mt-1 font-serif ${big ? "text-2xl" : "text-xl"} tracking-tight ${big || toneValue == null ? "" : tone(toneValue)}`}>{value}</p>
    </div>
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
  return fmtFx(value);
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
                <td className="num px-3 py-2 text-right">{r.prev == null ? "—" : r.prev.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5, useGrouping: false })}</td>
                <td className="num px-3 py-2 text-right">{r.xe?.rate == null ? "—" : r.xe.rate.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5, useGrouping: false })}</td>
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

function MarginLoans({ report }: { report: Report }) {
  const [scope, setScope] = useState<"active" | "all">("active");
  const rows = report.draws
    .filter((d) => scope === "all" || d.open)
    .sort((a, b) => drawNo(a.name) - drawNo(b.name));
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Funding</p>
        <h3 className="mt-1 font-serif text-3xl font-medium tracking-tight">Margin loans</h3>
      </div>
      <div className="flex gap-2">
        {(["active", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={`h-10 rounded-full px-5 text-sm ${scope === id ? "bg-ink text-paper" : "bg-sand text-muted"}`}
          >
            {id === "active" ? "Active" : "All"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Draw", "Ccy", "Opened", "Maturity", "Principal", "Rate", "Type", "Status", "USD now"].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-medium whitespace-nowrap ${i === 4 || i === 5 || i === 8 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.name} className="border-t border-line">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted">{d.ref}</div>
                </td>
                <td className="px-4 py-3">{d.ccy}</td>
                <td className="num px-4 py-3 whitespace-nowrap">{fmtDate(d.start)}</td>
                <td className="num px-4 py-3 whitespace-nowrap">{fmtDate(d.maturity)}</td>
                <td className="num px-4 py-3 text-right">{fmtQty(d.principal)}</td>
                <td className="num px-4 py-3 text-right">{d.rate == null ? "—" : fmtPct(d.rate, 2)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{d.type} rate</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${d.open ? "bg-forest-soft text-forest" : "bg-sand text-muted"}`}>
                    {d.open ? "Active" : "Matured"}
                  </span>
                </td>
                <td className="num px-4 py-3 text-right">{d.open ? fmtUsd(d.principalUsd) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function drawNo(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 99;
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
