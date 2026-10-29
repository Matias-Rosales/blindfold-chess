import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { difficultyBonus, formatBonus } from "../lib/rating";
import type { Mode } from "../types";
import { Card } from "./ui/Card";
import { FlameIcon } from "./ui/Icons";

/** Rating de visualización en el modo con rating, o la racha actual en el modo racha. */
export function ScoreCard({ mode, streakCount }: { mode: Mode; streakCount: number }) {
  const { rating, games, best, lastDelta } = useGame();
  const { settings } = useSettings();
  const bonus = difficultyBonus(settings.memTime, settings.hideStyle);

  if (mode === "streak") {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <FlameIcon className="size-12 text-brag" />
          <div>
            <p className="text-5xl leading-none font-bold text-strong tabular-nums dark:text-strong-dk">{streakCount}</p>
            <p className="mt-1 text-sm text-dim dark:text-dim-dk">Racha actual · récord {best}</p>
          </div>
        </div>
        <p className="mt-3 text-sm">
          Resolvé puzzles cada vez más difíciles. Un error y se termina la racha. Tenés una espiada por racha.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm text-dim dark:text-dim-dk">Tu rating de visualización</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-5xl leading-none font-bold text-strong tabular-nums dark:text-strong-dk">
          {Math.round(rating)}
        </span>
        {lastDelta !== null && lastDelta !== 0 && (
          <span className={`text-lg font-semibold ${lastDelta > 0 ? "text-good" : "text-bad"}`}>
            {lastDelta > 0 ? `+${lastDelta}` : `−${Math.abs(lastDelta)}`}
          </span>
        )}
      </p>
      <p className="mt-1 text-sm text-dim dark:text-dim-dk">
        {games} {games === 1 ? "puzzle jugado" : "puzzles jugados"}
      </p>
      <p className="mt-3 border-t border-line pt-3 text-sm dark:border-line-dk">
        Dificultad de tu configuración:{" "}
        <b className={`font-semibold ${bonus > 0 ? "text-good" : bonus < 0 ? "text-bad" : ""}`}>{formatBonus(bonus)}</b>
        <span className="block text-xs text-dim dark:text-dim-dk">
          Cada puzzle cuenta como si tuviera ese rating de más: con más dificultad ganás más y perdés menos.
        </span>
      </p>
    </Card>
  );
}
