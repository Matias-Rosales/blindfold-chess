export const INITIAL_RATING = 1500;
export const MIN_RATING = 100;

/** Probabilidad esperada de resolver el puzzle (fórmula tipo Elo). */
export function expectedScore(userRating: number, puzzleRating: number): number {
  return 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
}

/** K alto en los primeros puzzles para que el rating se acomode rápido. */
export function kFactor(gamesPlayed: number): number {
  return gamesPlayed < 20 ? 48 : 28;
}

/** Variación de rating: result vale 1 si lo resolvió limpio y 0 si falló. */
export function ratingDelta(
  userRating: number,
  puzzleRating: number,
  result: 0 | 1,
  gamesPlayed: number,
): number {
  const delta = Math.round(kFactor(gamesPlayed) * (result - expectedScore(userRating, puzzleRating)));
  // No bajar del mínimo: el delta informado es el que realmente se aplicó.
  return Math.max(MIN_RATING, userRating + delta) - userRating;
}
