import { useEffect, useState } from "react";
import {
  applyUci,
  givesMate,
  legalDestinations,
  legalMatches,
  legalMoves,
  opposite,
  pieceAt,
  sideToMove,
  uciToSpanish,
} from "../lib/chess";
import { parseTypedMove, sanToSpanish } from "../lib/notation";
import type { Color, Feedback, LogEntry, MemTime, PieceSymbol, Puzzle, Square } from "../types";

const INTRO_MS = 800; // posición inicial antes de la jugada del rival
const OPPONENT_MS = 550; // demora de la respuesta del rival
const WRONG_FLASH_MS = 900;
const PEEK_MS = 2000;
const SOLUTION_STEP_MS = 750;

/**
 * intro: se muestra la posición antes de la primera jugada del rival.
 * play: le toca al usuario. opponent: está por responder el rival.
 * solution: se están reproduciendo las jugadas de la solución. done: terminado.
 */
type Phase = "idle" | "intro" | "play" | "opponent" | "solution" | "done";

export interface PuzzleState {
  puzzle: Puzzle | null;
  fen: string;
  ply: number; // índice de la próxima jugada en puzzle.moves
  player: Color;
  phase: Phase;
  memTime: MemTime;
  memorizing: boolean; // corre la cuenta regresiva
  hidden: boolean;
  peeking: boolean;
  failed: boolean; // el puzzle ya contó como error
  selected: Square | null;
  lastMove: [Square, Square] | null;
  wrongSquare: Square | null;
  log: LogEntry[];
  feedback: Feedback;
}

const EMPTY_STATE: PuzzleState = {
  puzzle: null,
  fen: "8/8/8/8/8/8/8/8 w - - 0 1",
  ply: 0,
  player: "w",
  phase: "idle",
  memTime: 0,
  memorizing: false,
  hidden: false,
  peeking: false,
  failed: false,
  selected: null,
  lastMove: null,
  wrongSquare: null,
  log: [],
  feedback: { kind: "loading" },
};

/** Estado al empezar un puzzle: la posición antes de la jugada del rival. */
function startState(puzzle: Puzzle, memTime: MemTime): PuzzleState {
  return {
    ...EMPTY_STATE,
    puzzle,
    fen: puzzle.fen,
    // El usuario juega con el color contrario al que mueve en la FEN.
    player: opposite(sideToMove(puzzle.fen)),
    phase: "intro",
    memTime,
    feedback: { kind: "intro" },
  };
}

interface Options {
  /** Puzzle con el que arranca. */
  initialPuzzle: Puzzle | null;
  memTime: MemTime;
  /** En la racha, un error termina el puzzle. */
  endOnMistake: boolean;
  /** Se llama la primera vez que el puzzle cuenta como error. */
  onFail: () => void;
  /** Se llama al resolverlo. `clean` es false si antes había contado como error. */
  onSolve: (clean: boolean) => void;
}

/** Aplica la jugada `ply` del puzzle (la del rival o la de la solución). */
function playScripted(s: PuzzleState): PuzzleState {
  const uci = s.puzzle!.moves[s.ply];
  const applied = applyUci(s.fen, uci);
  if (!applied) return { ...s, ply: s.ply + 1 };
  return {
    ...s,
    fen: applied.fen,
    ply: s.ply + 1,
    log: [...s.log, applied.entry],
    lastMove: [applied.move.from, applied.move.to],
  };
}

