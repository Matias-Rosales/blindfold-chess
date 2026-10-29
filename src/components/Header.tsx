import { routeHref, type Route } from "../hooks/useHashRoute";
import { pieceUrl } from "../lib/pieces";

const MODES: { route: Route; label: string }[] = [
  { route: "rated", label: "Puzzles" },
  { route: "streak", label: "Racha" },
];

/** Pestañas de modo en la barra superior, como el menú de Lichess. */
export function ModeTabs({ current }: { current: Route }) {
  return (
    <nav aria-label="Modo" className="flex">
      {MODES.map((m) => (
        <a
          key={m.route}
          href={routeHref(m.route)}
          aria-current={current === m.route ? "page" : undefined}
          className={`flex min-h-12 items-center px-3 text-sm font-semibold uppercase tracking-wide transition sm:px-4 ${
            current === m.route
              ? "text-strong dark:text-strong-dk"
              : "text-dim hover:text-strong dark:text-dim-dk dark:hover:text-strong-dk"
          }`}
        >
          {m.label}
        </a>
      ))}
    </nav>
  );
}

export function Header({ route }: { route: Route }) {
  return (
    <header className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-5">
      <a href={routeHref("home")} className="flex items-center gap-1.5 text-strong dark:text-strong-dk">
        <img src={pieceUrl("w", "n")} alt="" className="size-9" />
        <span className="text-2xl font-semibold tracking-tight">a ciegas</span>
      </a>
      <ModeTabs current={route} />
    </header>
  );
}
