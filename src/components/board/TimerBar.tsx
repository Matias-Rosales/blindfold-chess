interface TimerBarProps {
  seconds: number;
  /** Cambia en cada puzzle para que la animación arranque de nuevo. */
  resetKey: string;
}

/** Barra fina sobre el borde superior del tablero que se vacía mientras corre el tiempo. */
export function TimerBar({ seconds, resetKey }: TimerBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1.5 bg-black/20" aria-hidden="true">
      <div
        key={resetKey}
        className="h-full origin-left animate-countdown bg-primary motion-reduce:animate-none dark:bg-primary-dk"
        style={{ animationDuration: `${seconds}s` }}
      />
    </div>
  );
}