export function usePuzzle({ initialPuzzle, memTime, endOnMistake, onFail, onSolve }: Options) {
  const [state, setState] = useState<PuzzleState>(() =>
    initialPuzzle ? startState(initialPuzzle, memTime) : { ...EMPTY_STATE, feedback: { kind: "streakComplete" } },
  );
  const { puzzle, phase, memorizing, wrongSquare, peeking } = state;
  const puzzleId = puzzle?.id;

  // 1. Mostrar la posición y jugar automáticamente la primera jugada del rival.
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => {
      setState((s) => {
        const next = playScripted(s);
        return {
          ...next,
          phase: "play",
          memorizing: s.memTime > 0,
          feedback: { kind: "yourTurn", memTime: s.memTime },
        };
      });
    }, INTRO_MS);
    return () => clearTimeout(t);
  }, [phase, puzzleId]);

  // 2. Cuenta regresiva de memorización. Se limpia si cambia el puzzle o si termina antes.
  useEffect(() => {
    if (!memorizing) return;
    const t = setTimeout(() => {
      setState((s) => ({
        ...s,
        memorizing: false,
        hidden: true,
        selected: null,
        feedback: s.feedback.kind === "yourTurn" ? { kind: "hidden" } : s.feedback,
      }));
    }, state.memTime * 1000);
    return () => clearTimeout(t);
  }, [memorizing, puzzleId, state.memTime]);

  // 3. Respuesta del rival.
  useEffect(() => {
    if (phase !== "opponent") return;
    const t = setTimeout(() => {
      setState((s) => {
        const next = playScripted(s);
        const san = next.log.length > s.log.length ? sanToSpanish(next.log[next.log.length - 1].san) : "";
        return { ...next, phase: "play", feedback: { kind: "opponentMoved", san } };
      });
    }, OPPONENT_MS);
    return () => clearTimeout(t);
  }, [phase, puzzleId]);

  // 4. La casilla roja de error se apaga sola.
  useEffect(() => {
    if (!wrongSquare) return;
    const t = setTimeout(() => setState((s) => ({ ...s, wrongSquare: null })), WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [wrongSquare, puzzleId]);

  // 5. Espiar: las piezas se ven durante 2 s.
  useEffect(() => {
    if (!peeking) return;
    const t = setTimeout(() => setState((s) => ({ ...s, peeking: false })), PEEK_MS);
    return () => clearTimeout(t);
  }, [peeking, puzzleId]);

  // 6. Reproducir la solución de a una jugada.
  useEffect(() => {
    if (phase !== "solution" || !puzzle) return;
    const t = setTimeout(() => {
      setState((s) => {
        if (s.ply >= s.puzzle!.moves.length) {
          const sans = s.log.slice(1).map((m) => sanToSpanish(m.san));
          return { ...s, phase: "done", feedback: { kind: "solution", sans } };
        }
        return playScripted(s);
      });
    }, SOLUTION_STEP_MS);
    return () => clearTimeout(t);
  }, [phase, puzzle, state.ply]);

  // ---------- acciones ----------

  const start = (next: Puzzle, nextMemTime: MemTime) => setState(startState(next, nextMemTime));

  /** Deja el puzzle en blanco, por ejemplo al terminar la cola de la racha. */
  const clear = (feedback: Feedback) => setState({ ...EMPTY_STATE, feedback });

  const canMove = phase === "play" && !!puzzle && sideToMove(state.fen) === state.player;
  const visible = !state.hidden || peeking;

  function registerMistake(square: Square | null, feedback: Feedback) {
    const s = state;
    if (!s.failed) onFail();
    if (endOnMistake) {
      const correct = uciToSpanish(s.fen, s.puzzle!.moves[s.ply]);
      setState({
        ...s,
        failed: true,
        phase: "done",
        memorizing: false,
        hidden: false,
        peeking: false,
        selected: null,
        wrongSquare: square,
        feedback: feedback.kind === "wrong" ? { ...feedback, correct } : feedback,
      });
    } else {
      setState({ ...s, failed: true, selected: null, wrongSquare: square, feedback });
    }
  }

  function attemptMove(from: Square, to: Square, typedPromotion?: PieceSymbol) {
    const s = state;
    const moves = s.puzzle!.moves;
    const expected = moves[s.ply];
    const candidates = legalMatches(s.fen, from, to);

    if (!candidates.length) {
      // Con las piezas a la vista es un descuido; con las piezas ocultas, recordó mal la posición.
      if (visible) setState({ ...s, selected: null, feedback: { kind: "illegalVisible" } });
      else registerMistake(to, { kind: "wrong", reason: "illegal" });
      return;
    }

    const isPromotion = candidates.some((m) => m.promotion);
    let promotion = typedPromotion;
    if (isPromotion && !promotion) {
      // Si la solución indica una pieza, se usa esa; si no, dama.
      promotion = expected.slice(0, 4) === from + to && expected[4] ? (expected[4] as PieceSymbol) : "q";
    }
    const uci = from + to + (isPromotion ? promotion : "");
    const isLast = s.ply === moves.length - 1;
    const correct =
      uci.slice(0, 4) === expected.slice(0, 4) && (!isPromotion || (expected[4] ?? "q") === promotion);

    if (correct || (isLast && givesMate(s.fen, uci))) {
      const applied = applyUci(s.fen, uci)!;
      const next: PuzzleState = {
        ...s,
        fen: applied.fen,
        ply: s.ply + 1,
        log: [...s.log, applied.entry],
        lastMove: [from, to],
        selected: null,
        wrongSquare: null,
      };
      if (next.ply >= moves.length) {
        setState({
          ...next,
          phase: "done",
          memorizing: false,
          hidden: false,
          peeking: false,
          feedback: { kind: "solved", clean: !s.failed },
        });
        onSolve(!s.failed);
      } else {
        setState({ ...next, phase: "opponent", feedback: { kind: "good" } });
      }
      return;
    }

    registerMistake(to, { kind: "wrong", reason: "notTheMove", san: uciToSpanish(s.fen, uci) });
  }

  const clickSquare = (square: Square) => {
    if (!canMove) return;
    const piece = pieceAt(state.fen, square);
    const own = !!piece && piece.color === state.player;
    const { selected } = state;
    if (!selected) {
      // Con las piezas ocultas se puede elegir cualquier casilla, para no revelar nada.
      if (visible && !own) return;
      setState({ ...state, selected: square });
      return;
    }
    if (selected === square) {
      setState({ ...state, selected: null });
      return;
    }
    if (visible && own) {
      setState({ ...state, selected: square });
      return;
    }
    attemptMove(selected, square);
  };

  /** Devuelve true si el texto se procesó y hay que limpiar el campo. */
  const submitTyped = (text: string): boolean => {
    if (!canMove) return true;
    const parsed = parseTypedMove(text, legalMoves(state.fen));
    if ("error" in parsed) {
      if (parsed.error === "empty") return false;
      if (parsed.error === "format") {
        setState({ ...state, feedback: { kind: "badFormat" } });
        return false;
      }
      if (visible) setState({ ...state, selected: null, feedback: { kind: "illegalVisible" } });
      else registerMistake(null, { kind: "wrong", reason: "illegal" });
      return true;
    }
    attemptMove(parsed.from, parsed.to, parsed.promotion);
    return true;
  };

  /** Revela las piezas 2 s. Si `penalize`, cuenta como error. */
  const peek = (penalize: boolean) => {
    if (!state.hidden || phase === "done" || phase === "solution") return;
    if (penalize && !state.failed) {
      onFail();
      setState({ ...state, peeking: true, failed: true, feedback: { kind: "peekPenalty" } });
    } else {
      setState({ ...state, peeking: true });
    }
  };

  const showSolution = () => {
    if (!puzzle || state.ply >= puzzle.moves.length || phase === "solution") return;
    if (phase === "done" && !state.failed) return;
    if (!state.failed) onFail();
    setState({
      ...state,
      phase: "solution",
      failed: true,
      memorizing: false,
      hidden: false,
      peeking: false,
      selected: null,
      wrongSquare: null,
      feedback: { kind: "solution", sans: null },
    });
  };

  const destinations: Square[] =
    canMove && visible && state.selected ? legalDestinations(state.fen, state.selected) : [];

  return {
    state,
    canMove,
    destinations,
    start,
    clear,
    clickSquare,
    submitTyped,
    peek,
    showSolution,
  };
}
