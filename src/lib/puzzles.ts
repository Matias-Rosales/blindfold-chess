import type { CompactPuzzle, Puzzle } from "../types";

export const RECENT_LIMIT = 40;
const WINDOW_STEP = 150;
const MAX_WINDOW = 3000;
const STREAK_JITTER = 180;

export function fromCompact([id, fen, moves, rating, themes]: CompactPuzzle): Puzzle {
  return {
    id,
    fen,
    moves: moves.trim().split(/\s+/),
    rating: Number(rating),
    themes: (themes ?? "").split(/\s+/).filter(Boolean),
  };
}

export function filterByTheme(pool: Puzzle[], theme: string): Puzzle[] {
  if (!theme) return pool;
  const matching = pool.filter((p) => p.themes.includes(theme));
  return matching.length ? matching : pool;
}

type Random = () => number;

function randomItem<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

/**
 * Elige un puzzle a ±150 del rating del usuario, ampliando de a 150 si no hay.
 * Evita los últimos 40 jugados (o menos, si el conjunto es chico).
 */
export function pickRatedPuzzle(
  pool: Puzzle[],
  userRating: number,
  recentIds: string[],
  theme: string,
  random: Random = Math.random,
): Puzzle | null {
  const candidates = filterByTheme(pool, theme);
  if (!candidates.length) return null;
  const avoid = Math.min(RECENT_LIMIT, Math.max(0, candidates.length - 3));
  const recent = new Set(avoid ? recentIds.slice(-avoid) : []);
  for (let window = WINDOW_STEP; window <= MAX_WINDOW; window += WINDOW_STEP) {
    const inRange = candidates.filter(
      (p) => Math.abs(p.rating - userRating) <= window && !recent.has(p.id),
    );
    if (inRange.length) return randomItem(inRange, random);
  }
  return randomItem(candidates, random);
}

/** Cola de la racha: ordenada por rating con un poco de aleatoriedad. */
export function buildStreakQueue(pool: Puzzle[], theme: string, random: Random = Math.random): Puzzle[] {
  return filterByTheme(pool, theme)
    .map((puzzle) => ({ puzzle, key: puzzle.rating + random() * STREAK_JITTER }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.puzzle);
}

/** Temas presentes en el conjunto, del más común al menos común. */
export function countThemes(pool: Puzzle[]): { theme: string; count: number }[] {
  const counts = new Map<string, number>();
  pool.forEach((p) => p.themes.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}
