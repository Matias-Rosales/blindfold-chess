// Lectura de filas del CSV de Lichess y muestreo por tramos de rating.
// Lo usan la importación del navegador y el script de preprocesamiento.

import type { CompactPuzzle } from "../types.ts";

export interface CsvFilter {
  minRating: number;
  maxRating: number;
  popularOnly: boolean;
}

export const MIN_POPULARITY = 70;
export const MIN_PLAYS = 300;

/** PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags */
export function parseCsvLine(line: string, filter: CsvFilter): CompactPuzzle | null {
  const f = line.split(",");
  if (f.length < 8 || f[0] === "PuzzleId") return null;
  const rating = Number(f[3]);
  if (!rating || !f[1] || !f[2]) return null;
  if (rating < filter.minRating || rating > filter.maxRating) return null;
  if (filter.popularOnly && (Number(f[5]) < MIN_POPULARITY || Number(f[6]) < MIN_PLAYS)) return null;
  return [f[0], f[1], f[2], rating, f[7]];
}

/** Tramo de 100 puntos al que pertenece un rating (1234 → 1200). */
export const bucketOf = (rating: number) => Math.floor(rating / 100) * 100;

/**
 * Reservoir sampling por tramo: guarda como mucho `perBucket` filas de cada tramo,
 * elegidas al azar de manera uniforme sin tener todo el archivo en memoria.
 */
export function createSampler(perBucket: number, random: () => number = Math.random) {
  const buckets = new Map<number, { seen: number; rows: CompactPuzzle[] }>();
  return {
    add(row: CompactPuzzle) {
      const key = bucketOf(row[3]);
      let bucket = buckets.get(key);
      if (!bucket) buckets.set(key, (bucket = { seen: 0, rows: [] }));
      bucket.seen++;
      if (bucket.rows.length < perBucket) bucket.rows.push(row);
      else {
        const j = Math.floor(random() * bucket.seen);
        if (j < perBucket) bucket.rows[j] = row;
      }
    },
    buckets(): Map<number, CompactPuzzle[]> {
      return new Map([...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([k, b]) => [k, b.rows]));
    },
    rows(): CompactPuzzle[] {
      return [...this.buckets().values()].flat();
    },
  };
}
