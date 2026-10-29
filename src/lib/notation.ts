import type { Move } from "chess.js";
import type { PieceSymbol, Square } from "../types";

const EN_TO_ES: Record<string, string> = { N: "C", B: "A", R: "T", Q: "D", K: "R" };
const ES_TO_EN: Record<string, string> = { C: "N", A: "B", T: "R", D: "Q" };
const PROMO_ES: Record<string, PieceSymbol> = { d: "q", t: "r", a: "b", c: "n" };

/** "Rxe8#" → "Txe8#", "e8=Q" → "e8=D". */
export function sanToSpanish(san: string): string {
  return san.replace(/[NBRQK]/g, (c) => EN_TO_ES[c]);
}

export interface ParsedMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export type ParseResult = ParsedMove | { error: "empty" | "format" | "illegal" };

const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbnQRBNdtacDTAC]?$/;
const SAN_RE = /^(O-O(-O)?|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=?[NBRQ])?)$/;

const stripSan = (san: string) => san.replace(/[+#]/g, "");

/**
 * Interpreta una jugada escrita por el usuario en notación castellana, inglesa o UCI.
 * Recibe las jugadas legales de la posición para resolver la notación algebraica.
 */
export function parseTypedMove(text: string, legal: Move[]): ParseResult {
  const s = text
    .trim()
    .replace(/[+#!?]/g, "")
    .replace(/^0-0-0$/, "O-O-O")
    .replace(/^0-0$/, "O-O");
  if (!s) return { error: "empty" };

  if (UCI_RE.test(s)) {
    const p = s[4]?.toLowerCase();
    const promotion = p ? (PROMO_ES[p] ?? (p as PieceSymbol)) : undefined;
    return { from: s.slice(0, 2) as Square, to: s.slice(2, 4) as Square, promotion };
  }

  // Castellano → inglés. La "R" queda como está: primero se prueba como torre (inglés).
  const english = s
    .replace(/^([CATD])/, (c) => ES_TO_EN[c])
    .replace(/=([CATD])$/, (_, c: string) => "=" + ES_TO_EN[c]);
  const candidates = [english];
  if (s.startsWith("R")) candidates.push("K" + s.slice(1)); // y si no, como rey
  candidates.push(english.replace(/=?([NBRQ])$/, "=$1")); // "e8D" → "e8=Q"

  if (!candidates.some((c) => SAN_RE.test(c))) return { error: "format" };

  for (const candidate of candidates) {
    const noCapture = candidate.replace("x", "");
    const hit = legal.find((m) => {
      const san = stripSan(m.san);
      return san === candidate || san.replace("x", "") === noCapture;
    });
    if (hit) return { from: hit.from, to: hit.to, promotion: hit.promotion };
  }
  return { error: "illegal" };
}
