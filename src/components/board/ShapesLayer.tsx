import { BRUSH_COLORS, squareCenter, type Shape } from "../../lib/annotations";
import type { Color } from "../../types";

const CIRCLE_WIDTH = 0.0625; // grosor del círculo, en casillas
const ARROW_WIDTH = 0.16; // grosor de la flecha
const HEAD_LENGTH = 0.42; // largo de la punta
const HEAD_WIDTH = 0.42; // ancho de la punta

function Arrow({ shape, orientation, opacity }: { shape: Shape; orientation: Color; opacity: number }) {
  const a = squareCenter(shape.from, orientation);
  const b = squareCenter(shape.to!, orientation);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // La línea termina donde empieza la punta, para que no asome por delante.
  const baseX = b.x - ux * HEAD_LENGTH;
  const baseY = b.y - uy * HEAD_LENGTH;
  const px = -uy * (HEAD_WIDTH / 2);
  const py = ux * (HEAD_WIDTH / 2);
  const color = BRUSH_COLORS[shape.brush];
  return (
    <g opacity={opacity}>
      <line x1={a.x} y1={a.y} x2={baseX} y2={baseY} stroke={color} strokeWidth={ARROW_WIDTH} strokeLinecap="round" />
      <polygon points={`${b.x},${b.y} ${baseX + px},${baseY + py} ${baseX - px},${baseY - py}`} fill={color} />
    </g>
  );
}

interface ShapesLayerProps {
  shapes: Shape[];
  /** Marca que se está dibujando (arrastrando con clic derecho). */
  preview?: Shape | null;
  orientation: Color;
}

/** Capa SVG sobre el tablero con los círculos y flechas. No recibe clics. */
export function ShapesLayer({ shapes, preview, orientation }: ShapesLayerProps) {
  const all = preview ? [...shapes, preview] : shapes;
  if (!all.length) return null;
  return (
    <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden="true">
      {all.map((shape, i) => {
        const opacity = shape === preview ? 0.6 : 0.8;
        if (!shape.to || shape.to === shape.from) {
          const c = squareCenter(shape.from, orientation);
          return (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={0.5 - CIRCLE_WIDTH / 2}
              fill="none"
              stroke={BRUSH_COLORS[shape.brush]}
              strokeWidth={CIRCLE_WIDTH}
              opacity={opacity}
            />
          );
        }
        return <Arrow key={i} shape={shape} orientation={orientation} opacity={opacity} />;
      })}
    </svg>
  );
}
