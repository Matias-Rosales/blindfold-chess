import type { ReactNode } from "react";
import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { themeName } from "../data/themes";
import { countThemes } from "../lib/puzzles";
import type { HideStyle, MemTime, PieceDisplay } from "../types";
import { Piece } from "./board/Piece";
import { Card } from "./ui/Card";

const MEM_OPTIONS: { value: MemTime; label: string }[] = [
  { value: 3, label: "3 s" },
  { value: 5, label: "5 s" },
  { value: 10, label: "10 s" },
  { value: 0, label: "No ocultar" },
];

const STYLE_OPTIONS: { value: HideStyle; label: string; text: string; display: PieceDisplay }[] = [
  { value: "blind", label: "Desaparecen", text: "No se ve ninguna pieza.", display: "none" },
  {
    value: "checkers",
    label: "Se vuelven círculos",
    text: "Se ve dónde hay piezas y de qué color, pero no cuáles son.",
    display: "disc",
  },
];

const selectClass =
  "min-h-10 w-full rounded border border-line bg-box-alt px-2 text-strong dark:border-line-dk dark:bg-box-alt-dk dark:text-strong-dk";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold text-strong dark:text-strong-dk">{label}</span>
      {children}
      {hint && <span className="text-xs text-dim dark:text-dim-dk">{hint}</span>}
    </div>
  );
}

const optionClass = (active: boolean) =>
  `rounded border-2 transition ${
    active
      ? "border-primary bg-primary/5 dark:border-primary-dk dark:bg-primary-dk/10"
      : "border-line hover:border-dim dark:border-line-dk dark:hover:border-dim-dk"
  }`;

/** Muestra chica de cómo se ve el tablero con cada estilo de ocultamiento. */
function StylePreview({ display }: { display: PieceDisplay }) {
  const squares = [
    { dark: false, piece: { type: "n", color: "w" } },
    { dark: true, piece: null },
    { dark: true, piece: { type: "q", color: "b" } },
    { dark: false, piece: { type: "k", color: "w" } },
  ] as const;
  return (
    <div className="grid size-16 shrink-0 grid-cols-2 overflow-hidden rounded-sm" aria-hidden="true">
      {squares.map((sq, i) => (
        <div key={i} className={`relative ${sq.dark ? "bg-sq-dark" : "bg-sq-light"}`}>
          {sq.piece && <Piece type={sq.piece.type} color={sq.piece.color} display={display} />}
        </div>
      ))}
    </div>
  );
}

/** Opciones de entrenamiento: tiempo, estilo de ocultamiento, tema y nombres de casillas. */
export function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const { pool } = useGame();
  const themes = countThemes(pool);
  // Si el tema guardado no existe en este conjunto, se muestra "Todos".
  const theme = themes.some((t) => t.theme === settings.theme) ? settings.theme : "";

  return (
    <Card title="Entrenamiento">
      <div className="flex flex-col gap-6">
        <Field label="Tiempo para memorizar" hint="Cuánto se ven las piezas antes de ocultarse.">
          <div role="radiogroup" aria-label="Tiempo para memorizar" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEM_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={o.value === settings.memTime}
                onClick={() => updateSettings({ memTime: o.value })}
                className={`min-h-11 px-3 font-semibold ${optionClass(o.value === settings.memTime)}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cuando se termina el tiempo, las piezas…">
          <div role="radiogroup" aria-label="Estilo de ocultamiento" className="grid gap-2 sm:grid-cols-2">
            {STYLE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={o.value === settings.hideStyle}
                onClick={() => updateSettings({ hideStyle: o.value })}
                className={`flex items-center gap-3 p-3 text-left ${optionClass(o.value === settings.hideStyle)}`}
              >
                <StylePreview display={o.display} />
                <span>
                  <span className="block font-semibold text-strong dark:text-strong-dk">{o.label}</span>
                  <span className="block text-sm">{o.text}</span>
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tema de los puzzles">
          <select value={theme} onChange={(e) => updateSettings({ theme: e.target.value })} className={selectClass}>
            <option value="">Todos los temas</option>
            {themes.map(({ theme: t, count }) => (
              <option key={t} value={t}>
                {themeName(t)} ({count.toLocaleString("es-AR")})
              </option>
            ))}
          </select>
        </Field>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.showSquareNames}
            onChange={(e) => updateSettings({ showSquareNames: e.target.checked })}
            className="size-5 accent-primary dark:accent-primary-dk"
          />
          <span>
            <span className="block font-semibold text-strong dark:text-strong-dk">Mostrar el nombre de cada casilla</span>
            <span className="block text-sm">Ayuda a ubicar las casillas cuando las piezas están ocultas.</span>
          </span>
        </label>
      </div>
    </Card>
  );
}
