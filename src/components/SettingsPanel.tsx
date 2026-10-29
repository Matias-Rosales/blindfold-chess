import type { ReactNode } from "react";
import { useGame } from "../context/GameContext";
import { useSettings } from "../context/SettingsContext";
import { themeName } from "../data/themes";
import { countThemes } from "../lib/puzzles";
import type { HideStyle, MemTime } from "../types";
import { Card } from "./ui/Card";

const MEM_OPTIONS: { value: MemTime; label: string }[] = [
  { value: 3, label: "3 s" },
  { value: 5, label: "5 s" },
  { value: 10, label: "10 s" },
  { value: 0, label: "No ocultar" },
];

const STYLE_OPTIONS: { value: HideStyle; label: string }[] = [
  { value: "blind", label: "Desaparecen" },
  { value: "checkers", label: "Se vuelven fichas" },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded border px-3 text-sm font-medium transition ${
            o.value === value
              ? "border-primary bg-primary text-white dark:border-primary-dk dark:bg-primary-dk"
              : "border-line hover:bg-box-alt dark:border-line-dk dark:hover:bg-box-alt-dk"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-dim dark:text-dim-dk">{label}</span>
      {children}
      {hint && <span className="text-xs text-dim dark:text-dim-dk">{hint}</span>}
    </div>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const { pool } = useGame();
  const themes = countThemes(pool);
  // Si el tema guardado no existe en este conjunto, se muestra "Todos".
  const theme = themes.some((t) => t.theme === settings.theme) ? settings.theme : "";

  return (
    <Card title="Opciones">
      <div className="flex flex-col gap-4">
        <Field label="Tiempo para memorizar" hint="Se aplica desde el próximo puzzle.">
          <Segmented
            label="Tiempo para memorizar"
            options={MEM_OPTIONS}
            value={settings.memTime}
            onChange={(memTime) => updateSettings({ memTime })}
          />
        </Field>
        <Field label="Después del tiempo, las piezas…">
          <Segmented
            label="Estilo de ocultamiento"
            options={STYLE_OPTIONS}
            value={settings.hideStyle}
            onChange={(hideStyle) => updateSettings({ hideStyle })}
          />
        </Field>
        <Field label="Tema">
          <select
            value={theme}
            onChange={(e) => updateSettings({ theme: e.target.value })}
            className="min-h-10 rounded border border-line bg-box-alt px-2 text-strong dark:border-line-dk dark:bg-box-alt-dk dark:text-strong-dk"
          >
            <option value="">Todos los temas</option>
            {themes.map(({ theme: t, count }) => (
              <option key={t} value={t}>
                {themeName(t)} ({count.toLocaleString("es-AR")})
              </option>
            ))}
          </select>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.showSquareNames}
            onChange={(e) => updateSettings({ showSquareNames: e.target.checked })}
            className="size-4 accent-primary dark:accent-primary-dk"
          />
          Mostrar el nombre de cada casilla
        </label>
      </div>
    </Card>
  );
}
