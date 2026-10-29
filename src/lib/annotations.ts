// Marcas sobre el tablero como en Lichess: círculos en casillas y flechas entre casillas.
// Clic derecho marca una casilla; arrastrar con clic derecho dibuja una flecha.

import type { Color, Square } from "../types";
import { boardSquares } from "./chess";

export type Brush = "green" | "red" | "blue" | "yellow";

/** Un círculo si `to` falta o es igual a `from`; si no, una flecha. */
export interface Shape {
  from: Square;
  to?: Square;
  brush: Brush;
}

/** Colores de Lichess (chessground). */
export const BRUSH_COLORS: Record<Brush, string> = {
  green: "#15781b",
  red: "#882020",
  blue: "#003088",
  yellow: "#e68f00",
};

/** Como en Lichess: Shift = rojo, Alt = azul, Shift + Alt (o Ctrl/Cmd) = amarillo. */
export function brushFor(mods: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }): Brush {
  const alt = mods.altKey || mods.metaKey;
  if ((mods.shiftKey && alt) || mods.ctrlKey) return "yellow";
  if (mods.shiftKey) return "red";
  if (alt) return "blue";
  return "green";
}

const sameTarget = (a: Shape, b: Shape) => a.from === b.from && (a.to ?? a.from) === (b.to ?? b.from);

/**
 * Agrega una marca. Si ya hay una igual (mismas casillas y color) la borra,
 * y si hay una en las mismas casillas con otro color la reemplaza.
 */
export function toggleShape(shapes: Shape[], shape: Shape): Shape[] {
  const normalized: Shape = shape.to === shape.from ? { from: shape.from, brush: shape.brush } : shape;
  const existing = shapes.find((s) => sameTarget(s, normalized));
  const rest = shapes.filter((s) => !sameTarget(s, normalized));
  return existing?.brush === normalized.brush ? rest : [...rest, normalized];
}

/** Casilla bajo un punto (x, y entre 0 y 1 dentro del tablero), según la orientación. */
export function squareAt(x: number, y: number, orientation: Color): Square | null {
  if (x < 0 || x >= 1 || y < 0 || y >= 1) return null;
  return boardSquares(orientation)[Math.floor(y * 8) * 8 + Math.floor(x * 8)];
}

/** Centro de una casilla en coordenadas del tablero (0 a 8), según la orientación. */
export function squareCenter(square: Square, orientation: Color): { x: number; y: number } {
  const index = boardSquares(orientation).indexOf(square);
  return { x: (index % 8) + 0.5, y: Math.floor(index / 8) + 0.5 };
}
