import { useEffect, useMemo } from "react";
import type { DraftPlayer } from "../../../types/draft";

type Props = {
  open: boolean;
  playerA: DraftPlayer | null;
  playerB: DraftPlayer | null;
  onClose: () => void;
};

type MetricDef = {
  key: string;
  label: string;
  getValue: (player: DraftPlayer) => number | null;
  formatValue: (value: number | null) => string;
  deltaDigits: number;
};

type Trend = "up" | "down" | "equal" | "na";

const METRICS: MetricDef[] = [
  {
    key: "avg",
    label: "AVG",
    getValue: (player) => player.avg,
    formatValue: (value) => {
      if (value === null) return "-";
      const text = value.toFixed(3);
      return text.startsWith("0") ? text.slice(1) : text;
    },
    deltaDigits: 3,
  },
  {
    key: "hr",
    label: "HR",
    getValue: (player) => player.hr,
    formatValue: (value) => (value === null ? "-" : String(value)),
    deltaDigits: 0,
  },
  {
    key: "rbi",
    label: "RBI",
    getValue: (player) => player.rbi,
    formatValue: (value) => (value === null ? "-" : String(value)),
    deltaDigits: 0,
  },
  {
    key: "sb",
    label: "SB",
    getValue: (player) => player.sb,
    formatValue: (value) => (value === null ? "-" : String(value)),
    deltaDigits: 0,
  },
  {
    key: "ppa",
    label: "PPA-DUN Value",
    getValue: (player) => player.ppaValue,
    formatValue: (value) => (value === null ? "-" : value.toFixed(1)),
    deltaDigits: 1,
  },
  {
    key: "cost",
    label: "Draft Cost",
    getValue: (player) => player.recommendedBid,
    formatValue: (value) => (value === null ? "-" : `$${Math.round(value)}`),
    deltaDigits: 0,
  },
];

function getTrend(value: number | null, opposite: number | null): Trend {
  if (value === null || opposite === null) return "na";
  if (value > opposite) return "up";
  if (value < opposite) return "down";
  return "equal";
}

function formatSignedDelta(value: number | null, opposite: number | null, digits: number) {
  if (value === null || opposite === null) return "N/A";
  const delta = value - opposite;
  if (Math.abs(delta) < Number.EPSILON) return "0";
  const rounded = delta.toFixed(digits);
  return delta > 0 ? `+${rounded}` : rounded;
}

function trendIcon(trend: Trend) {
  switch (trend) {
    case "up":
      return "▲";
    case "down":
      return "▼";
    case "equal":
      return "=";
    default:
      return "•";
  }
}

function trendClass(trend: Trend) {
  switch (trend) {
    case "up":
      return "text-emerald-300";
    case "down":
      return "text-rose-300";
    case "equal":
      return "text-white/60";
    default:
      return "text-white/40";
  }
}

function normalizedWidth(value: number | null, other: number | null) {
  if (value === null) return 0;
  const max = Math.max(Math.abs(value), Math.abs(other ?? 0), 1);
  const ratio = (Math.abs(value) / max) * 100;
  return Math.max(10, ratio);
}

function valuePerDollar(player: DraftPlayer) {
  if (!Number.isFinite(player.recommendedBid) || player.recommendedBid <= 0) return null;
  return player.ppaValue / player.recommendedBid;
}

