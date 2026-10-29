import { pieceUrl } from "../../lib/pieces";
import type { Color, PieceDisplay, PieceSymbol } from "../../types";

interface PieceProps {
  type: PieceSymbol;
  color: Color;
  display: PieceDisplay;
}

/**
 * La pieza y la ficha están siempre en el DOM y se alternan por clases,
 * así la transición entre una y otra se anima.
 */
export function Piece({ type, color, display }: PieceProps) {
  return (
    <>
      <img
        src={pieceUrl(color, type)}
        alt=""
        draggable={false}
        className={`pointer-events-none absolute inset-0 size-full transition-[opacity,filter] duration-450 ease-out motion-reduce:transition-none ${
          display === "piece" ? "opacity-100 blur-none" : "opacity-0 blur-sm"
        }`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[18%] rounded-full transition duration-350 ease-out motion-reduce:transition-none ${
          display === "disc" ? "scale-100 opacity-100" : "scale-60 opacity-0"
        } ${
          color === "w"
            ? "bg-[#f7f8fa] shadow-[inset_0_-3px_0_rgba(0,0,0,.18),0_0_0_2px_#1b2128]"
            : "bg-[#1c232b] shadow-[inset_0_-3px_0_rgba(255,255,255,.12),0_0_0_2px_#0c0f13]"
        }`}
      />
    </>
  );
}
