import { Chess } from "chess.js";
import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { brushFor, squareAt, toggleShape, type Shape } from "../../lib/annotations";
import { boardSquares, isDarkSquare } from "../../lib/chess";
import type { Color, HideStyle, PieceDisplay, Square as SquareName } from "../../types";
import { ShapesLayer } from "./ShapesLayer";
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
  /** Cuando cambia (por ejemplo, el id del puzzle) se borran las marcas dibujadas. */
  shapesKey?: string;
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
  shapesKey = "",
  children,
}: BoardProps) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const squares = useMemo(() => boardSquares(orientation), [orientation]);
  const display: PieceDisplay = !hidden ? "piece" : hideStyle === "checkers" ? "disc" : "none";

  // Marcas (círculos y flechas). Se guardan junto con la clave del puzzle en que se
  // dibujaron, así al cambiar de puzzle desaparecen sin necesidad de un efecto.
  const [drawn, setDrawn] = useState<{ key: string; shapes: Shape[] }>({ key: shapesKey, shapes: [] });
  const shapes = drawn.key === shapesKey ? drawn.shapes : [];
  const [drawing, setDrawing] = useState<Shape | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const squareFromEvent = (e: PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    return squareAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, orientation);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      // Como en Lichess, un clic izquierdo borra las marcas (y sigue funcionando como jugada).
      if (shapes.length) setDrawn({ key: shapesKey, shapes: [] });
      return;
    }
    if (e.button !== 2) return;
    const from = squareFromEvent(e);
    if (!from) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing({ from, to: from, brush: brushFor(e) });
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const to = squareFromEvent(e);
    if (to && to !== drawing.to) setDrawing({ ...drawing, to });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drawing || e.button !== 2) return;
    const to = squareFromEvent(e);
    // Si se suelta afuera del tablero no se dibuja nada.
    if (to) setDrawn({ key: shapesKey, shapes: toggleShape(shapes, { ...drawing, to }) });
    setDrawing(null);
  };

  return (
    <div
      className="relative w-full"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrawing(null)}
    >
      <div
        ref={gridRef}
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
      <ShapesLayer shapes={shapes} preview={drawing} orientation={orientation} />
      {children}
    </div>
  );
}
