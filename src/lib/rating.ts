import type { HideStyle, MemTime } from "../types";

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

// Bonificación por dificultad de la configuración: el puzzle se trata como si su
// rating fuera más alto, así con una configuración difícil se gana más al resolverlo
// y se pierde menos al fallarlo. Sin ocultar no se entrena la visualización: resta.
const MEM_TIME_BONUS: Record<MemTime, number> = { 0: -300, 10: 0, 5: 100, 3: 200 };
const HIDE_STYLE_BONUS: Record<HideStyle, number> = { checkers: 0, blind: 100 };

export const formatBonus = (bonus: number) => (bonus > 0 ? `+${bonus}` : bonus < 0 ? `−${-bonus}` : "±0");

export function difficultyBonus(memTime: MemTime, hideStyle: HideStyle): number {
  // El estilo solo importa si las piezas se ocultan.
  return MEM_TIME_BONUS[memTime] + (memTime > 0 ? HIDE_STYLE_BONUS[hideStyle] : 0);
}
