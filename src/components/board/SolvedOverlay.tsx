import { CheckIcon, CrossIcon } from "../ui/Icons";

/** Aviso grande en el centro del tablero al terminar un puzzle: aparece y se desvanece. */
export function SolvedOverlay({ success }: { success: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <div
        className={`grid size-[22%] animate-pop-fade place-items-center rounded-full text-white opacity-0 shadow-xl motion-reduce:hidden ${
          success ? "bg-good/90" : "bg-bad/90"
        }`}
      >
        {success ? <CheckIcon className="size-3/5" /> : <CrossIcon className="size-1/2" />}
      </div>
    </div>
  );
}
