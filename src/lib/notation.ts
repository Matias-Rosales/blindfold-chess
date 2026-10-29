const EN_TO_ES: Record<string, string> = { N: "C", B: "A", R: "T", Q: "D", K: "R" };

/** "Rxe8#" → "Txe8#", "e8=Q" → "e8=D". */
export function sanToSpanish(san: string): string {
  return san.replace(/[NBRQK]/g, (c) => EN_TO_ES[c]);
}
