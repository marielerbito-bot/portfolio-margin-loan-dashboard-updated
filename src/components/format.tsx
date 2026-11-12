export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return ym;
  return `${names[mi]} ${y.slice(2)}`;
}

export function fmtUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = Math.abs(value) >= 1000 || Math.abs(value) < 0.005 ? 0 : 2;
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return value < -0.005 ? `($${abs})` : `$${abs}`;
}

export function fmtPct(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  const body = (Math.abs(value) * 100).toFixed(digits);
  return value < -1e-8 ? `(${body}%)` : `${body}%`;
}

export function fmtFx(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = value < 0.5 ? 6 : 4;
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtNum(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return value < -0.005 ? `(${abs})` : abs;
}

export function fmtQty(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function tone(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || Math.abs(value) < 1e-8) return "text-muted";
  return value > 0 ? "text-forest" : "text-oxblood";
}

export function Signed({
  value,
  kind = "usd",
  digits = 1,
}: {
  value: number | null | undefined;
  kind?: "usd" | "pct";
  digits?: number;
}) {
  const text = kind === "pct" ? fmtPct(value, digits) : fmtUsd(value);
  return <span className={`num ${tone(value)}`}>{text}</span>;
}
