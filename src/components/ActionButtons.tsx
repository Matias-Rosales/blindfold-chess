import type { Mode } from "../types";
import { Button } from "./ui/Button";
import { ArrowIcon, EyeIcon } from "./ui/Icons";

interface ActionButtonsProps {
  mode: Mode;
  canPeek: boolean;
  peeksLeft: number;
  canShowSolution: boolean;
  finished: boolean;
  streakOver: boolean;
  onPeek: () => void;
  onShowSolution: () => void;
  onNext: () => void;
}

export function ActionButtons({
  mode,
  canPeek,
  peeksLeft,
  canShowSolution,
  finished,
  streakOver,
  onPeek,
  onShowSolution,
  onNext,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Al terminar, el botón principal pasa arriba y ocupa todo el ancho, como en Lichess. */}
      {mode === "rated" && finished && (
        <Button variant="primary" onClick={onNext} className="w-full py-3">
          Seguir entrenando <ArrowIcon className="size-4" />
        </Button>
      )}
      {mode === "streak" && streakOver && (
        <Button variant="primary" onClick={onNext} className="w-full py-3">
          Nueva racha <ArrowIcon className="size-4" />
        </Button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onPeek} disabled={!canPeek} className="flex-1">
          <EyeIcon className="size-4" />
          {mode === "streak" ? `Espiar 2 s (${peeksLeft})` : "Espiar 2 s"}
        </Button>
        <Button onClick={onShowSolution} disabled={!canShowSolution} className="flex-1">
          Ver solución
        </Button>
        {mode === "rated" && !finished && (
          <Button variant="ghost" onClick={onNext} className="flex-1">
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
