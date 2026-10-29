import type { Color, PieceSymbol, Square } from "chess.js";

export type { Color, PieceSymbol, Square };

export type Mode = "rated" | "streak";
export type HideStyle = "blind" | "checkers";
export type MemTime = 0 | 3 | 5 | 10; // 0 = no ocultar

export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // UCI, la primera es del rival
  rating: number;
  themes: string[];
}

/** Formato compacto de los JSON: [id, fen, moves, rating, themes]. */
export type CompactPuzzle = [string, string, string, number, string];

export interface PuzzleIndex {
  buckets: { rating: number; count: number; file: string }[];
}

export interface Settings {
  memTime: MemTime;
  hideStyle: HideStyle;
  theme: string; // "" = todos los temas
  showSquareNames: boolean;
}

/** Cómo se ve cada pieza: la pieza real, una ficha o nada. */
export type PieceDisplay = "piece" | "disc" | "none";

export interface LogEntry {
  moveNumber: number;
  color: Color;
  san: string;
}

/** Lo que el panel de mensajes tiene que mostrar en cada momento del puzzle. */
export type Feedback =
  | { kind: "loading" }
  | { kind: "intro" }
  | { kind: "yourTurn"; memTime: MemTime }
  | { kind: "hidden" }
  | { kind: "good" }
  | { kind: "opponentMoved"; san: string }
  | { kind: "illegalVisible" }
  | { kind: "badFormat" }
  | { kind: "wrong"; reason: "illegal" | "notTheMove"; san?: string; correct?: string }
  | { kind: "peekPenalty" }
  | { kind: "solved"; clean: boolean }
  | { kind: "solution"; sans: string[] | null }
  | { kind: "streakComplete" };

export type PoolSource = "loading" | "server" | "imported" | "samples";
