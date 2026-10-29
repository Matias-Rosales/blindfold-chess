import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}

/** Caja al estilo Lichess: fondo liso, bordes apenas redondeados y sombra suave. */
export function Card({ children, title, className = "" }: CardProps) {
  return (
    <section className={`rounded bg-box shadow-md dark:bg-box-dk dark:shadow-black/40 ${className}`}>
      {title && (
        <h2 className="border-b border-line px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-dim dark:border-line-dk dark:text-dim-dk">
          {title}
        </h2>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Columna de cajas con separación uniforme. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex min-w-0 flex-col gap-4 ${className}`}>{children}</div>;
}
