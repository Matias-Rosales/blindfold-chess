import { useState, type FormEvent } from "react";
import { Button } from "./ui/Button";

interface MoveInputProps {
  disabled: boolean;
  /** Devuelve true si hay que limpiar el campo. */
  onSubmit: (text: string) => boolean;
}

/** Campo para escribir la jugada en castellano, inglés o UCI. */
export function MoveInput({ disabled, onSubmit }: MoveInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSubmit(text)) setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" autoComplete="off">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí la jugada: Cf7, Txe8, g5f7"
        aria-label="Escribir jugada"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-10 min-w-0 flex-1 rounded border border-line bg-box-alt px-3 text-strong placeholder:text-dim dark:border-line-dk dark:bg-box-alt-dk dark:text-strong-dk dark:placeholder:text-dim-dk"
      />
      <Button type="submit" disabled={disabled}>
        Jugar
      </Button>
    </form>
  );
}
