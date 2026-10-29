// Cuentas locales: los usuarios y sus estadísticas se guardan en este navegador.
// La contraseña solo separa perfiles; no es seguridad real, porque todo está en el cliente.
// Igual no se guarda en texto plano: se guarda un hash PBKDF2 con una sal por usuario.

export interface UserRecord {
  name: string; // como lo escribió al registrarse
  salt: string; // hex
  hash: string; // hex
  createdAt: string; // ISO
}

/** Usuarios registrados, por nombre en minúsculas. */
export type UserRegistry = Record<string, UserRecord>;

const ITERATIONS = 100_000;
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
export const MIN_PASSWORD = 4;

export const userKey = (name: string) => name.trim().toLowerCase();

export function validateUsername(name: string): string | null {
  if (!USERNAME_RE.test(name.trim())) {
    return "El usuario tiene que tener entre 3 y 20 caracteres: letras, números, guion o guion bajo.";
  }
  return null;
}

export function validatePassword(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD) return `La contraseña tiene que tener al menos ${MIN_PASSWORD} caracteres.`;
  if (password !== repeat) return "Las contraseñas no coinciden.";
  return null;
}

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);

export function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(salt), iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export async function createUserRecord(name: string, password: string): Promise<UserRecord> {
  const salt = randomSalt();
  return { name: name.trim(), salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
}

export async function checkPassword(record: UserRecord, password: string): Promise<boolean> {
  return (await hashPassword(password, record.salt)) === record.hash;
}
