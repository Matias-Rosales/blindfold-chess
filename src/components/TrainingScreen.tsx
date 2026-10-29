import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { useTraining } from "../hooks/useTraining";
import { sideToMove } from "../lib/chess";
import type { Mode } from "../types";
import { ActionButtons } from "./ActionButtons";
import { Board } from "./board/Board";
import { SolvedOverlay } from "./board/SolvedOverlay";
import { TimerBar } from "./board/TimerBar";
import { MessageBox } from "./MessageBox";
import { MoveLog } from "./MoveLog";
import { PuzzleInfo } from "./PuzzleInfo";
import { ScoreCard } from "./ScoreCard";
import { SettingsSummary } from "./SettingsSummary";
import { Card, Panel } from "./ui/Card";

/** Espera a que estén los puzzles y reinicia la sesión si cambian el conjunto o el tema. */
export function TrainingScreen({ mode }: { mode: Mode }) {
  const { poolId, poolSource } = useGame();
  const { settings } = useSettings();
  if (poolSource === "loading") {
    return (
      <main className="mx-auto max-w-[1400px] px-3 py-10 text-center sm:px-5">
        <Card>Cargando puzzles…</Card>
      </main>
    );
  }
  return <TrainingSession key={`${mode}|${poolId}|${settings.theme}`} mode={mode} />;
}

/**
 * Pantalla de entrenamiento con la distribución de los puzzles de Lichess:
 * datos a la izquierda, tablero al centro y herramientas a la derecha.
 * En celular queda todo apilado: tablero, herramientas y datos.
 */
function TrainingSession({ mode }: { mode: Mode }) {
  const { settings } = useSettings();
  const t = useTraining(mode);
  const { state } = t;
  const turn = sideToMove(state.fen);

  return (
    <main className="mx-auto grid max-w-[1400px] gap-4 px-0 pb-10 [grid-template-areas:'board'_'tools'_'side'] sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] md:[grid-template-areas:'board_tools'_'board_side'] lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(300px,360px)] lg:[grid-template-areas:'side_board_tools']">
      <div className="min-w-0 [grid-area:board]">
        <div className="mx-auto w-full md:max-w-[calc(100vh-8rem)]">
          <Board
            fen={state.fen}
            orientation={state.player}
            hidden={state.hidden && !state.peeking}
            hideStyle={settings.hideStyle}
            selected={state.selected}
            lastMove={state.lastMove}
            wrongSquare={state.wrongSquare}
            destinations={t.destinations}
            showSquareNames={settings.showSquareNames}
            onSquareClick={t.clickSquare}
            shapesKey={state.puzzle?.id}
          >
            {state.memorizing && <TimerBar seconds={state.memTime} resetKey={state.puzzle?.id ?? ""} />}
            {t.finished && state.puzzle && <SolvedOverlay success={!state.failed} />}
          </Board>
          <div className="mt-2 flex items-center justify-between px-3 text-sm text-dim sm:px-0 dark:text-dim-dk">
            <span className="flex items-center gap-2">
              <i
                className={`inline-block size-3.5 rounded-full ring-1 ring-strong dark:ring-strong-dk ${
                  turn === "w" ? "bg-white" : "bg-[#1b2128]"
                }`}
              />
              {t.finished ? "Terminado" : turn === "w" ? "Juegan las blancas" : "Juegan las negras"}
            </span>
            {state.hidden && !state.peeking && <span>Piezas ocultas</span>}
          </div>
          <p className="mt-1 hidden px-3 text-xs text-dim sm:px-0 dark:text-dim-dk [@media(pointer:fine)]:block">
            Clic derecho marca una casilla; arrastrando dibujás una flecha. Con Shift, Alt o los dos cambia el color. Un
            clic izquierdo borra todo.
          </p>
        </div>
      </div>

      <Panel className="px-3 sm:px-0 [grid-area:tools]">
        <Card>
          <MessageBox
            feedback={state.feedback}
            mode={mode}
            player={state.player}
            hideStyle={settings.hideStyle}
            streakCount={t.streak.count}
          />
          <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 dark:border-line-dk">
            <MoveLog log={state.log} />
            <ActionButtons
              mode={mode}
              canPeek={t.canPeek}
              peeksLeft={t.streak.peeks}
              canShowSolution={t.canShowSolution}
              finished={t.finished}
              streakOver={t.streak.over}
              onPeek={t.peek}
              onShowSolution={t.showSolution}
              onNext={t.next}
            />
          </div>
        </Card>
      </Panel>

      <Panel className="px-3 sm:px-0 [grid-area:side]">
        <ScoreCard mode={mode} streakCount={t.streak.count} />
        <PuzzleInfo puzzle={state.puzzle} finished={t.finished} />
        <SettingsSummary />
      </Panel>
    </main>
  );
}
