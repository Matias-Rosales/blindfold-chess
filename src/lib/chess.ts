import { Chess, type Move } from "chess.js";
import type { Color, LogEntry, PieceSymbol, Square } from "../types";
import { sanToSpanish } from "./notation";

const FILES = "abcdefgh";

/** Las 64 casillas en orden de lectura (arriba a la izquierda primero) según la orientación. */
export function boardSquares(orientation: Color): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const file = orientation === "w" ? col : 7 - col;
      const rank = orientation === "w" ? 7 - row : row;
      squares.push((FILES[file] + (rank + 1)) as Square);
    }
  }
  return squares;
}

export function isDarkSquare(square: Square): boolean {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return (file + rank) % 2 === 0;
}

export function sideToMove(fen: string): Color {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

export const opposite = (c: Color): Color => (c === "w" ? "b" : "w");

/** Jugadas legales que van de `from` a `to` (más de una solo si es coronación). */
export function legalMatches(fen: string, from: Square, to: Square): Move[] {
  return new Chess(fen).moves({ verbose: true }).filter((m) => m.from === from && m.to === to);
}

export function legalDestinations(fen: string, from: Square): Square[] {
  return new Chess(fen).moves({ square: from, verbose: true }).map((m) => m.to);
}

export interface AppliedMove {
  fen: string;
  move: Move;
  entry: LogEntry;
}

/** Aplica una jugada UCI. Devuelve null si es ilegal (chess.js 1.x lanza un error). */
export function applyUci(fen: string, uci: string): AppliedMove | null {
  const game = new Chess(fen);
  const moveNumber = Number(fen.split(" ")[5]) || 1;
  try {
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as PieceSymbol | undefined) ?? "q",
    });
    return { fen: game.fen(), move, entry: { moveNumber, color: move.color, san: move.san } };
  } catch {
    return null;
  }
}

export function givesMate(fen: string, uci: string): boolean {
  const applied = applyUci(fen, uci);
  return !!applied && new Chess(applied.fen).isCheckmate();
}

/** La jugada UCI en notación castellana, o la UCI si no se puede jugar. */
export function uciToSpanish(fen: string, uci: string): string {
  const applied = applyUci(fen, uci);
  return applied ? sanToSpanish(applied.move.san) : uci;
}

export function pieceAt(fen: string, square: Square) {
  return new Chess(fen).get(square);
}

export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}
