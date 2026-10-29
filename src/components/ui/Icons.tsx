// Íconos simples en SVG, dibujados con trazos para que tomen el color del texto.

interface IconProps {
  className?: string;
}

export function CheckIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export function CrossIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function EyeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function FlameIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c.6 3.2-1 5.2-2.6 7C7.8 10.8 6 12.7 6 15.5 6 19 8.7 22 12 22s6-2.8 6-6.4c0-2.5-1.2-4.3-2.4-5.6-.2 1.6-.9 2.8-2 3.4.4-3.9-.6-8.6-1.6-11.4zm0 18a3 3 0 01-3-3c0-1.6 1.1-2.6 2-3.6.3 1.2 1 2 2 2.4.2-.6.4-1.2.4-1.9.9.8 1.6 1.9 1.6 3.1a3 3 0 01-3 3z" />
    </svg>
  );
}

export function ArrowIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
