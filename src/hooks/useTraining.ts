import { useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { buildStreakQueue, pickRatedPuzzle } from "../lib/puzzles";
import { difficultyBonus } from "../lib/rating";
import type { Mode, Puzzle } from "../types";
import { usePuzzle } from "./usePuzzle";

const STREAK_NEXT_MS = 1100;

interface StreakState {
  count: number;
  queue: Puzzle[];
  index: number; // próximo puzzle de la cola
  peeks: number; // espiadas disponibles
  over: boolean;
}

const NEW_STREAK: StreakState = { count: 0, queue: [], index: 0, peeks: 1, over: false };

/** Reglas de cada modo (rating o racha) encima de la mecánica de un puzzle. */
export function useTraining(mode: Mode) {
  const game = useGame();
  const { settings } = useSettings();
  // Con una configuración más difícil el puzzle cuenta como más difícil: se gana más
  // al resolverlo y se pierde menos al fallarlo. Los puzzles se siguen eligiendo por el
  // rating del usuario, así la recompensa se nota en cada puzzle.
  const bonus = difficultyBonus(settings.memTime, settings.hideStyle);
  // El primer puzzle se elige al montar. TrainingScreen vuelve a montar la sesión
  // (con `key`) cuando cambian el modo, el conjunto de puzzles o el tema.
  const [initial] = useState(() => {
    if (mode === "rated") {
      return {
        puzzle: pickRatedPuzzle(game.pool, game.rating, game.recent, settings.theme),
        streak: NEW_STREAK,
      };
    }
    const queue = buildStreakQueue(game.pool, settings.theme);
    return { puzzle: queue[0] ?? null, streak: { ...NEW_STREAK, queue, index: 1 } };
  });
  const [streak, setStreak] = useState<StreakState>(initial.streak);

  const puzzle = usePuzzle({
    initialPuzzle: initial.puzzle,
    memTime: settings.memTime,
    endOnMistake: mode === "streak",
    onFail: () => {
      const current = puzzle.state.puzzle;
      if (mode === "rated") {
        if (current) game.recordRatedResult(current, 0, difficultyBonus(puzzle.state.memTime, settings.hideStyle));
      } else {
        setStreak((s) => ({ ...s, over: true }));
        game.recordStreak(streak.count);
      }
    },
    onSolve: (clean) => {
      const current = puzzle.state.puzzle;
      if (mode === "rated") {
        // Un puzzle cuenta una sola vez: si ya falló, resolverlo después no suma.
        if (clean && current) game.recordRatedResult(current, 1, difficultyBonus(puzzle.state.memTime, settings.hideStyle));
      } else {
        setStreak((s) => ({ ...s, count: s.count + 1 }));
        game.recordStreak(streak.count + 1);
      }
    },
  });

  const startStreak = (from: StreakState) => {
    if (from.index >= from.queue.length) {
      setStreak({ ...from, over: true });
      puzzle.clear({ kind: "streakComplete" });
      return;
    }
    setStreak({ ...from, index: from.index + 1 });
    puzzle.start(from.queue[from.index], settings.memTime);
  };

  const freshStreak = (): StreakState => ({ ...NEW_STREAK, queue: buildStreakQueue(game.pool, settings.theme) });

  const next = () => {
    if (!game.pool.length) return;
    if (mode === "rated") {
      const p = pickRatedPuzzle(game.pool, game.rating, game.recent, settings.theme);
      if (p) puzzle.start(p, settings.memTime);
      return;
    }
    startStreak(streak.over || !streak.queue.length ? freshStreak() : streak);
  };


  // En la racha, al resolver un puzzle pasa solo al siguiente.
  const { phase, failed } = puzzle.state;
  const puzzleId = puzzle.state.puzzle?.id;
  useEffect(() => {
    if (mode !== "streak" || phase !== "done" || failed || !puzzleId) return;
    const t = setTimeout(() => startStreak(streak), STREAK_NEXT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, failed, puzzleId]);

  const { state } = puzzle;
  const playing = state.phase !== "done" && state.phase !== "solution" && state.phase !== "idle";

  const canPeek =
    playing && state.hidden && !state.peeking && (mode === "rated" || (streak.peeks > 0 && !streak.over));

  const peek = () => {
    if (!canPeek) return;
    if (mode === "streak") {
      setStreak((s) => ({ ...s, peeks: s.peeks - 1 }));
      puzzle.peek(false);
    } else {
      puzzle.peek(true);
    }
  };

  const canShowSolution =
    !!state.puzzle &&
    state.ply >= 1 &&
    state.ply < state.puzzle.moves.length &&
    state.phase !== "solution" &&
    (state.phase !== "done" || state.failed);

  return {
    ...puzzle,
    streak,
    next,
    peek,
    canPeek,
    canShowSolution,
    bonus,
    finished: state.phase === "done",
  };
}
