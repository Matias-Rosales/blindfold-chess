// Todas las lecturas y escrituras van en try/catch: el storage puede estar
// lleno, deshabilitado o no existir (navegación privada).

export const LS_STATE = "aciegas.state.v1";
export const LS_POOL = "aciegas.pool.v1";

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // nada que hacer
  }
}

/** Mezcla `patch` con lo guardado en `aciegas.state.v1`. Cada contexto guarda su parte. */
export function patchState(patch: object): void {
  const current = readJson<Record<string, unknown>>(LS_STATE) ?? {};
  writeJson(LS_STATE, { ...current, ...patch });
}
