// Genera public/puzzles/*.json a partir de la base de puzzles de Lichess.
//
// Uso:
//   npm run build:puzzles -- <archivo.csv | archivo.csv.zst> [--per-bucket 150] [--seed 1] [--out dir]
//
// Lee el archivo línea por línea (en streaming), se queda con los puzzles populares
// y muy jugados, toma una muestra al azar de cada tramo de 100 puntos de rating y
// escribe un JSON por tramo más un index.json.

import { createReadStream } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createZstdDecompress } from "node:zlib";
import { Chess } from "chess.js";
import { createSampler, parseCsvLine } from "../src/lib/csv.ts";
import type { CompactPuzzle, PuzzleIndex } from "../src/types.ts";

const DEFAULT_OUT = join(import.meta.dirname, "..", "public", "puzzles");

function parseArgs(argv: string[]) {
  const args = { file: "", perBucket: 150, seed: 1, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--per-bucket") args.perBucket = Number(argv[++i]);
    else if (argv[i] === "--seed") args.seed = Number(argv[++i]);
    else if (argv[i] === "--out") args.out = argv[++i];
    else args.file = argv[i];
  }
  if (!args.file || !(args.perBucket > 0)) {
    console.error("Uso: npm run build:puzzles -- <lichess_db_puzzle.csv[.zst]> [--per-bucket 150] [--seed 1] [--out dir]");
    process.exit(1);
  }
  return args;
}

/** Generador pseudoaleatorio con semilla (mulberry32), para que el resultado sea reproducible. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Comprueba que la FEN sea válida y que todas las jugadas sean legales. */
function isPlayable([, fen, moves]: CompactPuzzle): boolean {
  try {
    const game = new Chess(fen);
    for (const uci of moves.split(" ")) {
      game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { file, perBucket, seed, out } = parseArgs(process.argv.slice(2));
  const filter = { minRating: 0, maxRating: 5000, popularOnly: true };
  const sampler = createSampler(perBucket, seededRandom(seed));

  let input: NodeJS.ReadableStream = createReadStream(file);
  if (file.endsWith(".zst")) input = input.pipe(createZstdDecompress());
  const lines = createInterface({ input, crlfDelay: Infinity });

  let read = 0;
  let kept = 0;
  for await (const line of lines) {
    read++;
    const row = parseCsvLine(line, filter);
    if (row) {
      kept++;
      sampler.add(row);
    }
    if (read % 500_000 === 0) console.log(`  ${read.toLocaleString("es-AR")} líneas leídas…`);
  }

  // Borrar los JSON de una ejecución anterior para no dejar tramos viejos.
  await mkdir(out, { recursive: true });
  for (const name of await readdir(out)) {
    if (name.endsWith(".json")) await rm(join(out, name));
  }

  const index: PuzzleIndex = { buckets: [] };
  let discarded = 0;
  for (const [rating, rows] of sampler.buckets()) {
    const playable = rows.filter(isPlayable).sort((a, b) => a[3] - b[3]);
    discarded += rows.length - playable.length;
    if (!playable.length) continue;
    const name = `${rating}.json`;
    await writeFile(join(out, name), JSON.stringify(playable));
    index.buckets.push({ rating, count: playable.length, file: name });
  }
  await writeFile(join(out, "index.json"), JSON.stringify(index, null, 2));

  const total = index.buckets.reduce((sum, b) => sum + b.count, 0);
  console.log(`Leídas: ${read.toLocaleString("es-AR")} líneas. Pasaron el filtro: ${kept.toLocaleString("es-AR")}.`);
  console.log(`Guardados: ${total.toLocaleString("es-AR")} puzzles en ${index.buckets.length} tramos (${discarded} descartados por jugadas ilegales).`);
  console.log(`Salida: ${out}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
