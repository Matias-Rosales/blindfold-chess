import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { SAMPLE_PUZZLES } from "../data/samples";
import { applyUci, boardSquares, givesMate, legalMoves } from "./chess";
import { createSampler, parseCsvLine } from "./csv";
import { parseTypedMove, sanToSpanish } from "./notation";
import { buildStreakQueue, fromCompact, pickRatedPuzzle, STREAK_START, STREAK_STEP } from "./puzzles";
import type { Puzzle } from "../types";
import { expectedScore, ratingDelta } from "./rating";

const samples = SAMPLE_PUZZLES.map(fromCompact);

describe("puzzles de ejemplo", () => {
  it.each(samples.map((p) => [p.id, p] as const))("%s se puede resolver y termina en mate", (_, p) => {
    let fen = p.fen;
    for (const uci of p.moves) {
      const applied = applyUci(fen, uci);
      expect(applied, `${p.id}: ${uci}`).not.toBeNull();
      fen = applied!.fen;
    }
    expect(new Chess(fen).isCheckmate()).toBe(true);
  });
});

describe("notación", () => {
  it("traduce SAN al castellano", () => {
    expect(sanToSpanish("Rxe8#")).toBe("Txe8#");
    expect(sanToSpanish("Nf7+")).toBe("Cf7+");
    expect(sanToSpanish("Kh1")).toBe("Rh1");
    expect(sanToSpanish("d1=Q#")).toBe("d1=D#");
  });

  // ej01 después de c8c3: las blancas juegan Txe8#
  const fen = applyUci(samples[0].fen, samples[0].moves[0])!.fen;
  const legal = legalMoves(fen);

  it("acepta castellano, inglés y UCI", () => {
    const expected = { from: "e1", to: "e8" };
    expect(parseTypedMove("Te8", legal)).toMatchObject(expected);
    expect(parseTypedMove("Re8", legal)).toMatchObject(expected); // R = torre en inglés
    expect(parseTypedMove("e1e8", legal)).toMatchObject(expected);
    expect(parseTypedMove("Te8#", legal)).toMatchObject(expected);
  });

  it("prueba la R como rey si no hay torre que juegue", () => {
    expect(parseTypedMove("Rh1", legal)).toMatchObject({ from: "g1", to: "h1" });
  });

  it("distingue formato inválido de jugada ilegal", () => {
    expect(parseTypedMove("", legal)).toEqual({ error: "empty" });
    expect(parseTypedMove("hola", legal)).toEqual({ error: "format" });
    expect(parseTypedMove("Dd4", legal)).toEqual({ error: "illegal" });
  });

  it("acepta enroque con ceros", () => {
    const castle = legalMoves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(parseTypedMove("0-0", castle)).toMatchObject({ from: "e1", to: "g1" });
    expect(parseTypedMove("O-O-O", castle)).toMatchObject({ from: "e1", to: "c1" });
  });

  it("acepta coronación en castellano", () => {
    const promo = legalMoves("8/P6k/8/8/8/8/8/K7 w - - 0 1");
    expect(parseTypedMove("a8=D", promo)).toMatchObject({ from: "a7", to: "a8", promotion: "q" });
    expect(parseTypedMove("a7a8c", promo)).toMatchObject({ promotion: "n" });
  });
});

describe("tablero", () => {
  it("orienta las casillas según el color", () => {
    expect(boardSquares("w")[0]).toBe("a8");
    expect(boardSquares("w")[63]).toBe("h1");
    expect(boardSquares("b")[0]).toBe("h1");
  });

  it("detecta el mate", () => {
    const fen = applyUci(samples[0].fen, samples[0].moves[0])!.fen;
    expect(givesMate(fen, "e1e8")).toBe(true);
    expect(givesMate(fen, "g1f1")).toBe(false);
    expect(applyUci(fen, "e1e2")).not.toBeNull();
    expect(applyUci(fen, "e1d2")).toBeNull();
  });
});

describe("rating", () => {
  it("esperado 0.5 con ratings iguales", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });
  it("usa K 48 al principio y 28 después", () => {
    expect(ratingDelta(1500, 1500, 1, 0)).toBe(24);
    expect(ratingDelta(1500, 1500, 0, 30)).toBe(-14);
  });
  it("no baja de 100", () => {
    expect(110 + ratingDelta(110, 3000, 0, 0)).toBeGreaterThanOrEqual(100);
  });
});

describe("selección", () => {
  it("elige cerca del rating y evita los recientes", () => {
    const picked = pickRatedPuzzle(samples, 1000, ["ej07"], "", () => 0);
    expect(Math.abs(picked!.rating - 1000)).toBeLessThanOrEqual(150);
    expect(picked!.id).not.toBe("ej07");
  });
  it("filtra por tema", () => {
    const picked = pickRatedPuzzle(samples, 1500, [], "bodenMate");
    expect(picked!.id).toBe("ej17");
  });
  it("la racha sube de dificultad con cada puzzle", () => {
    // 150 puzzles por tramo de 100, como la base generada.
    const pool: Puzzle[] = [];
    for (let r = 300; r < 3300; r += 2) pool.push({ id: `p${r}`, fen: "", moves: [], rating: r, themes: [] });
    for (let run = 0; run < 20; run++) {
      const queue = buildStreakQueue(pool, "");
      expect(queue[0].rating).toBeGreaterThanOrEqual(STREAK_START);
      expect(queue[0].rating).toBeLessThan(STREAK_START + 100);
      // El puzzle número n está cerca de 600 + 50·n.
      queue.forEach((p, n) => {
        expect(p.rating).toBeGreaterThanOrEqual(STREAK_START + STREAK_STEP * n);
        expect(p.rating).toBeLessThan(STREAK_START + STREAK_STEP * n + 100);
      });
      expect(new Set(queue.map((p) => p.id)).size).toBe(queue.length);
      expect(queue.at(-1)!.rating).toBeGreaterThan(3150);
    }
  });

  it("con pocos puzzles salta al siguiente más difícil", () => {
    const queue = buildStreakQueue(samples, "");
    expect(queue[0].rating).toBeLessThan(750);
    for (let i = 1; i < queue.length; i++) expect(queue[i].rating).toBeGreaterThanOrEqual(queue[i - 1].rating);
    expect(queue.at(-1)!.rating).toBe(2050);
  });
});

describe("csv", () => {
  const line = "00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,80,83,72,mate mateIn2 middlegame short,https://lichess.org/yyznGmXs/black#34,Italian_Game";
  it("filtra por popularidad y partidas", () => {
    expect(parseCsvLine(line, { minRating: 0, maxRating: 5000, popularOnly: true })).toBeNull();
    expect(parseCsvLine(line, { minRating: 0, maxRating: 5000, popularOnly: false })?.[0]).toBe("00sHx");
  });
  it("muestrea como mucho N por tramo", () => {
    const sampler = createSampler(2);
    for (let i = 0; i < 10; i++) sampler.add([`p${i}`, "", "", 1200 + i, ""]);
    sampler.add(["q", "", "", 1350, ""]);
    expect(sampler.buckets().get(1200)).toHaveLength(2);
    expect(sampler.buckets().get(1300)).toHaveLength(1);
  });
});
