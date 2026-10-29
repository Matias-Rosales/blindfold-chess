import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SAMPLE_PUZZLES } from "../data/samples";
import { fromCompact } from "../lib/puzzles";
import { INITIAL_RATING, ratingDelta } from "../lib/rating";
import { LS_POOL, patchJson, readJson, removeKey, writeJson } from "../lib/storage";
import type { CompactPuzzle, PoolSource, Puzzle, PuzzleIndex } from "../types";

const RECENT_STORED = 80;

interface Progress {
  rating: number;
  games: number; // puzzles con rating jugados
  solved: number | null; // resueltos sin errores (null: datos de antes de que se contaran)
  best: number; // récord de racha
  recent: string[]; // ids de los últimos puzzles con rating
}

interface GameContextValue extends Progress {
  /** Variación del último puzzle con rating (no se guarda). */
  lastDelta: number | null;
  pool: Puzzle[];
  /** Cambia cuando cambia el conjunto de puzzles. */
  poolId: string;
  poolSource: PoolSource;
  recordRatedResult: (puzzle: Puzzle, result: 0 | 1) => void;
  recordStreak: (count: number) => void;
  /** Vuelve el rating, los puzzles jugados y el récord a cero. */
  resetStats: () => void;
  /** Reemplaza el conjunto por puzzles importados. Devuelve false si no se pudieron guardar. */
  setImportedPool: (rows: CompactPuzzle[]) => boolean;
  importedRows: CompactPuzzle[] | null;
  resetPool: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const NEW_PROGRESS: Progress = { rating: INITIAL_RATING, games: 0, solved: 0, best: 0, recent: [] };

function loadProgress(storageKey: string): Progress {
  const saved = readJson<Partial<Progress>>(storageKey) ?? {};
  return {
    rating: typeof saved.rating === "number" ? saved.rating : INITIAL_RATING,
    games: typeof saved.games === "number" ? saved.games : 0,
    solved: typeof saved.solved === "number" ? saved.solved : saved.games ? null : 0,
    best: typeof saved.best === "number" ? saved.best : 0,
    recent: Array.isArray(saved.recent) ? saved.recent : [],
  };
}

const samplePool = () => SAMPLE_PUZZLES.map(fromCompact);

async function fetchServerPool(signal: AbortSignal): Promise<Puzzle[]> {
  const base = `${import.meta.env.BASE_URL}puzzles/`;
  const res = await fetch(base + "index.json", { signal });
  if (!res.ok) throw new Error(`index.json: ${res.status}`);
  const index = (await res.json()) as PuzzleIndex;
  const files = await Promise.all(
    index.buckets.map(async (b) => {
      const r = await fetch(base + b.file, { signal });
      if (!r.ok) throw new Error(`${b.file}: ${r.status}`);
      return (await r.json()) as CompactPuzzle[];
    }),
  );
  return files.flat().map(fromCompact);
}

/** Estadísticas del usuario (en su clave `storageKey`) y conjunto de puzzles. */
export function GameProvider({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storageKey));
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [importedRows, setImportedRows] = useState<CompactPuzzle[] | null>(() => {
    const rows = readJson<CompactPuzzle[]>(LS_POOL);
    return rows && rows.length ? rows : null;
  });
  const [serverPool, setServerPool] = useState<Puzzle[] | null>(null);
  const [serverFailed, setServerFailed] = useState(false);

  // Persistencia del progreso.
  useEffect(() => {
    patchJson(storageKey, progress);
  }, [storageKey, progress]);

  // Carga inicial de los puzzles generados por scripts/build-puzzles.ts.
  useEffect(() => {
    const controller = new AbortController();
    fetchServerPool(controller.signal)
      .then((pool) => (pool.length ? setServerPool(pool) : setServerFailed(true)))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("No se pudieron cargar los puzzles; se usan los de ejemplo.", err);
          setServerFailed(true);
        }
      });
    return () => controller.abort();
  }, []);

  // Prioridad: importados por el usuario, después los del servidor y si no, los de ejemplo.
  const { pool, poolSource } = useMemo((): { pool: Puzzle[]; poolSource: PoolSource } => {
    if (importedRows) return { pool: importedRows.map(fromCompact), poolSource: "imported" };
    if (serverPool) return { pool: serverPool, poolSource: "server" };
    if (serverFailed) return { pool: samplePool(), poolSource: "samples" };
    return { pool: [], poolSource: "loading" };
  }, [importedRows, serverPool, serverFailed]);

  const poolId = `${poolSource}:${pool.length}:${pool[0]?.id ?? ""}:${pool.at(-1)?.id ?? ""}`;

  const recordRatedResult = (puzzle: Puzzle, result: 0 | 1) => {
    const delta = ratingDelta(progress.rating, puzzle.rating, result, progress.games);
    setLastDelta(delta);
    setProgress((p) => ({
      ...p,
      rating: p.rating + delta,
      games: p.games + 1,
      solved: p.solved === null ? null : p.solved + result,
      recent: [...p.recent, puzzle.id].slice(-RECENT_STORED),
    }));
  };

  const resetStats = () => {
    setProgress(NEW_PROGRESS);
    setLastDelta(null);
  };

  const recordStreak = (count: number) => setProgress((p) => (count > p.best ? { ...p, best: count } : p));

  const setImportedPool = (rows: CompactPuzzle[]) => {
    const saved = writeJson(LS_POOL, rows);
    setImportedRows(rows);
    setProgress((p) => ({ ...p, recent: [] }));
    return saved;
  };

  const resetPool = () => {
    removeKey(LS_POOL);
    setImportedRows(null);
    setProgress((p) => ({ ...p, recent: [] }));
  };

  return (
    <GameContext.Provider
      value={{
        ...progress,
        lastDelta,
        pool,
        poolId,
        poolSource,
        recordRatedResult,
        recordStreak,
        resetStats,
        setImportedPool,
        importedRows,
        resetPool,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame tiene que usarse dentro de <GameProvider>");
  return ctx;
}