export default function PlayerComparisonModal({ open, playerA, playerB, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const rows = useMemo(() => {
    if (!playerA || !playerB) return [];

    return METRICS.map((metric) => {
      const valueA = metric.getValue(playerA);
      const valueB = metric.getValue(playerB);
      return {
        key: metric.key,
        label: metric.label,
        valueA,
        valueB,
        displayA: metric.formatValue(valueA),
        displayB: metric.formatValue(valueB),
        deltaA: formatSignedDelta(valueA, valueB, metric.deltaDigits),
        deltaB: formatSignedDelta(valueB, valueA, metric.deltaDigits),
        trendA: getTrend(valueA, valueB),
        trendB: getTrend(valueB, valueA),
        barA: normalizedWidth(valueA, valueB),
        barB: normalizedWidth(valueB, valueA),
      };
    });
  }, [playerA, playerB]);

  const valuePerDollarA = playerA ? valuePerDollar(playerA) : null;
  const valuePerDollarB = playerB ? valuePerDollar(playerB) : null;

  const vpdMax = Math.max(valuePerDollarA ?? 0, valuePerDollarB ?? 0, 1);

  // Determine efficiency winner + percentage difference
  const vpdWinner: "A" | "B" | "tie" | null = (() => {
    if (valuePerDollarA === null || valuePerDollarB === null) return null;
    if (Math.abs(valuePerDollarA - valuePerDollarB) < 1e-6) return "tie";
    return valuePerDollarA > valuePerDollarB ? "A" : "B";
  })();

  const vpdEdgePercent: number | null = (() => {
    if (valuePerDollarA === null || valuePerDollarB === null) return null;
    const winner = Math.max(valuePerDollarA, valuePerDollarB);
    const loser = Math.min(valuePerDollarA, valuePerDollarB);
    if (loser <= 0) return null;
    return ((winner - loser) / loser) * 100;
  })();

  if (!open || !playerA || !playerB) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close player comparison"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-5 w-[97%] max-w-6xl overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-gradient-to-b from-[#141933] via-[#0d1224] to-[#080c18] shadow-[0_28px_100px_rgba(4,8,20,0.72)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(244,63,94,0.14),transparent_36%),radial-gradient(circle_at_85%_16%,rgba(245,158,11,0.12),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)] [background-size:140px_100%]" />

        <div className="relative flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
          <div>
            <div className="text-xl font-black text-white">Player Comparison</div>
            <div className="text-xs font-semibold text-white/50">Side-by-side analysis from live draft data</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10"
          >
            X
          </button>
        </div>

        <div className="relative space-y-5 p-5">
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-2xl border border-rose-300/25 bg-gradient-to-r from-rose-700/95 to-red-800/95 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-2xl font-black">{playerA.name}</div>
              <div className="mt-1 text-sm font-semibold text-rose-100">
                {playerA.team} - {playerA.positions.join("/")}
              </div>
              <div className="mt-2 text-sm font-bold text-emerald-300">Draft Cost ${playerA.recommendedBid}</div>
            </div>

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-amber-300/75 bg-[#131a2b] text-base font-black text-amber-200">
              VS
            </div>

            <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-700/95 to-orange-700/95 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-2xl font-black">{playerB.name}</div>
              <div className="mt-1 text-sm font-semibold text-amber-100">
                {playerB.team} - {playerB.positions.join("/")}
              </div>
              <div className="mt-2 text-sm font-bold text-emerald-300">Draft Cost ${playerB.recommendedBid}</div>
            </div>
          </div>

          {/* HIGHLIGHT: Value per PPA-DUN Dollar — key efficiency metric */}
          <section className="relative overflow-hidden rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-br from-emerald-900/40 via-[#0a2a1f] to-[#061812] p-5 shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_60%)]" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-200">$</span>
                  Value per PPA-DUN Dollar
                </div>
                <div className="mt-1 text-xs font-semibold text-white/50">Higher = better draft-cost efficiency</div>
              </div>
              {vpdEdgePercent !== null && vpdWinner !== "tie" && (
                <div className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-200">
                  {vpdWinner === "A" ? playerA.name : playerB.name} +{vpdEdgePercent.toFixed(1)}% more efficient
                </div>
              )}
            </div>

            <div className="relative mt-5 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
              {/* Player A value */}
              <div
                className={[
                  "rounded-2xl border px-4 py-3 transition",
                  vpdWinner === "A"
                    ? "border-emerald-300/60 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-black text-rose-200">{playerA.name}</span>
                  {vpdWinner === "A" && (
                    <span className="rounded bg-emerald-400/25 px-1.5 py-0.5 text-[10px] font-black text-emerald-100">
                      BEST
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums text-emerald-300">
                    {valuePerDollarA === null ? "—" : valuePerDollarA.toFixed(3)}
                  </span>
                  <span className="text-[11px] font-bold text-white/45">per $</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-400"
                    style={{ width: `${Math.max(6, ((valuePerDollarA ?? 0) / vpdMax) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-semibold text-white/45">
                  {playerA.ppaValue.toFixed(1)} value / ${playerA.recommendedBid}
                </div>
              </div>

              <div className="hidden md:grid place-items-center">
                <div className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-200">
                  VS
                </div>
              </div>

              {/* Player B value */}
              <div
                className={[
                  "rounded-2xl border px-4 py-3 transition",
                  vpdWinner === "B"
                    ? "border-emerald-300/60 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-black text-amber-200">{playerB.name}</span>
                  {vpdWinner === "B" && (
                    <span className="rounded bg-emerald-400/25 px-1.5 py-0.5 text-[10px] font-black text-emerald-100">
                      BEST
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums text-emerald-300">
                    {valuePerDollarB === null ? "—" : valuePerDollarB.toFixed(3)}
                  </span>
                  <span className="text-[11px] font-bold text-white/45">per $</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                    style={{ width: `${Math.max(6, ((valuePerDollarB ?? 0) / vpdMax) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-semibold text-white/45">
                  {playerB.ppaValue.toFixed(1)} value / ${playerB.recommendedBid}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1223] to-[#090d19] p-4">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)] gap-4 text-xs font-black uppercase tracking-wide text-white/45">
              <div className="text-left">{playerA.name}</div>
              <div className="text-center">Stat</div>
              <div className="text-right">{playerB.name}</div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)] items-center gap-4">
                  <div>
                    <div className="mb-1 text-left text-xs font-black text-white">{row.displayA}</div>
                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-400"
                        style={{ width: `${row.barA}%` }}
                      />
                    </div>
                  </div>

                  <div className="min-w-[360px] text-xs font-black">
                    <div className="grid grid-cols-[92px_1fr_92px] items-center gap-3">
                      <span className={`${trendClass(row.trendA)} text-right tabular-nums`}>
                        {row.deltaA} {trendIcon(row.trendA)}
                      </span>
                      <span className="text-center uppercase tracking-wide text-white/60">{row.label}</span>
                      <span className={`${trendClass(row.trendB)} text-left tabular-nums`}>
                        {trendIcon(row.trendB)} {row.deltaB}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-right text-xs font-black text-white">{row.displayB}</div>
                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className="ml-auto h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                        style={{ width: `${row.barB}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1223] to-[#090d19] p-4">
            <div className="text-xs font-black uppercase tracking-wide text-white/45">Position Flexibility</div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-black">
                  <span className="text-rose-200">{playerA.name}</span>
                  <span className="text-white/55">{playerA.positions.length} positions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {playerA.positions.map((pos) => (
                    <span
                      key={`a-${pos}`}
                      className="rounded-lg border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-xs font-black text-rose-100"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-black">
                  <span className="text-amber-200">{playerB.name}</span>
                  <span className="text-white/55">{playerB.positions.length} positions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {playerB.positions.map((pos) => (
                    <span
                      key={`b-${pos}`}
                      className="rounded-lg border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-xs font-black text-amber-100"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-b from-[#241445] to-[#1a1130] p-4">
            <div className="text-sm font-black text-fuchsia-100">AI Recommendation</div>
            <div className="mt-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-3 text-sm text-white/80">
              Planned for development in V2.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
