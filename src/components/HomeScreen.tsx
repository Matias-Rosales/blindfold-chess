import type { ReactNode } from "react";
import { useGame } from "../context/GameContext";
import { routeHref } from "../hooks/useHashRoute";
import { pieceUrl } from "../lib/pieces";
import { ImportPanel } from "./ImportPanel";
import { Card } from "./ui/Card";
import { ArrowIcon, FlameIcon } from "./ui/Icons";

interface ModeCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  stat: string;
}

function ModeCard({ href, icon, title, description, stat }: ModeCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded bg-box p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-box-dk dark:shadow-black/40"
    >
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-semibold text-strong dark:text-strong-dk">{title}</h2>
      </div>
      <p className="mt-3 flex-1 text-sm">{description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 dark:border-line-dk">
        <span className="text-sm text-dim dark:text-dim-dk">{stat}</span>
        <span className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-primary dark:text-primary-dk">
          Jugar <ArrowIcon className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}

const STEPS = [
  { title: "Mirá", text: "La posición se muestra unos segundos y el rival hace su jugada." },
  { title: "Memorizá", text: "Elegís cuánto tiempo: 3, 5 o 10 segundos. Después las piezas se ocultan." },
  { title: "Resolvé", text: "Tocá la pieza y después la casilla de destino. Si las piezas están ocultas, tocá la casilla donde estaba." },
];

/** Pantalla de inicio: las dos formas de entrenar. */
export function HomeScreen() {
  const { rating, games, best } = useGame();
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-3 pt-4 pb-12 sm:px-5">
      <div>
        <h1 className="text-3xl font-semibold text-strong sm:text-4xl dark:text-strong-dk">Entrená la visualización</h1>
        <p className="mt-2 max-w-2xl">
          Puzzles de ajedrez a ciegas: mirá la posición, memorizala y resolvé cuando las piezas desaparezcan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ModeCard
          href={routeHref("rated")}
          icon={<img src={pieceUrl("w", "n")} alt="" className="size-12" />}
          title="Puzzles"
          description="Puzzles elegidos según tu nivel. Cada uno suma o resta puntos a tu rating de visualización."
          stat={`Tu rating: ${Math.round(rating)} · ${games} ${games === 1 ? "puzzle" : "puzzles"}`}
        />
        <ModeCard
          href={routeHref("streak")}
          icon={<FlameIcon className="size-12 text-brag" />}
          title="Racha"
          description="Puzzles cada vez más difíciles, uno detrás de otro. Un error y se termina. Tenés una espiada por racha."
          stat={`Récord: ${best}`}
        />
      </div>

      <Card title="Cómo funciona">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-semibold text-white dark:bg-primary-dk">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-strong dark:text-strong-dk">{s.title}</p>
                <p className="text-sm">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <ImportPanel />
    </main>
  );
}
