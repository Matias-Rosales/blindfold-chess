import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { ImportPanel } from "./ImportPanel";
import { SettingsPanel } from "./SettingsPanel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-box-alt px-3 py-2 dark:bg-box-alt-dk">
      <p className="text-2xl font-bold text-strong tabular-nums dark:text-strong-dk">{value}</p>
      <p className="text-xs text-dim dark:text-dim-dk">{label}</p>
    </div>
  );
}

/** Usuario, estadísticas guardadas, reiniciarlas y cerrar sesión. */
function AccountCard() {
  const { user, logout } = useAuth();
  const { rating, games, solved, best, resetStats } = useGame();
  const [confirming, setConfirming] = useState(false);
  if (!user) return null;
  const since = new Date(user.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Card title="Cuenta">
      <p className="text-xl font-semibold text-strong dark:text-strong-dk">{user.name}</p>
      <p className="text-sm text-dim dark:text-dim-dk">Cuenta creada el {since}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Rating" value={Math.round(rating)} />
        <Stat label="Puzzles jugados" value={games} />
        <Stat label="Resueltos sin errores" value={games && solved !== null ? `${Math.round((solved / games) * 100)} %` : "–"} />
        <Stat label="Récord de racha" value={best} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <span className="text-sm">¿Seguro? Se pierden el rating, los puzzles jugados y el récord.</span>
            <Button
              className="bg-bad! text-white! border-bad!"
              onClick={() => {
                resetStats();
                setConfirming(false);
              }}
            >
              Sí, reiniciar
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setConfirming(true)}>Reiniciar estadísticas</Button>
            <Button variant="ghost" onClick={logout}>
              Cerrar sesión
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

/** Configuración: opciones de entrenamiento, cuenta y base de puzzles. */
export function SettingsScreen() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 pt-4 pb-12 sm:px-5">
      <h1 className="text-3xl font-semibold text-strong dark:text-strong-dk">Configuración</h1>
      <SettingsPanel />
      <AccountCard />
      <ImportPanel />
    </main>
  );
}
