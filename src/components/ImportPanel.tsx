import { useState, type ChangeEvent } from "react";
import { useGame } from "../context/GameContext";
import { createSampler, parseCsvLine } from "../lib/csv";
import { readLines } from "../lib/csvFile";
import { isValidFen } from "../lib/chess";
import type { CompactPuzzle } from "../types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

const CAP_OPTIONS = [1000, 3000, 6000];
const fmt = (n: number) => n.toLocaleString("es-AR");

const inputClass =
  "min-h-10 w-full rounded border border-line bg-box-alt px-2 text-strong dark:border-line-dk dark:bg-box-alt-dk dark:text-strong-dk";

/** Importar un CSV propio de la base de Lichess, leído entero en el navegador. */
export function ImportPanel() {
  const { pool, poolSource, importedRows, setImportedPool, resetPool } = useGame();
  const [minRating, setMinRating] = useState(600);
  const [maxRating, setMaxRating] = useState(2600);
  const [cap, setCap] = useState(3000);
  const [popularOnly, setPopularOnly] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [pasted, setPasted] = useState("");

  const finish = (rows: CompactPuzzle[], read: number) => {
    if (!rows.length) {
      setMessage("No encontré puzzles válidos con esos filtros. Revisá que sea el CSV de Lichess descomprimido.");
      return;
    }
    const saved = setImportedPool(rows);
    setMessage(
      `Listo: ${fmt(rows.length)} puzzles elegidos de ${fmt(read)} leídos.` +
        (saved ? "" : " No se pudieron guardar en el navegador: se usan solo en esta sesión."),
    );
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (/\.zst$/i.test(file.name)) {
      setMessage("Ese archivo está comprimido (.zst). Descomprimilo primero y elegí el .csv.");
      return;
    }
    const filter = { minRating: Math.min(minRating, maxRating), maxRating: Math.max(minRating, maxRating), popularOnly };
    const buckets = Math.max(1, Math.ceil((filter.maxRating - filter.minRating + 1) / 100));
    const sampler = createSampler(Math.ceil(cap / buckets));
    setProgress(0);
    setMessage("Leyendo…");
    try {
      const read = await readLines(
        file,
        (line) => {
          const row = parseCsvLine(line, filter);
          if (row) sampler.add(row);
        },
        (fraction, lines) => {
          setProgress(fraction);
          setMessage(`Leyendo… ${fmt(lines)} líneas`);
        },
      );
      finish(sampler.rows(), read);
    } catch (err) {
      setMessage(`No pude leer el archivo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProgress(null);
    }
  };

  const handlePaste = () => {
    const filter = { minRating: 0, maxRating: 5000, popularOnly: false };
    const rows = pasted
      .split(/\r?\n/)
      .map((l) => parseCsvLine(l.trim(), filter))
      .filter((r): r is CompactPuzzle => r !== null)
      .filter((r) => isValidFen(r[1]));
    if (!rows.length) {
      setMessage("No reconocí ninguna línea. Pegá líneas completas del CSV de Lichess.");
      return;
    }
    const base = importedRows ?? [];
    const ids = new Set(base.map((r) => r[0]));
    setPasted("");
    finish([...base, ...rows.filter((r) => !ids.has(r[0]))], rows.length);
  };

  const sourceText = {
    loading: "Cargando puzzles…",
    server: `Usando ${fmt(pool.length)} puzzles de la base de Lichess.`,
    imported: `Usando ${fmt(pool.length)} puzzles importados por vos.`,
    samples: `Usando ${pool.length} puzzles de ejemplo.`,
  }[poolSource];

  return (
    <Card title="Base de puzzles">
      <p className="text-sm">{sourceText}</p>
      <details className="mt-3 group">
        <summary className="cursor-pointer text-sm font-semibold text-primary select-none dark:text-primary-dk">
          Importar tu propio CSV de Lichess
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <p>
            Descargá la base desde{" "}
            <a
              href="https://database.lichess.org/#puzzles"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline dark:text-primary-dk"
            >
              database.lichess.org
            </a>
            . Viene comprimida (.csv.zst): descomprimila con 7-Zip o con <code>zstd -d</code> y elegí el .csv. El archivo
            se lee en tu navegador y se guarda una selección repartida por rating.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-dim dark:text-dim-dk">Rating mínimo</span>
              <input type="number" step={100} value={minRating} onChange={(e) => setMinRating(Number(e.target.value) || 0)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-dim dark:text-dim-dk">Rating máximo</span>
              <input type="number" step={100} value={maxRating} onChange={(e) => setMaxRating(Number(e.target.value) || 4000)} className={inputClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-dim dark:text-dim-dk">Cantidad a guardar</span>
            <select value={cap} onChange={(e) => setCap(Number(e.target.value))} className={inputClass}>
              {CAP_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {fmt(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={popularOnly} onChange={(e) => setPopularOnly(e.target.checked)} className="size-4 accent-primary" />
            Solo puzzles populares y muy jugados
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            disabled={progress !== null}
            className="w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white dark:file:bg-primary-dk"
          />
          {progress !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dk" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-good transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-dim dark:text-dim-dk">También podés pegar líneas del CSV:</span>
            <textarea
              rows={3}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,…"
              className={`${inputClass} py-2 font-mono text-xs`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePaste} disabled={!pasted.trim()}>
              Agregar pegados
            </Button>
            {poolSource === "imported" && (
              <Button
                variant="ghost"
                onClick={() => {
                  resetPool();
                  setMessage("Volviste a la base incluida.");
                }}
              >
                Volver a la base incluida
              </Button>
            )}
          </div>
        </div>
      </details>
      {message && <p className="mt-3 text-sm text-dim dark:text-dim-dk">{message}</p>}
    </Card>
  );
}
