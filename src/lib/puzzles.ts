import type { CompactPuzzle, Puzzle } from "../types";

export const RECENT_LIMIT = 40;
const WINDOW_STEP = 150;
const MAX_WINDOW = 3000;
export const STREAK_START = 600; // rating objetivo del primer puzzle de la racha
export const STREAK_STEP = 50; // cuánto sube el objetivo con cada puzzle
const STREAK_WINDOW = 100; // se elige al azar entre objetivo y objetivo + 100

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

/**
 * Cola de la racha: una escalera de dificultad. Cada puzzle se elige al azar entre
 * los que están en [objetivo, objetivo + 100) y el objetivo sube 50 por puzzle.
 * Si no hay ninguno en ese rango se toma el siguiente más fácil por encima del objetivo.
 * La cola termina cuando no quedan puzzles más difíciles.
 */
export function buildStreakQueue(pool: Puzzle[], theme: string, random: Random = Math.random): Puzzle[] {
  const remaining = [...filterByTheme(pool, theme)].sort((a, b) => a.rating - b.rating);
  const queue: Puzzle[] = [];
  let target = Math.max(STREAK_START, remaining[0]?.rating ?? 0);
  while (remaining.length) {
    const inWindow = remaining.filter((p) => p.rating >= target && p.rating < target + STREAK_WINDOW);
    const pick = inWindow.length ? randomItem(inWindow, random) : remaining.find((p) => p.rating >= target);
    if (!pick) break;
    queue.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
    // Si hubo que saltar a un puzzle más difícil, la escalera sigue desde ahí.
    if (!inWindow.length) target = pick.rating;
    target += STREAK_STEP;
  }
  return queue;
}

/** Temas presentes en el conjunto, del más común al menos común. */
export function countThemes(pool: Puzzle[]): { theme: string; count: number }[] {
  const counts = new Map<string, number>();
  pool.forEach((p) => p.themes.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}
