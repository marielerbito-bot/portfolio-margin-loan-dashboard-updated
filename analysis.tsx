import type { ReactNode } from "react";
import { fmtPct, fmtUsd, fmtX, Signed } from "@/components/format";
import type { Report } from "@/lib/finance";

/** LTV bands, as used by the loan sheet legend: up to 50 / 70 / 85 / 100 percent, then critical. */
const BANDS: [number, string][] = [
  [0.5, "Low"],
  [0.7, "Moderate"],
  [0.85, "Elevated"],
  [1, "High"],
  [Infinity, "Critical"],
];
const bandOf = (ltv: number) => (BANDS.find(([max]) => ltv <= max) as [number, string])[1];
const CHIP: Record<string, string> = {
  Low: "bg-forest-soft text-forest",
  Moderate: "bg-forest-soft text-forest",
  Elevated: "bg-sand text-s2",
  High: "bg-oxblood-soft text-oxblood",
  Critical: "bg-oxblood text-paper",
};
const CELL: Record<string, string> = {
  Low: "bg-forest-soft text-forest",
  Moderate: "bg-forest-soft text-forest",
  Elevated: "bg-sand text-s2",
  High: "bg-oxblood-soft text-oxblood",
  Critical: "bg-oxblood text-paper",
};

function Chip({ band }: { band: string }) {
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium ${CHIP[band]}`}>{band}</span>;
}

function Block({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="font-serif text-2xl tracking-tight">{title}</h3>
        {text ? <p className="mt-1 max-w-3xl text-sm text-muted">{text}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Table({ head, children, min = 640 }: { head: string[]; children: ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto border border-line bg-card">
      <table className="w-full border-collapse text-sm" style={{ minWidth: min }}>
        <thead className="bg-sand text-left text-xs tracking-wide text-muted uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const Td = ({ children, left, cls = "" }: { children: ReactNode; left?: boolean; cls?: string }) => (
  <td className={`num px-3 py-2 ${left ? "" : "text-right"} ${cls}`}>{children}</td>
);

/** Position of a 0..120% gauge: the fill is the LTV, ticks mark each band edge. */
function Gauge({ ltv }: { ltv: number }) {
  const scale = 1.2;
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  return (
    <div className="relative mt-3 h-2 bg-line" role="img" aria-label={`LTV ${fmtPct(ltv)}`}>
      <div className={`absolute inset-y-0 left-0 ${ltv > 0.85 ? "bg-oxblood" : ltv > 0.7 ? "bg-s2" : "bg-forest"}`} style={{ width: pct(ltv) }} />
      {[0.5, 0.7, 0.85, 1].map((t) => (
        <span key={t} className="absolute -top-1 -bottom-1 w-px bg-ink/40" style={{ left: pct(t) }} />
      ))}
    </div>
  );
}

export function Analysis({ report }: { report: Report }) {
  const positions = report.positions.map((p) => ({ ...p, usd: p.usd ?? 0 }));
  const groups = report.ltv.filter((g) => g.ltv != null && g.fmvUsd > 0);
  const posCcy = (name: string) => positions.find((p) => p.short === name)?.ccy ?? "USD";
  const openDraws = report.draws.filter((d) => d.open && (d.owedUsd ?? 0) > 0);
  const net = report.totals.usd - report.loanTotals.owedUsd;

  // --- collateral price stress -------------------------------------------------------------
  const SHOCKS = [0, -0.05, -0.1, -0.2, -0.3];

  // --- currency position and FX scenarios --------------------------------------------------
  const ccys = [...new Set([...positions.map((p) => p.ccy), ...openDraws.map((d) => d.ccy)])].filter((c) => c !== "USD");
  const assetsBy = (c: string) => positions.filter((p) => p.ccy === c).reduce((s, p) => s + p.usd, 0);
  const loansBy = (c: string) => openDraws.filter((d) => d.ccy === c).reduce((s, d) => s + (d.owedUsd ?? 0), 0);
  const biggestLoan = [...ccys].sort((a, b) => loansBy(b) - loansBy(a))[0];
  const scenarios: { label: string; move: (c: string) => number }[] = [
    { label: "Base", move: () => 0 },
    { label: "US dollar +10% against all", move: () => -0.1 },
    { label: "US dollar −10% against all", move: () => 0.1 },
    ...(biggestLoan ? [{ label: `${biggestLoan} +10% only (largest loan currency)`, move: (c: string) => (c === biggestLoan ? 0.1 : 0) }] : []),
  ];
  const runFx = (move: (c: string) => number) => {
    const fv = positions.reduce((s, p) => s + p.usd * (1 + (p.ccy === "USD" ? 0 : move(p.ccy))), 0);
    const owed = openDraws.reduce((s, d) => s + (d.owedUsd ?? 0) * (1 + move(d.ccy)), 0);
    const worst = groups
      .map((g) => {
        const names = g.draws.split(", ");
        const loan = openDraws.filter((d) => names.includes(d.name)).reduce((s, d) => s + (d.owedUsd ?? 0) * (1 + move(d.ccy)), 0);
        const c = posCcy(g.name);
        const fmv = g.fmvUsd * (1 + (c === "USD" ? 0 : move(c)));
        return { name: g.name, ltv: fmv > 0 ? loan / fmv : 0 };
      })
      .sort((a, b) => b.ltv - a.ltv)[0];
    return { fv, owed, net: fv - owed, worst };
  };
  const base = runFx(() => 0);

  // --- concentration -----------------------------------------------------------------------
  const byPos = [...positions].sort((a, b) => b.usd - a.usd);
  const byCcy = ["USD", ...ccys].map((c) => ({ c, usd: c === "USD" ? positions.filter((p) => p.ccy === "USD").reduce((s, p) => s + p.usd, 0) : assetsBy(c) })).filter((x) => x.usd > 0).sort((a, b) => b.usd - a.usd);
  const top2 = byPos.slice(0, 2).reduce((s, p) => s + p.usd, 0) / (report.totals.usd || 1);

  return (
    <section id="analysis" className="flex flex-col gap-12 pb-16">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">05</p>
        <h2 className="mt-1 font-serif text-4xl font-medium tracking-tight">Analysis</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          How much room the loans have, what a market or currency move would do to them, and where the book is concentrated. Everything here is calculated from the figures on this screen at the reporting date. Stress tests are mechanical what-ifs, not forecasts.
        </p>
      </div>

      <Block title="Reading the book">
        <div className="flex flex-col gap-3 border border-line border-l-ink bg-card px-5 py-5 [border-left-width:3px]">
          {report.analysis.map((p) => (
            <p key={p} className="max-w-4xl text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </Block>

      <Block title="Collateral headroom" text="How far each collateral pool can fall before its loan-to-value crosses 85% (the edge of Elevated) and 100% (loans equal collateral). Where a line is already crossed, the amount to cure it is shown instead.">
        <div className="grid gap-px bg-line md:grid-cols-3">
          {groups.map((g) => {
            const ltv = g.ltv as number;
            const to85 = g.fmvUsd - g.loanUsd / 0.85;
            const to100 = g.fmvUsd - g.loanUsd;
            return (
              <div key={g.id} className="bg-card px-4 py-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted">{g.draws}</p>
                  </div>
                  <Chip band={bandOf(ltv)} />
                </div>
                <p className="num mt-3 font-serif text-4xl tracking-tight">{fmtPct(ltv)}</p>
                <Gauge ltv={ltv} />
                <div className="mt-1 flex justify-between text-[11px] text-muted">
                  <span>0</span>
                  <span>50</span>
                  <span>70</span>
                  <span>85</span>
                  <span>100%</span>
                </div>
                <dl className="mt-4 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Loans / collateral</dt>
                    <dd className="num">
                      {fmtUsd(g.loanUsd)} / {fmtUsd(g.fmvUsd)}
                    </dd>
                  </div>
                  {to100 >= 0 ? (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Fall to reach 100%</dt>
                        <dd className="num">
                          {fmtPct(to100 / g.fmvUsd)} <span className="text-muted">({fmtUsd(to100)})</span>
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Fall to reach 85%</dt>
                        <dd className={`num ${to85 < 0 ? "text-oxblood" : ""}`}>
                          {to85 < 0 ? `Already above (${fmtUsd(-to85)} short)` : `${fmtPct(to85 / g.fmvUsd)} (${fmtUsd(to85)})`}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Shortfall to 100%</dt>
                        <dd className="num text-oxblood">{fmtUsd(-to100)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Add collateral for 85%</dt>
                        <dd className="num">{fmtUsd(g.loanUsd / 0.85 - g.fmvUsd)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Or repay for 85%</dt>
                        <dd className="num">{fmtUsd(g.loanUsd - 0.85 * g.fmvUsd)}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      </Block>

      <Block title="Collateral price stress" text="Loan-to-value if each pool’s market value falls by the shock shown. Loans and exchange rates are held at today’s figures. Cell colour is the LTV band, and the band name is repeated so it never depends on colour alone.">
        <Table head={["Collateral pool", "Today", ...SHOCKS.slice(1).map((s) => fmtPct(s, 0).replace("(", "−").replace(")", ""))]} min={560}>
          {groups.map((g) => (
            <tr key={g.id} className="border-t border-line">
              <Td left cls="font-medium">
                {g.name}
              </Td>
              {SHOCKS.map((s) => {
                const ltv = g.loanUsd / (g.fmvUsd * (1 + s));
                const b = bandOf(ltv);
                return (
                  <td key={s} className={`num px-3 py-2 text-right ${CELL[b]}`}>
                    <span className="font-medium">{fmtPct(ltv)}</span> <span className="text-[11px] opacity-80">{b}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </Table>
      </Block>

      <Block title="Currency position and FX scenarios" text="Net exposure is assets less loans in each currency. A loan only offsets an asset when both are in the same currency. A loan in a currency with no matching asset is a short position: it gains when that currency weakens against the dollar and loses when it strengthens.">
        <Table head={["Currency", "Assets (USD)", "Loans (USD)", "Net exposure", "Share of net assets"]} min={560}>
          {ccys.map((c) => {
            const a = assetsBy(c);
            const l = loansBy(c);
            return (
              <tr key={c} className="border-t border-line">
                <Td left cls="font-medium">
                  {c}
                </Td>
                <Td>{fmtUsd(a)}</Td>
                <Td>{fmtUsd(l)}</Td>
                <Td>
                  <Signed value={a - l} />
                </Td>
                <Td>{fmtPct((a - l) / (net || 1))}</Td>
              </tr>
            );
          })}
        </Table>
        <Table head={["Scenario", "Fair value", "Loans owed", "Net assets", "Change in net assets", "Highest LTV"]} min={760}>
          {scenarios.map((s) => {
            const r = runFx(s.move);
            const d = r.net - base.net;
            return (
              <tr key={s.label} className="border-t border-line">
                <Td left cls="font-medium">
                  {s.label}
                </Td>
                <Td>{fmtUsd(r.fv)}</Td>
                <Td>{fmtUsd(r.owed)}</Td>
                <Td>{fmtUsd(r.net)}</Td>
                <Td>{Math.abs(d) < 0.5 ? "—" : <Signed value={d} />}</Td>
                <td className="num px-3 py-2 text-right">
                  {r.worst ? (
                    <>
                      {r.worst.name} {fmtPct(r.worst.ltv)} <Chip band={bandOf(r.worst.ltv)} />
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Block>

      <Block title="Concentration" text={`The two largest positions are ${fmtPct(top2, 0)} of fair value. Bars show each holding’s share of open-position fair value.`}>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { title: "By position", rows: byPos.map((p) => ({ k: p.short, v: p.usd })) },
            { title: "By currency of the asset", rows: byCcy.map((x) => ({ k: x.c, v: x.usd })) },
          ].map((col) => (
            <div key={col.title} className="border border-line bg-card px-4 py-4">
              <p className="text-xs tracking-widest text-muted uppercase">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.rows.map((r) => {
                  const share = r.v / (report.totals.usd || 1);
                  return (
                    <li key={r.k}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span>{r.k}</span>
                        <span className="num">
                          {fmtUsd(r.v)} <span className="text-muted">· {fmtPct(share)}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-line">
                        <div className="h-full bg-forest" style={{ width: `${Math.max(1, share * 100)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Income against interest" text="Net carry income divided by loan interest, by investment. Above 2.0× is strong, 1.5× to 2.0× adequate, 1.0× to 1.5× tight, and below 1.0× means income did not cover the interest.">
        <Table head={["Investment", "Income (USD)", "Interest (USD)", "Net (USD)", "Cover"]} min={600}>
          {report.coverage.map((c) => {
            const r = c.ratio;
            const word = r == null ? "—" : r > 2 ? "Strong" : r > 1.5 ? "Adequate" : r > 1 ? "Tight" : "Weak";
            return (
              <tr key={c.label} className="border-t border-line">
                <Td left cls="font-medium">
                  {c.label}
                </Td>
                <Td>{fmtUsd(c.income)}</Td>
                <Td>{fmtUsd(c.interest)}</Td>
                <Td>
                  <Signed value={c.income - c.interest} />
                </Td>
                <td className="num px-3 py-2 text-right">
                  {r == null ? "—" : fmtX(r)} <span className={`ml-1 text-xs ${word === "Weak" ? "text-oxblood" : word === "Tight" ? "text-s2" : "text-forest"}`}>{word}</span>
                </td>
              </tr>
            );
          })}
        </Table>
      </Block>

      <Block title="Rate-book sensitivity" text="Same reporting date and prices. Only the translation rate changes. Citi month-end falls back to XE wherever the loan book has no print.">
        <Table head={["Book", "Fair value", "Loans owed", "Net assets", "Unrealized"]} min={640}>
          {report.sensitivity.map((s) => (
            <tr key={s.label} className="border-t border-line">
              <Td left cls="font-medium">
                {s.label}
              </Td>
              <Td>{fmtUsd(s.fmv)}</Td>
              <Td>{fmtUsd(s.loans)}</Td>
              <Td>{fmtUsd(s.net)}</Td>
              <Td>
                <Signed value={s.gl} />
              </Td>
            </tr>
          ))}
        </Table>
      </Block>
    </section>
  );
}
