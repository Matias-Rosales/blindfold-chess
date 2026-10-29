import type { Piece as ChessPiece } from "chess.js";
import type { PieceDisplay, Square as SquareName } from "../../types";
import { Piece } from "./Piece";

interface SquareProps {
  name: SquareName;
  dark: boolean;
  piece?: ChessPiece;
  display: PieceDisplay;
  isLastMove: boolean;
  isSelected: boolean;
  isWrong: boolean;
  isDestination: boolean;
  /** Coordenadas del borde: el número en la última columna y la letra en la última fila. */
  rankLabel?: string;
  fileLabel?: string;
  showName: boolean;
  onClick: (square: SquareName) => void;
}

export function Square({
  name,
  dark,
  piece,
  display,
  isLastMove,
  isSelected,
  isWrong,
  isDestination,
  rankLabel,
  fileLabel,
  showName,
  onClick,
}: SquareProps) {
  // Como en Lichess, las coordenadas usan el color de la casilla opuesta.
  const coordColor = dark ? "text-sq-light" : "text-sq-dark";
  return (
    <button
      type="button"
      aria-label={name}
      onClick={() => onClick(name)}
      className={`relative block min-h-0 min-w-0 cursor-pointer select-none focus-visible:z-10 focus-visible:-outline-offset-3 ${
        dark ? "bg-sq-dark" : "bg-sq-light"
      }`}
    >
      {isLastMove && <span className="absolute inset-0 bg-[rgba(155,199,0,0.41)]" />}
      {isSelected && <span className="absolute inset-0 bg-[rgba(20,85,30,0.5)]" />}
      {isWrong && <span className="absolute inset-0 bg-[rgba(204,51,51,0.6)]" />}

      {showName && (
        <span className={`absolute inset-0 grid place-items-center text-[clamp(8px,2.2cqw,14px)] font-medium opacity-60 ${coordColor}`}>
          {name}
        </span>
      )}

      {piece && <Piece type={piece.type} color={piece.color} display={display} />}

      {isDestination &&
        (piece ? (
          <span className="absolute inset-0 z-[1] bg-[radial-gradient(transparent_0%,transparent_79%,rgba(20,85,30,0.3)_80%)]" />
        ) : (
          <span className="absolute inset-0 z-[1] bg-[radial-gradient(rgba(20,85,30,0.5)_19%,transparent_20%)]" />
        ))}

      {rankLabel && (
        <span className={`absolute top-[3%] right-[5%] text-[clamp(8px,2.2cqw,14px)] leading-none font-bold ${coordColor}`}>
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span className={`absolute bottom-[3%] left-[5%] text-[clamp(8px,2.2cqw,14px)] leading-none font-bold ${coordColor}`}>
          {fileLabel}
        </span>
      )}
    </button>
  );
}
