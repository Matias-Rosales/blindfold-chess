import { Chess } from "chess.js";
import { useMemo, type ReactNode } from "react";
import { boardSquares, isDarkSquare } from "../../lib/chess";
import type { Color, HideStyle, PieceDisplay, Square as SquareName } from "../../types";
import { Square } from "./Square";

interface BoardProps {
  fen: string;
  orientation: Color;
  hidden: boolean;
  hideStyle: HideStyle;
  selected: SquareName | null;
  lastMove: [SquareName, SquareName] | null;
  wrongSquare: SquareName | null;
  destinations?: SquareName[];
  showSquareNames?: boolean;
  onSquareClick: (square: SquareName) => void;
  /** Superposiciones sobre el tablero (temporizador, aviso de resuelto). */
  children?: ReactNode;
}

/** Tablero propio: chess.js solo se usa para leer qué pieza hay en cada casilla. */
export function Board({
  fen,
  orientation,
  hidden,
  hideStyle,
  selected,
  lastMove,
  wrongSquare,
  destinations = [],
  showSquareNames = false,
  onSquareClick,
  children,
}: BoardProps) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const squares = useMemo(() => boardSquares(orientation), [orientation]);
  const display: PieceDisplay = !hidden ? "piece" : hideStyle === "checkers" ? "disc" : "none";

  return (
    <div className="relative w-full">
      <div
        role="group"
        aria-label="Tablero de ajedrez"
        className="grid aspect-square w-full touch-manipulation grid-cols-8 grid-rows-8 overflow-hidden rounded-sm shadow-lg select-none @container"
      >
        {squares.map((name, i) => (
          <Square
            key={name}
            name={name}
            dark={isDarkSquare(name)}
            piece={game.get(name)}
            display={display}
            isLastMove={!!lastMove && lastMove.includes(name)}
            isSelected={selected === name}
            isWrong={wrongSquare === name}
            isDestination={destinations.includes(name)}
            rankLabel={i % 8 === 7 ? name[1] : undefined}
            fileLabel={i >= 56 ? name[0] : undefined}
            showName={showSquareNames}
            onClick={onSquareClick}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
