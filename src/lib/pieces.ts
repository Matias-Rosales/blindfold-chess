import type { Color, PieceSymbol } from "../types";

/** Ruta del SVG de una pieza del set cburnett (el de Lichess). */
export const pieceUrl = (color: Color, type: PieceSymbol) =>
  `${import.meta.env.BASE_URL}pieces/cburnett/${color}${type.toUpperCase()}.svg`;
