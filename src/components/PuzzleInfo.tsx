import { themeName } from "../data/themes";
import type { Puzzle } from "../types";
import { Card } from "./ui/Card";

/** Datos del puzzle. Los temas se muestran recién al terminar porque adelantan la solución. */
export function PuzzleInfo({ puzzle, finished }: { puzzle: Puzzle | null; finished: boolean }) {
  if (!puzzle) return null;
  const fromLichess = !puzzle.id.startsWith("ej");
  return (
    <Card>
      <p className="font-semibold text-strong dark:text-strong-dk">
        Puzzle{" "}
        {fromLichess ? (
          <a
            href={`https://lichess.org/training/${puzzle.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline dark:text-primary-dk"
          >
            #{puzzle.id}
          </a>
        ) : (
          <span>#{puzzle.id}</span>
        )}
      </p>
      <p className="text-sm">
        Rating: <b className="font-semibold">{finished ? puzzle.rating : "?"}</b>
      </p>
      {finished ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {puzzle.themes.map((t) => (
            <li key={t} className="rounded-sm bg-box-alt px-2 py-0.5 text-xs dark:bg-box-alt-dk">
              {themeName(t)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-dim dark:text-dim-dk">Los temas se muestran al terminar.</p>
      )}
    </Card>
  );
}
