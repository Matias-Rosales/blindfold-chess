import { createContext, useContext, useState, type ReactNode } from "react";
import {
  checkPassword,
  createUserRecord,
  userKey,
  validatePassword,
  validateUsername,
  type UserRegistry,
} from "../lib/auth";
import { LS_LEGACY_STATE, LS_SESSION, LS_USERS, readJson, removeKey, userStateKey, writeJson } from "../lib/storage";

export interface User {
  key: string; // nombre en minúsculas, identifica al usuario
  name: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  /** Devuelven un mensaje de error, o null si salió bien. */
  login: (name: string, password: string) => Promise<string | null>;
  register: (name: string, password: string, repeat: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readUsers = () => readJson<UserRegistry>(LS_USERS) ?? {};

function loadSession(): User | null {
  const key = readJson<string>(LS_SESSION);
  const record = key ? readUsers()[key] : undefined;
  return key && record ? { key, name: record.name, createdAt: record.createdAt } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);

  const startSession = (key: string, name: string, createdAt: string) => {
    writeJson(LS_SESSION, key);
    setUser({ key, name, createdAt });
  };

  const login = async (name: string, password: string) => {
    const key = userKey(name);
    const record = readUsers()[key];
    if (!record || !(await checkPassword(record, password))) return "Usuario o contraseña incorrectos.";
    startSession(key, record.name, record.createdAt);
    return null;
  };

  const register = async (name: string, password: string, repeat: string) => {
    const error = validateUsername(name) ?? validatePassword(password, repeat);
    if (error) return error;
    const users = readUsers();
    const key = userKey(name);
    if (users[key]) return "Ese usuario ya existe.";
    const record = await createUserRecord(name, password);
    const isFirst = Object.keys(users).length === 0;
    if (!writeJson(LS_USERS, { ...users, [key]: record })) {
      return "No se pudo guardar la cuenta: el navegador no permite guardar datos.";
    }
    // Lo que se jugó antes de que existieran las cuentas pasa a la primera cuenta.
    const legacy = readJson<object>(LS_LEGACY_STATE);
    if (isFirst && legacy) {
      writeJson(userStateKey(key), legacy);
      removeKey(LS_LEGACY_STATE);
    }
    startSession(key, record.name, record.createdAt);
    return null;
  };

  const logout = () => {
    removeKey(LS_SESSION);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  return ctx;
}
