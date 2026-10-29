import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { routeHref, type Route } from "../hooks/useHashRoute";
import { pieceUrl } from "../lib/pieces";
import { GearIcon, UserIcon } from "./ui/Icons";

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
          className={`flex min-h-12 items-center px-2.5 text-sm font-semibold uppercase tracking-wide transition sm:px-4 ${
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

/** Nombre del usuario con un menú para ir a Configuración o cerrar sesión. */
function UserMenu({ current }: { current: Route }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el menú al tocar afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const itemClass =
    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-primary hover:text-white dark:hover:bg-primary-dk";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-12 items-center gap-1.5 px-2.5 text-sm font-semibold transition sm:px-4 ${
          open || current === "settings"
            ? "text-strong dark:text-strong-dk"
            : "text-dim hover:text-strong dark:text-dim-dk dark:hover:text-strong-dk"
        }`}
      >
        <UserIcon className="size-5" />
        <span className="max-w-28 truncate">{user.name}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded bg-box py-1 shadow-xl dark:bg-box-dk dark:shadow-black/60"
        >
          <a role="menuitem" href={routeHref("settings")} onClick={() => setOpen(false)} className={itemClass}>
            <GearIcon className="size-4" /> Configuración
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={itemClass}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({ route }: { route: Route }) {
  const { user } = useAuth();
  return (
    <header className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-5">
      <a href={routeHref("home")} className="flex shrink-0 items-center gap-1.5 text-strong dark:text-strong-dk">
        <img src={pieceUrl("w", "n")} alt="" className="size-9" />
        <span className="hidden text-2xl font-semibold tracking-tight min-[400px]:inline">a ciegas</span>
      </a>
      {user && (
        <div className="flex items-center">
          <ModeTabs current={route} />
          <UserMenu current={route} />
        </div>
      )}
    </header>
  );
}
