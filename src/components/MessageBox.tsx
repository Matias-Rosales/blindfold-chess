import type { ReactNode } from "react";
import type { Color, Feedback, HideStyle, Mode } from "../types";
import { pieceUrl } from "../lib/pieces";
import { CheckIcon, CrossIcon, EyeIcon } from "./ui/Icons";

interface MessageBoxProps {
  feedback: Feedback;
  mode: Mode;
  player: Color;
  hideStyle: HideStyle;
  streakCount: number;
}

type Tone = "neutral" | "good" | "bad";

interface Message {
  tone: Tone;
  icon: "turn" | "good" | "bad" | "peek" | "none";
  title: string;
  text?: string;
}

const colorName = (c: Color) => (c === "w" ? "blancas" : "negras");

function describe({ feedback, mode, player, hideStyle, streakCount }: MessageBoxProps): Message {
  const streak = mode === "streak";
  switch (feedback.kind) {
    case "loading":
      return { tone: "neutral", icon: "none", title: "Cargando puzzles…" };
    case "intro":
      return { tone: "neutral", icon: "turn", title: "Mirá la posición", text: "Ahora juega el rival." };
    case "yourTurn":
      return {
        tone: "neutral",
        icon: "turn",
        title: "Tu turno",
        text:
          `Encontrá la mejor jugada para las ${colorName(player)}.` +
          (feedback.memTime ? ` Memorizá la posición: tenés ${feedback.memTime} s.` : ""),
      };
    case "hidden":
      return {
        tone: "neutral",
        icon: "turn",
        title: "Tu turno",
        text:
          hideStyle === "checkers"
            ? "Ahora solo ves fichas. Encontrá la mejor jugada."
            : "Las piezas desaparecieron. Encontrá la mejor jugada.",
      };
    case "good":
      return { tone: "good", icon: "good", title: "¡Bien!", text: "Sigue el rival…" };
    case "opponentMoved":
      return {
        tone: "neutral",
        icon: "turn",
        title: "Tu turno",
        text: `Las ${colorName(player === "w" ? "b" : "w")} jugaron ${feedback.san}. Seguí.`,
      };
    case "illegalVisible":
      return { tone: "neutral", icon: "turn", title: "Tu turno", text: "Esa jugada no es legal." };
    case "wrong": {
      const reason =
        feedback.reason === "illegal" ? "Esa jugada es ilegal en la posición real." : `${feedback.san} no es la jugada.`;
      if (streak) {
        const correct = feedback.correct ? ` La jugada era ${feedback.correct}.` : "";
        return { tone: "bad", icon: "bad", title: "Racha terminada", text: `${reason}${correct} Racha: ${streakCount}.` };
      }
      return {
        tone: "bad",
        icon: "bad",
        title: "¡Esa no es la jugada!",
        text: `${reason} Podés seguir intentando o ver la solución.`,
      };
    }
    case "peekPenalty":
      return { tone: "bad", icon: "peek", title: "Espiaste", text: "Espiar cuenta como error en este puzzle." };
    case "solved":
      if (streak) return { tone: "good", icon: "good", title: "¡Resuelto!", text: `Racha: ${streakCount}. Sigue el próximo…` };
      return feedback.clean
        ? { tone: "good", icon: "good", title: "¡Resuelto!", text: "Bien hecho. Seguí entrenando." }
        : { tone: "good", icon: "good", title: "Resuelto", text: "Pero ya había contado como error." };
    case "solution": {
      const tail = streak ? ` Racha terminada: ${streakCount}.` : "";
      return feedback.sans
        ? { tone: "neutral", icon: "none", title: "Solución", text: `${feedback.sans.join(" ")}.${tail}` }
        : { tone: "neutral", icon: "none", title: "Solución…" };
    }
    case "streakComplete":
      return {
        tone: "good",
        icon: "good",
        title: "¡Completaste todos los puzzles!",
        text: `No quedan más puzzles disponibles. Racha final: ${streakCount}.`,
      };
  }
}

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-strong dark:text-strong-dk",
  good: "text-good",
  bad: "text-bad",
};

/** Caja de mensajes con un ícono grande a la izquierda, como el feedback de puzzles de Lichess. */
export function MessageBox(props: MessageBoxProps) {
  const message = describe(props);
  let icon: ReactNode = null;
  if (message.icon === "turn") icon = <img src={pieceUrl(props.player, "k")} alt="" className="size-12" />;
  else if (message.icon === "good") icon = <CheckIcon className="size-10 text-good" />;
  else if (message.icon === "bad") icon = <CrossIcon className="size-10 text-bad" />;
  else if (message.icon === "peek") icon = <EyeIcon className="size-10 text-bad" />;

  return (
    <div className="flex min-h-24 items-center gap-4" aria-live="polite">
      {icon && <div className="grid size-14 shrink-0 place-items-center">{icon}</div>}
      <div className="min-w-0">
        <p className={`text-xl font-semibold ${TONE_TEXT[message.tone]}`}>{message.title}</p>
        {message.text && <p className="mt-0.5 text-sm">{message.text}</p>}
      </div>
    </div>
  );
}
