// Genera public/puzzles/*.json a partir de la base de puzzles de Lichess.
//
// Uso:
//   npm run build:puzzles -- <archivo.csv | archivo.csv.zst> [--per-bucket 150] [--seed 1] [--out dir]
//
// Lee el archivo línea por línea (en streaming), se queda con los puzzles populares
// y muy jugados, toma una muestra al azar de cada tramo de 100 puntos de rating y
// escribe un JSON por tramo más un index.json.

import { createReadStream } from "node:fs";
import { mkdir, open, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { createZstdDecompress, zstdDecompressSync } from "node:zlib";
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

// Los "skippable frames" de zstd tienen un número mágico entre 0x184D2A50 y 0x184D2A5F.
const isSkippable = (magic: number) => (magic & 0xfffffff0) === 0x184d2a50;

/**
 * Lichess comprime la base con pzstd: antes de cada frame comprimido hay un
 * skippable frame de 4 bytes con su tamaño. El descompresor en streaming de Node
 * no acepta esos frames, así que se lee cada frame y se descomprime por separado.
 */
async function* readPzstd(path: string): AsyncGenerator<Buffer> {
  const file = await open(path);
  try {
    const header = Buffer.alloc(12);
    let pos = 0;
    for (;;) {
      const { bytesRead } = await file.read(header, 0, 8, pos);
      if (bytesRead === 0) return;
      if (bytesRead < 8 || !isSkippable(header.readUInt32LE(0))) throw new Error(`Formato pzstd inesperado en el byte ${pos}`);
      const skipSize = header.readUInt32LE(4);
      if (skipSize !== 4) {
        pos += 8 + skipSize; // un skippable frame cualquiera: se ignora
        continue;
      }
      await file.read(header, 8, 4, pos + 8);
      const frameSize = header.readUInt32LE(8);
      const frame = Buffer.alloc(frameSize);
      await file.read(frame, 0, frameSize, pos + 12);
      yield zstdDecompressSync(frame);
      pos += 12 + frameSize;
    }
  } finally {
    await file.close();
  }
}

async function openInput(path: string): Promise<NodeJS.ReadableStream> {
  if (!path.endsWith(".zst")) return createReadStream(path);
  const file = await open(path);
  const magic = Buffer.alloc(4);
  await file.read(magic, 0, 4, 0);
  await file.close();
  if (isSkippable(magic.readUInt32LE(0))) return Readable.from(readPzstd(path));
  return createReadStream(path).pipe(createZstdDecompress());
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

  const lines = createInterface({ input: await openInput(file), crlfDelay: Infinity });

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
