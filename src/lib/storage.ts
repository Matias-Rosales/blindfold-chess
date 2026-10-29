// Todas las lecturas y escrituras van en try/catch: el storage puede estar
// lleno, deshabilitado o no existir (navegación privada).

/** Estado anterior a las cuentas (sin usuario). Se pasa a la primera cuenta que se crea. */
export const LS_LEGACY_STATE = "aciegas.state.v1";
export const LS_POOL = "aciegas.pool.v1";
export const LS_USERS = "aciegas.users.v1";
export const LS_SESSION = "aciegas.session.v1";

/** Estadísticas y opciones de un usuario. */
export const userStateKey = (user: string) => `aciegas.user.${user}.v1`;

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

/** Mezcla `patch` con lo guardado en `key`. Cada contexto guarda su parte. */
export function patchJson(key: string, patch: object): void {
  const current = readJson<Record<string, unknown>>(key) ?? {};
  writeJson(key, { ...current, ...patch });
}
