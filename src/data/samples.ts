import type { CompactPuzzle } from "../types";

/**
 * Puzzles de ejemplo, verificados, en el formato de Lichess (la primera jugada es del rival).
 * Sirven para desarrollo y de respaldo si no se pueden cargar los JSON de `public/puzzles/`.
 */
export const SAMPLE_PUZZLES: CompactPuzzle[] = [
  ["ej01", "2r3k1/1b3ppp/8/8/8/2B5/5PPP/4R1K1 b - - 0 1", "c8c3 e1e8", 900, "mateIn1 backRankMate"],
  ["ej02", "7k/1p2N1p1/8/q7/8/3R4/P4PPP/6K1 b - - 0 1", "a5a2 d3h3", 1150, "mateIn1 anastasiaMate"],
  ["ej03", "6k1/5ppp/8/8/P5N1/5n2/1r6/7K w - - 0 1", "g4e5 b2h2", 1100, "mateIn1 arabianMate"],
  ["ej04", "5rk1/p4ppp/5n2/8/8/3B3Q/5PPP/6K1 b - - 0 1", "f6g4 h3h7", 950, "mateIn1 kingsideAttack"],
  ["ej05", "4r2k/p5pp/1q5N/3Q4/8/8/PP3PPP/6K1 b - - 0 1", "b6b2 d5g8 e8g8 h6f7", 1650, "mateIn2 smotheredMate sacrifice"],
  ["ej06", "7k/R2n4/8/8/8/8/5PPP/1R4K1 b - - 0 1", "d7c5 b1b8", 1050, "mateIn1 backRankMate"],
  ["ej07", "3r2k1/5ppp/5n2/8/8/6Q1/1B3PPP/6K1 b - - 0 1", "f6e4 g3g7", 1000, "mateIn1 kingsideAttack"],
  ["ej08", "6k1/2p2ppp/8/8/8/8/3p1PPP/2R3K1 w - - 0 1", "c1c7 d2d1q", 1000, "mateIn1 promotion backRankMate"],
  ["ej09", "4r1k1/3q1ppp/4n3/8/8/8/4QPPP/4R1K1 b - - 0 1", "e6d4 e2e8 d7e8 e1e8", 1450, "mateIn2 backRankMate sacrifice"],
  ["ej10", "4r1k1/pp3Npp/8/8/2Q5/8/PP4PP/5RK1 b - - 0 1", "b7b6 f7h6 g8h8 c4g8 e8g8 h6f7", 2050, "mateIn3 smotheredMate sacrifice doubleCheck"],
  ["ej11", "6k1/5ppp/8/8/6n1/3N4/6PP/6RK w - - 0 1", "d3e5 g4f2", 1200, "mateIn1 smotheredMate"],
  ["ej12", "k7/8/1K6/7p/8/8/8/3R4 b - - 0 1", "h5h4 d1d8", 700, "mateIn1 endgame"],
  ["ej13", "7k/8/6K1/p7/8/8/2Q5/8 b - - 0 1", "a5a4 c2c8", 650, "mateIn1 endgame"],
  ["ej14", "6k1/ppp2ppp/3r4/8/7q/8/PPQ1nPPP/5R1K w - - 0 1", "c2c7 h4h2 h1h2 d6h6", 1800, "mateIn2 anastasiaMate sacrifice"],
  ["ej15", "4r1k1/5ppp/8/4n3/8/8/P2P1P2/3QKB2 w - - 0 1", "a2a3 e5f3", 1250, "mateIn1 doubleCheck discoveredAttack"],
  ["ej16", "r4rk1/pp2bp1p/5Pp1/8/7Q/8/PP3PPP/6K1 b - - 0 1", "e7b4 h4h6 b7b6 h6g7", 1550, "mateIn2 kingsideAttack quietMove"],
  ["ej17", "2kr4/pp3ppp/2n2n2/8/5B2/5Q2/PPP2PPP/5BK1 b - - 0 1", "f6d7 f3c6 b7c6 f1a6", 1750, "mateIn2 bodenMate sacrifice"],
];
