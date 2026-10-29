import { sanToSpanish } from "../lib/notation";
import type { LogEntry } from "../types";

/** Historial de jugadas del puzzle, en notación castellana. */
export function MoveLog({ log }: { log: LogEntry[] }) {
  if (!log.length) return null;
  return (
    <ol className="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums" aria-label="Jugadas">
      {log.map((m, i) => (
        <li key={i} className="text-dim dark:text-dim-dk">
          {m.moveNumber}
          {m.color === "w" ? "." : "…"}{" "}
          <b className="font-semibold text-strong dark:text-strong-dk">{sanToSpanish(m.san)}</b>
        </li>
      ))}
    </ol>
  );
}
