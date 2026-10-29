import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useAuth } from "../context/AuthContext";
import { pieceUrl } from "../lib/pieces";
import { Button } from "./ui/Button";

const inputClass =
  "min-h-11 w-full rounded border border-line bg-box-alt px-3 text-strong dark:border-line-dk dark:bg-box-alt-dk dark:text-strong-dk";

function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-dim dark:text-dim-dk">{label}</span>
      <input className={inputClass} required {...props} />
    </label>
  );
}

/** Iniciar sesión o crear una cuenta, en una caja centrada como el login de Lichess. */
export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = isRegister ? await register(name, password, repeat) : await login(name, password);
    setBusy(false);
    setError(result);
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError(null);
    setPassword("");
    setRepeat("");
  };

  return (
    <main className="mx-auto flex max-w-md flex-col px-3 pt-6 pb-12 sm:px-5 sm:pt-12">
      <div className="rounded bg-box p-6 shadow-md sm:p-8 dark:bg-box-dk dark:shadow-black/40">
        <div className="flex items-center gap-3">
          <img src={pieceUrl("w", "n")} alt="" className="size-12" />
          <h1 className="text-3xl font-semibold text-strong dark:text-strong-dk">
            {isRegister ? "Crear una cuenta" : "Iniciar sesión"}
          </h1>
        </div>
        <p className="mt-3 text-sm">
          {isRegister
            ? "Con tu cuenta se guardan tu rating, tus puzzles jugados, tu récord de racha y tus opciones."
            : "Entrá para seguir entrenando con tus estadísticas y tus opciones."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field
            label="Usuario"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          {isRegister && (
            <Field
              label="Repetí la contraseña"
              type="password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              autoComplete="new-password"
            />
          )}
          {error && (
            <p role="alert" className="rounded bg-bad/10 px-3 py-2 text-sm text-bad">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={busy || !name || !password} className="mt-1 py-3">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-6 border-t border-line pt-4 text-center text-sm dark:border-line-dk">
          {isRegister ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
          <button type="button" onClick={switchMode} className="font-semibold text-primary hover:underline dark:text-primary-dk">
            {isRegister ? "Iniciá sesión" : "Registrate"}
          </button>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-dim dark:text-dim-dk">
        Las cuentas se guardan solo en este navegador.
      </p>
    </main>
  );
}
